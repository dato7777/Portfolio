# backend_portfolio/db.py
from backend_portfolio.database import create_sqlmodel_engine, resolve_database_url

DB_URL = resolve_database_url(
    "DATABASE_URL",
    sqlite_path_env="SQLITE_PATH",
    sqlite_default="backend_portfolio/quiz.db",
)
engine = create_sqlmodel_engine(DB_URL)
