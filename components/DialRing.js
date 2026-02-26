
import React, { useMemo } from 'react';
import htm from 'htm';
import { RingLayer } from '../types.js';

const html = htm.bind(React.createElement);

const DialRing = ({
  layer,
  radius,
  thickness,
  rotation,
  isDragging,
  labels,
  onDragStart
}) => {
  // วงแหวนชั้นใน (INNER) และชั้นกลาง (MIDDLE) จะเป็นแบบนิ่ง (Static)
  const isStatic = layer === RingLayer.INNER || layer === RingLayer.MIDDLE;

  const styles = {
    [RingLayer.OUTER]: { start: "#0f172a", end: "#020617", text: "#f8fafc", fontSize: "28px" },
    [RingLayer.MIDDLE]: { start: "#1e293b", end: "#0f172a", text: "#cbd5e1", fontSize: "18px" },
    [RingLayer.INNER]: { start: "#334155", end: "#020617", text: "#94a3b8", fontSize: "13px" }
  };

  const config = styles[layer] || styles[RingLayer.OUTER];

  const labelElements = useMemo(() => {
    const list = labels || ["", "", "", ""];
    return list.map((text, i) => {
      const angle = (i * 90) - 90;
      const rad = (angle * Math.PI) / 180;
      const x = 250 + radius * Math.cos(rad);
      const y = 250 + radius * Math.sin(rad);
      const textRotation = angle + 90;
      return { text, x, y, rotation: textRotation };
    });
  }, [labels, radius]);

  const gradId = `grad-${layer}`;

  return html`
    <g 
      className=${`${isStatic ? 'cursor-default' : 'cursor-pointer'} transition-opacity duration-300 opacity-90 hover:opacity-100 touch-none`}
      onMouseDown=${(e) => !isStatic && onDragStart(layer, e)}
      onTouchStart=${(e) => !isStatic && onDragStart(layer, e)}
    >
      <defs>
        <linearGradient id=${gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style=${{stopColor: config.start, stopOpacity: 1}} />
          <stop offset="100%" style=${{stopColor: config.end, stopOpacity: 1}} />
        </linearGradient>
      </defs>

      <circle 
        cx="250" cy="250" r=${radius} 
        fill="none" 
        stroke=${`url(#${gradId})`} 
        strokeWidth=${thickness}
        className="transition-all duration-500"
      />

      <circle cx="250" cy="250" r=${radius + thickness/2} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <circle cx="250" cy="250" r=${radius - thickness/2} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

      <g 
        style=${{ 
          transform: `rotate(${rotation}deg)`, 
          transformOrigin: '250px 250px',
          transition: isDragging ? 'none' : 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        ${Array.from({length: 24}).map((_, i) => {
          const deg = i * 15;
          const rad = (deg - 90) * (Math.PI / 180);
          const outerEdge = radius + (thickness/2);
          const innerEdge = radius - (thickness/2);
          return html`
            <line 
              key=${i}
              x1=${250 + outerEdge * Math.cos(rad)} 
              y1=${250 + outerEdge * Math.sin(rad)} 
              x2=${250 + (outerEdge - 8) * Math.cos(rad)} 
              y2=${250 + (outerEdge - 8) * Math.sin(rad)} 
              stroke="rgba(255,255,255,0.1)" 
              strokeWidth="1" 
            />
          `
        })}

        ${labelElements.map((item, i) => html`
          <text
            key=${i}
            x=${item.x}
            y=${item.y}
            fill=${config.text}
            fontSize=${config.fontSize}
            fontWeight="900"
            textAnchor="middle"
            dominantBaseline="middle"
            transform=${`rotate(${item.rotation}, ${item.x}, ${item.y})`}
            className="select-none pointer-events-none font-orbitron"
            style=${{ 
              textShadow: '0 2px 10px rgba(0,0,0,0.8)'
            }}
          >
            ${item.text}
          </text>
        `)}
      </g>
    </g>
  `;
};

export default DialRing;
