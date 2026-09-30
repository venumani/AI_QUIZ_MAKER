from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.models.pdf import PDFDocument
from app.models.quiz import Quiz, QuizAssignment
from app.models.question import Question
from app.models.attempt import QuizAttempt, AttemptAnswer
from app.models.class_model import Class, ClassStudent
from app.schemas.quiz_schema import (
    QuizGenerateRequest, QuizCreate, QuizUpdateRequest, QuizResponse,
    QuestionResponse, QuizAssignRequest, QuizAssignmentResponse
)
from app.schemas.student_schema import SubmitAnswersRequest, AttemptResponse, AttemptDetailResponse, AttemptAnswerDetail
from app.services.ai_service import generate_quiz_questions
from app.services.quiz_eval import evaluate_quiz_submission
from app.dependencies import require_teacher, get_current_user

router = APIRouter(prefix="/quiz", tags=["Quiz Operations"])

def build_quiz_response(q: Quiz, db: Session, include_questions: bool = True, include_answers: bool = True) -> dict:
    questions_query = db.query(Question).filter(Question.quiz_id == q.id).order_by(Question.order_num).all()
    assignments_query = db.query(QuizAssignment).filter(QuizAssignment.quiz_id == q.id).all()

    assignment_list = []
    for a in assignments_query:
        class_name = None
        if a.class_id:
            c = db.query(Class).filter(Class.id == a.class_id).first()
            if c:
                class_name = c.class_name
        assignment_list.append({
            "id": a.id,
            "quiz_id": a.quiz_id,
            "class_id": a.class_id,
            "student_id": a.student_id,
            "due_date": a.due_date,
            "created_at": a.created_at,
            "class_name": class_name
        })

    questions_list = []
    if include_questions:
        for item in questions_query:
            q_dict = {
                "id": item.id,
                "quiz_id": item.quiz_id,
                "question_text": item.question_text,
                "options": item.options if isinstance(item.options, list) else [],
                "order_num": item.order_num
            }
            if include_answers:
                q_dict["correct_answer"] = item.correct_answer
                q_dict["explanation"] = item.explanation
            else:
                q_dict["correct_answer"] = ""
                q_dict["explanation"] = ""
            questions_list.append(q_dict)

    return {
        "id": q.id,
        "title": q.title,
        "description": q.description,
        "topic": q.topic,
        "difficulty": q.difficulty,
        "duration_minutes": q.duration_minutes,
        "status": q.status,
        "teacher_id": q.teacher_id,
        "pdf_id": q.pdf_id,
        "created_at": q.created_at,
        "question_count": len(questions_query),
        "questions": questions_list if include_questions else None,
        "assignments": assignment_list
    }

@router.post("/generate", response_model=QuizResponse)
async def generate_quiz(
    data: QuizGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    pdf_text = ""
    topic_text = data.topic or "General Knowledge"

    if data.pdf_id:
        pdf_doc = db.query(PDFDocument).filter(PDFDocument.id == data.pdf_id).first()
        if not pdf_doc:
            raise HTTPException(status_code=404, detail="PDF not found")
        pdf_text = pdf_doc.extracted_text or ""
        if not data.topic:
            topic_text = pdf_doc.title

    generated_items = await generate_quiz_questions(
        text=pdf_text,
        topic=topic_text,
        num_questions=data.num_questions,
        difficulty=data.difficulty
    )

    quiz_title = data.title or f"Quiz: {topic_text}"
    new_quiz = Quiz(
        title=quiz_title,
        description=f"Generated {data.difficulty} quiz on {topic_text}",
        topic=topic_text,
        difficulty=data.difficulty,
        duration_minutes=data.duration_minutes,
        status="draft",
        teacher_id=current_user.id,
        pdf_id=data.pdf_id
    )
    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)

    for i, item in enumerate(generated_items):
        q = Question(
            quiz_id=new_quiz.id,
            question_text=item["question_text"],
            options=item["options"],
            correct_answer=item["correct_answer"],
            explanation=item.get("explanation", ""),
            order_num=i + 1
        )
        db.add(q)

    db.commit()
    db.refresh(new_quiz)
    return build_quiz_response(new_quiz, db)

@router.post("/create", response_model=QuizResponse)
def create_quiz_manual(
    data: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    new_quiz = Quiz(
        title=data.title,
        description=data.description,
        topic=data.topic,
        difficulty=data.difficulty,
        duration_minutes=data.duration_minutes,
        status="draft",
        teacher_id=current_user.id,
        pdf_id=data.pdf_id
    )
    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)

    for i, item in enumerate(data.questions):
        q = Question(
            quiz_id=new_quiz.id,
            question_text=item.question_text,
            options=item.options,
            correct_answer=item.correct_answer,
            explanation=item.explanation,
            order_num=item.order_num or (i + 1)
        )
        db.add(q)

    db.commit()
    db.refresh(new_quiz)
    return build_quiz_response(new_quiz, db)

