import httpx
class HetziHinamScraper:
    name = "hetzi"
    BASE = "https://shop.hazi-hinam.co.il"
    H_UUID = "ed5e803d-6637-4be2-9b09-1c2868d4a557"
    H_AUTH = r'%7B%22access_token%22%3A%223232CDC41FBE0A4FDAFEC111B00C6EA2EE9F4A498645EC92E475335A3F45534C%22%2C%22expires_in%22%3A172800.0%2C%22error%22%3Anull%7D'
    cookies = {
    "H_UUID": H_UUID,
    "H_Authentication": H_AUTH,
}
    def fetch_categories(self):
        r = httpx.get(self.BASE + "/proxy/api/catalog", timeout=10)
        data=r.json()
        results = data.get("Results", {})
        raw_categories = results.get("Categories", [])
        cat_names=[]
        for cat in raw_categories:
            cat_names.append(cat["Name"])
        return cat_names
        

    def search(self, q: str, page: int = 1, page_size: int = 50):
        print("***START SEARCH>>>...")
        url = self.BASE + "/proxy/api/item/getItemsBySearch"
        payload = {
        "SearchPhrase": q,
        "SearchPhrases": None,
        "ItemGroupping": 1,
        "Paging": {
            "Page": page,
            "PageSize": page_size
        }
    }
        headers = {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json; charset=UTF-8",
        "Origin": self.BASE,
        "Referer": self.BASE + "/",
        "User-Agent": "Mozilla/5.0",
}
        
        with httpx.Client(base_url=self.BASE, headers=headers, cookies=self.cookies, timeout=20) as client:
            r = client.post("/proxy/api/item/getItemsBySearch", json=payload)
            print(r.status_code, r.text[:200])
            r.raise_for_status()
            data = r.json()
            print("OK keys:", data.keys())