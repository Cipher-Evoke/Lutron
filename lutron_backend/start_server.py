"""
Lutron LMS - Nuitka entrypoint (backend + frontend).
"""
from __future__ import annotations

import os
import sys
from pathlib import Path


def _prepend_vendor_path() -> str | None:
    """Load zeroconf/ifaddr from lutron_backend/_vendor next to the EXE.

    Nuitka must not compile zeroconf: mixing compiled modules with OneFile
    .py extracts causes circular imports (DNSIncoming).
    """
    roots: list[str] = []
    if sys.argv and sys.argv[0]:
        roots.append(os.path.dirname(os.path.abspath(sys.argv[0])))
    exe = getattr(sys, "executable", "") or ""
    if exe:
        roots.append(os.path.dirname(os.path.abspath(exe)))
    cwd = os.getcwd()
    if cwd:
        roots.append(cwd)
    seen: set[str] = set()
    for root in roots:
        vendor = os.path.join(root, "_vendor")
        key = os.path.normcase(vendor)
        if key in seen:
            continue
        seen.add(key)
        if os.path.isdir(os.path.join(vendor, "zeroconf")):
            if vendor not in sys.path:
                sys.path.insert(0, vendor)
            os.environ["LUTRON_ZEROCONF_VENDOR"] = vendor
            return vendor
    return None


_prepend_vendor_path()

import argparse
import atexit
import http.server
import multiprocessing
import signal
import socketserver
import subprocess
import threading
import time
import traceback
import webbrowser

import uvicorn

from app.utils.paths import (
    ensure_runtime_cwd,
    get_frontend_build_dir,
    is_bundled_app,
)

_frontend_httpd = None
_frontend_thread: threading.Thread | None = None
_frontend_lock = threading.Lock()
_stop = threading.Event()
_uvicorn_server = None
STOP_EVENT_GLOBAL = "Global\\LutronLMS_Stop"
STOP_EVENT_LOCAL = "Local\\LutronLMS_Stop"
STOP_FLAG_NAME = "LMS_STOP"
# Named mutex: second start_server.exe exits immediately (no duplicate LMS).
# Prefer Local\ (works for interactive user). Also try Global\ (SYSTEM scheduled task).
# Never "continue anyway" when a mutex already exists — that caused double LMS on clients.
SINGLE_INSTANCE_MUTEX_LOCAL = "Local\\Aivara_LutronLMS_Server"
SINGLE_INSTANCE_MUTEX_GLOBAL = "Global\\Aivara_LutronLMS_Server"
_SINGLE_INSTANCE_HANDLE = None
_PID_LOCK_PATH: str | None = None

FRONTEND_PORT = 3000
BACKEND_PORT = 8000
# Always login root — never deep-link to dashboard (user must authenticate).
FRONTEND_URL = f"http://127.0.0.1:{FRONTEND_PORT}/"
BACKEND_URL = f"http://127.0.0.1:{BACKEND_PORT}"


def _is_frozen() -> bool:
    return is_bundled_app()


def _backend_dir_for_lock() -> str:
    if sys.argv and sys.argv[0]:
        return os.path.dirname(os.path.abspath(sys.argv[0]))
    exe = getattr(sys, "executable", "") or ""
    if exe:
        return os.path.dirname(os.path.abspath(exe))
    return os.getcwd()


def _pid_alive(pid: int) -> bool:
    if pid <= 0:
        return False
    if sys.platform != "win32":
        try:
            os.kill(pid, 0)
            return True
        except OSError:
            return False
    import ctypes

    kernel32 = ctypes.windll.kernel32
    PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
    handle = kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
    if handle:
        kernel32.CloseHandle(handle)
        return True
    return False


def _acquire_pid_lock_file() -> bool:
    """Backup singleton: install-dir start_server.pid (survives mutex ACL issues)."""
    global _PID_LOCK_PATH
    path = os.path.join(_backend_dir_for_lock(), "start_server.pid")
    _PID_LOCK_PATH = path
    try:
        if os.path.isfile(path):
            raw = open(path, encoding="utf-8", errors="ignore").read().strip()
            old = int(raw) if raw.isdigit() else 0
            if old and old != os.getpid() and _pid_alive(old):
                print(f"[INFO] Lutron LMS already running (pid file {old}) — exiting duplicate")
                return False
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(str(os.getpid()))
        return True
    except OSError as exc:
        print(f"[WARN] pid lock file failed: {exc}")
        return True


