#!/usr/bin/env python3
"""
One-time bulk copy: local buy_smart.db (SQLite) → Supabase (Postgres).

Migrates only Buy Smart tables: source, product, pricesnapshot.

Run from repository root:

    python -m backend_portfolio.routers.Projects.buy_smart.scripts.migrate_sqlite_to_supabase

Optional:

    python -m backend_portfolio.routers.Projects.buy_smart.scripts.migrate_sqlite_to_supabase \\
        --sqlite-path backend_portfolio/buy_smart.db --batch-size 1000

Do NOT `source backend_portfolio/.env` in bash if your DB password contains `$` or `!`.
"""
from __future__ import annotations

import argparse
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import func, text
from sqlmodel import Session, SQLModel, select

_ENV = Path(__file__).resolve().parents[4] / ".env"
load_dotenv(_ENV, override=True)

from backend_portfolio.buy_smart_db import DB_URL, buy_smart_engine
from backend_portfolio.database import create_sqlmodel_engine, describe_db_target, is_sqlite_url
from backend_portfolio.routers.Projects.buy_smart.models.scrapers_models import (
    PriceSnapshot,
    Product,
    Source,
)

DEFAULT_SQLITE = Path(__file__).resolve().parents[4] / "buy_smart.db"


def _ensure_tables() -> None:
    SQLModel.metadata.create_all(
        buy_smart_engine,
        tables=[Source.__table__, Product.__table__, PriceSnapshot.__table__],
    )


def _verify_target() -> int:
    if is_sqlite_url(DB_URL):
        print("Error: DATABASE_URL must point to Supabase (Postgres), not SQLite.", file=sys.stderr)
        print(f"  Set DATABASE_URL in {_ENV}", file=sys.stderr)
        return 1
    print(f"Target: {describe_db_target(DB_URL)}")
    try:
        with buy_smart_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return 0
    except Exception as exc:
        print(f"Supabase connection failed: {exc}", file=sys.stderr)
        return 1


def migrate_sources(sqlite_engine, stats: dict) -> dict[int, int]:
    """source sqlite id → postgres id"""
    id_map: dict[int, int] = {}
    with Session(sqlite_engine) as src_sess, Session(buy_smart_engine) as dst_sess:
        rows = src_sess.exec(select(Source)).all()
        for row in rows:
            if row.id is None:
                continue
            existing = dst_sess.exec(select(Source).where(Source.name == row.name)).first()
            if existing:
                id_map[row.id] = existing.id
                stats["source_skipped"] += 1
            else:
                created = Source(
                    name=row.name,
                    base_url=row.base_url,
                    last_seen=row.last_seen,
                )
                dst_sess.add(created)
                dst_sess.commit()
                dst_sess.refresh(created)
                id_map[row.id] = created.id
                stats["source_inserted"] += 1
    return id_map


def migrate_products(
    sqlite_engine,
    source_id_map: dict[int, int],
    batch_size: int,
    stats: dict,
) -> dict[int, int]:
    """product sqlite id → postgres id"""
    id_map: dict[int, int] = {}
    offset = 0
    while True:
        with Session(sqlite_engine) as src_sess:
            rows = src_sess.exec(select(Product).offset(offset).limit(batch_size)).all()
        if not rows:
            break

        with Session(buy_smart_engine) as dst_sess:
            for row in rows:
                if row.id is None:
                    continue
                pg_source_id = source_id_map.get(row.source_id)
                if pg_source_id is None:
                    stats["product_skipped_no_source"] += 1
                    continue

                existing = dst_sess.exec(
                    select(Product).where(
                        Product.source_id == pg_source_id,
                        Product.external_prod_id == row.external_prod_id,
                    )
                ).first()
                if existing:
                    id_map[row.id] = existing.id
                    stats["product_skipped"] += 1
                else:
                    created = Product(
                        source_id=pg_source_id,
                        external_prod_id=row.external_prod_id,
                        prod_name=row.prod_name,
                        prod_category=row.prod_category,
                        image_url=row.image_url,
                    )
                    dst_sess.add(created)
                    dst_sess.flush()
                    id_map[row.id] = created.id
                    stats["product_inserted"] += 1
            dst_sess.commit()

        offset += batch_size
        print(f"  products processed: {offset}", end="\r", flush=True)
    print()
    return id_map


