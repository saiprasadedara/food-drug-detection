from pydantic import BaseModel
from typing import Optional, Dict, Any
import datetime

class HistoryCreate(BaseModel):
    drug_name: str
    food_name: str
    dose_level: Optional[str] = "standard"
    severity: str
    predicted_class: str
    confidence: float
    result_json: Dict[str, Any]

class HistoryOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    drug_name: str
    food_name: str
    dose_level: str
    severity: str
    predicted_class: str
    confidence: float
    result_json: Dict[str, Any]
    created_at: datetime.datetime

    class Config:
        from_attributes = True
