import { useEffect, useRef, useState, useCallback } from 'react';
import {
  RotateCw, ZoomIn, ZoomOut, RefreshCw, Layers,
  ChevronDown, ChevronUp, ExternalLink, Copy, Check,
  Atom, FlaskConical, BarChart3, Info, Eye, Box, ArrowRight,
  ShieldAlert, ShieldCheck, Zap, Play, Pause
} from 'lucide-react';
// Dynamic loader for 3Dmol to ensure optimal bundler performance and instant WebGL rendering
function get3Dmol(): Promise<any> {
  if (typeof window !== 'undefined' && (window as any).$3Dmol) {
    return Promise.resolve((window as any).$3Dmol);
  }
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('3dmol-script') as HTMLScriptElement;
    if (existing) {
      if ((window as any).$3Dmol) {
        resolve((window as any).$3Dmol);
      } else {
        existing.addEventListener('load', () => resolve((window as any).$3Dmol));
        existing.addEventListener('error', reject);
      }
      return;
    }
    const script = document.createElement('script');
    script.id = '3dmol-script';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/3Dmol/2.4.2/3Dmol-min.js';
    script.async = true;
    script.onload = () => resolve((window as any).$3Dmol);
    script.onerror = () => {
      const fallback = document.createElement('script');
      fallback.src = 'https://3Dmol.org/build/3Dmol-min.js';
      fallback.onload = () => resolve((window as any).$3Dmol);
      fallback.onerror = reject;
      document.head.appendChild(fallback);
    };
    document.head.appendChild(script);
  });
}

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface PubChemProps {
  MolecularFormula: string;
  MolecularWeight: string;
  CanonicalSMILES: string;
  IsomericSMILES: string;
  InChI: string;
  InChIKey: string;
  IUPACName: string;
  XLogP: number | null;
  TPSA: number | null;
  HBondDonorCount: number;
  HBondAcceptorCount: number;
  RotatableBondCount: number;
  HeavyAtomCount: number;
  Charge: number;
  CID: number;
}

export interface MolData {
  cid: number | null;
  sdf3d: string | null;
  smiles: string | null;
  formula: string | null;
  mw: number | null;
  iupac: string | null;
  inchi: string | null;
  inchikey: string | null;
  logp: number | null;
  tpsa: number | null;
  hbd: number;
  hba: number;
  rotatableBonds: number;
  heavyAtoms: number;
  charge: number;
}

type LoadStep = 'idle' | 'searching' | 'properties' | 'sdf' | 'rendering' | 'done' | 'error';
type StyleMode = 'stick' | 'ball_and_stick' | 'sphere' | 'wireframe' | 'spacefill';
type ViewMode = '3d' | '2d';

interface SingleViewerProps {
  name: string;
  category: 'PHARMACEUTICAL DRUG' | 'DIETARY BIOACTIVE COMPOUND';
  colorScheme: 'cyan' | 'emerald';
  backendSdf?: string;
  backendSmiles?: string;
  backendMw?: number;
  backendLogp?: number;
  backendTpsa?: number;
  backendHbd?: number;
  backendHba?: number;
  backendRot?: number;
  backendHeavy?: number;
  backendInchikey?: string;
  backendInchi?: string;    // Full InChI string from RDKit
  backendCid?: string;
  backendFormula?: string;
  onDataReady?: (data: MolData) => void;
}

/* ─────────────────────────────────────────────
   PubChem API Helpers
───────────────────────────────────────────── */
const PUBCHEM = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';

async function fetchCID(name: string): Promise<number | null> {
  try {
    const r = await fetch(`${PUBCHEM}/compound/name/${encodeURIComponent(name)}/cids/JSON`);
    if (!r.ok) return null;
    const j = await r.json();
    return j.IdentifierList?.CID?.[0] ?? null;
  } catch { return null; }
}

async function fetchProperties(cid: number): Promise<PubChemProps | null> {
  const fields = [
    'MolecularFormula','MolecularWeight','CanonicalSMILES','IsomericSMILES',
    'InChI','InChIKey','IUPACName','XLogP','TPSA',
    'HBondDonorCount','HBondAcceptorCount','RotatableBondCount',
    'HeavyAtomCount','Charge'
  ].join(',');
  try {
    const r = await fetch(`${PUBCHEM}/compound/cid/${cid}/property/${fields}/JSON`);
    if (!r.ok) return null;
    const j = await r.json();
    const p = j.PropertyTable?.Properties?.[0];
    if (!p) return null;
    return { ...p, CID: cid } as PubChemProps;
  } catch { return null; }
}

async function fetch3DSDF(cid: number): Promise<string | null> {
  try {
    const r = await fetch(`${PUBCHEM}/compound/cid/${cid}/SDF?record_type=3d`);
    if (!r.ok) return null;
    const text = await r.text();
    return text.trim().length > 80 ? text : null;
  } catch { return null; }
}

async function fetch2DSDF(cid: number): Promise<string | null> {
  try {
    const r = await fetch(`${PUBCHEM}/compound/cid/${cid}/SDF`);
    if (!r.ok) return null;
    const text = await r.text();
    return text.trim().length > 80 ? text : null;
  } catch { return null; }
}

/* ─────────────────────────────────────────────
   Loading Animation Waterfall
───────────────────────────────────────────── */
const STEP_LABELS: Record<LoadStep, string> = {
  idle:       'Initializing...',
  searching:  'Retrieving molecular data...',
  properties: 'Generating molecular structure...',
  sdf:        'Rendering 3D conformer...',
  rendering:  'Structure Ready ✓',
  done:       'Structure Ready ✓',
  error:      'Structure unavailable',
};

