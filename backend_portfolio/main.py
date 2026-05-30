"""FastAPI entry — load .env before DB modules (see database.py)."""
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env", override=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlmodel import SQLModel
import os

from backend_portfolio.routers.Projects.quizProAI.quizproai import router as quizproai_router
from backend_portfolio.routers.Projects.buy_smart.price_compare import router as buy_smart_router
from backend_portfolio.db import engine
from backend_portfolio.buy_smart_db import buy_smart_engine
from backend_portfolio.routers.Projects.quizProAI.models import (
    Question,
    QuizStats,
    User,
)
from backend_portfolio.routers.Projects.buy_smart.models.scrapers_models import (
    Source,
    Product,
    PriceSnapshot,
)
from backend_portfolio.routers.Projects.quizProAI import quizproai
from backend_portfolio.routers.Projects.weather.weather import router as weather_router
from backend_portfolio.routers.Projects.quizProAI.auth import router as auth_router
from backend_portfolio.routers.Projects.quizProAI.quiz_stats import router as quiz_stats_router
from backend_portfolio.routers.Projects.file_organizer.file_organizer import router as file_organizer_router
from backend_portfolio.routers.Projects.buy_smart.scrapers.history_api import router as buy_smart_history_router

LOCAL_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]


def get_cors_origins() -> list[str]:
    """Local dev origins plus ALLOWED_ORIGINS / FRONTEND_URL from env (Render/Vercel)."""
    origins = list(LOCAL_ORIGINS)
    for key in ("ALLOWED_ORIGINS", "FRONTEND_URL"):
        raw = os.getenv(key, "").strip()
        if not raw:
            continue
        for origin in raw.split(","):
            origin = origin.strip()
            if origin and origin not in origins:
                origins.append(origin)
    return origins


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(
        engine,
        tables=[
            Question.__table__,
            QuizStats.__table__,
            User.__table__,
        ],
    )
    SQLModel.metadata.create_all(
        buy_smart_engine,
        tables=[
            Source.__table__,
            Product.__table__,
            PriceSnapshot.__table__,
        ],
    )
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-File-Stats"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(quizproai_router)
app.include_router(auth_router)
app.include_router(weather_router)
app.include_router(quiz_stats_router)
app.include_router(file_organizer_router)
app.include_router(buy_smart_router)
app.include_router(buy_smart_history_router)
