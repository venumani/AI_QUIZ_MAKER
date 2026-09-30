from .auth import router as auth_router
from .classes import router as classes_router
from .pdf import router as pdf_router
from .quiz import router as quiz_router
from .student import router as student_router
from .leaderboard import router as leaderboard_router
from .admin import router as admin_router
from .teacher import router as teacher_router

__all__ = [
    "auth_router",
    "classes_router",
    "pdf_router",
    "quiz_router",
    "student_router",
    "leaderboard_router",
    "admin_router",
    "teacher_router",
]
