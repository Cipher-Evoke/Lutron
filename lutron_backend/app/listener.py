from __future__ import annotations

import ssl
import json
import asyncio
import logging
import traceback
import os
import time
from asyncio import StreamReader, StreamWriter

from app.database.session import SessionLocal, engine
from app.models import events
from app.models.processor import Processor
from app.models.area import Area
from app.models.zone import Zone
from app.models.activity_report import ActivityReport
from app.models.events import (
    ProcessorAreaEvent,
    ProcessorZoneEvent,
    ProcessorConnectionError,
    ProcessorEvent,
    CurrentAreaEvent,
    CurrentZoneEvent
)
from app.utils.definitions import (
    get_proc_hostname,
    LAP_LUTRON_ROOT_FILE,
    LEAP_SIGNED_CSR_FILE,
    LEAP_PRIVATE_KEY_FILE,
    get_processor_cert_paths,
)
from app.activity_report import log_activity_report_for_zone
from app.activity_report import log_activity_report_for_area
from app.utils.logger import listener_logger
from app.utils.activity_logger import log_activity
from app.models.energy_saving import AreaEnergySavingByStrategy
from app.utils.area_trim_savings import compute_trim_savings_for_area
from app.models.occupancy_logs import OccupancyLog
from datetime import timedelta, datetime, timezone
from sqlalchemy.sql import func

events.Base.metadata.create_all(bind=engine)
shutdown_event = asyncio.Event()
CRLF = b"\r\n"


def _mon_note_stream(processor_id, stream, *, event=False, subscribed=None):
    try:
        from app.monitoring.stream_health import note_stream

        note_stream(
            int(processor_id),
            stream,
            event=event,
            subscribed=subscribed,
        )
    except Exception:
        pass


def _energy_logger_manual() -> bool:
    """True when manual energy logger is enabled (power from zones, not processor area events)."""
    try:
        from app.installation_config import is_energy_logger_manual

        return is_energy_logger_manual()
    except Exception:
        v = (os.getenv("energy_logger_manual") or os.getenv("energy_logger_mannual") or "").strip().lower()
        return v in ("true", "1", "yes")


def _rollup_current_area_power_from_zones(db, processor_id: int) -> None:
    """
    When energy_logger_manual is True: set current_area_status.instantaneous_power and
    instantaneous_max_power from the sum of current_zone_status by area_id.
    Other columns of current_area_status are unchanged.
    """
    # Distinct area_ids that have zone status for this processor
    area_ids = [
        r[0]
        for r in db.query(CurrentZoneEvent.area_id)
        .filter(
            CurrentZoneEvent.processor_id == processor_id,
            CurrentZoneEvent.area_id.isnot(None),
        )
        .distinct()
        .all()
    ]
    if not area_ids:
        return
    areas_updated = 0
    for area_id in area_ids:
        sums = (
            db.query(
                func.coalesce(func.sum(CurrentZoneEvent.zone_instantaneous_power), 0).label("ip"),
                func.sum(CurrentZoneEvent.zone_instantaneous_max_power).label("imp"),
            )
            .filter(
                CurrentZoneEvent.processor_id == processor_id,
                CurrentZoneEvent.area_id == area_id,
            )
            .first()
        )
        if not sums or (sums.ip is None and sums.imp is None):
            continue
        area = db.query(Area).filter(Area.id == area_id).first()
        if not area or area.code is None:
            continue
        try:
            area_code = int(area.code)
        except (TypeError, ValueError):
            continue
        current = db.query(CurrentAreaEvent).filter_by(
            processor_id=processor_id,
            area_code=area_code,
        ).first()
        inst_power = float(sums.ip) if sums.ip is not None else None
        inst_max_power = float(sums.imp) if sums.imp is not None else None
        if inst_max_power is None:
            continue
        if current:
            current.instantaneous_power = inst_power
            current.instantaneous_max_power = inst_max_power
            areas_updated += 1
        else:
            current = CurrentAreaEvent(
                processor_id=processor_id,
                area_id=area_id,
                area_href=f"/area/{area_code}/status",
                area_code=area_code,
                instantaneous_power=inst_power,
                instantaneous_max_power=inst_max_power,
            )
            db.add(current)
            areas_updated += 1
    try:
        db.commit()
    except Exception:
        db.rollback()

# Button activity logger completely disabled - file logging removed
# Track most recent button event with age counter
recent_button_event = None  # {"code": int, "activity": str, "age": int}

# Processor-specific logger management
processor_loggers = {}
logs_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "logs"))

def get_processor_logger(processor_id):
    """Get or create a logger for a specific processor (console output only, file logging disabled)"""
    if processor_id in processor_loggers:
        logger = processor_loggers[processor_id]
        # Keep production floor at WARNING even if an older handler was cached.
        logger.setLevel(logging.WARNING)
        for handler in logger.handlers:
            handler.setLevel(logging.WARNING)
        return logger
    
    # File logging disabled - removed logs directory creation and file handler
    # Ensure logs directory exists
    # os.makedirs(logs_dir, exist_ok=True)
    
    # Create logger for this processor
    logger = logging.getLogger(f"listener_processor_{processor_id}")
    # Production: only WARN/ERROR on console (no per-message INFO dumps).
    logger.setLevel(logging.WARNING)
    logger.propagate = False
    logger.handlers.clear()
    
    # File logging disabled - removed file handler
    # File handler - one file per processor
    # log_file = os.path.join(logs_dir, f"listener-processor-{processor_id}.log")
    # file_handler = logging.FileHandler(log_file, encoding='utf-8')
    # file_handler.setLevel(logging.INFO)
    file_formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] %(message)s", "%Y-%m-%d %H:%M:%S")
    # file_handler.setFormatter(file_formatter)
    # logger.addHandler(file_handler)
    
    # Console handler - WARN/ERROR only
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.WARNING)
    console_handler.setFormatter(file_formatter)
    logger.addHandler(console_handler)
    
    processor_loggers[processor_id] = logger
    return logger

def log_processor(processor_id, message, level=logging.INFO):
    """Log message for a specific processor (to both file and console)"""
    logger = get_processor_logger(processor_id)
    logger.log(level, message)


def _zone_code_from_href(href) -> int | None:
    """Parse LEAP zone hrefs: /zone/{id} and /zone/{id}/status."""
    if not href or not isinstance(href, str):
        return None
    parts = href.strip("/").split("/")
    if len(parts) >= 2 and parts[0] == "zone":
        try:
            return int(parts[1])
        except (TypeError, ValueError, IndexError):
            return None
    return None


def _db_area_codes_for_processor(db, processor_id):
    rows = (
        db.query(Area.code)
        .filter(Area.processor_id == processor_id, Area.code.isnot(None))
        .all()
    )
    codes = []
    for row in rows:
        code = row[0]
        if code is None:
            continue
        text = str(code).strip()
        if text:
            codes.append(text)
    return codes


def _processor_db_zones_count(db, processor_id) -> int:
    return db.query(func.count(Zone.id)).filter(Zone.processor_id == processor_id).scalar() or 0


def _processor_mapped_czs_count(db, processor_id) -> int:
    return (
        db.query(func.count(CurrentZoneEvent.id))
        .filter(
            CurrentZoneEvent.processor_id == processor_id,
            CurrentZoneEvent.zone_id.isnot(None),
        )
        .scalar()
        or 0
    )


