# E:\Gcon\lutron\lutron_backend\app\energy_logger.py
"""
Enhanced Energy Logger with Simple Missing Data Handling

This module provides comprehensive energy and occupancy logging with simple
missing data detection and forward-fill capabilities that prevent all known bugs.

Key Features:
1. Fixed 15-minute interval logging (00:00, 00:15, 00:30, 00:45)
2. Simple missing data detection (only fills historical gaps)
3. Forward-fill missing intervals with previous valid values
4. Unified duplicate prevention for both real and filler data
5. Comprehensive data validation and integrity checks
6. Single transaction approach for data consistency
7. Enhanced error handling and detailed logging

Bug Fixes Implemented:
-  No duplicate real data at same timestamp
-  No real + filler data mix for same interval
-  No fillers for current time (only real data allowed)
-  Proper transaction coordination
-  Simple gap detection that excludes current time
-  No complex state tracking needed

Missing Data Handling:
- Only fills gaps in historical periods (never current time)
- Current time: Only real data allowed, no filler data
- Historical time: Real data + filler data allowed
- Marks filler data with approximated_filler=True
- Only processes historical data (never future timestamps)
- Simple and reliable approach

Usage:
- Runs automatically every 15 minutes via APScheduler
- Missing data check runs every 15 minutes (simple approach)
- Can be tested using test_enhanced_missing_data_handling() function
- Logs detailed information about inserted, filled, and duplicate records
"""

