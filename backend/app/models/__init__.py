import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="researcher")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    analyses = relationship("AnalysisHistory", back_populates="user", cascade="all, delete-orphan")

class Drug(Base):
    __tablename__ = "drugs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    generic_name = Column(String(255), index=True)
    drugbank_id = Column(String(50), unique=True, index=True, nullable=True)
    pubchem_cid = Column(Integer, nullable=True)
    drug_class = Column(String(255))
    smiles = Column(Text, nullable=False)
    inchikey = Column(String(100), nullable=True)
    targets = Column(JSON, default=list) # e.g. ["HMG-CoA Reductase"]
    relevant_enzymes = Column(JSON, default=list) # e.g. ["CYP3A4"]
    description = Column(Text, nullable=True)
    
    descriptors = relationship("MolecularDescriptor", back_populates="drug", uselist=False)

class Food(Base):
    __tablename__ = "foods"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    scientific_name = Column(String(255), nullable=True)
    category = Column(String(100), nullable=True) # Fruit, Herb, Beverage, Dietary Compound
    foodb_id = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)

    compounds = relationship("Compound", back_populates="food")

class Compound(Base):
    __tablename__ = "compounds"
    id = Column(Integer, primary_key=True, index=True)
    food_id = Column(Integer, ForeignKey("foods.id"), nullable=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    chemical_class = Column(String(255), nullable=True) # Flavonoid, Polyphenol, Alkaloid
    pubchem_cid = Column(Integer, nullable=True)
    smiles = Column(Text, nullable=False)
    molecular_formula = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)

    food = relationship("Food", back_populates="compounds")
    descriptors = relationship("MolecularDescriptor", back_populates="compound", uselist=False)

class MolecularDescriptor(Base):
    __tablename__ = "molecular_descriptors"
    id = Column(Integer, primary_key=True, index=True)
    drug_id = Column(Integer, ForeignKey("drugs.id"), nullable=True)
    compound_id = Column(Integer, ForeignKey("compounds.id"), nullable=True)
    smiles = Column(Text, nullable=False)
    molecular_weight = Column(Float, nullable=False)
    logp = Column(Float, nullable=False)
    tpsa = Column(Float, nullable=False)
    h_bond_donors = Column(Integer, nullable=False)
    h_bond_acceptors = Column(Integer, nullable=False)
    rotatable_bonds = Column(Integer, nullable=False)
    heavy_atom_count = Column(Integer, nullable=False)
    formal_charge = Column(Integer, default=0)
    calculated_at = Column(DateTime, default=datetime.datetime.utcnow)

    drug = relationship("Drug", back_populates="descriptors")
    compound = relationship("Compound", back_populates="descriptors")

class Enzyme(Base):
    __tablename__ = "enzymes"
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(50), unique=True, index=True, nullable=False) # e.g. CYP3A4, CYP2C9
    name = Column(String(255), nullable=False)
    category = Column(String(100), default="Cytochrome P450")
    description = Column(Text, nullable=True)
    clinical_significance = Column(Text, nullable=True)

class Pathway(Base):
    __tablename__ = "pathways"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    kegg_id = Column(String(50), nullable=True)
    category = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)

class Interaction(Base):
    __tablename__ = "interactions"
    id = Column(Integer, primary_key=True, index=True)
    drug_name = Column(String(255), index=True, nullable=False)
    food_or_compound_name = Column(String(255), index=True, nullable=False)
    predicted_class = Column(Integer, nullable=False) # 0=None, 1=Minor, 2=Moderate, 3=Major
    severity_level = Column(String(50), nullable=False) # none, minor, moderate, major
    confidence_score = Column(Float, nullable=False)
    mechanism = Column(Text, nullable=False)
    clinical_significance = Column(Text, nullable=True)
    recommendations = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    evidence_records = relationship("Evidence", back_populates="interaction")

class Evidence(Base):
    __tablename__ = "evidence"
    id = Column(Integer, primary_key=True, index=True)
    interaction_id = Column(Integer, ForeignKey("interactions.id"), nullable=True)
    title = Column(String(500), nullable=False)
    source = Column(String(100), nullable=False) # PubMed, FDA, DrugBank, Clinical Trial
    pmid = Column(String(50), nullable=True)
    evidence_level = Column(String(50), default="In Silico / Experimental")
    snippet = Column(Text, nullable=True)
    doi = Column(String(255), nullable=True)

    interaction = relationship("Interaction", back_populates="evidence_records")

class AnalysisHistory(Base):
    __tablename__ = "analysis_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    drug_name = Column(String(255), nullable=False)
    food_name = Column(String(255), nullable=False)
    dose_level = Column(String(50), default="standard")
    severity = Column(String(50), nullable=False)
    predicted_class = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    result_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="analyses")

class ModelVersion(Base):
    __tablename__ = "model_versions"
    id = Column(Integer, primary_key=True, index=True)
    version_tag = Column(String(50), unique=True, index=True, nullable=False)
    model_type = Column(String(100), default="XGBoost Classifier + SHAP TreeExplainer")
    accuracy = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    roc_auc = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    trained_at = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(Text, nullable=True)

class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    version = Column(String(50), nullable=False)
    record_count = Column(Integer, nullable=False)
    source_attribution = Column(String(255), nullable=False)
    checksum = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
