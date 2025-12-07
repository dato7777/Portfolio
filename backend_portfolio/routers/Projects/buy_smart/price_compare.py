from fastapi import APIRouter, Query
from .scrapers.manager import search_all

router = APIRouter(prefix="/scrapers")

from fastapi import APIRouter, Query
from .scrapers.manager import search_all

router = APIRouter(prefix="/scrapers")

@router.get("/sources")
def list_sources():
    return [{"name": "hetzi-hinam", "id": "hetzi"}, {"name":"shufersal","id":"shufersal"}]

@router.get("/search")
def search(q: str, sources: str = "all"):
    # parse sources, call manager.search_all
    results = search_all(q)
    return {"query": q, "results": results}