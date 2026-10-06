"""Internal diagnostics for the loadcontroller v2 pipeline. Not an HTTP API."""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field
from typing import Any, Dict, Optional


@dataclass
class LoadControllerMetrics:
    current_frame_size: int = 0
    largest_frame: int = 0
    reconnect_count: int = 0
    connect_count: int = 0
    subscription_count: int = 0
    subscribe_request_count: int = 0
    ssl_context_created: int = 0
    ssl_context_reused: int = 0
    alert_transitions: int = 0
    alerts_opened: int = 0
    alerts_updated: int = 0
    alerts_resolved: int = 0
    alerts_skipped_repeat: int = 0
    unresolved_mappings: int = 0
    area_cache_size: int = 0
    area_cache_build_ms: float = 0.0
    area_lookup_last_ms: float = 0.0
    area_lookup_repeat_ms: float = 0.0
    batch_size: int = 0
    processing_duration_ms: float = 0.0
    db_sessions: int = 0
    db_commits: int = 0
    db_writes: int = 0
    recovery_reads: int = 0
    pings_sent: int = 0
    frames_parsed: int = 0
    dispatch_subscribe: int = 0
    dispatch_update: int = 0
    dispatch_read: int = 0
    dispatch_ping: int = 0
    dispatch_error: int = 0
    active_connections: int = 0
    last_status_event_monotonic: float = 0.0
    extra: Dict[str, Any] = field(default_factory=dict)

    def note_frame(self, size: int) -> None:
        self.current_frame_size = int(size)
        if size > self.largest_frame:
            self.largest_frame = int(size)
        self.frames_parsed += 1

    def snapshot(self) -> Dict[str, Any]:
        return {
            "current_frame_size": self.current_frame_size,
            "largest_frame": self.largest_frame,
            "reconnect_count": self.reconnect_count,
            "connect_count": self.connect_count,
            "subscription_count": self.subscription_count,
            "subscribe_request_count": self.subscribe_request_count,
            "ssl_context_created": self.ssl_context_created,
            "ssl_context_reused": self.ssl_context_reused,
            "alert_transitions": self.alert_transitions,
            "alerts_opened": self.alerts_opened,
            "alerts_updated": self.alerts_updated,
            "alerts_resolved": self.alerts_resolved,
            "alerts_skipped_repeat": self.alerts_skipped_repeat,
            "unresolved_mappings": self.unresolved_mappings,
            "area_cache_size": self.area_cache_size,
            "area_cache_build_ms": round(self.area_cache_build_ms, 3),
            "area_lookup_last_ms": round(self.area_lookup_last_ms, 6),
            "area_lookup_repeat_ms": round(self.area_lookup_repeat_ms, 6),
            "batch_size": self.batch_size,
            "processing_duration_ms": round(self.processing_duration_ms, 3),
            "db_sessions": self.db_sessions,
            "db_commits": self.db_commits,
            "db_writes": self.db_writes,
            "recovery_reads": self.recovery_reads,
            "pings_sent": self.pings_sent,
            "frames_parsed": self.frames_parsed,
            "dispatch_subscribe": self.dispatch_subscribe,
            "dispatch_update": self.dispatch_update,
            "dispatch_read": self.dispatch_read,
            "dispatch_ping": self.dispatch_ping,
            "dispatch_error": self.dispatch_error,
            "active_connections": self.active_connections,
            "last_status_event_age_s": (
                round(time.monotonic() - self.last_status_event_monotonic, 3)
                if self.last_status_event_monotonic
                else None
            ),
        }


_lock = threading.Lock()
_process_metrics: Optional[LoadControllerMetrics] = None


def get_metrics() -> LoadControllerMetrics:
    global _process_metrics
    with _lock:
        if _process_metrics is None:
            _process_metrics = LoadControllerMetrics()
        return _process_metrics
