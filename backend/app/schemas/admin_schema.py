from pydantic import BaseModel
from typing import Optional

class AdminStats(BaseModel):
    total_students: int
    total_teachers: int
    total_classes: int
    total_pdfs: int
    total_quizzes: int
    total_attempts: int
    avg_score: float
