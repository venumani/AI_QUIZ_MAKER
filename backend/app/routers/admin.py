from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.class_model import Class
from app.models.pdf import PDFDocument
from app.models.quiz import Quiz
from app.models.attempt import QuizAttempt
from app.schemas.auth import UserResponse
from app.schemas.admin_schema import AdminStats
from app.schemas.quiz_schema import QuizResponse
from app.dependencies import require_admin
from app.routers.quiz import build_quiz_response

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

@router.get("/statistics", response_model=AdminStats)
def get_admin_stats(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    total_students = db.query(User).filter(User.role == "student").count()
    total_teachers = db.query(User).filter(User.role == "teacher").count()
    total_classes = db.query(Class).count()
    total_pdfs = db.query(PDFDocument).count()
    total_quizzes = db.query(Quiz).count()
    total_attempts = db.query(QuizAttempt).filter(QuizAttempt.status == "completed").count()

    avg_score_res = db.query(func.avg(QuizAttempt.percentage)).filter(QuizAttempt.status == "completed").scalar()
    avg_score = round(float(avg_score_res or 0.0), 1)

    return {
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_classes": total_classes,
        "total_pdfs": total_pdfs,
        "total_quizzes": total_quizzes,
        "total_attempts": total_attempts,
        "avg_score": avg_score
    }

@router.get("/students", response_model=List[UserResponse])
def get_all_students(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(User).filter(User.role == "student").order_by(User.created_at.desc()).all()

@router.get("/teachers", response_model=List[UserResponse])
def get_all_teachers(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(User).filter(User.role == "teacher").order_by(User.created_at.desc()).all()

@router.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(student)
    db.commit()
    return {"message": "Student deleted successfully"}

@router.delete("/teachers/{teacher_id}")
def delete_teacher(teacher_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    teacher = db.query(User).filter(User.id == teacher_id, User.role == "teacher").first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    db.delete(teacher)
    db.commit()
    return {"message": "Teacher deleted successfully"}

@router.get("/quizzes", response_model=List[QuizResponse])
def get_all_quizzes(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    quizzes = db.query(Quiz).order_by(Quiz.created_at.desc()).all()
    return [build_quiz_response(q, db, include_questions=True) for q in quizzes]

@router.delete("/quizzes/{quiz_id}")
def admin_delete_quiz(quiz_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    db.delete(quiz)
    db.commit()
    return {"message": "Quiz deleted successfully"}
