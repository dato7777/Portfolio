"""Database URL resolution and SQLModel engine factory (SQLite local / PostgreSQL Supabase)."""
from __future__ import annotations

import os
from pathlib import Path

from sqlmodel import create_engine


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