def _processor_orphan_czs_count(db, processor_id) -> int:
    return (
        db.query(func.count(CurrentZoneEvent.id))
        .filter(
            CurrentZoneEvent.processor_id == processor_id,
            CurrentZoneEvent.zone_id.is_(None),
        )
        .scalar()
        or 0
    )


def processor_inventory_complete(db, processor_id) -> bool:
    db_n = _processor_db_zones_count(db, processor_id)
    mapped = _processor_mapped_czs_count(db, processor_id)
    orphans = _processor_orphan_czs_count(db, processor_id)
    return db_n > 0 and mapped == db_n and orphans == 0


def _reconcile_processor_inventory(db, processor_id) -> dict:
    db_zones = _processor_db_zones_count(db, processor_id)
    mapped_czs = _processor_mapped_czs_count(db, processor_id)
    orphans = _processor_orphan_czs_count(db, processor_id)
    missing = max(0, db_zones - mapped_czs)
    zoned_area_ids = {
        r[0]
        for r in db.query(Zone.area_id)
        .filter(Zone.processor_id == processor_id, Zone.area_id.isnot(None))
        .distinct()
        .all()
        if r[0] is not None
    }
    cas_area_ids = {
        r[0]
        for r in db.query(CurrentAreaEvent.area_id)
        .filter(
            CurrentAreaEvent.processor_id == processor_id,
            CurrentAreaEvent.area_id.isnot(None),
        )
        .all()
        if r[0] is not None
    }
    rollup_missing = len(zoned_area_ids - cas_area_ids)
    complete = db_zones > 0 and mapped_czs == db_zones and orphans == 0
    return {
        "db_zones": db_zones,
        "mapped_czs": mapped_czs,
        "orphans": orphans,
        "missing_zones": missing,
        "rollup_candidates": len(zoned_area_ids),
        "rollup_missing": rollup_missing,
        "bootstrap_complete": complete,
    }


def _purge_unmapped_czs_for_processor(db, processor_id) -> int:
    """Remove CZS rows for this processor that are not in zones.(processor_id, code)."""
    valid_codes = {
        str(row[0])
        for row in db.query(Zone.code).filter(Zone.processor_id == processor_id).all()
        if row[0] is not None
    }
    rows = (
        db.query(CurrentZoneEvent)
        .filter(CurrentZoneEvent.processor_id == processor_id)
        .all()
    )
    deleted = 0
    seen_codes = set()
    for row in rows:
        code = str(row.zone_code) if row.zone_code is not None else ""
        duplicate = bool(code) and code in seen_codes
        if row.zone_id is None or not code or code not in valid_codes or duplicate:
            db.delete(row)
            deleted += 1
            continue
        seen_codes.add(code)
    if deleted:
        try:
            db.commit()
        except Exception:
            db.rollback()
            return 0
    return deleted


def _publish_processor_inventory_health(processor_id, stats: dict, extra: dict | None = None) -> None:
    try:
        from app.live_state_health import update_processor

        payload = dict(stats)
        if extra:
            payload.update(extra)
        update_processor(int(processor_id), **payload)
    except Exception:
        pass


_last_stream_health_write = {}


def _note_processor_stream_event(processor_id, stream: str) -> None:
    now_mono = time.monotonic()
    key = (int(processor_id), stream)
    last = _last_stream_health_write.get(key, 0.0)
    if last and (now_mono - last) < 15.0:
        return
    _last_stream_health_write[key] = now_mono
    field = "last_zone_event_epoch" if stream == "zone" else "last_area_event_epoch"
    now_epoch = time.time()
    try:
        from app.live_state_health import update_processor

        update_processor(
            int(processor_id),
            **{field: now_epoch, "last_packet_epoch": now_epoch},
        )
    except Exception:
        pass

def get_button_info_for_event():
    global recent_button_event
    if recent_button_event:
        if recent_button_event["age"] <= 3:  # allow for 2-3 events, max 4
            return recent_button_event["code"], recent_button_event["activity"]
    return None, None

# ---------------------- Socket Helpers ---------------------- #
async def _send_json(writer: StreamWriter, json_msg: dict):
    try:
        msg = (json.dumps(json_msg) + "\r\n").encode("utf-8")
        writer.write(msg)
        await writer.drain()
    except Exception as e:
        listener_logger.error(f"[SEND ERROR] {e}")

async def _recv_raw(reader: StreamReader) -> list:
    try:
        buffer = b""
        while not buffer.endswith(CRLF):
            chunk = await reader.read(4096)
            if not chunk:
                break
            buffer += chunk
        messages = buffer.split(CRLF)
        return [m.decode("utf-8", errors="replace").strip() for m in messages if m.strip()]
    except Exception as e:
        listener_logger.error(f"[RECV ERROR] {e}")
        return []


# ---------------------- Discovery + Button Subscription ---------------------- #
async def discover_and_subscribe_buttons(reader: StreamReader, writer: StreamWriter, db=None, processor_id=None):
    # Inventory and control-station walks use DB areas for this processor only.
    # LEAP /area is not used: it returns sibling-processor loads on dual-processor floors.
    area_ids = []
    if db is not None and processor_id is not None:
        area_ids = _db_area_codes_for_processor(db, processor_id)

    if db is not None and processor_id is not None:
        await fetch_and_apply_zone_status_for_processor(reader, writer, db, processor_id)

    # Step 2: Get device IDs from control stations
    device_ids = set()
    for area_id in area_ids:
        await _send_json(writer, {
            "CommuniqueType": "ReadRequest",
            "Header": {"Url": f"/area/{area_id}/associatedcontrolstation"}
        })
        responses = await _recv_raw(reader)
        for chunk in responses:
            try:
                data = json.loads(chunk)
                stations = data.get("Body", {}).get("ControlStations", [])
                for cs in stations:
                    for ganged in cs.get("AssociatedGangedDevices", []):
                        href = ganged.get("Device", {}).get("href", "")
                        if href:
                            device_ids.add(href.split("/")[-1])
            except Exception:
                pass

    # Step 3: Expand devices and extract buttons
    buttons = set()
    for dev_id in device_ids:
        await _send_json(writer, {
            "CommuniqueType": "ReadRequest",
            "Header": {"Url": f"/device/{dev_id}/buttongroup/expanded"}
        })
        responses = await _recv_raw(reader)
        for chunk in responses:
            try:
                data = json.loads(chunk)
                groups = data.get("Body", {}).get("ButtonGroupsExpanded", [])
                for group in groups:
                    for button in group.get("Buttons", []):
                        btn_href = button.get("href")
                        if btn_href:
                            buttons.add(btn_href)
            except Exception:
                pass

    # Subscribe to area/zone/ping
    fixed_endpoints = ["/area/status", "/zone/status", "/server/status/ping"]
    for url in fixed_endpoints:
        await _send_json(writer, {
            "CommuniqueType": "SubscribeRequest",
            "Header": {"Url": url}
        })
    _mon_note_stream(processor_id, "area", subscribed=True)
    _mon_note_stream(processor_id, "zone", subscribed=True)

    # Subscribe to each button's status event
    for btn in sorted(buttons):
        await _send_json(writer, {
            "CommuniqueType": "SubscribeRequest",
            "Header": {"Url": f"{btn}/status/event"}
        })


