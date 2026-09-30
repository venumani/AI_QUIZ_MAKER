from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    topic = Column(String(255), nullable=True)
    difficulty = Column(String(50), default="medium")  # easy, medium, hard
    duration_minutes = Column(Integer, default=15)
    status = Column(String(20), default="draft")  # draft, published, archived
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    pdf_id = Column(Integer, ForeignKey("pdf_documents.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    teacher = relationship("User", back_populates="quizzes")
    pdf_doc = relationship("PDFDocument", back_populates="quizzes")
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan", order_by="Question.id")
    assignments = relationship("QuizAssignment", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")


class QuizAssignment(Base):
    __tablename__ = "quiz_assignments"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    quiz = relationship("Quiz", back_populates="assignments")
    class_obj = relationship("Class", back_populates="assignments")
