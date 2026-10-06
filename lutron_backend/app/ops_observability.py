"""
Operational observability read models for live-state and energy.

Lightweight, read-only. Does not change the listener/snapshot/gap-fill pipeline.
"""

from __future__ import annotations

import json
import logging
import os
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import text

from app.live_state_health import (
    OVERLAP_HISTORY_MAX,
    SNAPSHOT_DELAY_ALERT_SECONDS,
    SNAPSHOT_HISTORY_MAX,
    SNAPSHOT_INTERVAL_SECONDS,
    SNAPSHOT_TX_ALERT_SECONDS,
    STALE_AREA_EVENT_SECONDS,
    STALE_ZONE_EVENT_SECONDS,
    _age_s,
    snapshot as read_live_state,
)

logger = logging.getLogger("lutron_ops")

WARNING_ZONE_SECONDS = STALE_ZONE_EVENT_SECONDS
CRITICAL_ZONE_SECONDS = STALE_ZONE_EVENT_SECONDS * 2
GAPFILL_BACKLOG_ALERT_HOURS = 2.0


def _now_naive() -> datetime:
    return datetime.now()


def _next_aligned(now: Optional[datetime] = None) -> datetime:
    now = now or _now_naive()
    minute = now.minute
    if minute % 15 == 0 and now.second == 0 and now.microsecond == 0:
        nxt = minute + 15
    else:
        nxt = ((minute // 15) + 1) * 15
    hour = now.hour
    day = now.day
    if nxt >= 60:
        nxt = 0
        hour += 1
        if hour >= 24:
            hour = 0
            try:
                return now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
            except Exception:
                return now + timedelta(minutes=15)
    try:
        return now.replace(hour=hour, minute=nxt, second=0, microsecond=0)
    except Exception:
        return now + timedelta(minutes=15)


def _parse_slot(raw: Optional[str]) -> Optional[datetime]:
    if not raw or not isinstance(raw, str):
        return None
    try:
        value = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return None
    if value.tzinfo is not None:
        value = value.replace(tzinfo=None)
    return value.replace(second=0, microsecond=0)


def _iso(value: Optional[datetime]) -> Optional[str]:
    if value is None:
        return None
    return value.isoformat(timespec="seconds")


def _processor_health(
    *,
    bootstrap_complete: bool,
    db_zones: int,
    zone_age: Optional[float],
    area_age: Optional[float],
    updated_at: float,
    now: float,
) -> str:
    if not bootstrap_complete:
        return "Warning"
    if db_zones <= 0:
        return "Healthy"
    if zone_age is None:
        if updated_at and (now - updated_at) > CRITICAL_ZONE_SECONDS:
            return "Critical"
        if updated_at and (now - updated_at) > WARNING_ZONE_SECONDS:
            return "Warning"
        return "Healthy"
    if zone_age > CRITICAL_ZONE_SECONDS:
        return "Critical"
    if zone_age > WARNING_ZONE_SECONDS:
        return "Warning"
    if area_age is not None and area_age > STALE_AREA_EVENT_SECONDS:
        return "Warning"
    return "Healthy"


def get_snapshot_view() -> Dict[str, Any]:
    data = read_live_state()
    energy = data.get("energy") if isinstance(data.get("energy"), dict) else {}
    jobs = data.get("jobs") if isinstance(data.get("jobs"), dict) else {}
    snap_job = jobs.get("snapshot") if isinstance(jobs.get("snapshot"), dict) else {}
    history = data.get("snapshot_history") if isinstance(data.get("snapshot_history"), list) else []
    history = [h for h in history if isinstance(h, dict)]

    successes = [h for h in history if h.get("success")]
    durations = [
        float(h["duration_ms"])
        for h in successes
        if h.get("duration_ms") is not None
    ]
    now = _now_naive()
    last_success_slot = _parse_slot(energy.get("last_snapshot_commit_at"))
    next_expected = _next_aligned(now)

    missed = 0
    if successes:
        first = _parse_slot(successes[0].get("slot_at") or successes[0].get("finish_time"))
        last = last_success_slot or _parse_slot(successes[-1].get("slot_at"))
        if first and last and last >= first:
            expected_slots = int(((last - first).total_seconds() // SNAPSHOT_INTERVAL_SECONDS) + 1)
            unique_ok = {
                (_parse_slot(h.get("slot_at") or h.get("finish_time")) or datetime.min).isoformat()
                for h in successes
            }
            missed = max(0, expected_slots - len(unique_ok))
        if last_success_slot:
            lag = (now - last_success_slot).total_seconds()
            if lag > SNAPSHOT_INTERVAL_SECONDS + 30:
                extra = int((lag - SNAPSHOT_INTERVAL_SECONDS) // SNAPSHOT_INTERVAL_SECONDS)
                missed = max(missed, extra)

    success_rate = None
    if history:
        success_rate = round(100.0 * len(successes) / len(history), 1)

    delayed = False
    if last_success_slot:
        delayed = (now - last_success_slot).total_seconds() > SNAPSHOT_DELAY_ALERT_SECONDS
    elif bool(snap_job.get("running")):
        started = snap_job.get("started_at")
        try:
            delayed = started and (time.time() - float(started)) > SNAPSHOT_TX_ALERT_SECONDS
        except (TypeError, ValueError):
            delayed = False

    return {
        "running": bool(snap_job.get("running")),
        "last_successful_snapshot": energy.get("last_snapshot_commit_at"),
        "last_snapshot_ok": energy.get("last_snapshot_ok"),
        "last_snapshot_rows": energy.get("last_snapshot_rows"),
        "last_snapshot_duration_ms": energy.get("last_snapshot_duration_ms"),
        "next_expected_snapshot": _iso(next_expected),
        "average_duration_ms": None if not durations else round(sum(durations) / len(durations), 1),
        "maximum_duration_ms": None if not durations else round(max(durations), 1),
        "missed_snapshots": missed,
        "success_rate_pct": success_rate,
        "delayed": delayed,
        "history_limit": SNAPSHOT_HISTORY_MAX,
        "history": history[-SNAPSHOT_HISTORY_MAX:],
        "duration_trend_ms": [round(d, 1) for d in durations[-12:]],
    }


GAPFILL_CHECKPOINT_KEY = "energy_gapfill_checkpoint"


def _checkpoint_from_db() -> Optional[str]:
    try:
        from app.crud.installation_settings import get_setting
        from app.database.session import SessionLocal

        db = SessionLocal()
        try:
            row = get_setting(db, GAPFILL_CHECKPOINT_KEY)
        finally:
            db.close()
    except Exception:
        return None
    if row is None or row.setting_value is None:
        return None
    raw = row.setting_value
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
            raw = parsed
        except Exception:
            return raw
    if isinstance(raw, dict):
        raw = raw.get("last_processed_at")
    if not raw or not isinstance(raw, str):
        return None
    return raw


def get_gapfill_view() -> Dict[str, Any]:
    data = read_live_state()
    energy = data.get("energy") if isinstance(data.get("energy"), dict) else {}
    jobs = data.get("jobs") if isinstance(data.get("jobs"), dict) else {}
    gf = jobs.get("gapfill") if isinstance(jobs.get("gapfill"), dict) else {}
    snap = jobs.get("snapshot") if isinstance(jobs.get("snapshot"), dict) else {}
    overlapping = bool(gf.get("running")) and bool(snap.get("running"))
    overlap_events = data.get("overlap_events") if isinstance(data.get("overlap_events"), list) else []

    checkpoint = energy.get("last_gapfill_checkpoint") or _checkpoint_from_db()
    checkpoint_dt = _parse_slot(checkpoint) if checkpoint else None
    backlog_hours = None
    if checkpoint_dt is not None:
        end = _now_naive() - timedelta(minutes=15)
        backlog_hours = max(0.0, round((end - checkpoint_dt).total_seconds() / 3600.0, 2))

    status = gf.get("status") or ("running" if gf.get("running") else "idle")
    return {
        "running": bool(gf.get("running")),
        "status": status,
        "last_checkpoint": checkpoint,
        "last_gapfill_at": energy.get("last_gapfill_at"),
        "windows_repaired": None,
        "rows_repaired": int(energy.get("last_gapfill_energy_filled") or 0)
        + int(energy.get("last_gapfill_occupancy_filled") or 0),
        "energy_filled": energy.get("last_gapfill_energy_filled"),
        "occupancy_filled": energy.get("last_gapfill_occupancy_filled"),
        "duration_ms": energy.get("last_gapfill_duration_ms"),
        "lookback_hours": energy.get("last_gapfill_lookback_hours"),
        "backlog_hours": backlog_hours,
        "deferred_count": int(data.get("gapfill_deferred_count") or 0),
        "overlap_with_snapshot": overlapping,
        "overlap_count": int(data.get("overlap_count") or 0),
        "overlap_events": overlap_events[-OVERLAP_HISTORY_MAX:] if overlap_events else [],
        "last_ok": energy.get("last_gapfill_ok"),
        "error": energy.get("last_gapfill_error"),
    }


def _bootstrap_from_db() -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    from app.database.session import SessionLocal

    db = SessionLocal()
    processors: List[Dict[str, Any]] = []
    totals = {
        "expected_zones": 0,
        "mapped_zones": 0,
        "orphans": 0,
        "missing": 0,
        "completeness_pct": None,
        "complete": False,
    }
    try:
        zone_rows = db.execute(
            text(
                """
                SELECT processor_id, count(*) AS db_zones
                FROM zones
                GROUP BY processor_id
                ORDER BY processor_id
                """
            )
        ).fetchall()
        czs_rows = db.execute(
            text(
                """
                SELECT processor_id,
                       count(*) FILTER (WHERE zone_id IS NOT NULL) AS mapped,
                       count(*) FILTER (WHERE zone_id IS NULL) AS orphans
                FROM current_zone_status
                GROUP BY processor_id
                """
            )
        ).fetchall()
        czs_by_pid = {int(r[0]): (int(r[1] or 0), int(r[2] or 0)) for r in czs_rows if r[0] is not None}
        for row in zone_rows:
            pid = int(row[0])
            db_zones = int(row[1] or 0)
            mapped, orphans = czs_by_pid.get(pid, (0, 0))
            missing = max(0, db_zones - mapped)
            complete = db_zones > 0 and mapped == db_zones and orphans == 0
            processors.append(
                {
                    "processor_id": pid,
                    "db_zones": db_zones,
                    "czs": mapped,
                    "missing": missing,
                    "orphans": orphans,
                    "bootstrap_complete": complete,
                }
            )
            totals["expected_zones"] += db_zones
            totals["mapped_zones"] += mapped
            totals["orphans"] += orphans
            totals["missing"] += missing
        seen = {p["processor_id"] for p in processors}
        for pid, (mapped, orphans) in czs_by_pid.items():
            if pid in seen:
                continue
            processors.append(
                {
                    "processor_id": pid,
                    "db_zones": 0,
                    "czs": mapped,
                    "missing": 0,
                    "orphans": orphans,
                    "bootstrap_complete": mapped == 0 and orphans == 0,
                }
            )
            totals["mapped_zones"] += mapped
            totals["orphans"] += orphans
        expected = totals["expected_zones"]
        mapped = totals["mapped_zones"]
        totals["completeness_pct"] = (
            None if expected <= 0 else round(100.0 * mapped / expected, 2)
        )
        totals["complete"] = expected > 0 and mapped == expected and totals["orphans"] == 0
    except Exception as exc:
        logger.warning("[ops] bootstrap query failed: %s", exc)
        totals["error"] = str(exc)
    finally:
        try:
            db.close()
        except Exception:
            pass
    return processors, totals


def get_bootstrap_view() -> Dict[str, Any]:
    processors, totals = _bootstrap_from_db()
    file_state = read_live_state()
    file_procs = file_state.get("processors") if isinstance(file_state.get("processors"), dict) else {}
    for row in processors:
        extra = file_procs.get(str(row["processor_id"]))
        if isinstance(extra, dict):
            row["last_bootstrap_at"] = extra.get("updated_at")
            row["skipped_unmapped"] = extra.get("skipped_unmapped")
            row["purged_orphans"] = extra.get("purged_orphans")
    return {
        "expected_zones": totals.get("expected_zones"),
        "mapped_zones": totals.get("mapped_zones"),
        "missing_zones": totals.get("missing"),
        "orphans": totals.get("orphans"),
        "completeness_pct": totals.get("completeness_pct"),
        "complete": bool(totals.get("complete")),
        "alert_below_100": not bool(totals.get("complete")),
        "processors": processors,
        "error": totals.get("error"),
    }


def get_processors_view(bootstrap_view: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    now = time.time()
    data = read_live_state()
    file_procs = data.get("processors") if isinstance(data.get("processors"), dict) else {}
    bootstrap = bootstrap_view if bootstrap_view is not None else get_bootstrap_view()
    by_id = {p["processor_id"]: p for p in bootstrap.get("processors") or []}
    rows: List[Dict[str, Any]] = []
    for pid_key, row in file_procs.items():
        if not isinstance(row, dict):
            continue
        try:
            pid = int(pid_key)
        except (TypeError, ValueError):
            continue
        inv = by_id.get(pid) or {}
        zone_age = _age_s(row.get("last_zone_event_epoch"), now)
        area_age = _age_s(row.get("last_area_event_epoch"), now)
        packet_epoch = row.get("last_packet_epoch") or row.get("last_zone_event_epoch") or row.get(
            "last_area_event_epoch"
        )
        packet_age = _age_s(packet_epoch, now)
        try:
            updated_at = float(row.get("updated_at") or 0.0)
        except (TypeError, ValueError):
            updated_at = 0.0
        health = _processor_health(
            bootstrap_complete=bool(inv.get("bootstrap_complete", row.get("bootstrap_complete"))),
            db_zones=int(inv.get("db_zones") or row.get("db_zones") or 0),
            zone_age=zone_age,
            area_age=area_age,
            updated_at=updated_at,
            now=now,
        )
        rows.append(
            {
                "processor_id": pid,
                "db_zones": inv.get("db_zones", row.get("db_zones")),
                "czs": inv.get("czs", row.get("mapped_czs")),
                "missing": inv.get("missing", row.get("missing_zones")),
                "orphans": inv.get("orphans"),
                "bootstrap_complete": inv.get("bootstrap_complete", row.get("bootstrap_complete")),
                "last_zone_event_epoch": row.get("last_zone_event_epoch"),
                "last_area_event_epoch": row.get("last_area_event_epoch"),
                "last_listener_packet_epoch": packet_epoch,
                "zone_event_age_s": None if zone_age is None else round(zone_age, 1),
                "area_event_age_s": None if area_age is None else round(area_age, 1),
                "packet_age_s": None if packet_age is None else round(packet_age, 1),
                "health": health,
            }
        )
    for pid, inv in by_id.items():
        if any(r["processor_id"] == pid for r in rows):
            continue
        rows.append(
            {
                "processor_id": pid,
                "db_zones": inv.get("db_zones"),
                "czs": inv.get("czs"),
                "missing": inv.get("missing"),
                "orphans": inv.get("orphans"),
                "bootstrap_complete": inv.get("bootstrap_complete"),
                "last_zone_event_epoch": None,
                "last_area_event_epoch": None,
                "last_listener_packet_epoch": None,
                "zone_event_age_s": None,
                "area_event_age_s": None,
                "packet_age_s": None,
                "health": "Warning" if not inv.get("bootstrap_complete") else "Healthy",
            }
        )
    rows.sort(key=lambda r: int(r["processor_id"]))
    stale = [r for r in rows if r.get("health") in ("Warning", "Critical")]
    return {
        "processors": rows,
        "stale_count": len([r for r in rows if r.get("health") == "Critical"]),
        "warning_count": len([r for r in rows if r.get("health") == "Warning"]),
        "healthy_count": len([r for r in rows if r.get("health") == "Healthy"]),
        "stale_processors": stale,
    }


def _psutil_process_metrics(pid: Optional[int]) -> Dict[str, Any]:
    out = {"pid": pid, "uptime_s": None, "cpu_percent": None, "ram_mb": None, "status": "unknown"}
    if pid is None:
        out["status"] = "not_found"
        return out
    try:
        import psutil

        proc = psutil.Process(int(pid))
        out["status"] = "running" if proc.is_running() else "stopped"
        out["uptime_s"] = round(max(0.0, time.time() - float(proc.create_time())), 1)
        out["ram_mb"] = round(proc.memory_info().rss / (1024 * 1024), 1)
        out["cpu_percent"] = proc.cpu_percent(interval=None)
    except Exception:
        out["status"] = "unknown"
    return out


def get_runtime_view() -> Dict[str, Any]:
    from app.monitoring.resource_usage_read_model import build_resources_payload
    from app.runtime.process_health import build_process_health

    try:
        from app.monitoring.runtime_bridge import get_runtime_bridge

        bridge = get_runtime_bridge()
        supervisor = getattr(bridge, "supervisor", None) if bridge is not None else None
    except Exception:
        supervisor = None

    process_health = build_process_health(supervisor)
    resources = build_resources_payload()
    children: Dict[str, Any] = {}
    try:
        if supervisor is not None:
            snap = supervisor.status()
            for child in getattr(snap, "children", None) or []:
                data = child.to_dict() if hasattr(child, "to_dict") else {}
                name = data.get("name")
                if name:
                    metrics = _psutil_process_metrics(data.get("pid"))
                    children[str(name)] = {
                        "alive": data.get("alive"),
                        "state": data.get("state"),
                        "pid": data.get("pid"),
                        **metrics,
                    }
    except Exception as exc:
        logger.warning("[ops] supervisor children failed: %s", exc)

    api_metrics = _psutil_process_metrics(os.getpid())
    data = read_live_state()
    jobs = data.get("jobs") if isinstance(data.get("jobs"), dict) else {}
    active = []
    if isinstance(jobs.get("snapshot"), dict) and jobs["snapshot"].get("running"):
        active.append("log_energy_stats")
    if isinstance(jobs.get("gapfill"), dict) and jobs["gapfill"].get("running"):
        active.append("log_energy_gapfill")

    monitoring_uptime = None
    try:
        from app.monitoring.service import get_monitoring_service

        service = get_monitoring_service()
        if service is not None and service.running:
            monitoring_uptime = api_metrics.get("uptime_s")
            queue_length = getattr(service.get_runtime_status(), "queue_length", None)
        else:
            queue_length = 0
    except Exception:
        queue_length = None
        monitoring_uptime = None

    return {
        "process_health": {
            "status": process_health.get("status"),
            "backend": process_health.get("backend"),
            "listener": process_health.get("listener"),
            "energy_logger": process_health.get("energy_logger"),
            "loadcontroller": process_health.get("loadcontroller"),
        },
        "listener": children.get("listener") or {"status": process_health.get("listener")},
        "snapshot": {
            "component": "energy_logger",
            **(children.get("energy_logger") or {}),
            "job_running": "log_energy_stats" in active,
        },
        "gapfill": {
            "component": "energy_logger",
            **(children.get("energy_logger") or {}),
            "job_running": "log_energy_gapfill" in active,
        },
        "loadcontroller": children.get("loadcontroller_listener")
        or {"status": process_health.get("loadcontroller")},
        "monitoring": {
            "uptime_s": monitoring_uptime,
            "queue_length": queue_length,
            "status": "running" if monitoring_uptime is not None else "unavailable",
        },
        "backend": {
            "pid": os.getpid(),
            **api_metrics,
        },
        "scheduler": {
            "queue_depth": len(active),
            "active_jobs": active,
            "max_workers": 2,
        },
        "resources": resources,
    }


def get_database_view() -> Dict[str, Any]:
    from app.database.session import SessionLocal, engine

    db = SessionLocal()
    payload: Dict[str, Any] = {
        "connection_count": None,
        "active_logger_transaction": False,
        "active_gapfill_transaction": False,
        "snapshot_transaction_age_s": None,
        "gapfill_transaction_age_s": None,
        "longest_transaction_age_s": 0.0,
        "blocked_queries": 0,
        "alert_snapshot_tx_long": False,
        "alert_gapfill_tx_long": False,
        "sessions": [],
    }
    try:
        rows = db.execute(
            text(
                """
                SELECT pid, state,
                       extract(epoch FROM (now() - xact_start)) AS xact_age_s,
                       extract(epoch FROM (now() - query_start)) AS query_age_s,
                       wait_event_type, wait_event,
                       left(query, 160) AS query
                FROM pg_stat_activity
                WHERE datname = current_database()
                  AND pid <> pg_backend_pid()
                """
            )
        ).fetchall()
        payload["connection_count"] = len(rows)
        longest = 0.0
        blocked = 0
        sessions = []
        snap_age = None
        gf_age = None
        for row in rows:
            query = (row[6] or "").lower()
            xact_age = float(row[2] or 0.0)
            longest = max(longest, xact_age)
            wait_type = row[4]
            if wait_type == "Lock":
                blocked += 1
            is_energy = "area_energy_stats" in query or "area_occupancy_stats" in query
            is_cas = "current_area_status" in query
            is_gap = "approximated_filler" in query or "gapfill" in query
            if is_energy or is_cas:
                payload["active_logger_transaction"] = True
                if is_cas and not is_gap:
                    snap_age = xact_age if snap_age is None else max(snap_age, xact_age)
            if is_gap:
                payload["active_gapfill_transaction"] = True
                gf_age = xact_age if gf_age is None else max(gf_age, xact_age)
            if xact_age >= 5 and (is_energy or is_cas or is_gap or wait_type == "Lock"):
                sessions.append(
                    {
                        "pid": row[0],
                        "state": row[1],
                        "xact_age_s": round(xact_age, 1),
                        "query_age_s": round(float(row[3] or 0.0), 1),
                        "wait_event": row[5],
                        "query": row[6],
                    }
                )
        payload["longest_transaction_age_s"] = round(longest, 1)
        payload["snapshot_transaction_age_s"] = None if snap_age is None else round(snap_age, 1)
        payload["gapfill_transaction_age_s"] = None if gf_age is None else round(gf_age, 1)
        payload["blocked_queries"] = blocked
        payload["alert_snapshot_tx_long"] = bool(
            snap_age is not None and snap_age > SNAPSHOT_TX_ALERT_SECONDS
        )
        payload["alert_gapfill_tx_long"] = bool(gf_age is not None and gf_age > 600)
        payload["sessions"] = sessions[:20]
        try:
            pool = engine.pool
            payload["pool_checked_out"] = getattr(pool, "checkedout", lambda: None)()
            payload["pool_size"] = getattr(pool, "size", lambda: None)()
        except Exception:
            pass
    except Exception as exc:
        payload["error"] = str(exc)
        logger.warning("[ops] database health query failed: %s", exc)
    finally:
        try:
            db.close()
        except Exception:
            pass
    return payload


def get_overview() -> Dict[str, Any]:
    snapshot_view = get_snapshot_view()
    bootstrap_view = get_bootstrap_view()
    processors_view = get_processors_view(bootstrap_view=bootstrap_view)
    gapfill_view = get_gapfill_view()
    runtime_view = get_runtime_view()
    database_view = get_database_view()
    return {
        "generated_at": _iso(_now_naive()),
        "snapshot": snapshot_view,
        "bootstrap": bootstrap_view,
        "processors": processors_view,
        "gapfill": gapfill_view,
        "runtime": runtime_view,
        "database": database_view,
    }


def evaluate_ops_findings(condition: str) -> List[Dict[str, Any]]:
    """Return alert finding dicts for a named ops condition. Never raises."""
    try:
        if condition == "missed_snapshot":
            view = get_snapshot_view()
            if int(view.get("missed_snapshots") or 0) > 0:
                return [
                    {
                        "fingerprint": "ops:missed_snapshot",
                        "title": "Missed energy snapshot",
                        "message": f"{view['missed_snapshots']} aligned 15-minute snapshot(s) missing.",
                        "detail": {
                            "missed_snapshots": view.get("missed_snapshots"),
                            "last_successful_snapshot": view.get("last_successful_snapshot"),
                            "next_expected_snapshot": view.get("next_expected_snapshot"),
                        },
                    }
                ]
        elif condition == "snapshot_delayed":
            view = get_snapshot_view()
            if view.get("delayed"):
                return [
                    {
                        "fingerprint": "ops:snapshot_delayed",
                        "title": "Energy snapshot delayed",
                        "message": (
                            f"Last successful snapshot {view.get('last_successful_snapshot')} "
                            f"is past the 16-minute delay threshold."
                        ),
                        "detail": {
                            "last": view.get("last_successful_snapshot"),
                            "next": view.get("next_expected_snapshot"),
                        },
                    }
                ]
        elif condition == "bootstrap_incomplete":
            view = get_bootstrap_view()
            if view.get("alert_below_100"):
                return [
                    {
                        "fingerprint": "ops:bootstrap_incomplete",
                        "title": "Bootstrap incomplete",
                        "message": (
                            f"{view.get('mapped_zones')}/{view.get('expected_zones')} zones mapped "
                            f"({view.get('completeness_pct')}%)."
                        ),
                        "detail": {
                            "missing": view.get("missing_zones"),
                            "orphans": view.get("orphans"),
                        },
                    }
                ]
        elif condition == "orphan_czs":
            view = get_bootstrap_view()
            if int(view.get("orphans") or 0) > 0:
                return [
                    {
                        "fingerprint": "ops:orphan_czs",
                        "title": "Orphan current_zone_status rows",
                        "message": f"{view.get('orphans')} CZS rows have no matching zones row.",
                        "detail": {"orphans": view.get("orphans")},
                    }
                ]
        elif condition == "processor_stale":
            view = get_processors_view()
            findings = []
            for row in view.get("processors") or []:
                if row.get("health") == "Critical":
                    findings.append(
                        {
                            "fingerprint": f"ops:processor_stale:{row['processor_id']}",
                            "title": f"Processor {row['processor_id']} stale",
                            "message": (
                                f"Zone event age {row.get('zone_event_age_s')}s "
                                f"(health={row.get('health')})."
                            ),
                            "processor_id": row["processor_id"],
                            "detail": row,
                        }
                    )
            return findings
        elif condition == "listener_stalled":
            runtime = get_runtime_view()
            listener = runtime.get("listener") or {}
            procs = get_processors_view()
            ph = str((runtime.get("process_health") or {}).get("listener") or "").lower()
            listener_status = str(listener.get("status") or ph or "").lower()
            listener_down = listener.get("alive") is False or listener_status in (
                "stopped",
                "dead",
                "abandoned",
                "failed",
            )
            worst_zone = None
            for row in procs.get("processors") or []:
                age = row.get("zone_event_age_s")
                if age is not None:
                    worst_zone = age if worst_zone is None else max(worst_zone, float(age))
            event_stalled = worst_zone is not None and worst_zone > STALE_AREA_EVENT_SECONDS
            if listener_down or event_stalled:
                return [
                    {
                        "fingerprint": "ops:listener_stalled",
                        "title": "Listener stalled",
                        "message": (
                            f"Listener status={listener.get('status') or ph}; "
                            f"worst zone event age {worst_zone}s."
                        ),
                        "detail": {
                            "listener_status": listener.get("status") or ph,
                            "listener_alive": listener.get("alive"),
                            "worst_zone_event_age_s": worst_zone,
                            "stale_count": procs.get("stale_count"),
                        },
                    }
                ]
        elif condition == "gapfill_backlog":
            view = get_gapfill_view()
            backlog = view.get("backlog_hours")
            if backlog is not None and backlog >= GAPFILL_BACKLOG_ALERT_HOURS:
                return [
                    {
                        "fingerprint": "ops:gapfill_backlog",
                        "title": "Gap-fill backlog",
                        "message": f"Checkpoint is {backlog} hours behind.",
                        "detail": {
                            "backlog_hours": view.get("backlog_hours"),
                            "last_checkpoint": view.get("last_checkpoint"),
                            "status": view.get("status"),
                        },
                    }
                ]
        elif condition == "long_transaction":
            view = get_database_view()
            if view.get("alert_snapshot_tx_long") or view.get("alert_gapfill_tx_long"):
                return [
                    {
                        "fingerprint": "ops:long_transaction",
                        "title": "Long database transaction",
                        "message": (
                            f"Snapshot tx {view.get('snapshot_transaction_age_s')}s; "
                            f"gap-fill tx {view.get('gapfill_transaction_age_s')}s "
                            f"(longest session {view.get('longest_transaction_age_s')}s)."
                        ),
                        "detail": {
                            "longest_transaction_age_s": view.get("longest_transaction_age_s"),
                            "snapshot_transaction_age_s": view.get("snapshot_transaction_age_s"),
                            "gapfill_transaction_age_s": view.get("gapfill_transaction_age_s"),
                            "active_logger_transaction": view.get("active_logger_transaction"),
                            "blocked_queries": view.get("blocked_queries"),
                            "connection_count": view.get("connection_count"),
                        },
                    }
                ]
    except Exception as exc:
        logger.warning("[ops] evaluate condition=%s failed: %s", condition, exc)
    return []
