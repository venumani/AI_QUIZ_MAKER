from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.class_model import Class, ClassStudent
from app.schemas.class_schema import ClassCreate, ClassResponse, ClassDetailResponse, ClassStudentResponse, AddStudentRequest
from app.dependencies import require_teacher, get_current_user

router = APIRouter(prefix="/teacher/classes", tags=["Classes"])

@router.post("", response_model=ClassResponse)
def create_class(data: ClassCreate, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    new_class = Class(
        class_name=data.class_name.strip(),
        subject=data.subject.strip(),
        academic_year=data.academic_year.strip(),
        teacher_id=current_user.id
    )
    db.add(new_class)
    db.commit()
    db.refresh(new_class)

    return {
        "id": new_class.id,
        "class_name": new_class.class_name,
        "subject": new_class.subject,
        "academic_year": new_class.academic_year,
        "teacher_id": new_class.teacher_id,
        "created_at": new_class.created_at,
        "student_count": 0
    }

@router.get("", response_model=List[ClassResponse])
def get_classes(db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    classes = db.query(Class).filter(Class.teacher_id == current_user.id).order_by(Class.created_at.desc()).all()
    results = []
    for c in classes:
        student_count = db.query(ClassStudent).filter(ClassStudent.class_id == c.id).count()
        results.append({
            "id": c.id,
            "class_name": c.class_name,
            "subject": c.subject,
            "academic_year": c.academic_year,
            "teacher_id": c.teacher_id,
            "created_at": c.created_at,
            "student_count": student_count
        })
    return results

@router.get("/{class_id}", response_model=ClassDetailResponse)
def get_class_detail(class_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    c = db.query(Class).filter(Class.id == class_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Class not found")
    if current_user.role != "admin" and c.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this class")

    enrollments = db.query(ClassStudent).filter(ClassStudent.class_id == c.id).all()
    students_data = []
    for e in enrollments:
        st = db.query(User).filter(User.id == e.student_id).first()
        if st:
            students_data.append({
                "id": st.id,
                "name": st.name,
                "email": st.email,
                "joined_at": e.joined_at
            })

    return {
        "id": c.id,
        "class_name": c.class_name,
        "subject": c.subject,
        "academic_year": c.academic_year,
        "teacher_id": c.teacher_id,
        "created_at": c.created_at,
        "student_count": len(students_data),
        "students": students_data
    }

@router.delete("/{class_id}")
def delete_class(class_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    c = db.query(Class).filter(Class.id == class_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Class not found")
    if current_user.role != "admin" and c.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this class")

    db.delete(c)
    db.commit()
    return {"message": "Class deleted successfully"}

@router.get("/{class_id}/students", response_model=List[ClassStudentResponse])
def get_class_students(class_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    c = db.query(Class).filter(Class.id == class_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Class not found")

    enrollments = db.query(ClassStudent).filter(ClassStudent.class_id == class_id).all()
    results = []
    for e in enrollments:
        student = db.query(User).filter(User.id == e.student_id).first()
        if student:
            results.append({
                "id": student.id,
                "name": student.name,
                "email": student.email,
                "joined_at": e.joined_at
            })
    return results

@router.post("/{class_id}/students")
def add_student_to_class(class_id: int, data: AddStudentRequest, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    c = db.query(Class).filter(Class.id == class_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Class not found")
    if current_user.role != "admin" and c.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this class")

    student = None
    if data.student_id:
        student = db.query(User).filter(User.id == data.student_id, User.role == "student").first()
    elif data.student_email:
        student = db.query(User).filter(User.email == data.student_email.lower().strip(), User.role == "student").first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found with provided email or ID")

    existing = db.query(ClassStudent).filter(ClassStudent.class_id == class_id, ClassStudent.student_id == student.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student already enrolled in this class")

    enrollment = ClassStudent(class_id=class_id, student_id=student.id)
    db.add(enrollment)
    db.commit()

    return {"message": f"Student {student.name} added to class successfully", "student_id": student.id}

@router.delete("/{class_id}/students/{student_id}")
def remove_student_from_class(class_id: int, student_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    c = db.query(Class).filter(Class.id == class_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Class not found")

    enrollment = db.query(ClassStudent).filter(ClassStudent.class_id == class_id, ClassStudent.student_id == student_id).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Student enrollment not found in this class")

    db.delete(enrollment)
    db.commit()
    return {"message": "Student removed from class"}
