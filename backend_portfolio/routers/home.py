from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_home():
    return {
        "page": "Welcome to my Portfolio page!",
        "content": "My name is Jacob Gorelashvili. I am a backend developer, specializing in python and its frameworks"
    }