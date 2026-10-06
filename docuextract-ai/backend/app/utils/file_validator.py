import os
from typing import Tuple
from fastapi import HTTPException, UploadFile, status
from app.config import settings

# Supported document and image MIME types
SUPPORTED_MIME_TYPES = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/tiff": ".tiff",
}

# Supported file extensions
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}

# Magic bytes (file signatures) for robust validation
MAGIC_BYTES = {
    b"%PDF-": "application/pdf",
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"RIFF": "image/webp",  # Starts with RIFF....WEBP
    b"II*\x00": "image/tiff",  # Little-endian TIFF
    b"MM\x00*": "image/tiff",  # Big-endian TIFF
}


def detect_mime_from_bytes(header: bytes) -> str:
    """Check magic bytes from the first 16 bytes of the file."""
    for magic, mime in MAGIC_BYTES.items():
        if header.startswith(magic):
            if magic == b"RIFF":
                # WebP has 'WEBP' at bytes 8-12
                if len(header) >= 12 and header[8:12] == b"WEBP":
                    return "image/webp"
                continue
            return mime
    return ""


async def validate_file(file: UploadFile) -> Tuple[str, int]:
    """
    Validates uploaded file size, extension, and content type.
    Returns (normalized_mime_type, file_size_in_bytes).
    Raises HTTPException if invalid.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename."
        )

    # 1. Check extension
    _, ext = os.path.splitext(file.filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported file extension '{ext}'. Allowed extensions are: "
                f"{', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )
        )

    # 2. Read first chunk for magic bytes inspection & determine size
    header = await file.read(64)
    if not header:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty (0 bytes)."
        )

    detected_mime = detect_mime_from_bytes(header)

    # Fall back to declared content_type if standard extension matches
    declared_mime = (file.content_type or "").lower()
    if declared_mime == "image/jpg":
        declared_mime = "image/jpeg"

    effective_mime = detected_mime or declared_mime
    if not effective_mime or (
        effective_mime not in SUPPORTED_MIME_TYPES
        and not (effective_mime == "image/jpeg" and ext in [".jpg", ".jpeg"])
    ):
        # Allow if extension is known and declared mime is valid
        if ext in [".jpg", ".jpeg"]:
            effective_mime = "image/jpeg"
        elif ext == ".pdf":
            effective_mime = "application/pdf"
        elif ext == ".png":
            effective_mime = "image/png"
        elif ext == ".webp":
            effective_mime = "image/webp"
        elif ext in [".tif", ".tiff"]:
            effective_mime = "image/tiff"
        else:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported file format: {declared_mime or 'unknown'}. Supported types: PDF, JPG, PNG, WEBP, TIFF."
            )

    # 3. Read remaining bytes to calculate full size and enforce limit
    remaining = await file.read()
    total_size = len(header) + len(remaining)

    if total_size > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed limit of {settings.MAX_FILE_SIZE_MB}MB."
        )

    # Reset file cursor for downstream processing
    await file.seek(0)

    return effective_mime, total_size
