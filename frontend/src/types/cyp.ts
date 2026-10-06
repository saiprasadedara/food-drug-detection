export interface SubstrateItem {
  name: string;
  class_name?: string;
  metabolism_fraction?: string;
  therapeutic_use?: string;
}

export interface InhibitorItem {
  compound: string;
  food_source: string;
  potency: string;
  mechanism?: string;
}

export interface InducerItem {
  compound: string;
  source: string;
  potency: string;
  mechanism?: string;
}

export interface PolymorphismInfo {
  phenotype: string;
  allele_examples: string;
  frequency_notes: string;
  clinical_impact: string;
}

export interface EnzymeSummary {
  symbol: string;
  name: string;
  clearance_percentage: number;
  gene: string;
  primary_tissue: string;
  pdb_id: string;
  description: string;
  substrate_count: number;
  inhibitor_count: number;
  inducer_count: number;
  primary_drugs: string[];
  primary_foods: string[];
}

export interface EnzymeDetail {
  symbol: string;
  name: string;
  category: string;
  clearance_percentage: number;
  gene: string;
  primary_tissue: string;
  pdb_id: string;
  description: string;
  clinical_significance: string;
  substrates: SubstrateItem[];
  inhibitors: InhibitorItem[];
  inducers: InducerItem[];
  polymorphisms: PolymorphismInfo[];
  clinical_guidance: string[];
}

export interface ClashSimulationResponse {
  drug: string;
  food: string;
  overall_clash: boolean;
  highest_severity: 'High' | 'Medium' | 'Low' | 'None';
  affected_enzymes: string[];
  pathway_details: Record<string, {
    drug_substrate: boolean;
    food_inhibitor: boolean;
    food_inducer?: boolean;
    clash: boolean;
    relevance: string;
    clinical_mechanism?: string;
  }>;
  clinical_summary: string;
  recommendations: string[];
}
