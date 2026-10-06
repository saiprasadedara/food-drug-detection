import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, AlertCircle, CheckCircle, AlertTriangle, Activity, Dna,
  ShieldAlert, ShieldCheck, ChevronDown, ChevronUp, Zap, Sparkles, RotateCcw
} from 'lucide-react';
import MolecularComparisonPanel from './components/MolecularComparisonPanel';

const ANALYSIS_STEPS = [
  'Retrieving molecular structures...',
  'Analyzing molecular features...',
  'Checking interaction...',
  'Preparing 3D structures...'
];

const CYP_CATALOG = {
  CYP3A4: {
    name: 'Cytochrome P450 3A4',
    role: 'Dominant Hepatic & Intestinal Enzyme',
    clearance: '>50% Prescription Drugs'
  },
  CYP2D6: {
    name: 'Cytochrome P450 2D6',
    role: 'Cardiovascular, Beta-Blockers & Opioids',
    clearance: '~25% Clinical Drugs'
  },
  CYP2C9: {
    name: 'Cytochrome P450 2C9',
    role: 'Narrow Therapeutic Index (Warfarin, Phenytoin)',
    clearance: '~15% Hepatic Clearance'
  },
  CYP1A2: {
    name: 'Cytochrome P450 1A2',
    role: 'Methylxanthines, Caffeine & Planar Amines',
    clearance: '~13% Hepatic Clearance'
  },
  CYP2C19: {
    name: 'Cytochrome P450 2C19',
    role: 'Antiplatelet Clopidogrel Bioactivation & PPIs',
    clearance: '~8% Hepatic Clearance'
  },
  CYP2E1: {
    name: 'Cytochrome P450 2E1',
    role: 'Ethanol & Acetaminophen Toxic Bioactivation',
    clearance: '~5% Xenobiotic Clearance'
  },
  CYP2B6: {
    name: 'Cytochrome P450 2B6',
    role: 'Bupropion, Efavirenz & Anesthetics',
    clearance: '~4-8% Clinical Clearance'
  }
};

const BENCHMARK_PRESETS = [
  { drug: 'Simvastatin', food: 'Grapefruit Juice', label: 'Simvastatin + Grapefruit (CYP3A4 Clash)' },
  { drug: 'Warfarin', food: 'Vitamin K', label: 'Warfarin + Vitamin K (Anticoagulant Antagonism)' },
  { drug: 'Ciprofloxacin', food: 'Caffeine', label: 'Ciprofloxacin + Caffeine (CYP1A2 Clash)' },
  { drug: 'Clopidogrel', food: 'Curcumin', label: 'Clopidogrel + Curcumin (CYP2C19 Clash)' },
  { drug: 'Aspirin', food: 'Milk', label: 'Aspirin + Milk (Safe Profile)' }
];

export default function App() {
  const [drug, setDrug] = useState('');
  const [food, setFood] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisStepIndex, setAnalysisStepIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [expandedEnzyme, setExpandedEnzyme] = useState(null);
  const resultRef = useRef(null);

  const fetchAnalysis = useCallback(async (customDrug, customFood) => {
    const targetDrug = (customDrug ?? drug).trim();
    const targetFood = (customFood ?? food).trim();
    if (!targetDrug || !targetFood) return;

    setLoading(true);
    setAnalysisStepIndex(0);
    setErrorMsg(null);
    setResult(null);
    setExpandedEnzyme(null);

    const stepTimer = setInterval(() => {
      setAnalysisStepIndex((prev) => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev));
    }, 450);
    
    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drug_name: targetDrug, food_name: targetFood }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        // Fallback retry with /predict if /analyze responds with error
        const fallbackRes = await fetch('http://localhost:8000/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ drug_name: targetDrug, food_name: targetFood }),
        });
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          setResult(data);
        } else {
          setErrorMsg(`Server returned status code ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error executing analysis pipeline:', error);
      setErrorMsg('Unable to connect to the backend server at http://localhost:8000.');
    } finally {
      clearInterval(stepTimer);
      setLoading(false);
    }
  }, [drug, food]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchAnalysis();
  };

  const handleSelectPreset = (presetDrug, presetFood) => {
    setDrug(presetDrug);
    setFood(presetFood);
    fetchAnalysis(presetDrug, presetFood);
  };

  const handleReset = () => {
    setDrug('');
    setFood('');
    setResult(null);
    setErrorMsg(null);
    setExpandedEnzyme(null);
  };

  // Helper getters for robust data extraction
  const isInteractionDetected = result
    ? (result.has_interaction ?? (result.interaction?.detected ?? (result.predicted_class !== 'CLASS 0')))
    : false;

  const riskScore = result
    ? (result.risk_score ?? (result.severity_index ?? (result.confidence || 0)))
    : null;

  const descriptionText = result
    ? (result.description ?? (result.mechanism?.description ?? result.predicted_outcome))
    : '';

  // Extract CYP Pathways dictionary
  const cypPathways = (result && result.cyp_pathways) ? result.cyp_pathways : {};
  const enzymeKeys = ['CYP3A4', 'CYP2D6', 'CYP2C9', 'CYP1A2', 'CYP2C19', 'CYP2E1', 'CYP2B6'];

  // Calculate summary metrics
  const clashingEnzymes = enzymeKeys.filter((k) => cypPathways[k]?.clash);
  const substrateCount = enzymeKeys.filter((k) => cypPathways[k]?.drug_substrate).length;
  const inhibitorCount = enzymeKeys.filter((k) => cypPathways[k]?.food_inhibitor).length;
  const inducerCount = enzymeKeys.filter((k) => cypPathways[k]?.food_inducer).length;
  const hasCypClash = clashingEnzymes.length > 0;

  // Filter SHAP attributions related to CYP enzymes
  const cypShapFeatures = (result?.shap_attributions || []).filter((item) =>
    item.feature.toLowerCase().includes('cyp')
  );

  return (
    <div className="min-h-screen bg-[#090d13] text-[#c9d1d9] font-sans p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-[1180px] my-auto">
        <div className="bg-[#121721] border border-[#232b38] rounded-2xl p-6 sm:p-10 shadow-[0_20px_40px_rgba(0,0,0,0.7),0_0_25px_rgba(0,255,102,0.04)] backdrop-blur-md">
          
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-[rgba(0,255,102,0.08)] text-[#00ff66] border border-[rgba(0,255,102,0.25)] font-mono text-xs font-bold px-3 py-1 rounded-full tracking-wider uppercase">
                <Dna className="h-3.5 w-3.5" />
                CYP450 Molecular Engine
              </span>
              <span className="inline-flex items-center gap-1 bg-[rgba(0,229,255,0.08)] text-[#00e5ff] border border-[rgba(0,229,255,0.2)] font-mono text-[11px] px-2.5 py-1 rounded-full">
                <Activity className="h-3 w-3" />
                Isoenzyme Profiling
              </span>
            </div>
            {result && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#8b949e] hover:text-[#00ff66] transition-colors py-1 px-3 rounded-lg hover:bg-[#1a2230]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Form
              </button>
            )}
          </div>

          {/* Title & Subtitle */}
          <h1 className="font-mono text-2xl sm:text-3xl font-extrabold text-[#f0f6fc] tracking-tight mb-2">
            Food × Drug Interaction Analyzer
          </h1>
          <p className="text-[#8b949e] text-sm mb-6 leading-relaxed max-w-3xl">
            Predicting biochemical collisions, pharmacokinetic clearance bottlenecks, and Cytochrome P450 (CYP450) isoenzyme substrate-inhibitor clashes.
          </p>

          {/* Quick Presets */}
          <div className="mb-6">
            <span className="block text-[11px] font-mono uppercase tracking-wider text-[#6e7681] mb-2">
              Quick Benchmark Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              {BENCHMARK_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset.drug, preset.food)}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg bg-[#161f2e] border border-[#283548] text-[#8db2df] hover:border-[#00e5ff] hover:text-[#00e5ff] transition-all hover:bg-[#1a283e]"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              
              {/* Drug Input */}
              <div className="relative">
                <label className="block font-mono text-xs font-semibold text-[#00e5ff] uppercase tracking-wider mb-2">
                  01 / Pharmaceutical Agent (Drug)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={drug}
                    onChange={(e) => setDrug(e.target.value)}
                    placeholder="e.g. Simvastatin, Warfarin, Ciprofloxacin..."
                    className="w-full bg-[#0a0e16] border border-[#283548] rounded-xl px-4 py-3.5 text-[#00ff66] font-mono text-sm outline-none transition-all duration-200 focus:border-[#00ff66] focus:shadow-[0_0_12px_rgba(0,255,102,0.25)] placeholder-[#434d5d]"
                    required
                  />
                  <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-[#434d5d]" />
                </div>
              </div>

              {/* Food Input */}
              <div className="relative">
                <label className="block font-mono text-xs font-semibold text-[#00e5ff] uppercase tracking-wider mb-2">
                  02 / Dietary Component (Food / Bioactive)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={food}
                    onChange={(e) => setFood(e.target.value)}
                    placeholder="e.g. Grapefruit Juice, Vitamin K, Caffeine..."
                    className="w-full bg-[#0a0e16] border border-[#283548] rounded-xl px-4 py-3.5 text-[#00ff66] font-mono text-sm outline-none transition-all duration-200 focus:border-[#00ff66] focus:shadow-[0_0_12px_rgba(0,255,102,0.25)] placeholder-[#434d5d]"
                    required
                  />
                  <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-[#434d5d]" />
                </div>
              </div>

            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00ff66] text-[#010409] font-mono text-sm font-bold tracking-wider py-4 px-6 rounded-xl shadow-[0_4px_16px_rgba(0,255,102,0.3)] hover:bg-[#10b981] hover:shadow-[0_6px_24px_rgba(0,255,102,0.45)] hover:-translate-y-0.5 transition-all duration-200 disabled:bg-[#1b222d] disabled:text-[#4a5568] disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Activity className="h-4 w-4 animate-spin text-[#010409]" />
                  <span>ANALYZING METABOLIC COLLISION & CYP PATHWAYS...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>RUN ANALYTICAL PIPELINE</span>
                </>
              )}
            </button>
          </form>

          {/* ── Multi-Stage Analysis Loading Animation ── */}
          {loading && (
            <div className="mt-6 p-6 sm:p-8 rounded-xl bg-[#0a0e16] border border-[#00e5ff]/30 text-center animate-pulse">
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-[rgba(0,229,255,0.1)] border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff]">
                <Dna className="w-5 h-5 animate-spin" />
              </div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#8b949e] block mb-1">
                ANALYZING INTERACTION...
              </span>
              <span className="font-mono text-sm font-bold text-[#00e5ff] block mb-4">
                {ANALYSIS_STEPS[analysisStepIndex]}
              </span>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                {ANALYSIS_STEPS.map((s, idx) => (
                  <span
                    key={s}
                    className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all ${
                      idx <= analysisStepIndex
                        ? 'border-[#00e5ff]/40 text-[#00e5ff] bg-[rgba(0,229,255,0.1)]'
                        : 'border-[#283548] text-[#484f58] bg-[#121927]'
                    }`}
                  >
                    {s.replace('...', '')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Error Notice */}
          {errorMsg && (
            <div className="mt-6 p-4 rounded-xl bg-[rgba(255,0,85,0.08)] border border-[rgba(255,0,85,0.3)] text-[#ff0055] font-mono text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* RESULTS PANEL WITH CYP FEATURES                           */}
          {/* ══════════════════════════════════════════════════════════ */}
          {result && (
            <div ref={resultRef} className="mt-8 space-y-6">

              {/* ── 3D MOLECULAR INTERACTION SECTION ── */}
              <MolecularComparisonPanel
                drugName={result.drug || drug}
                foodName={result.food || food}
                interactionDetected={isInteractionDetected}
                severityLabel={
                  result.predicted_outcome ||
                  (isInteractionDetected
                    ? `${(result.interaction?.severity || 'MODERATE').toUpperCase()} INTERACTION`
                    : 'NO SIGNIFICANT INTERACTION')
                }
                drugSdf={result.drug_sdf}
                foodSdf={result.food_sdf}
                drugSmiles={result.drug_smiles}
                foodSmiles={result.food_smiles}
                affectedEnzymes={clashingEnzymes}
                mechanismDescription={descriptionText}
                drugTelemetry={result.telemetry?.drug}
                foodTelemetry={result.telemetry?.food}
                severityColor={
                  isInteractionDetected
                    ? (result.interaction?.severity === 'major' ? '#ef4444' : '#f59e0b')
                    : '#10b981'
                }
              />
              
              {/* Primary Interaction Outcome Banner */}
              <div
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl p-5 font-mono border transition-all ${
                  isInteractionDetected
                    ? 'bg-[rgba(255,0,85,0.08)] border-[rgba(255,0,85,0.35)] text-[#ff0055]'
                    : 'bg-[rgba(0,255,102,0.08)] border-[rgba(0,255,102,0.35)] text-[#00ff66]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {isInteractionDetected ? (
                    <AlertTriangle className="h-6 w-6 flex-shrink-0 text-[#ff0055]" />
                  ) : (
                    <CheckCircle className="h-6 w-6 flex-shrink-0 text-[#00ff66]" />
                  )}
                  <div>
                    <span className="font-bold text-base block tracking-tight">
                      {isInteractionDetected ? 'POTENTIAL INTERACTION DETECTED' : 'SAFE INTERACTION PROFILE'}
                    </span>
                    <span className="text-xs text-[#8b949e] font-sans">
                      {result.predicted_outcome || (isInteractionDetected ? 'Significant pharmacokinetic collision' : 'No clinically significant metabolic inhibition')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono self-end sm:self-auto">
                  {result.predicted_class && (
                    <span className="px-2.5 py-1 rounded bg-[#0a0e16] border border-current font-bold uppercase">
                      {result.predicted_class}
                    </span>
                  )}
                  {riskScore !== null && (
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-[#8b949e] block">Severity Index</span>
                      <span className="text-base font-bold">{riskScore} / 100</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mechanism / Description Box */}
              {descriptionText && (
                <div className="bg-[#0a0e16] border border-[#202938] rounded-xl p-4 sm:p-5 font-mono text-xs text-[#9aa7b9] leading-relaxed">
                  <div className="flex items-center gap-2 text-[#00e5ff] font-bold uppercase text-[11px] mb-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Pharmacological Interaction Mechanism</span>
                  </div>
                  <p>{descriptionText}</p>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────── */}
              {/* CYP450 ISOENZYME FEATURES SECTION                       */}
              {/* ──────────────────────────────────────────────────────── */}
              <div className="bg-[#0d121c] border border-[#232f42] rounded-xl p-5 sm:p-6 space-y-5">
                
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1c2738]">
                  <div>
                    <div className="flex items-center gap-2">
                      <Dna className="h-4 w-4 text-[#00e5ff]" />
                      <h2 className="font-mono text-sm sm:text-base font-bold text-[#f0f6fc] tracking-tight uppercase">
                        Cytochrome P450 (CYP450) Feature Analysis
                      </h2>
                    </div>
                    <p className="text-xs text-[#8b949e] mt-1 font-sans">
                      Clearance isoenzymes, substrate metabolic load, dietary inhibition/induction, and metabolic clashes.
                    </p>
                  </div>

                  {/* Clash Indicator Pill */}
                  <div>
                    {hasCypClash ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[rgba(255,0,85,0.15)] text-[#ff0055] border border-[rgba(255,0,85,0.4)] animate-pulse">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        CLASH ON {clashingEnzymes.join(', ')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[rgba(0,255,102,0.12)] text-[#00ff66] border border-[rgba(0,255,102,0.3)]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        NO CYP BOTTLENECK
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick CYP Feature Metric Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="bg-[#121927] border border-[#232f42] rounded-lg p-3">
                    <span className="text-[#8b949e] text-[10px] uppercase block">Isoenzymes Evaluated</span>
                    <span className="text-[#f0f6fc] text-lg font-bold">7</span>
                    <span className="text-[10px] text-[#6e7681] block">CYP1A2 to CYP3A4</span>
                  </div>

                  <div className={`border rounded-lg p-3 ${hasCypClash ? 'bg-[rgba(255,0,85,0.08)] border-[rgba(255,0,85,0.3)]' : 'bg-[#121927] border-[#232f42]'}`}>
                    <span className="text-[#8b949e] text-[10px] uppercase block">Metabolic Clashes</span>
                    <span className={`text-lg font-bold ${hasCypClash ? 'text-[#ff0055]' : 'text-[#00ff66]'}`}>
                      {clashingEnzymes.length}
                    </span>
                    <span className="text-[10px] text-[#6e7681] block">Substrate + Inhibitor</span>
                  </div>

                  <div className="bg-[#121927] border border-[#232f42] rounded-lg p-3">
                    <span className="text-[#8b949e] text-[10px] uppercase block">Drug Substrates</span>
                    <span className="text-[#00e5ff] text-lg font-bold">{substrateCount}</span>
                    <span className="text-[10px] text-[#6e7681] block">Active Clearance</span>
                  </div>

                  <div className="bg-[#121927] border border-[#232f42] rounded-lg p-3">
                    <span className="text-[#8b949e] text-[10px] uppercase block">Food Modulators</span>
                    <span className="text-[#e3b341] text-lg font-bold">{inhibitorCount + inducerCount}</span>
                    <span className="text-[10px] text-[#6e7681] block">{inhibitorCount} inh / {inducerCount} ind</span>
                  </div>
                </div>

                {/* CYP Isoenzyme Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                  {enzymeKeys.map((enzymeKey) => {
                    const enzyme = cypPathways[enzymeKey] || {
                      drug_substrate: false,
                      food_inhibitor: false,
                      food_inducer: false,
                      clash: false,
                      relevance: 'Low',
                      clinical_mechanism: 'No significant metabolic clearance overlap detected.'
                    };
                    const meta = CYP_CATALOG[enzymeKey] || { name: enzymeKey, role: 'Enzymatic clearance', clearance: '' };
                    const isExpanded = expandedEnzyme === enzymeKey;

                    return (
                      <div
                        key={enzymeKey}
                        className={`rounded-xl p-4 border transition-all ${
                          enzyme.clash
                            ? 'bg-[rgba(255,0,85,0.06)] border-[rgba(255,0,85,0.35)] shadow-[0_0_15px_rgba(255,0,85,0.1)]'
                            : enzyme.drug_substrate || enzyme.food_inhibitor || enzyme.food_inducer
                            ? 'bg-[#131b28] border-[#29384f]'
                            : 'bg-[#0f1520] border-[#1d2737]'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="font-mono text-sm font-extrabold text-[#f0f6fc] block tracking-wide">
                              {enzymeKey}
                            </span>
                            <span className="text-[11px] text-[#8b949e] block font-sans leading-tight">
                              {meta.role}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {enzyme.clash && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#ff0055] text-white uppercase tracking-wider animate-pulse">
                                CLASH
                              </span>
                            )}
                            <span
                              className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                                enzyme.relevance === 'High'
                                  ? 'bg-[rgba(255,0,85,0.15)] text-[#ff0055] border-[rgba(255,0,85,0.3)]'
                                  : enzyme.relevance === 'Medium'
                                  ? 'bg-[rgba(227,179,65,0.15)] text-[#e3b341] border-[rgba(227,179,65,0.3)]'
                                  : 'bg-[#161f2e] text-[#6e7681] border-[#232f42]'
                              }`}
                            >
                              {enzyme.relevance || 'LOW'}
                            </span>
                          </div>
                        </div>

                        {/* Three Key CYP Feature Badges */}
                        <div className="space-y-1.5 my-3 text-[11px] font-mono">
                          {/* Drug Substrate */}
                          <div className="flex items-center justify-between py-1 px-2 rounded bg-[#0a0e16]">
                            <span className="text-[#8b949e]">Drug Substrate:</span>
                            <span
                              className={`font-bold ${
                                enzyme.drug_substrate ? 'text-[#00e5ff]' : 'text-[#484f58]'
                              }`}
                            >
                              {enzyme.drug_substrate ? 'YES' : 'NO'}
                            </span>
                          </div>

                          {/* Food Inhibitor */}
                          <div className="flex items-center justify-between py-1 px-2 rounded bg-[#0a0e16]">
                            <span className="text-[#8b949e]">Food Inhibitor:</span>
                            <span
                              className={`font-bold ${
                                enzyme.food_inhibitor ? 'text-[#e3b341]' : 'text-[#484f58]'
                              }`}
                            >
                              {enzyme.food_inhibitor ? 'YES' : 'NO'}
                            </span>
                          </div>

                          {/* Food Inducer */}
                          <div className="flex items-center justify-between py-1 px-2 rounded bg-[#0a0e16]">
                            <span className="text-[#8b949e]">Food Inducer:</span>
                            <span
                              className={`font-bold ${
                                enzyme.food_inducer ? 'text-[#d2a8ff]' : 'text-[#484f58]'
                              }`}
                            >
                              {enzyme.food_inducer ? 'YES' : 'NO'}
                            </span>
                          </div>
                        </div>

                        {/* Mechanism Accordion Trigger */}
                        {enzyme.clinical_mechanism && (
                          <div className="pt-2 border-t border-[#1d2737]">
                            <button
                              type="button"
                              onClick={() => setExpandedEnzyme(isExpanded ? null : enzymeKey)}
                              className="w-full flex items-center justify-between text-[10px] font-mono text-[#8b949e] hover:text-[#00e5ff] transition-colors"
                            >
                              <span>{isExpanded ? 'Hide Mechanism' : 'View Clearance Impact'}</span>
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>

                            {isExpanded && (
                              <div className="mt-2 p-2.5 rounded bg-[#0a0e16] border border-[#232f42] text-[10px] font-sans text-[#a5b4c7] leading-relaxed animate-fadeIn">
                                <p>{enzyme.clinical_mechanism}</p>
                                <span className="block mt-1 text-[9px] font-mono text-[#6e7681]">
                                  {meta.clearance}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* CYP SHAP Attribution Bar (if returned by model) */}
                {cypShapFeatures.length > 0 && (
                  <div className="pt-4 border-t border-[#1c2738]">
                    <span className="block text-[11px] font-mono uppercase text-[#00e5ff] font-bold mb-2">
                      CYP450 SHAP Feature Attribution Weight
                    </span>
                    <div className="space-y-2 font-mono text-xs">
                      {cypShapFeatures.map((shap, idx) => (
                        <div key={idx} className="bg-[#121927] border border-[#232f42] rounded-lg p-2.5 flex items-center justify-between gap-3">
                          <span className="text-[#c9d1d9] truncate text-[11px]">
                            {shap.feature}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                shap.positive
                                  ? 'bg-[rgba(255,0,85,0.15)] text-[#ff0055]'
                                  : 'bg-[rgba(0,255,102,0.15)] text-[#00ff66]'
                              }`}
                            >
                              {shap.impact > 0 ? `+${shap.impact}` : shap.impact}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
              {/* End of CYP450 Isoenzyme Features Section */}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}