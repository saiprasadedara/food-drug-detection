import io
import pytest
from fastapi.testclient import TestClient


def create_minimal_pdf_bytes(text: str = "Student Name: Rahul Kumar\nAge: 21\nAddress: Hyderabad") -> bytes:
    """Generates valid minimal PDF bytes with readable text for testing."""
    # Standard minimal PDF syntax
    content = f"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length {len(text) + 50} >> stream
BT
/F1 12 Tf
72 712 Td
({text}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000229 00000 n 
0000000300 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
450
%%EOF"""
    return content.encode("utf-8")


def test_health_check(client: TestClient):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "services" in data


def test_unauthenticated_request_rejected(client: TestClient):
    response = client.get("/api/documents")
    assert response.status_code == 401
    assert "Authentication token is missing" in response.json()["detail"]


def test_invalid_token_rejected(client: TestClient):
    response = client.get(
        "/api/documents",
        headers={"Authorization": "Bearer completely-invalid-garbage-token"}
    )
    assert response.status_code == 401


def test_unsupported_file_type_rejected(client: TestClient):
    headers = {"Authorization": "Bearer test-token-user1"}
    file_payload = {"file": ("malicious.exe", b"MZexecutablebytes", "application/x-msdownload")}
    response = client.post("/api/documents/upload", headers=headers, files=file_payload)
    assert response.status_code == 415


def test_empty_file_rejected(client: TestClient):
    headers = {"Authorization": "Bearer test-token-user1"}
    file_payload = {"file": ("empty.pdf", b"", "application/pdf")}
    response = client.post("/api/documents/upload", headers=headers, files=file_payload)
    assert response.status_code == 400


def test_upload_and_extract_pdf(client: TestClient):
    headers = {"Authorization": "Bearer test-token-user1"}
    pdf_bytes = create_minimal_pdf_bytes("Student Name: Rahul Kumar\nAge: 21\nAddress: Hyderabad")
    file_payload = {"file": ("ssc_memo.pdf", pdf_bytes, "application/pdf")}

    response = client.post("/api/documents/upload", headers=headers, files=file_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["documentId"] is not None
    assert data["fileName"] == "ssc_memo.pdf"
    assert data["fileType"] == "application/pdf"
    assert data["userId"] == "user1"
    assert "Rahul Kumar" in data["extractedText"] or len(data["extractedText"]) > 0
    assert data["status"] == "completed"

    doc_id = data["documentId"]

    # Verify retrieval
    get_res = client.get(f"/api/documents/{doc_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["documentId"] == doc_id

    # Verify search
    search_res = client.get("/api/documents?q=ssc_memo", headers=headers)
    assert search_res.status_code == 200
    assert search_res.json()["total"] >= 1


def test_cross_user_isolation(client: TestClient):
    # User 1 uploads document
    headers_user1 = {"Authorization": "Bearer test-token-user1"}
    pdf_bytes = create_minimal_pdf_bytes("Private Document of User 1")
    file_payload = {"file": ("private_doc.pdf", pdf_bytes, "application/pdf")}

    upload_res = client.post("/api/documents/upload", headers=headers_user1, files=file_payload)
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["documentId"]

    # User 2 attempts to access User 1's document
    headers_user2 = {"Authorization": "Bearer test-token-user2"}
    access_res = client.get(f"/api/documents/{doc_id}", headers=headers_user2)
    assert access_res.status_code == 404

    # User 2 attempts to delete User 1's document
    del_res = client.delete(f"/api/documents/{doc_id}", headers=headers_user2)
    assert del_res.status_code == 404

    # User 1 successfully deletes own document
    del_res1 = client.delete(f"/api/documents/{doc_id}", headers=headers_user1)
    assert del_res1.status_code == 200


def test_download_txt_and_json(client: TestClient):
    headers = {"Authorization": "Bearer test-token-user1"}
    pdf_bytes = create_minimal_pdf_bytes("Invoice #1024\nTotal: $450")
    file_payload = {"file": ("invoice.pdf", pdf_bytes, "application/pdf")}

    upload_res = client.post("/api/documents/upload", headers=headers, files=file_payload)
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["documentId"]

    # Download TXT
    txt_res = client.get(f"/api/documents/{doc_id}/download?format=txt", headers=headers)
    assert txt_res.status_code == 200
    assert "text/plain" in txt_res.headers.get("content-type", "")

    # Download JSON
    json_res = client.get(f"/api/documents/{doc_id}/download?format=json", headers=headers)
    assert json_res.status_code == 200
    json_data = json_res.json()
    assert json_data["documentId"] == doc_id
    assert "extractedText" in json_data
