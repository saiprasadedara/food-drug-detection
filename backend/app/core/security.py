import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
import hashlib
from app.core.config import settings

def get_password_hash(password: str) -> str:
    """Hashes a password with salt using SHA-256 for cross-environment reliability."""
    salt = settings.SECRET_KEY[:16]
    return hashlib.sha256(f"{password}:{salt}".encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored hash."""
    return get_password_hash(plain_password) == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Encodes JWT access token with expiration timestamp."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None
