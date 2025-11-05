from sqlmodel import SQLModel, Field
from typing import Optional
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