@router.get("/teacher", response_model=List[QuizResponse])
def get_teacher_quizzes(db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    if current_user.role == "admin":
        quizzes = db.query(Quiz).order_by(Quiz.created_at.desc()).all()
    else:
        quizzes = db.query(Quiz).filter(Quiz.teacher_id == current_user.id).order_by(Quiz.created_at.desc()).all()

    return [build_quiz_response(q, db, include_questions=True) for q in quizzes]

@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz_detail(quiz_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    if current_user.role in ["teacher", "admin"]:
        return build_quiz_response(quiz, db, include_questions=True, include_answers=True)

    # If student, check if attempt is completed
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.student_id == current_user.id
    ).order_by(QuizAttempt.id.desc()).first()

    has_completed = attempt and attempt.status == "completed"
    return build_quiz_response(quiz, db, include_questions=True, include_answers=has_completed)

@router.put("/{quiz_id}", response_model=QuizResponse)
def update_quiz(
    quiz_id: int,
    data: QuizUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if current_user.role != "admin" and quiz.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this quiz")

    if data.title is not None:
        quiz.title = data.title
    if data.description is not None:
        quiz.description = data.description
    if data.topic is not None:
        quiz.topic = data.topic
    if data.difficulty is not None:
        quiz.difficulty = data.difficulty
    if data.duration_minutes is not None:
        quiz.duration_minutes = data.duration_minutes

    if data.questions is not None:
        db.query(Question).filter(Question.quiz_id == quiz_id).delete()
        for i, item in enumerate(data.questions):
            q = Question(
                quiz_id=quiz.id,
                question_text=item.question_text,
                options=item.options,
                correct_answer=item.correct_answer,
                explanation=item.explanation,
                order_num=item.order_num or (i + 1)
            )
            db.add(q)

    db.commit()
    db.refresh(quiz)
    return build_quiz_response(quiz, db)

@router.post("/{quiz_id}/publish", response_model=QuizResponse)
def publish_quiz(quiz_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if current_user.role != "admin" and quiz.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to publish this quiz")

    quiz.status = "published"
    db.commit()
    db.refresh(quiz)
    return build_quiz_response(quiz, db)

@router.post("/{quiz_id}/assign")
def assign_quiz(
    quiz_id: int,
    data: QuizAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if current_user.role != "admin" and quiz.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to assign this quiz")

    assignment = QuizAssignment(
        quiz_id=quiz_id,
        class_id=data.class_id,
        student_id=data.student_id,
        due_date=data.due_date
    )
    db.add(assignment)
    db.commit()
    return {"message": "Quiz assigned successfully", "assignment_id": assignment.id}

@router.delete("/{quiz_id}")
def delete_quiz(quiz_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if current_user.role != "admin" and quiz.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this quiz")

    db.delete(quiz)
    db.commit()
    return {"message": "Quiz deleted successfully"}

# ── STUDENT ATTEMPT ENDPOINTS ──

@router.post("/{quiz_id}/start")
def start_quiz_attempt(quiz_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Check for existing attempt
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.student_id == current_user.id
    ).first()

    if attempt and attempt.status == "completed":
        raise HTTPException(status_code=400, detail="You have already completed this quiz")

    if not attempt:
        questions = db.query(Question).filter(Question.quiz_id == quiz_id).all()
        attempt = QuizAttempt(
            quiz_id=quiz_id,
            student_id=current_user.id,
            total_questions=len(questions),
            status="in_progress",
            started_at=datetime.utcnow()
        )
        db.add(attempt)
        db.commit()
        db.refresh(attempt)

    # Return attempt info with student view of questions (no answers)
    questions = db.query(Question).filter(Question.quiz_id == quiz_id).order_by(Question.order_num).all()
    q_data = [
        {
            "id": q.id,
            "quiz_id": q.quiz_id,
            "question_text": q.question_text,
            "options": q.options if isinstance(q.options, list) else [],
            "order_num": q.order_num
        }
        for q in questions
    ]

    return {
        "attempt_id": attempt.id,
        "quiz_id": quiz.id,
        "title": quiz.title,
        "duration_minutes": quiz.duration_minutes,
        "started_at": attempt.started_at,
        "questions": q_data
    }

@router.post("/{quiz_id}/submit", response_model=AttemptResponse)
def submit_quiz_attempt(
    quiz_id: int,
    data: SubmitAnswersRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.student_id == current_user.id
    ).order_by(QuizAttempt.id.desc()).first()

    if not attempt:
        # Create attempt on the fly if not started explicitly
        questions = db.query(Question).filter(Question.quiz_id == quiz_id).all()
        attempt = QuizAttempt(
            quiz_id=quiz_id,
            student_id=current_user.id,
            total_questions=len(questions),
            status="in_progress",
            started_at=datetime.utcnow()
        )
        db.add(attempt)
        db.commit()
        db.refresh(attempt)

    evaluated = evaluate_quiz_submission(db, attempt, data.answers)
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()

    return {
        "id": evaluated.id,
        "quiz_id": evaluated.quiz_id,
        "student_id": evaluated.student_id,
        "score": evaluated.score,
        "total_questions": evaluated.total_questions,
        "correct_answers": evaluated.correct_answers,
        "percentage": evaluated.percentage,
        "status": evaluated.status,
        "started_at": evaluated.started_at,
        "submitted_at": evaluated.submitted_at,
        "quiz_title": quiz.title if quiz else "Quiz"
    }

@router.post("/attempt/{attempt_id}/submit", response_model=AttemptResponse)
def submit_by_attempt_id(
    attempt_id: int,
    data: SubmitAnswersRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if current_user.role != "admin" and attempt.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to submit this attempt")

    evaluated = evaluate_quiz_submission(db, attempt, data.answers)
    quiz = db.query(Quiz).filter(Quiz.id == evaluated.quiz_id).first()

    return {
        "id": evaluated.id,
        "quiz_id": evaluated.quiz_id,
        "student_id": evaluated.student_id,
        "score": evaluated.score,
        "total_questions": evaluated.total_questions,
        "correct_answers": evaluated.correct_answers,
        "percentage": evaluated.percentage,
        "status": evaluated.status,
        "started_at": evaluated.started_at,
        "submitted_at": evaluated.submitted_at,
        "quiz_title": quiz.title if quiz else "Quiz"
    }
