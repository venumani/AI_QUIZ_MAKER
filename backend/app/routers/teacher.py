from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.class_model import Class, ClassStudent
from app.models.quiz import Quiz
from app.models.attempt import QuizAttempt
from app.dependencies import require_teacher

router = APIRouter(prefix="/teacher", tags=["Teacher Analytics"])

@router.get("/analytics")
def get_teacher_analytics(db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    teacher_id = current_user.id
    
    # Teacher quizzes
    quizzes = db.query(Quiz).filter(Quiz.teacher_id == teacher_id).all() if current_user.role != "admin" else db.query(Quiz).all()
    quiz_ids = [q.id for q in quizzes]

    total_quizzes = len(quizzes)
    total_classes = db.query(Class).filter(Class.teacher_id == teacher_id).count() if current_user.role != "admin" else db.query(Class).count()

    # Enrolled students across teacher's classes
    teacher_classes = db.query(Class).filter(Class.teacher_id == teacher_id).all() if current_user.role != "admin" else db.query(Class).all()
    class_ids = [c.id for c in teacher_classes]
    
    total_students = db.query(ClassStudent.student_id).filter(ClassStudent.class_id.in_(class_ids)).distinct().count() if class_ids else 0

    # Attempts on teacher's quizzes
    if quiz_ids:
        attempts = db.query(QuizAttempt).filter(QuizAttempt.quiz_id.in_(quiz_ids), QuizAttempt.status == "completed").all()
    else:
        attempts = []

    total_attempts = len(attempts)
    avg_score = round(sum(a.percentage for a in attempts) / total_attempts, 1) if total_attempts > 0 else 0.0
    passed_count = sum(1 for a in attempts if a.percentage >= 60.0)
    pass_rate = round((passed_count / total_attempts * 100), 1) if total_attempts > 0 else 0.0

    recent_attempts_list = []
    for a in attempts[:8]:
        student = db.query(User).filter(User.id == a.student_id).first()
        quiz = db.query(Quiz).filter(Quiz.id == a.quiz_id).first()
        recent_attempts_list.append({
            "id": a.id,
            "student_name": student.name if student else "Unknown Student",
            "quiz_title": quiz.title if quiz else "Quiz",
            "score": a.score,
            "total_questions": a.total_questions,
            "percentage": a.percentage,
            "submitted_at": a.submitted_at
        })

    class_performance = []
    for c in teacher_classes:
        st_ids = [cs.student_id for cs in db.query(ClassStudent).filter(ClassStudent.class_id == c.id).all()]
        if st_ids and quiz_ids:
            c_attempts = db.query(QuizAttempt).filter(
                QuizAttempt.student_id.in_(st_ids),
                QuizAttempt.quiz_id.in_(quiz_ids),
                QuizAttempt.status == "completed"
            ).all()
            c_avg = round(sum(a.percentage for a in c_attempts) / len(c_attempts), 1) if c_attempts else 0.0
        else:
            c_avg = 0.0
        class_performance.append({
            "class_id": c.id,
            "class_name": c.class_name,
            "subject": c.subject,
            "student_count": len(st_ids),
            "avg_score": c_avg
        })

    return {
        "total_quizzes": total_quizzes,
        "total_classes": total_classes,
        "total_students": total_students,
        "total_attempts": total_attempts,
        "avg_score": avg_score,
        "pass_rate": pass_rate,
        "recent_attempts": recent_attempts_list,
        "class_performance": class_performance
    }
