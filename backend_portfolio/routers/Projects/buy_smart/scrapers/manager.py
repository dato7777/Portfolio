from .hetzi_hinam import HetziHinamScraper
# from .shufersal import ShufersalScraper
from concurrent.futures import ThreadPoolExecutor

SCRAPERS = [HetziHinamScraper()]

def search_all(q, category_id=None):
    results = []
    with ThreadPoolExecutor(max_workers=4) as ex:
        futures = [ex.submit(s.search, q, 1, 50) for s in SCRAPERS]
        for f in futures:
            try:
                results.append(f.result())
            except Exception:
                # log
                pass
    return results

def get_categories():
    categories = []
    for scraper in SCRAPERS:
        try:
            categories.append({
                "source": scraper.name,
                "data": scraper.fetch_categories()
            })
        except Exception:
            pass
    return categories
    