import asyncio
import os
import sys
import threading
import multiprocessing
import traceback
import time
import logging
import atexit
import tempfile
from datetime import datetime, timezone, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.executors.pool import ThreadPoolExecutor
from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import SessionLocal
from app.models.events import (
    CurrentAreaEvent,
)
from app.models.area_energy_stats import AreaEnergyStat
from app.models.area_occupancy_stats import AreaOccupancyStat
from app.utils.time_column_generator import generate_time_columns
# --------------------- DETAILED LOGGER SETUP --------------------- #
def setup_energy_logger():
    """Setup dedicated logger for energy logging with console output only"""
    logger = logging.getLogger("energy_logger")
    logger.setLevel(logging.DEBUG)
    logger.propagate = False
    
    # Clear any existing handlers
    logger.handlers.clear()
    
    # Console handler for warnings and above
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.WARNING)
    console_formatter = logging.Formatter(
        '[%(asctime)s] [PID:%(process)d] [%(levelname)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)
    
    return logger

# Initialize logger
energy_logger = setup_energy_logger()

# Helper function to get detailed context
def get_context_info():
    """Get detailed context information for logging"""
    return {
        'pid': os.getpid(),
        'tid': threading.get_ident(),
        'timestamp': datetime.now().isoformat(),
        'timestamp_ms': time.time() * 1000
    }

def log_query_details(db: Session, query_description: str, **kwargs):
    """Log detailed query information"""
    try:
        # Get database connection info
        conn_info = {
            'url': str(db.bind.url) if db.bind else 'N/A',
            'is_active': db.is_active if hasattr(db, 'is_active') else 'N/A',
            'in_transaction': db.in_transaction() if hasattr(db, 'in_transaction') else 'N/A',
        }
        
        context = get_context_info()
        energy_logger.debug(
            f"[QUERY] {query_description} | "
            f"Context: PID={context['pid']}, TID={context['tid']}, Time={context['timestamp']} | "
            f"DB: {conn_info} | "
            f"Params: {kwargs}"
        )
    except Exception as e:
        energy_logger.error(f"[QUERY] Error logging query details: {e}")


# --------------------- UTILITY FUNCTIONS --------------------- #

def validate_time_columns_before_insert(record, record_type: str = "record"):
    """
    Defensive validation to ensure time columns are populated before database insert.
    
    This function acts as a safety net to catch any future code changes where
    time columns might not be manually populated. Since SQLAlchemy event listeners
    were removed (for multiprocessing compatibility), manual population is required.
    
    Args:
        record: AreaEnergyStat or AreaOccupancyStat instance
        record_type: Description for logging (e.g., "energy real data", "occupancy filler")
    
    Raises:
        ValueError: If any time columns are missing when created_at is present
    """
    context = get_context_info()
    
    if hasattr(record, 'created_at') and record.created_at:
        missing_columns = []
        if not hasattr(record, 'created_date') or record.created_date is None:
            missing_columns.append('created_date')
        if not hasattr(record, 'timespan_15min') or record.timespan_15min is None:
            missing_columns.append('timespan_15min')
        if not hasattr(record, 'timespan_6hr') or record.timespan_6hr is None:
            missing_columns.append('timespan_6hr')
        
        if missing_columns:
            error_msg = (
                f"[CRITICAL ERROR] Time column population FAILED for {record_type}!\n"
                f"  Missing columns: {', '.join(missing_columns)}\n"
                f"  created_at: {record.created_at}\n"
                f"  Record type: {type(record).__name__}\n"
                f"  This indicates the manual time column population logic is broken!"
            )
            energy_logger.error(
                f"[VALIDATE_TIME_COLUMNS] {error_msg} | "
                f"Context: PID={context['pid']}, TID={context['tid']} | "
                f"Stack: {''.join(traceback.format_stack()[-3:-1])}"
            )
            print(error_msg)
            raise ValueError(error_msg)
        else:
            energy_logger.debug(
                f"[VALIDATE_TIME_COLUMNS] Validation PASSED | "
                f"Type: {record_type} | CreatedAt: {record.created_at} | "
                f"Context: PID={context['pid']}, TID={context['tid']}"
            )


# --------------------- ENHANCED MISSING DATA HANDLING FUNCTIONS --------------------- #

# Simple missing data handling - no complex state tracking needed

def normalize_and_validate_time(current_time: datetime) -> datetime:
    """
    Normalize time to 15-minute intervals and validate it's not in the future.
    CRITICAL: Prevents future timestamp bugs.
    """
    context = get_context_info()
    now = datetime.now()
    original_time = current_time
    
    # CRITICAL: Never process future timestamps
    if current_time > now:
        time_diff = (current_time - now).total_seconds()
        energy_logger.warning(
            f"[NORMALIZE_TIME] Future timestamp detected | "
            f"Original: {original_time.isoformat()} | Now: {now.isoformat()} | "
            f"TimeDiff: {time_diff:.2f}s | Using current time instead | "
            f"Context: PID={context['pid']}, TID={context['tid']}"
        )
        print(f"[WARNING] current_time ({current_time}) is in the future. Using current time instead.")
        current_time = now
    
    # Round down to nearest 15-minute interval
    rounded_minute = (current_time.minute // 15) * 15
    normalized_time = current_time.replace(minute=rounded_minute, second=0, microsecond=0)
    
    if normalized_time != original_time:
        energy_logger.debug(
            f"[NORMALIZE_TIME] Time normalized | "
            f"Original: {original_time.isoformat()} | Normalized: {normalized_time.isoformat()} | "
            f"Context: PID={context['pid']}, TID={context['tid']}"
        )
    
    return normalized_time


def generate_15min_intervals(start_time: datetime, end_time: datetime) -> List[datetime]:
    """
    Generate list of 15-minute intervals between start_time and end_time
    """
    intervals = []
    current = start_time.replace(minute=(start_time.minute // 15) * 15, second=0, microsecond=0)
    
    while current <= end_time:
        intervals.append(current)
        current += timedelta(minutes=15)
    
    return intervals


def unified_duplicate_check(db: Session, area_code: int, processor_id: int, timestamp: datetime, data_type: str = "energy") -> bool:
    """
    Unified duplicate check for both energy and occupancy data
    Returns True if duplicate exists, False if safe to insert
    """
    context = get_context_info()
    check_start_time = time.time()
    
    try:
        log_query_details(
            db, 
            f"DUPLICATE_CHECK_START - {data_type}",
            area_code=area_code,
            processor_id=processor_id,
            timestamp=timestamp.isoformat(),
            data_type=data_type
        )
        
        # First, count how many records exist with this combination
        if data_type == "energy":
            count_query = db.query(func.count(AreaEnergyStat.id)).filter(
                AreaEnergyStat.area_code == area_code,
                AreaEnergyStat.processor_id == processor_id,
                AreaEnergyStat.created_at == timestamp
            )
            existing = db.query(AreaEnergyStat).filter(
                AreaEnergyStat.area_code == area_code,
                AreaEnergyStat.processor_id == processor_id,
                AreaEnergyStat.created_at == timestamp
            ).first()
        elif data_type == "occupancy":
            count_query = db.query(func.count(AreaOccupancyStat.id)).filter(
                AreaOccupancyStat.area_code == str(area_code),
                AreaOccupancyStat.processor_id == processor_id,
                AreaOccupancyStat.created_at == timestamp
            )
            existing = db.query(AreaOccupancyStat).filter(
                AreaOccupancyStat.area_code == str(area_code),
                AreaOccupancyStat.processor_id == processor_id,
                AreaOccupancyStat.created_at == timestamp
            ).first()
        else:
            energy_logger.warning(
                f"[DUPLICATE_CHECK] Unknown data_type: {data_type}, assuming duplicate | "
                f"Context: PID={context['pid']}, TID={context['tid']}"
            )
            return True
        
        # Execute count query to see how many duplicates exist
        try:
            duplicate_count = count_query.scalar() or 0
        except Exception as count_error:
            duplicate_count = -1
            energy_logger.error(
                f"[DUPLICATE_CHECK] Error counting duplicates: {count_error} | "
                f"Context: PID={context['pid']}, TID={context['tid']}",
                exc_info=True
            )
        
        check_duration = (time.time() - check_start_time) * 1000  # milliseconds
        
        is_duplicate = existing is not None
        
        if is_duplicate:
            # Log detailed duplicate information
            existing_id = existing.id if existing else 'N/A'
            existing_created = existing.created_at.isoformat() if existing and hasattr(existing, 'created_at') else 'N/A'
            existing_filler = getattr(existing, 'approximated_filler', 'N/A') if existing else 'N/A'
            
            energy_logger.warning(
                f"[DUPLICATE_CHECK] DUPLICATE DETECTED | "
                f"Type: {data_type} | "
                f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
                f"Timestamp: {timestamp.isoformat()} | "
                f"ExistingID: {existing_id} | ExistingCreated: {existing_created} | "
                f"ExistingFiller: {existing_filler} | "
                f"TotalDuplicates: {duplicate_count} | "
                f"CheckDuration: {check_duration:.2f}ms | "
                f"Context: PID={context['pid']}, TID={context['tid']} | "
                f"Stack: {''.join(traceback.format_stack()[-3:-1])}"
            )
        else:
            energy_logger.debug(
                f"[DUPLICATE_CHECK] NO DUPLICATE | "
                f"Type: {data_type} | "
                f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
                f"Timestamp: {timestamp.isoformat()} | "
                f"CheckDuration: {check_duration:.2f}ms | "
                f"Context: PID={context['pid']}, TID={context['tid']}"
            )
        
        return is_duplicate
        
    except Exception as e:
        check_duration = (time.time() - check_start_time) * 1000
        energy_logger.error(
            f"[DUPLICATE_CHECK] EXCEPTION | "
            f"Type: {data_type} | "
            f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
            f"Timestamp: {timestamp.isoformat() if timestamp else 'N/A'} | "
            f"Error: {str(e)} | ErrorType: {type(e).__name__} | "
            f"CheckDuration: {check_duration:.2f}ms | "
            f"Context: PID={context['pid']}, TID={context['tid']} | "
            f"Traceback: {traceback.format_exc()}",
            exc_info=True
        )
        return True  # On error, assume duplicate to prevent insertion


def smart_gap_detection(db: Session, area_code: int, processor_id: int, start_time: datetime, end_time: datetime, data_type: str = "energy", current_time: Optional[datetime] = None) -> List[datetime]:
    """
    Smart gap detection that excludes intervals with any existing data (real or filler).
    Enhanced with safety checks for future timestamps and current interval exclusion.
    """
    now = datetime.now()
    
    # SAFETY CHECK 1: Ensure end_time is not in the future
    if end_time > now:
        end_time = now - timedelta(minutes=15)
    
    # SAFETY CHECK 2: If current_time provided, ensure end_time doesn't include current interval
    if current_time is not None:
        if end_time >= current_time:
            end_time = current_time - timedelta(minutes=15)
    
    # SAFETY CHECK 3: Ensure start_time <= end_time
    if start_time > end_time:
        return []
    
    if data_type == "energy":
        # Get all existing timestamps for the composite key (area_code + processor_id)
        existing_timestamps = db.query(AreaEnergyStat.created_at).filter(
            AreaEnergyStat.area_code == area_code,
            AreaEnergyStat.processor_id == processor_id,
            AreaEnergyStat.created_at >= start_time,
            AreaEnergyStat.created_at <= end_time
        ).all()
    elif data_type == "occupancy":
        # Get all existing timestamps for the composite key (area_code + processor_id)
        existing_timestamps = db.query(AreaOccupancyStat.created_at).filter(
            AreaOccupancyStat.area_code == str(area_code),
            AreaOccupancyStat.processor_id == processor_id,
            AreaOccupancyStat.created_at >= start_time,
            AreaOccupancyStat.created_at <= end_time
        ).all()
    else:
        return []
    
    existing_timestamps = [ts[0] for ts in existing_timestamps]
    
    # Generate expected 15-minute intervals
    expected_intervals = generate_15min_intervals(start_time, end_time)
    
    # Find truly missing intervals (no data at all)
    # With additional safety checks
    missing_intervals = []
    for interval in expected_intervals:
        # SAFETY CHECK 4: Skip future intervals
        if interval > now:
            continue
        
        # SAFETY CHECK 5: Skip current interval if current_time provided
        if current_time is not None and interval >= current_time:
            continue
        
        # SAFETY CHECK 6: Skip if data already exists
        if interval not in existing_timestamps:
            missing_intervals.append(interval)
    
    return missing_intervals


def get_previous_valid_value(db: Session, area_code: int, processor_id: int, target_timestamp: datetime, data_type: str = "energy") -> Optional[object]:
    """
    Get the most recent valid value before the target timestamp for area_code
    """
    if data_type == "energy":
        previous_record = db.query(AreaEnergyStat).filter(
            AreaEnergyStat.area_code == area_code,
            AreaEnergyStat.processor_id == processor_id,
            AreaEnergyStat.created_at < target_timestamp,
            AreaEnergyStat.approximated_filler.is_(None)  # Only real data
        ).order_by(AreaEnergyStat.created_at.desc()).first()
    elif data_type == "occupancy":
        previous_record = db.query(AreaOccupancyStat).filter(
            AreaOccupancyStat.area_code == str(area_code),
            AreaOccupancyStat.processor_id == processor_id,
            AreaOccupancyStat.created_at < target_timestamp,
            AreaOccupancyStat.approximated_filler.is_(None)  # Only real data
        ).order_by(AreaOccupancyStat.created_at.desc()).first()
    else:
        return None
    
    return previous_record


def validate_before_insert(db: Session, area_code: int, processor_id: int, timestamp: datetime, data_type: str = "energy") -> bool:
    """
    Comprehensive validation before insertion with detailed logging
    """
    context = get_context_info()
    validation_start = time.time()
    
    try:
        log_query_details(
            db,
            f"VALIDATE_START - {data_type}",
            area_code=area_code,
            processor_id=processor_id,
            timestamp=timestamp.isoformat()
        )
        
        # Check for duplicates
        duplicate_check_result = unified_duplicate_check(db, area_code, processor_id, timestamp, data_type)
        if duplicate_check_result:
            validation_duration = (time.time() - validation_start) * 1000
            energy_logger.warning(
                f"[VALIDATE] FAILED - Duplicate found | "
                f"Type: {data_type} | "
                f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
                f"Timestamp: {timestamp.isoformat()} | "
                f"Duration: {validation_duration:.2f}ms | "
                f"Context: PID={context['pid']}, TID={context['tid']}"
            )
            return False
        
        # Validate timestamp is not in the future
        now = datetime.now()
        if timestamp > now:
            validation_duration = (time.time() - validation_start) * 1000
            time_diff = (timestamp - now).total_seconds()
            energy_logger.warning(
                f"[VALIDATE] FAILED - Future timestamp | "
                f"Type: {data_type} | "
                f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
                f"Timestamp: {timestamp.isoformat()} | Now: {now.isoformat()} | "
                f"TimeDiff: {time_diff:.2f}s | "
                f"Duration: {validation_duration:.2f}ms | "
                f"Context: PID={context['pid']}, TID={context['tid']}"
            )
            return False
        
        # Validate area_code
        if area_code is None:
            validation_duration = (time.time() - validation_start) * 1000
            energy_logger.warning(
                f"[VALIDATE] FAILED - None area_code | "
                f"Type: {data_type} | "
                f"ProcessorID: {processor_id} | Timestamp: {timestamp.isoformat()} | "
                f"Duration: {validation_duration:.2f}ms | "
                f"Context: PID={context['pid']}, TID={context['tid']}"
            )
            return False
        
        validation_duration = (time.time() - validation_start) * 1000
        energy_logger.debug(
            f"[VALIDATE] PASSED | "
            f"Type: {data_type} | "
            f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
            f"Timestamp: {timestamp.isoformat()} | "
            f"Duration: {validation_duration:.2f}ms | "
            f"Context: PID={context['pid']}, TID={context['tid']}"
        )
        return True
        
    except Exception as e:
        validation_duration = (time.time() - validation_start) * 1000
        energy_logger.error(
            f"[VALIDATE] EXCEPTION | "
            f"Type: {data_type} | "
            f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
            f"Timestamp: {timestamp.isoformat() if timestamp else 'N/A'} | "
            f"Error: {str(e)} | ErrorType: {type(e).__name__} | "
            f"Duration: {validation_duration:.2f}ms | "
            f"Context: PID={context['pid']}, TID={context['tid']} | "
            f"Traceback: {traceback.format_exc()}",
            exc_info=True
        )
        return False


# Removed complex state tracking - no longer needed with simple approach


def fill_missing_energy_data_smart(db: Session, area_code: int, processor_id: int, missing_intervals: List[datetime]) -> int:
    """
    Smart fill missing energy intervals with previous valid values.
    Enhanced with future timestamp validation.
    """
    context = get_context_info()
    inserted_count = 0
    now = datetime.now()
    
    energy_logger.info(
        f"[FILL_MISSING_ENERGY] Starting fill | "
        f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
        f"MissingIntervals: {len(missing_intervals)} | "
        f"Context: PID={context['pid']}, TID={context['tid']}"
    )
    
    for missing_timestamp in missing_intervals:
        try:
            # VALIDATION 1: Skip future timestamps
            if missing_timestamp > now:
                energy_logger.warning(
                    f"[FILL_MISSING_ENERGY] Skipping future timestamp | "
                    f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
                    f"Timestamp: {missing_timestamp.isoformat()} | "
                    f"Context: PID={context['pid']}, TID={context['tid']}"
                )
                continue
            
            # VALIDATION 2: Double-check for duplicates before inserting (race condition protection)
            if unified_duplicate_check(db, area_code, processor_id, missing_timestamp, "energy"):
                energy_logger.warning(
                    f"[FILL_MISSING_ENERGY] Duplicate detected during fill | "
                    f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
                    f"Timestamp: {missing_timestamp.isoformat()} | "
                    f"Context: PID={context['pid']}, TID={context['tid']}"
                )
                continue
            
            # VALIDATION 3: Get previous valid value (only real data, not filler)
            previous_record = get_previous_valid_value(db, area_code, processor_id, missing_timestamp, "energy")
            
            if previous_record and previous_record.area_id is not None:
                # Create filler record
                filler_record = AreaEnergyStat(
                    area_id=previous_record.area_id,
                    area_code=area_code,
                    processor_id=processor_id,
                    instantaneous_power=previous_record.instantaneous_power,
                    instantaneous_max_power=previous_record.instantaneous_max_power,
                    time_elapsed_in_sec=900,
                    energy_consumed_in_Wh=previous_record.energy_consumed_in_Wh,
                    total_energy=previous_record.total_energy,
                    energy_saved_in_Wh=previous_record.energy_saved_in_Wh,
                    created_at=missing_timestamp,
                    approximated_filler=True
                )
                # Explicitly populate time columns
                try:
                    created_date, timespan_15min, timespan_6hr = generate_time_columns(missing_timestamp)
                    filler_record.created_date = created_date
                    filler_record.timespan_15min = timespan_15min
                    filler_record.timespan_6hr = timespan_6hr
                    
                    # Extra safety: Log if NULL values detected
                    if filler_record.created_date is None or filler_record.timespan_15min is None or filler_record.timespan_6hr is None:
                        energy_logger.error(
                            f"[FILL_MISSING_ENERGY] NULL time columns detected for filler | "
                            f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
                            f"Timestamp: {missing_timestamp.isoformat()} | "
                            f"Context: PID={context['pid']}, TID={context['tid']}"
                        )
                        print(f"[ALERT] NULL time columns detected for energy filler data!")
                        print(f"  Area: {area_code}, Processor: {processor_id}, Time: {missing_timestamp}")
                    
                    # VALIDATION 4: Final duplicate check before adding to session
                    if not unified_duplicate_check(db, area_code, processor_id, missing_timestamp, "energy"):
                        validate_time_columns_before_insert(filler_record, "energy filler data")
                        db.add(filler_record)
                        inserted_count += 1
                        energy_logger.info(
                            f"[FILL_MISSING_ENERGY] Added filler record | "
                            f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
                            f"Timestamp: {missing_timestamp.isoformat()} | "
                            f"Context: PID={context['pid']}, TID={context['tid']}"
                        )
                    else:
                        energy_logger.error(
                            f"[FILL_MISSING_ENERGY] RACE CONDITION - Duplicate appeared before add | "
                            f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
                            f"Timestamp: {missing_timestamp.isoformat()} | "
                            f"Context: PID={context['pid']}, TID={context['tid']} | "
                            f"Stack: {''.join(traceback.format_stack()[-3:-1])}"
                        )
                except Exception as e:
                    energy_logger.error(
                        f"[FILL_MISSING_ENERGY] Time column population failed | "
                        f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
                        f"Timestamp: {missing_timestamp.isoformat()} | Error: {e} | "
                        f"Context: PID={context['pid']}, TID={context['tid']}",
                        exc_info=True
                    )
                    print(f"[ERROR] Time column population failed for energy filler data: {e}")
            else:
                energy_logger.warning(
                    f"[FILL_MISSING_ENERGY] No previous data to fill | "
                    f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
                    f"Timestamp: {missing_timestamp.isoformat()} | "
                    f"Context: PID={context['pid']}, TID={context['tid']}"
                )
                print(f"[WARNING] No previous data to fill {missing_timestamp} for area {area_code} (P{processor_id})")
        except Exception as e:
            energy_logger.error(
                f"[FILL_MISSING_ENERGY] Error processing interval | "
                f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
                f"Timestamp: {missing_timestamp.isoformat()} | Error: {e} | "
                f"Context: PID={context['pid']}, TID={context['tid']}",
                exc_info=True
            )
            continue
    
    energy_logger.info(
        f"[FILL_MISSING_ENERGY] Completed fill | "
        f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
        f"Inserted: {inserted_count}/{len(missing_intervals)} | "
        f"Context: PID={context['pid']}, TID={context['tid']}"
    )
    return inserted_count


def fill_missing_occupancy_data_smart(db: Session, area_code: int, processor_id: int, missing_intervals: List[datetime]) -> int:
    """
    Smart fill missing occupancy intervals with previous valid values.
    Enhanced with future timestamp validation.
    """
    context = get_context_info()
    inserted_count = 0
    now = datetime.now()
    
    energy_logger.info(
        f"[FILL_MISSING_OCCUPANCY] Starting fill | "
        f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
        f"MissingIntervals: {len(missing_intervals)} | "
        f"Context: PID={context['pid']}, TID={context['tid']}"
    )
    
    for missing_timestamp in missing_intervals:
        try:
            # VALIDATION 1: Skip future timestamps
            if missing_timestamp > now:
                energy_logger.warning(
                    f"[FILL_MISSING_OCCUPANCY] Skipping future timestamp | "
                    f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
                    f"Timestamp: {missing_timestamp.isoformat()} | "
                    f"Context: PID={context['pid']}, TID={context['tid']}"
                )
                continue
            
            # VALIDATION 2: Double-check for duplicates before inserting (race condition protection)
            if unified_duplicate_check(db, area_code, processor_id, missing_timestamp, "occupancy"):
                energy_logger.warning(
                    f"[FILL_MISSING_OCCUPANCY] Duplicate detected during fill | "
                    f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
                    f"Timestamp: {missing_timestamp.isoformat()} | "
                    f"Context: PID={context['pid']}, TID={context['tid']}"
                )
                continue
            
            # VALIDATION 3: Get previous valid value (only real data, not filler)
            previous_record = get_previous_valid_value(db, area_code, processor_id, missing_timestamp, "occupancy")
            
            if previous_record and previous_record.area_id is not None:
                # Create filler record
                filler_record = AreaOccupancyStat(
                    area_id=previous_record.area_id,
                    area_code=str(area_code),
                    processor_id=processor_id,
                    occupancy_status=previous_record.occupancy_status,
                    created_at=missing_timestamp,
                    approximated_filler=True
                )
                # Explicitly populate time columns
                try:
                    created_date, timespan_15min, timespan_6hr = generate_time_columns(missing_timestamp)
                    filler_record.created_date = created_date
                    filler_record.timespan_15min = timespan_15min
                    filler_record.timespan_6hr = timespan_6hr
                    
                    # Extra safety: Log if NULL values detected
                    if filler_record.created_date is None or filler_record.timespan_15min is None or filler_record.timespan_6hr is None:
                        energy_logger.error(
                            f"[FILL_MISSING_OCCUPANCY] NULL time columns detected for filler | "
                            f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
                            f"Timestamp: {missing_timestamp.isoformat()} | "
                            f"Context: PID={context['pid']}, TID={context['tid']}"
                        )
                        print(f"[ALERT] NULL time columns detected for occupancy filler data!")
                        print(f"  Area: {area_code}, Processor: {processor_id}, Time: {missing_timestamp}")
                    
                    # VALIDATION 4: Final duplicate check before adding to session
                    if not unified_duplicate_check(db, area_code, processor_id, missing_timestamp, "occupancy"):
                        validate_time_columns_before_insert(filler_record, "occupancy filler data")
                        db.add(filler_record)
                        inserted_count += 1
                        energy_logger.info(
                            f"[FILL_MISSING_OCCUPANCY] Added filler record | "
                            f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
                            f"Timestamp: {missing_timestamp.isoformat()} | "
                            f"Context: PID={context['pid']}, TID={context['tid']}"
                        )
                    else:
                        energy_logger.error(
                            f"[FILL_MISSING_OCCUPANCY] RACE CONDITION - Duplicate appeared before add | "
                            f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
                            f"Timestamp: {missing_timestamp.isoformat()} | "
                            f"Context: PID={context['pid']}, TID={context['tid']} | "
                            f"Stack: {''.join(traceback.format_stack()[-3:-1])}"
                        )
                except Exception as e:
                    energy_logger.error(
                        f"[FILL_MISSING_OCCUPANCY] Time column population failed | "
                        f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
                        f"Timestamp: {missing_timestamp.isoformat()} | Error: {e} | "
                        f"Context: PID={context['pid']}, TID={context['tid']}",
                        exc_info=True
                    )
                    print(f"[ERROR] Time column population failed for occupancy filler data: {e}")
            else:
                energy_logger.warning(
                    f"[FILL_MISSING_OCCUPANCY] No previous data to fill | "
                    f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
                    f"Timestamp: {missing_timestamp.isoformat()} | "
                    f"Context: PID={context['pid']}, TID={context['tid']}"
                )
                print(f"[WARNING] No previous data to fill {missing_timestamp} for area {area_code} (P{processor_id})")
        except Exception as e:
            energy_logger.error(
                f"[FILL_MISSING_OCCUPANCY] Error processing interval | "
                f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
                f"Timestamp: {missing_timestamp.isoformat()} | Error: {e} | "
                f"Context: PID={context['pid']}, TID={context['tid']}",
                exc_info=True
            )
            continue
    
    energy_logger.info(
        f"[FILL_MISSING_OCCUPANCY] Completed fill | "
        f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
        f"Inserted: {inserted_count}/{len(missing_intervals)} | "
        f"Context: PID={context['pid']}, TID={context['tid']}"
    )
    return inserted_count


def check_and_fill_missing_data_simple(
    db: Session,
    current_time: datetime,
    lookback_hours: int = 24,
    commit_every: int = 0,
) -> tuple:
    """
    Robust missing data check and fill with all safety mechanisms.
    Only fills historical gaps (never current time or future timestamps).
    Keys are date-bounded (lookback window), not a full-table DISTINCT.
    """
    context = get_context_info()
    fill_start_time = time.time()
    
    energy_logger.info(
        f"[CHECK_FILL_MISSING] Starting missing data check | "
        f"CurrentTime: {current_time.isoformat()} | LookbackHours: {lookback_hours} | "
        f"Context: PID={context['pid']}, TID={context['tid']}"
    )
    
    # STEP 1: Normalize and validate current_time
    current_time = normalize_and_validate_time(current_time)
    now = datetime.now()
    
    # STEP 2: Calculate safe time range
    start_time = current_time - timedelta(hours=lookback_hours)
    # CRITICAL: Exclude current interval (always use real data for current time)
    end_time = current_time - timedelta(minutes=15)
    
    # STEP 3: Additional safety - ensure end_time is not in future
    if end_time > now:
        end_time = now - timedelta(minutes=15)
        energy_logger.warning(
            f"[CHECK_FILL_MISSING] Adjusted end_time to avoid future | "
            f"NewEndTime: {end_time.isoformat()} | "
            f"Context: PID={context['pid']}, TID={context['tid']}"
        )
    
    # STEP 4: Ensure start_time <= end_time
    if start_time > end_time:
        energy_logger.warning(
            f"[CHECK_FILL_MISSING] Invalid time range - start > end | "
            f"StartTime: {start_time.isoformat()} | EndTime: {end_time.isoformat()} | "
            f"Context: PID={context['pid']}, TID={context['tid']}"
        )
        return 0, 0
    
    # STEP 5: Unique keys that already have rows inside the lookback window.
    # Never DISTINCT the full area_energy_stats table (50M+ rows).
    area_keys = (
        db.query(AreaEnergyStat.area_code, AreaEnergyStat.processor_id)
        .filter(
            AreaEnergyStat.created_at >= start_time,
            AreaEnergyStat.created_at <= current_time,
        )
        .distinct()
        .all()
    )
    area_keys = [(code, proc) for code, proc in area_keys if code is not None and proc is not None]
    
    energy_logger.info(
        f"[CHECK_FILL_MISSING] Found {len(area_keys)} area keys to process | "
        f"TimeRange: {start_time.isoformat()} to {end_time.isoformat()} | "
        f"Context: PID={context['pid']}, TID={context['tid']}"
    )
    
    if not area_keys:
        return 0, 0
    
    total_energy_filled = 0
    total_occupancy_filled = 0
    processed_keys = 0
    
    # STEP 6: Process each area with error isolation
    for area_code, processor_id in area_keys:
        try:
            # Check for missing energy data in historical periods only
            missing_energy_intervals = smart_gap_detection(
                db, area_code, processor_id, start_time, end_time, "energy", current_time
            )
            if missing_energy_intervals:
                energy_logger.debug(
                    f"[CHECK_FILL_MISSING] Found {len(missing_energy_intervals)} missing energy intervals | "
                    f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
                    f"Context: PID={context['pid']}, TID={context['tid']}"
                )
                energy_filled = fill_missing_energy_data_smart(db, area_code, processor_id, missing_energy_intervals)
                total_energy_filled += energy_filled
            
            # Check for missing occupancy data in historical periods only
            missing_occupancy_intervals = smart_gap_detection(
                db, area_code, processor_id, start_time, end_time, "occupancy", current_time
            )
            if missing_occupancy_intervals:
                energy_logger.debug(
                    f"[CHECK_FILL_MISSING] Found {len(missing_occupancy_intervals)} missing occupancy intervals | "
                    f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
                    f"Context: PID={context['pid']}, TID={context['tid']}"
                )
                occupancy_filled = fill_missing_occupancy_data_smart(db, area_code, processor_id, missing_occupancy_intervals)
                total_occupancy_filled += occupancy_filled
        
        except Exception as e:
            energy_logger.error(
                f"[CHECK_FILL_MISSING] Failed processing area | "
                f"AreaCode: {area_code} | ProcessorID: {processor_id} | "
                f"Error: {e} | Context: PID={context['pid']}, TID={context['tid']}",
                exc_info=True
            )
            print(f"[ERROR] Failed processing area {area_code} (P{processor_id}): {e}")
            continue

        if commit_every and commit_every > 0:
            processed_keys += 1
            if processed_keys % commit_every == 0:
                try:
                    db.commit()
                except Exception as commit_err:
                    db.rollback()
                    energy_logger.error(
                        f"[CHECK_FILL_MISSING] Chunk commit failed | "
                        f"Error: {commit_err} | Context: PID={context['pid']}, TID={context['tid']}",
                        exc_info=True,
                    )

    if commit_every and commit_every > 0:
        try:
            db.commit()
        except Exception as commit_err:
            db.rollback()
            energy_logger.error(
                f"[CHECK_FILL_MISSING] Final chunk commit failed | "
                f"Error: {commit_err} | Context: PID={context['pid']}, TID={context['tid']}",
                exc_info=True,
            )
    
    fill_duration = (time.time() - fill_start_time) * 1000
    energy_logger.info(
        f"[CHECK_FILL_MISSING] Completed missing data check | "
        f"EnergyFilled: {total_energy_filled} | OccupancyFilled: {total_occupancy_filled} | "
        f"Duration: {fill_duration:.2f}ms | "
        f"Context: PID={context['pid']}, TID={context['tid']}"
    )
    
    return total_energy_filled, total_occupancy_filled


GAPFILL_CHECKPOINT_KEY = "energy_gapfill_checkpoint"
GAPFILL_COMMIT_EVERY = 25
GAPFILL_MAX_LOOKBACK_HOURS = 24


def _read_gapfill_checkpoint(db: Session) -> Optional[datetime]:
    try:
        from app.crud.installation_settings import get_setting

        row = get_setting(db, GAPFILL_CHECKPOINT_KEY)
    except Exception:
        return None
    if row is None or row.setting_value is None:
        return None
    raw = row.setting_value
    if isinstance(raw, dict):
        raw = raw.get("last_processed_at")
    if not raw or not isinstance(raw, str):
        return None
    try:
        parsed = datetime.fromisoformat(raw)
    except ValueError:
        return None
    if parsed.tzinfo is not None:
        parsed = parsed.replace(tzinfo=None)
    return parsed


def _write_gapfill_checkpoint(db: Session, last_processed_at: datetime) -> None:
    try:
        from app.crud.installation_settings import upsert_setting

        upsert_setting(
            db,
            GAPFILL_CHECKPOINT_KEY,
            {"last_processed_at": last_processed_at.isoformat()},
        )
    except Exception as exc:
        energy_logger.error(
            f"[GAPFILL] Failed to persist checkpoint | Error: {exc}",
            exc_info=True,
        )


def _prepare_snapshot_rows(db: Session, areas, current_time: datetime):
    """Build snapshot rows from current_area_status with one duplicate lookup per table."""
    created_date, timespan_15min, timespan_6hr = generate_time_columns(current_time)
    existing_energy = {
        (row.area_code, row.processor_id)
        for row in db.query(AreaEnergyStat.area_code, AreaEnergyStat.processor_id)
        .filter(AreaEnergyStat.created_at == current_time)
        .all()
    }
    existing_occupancy = {
        (row.area_code, row.processor_id)
        for row in db.query(AreaOccupancyStat.area_code, AreaOccupancyStat.processor_id)
        .filter(AreaOccupancyStat.created_at == current_time)
        .all()
    }

    energy_entries = []
    occupancy_entries = []
    duplicate_attempts = 0
    skipped_no_area_id = 0

    for area in areas:
        if area.area_code is None:
            continue
        if area.area_id is None:
            skipped_no_area_id += 1
            continue

        energy_key = (area.area_code, area.processor_id)
        occupancy_key = (str(area.area_code), area.processor_id)

        if area.instantaneous_power is not None or area.instantaneous_max_power is not None:
            if energy_key in existing_energy:
                duplicate_attempts += 1
            else:
                inst_power = area.instantaneous_power or 0
                inst_max_power = area.instantaneous_max_power or 0
                elapsed_seconds = 900
                energy_entry = AreaEnergyStat(
                    area_id=area.area_id,
                    area_code=area.area_code,
                    processor_id=area.processor_id,
                    instantaneous_power=area.instantaneous_power,
                    instantaneous_max_power=area.instantaneous_max_power,
                    time_elapsed_in_sec=elapsed_seconds,
                    energy_consumed_in_Wh=round((inst_power * elapsed_seconds) / 3600.0, 3),
                    total_energy=round((inst_max_power * elapsed_seconds) / 3600.0, 3),
                    energy_saved_in_Wh=round(((inst_max_power - inst_power) * elapsed_seconds) / 3600.0, 3),
                    created_at=current_time,
                    approximated_filler=None,
                    created_date=created_date,
                    timespan_15min=timespan_15min,
                    timespan_6hr=timespan_6hr,
                )
                energy_entries.append(energy_entry)
                existing_energy.add(energy_key)

        if area.occupancy_status is not None:
            if occupancy_key in existing_occupancy:
                duplicate_attempts += 1
            else:
                occupancy_entry = AreaOccupancyStat(
                    area_id=area.area_id,
                    area_code=str(area.area_code),
                    processor_id=area.processor_id,
                    occupancy_status=area.occupancy_status,
                    created_at=current_time,
                    approximated_filler=None,
                    created_date=created_date,
                    timespan_15min=timespan_15min,
                    timespan_6hr=timespan_6hr,
                )
                occupancy_entries.append(occupancy_entry)
                existing_occupancy.add(occupancy_key)

    return energy_entries, occupancy_entries, {
        "duplicate_attempts": duplicate_attempts,
        "skipped_no_area_id": skipped_no_area_id,
    }


# --------------------- ENERGY + OCCUPANCY SNAPSHOT JOB --------------------- #
def log_energy_stats():
    _jobs_on = False
    _job_started_at = None
    _job_t0 = time.perf_counter()
    _job_outcome = "success"
    _job_error_class = None
    _job_error_message = None
    try:
        from app.monitoring.job_wrapper import (
            emit_job_started,
            is_job_instrumentation_active,
        )

        _jobs_on = is_job_instrumentation_active()
        _job_started_at = datetime.now(timezone.utc)
        if _jobs_on:
            emit_job_started(
                "log_energy_stats",
                started_at=_job_started_at,
                trigger_source="apscheduler",
                component_code="energy_logger",
            )
    except Exception:
        _jobs_on = False

    db: Session = SessionLocal()
    context = get_context_info()
    cycle_start_time = time.time()
    
    energy_inserted = 0
    occupancy_inserted = 0
    duplicate_attempts = 0
    validation_failures = 0
    insert_errors = 0
    race_condition_detected = 0
    processor_count = 0
    rows_written = None
    snapshot_started = False
    start_iso = datetime.now().isoformat(timespec="seconds")
    current_time = None
    
    # Track all insertions for detailed logging
    insertions_log = []

    try:
        energy_logger.info(
            f"[LOG_ENERGY_STATS] ========== CYCLE START ========== | "
            f"Context: PID={context['pid']}, TID={context['tid']}, Time={context['timestamp']}"
        )

        # Normalize and validate current time
        current_time = normalize_and_validate_time(datetime.now())
        try:
            from app.live_state_health import record_snapshot_start

            record_snapshot_start(slot_at=current_time.isoformat())
            snapshot_started = True
        except Exception:
            snapshot_started = False
        energy_logger.info(
            f"[LOG_ENERGY_STATS] Normalized time: {current_time.isoformat()} | "
            f"Context: PID={context['pid']}, TID={context['tid']}"
        )

        # Get all areas to process
        areas = db.query(CurrentAreaEvent).all()
        processor_count = len(
            {int(a.processor_id) for a in areas if getattr(a, "processor_id", None) is not None}
        )
        energy_logger.info(
            f"[LOG_ENERGY_STATS] Found {len(areas)} areas to process | "
            f"Context: PID={context['pid']}, TID={context['tid']}"
        )

        energy_entries, occupancy_entries, snap_stats = _prepare_snapshot_rows(db, areas, current_time)
        for entry in energy_entries:
            db.add(entry)
        for entry in occupancy_entries:
            db.add(entry)
        energy_inserted = len(energy_entries)
        occupancy_inserted = len(occupancy_entries)
        duplicate_attempts = snap_stats["duplicate_attempts"]
        if snap_stats["skipped_no_area_id"]:
            energy_logger.warning(
                f"[LOG_ENERGY_STATS] Skipped {snap_stats['skipped_no_area_id']} areas without area_id | "
                f"Context: PID={context['pid']}, TID={context['tid']}"
            )

        # Snapshot only: no gap-fill and no processor_zone_events rebuild in this transaction.

        commit_start = time.time()
        try:
            # Before commit, log what's in the session
            pending_count = len(db.new) if hasattr(db, 'new') else 'N/A'
            
            energy_logger.info(
                f"[LOG_ENERGY_STATS] PRE-COMMIT | "
                f"PendingObjects: {pending_count} | "
                f"EnergyInserted: {energy_inserted} | OccupancyInserted: {occupancy_inserted} | "
                f"Context: PID={context['pid']}, TID={context['tid']}"
            )
            
            db.commit()
            commit_duration = (time.time() - commit_start) * 1000
            
            # After commit, verify what was actually inserted
            post_commit_count = db.query(func.count(AreaEnergyStat.id)).filter(
                AreaEnergyStat.created_at == current_time
            ).scalar() or 0
            
            cycle_duration = (time.time() - cycle_start_time) * 1000
            rows_written = int(post_commit_count)
            
            energy_logger.info(
                f"[LOG_ENERGY_STATS] ========== CYCLE COMPLETE ========== | "
                f"COMMIT SUCCESS | CommitDuration: {commit_duration:.2f}ms | "
                f"TotalCycleDuration: {cycle_duration:.2f}ms | "
                f"EnergyInserted: {energy_inserted} | OccupancyInserted: {occupancy_inserted} | "
                f"Duplicates: {duplicate_attempts} | ValidationFailures: {validation_failures} | "
                f"InsertErrors: {insert_errors} | RaceConditions: {race_condition_detected} | "
                f"PostCommitCount: {post_commit_count} | "
                f"Context: PID={context['pid']}, TID={context['tid']} | "
                f"Timestamp: {current_time.isoformat()}"
            )

            # Log all insertions for this cycle
            if insertions_log:
                energy_logger.debug(
                    f"[LOG_ENERGY_STATS] Insertions detail: {insertions_log} | "
                    f"Context: PID={context['pid']}, TID={context['tid']}"
                )
            
            # Enhanced console logging
            print(
                f"[LOGGER] Snapshot Energy: {energy_inserted} | Occupancy: {occupancy_inserted} | "
                f"Duplicates: {duplicate_attempts} | RaceConditions: {race_condition_detected} @ {current_time}"
            )
            
            # Log successful time column population
            total_records = energy_inserted + occupancy_inserted
            if total_records > 0:
                print(f"[LOGGER] Time columns successfully populated for {total_records} records")
                
        except Exception as e:
            db.rollback()
            commit_duration = (time.time() - commit_start) * 1000
            cycle_duration = (time.time() - cycle_start_time) * 1000
            energy_logger.error(
                f"[LOG_ENERGY_STATS] ========== CYCLE FAILED ========== | "
                f"COMMIT ROLLBACK | CommitDuration: {commit_duration:.2f}ms | "
                f"TotalCycleDuration: {cycle_duration:.2f}ms | "
                f"Error: {str(e)} | ErrorType: {type(e).__name__} | "
                f"Context: PID={context['pid']}, TID={context['tid']} | "
                f"Traceback: {traceback.format_exc()}",
                exc_info=True
            )
            raise

    except Exception as e:
        _job_outcome = "failure"
        _job_error_class = type(e).__name__
        _job_error_message = str(e)
        cycle_duration = (time.time() - cycle_start_time) * 1000
        energy_logger.error(
            f"[LOG_ENERGY_STATS] ========== FATAL ERROR ========== | "
            f"TotalCycleDuration: {cycle_duration:.2f}ms | "
            f"Error: {str(e)} | ErrorType: {type(e).__name__} | "
            f"Context: PID={context['pid']}, TID={context['tid']} | "
            f"Traceback: {traceback.format_exc()}",
            exc_info=True
        )
        print(f"[LOGGER ERROR] Fatal error in log_energy_stats: {e}")
        print(f"[LOGGER ERROR] Error type: {type(e).__name__}")
        traceback.print_exc()
    finally:
        db.close()
        energy_logger.debug(
            f"[LOG_ENERGY_STATS] Database session closed | "
            f"Context: PID={context['pid']}, TID={context['tid']}"
        )
        if snapshot_started:
            try:
                from app.live_state_health import record_snapshot_finish

                record_snapshot_finish(
                    success=_job_outcome == "success",
                    slot_at=current_time.isoformat() if current_time is not None else None,
                    started_at=start_iso,
                    finished_at=datetime.now().isoformat(timespec="seconds"),
                    duration_ms=round((time.time() - cycle_start_time) * 1000, 2),
                    rows_written=rows_written,
                    processor_count=processor_count,
                    error=_job_error_message,
                )
            except Exception:
                pass
        if _jobs_on and _job_started_at is not None:
            try:
                from app.monitoring.job_wrapper import emit_job_finished

                emit_job_finished(
                    "log_energy_stats",
                    _job_outcome,
                    started_at=_job_started_at,
                    duration_ms=max(0, int((time.perf_counter() - _job_t0) * 1000)),
                    error_class=_job_error_class,
                    error_message=_job_error_message,
                    trigger_source="apscheduler",
                    component_code="energy_logger",
                )
            except Exception:
                pass


# --------------------- INDEPENDENT CHECKPOINTED GAP-FILL --------------------- #
def log_energy_gapfill():
    """Repair historical missing 15-minute windows. Never shares the snapshot transaction."""
    _jobs_on = False
    _job_started_at = None
    _job_t0 = time.perf_counter()
    _job_outcome = "success"
    _job_error_class = None
    _job_error_message = None
    try:
        from app.monitoring.job_wrapper import (
            emit_job_started,
            is_job_instrumentation_active,
        )

        _jobs_on = is_job_instrumentation_active()
        _job_started_at = datetime.now(timezone.utc)
        if _jobs_on:
            emit_job_started(
                "log_energy_gapfill",
                started_at=_job_started_at,
                trigger_source="apscheduler",
                component_code="energy_logger",
            )
    except Exception:
        _jobs_on = False

    db = None
    context = get_context_info()
    cycle_start_time = time.time()
    energy_filled = 0
    occupancy_filled = 0
    lookback_hours = None
    checkpoint_at = None
    gapfill_started = False
    finish_recorded = False
    start_iso = datetime.now().isoformat(timespec="seconds")
    try:
        try:
            from app.live_state_health import record_gapfill_start

            allowed = record_gapfill_start()
        except Exception:
            allowed = True
        if not allowed:
            try:
                from app.live_state_health import record_gapfill_finish

                record_gapfill_finish(
                    success=True,
                    deferred=True,
                    started_at=start_iso,
                    finished_at=datetime.now().isoformat(timespec="seconds"),
                    duration_ms=0,
                )
                finish_recorded = True
            except Exception:
                finish_recorded = True
            energy_logger.info(
                "[GAPFILL] Deferred because snapshot is running | "
                f"Context: PID={context['pid']}, TID={context['tid']}"
            )
            print("[LOGGER] Gap-fill deferred (snapshot running)")
            return

        gapfill_started = True
        db = SessionLocal()
        current_time = normalize_and_validate_time(datetime.now())
        checkpoint = _read_gapfill_checkpoint(db)
        lookback_hours = GAPFILL_MAX_LOOKBACK_HOURS
        if checkpoint is not None:
            elapsed_hours = (current_time - checkpoint).total_seconds() / 3600.0
            # Overlap one interval so a window on the checkpoint boundary is not skipped.
            lookback_hours = min(GAPFILL_MAX_LOOKBACK_HOURS, max(0.25, elapsed_hours + 0.25))

        energy_logger.info(
            f"[GAPFILL] Starting | CurrentTime: {current_time.isoformat()} | "
            f"Checkpoint: {checkpoint.isoformat() if checkpoint else 'none'} | "
            f"LookbackHours: {lookback_hours} | "
            f"Context: PID={context['pid']}, TID={context['tid']}"
        )

        energy_filled, occupancy_filled = check_and_fill_missing_data_simple(
            db,
            current_time,
            lookback_hours=lookback_hours,
            commit_every=GAPFILL_COMMIT_EVERY,
        )
        end_time = current_time - timedelta(minutes=15)
        _write_gapfill_checkpoint(db, end_time)
        checkpoint_at = end_time.isoformat()

        duration_ms = (time.time() - cycle_start_time) * 1000
        energy_logger.info(
            f"[GAPFILL] Complete | EnergyFilled: {energy_filled} | "
            f"OccupancyFilled: {occupancy_filled} | Duration: {duration_ms:.2f}ms | "
            f"Context: PID={context['pid']}, TID={context['tid']}"
        )
        print(
            f"[LOGGER] Gap-fill Energy: {energy_filled} | Occupancy: {occupancy_filled} "
            f"@ {current_time}"
        )
    except Exception as e:
        _job_outcome = "failure"
        _job_error_class = type(e).__name__
        _job_error_message = str(e)
        if db is not None:
            try:
                db.rollback()
            except Exception:
                pass
        energy_logger.error(
            f"[GAPFILL] Fatal error | Error: {e} | "
            f"Context: PID={context['pid']}, TID={context['tid']}",
            exc_info=True,
        )
        print(f"[LOGGER ERROR] Fatal error in log_energy_gapfill: {e}")
    finally:
        if db is not None:
            db.close()
        if gapfill_started and not finish_recorded:
            try:
                from app.live_state_health import record_gapfill_finish

                record_gapfill_finish(
                    success=_job_outcome == "success",
                    started_at=start_iso,
                    finished_at=datetime.now().isoformat(timespec="seconds"),
                    duration_ms=round((time.time() - cycle_start_time) * 1000, 2),
                    energy_filled=energy_filled,
                    occupancy_filled=occupancy_filled,
                    lookback_hours=lookback_hours,
                    checkpoint_at=checkpoint_at,
                    error=_job_error_message,
                )
            except Exception:
                pass
        if _jobs_on and _job_started_at is not None:
            try:
                from app.monitoring.job_wrapper import emit_job_finished

                emit_job_finished(
                    "log_energy_gapfill",
                    _job_outcome,
                    started_at=_job_started_at,
                    duration_ms=max(0, int((time.perf_counter() - _job_t0) * 1000)),
                    error_class=_job_error_class,
                    error_message=_job_error_message,
                    trigger_source="apscheduler",
                    component_code="energy_logger",
                )
            except Exception:
                pass


# --------------------- SCHEDULER SETUP --------------------- #
async def run_scheduler():
    # Blocking ORM runs in a thread pool. The asyncio loop only keeps the process alive.
    scheduler = BackgroundScheduler(
        executors={"default": ThreadPoolExecutor(max_workers=2)},
        job_defaults={
            "coalesce": True,
            "max_instances": 1,
            "misfire_grace_time": 300,
        },
    )
    
    # Calculate next run time to align with 15-minute intervals (00:00, 00:15, 00:30, 00:45)
    now = datetime.now()  # Use local time instead of UTC
    minute = now.minute
    
    # Round up to the next 15-minute mark
    if minute % 15 == 0:
        # Already at a 15-minute mark, go to next one
        next_minute = minute + 15
    else:
        # Round up to next 15-minute mark
        next_minute = ((minute // 15) + 1) * 15
    
    if next_minute >= 60:
        next_minute = 0
        next_hour = now.hour + 1
        if next_hour >= 24:
            next_hour = 0
            next_day = now.day + 1
        else:
            next_day = now.day
    else:
        next_hour = now.hour
        next_day = now.day
    
    next_run_time = now.replace(day=next_day, hour=next_hour, minute=next_minute, second=0, microsecond=0)
    gapfill_next_run = next_run_time + timedelta(seconds=45)
    
    scheduler.add_job(
        log_energy_stats,
        trigger=IntervalTrigger(minutes=15),
        id="log_energy_stats",
        name="Fast current_area_status snapshot at fixed 15-minute intervals",
        replace_existing=True,
        next_run_time=next_run_time,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=300,
    )
    scheduler.add_job(
        log_energy_gapfill,
        trigger=IntervalTrigger(minutes=15),
        id="log_energy_gapfill",
        name="Independent checkpointed historical gap-fill",
        replace_existing=True,
        next_run_time=gapfill_next_run,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=600,
    )
    scheduler.start()
    context = get_context_info()
    energy_logger.info(
        f"[SCHEDULER] Scheduler started | "
        f"SnapshotNextRun: {next_run_time.isoformat()} | "
        f"GapfillNextRun: {gapfill_next_run.isoformat()} | "
        f"Executor: ThreadPoolExecutor(2) | "
        f"Context: PID={context['pid']}, TID={context['tid']}"
    )
    print(
        f"[LOGGER] Scheduler started, snapshot at {next_run_time}, "
        f"gap-fill at {gapfill_next_run}"
    )

    energy_logger.info(
        "[SCHEDULER] Running catch-up snapshot for the current aligned slot"
    )
    try:
        await asyncio.get_running_loop().run_in_executor(None, log_energy_stats)
    except Exception as catchup_err:
        energy_logger.error(
            f"[SCHEDULER] Catch-up snapshot failed | Error: {catchup_err}",
            exc_info=True,
        )

    try:
        await asyncio.Event().wait()
    except asyncio.CancelledError:
        pass


# --------------------- TESTING FUNCTIONS --------------------- #
def test_enhanced_missing_data_handling():
    """
    Test function to validate enhanced missing data handling logic
    """
    db = SessionLocal()
    
    try:
        print("[TEST] Starting enhanced missing data handling test...")
        
        # Test 1: Generate 15-minute intervals
        start_time = datetime.now() - timedelta(hours=2)
        end_time = datetime.now()
        intervals = generate_15min_intervals(start_time, end_time)
        print(f"[TEST] Generated {len(intervals)} intervals between {start_time} and {end_time}")
        
        # Test 2: Test unified duplicate check (use an existing (area_code, processor_id) if available)
        sample_key = db.query(AreaEnergyStat.area_code, AreaEnergyStat.processor_id).first()
        if sample_key:
            test_area_code, test_processor_id = sample_key
            test_timestamp = datetime.now()
            is_duplicate = unified_duplicate_check(db, test_area_code, test_processor_id, test_timestamp, "energy")
            print(f"[TEST] Unified duplicate check result: {is_duplicate}")
        
        # Test 3: Test smart gap detection (if any area_codes exist)
        area_key = db.query(AreaEnergyStat.area_code, AreaEnergyStat.processor_id).first()
        if area_key:
            area_code, processor_id = area_key
            missing_intervals = smart_gap_detection(db, area_code, processor_id, start_time, end_time, "energy")
            print(f"[TEST] Smart gap detection found {len(missing_intervals)} missing intervals for area_code {area_code} (P{processor_id})")
            
            # Test 4: Get previous valid value
            if missing_intervals:
                previous_value = get_previous_valid_value(db, area_code, processor_id, missing_intervals[0], "energy")
                if previous_value:
                    print(f"[TEST] Previous valid value found: {previous_value.created_at}")
                else:
                    print(f"[TEST] No previous valid value found")
        
        # Test 5: Test validation before insert
        if sample_key:
            is_valid = validate_before_insert(db, test_area_code, test_processor_id, test_timestamp, "energy")
            print(f"[TEST] Validation before insert result: {is_valid}")
        
        # Test 6: Test simple missing data check
        current_time = datetime.now()
        energy_filled, occupancy_filled = check_and_fill_missing_data_simple(db, current_time, lookback_hours=2)
        print(f"[TEST] Simple missing data check - Energy: {energy_filled}, Occupancy: {occupancy_filled}")
        
        print("[TEST] Enhanced missing data handling test completed successfully!")
        
    except Exception as e:
        print(f"[TEST ERROR] {e}")
    finally:
        db.close()


# --------------------- PROCESS LOCK MANAGEMENT --------------------- #
# Lock file path - stored in temp directory
# Resolve to absolute path to ensure consistency regardless of working directory
_lock_dir = tempfile.gettempdir()
LOCK_FILE_PATH = os.path.abspath(os.path.join(_lock_dir, "energy_logger.lock"))

def is_process_running(pid: int) -> bool:
    """
    Check if a process with the given PID is still running.
    Cross-platform implementation without external dependencies.
    
    Args:
        pid: Process ID to check
        
    Returns:
        True if process is running, False otherwise
    """
    try:
        if sys.platform == "win32":
            # On Windows, try to open the process handle
            # This will fail if the process doesn't exist
            import ctypes
            kernel32 = ctypes.windll.kernel32
            # PROCESS_QUERY_INFORMATION = 0x1000
            handle = kernel32.OpenProcess(0x1000, False, pid)
            if handle:
                kernel32.CloseHandle(handle)
                return True
            return False
        else:
            # On Unix/Linux, use os.kill with signal 0
            # Signal 0 doesn't kill, it just checks if process exists
            os.kill(pid, 0)
            return True
    except (OSError, ProcessLookupError, AttributeError, ValueError):
        # Process doesn't exist or error occurred
        return False
    except Exception as e:
        # Unexpected error - log it but assume process is not running
        energy_logger.warning(
            f"[PROCESS_LOCK] Unexpected error checking process {pid} | Error: {e} | "
            f"Context: PID={os.getpid()}, TID={threading.get_ident()}"
        )
        return False


_LOCK_ACQUIRE_ATTEMPTS = 5


def _parse_lock_pid(lock_content: str) -> int:
    """Parse the owner PID from lock-file text (first token)."""
    return int(lock_content.strip().split()[0])


def _read_lock_file_text() -> Optional[str]:
    """Return stripped lock contents, or None if the file is missing."""
    try:
        with open(LOCK_FILE_PATH, "r") as f:
            return f.read().strip()
    except FileNotFoundError:
        return None


def _remove_lock_file() -> None:
    try:
        os.remove(LOCK_FILE_PATH)
    except FileNotFoundError:
        return


def _create_lock_exclusive(pid: int) -> bool:
    """
    Atomically create the lock file. Returns True if this process created it.

    Uses O_CREAT|O_EXCL so two starters cannot both open('w') a stale path
    and both believe they own the singleton.
    """
    flags = os.O_CREAT | os.O_EXCL | os.O_WRONLY
    if hasattr(os, "O_BINARY"):
        flags |= os.O_BINARY
    try:
        fd = os.open(LOCK_FILE_PATH, flags)
    except FileExistsError:
        return False
    except OSError as e:
        if getattr(e, "errno", None) == 17:  # EEXIST
            return False
        raise
    try:
        os.write(fd, str(pid).encode("ascii"))
        os.fsync(fd)
    except Exception:
        try:
            os.close(fd)
        except OSError:
            pass
        try:
            os.remove(LOCK_FILE_PATH)
        except OSError:
            pass
        raise
    os.close(fd)
    return True


def acquire_process_lock() -> bool:
    """
    Acquire a process lock by creating a lock file with the current PID.
    Checks for existing locks and validates if the process is still running.

    Stale (dead-PID) files from PM2 stop / taskkill /F are deleted and the
    lock is recreated immediately. A live owner PID keeps singleton protection.

    Returns:
        True if lock was acquired successfully, False if another process is running
    """
    current_pid = os.getpid()
    context = get_context_info()
    
    # Ensure logs directory exists (should already exist from logger setup, but be safe)
    lock_dir = os.path.dirname(LOCK_FILE_PATH)
    try:
        os.makedirs(lock_dir, exist_ok=True)
    except Exception as e:
        energy_logger.error(
            f"[PROCESS_LOCK] Failed to create lock directory | Error: {e} | "
            f"LockDir: {lock_dir} | Context: PID={context['pid']}, TID={context['tid']}"
        )
        return False

    last_create_error = None
    for _attempt in range(_LOCK_ACQUIRE_ATTEMPTS):
        try:
            if _create_lock_exclusive(current_pid):
                energy_logger.info(
                    f"[PROCESS_LOCK] Lock acquired successfully | PID: {current_pid} | "
                    f"LockFile: {LOCK_FILE_PATH} | Context: PID={context['pid']}, TID={context['tid']}"
                )
                print(f"[Energy Logger] Process lock acquired (PID: {current_pid})")
                return True
        except Exception as e:
            last_create_error = e
            energy_logger.error(
                f"[PROCESS_LOCK] Failed to create lock file | Error: {e} | "
                f"LockFile: {LOCK_FILE_PATH} | CurrentPID: {current_pid} | "
                f"Context: PID={context['pid']}, TID={context['tid']}"
            )
            return False

        try:
            lock_content = _read_lock_file_text()
            if lock_content is None:
                # Lost a delete/create race — retry exclusive create.
                continue
            if not lock_content:
                energy_logger.warning(
                    f"[PROCESS_LOCK] Found empty lock file, removing | "
                    f"CurrentPID: {current_pid} | Context: PID={context['pid']}, TID={context['tid']}"
                )
                try:
                    _remove_lock_file()
                except Exception as e:
                    energy_logger.error(
                        f"[PROCESS_LOCK] Failed to remove empty lock file | Error: {e} | "
                        f"Context: PID={context['pid']}, TID={context['tid']}"
                    )
                    return False
                continue

            existing_pid = _parse_lock_pid(lock_content)
        except (ValueError, IOError, OSError) as e:
            energy_logger.warning(
                f"[PROCESS_LOCK] Lock file is corrupted or invalid, removing | Error: {e} | "
                f"LockFile: {LOCK_FILE_PATH} | CurrentPID: {current_pid} | "
                f"Context: PID={context['pid']}, TID={context['tid']}"
            )
            try:
                _remove_lock_file()
            except Exception as cleanup_error:
                energy_logger.error(
                    f"[PROCESS_LOCK] Failed to remove corrupted lock file | Error: {cleanup_error} | "
                    f"Context: PID={context['pid']}, TID={context['tid']}"
                )
                return False
            continue

        if existing_pid == current_pid:
            energy_logger.info(
                f"[PROCESS_LOCK] Lock acquired successfully | PID: {current_pid} | "
                f"LockFile: {LOCK_FILE_PATH} | Context: PID={context['pid']}, TID={context['tid']}"
            )
            print(f"[Energy Logger] Process lock acquired (PID: {current_pid})")
            return True

        if is_process_running(existing_pid):
            energy_logger.warning(
                f"[PROCESS_LOCK] Another energy logger process is already running | "
                f"ExistingPID: {existing_pid} | CurrentPID: {current_pid} | "
                f"LockFile: {LOCK_FILE_PATH} | Context: PID={context['pid']}, TID={context['tid']}"
            )
            print(f"[Energy Logger] Another instance is already running (PID: {existing_pid}). Exiting.")
            return False

        energy_logger.warning(
            f"[PROCESS_LOCK] Found stale lock file from dead process | "
            f"StalePID: {existing_pid} | CurrentPID: {current_pid} | "
            f"LockFile: {LOCK_FILE_PATH} | Context: PID={context['pid']}, TID={context['tid']}"
        )
        try:
            _remove_lock_file()
        except Exception as e:
            energy_logger.error(
                f"[PROCESS_LOCK] Failed to remove stale lock file | Error: {e} | "
                f"StalePID: {existing_pid} | Context: PID={context['pid']}, TID={context['tid']}"
            )
            return False

    energy_logger.error(
        f"[PROCESS_LOCK] Failed to create lock file | Error: {last_create_error or 'retry exhausted'} | "
        f"LockFile: {LOCK_FILE_PATH} | CurrentPID: {current_pid} | "
        f"Context: PID={context['pid']}, TID={context['tid']}"
    )
    return False


def release_process_lock():
    """
    Release the process lock by removing the lock file.
    This function verifies ownership before removing to prevent accidental deletion
    of another process's lock file.
    This is called automatically on exit via atexit.register().
    """
    current_pid = os.getpid()
    context = get_context_info()
    
    try:
        if not os.path.exists(LOCK_FILE_PATH):
            # Lock file doesn't exist - nothing to release
            return
        
        # Verify we own the lock before removing
        try:
            lock_content = _read_lock_file_text()
            if lock_content is None:
                return
            if not lock_content:
                # Empty lock file - safe to remove
                os.remove(LOCK_FILE_PATH)
                energy_logger.info(
                    f"[PROCESS_LOCK] Removed empty lock file | PID: {current_pid} | "
                    f"Context: PID={context['pid']}, TID={context['tid']}"
                )
                return
                
            lock_pid = _parse_lock_pid(lock_content)
            
            if lock_pid == current_pid:
                # We own the lock - safe to remove
                os.remove(LOCK_FILE_PATH)
                energy_logger.info(
                    f"[PROCESS_LOCK] Lock released successfully | PID: {current_pid} | "
                    f"LockFile: {LOCK_FILE_PATH} | Context: PID={context['pid']}, TID={context['tid']}"
                )
                print(f"[Energy Logger] Process lock released (PID: {current_pid})")
            else:
                # Lock is owned by a different process - don't remove it
                energy_logger.warning(
                    f"[PROCESS_LOCK] Attempted to release lock owned by different process | "
                    f"LockPID: {lock_pid} | CurrentPID: {current_pid} | "
                    f"LockFile: {LOCK_FILE_PATH} | Context: PID={context['pid']}, TID={context['tid']}"
                )
        
        except (ValueError, IOError, OSError) as e:
            # Lock file is corrupted or unreadable - log warning but try to remove it
            energy_logger.warning(
                f"[PROCESS_LOCK] Lock file is corrupted during release, attempting removal | "
                f"Error: {e} | CurrentPID: {current_pid} | "
                f"Context: PID={context['pid']}, TID={context['tid']}"
            )
            try:
                os.remove(LOCK_FILE_PATH)
            except Exception:
                pass
    
    except Exception as e:
        energy_logger.error(
            f"[PROCESS_LOCK] Failed to release lock file | Error: {e} | "
            f"CurrentPID: {current_pid} | LockFile: {LOCK_FILE_PATH} | "
            f"Context: PID={context['pid']}, TID={context['tid']}"
        )


# --------------------- PROCESS ENTRYPOINT --------------------- #
def energy_logger_process_entrypoint():
    """
    Entry point for the energy logger process.
    Implements process-level locking to ensure only one instance runs at a time.
    
    This function:
    1. Acquires a process lock before starting
    2. Registers cleanup handler to release lock on exit
    3. Runs the scheduler in an async event loop
    4. Ensures lock is released even on errors
    """
    current_pid = os.getpid()
    context = get_context_info()
    
    # Try to acquire process lock
    if not acquire_process_lock():
        energy_logger.error(
            f"[PROCESS_ENTRYPOINT] Failed to acquire lock, another instance is running | "
            f"PID: {current_pid} | LockFile: {LOCK_FILE_PATH} | "
            f"Context: PID={context['pid']}, TID={context['tid']}"
        )
        print(f"[Energy Logger] Cannot start - another instance is already running. Exiting.")
        sys.exit(1)
    
    # Register cleanup function to release lock on normal exit
    # This will be called even if the process is terminated normally
    atexit.register(release_process_lock)

    mon_handle = None
    fatal_error = False
    try:
        try:
            from app.monitoring.daemon_heartbeat import start_daemon_heartbeat

            mon_handle = start_daemon_heartbeat("energy_logger")
        except Exception as mon_err:
            energy_logger.warning(
                f"[PROCESS_ENTRYPOINT] Monitoring heartbeat start skipped | Error: {mon_err}"
            )

        try:
            from app.installation_config import is_energy_logger_manual

            _manual = is_energy_logger_manual()
        except Exception:
            _manual = (os.getenv("energy_logger_manual") or os.getenv("energy_logger_mannual") or "").strip().lower() in ("true", "1", "yes")
        energy_logger.info(
            f"[PROCESS_ENTRYPOINT] Energy logger process started | "
            f"PID: {current_pid} | LockFile: {LOCK_FILE_PATH} | "
            f"energy_logger_manual={_manual} | "
            f"Context: PID={context['pid']}, TID={context['tid']}"
        )
        print(f"[Energy Logger] Process started successfully (PID: {current_pid})")
        
        # Run the scheduler - this will block until interrupted
        asyncio.run(run_scheduler())
    
    except (KeyboardInterrupt, SystemExit):
        # Normal termination - atexit will handle cleanup
        energy_logger.info(
            f"[PROCESS_ENTRYPOINT] Process interrupted normally | PID: {current_pid} | "
            f"Context: PID={context['pid']}, TID={context['tid']}"
        )
        print(f"[Energy Logger] Process interrupted (PID: {current_pid})")
    
    except Exception as e:
        # Unexpected error - log it and ensure cleanup
        fatal_error = True
        energy_logger.error(
            f"[PROCESS_ENTRYPOINT] Fatal error in energy logger process | "
            f"Error: {e} | PID: {current_pid} | "
            f"Context: PID={context['pid']}, TID={context['tid']} | "
            f"Traceback: {traceback.format_exc()}"
        )
        print(f"[Energy Logger] Fatal error: {e}")
        traceback.print_exc()
    
    finally:
        if mon_handle is not None:
            try:
                mon_handle.stop()
            except Exception:
                pass
        try:
            release_process_lock()
        except Exception as cleanup_error:
            energy_logger.error(
                f"[PROCESS_ENTRYPOINT] Error during final cleanup | Error: {cleanup_error} | "
                f"PID: {current_pid} | Context: PID={context['pid']}, TID={context['tid']}"
            )
        
        energy_logger.info(
            f"[PROCESS_ENTRYPOINT] Energy logger process exiting | PID: {current_pid} | "
            f"Context: PID={context['pid']}, TID={context['tid']}"
        )

    # Non-zero exit so RuntimeSupervisor classifies CRASH (not CLEAN_IDLE)
    # and applies on_failure restart. Cleanup above must run first.
    if fatal_error:
        sys.exit(1)
