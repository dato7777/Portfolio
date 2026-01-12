from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship

class Source(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    base_url: str
    last_seen: Optional[datetime] = None

class Product(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    source_id: Optional[int] = Field(default=None, foreign_key="source.id")
    external_prod_id: int             # id used by source (e.g. item id)
    prod_name: str
    prod_category: Optional[str] = None
    image_url: Optional[str] = None

class PriceSnapshot(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: Optional[int] = Field(default=None, foreign_key="product.id")
    price: float
    unit: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    url: Optional[str] = None