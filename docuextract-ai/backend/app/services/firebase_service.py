import os
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import firebase_admin
from firebase_admin import auth as fb_auth
from firebase_admin import credentials, firestore, storage
from google.cloud.firestore_v1.base_query import FieldFilter
from app.config import settings

logger = logging.getLogger(__name__)


class FirebaseService:
    """Manages Firebase Admin SDK: Authentication, Firestore, and Cloud Storage."""

    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseService, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._initialized:
            self.init_firebase()
            self._initialized = True

    def init_firebase(self):
        """Initializes Firebase Admin app with credentials."""
        if len(firebase_admin._apps) > 0:
            self.app = firebase_admin.get_app()
            self.is_configured = True
            return

        cred = None
        try:
            # 1. Try file path
            if settings.FIREBASE_CREDENTIALS_PATH and os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
                logger.info(f"Loading Firebase credentials from {settings.FIREBASE_CREDENTIALS_PATH}")
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            # 2. Try environment variables dictionary
            elif settings.FIREBASE_PROJECT_ID and settings.FIREBASE_CLIENT_EMAIL and settings.FIREBASE_PRIVATE_KEY:
                logger.info("Loading Firebase credentials from environment variables.")
                cert_dict = {
                    "type": "service_account",
                    "project_id": settings.FIREBASE_PROJECT_ID,
                    "private_key": settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n"),
                    "client_email": settings.FIREBASE_CLIENT_EMAIL,
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
                cred = credentials.Certificate(cert_dict)
            else:
                # 3. Try Application Default Credentials (ADC)
                logger.info("Attempting Firebase init via Application Default Credentials...")
                cred = credentials.ApplicationDefault()

            options = {}
            if settings.FIREBASE_STORAGE_BUCKET:
                options["storageBucket"] = settings.FIREBASE_STORAGE_BUCKET
            elif settings.FIREBASE_PROJECT_ID:
                options["storageBucket"] = f"{settings.FIREBASE_PROJECT_ID}.appspot.com"

            self.app = firebase_admin.initialize_app(cred, options)
            self.is_configured = True
            logger.info("Firebase Admin initialized successfully.")
        except Exception as e:
            logger.warning(
                f"Firebase Admin could not be initialized with cloud credentials ({e}). "
                "Backend will operate in development fallback mode."
            )
            self.app = None
            self.is_configured = False
            # In-memory storage for development / testing when Firebase is not yet linked
            self._dev_db: Dict[str, Dict[str, Dict[str, Any]]] = {}
            self._dev_files: Dict[str, bytes] = {}

    # -------------------------------------------------------------
    # Authentication Verification
    # -------------------------------------------------------------
    def verify_token(self, id_token: str) -> Dict[str, Any]:
        """
        Verifies a Firebase Auth ID token and returns decoded claims.
        Extracts verified user_id (UID).
        """
        if self.is_configured:
            try:
                decoded_token = fb_auth.verify_id_token(id_token, check_revoked=True)
                return decoded_token
            except Exception as e:
                logger.error(f"Firebase token verification failed: {e}")
                raise ValueError(f"Invalid or expired authentication token: {str(e)}")
        else:
            # Dev fallback token parsing (supports local test tokens like "test-user-token")
            if id_token.startswith("Bearer "):
                id_token = id_token[7:]
            if id_token.startswith("test-token-") or id_token == "test-token":
                uid = id_token.replace("test-token-", "") or "test_user_123"
                return {
                    "uid": uid,
                    "email": f"{uid}@example.com",
                    "name": "Test User"
                }
            # Also allow decoding simple base64/JWT mock for offline tests
            try:
                import base64
                parts = id_token.split(".")
                if len(parts) == 3:
                    padded = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
                    payload = json.loads(base64.urlsafe_b64decode(padded))
                    if "user_id" in payload or "sub" in payload:
                        uid = payload.get("user_id") or payload.get("sub")
                        return {"uid": uid, "email": payload.get("email", f"{uid}@example.com")}
            except Exception:
                pass
            raise ValueError("Firebase credentials not configured and token format invalid for development.")

    # -------------------------------------------------------------
    # Firestore Document Operations (users/{userId}/documents/{docId})
    # -------------------------------------------------------------
    def get_user_doc_ref(self, user_id: str, document_id: str):
        if not self.is_configured:
            return None
        db = firestore.client()
        return db.collection("users").document(user_id).collection("documents").document(document_id)

    def save_document(self, user_id: str, doc_data: Dict[str, Any]) -> None:
        document_id = doc_data["documentId"]
        if self.is_configured:
            db = firestore.client()
            doc_ref = db.collection("users").document(user_id).collection("documents").document(document_id)
            doc_ref.set(doc_data)
        else:
            if user_id not in self._dev_db:
                self._dev_db[user_id] = {}
            self._dev_db[user_id][document_id] = doc_data

    def get_document(self, user_id: str, document_id: str) -> Optional[Dict[str, Any]]:
        if self.is_configured:
            db = firestore.client()
            doc_ref = db.collection("users").document(user_id).collection("documents").document(document_id)
            snapshot = doc_ref.get()
            if snapshot.exists:
                return snapshot.to_dict()
            return None
        else:
            return self._dev_db.get(user_id, {}).get(document_id)

    def update_document(self, user_id: str, document_id: str, updates: Dict[str, Any]) -> None:
        if self.is_configured:
            db = firestore.client()
            doc_ref = db.collection("users").document(user_id).collection("documents").document(document_id)
            doc_ref.update(updates)
        else:
            if user_id in self._dev_db and document_id in self._dev_db[user_id]:
                self._dev_db[user_id][document_id].update(updates)

    def delete_document(self, user_id: str, document_id: str) -> bool:
        if self.is_configured:
            db = firestore.client()
            doc_ref = db.collection("users").document(user_id).collection("documents").document(document_id)
            doc_ref.delete()
            return True
        else:
            if user_id in self._dev_db and document_id in self._dev_db[user_id]:
                del self._dev_db[user_id][document_id]
                return True
            return False

    def list_documents(
        self,
        user_id: str,
        search_query: Optional[str] = None,
        doc_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Dict[str, Any]], int]:
        all_docs: List[Dict[str, Any]] = []

        if self.is_configured:
            db = firestore.client()
            docs_query = db.collection("users").document(user_id).collection("documents")
            
            # Fetch all documents for this user (user docs collection is partitioned per user)
            snapshots = docs_query.order_by("createdAt", direction=firestore.Query.DESCENDING).stream()
            for snap in snapshots:
                all_docs.append(snap.to_dict())
        else:
            user_docs = self._dev_db.get(user_id, {})
            all_docs = list(user_docs.values())
            all_docs.sort(key=lambda d: d.get("createdAt", ""), reverse=True)

        # In-memory search & filter (by filename, doc type, or extracted text)
        filtered = all_docs
        if doc_type and doc_type != "All":
            filtered = [d for d in filtered if d.get("documentType") == doc_type]

        if search_query:
            q = search_query.strip().lower()
            filtered = [
                d for d in filtered
                if (
                    q in (d.get("fileName") or "").lower()
                    or q in (d.get("documentType") or "").lower()
                    or q in (d.get("extractedText") or "").lower()
                )
            ]

        total_count = len(filtered)
        paginated = filtered[offset : offset + limit]
        return paginated, total_count

    # -------------------------------------------------------------
    # Firebase Cloud Storage Operations
    # -------------------------------------------------------------
    def upload_file(
        self,
        user_id: str,
        document_id: str,
        filename: str,
        file_bytes: bytes,
        content_type: str
    ) -> str:
        """
        Uploads document file to users/{userId}/documents/{documentId}/original/{filename}.
        Returns the storage path.
        """
        storage_path = f"users/{user_id}/documents/{document_id}/original/{filename}"

        if self.is_configured:
            bucket = storage.bucket()
            blob = bucket.blob(storage_path)
            blob.upload_from_string(file_bytes, content_type=content_type)
            return storage_path
        else:
            self._dev_files[storage_path] = file_bytes
            return storage_path

    def get_file_bytes(self, storage_path: str) -> bytes:
        if self.is_configured:
            bucket = storage.bucket()
            blob = bucket.blob(storage_path)
            if not blob.exists():
                raise FileNotFoundError(f"Storage path {storage_path} not found.")
            return blob.download_as_bytes()
        else:
            if storage_path not in self._dev_files:
                raise FileNotFoundError(f"Development storage path {storage_path} not found.")
            return self._dev_files[storage_path]

    def get_file_url(self, storage_path: str, expiration_minutes: int = 60) -> str:
        """Generates a secure temporary download URL."""
        if self.is_configured:
            try:
                bucket = storage.bucket()
                blob = bucket.blob(storage_path)
                # Generate signed URL
                return blob.generate_signed_url(
                    version="v4",
                    expiration=timedelta(minutes=expiration_minutes),
                    method="GET"
                )
            except Exception as e:
                logger.warning(f"Could not generate signed URL: {e}")
                return f"/api/documents/raw/{storage_path}"
        else:
            return f"/api/documents/raw/{storage_path}"

    def delete_file(self, storage_path: str) -> None:
        if self.is_configured:
            try:
                bucket = storage.bucket()
                blob = bucket.blob(storage_path)
                if blob.exists():
                    blob.delete()
            except Exception as e:
                logger.error(f"Failed to delete file from storage ({storage_path}): {e}")
        else:
            self._dev_files.pop(storage_path, None)


firebase_service = FirebaseService()
