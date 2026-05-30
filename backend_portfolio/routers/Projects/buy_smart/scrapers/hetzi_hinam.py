import time
import httpx
from urllib.parse import unquote
import json
from .scrapers_register import register_source, register_product, register_PriceSnapshot


class HetziHinamScraper:
    """
    Scraper for shop.hazi-hinam.co.il.

    Two ways to get products:
    - search(q)              → POST getItemsBySearch (live search, used by the web UI)
    - sync_all_to_db()       → GET Catalog/get, then loop getItemsBySubCategory (full catalog)
    """

    name = "hetzi"
    BASE = "https://shop.hazi-hinam.co.il"

    def __init__(self):
        self.client = httpx.Client(
            base_url=self.BASE,
            timeout=20,
            headers={
                "Accept": "application/json, text/plain, */*",
                "Content-Type": "application/json; charset=UTF-8",
                "Origin": self.BASE,
                "Referer": self.BASE + "/",
                "User-Agent": "Mozilla/5.0",
                "Cache-Control": "no-cache, no-store",
                "Pragma": "no-cache",
            },
            follow_redirects=True,
        )
        self._guest_obtained_at = 0.0
        self._guest_expires_in = 0

    # --------- guest bootstrap ---------
    def _parse_h_auth_cookie(self) -> tuple[str | None, int]:
        raw = self.client.cookies.get("H_Authentication")
        if not raw:
            return None, 0
        try:
            decoded = unquote(raw)
            obj = json.loads(decoded)
            token = obj.get("access_token")
            expires_in = int(float(obj.get("expires_in") or 0))
            return token, expires_in
        except Exception:
            return None, 0

    def _guest_is_valid(self) -> bool:
        token, expires_in = self._parse_h_auth_cookie()
        if not token or not expires_in:
            return False
        age = time.time() - self._guest_obtained_at
        return age < max(0, expires_in - 600)

    def _bootstrap_guest(self) -> None:
        r = self.client.get("/proxy/init")
        r.raise_for_status()

        token, expires_in = self._parse_h_auth_cookie()
        if not token:
            raise RuntimeError(
                "GET /proxy/init did not set H_Authentication. "
                "Check response headers (Set-Cookie) and confirm it's the first call after fresh load."
            )

        self._guest_obtained_at = time.time()
        self._guest_expires_in = expires_in

    def _request_with_guest(self, method: str, url: str, **kwargs) -> httpx.Response:
        if not self._guest_is_valid():
            self._bootstrap_guest()

        r = self.client.request(method, url, **kwargs)

        if r.status_code == 401:
            self._bootstrap_guest()
            r = self.client.request(method, url, **kwargs)

        return r

    # --------- DB helpers (shared by search + bulk sync) ---------
    def _persist_item(self, src, item: dict, *, category_name: str | None = None) -> dict:
        """Save one Hetzi item to buy_smart.db and return the API-facing dict."""
        cat = category_name or item.get("CategoryName") or item.get("_subcategory_name")
        p = register_product(
            source_id=src.id,
            external_prod_id=item.get("Id"),
            prod_name=item.get("Name"),
            prod_category=cat,
            image_url=item.get("Img"),
        )
        register_PriceSnapshot(
            product_id=p.id,
            price=item.get("Price_NET"),
            unit=item.get("UnitSizeDesc"),
            unit_size=item.get("UnitSize"),
            price_per_unit_desc=item.get("PricePerUnitDesc"),
            url=f"{self.BASE}/catalog/products/{item.get('Id')}/{item.get('BarKod')}/{item.get('Name')}",
        )
        return {
            "internal_product_id": p.id,
            "prod_id": item.get("Id"),
            "prod_name": item.get("Name"),
            "prod_img": item.get("Img"),
            "prod_cat_id": item.get("CategoryId"),
            "prod_cat_name": item.get("CategoryName") or cat,
            "prod_sub_cat_id": item.get("SubCategoryId") or item.get("_subcategory_id"),
            "prod_sub_cat_name": item.get("SubCategoryName") or item.get("_subcategory_name"),
            "prod_unit_size_desc": item.get("UnitSizeDesc"),
            "prod_unit_size": item.get("UnitSize"),
            "prod_price_per_unit": item.get("PricePerUnit"),
            "prod_price_net": item.get("Price_NET"),
            "prod_price_un_desc": item.get("PricePerUnitDesc"),
            "prod_barkod": item.get("BarKod"),
        }

    # --------- catalog tree (step 1 of bulk sync) ---------
    def fetch_catalog_tree(self) -> dict:
        """
        GET /proxy/api/Catalog/get
        Returns the full category tree (categories + subcategories with Ids).
        Does NOT include product prices — only the map of the store.
        """
        r = self._request_with_guest("GET", "/proxy/api/Catalog/get")
        r.raise_for_status()
        return r.json()

    def _collect_subcategory_ids(self, node, out: list[dict], seen: set[int]) -> None:
        """Walk Catalog/get JSON recursively and collect every SubCategory Id."""
        if isinstance(node, dict):
            for key, value in node.items():
                if key == "SubCategories" and isinstance(value, list):
                    for sub in value:
                        if isinstance(sub, dict):
                            sid = sub.get("Id")
                            if sid and sid not in seen:
                                seen.add(sid)
                                out.append({"id": sid, "name": sub.get("Name")})
                elif isinstance(value, (dict, list)):
                    self._collect_subcategory_ids(value, out, seen)
        elif isinstance(node, list):
            for item in node:
                self._collect_subcategory_ids(item, out, seen)

    def list_subcategories(self) -> list[dict]:
        """Return [{id, name}, ...] for every subcategory in Catalog/get."""
        catalog = self.fetch_catalog_tree()
        subs: list[dict] = []
        seen: set[int] = set()
        self._collect_subcategory_ids(catalog.get("Results", catalog), subs, seen)
        return subs

    # --------- products per subcategory (step 2 of bulk sync) ---------
    def fetch_subcategory_items(self, sub_id: int) -> list[dict]:
        """
        GET /proxy/api/item/getItemsBySubCategory?Id=...
        Returns Items[] for one subcategory.
        JSON path: Results → Category → SubCategory → Items
        """
        params = {
            "Id": sub_id,
            "IsDescending": "false",
            "SortBy": "-1",
            "filter[FILTER_Mivza]": "false",
        }
        r = self._request_with_guest(
            "GET",
            "/proxy/api/item/getItemsBySubCategory",
            params=params,
            timeout=120,
        )
        r.raise_for_status()
        data = r.json()
        return (
            data.get("Results", {})
            .get("Category", {})
            .get("SubCategory", {})
            .get("Items", [])
            or []
        )

    def fetch_all_products(self, delay_sec: float = 0.3) -> list[dict]:
        """
        Loop every subcategory Id from Catalog/get and merge all Items.
        Deduplicates by product Id (same product can appear in multiple subcategories).
        """
        subs = self.list_subcategories()
        seen_ids: set[int] = set()
        all_items: list[dict] = []

        for sub in subs:
            items = self.fetch_subcategory_items(sub["id"])
            for item in items:
                pid = item.get("Id")
                if pid is None or pid in seen_ids:
                    continue
                seen_ids.add(pid)
                item["_subcategory_id"] = sub["id"]
                item["_subcategory_name"] = sub["name"]
                all_items.append(item)
            if delay_sec:
                time.sleep(delay_sec)

        return all_items

    def sync_all_to_db(self, delay_sec: float = 0.3) -> dict:
        """
        Full catalog sync: fetch all subcategories → save every product to buy_smart.db.
        Run locally (Hetzi blocks cloud hosts like Render).
        """
        src = register_source(name=self.name, base_url=self.BASE)
        subs = self.list_subcategories()
        seen_ids: set[int] = set()
        saved = 0

        for sub in subs:
            items = self.fetch_subcategory_items(sub["id"])
            for item in items:
                pid = item.get("Id")
                if pid is None or pid in seen_ids:
                    continue
                seen_ids.add(pid)
                item["_subcategory_id"] = sub["id"]
                item["_subcategory_name"] = sub["name"]
                self._persist_item(src, item)
                saved += 1
            if delay_sec:
                time.sleep(delay_sec)

        return {
            "source": self.name,
            "subcategories_fetched": len(subs),
            "unique_products_saved": saved,
        }

    # --------- existing API used by Buy Smart search UI ---------
    def fetch_categories(self):
        r = self._request_with_guest("GET", "/proxy/api/catalog")
        r.raise_for_status()
        data = r.json()
        results = data.get("Results", {})
        cats = results.get("Categories", [])
        return [{"id": c.get("Id"), "name": c.get("Name")} for c in cats]

    def search(self, q: str, page: int = 1, page_size: int = 10):
        src = register_source(name=self.name, base_url=self.BASE)
        payload = {
            "Object": {"SearchPhrase": q, "SearchPhrases": None, "ItemGroupping": 1},
            "Paging": {"Page": page, "PageSize": page_size},
        }
        r = self._request_with_guest("POST", "/proxy/api/item/getItemsBySearch", json=payload)
        if not r.content:
            return {"IsOK": False, "Results": None, "ErrorResponse": {"ErrorDescription": "Empty response body"}}
        data = r.json()
        searched_results = []
        for cat in data.get("Results", {}).get("Categories", []):
            for item in cat.get("Items", []):
                searched_results.append(self._persist_item(src, item))
                if len(searched_results) >= page_size:
                    return {"searched_results": searched_results}

        return {"searched_results": searched_results}
