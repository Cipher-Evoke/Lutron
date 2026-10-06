"""
Persist only changed driver alerts. One session per batch. Never delete rows.

Preserves:
- insert only when area_id or area_path is present
- solved_time via update_alert_timestamps
- no ACK
- ghost clear on full snapshot only for definitive healthy ErrorStatus (not Unknown)
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Iterable, Optional, Sequence

from app.loadcontroller.area_index import AreaIndex, AreaHit
from app.loadcontroller.metrics import LoadControllerMetrics
from app.loadcontroller.state_machine import AlertEvent


class BatchWriter:
    def __init__(
        self,
        processor: Any,
        area_index: AreaIndex,
        metrics: Optional[LoadControllerMetrics] = None,
        *,
        session_factory=None,
    ):
        self.processor = processor
        self.area_index = area_index
        self.metrics = metrics
        self._session_factory = session_factory
        self.last_session_count = 0
        self.last_commit_count = 0
        self.last_write_count = 0

    def persist(
        self,
        events: Sequence[AlertEvent],
        *,
        full_snapshot: bool = False,
        statuses: Optional[Iterable[dict]] = None,
    ) -> dict:
        """Apply a batch. Returns write stats."""
        from app.database.session import SessionLocal
        from app.models.drivers import Driver
        from app.crud.alert import update_alert_timestamps
        from app.utils.system_identity import find_driver_for_upsert, collapse_duplicate_drivers
        from app.crud.alert_reconciliation import (
            dedupe_active_drivers_for_lc,
            confirm_and_clear_driver_alert,
            reset_driver_clear_votes,
            driver_is_healthy_in_full_snapshot,
        )

        factory = self._session_factory or SessionLocal
        db = factory()
        sessions = 1
        commits = 0
        writes = 0
        skipped = 0
        unresolved = 0
        processor_id = int(self.processor.id)
        system_key = getattr(self.processor, "system_key", None)

        try:
            for event in events:
                row = find_driver_for_upsert(
                    db,
                    loadcontroller_code=event.loadcontroller_code,
                    processor_id=processor_id,
                    system_key=system_key,
                )
                if event.kind == "resolve":
                    if row is None:
                        skipped += 1
                        continue
                    # Disappearance (empty status) is not a solve.
                    if not event.status:
                        skipped += 1
                        continue
                    if confirm_and_clear_driver_alert(row):
                        writes += 1
                    else:
                        skipped += 1
                    continue

                if event.kind == "still_open" and row is not None:
                    if (
                        row.error_code == event.error_code
                        and (row.alert_status in ("not_ok", "not_okay"))
                    ):
                        skipped += 1
                        continue

                hit = self.area_index.get(processor_id, event.loadcontroller_code)
                if row is None:
                    if hit is None or not (hit.area_path or hit.area_id):
                        unresolved += 1
                        skipped += 1
                        continue
                    row = Driver(
                        processor_id=processor_id,
                        system_key=system_key,
                        loadcontroller_code=event.loadcontroller_code,
                        error_code=event.error_code,
                        description=event.description,
                        alert_status="not_ok",
                        area_map_failures=0,
                    )
                    now = datetime.utcnow()
                    row.reported_time = now
                    row.solved_time = None
                    row.created_at = now
                    _apply_hit(row, hit)
                    db.add(row)
                    db.flush()
                    if system_key:
                        try:
                            collapse_duplicate_drivers(db, system_key)
                        except Exception:
                            pass
                    writes += 1
                    continue

                if row is not None:
                    try:
                        dedupe_active_drivers_for_lc(
                            db, processor_id, event.loadcontroller_code, keep=row
                        )
                    except Exception:
                        pass
                    if system_key and not getattr(row, "system_key", None):
                        row.system_key = system_key
                        row.processor_id = processor_id
                    reset_driver_clear_votes(row)
                    update_alert_timestamps(row, "not_ok")
                    row.error_code = event.error_code
                    row.description = event.description
                    if hit is not None and (not getattr(row, "area_path", None)):
                        _apply_hit(row, hit)
                    writes += 1

            if full_snapshot:
                writes += _reconcile_db_ghosts(
                    db,
                    processor_id,
                    statuses or [],
                    Driver=Driver,
                )

            if writes:
                db.commit()
                commits = 1
            else:
                db.rollback()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

        self.last_session_count = sessions
        self.last_commit_count = commits
        self.last_write_count = writes
        if self.metrics is not None:
            self.metrics.db_sessions += sessions
            self.metrics.db_commits += commits
            self.metrics.db_writes += writes
            self.metrics.batch_size = len(events)
            self.metrics.unresolved_mappings += unresolved
        return {
            "sessions": sessions,
            "commits": commits,
            "writes": writes,
            "skipped": skipped,
            "unresolved": unresolved,
            "events": len(events),
        }


def _apply_hit(row: Any, hit: AreaHit) -> None:
    if hit.area_id:
        row.area_id = hit.area_id
    if hit.area_code is not None:
        row.area_code = hit.area_code
    if hit.zone_code is not None:
        row.zone_code = hit.zone_code
    if hit.zone_id and not getattr(row, "zone_id", None):
        row.zone_id = hit.zone_id
    if hit.area_path:
        row.area_path = hit.area_path
        row.area_map_failures = 0


def _reconcile_db_ghosts(db, processor_id, statuses, *, Driver) -> int:
    """Clear-vote only LCs with definitive healthy ErrorStatus (empty code+desc).

    Unknown does not count as healthy — keeps alerts across restart/subscribe
    until a real fix is confirmed twice.
    """
    from app.crud.alert_reconciliation import (
        collect_lc_health_from_statuses,
        confirm_and_clear_driver_alert,
        driver_is_healthy_in_full_snapshot,
    )

    _seen, _live_errors, healthy = collect_lc_health_from_statuses(statuses or [])

    writes = 0
    bad = (
        db.query(Driver)
        .filter(
            Driver.processor_id == processor_id,
            Driver.alert_status.in_(("not_ok", "not_okay")),
            Driver.solved_time.is_(None),
        )
        .all()
    )
    for driver in bad:
        if not driver_is_healthy_in_full_snapshot(driver, healthy):
            continue
        if confirm_and_clear_driver_alert(driver):
            writes += 1
    return writes