# ---------------------- Event Handlers ---------------------- #
def log_keypad_or_listener_activity(db, area=None, zone=None, button_code=None, button_activity=None):
    desc = None
    act_type = None

    if button_code and button_activity:
        # Keypad-triggered event
        if zone:
            desc = f"Switch state changed in zone {zone.name}"
            act_type = "Keypad"
        elif area:
            desc = "Change in scene of the area"
            act_type = "Keypad"
        else:
            # Button event without resolved zone/area; nothing to log safely.
            return
    else:
        # Listener-triggered event
        if zone:
            desc = f"Switch state changed in zone {zone.name}"
            act_type = "Zone Listener"
        elif area:
            desc = "Change in scene of the area"
            act_type = "Area Listener"
        else:
            return

    if not act_type or not desc:
        return
    log_activity(
        db,
        area_id=area.id if area else (zone.area_id if zone else None),
        activity_type=act_type,
        activity_description=desc
    )


from app.utils.activity_report_logger import activity_report_log


# ---------------- Strategy Classifier ---------------- #
def classify_strategy_for_area(db, code: int, processor_id: int = None):
    """
    Fetch last 20 logs for this area_code and classify.
    
    Note: If processor_id provided, filters by area_id for accuracy.
    Otherwise falls back to area_code only (may be ambiguous if same code exists on multiple processors).

    Rules:
      - Device Control → Keypad
      - Schedule → Schedule
      - User (only if sub_activity_type exists) → GUI
      - Occupancy → Sensors
      - Fallback: Lights/Scene → Sensors
      - Otherwise → None
    """
    # If processor_id provided, get area_id for precise filtering
    if processor_id is not None:
        area = db.query(Area).filter(Area.code == str(code), Area.processor_id == processor_id).first()
        if area:
            recent_reports = (
                db.query(ActivityReport)
                .filter(ActivityReport.area_id == area.id)
                .order_by(ActivityReport.created_at.desc())
                .limit(20)
                .all()
            )
        else:
            return None, None
    else:
        # Fallback: filter by area_code only (may be ambiguous)
        recent_reports = (
            db.query(ActivityReport)
            .filter(ActivityReport.area_code == str(code))
            .order_by(ActivityReport.created_at.desc())
            .limit(20)
            .all()
        )

    if not recent_reports:
        return None, None

    for report in recent_reports:
        if report.activity_type == "Device Control":
            return report, "Keypad"

        if report.activity_type == "Schedule":
            return report, "Schedule"

        if report.activity_type == "User" and report.sub_activity_type:
            return report, "GUI"

        if report.activity_type == "Occupancy":
            return report, "Sensors"

    # ---- Fallback check for Lights/Scene ----
    for report in recent_reports:
        if report.activity_type in ["Lights", "Scene"]:
            return report, "Sensors"

    return None, None


# ---------------- Occupancy Logging Function ---------------- #
def log_occupancy_to_table(msg, db, processor_id):
    """
    Fetches occupancy-related logs from area status messages (similar to check_area_occupancy)
    and stores them in occupancy_logs table.
    
    When occupancy status changes, calculates the time difference between present log and previous log
    and updates the timespan of the previous log entry.
    
    Args:
        msg: Message dictionary containing AreaStatuses
        db: Database session
        processor_id: ID of the processor
    """
    area_statuses = msg.get("AreaStatuses", [])
    for area_status in area_statuses:
        href = area_status.get("href")
        code = int(href.strip("/").split("/")[-2]) if href else None
        area = db.query(Area).filter_by(code=str(code), processor_id=processor_id).first()
        
        # Extract occupancy status
        occupancy_status = area_status.get("OccupancyStatus")
        
        # Only process valid occupancy statuses
        if not occupancy_status or occupancy_status not in ["Occupied", "Unoccupied"]:
            continue
        
        # Get current time - use naive datetime (local time) to match database storage
        # Remove microseconds to store as HH:MM:SS format (no milliseconds)
        current_time = datetime.now().replace(microsecond=0)  # Local time, naive datetime, rounded to seconds
        event_date = current_time.date()
        
        # Extract area information
        area_id = area.id if area else None
        area_code_str = str(code) if code else None
        floor_id = area.floor_id if area else None
        
        try:
            # Find the previous occupancy log for this EXACT area/processor
            # Must use area_code and processor_id (these are the primary identifiers)
            # area_id is derived from these fields
            if not area_code_str:
                # Can't identify area without area_code, skip
                continue
            
            query = db.query(OccupancyLog).filter(
                OccupancyLog.processor_id == processor_id,
                OccupancyLog.area_code == area_code_str
            )
            
            # Get the most recent log for THIS specific area with a valid status
            # Query without time constraint first, then validate time order
            previous_log = query.filter(
                OccupancyLog.occupation_status.isnot(None),
                OccupancyLog.occupation_status != ""
            ).order_by(
                OccupancyLog.event_time.desc().nulls_last(),
                OccupancyLog.id.desc()
            ).first()
            
            # Skip logging if status hasn't changed (unless this is the first log for this area)
            # This is the PRIMARY check - same status for same area should be skipped
            if previous_log and previous_log.occupation_status == occupancy_status:
                continue  # Skip logging if status hasn't changed
            
            # Additional duplicate check: same area_code, processor_id, and exact same event_time
            # This prevents duplicate entries from rapid successive messages with same timestamp
            duplicate_check = query.filter(
                OccupancyLog.event_time == current_time,
                OccupancyLog.occupation_status == occupancy_status
            ).first()
            
            if duplicate_check:
                continue  # Skip this duplicate entry
            
            # Calculate count based on the most recent log entry (regardless of area)
            # This represents the running total of occupied areas
            latest_log = db.query(OccupancyLog).order_by(
                OccupancyLog.event_time.desc().nulls_last(),
                OccupancyLog.id.desc()
            ).first()
            
            # Get the count from the latest log, or start at 0 if no logs exist
            current_count = latest_log.count if latest_log and latest_log.count is not None else 0
            
            # Update count based on occupancy status change
            # Only increment/decrement when status actually changes
            if not previous_log:
                # First log for this area - increment if Occupied
                if occupancy_status == "Occupied":
                    new_count = current_count + 1
                else:
                    new_count = current_count
            elif previous_log.occupation_status != occupancy_status:
                # Status changed - update count accordingly
                if occupancy_status == "Occupied":
                    new_count = current_count + 1
                elif occupancy_status == "Unoccupied":
                    new_count = max(0, current_count - 1)  # Ensure count doesn't go below 0
                else:
                    new_count = current_count
            else:
                # Status unchanged (shouldn't reach here due to continue above, but just in case)
                new_count = current_count
            
            # Create new occupancy log entry FIRST (so we can use its actual stored time for comparison)
            # Extract time component (HH:MM:SS format, no microseconds)
            event_time_only = current_time.time()  # Already rounded to seconds since current_time has microsecond=0
            
            new_log = OccupancyLog(
                processor_id=processor_id,
                area_id=area_id,
                area_code=area_code_str,
                floor_id=floor_id,
                occupation_status=occupancy_status,
                event_date=event_date,
                event_time=current_time,  # Already rounded to seconds (no microseconds)
                time=event_time_only,  # HH:MM:SS format (no microseconds)
                count=new_count
            )
            
            db.add(new_log)
            db.flush()  # Flush to get the ID and ensure it's in the session
            
            # Now check if we should update previous log's timespan
            # Refresh previous_log from DB to get actual stored time (handles timezone conversions)
            if previous_log:
                db.refresh(previous_log)  # Refresh to get actual stored values from DB
            
            # Use the stored event_time for the new log (after flush, this is what will be stored)
            # Both times should be naive datetime (local time) as stored by database
            actual_new_log_time = new_log.event_time
            
            # If there's a previous log and the status has changed, update its timespan
            if previous_log and previous_log.occupation_status != occupancy_status:
                # Calculate time difference between new log time and previous log time
                # This represents how long the previous status lasted
                if previous_log.event_time:
                    # Both times should be naive datetime (local time) - compare directly
                    prev_time = previous_log.event_time
                    # Ensure both are naive datetime for comparison
                    if prev_time.tzinfo is not None:
                        # If somehow timezone-aware, convert to naive by using local time
                        prev_time = prev_time.replace(tzinfo=None)
                    if actual_new_log_time.tzinfo is not None:
                        actual_new_log_time = actual_new_log_time.replace(tzinfo=None)
                    
                    # Verify that new log time is actually after prev_time
                    if actual_new_log_time <= prev_time:
                        listener_logger.warning(
                            f"[OCCUPANCY LOG] New log time ({actual_new_log_time}) is not after previous time ({prev_time}) "
                            f"for Area {area_id or area_code_str} (P{processor_id}) - likely out-of-order events"
                        )
                        # Still keep the log, just skip timespan update
                    else:
                        # Calculate time difference: actual_new_log_time - prev_time gives duration of previous status
                        time_diff = actual_new_log_time - prev_time
                        total_seconds = int(time_diff.total_seconds())
                        
                        # Ensure positive value
                        if total_seconds < 0:
                            listener_logger.warning(
                                f"[OCCUPANCY LOG] Negative timespan detected: {total_seconds}s "
                                f"for Area {area_id or area_code_str} (P{processor_id})"
                            )
                            total_seconds = abs(total_seconds)
                        
                        # Update the previous log's timespan with the calculated duration (as integer seconds)
                        previous_log.timespan = total_seconds
            
            # Commit the new log entry (and timespan update if it was prepared)
            try:
                db.commit()
                listener_logger.debug(
                    f"[OCCUPANCY LOG] Created new log for Area {area_code_str} (area_id={area_id}) "
                    f"(P{processor_id}), Status: {occupancy_status}, Time: {actual_new_log_time}"
                )
            except Exception as commit_error:
                db.rollback()
                listener_logger.error(
                    f"[OCCUPANCY LOG] Error creating log: {commit_error} "
                    f"for Area {area_code_str} (area_id={area_id}) (P{processor_id})"
                )
                raise
        
        except Exception as e:
            db.rollback()
            listener_logger.error(f"[OCCUPANCY LOG ERROR] Area {code} (P{processor_id}): {e}")


