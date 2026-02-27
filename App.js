
import React, { useState, useEffect, useCallback, useRef } from 'react';
import htm from 'htm';
import DialRing from './components/DialRing.js';
import { RingLayer } from './types.js';

const html = htm.bind(React.createElement);

const App = () => {
  const [activeNodeIndex, setActiveNodeIndex] = useState(0);
  const [popupStage, setPopupStage] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const wasSolvedRef = useRef(false); // ใช้เช็คขอบเขตจากไม่ solved -> solved
  
  const SNAP_ANGLE = 90;
  // ตำแหน่งเฉลย: หมุน 90 องศา จะนำค่า Index 3 (ค่าสุดท้ายใน Array เช่น 85%) มาไว้ที่ด้านบนสุด
  const WINNING_ANGLE = 90;

  // ข้อมูลตามที่กำหนดมาเป๊ะๆ ห้ามเปลี่ยนเด็ดขาด
  const NODE_NAMES = ["SECURITY ALLOCATION DIAL – ROTATE LAYERS", "DATA VISIBILITY DIAL – ROTATE LAYERS", "EXPANSION SPEED DIAL – ROTATE LAYERS"];

  // ตัวอักษรเฉลยประจำแต่ละวง
  const NODE_SOLVED_CHAR = ["J", "S", "K"];

  const NODE_CONTENT = [
    {
      [RingLayer.OUTER]: ["30%", "50%", "72%", "85%"],
      [RingLayer.MIDDLE]: ["Low CCTV", "MODERATE", "High Suppression", "Lockdown"],
      [RingLayer.INNER]: ["CAPITAL ↓", "DATA ↑", "Risk Hidden", "Control ↑"]
    },
    {
      [RingLayer.OUTER]: ["40%", "55%", "70%", "90%"],
      [RingLayer.MIDDLE]: ["LIMITED", "FILTERED", "Transparent", "Full Disclosure"],
      [RingLayer.INNER]: ["Investor ↓", "Media ↑", "Expansion ↓", "Exposure ↑"]
    },
    {
      [RingLayer.OUTER]: ["1x", "2x", "3x", "5x"],
      [RingLayer.MIDDLE]: ["Local Trial", "Regional", "GLOBAL", "Aggressive"],
      [RingLayer.INNER]: ["Security ↑", "Capital ↑", "RISK ↑", "IMPACT ↑"]
    }
  ];

  const getRandomRotations = () => {
    // สุ่มตำแหน่ง 0, 180, 270 (ยกเว้น 90 ซึ่งเป็นเฉลย) เพื่อให้เกมเริ่มแบบยังไม่ชนะ
    const angles = [0, 180, 270];
    return {
      [RingLayer.OUTER]: angles[Math.floor(Math.random() * angles.length)],
      [RingLayer.MIDDLE]: 0, 
      [RingLayer.INNER]: 0, 
    };
  };

  const [nodesData, setNodesData] = useState([
    { rotations: getRandomRotations(), content: NODE_CONTENT[0] },
    { rotations: getRandomRotations(), content: NODE_CONTENT[1] },
    { rotations: getRandomRotations(), content: NODE_CONTENT[2] }
  ]);

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
    if (layer === RingLayer.INNER || layer === RingLayer.MIDDLE) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setActiveLayer(layer);
    dragStartAngle.current = getAngle(clientX, clientY);
    initialRotation.current = nodesData[activeNodeIndex].rotations[layer];
  };

  const handleDragMove = useCallback((e) => {
    const layer = activeLayer;
    if (layer === null) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const currentAngle = getAngle(clientX, clientY);
    const angleDiff = currentAngle - dragStartAngle.current;
    
    setNodesData(prev => {
      const newNodes = [...prev];
      newNodes[activeNodeIndex] = {
        ...newNodes[activeNodeIndex],
        rotations: {
          ...newNodes[activeNodeIndex].rotations,
          [layer]: initialRotation.current + angleDiff
        }
      };
      return newNodes;
    });
  }, [activeLayer, activeNodeIndex]);

  const handleDragEnd = useCallback(() => {
    const layer = activeLayer;
    if (layer === null) return;

    setNodesData(prev => {
      const newNodes = [...prev];
      const node = newNodes[activeNodeIndex];
      const snapped = Math.round(node.rotations[layer] / SNAP_ANGLE) * SNAP_ANGLE;
      newNodes[activeNodeIndex] = {
        ...node,
        rotations: { ...node.rotations, [layer]: snapped }
      };
      return newNodes;
    });
    setActiveLayer(null);
  }, [activeLayer, activeNodeIndex]);

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

  const currentNode = nodesData[activeNodeIndex];

  // แก้ไข logic การตรวจสอบ: ใช้สูตรหาค่าบวกของ Modulo 360 เพื่อรองรับค่าลบและการหมุนหลายรอบ
  const normalizedRotation = ((Math.round(currentNode.rotations[RingLayer.OUTER] / SNAP_ANGLE) * SNAP_ANGLE % 360) + 360) % 360;
  const isSolved = normalizedRotation === WINNING_ANGLE;

  // ตัวอักษรที่จะแสดงตรงกลาง
  const centerDisplayChar = isSolved ? NODE_SOLVED_CHAR[activeNodeIndex] : "?";

  // เด้ง popup ทุกครั้งที่ dial ปัจจุบันเปลี่ยนจาก “ไม่ใช่ J/S/K” -> “เป็น J/S/K”
  useEffect(() => {
    if (isSolved && !wasSolvedRef.current) {
      const stage = Math.min(activeNodeIndex + 1, 3); // 0=J,1=S,2=K
      setPopupStage(stage);
      setShowPopup(true);
      wasSolvedRef.current = true;
    }
    if (!isSolved && wasSolvedRef.current) {
      wasSolvedRef.current = false;
    }
  }, [isSolved, activeNodeIndex]);

  // เปลี่ยน node เมื่อกดปุ่มด้านล่าง ให้ถือว่าเริ่มสถานะ solved ใหม่
  useEffect(() => {
    wasSolvedRef.current = false;
  }, [activeNodeIndex]);

  return html`
    <div className="puzzle-container p-4 overflow-y-auto overflow-x-hidden">
      <!-- Responsive Dial Wrapper -->
      <div 
        ref=${containerRef}
        className=${`relative w-full aspect-square max-w-[320px] sm:max-w-[480px] lg:max-w-[580px] rounded-full border-[10px] sm:border-[16px] border-[#0c111d] bg-[#020617] shadow-[0_0_100px_rgba(0,0,0,0.9)] transition-all duration-700 mx-auto overflow-visible ${isSolved ? 'solved-glow' : ''}`}
      >
        <!-- Indicator Line (ด้านบน 12 นาฬิกา) -->
        <div className="absolute top-[-25px] left-1/2 translate-x-[-50%] w-[4px] h-[40px] bg-[#34d399] blur-[2px] z-50 opacity-50"></div>
        
        <svg viewBox="0 0 500 500" className="w-full h-full touch-none" style=${{ overflow: 'visible' }}>
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
            </pattern>
            <filter id="core-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" transform="translate(-250, -250)" />

          <${DialRing}
            layer=${RingLayer.OUTER}
            radius=${195}
            thickness=${75}
            rotation=${currentNode.rotations[RingLayer.OUTER]}
            isDragging=${activeLayer === RingLayer.OUTER}
            labels=${currentNode.content[RingLayer.OUTER]}
            onDragStart=${handleDragStart}
          />
          <${DialRing}
            layer=${RingLayer.MIDDLE}
            radius=${125}
            thickness=${65}
            rotation=${currentNode.rotations[RingLayer.MIDDLE]}
            isDragging=${activeLayer === RingLayer.MIDDLE}
            labels=${currentNode.content[RingLayer.MIDDLE]}
            onDragStart=${handleDragStart}
          />
          <${DialRing}
            layer=${RingLayer.INNER}
            radius=${65}
            thickness=${55}
            rotation=${currentNode.rotations[RingLayer.INNER]}
            isDragging=${activeLayer === RingLayer.INNER}
            labels=${currentNode.content[RingLayer.INNER]}
            onDragStart=${handleDragStart}
          />
          
          <g transform="translate(250, 250)">
            <circle r="44" fill="none" stroke=${isSolved ? "#34d399" : "#10b981"} strokeWidth="0.5" strokeDasharray="4,8" opacity="0.3" />
            <circle r="36" fill="#020617" stroke=${isSolved ? "#34d399" : "#10b981"} strokeWidth=${isSolved ? "3" : "2"} filter="url(#core-glow)" />
            <circle r="32" fill=${isSolved ? "#064e3b" : "#064e3b"} opacity=${isSolved ? "0.8" : "0.5"} />
            <text 
              x="0" 
              y="12" 
              fill=${isSolved ? "#34d399" : "#10b981"} 
              fontSize="48" 
              fontWeight="900" 
              textAnchor="middle" 
              className="font-orbitron select-none pointer-events-none"
              style=${{ textShadow: isSolved ? '0 0 25px #34d399' : '0 0 15px rgba(16, 185, 129, 0.8)' }}
            >
              ${centerDisplayChar}
            </text>
          </g>
        </svg>
      </div>

      <div className="mt-12 flex flex-col gap-3 w-full max-w-lg mx-auto">
        ${nodesData.map((node, i) => html`
          <button 
            key=${i}
            onClick=${() => setActiveNodeIndex(i)}
            className=${`w-full px-4 py-3 rounded-xl border text-[10px] sm:text-[11px] font-black tracking-widest transition-all duration-500 leading-relaxed text-center uppercase ${activeNodeIndex === i ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'bg-transparent border-slate-900 text-slate-600 hover:border-slate-700 hover:text-slate-400'}`}
          >
            ${NODE_NAMES[i]}
          </button>
        `)}
      </div>

      <div className="mt-8 text-[8px] sm:text-[9px] text-slate-800 tracking-[0.5em] uppercase font-bold opacity-30 text-center px-4">
        QUERY INTERFACE ACTIVE // SYSTEM 3.1.0
      </div>

      ${showPopup && popupStage !== null && html`
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="popup-panel max-w-md w-[90%] bg-slate-950/95 border border-emerald-500/40 rounded-3xl p-6 space-y-4 shadow-[0_0_60px_rgba(16,185,129,0.4)]">
            ${popupStage === 1 && html`
              <div>
                <div className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-2">
                  Extracted Communication Fragment
                </div>
                <p className="text-slate-100 text-sm font-serif">“Proceed.”</p>
                <p className="text-slate-100 text-sm font-serif">“Authorize deployment.”</p>
                <p className="text-slate-100 text-sm font-serif">“Maintain stability.”</p>
                <p className="text-slate-400 text-xs pt-2 font-serif">ไม่มีชื่อผู้สั่งการ</p>
                <p className="text-slate-400 text-xs font-serif">มีเพียงการตอบรับ</p>
              </div>
            `}

            ${popupStage === 2 && html`
              <div>
                <div className="text-[10px] tracking-[0.4em] uppercase text-emerald-400 mb-2">
                  Ω–Directive
                </div>
                <p className="text-slate-100 text-sm font-serif">“Confirmed.”</p>
                <p className="text-slate-100 text-sm font-serif">“Executed.”</p>
                <p className="text-slate-100 text-sm font-serif">“Access granted.”</p>
                <p className="text-slate-400 text-xs pt-2 font-serif">ในทุกคำสั่งที่ถูกดำเนินการ</p>
                <p className="text-slate-400 text-xs font-serif">ต้นทางถูกระบุเพียงรหัส:</p>
              </div>
            `}

            ${popupStage === 3 && html`
              <div>
                <div className="text-[10px] tracking-[0.4em] uppercase text-emerald-400 mb-2">
                  Ω–Directive
                </div>
                <p className="text-slate-100 text-sm font-serif">ไม่มีตัวตน</p>
                <p className="text-slate-100 text-sm font-serif">ไม่มีตำแหน่ง</p>
                <p className="text-slate-100 text-sm font-serif">ไม่มีการปรากฏในโครงสร้างภายนอก</p>
                <p className="text-slate-400 text-xs pt-2 font-serif">ผู้ดำเนินการไม่เคยตั้งคำถาม</p>
                <p className="text-slate-400 text-xs font-serif">เขาเพียงเชื่อว่ากำลังปกป้องระบบ</p>
                <p className="text-slate-400 text-xs font-serif">แต่ระบบที่เขาปกป้อง</p>
                <p className="text-slate-400 text-xs font-serif">อาจไม่ใช่สิ่งที่เขาเข้าใจ</p>
              </div>
            `}

            <button
              onClick=${() => setShowPopup(false)}
              className="mt-4 w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-[10px] font-black tracking-[0.4em] uppercase text-slate-300 border border-slate-700"
            >
              CONTINUE
            </button>
          </div>
        </div>
      `}
    </div>
  `;
};

export default App;
