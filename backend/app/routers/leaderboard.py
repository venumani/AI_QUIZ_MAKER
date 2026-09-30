from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.attempt import QuizAttempt
from app.models.class_model import ClassStudent
from app.schemas.leaderboard_schema import LeaderboardEntry, MyRankResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])

@router.get("", response_model=List[LeaderboardEntry])
def get_overall_leaderboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Group completed attempts by student
    rows = (
        db.query(
            User.id.label("student_id"),
            User.name.label("name"),
            func.avg(QuizAttempt.percentage).label("avg_score"),
            func.count(QuizAttempt.id).label("total_quizzes")
        )
        .join(QuizAttempt, User.id == QuizAttempt.student_id)
        .filter(QuizAttempt.status == "completed")
        .group_by(User.id, User.name)
        .order_by(func.avg(QuizAttempt.percentage).desc(), func.count(QuizAttempt.id).desc())
        .all()
    )

    results = []
    for rank, r in enumerate(rows, start=1):
        results.append({
            "rank": rank,
            "student_id": r.student_id,
            "name": r.name,
            "avg_score": round(float(r.avg_score or 0), 1),
            "total_quizzes": int(r.total_quizzes or 0)
        })

    return results

@router.get("/my-rank", response_model=MyRankResponse)
def get_my_rank(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = (
        db.query(
            User.id.label("student_id"),
            func.avg(QuizAttempt.percentage).label("avg_score"),
            func.count(QuizAttempt.id).label("total_quizzes")
        )
        .join(QuizAttempt, User.id == QuizAttempt.student_id)
        .filter(QuizAttempt.status == "completed")
        .group_by(User.id)
        .order_by(func.avg(QuizAttempt.percentage).desc(), func.count(QuizAttempt.id).desc())
        .all()
    )

    for rank, r in enumerate(rows, start=1):
        if r.student_id == current_user.id:
            return {
                "rank": rank,
                "avg_score": round(float(r.avg_score or 0), 1),
                "total_quizzes": int(r.total_quizzes or 0)
            }

    return {
        "rank": None,
        "avg_score": 0.0,
        "total_quizzes": 0
    }

@router.get("/class/{class_id}", response_model=List[LeaderboardEntry])
def get_class_leaderboard(class_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    class_students = [cs.student_id for cs in db.query(ClassStudent).filter(ClassStudent.class_id == class_id).all()]
    if not class_students:
        return []

    rows = (
        db.query(
            User.id.label("student_id"),
            User.name.label("name"),
            func.avg(QuizAttempt.percentage).label("avg_score"),
            func.count(QuizAttempt.id).label("total_quizzes")
        )
        .join(QuizAttempt, User.id == QuizAttempt.student_id)
        .filter(QuizAttempt.status == "completed", User.id.in_(class_students))
        .group_by(User.id, User.name)
        .order_by(func.avg(QuizAttempt.percentage).desc(), func.count(QuizAttempt.id).desc())
        .all()
    )

    results = []
    for rank, r in enumerate(rows, start=1):
        results.append({
            "rank": rank,
            "student_id": r.student_id,
            "name": r.name,
            "avg_score": round(float(r.avg_score or 0), 1),
            "total_quizzes": int(r.total_quizzes or 0)
        })

    return results

@router.get("/quiz/{quiz_id}", response_model=List[LeaderboardEntry])
def get_quiz_leaderboard(quiz_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    attempts = (
        db.query(
            User.id.label("student_id"),
            User.name.label("name"),
            QuizAttempt.percentage.label("avg_score")
        )
        .join(User, QuizAttempt.student_id == User.id)
        .filter(QuizAttempt.quiz_id == quiz_id, QuizAttempt.status == "completed")
        .order_by(QuizAttempt.percentage.desc(), QuizAttempt.submitted_at.asc())
        .all()
    )

    results = []
    for rank, a in enumerate(attempts, start=1):
        results.append({
            "rank": rank,
            "student_id": a.student_id,
            "name": a.name,
            "avg_score": round(float(a.avg_score or 0), 1),
            "total_quizzes": 1
        })

    return results
