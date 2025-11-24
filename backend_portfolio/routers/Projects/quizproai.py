# backend_portfolio/routers/Projects/quizproai.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
from sqlmodel import Session, select
from .models import Question, User
from backend_portfolio.db import engine
from backend_portfolio.auth_utils import get_current_user

import os, json, re, datetime, random  # 👈 random added

load_dotenv()
router = APIRouter(prefix="/quizproai")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ----------------- request model -----------------
class CategoryRequest(BaseModel):
    category: str
    language: str

# ----------------- helpers -----------------
FENCE = re.compile(r"```(?:json)?\s*(.*?)```", re.DOTALL | re.IGNORECASE)
LABEL_RE = re.compile(r'^\s*([A-Da-d])[\.\)\:\-]\s*(.*)$')
BAD_CATEGORIES = {"test", "asdf", "qwerty", "random", "lorem", "nothing", "idk", "misc"}

def bucket(category: str, language: str) -> str:
    """Namespace pools by category+language (so 'History::English' != 'History::Russian')."""
    return f"{category.strip()}::{language.strip()}"

def is_viable_category(cat: str) -> bool:
    if not cat:
        return False
    s = cat.strip()
    if len(s) < 3 or len(s) > 40:
        return False
    letters = sum(ch.isalpha() for ch in s)
    if letters < 3:
        return False
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
        ans_text = cleaned_opts[idx] if 0 <= idx < 4 else None
    else:
        ans_text = strip_label(ans) if isinstance(ans, str) else None

    if ans_text not in cleaned_opts:
        low = [o.lower() for o in cleaned_opts]
        if isinstance(ans_text, str) and ans_text.lower() in low:
            ans_text = cleaned_opts[low.index(ans_text.lower())]
        else:
            return None

    return {
        "level": level,
        "question": q.strip(),
        "options": cleaned_opts,
        "answer": ans_text,
    }

def get_unused(session: Session, cat_key: str, limit: int = 5):
    stmt = (
        select(Question)
        .where(Question.category == cat_key, Question.is_used == False)
        .order_by(Question.id)
        .limit(limit)
    )
    return list(session.exec(stmt))

def get_all_norms(session: Session, cat_key: str, cap: int = 2000) -> list[str]:
    stmt = (
        select(Question.normalized_question)
        .where(Question.category == cat_key)
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

def insert_batch(session: Session, cat_key: str, items: list[dict]) -> int:
    """Also shuffles options server-side to avoid answer-position bias."""
    existing = set(get_all_norms(session, cat_key, cap=10000))
    added = 0
    for it in items:
        cleaned = sanitize_item(it)
        if not cleaned:
            continue

        # 🔀 Shuffle options to avoid model bias for positions
        opts = cleaned["options"][:]
        random.shuffle(opts)
        # answer is the option text itself, so it remains valid after shuffle
        if cleaned["answer"] not in opts:
            # extremely rare, but defensive:
            opts = cleaned["options"]

        nq = norm(cleaned["question"])
        if not nq or nq in existing:
            continue
        session.add(
            Question(
                category=cat_key,
                level=int(cleaned["level"]),
                question=cleaned["question"],
                options_json=json.dumps(opts, ensure_ascii=False),
                correct_answer=cleaned["answer"],
                normalized_question=nq,
                is_used=False,
            )
        )
        existing.add(nq)
        added += 1
    session.commit()
    return added

def build_prompt_10(category: str, language: str, banlist: list[str]) -> str:
    ban_text = "\n".join(f"- {b}" for b in banlist[:150]) if banlist else "(no prior items)"
    return f"""
Return ONLY a JSON array of 10 items (no commentary, no markdown fences).

Each item must be structured as:
{{
  "level": 1,
  "question": "under 220 chars",
  "options": ["option text 1", "option text 2", "option text 3", "option text 4"],
  "answer": "any of above options"
}}

Write everything (questions, options, and answers) in **{language}**.
Randomize the order of the 4 options for each question.

Category: "{category}"

Strict rules:
- Levels must be integers 1..10 (unique per question).
- Options must be distinct, concise, and UNLABELED.
- Exactly ONE correct answer, identical to one of the options.
- No 'All of the above' / 'None of the above'.
- Make all 10 questions mutually different.
- DO NOT repeat or paraphrase any of these previously used questions (normalize case/punctuation when checking):
{ban_text}

Quality check BEFORE you output:
- Verify each "answer" appears verbatim in "options".
"""

def generate_10_and_store(session: Session, cat_key: str, category_label: str, language: str) -> int:
    """Generate 10 questions in chosen language and save under the bucket key."""
    banlist = get_all_norms(session, cat_key, cap=1000)
    prompt = build_prompt_10(category_label, language, banlist)

    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an expert multilingual quiz question generator."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.4,
        top_p=0.95,
        presence_penalty=0.1,
        max_tokens=2200,
    )

    raw = (resp.choices[0].message.content or "").strip()

    # 1) strip ``` fences if present
    text = extract_json_array(raw)

    # 2) If still not starting with '[', try to isolate the first [...] block
    if not text.lstrip().startswith("["):
        start = raw.find("[")
        end = raw.rfind("]")
        if start != -1 and end != -1 and end > start:
            text = raw[start : end + 1].strip()

    # 3) Parse JSON
    try:
        items = json.loads(text)
        if not isinstance(items, list):
            raise ValueError(f"Expected a list, got {type(items)}")
    except Exception as e:
        # print("🔴 Raw model output:\n", raw[:1000])
        # print("🔴 Parsed text candidate:\n", text[:1000])
        raise HTTPException(status_code=502, detail=f"Bad JSON from model: {e}")

    return insert_batch(session, cat_key, items)

# ----------------- endpoint -----------------
@router.post("/generate-questions/")
async def generate_questions(req: CategoryRequest, 
                             current_user: User = Depends(get_current_user), ):
    category = req.category.strip()
    language = req.language.strip().capitalize()

    if not is_viable_category(category):
        raise HTTPException(status_code=400, detail="Please enter a valid category (3–40 letters).")

    cat_key = bucket(category, language)   # 👈 namespace the pool

    with Session(engine) as session:
        unused = get_unused(session, cat_key, limit=5)

        if len(unused) < 5:
            generate_10_and_store(session, cat_key, category, language)
            unused = get_unused(session, cat_key, limit=5)

        if len(unused) == 0:
            raise HTTPException(status_code=502, detail="Could not prepare questions. Try again later.")

        mark_used(session, unused)

        payload = []
        for q in unused:
            payload.append({
                "level": q.level,
                "question": q.question,
                "options": json.loads(q.options_json),
                "answer": q.correct_answer,
            })

        return json.dumps(payload, ensure_ascii=False)
