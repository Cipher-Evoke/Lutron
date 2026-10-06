"""
Subscription-first recovery gates.

Live subscribe is the primary inventory. Periodic LEAP dumps are recovery only.
"""

from __future__ import annotations

import os
import time
from typing import Optional

from app.loadcontroller.metrics import LoadControllerMetrics

RECOVERY_IDLE_SECONDS = 600.0
PING_INTERVAL_SECONDS = 30.0
RECONNECT_AFTER_STREAM_SECONDS = 1.0
RECONNECT_AFTER_FAIL_SECONDS = 5.0
AREA_INDEX_REFRESH_SECONDS = 1800.0  # 30 min, project-change recovery


def force_live_reconcile() -> bool:
    raw = (os.getenv("LOADCONTROLLER_FORCE_LIVE_RECONCILE") or "").strip().lower()
    return raw in ("1", "true", "yes")


def should_run_live_leap_reconcile() -> bool:
    """
    15-minute scheduler inventory. Off by default in v2 (subscribe is primary).
    Set LOADCONTROLLER_FORCE_LIVE_RECONCILE=1 to restore the pre-v2 extra TLS dump.
    """
    return force_live_reconcile()


def should_send_recovery_read(
    metrics: Optional[LoadControllerMetrics],
    *,
    now: Optional[float] = None,
    idle_seconds: float = RECOVERY_IDLE_SECONDS,
) -> bool:
    """Send ReadRequest /loadcontroller/status only if the stream has been idle."""
    if metrics is None:
        return False
    if not metrics.last_status_event_monotonic:
        return True
    t = now if now is not None else time.monotonic()
    return (t - metrics.last_status_event_monotonic) >= idle_seconds
