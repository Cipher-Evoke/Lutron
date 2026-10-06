"""
Authenticated WebSocket for heatmap live cache push (replaces frontend polling).
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database.session import SessionLocal
from app.dependencies.permissions import require_operator_permission_for_scope
from app.heatmap.live_hub import HeatmapLiveHub, HeatmapLiveSubscription, heatmap_live_hub
from app.models.user_model import User

logger = logging.getLogger(__name__)

router = APIRouter()


def _token_from_websocket(websocket: WebSocket, query_token: str) -> str:
    auth = websocket.headers.get("authorization") or websocket.headers.get("Authorization") or ""
    if auth.lower().startswith("bearer "):
        return auth.split(" ", 1)[1].strip()
    return (query_token or "").strip()


def _authenticate_ws_token_owned(token: str) -> Optional[User]:
    """Auth lookup with its own session, safe to run in a worker thread."""
    db = SessionLocal()
    try:
        user = _authenticate_ws_token(token, db)
        if user is None:
            return None
        _ = (user.id, user.role, user.email)
        db.expunge(user)
        return user
    finally:
        db.close()


def _authorize_subscription_owned(user: User, subscription: HeatmapLiveSubscription) -> bool:
    """Return True when the subscription is forbidden."""
    db = SessionLocal()
    try:
        _authorize_subscription(user, subscription, db)
        return False
    except HTTPException:
        return True
    finally:
        db.close()


def _authenticate_ws_token(token: str, db: Session) -> Optional[User]:
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        email = payload.get("sub")
        if not email:
            return None
        return (
            db.query(User)
            .filter(User.email == email, User.is_active == True)
            .first()
        )
    except Exception:
        return None


def _parse_subscription(message: dict) -> Optional[HeatmapLiveSubscription]:
    action = message.get("action")
    if action != "subscribe":
        return None
    floor_id = message.get("floor_id")
    area_id = message.get("area_id")
    display_mode = message.get("display_mode") or "Light"
    try:
        floor_val = int(floor_id) if floor_id is not None else None
    except (TypeError, ValueError):
        floor_val = None
    try:
        area_val = int(area_id) if area_id is not None else None
    except (TypeError, ValueError):
        area_val = None
    return HeatmapLiveSubscription(
        floor_id=floor_val,
        area_id=area_val,
        display_mode=str(display_mode),
    )


def _authorize_subscription(user: User, subscription: HeatmapLiveSubscription, db: Session) -> None:
    floor_ids = [subscription.floor_id] if subscription.floor_id is not None else None
    area_ids = [subscription.area_id] if subscription.area_id is not None else None
    if not floor_ids and not area_ids:
        return
    require_operator_permission_for_scope(
        required_level=1,
        floor_ids=floor_ids,
        area_ids=area_ids,
        db=db,
        current_user=user,
    )


@router.websocket("/ws/heatmap/live")
async def heatmap_live_websocket(
    websocket: WebSocket,
    token: str = Query(default=""),
):
    # Prefer Authorization; query token remains for the SPA WebSocket client.
    token = _token_from_websocket(websocket, token)
    await websocket.accept()

    user = await asyncio.to_thread(_authenticate_ws_token_owned, token)
    if not user:
        await websocket.close(code=4401, reason="Unauthorized")
        return

    hub: HeatmapLiveHub = heatmap_live_hub
    await hub.register(websocket, HeatmapLiveSubscription())

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if message.get("action") == "auth" and message.get("token"):
                user = await asyncio.to_thread(
                    _authenticate_ws_token_owned, str(message.get("token"))
                )
                if not user:
                    await websocket.close(code=4401, reason="Unauthorized")
                    return
                continue
            subscription = _parse_subscription(message)
            if subscription:
                forbidden = await asyncio.to_thread(
                    _authorize_subscription_owned, user, subscription
                )
                if forbidden:
                    await hub.send_json(
                        websocket,
                        {"type": "subscribed", "ok": False, "error": "forbidden"},
                    )
                    continue
                await hub.update_subscription(websocket, subscription)
                await hub.send_json(websocket, {"type": "subscribed", "ok": True})
                await hub.send_snapshot(websocket, subscription)
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.debug("[HeatmapLive] WebSocket closed: %s", exc)
    finally:
        await hub.unregister(websocket)
