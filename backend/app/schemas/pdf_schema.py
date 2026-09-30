from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PDFResponse(BaseModel):
    id: int
    title: str
    filename: str
    file_size: Optional[int] = None
    page_count: int = 1
    teacher_id: int
    created_at: datetime
    has_text: Optional[bool] = True

    class Config:
        from_attributes = True
