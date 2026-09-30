from pydantic import BaseModel
from typing import Optional

class LeaderboardEntry(BaseModel):
    rank: int
    student_id: int
    name: str
    avg_score: float
    total_quizzes: int


class MyRankResponse(BaseModel):
    rank: Optional[int] = None
    avg_score: float = 0.0
    total_quizzes: int = 0
