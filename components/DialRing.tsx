
import React, { useMemo } from 'react';
import { RingLayer } from '../types';

interface DialRingProps {
  layer: RingLayer;
  radius: number;
  thickness: number;
  rotation: number;
  color: string;
  isActive: boolean;
  isDragging: boolean;
  onDragStart: (layer: RingLayer, e: React.MouseEvent | React.TouchEvent) => void;
}

const DialRing: React.FC<DialRingProps> = ({
  layer,
  radius,
  thickness,
  rotation,
  color,
  isActive,
  isDragging,
  onDragStart
}) => {
  const innerR = radius - thickness / 2;
  const outerR = radius + thickness / 2;
  const clipId = `clip-${layer}`;

  // ตรวจสอบว่าตรงตำแหน่ง 12 นาฬิกาหรือไม่ (เพื่อทำเอฟเฟกต์ Glow ตอนเฉลย)
  const isAligned = useMemo(() => {
    const norm = ((rotation % 360) + 360) % 360;
    return norm < 3 || norm > 357;
  }, [rotation]);

  // สร้างเศษกระจกพื้นหลัง (Camouflage Mosaic)
  const shards = useMemo(() => {
    const shardList = [];
    const radialSegments = 2; 
    const angularSegments = layer === RingLayer.OUTER ? 32 : 24; 
    
    for (let r = 0; r < radialSegments; r++) {
      for (let a = 0; a < angularSegments; a++) {
        const jitter = (Math.random() - 0.5) * 5;
        const rStart = innerR + (r * (thickness / radialSegments));
        const rEnd = innerR + ((r + 1) * (thickness / radialSegments));
        const aStart = (a * (360 / angularSegments) + jitter) * (Math.PI / 180);
        const aEnd = ((a + 1) * (360 / angularSegments) + jitter) * (Math.PI / 180);
        
        const p1x = 250 + rStart * Math.cos(aStart);
        const p1y = 250 + rStart * Math.sin(aStart);
        const p2x = 250 + rEnd * Math.cos(aStart);
        const p2y = 250 + rEnd * Math.sin(aStart);
        const p3x = 250 + rEnd * Math.cos(aEnd);
        const p3y = 250 + rEnd * Math.sin(aEnd);
        const p4x = 250 + rStart * Math.cos(aEnd);
        const p4y = 250 + rStart * Math.sin(aEnd);

        shardList.push({
          d: `M ${p1x} ${p1y} L ${p2x} ${p2y} A ${rEnd} ${rEnd} 0 0 1 ${p3x} ${p3y} L ${p4x} ${p4y} A ${rStart} ${rStart} 0 0 0 ${p1x} ${p1y} Z`,
          opacity: 0.2 + Math.random() * 0.3,
          fill: color,
          highlightD: `M ${p1x+1} ${p1y+1} A ${rEnd-1} ${rEnd-1} 0 0 1 ${p3x-1} ${p3y-1}`
        });
      }
    }
    return shardList;
  }, [innerR, thickness, layer, color]);

  const DaggerSegment = () => {
    // พรางสีใบมีดให้ใกล้เคียงพื้นหลังมากขึ้น (ไม่ใช่สีขาวจ้า)
    const bladeColor = isAligned ? "#cbd5e1" : "#334155"; 
    const bloodColor = isAligned ? "#dc2626" : "#450a0a";

    return (
      <g transform="translate(250, 250) rotate(-90)">
        {layer === RingLayer.OUTER && (
          <g>
            <path d="M 235 0 L 195 -18 L 195 0 Z" fill={bladeColor} fillOpacity="0.5" stroke="#000" strokeWidth="2" />
            <path d="M 235 0 L 195 18 L 195 0 Z" fill={bladeColor} fillOpacity="0.4" stroke="#000" strokeWidth="2" />
            <path d="M 232 0 L 218 -5 L 218 5 Z" fill={bloodColor} fillOpacity="0.6" stroke="#000" strokeWidth="1" />
          </g>
        )}
        
        {layer === RingLayer.OUTER_MID && (
          <g>
            <path d="M 195 -18 L 150 -22 L 150 0 L 195 0 Z" fill={bladeColor} fillOpacity="0.5" stroke="#000" strokeWidth="2" />
            <path d="M 195 18 L 150 22 L 150 0 L 195 0 Z" fill={bladeColor} fillOpacity="0.4" stroke="#000" strokeWidth="2" />
            <path d="M 175 12 L 150 16 L 150 22 Z" fill={bloodColor} fillOpacity="0.6" stroke="#000" strokeWidth="1" />
          </g>
        )}

        {layer === RingLayer.MIDDLE && (
          <g>
            <path d="M 150 -22 L 115 -22 L 115 22 L 150 22 Z" fill={isAligned ? "#475569" : "#1e293b"} fillOpacity="0.6" stroke="#000" strokeWidth="2" />
            <path d="M 115 -45 L 102 -45 L 102 45 L 115 45 Z" fill="#020617" stroke="#000" strokeWidth="3" />
            <rect x="105" y="-35" width="5" height="15" fill={bloodColor} fillOpacity="0.4" />
          </g>
        )}

        {layer === RingLayer.INNER_MID && (
          <g>
            <path d="M 102 -15 L 60 -15 L 60 15 L 102 15 Z" fill="#0f172a" stroke="#000" strokeWidth="3" />
            <line x1="85" y1="-15" x2="85" y2="15" stroke="#000" strokeWidth="2" />
            <line x1="72" y1="-15" x2="72" y2="15" stroke="#000" strokeWidth="2" />
          </g>
        )}

        {layer === RingLayer.INNER && (
          <g>
            <path d="M 60 -12 L 40 -12 L 40 12 L 60 12 Z" fill="#020617" stroke="#000" strokeWidth="2.5" />
            <circle cx="28" cy="0" r="16" fill="#000" stroke="#000" strokeWidth="3" />
            <path d="M 28 -8 L 20 0 L 28 8 L 36 0 Z" fill={isAligned ? "#ef4444" : "#450a0a"} stroke="#000" strokeWidth="1" className={isAligned ? "animate-pulse" : ""} />
          </g>
        )}
      </g>
    );
  };

  return (
    <g 
      className="cursor-grab active:cursor-grabbing"
      onMouseDown={(e) => onDragStart(layer, e)}
      onTouchStart={(e) => onDragStart(layer, e)}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={`
            M 250, ${250 - outerR}
            A ${outerR},${outerR} 0 1,1 250,${250 + outerR}
            A ${outerR},${outerR} 0 1,1 250,${250 - outerR}
            Z
            M 250, ${250 - innerR}
            A ${innerR},${innerR} 0 1,0 250,${250 + innerR}
            A ${innerR},${innerR} 0 1,0 250,${250 - innerR}
            Z
          `} fillRule="evenodd" />
        </clipPath>

        <filter id="glassTexture">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
        </filter>
      </defs>

      <g clipPath={`url(#${clipId})`} filter="url(#glassTexture)">
        <circle cx="250" cy="250" r={outerR} fill="#050505" />
        
        <g style={{ 
          transform: `rotate(${rotation}deg)`, 
          transformOrigin: '250px 250px',
          transition: isDragging ? 'none' : 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* Shards background */}
          {shards.map((shard, i) => (
            <g key={i}>
              <path 
                d={shard.d} 
                fill={shard.fill} 
                fillOpacity={shard.opacity} 
                stroke="#000" 
                strokeWidth="1.5"
              />
              <path 
                d={shard.highlightD} 
                stroke="#ffffff" 
                strokeWidth="0.5" 
                strokeOpacity="0.1" 
                fill="none" 
              />
            </g>
          ))}
          
          <DaggerSegment />
        </g>
      </g>

      {/* Frame Leading */}
      <circle cx="250" cy="250" r={outerR} fill="none" stroke="#111" strokeWidth="5" />
      <circle cx="250" cy="250" r={innerR} fill="none" stroke="#111" strokeWidth="5" />
    </g>
  );
};

export default DialRing;
