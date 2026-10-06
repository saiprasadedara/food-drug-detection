from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models import AnalysisHistory
from app.schemas.history import HistoryOut, HistoryCreate
from app.api.auth import get_current_user, User
from typing import Optional

router = APIRouter(prefix="/history", tags=["Analysis History"])

@router.get("", response_model=List[HistoryOut])
def get_history(limit: int = 50, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user)):
    """Retrieves previous interaction analyses."""
    query = db.query(AnalysisHistory)
    if current_user:
        # If user logged in, filter by user or show general history
        user_records = query.filter(AnalysisHistory.user_id == current_user.id).order_by(AnalysisHistory.created_at.desc()).limit(limit).all()
        if user_records:
            return user_records
    
    # Return latest analyses
    return query.order_by(AnalysisHistory.created_at.desc()).limit(limit).all()

@router.post("", response_model=HistoryOut)
def save_history(entry: HistoryCreate, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user)):
    """Saves an analysis record to history."""
    rec = AnalysisHistory(
        user_id=current_user.id if current_user else None,
        drug_name=entry.drug_name,
        food_name=entry.food_name,
        dose_level=entry.dose_level or "standard",
        severity=entry.severity,
        predicted_class=entry.predicted_class,
        confidence=entry.confidence,
        result_json=entry.result_json
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec

@router.get("/{history_id}", response_model=HistoryOut)
def get_history_detail(history_id: int, db: Session = Depends(get_db)):
    """Retrieves single analysis history item by ID."""
    rec = db.query(AnalysisHistory).filter(AnalysisHistory.id == history_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Analysis record not found.")
    return rec

@router.delete("/{history_id}")
def delete_history_item(history_id: int, db: Session = Depends(get_db)):
    """Deletes an analysis history item."""
    rec = db.query(AnalysisHistory).filter(AnalysisHistory.id == history_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Analysis record not found.")
    db.delete(rec)
    db.commit()
    return {"status": "deleted", "id": history_id}
