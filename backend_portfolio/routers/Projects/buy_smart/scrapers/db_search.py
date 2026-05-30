"""Search Buy Smart products from Supabase / Postgres (or local SQLite)."""
from __future__ import annotations

import re
from sqlmodel import Session, select
from sqlalchemy import or_

from backend_portfolio.buy_smart_db import buy_smart_engine
from backend_portfolio.routers.Projects.buy_smart.models.scrapers_models import (
    Product,
    PriceSnapshot,
    Source,
)

# Map API source filter values → Source.name in DB
_SOURCE_ALIASES = {
    "all": None,
    "hetzi": "hetzi",
    "hetzi-hinam": "hetzi",
    "hazi-hinam": "hetzi",
}

_PRODUCT_URL_RE = re.compile(r"/catalog/products/\d+/([^/]+)/")


def _parse_barkod_from_url(url: str | None) -> str | None:
    if not url:
        return None
    m = _PRODUCT_URL_RE.search(url)
    return m.group(1) if m else None


def _latest_snapshot(session: Session, product_id: int) -> PriceSnapshot | None:
    return session.exec(
        select(PriceSnapshot)
        .where(PriceSnapshot.product_id == product_id)
        .order_by(PriceSnapshot.timestamp.desc())
        .limit(1)
    ).first()


def _row_to_search_item(product: Product, snap: PriceSnapshot | None) -> dict:
    barkod = _parse_barkod_from_url(snap.url if snap else None)
    return {
        "internal_product_id": product.id,
        "prod_id": product.external_prod_id,
        "prod_name": product.prod_name,
        "prod_img": product.image_url,
        "prod_cat_id": None,
        "prod_cat_name": product.prod_category,
        "prod_sub_cat_id": None,
        "prod_sub_cat_name": product.prod_category,
        "prod_unit_size_desc": snap.unit if snap else None,
        "prod_unit_size": snap.unit_size if snap else None,
        "prod_price_per_unit": None,
        "prod_price_net": snap.price if snap else None,
        "prod_price_un_desc": snap.price_per_unit_desc if snap else None,
        "prod_barkod": barkod,
    }


def search_products_from_db(
    q: str,
    *,
    sources: str = "all",
    limit: int = 50,
) -> list[dict]:
    """
    Return the same shape as live scraper search_all():
    [{"searched_results": [...]}]
    """
    term = (q or "").strip()
    if not term:
        return [{"searched_results": []}]

    source_name = _SOURCE_ALIASES.get(sources.lower(), sources.lower())
    pattern = f"%{term}%"

    with Session(buy_smart_engine) as session:
        stmt = (
            select(Product, Source)
            .join(Source, Product.source_id == Source.id)
            .where(
                or_(
                    Product.prod_name.ilike(pattern),
                    Product.prod_category.ilike(pattern),
                )
            )
            .order_by(Product.prod_name)
            .limit(min(limit, 200))
        )
        if source_name:
            stmt = stmt.where(Source.name == source_name)

        rows = session.exec(stmt).all()
        items: list[dict] = []
        for product, _source in rows:
            snap = _latest_snapshot(session, product.id)
            items.append(_row_to_search_item(product, snap))

    return [{"searched_results": items}]


def get_categories_from_db() -> list[dict]:
    """
    Distinct product categories stored during weekly sync.
    Same shape as live get_categories(): [{"source": "hetzi", "data": [{id, name}, ...]}]
    """
    with Session(buy_smart_engine) as session:
        stmt = (
            select(Product.prod_category)
            .join(Source, Product.source_id == Source.id)
            .where(Source.name == "hetzi", Product.prod_category.isnot(None))
            .distinct()
            .order_by(Product.prod_category)
        )
        names = [row for row in session.exec(stmt).all() if row]

    return [
        {
            "source": "hetzi",
            "data": [{"id": idx, "name": name} for idx, name in enumerate(names)],
        }
    ]