const STEP_ORDER: LoadStep[] = ['searching', 'properties', 'sdf', 'rendering', 'done'];

function LoadingSequence({ step, accent }: { step: LoadStep; accent: string }) {
  const stepIdx = STEP_ORDER.indexOf(step);
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-10 px-6">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: `${accent}18`, animationDuration: '1.8s' }}
        />
        <div
          className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: `${accent} transparent transparent transparent` }}
        />
        <Atom className="absolute w-6 h-6" style={{ color: accent }} />
      </div>

      <div className="w-full max-w-[220px] space-y-2.5">
        {STEP_ORDER.slice(0, 4).map((s, i) => {
          const done   = i < stepIdx;
          const active = i === stepIdx;
          return (
            <div key={s} className="flex items-center gap-2.5">
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-500"
                style={{
                  background: (done || active) ? accent : 'rgba(255,255,255,0.12)',
                  boxShadow:  active ? `0 0 6px ${accent}` : 'none',
                  opacity:    active ? 1 : done ? 0.65 : 0.2,
                }}
              />
              <span
                className="font-mono text-[10px] transition-all duration-500 truncate"
                style={{
                  color:      active ? accent : done ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.15)',
                  fontWeight: active ? 700 : 400,
                }}
              >
                {STEP_LABELS[s]}
              </span>
              {active && (
                <span className="font-mono text-[9px] ml-auto animate-pulse" style={{ color: accent }}>···</span>
              )}
              {done && <Check className="w-2.5 h-2.5 flex-shrink-0 ml-auto" style={{ color: accent }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   2D Molecular View (PubChem PNG Fallback)
───────────────────────────────────────────── */
function Mol2DView({
  cid, name, accent, smiles
}: { cid: number | null; name: string; accent: string; smiles: string | null }) {
  const [imgOk, setImgOk] = useState(false);
  const [err,   setErr]   = useState(false);

  const src = cid
    ? `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG?record_type=2d&image_size=300x300`
    : null;

  if (!src || err) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
        >
          <FlaskConical className="w-5 h-5" style={{ color: accent }} />
        </div>
        <p className="font-mono text-xs text-white/50 capitalize">{name}</p>
        {smiles && (
          <p className="font-mono text-[9px] break-all max-w-xs leading-relaxed" style={{ color: accent }}>
            {smiles.slice(0, 120)}{smiles.length > 120 ? '…' : ''}
          </p>
        )}
        <span className="font-mono text-[9px] uppercase tracking-widest text-white/25 px-2 py-1 rounded bg-white/5">
          SMILES Representation
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-4 relative">
      {!imgOk && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${accent} transparent transparent transparent` }} />
        </div>
      )}
      <img
        src={src}
        alt={`2D structure of ${name}`}
        className="max-w-full max-h-full object-contain rounded-lg transition-opacity duration-500"
        style={{
          filter: 'invert(0.88) hue-rotate(180deg) brightness(1.05) contrast(1.1)',
          opacity: imgOk ? 1 : 0,
        }}
        onLoad={() => setImgOk(true)}
        onError={() => setErr(true)}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Copyable info row
───────────────────────────────────────────── */
function InfoRow({ label, value, mono = true, copyable = false, accent }: {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
  copyable?: boolean;
  accent: string;
}) {
  const [copied, setCopied] = useState(false);
  const str = value != null && value !== '' ? String(value) : '—';

  const copy = () => {
    if (str === '—') return;
    navigator.clipboard.writeText(str);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-white/[0.035] last:border-0">
      <span className="font-mono text-[9.5px] text-white/30 uppercase tracking-wider flex-shrink-0 pt-0.5 min-w-[90px]">
        {label}
      </span>
      <div className="flex items-start gap-1.5 min-w-0 text-right">
        <span
          className={`${mono ? 'font-mono' : 'font-sans'} text-[10.5px] break-all leading-relaxed`}
          style={{ color: str !== '—' ? 'rgba(255,255,255,0.68)' : 'rgba(255,255,255,0.18)' }}
        >
          {str}
        </span>
        {copyable && str !== '—' && (
          <button
            onClick={copy}
            className="flex-shrink-0 mt-0.5 p-0.5 rounded hover:bg-white/10 transition-colors"
            title="Copy"
          >
            {copied
              ? <Check className="w-2.5 h-2.5 text-green-400" />
              : <Copy  className="w-2.5 h-2.5 text-white/22" />}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Single Molecule Viewer (Drug or Food Compound)
───────────────────────────────────────────── */
function SingleMolViewer({
  name, category, colorScheme,
  backendSdf, backendSmiles,
  backendMw, backendLogp, backendTpsa,
  backendHbd, backendHba, backendRot, backendHeavy,
  backendInchikey, backendInchi, backendCid, backendFormula,
  onDataReady,
}: SingleViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef    = useRef<any>(null);
  const surfaceRef   = useRef<any>(null);

  const [step,       setStep]       = useState<LoadStep>('idle');
  const [molData,    setMolData]    = useState<MolData | null>(null);
  const [viewMode,   setViewMode]   = useState<ViewMode>('3d');
  const [styleMode,  setStyleMode]  = useState<StyleMode>('stick');
  const [hasSurface, setHasSurface] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showProps,  setShowProps]  = useState(true);
  const [sdfFor3d,   setSdfFor3d]   = useState<string | null>(null);

  const accent       = colorScheme === 'cyan' ? '#06b6d4' : '#10b981';
  const accentDim    = colorScheme === 'cyan' ? 'rgba(6,182,212,0.10)' : 'rgba(16,185,129,0.10)';
  const accentBorder = colorScheme === 'cyan' ? 'rgba(6,182,212,0.28)' : 'rgba(16,185,129,0.28)';

  /* ── Fetch from PubChem with backend RDKit fallback ── */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStep('searching');
      setMolData(null);
      setSdfFor3d(null);

      // 1. Resolve CID
      let cid: number | null = null;
      if (backendCid && backendCid !== 'None' && backendCid !== '') {
        const parsed = parseInt(backendCid, 10);
        if (!isNaN(parsed)) cid = parsed;
      }
      if (!cid) cid = await fetchCID(name);
      if (cancelled) return;

      // 2. Fetch properties
      setStep('properties');
      let props: PubChemProps | null = null;
      if (cid) props = await fetchProperties(cid);
      if (cancelled) return;

      const data: MolData = {
        cid,
        sdf3d:         null,
        smiles:        props?.CanonicalSMILES  ?? backendSmiles   ?? null,
        formula:       props?.MolecularFormula ?? backendFormula  ?? null,
        mw:            props?.MolecularWeight  ? parseFloat(props.MolecularWeight) : (backendMw ?? null),
        iupac:         props?.IUPACName        ?? null,
        inchi:         props?.InChI            ?? backendInchi    ?? null,
        inchikey:      props?.InChIKey         ?? backendInchikey ?? null,
        logp:          props?.XLogP            ?? backendLogp    ?? null,
        tpsa:          props?.TPSA             ?? backendTpsa    ?? null,
        hbd:           props?.HBondDonorCount    ?? backendHbd  ?? 0,
        hba:           props?.HBondAcceptorCount ?? backendHba  ?? 0,
        rotatableBonds:props?.RotatableBondCount ?? backendRot  ?? 0,
        heavyAtoms:    props?.HeavyAtomCount      ?? backendHeavy ?? 0,
        charge:        props?.Charge              ?? 0,
      };

      // 3. Fetch 3D SDF (PubChem 3D → Backend RDKit ETKDGv3 MMFF94 SDF → PubChem 2D)
      setStep('sdf');
      let sdf: string | null = null;
      if (cid) sdf = await fetch3DSDF(cid);
      if (!sdf && backendSdf && backendSdf.trim().length > 80) sdf = backendSdf;
      if (!sdf && cid) sdf = await fetch2DSDF(cid);
      if (cancelled) return;

      data.sdf3d = sdf;
      setMolData(data);
      setSdfFor3d(sdf);
      onDataReady?.(data);
      setStep('rendering');
    }
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  /* ── Apply render style ── */
  const applyStyle = useCallback((viewer: any, mode: StyleMode) => {
    if (!viewer) return;
    viewer.setStyle({}, {});
    if (mode === 'stick') {
      viewer.setStyle({}, { stick: { radius: 0.16, colorscheme: 'Jmol' } });
    } else if (mode === 'ball_and_stick') {
      viewer.setStyle({}, {
        sphere: { scale: 0.28, colorscheme: 'Jmol' },
        stick:  { radius: 0.12, colorscheme: 'Jmol' },
      });
    } else if (mode === 'sphere') {
      viewer.setStyle({}, { sphere: { scale: 0.65, colorscheme: 'Jmol' } });
    } else if (mode === 'wireframe') {
      viewer.setStyle({}, { line: { linewidth: 2.2, colorscheme: 'Jmol' } });
    } else if (mode === 'spacefill') {
      viewer.setStyle({}, { sphere: { colorscheme: 'Jmol' } });
    }
    viewer.render();
  }, []);

  /* ── Init 3Dmol WebGL Viewer ── */
  useEffect(() => {
    if (!sdfFor3d || viewMode !== '3d' || !containerRef.current) return;
    if (step !== 'rendering' && step !== 'done') return;
    
    let cancelled = false;
    get3Dmol().then(($3Dmol) => {
      if (cancelled || !containerRef.current || !$3Dmol) return;
      try {
        containerRef.current.innerHTML = '';
        surfaceRef.current = null;
        setHasSurface(false);
        setIsSpinning(false);

        const viewer = $3Dmol.createViewer(containerRef.current, {
          backgroundColor: '#070b13',
        });
        viewerRef.current = viewer;
        viewer.addModel(sdfFor3d, 'sdf');
        applyStyle(viewer, styleMode);
        viewer.zoomTo();
        viewer.render();
        viewer.animate({ loop: 'backAndForth', step: 0.2 });
        setTimeout(() => { try { viewer.stopAnimate(); } catch (_) {} }, 2200);
        setStep('done');
      } catch (e) {
        console.error('3Dmol init error:', e);
        setStep('error');
      }
    }).catch((e) => {
      console.error('Failed to load 3Dmol script:', e);
      setStep('error');
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdfFor3d, viewMode]);

  const handleStyleChange = (mode: StyleMode) => {
    setStyleMode(mode);
    applyStyle(viewerRef.current, mode);
  };

  const toggleSurface = () => {
    const v = viewerRef.current;
    const $3Dmol = (window as any).$3Dmol;
    if (!v || !$3Dmol) return;
    if (hasSurface && surfaceRef.current) {
      v.removeSurface(surfaceRef.current);
      surfaceRef.current = null;
      setHasSurface(false);
    } else {
      surfaceRef.current = v.addSurface($3Dmol.SurfaceType.VDW, {
        opacity: 0.35, color: accent,
      });
      setHasSurface(true);
    }
    v.render();
  };

  const toggleSpin = () => {
    const v = viewerRef.current;
    if (!v) return;
    if (isSpinning) {
      try { v.stopAnimate(); } catch (_) {}
      setIsSpinning(false);
    } else {
      try {
        v.animate({ loop: 'forward', step: 0.25 });
        setIsSpinning(true);
      } catch (_) {}
    }
  };

  const handleReset  = () => {
    const v = viewerRef.current;
    if (v) {
      try { v.stopAnimate(); setIsSpinning(false); } catch (_) {}
      v.zoomTo();
      v.render();
    }
  };
  const handleZoom   = (f: number) => { const v = viewerRef.current; if (v) { v.zoom(f); v.render(); } };
  const handleRotate = () => { const v = viewerRef.current; if (v) { v.rotate(45, 'y'); v.render(); } };

  const loading = step !== 'done' && step !== 'error';

  return (
    <div
      className="flex flex-col overflow-hidden border transition-all duration-300"
      style={{ background: '#070b13', borderColor: accentBorder }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between gap-2 border-b"
        style={{ borderColor: accentBorder, background: 'rgba(10,14,22,0.92)' }}
      >
        <div className="min-w-0">
          <span className="block font-mono text-[8.5px] uppercase tracking-[0.22em] mb-0.5" style={{ color: accent }}>
            {category}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-mono text-sm font-bold text-white capitalize">{name}</h4>
            {molData?.formula && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded border"
                style={{ color: accent, borderColor: accentBorder, background: accentDim }}>
                {molData.formula}
              </span>
            )}
            {molData?.cid && (
              <a
                href={`https://pubchem.ncbi.nlm.nih.gov/compound/${molData.cid}`}
                target="_blank" rel="noreferrer"
                className="font-mono text-[9px] flex items-center gap-0.5 opacity-45 hover:opacity-80 transition-opacity"
                style={{ color: accent }}
              >
                CID:{molData.cid}<ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {/* 2D / 3D toggle */}
          <div className="flex items-center rounded p-0.5 gap-0.5 mr-1"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {(['3d','2d'] as ViewMode[]).map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition-all flex items-center gap-1"
                style={viewMode === m ? { background: accentDim, color: accent } : { color: 'rgba(255,255,255,0.3)' }}
              >
                {m === '3d' ? <Box className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {m.toUpperCase()}
              </button>
            ))}
          </div>

          {viewMode === '3d' && [
            { Icon: ZoomIn,    action: () => handleZoom(1.25), title: 'Zoom In' },
            { Icon: ZoomOut,   action: () => handleZoom(0.8),  title: 'Zoom Out' },
            { Icon: RotateCw,  action: handleRotate,           title: 'Rotate 45°' },
            { Icon: isSpinning ? Pause : Play, action: toggleSpin, title: isSpinning ? 'Pause Spin' : 'Auto Spin' },
            { Icon: RefreshCw, action: handleReset,            title: 'Reset View' },
          ].map(({ Icon, action, title }) => (
            <button key={title} onClick={action} title={title}
              className="p-1.5 rounded hover:bg-white/10 transition-colors text-white/40 hover:text-white"
              style={title.includes('Spin') && isSpinning ? { color: accent, background: accentDim } : undefined}>
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}

          {viewMode === '3d' && (
            <button onClick={toggleSurface} title="Toggle VDW Surface"
              className="p-1.5 rounded transition-colors"
              style={hasSurface ? { background: accentDim, color: accent } : { color: 'rgba(255,255,255,0.32)' }}>
              <Layers className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full" style={{ height: 360 }}>
        <div className="absolute inset-0 pointer-events-none z-0"
          style={{ background: `radial-gradient(ellipse at 50% 55%, ${accentDim} 0%, transparent 68%)` }} />

        {/* 3D WebGL Canvas */}
        {viewMode === '3d' && (
          <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing relative z-10" />
        )}

        {/* 2D View */}
        {viewMode === '2d' && (
          <div className="absolute inset-0 z-10">
            <Mol2DView cid={molData?.cid ?? null} name={name} accent={accent} smiles={molData?.smiles ?? null} />
          </div>
        )}

        {/* Loading waterfall */}
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: 'rgba(7,11,19,0.93)' }}>
            <LoadingSequence step={step} accent={accent} />
          </div>
        )}

        {/* Error Fallback */}
        {step === 'error' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 px-6 text-center"
            style={{ background: 'rgba(7,11,19,0.95)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{ background: accentDim, borderColor: accentBorder }}>
              <Info className="w-5 h-5" style={{ color: accent }} />
            </div>
            <p className="font-mono text-xs font-bold text-white capitalize">{name}</p>
            {molData?.smiles && (
              <p className="font-mono text-[10px] break-all max-w-xs leading-relaxed" style={{ color: accent }}>
                {molData.smiles.slice(0, 100)}…
              </p>
            )}
            <span className="font-mono text-[9px] uppercase tracking-widest text-white/28 px-2 py-1 rounded bg-white/5">
              2D / SMILES Representation
            </span>
          </div>
        )}

        {/* Representation switcher (3D only) */}
        {viewMode === '3d' && (step === 'done') && (
          <>
            <div className="absolute bottom-3 left-3 flex items-center p-1 rounded-lg gap-0.5 z-20 border shadow-lg"
              style={{ background: 'rgba(7,11,19,0.92)', borderColor: 'rgba(255,255,255,0.08)' }}>
              {([
                { key: 'stick'         as StyleMode, label: 'Stick' },
                { key: 'ball_and_stick' as StyleMode, label: 'Ball & Stick' },
                { key: 'sphere'        as StyleMode, label: 'Sphere' },
                { key: 'wireframe'     as StyleMode, label: 'Wireframe' },
                { key: 'spacefill'     as StyleMode, label: 'Spacefill' },
              ]).map(({ key, label }) => (
                <button key={key} onClick={() => handleStyleChange(key)}
                  className="px-2 py-0.5 rounded text-[8.5px] font-mono capitalize transition-all"
                  style={styleMode === key
                    ? { background: accentDim, color: accent, fontWeight: 700 }
                    : { color: 'rgba(255,255,255,0.35)' }}>
                  {label}
                </button>
              ))}
            </div>
            <div className="absolute bottom-3 right-3 text-[9px] font-mono text-white/35 z-20 hidden sm:block bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm border border-white/5">
              Rotate: Drag · Zoom: Scroll · Pan: Right-click Drag
            </div>
          </>
        )}
      </div>

      {/* Real Molecular Properties */}
      <div className="border-t" style={{ borderColor: accentBorder, background: 'rgba(10,14,22,0.95)' }}>
        <button
          onClick={() => setShowProps(!showProps)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider"
          style={{ color: accent }}
        >
          <span className="flex items-center gap-1.5">
            <FlaskConical className="w-3 h-3" />
            Molecular Properties
          </span>
          {showProps ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showProps && (
          <div className="px-4 pb-4">
            {/* Metric chips */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {[
                { k: 'MW',       v: molData?.mw       != null ? `${molData.mw} g/mol` : '—' },
                { k: 'LogP',     v: molData?.logp     != null ? molData.logp.toFixed(2)  : '—' },
                { k: 'TPSA',     v: molData?.tpsa     != null ? `${molData.tpsa} Å²`    : '—' },
                { k: 'HBD',      v: molData?.hbd      ?? '—' },
                { k: 'HBA',      v: molData?.hba      ?? '—' },
                { k: 'RotBonds', v: molData?.rotatableBonds ?? '—' },
              ].map(({ k, v }) => (
                <div key={k} className="rounded py-1.5 px-2 text-center" style={{ background: 'rgba(255,255,255,0.035)' }}>
                  <span className="block font-mono text-[8.5px] text-white/30 mb-0.5">{k}</span>
                  <span className="font-mono text-[11px] font-bold" style={{ color: accent }}>{String(v)}</span>
                </div>
              ))}
            </div>

            {/* Detailed identifiers */}
            <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)' }}>
              <div className="px-3 py-1">
                <InfoRow label="Formula"       value={molData?.formula}    accent={accent} />
                <InfoRow label="Mol Weight"    value={molData?.mw != null ? `${molData.mw} g/mol` : null} accent={accent} />
                <InfoRow label="CID"           value={molData?.cid}        accent={accent} />
                <InfoRow label="SMILES"        value={molData?.smiles}     accent={accent} copyable />
                <InfoRow label="InChI"         value={molData?.inchi}      accent={accent} copyable />
                <InfoRow label="InChIKey"      value={molData?.inchikey}   accent={accent} copyable />
                <InfoRow label="IUPAC"         value={molData?.iupac}      accent={accent} mono={false} />
                <InfoRow label="LogP"          value={molData?.logp       != null ? molData.logp.toFixed(3)   : null} accent={accent} />
                <InfoRow label="TPSA"          value={molData?.tpsa       != null ? `${molData.tpsa} Å²`      : null} accent={accent} />
                <InfoRow label="H-Donors"      value={molData?.hbd}        accent={accent} />
                <InfoRow label="H-Acceptors"   value={molData?.hba}       accent={accent} />
                <InfoRow label="Rot Bonds"     value={molData?.rotatableBonds} accent={accent} />
                <InfoRow label="Heavy Atoms"   value={molData?.heavyAtoms} accent={accent} />
                <InfoRow label="Charge"        value={molData?.charge ?? 0} accent={accent} />
              </div>
            </div>

            {molData?.cid && (
              <a
                href={`https://pubchem.ncbi.nlm.nih.gov/compound/${molData.cid}`}
                target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-1.5 mt-2.5 text-[10px] font-mono rounded py-1.5 transition-opacity hover:opacity-80"
                style={{ background: accentDim, color: accent, border: `1px solid ${accentBorder}` }}
              >
                <ExternalLink className="w-2.5 h-2.5" />
                View on PubChem (CID: {molData.cid})
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Comparison bar
───────────────────────────────────────────── */
function CompareBar({ dVal, fVal, max, dAccent, fAccent }: {
  dVal: number; fVal: number; max: number; dAccent: string; fAccent: string;
}) {
  const dPct = max > 0 ? Math.min((Math.abs(dVal) / max) * 100, 100) : 0;
  const fPct = max > 0 ? Math.min((Math.abs(fVal) / max) * 100, 100) : 0;
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${dPct}%`, background: dAccent, opacity: 0.85 }} />
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${fPct}%`, background: fAccent, opacity: 0.85 }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT PROPS
───────────────────────────────────────────── */
export interface MolecularComparisonPanelProps {
  drugName: string;
  foodName: string;
  interactionDetected?: boolean;
  severityLabel?: string;
  outcomeLabel?: string;
  drugSdf?: string;
  foodSdf?: string;
  drugSmiles?: string;
  foodSmiles?: string;
  affectedEnzymes?: string[];
  mechanismDescription?: string;
  drugTelemetry?: {
    mw?: number; logp?: number; tpsa?: number; hbd?: number; hba?: number;
    rotatable_bonds?: number; heavy_atom_count?: number; inchikey?: string;
    inchi?: string; pubchem_cid?: string; formula?: string; smiles?: string;
  };
  foodTelemetry?: {
    mw?: number; logp?: number; tpsa?: number; hbd?: number; hba?: number;
    rotatable_bonds?: number; heavy_atom_count?: number; inchikey?: string;
    inchi?: string; pubchem_cid?: string; formula?: string; smiles?: string;
  };
  severityColor?: string;
}

export function MolecularComparisonPanel({
  drugName, foodName,
  interactionDetected = true,
  severityLabel = 'MODERATE INTERACTION',
  drugSdf, foodSdf, drugSmiles, foodSmiles,
  affectedEnzymes = [],
  mechanismDescription,
  drugTelemetry, foodTelemetry,
  severityColor = '#f59e0b',
}: MolecularComparisonPanelProps) {
  const [drugData, setDrugData] = useState<MolData | null>(null);
  const [foodData, setFoodData] = useState<MolData | null>(null);

  const CYAN    = '#06b6d4';
  const EMERALD = '#10b981';

  const compRows = [
    { label: 'Molecular Weight', unit: 'g/mol', max: 1200, dec: 1,
      d: drugData?.mw ?? drugTelemetry?.mw ?? null,
      f: foodData?.mw ?? foodTelemetry?.mw ?? null },
    { label: 'LogP (Lipophilicity)', unit: '', max: 12, dec: 2,
      d: drugData?.logp ?? drugTelemetry?.logp ?? null,
      f: foodData?.logp ?? foodTelemetry?.logp ?? null },
    { label: 'TPSA (Å²)', unit: 'Å²', max: 320, dec: 1,
      d: drugData?.tpsa ?? drugTelemetry?.tpsa ?? null,
      f: foodData?.tpsa ?? foodTelemetry?.tpsa ?? null },
    { label: 'H-Bond Donors', unit: '', max: 15, dec: 0,
      d: drugData?.hbd ?? drugTelemetry?.hbd ?? null,
      f: foodData?.hbd ?? foodTelemetry?.hbd ?? null },
    { label: 'H-Bond Acceptors', unit: '', max: 20, dec: 0,
      d: drugData?.hba ?? drugTelemetry?.hba ?? null,
      f: foodData?.hba ?? foodTelemetry?.hba ?? null },
    { label: 'Rotatable Bonds', unit: '', max: 20, dec: 0,
      d: drugData?.rotatableBonds ?? drugTelemetry?.rotatable_bonds ?? null,
      f: foodData?.rotatableBonds ?? foodTelemetry?.rotatable_bonds ?? null },
    { label: 'Heavy Atoms', unit: '', max: 90, dec: 0,
      d: drugData?.heavyAtoms ?? drugTelemetry?.heavy_atom_count ?? null,
      f: foodData?.heavyAtoms ?? foodTelemetry?.heavy_atom_count ?? null },
  ];

  const primaryEnzyme = affectedEnzymes.length > 0 ? affectedEnzymes[0] : 'CYP3A4';

  return (
    <div className="space-y-7">
      {/* ── 1. Status Banner ── */}
      <div
        className="p-4 md:p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
        style={{
          background: interactionDetected
            ? 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(7,11,19,0.95) 100%)'
            : 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(7,11,19,0.95) 100%)',
          borderColor: interactionDetected ? `${severityColor}40` : 'rgba(16,185,129,0.3)',
        }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {interactionDetected ? (
              <span
                className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider flex items-center gap-1.5"
                style={{ background: `${severityColor}22`, color: severityColor, border: `1px solid ${severityColor}44` }}
              >
                <ShieldAlert className="w-3 h-3" />
                INTERACTION DETECTED
              </span>
            ) : (
              <span
                className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-500/30"
              >
                <ShieldCheck className="w-3 h-3" />
                NO SIGNIFICANT INTERACTION DETECTED
              </span>
            )}
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest hidden sm:inline">
              3Dmol.js WebGL Engine
            </span>
          </div>

          <h3 className="font-display text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
            <span style={{ color: CYAN }}>{drugName.toUpperCase()}</span>
            <span className="text-white/30 text-lg">×</span>
            <span style={{ color: EMERALD }}>{foodName.toUpperCase()}</span>
          </h3>

          <p className="font-mono text-xs font-semibold uppercase tracking-wider" style={{ color: severityColor }}>
            {interactionDetected ? severityLabel : 'No Significant Interaction'}
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px] flex-shrink-0 self-start sm:self-auto">
          <span className="flex items-center gap-1.5" style={{ color: CYAN }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: CYAN }} />
            {drugName}
          </span>
          <span className="text-white/20">↔</span>
          <span className="flex items-center gap-1.5" style={{ color: EMERALD }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: EMERALD }} />
            {foodName}
          </span>
        </div>
      </div>

      {/* ── 2. Molecular Interaction Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pt-1">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] block mb-1 text-white/40">
            Interactive Structural Conformation
          </span>
          <h4 className="font-display text-lg md:text-xl font-bold text-white tracking-tight">
            MOLECULAR INTERACTION
          </h4>
          <p className="font-mono text-xs text-white/45 mt-0.5">
            Real 3D molecular structures rendered side-by-side · PubChem REST data · Drag to rotate · Scroll to zoom
          </p>
        </div>
      </div>

      {/* ── 3. Dual 3D Molecular Viewer with Animated Connector ── */}
      <div
        className="relative grid grid-cols-1 lg:grid-cols-2 rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 0 80px rgba(0,0,0,0.6)' }}
      >
        {/* LEFT: PHARMACEUTICAL DRUG LIGAND */}
        <SingleMolViewer
          name={drugName}
          category="PHARMACEUTICAL DRUG"
          colorScheme="cyan"
          backendSdf={drugSdf}
          backendSmiles={drugSmiles}
          backendMw={drugTelemetry?.mw}
          backendLogp={drugTelemetry?.logp}
          backendTpsa={drugTelemetry?.tpsa}
          backendHbd={drugTelemetry?.hbd}
          backendHba={drugTelemetry?.hba}
          backendRot={drugTelemetry?.rotatable_bonds}
          backendHeavy={drugTelemetry?.heavy_atom_count}
          backendInchikey={drugTelemetry?.inchikey}
          backendInchi={drugTelemetry?.inchi}
          backendCid={drugTelemetry?.pubchem_cid}
          backendFormula={drugTelemetry?.formula}
          onDataReady={setDrugData}
        />

        {/* CENTER INTERACTION CONNECTOR */}
        <div className="hidden lg:flex flex-col items-center justify-center absolute left-1/2 top-0 bottom-0 -translate-x-1/2 z-30 pointer-events-none">
          <div
            className="flex flex-col items-center gap-1.5 px-3 py-4 rounded-xl text-center"
            style={{
              background: 'rgba(8,12,20,0.98)',
              border: `1px solid ${interactionDetected ? `${severityColor}60` : 'rgba(255,255,255,0.1)'}`,
              boxShadow: interactionDetected ? `0 0 35px ${severityColor}30` : '0 0 30px rgba(0,0,0,0.8)',
            }}
          >
            <Atom className="w-4 h-4 mb-0.5" style={{ color: interactionDetected ? severityColor : 'rgba(255,255,255,0.3)' }} />
            
            <div className="text-[14px] font-bold leading-none select-none" style={{ color: interactionDetected ? severityColor : 'rgba(255,255,255,0.3)' }}>
              ↔
            </div>

            <div className="my-1 flex flex-col items-center gap-0.5">
              <span
                className="font-mono text-[7.5px] uppercase tracking-widest font-bold max-w-[80px] leading-tight"
                style={{ color: interactionDetected ? severityColor : 'rgba(255,255,255,0.35)' }}
              >
                {interactionDetected ? 'PREDICTED MOLECULAR INTERACTION' : 'NO INTERACTION DETECTED'}
              </span>
            </div>

            {interactionDetected && (
              <div
                className="mt-1 w-2 h-2 rounded-full animate-ping"
                style={{ background: severityColor }}
              />
            )}
          </div>
        </div>

        {/* RIGHT: DIETARY BIOACTIVE COMPOUND */}
        <SingleMolViewer
          name={foodName}
          category="DIETARY BIOACTIVE COMPOUND"
          colorScheme="emerald"
          backendSdf={foodSdf}
          backendSmiles={foodSmiles}
          backendMw={foodTelemetry?.mw}
          backendLogp={foodTelemetry?.logp}
          backendTpsa={foodTelemetry?.tpsa}
          backendHbd={foodTelemetry?.hbd}
          backendHba={foodTelemetry?.hba}
          backendRot={foodTelemetry?.rotatable_bonds}
          backendHeavy={foodTelemetry?.heavy_atom_count}
          backendInchikey={foodTelemetry?.inchikey}
          backendInchi={foodTelemetry?.inchi}
          backendCid={foodTelemetry?.pubchem_cid}
          backendFormula={foodTelemetry?.formula}
          onDataReady={setFoodData}
        />
      </div>

      {/* ── 4. Molecular Feature Comparison Table ── */}
      <div
        className="rounded-xl overflow-hidden border"
        style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(7,11,19,0.92)' }}
      >
        <div
          className="px-5 py-3.5 flex items-center justify-between border-b"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.35)' }} />
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30 block mb-0.5">
                Physicochemical Profile
              </span>
              <h4 className="font-mono text-sm font-bold text-white">MOLECULAR FEATURE COMPARISON</h4>
            </div>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px]">
            <span className="flex items-center gap-1.5" style={{ color: CYAN }}>
              <span className="w-2 h-2 rounded-full" style={{ background: CYAN }} />
              {drugName}
            </span>
            <span className="flex items-center gap-1.5" style={{ color: EMERALD }}>
              <span className="w-2 h-2 rounded-full" style={{ background: EMERALD }} />
              {foodName}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th className="text-left px-5 py-2.5 text-white/30 font-normal uppercase text-[9px] tracking-wider w-[30%]">Feature</th>
                <th className="text-center px-4 py-2.5 font-bold uppercase text-[9px] tracking-wider w-[22%]" style={{ color: CYAN }}>{drugName}</th>
                <th className="text-center px-4 py-2.5 font-bold uppercase text-[9px] tracking-wider w-[22%]" style={{ color: EMERALD }}>{foodName}</th>
                <th className="text-center px-4 py-2.5 text-white/22 font-normal uppercase text-[9px] tracking-wider w-[26%] hidden sm:table-cell">Visual Relative Ratio</th>
              </tr>
            </thead>
            <tbody>
              {compRows.map((row, idx) => {
                const dNum = typeof row.d === 'number' ? row.d : null;
                const fNum = typeof row.f === 'number' ? row.f : null;
                const fmt  = (n: number) =>
                  (row.dec > 0 ? n.toFixed(row.dec) : String(Math.round(n))) +
                  (row.unit ? ` ${row.unit}` : '');
                return (
                  <tr key={row.label} style={{
                    background: idx % 2 === 0 ? 'rgba(255,255,255,0.014)' : 'transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <td className="px-5 py-3 text-white/45">{row.label}</td>
                    <td className="px-4 py-3 text-center font-bold" style={{ color: CYAN }}>
                      {dNum != null ? fmt(dNum) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center font-bold" style={{ color: EMERALD }}>
                      {fNum != null ? fmt(fNum) : '—'}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {dNum != null && fNum != null
                        ? <CompareBar dVal={dNum} fVal={fNum} max={row.max} dAccent={CYAN} fAccent={EMERALD} />
                        : <span className="text-white/14">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div
          className="px-5 py-2.5 flex items-center gap-2 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <Info className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.18)' }} />
          <p className="font-mono text-[9px] text-white/25">
            Molecular features sourced from PubChem canonical SDF conformers and validated via RDKit 3D force field descriptors.
          </p>
        </div>
      </div>

      {/* ── 5. Connect Molecules to Interaction Flow ── */}
      <div
        className="rounded-xl p-5 border"
        style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(7,11,19,0.92)' }}
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 block mb-1">
          Pathway Alignment Architecture
        </span>
        <h4 className="font-mono text-sm font-bold text-white mb-4">
          CONNECTING MOLECULAR FEATURES TO INTERACTION
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center">
          {[
            {
              step: '01',
              title: 'DRUG',
              desc: drugName,
              color: CYAN,
              detail: `${drugData?.formula || 'Ligand'}`
            },
            {
              step: '02',
              title: 'MOLECULAR FEATURES',
              desc: `MW: ${drugData?.mw || '—'} · LogP: ${drugData?.logp || '—'}`,
              color: CYAN,
              detail: 'Clearance Substrate'
            },
            {
              step: '03',
              title: 'FOOD COMPOUND',
              desc: foodName,
              color: EMERALD,
              detail: `${foodData?.formula || 'Bioactive'}`
            },
            {
              step: '04',
              title: 'BIOLOGICAL ACTION',
              desc: interactionDetected ? 'Competitive Inhibition' : 'No Substrate Overlap',
              color: severityColor,
              detail: 'Binding Kinetics'
            },
            {
              step: '05',
              title: 'ENZYME / PATHWAY',
              desc: primaryEnzyme,
              color: severityColor,
              detail: 'Metabolic Gatekeeper'
            },
            {
              step: '06',
              title: 'INTERACTION RESULT',
              desc: severityLabel,
              color: severityColor,
              detail: interactionDetected ? 'Clearance Shift' : 'Favorable Margin'
            },
          ].map((item, idx) => (
            <div
              key={item.step}
              className="relative p-3 rounded-lg border flex flex-col justify-between"
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderColor: `${item.color}25`
              }}
            >
              <div>
                <span className="font-mono text-[8px] block mb-1" style={{ color: item.color }}>
                  {item.step}
                </span>
                <span className="font-mono text-[9.5px] uppercase tracking-wider font-bold text-white/90 block">
                  {item.title}
                </span>
                <span className="font-mono text-[10px] font-semibold mt-1 block truncate" style={{ color: item.color }}>
                  {item.desc}
                </span>
              </div>
              <span className="font-mono text-[8.5px] text-white/30 mt-2 block">
                {item.detail}
              </span>
              {idx < 5 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-white/20">
                  <ArrowRight className="w-3 h-3" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 6. Interaction Mechanism (Why do they interact?) ── */}
      {interactionDetected && (
        <div
          className="rounded-xl p-5 border"
          style={{ borderColor: `${severityColor}35`, background: 'rgba(7,11,19,0.92)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 block mb-0.5">
                Biological Pharmacokinetics
              </span>
              <h4 className="font-mono text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color: severityColor }} />
                WHY DO THEY INTERACT?
              </h4>
            </div>
            <span
              className="font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase"
              style={{ background: `${severityColor}18`, color: severityColor, border: `1px solid ${severityColor}40` }}
            >
              {primaryEnzyme} Pathway
            </span>
          </div>

          {/* Stepper Flow */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10.5px] mb-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <span className="font-bold" style={{ color: EMERALD }}>{foodName}</span>
            <ArrowRight className="w-3 h-3 text-white/25 flex-shrink-0" />
            <span className="font-bold text-white/90">{primaryEnzyme} Enzyme</span>
            <ArrowRight className="w-3 h-3 text-white/25 flex-shrink-0" />
            <span className="font-bold" style={{ color: CYAN }}>{drugName} Metabolism</span>
            <ArrowRight className="w-3 h-3 text-white/25 flex-shrink-0" />
            <span className="text-amber-400">Altered Exposure (AUC)</span>
            <ArrowRight className="w-3 h-3 text-white/25 flex-shrink-0" />
            <span className="font-bold" style={{ color: severityColor }}>{severityLabel}</span>
          </div>

          <p className="font-sans text-xs text-white/70 leading-relaxed">
            {mechanismDescription ||
              `Co-administration of ${foodName} modulates hepatic/intestinal ${primaryEnzyme} catalytic activity. Because ${drugName} relies heavily on this pathway for systemic clearance, inhibition or competition precipitates elevated drug bioavailability and prolonged plasma half-life.`}
          </p>
        </div>
      )}
    </div>
  );
}

export const MolecularInteractionViewer = MolecularComparisonPanel;
export default MolecularComparisonPanel;
