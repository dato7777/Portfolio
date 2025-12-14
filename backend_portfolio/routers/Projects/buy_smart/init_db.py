from pathlib import Path
from sqlmodel import SQLModel, create_engine

DB_PATH = Path(__file__).resolve().parents[2] / "buy_smart.db"
sqlite_url = f"sqlite:///{DB_PATH}"
engine = create_engine(sqlite_url, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

if __name__ == "__main__":
    print(f"📂 Using database at: {DB_PATH}")
    create_db_and_tables()
    print("✅ Database and tables created!")