from pydantic import BaseModel
from typing import Optional, List

class DrugBase(BaseModel):
    name: str
    generic_name: Optional[str] = None
    drug_class: Optional[str] = None
    drugbank_id: Optional[str] = None
    pubchem_cid: Optional[int] = None
    smiles: str
    targets: List[str] = []
    relevant_enzymes: List[str] = []
    description: Optional[str] = None

class DrugOut(DrugBase):
    id: int

    class Config:
        from_attributes = True

class DrugSearchItem(BaseModel):
    name: str
    generic_name: Optional[str] = None
    drug_class: Optional[str] = None
    identifier: Optional[str] = None
    targets: List[str] = []
    relevant_enzymes: List[str] = []
