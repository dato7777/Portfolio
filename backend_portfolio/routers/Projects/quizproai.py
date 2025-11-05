# backend_portfolio/routers/Projects/quizproai.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
from sqlmodel import Session, select
from .models import Question
from backend_portfolio.db import engine

import os, json, re, datetime

load_dotenv()
router = APIRouter(prefix="/quizproai")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class CategoryRequest(BaseModel):
    category: str

# ----------------- helpers -----------------
FENCE = re.compile(r"```(?:json)?\s*(.*?)```", re.DOTALL | re.IGNORECASE)
LABEL_RE = re.compile(r'^\s*([A-Da-d])[\.\)\:\-]\s*(.*)$')

# simple viability check: length, letters, not a junk/forbidden keyword
BAD_CATEGORIES = {"test", "asdf", "qwerty", "random", "lorem", "nothing", "idk", "misc"}

def is_viable_category(cat: str) -> bool:
    if not cat:
        return False
    s = cat.strip()
    if len(s) < 3 or len(s) > 40:
        return False
    # must contain at least 3 letters
    letters = sum(ch.isalpha() for ch in s)
    if letters < 3:
        return False
    # allow letters, numbers, spaces, common punctuation
    if not re.match(r"^[\w\s\-\&\,\.\(\)\/\+]+$", s, flags=re.UNICODE):
        return False
    if s.lower() in BAD_CATEGORIES:
        return False
    return True


def extract_json_array(text: str) -> str:
    m = FENCE.search(text or "")
    return (m.group(1) if m else (text or "")).strip()

def norm(s: str) -> str:
    s = (s or "").lower().strip()
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"[^\w\s]", "", s)
    return s

def strip_label(text: str) -> str:
    if not isinstance(text, str):
        return text
    m = LABEL_RE.match(text)
    return m.group(2).strip() if m and m.group(2) else text.strip()

def sanitize_item(item: dict):
    """
    Ensure:
      - options are 4 plain strings (no labels)
      - answer is exactly one of those strings (map from A/B/C/D if needed)
    Return cleaned dict or None.
    """
    if not isinstance(item, dict):
        return None
    level = item.get("level")
    q = item.get("question")
    opts = item.get("options")
    ans = item.get("answer")

    if not (isinstance(level, int) and isinstance(q, str) and isinstance(opts, list) and len(opts) == 4):
        return None

    cleaned_opts = [strip_label(o) for o in opts]

    if isinstance(ans, str) and len(ans.strip()) == 1 and ans.upper() in "ABCD":
        idx = "ABCD".index(ans.upper())
        if not (0 <= idx < 4):
            return None
        ans_text = cleaned_opts[idx]
    else:
        ans_text = strip_label(ans) if isinstance(ans, str) else None

    if ans_text not in cleaned_opts:
        # try loose match
        low = [o.lower() for o in cleaned_opts]
        if isinstance(ans_text, str) and ans_text.lower() in low:
            ans_text = cleaned_opts[low.index(ans_text.lower())]
        else:
            return None

    return {
        "level": level,
        "question": q.strip(),
        "options": cleaned_opts,
        "answer": ans_text
    }

def get_unused(session: Session, category: str, limit: int = 5):
    stmt = (
        select(Question)
        .where(Question.category == category, Question.is_used == False)  # noqa: E712
        .order_by(Question.id)
        .limit(limit)
    )
    return list(session.exec(stmt))

def get_all_norms(session: Session, category: str, cap: int = 2000) -> list[str]:
    stmt = (
        select(Question.normalized_question)
        .where(Question.category == category)
        .order_by(Question.id.desc())
        .limit(cap)
    )
    return [x for x in session.exec(stmt) if x]

def mark_used(session: Session, rows: list[Question]) -> None:
    now = datetime.datetime.utcnow()
    for q in rows:
        q.is_used = True
        q.used_at = now
        session.add(q)
    session.commit()

def insert_batch(session: Session, category: str, items: list[dict]) -> int:
    existing = set(get_all_norms(session, category, cap=10000))
    added = 0
    for it in items:
        cleaned = sanitize_item(it)
        if not cleaned:
            continue
        nq = norm(cleaned["question"])
        if not nq or nq in existing:
            continue
        session.add(
            Question(
                category=category,
                level=int(cleaned["level"]),
                question=cleaned["question"],
                options_json=json.dumps(cleaned["options"], ensure_ascii=False),
                correct_answer=cleaned["answer"],
                normalized_question=nq,
                is_used=False,
            )
        )
        existing.add(nq)
        added += 1
    session.commit()
    return added

def build_prompt_10(category: str, banlist: list[str]) -> str:
    ban_text = "\n".join(f"- {b}" for b in banlist[:150]) if banlist else "(no prior items)"
    return f"""
Return ONLY a JSON array of 10 items (no commentary, no markdown fences).
Category: "{category}"

Each item must be EXACTLY:
{{
  "level": 1,
  "question": "under 220 chars",
  "options": ["option text 1", "option text 2", "option text 3", "option text 4"],
  "answer": "any of above options"
}}

Strict rules:
- Levels must be integers 1..10 (roughly increasing across the set).
- each question must have its uniques level (from 1 to 10)that does not repeat
- The four options must be distinct, concise, and UNLABELED (no A./B./C./D.).
- Exactly ONE correct answer.
- "answer" MUST be IDENTICAL to one of the strings in "options".
- No 'All of the above' / 'None of the above'.
- Make all 10 questions mutually different.
- DO NOT repeat or paraphrase ANY of these previously used/seen questions (normalize case/punctuation when checking):
{ban_text}

Quality check BEFORE you output:
- For each item, verify "answer" appears verbatim in its own "options". If not, fix it.
"""

def generate_10_and_store(session: Session, category: str) -> int:
    banlist = get_all_norms(session, category, cap=1000)
    prompt = build_prompt_10(category, banlist)

    resp = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        top_p=0.95,
        presence_penalty=0.1,
        max_tokens=2200,
    )
    raw = extract_json_array((resp.choices[0].message.content or "").strip())
    try:
        items = json.loads(raw)
        if not isinstance(items, list):
            raise ValueError("Model did not return a list.")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Bad JSON from model: {e}")

    return insert_batch(session, category, items)

# ----------------- endpoint -----------------
@router.post("/generate-questions/")
async def generate_questions(req: CategoryRequest):
    category = req.category.strip()
    if not is_viable_category(category):
        raise HTTPException(status_code=400, detail="Please enter a more specific, real category (3–40 chars, letters).")
    if not category:
        raise HTTPException(status_code=400, detail="Category required")

    with Session(engine) as session:
        # Try to serve 5 unused
        unused = get_unused(session, category, limit=5)

        # If not enough in pool, generate 10 and store, then try again
        if len(unused) < 5:
            generate_10_and_store(session, category)
            unused = get_unused(session, category, limit=5)

        if len(unused) == 0:
            raise HTTPException(status_code=502, detail="Could not prepare questions. Try again.")

        # Mark those 5 as used
        mark_used(session, unused)

        # Return to frontend as JSON STRING (keeps your current UI)
        payload = []
        for q in unused:
            payload.append({
                "level": q.level,
                "question": q.question,
                "options": json.loads(q.options_json),
                "answer": q.correct_answer
            })
        return json.dumps(payload, ensure_ascii=False)
