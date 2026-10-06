"""Shared-secret auth for Monitoring ingest (Phase 5)."""

from __future__ import annotations

import hmac
import logging
import os
from typing import Optional

from fastapi import Header, HTTPException, status


INGEST_TOKEN_HEADER = "X-Monitoring-Ingest-Token"
INGEST_TOKEN_ENV = "MONITORING_INGEST_TOKEN"

logger = logging.getLogger("lutron_monitoring.auth")

_GENERATE_HINT = (
    'python -c "import secrets; print(secrets.token_urlsafe(32))"'
)


def get_configured_ingest_token() -> Optional[str]:
    from app.installation_config import get_monitoring_ingest_token

    token = (get_monitoring_ingest_token() or "").strip()
    return token or None


def validate_monitoring_ingest_token() -> str:
    """
    Return the configured ingest token or raise ``RuntimeError`` (LMS-003).

    Rejects a missing, empty, or leaked build-time token. There is no default
    and no dual-token window: every ingest client must carry this one value.
    """
    from app.crud.installation_settings import LEAKED_INGEST_TOKEN
    from app.installation_config import resolve_monitoring_ingest_token

    token = resolve_monitoring_ingest_token()
    if not token:
        raise RuntimeError(
            f"{INGEST_TOKEN_ENV} is missing or empty. Set it in "
            "lutron_backend/environment.env (or the process environment), or "
            "store installation_settings.monitoring_ingest_token, using a "
            f"site-specific random value. Example: {_GENERATE_HINT}"
        )
    if token == LEAKED_INGEST_TOKEN:
        raise RuntimeError(
            f"{INGEST_TOKEN_ENV} must not be the leaked build-time token "
            f"'{LEAKED_INGEST_TOKEN}'. Generate a new value, apply it to the "
            "API and every monitoring daemon, then restart them. "
            f"Example: {_GENERATE_HINT}"
        )
    return token


def enforce_monitoring_ingest_token() -> Optional[str]:
    """
    Startup gate: fail fast when ingest is enabled without a valid token.

    Returns ``None`` when ingest is disabled, because the secret is unused on
    that path and the flag is the documented kill switch.
    """
    from app.monitoring.flags import is_monitoring_ingest_enabled

    if not is_monitoring_ingest_enabled():
        logger.warning(
            "[monitoring][auth] ingest disabled; skipping %s validation",
            INGEST_TOKEN_ENV,
        )
        return None
    return validate_monitoring_ingest_token()


def require_monitoring_ingest_token(
    x_monitoring_ingest_token: Optional[str] = Header(
        default=None, alias=INGEST_TOKEN_HEADER
    ),
    authorization: Optional[str] = Header(default=None),
) -> str:
    """
    Authenticate ingest callers with a shared secret.

    Accepts either:
    - ``X-Monitoring-Ingest-Token: <secret>``
    - ``Authorization: Bearer <secret>`` (ingest secret, not LMS JWT)
    """
    expected = get_configured_ingest_token()
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Monitoring ingest token is not configured",
        )

    provided = (x_monitoring_ingest_token or "").strip()
    if not provided and authorization:
        parts = authorization.split(" ", 1)
        if len(parts) == 2 and parts[0].lower() == "bearer":
            provided = parts[1].strip()

    if not provided or not hmac.compare_digest(provided, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid monitoring ingest token",
        )
    return provided