# ---------------- Main Function ---------------- #
def check_area_occupancy(msg, db, processor_id):
    global recent_button_event

    area_statuses = msg.get("AreaStatuses", [])

    for area_status in area_statuses:
        href = area_status.get("href")
        code = int(href.strip("/").split("/")[-2]) if href else None
        area = db.query(Area).filter_by(code=str(code), processor_id=processor_id).first()

        button_code, button_activity = get_button_info_for_event()
        if recent_button_event:
            recent_button_event["age"] += 1

        # ---------- Processor Event ----------
        db_event = ProcessorAreaEvent(
            processor_id=processor_id,
            area_id=area.id if area else None,
            area_href=href,
            area_code=code,
            level=area_status.get("Level"),
            occupancy_status=area_status.get("OccupancyStatus", "Unknown"),
            current_scene_href=(area_status.get("CurrentScene") or {}).get("href"),
            current_scene_code=int((area_status.get("CurrentScene") or {}).get("href", "/0").split("/")[-1])
                if (area_status.get("CurrentScene") and area_status.get("CurrentScene").get("href")) else None,
            instantaneous_power=area_status.get("InstantaneousPower"),
            instantaneous_max_power=area_status.get("InstantaneousMaxPower"),
            button_code=button_code,
            button_activity=button_activity,
        )
        db.add(db_event)

        try:
            db.flush()
            db.add(
                ProcessorEvent(
                    processor_id=processor_id,
                    event_type="area",
                    event_reference_id=db_event.id,
                )
            )
            db.commit()
        except Exception:
            db.rollback()

        occ_status = area_status.get("OccupancyStatus")

        # Only log generic lights if no zones are mapped to this area (avoid duplication)
        has_zones = db.query(Zone).filter(Zone.area_id == (area.id if area else None)).first()

        resolved_area_name = ""
        if area is None:
            resolved_area_name = f"Unknown Area ({code})"
        elif area.floor:
            resolved_area_name = f"{area.floor.name} / {area.name}"
        else:
            resolved_area_name = area.name

        if (area_status.get("Level") is not None or area_status.get("InstantaneousPower") is not None) and not has_zones:
            activity_report_log(
                db=db,
                user_id=None,
                area_id=area.id if area else None,
                activity_type="Lights",
                activity_description="Light status changed",
                area_name=resolved_area_name,
            )

        # ---------- Energy Saving Strategy ----------
        instantaneous_power = area_status.get("InstantaneousPower")
        instantaneous_max_power = area_status.get("InstantaneousMaxPower")

        if instantaneous_power is not None and instantaneous_max_power is not None:
            chosen_report, strategy_type = classify_strategy_for_area(db, code, processor_id)
            if not chosen_report or not strategy_type:
                continue

            now_utc = datetime.now(timezone.utc)

            # --- Controller Types (Schedule, Keypad, GUI) ---
            if strategy_type in {"Schedule", "Keypad", "GUI"}:
                prev_entry = db.query(AreaEnergySavingByStrategy).filter(
                    AreaEnergySavingByStrategy.area_code == code,
                    AreaEnergySavingByStrategy.processor_id == processor_id,
                    AreaEnergySavingByStrategy.strategy_type == strategy_type,
                    AreaEnergySavingByStrategy.time_elapsed_in_sec.is_(None),
                ).order_by(AreaEnergySavingByStrategy.created_at.desc()).first()

                # Close previous if exists
                if prev_entry:
                    prev_created_utc = prev_entry.created_at.astimezone(timezone.utc)
                    time_diff_seconds = max(0, int((now_utc - prev_created_utc).total_seconds()))
                    prev_entry.time_elapsed_in_sec = time_diff_seconds
                    time_diff_hours = time_diff_seconds / 3600.0
                    prev_entry.energy_consumed_in_Wh = instantaneous_power * time_diff_hours
                    prev_entry.energy_saved_in_Wh = (instantaneous_max_power - instantaneous_power) * time_diff_hours
                    prev_entry.total_energy = (prev_entry.energy_consumed_in_Wh or 0) + (prev_entry.energy_saved_in_Wh or 0)
                    trim_watts = compute_trim_savings_for_area(db, code, processor_id)
                    prev_entry.trim_savings = trim_watts * time_diff_hours

                # Insert new entry (open interval; trim_savings Wh applied when this row is closed)
                new_entry = AreaEnergySavingByStrategy(
                    area_code=code,
                    processor_id=processor_id,  # Added for multi-processor support
                    instantaneous_power=instantaneous_power,
                    instantaneous_max_power=instantaneous_max_power,
                    activity_report_id=chosen_report.id,
                    last_activity=chosen_report.activity_type,
                    activity_description=chosen_report.sub_activity_type,
                    strategy_type=strategy_type,
                    trim_savings=None,
                )
                db.add(new_entry)

            # --- Sensors (continuous updates) ---
            elif strategy_type == "Sensors":
                prev_entry = db.query(AreaEnergySavingByStrategy).filter(
                    AreaEnergySavingByStrategy.area_code == code,
                    AreaEnergySavingByStrategy.processor_id == processor_id,
                    AreaEnergySavingByStrategy.strategy_type == "Sensors",
                    AreaEnergySavingByStrategy.time_elapsed_in_sec.is_(None),
                ).order_by(AreaEnergySavingByStrategy.created_at.desc()).first()

                if prev_entry:
                    prev_created_utc = prev_entry.created_at.astimezone(timezone.utc)
                    time_diff_seconds = max(0, int((now_utc - prev_created_utc).total_seconds()))
                    prev_entry.time_elapsed_in_sec = time_diff_seconds
                    time_diff_hours = time_diff_seconds / 3600.0
                    prev_entry.energy_consumed_in_Wh = instantaneous_power * time_diff_hours
                    prev_entry.energy_saved_in_Wh = (instantaneous_max_power - instantaneous_power) * time_diff_hours
                    prev_entry.total_energy = (prev_entry.energy_consumed_in_Wh or 0) + (prev_entry.energy_saved_in_Wh or 0)
                    trim_watts = compute_trim_savings_for_area(db, code, processor_id)
                    prev_entry.trim_savings = trim_watts * time_diff_hours
                else:
                    new_entry = AreaEnergySavingByStrategy(
                        area_code=code,
                        processor_id=processor_id,  # Added for multi-processor support
                        instantaneous_power=instantaneous_power,
                        instantaneous_max_power=instantaneous_max_power,
                        activity_report_id=chosen_report.id,
                        last_activity=chosen_report.activity_type,
                        activity_description=chosen_report.sub_activity_type,
                        strategy_type="Sensors",
                        trim_savings=None,
                    )
                    db.add(new_entry)

            try:
                db.commit()
            except Exception:
                db.rollback()

        # ---------- Current State Maintenance ----------
        try:
            current = db.query(CurrentAreaEvent).filter_by(processor_id=processor_id, area_code=code).first()
            old_occupancy = current.occupancy_status if current else None
            old_scene = current.current_scene_code if current else None

            # ---------- STEP 1: Validate Data Before Update ----------
            occupancy_status = area_status.get("OccupancyStatus")
            manual_energy = _energy_logger_manual()
            
            # Validate occupancy: Only accept "Occupied" or "Unoccupied"
            should_update_occupancy = occupancy_status in ["Occupied", "Unoccupied"]
            
            # Validate power: Only update if instantaneous_max_power is NOT NULL
            # This protects energy calculations that require max_power
            should_update_power = (instantaneous_max_power is not None)
            
            # ---------- STEP 2: Build Fields Dictionary (Only Valid Fields) ----------
            fields = {
                "area_id": area.id if area else None,
                "area_href": href,
                "area_code": code,
            }
            
            # Add scene fields (always update if present)
            scene_href = (area_status.get("CurrentScene") or {}).get("href")
            if scene_href is not None:
                fields["current_scene_href"] = scene_href
                fields["current_scene_code"] = int(scene_href.split("/")[-1]) if scene_href and "/" in scene_href else None
            
            # Add occupancy only if valid (Occupied or Unoccupied)
            if should_update_occupancy:
                fields["occupancy_status"] = occupancy_status
            
            # Add power data only if max_power is valid (not NULL) and NOT manual mode
            # When energy_logger_manual is True, area power comes from zone rollup only
            if should_update_power and not manual_energy:
                fields["instantaneous_power"] = instantaneous_power
                fields["instantaneous_max_power"] = instantaneous_max_power
            
            # ---------- STEP 3: Update or Create Record ----------
            if current:
                # Update existing record with validated fields only
                for k, v in fields.items():
                    setattr(current, k, v)
            else:
                # Create new record with validated fields only
                current = CurrentAreaEvent(
                    processor_id=processor_id,
                    **fields
                )
                db.add(current)

            db.commit()

            if area and area.floor_id:
                try:
                    from app.heatmap.live_notify import publish_heatmap_live_event

                    publish_heatmap_live_event(floor_id=area.floor_id, area_id=area.id)
                except Exception:
                    pass

            # ---------- STEP 4: Activity Logging (Unchanged) ----------
            if old_occupancy != current.occupancy_status:
                log_activity_report_for_area(db, current, "Occupancy")
            if old_scene != current.current_scene_code:
                log_activity_report_for_area(db, current, "Scene")
            
            # ---------- STEP 5: Log Rejected Updates (For Monitoring) ----------
            if not should_update_occupancy and occupancy_status is not None:
                listener_logger.warning(
                    f"[REJECTED OCCUPANCY] Area {code} (P{processor_id}): "
                    f"value='{occupancy_status}' (only 'Occupied'/'Unoccupied' accepted)"
                )
            
        except Exception:
            db.rollback()

