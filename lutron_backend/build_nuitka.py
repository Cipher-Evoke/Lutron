"""Build start_server.exe with Nuitka. Run: python build_nuitka.py"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BUILD_DIR = ROOT / "_nb"


def _stop_running_exe() -> None:
    if sys.platform != "win32":
        return
    subprocess.run(
        ["taskkill", "/F", "/IM", "start_server.exe"],
        capture_output=True,
        text=True,
    )
    time.sleep(2)


def _safe_unlink(path: Path) -> None:
    if not path.exists():
        return
    for attempt in range(3):
        try:
            path.unlink()
            return
        except PermissionError:
            if attempt == 0:
                print(f"[WARN] {path.name} is in use - stopping start_server.exe...", file=sys.stderr)
                _stop_running_exe()
            time.sleep(2)
    print(
        f"[ERROR] Cannot delete {path}\n"
        "        Close the Lutron server window or Task Manager, then retry.",
        file=sys.stderr,
    )
    raise SystemExit(1)


def clean() -> None:
    _stop_running_exe()
    for name in ("start_server.build", "start_server.dist", "start_server.onefile-build"):
        path = ROOT / name
        if path.exists():
            shutil.rmtree(path, ignore_errors=True)
    if BUILD_DIR.exists():
        shutil.rmtree(BUILD_DIR, ignore_errors=True)
    for exe in (BUILD_DIR / "start_server.exe", ROOT / "start_server.exe"):
        _safe_unlink(exe)


def _optional_includes() -> list[str]:
    flags: list[str] = [
        "--enable-plugin=numpy",
        "--include-package=cryptography",
        "--include-package=cffi",
        "--include-package=pandas",
        "--include-package=numpy",
        "--include-package=openpyxl",
        "--include-package=orjson",
        "--include-package=sqlalchemy",
        "--include-package=starlette",
        "--include-package=fastapi",
        "--include-package=multipart",
        "--include-package=python_multipart",
        "--include-package=jose",
        "--include-package=apscheduler",
        "--include-package=dotenv",
        "--include-package=email",
        "--include-package=certifi",
    ]
    req = ROOT / "requirements.txt"
    text = req.read_text(encoding="utf-8", errors="ignore").lower() if req.exists() else ""
    mapping = {
        "qrcode": "qrcode",
        "pyotp": "pyotp",
        "httpx": "httpx",
        "psutil": "psutil",
        "websockets": "websockets",
        "pillow": "PIL",
        "pil": "PIL",
    }
    for needle, module in mapping.items():
        if needle in text:
            flags.append(f"--include-package={module}" if module == "PIL" else f"--include-module={module}")
    return flags


def main() -> int:
    print("If build fails with Access denied, stop start_server.exe first.")
    probe = subprocess.run(
        [sys.executable, "-m", "nuitka", "--version"],
        capture_output=True,
        text=True,
    )
    if probe.returncode != 0:
        print("[ERROR] Nuitka is not installed. pip install nuitka zstandard", file=sys.stderr)
        return 1
    print(probe.stdout.strip() or probe.stderr.strip())
    clean()
    BUILD_DIR.mkdir(parents=True, exist_ok=True)

    version = os.environ.get("LUTRON_APP_VERSION", "26.04.52")
    parts = [(p.lstrip("0") or "0") for p in version.split(".")]
    while len(parts) < 4:
        parts.append("0")
    win_ver = ".".join(parts[:4])
    template = ROOT / "environment.env.template"
    data_flags: list[str] = []
    if template.is_file():
        # Ship placeholders only. Never pack a filled environment.env.
        data_flags.append(f"--include-data-files={template}=environment.env.template")
        data_flags.append("--noinclude-data-files=environment.env")
    args = [
        sys.executable,
        "-m",
        "nuitka",
        "--onefile",
        "--standalone",
        "--follow-imports",
        "--no-prefer-source-code",
        "--assume-yes-for-downloads",
        "--enable-plugin=multiprocessing",
        "--jobs=1",
        f"--output-dir={BUILD_DIR}",
        "--include-package=app",
        "--include-package=passlib",
        "--include-package=uvicorn",
        "--nofollow-import-to=pytest",
        "--nofollow-import-to=unittest",
        "--nofollow-import-to=*.tests",
        "--nofollow-import-to=passlib.tests",
        "--nofollow-import-to=pandas.tests",
        "--nofollow-import-to=zeroconf",
        "--nofollow-import-to=ifaddr",
        "--no-deployment-flag=excluded-module-usage",
        "--include-module=passlib.handlers.bcrypt",
        "--windows-console-mode=disable",
        "--windows-company-name=Aivara Private Limited",
        "--windows-product-name=Lutron LMS",
        "--windows-file-description=Lutron LMS Server",
        f"--windows-file-version={win_ver}",
        f"--windows-product-version={win_ver}",
        *data_flags,
        *_optional_includes(),
        str(ROOT / "start_server.py"),
    ]

    print("Starting Nuitka build (typically 45-60 minutes)...")
    result = subprocess.run(args, cwd=ROOT)

    built = BUILD_DIR / "start_server.exe"
    dest = ROOT / "start_server.exe"

    if result.returncode == 0 and built.exists():
        if dest.exists():
            _safe_unlink(dest)
        shutil.copy2(built, dest)
        print(f"\nBuild OK: {dest}")
        print(f"Size: {dest.stat().st_size / (1024 * 1024):.1f} MB")
        return 0

    print("\nBuild failed.")
    return result.returncode or 1


if __name__ == "__main__":
    raise SystemExit(main())
