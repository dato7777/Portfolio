import httpx
class HetziHinamScraper:
    name = "hetzi"
    BASE = "https://shop.hazi-hinam.co.il"

    def fetch_categories(self):
        r = httpx.get(self.BASE + "/proxy/api/catalog", timeout=10)
        return r.json()

    def search(self, q, category_id=None):
        # call their /proxy/api/Item/GetItemsByCategory/?Id=... or implement a query search
        # For a start, you can call category endpoint and filter names including q
        return []