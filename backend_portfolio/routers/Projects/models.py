from __future__ import annotations
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from sqlalchemy import Column, JSON  

class Question(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    category: str
    level: int
    question: str
    options_json: str      # we'll store the list of options as JSON text
    correct_answer: str
    normalized_question:(str|None)
    is_used:(bool)
    used_at:(datetime|None)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class QuizStats(SQLModel, table=True):
    __tablename__ = "quiz_stats"

    id: Optional[int] = Field(default=None, primary_key=True)

    # link to User via foreign key
    user_id: int = Field(foreign_key="user.id", unique=True, index=True)

    # raw counts
    questions_answered: int = Field(default=0)
    correct_answers: int = Field(default=0)
    total_time_seconds: float = Field(default=0.0)

    # streaks
    current_streak: int = Field(default=0)
    best_streak: int = Field(default=0)

    # categories tested – stored as JSON list
    categories: List[str] = Field(
        default_factory=list,
        sa_column=Column(JSON),
    )

    updated_at: datetime = Field(default_factory=datetime.utcnow)


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)