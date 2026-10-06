from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from app.services.molecular_service import DRUG_DATABASE, molecular_service
from app.schemas.drug import DrugSearchItem

router = APIRouter(prefix="/drugs", tags=["Drugs"])

@router.get("/search", response_model=List[DrugSearchItem])
def search_drugs(q: Optional[str] = Query(None, description="Search term for drug")):
    """Searches the drug database by brand name, generic name, or class."""
    query = (q or "").strip().lower()
    results = []
    
    for key, data in DRUG_DATABASE.items():
        if (not query or 
            query in key or 
            query in data["name"].lower() or 
            query in data.get("generic_name", "").lower() or 
            query in data.get("drug_class", "").lower()):
            
            results.append(DrugSearchItem(
                name=data["name"],
                generic_name=data.get("generic_name"),
                drug_class=data.get("drug_class"),
                identifier=data.get("drugbank_id") or f"CID:{data.get('pubchem_cid')}",
                targets=data.get("targets", []),
                relevant_enzymes=data.get("relevant_enzymes", [])
            ))
            
    return results

@router.get("/suggestions", response_model=List[str])
def drug_suggestions(q: str = Query("", min_length=1)):
    """Autocomplete suggestions for pharmaceutical medications."""
    query = q.strip().lower()
    matches = [data["name"] for key, data in DRUG_DATABASE.items() if query in key or query in data["name"].lower()]
    return matches[:15]

@router.get("/{name}")
def get_drug_details(name: str):
    """Retrieves full molecular and pharmacological profile of a specific drug."""
    clean = name.strip().lower()
    if clean in DRUG_DATABASE:
        data = DRUG_DATABASE[clean].copy()
        data["properties"] = molecular_service.compute_descriptors(data["smiles"])
        return data
    
    # Try resolving via PubChem
    smiles, meta = molecular_service.resolve_smiles(name)
    meta["properties"] = molecular_service.compute_descriptors(smiles)
    return meta
