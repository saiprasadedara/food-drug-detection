from pydantic import BaseModel
from typing import Optional, List

class FoodSearchItem(BaseModel):
    name: str
    compound: Optional[str] = None
    molecular_formula: Optional[str] = None
    molecular_weight: Optional[float] = None
    pubchem_cid: Optional[int] = None
    chemical_class: Optional[str] = None
    smiles: Optional[str] = None
    description: Optional[str] = None

class FoodOut(BaseModel):
    id: int
    name: str
    scientific_name: Optional[str] = None
    category: Optional[str] = None
    foodb_id: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True
