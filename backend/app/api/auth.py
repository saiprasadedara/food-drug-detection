from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import User
from app.schemas.user import UserCreate, UserLogin, UserOut, Token
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from fastapi.security import OAuth2PasswordBearer
from typing import Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    """Dependency that returns the authenticated user or None."""
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None
    user = db.query(User).filter(User.email == payload["sub"]).first()
    return user

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Registers a new research scientist or clinical user."""
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name or user_in.email.split("@")[0].title(),
        role="researcher"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.email, "role": user.role, "id": user.id})
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticates credentials and returns a secure JWT bearer token."""
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid scientific credentials.")
        
    token = create_access_token({"sub": user.email, "role": user.role, "id": user.id})
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))

@router.get("/me", response_model=UserOut)
def get_profile(current_user: Optional[User] = Depends(get_current_user)):
    """Returns profile for currently authenticated researcher."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return UserOut.model_validate(current_user)
