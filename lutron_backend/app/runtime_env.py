"""Install-time environment.env generation. Safe to compile into start_server.exe."""
from __future__ import annotations

import secrets
from pathlib import Path

from cryptography.fernet import Fernet

PLACEHOLDER = "CHANGE_ME_GENERATE_AT_INSTALL"


def generate_env(
    dest: Path,
    template: Path,
    force: bool = False,
) -> Path:
    """Create environment.env from the template. Never overwrite a live file."""
    dest = Path(dest)
    template = Path(template)
    if dest.exists() and not force:
        print(f"[OK] {dest.name} already exists — not overwritten")
        return dest
    if not template.exists():
        raise FileNotFoundError(f"Missing template: {template}")
    text = template.read_text(encoding="utf-8")
    jwt = secrets.token_urlsafe(64)
    ingest = secrets.token_urlsafe(32)
    fernet = Fernet.generate_key().decode("ascii")
    filled: list[str] = []
    jwt_used = False
    ingest_used = False
    fernet_used = False
    for line in text.splitlines(keepends=True):
        stripped = line.strip()
        if stripped.startswith("JWT_SECRET=") and PLACEHOLDER in stripped:
            line = f"JWT_SECRET={jwt}\n"
            jwt_used = True
        elif stripped.startswith("MONITORING_INGEST_TOKEN=") and PLACEHOLDER in stripped:
            line = f"MONITORING_INGEST_TOKEN={ingest}\n"
            ingest_used = True
        elif stripped.startswith("SMTP_FERNET_KEY=") and PLACEHOLDER in stripped:
            line = f"SMTP_FERNET_KEY={fernet}\n"
            fernet_used = True
        filled.append(line)
    dest.write_text("".join(filled), encoding="utf-8")
    print(f"[OK] wrote {dest.name} (jwt={jwt_used} fernet={fernet_used} ingest={ingest_used})")
    print("[INFO] Set DATABASE_HOST_URL to the real Postgres URL before start.")
    return dest
