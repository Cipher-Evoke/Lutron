#E:\Gcon\lutron\Lutron_backend_app\app\database\session.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv('environment.env')  # LUTRON_NUITKA_ENV
try:
    from app.utils.paths import get_base_dir
    _env_path = os.path.join(get_base_dir(), 'environment.env')
    if os.path.isfile(_env_path):
        load_dotenv(_env_path, override=True)
except Exception:
    pass

DATABASE_URL = os.getenv("DATABASE_HOST_URL") or os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "Missing database URL. Set DATABASE_HOST_URL (or DATABASE_URL on Render) "
        "to a postgresql:// URL."
    )
# Render / Heroku style URLs use postgres:// — SQLAlchemy needs postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
# SQLAlchemy 2.x maps bare postgresql:// to the psycopg (v3) driver, but this
# project ships psycopg2-binary. Pin the driver explicitly so both local and
# Render installs use psycopg2 regardless of SQLAlchemy version.
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=_env_int("DB_POOL_SIZE", 20),
    max_overflow=_env_int("DB_MAX_OVERFLOW", 40),
    pool_timeout=_env_int("DB_POOL_TIMEOUT", 60),
    pool_recycle=_env_int("DB_POOL_RECYCLE", 1800),
    connect_args={
        "connect_timeout": _env_int("DB_CONNECT_TIMEOUT", 10),
        # Per statement, not per job. Stops a dead PostgreSQL session from
        # holding a scheduler slot until the next restart.
        "options": f"-c statement_timeout={_env_int('DB_STATEMENT_TIMEOUT_MS', 30000)}",
    },
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
