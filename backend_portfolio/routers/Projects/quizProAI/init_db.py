# backend_portfolio/routers/Projects/init_db.py
from pathlib import Path
from sqlmodel import SQLModel, create_engine
import backend_portfolio.routers.Projects.buy_smart.models.scrapers_models as scraper_models

# Always create/use quiz.db inside backend_portfolio/
DB_PATH = Path(__file__).resolve().parents[2] / "quiz.db"
sqlite_url = f"sqlite:///{DB_PATH}"

engine = create_engine(sqlite_url, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

if __name__ == "__main__":
    print(f"📂 Using database at: {DB_PATH}")
    create_db_and_tables()
    print("✅ Database and tables created!")