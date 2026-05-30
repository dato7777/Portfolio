import os
import traceback
from concurrent.futures import ThreadPoolExecutor

from .hetzi_hinam import HetziHinamScraper
from .db_search import search_products_from_db, get_categories_from_db

SCRAPERS = [HetziHinamScraper()]


def _use_db_search() -> bool:
    """Default: read from Supabase/DB. Set BUY_SMART_SEARCH_MODE=live for Hetzi live scrape."""
    return os.getenv("BUY_SMART_SEARCH_MODE", "db").strip().lower() != "live"


def search_all(q: str, sources: str = "all", limit: int = 50):
    if _use_db_search():
        return search_products_from_db(q, sources=sources, limit=limit)

    results = []
    with ThreadPoolExecutor(max_workers=4) as ex:
        futures = [ex.submit(s.search, q) for s in SCRAPERS]
        for f in futures:
            try:
                results.append(f.result())
            except Exception as e:
                print("SCRAPER ERROR:", repr(e))
                traceback.print_exc()
    return results


def get_categories():
    if _use_db_search():
        return get_categories_from_db()

    categories = []
    for scraper in SCRAPERS:
        try:
            categories.append({
                "source": scraper.name,
                "data": scraper.fetch_categories(),
            })
        except Exception:
            pass
    return categories


def sync_hetzi_catalog(delay_sec: float = 0.3) -> dict:
    """
    Bulk-fetch all Hetzi Hinam products and save to buy_smart.db / Supabase.
    Intended to run locally (weekly cron), not on Render.
    """
    scraper = SCRAPERS[0]
    if not hasattr(scraper, "sync_all_to_db"):
        raise RuntimeError(f"{scraper.name} scraper has no sync_all_to_db()")
    return scraper.sync_all_to_db(delay_sec=delay_sec)
