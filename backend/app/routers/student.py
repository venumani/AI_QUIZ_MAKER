from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.quiz import Quiz, QuizAssignment
from app.models.question import Question
from app.models.attempt import QuizAttempt, AttemptAnswer
from app.models.class_model import Class, ClassStudent
from app.schemas.student_schema import (
    StudentQuizItem, AttemptResponse, AttemptDetailResponse,
    AttemptAnswerDetail, StudentStatsResponse
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/student", tags=["Student Operations"])

@router.get("/quizzes", response_model=List[StudentQuizItem])
def get_student_quizzes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Find classes student is enrolled in
    enrolled_class_ids = [
        cs.class_id for cs in db.query(ClassStudent).filter(ClassStudent.student_id == current_user.id).all()
    ]

    # Find assignments for student or classes
    assignments = db.query(QuizAssignment).filter(
        (QuizAssignment.student_id == current_user.id) |
        (QuizAssignment.class_id.in_(enrolled_class_ids) if enrolled_class_ids else False)
    ).all()

    assigned_quiz_ids = {a.quiz_id: a for a in assignments}

    # Also include all published quizzes so students can practice freely
    all_published_quizzes = db.query(Quiz).filter(Quiz.status == "published").all()

    quiz_map = {}
    for q in all_published_quizzes:
        assignment = assigned_quiz_ids.get(q.id)
        class_name = None
        due_date = None
        if assignment:
            due_date = assignment.due_date
            if assignment.class_id:
                c = db.query(Class).filter(Class.id == assignment.class_id).first()
                if c:
                    class_name = c.class_name

        # Check attempt status
        attempt = db.query(QuizAttempt).filter(
            QuizAttempt.quiz_id == q.id,
            QuizAttempt.student_id == current_user.id
        ).order_by(QuizAttempt.id.desc()).first()

        q_count = db.query(Question).filter(Question.quiz_id == q.id).count()

        quiz_map[q.id] = {
            "id": q.id,
            "title": q.title,
            "description": q.description,
            "topic": q.topic,
            "difficulty": q.difficulty,
            "duration_minutes": q.duration_minutes,
            "question_count": q_count,
            "status": q.status,
            "due_date": due_date,
            "class_name": class_name,
            "attempt_status": attempt.status if attempt else None,
            "attempt_id": attempt.id if attempt else None,
            "score": attempt.score if attempt else None,
            "percentage": attempt.percentage if attempt else None
        }

    return list(quiz_map.values())

@router.get("/history", response_model=List[AttemptResponse])
def get_student_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.student_id == current_user.id,
        QuizAttempt.status == "completed"
    ).order_by(QuizAttempt.submitted_at.desc()).all()

    results = []
    for a in attempts:
        quiz = db.query(Quiz).filter(Quiz.id == a.quiz_id).first()
        results.append({
            "id": a.id,
            "quiz_id": a.quiz_id,
            "student_id": a.student_id,
            "score": a.score,
            "total_questions": a.total_questions,
            "correct_answers": a.correct_answers,
            "percentage": a.percentage,
            "status": a.status,
            "started_at": a.started_at,
            "submitted_at": a.submitted_at,
            "quiz_title": quiz.title if quiz else "Quiz"
        })
    return results

@router.get("/statistics", response_model=StudentStatsResponse)
def get_student_statistics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.student_id == current_user.id,
        QuizAttempt.status == "completed"
    ).order_by(QuizAttempt.submitted_at.desc()).all()

    quizzes_completed = len(attempts)
    if quizzes_completed == 0:
        return {
            "quizzes_completed": 0,
            "avg_score": 0.0,
            "highest_score": 0.0,
            "total_questions_answered": 0,
            "accuracy_rate": 0.0,
            "recent_activity": []
        }

    total_percentage = sum(a.percentage for a in attempts)
    avg_score = round(total_percentage / quizzes_completed, 1)
    highest_score = round(max(a.percentage for a in attempts), 1)
    total_questions = sum(a.total_questions for a in attempts)
    total_correct = sum(a.correct_answers for a in attempts)
    accuracy_rate = round((total_correct / total_questions * 100), 1) if total_questions > 0 else 0.0

    recent_activity = []
    for a in attempts[:5]:
        quiz = db.query(Quiz).filter(Quiz.id == a.quiz_id).first()
        recent_activity.append({
            "id": a.id,
            "quiz_id": a.quiz_id,
            "student_id": a.student_id,
            "score": a.score,
            "total_questions": a.total_questions,
            "correct_answers": a.correct_answers,
            "percentage": a.percentage,
            "status": a.status,
            "started_at": a.started_at,
            "submitted_at": a.submitted_at,
            "quiz_title": quiz.title if quiz else "Quiz"
        })

    return {
        "quizzes_completed": quizzes_completed,
        "avg_score": avg_score,
        "highest_score": highest_score,
        "total_questions_answered": total_questions,
        "accuracy_rate": accuracy_rate,
        "recent_activity": recent_activity
    }

@router.get("/results/{attempt_id}", response_model=AttemptDetailResponse)
def get_student_result_detail(attempt_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    if current_user.role not in ["teacher", "admin"] and attempt.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this result")

    quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    questions = db.query(Question).filter(Question.quiz_id == attempt.quiz_id).order_by(Question.order_num).all()
    user_answers = {
        ans.question_id: ans for ans in db.query(AttemptAnswer).filter(AttemptAnswer.attempt_id == attempt.id).all()
    }

    questions_detail = []
    for q in questions:
        user_ans = user_answers.get(q.id)
        selected_option = user_ans.selected_option if user_ans else None
        is_correct = user_ans.is_correct if user_ans else False

        questions_detail.append({
            "question_id": q.id,
            "question_text": q.question_text,
            "options": q.options if isinstance(q.options, list) else [],
            "selected_option": selected_option,
            "correct_answer": q.correct_answer,
            "is_correct": is_correct,
            "explanation": q.explanation
        })

    return {
        "id": attempt.id,
        "quiz_id": attempt.quiz_id,
        "student_id": attempt.student_id,
        "score": attempt.score,
        "total_questions": attempt.total_questions,
        "correct_answers": attempt.correct_answers,
        "percentage": attempt.percentage,
        "status": attempt.status,
        "started_at": attempt.started_at,
        "submitted_at": attempt.submitted_at,
        "quiz_title": quiz.title if quiz else "Quiz",
        "questions": questions_detail
    }
