from pydantic import BaseModel, field_validator
from typing import Optional
import datetime
import re

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

    @field_validator("email")
    def validate_email(cls, v: str) -> str:
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("Invalid email format")
        return v.lower().strip()

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    role: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenData(BaseModel):
    email: Optional[str] = None
