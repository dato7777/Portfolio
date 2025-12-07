from .hetzi_hinam import HetziHinamScraper
from .shufersal import ShufersalScraper
from concurrent.futures import ThreadPoolExecutor

SCRAPERS = [HetziHinamScraper(), ShufersalScraper()]

def search_all(q, category_id=None):
    results = []
    with ThreadPoolExecutor(max_workers=4) as ex:
        futures = [ex.submit(s.search, q, category_id) for s in SCRAPERS]
        for f in futures:
            try:
                results.extend(f.result())
            except Exception:
                # log
                pass
    # normalize/merge by product name, return top cheapest etc
    return results