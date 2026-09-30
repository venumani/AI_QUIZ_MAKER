import fitz  # PyMuPDF
import os
import uuid
from fastapi import UploadFile, HTTPException
from app.config import settings

def extract_text_from_pdf_bytes(file_bytes: bytes) -> tuple[str, int]:
    """
    Extracts text and page count from raw PDF bytes using PyMuPDF.
    """
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text_parts = []
        page_count = len(doc)
        for page_num in range(page_count):
            page = doc.load_page(page_num)
            text_parts.append(page.get_text())
        doc.close()
        full_text = "\n\n".join(text_parts).strip()
        return full_text, page_count
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF document: {str(e)}")

async def save_and_process_pdf(file: UploadFile) -> tuple[str, str, str, int, int]:
    """
    Validates, saves PDF to disk, and extracts text.
    Returns: (title, filename, file_path, file_size, page_count, extracted_text)
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    content = await file.read()
    file_size = len(content)

    max_bytes = settings.MAX_PDF_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {settings.MAX_PDF_SIZE_MB}MB"
        )

    unique_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as f:
        f.write(content)

    extracted_text, page_count = extract_text_from_pdf_bytes(content)
    title = file.filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()

    return title, unique_name, file_path, file_size, page_count, extracted_text
