# backend_portfolio/routers/Projects/buy_smart/scripts/scrapers_register.py
import os
from pathlib import Path
from sqlmodel import SQLModel, Session, create_engine, select
from backend_portfolio.routers.Projects.buy_smart.models.scrapers_models import Source,Product,PriceSnapshot
from backend_portfolio.buy_smart_db import buy_smart_engine
from datetime import datetime,timedelta
from sqlalchemy import func

engine = buy_smart_engine

def register_source(name: str, base_url: str) -> Source:
    """Insert a source row if it does not already exist."""
    SQLModel.metadata.create_all(engine, tables=[Source.__table__])
    with Session(engine) as session:
        existing = session.exec(
            select(Source).where(Source.name == name)
        ).first()
        if existing:
            return existing
        source = Source(name=name, base_url=base_url)
        session.add(source)
        session.commit()
        session.refresh(source)
        return source
    
def register_product(source_id:int, external_prod_id:int, prod_name:str,prod_category:str | None = None,image_url:str | None = None) ->Product:
    """Insert a Product row if it does not already exist."""
    SQLModel.metadata.create_all(engine, tables=[Product.__table__])
    with Session(engine) as session:
        existing = session.exec(
            select(Product).where(
                Product.source_id == source_id,
                Product.external_prod_id==external_prod_id)
        ).first()
        if existing:
            return existing
        else:
            product=Product(
                source_id=source_id,
                external_prod_id=external_prod_id,
                prod_name=prod_name,
                prod_category=prod_category,
                image_url=image_url
                )
            session.add(product)
            session.commit()
            session.refresh(product)
        return product

def register_PriceSnapshot(product_id:int,price:float,unit:str,unit_size:str,price_per_unit_desc:str,url:str):
    """Insert a PriceSnapshot row if it does not already exist."""
    SQLModel.metadata.create_all(engine, tables=[PriceSnapshot.__table__])
    today = datetime.utcnow().date()
    stmt = select(PriceSnapshot).where(
    PriceSnapshot.product_id == product_id,
    func.date(PriceSnapshot.timestamp) == str(today),
)
    print(today)
    with Session(engine) as session:
        existing = session.exec(stmt).first()
        if existing:
            return existing
        priceSnapshot=PriceSnapshot(
        product_id=product_id,
        price=price,
        unit=unit,
        unit_size=unit_size,
        price_per_unit_desc=price_per_unit_desc,
        url=url
        )
        session.add(priceSnapshot)
        session.commit()
        session.refresh(priceSnapshot)
        return priceSnapshot
        
    return priceSnapshot

