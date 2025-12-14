import os
from pathlib import Path
from sqlmodel import create_engine

# Default path: backend_portfolio/buy_smart.db
DB_URL = os.getenv("BUY_SMART_DATABASE_URL")

if not DB_URL:
    sqlite_path = Path(os.getenv("BUY_SMART_SQLITE_PATH", "backend_portfolio/buy_smart.db"))
    DB_URL = f"sqlite:///{sqlite_path}"

connect_args = {"check_same_thread": False} if DB_URL.startswith("sqlite:///") else {}
buy_smart_engine = create_engine(DB_URL, echo=True, connect_args=connect_args)