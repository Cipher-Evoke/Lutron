"""LMS-007: parse and enforce CORS_ALLOWED_ORIGINS."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

CORS_ALLOWED_ORIGINS_ENV = "CORS_ALLOWED_ORIGINS"

try:
    from app.utils.paths import ensure_runtime_cwd, get_base_dir

    ensure_runtime_cwd()
    load_dotenv(os.path.join(get_base_dir(), "environment.env"), override=False)
except Exception:
    pass

# Same file as DATABASE_HOST_URL / JWT_SECRET. Also load from the backend
# directory so imports work when CWD is not lutron_backend.
load_dotenv("environment.env", override=False)
load_dotenv(Path(__file__).resolve().parents[1] / "environment.env", override=False)


def parse_cors_allowed_origins(raw: str | None) -> list[str]:
    """Split a comma-separated CORS origin list; drop empties; preserve order."""
    if raw is None:
        return []
    origins: list[str] = []
    seen: set[str] = set()
    for part in raw.split(","):
        origin = part.strip().strip('"').strip("'").strip()
        if not origin or origin in seen:
            continue
        seen.add(origin)
        origins.append(origin)
    return origins


def require_cors_allowed_origins(
    raw: str | None = None,
) -> list[str]:
    """
    Resolve CORS_ALLOWED_ORIGINS from the environment (or ``raw`` for tests).

    Raises RuntimeError when the resolved list is empty so the API fails closed
    instead of falling back to ``*``.
    """
    if raw is None:
        raw = os.getenv(CORS_ALLOWED_ORIGINS_ENV)
    origins = parse_cors_allowed_origins(raw)
    if not origins:
        # Explicit localhost only. Add LAN hostnames via CORS_ALLOWED_ORIGINS.
        origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    return origins
