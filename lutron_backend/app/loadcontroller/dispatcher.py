"""Route LEAP messages without a shared giant processing path."""

from __future__ import annotations

import json
from enum import Enum
from typing import Any, Callable, Optional

from app.loadcontroller.metrics import LoadControllerMetrics
from app.loadcontroller.protocol import LC_STATUS_URL, PING_URLS


class MessageKind(str, Enum):
    PING = "ping"
    SUBSCRIBE_SNAPSHOT = "subscribe"
    READ_SNAPSHOT = "read"
    UPDATE_DELTA = "update"
    ERROR = "error"
    OTHER = "other"


class MessageDispatcher:
    def __init__(
        self,
        metrics: Optional[LoadControllerMetrics] = None,
        *,
        on_ping: Optional[Callable[[dict], Any]] = None,
        on_subscribe: Optional[Callable[[dict], Any]] = None,
        on_read: Optional[Callable[[dict], Any]] = None,
        on_update: Optional[Callable[[dict], Any]] = None,
        on_error: Optional[Callable[[dict], Any]] = None,
        on_other: Optional[Callable[[dict], Any]] = None,
    ):
        self.metrics = metrics
        self.on_ping = on_ping
        self.on_subscribe = on_subscribe
        self.on_read = on_read
        self.on_update = on_update
        self.on_error = on_error
        self.on_other = on_other

    def classify(self, msg: dict) -> MessageKind:
        if not isinstance(msg, dict):
            return MessageKind.OTHER
        ctype = msg.get("CommuniqueType") or ""
        header = msg.get("Header") or {}
        if not isinstance(header, dict):
            header = {}
        url = header.get("Url") or header.get("URL") or ""
        status = str(header.get("StatusCode") or "")

        body = msg.get("Body") if isinstance(msg.get("Body"), dict) else {}
        if url in PING_URLS:
            return MessageKind.PING
        if "ExceptionResponse" in str(ctype) or (
            status.startswith("4") or status.startswith("5")
        ):
            if url == LC_STATUS_URL or "Exception" in str(ctype):
                return MessageKind.ERROR
        if ctype == "SubscribeResponse" and "LoadControllerStatuses" in (body or {}):
            return MessageKind.SUBSCRIBE_SNAPSHOT
        if url != LC_STATUS_URL:
            return MessageKind.OTHER
        if ctype == "SubscribeResponse":
            return MessageKind.SUBSCRIBE_SNAPSHOT
        if ctype == "ReadResponse":
            return MessageKind.READ_SNAPSHOT
        if ctype == "UpdateResponse":
            return MessageKind.UPDATE_DELTA
        # LMS-observed: any other communique on this URL is a partial delta
        return MessageKind.UPDATE_DELTA

    async def dispatch_raw(self, raw: str) -> Optional[MessageKind]:
        try:
            msg = json.loads(raw)
        except json.JSONDecodeError:
            if self.metrics is not None:
                self.metrics.dispatch_error += 1
            if self.on_error is not None:
                await _maybe_await(self.on_error, {"raw": raw, "reason": "invalid_frame"})
            return MessageKind.ERROR
        return await self.dispatch(msg)

    async def dispatch(self, msg: dict) -> MessageKind:
        kind = self.classify(msg)
        if self.metrics is not None:
            if kind == MessageKind.PING:
                self.metrics.dispatch_ping += 1
            elif kind == MessageKind.SUBSCRIBE_SNAPSHOT:
                self.metrics.dispatch_subscribe += 1
            elif kind == MessageKind.READ_SNAPSHOT:
                self.metrics.dispatch_read += 1
            elif kind == MessageKind.UPDATE_DELTA:
                self.metrics.dispatch_update += 1
            elif kind == MessageKind.ERROR:
                self.metrics.dispatch_error += 1
        handler = {
            MessageKind.PING: self.on_ping,
            MessageKind.SUBSCRIBE_SNAPSHOT: self.on_subscribe,
            MessageKind.READ_SNAPSHOT: self.on_read,
            MessageKind.UPDATE_DELTA: self.on_update,
            MessageKind.ERROR: self.on_error,
            MessageKind.OTHER: self.on_other,
        }.get(kind)
        if handler is not None:
            await _maybe_await(handler, msg)
        return kind


async def _maybe_await(fn: Callable, *args) -> None:
    result = fn(*args)
    if hasattr(result, "__await__"):
        await result
