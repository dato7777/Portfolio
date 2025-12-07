# base.py
from typing import List, Dict, Optional

class ScraperBase:
    name: str  # "hetzi-hinam"

    def fetch_categories(self) -> List[Dict]:
        """Return list of categories {id, name}"""

    def search(self, q: str, category_id: Optional[int] = None) -> List[Dict]:
        """Search and return a list of raw product dicts:
           { external_id, name, price, unit, image, url, category }"""

    def fetch_product(self, external_id: str) -> Dict:
        """Return detailed product dict for a specific external id."""