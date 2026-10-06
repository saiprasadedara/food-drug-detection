from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class SubstrateItem(BaseModel):
    name: str
    class_name: Optional[str] = None
    metabolism_fraction: Optional[str] = None
    therapeutic_use: Optional[str] = None

class InhibitorItem(BaseModel):
    compound: str
    food_source: str
    potency: str  # Strong, Moderate, Weak
    mechanism: Optional[str] = None

class InducerItem(BaseModel):
    compound: str
    source: str
    potency: str
    mechanism: Optional[str] = None

class PolymorphismInfo(BaseModel):
    phenotype: str
    allele_examples: str
    frequency_notes: str
    clinical_impact: str

class EnzymeSummary(BaseModel):
    symbol: str
    name: str
    clearance_percentage: int
    gene: str
    primary_tissue: str
    pdb_id: str
    description: str
    substrate_count: int
    inhibitor_count: int
    inducer_count: int
    primary_drugs: List[str]
    primary_foods: List[str]

class EnzymeDetail(BaseModel):
    symbol: str
    name: str
    category: str
    clearance_percentage: int
    gene: str
    primary_tissue: str
    pdb_id: str
    description: str
    clinical_significance: str
    substrates: List[SubstrateItem]
    inhibitors: List[InhibitorItem]
    inducers: List[InducerItem]
    polymorphisms: List[PolymorphismInfo]
    clinical_guidance: List[str]

class ClashSimulationRequest(BaseModel):
    drug_name: str
    food_name: str

class ClashSimulationResponse(BaseModel):
    drug: str
    food: str
    overall_clash: bool
    highest_severity: str  # High, Medium, Low, None
    affected_enzymes: List[str]
    pathway_details: Dict[str, Any]
    clinical_summary: str
    recommendations: List[str]
