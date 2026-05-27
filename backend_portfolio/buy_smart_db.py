from backend_portfolio.database import create_sqlmodel_engine, resolve_database_url
DB_URL = resolve_database_url(
    "BUY_SMART_DATABASE_URL",
    fallback_env="DATABASE_URL",
    sqlite_path_env="BUY_SMART_SQLITE_PATH",
    sqlite_default="backend_portfolio/buy_smart.db",
)
buy_smart_engine = create_sqlmodel_engine(DB_URL)
