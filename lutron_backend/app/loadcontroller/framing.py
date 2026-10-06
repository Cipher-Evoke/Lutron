"""
Incremental CRLF frame reader.

One complete JSON line at a time. Remainder stays in a bytearray.
Never returns a partial frame. Caps growth to avoid the historical multi-GB leak.
"""

from __future__ import annotations

import os
from typing import Optional, Protocol

from app.loadcontroller.metrics import LoadControllerMetrics

CRLF = b"\r\n"
DEFAULT_MAX_FRAME = 8 * 1024 * 1024
READ_CHUNK = 4096
IDLE_TIMEOUT = 5.0


class LoadControllerStreamError(Exception):
    """Fatal subscribe-stream condition — caller must drop the socket and reconnect."""

    def __init__(self, reason: str, detail: str = ""):
        self.reason = reason
        self.detail = detail or ""
        super().__init__(f"{reason}: {self.detail}" if self.detail else reason)


class ByteReader(Protocol):
    async def read(self, n: int) -> bytes: ...


def max_frame_bytes() -> int:
    raw = (os.getenv("LOADCONTROLLER_MAX_RECV_BYTES") or "").strip()
    if raw:
        try:
            return max(64 * 1024, int(raw))
        except ValueError:
            pass
    return DEFAULT_MAX_FRAME


class IncrementalFrameReader:
    """Constant-memory framed recv: process one CRLF frame, then drop it."""

    def __init__(
        self,
        reader: ByteReader,
        metrics: Optional[LoadControllerMetrics] = None,
        *,
        max_bytes: Optional[int] = None,
        idle_timeout: float = IDLE_TIMEOUT,
    ):
        self._reader = reader
        self._buf = bytearray()
        self._max = max_bytes if max_bytes is not None else max_frame_bytes()
        self._idle_timeout = idle_timeout
        self.metrics = metrics
        self.last_frame_size = 0

    def buffered_size(self) -> int:
        return len(self._buf)

    def _pop_frame(self) -> Optional[str]:
        idx = self._buf.find(CRLF)
        if idx < 0:
            return None
        frame = bytes(self._buf[:idx])
        del self._buf[: idx + len(CRLF)]
        self.last_frame_size = len(frame)
        if self.metrics is not None:
            self.metrics.note_frame(len(frame))
        return frame.decode("utf-8", errors="replace").strip()

    async def read_one_frame(self) -> Optional[str]:
        """
        Return one complete CRLF-terminated frame, or None on idle timeout.

        Raises LoadControllerStreamError on EOF or oversized buffer.
        """
        import asyncio
        from asyncio import TimeoutError as AsyncTimeout

        existing = self._pop_frame()
        if existing is not None:
            return existing or None

        loop = asyncio.get_event_loop()
        start = loop.time()
        while True:
            elapsed = loop.time() - start
            if elapsed >= self._idle_timeout:
                return None
            remaining = max(0.1, self._idle_timeout - elapsed)
            try:
                chunk = await asyncio.wait_for(
                    self._reader.read(READ_CHUNK), timeout=remaining
                )
            except AsyncTimeout:
                return None

            if not chunk:
                if self._buf:
                    raise LoadControllerStreamError(
                        "eof", f"incomplete_frame={len(self._buf)}"
                    )
                raise LoadControllerStreamError("eof")

            self._buf.extend(chunk)
            if len(self._buf) > self._max:
                size = len(self._buf)
                self._buf.clear()
                raise LoadControllerStreamError(
                    "oversized", f"buffer={size} max={self._max}"
                )

            frame = self._pop_frame()
            if frame is not None:
                return frame or None
