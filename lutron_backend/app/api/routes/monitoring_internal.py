"""
Internal live-state diagnostics (Superadmin, read-only).

Not gated on monitoring_enabled — operators still need snapshot/bootstrap
visibility when telemetry ingest is off. Does not change dashboard contracts.
"""

from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies.auth import require_admin
from app.models.user_model import User
from app.ops_observability import (
    get_bootstrap_view,
    get_database_view,
    get_gapfill_view,
    get_overview,
    get_processors_view,
    get_runtime_view,
    get_snapshot_view,
)

router = APIRouter()


def _ok(payload: Dict[str, Any]) -> Dict[str, Any]:
    return payload


def _fail(exc: Exception) -> None:
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Operational diagnostics unavailable",
    ) from exc


@router.get("/internal")
def ops_overview(user: User = Depends(require_admin)) -> Dict[str, Any]:
    del user
    try:
        return _ok(get_overview())
    except Exception as exc:
        _fail(exc)


@router.get("/internal/snapshot")
def ops_snapshot(user: User = Depends(require_admin)) -> Dict[str, Any]:
    del user
    try:
        return _ok(get_snapshot_view())
    except Exception as exc:
        _fail(exc)


@router.get("/internal/bootstrap")
def ops_bootstrap(user: User = Depends(require_admin)) -> Dict[str, Any]:
    del user
    try:
        return _ok(get_bootstrap_view())
    except Exception as exc:
        _fail(exc)


@router.get("/internal/processors")
def ops_processors(user: User = Depends(require_admin)) -> Dict[str, Any]:
    del user
    try:
        return _ok(get_processors_view())
    except Exception as exc:
        _fail(exc)


@router.get("/internal/gapfill")
def ops_gapfill(user: User = Depends(require_admin)) -> Dict[str, Any]:
    del user
    try:
        return _ok(get_gapfill_view())
    except Exception as exc:
        _fail(exc)


@router.get("/internal/runtime")
def ops_runtime(user: User = Depends(require_admin)) -> Dict[str, Any]:
    del user
    try:
        return _ok(get_runtime_view())
    except Exception as exc:
        _fail(exc)


@router.get("/internal/database")
def ops_database(user: User = Depends(require_admin)) -> Dict[str, Any]:
    del user
    try:
        return _ok(get_database_view())
    except Exception as exc:
        _fail(exc)