def _release_pid_lock_file() -> None:
    path = _PID_LOCK_PATH
    if not path:
        return
    try:
        if os.path.isfile(path):
            raw = open(path, encoding="utf-8", errors="ignore").read().strip()
            if raw == str(os.getpid()):
                os.remove(path)
    except OSError:
        pass


def _acquire_single_instance_mutex() -> bool:
    """Return True if this process owns the LMS singleton; False if already running."""
    global _SINGLE_INSTANCE_HANDLE
    # Multiprocessing workers must not take the singleton (they re-enter main).
    if any(a.startswith("--multiprocessing") for a in sys.argv[1:]):
        return True
    if sys.platform != "win32":
        return _acquire_pid_lock_file()

    import ctypes

    kernel32 = ctypes.windll.kernel32
    ERROR_ALREADY_EXISTS = 183

    for name in (SINGLE_INSTANCE_MUTEX_LOCAL, SINGLE_INSTANCE_MUTEX_GLOBAL):
        kernel32.SetLastError(0)
        # bInitialOwner=True so we clearly own a newly created mutex.
        handle = kernel32.CreateMutexW(None, True, name)
        if not handle:
            continue
        err = ctypes.get_last_error()
        if err == ERROR_ALREADY_EXISTS:
            kernel32.CloseHandle(handle)
            print(f"[INFO] Lutron LMS is already running ({name}) — exiting duplicate start_server.exe")
            return False
        _SINGLE_INSTANCE_HANDLE = handle
        if not _acquire_pid_lock_file():
            kernel32.CloseHandle(handle)
            _SINGLE_INSTANCE_HANDLE = None
            return False
        atexit.register(_release_pid_lock_file)
        return True

    print("[WARN] Could not create mutex — using pid lock file only")
    return _acquire_pid_lock_file()


def resolve_deployment_root() -> str:
    return ensure_runtime_cwd()


def check_environment(backend_dir: str) -> None:
    env_file = os.path.join(backend_dir, "environment.env")
    template = os.path.join(backend_dir, "environment.env.template")
    print(f"[INFO] Working directory: {backend_dir}")
    print(f"[INFO] Executable: {sys.executable}")
    print(f"[INFO] Frozen (EXE): {_is_frozen()}")
    print(f"[INFO] ENV file: {env_file}")
    if not os.path.isfile(env_file) and os.path.isfile(template):
        from app.runtime_env import generate_env

        generate_env(dest=Path(env_file), template=Path(template), force=False)
    if not os.path.isfile(env_file):
        raise RuntimeError(
            f"Missing environment.env.\nExpected: {env_file}"
        )
    print("[OK] environment.env found")


def ensure_optional_data_dirs(backend_dir: str) -> None:
    for rel in (
        os.path.join("app", "certificates"),
        os.path.join("app", "floor_plans"),
        os.path.join("app", "help_files"),
        os.path.join("app", "background_image"),
        os.path.join("app", "logo_image"),
    ):
        os.makedirs(os.path.join(backend_dir, rel), exist_ok=True)


def check_certificates(backend_dir: str) -> None:
    ensure_optional_data_dirs(backend_dir)
    from app.utils.paths import get_certificates_dir

    cert_dir = get_certificates_dir()
    lap = (
        "lap_private_key.pem",
        "lap_signed_csr.pem",
        "lap_lutron_root.crt",
        "lap_lutron_intermediate.pem",
    )
    if all(os.path.isfile(os.path.join(cert_dir, name)) for name in lap):
        print("[OK] LAP certificates present — Handshake can generate per-processor LEAP")
        return
    print("[WARNING] No LAP certificates yet — launching anyway.")
    print("[WARNING] Handshake creates app/certificates/<processor-ip>/ after the processor button press.")


# UI on :3000 often requests /background_image|/logo_image|/help_files as same-origin.
# Those files live on the API (:8000). Proxy so theme/logo/help work without CORS/path hacks.
_STATIC_PROXY_PREFIXES = (
    "/background_image/",
    "/logo_image/",
    "/help_files/",
)


class SpaHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, directory: str | None = None, **kwargs):
        super().__init__(*args, directory=directory, **kwargs)
        # Windows maps .mjs to text/plain. pdf.js then refuses the worker
        # because the UI also sends X-Content-Type-Options: nosniff.
        self.extensions_map.update(
            {
                ".js": "application/javascript",
                ".mjs": "application/javascript",
                ".css": "text/css",
                ".svg": "image/svg+xml",
                ".pdf": "application/pdf",
            }
        )

    def log_message(self, fmt: str, *args) -> None:
        return

    def _proxy_backend_static(self, req_path: str) -> bool:
        import http.client

        if not any(req_path.startswith(p) for p in _STATIC_PROXY_PREFIXES):
            return False
        if not req_path.startswith("/") or "\\" in req_path or "://" in req_path:
            return False
        conn = None
        try:
            conn = http.client.HTTPConnection("127.0.0.1", BACKEND_PORT, timeout=30)
            conn.request("GET", req_path)
            resp = conn.getresponse()
            data = resp.read()
            content_type = resp.getheader("Content-Type") or "application/octet-stream"
            self.send_response(resp.status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(data)
        except Exception:
            self.send_error(502, "Backend static proxy failed")
        finally:
            if conn is not None:
                conn.close()
        return True

    def do_GET(self) -> None:
        req_path = self.path.split("?", 1)[0]
        # Prefer a file already published next to the UI (junction or copy).
        # Fall back to the API only when this origin does not have the upload.
        local_path = self.translate_path(req_path)
        if not os.path.isfile(local_path) and self._proxy_backend_static(req_path):
            return

        # Never SPA-fallback for hashed build assets — that returns HTML as JS and
        # surfaces as "Loading chunk NNN failed" after upgrades.
        static_asset = (
            req_path.startswith("/static/")
            or req_path.endswith((".js", ".css", ".map", ".woff", ".woff2", ".ttf", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico"))
        )
        path = self.translate_path(req_path)
        if not os.path.isfile(path):
            if static_asset:
                self.send_error(404, f"Missing UI asset: {req_path}")
                return
            self.path = "/index.html"
            path = self.translate_path("/index.html")

        # index.html must not be cached across Setup upgrades (chunk hashes change).
        if req_path in ("/", "/index.html") or path.endswith("index.html"):
            try:
                with open(path, "rb") as fh:
                    data = fh.read()
            except OSError:
                self.send_error(404, "index.html missing")
                return
            import secrets

            self._style_nonce = secrets.token_urlsafe(16)
            needle = b"<head>"
            # Browsers keep the first pdf.worker.min.mjs response (text/plain on
            # Windows). A new query forces a fetch that cannot reuse that entry.
            worker_fix = (
                "<script nonce=\"{nonce}\">"
                "(function(){{var N=window.Worker;if(!N)return;function W(u,o){{"
                "try{{var v=u instanceof URL?u.href:String(u);"
                "if(v.indexOf('pdf.worker.min.mjs')!==-1&&v.indexOf('pdfworker=')===-1)"
                "u=v+(v.indexOf('?')<0?'?pdfworker=2':'&pdfworker=2');"
                "}}catch(e){{}}return new N(u,o);}}"
                "W.prototype=N.prototype;window.Worker=W;}})();"
                "</script>"
            ).format(nonce=self._style_nonce)
            meta = (
                f'<head><meta name="csp-nonce" content="{self._style_nonce}">{worker_fix}'
            ).encode("ascii")
            if needle in data:
                data = data.replace(needle, meta, 1)
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            self.send_header("Pragma", "no-cache")
            self.end_headers()
            self.wfile.write(data)
            return

        if self._has_precompressed_sibling(path, req_path):
            self._vary_accept_encoding = True
        choice = self._precompressed_choice(path, req_path)
        if choice is not None:
            encoding, variant = choice
            self._send_precompressed(path, encoding, variant)
            return

        # Windows maps .mjs to text/plain. The first response was cached that way.
        # A later 304 keeps the cached type, so pdf.js still refuses the worker.
        # Always send a full JavaScript response and do not honor If-Modified-Since.
        if req_path.lower().endswith(".mjs") and os.path.isfile(path):
            try:
                with open(path, "rb") as fh:
                    data = fh.read()
            except OSError:
                self.send_error(404, "Missing module script")
                return
            self.send_response(200)
            self.send_header("Content-Type", "application/javascript")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            self.send_header("Pragma", "no-cache")
            self.end_headers()
            self.wfile.write(data)
            return

        return super().do_GET()

    def _encoding_tokens(self) -> set[str]:
        raw = ""
        if self.headers is not None:
            raw = self.headers.get("Accept-Encoding") or ""
        tokens: set[str] = set()
        for part in raw.lower().split(","):
            token = part.strip().split(";")[0].strip()
            if token:
                tokens.add(token)
        return tokens

    def _compressible_static(self, req_path: str) -> bool:
        if any(req_path.startswith(prefix) for prefix in _STATIC_PROXY_PREFIXES):
            return False
        lower = req_path.lower()
        # .mjs also endswith ".js"; the PDF worker must stay uncompressed.
        if lower.endswith(".mjs"):
            return False
        return lower.endswith((".js", ".css", ".svg"))

    def _has_precompressed_sibling(self, path: str, req_path: str) -> bool:
        if not self._compressible_static(req_path):
            return False
        return os.path.isfile(path + ".br") or os.path.isfile(path + ".gz")

    def _precompressed_choice(self, path: str, req_path: str) -> tuple[str, str] | None:
        if not self._compressible_static(req_path):
            return None
        if self.headers is not None and self.headers.get("Range"):
            return None
        tokens = self._encoding_tokens()
        if "br" in tokens and os.path.isfile(path + ".br"):
            return "br", path + ".br"
        if "gzip" in tokens and os.path.isfile(path + ".gz"):
            return "gzip", path + ".gz"
        return None

    def _send_precompressed(self, original_path: str, encoding: str, variant_path: str) -> None:
        import mimetypes

        try:
            with open(variant_path, "rb") as fh:
                data = fh.read()
        except OSError:
            return super().do_GET()
        content_type = mimetypes.guess_type(original_path)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Encoding", encoding)
        self.send_header("Content-Length", str(len(data)))
        self._vary_accept_encoding = True
        self.end_headers()
        self.wfile.write(data)

    def end_headers(self) -> None:
        from app.security_headers import frontend_security_headers

        headers = getattr(self, "headers", None)
        host = headers.get("Host") if headers else None
        for name, value in frontend_security_headers(host, getattr(self, "_style_nonce", None)):
            self.send_header(name, value)
        if getattr(self, "_vary_accept_encoding", False):
            self.send_header("Vary", "Accept-Encoding")
        super().end_headers()


def _start_frontend_server() -> None:
    global _frontend_httpd, _frontend_thread
    build_dir = get_frontend_build_dir()
    index_html = os.path.join(build_dir, "index.html")
    if not os.path.isfile(index_html):
        print(f"[WARNING] Frontend build not found: {index_html}")
        print("[WARNING] UI will not be available on port 3000 until lutron_frontend/build is installed.")
        return

    class _Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
        daemon_threads = True
        allow_reuse_address = True

    handler = lambda *a, **k: SpaHandler(*a, directory=build_dir, **k)
    # Bind 0.0.0.0 so http://<hostname-or-LAN-IP>:3000 works (not only 127.0.0.1).
    bind_host = os.environ.get("LMS_FRONTEND_BIND", "0.0.0.0").strip() or "0.0.0.0"
    try:
        httpd = _Server((bind_host, FRONTEND_PORT), handler)
    except OSError as exc:
        print(f"[ERROR] Cannot bind frontend on {bind_host}:{FRONTEND_PORT}: {exc}")
        if bind_host != "127.0.0.1":
            try:
                httpd = _Server(("127.0.0.1", FRONTEND_PORT), handler)
                bind_host = "127.0.0.1"
                print(f"[WARN] Fell back to 127.0.0.1:{FRONTEND_PORT}")
            except OSError as exc2:
                print(f"[ERROR] Theme/settings UI will show ERR_CONNECTION_REFUSED until the port is free: {exc2}")
                return
        else:
            print("[ERROR] Theme/settings UI will show ERR_CONNECTION_REFUSED until the port is free.")
            return
    thread = threading.Thread(target=httpd.serve_forever, daemon=True, name="lutron-frontend")
    thread.start()
    with _frontend_lock:
        _frontend_httpd = httpd
        _frontend_thread = thread
    print(f"[OK] Frontend (in-process) -> http://{bind_host}:{FRONTEND_PORT}/ (open via 127.0.0.1 or site host)")
    print("[OK] Proxying /background_image /logo_image /help_files from :3000 -> :8000")


def start_frontend() -> None:
    _start_frontend_server()


def stop_frontend() -> None:
    global _frontend_httpd, _frontend_thread
    with _frontend_lock:
        httpd = _frontend_httpd
        _frontend_httpd = None
        _frontend_thread = None
    if httpd is not None:
        try:
            httpd.shutdown()
        except Exception:
            pass


def _watch_frontend() -> None:
    while not _stop.wait(4):
        with _frontend_lock:
            thread = _frontend_thread
            httpd = _frontend_httpd
        if thread is not None and not thread.is_alive():
            print("[WARN] Frontend thread stopped — restarting")
            try:
                if httpd is not None:
                    httpd.shutdown()
            except Exception:
                pass
            try:
                _start_frontend_server()
            except Exception as exc:
                print(f"[WARN] Frontend restart failed: {exc}")


def wait_for_frontend(timeout_sec: float = 20.0) -> bool:
    import http.client

    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        conn = None
        try:
            conn = http.client.HTTPConnection("127.0.0.1", FRONTEND_PORT, timeout=2)
            conn.request("GET", "/")
            resp = conn.getresponse()
            resp.read()
            if 200 <= resp.status < 500:
                return True
        except OSError:
            time.sleep(0.3)
        finally:
            if conn is not None:
                conn.close()
    return False


def open_chrome(url: str) -> None:
    # Force login page only (strip any path/query that could open dashboard).
    url = f"http://127.0.0.1:{FRONTEND_PORT}/"
    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    for path in candidates:
        if path and os.path.isfile(path):
            flags = getattr(subprocess, "CREATE_NO_WINDOW", 0) if sys.platform == "win32" else 0
            subprocess.Popen([path, url], creationflags=flags)
            print(f"[OK] Opened Chrome: {url}")
            return
    webbrowser.open(url)
    print(f"[OK] Opened browser: {url}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Lutron LMS")
    parser.add_argument("--no-frontend", action="store_true")
    parser.add_argument("--no-browser", action="store_true")
    parser.add_argument("--service", action="store_true", help="Supervisor loop (auto-restart, no prompt)")
    parser.add_argument("--launcher", action="store_true", help="Ignored; Start_LMS.exe is the console launcher")
    parser.add_argument("--check-zeroconf", action="store_true", help="Import zeroconf and exit (packaging test)")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=BACKEND_PORT)
    return parser.parse_args()


def _attach_file_log(backend_dir: str) -> None:
    log_dir = os.path.join(backend_dir, "logs")
    os.makedirs(log_dir, exist_ok=True)
    path = os.path.join(log_dir, "lms.log")
    program_data_path = None
    try:
        pd = os.environ.get("PROGRAMDATA") or r"C:\ProgramData"
        pd_dir = os.path.join(pd, "LutronLMS", "logs")
        os.makedirs(pd_dir, exist_ok=True)
        program_data_path = os.path.join(pd_dir, "lms.log")
    except OSError:
        program_data_path = None

    class _Tee:
        """File-like stdout/stderr tee — must satisfy logging/uvicorn (isatty, encoding, …)."""

        def __init__(self, *streams):
            self._streams = streams

        def write(self, data: str) -> int:
            n = len(data) if isinstance(data, str) else 0
            for s in self._streams:
                try:
                    s.write(data)
                    s.flush()
                except OSError:
                    pass
            return n

        def flush(self) -> None:
            for s in self._streams:
                try:
                    s.flush()
                except OSError:
                    pass

        def isatty(self) -> bool:
            return False

        def writable(self) -> bool:
            return True

        def readable(self) -> bool:
            return False

        def seekable(self) -> bool:
            return False

        @property
        def encoding(self) -> str:
            for s in self._streams:
                enc = getattr(s, "encoding", None)
                if enc:
                    return enc
            return "utf-8"

        @property
        def errors(self) -> str:
            for s in self._streams:
                err = getattr(s, "errors", None)
                if err:
                    return err
            return "replace"

        @property
        def closed(self) -> bool:
            return False

        def fileno(self) -> int:
            for s in self._streams:
                try:
                    return s.fileno()
                except Exception:
                    continue
            raise OSError(9, "Bad file descriptor")

        def close(self) -> None:
            # Keep console/file handles open for process lifetime.
            return None

    try:
        fh = open(path, "a", encoding="utf-8", errors="replace")
    except OSError:
        return
    streams = []
    # Keep real console streams so uvicorn logging can probe isatty safely via our wrapper.
    for base in (getattr(sys, "__stdout__", None), getattr(sys, "__stderr__", None), sys.stdout, sys.stderr):
        if base is not None and base not in streams and not isinstance(base, _Tee):
            streams.append(base)
            break
    streams.append(fh)
    if program_data_path:
        try:
            streams.append(open(program_data_path, "a", encoding="utf-8", errors="replace"))
        except OSError:
            pass
    tee = _Tee(*streams)
    sys.stdout = tee  # type: ignore[assignment]
    sys.stderr = tee  # type: ignore[assignment]
    print(f"\n===== Lutron LMS start {time.strftime('%Y-%m-%d %H:%M:%S')} =====")
    if program_data_path:
        print(f"[OK] Logging to {path} and {program_data_path}")


def _ensure_tray(backend_dir: str) -> None:
    if sys.platform != "win32":
        return
    tray = os.path.join(backend_dir, "LutronLMS_Tray.exe")
    if not os.path.isfile(tray):
        return
    try:
        import subprocess as _sp

        running = _sp.run(
            ["tasklist", "/FI", "IMAGENAME eq LutronLMS_Tray.exe"],
            capture_output=True,
            text=True,
        )
        if running.stdout and "LutronLMS_Tray.exe" in running.stdout:
            return
        flags = getattr(subprocess, "DETACHED_PROCESS", 0) | getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)
        subprocess.Popen(
            [tray],
            cwd=backend_dir,
            close_fds=True,
            creationflags=flags,
        )
        print("[OK] Tray icon started (LutronLMS_Tray.exe)")
    except Exception as exc:
        print(f"[WARN] Tray icon not started: {exc}")


def run_once(args: argparse.Namespace) -> None:
    backend_dir = resolve_deployment_root()
    if _is_frozen():
        _attach_file_log(backend_dir)
    print("=" * 60)
    print("        Lutron LMS")
    print("=" * 60)
    check_environment(backend_dir)
    check_certificates(backend_dir)
    vendor = os.environ.get("LUTRON_ZEROCONF_VENDOR") or _prepend_vendor_path()
    try:
        import zeroconf
        from zeroconf import ServiceBrowser, Zeroconf

        print(
            f"[OK] zeroconf loaded from {getattr(zeroconf, '__file__', '?')} "
            f"vendor={vendor}"
        )
        del ServiceBrowser, Zeroconf
    except Exception as exc:
        print(f"[WARN] zeroconf import failed: {exc}")

    if not args.no_frontend:
        start_frontend()
        watcher = threading.Thread(target=_watch_frontend, daemon=True, name="lutron-frontend-watch")
        watcher.start()
        if wait_for_frontend():
            print("[OK] Frontend is responding")
        _ensure_tray(backend_dir)
        if not args.no_browser:
            open_chrome(FRONTEND_URL)

    print(f"\n[INFO] API on {args.host}:{args.port}")
    from app.docs_config import is_api_docs_enabled

    if is_api_docs_enabled():
        print(f"[INFO] API docs enabled: {BACKEND_URL}/docs")
    else:
        print("[INFO] API docs disabled (ENABLE_API_DOCS=false) — /docs /redoc /openapi.json are off")
    print()
    global _uvicorn_server
    config = uvicorn.Config(
        "app.main:app",
        host=args.host,
        port=args.port,
        reload=False,
    )
    _uvicorn_server = uvicorn.Server(config)
    try:
        _uvicorn_server.run()
    finally:
        _uvicorn_server = None
        stop_frontend()


def _request_shutdown() -> None:
    global _uvicorn_server
    _stop.set()
    stop_frontend()
    srv = _uvicorn_server
    if srv is not None:
        srv.should_exit = True


def _open_stop_event(name: str):
    if sys.platform != "win32":
        return None
    import ctypes

    kernel32 = ctypes.windll.kernel32
    handle = kernel32.CreateEventW(None, True, False, name)
    return handle or None


def _reset_stop_events() -> None:
    if sys.platform != "win32":
        return
    import ctypes

    kernel32 = ctypes.windll.kernel32
    for name in (STOP_EVENT_GLOBAL, STOP_EVENT_LOCAL):
        handle = _open_stop_event(name)
        if handle:
            kernel32.ResetEvent(handle)
            kernel32.CloseHandle(handle)


def _watch_stop_flag() -> None:
    root = resolve_deployment_root()
    path = os.path.join(root, STOP_FLAG_NAME)
    while not _stop.wait(0.5):
        if os.path.isfile(path):
            try:
                os.remove(path)
            except OSError:
                pass
            print("[INFO] Stop flag detected — shutting down")
            _request_shutdown()
            break


def _watch_windows_stop_event() -> None:
    if sys.platform != "win32":
        return
    import ctypes

    kernel32 = ctypes.windll.kernel32
    handles = []
    for name in (STOP_EVENT_GLOBAL, STOP_EVENT_LOCAL):
        handle = _open_stop_event(name)
        if handle:
            handles.append(handle)
    if not handles:
        return
    try:
        WAIT_OBJECT_0 = 0
        while not _stop.is_set():
            signaled = False
            for handle in handles:
                rc = kernel32.WaitForSingleObject(handle, 200)
                if rc == WAIT_OBJECT_0:
                    signaled = True
                    break
            if signaled:
                print("[INFO] Stop requested — shutting down")
                _request_shutdown()
                break
    finally:
        for handle in handles:
            kernel32.CloseHandle(handle)


def _shutdown_handler(*_args) -> None:
    _request_shutdown()


def main() -> None:
    args = parse_args()
    if args.check_zeroconf:
        vendor = _prepend_vendor_path()
        log_dir = os.path.join(
            os.path.dirname(os.path.abspath(sys.argv[0] if sys.argv else ".")),
            "logs",
        )
        os.makedirs(log_dir, exist_ok=True)
        result_path = os.path.join(log_dir, "zeroconf_check.txt")
        try:
            import zeroconf
            from zeroconf import ServiceBrowser, Zeroconf

            msg = (
                "ZEROCONF_OK "
                + str(getattr(zeroconf, "__file__", "?"))
                + " vendor="
                + str(vendor or "")
            )
            del ServiceBrowser, Zeroconf
            code = 0
        except Exception as exc:
            msg = "ZEROCONF_FAIL " + str(exc)
            code = 1
        try:
            with open(result_path, "w", encoding="utf-8") as fh:
                fh.write(msg + "\n")
        except OSError:
            pass
        print(msg)
        raise SystemExit(code)
    if not _acquire_single_instance_mutex():
        raise SystemExit(0)
    if _is_frozen():
        args.service = True
        # Prevent any accidental console window flash on crash/restart loops.
        if sys.platform == "win32":
            try:
                import ctypes

                ctypes.windll.kernel32.FreeConsole()
            except Exception:
                pass
    atexit.register(stop_frontend)
    _reset_stop_events()
    if sys.platform == "win32":
        signal.signal(signal.SIGTERM, _shutdown_handler)
        signal.signal(signal.SIGINT, _shutdown_handler)
        threading.Thread(
            target=_watch_windows_stop_event,
            daemon=True,
            name="lutron-stop-watch",
        ).start()
        threading.Thread(
            target=_watch_stop_flag,
            daemon=True,
            name="lutron-stop-flag",
        ).start()

    failures = 0
    while True:
        try:
            run_once(args)
            failures = 0
        except SystemExit:
            raise
        except KeyboardInterrupt:
            _request_shutdown()
            break
        except Exception as exc:
            print("\n[ERROR] Application stopped unexpectedly")
            print(str(exc))
            traceback.print_exc()
            stop_frontend()
            if not args.service:
                try:
                    input("\nPress ENTER to exit...\n")
                except EOFError:
                    pass
                sys.exit(1)
            if _stop.is_set():
                break
            failures += 1
            delay = min(60, 5 * failures)
            print(f"[INFO] Restarting in {delay} seconds (failure #{failures})...")
            time.sleep(delay)
            continue
        if args.service and not _stop.is_set():
            failures += 1
            delay = min(60, 3 * failures)
            print(f"[INFO] API exited — restarting in {delay} seconds...")
            stop_frontend()
            time.sleep(delay)
            continue
        break


if __name__ == "__main__":
    multiprocessing.freeze_support()
    main()
