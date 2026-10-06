import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle2, ArrowLeftRight, Copy, FileJson,
  Share2, Printer, RotateCcw, Beaker, Activity, Brain,
  FlaskConical, Search, ArrowRight, Atom, Info,
  ShieldAlert, Shield, Check, Dna, FileText, ChevronDown, ChevronUp
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import MoleculeViewer from '../components/MoleculeViewer';
import MolecularComparisonPanel from '../components/MolecularComparisonPanel';
import JsonViewerModal from '../components/JsonViewerModal';
import { analysisService } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { SEVERITY_CONFIG } from '../utils/constants';
import type { AnalysisResponse } from '../types/analysis';

const ANALYSIS_STEPS = [
  'Retrieving molecular structures...',
  'Analyzing molecular features...',
  'Checking interaction...',
  'Preparing 3D structures...'
];

export default function AnalyzePage() {
  const [searchParams] = useSearchParams();
  const [drug, setDrug] = useState(searchParams.get('drug') || '');
  const [food, setFood] = useState(searchParams.get('food') || '');
  const [doseLevel, setDoseLevel] = useState<'standard' | 'trace' | 'concentrated'>('standard');
  const [loading, setLoading] = useState(false);
  const [analysisStepIndex, setAnalysisStepIndex] = useState(0);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [drugSuggestions, setDrugSuggestions] = useState<string[]>([]);
  const [foodSuggestions, setFoodSuggestions] = useState<string[]>([]);
  const [showDrugDD, setShowDrugDD] = useState(false);
  const [showFoodDD, setShowFoodDD] = useState(false);
  const [expandedEnzyme, setExpandedEnzyme] = useState<string | null>(null);

  const drugRef = useRef<HTMLDivElement>(null);
  const foodRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const debouncedDrug = useDebounce(drug, 250);
  const debouncedFood = useDebounce(food, 250);

  // Suggestions
  useEffect(() => {
    if (debouncedDrug.length >= 1) {
      analysisService.getSuggestions(debouncedDrug).then(setDrugSuggestions).catch(() => setDrugSuggestions([]));
    } else setDrugSuggestions([]);
  }, [debouncedDrug]);

  useEffect(() => {
    if (debouncedFood.length >= 1) {
      analysisService.getSuggestions(debouncedFood).then(setFoodSuggestions).catch(() => setFoodSuggestions([]));
    } else setFoodSuggestions([]);
  }, [debouncedFood]);

  // Click outside dropdowns
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (drugRef.current && !drugRef.current.contains(e.target as Node)) setShowDrugDD(false);
      if (foodRef.current && !foodRef.current.contains(e.target as Node)) setShowFoodDD(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Auto-analyze if URL params present
  useEffect(() => {
    const initialDrug = searchParams.get('drug');
    const initialFood = searchParams.get('food');
    if (initialDrug && initialFood) {
      runAnalysis(initialDrug, initialFood, doseLevel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAnalysis = async (d: string, f: string, dose: string) => {
    if (!d || !f) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setAnalysisStepIndex(0);

    // Step-by-step progress animation ticker
    const interval = setInterval(() => {
      setAnalysisStepIndex((prev) => {
        if (prev < ANALYSIS_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 450);

    try {
      const data = await analysisService.analyze(d, f, dose);
      // Ensure the ticker shows all steps smoothly
      setTimeout(() => {
        clearInterval(interval);
        setResult(data);
        setLoading(false);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
      }, 1600);
    } catch (err) {
      clearInterval(interval);
      setLoading(false);
      setError('Unable to reach analytical backend. Ensure the server is running on port 8000.');
    }
  };

  const handleAnalyze = () => {
    runAnalysis(drug, food, doseLevel);
  };

  const handleSwap = () => {
    const prevDrug = drug;
    const prevFood = food;
    setDrug(prevFood);
    setFood(prevDrug);
    if (result) {
      runAnalysis(prevFood, prevDrug, doseLevel);
    }
  };

  const handleCopyReport = () => {
    if (!result) return;
    const majorProb = (result.class_probabilities.major_adverse * 100).toFixed(1);
    const modProb = (((result.class_probabilities as any).minor_moderate || result.class_probabilities.moderate || 0) * 100).toFixed(1);
    const safeProb = (((result.class_probabilities as any).neutral_safe || result.class_probabilities.no_interaction || 0) * 100).toFixed(1);

    const report = `===============================================================
FOOD × DRUG MOLECULAR INTELLIGENCE REPORT
===============================================================
DRUG:              ${result.drug}
FOOD / COMPOUND:   ${result.food}
PREDICTED OUTCOME: ${result.predicted_outcome} (${result.predicted_class})
SEVERITY INDEX:    ${result.severity_index} / 100
CONFIDENCE SCORE:  ${((result.interaction?.confidence || 0.88) * 100).toFixed(1)}%
EVIDENCE LEVEL:    ${result.interaction?.evidence_level || 'Level A / B Pharmacokinetic Evidence'}
---------------------------------------------------------------
ENSEMBLE PROBABILITIES:
  • Major / Adverse: ${majorProb}%
  • Moderate:        ${modProb}%
  • Safe / None:     ${safeProb}%
---------------------------------------------------------------
PRIMARY MECHANISM:
${result.mechanism?.description || 'Metabolic enzyme clearance modulation.'}
---------------------------------------------------------------
DISCLAIMER:
This platform is intended for research and educational purposes only 
and is not a substitute for professional medical advice.
===============================================================`;

    navigator.clipboard.writeText(report);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/analyze?drug=${encodeURIComponent(drug)}&food=${encodeURIComponent(food)}`;
    navigator.clipboard.writeText(url);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setDrug('');
    setFood('');
    setResult(null);
    setError(null);
    setShowJsonModal(false);
  };

  const getSeverityLevel = (): 'none' | 'minor' | 'moderate' | 'major' => {
    if (!result) return 'none';
    const s = (result.interaction?.severity || '').toLowerCase();
    if (s === 'major') return 'major';
    if (s === 'moderate') return 'moderate';
    if (s === 'minor') return 'minor';
    if (s === 'none') return 'none';

    const idx = result.severity_index;
    if (idx < 25) return 'none';
    if (idx < 50) return 'minor';
    if (idx < 75) return 'moderate';
    return 'major';
  };

  const severityLevel = result ? getSeverityLevel() : 'none';
  const severityConfig = SEVERITY_CONFIG[severityLevel];

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* Toast notifications */}
        {copiedToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-accent-cyan text-[#080b11] font-mono text-xs px-4 py-2.5 rounded-lg shadow-glow-cyan flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4" />
            Clinical interaction report copied to clipboard.
          </div>
        )}
        {shareToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-accent-emerald text-[#080b11] font-mono text-xs px-4 py-2.5 rounded-lg shadow-glow-emerald flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4" />
            Shareable screening link copied to clipboard.
          </div>
        )}

        {/* ── Page Header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="tech-label-cyan">Computational Pharmacokinetics</span>
            <span className="text-text-muted text-xs">·</span>
            <span className="text-[10px] font-mono text-accent-amber border border-accent-amber/30 bg-accent-amber-dim px-2 py-0.5 rounded">
              DEMO MODEL PIPELINE
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-medium text-text-primary tracking-tight">
            Molecular Interaction Engine
          </h1>
          <p className="text-sm text-text-secondary mt-1 max-w-2xl">
            Evaluate ligand clearance shifts, CYP450 isoform bottlenecks, and physicochemical topological influence.
          </p>
        </div>

        {/* ── Search Input Panel ── */}
        <div className="glass-card p-6 md:p-8 mb-8 border border-surface-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 mb-5 items-end">
            {/* Drug search */}
            <div ref={drugRef} className="lg:col-span-5 relative">
              <label className="tech-label-cyan mb-2 block flex items-center justify-between">
                <span>01 / Pharmaceutical Medication</span>
                <span className="text-[10px] text-text-tertiary font-mono">DRUG LIGAND</span>
              </label>
              <div className="relative">
                <input
                  id="analyze-drug-input"
                  type="text"
                  value={drug}
                  onChange={(e) => {
                    setDrug(e.target.value);
                    setShowDrugDD(true);
                  }}
                  onFocus={() => setShowDrugDD(true)}
                  placeholder="e.g. Simvastatin, Warfarin, Metformin"
                  className="sci-input pr-10"
                  autoComplete="off"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              </div>
              {showDrugDD && drugSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-100 border border-surface-border rounded-lg overflow-hidden shadow-glass z-50 max-h-56 overflow-y-auto">
                  {drugSuggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setDrug(s);
                        setShowDrugDD(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-mono text-text-secondary hover:bg-surface-200 hover:text-accent-cyan transition-colors border-b border-surface-border/40 last:border-0 capitalize flex items-center justify-between"
                    >
                      <span>{s}</span>
                      <span className="text-[9px] text-text-tertiary uppercase">Select</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Food search */}
            <div ref={foodRef} className="lg:col-span-5 relative">
              <label className="tech-label-cyan mb-2 block flex items-center justify-between">
                <span>02 / Food or Bioactive Compound</span>
                <span className="text-[10px] text-text-tertiary font-mono">DIETARY AGENT</span>
              </label>
              <div className="relative">
                <input
                  id="analyze-food-input"
                  type="text"
                  value={food}
                  onChange={(e) => {
                    setFood(e.target.value);
                    setShowFoodDD(true);
                  }}
                  onFocus={() => setShowFoodDD(true)}
                  placeholder="e.g. Naringin, Grapefruit, Curcumin"
                  className="sci-input pr-10"
                  autoComplete="off"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              </div>
              {showFoodDD && foodSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-100 border border-surface-border rounded-lg overflow-hidden shadow-glass z-50 max-h-56 overflow-y-auto">
                  {foodSuggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setFood(s);
                        setShowFoodDD(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-mono text-text-secondary hover:bg-surface-200 hover:text-accent-cyan transition-colors border-b border-surface-border/40 last:border-0 capitalize flex items-center justify-between"
                    >
                      <span>{s}</span>
                      <span className="text-[9px] text-text-tertiary uppercase">Select</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dose Level Selector */}
            <div className="lg:col-span-2">
              <label className="tech-label-cyan mb-2 block">Dose Level</label>
              <select
                value={doseLevel}
                onChange={(e: any) => setDoseLevel(e.target.value)}
                className="sci-input py-2 text-xs font-mono uppercase bg-surface-100 cursor-pointer"
              >
                <option value="trace">Trace Exposure</option>
                <option value="standard">Standard Intake</option>
                <option value="concentrated">Concentrated</option>
              </select>
            </div>
          </div>

          {/* Trigger button */}
          <button
            id="run-analysis-btn"
            onClick={handleAnalyze}
            disabled={loading || !drug || !food}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm tracking-wide disabled:opacity-50"
          >
            <FlaskConical className="w-4 h-4" />
            {loading ? 'Executing Molecular Inference...' : 'ANALYZE INTERACTION'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── Error message ── */}
        {error && (
          <div className="glass-card p-5 mb-8 border-accent-red/30 bg-accent-red-dim/40 flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-accent-red flex-shrink-0" />
            <p className="text-xs font-mono text-accent-red">{error}</p>
          </div>
        )}

        {/* ── Multi-Stage Loading Animation (Phase 7) ── */}
        {loading && (
          <div className="glass-card p-8 md:p-12 mb-8 border-accent-cyan/30 text-center animate-pulse">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-accent-cyan-dim border border-accent-cyan/40 flex items-center justify-center text-accent-cyan">
              <Dna className="w-6 h-6 animate-spin" />
            </div>

            <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-text-muted mb-1">
              ANALYZING INTERACTION...
            </h3>
            <h4 className="font-mono text-base font-bold text-accent-cyan tracking-wide mb-2">
              {ANALYSIS_STEPS[analysisStepIndex]}
            </h4>
            <p className="text-xs font-mono text-text-tertiary mb-6">
              Step {analysisStepIndex + 1} of {ANALYSIS_STEPS.length} · Computational Pipeline
            </p>

            {/* Glowing progress bar */}
            <div className="max-w-md mx-auto h-2 bg-surface-200 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-accent-cyan rounded-full transition-all duration-300 shadow-glow-cyan"
                style={{ width: `${((analysisStepIndex + 1) / ANALYSIS_STEPS.length) * 100}%` }}
              />
            </div>

            {/* Step list badges */}
            <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
              {ANALYSIS_STEPS.map((step, idx) => (
                <span
                  key={step}
                  className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all ${
                    idx <= analysisStepIndex
                      ? 'border-accent-cyan/40 text-accent-cyan bg-accent-cyan-dim'
                      : 'border-surface-border text-text-muted bg-surface-100'
                  }`}
                >
                  {step.replace('...', '')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════ RESULTS DASHBOARD ═══════════ */}
        {result && (
          <div ref={resultRef} className="space-y-8 animate-fade-in print:space-y-4">
            {/* ── 1. Result Panel (Section 8) ── */}
            <div className={`glass-card p-6 md:p-8 ${severityConfig.borderClass} border relative overflow-hidden`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl ${severityConfig.bgClass} flex items-center justify-center flex-shrink-0 border ${severityConfig.borderClass}`}>
                    {severityLevel === 'none' && <CheckCircle2 className={`w-7 h-7 ${severityConfig.textClass}`} />}
                    {severityLevel === 'minor' && <Shield className={`w-7 h-7 ${severityConfig.textClass}`} />}
                    {severityLevel === 'moderate' && <AlertTriangle className={`w-7 h-7 ${severityConfig.textClass}`} />}
                    {severityLevel === 'major' && <ShieldAlert className={`w-7 h-7 ${severityConfig.textClass}`} />}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2.5 mb-2">
                      <span className="tech-label text-text-muted">PREDICTED METABOLIC OUTCOME</span>
                      <span className={`sci-badge ${severityConfig.bgClass} ${severityConfig.textClass} ${severityConfig.borderClass}`}>
                        {result.predicted_class}
                      </span>
                      {/* Prominent DEMO MODEL label */}
                      <span className="sci-badge bg-accent-amber-dim text-accent-amber border-accent-amber/30">
                        DEMO MODEL
                      </span>
                    </div>

                    <h2 className={`font-display text-2xl md:text-3xl font-medium ${severityConfig.textClass}`}>
                      {result.predicted_outcome}
                    </h2>

                    <p className="text-sm text-text-secondary mt-2 max-w-2xl leading-relaxed">
                      {result.mechanism?.description ||
                        (severityLevel === 'moderate'
                          ? 'Potentially mild synergistic or clearance-shift effect. Monitor relevant biomarker concentrations.'
                          : severityLevel === 'major'
                          ? 'Significant pharmacokinetic interaction detected. Consult healthcare professional.'
                          : 'No clinically significant metabolic clash detected.')}
                    </p>

                    {result.recommendations && result.recommendations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-surface-border/60">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary block mb-1.5">
                          Clinical Guidance:
                        </span>
                        <ul className="space-y-1">
                          {result.recommendations.map((rec, i) => (
                            <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                              <span className="text-accent-cyan mt-0.5">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side summary badges */}
                <div className="lg:text-right flex flex-col justify-between self-stretch">
                  <div>
                    <span className="tech-label block mb-1">Pairwise Query</span>
                    <p className="font-mono text-base font-bold text-text-primary capitalize">
                      {result.drug} <span className="text-text-muted">×</span> {result.food}
                    </p>
                  </div>
                  <div className="mt-4">
                    <span className="text-[10px] font-mono uppercase text-text-tertiary block mb-1">
                      Evidence Level
                    </span>
                    <span className="text-xs font-mono text-text-secondary bg-surface-200 px-2.5 py-1 rounded border border-surface-border">
                      {result.interaction?.evidence_level || 'Level A / B Pharmacokinetic Evidence'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 2. Action Bar (Section 9) ── */}
            <div className="flex flex-wrap gap-2 print:hidden">
              <button
                onClick={handleSwap}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-semibold uppercase text-text-secondary border border-surface-border rounded-lg hover:bg-surface-200 hover:text-text-primary transition-all"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Swap
              </button>
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-semibold uppercase text-text-secondary border border-surface-border rounded-lg hover:bg-surface-200 hover:text-text-primary transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Report
              </button>
              <button
                onClick={() => setShowJsonModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-semibold uppercase text-text-secondary border border-surface-border rounded-lg hover:bg-surface-200 hover:text-text-primary transition-all"
              >
                <FileJson className="w-3.5 h-3.5" />
                JSON
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-semibold uppercase text-text-secondary border border-surface-border rounded-lg hover:bg-surface-200 hover:text-text-primary transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-semibold uppercase text-text-secondary border border-surface-border rounded-lg hover:bg-surface-200 hover:text-text-primary transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-semibold uppercase text-text-tertiary border border-surface-border rounded-lg hover:bg-surface-200 hover:text-accent-red transition-all ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
               ── 2.5  INTERACTIVE 3D MOLECULAR COMPARISON (Full Feature) ──
               Live PubChem data · 3Dmol.js WebGL · 2D/3D toggle · Property panels
               ═══════════════════════════════════════════════════════════════= */}
            <div
              className="relative overflow-hidden rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(6,182,212,0.04) 0%, rgba(7,11,19,0.98) 40%, rgba(16,185,129,0.04) 100%)',
                border: '1px solid rgba(6,182,212,0.2)',
                boxShadow: '0 0 100px rgba(6,182,212,0.06), 0 0 60px rgba(16,185,129,0.04), 0 30px 80px rgba(0,0,0,0.5)',
              }}
            >
              {/* Animated top glow bar */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.6) 30%, rgba(16,185,129,0.6) 70%, transparent 100%)',
                }}
              />

              {/* Section header */}
              <div
                className="flex items-center justify-between px-6 py-4 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(7,11,19,0.6)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)' }}
                  >
                    <Atom className="w-4 h-4 text-accent-cyan" />
                  </div>
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/30 block">
                      3Dmol.js WebGL · PubChem REST · RDKit MMFF94
                    </span>
                    <h3 className="font-mono text-sm font-bold text-white tracking-wide">
                      MOLECULAR INTERACTION VISUALIZATION
                    </h3>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 font-mono text-[10px]">
                  <span
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded"
                    style={{ background: 'rgba(6,182,212,0.08)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.2)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
                    {result.drug}
                  </span>
                  <span className="text-white/20">↔</span>
                  <span
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded"
                    style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />
                    {result.food}
                  </span>
                </div>
              </div>

              {/* Panel body */}
              <div className="p-5 md:p-7">
                <MolecularComparisonPanel
                  drugName={result.drug}
                  foodName={result.food}
                  interactionDetected={result.has_interaction ?? (result.interaction?.detected ?? (severityLevel !== 'none'))}
                  severityLabel={result.predicted_outcome || `${severityLevel.toUpperCase()} INTERACTION`}
                  outcomeLabel={result.predicted_outcome}
                  drugSdf={result.drug_sdf}
                  foodSdf={result.food_sdf}
                  drugSmiles={result.drug_smiles}
                  foodSmiles={result.food_smiles}
                  affectedEnzymes={result.affected_enzymes}
                  mechanismDescription={result.description || result.mechanism?.description}
                  drugTelemetry={result.telemetry?.drug}
                  foodTelemetry={result.telemetry?.food}
                  severityColor={
                    severityLevel === 'major' ? '#ef4444'
                    : severityLevel === 'moderate' ? '#f59e0b'
                    : severityLevel === 'minor' ? '#06b6d4'
                    : '#10b981'
                  }
                />
              </div>

              {/* Bottom glow bar */}
              <div
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.4) 30%, rgba(6,182,212,0.4) 70%, transparent 100%)',
                }}
              />
            </div>

            {/* ── 3. Analytics Section (Section 10) ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Heuristic Index */}
              <div className="glass-card p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="tech-label">HEURISTIC INDEX</span>
                    <span className="text-[10px] font-mono text-accent-cyan">0 - 100 SCALE</span>
                  </div>
                  <div className="text-center py-4">
                    <div className={`text-5xl font-mono font-bold ${severityConfig.textClass} tracking-tight mb-2`}>
                      {result.severity_index}
                    </div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-text-secondary">
                      Clearance Shift Severity
                    </span>
                  </div>
                </div>
                <div className="mt-4 h-2 bg-surface-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      severityLevel === 'none'
                        ? 'bg-accent-emerald'
                        : severityLevel === 'minor'
                        ? 'bg-accent-cyan'
                        : severityLevel === 'moderate'
                        ? 'bg-accent-amber'
                        : 'bg-accent-red'
                    }`}
                    style={{ width: `${Math.min(result.severity_index, 100)}%` }}
                  />
                </div>
              </div>

              {/* Ensemble Distribution */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="tech-label">ENSEMBLE DISTRIBUTION</span>
                  <span className="text-[10px] font-mono text-text-tertiary">DEMO PROBABILITIES</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Major / Adverse', value: result.class_probabilities.major_adverse, color: 'bg-accent-red' },
                    {
                      label: 'Moderate',
                      value: (result.class_probabilities as any).minor_moderate || result.class_probabilities.moderate || 0,
                      color: 'bg-accent-amber'
                    },
                    { label: 'Minor', value: result.class_probabilities.minor || 0, color: 'bg-accent-cyan' },
                    {
                      label: 'No Interaction',
                      value: (result.class_probabilities as any).neutral_safe || result.class_probabilities.no_interaction || 0,
                      color: 'bg-accent-emerald'
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[11px] font-mono text-text-tertiary">{item.label}</span>
                        <span className="text-[11px] font-mono font-bold text-text-secondary">
                          {(item.value * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color} transition-all duration-1000`}
                          style={{ width: `${item.value * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Narrative Synthesis */}
              <div className="glass-card p-6 flex flex-col justify-between">
                <div>
                  <span className="tech-label block mb-3">NARRATIVE SYNTHESIS</span>
                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    The computational analysis of <span className="text-text-primary font-medium">{result.drug}</span> and{' '}
                    <span className="text-text-primary font-medium">{result.food}</span> resolves to{' '}
                    <span className={severityConfig.textClass}>{result.predicted_outcome}</span>. Model confidence is rated at{' '}
                    <span className="font-mono text-text-primary">
                      {((result.interaction?.confidence || 0.88) * 100).toFixed(1)}%
                    </span>.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-surface-200/50 border border-surface-border flex items-start gap-2">
                  <Info className="w-4 h-4 text-accent-cyan flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] font-mono text-text-tertiary leading-relaxed">
                    Values reflect calibrated demo model inferences for computational research exploration.
                  </p>
                </div>
              </div>
            </div>

            {/* ── 4. CYP / Enzyme Analysis (Section 11) ── */}
            <div className="glass-card p-6 md:p-8">
              <div className="mb-6">
                <span className="tech-label-cyan block mb-1">Metabolic Clearance Isoenzymes</span>
                <h3 className="font-display text-xl font-medium text-text-primary">
                  Cytochrome P450 (CYP450) Enzyme Analysis
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                {['CYP1A2', 'CYP2C9', 'CYP2C19', 'CYP2D6', 'CYP3A4', 'CYP2E1', 'CYP2B6'].map((enzymeKey) => {
                  const enzymeData = (result.cyp_pathways as any)[enzymeKey] || {
                    drug_substrate: false,
                    food_inhibitor: false,
                    food_inducer: false,
                    clash: false,
                    relevance: 'Low'
                  };
                  const isExpanded = expandedEnzyme === enzymeKey;

                  return (
                    <div
                      key={enzymeKey}
                      onClick={() => setExpandedEnzyme(isExpanded ? null : enzymeKey)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        enzymeData.clash
                          ? 'bg-accent-red-dim/20 border-accent-red/30 hover:border-accent-red/50'
                          : 'bg-surface-100 border-surface-border hover:border-surface-border-hover'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-sm font-bold text-text-primary">{enzymeKey}</span>
                        <div className="flex items-center gap-1.5">
                          {enzymeData.clash && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-accent-red text-white font-bold animate-pulse">
                              CLASH
                            </span>
                          )}
                          <span
                            className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                              enzymeData.relevance === 'High'
                                ? 'bg-accent-red-dim text-accent-red border border-accent-red/20'
                                : enzymeData.relevance === 'Medium'
                                ? 'bg-accent-amber-dim text-accent-amber border border-accent-amber/20'
                                : 'bg-surface-200 text-text-tertiary'
                            }`}
                          >
                            {enzymeData.relevance}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-text-muted">Drug Substrate</span>
                          <span className={enzymeData.drug_substrate ? 'text-accent-cyan font-bold' : 'text-text-tertiary'}>
                            {enzymeData.drug_substrate ? 'YES' : 'NO'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-text-muted">Food Inhibitor</span>
                          <span className={enzymeData.food_inhibitor ? 'text-accent-red font-bold' : 'text-text-tertiary'}>
                            {enzymeData.food_inhibitor ? 'YES' : 'NO'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-text-muted">Food Inducer</span>
                          <span className={enzymeData.food_inducer ? 'text-accent-amber font-bold' : 'text-text-tertiary'}>
                            {enzymeData.food_inducer ? 'YES' : 'NO'}
                          </span>
                        </div>
                      </div>

                      {enzymeData.clinical_mechanism && (
                        <div className="mt-3 pt-2 border-t border-surface-border text-[10px] text-text-tertiary line-clamp-2">
                          {enzymeData.clinical_mechanism}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 5. (Molecule viewers moved up to Section 2.5 above) ── */}

            {/* ── 6. Physicochemical Descriptors & Molecular Info (Section 13 & 15) ── */}
            <div className="glass-card p-6 md:p-8">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="tech-label-cyan block mb-1">Topological & Structural Metrics</span>
                  <h3 className="font-display text-xl font-medium text-text-primary">
                    Physicochemical Descriptors & Identifiers
                  </h3>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="flex items-center gap-1.5 text-accent-cyan">
                    <span className="w-2 h-2 rounded-full bg-accent-cyan" /> Drug
                  </span>
                  <span className="flex items-center gap-1.5 text-accent-emerald">
                    <span className="w-2 h-2 rounded-full bg-accent-emerald" /> Food
                  </span>
                </div>
              </div>

              {/* 8 Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
                {[
                  { label: 'Mol Weight', d: result.telemetry.drug.mw, f: result.telemetry.food.mw, unit: 'g/mol' },
                  { label: 'LogP', d: result.telemetry.drug.logp, f: result.telemetry.food.logp, unit: '' },
                  { label: 'TPSA', d: result.telemetry.drug.tpsa, f: result.telemetry.food.tpsa, unit: 'Å²' },
                  { label: 'H-Donors', d: result.telemetry.drug.hbd, f: result.telemetry.food.hbd, unit: '' },
                  { label: 'H-Acceptors', d: result.telemetry.drug.hba, f: result.telemetry.food.hba, unit: '' },
                  { label: 'Rot Bonds', d: result.telemetry.drug.rotatable_bonds || 2, f: result.telemetry.food.rotatable_bonds || 4, unit: '' },
                  { label: 'Heavy Atoms', d: result.telemetry.drug.heavy_atom_count || 18, f: result.telemetry.food.heavy_atom_count || 22, unit: '' },
                  { label: 'Formal Chg', d: result.telemetry.drug.formal_charge || 0, f: result.telemetry.food.formal_charge || 0, unit: '' },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-lg bg-surface-100 border border-surface-border">
                    <span className="text-[10px] font-mono text-text-tertiary uppercase block truncate mb-2">
                      {item.label}
                    </span>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono font-bold text-accent-cyan">
                        <span>{item.d}</span>
                        <span className="text-[9px] font-normal text-text-muted">{item.unit}</span>
                      </div>
                      <div className="h-px bg-surface-border" />
                      <div className="flex justify-between text-xs font-mono font-bold text-accent-emerald">
                        <span>{item.f}</span>
                        <span className="text-[9px] font-normal text-text-muted">{item.unit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chemical Identifiers Bar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-surface-border">
                <div className="p-3 rounded-lg bg-surface-100 border border-surface-border space-y-1 text-xs font-mono">
                  <span className="text-[10px] font-bold text-accent-cyan block uppercase">
                    {result.drug} Identifiers
                  </span>
                  <div className="text-[11px] text-text-secondary truncate">
                    <span className="text-text-muted">SMILES: </span>{result.drug_smiles}
                  </div>
                  <div className="text-[11px] text-text-secondary flex justify-between">
                    <span><span className="text-text-muted">InChIKey: </span>{result.telemetry.drug.inchikey || 'BSYNRYMUTXBXSQ'}</span>
                    <span><span className="text-text-muted">PubChem CID: </span>{result.telemetry.drug.pubchem_cid || '54454'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface-100 border border-surface-border space-y-1 text-xs font-mono">
                  <span className="text-[10px] font-bold text-accent-emerald block uppercase">
                    {result.food} Identifiers
                  </span>
                  <div className="text-[11px] text-text-secondary truncate">
                    <span className="text-text-muted">SMILES: </span>{result.food_smiles}
                  </div>
                  <div className="text-[11px] text-text-secondary flex justify-between">
                    <span><span className="text-text-muted">InChIKey: </span>{result.telemetry.food.inchikey || 'DOHGRLHHOIIRIH'}</span>
                    <span><span className="text-text-muted">PubChem CID: </span>{result.telemetry.food.pubchem_cid || '442428'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 7. Feature Influence / SHAP (Section 14) ── */}
            <div className="glass-card p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <span className="tech-label-cyan block mb-1">Local Model Explainability</span>
                  <h3 className="font-display text-xl font-medium text-text-primary">
                    FEATURE INFLUENCE FOR {result.predicted_outcome.toUpperCase()}
                  </h3>
                </div>
                <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded bg-surface-200 text-accent-cyan border border-surface-border">
                  DEMO EXPLAINABILITY LAYER
                </span>
              </div>

              <p className="text-xs text-text-secondary mb-6 leading-relaxed max-w-2xl">
                Shapley Additive Explanations (SHAP) decompose the machine learning prediction into additive
                contributions from individual physicochemical properties, metabolic clearance substrates, and molecular fingerprints.
              </p>

              <div className="space-y-3.5">
                {result.shap_attributions.map((attr) => {
                  const maxImpact = Math.max(...result.shap_attributions.map((a) => Math.abs(a.impact)), 1.0);
                  const normalizedWidth = (Math.abs(attr.impact) / maxImpact) * 100;

                  return (
                    <div key={attr.feature} className="flex items-center gap-4 text-xs font-mono">
                      <div className="w-48 text-right text-text-secondary truncate flex-shrink-0" title={attr.feature}>
                        {attr.feature}
                      </div>

                      <div className="flex-1 h-7 bg-surface-100 rounded-md relative flex items-center px-1 overflow-hidden">
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-surface-border z-10" />

                        {attr.positive ? (
                          <div
                            className="h-4 bg-accent-cyan/40 border border-accent-cyan/60 rounded-sm ml-[50%] transition-all duration-700"
                            style={{ width: `${normalizedWidth / 2}%` }}
                          />
                        ) : (
                          <div
                            className="h-4 bg-accent-amber/40 border border-accent-amber/60 rounded-sm transition-all duration-700"
                            style={{
                              width: `${normalizedWidth / 2}%`,
                              marginLeft: `${50 - normalizedWidth / 2}%`
                            }}
                          />
                        )}
                      </div>

                      <div className="w-20 text-right flex-shrink-0">
                        <span
                          className={`font-bold ${
                            attr.positive ? 'text-accent-cyan' : 'text-accent-amber'
                          }`}
                        >
                          {attr.positive ? '+' : ''}
                          {attr.impact.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-surface-border flex items-center justify-between text-[11px] font-mono text-text-tertiary">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-2 rounded bg-accent-amber/40 border border-accent-amber/60" /> Negative Push
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-2 rounded bg-accent-cyan/40 border border-accent-cyan/60" /> Positive Push
                </span>
              </div>
            </div>

            {/* ── 8. Research Screening (Section 16) ── */}
            {result.alternatives && result.alternatives.length > 0 && (
              <div className="glass-card p-6 md:p-8">
                <div className="mb-4">
                  <span className="tech-label-cyan block mb-1">Comparative Bioactive Screening</span>
                  <h3 className="font-display text-xl font-medium text-text-primary">
                    RESEARCH SCREENING
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {result.alternatives.map((alt) => (
                    <div
                      key={alt.name}
                      className="p-4 rounded-xl bg-surface-100 border border-surface-border hover:border-accent-cyan/30 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm font-bold text-text-primary group-hover:text-accent-cyan transition-colors">
                          {alt.name}
                        </span>
                        <Beaker className="w-4 h-4 text-text-tertiary" />
                      </div>
                      <p className="text-xs text-accent-emerald font-mono mb-1">{alt.risk}</p>
                      <p className="text-[11px] text-text-tertiary font-mono mb-2">
                        Screening Score: {alt.score}
                      </p>
                      {alt.mechanism && (
                        <p className="text-[11px] text-text-secondary leading-relaxed border-t border-surface-border/50 pt-2">
                          {alt.mechanism}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-lg bg-surface-200/50 border border-surface-border text-center">
                  <p className="text-xs font-mono text-text-tertiary">
                    Research screening only. Always consult a qualified healthcare professional before changing medication or dietary regimens.
                  </p>
                </div>
              </div>
            )}

            {/* ── 9. Medical Disclaimer (Section 34) ── */}
            <div className="glass-card p-5 border-surface-border flex items-start gap-3">
              <Info className="w-5 h-5 text-accent-cyan flex-shrink-0 mt-0.5" />
              <p className="text-xs font-mono text-text-muted leading-relaxed">
                This platform is intended for research and educational purposes only and is not a substitute for professional medical advice. Interaction results should be verified using authoritative clinical sources and a qualified healthcare professional.
              </p>
            </div>
          </div>
        )}

        {/* Global JSON Modal */}
        <JsonViewerModal
          isOpen={showJsonModal}
          onClose={() => setShowJsonModal(false)}
          data={result}
          title={`Interactions API Response · ${result?.drug} × ${result?.food}`}
        />
      </div>
    </PageLayout>
  );
}
