from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime

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

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    password_hash: str  # 🔒 NEVER store plain passwords
    created_at: datetime = Field(default_factory=datetime.utcnow)
    # relationship: one user -> many quiz results
    results: List["QuizResult"] = Relationship(back_populates="user")

class QuizResult(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")   # 👈 foreign key
    user: Optional[User] = Relationship(back_populates="results")
    category: str
    language: str
    score: int
    total_questions: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
