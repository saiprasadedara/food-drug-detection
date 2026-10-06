import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical, Search, ArrowRight, Atom, Brain, ShieldCheck,
  Database, Dna, Activity, ChevronRight, Sparkles, Beaker
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import { BENCHMARK_PAIRINGS, DATA_SOURCES, INTELLIGENCE_LAYERS, SEVERITY_CONFIG } from '../utils/constants';
import { analysisService } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';

export default function HomePage() {
  const navigate = useNavigate();
  const [drug, setDrug] = useState('');
  const [food, setFood] = useState('');
  const [drugSuggestions, setDrugSuggestions] = useState<string[]>([]);
  const [foodSuggestions, setFoodSuggestions] = useState<string[]>([]);
  const [showDrugDropdown, setShowDrugDropdown] = useState(false);
  const [showFoodDropdown, setShowFoodDropdown] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const drugRef = useRef<HTMLDivElement>(null);
  const foodRef = useRef<HTMLDivElement>(null);

  const debouncedDrug = useDebounce(drug, 300);
  const debouncedFood = useDebounce(food, 300);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Fetch suggestions
  useEffect(() => {
    if (debouncedDrug.length >= 1) {
      analysisService.getSuggestions(debouncedDrug)
        .then(setDrugSuggestions)
        .catch(() => setDrugSuggestions([]));
    } else {
      setDrugSuggestions([]);
    }
  }, [debouncedDrug]);

  useEffect(() => {
    if (debouncedFood.length >= 1) {
      analysisService.getSuggestions(debouncedFood)
        .then(setFoodSuggestions)
        .catch(() => setFoodSuggestions([]));
    } else {
      setFoodSuggestions([]);
    }
  }, [debouncedFood]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (drugRef.current && !drugRef.current.contains(e.target as Node)) setShowDrugDropdown(false);
      if (foodRef.current && !foodRef.current.contains(e.target as Node)) setShowFoodDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleAnalyze = () => {
    if (drug && food) {
      navigate(`/analyze?drug=${encodeURIComponent(drug)}&food=${encodeURIComponent(food)}`);
    }
  };

  const severityBadge = (severity: string) => {
    const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG];
    return (
      <span className={`sci-badge ${config.bgClass} ${config.textClass} ${config.borderClass}`}>
        {config.label}
      </span>
    );
  };

  return (
    <PageLayout>
      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-scientific-grid opacity-40" />
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="absolute inset-0 bg-molecular-dots" />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-cyan/[0.03] rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-emerald/[0.03] rounded-full blur-[100px] animate-float delay-300" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className={`max-w-4xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Top Badge */}
            <div className="mb-8">
              <span className="sci-badge-cyan">
                <Sparkles className="w-3 h-3 mr-1.5" />
                Molecular Intelligence Platform
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl 
                           font-medium text-text-primary tracking-tight leading-[1.1] mb-6">
              Precision intelligence for{' '}
              <span className="italic text-gradient-cyan">food</span> and{' '}
              <span className="italic text-gradient-cyan">drug</span> interactions.
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl leading-relaxed mb-12">
              Predicting clinically relevant interactions between pharmaceuticals,
              dietary compounds, metabolic enzymes, and molecular pathways.
            </p>

            {/* Search Panel */}
            <div className="glass-card p-6 md:p-8 max-w-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                {/* Drug Input */}
                <div ref={drugRef} className="relative">
                  <label className="tech-label-cyan mb-2 block">
                    Pharmaceutical Agent · Drug
                  </label>
                  <div className="relative">
                    <input
                      id="drug-search-input"
                      type="text"
                      value={drug}
                      onChange={(e) => { setDrug(e.target.value); setShowDrugDropdown(true); }}
                      onFocus={() => setShowDrugDropdown(true)}
                      placeholder="e.g. Simvastatin"
                      className="sci-input pr-10"
                      autoComplete="off"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  </div>
                  {showDrugDropdown && drugSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-100 border border-surface-border 
                                    rounded-lg overflow-hidden shadow-glass z-50 max-h-48 overflow-y-auto">
                      {drugSuggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => { setDrug(s); setShowDrugDropdown(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm font-mono text-text-secondary 
                                     hover:bg-surface-200 hover:text-accent-cyan transition-colors
                                     border-b border-surface-border/50 last:border-0 capitalize"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Food Input */}
                <div ref={foodRef} className="relative">
                  <label className="tech-label-cyan mb-2 block">
                    Dietary Compound · Food
                  </label>
                  <div className="relative">
                    <input
                      id="food-search-input"
                      type="text"
                      value={food}
                      onChange={(e) => { setFood(e.target.value); setShowFoodDropdown(true); }}
                      onFocus={() => setShowFoodDropdown(true)}
                      placeholder="e.g. Naringin"
                      className="sci-input pr-10"
                      autoComplete="off"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  </div>
                  {showFoodDropdown && foodSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-100 border border-surface-border 
                                    rounded-lg overflow-hidden shadow-glass z-50 max-h-48 overflow-y-auto">
                      {foodSuggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => { setFood(s); setShowFoodDropdown(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm font-mono text-text-secondary 
                                     hover:bg-surface-200 hover:text-accent-cyan transition-colors
                                     border-b border-surface-border/50 last:border-0 capitalize"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                id="analyze-button"
                onClick={handleAnalyze}
                disabled={!drug || !food}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <FlaskConical className="w-4 h-4" />
                Analyze Interaction
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-8 mt-10">
              {[
                { value: '12+', label: 'Compounds' },
                { value: '5', label: 'CYP Enzymes' },
                { value: 'SHAP', label: 'Explainability' },
                { value: '3D', label: 'Visualization' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-baseline gap-2">
                  <span className="font-mono text-lg font-bold text-accent-cyan">{stat.value}</span>
                  <span className="text-[11px] font-mono text-text-tertiary tracking-wider uppercase">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ BENCHMARK RESEARCH PAIRINGS ═══════════ */}
      <section className="relative py-24 border-t border-surface-border" id="research">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-14">
            <span className="tech-label-cyan block mb-3">Benchmark Research Pairings</span>
            <h2 className="section-title max-w-xl">
              Validated pharmacokinetic<br className="hidden md:block" /> interaction profiles.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENCHMARK_PAIRINGS.map((pair, i) => (
              <button
                key={i}
                onClick={() => {
                  setDrug(pair.drug);
                  setFood(pair.food);
                  navigate(`/analyze?drug=${encodeURIComponent(pair.drug)}&food=${encodeURIComponent(pair.food)}`);
                }}
                className="glass-card p-6 text-left group cursor-pointer hover:border-surface-border-hover"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-text-primary group-hover:text-accent-cyan transition-colors">
                      {pair.drug}
                    </span>
                    <span className="text-text-muted text-xs">×</span>
                    <span className="font-mono text-sm font-bold text-text-primary group-hover:text-accent-cyan transition-colors">
                      {pair.food}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent-cyan 
                                            group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-[13px] text-text-tertiary leading-relaxed mb-4">
                  {pair.mechanism}
                </p>
                <div className="flex items-center gap-3">
                  {severityBadge(pair.severity)}
                  {pair.pathway && (
                    <span className="text-[10px] font-mono text-text-muted tracking-wider">
                      {pair.pathway}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ THREE LAYERS OF MOLECULAR INTELLIGENCE ═══════════ */}
      <section className="relative py-24 border-t border-surface-border" id="methodology">
        <div className="absolute inset-0 bg-radial-glow opacity-50" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="tech-label-cyan block mb-3">Architecture · The Computational Engine</span>
            <h2 className="section-title mx-auto">
              Three layers of molecular intelligence.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {INTELLIGENCE_LAYERS.map((layer) => {
              const iconMap = { cyan: Atom, emerald: Dna, amber: ShieldCheck };
              const Icon = iconMap[layer.color];
              const colorClasses = {
                cyan: { badge: 'sci-badge-cyan', glow: 'shadow-glow-cyan', text: 'text-accent-cyan', border: 'border-accent-cyan/10 hover:border-accent-cyan/25' },
                emerald: { badge: 'sci-badge-emerald', glow: 'shadow-glow-emerald', text: 'text-accent-emerald', border: 'border-accent-emerald/10 hover:border-accent-emerald/25' },
                amber: { badge: 'sci-badge-amber', glow: 'shadow-glow-amber', text: 'text-accent-amber', border: 'border-accent-amber/10 hover:border-accent-amber/25' },
              };
              const classes = colorClasses[layer.color];

              return (
                <div
                  key={layer.number}
                  className={`glass-card p-8 ${classes.border} group hover:${classes.glow} transition-all duration-500`}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-xl bg-surface-200 border border-surface-border
                                     flex items-center justify-center group-hover:border-surface-border-hover
                                     transition-all duration-300`}>
                      <Icon className={`w-5 h-5 ${classes.text}`} />
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-text-muted tracking-[0.15em]">
                        LAYER {layer.number}
                      </span>
                      <h3 className="font-display text-xl font-medium text-text-primary">
                        {layer.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-[13px] text-text-secondary mb-6 leading-relaxed">
                    {layer.subtitle}
                  </p>

                  <ul className="space-y-3">
                    {layer.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <span className={`mt-1.5 w-1 h-1 rounded-full ${classes.text} bg-current flex-shrink-0`} />
                        <span className="text-[13px] text-text-tertiary leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ VALIDATED DATA SOURCES ═══════════ */}
      <section className="relative py-24 border-t border-surface-border" id="data-sources">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-14">
            <span className="tech-label-cyan block mb-3">Validated Data Sources</span>
            <h2 className="section-title max-w-xl">
              Integrated chemical taxonomies &amp; metabolomes.
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {DATA_SOURCES.map((source) => {
              const iconMap: Record<string, typeof Database> = {
                chemistry: Beaker,
                food: FlaskConical,
                biology: Dna,
                ml: Brain,
                clinical: Activity,
              };
              const Icon = iconMap[source.category] || Database;

              return (
                <div
                  key={source.label}
                  className="glass-card p-5 group cursor-default hover:border-surface-border-hover"
                >
                  <Icon className="w-5 h-5 text-text-muted mb-3 group-hover:text-accent-cyan transition-colors" />
                  <p className="font-mono text-[10px] font-bold tracking-[0.1em] text-text-primary mb-1">
                    {source.label}
                  </p>
                  <p className="text-[11px] text-text-muted">{source.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ DISCLAIMER ═══════════ */}
      <section className="py-16 border-t border-surface-border">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-[12px] font-mono text-text-muted leading-relaxed tracking-wide">
            This platform is intended for research and educational purposes only and is not a substitute
            for professional medical advice. Interaction results should be verified using authoritative
            clinical sources and a qualified healthcare professional.
          </p>
        </div>
      </section>
    </PageLayout>
  );
}
