# backend_portfolio/routers/Projects/buy_smart/scripts/scrapers_register.py
import os
from pathlib import Path
from sqlmodel import SQLModel, Session, create_engine, select
from backend_portfolio.routers.Projects.buy_smart.models.scrapers_models import Source,Product
from backend_portfolio.buy_smart_db import buy_smart_engine

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
            print("***PRODUCT EXISTS***")
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

