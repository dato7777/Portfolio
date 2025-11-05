from fastapi import APIRouter

router = APIRouter()

@router.get("/about")
def get_about():
    return {
        "name": "David Gor",
        "title": "Backend Developer",
        "summary": "I specialize in Python and FastAPI. I enjoy building clean, scalable web APIs and backend logic.",
        "location": "Israel",
        "skills": ["Python", "FastAPI", "SQL", "Docker", "Linux", "REST APIs"]
    }
