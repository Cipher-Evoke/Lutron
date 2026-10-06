"""
Process-manager health snapshot (PM2 / NSSM).

Reads RuntimeSupervisor status for process liveness. Live-state signals
(event age, bootstrap completeness, last snapshot) come from the
cross-process health file written by the listener and energy logger.
Does not restart children and does not query the database.
"""

from __future__ import annotations

from typing import Any, Dict, Mapping, Optional

from app.runtime.lifecycle import ChildState

# Supervisor child name → JSON field on GET /health
_REQUIRED_CHILDREN: Mapping[str, str] = {
    "listener": "listener",
    "energy_logger": "energy_logger",
    "loadcontroller_listener": "loadcontroller",
}

_UNAVAILABLE = "unavailable"
_RUNNING = "running"


def _state_value(state: Any) -> str:
    if isinstance(state, ChildState):
        return state.value
    if hasattr(state, "value"):
        return str(state.value)
    return str(state or "")


def child_runtime_label(child: Any) -> str:
    """Map a ChildStatus snapshot to a lightweight process-manager label."""
    if child is None:
        return _UNAVAILABLE
    alive = bool(getattr(child, "alive", False))
    state = _state_value(getattr(child, "state", None))
    if alive and state == ChildState.RUNNING.value:
        return _RUNNING
    return (state or _UNAVAILABLE).lower() or _UNAVAILABLE


def build_process_health(supervisor: Optional[Any] = None) -> Dict[str, Any]:
    """
    Unauthenticated process-manager payload.

    healthy  = backend serving + all required children RUNNING
    degraded = backend serving but one or more required children unavailable

    Existing string keys (status, backend, listener, energy_logger,
    loadcontroller) are unchanged. Live-state signals are added alongside
    them and are independent of connectivity-only health.
    """
    payload: Dict[str, Any] = {
        "status": "degraded",
        "backend": _RUNNING,
        "listener": _UNAVAILABLE,
        "energy_logger": _UNAVAILABLE,
        "loadcontroller": _UNAVAILABLE,
    }
    if supervisor is None:
        payload["live_state"] = _live_state(socket_alive=False)
        payload["socket_alive"] = False
        payload["event_flow_healthy"] = False
        payload["inventory_complete"] = False
        return payload

    by_name: Dict[str, Any] = {}
    try:
        snapshot = supervisor.status()
        for child in getattr(snapshot, "children", None) or []:
            name = getattr(child, "name", None)
            if name:
                by_name[str(name)] = child
    except Exception:
        payload["live_state"] = _live_state(socket_alive=False)
        payload["socket_alive"] = False
        payload["event_flow_healthy"] = False
        payload["inventory_complete"] = False
        return payload

    all_running = True
    for child_name, json_key in _REQUIRED_CHILDREN.items():
        label = child_runtime_label(by_name.get(child_name))
        payload[json_key] = label
        if label != _RUNNING:
            all_running = False

    payload["status"] = "healthy" if all_running else "degraded"
    socket_alive = payload.get("listener") == _RUNNING
    live_state = _live_state(socket_alive=socket_alive)
    payload["live_state"] = live_state
    payload["socket_alive"] = bool(live_state.get("socket_alive"))
    payload["event_flow_healthy"] = bool(live_state.get("event_flow_healthy"))
    payload["inventory_complete"] = bool(live_state.get("inventory_complete"))
    payload["bootstrap_complete"] = bool(live_state.get("bootstrap_complete"))
    payload["last_successful_snapshot_commit"] = live_state.get("last_successful_snapshot_commit")
    payload["zone_event_age_s"] = live_state.get("zone_event_age_s")
    payload["area_event_age_s"] = live_state.get("area_event_age_s")
    payload["stale_processors"] = live_state.get("stale_processors") or []
    return payload


def _live_state(*, socket_alive: bool) -> Dict[str, Any]:
    try:
        from app.live_state_health import build_live_state_payload

        return build_live_state_payload(socket_alive=socket_alive)
    except Exception:
        return {
            "socket_alive": bool(socket_alive),
            "event_flow_healthy": False,
            "inventory_complete": False,
            "bootstrap_complete": False,
            "last_successful_snapshot_commit": None,
            "zone_event_age_s": None,
            "area_event_age_s": None,
            "stale_processors": [],
        }
