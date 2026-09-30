from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # List of strings e.g. ["Option A", "Option B", ...]
    correct_answer = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=True)
    order_num = Column(Integer, default=1)

    # Relationships
    quiz = relationship("Quiz", back_populates="questions")
