from fastapi import FastAPI
from backend_portfolio.routers.Projects import quizproai
from backend_portfolio.routers import about, home # ✅ 'routers' is the folder, 'about' is the file
from fastapi.middleware.cors import CORSMiddleware
from backend_portfolio.routers.Projects.quizproai import router as quizproai_router
from contextlib import asynccontextmanager
from sqlmodel import SQLModel
from backend_portfolio.db import engine
from backend_portfolio.routers.Projects import models as quiz_models
from backend_portfolio.routers.Projects import quizproai

@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)  # auto-init tables
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(home.router)  # ✅ This line is correct
app.include_router(about.router)  # ✅ This line is correct
app.include_router(quizproai_router)

