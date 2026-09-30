from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.database import Base, engine
from app.config import settings
from app.routers import (
    auth_router,
    classes_router,
    pdf_router,
    quiz_router,
    student_router,
    leaderboard_router,
    admin_router,
    teacher_router,
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Quiz Maker API",
    description="Full-stack AI-powered LMS for teachers and students",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for static access if needed
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth_router)
app.include_router(classes_router)
app.include_router(pdf_router)
app.include_router(quiz_router)
app.include_router(student_router)
app.include_router(leaderboard_router)
app.include_router(admin_router)
app.include_router(teacher_router)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "AI Quiz Maker LMS",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }
