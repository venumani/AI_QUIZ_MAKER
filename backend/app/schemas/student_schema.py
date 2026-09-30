from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from .quiz_schema import QuestionResponse

class SubmitAnswersRequest(BaseModel):
    answers: Dict[int, str]  # question_id -> selected_option


class AttemptAnswerDetail(BaseModel):
    question_id: int
    question_text: str
    options: List[str]
    selected_option: Optional[str] = None
    correct_answer: str
    is_correct: bool
    explanation: Optional[str] = None


class StudentQuizItem(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    topic: Optional[str] = None
    difficulty: str
    duration_minutes: int
    question_count: int
    status: str
    due_date: Optional[datetime] = None
    class_name: Optional[str] = None
    attempt_status: Optional[str] = None  # None, "in_progress", "completed"
    attempt_id: Optional[int] = None
    score: Optional[float] = None
    percentage: Optional[float] = None


class AttemptResponse(BaseModel):
    id: int
    quiz_id: int
    student_id: int
    score: float
    total_questions: int
    correct_answers: int
    percentage: float
    status: str
    started_at: datetime
    submitted_at: Optional[datetime] = None
    quiz_title: Optional[str] = None

    class Config:
        from_attributes = True


class AttemptDetailResponse(AttemptResponse):
    questions: List[AttemptAnswerDetail] = []


class StudentStatsResponse(BaseModel):
    quizzes_completed: int = 0
    avg_score: float = 0.0
    highest_score: float = 0.0
    total_questions_answered: int = 0
    accuracy_rate: float = 0.0
    recent_activity: List[AttemptResponse] = []
