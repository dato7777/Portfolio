#!/usr/bin/env python3
"""
Local script: bulk-sync Hetzi Hinam catalog into Supabase / buy_smart.db.

Run from repository root (needs home IP — Hetzi blocks cloud servers):

    set -a && source backend_portfolio/.env && set +a
    python -m backend_portfolio.routers.Projects.buy_smart.scripts.sync_hetzi_catalog
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from dotenv import load_dotenv

# Load .env before DB engine reads DATABASE_URL
load_dotenv(Path(__file__).resolve().parents[4] / ".env")

from backend_portfolio.routers.Projects.buy_smart.scrapers.manager import sync_hetzi_catalog


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync full Hetzi Hinam catalog to buy_smart.db")
    parser.add_argument(
        "--delay",
        type=float,
        default=0.3,
        help="Seconds to wait between subcategory requests (default: 0.3)",
    )
    args = parser.parse_args()

    print("Starting Hetzi Hinam catalog sync...")
    print("  Step 1: GET /proxy/init          (guest auth)")
    print("  Step 2: GET /proxy/api/Catalog/get (subcategory Ids)")
    print("  Step 3: GET getItemsBySubCategory  (products per Id)")
    print()

    try:
        stats = sync_hetzi_catalog(delay_sec=args.delay)
    except Exception as exc:
        print(f"Sync failed: {exc}", file=sys.stderr)
        return 1

    print("Done.")
    for key, value in stats.items():
        print(f"  {key}: {value}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
