"""LMS-008: ENABLE_API_DOCS controls FastAPI /docs, /redoc, /openapi.json."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Optional

from dotenv import load_dotenv

ENABLE_API_DOCS_ENV = "ENABLE_API_DOCS"

# Same file as DATABASE_HOST_URL / JWT_SECRET. Also load from the backend
# directory so imports work when CWD is not lutron_backend.
load_dotenv("environment.env")
load_dotenv(Path(__file__).resolve().parents[1] / "environment.env")

_FALSEY = frozenset({"0", "false", "no", "off"})
_TRUTHY = frozenset({"1", "true", "yes", "on"})


def parse_enable_api_docs(raw: Optional[str]) -> bool:
    """
    Parse ENABLE_API_DOCS.

    Default when unset/blank: disabled (fail closed for packaged installs).
    Set ENABLE_API_DOCS=true only for local debugging.
    """
    if raw is None:
        return False
    value = raw.strip().strip('"').strip("'").strip().lower()
    if not value:
        return False
    if value in _FALSEY:
        return False
    if value in _TRUTHY:
        return True
    # Unknown values fail closed for production safety.
    return False


def is_api_docs_enabled(raw: Optional[str] = None) -> bool:
    if raw is None:
        raw = os.getenv(ENABLE_API_DOCS_ENV)
    return parse_enable_api_docs(raw)


def fastapi_docs_kwargs(enabled: Optional[bool] = None) -> dict[str, Any]:
    """
    Keyword args for ``FastAPI(...)`` that enable or disable all three doc surfaces.
    """
    if enabled is None:
        enabled = is_api_docs_enabled()
    if enabled:
        return {
            "docs_url": "/docs",
            "redoc_url": "/redoc",
            "openapi_url": "/openapi.json",
        }
    return {
        "docs_url": None,
        "redoc_url": None,
        "openapi_url": None,
    }
