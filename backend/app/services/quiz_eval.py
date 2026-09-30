from typing import Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.quiz import Quiz
from app.models.question import Question
from app.models.attempt import QuizAttempt, AttemptAnswer

def evaluate_quiz_submission(
    db: Session,
    attempt: QuizAttempt,
    answers_map: Dict[int, str]
) -> QuizAttempt:
    """
    Evaluates student answers against true answers in the database.
    Calculates correct answers, total score, and percentage.
    """
    quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = db.query(Question).filter(Question.quiz_id == quiz.id).order_by(Question.order_num).all()
    total_questions = len(questions)

    if total_questions == 0:
        attempt.score = 0.0
        attempt.percentage = 0.0
        attempt.correct_answers = 0
        attempt.total_questions = 0
        attempt.status = "completed"
        attempt.submitted_at = datetime.utcnow()
        db.commit()
        db.refresh(attempt)
        return attempt

    # Clear previous answer records if re-evaluating
    db.query(AttemptAnswer).filter(AttemptAnswer.attempt_id == attempt.id).delete()

    correct_count = 0
    for q in questions:
        # answers_map keys might be int or str representation of int
        selected_option = answers_map.get(q.id) or answers_map.get(str(q.id))
        is_correct = False
        if selected_option is not None and str(selected_option).strip() == str(q.correct_answer).strip():
            is_correct = True
            correct_count += 1

        ans_record = AttemptAnswer(
            attempt_id=attempt.id,
            question_id=q.id,
            selected_option=selected_option,
            is_correct=is_correct
        )
        db.add(ans_record)

    percentage = round((correct_count / total_questions) * 100, 2)

    attempt.total_questions = total_questions
    attempt.correct_answers = correct_count
    attempt.score = float(correct_count)
    attempt.percentage = percentage
    attempt.status = "completed"
    attempt.submitted_at = datetime.utcnow()

    db.commit()
    db.refresh(attempt)
    return attempt
