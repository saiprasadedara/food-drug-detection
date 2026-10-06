// ═══════════════════════════════════════════════
// Analysis Types
// ═══════════════════════════════════════════════

export interface MolecularProperties {
  mw: number;
  logp: number;
  hbd: number;
  hba: number;
  tpsa: number;
  rotatable_bonds?: number;
  heavy_atom_count?: number;
  formal_charge?: number;
  formula?: string;
  smiles?: string;
  inchi?: string;
  inchikey?: string;
  pubchem_cid?: string;
  chemical_class?: string;
}

export interface InteractionResult {
  detected: boolean;
  severity: 'none' | 'minor' | 'moderate' | 'major';
  class_label?: string;
  class_number?: number;
  confidence: number;
  outcome?: string;
  predicted_class?: string;
  evidence_level?: string;
  clinical_relevance?: string;
}

export interface MechanismInfo {
  enzymes: string[];
  pathways: string[];
  description: string;
}

export interface CYPEnzyme {
  drug_substrate: boolean;
  food_inhibitor: boolean;
  food_inducer?: boolean;
  clash: boolean;
  relevance?: string;
  relevant_class?: string;
  clinical_mechanism?: string;
}

export interface ShapAttribution {
  feature: string;
  impact: number;
  positive: boolean;
  baseline_value?: number;
  description?: string;
}

export interface AlternativeCompound {
  name: string;
  risk: string;
  score: string;
  mechanism?: string;
  evidence_level?: string;
}

export interface ClassProbabilities {
  major_adverse: number;
  moderate: number;
  minor: number;
  no_interaction: number;
}

export interface AnalysisResponse {
  drug: string;
  food: string;
  drug_smiles: string;
  food_smiles: string;
  drug_sdf: string;
  food_sdf: string;
  predicted_outcome: string;
  predicted_class: string;
  severity_index: number;
  class_probabilities: ClassProbabilities;
  cyp_pathways: Record<string, CYPEnzyme>;
  cyp_features?: Array<{
    enzyme: string;
    name: string;
    drug_substrate: boolean;
    food_inhibitor: boolean;
    food_inducer?: boolean;
    clash: boolean;
    relevance: string;
    clinical_mechanism?: string;
  }>;
  affected_enzymes?: string[];
  cyp_clash_detected?: boolean;
  has_interaction?: boolean;
  risk_score?: number;
  description?: string;
  telemetry: {
    drug: MolecularProperties;
    food: MolecularProperties;
  };
  shap_attributions: ShapAttribution[];
  alternatives: AlternativeCompound[];
  
  // Section 20 fields
  interaction?: InteractionResult;
  mechanism?: MechanismInfo;
  recommendations?: string[];
  evidence?: any[];
  features?: Record<string, any>;
  explainability?: Record<string, any>;

  model_info?: {
    type: 'DEMO' | 'TRAINED';
    label?: string;
    version: string;
    disclaimer?: string;
  };
}

export type SeverityLevel = 'none' | 'minor' | 'moderate' | 'major';

export interface BenchmarkPairing {
  id?: number;
  drug: string;
  food: string;
  mechanism: string;
  severity: SeverityLevel;
  pathway?: string;
  predicted_class?: string;
  confidence?: number;
  badge?: string;
}
