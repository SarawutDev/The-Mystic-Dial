
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Skull, Search, ChevronDown } from 'lucide-react';
import htm from 'htm';
import DialRing from './components/DialRing.js';
import { generateSecretChallenge } from './services/geminiService.js';
import { RingLayer } from './types.js';

const html = htm.bind(React.createElement);

const App = () => {
  const [loading, setLoading] = useState(false);
  const [solved, setSolved] = useState(false);
  const [secret, setSecret] = useState({ secret: "", hint: "" });
  const [showHint, setShowHint] = useState(false);
  
  const COLORS = {
    [RingLayer.OUTER]: "#0f172a",
    [RingLayer.OUTER_MID]: "#450a0a",
    [RingLayer.MIDDLE]: "#0c0a09",
    [RingLayer.INNER_MID]: "#1e293b",
    [RingLayer.INNER]: "#7f1d1d",
  };

  const [rotations, setRotations] = useState({
    [RingLayer.OUTER]: (Math.floor(Math.random() * 3) + 1) * 120,
    [RingLayer.OUTER_MID]: (Math.floor(Math.random() * 3) + 1) * 120,
    [RingLayer.MIDDLE]: (Math.floor(Math.random() * 3) + 1) * 120,
    [RingLayer.INNER_MID]: (Math.floor(Math.random() * 3) + 1) * 120,
    [RingLayer.INNER]: (Math.floor(Math.random() * 3) + 1) * 120,
  });

  const [activeLayer, setActiveLayer] = useState(null);
  const dragStartAngle = useRef(0);
  const initialRotation = useRef(0);
  const containerRef = useRef(null);

  const getAngle = (clientX, clientY) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const handleDragStart = (layer, e) => {
    if (solved || loading) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setActiveLayer(layer);
    dragStartAngle.current = getAngle(clientX, clientY);
    initialRotation.current = rotations[layer];
  };

  const handleDragMove = useCallback((e) => {
    const layer = activeLayer;
    if (layer === null || solved) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const currentAngle = getAngle(clientX, clientY);
    const angleDiff = currentAngle - dragStartAngle.current;
    
    setRotations(prev => ({ ...prev, [layer]: initialRotation.current + angleDiff }));
  }, [activeLayer, solved]);

  const handleDragEnd = useCallback(() => {
    const layer = activeLayer;
    if (layer === null) return;
    setRotations(prev => {
      const currentRot = prev[layer];
      const snapped = Math.round(currentRot / 120) * 120;
      const nextRotations = { ...prev, [layer]: snapped };
      
      const isAligned = Object.values(nextRotations).every((rot) => {
        const normalized = ((rot % 360) + 360) % 360;
        return normalized < 4 || normalized > 356;
      });
      
      if (isAligned) setSolved(true);
      return nextRotations;
    });
    setActiveLayer(null);
  }, [activeLayer]);

  useEffect(() => {
    if (activeLayer !== null) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [activeLayer, handleDragMove, handleDragEnd]);

  const initGame = async () => {
    setLoading(true);
    setSolved(false);
    setShowHint(false);
    
    const data = await generateSecretChallenge();
    setSecret(data);
    setRotations({
      [RingLayer.OUTER]: (Math.random() > 0.5 ? 120 : 240),
      [RingLayer.OUTER_MID]: (Math.random() > 0.5 ? 120 : 240),
      [RingLayer.MIDDLE]: (Math.random() > 0.5 ? 120 : 240),
      [RingLayer.INNER_MID]: (Math.random() > 0.5 ? 120 : 240),
      [RingLayer.INNER]: (Math.random() > 0.5 ? 120 : 240),
    });
    setLoading(false);
  };

  useEffect(() => { initGame(); }, []);

  return html`
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-stone-500 overflow-hidden relative select-none bg-[#050505]">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[radial-gradient(circle,rgba(20,10,10,1)_0%,transparent_70%)]"></div>
      </div>

      <header className="text-center mb-10 z-10 font-serif opacity-80">
        <h1 className="text-3xl md:text-5xl font-bold tracking-[0.3em] text-stone-300 uppercase mb-2">
          MURDER <span className="text-red-900/60">MOSAIC</span>
        </h1>
        <p className="text-[10px] tracking-[0.8em] text-stone-700 uppercase font-black">Shattered evidence awaits its master</p>
      </header>

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 opacity-40">
            <${ChevronDown} className="text-stone-700" size=${32} />
          </div>

          <div 
            ref=${containerRef}
            className=${`relative w-[340px] h-[340px] md:w-[600px] md:h-[600px] rounded-full border-[20px] border-[#0c0c0c] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden transition-all duration-1000 ${solved ? 'border-red-950/40 brightness-110 saturate-150' : ''}`}
          >
            <svg viewBox="0 0 500 500" className="w-full h-full">
              <${DialRing}
                layer=${RingLayer.OUTER}
                radius=${215}
                thickness=${45}
                rotation=${rotations[RingLayer.OUTER]}
                color=${COLORS[RingLayer.OUTER]}
                isActive=${!solved}
                isDragging=${activeLayer === RingLayer.OUTER}
                onDragStart=${handleDragStart}
              />
              <${DialRing}
                layer=${RingLayer.OUTER_MID}
                radius=${170}
                thickness=${45}
                rotation=${rotations[RingLayer.OUTER_MID]}
                color=${COLORS[RingLayer.OUTER_MID]}
                isActive=${!solved}
                isDragging=${activeLayer === RingLayer.OUTER_MID}
                onDragStart=${handleDragStart}
              />
              <${DialRing}
                layer=${RingLayer.MIDDLE}
                radius=${125}
                thickness=${45}
                rotation=${rotations[RingLayer.MIDDLE]}
                color=${COLORS[RingLayer.MIDDLE]}
                isActive=${!solved}
                isDragging=${activeLayer === RingLayer.MIDDLE}
                onDragStart=${handleDragStart}
              />
              <${DialRing}
                layer=${RingLayer.INNER_MID}
                radius=${80}
                thickness=${45}
                rotation=${rotations[RingLayer.INNER_MID]}
                color=${COLORS[RingLayer.INNER_MID]}
                isActive=${!solved}
                isDragging=${activeLayer === RingLayer.INNER_MID}
                onDragStart=${handleDragStart}
              />
              <${DialRing}
                layer=${RingLayer.INNER}
                radius=${35}
                thickness=${45}
                rotation=${rotations[RingLayer.INNER]}
                color=${COLORS[RingLayer.INNER]}
                isActive=${!solved}
                isDragging=${activeLayer === RingLayer.INNER}
                onDragStart=${handleDragStart}
              />
            </svg>
          </div>
        </div>

        <div className="mt-12 w-full max-w-xl space-y-8 z-20">
          ${solved ? html`
            <div className="bg-stone-950/95 border border-red-900/20 p-10 rounded-3xl animate-in fade-in zoom-in duration-1000 backdrop-blur-3xl text-center">
              <${Skull} className="mx-auto mb-6 text-red-900/60" size=${40} />
              <div className="text-xl md:text-2xl font-medium text-stone-300 mb-10 py-8 italic font-serif leading-relaxed">
                "${secret.secret}"
              </div>
              <button
                onClick=${initGame}
                className="w-full bg-stone-900 hover:bg-stone-800 text-stone-500 font-bold py-5 rounded-2xl border border-stone-800/30 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.4em]"
              >
                <${RefreshCw} size=${20} className=${loading ? "animate-spin" : ""} />
                RELOAD EVIDENCE
              </button>
            </div>
          ` : html`
            <div className="space-y-6">
              <div className="flex gap-4">
                <button
                  onClick=${() => setShowHint(!showHint)}
                  className="flex-1 p-5 bg-stone-950/40 hover:bg-stone-900/60 text-stone-700 rounded-2xl border border-stone-900/20 transition-all flex items-center justify-center gap-4 text-[10px] font-black tracking-[0.4em] uppercase"
                >
                  <${Search} size=${18} />
                  ${showHint ? "CLOSE FILE" : "ANALYZE SHARDS"}
                </button>
              </div>

              ${showHint && html`
                <div className="p-8 bg-black/40 text-stone-600 text-center text-sm italic font-serif tracking-[0.1em] leading-relaxed border-l border-red-900/20">
                  "${secret.hint}"
                </div>
              `}
            </div>
          `}
        </div>
      </div>

      <footer className="mt-12 text-stone-900 text-[8px] tracking-[1.5em] uppercase font-bold opacity-10">
        DARKNESS IS THE ONLY WITNESS
      </footer>
    </div>
  `;
};

export default App;
