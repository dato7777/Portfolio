"""Database URL resolution and SQLModel engine factory (SQLite local / PostgreSQL Supabase)."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlmodel import create_engine

# Load backend_portfolio/.env before any engine reads os.environ.
# override=True: file wins over a corrupted shell DATABASE_URL (e.g. bash expands `$` in passwords).
# On Render there is no .env file — platform env vars are unchanged.
_ENV_FILE = Path(__file__).resolve().parent / ".env"
if _ENV_FILE.is_file():
    load_dotenv(_ENV_FILE, override=True)


def normalize_database_url(url: str) -> str:
    """Ensure SQLAlchemy can use psycopg2 for Supabase / Postgres URLs."""
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg2://", 1)
    if url.startswith("postgresql://") and "+psycopg2" not in url.split("://", 1)[0]:
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


def is_sqlite_url(url: str) -> bool:
    return url.startswith("sqlite:")


def resolve_database_url(
    primary_env: str,
    *,
    fallback_env: str | None = None,
    sqlite_path_env: str | None = None,
    sqlite_default: str = "backend_portfolio/quiz.db",
) -> str:
    url = os.getenv(primary_env, "").strip()
    if not url and fallback_env:
        url = os.getenv(fallback_env, "").strip()
    if url:
        return normalize_database_url(url)

    sqlite_path = Path(os.getenv(sqlite_path_env or "", "") or sqlite_default)
    return f"sqlite:///{sqlite_path}"


def engine_connect_args(url: str) -> dict:
    if is_sqlite_url(url):
        return {"check_same_thread": False}
    # Supabase requires SSL when not already in the connection string.
    if "sslmode=" not in url:
        return {"sslmode": "require"}
    return {}


def create_sqlmodel_engine(url: str):
    echo_default = "false" if not is_sqlite_url(url) else "true"
    echo = os.getenv("SQL_ECHO", echo_default).lower() == "true"
    kwargs: dict = {
        "echo": echo,
        "connect_args": engine_connect_args(url),
    }
    if not is_sqlite_url(url):
        kwargs["pool_pre_ping"] = True
        kwargs["pool_recycle"] = 300
    return create_engine(url, **kwargs)


def describe_db_target(url: str) -> str:
    """Safe one-line summary for logs (no password)."""
    if is_sqlite_url(url):
        return f"sqlite ({url.removeprefix('sqlite:///')})"
    try:
        from sqlalchemy.engine.url import make_url

        u = make_url(url)
        host = u.host or "?"
        port = u.port or 5432
        database = u.database or "?"
        user = u.username or "?"
        return f"postgres {user}@{host}:{port}/{database}"
    except Exception:
        return "postgres (connected)"
