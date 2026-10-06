"""Response headers for the API (:8000) and the packaged UI (:3000)."""

from __future__ import annotations

import re
from typing import Iterable

_HOST_RE = re.compile(r"^[A-Za-z0-9.-]{1,253}$")

# Present on every API response. HSTS is omitted: this appliance speaks HTTP on
# the site LAN, and a Strict-Transport-Security header would force browsers
# onto HTTPS that the process does not serve.
API_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": (
        "accelerometer=(), camera=(), geolocation=(), gyroscope=(), "
        "magnetometer=(), microphone=(), payment=(), usb=()"
    ),
    "X-Permitted-Cross-Domain-Policies": "none",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-site",
    "Cross-Origin-Embedder-Policy": "unsafe-none",
    "Content-Security-Policy": (
        "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
    ),
}

UI_STATIC_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": (
        "accelerometer=(), camera=(), geolocation=(), gyroscope=(), "
        "magnetometer=(), microphone=(), payment=(), usb=()"
    ),
    "X-Permitted-Cross-Domain-Policies": "none",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "unsafe-none",
}


def _safe_host(raw: str | None) -> str:
    host = (raw or "").split(",")[0].strip()
    if host.startswith("["):
        host = host[1:].split("]", 1)[0]
    else:
        host = host.split(":")[0]
    host = host.strip()
    if not _HOST_RE.fullmatch(host):
        return "127.0.0.1"
    return host


def frontend_csp(request_host: str | None, style_nonce: str | None = None) -> str:
    """CSP for the SPA. connect-src follows the host the UI was opened on."""
    host = _safe_host(request_host)
    connect = " ".join(
        [
            "'self'",
            f"http://{host}:8000",
            f"ws://{host}:8000",
            "http://127.0.0.1:8000",
            "http://localhost:8000",
            "ws://127.0.0.1:8000",
            "ws://localhost:8000",
        ]
    )
    images = " ".join(
        [
            "'self'",
            "data:",
            "blob:",
            f"http://{host}:8000",
            "http://127.0.0.1:8000",
            "http://localhost:8000",
        ]
    )
    # MUI sets element style attributes. A nonce in style-src makes browsers
    # ignore 'unsafe-inline', so those attributes never apply.
    # The same nonce is used only for one inline script in index.html.
    script_src = "script-src 'self'"
    if style_nonce:
        script_src = f"script-src 'self' 'nonce-{style_nonce}'"
    return (
        "default-src 'self'; "
        f"{script_src}; "
        "style-src 'self' 'unsafe-inline'; "
        f"img-src {images}; "
        "font-src 'self' data:; "
        f"connect-src {connect}; "
        "worker-src 'self' blob:; "
        "frame-ancestors 'self'; "
        "base-uri 'self'; "
        "object-src 'none'; "
        "form-action 'self'"
    )


def frontend_security_headers(
    request_host: str | None,
    style_nonce: str | None = None,
) -> Iterable[tuple[str, str]]:
    headers = dict(UI_STATIC_HEADERS)
    headers["Content-Security-Policy"] = frontend_csp(request_host, style_nonce)
    return headers.items()


class SecurityHeadersMiddleware:
    """Pure ASGI middleware. Sets API security headers and drops a Server banner."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope.get("type") != "http":
            await self.app(scope, receive, send)
            return

        async def send_wrapper(message):
            if message.get("type") == "http.response.start":
                raw = list(message.get("headers") or [])
                kept = [
                    (k, v)
                    for k, v in raw
                    if k.lower() not in {b"server", b"x-powered-by"}
                ]
                existing = {k.lower() for k, _ in kept}
                for name, value in API_SECURITY_HEADERS.items():
                    key = name.lower().encode("latin-1")
                    if key not in existing:
                        kept.append((key, value.encode("latin-1")))
                message["headers"] = kept
            await send(message)

        await self.app(scope, receive, send_wrapper)
