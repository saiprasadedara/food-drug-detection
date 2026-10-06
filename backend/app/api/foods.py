from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from app.services.molecular_service import FOOD_DATABASE, molecular_service
from app.schemas.food import FoodSearchItem

router = APIRouter(prefix="/foods", tags=["Foods & Dietary Compounds"])

@router.get("/search", response_model=List[FoodSearchItem])
def search_foods(q: Optional[str] = Query(None, description="Search term for food or dietary compound")):
    """Searches whole foods and bioactive compounds."""
    query = (q or "").strip().lower()
    results = []
    
    for key, data in FOOD_DATABASE.items():
        if (not query or 
            query in key or 
            query in data["name"].lower() or 
            query in data.get("compound", "").lower() or 
            query in data.get("chemical_class", "").lower()):
            
            # Compute properties if not stored
            smiles = data.get("smiles", "")
            props = molecular_service.compute_descriptors(smiles)
            
            results.append(FoodSearchItem(
                name=data["name"],
                compound=data.get("compound"),
                molecular_formula=data.get("molecular_formula") or props.get("formula"),
                molecular_weight=props.get("mw"),
                pubchem_cid=data.get("pubchem_cid"),
                chemical_class=data.get("chemical_class"),
                smiles=smiles,
                description=data.get("description")
            ))
            
    return results

@router.get("/suggestions", response_model=List[str])
def food_suggestions(q: str = Query("", min_length=1)):
    """Autocomplete suggestions for foods and bioactive compounds."""
    query = q.strip().lower()
    matches = [data["name"] for key, data in FOOD_DATABASE.items() if query in key or query in data["name"].lower() or query in data.get("compound", "").lower()]
    return matches[:15]

@router.get("/{name}")
def get_food_details(name: str):
    """Retrieves full chemical and bioactive profile of a specific food/compound."""
    clean = name.strip().lower()
    if clean in FOOD_DATABASE:
        data = FOOD_DATABASE[clean].copy()
        data["properties"] = molecular_service.compute_descriptors(data["smiles"])
        return data
        
    smiles, meta = molecular_service.resolve_smiles(name)
    meta["properties"] = molecular_service.compute_descriptors(smiles)
    return meta
