"""
Load Controller listener entrypoint (v2 pipeline).

Public names used by app.main are unchanged. Internal processing is the
Connection Manager → Frame Reader → Dispatcher → State Machine → Area Index
→ Batch Writer architecture.
"""

from app.loadcontroller.framing import LoadControllerStreamError
from app.loadcontroller.metrics import get_metrics
from app.loadcontroller.pipeline import (
    loadcontroller_listener_entrypoint,
    main_async,
    monitor_processor,
    shutdown_event,
)
from app.loadcontroller.protocol import ERROR_MAP

__all__ = [
    "ERROR_MAP",
    "LoadControllerStreamError",
    "get_metrics",
    "loadcontroller_listener_entrypoint",
    "main_async",
    "monitor_processor",
    "shutdown_event",
]
