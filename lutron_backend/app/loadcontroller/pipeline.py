"""
v2 orchestration: Connection Manager → Frame Reader → Dispatcher
→ State Machine → Area Index → Batch Writer.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from types import SimpleNamespace
from typing import Any, List, Optional

from app.loadcontroller.area_index import AreaIndex
from app.loadcontroller.batch_writer import BatchWriter
from app.loadcontroller.connection import LeapConnectionManager
from app.loadcontroller.dispatcher import MessageDispatcher
from app.loadcontroller.framing import IncrementalFrameReader, LoadControllerStreamError
from app.loadcontroller.metrics import LoadControllerMetrics, get_metrics
from app.loadcontroller.protocol import LC_STATUS_URL
from app.loadcontroller.recovery import (
    AREA_INDEX_REFRESH_SECONDS,
    PING_INTERVAL_SECONDS,
    RECONNECT_AFTER_FAIL_SECONDS,
    RECONNECT_AFTER_STREAM_SECONDS,
    should_send_recovery_read,
)
from app.loadcontroller.state_machine import AlertStateMachine

logger = logging.getLogger("loadcontroller_v2")

shutdown_event = asyncio.Event()


def _processor_ref(row: Any) -> SimpleNamespace:
    return SimpleNamespace(
        id=row.id,
        ipv4=row.ipv4,
        mac=row.mac,
        system=row.system,
        system_key=getattr(row, "system_key", None),
    )


async def _send_json(writer: Any, json_msg: dict) -> None:
    msg = (json.dumps(json_msg) + "\r\n").encode("utf-8")
    writer.write(msg)
    await writer.drain()


async def listen_until_disconnect(
    processor: Any,
    reader: Any,
    writer: Any,
    *,
    area_index: AreaIndex,
    metrics: LoadControllerMetrics,
    state_machine: AlertStateMachine,
    shutdown: asyncio.Event,
    batch_writer: Optional[BatchWriter] = None,
) -> None:
    writer_batch = batch_writer or BatchWriter(processor, area_index, metrics)
    frame_reader = IncrementalFrameReader(reader, metrics)

    async def handle_snapshot(msg: dict, *, full_snapshot: bool) -> None:
        body = msg.get("Body") or {}
        statuses = body.get("LoadControllerStatuses") or []
        if not isinstance(statuses, list):
            statuses = []
        t0 = time.perf_counter()
        events = state_machine.apply_snapshot(statuses, full_snapshot=full_snapshot)
        try:
            writer_batch.persist(
                events, full_snapshot=full_snapshot, statuses=statuses
            )
        except Exception:
            logger.exception(
                "[LC v2] batch persist failed processor_id=%s", processor.id
            )
        metrics.processing_duration_ms = (time.perf_counter() - t0) * 1000.0
        metrics.last_status_event_monotonic = time.monotonic()
        try:
            from app.monitoring.stream_health import note_stream

            note_stream(int(processor.id), "loadcontroller", event=True)
        except Exception:
            pass

    dispatcher = MessageDispatcher(
        metrics,
        on_ping=lambda _m: None,
        on_subscribe=lambda m: handle_snapshot(m, full_snapshot=True),
        on_read=lambda m: handle_snapshot(m, full_snapshot=True),
        on_update=lambda m: handle_snapshot(m, full_snapshot=False),
    )

    async def send_ping() -> None:
        while not shutdown.is_set():
            await asyncio.sleep(PING_INTERVAL_SECONDS)
            try:
                await _send_json(
                    writer,
                    {
                        "CommuniqueType": "ReadRequest",
                        "Header": {"URL": "/server/status/ping"},
                    },
                )
                metrics.pings_sent += 1
            except Exception:
                return

    async def recovery_read() -> None:
        while not shutdown.is_set():
            await asyncio.sleep(min(60.0, RECONNECT_AFTER_STREAM_SECONDS * 60))
            if shutdown.is_set():
                return
            if not should_send_recovery_read(metrics):
                continue
            try:
                await _send_json(
                    writer,
                    {
                        "CommuniqueType": "ReadRequest",
                        "Header": {"Url": LC_STATUS_URL},
                    },
                )
                metrics.recovery_reads += 1
                logger.info(
                    "[LC v2] recovery ReadRequest processor_id=%s reason=idle_600s",
                    processor.id,
                )
            except Exception:
                return

    ping_task = asyncio.create_task(send_ping())
    recovery_task = asyncio.create_task(recovery_read())
    try:
        while not shutdown.is_set():
            try:
                raw = await frame_reader.read_one_frame()
            except LoadControllerStreamError as stream_err:
                logger.warning(
                    "[LC v2] stream %s processor_id=%s %s — reconnecting",
                    stream_err.reason,
                    processor.id,
                    stream_err.detail or stream_err.reason,
                )
                break
            if not raw:
                continue
            try:
                await dispatcher.dispatch_raw(raw)
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("[LC v2] dispatch failed processor_id=%s", processor.id)
                await asyncio.sleep(1)
                break
    finally:
        ping_task.cancel()
        recovery_task.cancel()
        for task in (ping_task, recovery_task):
            try:
                await task
            except (asyncio.CancelledError, Exception):
                pass


async def monitor_processor(
    processor: Any,
    area_index: AreaIndex,
    metrics: LoadControllerMetrics,
    shutdown: asyncio.Event,
) -> None:
    mgr = LeapConnectionManager(processor, metrics)
    sm = AlertStateMachine(processor.id, metrics)
    while not shutdown.is_set():
        writer = None
        try:
            reader, writer = await mgr.connect()
            try:
                await mgr.subscribe(writer)
                await listen_until_disconnect(
                    processor,
                    reader,
                    writer,
                    area_index=area_index,
                    metrics=metrics,
                    state_machine=sm,
                    shutdown=shutdown,
                )
            finally:
                await mgr.close(writer)
            await asyncio.sleep(RECONNECT_AFTER_STREAM_SECONDS)
        except asyncio.CancelledError:
            break
        except Exception as exc:
            try:
                from app.monitoring.leap_connection_limits import report_connect_outcome

                report_connect_outcome(
                    success=False,
                    processor_id=processor.id,
                    ipv4=processor.ipv4,
                    error=exc,
                    source="loadcontroller_listener",
                )
            except Exception:
                pass
            _record_connection_error(processor.id)
            await asyncio.sleep(RECONNECT_AFTER_FAIL_SECONDS)


def _record_connection_error(processor_id: int) -> None:
    try:
        from app.database.session import SessionLocal
        from app.models.events import ProcessorConnectionError

        db = SessionLocal()
        try:
            db.add(
                ProcessorConnectionError(
                    processor_id=processor_id,
                    message="LoadController connection failed",
                )
            )
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()
    except Exception:
        pass


async def main_async(shutdown: Optional[asyncio.Event] = None) -> None:
    stop = shutdown or shutdown_event
    metrics = get_metrics()
    area_index = AreaIndex(metrics)

    from app.database.session import SessionLocal
    from app.models.processor import Processor

    db = SessionLocal()
    try:
        rows = db.query(Processor).filter_by(handshake_status=True).all()
        processors: List[Any] = [_processor_ref(p) for p in rows]
        try:
            area_index.rebuild(db)
        except Exception:
            logger.exception("[LC v2] area index initial build failed")
    except Exception:
        return
    finally:
        db.close()

    if not processors:
        return

    async def refresh_area_index() -> None:
        while not stop.is_set():
            await asyncio.sleep(AREA_INDEX_REFRESH_SECONDS)
            try:
                session = SessionLocal()
                try:
                    area_index.rebuild(session)
                    logger.info(
                        "[LC v2] area index refresh size=%s build_ms=%.2f",
                        len(area_index),
                        area_index.last_build_ms,
                    )
                finally:
                    session.close()
            except Exception:
                logger.exception("[LC v2] area index refresh failed")

    refresh_task = asyncio.create_task(refresh_area_index())
    tasks = [
        asyncio.create_task(monitor_processor(p, area_index, metrics, stop))
        for p in processors
    ]
    try:
        await asyncio.gather(*tasks, return_exceptions=True)
    except asyncio.CancelledError:
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
    finally:
        refresh_task.cancel()
        try:
            await refresh_task
        except (asyncio.CancelledError, Exception):
            pass


def loadcontroller_listener_entrypoint() -> None:
    mon_handle = None
    try:
        try:
            from app.monitoring.daemon_heartbeat import start_daemon_heartbeat

            mon_handle = start_daemon_heartbeat("loadcontroller_listener")
        except Exception as mon_err:
            print(f"[LoadController] Monitoring heartbeat start skipped: {mon_err}")
        asyncio.run(main_async())
    except KeyboardInterrupt:
        pass
    finally:
        if mon_handle is not None:
            try:
                mon_handle.stop()
            except Exception:
                pass
