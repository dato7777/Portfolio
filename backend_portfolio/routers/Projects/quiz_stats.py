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
    
class CategoryStatOut(BaseModel):
    name: str
    questionsAnswered: int
    correctAnswers: int
    accuracy: float

class QuizStatsOut(BaseModel):
    questionsAnswered: int
    correctAnswers: int
    accuracy: float
    avgTimePerQuestion: Optional[float]
    streak: int
    bestStreak: int
    categories: List[str]
    perCategory: List[CategoryStatOut] # NEW


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
    # print("LOOK HERE: STATS: ",[stat for stat in stats])
    return stats


def _build_stats_out(stats: QuizStats) -> QuizStatsOut:
    if stats.questions_answered:
        accuracy = (stats.correct_answers / stats.questions_answered) * 100
        avg_time = stats.total_time_seconds / stats.questions_answered
    else:
        accuracy = 0.0
        avg_time = None

     # Build per-category stats list
    per_category: List[CategoryStatOut] = []
    for cat, cstats in (stats.category_stats or {}).items():
        total = cstats.get("total", 0)
        correct = cstats.get("correct", 0)
        if total:
            cat_accuracy = (correct / total) * 100
        else:
            cat_accuracy = 0.0

        per_category.append(
            CategoryStatOut(
                name=cat,
                questionsAnswered=total,
                correctAnswers=correct,
                accuracy=round(cat_accuracy),
            )
        )
        # print("*****-LOOK HERE-PERCATEGORY IS:  ***",per_category)
    return QuizStatsOut(
        questionsAnswered=stats.questions_answered,
        correctAnswers=stats.correct_answers,
        accuracy=round(accuracy),
        avgTimePerQuestion=avg_time,
        streak=stats.current_streak,
        bestStreak=stats.best_streak,
        categories=stats.categories or [],
        perCategory=per_category,
        
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

# 1) keep simple list of category names (for your existing UI)
    current_cats = stats.categories or []
    if cat and cat not in current_cats:
        # assign NEW list so ORM sees the change
        stats.categories = current_cats + [cat]

    # 2) maintain aggregated per-category stats
    category_stats = stats.category_stats or {}
    if cat:
        current = category_stats.get(cat, {"total": 0, "correct": 0})
        current["total"] += 1
        print("THIS IS MY PAYLOAD: ",payload)
        if payload.correct:
            current["correct"] += 1

        # assign NEW dict so ORM sees the change
        category_stats = {**category_stats, cat: current}
        stats.category_stats = category_stats

    stats.updated_at = datetime.utcnow()

    session.add(stats)
    session.commit()
    session.refresh(stats)
    return _build_stats_out(stats)