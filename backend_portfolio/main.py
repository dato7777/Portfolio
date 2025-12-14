from fastapi import FastAPI
# from backend_portfolio.routers import about, home # ✅ 'routers' is the folder, 'about' is the file
from fastapi.middleware.cors import CORSMiddleware
from backend_portfolio.routers.Projects.quizProAI.quizproai import router as quizproai_router
from backend_portfolio.routers.Projects.buy_smart.price_compare import router as buy_smart_router
from contextlib import asynccontextmanager
from sqlmodel import SQLModel
from backend_portfolio.db import engine
from backend_portfolio.buy_smart_db import buy_smart_engine
from backend_portfolio.routers.Projects.quizProAI.models import (
Question,QuizStats,User)
from backend_portfolio.routers.Projects.buy_smart.models.scrapers_models import (
    Source, Product, PriceSnapshot
)
from backend_portfolio.routers.Projects.quizProAI import quizproai
from backend_portfolio.routers.Projects.weather.weather import router as weather_router
from backend_portfolio.routers.Projects.quizProAI.auth import router as auth_router
from backend_portfolio.routers.Projects.quizProAI.quiz_stats import router as quiz_stats_router
from backend_portfolio.routers.Projects.file_organizer.file_organizer import router as file_organizer_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(
        engine,
        tables=[
            Question.__table__,
            QuizStats.__table__,
            User.__table__])  # auto-init tables
    SQLModel.metadata.create_all(
        buy_smart_engine,
        tables=[
            Source.__table__,
            Product.__table__,
            PriceSnapshot.__table__,
        ],
    ) # auto-init tables
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-File-Stats"], 
)

# app.include_router(home.router)  # ✅ This line is correct
# app.include_router(about.router)  # ✅ This line is correct
app.include_router(quizproai_router)
app.include_router(auth_router)
app.include_router(weather_router)
app.include_router(quiz_stats_router)
app.include_router(file_organizer_router)
app.include_router(buy_smart_router)

