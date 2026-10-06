"""
Alert state machine. Documented lifecycle:

    Unknown → Open → Resolved

Rules (unchanged vs pre-v2 LMS):
- Non-empty ErrorStatus opens or updates.
- Empty ErrorStatus resolves (in-band clear).
- Snapshot disappearance resolves only during full-snapshot reconciliation.
- No ACK.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, Iterable, List, Optional, Set, Tuple

from app.loadcontroller.metrics import LoadControllerMetrics
from app.loadcontroller.protocol import lc_code_from_status, parse_error_status


class AlertState(str, Enum):
    UNKNOWN = "unknown"
    OPEN = "open"
    RESOLVED = "resolved"


@dataclass
class AlertEvent:
    processor_id: int
    loadcontroller_code: int
    previous: AlertState
    next: AlertState
    kind: str  # open | update | still_open | resolve | ignore
    error_code: Optional[str]
    description: Optional[str]
    full_snapshot: bool
    status: dict = field(default_factory=dict)


class AlertStateMachine:
    def __init__(
        self,
        processor_id: int,
        metrics: Optional[LoadControllerMetrics] = None,
    ):
        self.processor_id = int(processor_id)
        self.metrics = metrics
        self._state: Dict[int, AlertState] = {}
        self._error: Dict[int, Tuple[Optional[str], Optional[str]]] = {}

    def state_of(self, lc_code: int) -> AlertState:
        return self._state.get(int(lc_code), AlertState.UNKNOWN)

    def apply_status(self, status: dict, *, full_snapshot: bool = False) -> Optional[AlertEvent]:
        lc = lc_code_from_status(status)
        if lc is None:
            return None
        is_error, code, desc, is_unknown = parse_error_status(status)
        if is_unknown:
            return None

        prev = self.state_of(lc)
        if is_error:
            prev_err = self._error.get(lc)
            self._state[lc] = AlertState.OPEN
            self._error[lc] = (code, desc)
            if prev != AlertState.OPEN:
                kind = "open"
            elif prev_err != (code, desc):
                kind = "update"
            else:
                kind = "still_open"
            event = AlertEvent(
                processor_id=self.processor_id,
                loadcontroller_code=lc,
                previous=prev,
                next=AlertState.OPEN,
                kind=kind,
                error_code=code,
                description=desc,
                full_snapshot=full_snapshot,
                status=status,
            )
        else:
            if prev != AlertState.OPEN:
                # Healthy LC with no open alert: no row work
                return None
            self._state[lc] = AlertState.RESOLVED
            self._error.pop(lc, None)
            event = AlertEvent(
                processor_id=self.processor_id,
                loadcontroller_code=lc,
                previous=prev,
                next=AlertState.RESOLVED,
                kind="resolve",
                error_code=None,
                description=None,
                full_snapshot=full_snapshot,
                status=status,
            )
        self._record(event)
        return event

    def apply_snapshot(self, statuses: Iterable[dict], *, full_snapshot: bool) -> List[AlertEvent]:
        events: List[AlertEvent] = []
        seen: Set[int] = set()
        for status in statuses or []:
            if not isinstance(status, dict):
                continue
            lc = lc_code_from_status(status)
            if lc is not None:
                seen.add(lc)
            ev = self.apply_status(status, full_snapshot=full_snapshot)
            if ev is not None:
                events.append(ev)
        if full_snapshot:
            events.extend(self.reconcile_disappearance(seen, full_snapshot=True))
        return events

    def reconcile_disappearance(
        self, seen_lcs: Set[int], *, full_snapshot: bool
    ) -> List[AlertEvent]:
        if not full_snapshot:
            return []
        events: List[AlertEvent] = []
        for lc, state in list(self._state.items()):
            if state != AlertState.OPEN:
                continue
            if lc in seen_lcs:
                continue
            self._state[lc] = AlertState.RESOLVED
            self._error.pop(lc, None)
            event = AlertEvent(
                processor_id=self.processor_id,
                loadcontroller_code=lc,
                previous=AlertState.OPEN,
                next=AlertState.RESOLVED,
                kind="resolve",
                error_code=None,
                description=None,
                full_snapshot=True,
                status={},
            )
            self._record(event)
            events.append(event)
        return events

    def _record(self, event: AlertEvent) -> None:
        if self.metrics is None:
            return
        self.metrics.alert_transitions += 1
        if event.kind == "open":
            self.metrics.alerts_opened += 1
        elif event.kind == "update":
            self.metrics.alerts_updated += 1
        elif event.kind == "resolve":
            self.metrics.alerts_resolved += 1
        elif event.kind == "still_open":
            self.metrics.alerts_skipped_repeat += 1
