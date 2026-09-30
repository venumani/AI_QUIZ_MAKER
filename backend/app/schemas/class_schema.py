from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .auth import UserResponse

class ClassCreate(BaseModel):
    class_name: str = Field(..., min_length=1)
    subject: str = Field(..., min_length=1)
    academic_year: str = Field(..., min_length=1)


class ClassStudentResponse(BaseModel):
    id: int
    name: str
    email: str
    joined_at: datetime


class ClassResponse(BaseModel):
    id: int
    class_name: str
    subject: str
    academic_year: str
    teacher_id: int
    created_at: datetime
    student_count: Optional[int] = 0

    class Config:
        from_attributes = True


class ClassDetailResponse(ClassResponse):
    students: List[ClassStudentResponse] = []


class AddStudentRequest(BaseModel):
    student_email: Optional[str] = None
    student_id: Optional[int] = None