def migrate_price_snapshots(
    sqlite_engine,
    product_id_map: dict[int, int],
    batch_size: int,
    stats: dict,
) -> None:
    offset = 0
    while True:
        with Session(sqlite_engine) as src_sess:
            rows = src_sess.exec(select(PriceSnapshot).offset(offset).limit(batch_size)).all()
        if not rows:
            break

        with Session(buy_smart_engine) as dst_sess:
            for row in rows:
                pg_product_id = product_id_map.get(row.product_id)
                if pg_product_id is None:
                    stats["snapshot_skipped_no_product"] += 1
                    continue

                snap_day = row.timestamp.date() if row.timestamp else datetime.utcnow().date()
                existing = dst_sess.exec(
                    select(PriceSnapshot).where(
                        PriceSnapshot.product_id == pg_product_id,
                        func.date(PriceSnapshot.timestamp) == snap_day,
                    )
                ).first()
                if existing:
                    stats["snapshot_skipped"] += 1
                    continue

                dst_sess.add(
                    PriceSnapshot(
                        product_id=pg_product_id,
                        price=row.price,
                        unit=row.unit,
                        unit_size=row.unit_size,
                        price_per_unit_desc=row.price_per_unit_desc,
                        timestamp=row.timestamp,
                        url=row.url,
                    )
                )
                stats["snapshot_inserted"] += 1
            dst_sess.commit()

        offset += batch_size
        print(f"  price snapshots processed: {offset}", end="\r", flush=True)
    print()


def count_sqlite(sqlite_engine, table: str) -> int:
    with sqlite_engine.connect() as conn:
        return conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar() or 0


def count_postgres(table: str) -> int:
    with buy_smart_engine.connect() as conn:
        return conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar() or 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Migrate buy_smart SQLite (source, product, pricesnapshot) to Supabase",
    )
    parser.add_argument(
        "--sqlite-path",
        type=Path,
        default=DEFAULT_SQLITE,
        help=f"Path to local SQLite file (default: {DEFAULT_SQLITE})",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=500,
        help="Rows per batch commit (default: 500)",
    )
    args = parser.parse_args()

    sqlite_path = args.sqlite_path.resolve()
    if not sqlite_path.is_file():
        print(f"Error: SQLite file not found: {sqlite_path}", file=sys.stderr)
        return 1

    if _verify_target() != 0:
        return 1

    print(f"Source file: {sqlite_path}")
    sqlite_engine = create_sqlmodel_engine(f"sqlite:///{sqlite_path}")

    print("SQLite row counts:")
    for table in ("source", "product", "pricesnapshot"):
        print(f"  {table}: {count_sqlite(sqlite_engine, table)}")

    print()
    print("Postgres row counts (before):")
    _ensure_tables()
    for table in ("source", "product", "pricesnapshot"):
        try:
            print(f"  {table}: {count_postgres(table)}")
        except Exception:
            print(f"  {table}: (table missing — will be created)")

    stats = {
        "source_inserted": 0,
        "source_skipped": 0,
        "product_inserted": 0,
        "product_skipped": 0,
        "product_skipped_no_source": 0,
        "snapshot_inserted": 0,
        "snapshot_skipped": 0,
        "snapshot_skipped_no_product": 0,
    }

    print()
    print("Migrating source...")
    source_id_map = migrate_sources(sqlite_engine, stats)

    print("Migrating product...")
    product_id_map = migrate_products(
        sqlite_engine, source_id_map, args.batch_size, stats
    )

    print("Migrating pricesnapshot...")
    migrate_price_snapshots(
        sqlite_engine, product_id_map, args.batch_size, stats
    )

    print()
    print("Done.")
    for key, value in stats.items():
        print(f"  {key}: {value}")

    print()
    print("Postgres row counts (after):")
    for table in ("source", "product", "pricesnapshot"):
        print(f"  {table}: {count_postgres(table)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
