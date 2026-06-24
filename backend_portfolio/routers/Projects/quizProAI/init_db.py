# Run from repo root: python -m backend_portfolio.routers.Projects.quizProAI.init_db
from sqlmodel import SQLModel
from sqlalchemy import text

from backend_portfolio.db import DB_URL, engine
from backend_portfolio.database import is_sqlite_url
from backend_portfolio.routers.Projects.quizProAI.models import Question, QuizStats, User


def migrate_users_auth_id() -> None:
    """Add auth_id column on existing databases (idempotent)."""
    url = engine.url.render_as_string(hide_password=False)
    with engine.connect() as conn:
        if is_sqlite_url(url):
            rows = conn.execute(text("PRAGMA table_info(users)")).fetchall()
            if not any(row[1] == "auth_id" for row in rows):
                conn.execute(text("ALTER TABLE users ADD COLUMN auth_id VARCHAR(36)"))
                conn.execute(
                    text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_auth_id ON users (auth_id)")
                )
        else:
            conn.execute(
                text("ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id VARCHAR(36)")
            )
            conn.execute(
                text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_auth_id "
                    "ON users (auth_id) WHERE auth_id IS NOT NULL"
                )
            )
        conn.commit()


def create_db_and_tables():
    SQLModel.metadata.create_all(
        engine,
        tables=[Question.__table__, QuizStats.__table__, User.__table__],
    )
    migrate_users_auth_id()


if __name__ == "__main__":
    print(f"Using database: {DB_URL.split('@')[-1] if '@' in DB_URL else DB_URL}")
    create_db_and_tables()
    print("Database and tables created.")
