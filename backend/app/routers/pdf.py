from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
import os
from app.database import get_db
from app.models.user import User
from app.models.pdf import PDFDocument
from app.schemas.pdf_schema import PDFResponse
from app.services.pdf_service import save_and_process_pdf
from app.dependencies import require_teacher

router = APIRouter(prefix="/pdf", tags=["PDF Management"])

@router.post("/upload", response_model=PDFResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    title, unique_name, file_path, file_size, page_count, extracted_text = await save_and_process_pdf(file)

    pdf_doc = PDFDocument(
        title=title,
        filename=file.filename,
        file_path=file_path,
        extracted_text=extracted_text,
        file_size=file_size,
        page_count=page_count,
        teacher_id=current_user.id
    )
    db.add(pdf_doc)
    db.commit()
    db.refresh(pdf_doc)

    return {
        "id": pdf_doc.id,
        "title": pdf_doc.title,
        "filename": pdf_doc.filename,
        "file_size": pdf_doc.file_size,
        "page_count": pdf_doc.page_count,
        "teacher_id": pdf_doc.teacher_id,
        "created_at": pdf_doc.created_at,
        "has_text": bool(pdf_doc.extracted_text and len(pdf_doc.extracted_text) > 10)
    }

@router.get("", response_model=List[PDFResponse])
def get_my_pdfs(db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    if current_user.role == "admin":
        pdfs = db.query(PDFDocument).order_by(PDFDocument.created_at.desc()).all()
    else:
        pdfs = db.query(PDFDocument).filter(PDFDocument.teacher_id == current_user.id).order_by(PDFDocument.created_at.desc()).all()

    return [
        {
            "id": p.id,
            "title": p.title,
            "filename": p.filename,
            "file_size": p.file_size,
            "page_count": p.page_count,
            "teacher_id": p.teacher_id,
            "created_at": p.created_at,
            "has_text": bool(p.extracted_text and len(p.extracted_text) > 10)
        }
        for p in pdfs
    ]

@router.get("/{pdf_id}", response_model=PDFResponse)
def get_pdf(pdf_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    pdf_doc = db.query(PDFDocument).filter(PDFDocument.id == pdf_id).first()
    if not pdf_doc:
        raise HTTPException(status_code=404, detail="PDF not found")
    if current_user.role != "admin" and pdf_doc.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this PDF")

    return {
        "id": pdf_doc.id,
        "title": pdf_doc.title,
        "filename": pdf_doc.filename,
        "file_size": pdf_doc.file_size,
        "page_count": pdf_doc.page_count,
        "teacher_id": pdf_doc.teacher_id,
        "created_at": pdf_doc.created_at,
        "has_text": bool(pdf_doc.extracted_text and len(pdf_doc.extracted_text) > 10)
    }

@router.delete("/{pdf_id}")
def delete_pdf(pdf_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    pdf_doc = db.query(PDFDocument).filter(PDFDocument.id == pdf_id).first()
    if not pdf_doc:
        raise HTTPException(status_code=404, detail="PDF not found")
    if current_user.role != "admin" and pdf_doc.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this PDF")

    if pdf_doc.file_path and os.path.exists(pdf_doc.file_path):
        try:
            os.remove(pdf_doc.file_path)
        except Exception:
            pass

    db.delete(pdf_doc)
    db.commit()
    return {"message": "PDF document deleted successfully"}
