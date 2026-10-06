from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
import hashlib
import os
import threading
import uuid

from dotenv import load_dotenv
import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from passlib.context import CryptContext
from fastapi import HTTPException

JWT_SECRET_ENV = "JWT_SECRET"
_BANNED_JWT_SECRET = "super-secret-key"  # nosec B105 — rejected default, not a live secret
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

# Same file as DATABASE_HOST_URL (session.py). Also load from the backend
# directory so imports work when CWD is not lutron_backend.
load_dotenv("environment.env")
load_dotenv(Path(__file__).resolve().parents[2] / "environment.env")


def _require_jwt_secret() -> str:
    secret = (os.getenv(JWT_SECRET_ENV) or "").strip()
    if not secret:
        raise RuntimeError(
            "JWT_SECRET is missing or empty. Set JWT_SECRET in "
            "lutron_backend/environment.env (or the process environment) "
            "to a cryptographically strong random value. "
            "Example: python -c \"import secrets; print(secrets.token_urlsafe(64))\""
        )
    if secret == _BANNED_JWT_SECRET:
        raise RuntimeError(
            "JWT_SECRET must not be the leaked default 'super-secret-key'. "
            "Generate a new secret and set JWT_SECRET before starting the API."
        )
    return secret


SECRET_KEY = _require_jwt_secret()

# In-process logout denylist (token SHA-256 -> expiry), persisted so a
# process restart still rejects recently logged-out tokens until TTL.
_revoked_lock = threading.Lock()
_revoked_tokens: dict[str, datetime] = {}
_REVOKED_PATH = Path(__file__).resolve().parents[2] / "logs" / "jwt_revoked.json"


def _load_revoked() -> None:
    if not _REVOKED_PATH.is_file():
        return
    try:
        import json

        raw = json.loads(_REVOKED_PATH.read_text(encoding="utf-8"))
    except Exception:
        return
    now = datetime.utcnow()
    for fp, exp_s in (raw or {}).items():
        try:
            exp = datetime.fromisoformat(exp_s)
        except Exception:
            continue
        if exp > now:
            _revoked_tokens[fp] = exp


def _save_revoked() -> None:
    import json

    _REVOKED_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {fp: exp.isoformat() for fp, exp in _revoked_tokens.items()}
    tmp = _REVOKED_PATH.with_suffix(".tmp")
    tmp.write_text(json.dumps(payload), encoding="utf-8")
    tmp.replace(_REVOKED_PATH)


_load_revoked()


def _token_fingerprint(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _prune_revoked(now: datetime) -> None:
    stale = [key for key, exp in _revoked_tokens.items() if exp <= now]
    for key in stale:
        _revoked_tokens.pop(key, None)


def revoke_access_token(token: str) -> None:
    """Invalidate a still-valid access token (logout)."""
    now = datetime.utcnow()
    exp = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        raw_exp = payload.get("exp")
        if raw_exp:
            exp = datetime.utcfromtimestamp(int(raw_exp))
    except Exception:
        pass
    with _revoked_lock:
        _prune_revoked(now)
        _revoked_tokens[_token_fingerprint(token)] = exp
        _save_revoked()


def is_token_revoked(token: str) -> bool:
    now = datetime.utcnow()
    fp = _token_fingerprint(token)
    with _revoked_lock:
        _prune_revoked(now)
        return fp in _revoked_tokens

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """
    Hash a plaintext password.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plaintext password against its hash.
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT token with given payload and expiry.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "jti": uuid.uuid4().hex})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decode JWT token, reject revoked and expired tokens.
    """
    if is_token_revoked(token):
        raise HTTPException(status_code=401, detail="Token has been revoked")
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
