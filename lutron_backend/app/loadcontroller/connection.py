"""
One long-lived LEAP connection per processor. One SubscribeRequest per socket.
SSLContext is created once per processor IPv4 and reused across reconnects.
"""

from __future__ import annotations

import asyncio
import json
import logging
import ssl
from typing import Any, Callable, Dict, Optional, Tuple

from app.loadcontroller.metrics import LoadControllerMetrics
from app.loadcontroller.protocol import LC_STATUS_URL
from app.utils.definitions import get_proc_hostname, get_processor_cert_paths

logger = logging.getLogger("loadcontroller_v2.connection")

Opener = Callable[..., Any]


def _default_ssl_context(ipv4: str) -> ssl.SSLContext:
    cert_paths = get_processor_cert_paths(ipv4)
    ctx = ssl.create_default_context(ssl.Purpose.SERVER_AUTH, cafile=cert_paths["lap_root"])
    ctx.load_cert_chain(
        certfile=cert_paths["leap_signed_csr"],
        keyfile=cert_paths["leap_private_key"],
    )
    ctx.check_hostname = False
    return ctx


class LeapConnectionManager:
    """Owns TLS connect / subscribe / close for one processor."""

    def __init__(
        self,
        processor: Any,
        metrics: Optional[LoadControllerMetrics] = None,
        *,
        ssl_factory: Optional[Callable[[str], ssl.SSLContext]] = None,
        opener: Optional[Opener] = None,
    ):
        self.processor = processor
        self.metrics = metrics
        self._ssl_factory = ssl_factory or _default_ssl_context
        self._opener = opener or asyncio.open_connection
        self._ssl_cache: Dict[str, ssl.SSLContext] = {}
        self._subscribed = False
        self._ever_connected = False

    def ssl_context(self) -> ssl.SSLContext:
        ipv4 = self.processor.ipv4
        cached = self._ssl_cache.get(ipv4)
        if cached is not None:
            if self.metrics is not None:
                self.metrics.ssl_context_reused += 1
            logger.info(
                "[LC v2] ssl_context ipv4=%s id=%s reused=true",
                ipv4,
                id(cached),
            )
            return cached
        ctx = self._ssl_factory(ipv4)
        self._ssl_cache[ipv4] = ctx
        if self.metrics is not None:
            self.metrics.ssl_context_created += 1
        logger.info(
            "[LC v2] ssl_context ipv4=%s id=%s reused=false created=true",
            ipv4,
            id(ctx),
        )
        return ctx

    @property
    def subscribed(self) -> bool:
        return self._subscribed

    @property
    def active_connections(self) -> int:
        return 1 if self._subscribed else 0

    async def connect(self) -> Tuple[Any, Any]:
        ctx = self.ssl_context()
        hostname = get_proc_hostname(self.processor.system, self.processor.mac)
        reader, writer = await self._opener(
            host=self.processor.ipv4,
            port=8081,
            ssl=ctx,
            server_hostname=hostname,
        )
        self._subscribed = False
        if self.metrics is not None:
            self.metrics.connect_count += 1
            if self._ever_connected:
                self.metrics.reconnect_count += 1
            self.metrics.active_connections += 1
        self._ever_connected = True
        self._note_slot(success=True)
        logger.info(
            "[LC v2] connected processor_id=%s ipv4=%s connect_count=%s reconnect_count=%s",
            getattr(self.processor, "id", None),
            self.processor.ipv4,
            self.metrics.connect_count if self.metrics else None,
            self.metrics.reconnect_count if self.metrics else None,
        )
        return reader, writer

    async def subscribe(self, writer: Any) -> None:
        if self._subscribed:
            logger.warning(
                "[LC v2] duplicate SubscribeRequest suppressed processor_id=%s",
                getattr(self.processor, "id", None),
            )
            return
        msg = {
            "CommuniqueType": "SubscribeRequest",
            "Header": {"Url": LC_STATUS_URL},
        }
        payload = (json.dumps(msg) + "\r\n").encode("utf-8")
        writer.write(payload)
        await writer.drain()
        self._subscribed = True
        if self.metrics is not None:
            self.metrics.subscribe_request_count += 1
            self.metrics.subscription_count = self.metrics.active_connections
        self._note_stream(subscribed=True)
        logger.info(
            "[LC v2] SubscribeRequest processor_id=%s url=%s count=%s active_subscriptions=%s",
            getattr(self.processor, "id", None),
            LC_STATUS_URL,
            self.metrics.subscribe_request_count if self.metrics else 1,
            self.metrics.active_connections if self.metrics else 1,
        )

    async def close(self, writer: Any) -> None:
        self._subscribed = False
        if self.metrics is not None and self.metrics.active_connections > 0:
            self.metrics.active_connections -= 1
            self.metrics.subscription_count = self.metrics.active_connections
        try:
            writer.close()
            wait = getattr(writer, "wait_closed", None)
            if wait is not None:
                await wait()
        except Exception:
            pass
        self._note_slot_released()
        self._note_stream(subscribed=False)

    def _note_slot(self, *, success: bool, error: Any = None) -> None:
        try:
            from app.monitoring.leap_connection_limits import (
                note_slot_acquired,
                report_connect_outcome,
            )

            report_connect_outcome(
                success=success,
                processor_id=getattr(self.processor, "id", None),
                ipv4=getattr(self.processor, "ipv4", None),
                error=error,
                source="loadcontroller_listener",
            )
            if success:
                note_slot_acquired(
                    getattr(self.processor, "id", None),
                    source="loadcontroller_listener",
                )
        except Exception:
            pass

    def _note_slot_released(self) -> None:
        try:
            from app.monitoring.leap_connection_limits import note_slot_released

            note_slot_released(
                getattr(self.processor, "id", None),
                source="loadcontroller_listener",
            )
        except Exception:
            pass

    def _note_stream(self, *, subscribed: Optional[bool] = None, event: bool = False) -> None:
        try:
            from app.monitoring.stream_health import note_stream

            note_stream(
                int(self.processor.id),
                "loadcontroller",
                event=event,
                subscribed=subscribed,
            )
        except Exception:
            pass
