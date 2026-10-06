import { useEffect, useRef, useState, useCallback } from 'react';
import {
  RotateCw, ZoomIn, ZoomOut, Layers, RefreshCw, Maximize2,
  Grid3x3, Circle, Minus, Info, ChevronDown, ChevronUp
} from 'lucide-react';
// @ts-ignore
import * as $3Dmol from '3dmol';

interface MolProps {
  title: string;
  compoundName: string;
  category: 'PHARMACEUTICAL DRUG LIGAND' | 'DIETARY BIOACTIVE COMPOUND';
  sdfData?: string;
  smiles?: string;
  formula?: string;
  mw?: number;
  logp?: number;
  tpsa?: number;
  hbd?: number;
  hba?: number;
  rotatableBonds?: number;
  heavyAtomCount?: number;
  inchikey?: string;
  pubchemCid?: string;
  colorScheme?: 'cyan' | 'emerald';
}

const STYLE_MODES = [
  { key: 'stick', label: 'Stick', icon: Minus },
  { key: 'sphere', label: 'Ball+Stick', icon: Circle },
  { key: 'line',   label: 'Wire', icon: Grid3x3 },
] as const;

type StyleMode = 'stick' | 'sphere' | 'line';

export default function MoleculeViewer({
  compoundName,
  category,
  sdfData,
  smiles,
  formula,
  mw, logp, tpsa, hbd, hba, rotatableBonds, heavyAtomCount,
  inchikey, pubchemCid,
  colorScheme = 'cyan',
}: MolProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef    = useRef<any>(null);
  const surfaceRef   = useRef<any>(null);

  const [styleMode, setStyleMode]   = useState<StyleMode>('stick');
  const [hasSurface, setHasSurface] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [hasError, setHasError]     = useState(false);
  const [showInfo, setShowInfo]     = useState(false);

  const accent  = colorScheme === 'cyan'    ? '#06b6d4' : '#10b981';
  const accentDim = colorScheme === 'cyan'  ? 'rgba(6,182,212,0.12)' : 'rgba(16,185,129,0.12)';
  const accentBorder = colorScheme === 'cyan' ? 'rgba(6,182,212,0.3)' : 'rgba(16,185,129,0.3)';
  const accentText   = colorScheme === 'cyan' ? 'text-accent-cyan' : 'text-accent-emerald';
  const accentBg     = colorScheme === 'cyan' ? 'bg-accent-cyan-dim' : 'bg-accent-emerald-dim';
  const accentBorderClass = colorScheme === 'cyan' ? 'border-accent-cyan/30' : 'border-accent-emerald/30';

  const applyStyle = useCallback((viewer: any, mode: StyleMode) => {
    if (!viewer) return;
    viewer.setStyle({}, {});
    if (mode === 'stick') {
      viewer.setStyle({}, { stick: { radius: 0.18, colorscheme: 'Jmol' } });
    } else if (mode === 'sphere') {
      viewer.setStyle({}, {
        sphere: { scale: 0.32, colorscheme: 'Jmol' },
        stick:  { radius: 0.13, colorscheme: 'Jmol' }
      });
    } else {
      viewer.setStyle({}, { line: { linewidth: 2.5, colorscheme: 'Jmol' } });
    }
    viewer.render();
  }, []);

  const initViewer = useCallback(() => {
    if (!containerRef.current) return;
    setLoading(true);
    setHasError(false);
    setHasSurface(false);
    surfaceRef.current = null;

    try {
      containerRef.current.innerHTML = '';
      const viewer = ($3Dmol as any).createViewer(containerRef.current, {
        backgroundColor: '#070b13',
      });
      viewerRef.current = viewer;

      const data = sdfData?.trim();
      if (!data || data.length < 80) {
        setHasError(true);
        setLoading(false);
        return;
      }

      viewer.addModel(data, 'sdf');
      applyStyle(viewer, styleMode);
      viewer.zoomTo();
      viewer.render();

      // Brief intro rotation then stop
      viewer.animate({ loop: 'backAndForth', step: 0.25 });
      setTimeout(() => { try { viewer.stopAnimate(); } catch (_) {} }, 2800);

      setLoading(false);
    } catch (e) {
      console.error('3Dmol error:', e);
      setHasError(true);
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdfData]);

  useEffect(() => { initViewer(); }, [initViewer]);

  const handleStyleChange = (mode: StyleMode) => {
    setStyleMode(mode);
    applyStyle(viewerRef.current, mode);
  };

  const toggleSurface = () => {
    const v = viewerRef.current;
    if (!v) return;
    if (hasSurface && surfaceRef.current) {
      v.removeSurface(surfaceRef.current);
      surfaceRef.current = null;
      setHasSurface(false);
    } else {
      surfaceRef.current = v.addSurface(($3Dmol as any).SurfaceType.VDW, {
        opacity: 0.38,
        color: accent,
      });
      setHasSurface(true);
    }
    v.render();
  };

  const handleReset = () => {
    const v = viewerRef.current;
    if (!v) return;
    v.zoomTo(); v.render();
  };

  const handleZoom = (f: number) => {
    const v = viewerRef.current;
    if (!v) return;
    v.zoom(f); v.render();
  };

  const handleRotate = () => {
    const v = viewerRef.current;
    if (!v) return;
    v.rotate(45, 'y'); v.render();
  };

  const isDrug = category === 'PHARMACEUTICAL DRUG LIGAND';

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border"
      style={{
        background: '#070b13',
        borderColor: accentBorder,
        boxShadow: `0 0 40px ${accentDim}, 0 20px 60px rgba(0,0,0,0.6)`,
      }}
    >
      {/* ── Top Header Bar ── */}
      <div
        className="px-5 py-3.5 flex items-center justify-between gap-3 border-b"
        style={{ borderColor: accentBorder, background: 'rgba(10,14,22,0.9)' }}
      >
        <div className="min-w-0">
          <span
            className="block font-mono text-[9px] uppercase tracking-[0.2em] mb-0.5"
            style={{ color: accent }}
          >
            {category}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-mono text-sm font-bold text-white tracking-wide capitalize">
              {compoundName}
            </h4>
            {formula && (
              <span
                className="font-mono text-[11px] px-2 py-0.5 rounded border"
                style={{ color: accent, borderColor: accentBorder, background: accentDim }}
              >
                {formula}
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {[
            { icon: ZoomIn,   action: () => handleZoom(1.25),  title: 'Zoom In' },
            { icon: ZoomOut,  action: () => handleZoom(0.8),   title: 'Zoom Out' },
            { icon: RotateCw, action: handleRotate,             title: 'Rotate 45°' },
            { icon: RefreshCw, action: handleReset,            title: 'Reset View' },
          ].map(({ icon: Icon, action, title }) => (
            <button
              key={title}
              onClick={action}
              title={title}
              className="p-1.5 rounded hover:bg-white/10 transition-colors text-white/50 hover:text-white"
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
          <button
            onClick={toggleSurface}
            title="Toggle VDW Surface"
            className="p-1.5 rounded transition-colors"
            style={hasSurface ? { background: accentDim, color: accent } : { color: 'rgba(255,255,255,0.4)' }}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── 3D Viewer Canvas ── */}
      <div className="relative w-full" style={{ height: 380 }}>
        {/* Soft glow overlay behind canvas */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: `radial-gradient(ellipse at 50% 55%, ${accentDim} 0%, transparent 70%)`,
          }}
        />
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing relative z-10" />

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-[#070b13]/90">
            <div className="relative mb-4">
              <div
                className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: `${accent} transparent transparent transparent` }}
              />
              <div
                className="absolute inset-2 rounded-full animate-pulse"
                style={{ background: accentDim }}
              />
            </div>
            <p className="font-mono text-[11px] text-white/50 tracking-wider uppercase">
              Rendering 3D Conformer...
            </p>
            <p className="font-mono text-[10px] text-white/30 mt-1">RDKit MMFF94 Force-Field</p>
          </div>
        )}

        {/* Error / SMILES fallback */}
        {hasError && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-[#070b13]/95 px-6 text-center">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 border"
              style={{ background: accentDim, borderColor: accentBorder }}
            >
              <Info className="w-5 h-5" style={{ color: accent }} />
            </div>
            <p className="font-mono text-xs font-bold text-white mb-1 capitalize">{compoundName}</p>
            {smiles && (
              <p
                className="font-mono text-[10px] break-all max-w-xs leading-relaxed mb-2"
                style={{ color: accent }}
              >
                {smiles}
              </p>
            )}
            <span className="font-mono text-[9px] uppercase tracking-widest text-white/30 px-2 py-1 rounded bg-white/5">
              2D / SMILES Representation
            </span>
          </div>
        )}

        {/* Style mode switcher pill */}
        <div
          className="absolute bottom-3 left-3 flex items-center p-1 rounded-lg gap-0.5 z-20 border"
          style={{ background: 'rgba(7,11,19,0.9)', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          {STYLE_MODES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleStyleChange(key)}
              className="px-2.5 py-1 rounded text-[10px] font-mono capitalize transition-all"
              style={
                styleMode === key
                  ? { background: accentDim, color: accent, fontWeight: 700 }
                  : { color: 'rgba(255,255,255,0.35)' }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Interaction hint */}
        <div className="absolute bottom-3 right-3 text-[9px] font-mono text-white/25 z-20 hidden sm:block">
          Drag: Rotate · Right: Pan · Scroll: Zoom
        </div>
      </div>

      {/* ── Molecule Info Panel ── */}
      <div
        className="border-t px-5 py-3"
        style={{ borderColor: accentBorder, background: 'rgba(10,14,22,0.95)' }}
      >
        {/* Collapsible toggle */}
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="w-full flex items-center justify-between text-[10px] font-mono uppercase tracking-wider py-1"
          style={{ color: accent }}
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-3 h-3" />
            Molecular Identifiers
          </span>
          {showInfo ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showInfo && (
          <div className="mt-2 space-y-2 animate-fadeIn">
            {/* Quick property row */}
            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
              {[
                { k: 'MW', v: mw != null ? `${mw} g/mol` : '—' },
                { k: 'LogP', v: logp != null ? logp.toFixed(2) : '—' },
                { k: 'TPSA', v: tpsa != null ? `${tpsa} Å²` : '—' },
              ].map(({ k, v }) => (
                <div key={k} className="rounded px-2 py-1.5 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span className="block text-white/40 mb-0.5">{k}</span>
                  <span className="font-bold" style={{ color: accent }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
              {[
                { k: 'HBD', v: hbd != null ? hbd : '—' },
                { k: 'HBA', v: hba != null ? hba : '—' },
                { k: 'RotBonds', v: rotatableBonds != null ? rotatableBonds : '—' },
              ].map(({ k, v }) => (
                <div key={k} className="rounded px-2 py-1.5 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span className="block text-white/40 mb-0.5">{k}</span>
                  <span className="font-bold text-white/70">{v}</span>
                </div>
              ))}
            </div>

            {/* SMILES + CID / InChIKey */}
            {smiles && (
              <div className="rounded px-2 py-1.5 text-[10px] font-mono break-all" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <span className="text-white/40 mr-1">SMILES:</span>
                <span className="text-white/60">{smiles.slice(0, 80)}{smiles.length > 80 ? '…' : ''}</span>
              </div>
            )}
            <div className="flex gap-2 text-[10px] font-mono">
              {pubchemCid && pubchemCid !== 'None' && pubchemCid !== '' && (
                <a
                  href={`https://pubchem.ncbi.nlm.nih.gov/compound/${pubchemCid}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded px-2 py-1 hover:opacity-80 transition-opacity"
                  style={{ background: accentDim, color: accent, border: `1px solid ${accentBorder}` }}
                >
                  PubChem CID: {pubchemCid}
                </a>
              )}
              {inchikey && inchikey !== 'None' && (
                <span className="rounded px-2 py-1 text-white/40" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {inchikey}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
