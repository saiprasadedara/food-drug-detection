from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DocumentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class DocumentType(str, Enum):
    ID_CARD = "ID Card"
    EDUCATION_CERTIFICATE = "Education Certificate"
    RESUME = "Resume"
    INVOICE = "Invoice"
    RECEIPT = "Receipt"
    BANK_DOCUMENT = "Bank Document"
    MEDICAL_DOCUMENT = "Medical Document"
    LEGAL_DOCUMENT = "Legal Document"
    FORM = "Form"
    BOOK_NOTES = "Book/Notes"
    OTHER = "Other"


class KeyValuePair(BaseModel):
    key: str
    value: str
    confidence: Optional[float] = None


class ExtractedTable(BaseModel):
    page_number: int
    header_rows: List[List[str]] = Field(default_factory=list)
    body_rows: List[List[str]] = Field(default_factory=list)


class DocumentRecord(BaseModel):
    """Internal and Firestore data model for a processed document."""
    documentId: str
    userId: str
    fileName: str
    fileType: str
    fileSize: int
    storagePath: str
    documentType: str = DocumentType.OTHER.value
    extractedText: str = ""
    pageCount: int = 1
    tables: List[Dict[str, Any]] = Field(default_factory=list)
    keyValues: List[Dict[str, Any]] = Field(default_factory=list)
    status: DocumentStatus = DocumentStatus.PENDING
    errorMessage: Optional[str] = None
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    processedAt: Optional[str] = None


class DocumentResponse(BaseModel):
    """User-facing API response representation."""
    documentId: str
    userId: str
    fileName: str
    fileType: str
    fileSize: int
    storagePath: str
    fileUrl: Optional[str] = None
    documentType: str
    extractedText: str
    pageCount: int
    tables: List[Dict[str, Any]] = Field(default_factory=list)
    keyValues: List[Dict[str, Any]] = Field(default_factory=list)
    status: DocumentStatus
    errorMessage: Optional[str] = None
    createdAt: str
    processedAt: Optional[str] = None


class DocumentListItem(BaseModel):
    """Summary representation for document history table."""
    documentId: str
    fileName: str
    fileType: str
    fileSize: int
    documentType: str
    pageCount: int
    status: DocumentStatus
    createdAt: str
    processedAt: Optional[str] = None
    snippet: Optional[str] = None


class DocumentListResponse(BaseModel):
    documents: List[DocumentListItem]
    total: int
    page: int
    limit: int


class DocumentReprocessRequest(BaseModel):
    force_ocr: bool = True
