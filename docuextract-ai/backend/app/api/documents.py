import io
import os
import uuid
import logging
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status
)
from fastapi.responses import PlainTextResponse, JSONResponse, StreamingResponse

from app.api.deps import get_current_user
from app.models.document import (
    DocumentListItem,
    DocumentListResponse,
    DocumentRecord,
    DocumentResponse,
    DocumentStatus,
    DocumentType
)
from app.services.classifier_service import classify_document
from app.services.document_ai_service import document_ai_service
from app.services.firebase_service import firebase_service
from app.utils.file_validator import validate_file

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and process a document with Document AI OCR"
)
async def upload_document(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Complete document processing pipeline:
    1. Authenticate user from Firebase token (derive userId)
    2. Validate file type and size
    3. Store original file in Firebase Cloud Storage (users/{userId}/documents/{documentId}/original/{filename})
    4. Process document via Google Cloud Document AI OCR pipeline
    5. Perform document classification
    6. Persist complete extracted text and metadata in Firestore
    7. Return full document result to frontend
    """
    user_id = current_user["uid"]
    filename = file.filename or "uploaded_document"

    # Step 1: Validate file format, magic bytes, and size limit
    mime_type, file_size = await validate_file(file)

    # Read raw document bytes
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file content is empty."
        )

    # Step 2: Generate unique document ID
    document_id = str(uuid.uuid4())
    now_iso = datetime.utcnow().isoformat() + "Z"

    # Step 3: Upload original file to Firebase Cloud Storage under user path
    try:
        storage_path = firebase_service.upload_file(
            user_id=user_id,
            document_id=document_id,
            filename=filename,
            file_bytes=file_bytes,
            content_type=mime_type
        )
    except Exception as e:
        logger.error(f"Failed to upload document to storage: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Storage service failure: {str(e)}"
        )

    # Step 4: Process document with Google Cloud Document AI / Enterprise OCR
    try:
        extraction_result = document_ai_service.extract_text(
            file_bytes=file_bytes,
            mime_type=mime_type,
            filename=filename
        )
        extracted_text = extraction_result.get("extracted_text", "")
        page_count = extraction_result.get("page_count", 1)
        tables = extraction_result.get("tables", [])
        key_values = extraction_result.get("key_values", [])
        proc_status = DocumentStatus.COMPLETED
        error_msg = None
    except Exception as e:
        logger.error(f"Document processing failed: {e}")
        extracted_text = "Processing encountered an error: " + str(e)
        page_count = 1
        tables = []
        key_values = []
        proc_status = DocumentStatus.FAILED
        error_msg = str(e)

    # Step 5: Document Type Classification (Non-restrictive fallback to 'Other')
    detected_type = classify_document(text=extracted_text, filename=filename)

    # Step 6: Store Document Record in Firestore under users/{userId}/documents/{documentId}
    processed_at_iso = datetime.utcnow().isoformat() + "Z"
    doc_record = DocumentRecord(
        documentId=document_id,
        userId=user_id,
        fileName=filename,
        fileType=mime_type,
        fileSize=file_size,
        storagePath=storage_path,
        documentType=detected_type,
        extractedText=extracted_text,
        pageCount=page_count,
        tables=tables,
        keyValues=key_values,
        status=proc_status,
        errorMessage=error_msg,
        createdAt=now_iso,
        processedAt=processed_at_iso
    )

    try:
        firebase_service.save_document(user_id=user_id, doc_data=doc_record.model_dump())
    except Exception as e:
        logger.error(f"Failed to save document metadata in Firestore: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database service failure: {str(e)}"
        )

    # Generate secure preview URL
    file_url = firebase_service.get_file_url(storage_path)

    return DocumentResponse(
        **doc_record.model_dump(),
        fileUrl=file_url
    )


@router.get(
    "",
    response_model=DocumentListResponse,
    summary="List and search authenticated user's documents"
)
async def list_documents(
    q: Optional[str] = Query(None, description="Search query across filename, type, and extracted text"),
    document_type: Optional[str] = Query(None, alias="type", description="Filter by document type"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Returns the document history belonging strictly to the authenticated user.
    Supports full search across file name, document type, and extracted text content.
    """
    user_id = current_user["uid"]
    offset = (page - 1) * limit

    raw_docs, total_count = firebase_service.list_documents(
        user_id=user_id,
        search_query=q,
        doc_type=document_type,
        limit=limit,
        offset=offset
    )

    items = []
    for d in raw_docs:
        extracted = d.get("extractedText", "")
        snippet = extracted[:150] + ("..." if len(extracted) > 150 else "") if extracted else None
        items.append(
            DocumentListItem(
                documentId=d["documentId"],
                fileName=d.get("fileName", "untitled"),
                fileType=d.get("fileType", "unknown"),
                fileSize=d.get("fileSize", 0),
                documentType=d.get("documentType", DocumentType.OTHER.value),
                pageCount=d.get("pageCount", 1),
                status=d.get("status", DocumentStatus.COMPLETED),
                createdAt=d.get("createdAt", ""),
                processedAt=d.get("processedAt"),
                snippet=snippet
            )
        )

    return DocumentListResponse(
        documents=items,
        total=total_count,
        page=page,
        limit=limit
    )


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Get full document extraction details"
)
async def get_document(
    document_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Retrieves a single document belonging to the authenticated user.
    Returns 404 if document does not exist or belongs to another user.
    """
    user_id = current_user["uid"]
    doc_data = firebase_service.get_document(user_id=user_id, document_id=document_id)

    if not doc_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied."
        )

    file_url = firebase_service.get_file_url(doc_data.get("storagePath", ""))

    return DocumentResponse(
        **doc_data,
        fileUrl=file_url
    )


@router.post(
    "/{document_id}/reprocess",
    response_model=DocumentResponse,
    summary="Reprocess an existing document"
)
async def reprocess_document(
    document_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Rerun OCR extraction pipeline on an already uploaded document.
    """
    user_id = current_user["uid"]
    doc_data = firebase_service.get_document(user_id=user_id, document_id=document_id)

    if not doc_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied."
        )

    storage_path = doc_data["storagePath"]
    file_bytes = firebase_service.get_file_bytes(storage_path)
    mime_type = doc_data["fileType"]
    filename = doc_data["fileName"]

    extraction_result = document_ai_service.extract_text(
        file_bytes=file_bytes,
        mime_type=mime_type,
        filename=filename
    )
    extracted_text = extraction_result.get("extracted_text", "")
    page_count = extraction_result.get("page_count", 1)
    tables = extraction_result.get("tables", [])
    key_values = extraction_result.get("key_values", [])

    detected_type = classify_document(text=extracted_text, filename=filename)
    processed_at = datetime.utcnow().isoformat() + "Z"

    updates = {
        "extractedText": extracted_text,
        "pageCount": page_count,
        "tables": tables,
        "keyValues": key_values,
        "documentType": detected_type,
        "status": DocumentStatus.COMPLETED.value,
        "processedAt": processed_at,
        "errorMessage": None
    }

    firebase_service.update_document(user_id=user_id, document_id=document_id, updates=updates)
    doc_data.update(updates)
    file_url = firebase_service.get_file_url(storage_path)

    return DocumentResponse(**doc_data, fileUrl=file_url)


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a document and its stored files permanently"
)
async def delete_document(
    document_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Permanently deletes:
    1. Original uploaded file from Cloud Storage
    2. Extracted text and metadata from Firestore
    """
    user_id = current_user["uid"]
    doc_data = firebase_service.get_document(user_id=user_id, document_id=document_id)

    if not doc_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied."
        )

    # 1. Delete original file from Cloud Storage
    storage_path = doc_data.get("storagePath")
    if storage_path:
        firebase_service.delete_file(storage_path)

    # 2. Delete Firestore record
    firebase_service.delete_document(user_id=user_id, document_id=document_id)

    return {
        "success": True,
        "message": f"Document '{doc_data.get('fileName')}' deleted successfully.",
        "documentId": document_id
    }


@router.get(
    "/{document_id}/download",
    summary="Download extracted text as TXT or JSON"
)
async def download_extracted_text(
    document_id: str,
    format: str = Query("txt", regex="^(txt|json)$", description="Format: txt or json"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Exports the complete extracted text in .txt or .json format.
    """
    user_id = current_user["uid"]
    doc_data = firebase_service.get_document(user_id=user_id, document_id=document_id)

    if not doc_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied."
        )

    base_name = os.path.splitext(doc_data.get("fileName", "extracted_document"))[0]

    if format == "json":
        export_payload = {
            "documentId": doc_data["documentId"],
            "fileName": doc_data.get("fileName"),
            "documentType": doc_data.get("documentType"),
            "pageCount": doc_data.get("pageCount"),
            "processedAt": doc_data.get("processedAt"),
            "extractedText": doc_data.get("extractedText", ""),
            "keyValues": doc_data.get("keyValues", []),
            "tables": doc_data.get("tables", [])
        }
        return JSONResponse(
            content=export_payload,
            headers={"Content-Disposition": f'attachment; filename="{base_name}_extracted.json"'}
        )
    else:
        text_content = doc_data.get("extractedText", "")
        return PlainTextResponse(
            content=text_content,
            media_type="text/plain; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{base_name}_extracted.txt"'}
        )


@router.get(
    "/raw/{storage_path:path}",
    summary="Stream raw document file for authenticated preview"
)
async def get_raw_file(
    storage_path: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Streams the raw uploaded file directly for preview in frontend.
    Verifies that the requested storage path begins with users/{userId}/ to enforce privacy.
    """
    user_id = current_user["uid"]
    expected_prefix = f"users/{user_id}/"

    if not storage_path.startswith(expected_prefix):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you do not have permission to view this document."
        )

    try:
        file_bytes = firebase_service.get_file_bytes(storage_path)
    except FileNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found.")

    # Determine media type from extension
    _, ext = os.path.splitext(storage_path.lower())
    media_types = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".tif": "image/tiff",
        ".tiff": "image/tiff"
    }
    media_type = media_types.get(ext, "application/octet-stream")

    return StreamingResponse(io.BytesIO(file_bytes), media_type=media_type)
