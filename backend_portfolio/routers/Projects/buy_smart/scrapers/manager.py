from .hetzi_hinam import HetziHinamScraper
# from .shufersal import ShufersalScraper
from concurrent.futures import ThreadPoolExecutor
import traceback
SCRAPERS = [HetziHinamScraper()]

def search_all(q):
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
    