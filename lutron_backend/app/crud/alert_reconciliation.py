"""
Live alert reconciliation — keep dashboard/API/FOFP aligned with LEAP current state.

Active = failing now, not yet solved, visible, and (for drivers) has a real error_code.
Ghosts are cleared by comparing DB not_ok drivers to a full /loadcontroller/status inventory.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional, Sequence, Set, Tuple

from sqlalchemy.orm import Session

from app.models.drivers import Driver
from app.models.processor import Processor
from app.models.sensors_and_modules import SensorAndModule
from app.utils.json_connection import connect_to_processor, recv_json, send_json

logger = logging.getLogger("alert_reconciliation")

_DRIVER_BAD = ("not_ok", "not_okay")


def active_processor_filter_clauses():
    """Processor rows that should appear as active alerts."""
    return (
        Processor.ping_status == "not_ok",
        Processor.display.is_(True),
        Processor.solved_time.is_(None),
    )


def active_device_filter_clauses():
    """Device (sensor/module) rows that should appear as active alerts."""
    return (
        SensorAndModule.alert_status == "not_ok",
        SensorAndModule.display.is_(True),
        SensorAndModule.solved_time.is_(None),
    )


def active_driver_filter_clauses(*, require_area: bool = True):
    """
    Driver rows that should appear as active alerts.

    Requires non-empty error_code so NULL/blank codes are not shown as Other Warnings.
    FOFP keeps require_area=True. Alerts GET uses require_area=False so unmapped
    ballasts still list until LEAP confirms they are healthy.
    """
    clauses = [
        Driver.alert_status.in_(_DRIVER_BAD),
        Driver.display.is_(True),
        Driver.solved_time.is_(None),
        Driver.error_code.isnot(None),
        Driver.error_code != "",
    ]
    if require_area:
        clauses.insert(1, Driver.area_id.isnot(None))
    return tuple(clauses)


def clear_driver_alert(driver: Driver) -> None:
    """Mark a driver alert resolved (keep history via solved_time)."""
    from app.crud.alert import update_alert_timestamps

    update_alert_timestamps(driver, "ok")
    driver.error_code = None
    driver.description = None


# Process-local confirm votes. Two healthy observations required before solved_time.
_driver_clear_votes: Dict[Tuple[Any, ...], int] = {}


def _driver_vote_key(driver: Driver) -> Tuple[Any, ...]:
    return (
        "driver",
        int(getattr(driver, "processor_id", 0) or 0),
        int(getattr(driver, "loadcontroller_code", 0) or 0),
        int(getattr(driver, "id", 0) or 0),
    )


def reset_driver_clear_votes(driver: Driver) -> None:
    _driver_clear_votes.pop(_driver_vote_key(driver), None)


def confirm_and_clear_driver_alert(driver: Driver) -> bool:
    """
    Real solve: second consecutive healthy vote sets solved_time.
    First vote leaves the row not_ok. Does not delete the row.
    """
    key = _driver_vote_key(driver)
    n = _driver_clear_votes.get(key, 0) + 1
    if n >= 2:
        _driver_clear_votes.pop(key, None)
        clear_driver_alert(driver)
        return True
    _driver_clear_votes[key] = n
    return False


def driver_is_healthy_in_full_snapshot(
    driver: Driver,
    healthy_lcs: Set[int],
    live_errors: Optional[Set[int]] = None,
) -> bool:
    """True only if that LC reported a definitive healthy ErrorStatus (empty code+desc).

    Unknown and missing LCs are not healthy — keep active alerts until truly fixed.
    ``live_errors`` is accepted for call-site compatibility but ignored; membership in
    ``healthy_lcs`` is the sole criterion.
    """
    del live_errors  # legacy arg; health is explicit healthy_lcs only
    lc = getattr(driver, "loadcontroller_code", None)
    if lc is None:
        return False
    try:
        lc_i = int(lc)
    except (TypeError, ValueError):
        return False
    return lc_i in healthy_lcs


def _status_has_error(status: dict) -> Tuple[bool, Optional[str], Optional[str], bool]:
    """Return (is_error, code, description, is_unknown) for one LoadControllerStatuses entry."""
    if not isinstance(status, dict):
        return False, None, None, False
    error_info = status.get("ErrorStatus") or {}
    if not isinstance(error_info, dict):
        error_info = {}
    code = error_info.get("ErrorCode")
    desc = error_info.get("Description")
    if code == "Unknown" or desc == "Unknown":
        return False, None, None, True
    empty_code = not code or (isinstance(code, str) and code.strip() == "")
    empty_desc = not desc or (isinstance(desc, str) and desc.strip() == "")
    if empty_code and empty_desc:
        return False, None, None, False
    return True, code, desc, False


def collect_lc_health_from_statuses(
    statuses: Iterable[dict],
) -> Tuple[Set[int], Set[int], Set[int]]:
    """Classify LCs in a status batch: (seen, live_errors, healthy).

    Unknown is in ``seen`` but never in ``healthy`` or ``live_errors``.
    """
    seen: Set[int] = set()
    live_errors: Set[int] = set()
    healthy: Set[int] = set()
    for status in statuses or []:
        if not isinstance(status, dict):
            continue
        lc = _lc_code_from_status(status)
        if lc is None:
            continue
        seen.add(lc)
        is_err, _code, _desc, is_unknown = _status_has_error(status)
        if is_unknown:
            continue
        if is_err:
            live_errors.add(lc)
        else:
            healthy.add(lc)
    return seen, live_errors, healthy


def _lc_code_from_status(status: dict) -> Optional[int]:
    href = status.get("href") if isinstance(status, dict) else None
    if not href:
        return None
    try:
        return int(href.strip("/").split("/")[-2])
    except (ValueError, IndexError, AttributeError, TypeError):
        return None


def device_is_healthy_in_availability_snapshot(
    device: SensorAndModule,
    by_code: Dict[Any, str],
) -> bool:
    """True only if the device is in the map as Available. Empty map is never healthy."""
    if not by_code:
        return False
    code = getattr(device, "device_code", None)
    if code is None:
        return False
    avail = by_code.get(code)
    if avail is None:
        try:
            avail = by_code.get(int(code))
        except (TypeError, ValueError):
            avail = None
    return avail == "Available"


def heal_active_driver_alerts_for_read(db: Session) -> int:
    """Area backfill only. Never writes solved_time."""
    from app.utils.alert_area_path import AreaPathResolver, map_loadcontroller_from_db

    resolver = AreaPathResolver(db)
    rows = (
        db.query(Driver)
        .filter(
            Driver.alert_status.in_(_DRIVER_BAD),
            Driver.solved_time.is_(None),
            Driver.display.is_(True),
        )
        .all()
    )
    healed = 0
    for row in rows:
        if row.area_id is not None or (
            getattr(row, "area_path", None) and str(row.area_path).strip()
        ):
            continue
        if row.processor_id is None or row.loadcontroller_code is None:
            continue
        area_id, area_code, zone_code, area_path = map_loadcontroller_from_db(
            db, row.processor_id, int(row.loadcontroller_code), resolver=resolver
        )
        if not area_id and not area_path:
            continue
        if area_id:
            row.area_id = area_id
        if area_code is not None:
            row.area_code = area_code
        if zone_code is not None:
            row.zone_code = zone_code
        if area_path:
            row.area_path = area_path
            row.area_map_failures = 0
        healed += 1
    return healed


def heal_unmapped_active_device_areas(db: Session) -> int:
    """Fill area_id/area_path on unmapped active devices. Never writes solved_time."""
    from app.utils.alert_area_path import AreaPathResolver, map_area_from_codes

    resolver = AreaPathResolver(db)
    rows = (
        db.query(SensorAndModule)
        .filter(
            SensorAndModule.alert_status == "not_ok",
            SensorAndModule.solved_time.is_(None),
            SensorAndModule.display.is_(True),
        )
        .all()
    )
    healed = 0
    for row in rows:
        if row.area_id is not None or (
            getattr(row, "area_path", None) and str(row.area_path).strip()
        ):
            continue
        area_id, path = map_area_from_codes(
            db, row.processor_id, row.area_code, resolver=resolver
        )
        if not path and not area_id:
            continue
        if area_id:
            row.area_id = area_id
        if path:
            row.area_path = path
            row.area_map_failures = 0
        healed += 1
    return healed


def _normalize_lc(code: Any) -> Optional[int]:
    try:
        return int(code) if code is not None else None
    except (TypeError, ValueError):
        return None


def _build_lc_system_map(
    rows: Sequence[Driver], processor_keys: Dict[int, str]
) -> Dict[int, str]:
    out: Dict[int, str] = {}
    for row in rows:
        sk = getattr(row, "system_key", None) or processor_keys.get(row.processor_id)
        lc = _normalize_lc(row.loadcontroller_code)
        if sk and lc is not None:
            out.setdefault(lc, sk)
    return out


def _driver_alert_identity_key(
    row: Driver,
    processor_keys: Dict[int, str],
    lc_to_sys: Dict[int, str],
) -> Tuple[Any, ...]:
    """Identity for active-alert display partition.

    Same loadcontroller_code on Athena multi-processor → one bucket (global LC),
    so mapped + unmapped twins collapse before dict serialization.
    """
    lc = _normalize_lc(row.loadcontroller_code)
    if lc is not None:
        sk = getattr(row, "system_key", None) or processor_keys.get(row.processor_id)
        if not sk:
            sk = lc_to_sys.get(lc)
        # Prefer system-scoped LC when known; otherwise still collapse by LC globally
        # so proc: twins without system_key do not both appear on the Alerts page.
        if sk:
            return ("sys", sk, lc)
        return ("lc", lc)
    if row.processor_id is not None:
        return ("proc", int(row.processor_id), row.id)
    return ("id", row.id)


def _pick_alert_driver_survivor(rows: Sequence[Driver]) -> Driver:
    def sort_key(r: Driver):
        named = 0 if (getattr(r, "device_name", None) or "").strip() else 1
        has_area = 0 if getattr(r, "area_id", None) is not None else 1
        reported = getattr(r, "reported_time", None)
        if reported is None:
            reported_ord = datetime.max
        else:
            reported_ord = (
                reported.replace(tzinfo=None)
                if getattr(reported, "tzinfo", None)
                else reported
            )
        rid = r.id if r.id is not None else 10**12
        return (named, has_area, reported_ord, rid)

    return min(rows, key=sort_key)


def partition_active_driver_alert_duplicates(
    rows: Sequence[Driver],
    processor_keys: Optional[Dict[int, str]] = None,
) -> Tuple[List[Driver], List[Driver]]:
    """
    Display partition: same LC on two Athena processors → one survivor.

    Identity (sys, system_key, lc); unkeyed orphan joins keyed sibling via LC map.
    Prefer named, then area_id, then earliest reported_time. Does not set solved_time.
    """
    from collections import defaultdict

    keys = processor_keys or {}
    lc_to_sys = _build_lc_system_map(rows, keys)
    groups: Dict[Tuple[Any, ...], List[Driver]] = defaultdict(list)
    for row in rows:
        groups[_driver_alert_identity_key(row, keys, lc_to_sys)].append(row)

    survivors: List[Driver] = []
    losers: List[Driver] = []
    for group in groups.values():
        if len(group) == 1:
            survivors.append(group[0])
            continue
        survivor = _pick_alert_driver_survivor(group)
        survivors.append(survivor)
        losers.extend(r for r in group if r.id != survivor.id)
    return survivors, losers


def heal_duplicate_active_driver_alerts(db: Session) -> int:
    """
    Soft-heal Athena driver twins (migrate / discover only).

    Do not call from GET /alert/active_alerts — that writes solved_time on losers.
    """
    from app.utils.system_identity import processor_system_key_map

    bad = (
        db.query(Driver)
        .filter(
            Driver.alert_status.in_(_DRIVER_BAD),
            Driver.solved_time.is_(None),
            Driver.display.is_(True),
        )
        .all()
    )
    _survivors, losers = partition_active_driver_alert_duplicates(
        bad, processor_system_key_map(db)
    )
    for loser in losers:
        clear_driver_alert(loser)
    return len(losers)


def dedupe_active_drivers_for_lc(
    db: Session, processor_id: int, loadcontroller_code: int, keep: Optional[Driver] = None
) -> int:
    """
    Ensure at most one not_ok driver row per (processor_id, loadcontroller_code).
    Keeps `keep` or the newest row; clears the rest.
    """
    rows = (
        db.query(Driver)
        .filter(
            Driver.processor_id == processor_id,
            Driver.loadcontroller_code == loadcontroller_code,
            Driver.alert_status.in_(_DRIVER_BAD),
            Driver.solved_time.is_(None),
        )
        .order_by(Driver.id.desc())
        .all()
    )
    if not rows:
        return 0
    if keep is None:
        keep = rows[0]
    cleared = 0
    for row in rows:
        if row.id == keep.id:
            continue
        clear_driver_alert(row)
        cleared += 1
    return cleared


# Back-compat alias
_dedupe_active_drivers_for_lc = dedupe_active_drivers_for_lc


def reconcile_drivers_from_status_batch(
    db: Session,
    processor_id: int,
    statuses: Iterable[dict],
    *,
    full_snapshot: bool = False,
) -> Dict[str, int]:
    """
    Apply a LEAP LoadControllerStatuses batch.

    When full_snapshot=True, not_ok drivers whose LC reports a definitive healthy
    ErrorStatus (empty code+desc) are clear-voted (2 confirms). Unknown / missing
    LCs do not clear — alerts stay until truly fixed.
    Partial deltas must pass full_snapshot=False so missing LCs are not wiped.
    """
    status_list = [s for s in (statuses or []) if isinstance(s, dict)]
    seen_lcs, live_error_lcs, healthy_lcs = collect_lc_health_from_statuses(status_list)

    for lc in live_error_lcs:
        # Prefer a single active row for this LC
        keep = (
            db.query(Driver)
            .filter(
                Driver.processor_id == processor_id,
                Driver.loadcontroller_code == lc,
            )
            .order_by(Driver.id.desc())
            .first()
        )
        if keep is not None:
            dedupe_active_drivers_for_lc(db, processor_id, lc, keep=keep)

    cleared_healthy = 0
    cleared_orphan = 0

    if full_snapshot:
        bad_drivers = (
            db.query(Driver)
            .filter(
                Driver.processor_id == processor_id,
                Driver.alert_status.in_(_DRIVER_BAD),
                Driver.solved_time.is_(None),
            )
            .all()
        )
        for driver in bad_drivers:
            if not driver_is_healthy_in_full_snapshot(driver, healthy_lcs):
                # Unknown, absent, or still in error → keep
                continue
            if confirm_and_clear_driver_alert(driver):
                cleared_healthy += 1

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "live_errors": len(live_error_lcs),
        "cleared_healthy": cleared_healthy,
        "cleared_orphan": cleared_orphan,
        "seen_loadcontrollers": len(seen_lcs),
    }


def reconcile_all_processors_from_leap(db: Session) -> Dict[str, Any]:
    """
    ReadRequest /loadcontroller/status for each handshake processor and
    full-snapshot reconcile DB driver alerts.
    """
    processors = db.query(Processor).filter_by(handshake_status=True).all()
    summary: Dict[str, Any] = {
        "processors": 0,
        "live_errors": 0,
        "cleared_healthy": 0,
        "cleared_orphan": 0,
        "errors": [],
    }

    for proc in processors:
        sock = None
        try:
            sock = connect_to_processor(
                ip=proc.ipv4, mac=proc.mac, system=proc.system, processor_ipv4=proc.ipv4
            )
            if not sock:
                summary["errors"].append({"processor_id": proc.id, "error": "connect_failed"})
                continue
            send_json(
                sock,
                {"CommuniqueType": "ReadRequest", "Header": {"Url": "/loadcontroller/status"}},
            )
            resp = recv_json(sock) or {}
            body = resp.get("Body") or {}
            statuses = body.get("LoadControllerStatuses") or []
            if not isinstance(statuses, list):
                statuses = []
            result = reconcile_drivers_from_status_batch(
                db, proc.id, statuses, full_snapshot=True
            )
            summary["processors"] += 1
            summary["live_errors"] += result.get("live_errors", 0)
            summary["cleared_healthy"] += result.get("cleared_healthy", 0)
            summary["cleared_orphan"] += result.get("cleared_orphan", 0)
        except Exception as exc:
            logger.warning("reconcile processor %s failed: %s", proc.id, exc)
            summary["errors"].append({"processor_id": proc.id, "error": str(exc)})
            try:
                db.rollback()
            except Exception:
                pass
        finally:
            if sock:
                try:
                    sock.close()
                except Exception:
                    pass

    return summary


def clear_devices_not_in_inventory(
    db: Session,
    processor_id: int,
    seen_device_codes: Set[Any],
    *,
    processor_ids: Optional[List[int]] = None,
) -> int:
    """
    After a full device discovery, clear not_ok devices that were not present
    in this inventory (ghost Unavailable rows). When processor_ids is set,
    operate across the whole system (shared Athena device database).
    """
    if not seen_device_codes:
        return 0
    # Normalize to comparable strings
    seen = {str(c) for c in seen_device_codes if c is not None}
    scope_ids = processor_ids if processor_ids else [processor_id]
    bad = (
        db.query(SensorAndModule)
        .filter(
            SensorAndModule.processor_id.in_(scope_ids),
            SensorAndModule.alert_status == "not_ok",
            SensorAndModule.solved_time.is_(None),
        )
        .all()
    )
    cleared = 0
    from app.crud.alert import update_alert_timestamps

    for dev in bad:
        code = str(dev.device_code) if dev.device_code is not None else None
        if code is None or code not in seen:
            update_alert_timestamps(dev, "ok")
            cleared += 1
    return cleared


def dedupe_active_devices_by_serial(
    db: Session,
    processor_id: int,
    *,
    processor_ids: Optional[List[int]] = None,
) -> int:
    """
    Keep at most one active (not_ok, unsolved) device row per (device_code, serial)
    across the processor scope. Serial alone is not unique (multi-output devices).
    """
    from collections import defaultdict
    from app.crud.alert import update_alert_timestamps

    scope_ids = processor_ids if processor_ids else [processor_id]
    bad = (
        db.query(SensorAndModule)
        .filter(
            SensorAndModule.processor_id.in_(scope_ids),
            SensorAndModule.alert_status == "not_ok",
            SensorAndModule.solved_time.is_(None),
            SensorAndModule.serial_number.isnot(None),
            SensorAndModule.serial_number != "",
        )
        .order_by(SensorAndModule.id.desc())
        .all()
    )
    by_key: Dict[Tuple[str, str], List[SensorAndModule]] = defaultdict(list)
    for row in bad:
        code = str(row.device_code) if row.device_code is not None else ""
        serial = str(row.serial_number).upper()
        by_key[(code, serial)].append(row)
    cleared = 0
    for rows in by_key.values():
        if len(rows) < 2:
            continue
        for extra in rows[1:]:
            update_alert_timestamps(extra, "ok")
            cleared += 1
    return cleared
