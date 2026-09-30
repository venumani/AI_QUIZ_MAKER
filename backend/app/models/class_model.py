from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String(100), nullable=False)
    subject = Column(String(100), nullable=False)
    academic_year = Column(String(50), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    teacher = relationship("User", back_populates="classes_taught")
    students = relationship("ClassStudent", back_populates="class_obj", cascade="all, delete-orphan")
    assignments = relationship("QuizAssignment", back_populates="class_obj", cascade="all, delete-orphan")


class ClassStudent(Base):
    __tablename__ = "class_students"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    class_obj = relationship("Class", back_populates="students")
    student = relationship("User", back_populates="enrolled_classes")
