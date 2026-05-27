# Run from repo root: python -m backend_portfolio.routers.Projects.buy_smart.init_db
from sqlmodel import SQLModel

from backend_portfolio.buy_smart_db import DB_URL, buy_smart_engine
from backend_portfolio.routers.Projects.buy_smart.models.scrapers_models import (
    PriceSnapshot,
    Product,
    Source,
)


def create_db_and_tables():
    SQLModel.metadata.create_all(
        buy_smart_engine,
        tables=[Source.__table__, Product.__table__, PriceSnapshot.__table__],
    )


if __name__ == "__main__":
    print(f"Using database: {DB_URL.split('@')[-1] if '@' in DB_URL else DB_URL}")
    create_db_and_tables()
    print("Database and tables created.")
