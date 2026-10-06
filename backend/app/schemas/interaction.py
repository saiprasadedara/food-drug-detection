from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class AnalyzeRequest(BaseModel):
    drug_name: Optional[str] = None
    food_name: Optional[str] = None
    drug: Optional[str] = None
    food: Optional[str] = None
    dose_level: Optional[str] = "standard"  # trace, standard, concentrated

    @property
    def resolved_drug(self) -> str:
        return self.drug_name or self.drug or ""

    @property
    def resolved_food(self) -> str:
        return self.food_name or self.food or ""

class MolecularProperties(BaseModel):
    mw: float
    logp: float
    hbd: int
    hba: int
    tpsa: float
    rotatable_bonds: Optional[int] = 0
    heavy_atom_count: Optional[int] = 0
    formal_charge: Optional[int] = 0
    smiles: Optional[str] = None
    formula: Optional[str] = None          # Molecular formula e.g. C27H32O14
    inchikey: Optional[str] = None
    inchi: Optional[str] = None            # Full InChI string
    pubchem_cid: Optional[str] = None
    chemical_class: Optional[str] = None

class CYPEnzymeInfo(BaseModel):
    drug_substrate: bool
    food_inhibitor: bool
    food_inducer: bool = False
    clash: bool
    relevance: str = "Medium" # High, Medium, Low
    relevant_class: Optional[str] = "Medium"
    clinical_mechanism: Optional[str] = None

class ShapAttribution(BaseModel):
    feature: str
    impact: float
    positive: bool
    baseline_value: Optional[float] = 0.0
    description: Optional[str] = None

class AlternativeCompound(BaseModel):
    name: str
    risk: str
    score: str
    mechanism: Optional[str] = None
    evidence_level: Optional[str] = "Moderate In Vitro"

class ClassProbabilities(BaseModel):
    major_adverse: float
    moderate: float
    minor: float
    no_interaction: float

class InteractionDetails(BaseModel):
    detected: bool
    severity: str # none, minor, moderate, major
    confidence: float
    predicted_class: str # CLASS 0, CLASS 1, CLASS 2, CLASS 3
    outcome: str
    evidence_level: str
    clinical_relevance: str

class MechanismDetails(BaseModel):
    enzymes: List[str]
    pathways: List[str]
    description: str

class AnalysisResponse(BaseModel):
    # Top-level direct fields for frontend UI
    drug: str
    food: str
    drug_smiles: str
    food_smiles: str
    drug_sdf: str
    food_sdf: str
    predicted_outcome: str
    predicted_class: str
    severity_index: float
    class_probabilities: ClassProbabilities
    cyp_pathways: Dict[str, CYPEnzymeInfo]
    cyp_features: Optional[List[Dict[str, Any]]] = None
    affected_enzymes: Optional[List[str]] = None
    cyp_clash_detected: Optional[bool] = None
    has_interaction: Optional[bool] = None
    risk_score: Optional[float] = None
    description: Optional[str] = None
    telemetry: Dict[str, MolecularProperties]
    shap_attributions: List[ShapAttribution]
    alternatives: List[AlternativeCompound]
    
    # Model specification schema (for Section 20 Model API)
    interaction: InteractionDetails
    mechanism: MechanismDetails
    features: Dict[str, Any]
    explainability: Dict[str, Any]
    evidence: List[Dict[str, Any]]
    recommendations: List[str]
    
    # Model metadata
    model_info: Dict[str, str]
