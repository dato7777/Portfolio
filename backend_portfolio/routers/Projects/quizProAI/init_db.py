# Run from repo root: python -m backend_portfolio.routers.Projects.quizProAI.init_db
from sqlmodel import SQLModel

from backend_portfolio.db import DB_URL, engine
from backend_portfolio.routers.Projects.quizProAI.models import Question, QuizStats, User


def create_db_and_tables():
    SQLModel.metadata.create_all(
        engine,
        tables=[Question.__table__, QuizStats.__table__, User.__table__],
    )


if __name__ == "__main__":
    print(f"Using database: {DB_URL.split('@')[-1] if '@' in DB_URL else DB_URL}")
    create_db_and_tables()
    print("Database and tables created.")