from app.activity_report import get_area_full_path

async def check_button_status(reader, writer, body, db, processor_id):
    """
    Handle OneButtonStatusEvent and log into ActivityReport with full button details.
    Resolves the correct area path by walking Button -> ButtonGroup -> Device -> Area.
    """
    try:
        btn_status = body.get("ButtonStatus", {})
        btn_href = btn_status.get("Button", {}).get("href")
        event_type = btn_status.get("ButtonEvent", {}).get("EventType")

        if not btn_href or not event_type:
            return

        # Extract button ID
        btn_id = btn_href.strip("/").split("/")[-1]

        # --- Step 1: Send ReadRequest to get Name + Engraving + Parent (ButtonGroup) ---
        await _send_json(writer, {
            "CommuniqueType": "ReadRequest",
            "Header": {"Url": btn_href}
        })
        resp_chunks = await _recv_raw(reader)

        btn_name, engraving, btn_def = f"Button {btn_id}", "", {}
        for chunk in resp_chunks:
            try:
                data = json.loads(chunk)
                if data.get("Header", {}).get("MessageBodyType") == "OneButtonDefinition":
                    btn_def = data.get("Body", {}).get("Button", {})
                    btn_name = btn_def.get("Name", btn_name)
                    engraving = (btn_def.get("Engraving") or {}).get("Text", "")
            except Exception:
                continue

        # --- Step 2: Build label (Name + Engraving inside quotes) ---
        button_label = f"{btn_name.strip()} - {engraving.strip()}" if engraving else btn_name.strip()

        # --- Step 3: Decide log description ---
        desc = None
        if event_type == "Press":
            desc = f"Button '{button_label}' is pressed"
        elif event_type.lower() == "longhold":
            desc = f"Button '{button_label}' is long held"
        elif event_type == "Release":
            return  # ignore release
        else:
            desc = f"Button '{button_label}' event: {event_type}"

        # --- Step 4: Resolve correct Area via ButtonGroup -> Device -> AssociatedArea ---
        area, area_id, area_name, area_code = None, None, None, None
        btn_group_href = btn_def.get("Parent", {}).get("href") if btn_def else None

        if btn_group_href:
            # Read ButtonGroup → get parent Device
            await _send_json(writer, {
                "CommuniqueType": "ReadRequest",
                "Header": {"Url": btn_group_href}
            })
            group_resp = await _recv_raw(reader)

            for g in group_resp:
                try:
                    group_data = json.loads(g)
                    dev_href = group_data.get("Body", {}).get("ButtonGroup", {}).get("Parent", {}).get("href")
                    
                    if dev_href:
                        # Read Device → get AssociatedArea
                        await _send_json(writer, {
                            "CommuniqueType": "ReadRequest",
                            "Header": {"Url": dev_href}
                        })
                        dev_resp = await _recv_raw(reader)
                        
                        for d in dev_resp:
                            try:
                                dev_data = json.loads(d)
                                assoc_area = dev_data.get("Body", {}).get("Device", {}).get("AssociatedArea", {}).get("href")
                                
                                if assoc_area:
                                    area_code = int(assoc_area.strip("/").split("/")[-1])
                                    
                                    area = db.query(Area).filter_by(code=str(area_code), processor_id=processor_id).first()
                                    if area:
                                        area_id = area.id
                                        area_name = get_area_full_path(db, area)
                                    break
                            except Exception:
                                continue
                except Exception:
                    continue

        # --- Step 5: Insert into ActivityReport ---
        if desc:
            activity_report_log(
                db=db,
                user_id=None,
                area_id=area_id,
                activity_type="Device Control",
                activity_description=desc,
                area_name=area_name,
                sub_activity_type="Button"
            )

    except Exception as e:
        db.rollback()
        log_processor(processor_id, f"BUTTON EVENT ERROR: {e}", level=logging.ERROR)



