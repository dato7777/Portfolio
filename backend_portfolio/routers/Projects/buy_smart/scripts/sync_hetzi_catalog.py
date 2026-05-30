#!/usr/bin/env python3
"""
Local script: bulk-sync Hetzi Hinam catalog into Supabase (or local SQLite fallback).

Run from repository root (needs home IP — Hetzi blocks cloud servers):

    python -m backend_portfolio.routers.Projects.buy_smart.scripts.sync_hetzi_catalog

Do NOT run `source backend_portfolio/.env` first if your DB password contains `$` or `!`.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import text

# Load .env before any DB module import (override corrupted shell vars).
_ENV = Path(__file__).resolve().parents[4] / ".env"
load_dotenv(_ENV, override=True)

from backend_portfolio.buy_smart_db import DB_URL, buy_smart_engine
from backend_portfolio.database import describe_db_target, is_sqlite_url
from backend_portfolio.routers.Projects.buy_smart.scrapers.manager import sync_hetzi_catalog


def _verify_db_connection() -> int:
    target = describe_db_target(DB_URL)
    print(f"Database target: {target}")
    if is_sqlite_url(DB_URL):
        print("Warning: DATABASE_URL not set — syncing to local SQLite, not Supabase.")
        print(f"  Set DATABASE_URL in {_ENV}")
    try:
        with buy_smart_engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM product")).scalar()
        print(f"Connection OK — product rows before sync: {count}")
        return 0
    except Exception as exc:
        print(f"Database connection failed: {exc}", file=sys.stderr)
        print(
            "Tip: if your password has $ or !, do not `source .env` in bash — run this script directly.",
            file=sys.stderr,
        )
        return 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync full Hetzi Hinam catalog to Supabase / buy_smart.db")
    parser.add_argument(
        "--delay",
        type=float,
        default=0.3,
        help="Seconds to wait between subcategory requests (default: 0.3)",
    )
    args = parser.parse_args()

    if _verify_db_connection() != 0:
        return 1

    print()
    print("Starting Hetzi Hinam catalog sync...")
    print("  Step 1: GET /proxy/init            (guest auth)")
    print("  Step 2: GET /proxy/api/Catalog/get   (subcategory Ids)")
    print("  Step 3: GET getItemsBySubCategory    (products per Id)")
    print()

    try:
        stats = sync_hetzi_catalog(delay_sec=args.delay)
    except Exception as exc:
        print(f"Sync failed: {exc}", file=sys.stderr)
        return 1

    print("Done.")
    for key, value in stats.items():
        print(f"  {key}: {value}")

    try:
        with buy_smart_engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM product")).scalar()
        print(f"  product_rows_in_db: {count}")
    except Exception:
        pass

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
