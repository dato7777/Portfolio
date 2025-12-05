import requests
from bs4 import BeautifulSoup

def fetch_html(url: str) -> str:
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; LearningScraper/1.0)"
    }
    resp = requests.get(url, headers=headers, timeout=10)
    resp.raise_for_status()
    return resp.text

def parse_items(html: str):
    soup = BeautifulSoup(html, "html.parser")

    # 1) find all "cards" (this CSS selector you change per-site)
    cards = soup.select(".product_pod")  # <== EXAMPLE selector
    print(f"Found {len(cards)} cards")

    results = []

    for card in cards:
        # 2) extract name
        name_el = card.select_one("h3")
        name = name_el.get_text(strip=True) if name_el else None

        # 3) extract price
        price_el = card.select_one(".product_price")
        raw_price = price_el.get_text(strip=True) if price_el else ""
        # little cleaning example:
        price = (
            float("".join(ch for ch in raw_price if ch.isdigit() or ch == "."))
            if raw_price else None
        )

        # 4) extract link
        link_el = card.select_one("a[href]")
        href = link_el["href"] if link_el else ""
        results.append({
            "name": name,
            "price": price,
            "url": href,
        })

    return results

if __name__ == "__main__":
    url = "https://books.toscrape.com/catalogue/category/books/travel_2/index.html"  # change this
    html = fetch_html(url)
    items = parse_items(html)
    for item in items[:20]:
        print(item)