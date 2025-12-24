import time
import httpx
from urllib.parse import unquote
import json

class HetziHinamScraper:
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
                "User-Agent": "Mozilla/5.0",  # can be more detailed, but fine to start
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
            decoded = unquote(raw)               # cookie is URL-encoded JSON
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
        # refresh 10 minutes early
        return age < max(0, expires_in - 600)

    def _bootstrap_guest(self) -> None:
        # This is the call you found in DevTools
        r = self.client.get("/proxy/init")
        r.raise_for_status()

        token, expires_in = self._parse_h_auth_cookie()
        if not token:
            raise RuntimeError(
                "GET /proxy/init did not set H_Authentication. "
                "Check response headers (Set-Cookie) and confirm it’s the first call after fresh load."
            )

        self._guest_obtained_at = time.time()
        self._guest_expires_in = expires_in

    def _request_with_guest(self, method: str, url: str, **kwargs) -> httpx.Response:
        if not self._guest_is_valid():
            self._bootstrap_guest()

        r = self.client.request(method, url, **kwargs)

        # If token expired/invalid, refresh once and retry
        if r.status_code == 401:
            self._bootstrap_guest()
            r = self.client.request(method, url, **kwargs)

        return r

    # --------- public methods ---------
    def fetch_categories(self):
        r = self._request_with_guest("GET", "/proxy/api/catalog")
        r.raise_for_status()
        data = r.json()
        results = data.get("Results", {})
        cats = results.get("Categories", [])
        return [{"id": c.get("Id"), "name": c.get("Name")} for c in cats]

    def search(self, q: str, page: int = 1, page_size: int = 50):
        payload = {
            "Object": {"SearchPhrase": q, "SearchPhrases": None, "ItemGroupping": 1},
            "Paging": {"Page": page, "PageSize": page_size},
        }

        r = self._request_with_guest("POST", "/proxy/api/item/getItemsBySearch", json=payload)
        print("cookies now:", self.client.cookies)
        print("status:", r.status_code)
        # Sometimes they return empty body on auth failures; guard JSON parse.
        if not r.content:
            return {"IsOK": False, "Results": None, "ErrorResponse": {"ErrorDescription": "Empty response body"}}

        data = r.json()
        prod_names = [
            item["Name"]
            for cat in data.get("Results", {}).get("Categories", [])
            for item in cat.get("Items", [])]
        
        return prod_names
            
        