def check_zone_status(msg, db, processor_id):
    global recent_button_event
    manual = _energy_logger_manual()
    zone_statuses = msg.get("ZoneStatuses", [])
    for zone in zone_statuses:
        href = zone.get("href") or ((zone.get("Zone") or {}).get("href") if isinstance(zone.get("Zone"), dict) else None)
        code = _zone_code_from_href(href)
        if code is None:
            continue
        zone_obj = db.query(Zone).filter_by(processor_id=processor_id, code=str(code)).first()

        button_code, button_activity = get_button_info_for_event()
        if recent_button_event:
            recent_button_event["age"] += 1

        db_event = ProcessorZoneEvent(
            processor_id=processor_id,
            zone_id=zone_obj.id if zone_obj else None,
            area_id=zone_obj.area_id if zone_obj else None,
            zone_href=href,
            zone_code=code,
            level=zone.get("Level"),
            switched_level=zone.get("SwitchedLevel"),
            white_tuning_kelvin=zone.get("ColorTuningStatus", {}).get("WhiteTuningLevel", {}).get("Kelvin"),
            status_accuracy=zone.get("StatusAccuracy"),
            button_code=button_code,
            button_activity=button_activity
        )
        zone_inst_power, zone_inst_max = None, None
        if manual and zone_obj and zone_obj.max_power is not None and zone_obj.high_end_trim is not None:
            level = zone.get("Level")
            if level is not None:
                try:
                    level = int(level)
                except (TypeError, ValueError):
                    level = None
            if level is not None:
                max_power = float(zone_obj.max_power)
                trim = float(zone_obj.high_end_trim)
                zone_inst_max = max_power
                zone_inst_power = (level / 100.0) * (max_power * trim / 100.0)
                db_event.zone_instantaneous_power = zone_inst_power
                db_event.zone_instantaneous_max_power = zone_inst_max
        db.add(db_event)

        log_keypad_or_listener_activity(
            db, zone=zone_obj,
            button_code=button_code,
            button_activity=button_activity
        )

        try:
            db.flush()
            db.add(ProcessorEvent(processor_id=processor_id, event_type="zone", event_reference_id=db_event.id))
            db.commit()

            # NEW: log activity report entry/entries
            log_activity_report_for_zone(db, db_event)
        except Exception:
            db.rollback()

        try:
            current = db.query(CurrentZoneEvent).filter_by(processor_id=processor_id, zone_code=code).first()
            if zone_obj is None:
                if current:
                    db.delete(current)
                    db.commit()
                continue
            fields = {
                "area_id": zone_obj.area_id,
                "zone_id": zone_obj.id,
                "zone_href": href,
                "zone_code": code,
                "level": zone.get("Level"),
                "switched_level": zone.get("SwitchedLevel"),
                "white_tuning_kelvin": zone.get("ColorTuningStatus", {}).get("WhiteTuningLevel", {}).get("Kelvin"),
                "status_accuracy": zone.get("StatusAccuracy")
            }
            if zone_inst_power is not None:
                fields["zone_instantaneous_power"] = zone_inst_power
            if zone_inst_max is not None:
                fields["zone_instantaneous_max_power"] = zone_inst_max
            if current:
                for k, v in fields.items():
                    if v is not None:
                        setattr(current, k, v)
            else:
                db.add(CurrentZoneEvent(
                    processor_id=processor_id,
                    **{k: v for k, v in fields.items() if v is not None}
                ))
            db.commit()
            if zone_obj and zone_obj.area_id:
                try:
                    from app.models.area import Area
                    from app.heatmap.live_notify import publish_heatmap_live_event

                    area_row = db.query(Area).filter(Area.id == zone_obj.area_id).first()
                    if area_row and area_row.floor_id:
                        publish_heatmap_live_event(
                            floor_id=area_row.floor_id,
                            area_id=area_row.id,
                        )
                except Exception:
                    pass
        except Exception:
            db.rollback()
    if manual and zone_statuses:
        try:
            _rollup_current_area_power_from_zones(db, processor_id)
        except Exception as e:
            db.rollback()


