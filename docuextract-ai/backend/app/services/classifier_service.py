import re
from typing import List, Tuple
from app.models.document import DocumentType


# Weighted keywords for heuristic classification
CLASSIFICATION_RULES: List[Tuple[DocumentType, List[str], int]] = [
    (
        DocumentType.RESUME,
        ["curriculum vitae", "resume", "education", "experience", "skills", "projects", "work history", "summary", "languages", "certifications"],
        3
    ),
    (
        DocumentType.INVOICE,
        ["invoice", "bill to", "ship to", "due date", "subtotal", "tax", "amount due", "balance due", "unit price", "invoice number"],
        3
    ),
    (
        DocumentType.RECEIPT,
        ["receipt", "cashier", "subtotal", "change due", "payment method", "store #", "merchant", "terminal"],
        2
    ),
    (
        DocumentType.ID_CARD,
        ["aadhaar", "identification", "identity card", "national id", "driver license", "driving licence", "passport", "dob", "date of birth", "gender", "father's name", "unique identification"],
        2
    ),
    (
        DocumentType.EDUCATION_CERTIFICATE,
        ["certificate", "secondary school", "ssc", "board of intermediate", "hall ticket", "grade point", "marks memo", "marks sheet", "degree", "diploma", "university", "academic record", "provisional certificate"],
        2
    ),
    (
        DocumentType.BANK_DOCUMENT,
        ["bank", "account number", "ifsc", "statement", "branch", "transaction", "debit", "credit", "ledger balance", "cheque", "swift code"],
        3
    ),
    (
        DocumentType.MEDICAL_DOCUMENT,
        ["patient", "doctor", "prescription", "diagnosis", "hospital", "clinic", "symptoms", "medication", "dosage", "laboratory report", "dr."],
        3
    ),
    (
        DocumentType.LEGAL_DOCUMENT,
        ["agreement", "affidavit", "witnesseth", "notary", "jurisdiction", "court", "petitioner", "respondent", "whereas", "terms and conditions"],
        3
    ),
    (
        DocumentType.FORM,
        ["application form", "fill in", "signature", "declaration", "tick appropriate", "postal address", "applicant"],
        2
    ),
    (
        DocumentType.BOOK_NOTES,
        ["chapter", "index", "contents", "preface", "page", "author", "edition", "volume", "notes", "lecture"],
        2
    ),
]


def classify_document(text: str, filename: str = "") -> str:
    """
    Detects the general document type based on text content and filename.
    Never fails or throws; defaults safely to 'Other'.
    Does not restrict or modify raw extraction.
    """
    if not text:
        return DocumentType.OTHER.value

    combined_text = f"{filename.lower()} {text.lower()}"

    best_match = DocumentType.OTHER
    highest_score = 0

    for doc_type, keywords, min_score in CLASSIFICATION_RULES:
        score = 0
        for kw in keywords:
            # Check for keyword occurrence
            if " " in kw:
                if kw in combined_text:
                    score += 2
            else:
                matches = len(re.findall(r"\b" + re.escape(kw) + r"\b", combined_text))
                score += min(matches, 3)

        if score >= min_score and score > highest_score:
            highest_score = score
            best_match = doc_type

    return best_match.value
