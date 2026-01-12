from __future__ import annotations

from datetime import datetime, date
from typing import Dict, List, Optional

from fastapi import APIRouter, Query
from sqlmodel import Session, select
from sqlalchemy import func

from backend_portfolio.buy_smart_db import buy_smart_engine
from backend_portfolio.routers.Projects.buy_smart.models.scrapers_models import PriceSnapshot

router = APIRouter(prefix="/prices", tags=["buy-smart"])

@router.get("/history")
def get_prices_history(
    product_ids: List[int] = Query(..., description="One or more internal product IDs"),
    min_days: int = Query(2, ge=2, description="Return history only if product has >= this many distinct dates"),
    per_product_limit: int = Query(10, ge=1, le=60, description="Max snapshots returned per product"),
):
    """
    Returns per-product daily price history for products that have >= min_days distinct dates.
    Output shape:
    {
      "history": {
        "12": [{"day":"2026-01-10","price":8.9,"unit":"...","url":"..."}, ...],
        "15": [...]
      }
    }
    """
    with Session(buy_smart_engine) as session:
        # 1) Find which product_ids have >= min_days DISTINCT dates
        qualifying_stmt = (
            select(
                PriceSnapshot.product_id,
                func.count(func.distinct(func.date(PriceSnapshot.timestamp))).label("day_count"),
            )
            .where(PriceSnapshot.product_id.in_(product_ids))
            .group_by(PriceSnapshot.product_id)
            .having(func.count(func.distinct(func.date(PriceSnapshot.timestamp))) >= min_days)
        )

        qualifying = session.exec(qualifying_stmt).all()
        qualifying_ids = [row[0] for row in qualifying]  # row[0] == product_id

        if not qualifying_ids:
            return {"history": {}}

        # 2) Pull snapshots for qualifying ids (latest first)
        snaps_stmt = (
            select(PriceSnapshot)
            .where(PriceSnapshot.product_id.in_(qualifying_ids))
            .order_by(PriceSnapshot.product_id, PriceSnapshot.timestamp.desc())
        )
        snaps = session.exec(snaps_stmt).all()

    # 3) Build response map and apply per_product_limit
    history: Dict[str, List[dict]] = {}
    counts: Dict[int, int] = {}

    for s in snaps:
        pid = s.product_id
        if pid is None:
            continue

        counts[pid] = counts.get(pid, 0)
        if counts[pid] >= per_product_limit:
            continue

        day_str = (s.timestamp.date().isoformat() if isinstance(s.timestamp, datetime) else str(s.timestamp))
        history.setdefault(str(pid), []).append(
            {
                "day": day_str,
                "price": float(s.price),
                "unit": s.unit,
                "unit_size": s.unit_size,
                "price_per_unit_desc": s.price_per_unit_desc,
                "url": s.url,
            }
        )
        counts[pid] += 1

    return {"history": history}