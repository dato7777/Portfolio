# backend_portfolio/routers/quiz_stats.py
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from backend_portfolio.db import engine
from backend_portfolio.auth_utils import get_current_user
from backend_portfolio.routers.Projects.models import User, QuizStats

router = APIRouter(prefix="/quiz", tags=["Quiz stats"])


def get_session():
    with Session(engine) as session:
        yield session


# ---------- Pydantic schemas ----------

class QuizEventIn(BaseModel):
    correct: bool
    time_spent: float  # seconds for this question (or for whole quiz)
    category: str


class QuizStatsOut(BaseModel):
    questionsAnswered: int
    correctAnswers: int
    accuracy: float
    avgTimePerQuestion: Optional[float]
    streak: int
    bestStreak: int
    categories: List[str]


# ---------- Helper to get or create stats row ----------

def _get_or_create_stats(session: Session, user_id: int) -> QuizStats:
    stats = session.exec(
        select(QuizStats).where(QuizStats.user_id == user_id)
    ).first()

    if not stats:
        stats = QuizStats(user_id=user_id)
        session.add(stats)
        session.commit()
        session.refresh(stats)

    return stats


def _build_stats_out(stats: QuizStats) -> QuizStatsOut:
    if stats.questions_answered:
        accuracy = (stats.correct_answers / stats.questions_answered) * 100
        avg_time = stats.total_time_seconds / stats.questions_answered
    else:
        accuracy = 0.0
        avg_time = None

    return QuizStatsOut(
        questionsAnswered=stats.questions_answered,
        correctAnswers=stats.correct_answers,
        accuracy=round(accuracy),
        avgTimePerQuestion=avg_time,
        streak=stats.current_streak,
        bestStreak=stats.best_streak,
        categories=stats.categories or [],
    )


# ---------- GET stats for current user ----------

@router.get("/stats/me", response_model=QuizStatsOut)
def get_my_stats(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    stats = _get_or_create_stats(session, current_user.id)
    return _build_stats_out(stats)


# ---------- POST: register one quiz "event" (e.g. one answered question) ----------

@router.post("/stats/event", response_model=QuizStatsOut)
def register_quiz_event(
    payload: QuizEventIn,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    stats = _get_or_create_stats(session, current_user.id)
    print("stats: ",stats)
    # increment question count
    stats.questions_answered += 1

    # correct / streak logic
    if payload.correct:
        stats.correct_answers += 1
        stats.current_streak += 1
        stats.best_streak = max(stats.best_streak, stats.current_streak)
    else:
        stats.current_streak = 0

    # time
    stats.total_time_seconds += max(payload.time_spent, 0.0)

    # categories: keep unique
    cat = payload.category.strip()
    if cat and cat not in (stats.categories or []):
        stats.categories.append(cat)

    stats.updated_at = datetime.utcnow()

    session.add(stats)
    session.commit()
    session.refresh(stats)

    return _build_stats_out(stats)