# backend_portfolio/db.py
import os
from pathlib import Path
from sqlmodel import create_engine

DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    sqlite_path = Path(os.getenv("SQLITE_PATH", "backend_portfolio/quiz.db"))
    DB_URL = f"sqlite:///{sqlite_path}"

connect_args = {"check_same_thread": False} if DB_URL.startswith("sqlite:///") else {}
engine = create_engine(DB_URL, echo=True, connect_args=connect_args)
