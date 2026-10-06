import io
import logging
import re
from typing import Any, Dict, List, Optional, Tuple

from app.config import settings

logger = logging.getLogger(__name__)


class DocumentAIService:
    """
    Manages OCR and document text extraction via Google Cloud Document AI.
    Includes a resilient fallback engine (pypdf/pdfplumber) for PDFs and images.
    """

    def __init__(self):
        self._client = None
        self._processor_name = None
        self.init_document_ai()

    def init_document_ai(self):
        """Initializes the Document AI client if project and processor IDs are configured."""
        try:
            from google.cloud import documentai_v1 as documentai

            if (
                settings.GOOGLE_CLOUD_PROJECT
                and settings.DOCUMENT_AI_PROCESSOR_ID
                and settings.DOCUMENT_AI_PROCESSOR_ID != "your-document-ai-processor-id"
            ):
                location = settings.DOCUMENT_AI_LOCATION or "us"
                client_options = {"api_endpoint": f"{location}-documentai.googleapis.com"}
                self._client = documentai.DocumentProcessorServiceClient(client_options=client_options)
                self._processor_name = self._client.processor_path(
                    settings.GOOGLE_CLOUD_PROJECT,
                    location,
                    settings.DOCUMENT_AI_PROCESSOR_ID,
                )
                logger.info(f"Google Cloud Document AI client initialized: {self._processor_name}")
            else:
                logger.info("Google Cloud Document AI not configured. Local fallback engine active.")
        except Exception as e:
            logger.warning(f"Could not initialize Google Cloud Document AI client: {e}")
            self._client = None

    def is_available(self) -> bool:
        return self._client is not None and self._processor_name is not None

    def extract_text(
        self,
        file_bytes: bytes,
        mime_type: str,
        filename: str = ""
    ) -> Dict[str, Any]:
        """
        Executes document text extraction.
        Tries Google Cloud Document AI first; falls back to local engine if unconfigured or on error.
        Returns:
            {
                "extracted_text": str,
                "page_count": int,
                "tables": List[Dict],
                "key_values": List[Dict],
                "engine_used": str
            }
        """
        if self.is_available():
            try:
                return self._extract_with_document_ai(file_bytes, mime_type)
            except Exception as e:
                logger.error(f"Google Cloud Document AI call failed: {e}. Falling back to local engine.")
                return self._extract_with_fallback(file_bytes, mime_type, filename, cloud_error=str(e))
        else:
            return self._extract_with_fallback(file_bytes, mime_type, filename)

    # -------------------------------------------------------------
    # 1. Google Cloud Document AI Extraction
    # -------------------------------------------------------------
    def _extract_with_document_ai(self, file_bytes: bytes, mime_type: str) -> Dict[str, Any]:
        from google.cloud import documentai_v1 as documentai

        # Prepare raw document payload
        raw_document = documentai.RawDocument(content=file_bytes, mime_type=mime_type)
        request = documentai.ProcessRequest(name=self._processor_name, raw_document=raw_document)

        logger.info(f"Sending document to Document AI processor: {self._processor_name}")
        result = self._client.process_document(request=request)
        document = result.document

        full_text = document.text or ""
        page_count = len(document.pages) if document.pages else 1

        tables: List[Dict[str, Any]] = []
        key_values: List[Dict[str, Any]] = []

        # Helper to extract text from text_anchor
        def get_text_from_anchor(text_anchor) -> str:
            if not text_anchor or not text_anchor.text_segments:
                return ""
            response = ""
            for segment in text_anchor.text_segments:
                start_index = int(segment.start_index) if segment.start_index else 0
                end_index = int(segment.end_index) if segment.end_index else len(full_text)
                response += full_text[start_index:end_index]
            return response.strip()

        # Parse tables and form fields from pages
        for page_idx, page in enumerate(document.pages, start=1):
            # Extract detected tables
            for table in page.tables:
                header_rows: List[List[str]] = []
                for row in table.header_rows:
                    row_cells = [get_text_from_anchor(cell.layout.text_anchor) for cell in row.cells]
                    header_rows.append(row_cells)

                body_rows: List[List[str]] = []
                for row in table.body_rows:
                    row_cells = [get_text_from_anchor(cell.layout.text_anchor) for cell in row.cells]
                    body_rows.append(row_cells)

                tables.append({
                    "page_number": page_idx,
                    "header_rows": header_rows,
                    "body_rows": body_rows
                })

            # Extract detected form fields (Key-Value pairs)
            for form_field in page.form_fields:
                field_name = get_text_from_anchor(form_field.field_name.text_anchor)
                field_value = get_text_from_anchor(form_field.field_value.text_anchor)
                if field_name:
                    key_values.append({
                        "key": field_name,
                        "value": field_value,
                        "confidence": float(round(form_field.field_name.confidence or 1.0, 2))
                    })

        return {
            "extracted_text": full_text.strip(),
            "page_count": page_count,
            "tables": tables,
            "key_values": key_values,
            "engine_used": "Google Cloud Document AI"
        }

    # -------------------------------------------------------------
    # 2. Local Fallback Extraction (pypdf, pdfplumber, pytesseract/PIL)
    # -------------------------------------------------------------
    def _extract_with_fallback(
        self,
        file_bytes: bytes,
        mime_type: str,
        filename: str = "",
        cloud_error: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Preserves complete readable text using Python PDF/Image extraction libraries.
        Extracts exact text without hallucinating.
        """
        logger.info(f"Extracting with fallback engine for {filename} ({mime_type})")
        extracted_text = ""
        page_count = 1
        tables: List[Dict[str, Any]] = []
        key_values: List[Dict[str, Any]] = []

        if mime_type == "application/pdf":
            # Attempt pdfplumber first for high quality text & tables
            try:
                import pdfplumber
                with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                    page_count = len(pdf.pages)
                    page_texts = []
                    for page_idx, page in enumerate(pdf.pages, start=1):
                        p_text = page.extract_text(layout=True) or page.extract_text() or ""
                        if p_text.strip():
                            page_texts.append(f"--- Page {page_idx} ---\n{p_text}")

                        # Extract tables if present
                        extracted_tables = page.extract_tables()
                        for t in extracted_tables:
                            if t and len(t) > 1:
                                headers = [str(c or "").strip() for c in t[0]]
                                body = [[str(c or "").strip() for c in row] for row in t[1:]]
                                tables.append({
                                    "page_number": page_idx,
                                    "header_rows": [headers],
                                    "body_rows": body
                                })

                    extracted_text = "\n\n".join(page_texts)
            except Exception as e:
                logger.warning(f"pdfplumber extraction failed: {e}. Trying pypdf...")
                try:
                    from pypdf import PdfReader
                    reader = PdfReader(io.BytesIO(file_bytes))
                    page_count = len(reader.pages)
                    page_texts = []
                    for idx, page in enumerate(reader.pages, start=1):
                        t = page.extract_text() or ""
                        if t.strip():
                            page_texts.append(f"--- Page {idx} ---\n{t}")
                    extracted_text = "\n\n".join(page_texts)
                except Exception as pypdf_err:
                    logger.error(f"pypdf extraction error: {pypdf_err}")

        elif mime_type.startswith("image/"):
            # Try pytesseract if available in environment
            try:
                import pytesseract
                from PIL import Image
                image = Image.open(io.BytesIO(file_bytes))
                extracted_text = pytesseract.image_to_string(image)
            except Exception as tess_err:
                logger.info(f"Pytesseract not available or failed: {tess_err}")
                # If image contains no OCR library, state clearly that OCR processor is required
                if not extracted_text.strip():
                    extracted_text = (
                        "No readable text was detected in this document.\n"
                        "Please configure Google Cloud Document AI credentials or upload a clearer text document."
                    )

        # Post-process: extract common key-value pairs (e.g. "Key: Value") if detected
        if extracted_text and not key_values:
            key_values = self._parse_key_values_from_text(extracted_text)

        if not extracted_text.strip():
            extracted_text = "No readable text was detected in this document. Please upload a clearer image or document."

        engine_name = "Local Document Engine"
        if cloud_error:
            engine_name += f" (GCP Document AI Fallback: {cloud_error[:60]}...)"

        return {
            "extracted_text": extracted_text.strip(),
            "page_count": max(page_count, 1),
            "tables": tables,
            "key_values": key_values,
            "engine_used": engine_name
        }

    def _parse_key_values_from_text(self, text: str) -> List[Dict[str, Any]]:
        """Parses lines formatted like 'Label: Value' without modifying the source text."""
        pairs = []
        for line in text.split("\n"):
            line = line.strip()
            if ":" in line and not line.startswith("http"):
                parts = line.split(":", 1)
                k = parts[0].strip()
                v = parts[1].strip()
                if 2 <= len(k) <= 40 and len(v) > 0:
                    pairs.append({"key": k, "value": v, "confidence": 0.95})
        return pairs[:30]


document_ai_service = DocumentAIService()
