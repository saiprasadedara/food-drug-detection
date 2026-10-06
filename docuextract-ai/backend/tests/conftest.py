import sys
import os
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.services.firebase_service import firebase_service


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_dev_db():
    """Resets in-memory storage before each test."""
    if not firebase_service.is_configured:
        firebase_service._dev_db.clear()
        firebase_service._dev_files.clear()
    yield
