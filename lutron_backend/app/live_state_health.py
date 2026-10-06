"""
Cross-process live-state health (listener + energy logger → GET /health).

Socket liveness, event-flow age, and inventory completeness are stored as
separate signals. Connectivity/ping is not treated as zone liveness.

No schema change: state is a JSON file in the system temp directory.
"""

from __future__ import annotations

import json
import os
import tempfile
import threading
import time
from typing import Any, Dict, Optional

STATE_PATH = os.path.join(tempfile.gettempdir(), "lutron_live_state_health.json")

# Zone stream older than one snapshot interval is stale.
STALE_ZONE_EVENT_SECONDS = 900
# Occupancy can be quieter than zone level changes.
STALE_AREA_EVENT_SECONDS = 1800

_lock = threading.Lock()


def _read_unlocked() -> Dict[str, Any]:
    try:
        with open(STATE_PATH, "r", encoding="utf-8") as handle:
            data = json.load(handle)
        if isinstance(data, dict):
            return data
    except Exception:
        pass
    return {}


def _write_unlocked(data: Dict[str, Any]) -> None:
    tmp_path = STATE_PATH + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as handle:
        json.dump(data, handle)
    os.replace(tmp_path, STATE_PATH)


def snapshot() -> Dict[str, Any]:
    with _lock:
        return _read_unlocked()


def update_processor(processor_id: int, **fields: Any) -> None:
    with _lock:
        data = _read_unlocked()
        processors = data.setdefault("processors", {})
        key = str(int(processor_id))
        row = processors.get(key) if isinstance(processors.get(key), dict) else {}
        row.update(fields)
        row["updated_at"] = time.time()
        processors[key] = row
        data["processors"] = processors
        _write_unlocked(data)


def update_energy(**fields: Any) -> None:
    with _lock:
        data = _read_unlocked()
        energy = data.setdefault("energy", {})
        if not isinstance(energy, dict):
            energy = {}
        energy.update(fields)
        energy["updated_at"] = time.time()
        data["energy"] = energy
        _write_unlocked(data)


def _age_s(epoch: Optional[float], now: float) -> Optional[float]:
    try:
        value = float(epoch or 0.0)
    except (TypeError, ValueError):
        return None
    if value <= 0:
        return None
    return max(0.0, now - value)


def build_live_state_payload(*, socket_alive: bool) -> Dict[str, Any]:
    """Aggregate file snapshot into health signals. Never raises."""
    now = time.time()
    try:
        data = snapshot()
    except Exception:
        data = {}

    processors = data.get("processors") if isinstance(data.get("processors"), dict) else {}
    energy = data.get("energy") if isinstance(data.get("energy"), dict) else {}

    stale_processors = []
    complete_count = 0
    total = 0
    worst_zone_age = None
    worst_area_age = None
    any_zone_stale = False

    for pid_key, row in processors.items():
        if not isinstance(row, dict):
            continue
        total += 1
        try:
            processor_id = int(pid_key)
        except (TypeError, ValueError):
            processor_id = pid_key

        db_zones = int(row.get("db_zones") or 0)
        mapped_czs = int(row.get("mapped_czs") or 0)
        orphans = int(row.get("orphans") or 0)
        bootstrap_complete = bool(row.get("bootstrap_complete"))
        inventory_ok = bootstrap_complete and db_zones > 0 and mapped_czs == db_zones and orphans == 0
        if inventory_ok:
            complete_count += 1

        zone_age = _age_s(row.get("last_zone_event_epoch"), now)
        area_age = _age_s(row.get("last_area_event_epoch"), now)
        if zone_age is not None:
            worst_zone_age = zone_age if worst_zone_age is None else max(worst_zone_age, zone_age)
        if area_age is not None:
            worst_area_age = area_age if worst_area_age is None else max(worst_area_age, area_age)

        zone_stale = False
        area_stale = False
        updated_at = 0.0
        try:
            updated_at = float(row.get("updated_at") or 0.0)
        except (TypeError, ValueError):
            updated_at = 0.0
        if bootstrap_complete and db_zones > 0:
            if zone_age is None:
                zone_stale = bool(updated_at and (now - updated_at) > STALE_ZONE_EVENT_SECONDS)
            else:
                zone_stale = zone_age > STALE_ZONE_EVENT_SECONDS
        if bootstrap_complete and int(row.get("db_areas") or 0) > 0:
            if area_age is None:
                area_stale = bool(updated_at and (now - updated_at) > STALE_AREA_EVENT_SECONDS)
            else:
                area_stale = area_age > STALE_AREA_EVENT_SECONDS
        if zone_stale:
            any_zone_stale = True
        if zone_stale or area_stale:
            stale_processors.append(
                {
                    "processor_id": processor_id,
                    "zone_event_age_s": None if zone_age is None else round(zone_age, 1),
                    "area_event_age_s": None if area_age is None else round(area_age, 1),
                    "zone_stale": zone_stale,
                    "area_stale": area_stale,
                    "inventory_complete": inventory_ok,
                }
            )

    inventory_complete = total > 0 and complete_count == total
    event_flow_healthy = total > 0 and not any_zone_stale

    return {
        "socket_alive": bool(socket_alive),
        "event_flow_healthy": event_flow_healthy,
        "inventory_complete": inventory_complete,
        "bootstrap_complete": inventory_complete,
        "last_successful_snapshot_commit": energy.get("last_snapshot_commit_at"),
        "last_snapshot_row_count": energy.get("last_snapshot_rows"),
        "last_gapfill_at": energy.get("last_gapfill_at"),
        "zone_event_age_s": None if worst_zone_age is None else round(worst_zone_age, 1),
        "area_event_age_s": None if worst_area_age is None else round(worst_area_age, 1),
        "stale_processors": stale_processors,
        "bootstrap_processors_complete": complete_count,
        "bootstrap_processors_total": total,
        "stale_zone_event_threshold_s": STALE_ZONE_EVENT_SECONDS,
        "stale_area_event_threshold_s": STALE_AREA_EVENT_SECONDS,
    }


