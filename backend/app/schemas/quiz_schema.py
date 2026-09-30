from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

class QuestionCreate(BaseModel):
    question_text: str
    options: List[str]
    correct_answer: str
    explanation: Optional[str] = None
    order_num: Optional[int] = 1


class QuestionResponse(BaseModel):
    id: int
    quiz_id: int
    question_text: str
    options: List[str]
    correct_answer: str
    explanation: Optional[str] = None
    order_num: int

    class Config:
        from_attributes = True


class QuestionStudentView(BaseModel):
    id: int
    quiz_id: int
    question_text: str
    options: List[str]
    order_num: int

    class Config:
        from_attributes = True


class QuizGenerateRequest(BaseModel):
    pdf_id: Optional[int] = None
    topic: Optional[str] = None
    difficulty: str = "medium"
    num_questions: int = Field(default=5, ge=1, le=50)
    title: Optional[str] = "AI Generated Quiz"
    duration_minutes: int = Field(default=15, ge=1, le=180)


class QuizCreate(BaseModel):
    title: str
    description: Optional[str] = None
    topic: Optional[str] = None
    difficulty: str = "medium"
    duration_minutes: int = 15
    pdf_id: Optional[int] = None
    questions: List[QuestionCreate] = []


class QuizUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    duration_minutes: Optional[int] = None
    questions: Optional[List[QuestionCreate]] = None


class QuizAssignmentResponse(BaseModel):
    id: int
    quiz_id: int
    class_id: Optional[int] = None
    student_id: Optional[int] = None
    due_date: Optional[datetime] = None
    created_at: datetime
    class_name: Optional[str] = None

    class Config:
        from_attributes = True


class QuizResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    topic: Optional[str] = None
    difficulty: str
    duration_minutes: int
    status: str
    teacher_id: int
    pdf_id: Optional[int] = None
    created_at: datetime
    question_count: Optional[int] = 0
    questions: Optional[List[QuestionResponse]] = None
    assignments: Optional[List[QuizAssignmentResponse]] = None

    class Config:
        from_attributes = True


class QuizAssignRequest(BaseModel):
    class_id: Optional[int] = None
    student_id: Optional[int] = None
    due_date: Optional[datetime] = None
