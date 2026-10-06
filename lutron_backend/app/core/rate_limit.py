"""Conservative per-IP limiter for login. Does not flood-test callers."""
from __future__ import annotations

import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

_LOCK = threading.Lock()
_HITS: dict[tuple[str, str], deque[float]] = defaultdict(deque)
WINDOW_SEC = 300.0
MAX_HITS = 20
MUTATION_WINDOW_SEC = 60.0
MUTATION_MAX_HITS = 30


def _client_host(request: Request) -> str:
    host = ""
    if request.client is not None:
        host = request.client.host or ""
    return host or "unknown"


def _enforce(request: Request, bucket: str, window_sec: float, max_hits: int, detail: str) -> None:
    now = time.monotonic()
    with _LOCK:
        q = _HITS[(bucket, _client_host(request))]
        while q and now - q[0] > window_sec:
            q.popleft()
        if len(q) >= max_hits:
            raise HTTPException(status_code=429, detail=detail)
        q.append(now)


def enforce_login_rate_limit(request: Request) -> None:
    _enforce(request, "login", WINDOW_SEC, MAX_HITS, "Too many login attempts")


def enforce_mutation_rate_limit(request: Request) -> None:
    """Limit discovery and schedule changes. Login stays on its own counter."""
    _enforce(request, "mutation", MUTATION_WINDOW_SEC, MUTATION_MAX_HITS, "Too many requests")
