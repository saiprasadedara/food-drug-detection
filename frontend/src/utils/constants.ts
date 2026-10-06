import type { BenchmarkPairing } from '../types/analysis';

export const API_BASE_URL = 'http://localhost:8000';

export const BENCHMARK_PAIRINGS: BenchmarkPairing[] = [
  {
    drug: 'Warfarin',
    food: 'Vitamin K',
    mechanism: 'Anticoagulant antagonism via VKORC1 pathway — Vitamin K competitively reverses warfarin inhibition of clotting factor synthesis',
    severity: 'major',
    pathway: 'VKORC1',
  },
  {
    drug: 'Simvastatin',
    food: 'Naringin',
    mechanism: 'Potential CYP3A4 hepatic inhibition — Grapefruit flavanone increases statin bioavailability and myopathy risk',
    severity: 'moderate',
    pathway: 'CYP3A4',
  },
  {
    drug: 'Metformin',
    food: 'Curcumin',
    mechanism: 'Potential AMPK activation synergy — Curcumin may enhance metformin glucose-lowering via shared metabolic pathways',
    severity: 'minor',
    pathway: 'AMPK',
  },
  {
    drug: 'Tetracycline',
    food: 'Calcium',
    mechanism: 'Chelation-mediated absorption inhibition — Divalent cations form insoluble complexes with tetracycline',
    severity: 'major',
    pathway: 'Chelation',
  },
  {
    drug: 'Atorvastatin',
    food: 'Grapefruit',
    mechanism: 'CYP3A4 inhibition by furanocoumarins — Increases systemic drug exposure and risk of rhabdomyolysis',
    severity: 'major',
    pathway: 'CYP3A4',
  },
  {
    drug: 'Amlodipine',
    food: 'Green Tea',
    mechanism: 'OATP transporter modulation — Catechins may alter calcium channel blocker absorption kinetics',
    severity: 'minor',
    pathway: 'OATP',
  },
];

export const DATA_SOURCES = [
  { label: 'PUBCHEM REPOSITORY', desc: 'Open chemistry database', category: 'chemistry' },
  { label: 'FOODB METABOLOME', desc: 'Food constituent database', category: 'food' },
  { label: 'NCBI UTILITIES', desc: 'Biomedical literature', category: 'biology' },
  { label: 'RDKIT 3D CONFORMATION', desc: 'Molecular geometry', category: 'chemistry' },
  { label: 'CYP450 ENZYMES', desc: 'Metabolic pathway data', category: 'biology' },
  { label: 'SHAP EXPLANATIONS', desc: 'Model interpretability', category: 'ml' },
  { label: 'DRUGBANK CLINICAL ARCHIVE', desc: 'Licensed on connection', category: 'clinical' },
  { label: 'FDA MEDWATCH', desc: 'Adverse event reports', category: 'clinical' },
];

export const INTELLIGENCE_LAYERS = [
  {
    number: '01',
    title: 'Molecular',
    subtitle: 'Chemical Structure Analysis',
    items: [
      'Chemical structures & SMILES notation',
      'Physicochemical descriptors (MW, LogP, TPSA)',
      'Morgan circular fingerprints',
      'Hydrogen bond donor/acceptor profiles',
    ],
    color: 'cyan' as const,
  },
  {
    number: '02',
    title: 'Biological',
    subtitle: 'Metabolic Pathway Mapping',
    items: [
      'CYP450 enzyme substrate/inhibitor analysis',
      'Transporter interaction profiling',
      'Target binding assessment',
      'Metabolic pathway classification',
    ],
    color: 'emerald' as const,
  },
  {
    number: '03',
    title: 'Clinical',
    subtitle: 'Risk Assessment & Interpretation',
    items: [
      'Interaction severity classification',
      'Evidence-based confidence scoring',
      'Clinical interpretation synthesis',
      'Actionable risk recommendations',
    ],
    color: 'amber' as const,
  },
];

export const SEVERITY_CONFIG = {
  none: {
    label: 'No Significant Interaction',
    color: 'emerald',
    bgClass: 'bg-accent-emerald-dim',
    textClass: 'text-accent-emerald',
    borderClass: 'border-accent-emerald/20',
  },
  minor: {
    label: 'Minor Interaction',
    color: 'cyan',
    bgClass: 'bg-accent-cyan-dim',
    textClass: 'text-accent-cyan',
    borderClass: 'border-accent-cyan/20',
  },
  moderate: {
    label: 'Minor / Moderate Interaction',
    color: 'amber',
    bgClass: 'bg-accent-amber-dim',
    textClass: 'text-accent-amber',
    borderClass: 'border-accent-amber/20',
  },
  major: {
    label: 'Major / Adverse Interaction',
    color: 'red',
    bgClass: 'bg-accent-red-dim',
    textClass: 'text-accent-red',
    borderClass: 'border-accent-red/20',
  },
} as const;
