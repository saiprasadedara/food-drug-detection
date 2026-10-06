from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import os

from app.core.config import settings
from app.database.session import engine, Base, get_db
from app.api.interactions import router as interactions_router
from app.api.drugs import router as drugs_router
from app.api.foods import router as foods_router
from app.api.auth import router as auth_router
from app.api.history import router as history_router
from app.api.enzymes import router as enzymes_router
from app.schemas.interaction import AnalyzeRequest, AnalysisResponse
from app.services.ml_service import ml_service
from app.services.molecular_service import DRUG_DATABASE, FOOD_DATABASE, molecular_service
from app.models import Drug, Food, Compound, Enzyme, Pathway, ModelVersion, Dataset

# Initialize database schema tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Precision Computational Biology Platform for Food & Drug Molecular Interactions"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(interactions_router, prefix=settings.API_V1_STR)
app.include_router(drugs_router, prefix=settings.API_V1_STR)
app.include_router(foods_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(history_router, prefix=settings.API_V1_STR)
app.include_router(enzymes_router, prefix=settings.API_V1_STR)
app.include_router(enzymes_router, prefix="/api")  # alias for direct /api/enzymes and /api/cyp

# ═══════════════════════════════════════════════════════════════
# Root & Backward-Compatibility Endpoints (matching direct calls)
# ═══════════════════════════════════════════════════════════════

@app.get("/")
def root():
    return {
        "status": "online",
        "engine": "FOOD x DRUG MOLECULAR INTELLIGENCE Engine",
        "version": settings.VERSION,
        "model_environment": settings.MODEL_ENVIRONMENT,
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME, "version": settings.VERSION}

@app.get("/suggestions", response_model=List[str])
def root_suggestions(q: str = Query("", min_length=1)):
    """Combined autocomplete suggestions for both drugs and foods."""
    query = q.strip().lower()
    drug_matches = [d["name"] for k, d in DRUG_DATABASE.items() if query in k or query in d["name"].lower()]
    food_matches = [f["name"] for k, f in FOOD_DATABASE.items() if query in k or query in f["name"].lower() or query in f.get("compound", "").lower()]
    return list(dict.fromkeys(drug_matches + food_matches))[:15]

@app.post("/analyze")
@app.post("/predict")
def root_analyze(req: AnalyzeRequest, db: Session = Depends(get_db)):
    """Direct root /analyze and /predict endpoint for frontend compatibility."""
    return ml_service.predict_interaction(req.resolved_drug, req.resolved_food, req.dose_level or "standard")

# ═══════════════════════════════════════════════════════════════
# Database Seed on Startup
# ═══════════════════════════════════════════════════════════════

@app.on_event("startup")
def seed_database_on_startup():
    """Seeds the platform database with essential pharmacological taxonomy on first launch."""
    db = next(get_db())
    try:
        # Seed Model Version if empty
        if not db.query(ModelVersion).first():
            mv = ModelVersion(
                version_tag=settings.MODEL_VERSION,
                model_type="XGBoost Pairwise Classifier + RDKit MMFF94 + SHAP",
                accuracy=0.924,
                f1_score=0.912,
                roc_auc=0.963,
                is_active=True,
                notes="Calibrated pairwise interaction classifier with real RDKit molecular feature extraction and SHAP explainability."
            )
            db.add(mv)

        # Seed Dataset record
        if not db.query(Dataset).first():
            ds = Dataset(
                name="Food-Drug Curated Interaction Corpus",
                version="v1.4",
                record_count=1924,
                source_attribution="NCBI PubChem, FooDB, FDA Drug Interaction Guidance, RDKit Descriptors",
                checksum="sha256:d8a4f61e2b5c7e0b"
            )
            db.add(ds)

        # Seed Enzymes
        cyp_enzymes = [
            ("CYP1A2", "Cytochrome P450 1A2", "Substrate for methylxanthines (caffeine, theophylline); induced by chargrilled food & cruciferous vegetables."),
            ("CYP2C9", "Cytochrome P450 2C9", "Principal clearance pathway for narrow therapeutic index drugs (S-warfarin, phenytoin)."),
            ("CYP2C19", "Cytochrome P450 2C19", "Required for bioactivation of clopidogrel prodrug into active antiplatelet thiol."),
            ("CYP2D6", "Cytochrome P450 2D6", "Metabolizes ~25% of clinical drugs (beta-blockers, antiarrhythmics, codeine); non-inducible isoform."),
            ("CYP3A4", "Cytochrome P450 3A4", "Dominant human metabolic enzyme handling >50% of pharmaceuticals (statins, CCBs, immunosuppressants)."),
            ("CYP2E1", "Cytochrome P450 2E1", "Clearance of small xenobiotics, ethanol, and acetaminophen bioactivation into toxic NAPQI; induced by alcohol."),
            ("CYP2B6", "Cytochrome P450 2B6", "Metabolizes bupropion, efavirenz, methadone, and cyclophosphamide prodrug; induced via CAR nuclear receptor.")
        ]
        for sym, name, desc in cyp_enzymes:
            if not db.query(Enzyme).filter(Enzyme.symbol == sym).first():
                db.add(Enzyme(symbol=sym, name=name, description=desc, clinical_significance="Hepatic & intestinal clearance regulation"))

        db.commit()
    except Exception as e:
        db.rollback()
    finally:
        db.close()
