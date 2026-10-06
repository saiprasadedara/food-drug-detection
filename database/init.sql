-- PostgreSQL Schema Initialization for FOOD x DRUG MOLECULAR INTELLIGENCE
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'researcher',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drugs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    generic_name VARCHAR(255),
    drugbank_id VARCHAR(50) UNIQUE,
    pubchem_cid INTEGER,
    drug_class VARCHAR(255),
    smiles TEXT NOT NULL,
    inchikey VARCHAR(100),
    targets JSONB DEFAULT '[]',
    relevant_enzymes JSONB DEFAULT '[]',
    description TEXT
);

CREATE TABLE IF NOT EXISTS foods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    scientific_name VARCHAR(255),
    category VARCHAR(100),
    foodb_id VARCHAR(50),
    description TEXT
);

CREATE TABLE IF NOT EXISTS compounds (
    id SERIAL PRIMARY KEY,
    food_id INTEGER REFERENCES foods(id) ON DELETE SET NULL,
    name VARCHAR(255) UNIQUE NOT NULL,
    chemical_class VARCHAR(255),
    pubchem_cid INTEGER,
    smiles TEXT NOT NULL,
    molecular_formula VARCHAR(100),
    description TEXT
);

CREATE TABLE IF NOT EXISTS molecular_descriptors (
    id SERIAL PRIMARY KEY,
    drug_id INTEGER REFERENCES drugs(id) ON DELETE CASCADE,
    compound_id INTEGER REFERENCES compounds(id) ON DELETE CASCADE,
    smiles TEXT NOT NULL,
    molecular_weight NUMERIC(10, 2) NOT NULL,
    logp NUMERIC(8, 2) NOT NULL,
    tpsa NUMERIC(8, 2) NOT NULL,
    h_bond_donors INTEGER NOT NULL,
    h_bond_acceptors INTEGER NOT NULL,
    rotatable_bonds INTEGER NOT NULL,
    heavy_atom_count INTEGER NOT NULL,
    formal_charge INTEGER DEFAULT 0,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enzymes (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Cytochrome P450',
    description TEXT,
    clinical_significance TEXT
);

CREATE TABLE IF NOT EXISTS pathways (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    kegg_id VARCHAR(50),
    category VARCHAR(100),
    description TEXT
);

CREATE TABLE IF NOT EXISTS interactions (
    id SERIAL PRIMARY KEY,
    drug_name VARCHAR(255) NOT NULL,
    food_or_compound_name VARCHAR(255) NOT NULL,
    predicted_class INTEGER NOT NULL,
    severity_level VARCHAR(50) NOT NULL,
    confidence_score NUMERIC(5, 4) NOT NULL,
    mechanism TEXT NOT NULL,
    clinical_significance TEXT,
    recommendations JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidence (
    id SERIAL PRIMARY KEY,
    interaction_id INTEGER REFERENCES interactions(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    source VARCHAR(100) NOT NULL,
    pmid VARCHAR(50),
    evidence_level VARCHAR(50),
    snippet TEXT,
    doi VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS analysis_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    drug_name VARCHAR(255) NOT NULL,
    food_name VARCHAR(255) NOT NULL,
    dose_level VARCHAR(50) DEFAULT 'standard',
    severity VARCHAR(50) NOT NULL,
    predicted_class VARCHAR(50) NOT NULL,
    confidence NUMERIC(5, 4) NOT NULL,
    result_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS model_versions (
    id SERIAL PRIMARY KEY,
    version_tag VARCHAR(50) UNIQUE NOT NULL,
    model_type VARCHAR(100) NOT NULL,
    accuracy NUMERIC(5, 4),
    f1_score NUMERIC(5, 4),
    roc_auc NUMERIC(5, 4),
    is_active BOOLEAN DEFAULT TRUE,
    trained_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS datasets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    version VARCHAR(50) NOT NULL,
    record_count INTEGER NOT NULL,
    source_attribution VARCHAR(255) NOT NULL,
    checksum VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Essential Performance Indexes
CREATE INDEX IF NOT EXISTS idx_drugs_name ON drugs(name);
CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);
CREATE INDEX IF NOT EXISTS idx_interactions_pair ON interactions(drug_name, food_or_compound_name);
CREATE INDEX IF NOT EXISTS idx_history_user ON analysis_history(user_id);
