from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.enzyme import (
    EnzymeSummary,
    EnzymeDetail,
    ClashSimulationRequest,
    ClashSimulationResponse
)
from app.services.enzyme_service import enzyme_service, CYP_DETAILED_CATALOG

router = APIRouter(prefix="/enzymes", tags=["CYP450 Enzymes"])

@router.get("", response_model=List[EnzymeSummary])
def list_enzymes():
    """Returns overview catalog of all Cytochrome P450 enzymes in the platform."""
    return enzyme_service.get_all_enzymes()

@router.get("/{symbol}", response_model=EnzymeDetail)
def get_enzyme_profile(symbol: str):
    """Retrieves deep scientific profile, substrates, inhibitors, and pharmacogenomics for a specific CYP enzyme."""
    detail = enzyme_service.get_enzyme_detail(symbol)
    if not detail:
        raise HTTPException(
            status_code=404,
            detail=f"Enzyme '{symbol}' not found in CYP450 registry. Available: {', '.join(CYP_DETAILED_CATALOG.keys())}"
        )
    return detail

@router.post("/simulate", response_model=ClashSimulationResponse)
def simulate_cyp_clash(req: ClashSimulationRequest):
    """Simulates real-time metabolic clearance clash between a drug and dietary compound across all CYP pathways."""
    if not req.drug_name.strip() or not req.food_name.strip():
        raise HTTPException(status_code=400, detail="Both drug_name and food_name are required for simulation.")
    return enzyme_service.simulate_clash(req.drug_name, req.food_name)