SNAPSHOT_HISTORY_MAX = 96
OVERLAP_HISTORY_MAX = 32
SNAPSHOT_INTERVAL_SECONDS = 900
SNAPSHOT_DELAY_ALERT_SECONDS = 960  # 16 minutes
SNAPSHOT_TX_ALERT_SECONDS = 60


def _jobs(data: Dict[str, Any]) -> Dict[str, Any]:
    jobs = data.get("jobs")
    if not isinstance(jobs, dict):
        jobs = {}
    data["jobs"] = jobs
    return jobs


def is_snapshot_running() -> bool:
    try:
        data = snapshot()
        jobs = data.get("jobs") if isinstance(data.get("jobs"), dict) else {}
        snap = jobs.get("snapshot") if isinstance(jobs.get("snapshot"), dict) else {}
        return bool(snap.get("running"))
    except Exception:
        return False


def record_snapshot_start(*, slot_at: Optional[str] = None) -> None:
    with _lock:
        data = _read_unlocked()
        jobs = _jobs(data)
        gap = jobs.get("gapfill") if isinstance(jobs.get("gapfill"), dict) else {}
        overlap = bool(gap.get("running"))
        jobs["snapshot"] = {
            "running": True,
            "started_at": time.time(),
            "slot_at": slot_at,
        }
        if overlap:
            events = data.get("overlap_events")
            if not isinstance(events, list):
                events = []
            events.append(
                {
                    "at": time.time(),
                    "kind": "snapshot_started_while_gapfill_running",
                }
            )
            data["overlap_events"] = events[-OVERLAP_HISTORY_MAX:]
            data["overlap_count"] = int(data.get("overlap_count") or 0) + 1
        data["jobs"] = jobs
        _write_unlocked(data)


def record_snapshot_finish(
    *,
    success: bool,
    slot_at: Optional[str] = None,
    started_at: Optional[str] = None,
    finished_at: Optional[str] = None,
    duration_ms: Optional[float] = None,
    rows_written: Optional[int] = None,
    processor_count: Optional[int] = None,
    error: Optional[str] = None,
) -> None:
    with _lock:
        data = _read_unlocked()
        jobs = _jobs(data)
        jobs["snapshot"] = {
            "running": False,
            "started_at": None,
            "finished_at": time.time(),
            "last_success": bool(success),
        }
        history = data.get("snapshot_history")
        if not isinstance(history, list):
            history = []
        history.append(
            {
                "start_time": started_at,
                "finish_time": finished_at,
                "duration_ms": duration_ms,
                "rows_written": rows_written,
                "processor_count": processor_count,
                "success": bool(success),
                "error": error,
                "slot_at": slot_at,
            }
        )
        data["snapshot_history"] = history[-SNAPSHOT_HISTORY_MAX:]
        energy = data.get("energy") if isinstance(data.get("energy"), dict) else {}
        if success:
            energy["last_snapshot_commit_at"] = slot_at or finished_at
            energy["last_snapshot_rows"] = rows_written
            energy["last_snapshot_ok"] = True
            energy["last_snapshot_duration_ms"] = duration_ms
        else:
            energy["last_snapshot_ok"] = False
            energy["last_snapshot_error"] = error
        energy["updated_at"] = time.time()
        data["energy"] = energy
        data["jobs"] = jobs
        _write_unlocked(data)


def record_gapfill_start() -> bool:
    """Return False if a snapshot is running (gap-fill should defer)."""
    with _lock:
        data = _read_unlocked()
        jobs = _jobs(data)
        snap = jobs.get("snapshot") if isinstance(jobs.get("snapshot"), dict) else {}
        if snap.get("running"):
            deferred = data.get("gapfill_deferred_count") or 0
            data["gapfill_deferred_count"] = int(deferred) + 1
            _write_unlocked(data)
            return False
        jobs["gapfill"] = {
            "running": True,
            "started_at": time.time(),
            "status": "running",
        }
        data["jobs"] = jobs
        _write_unlocked(data)
        return True


def record_gapfill_finish(
    *,
    success: bool,
    started_at: Optional[str] = None,
    finished_at: Optional[str] = None,
    duration_ms: Optional[float] = None,
    energy_filled: int = 0,
    occupancy_filled: int = 0,
    lookback_hours: Optional[float] = None,
    checkpoint_at: Optional[str] = None,
    error: Optional[str] = None,
    deferred: bool = False,
) -> None:
    with _lock:
        data = _read_unlocked()
        jobs = _jobs(data)
        status = "deferred" if deferred else ("success" if success else "failure")
        jobs["gapfill"] = {
            "running": False,
            "started_at": None,
            "finished_at": time.time(),
            "status": status,
        }
        energy = data.get("energy") if isinstance(data.get("energy"), dict) else {}
        if not deferred:
            energy["last_gapfill_at"] = finished_at
            energy["last_gapfill_energy_filled"] = energy_filled
            energy["last_gapfill_occupancy_filled"] = occupancy_filled
            energy["last_gapfill_lookback_hours"] = lookback_hours
            energy["last_gapfill_ok"] = bool(success)
            energy["last_gapfill_duration_ms"] = duration_ms
            energy["last_gapfill_checkpoint"] = checkpoint_at
            if error:
                energy["last_gapfill_error"] = error
            energy["updated_at"] = time.time()
            data["energy"] = energy
        data["jobs"] = jobs
        _write_unlocked(data)