# ---------------------- Unified Listener ---------------------- #
async def unified_listener(reader, writer, db, processor_id):
    global recent_button_event
    first_area_message = True
    first_zone_message = True
    pending_ping_sent_at = None
    ping_failure_emitted = False

    async def send_ping():
        nonlocal pending_ping_sent_at, ping_failure_emitted
        while not shutdown_event.is_set():
            await asyncio.sleep(30)
            pending_ping_sent_at = time.monotonic()
            ping_failure_emitted = False
            try:
                await _send_json(writer, {
                    "CommuniqueType": "ReadRequest",
                    "Header": {"URL": "/server/status/ping"}
                })
            except Exception as ping_send_err:
                try:
                    from app.monitoring.leap_telemetry import report_leap_ping

                    report_leap_ping(
                        processor_id,
                        success=False,
                        detail={"reason": "send_failed", "error": str(ping_send_err)},
                    )
                except Exception:
                    pass
                pending_ping_sent_at = None

    async def watch_ping_timeout():
        nonlocal pending_ping_sent_at, ping_failure_emitted
        try:
            from app.monitoring.leap_telemetry import ping_timeout_seconds, report_leap_ping
        except Exception:
            return
        timeout_s = ping_timeout_seconds()
        while not shutdown_event.is_set():
            await asyncio.sleep(1)
            sent = pending_ping_sent_at
            if sent is None or ping_failure_emitted:
                continue
            if (time.monotonic() - sent) >= timeout_s:
                ping_failure_emitted = True
                pending_ping_sent_at = None
                try:
                    report_leap_ping(
                        processor_id,
                        success=False,
                        detail={"reason": "timeout", "timeout_seconds": timeout_s},
                    )
                except Exception:
                    pass

    asyncio.create_task(send_ping())
    asyncio.create_task(watch_ping_timeout())

    def _emit_processor_down(reason: str, error=None) -> None:
        try:
            from app.monitoring.leap_telemetry import report_connectivity

            detail = {"reason": reason}
            if error:
                detail["error"] = error
            report_connectivity(
                processor_id,
                status="down",
                event_type="disconnected",
                detail=detail,
            )
            _mon_note_stream(processor_id, "area", subscribed=False)
            _mon_note_stream(processor_id, "zone", subscribed=False)
        except Exception:
            pass

    while not shutdown_event.is_set():
        try:
            raw_msgs = await _recv_raw(reader)
            if not raw_msgs:
                _emit_processor_down("recv_empty")
                break
            for raw in raw_msgs:
                try:
                    msg = json.loads(raw)
                except json.JSONDecodeError:
                    continue

                header = msg.get("Header", {})
                body = msg.get("Body", {})
                url = header.get("Url", "")

                if url == "/server/status/ping":
                    if pending_ping_sent_at is not None:
                        rtt_ms = int((time.monotonic() - pending_ping_sent_at) * 1000)
                        if rtt_ms < 0:
                            rtt_ms = 0
                        pending_ping_sent_at = None
                        ping_failure_emitted = False
                        try:
                            from app.monitoring.leap_telemetry import report_leap_ping

                            status_code = header.get("StatusCode")
                            success = True
                            if isinstance(status_code, str) and status_code and not status_code.startswith("20"):
                                success = False
                            report_leap_ping(
                                processor_id,
                                success=success,
                                rtt_ms=rtt_ms,
                                detail={"status_code": status_code},
                            )
                        except Exception:
                            pass
                    continue
                elif "SubscribeResponse" in msg.get("CommuniqueType", ""):
                    continue
                elif url == "/area/status" or (url.startswith("/area/") and url.endswith("/status")):
                    _mon_note_stream(processor_id, "area", event=True)
                    _note_processor_stream_event(processor_id, "area")
                    if first_area_message:
                        first_area_message = False
                        if processor_inventory_complete(db, processor_id):
                            continue

                    check_area_occupancy(body, db, processor_id)
                    # Also log occupancy to occupancy_logs table
                    log_occupancy_to_table(body, db, processor_id)
                elif url == "/zone/status" or (url.startswith("/zone/") and url.endswith("/status")):
                    _mon_note_stream(processor_id, "zone", event=True)
                    _note_processor_stream_event(processor_id, "zone")
                    applied_first_dump = False
                    if first_zone_message:
                        first_zone_message = False
                        if processor_inventory_complete(db, processor_id):
                            continue
                        applied_first_dump = True
                    check_zone_status(body, db, processor_id)
                    if applied_first_dump:
                        _publish_processor_inventory_health(
                            processor_id,
                            _reconcile_processor_inventory(db, processor_id),
                        )
                elif url.endswith("/status/event") and "/button/" in url:
                    # --- existing buffer logic (keep as-is) ---
                    btn_code = int(url.split("/button/")[1].split("/")[0])
                    btn_event_type = body.get("ButtonStatus", {}).get("ButtonEvent", {}).get("EventType")
                    if btn_event_type in ("Press", "Release"):
                        recent_button_event = {
                            "code": btn_code,
                            "activity": btn_event_type.lower(),
                            "age": 0
                        }

                    # --- new logging logic (async) ---
                    try:
                        await check_button_status(reader, writer, body, db, processor_id)
                    except Exception:
                        pass

        except asyncio.CancelledError:
            break
        except Exception as e:
            listener_logger.error(f"[LISTEN ERROR] {e}")
            _emit_processor_down("listen_error", error=str(e))
            await asyncio.sleep(1)


# ---------------------- Bootstrap: DB-inventory zone status refresh ---------------------- #
async def fetch_and_apply_zone_status_for_processor(reader, writer, db, processor_id, area_ids=None):
    """
    Option C bootstrap: load only DB areas for this processor, fetch
    /area/{code}/associatedzone then /associatedzone/status, and write CZS
    only when zones.(processor_id, code) exists.
    """
    try:
        from app.crud.zone_sync import parse_zone_entries

        db_areas = (
            db.query(Area)
            .filter(Area.processor_id == processor_id, Area.code.isnot(None))
            .all()
        )
        db_area_count = len(db_areas)
        if not db_areas:
            stats = _reconcile_processor_inventory(db, processor_id)
            log_processor(
                processor_id,
                f"Bootstrap: no DB areas for processor {processor_id} | "
                f"db_zones={stats['db_zones']} mapped_czs={stats['mapped_czs']}",
                level=logging.WARNING,
            )
            _publish_processor_inventory_health(
                processor_id,
                stats,
                extra={"db_areas": 0, "bootstrap_complete": False},
            )
            return

        purged = _purge_unmapped_czs_for_processor(db, processor_id)
        valid_codes = {
            str(row[0])
            for row in db.query(Zone.code).filter(Zone.processor_id == processor_id).all()
            if row[0] is not None
        }

        all_zone_statuses = []
        seen_codes = set()
        skipped_unmapped = 0
        areas_fetched = 0

        for area in db_areas:
            area_code = str(area.code).strip() if area.code is not None else ""
            if not area_code:
                continue

            definition_codes = set()
            await _send_json(writer, {
                "CommuniqueType": "ReadRequest",
                "Header": {"Url": f"/area/{area_code}/associatedzone"}
            })
            def_responses = await _recv_raw(reader)
            for chunk in def_responses:
                try:
                    data = json.loads(chunk)
                    for entry in parse_zone_entries(data.get("Body", {}).get("Zones", [])):
                        if entry.get("code"):
                            definition_codes.add(str(entry["code"]))
                except (json.JSONDecodeError, TypeError, AttributeError):
                    continue

            await _send_json(writer, {
                "CommuniqueType": "ReadRequest",
                "Header": {"Url": f"/area/{area_code}/associatedzone/status"}
            })
            responses = await _recv_raw(reader)
            areas_fetched += 1
            for chunk in responses:
                try:
                    data = json.loads(chunk)
                    for z in data.get("Body", {}).get("ZoneStatuses", []) or []:
                        href = z.get("href") or ((z.get("Zone") or {}).get("href") if isinstance(z.get("Zone"), dict) else None)
                        code = _zone_code_from_href(href)
                        if code is None:
                            continue
                        code_s = str(code)
                        if code_s not in valid_codes:
                            skipped_unmapped += 1
                            continue
                        if definition_codes and code_s not in definition_codes:
                            skipped_unmapped += 1
                            continue
                        if code_s in seen_codes:
                            continue
                        seen_codes.add(code_s)
                        all_zone_statuses.append(z)
                except (json.JSONDecodeError, TypeError):
                    continue

        if all_zone_statuses:
            check_zone_status({"ZoneStatuses": all_zone_statuses}, db, processor_id)

        stats = _reconcile_processor_inventory(db, processor_id)
        extra = {
            "db_areas": db_area_count,
            "areas_fetched": areas_fetched,
            "statuses_applied": len(all_zone_statuses),
            "skipped_unmapped": skipped_unmapped,
            "purged_orphans": purged,
        }
        log_processor(
            processor_id,
            (
                f"Bootstrap reconcile P{processor_id}: "
                f"db_zones={stats['db_zones']} mapped_czs={stats['mapped_czs']} "
                f"missing={stats['missing_zones']} orphans={stats['orphans']} "
                f"wrong_processor_skipped={skipped_unmapped} purged={purged} "
                f"rollup_candidates={stats['rollup_candidates']} "
                f"rollup_missing={stats['rollup_missing']} "
                f"complete={stats['bootstrap_complete']}"
            ),
            level=logging.WARNING,
        )
        if not stats["bootstrap_complete"]:
            log_processor(
                processor_id,
                (
                    f"Bootstrap incomplete P{processor_id}: "
                    f"will apply first /zone/status dump. "
                    f"missing_zones={stats['missing_zones']} orphans={stats['orphans']}"
                ),
                level=logging.WARNING,
            )
        _publish_processor_inventory_health(processor_id, stats, extra=extra)
    except Exception as e:
        listener_logger.error(f"[Bootstrap] fetch_and_apply_zone_status P{processor_id}: {e}", exc_info=True)
        log_processor(processor_id, f"Bootstrap: failed to refresh zone status: {e}", level=logging.ERROR)


