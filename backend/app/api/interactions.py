from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.database.session import get_db
from app.models import AnalysisHistory, Interaction
from app.schemas.interaction import AnalyzeRequest, AnalysisResponse
from app.services.ml_service import ml_service

router = APIRouter(prefix="/interactions", tags=["Interactions"])

@router.post("/analyze", response_model=AnalysisResponse)
def analyze_interaction(req: AnalyzeRequest, db: Session = Depends(get_db)):
    """Analyzes metabolic interaction between a drug and dietary compound."""
    drug = req.resolved_drug.strip()
    food = req.resolved_food.strip()
    if not drug or not food:
        raise HTTPException(status_code=400, detail="Both drug_name (or drug) and food_name (or food) are required.")

    result = ml_service.predict_interaction(drug, food, req.dose_level or "standard")
    
    # Save to history table in database
    try:
        hist_entry = AnalysisHistory(
            drug_name=result["drug"],
            food_name=result["food"],
            dose_level=req.dose_level or "standard",
            severity=result["interaction"]["severity"],
            predicted_class=result["predicted_class"],
            confidence=result["interaction"]["confidence"],
            result_json=result
        )
        db.add(hist_entry)
        db.commit()
    except Exception:
        db.rollback()

    return result

@router.get("/pairings")
def get_benchmark_pairings() -> List[Dict[str, Any]]:
    """Returns curated benchmark research pairings."""
    return [
        {
            "id": 1,
            "drug": "Warfarin",
            "food": "Vitamin K",
            "mechanism": "Anticoagulant antagonism via VKORC1 pathway bypass and accelerated gamma-carboxylation of clotting factors.",
            "severity": "major",
            "pathway": "VKORC1 / Hepatic Clotting Cascade",
            "predicted_class": "CLASS 3",
            "confidence": 0.94,
            "badge": "Clinical Black Box Warning"
        },
        {
            "id": 2,
            "drug": "Simvastatin",
            "food": "Naringin",
            "mechanism": "Intestinal and hepatic CYP3A4 suicide-inhibition by grapefruit furanocoumarins elevating statin AUC >3-fold.",
            "severity": "moderate",
            "pathway": "CYP3A4 / Intestinal First-Pass",
            "predicted_class": "CLASS 2",
            "confidence": 0.89,
            "badge": "Established Pharmacokinetic Clash"
        },
        {
            "id": 3,
            "drug": "Metformin",
            "food": "Dietary Compounds",
            "mechanism": "Delayed gastric emptying and modest Cmax attenuation; interaction with OCT1/OCT2 organic cation transporters.",
            "severity": "minor",
            "pathway": "OCT1 / AMPK Activation",
            "predicted_class": "CLASS 1",
            "confidence": 0.79,
            "badge": "Preclinical Pathway Modulation"
        },
        {
            "id": 4,
            "drug": "Digoxin",
            "food": "St. John's Wort",
            "mechanism": "Hyperforin PXR-mediated profound induction of ABCB1 (P-glycoprotein), slashing therapeutic cardiac glycoside concentrations.",
            "severity": "major",
            "pathway": "P-glycoprotein (ABCB1) Efflux",
            "predicted_class": "CLASS 3",
            "confidence": 0.91,
            "badge": "Therapeutic Failure Risk"
        },
        {
            "id": 5,
            "drug": "Clopidogrel",
            "food": "Curcumin",
            "mechanism": "Modulation of CYP2C19 bioactivation and additive antiplatelet hemostatic inhibition.",
            "severity": "moderate",
            "pathway": "CYP2C19 Prodrug Bioactivation",
            "predicted_class": "CLASS 2",
            "confidence": 0.82,
            "badge": "Bioactivation Interference"
        }
    ]

@router.get("/screening")
def get_research_screening() -> List[Dict[str, Any]]:
    """Returns research screening dietary bioactive compounds."""
    return [
        {
            "compound": "Quercetin",
            "name": "Quercetin",
            "potential_mechanism": "Flavonoid scaffold providing competitive inhibition of CYP3A4 and CYP1A2 in vitro.",
            "evidence_level": "Level B — In Vitro / Animal",
            "interaction_relevance": "Moderate",
            "chemical_class": "Flavonol",
            "dietary_source": "Red onions, capers, apples"
        },
        {
            "compound": "Curcumin",
            "name": "Curcumin",
            "potential_mechanism": "Non-competitive reversible inhibition of CYP1A2, CYP2C9, and P-glycoprotein ATPase activity.",
            "evidence_level": "Level B — Clinical PK Studies",
            "interaction_relevance": "Moderate / High",
            "chemical_class": "Curcuminoid Polyphenol",
            "dietary_source": "Turmeric (Curcuma longa)"
        },
        {
            "compound": "Genistein",
            "name": "Genistein",
            "potential_mechanism": "Isoflavone phytoestrogen with mild BCRP and CYP1B1 binding kinetics.",
            "evidence_level": "Level C — In Silico Docking",
            "interaction_relevance": "Minor",
            "chemical_class": "Isoflavone",
            "dietary_source": "Soybeans, legumes"
        },
        {
            "compound": "Luteolin",
            "name": "Luteolin",
            "potential_mechanism": "Weak substrate displacement at CYP3A4 catalytic site; minimal plasma concentration at culinary doses.",
            "evidence_level": "Level B — In Vitro Assays",
            "interaction_relevance": "Low / Minor",
            "chemical_class": "Flavone",
            "dietary_source": "Celery, broccoli, chamomile"
        },
        {
            "compound": "Apigenin",
            "name": "Apigenin",
            "potential_mechanism": "Flavone derivative showing allosteric modulation of GABA-A receptors and mild CYP2C9 interaction.",
            "evidence_level": "Level B — Preclinical",
            "interaction_relevance": "Minor",
            "chemical_class": "Flavone",
            "dietary_source": "Chamomile tea, parsley"
        }
    ]
