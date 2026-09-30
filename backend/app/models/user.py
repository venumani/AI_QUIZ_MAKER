from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="student", nullable=False)  # admin, teacher, student
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    classes_taught = relationship("Class", back_populates="teacher", cascade="all, delete-orphan")
    enrolled_classes = relationship("ClassStudent", back_populates="student", cascade="all, delete-orphan")
    pdfs = relationship("PDFDocument", back_populates="teacher", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="teacher", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="student", cascade="all, delete-orphan")
