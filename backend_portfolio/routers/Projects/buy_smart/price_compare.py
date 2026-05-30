from fastapi import APIRouter, Query

from .scrapers.manager import search_all, get_categories, _use_db_search

router = APIRouter(prefix="/scrapers")


@router.get("/sources")
def list_sources():
    return [{"name": "hetzi-hinam", "id": "hetzi"}, {"name": "shufersal", "id": "shufersal"}]


@router.get("/search")
def search(
    q: str,
    sources: str = "all",
    limit: int = Query(50, ge=1, le=200),
):
    results = search_all(q, sources=sources, limit=limit)
    total = sum(len(block.get("searched_results") or []) for block in results)
    return {
        "query": q,
        "results": results,
        "total_results": total,
        "mode": "db" if _use_db_search() else "live",
    }


@router.get("/getCategories")
def getCats():
    return get_categories()