# ---------------------- Processor Handling ---------------------- #
async def handle_connected_processor(processor, reader, writer, db):
    log_processor(processor.id, f"Setting up subscriptions for processor {processor.id}")
    await discover_and_subscribe_buttons(reader, writer, db=db, processor_id=processor.id)
    log_processor(processor.id, f"Starting unified listener for processor {processor.id}")
    await unified_listener(reader, writer, db, processor.id)


async def monitor_processor(processor):
    db = SessionLocal()
    log_processor(processor.id, f"Attempting to connect to processor {processor.id} ({processor.serial}) at {processor.ipv4}")
    while not shutdown_event.is_set():
        try:
            # Get processor-specific certificate paths
            cert_paths = get_processor_cert_paths(processor.ipv4)
            
            # Passing cafile suppresses load_default_certs(): the Lutron root is the
            # only trust anchor, never the system/public roots.
            ctx = ssl.create_default_context(ssl.Purpose.SERVER_AUTH, cafile=cert_paths['lap_root'])
            ctx.load_cert_chain(certfile=cert_paths['leap_signed_csr'], keyfile=cert_paths['leap_private_key'])
            ctx.check_hostname = False

            reader, writer = await asyncio.open_connection(
                host=processor.ipv4,
                port=8081,
                ssl=ctx,
                server_hostname=get_proc_hostname(processor.system, processor.mac)
            )
            log_processor(processor.id, f"Successfully connected to processor {processor.id} ({processor.serial})")
            try:
                from app.monitoring.leap_connection_limits import (
                    note_slot_acquired,
                    report_connect_outcome,
                )

                report_connect_outcome(
                    success=True,
                    processor_id=processor.id,
                    ipv4=processor.ipv4,
                    source="listener",
                )
                note_slot_acquired(processor.id, source="listener")
            except Exception:
                pass
            try:
                from app.monitoring.leap_telemetry import report_connectivity

                report_connectivity(
                    processor.id,
                    status="up",
                    event_type="connected",
                    detail={"ipv4": processor.ipv4, "serial": processor.serial},
                )
            except Exception:
                pass
            await handle_connected_processor(processor, reader, writer, db)
            log_processor(processor.id, f"Connection to processor {processor.id} closed, will retry in 5 seconds")
            try:
                from app.monitoring.leap_connection_limits import note_slot_released

                note_slot_released(processor.id, source="listener")
            except Exception:
                pass
            try:
                from app.monitoring.leap_telemetry import report_connectivity

                report_connectivity(
                    processor.id,
                    status="down",
                    event_type="disconnected",
                    detail={"ipv4": processor.ipv4},
                )
                report_connectivity(
                    processor.id,
                    status="down",
                    event_type="reconnecting",
                    detail={"ipv4": processor.ipv4, "phase": "retry"},
                )
            except Exception:
                pass
            await asyncio.sleep(5)
        except asyncio.CancelledError:
            log_processor(processor.id, f"Monitoring cancelled for processor {processor.id}")
            break
        except Exception as e:
            log_processor(processor.id, f"Connection failed for processor {processor.id} ({processor.serial}): {e}", level=logging.ERROR)
            db.add(ProcessorConnectionError(processor_id=processor.id, message="Connection failed"))
            db.commit()
            try:
                from app.monitoring.leap_connection_limits import report_connect_outcome

                report_connect_outcome(
                    success=False,
                    processor_id=processor.id,
                    ipv4=processor.ipv4,
                    error=e,
                    source="listener",
                )
            except Exception:
                pass
            try:
                from app.monitoring.leap_telemetry import report_connectivity

                report_connectivity(
                    processor.id,
                    status="down",
                    event_type="connection_failed",
                    detail={"ipv4": processor.ipv4, "error": str(e)},
                )
                report_connectivity(
                    processor.id,
                    status="down",
                    event_type="reconnecting",
                    detail={"ipv4": processor.ipv4, "phase": "retry"},
                )
            except Exception:
                pass
            await asyncio.sleep(5)


# ---------------------- Entrypoint ---------------------- #
async def main_async():
    db = SessionLocal()
    # Use a general logger for startup messages (processor_id=0 for general messages)
    general_logger = get_processor_logger(0)
    try:
        if _energy_logger_manual():
            general_logger.info("Manual energy logger: ON (zone/area power from zones)")
            print("[Listener] Manual energy logger: ON")
        else:
            general_logger.info("Manual energy logger: OFF (normal – area power from processor)")
            print("[Listener] Manual energy logger: OFF (normal)")
        processors = db.query(Processor).filter_by(handshake_status=True).all()
        general_logger.info(f"Starting listener for {len(processors)} processors")
        for p in processors:
            general_logger.info(f"Will monitor processor {p.id} ({p.serial}) at {p.ipv4}")
    except Exception as e:
        general_logger.error(f"Failed to query processors: {e}")
        traceback.print_exc()
        return
    if not processors:
        general_logger.warning("No processors with handshake_status=True found")
        return
    tasks = [asyncio.create_task(monitor_processor(p)) for p in processors]
    general_logger.info(f"Started {len(tasks)} monitoring tasks")
    try:
        await asyncio.gather(*tasks)
    except asyncio.CancelledError:
        general_logger.info("Tasks cancelled, shutting down")
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
    finally:
        db.close()


def listener_process_entrypoint():
    mon_handle = None
    leap_handle = None
    try:
        try:
            from app.monitoring.daemon_heartbeat import start_daemon_heartbeat
            from app.monitoring.leap_telemetry import start_leap_telemetry

            mon_handle = start_daemon_heartbeat("listener")
            leap_handle = start_leap_telemetry()
        except Exception as mon_err:
            print(f"[Listener] Monitoring heartbeat start skipped: {mon_err}")
        asyncio.run(main_async())
    except KeyboardInterrupt:
        pass
    finally:
        if leap_handle is not None:
            try:
                from app.monitoring.leap_telemetry import stop_leap_telemetry

                stop_leap_telemetry()
            except Exception:
                pass
        if mon_handle is not None:
            try:
                mon_handle.stop()
            except Exception:
                pass
