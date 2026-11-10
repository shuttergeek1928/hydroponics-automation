"use client";

import React from 'react';
import { TerminalPin } from '@/lib/circuit/types';
import { Trash2 } from 'lucide-react';

interface BreadboardSVGProps {
  componentId: string;
  width?: number;
  height?: number;
  activeTerminalId?: string | null;
  onTerminalClick?: (terminal: TerminalPin) => void;
  onDelete?: () => void;
}

export function generateBreadboardTerminals(componentId: string): TerminalPin[] {
  const terminals: TerminalPin[] = [];
  const startX = 40;
  const colSpacing = 12;
  const rowSpacing = 12;

  // Power Rails Top (+ 5V and - GND)
  for (let c = 1; c <= 50; c++) {
    const x = startX + c * colSpacing;
    terminals.push({
      id: `${componentId}_rail_vcc_top_${c}`,
      componentId,
      name: `RAIL_VCC_TOP_${c}`,
      type: 'vcc',
      relPos: { x, y: 20 },
    });
    terminals.push({
      id: `${componentId}_rail_gnd_top_${c}`,
      componentId,
      name: `RAIL_GND_TOP_${c}`,
      type: 'gnd',
      relPos: { x, y: 34 },
    });
  }

  // Rows A, B, C, D, E (Top Half)
  const topRows = ['A', 'B', 'C', 'D', 'E'];
  topRows.forEach((rName, rIdx) => {
    for (let c = 1; c <= 63; c++) {
      const x = startX + c * colSpacing;
      const y = 60 + rIdx * rowSpacing;
      terminals.push({
        id: `${componentId}_h_${c}_${rName}`,
        componentId,
        name: `H_${c}_${rName}`,
        type: 'breadboard-hole',
        relPos: { x, y },
      });
    }
  });

  // Rows F, G, H, I, J (Bottom Half)
  const botRows = ['F', 'G', 'H', 'I', 'J'];
  botRows.forEach((rName, rIdx) => {
    for (let c = 1; c <= 63; c++) {
      const x = startX + c * colSpacing;
      const y = 145 + rIdx * rowSpacing;
      terminals.push({
        id: `${componentId}_h_${c}_${rName}`,
        componentId,
        name: `H_${c}_${rName}`,
        type: 'breadboard-hole',
        relPos: { x, y },
      });
    }
  });

  // Power Rails Bottom (+ 5V and - GND)
  for (let c = 1; c <= 50; c++) {
    const x = startX + c * colSpacing;
    terminals.push({
      id: `${componentId}_rail_vcc_bot_${c}`,
      componentId,
      name: `RAIL_VCC_BOT_${c}`,
      type: 'vcc',
      relPos: { x, y: 215 },
    });
    terminals.push({
      id: `${componentId}_rail_gnd_bot_${c}`,
      componentId,
      name: `RAIL_GND_BOT_${c}`,
      type: 'gnd',
      relPos: { x, y: 229 },
    });
  }

  return terminals;
}

export default function BreadboardSVG({
  componentId,
  width = 840,
  height = 250,
  activeTerminalId,
  onTerminalClick,
  onDelete,
}: BreadboardSVGProps) {
  const terminals = generateBreadboardTerminals(componentId);

  return (
    <div className="relative group">
      {/* Floating Action Bar (Delete Breadboard) */}
      {onDelete && (
        <div className="absolute -top-9 right-4 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <span className="text-xs font-bold text-slate-200">830-Point Breadboard</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
            title="Delete Breadboard from Playground"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <svg width={width} height={height} viewBox="0 0 840 250" className="drop-shadow-xl select-none">
        {/* Solderless Breadboard Main Cream Body */}
        <rect x="10" y="5" width="820" height="240" rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="4" />
        
        {/* Center Divider Groove */}
        <rect x="25" y="122" width="790" height="12" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />

        {/* Power Rail Lines (+ Red, - Blue) */}
        <line x1="45" y1="16" x2="800" y2="16" stroke="#ef4444" strokeWidth="2" strokeDasharray="18 4" />
        <line x1="45" y1="40" x2="800" y2="40" stroke="#3b82f6" strokeWidth="2" strokeDasharray="18 4" />

        <line x1="45" y1="211" x2="800" y2="211" stroke="#ef4444" strokeWidth="2" strokeDasharray="18 4" />
        <line x1="45" y1="235" x2="800" y2="235" stroke="#3b82f6" strokeWidth="2" strokeDasharray="18 4" />

        {/* Row Labels (1 to 63) */}
        {[1, 10, 20, 30, 40, 50, 60].map((num) => (
          <React.Fragment key={`lbl-num-${num}`}>
            <text x={40 + num * 12} y="54" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              {num}
            </text>
            <text x={40 + num * 12} y="202" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              {num}
            </text>
          </React.Fragment>
        ))}

        {/* Column Letter Labels (A-E, F-J) */}
        {['A', 'B', 'C', 'D', 'E'].map((letter, idx) => (
          <text key={`lbl-${letter}`} x="28" y={63 + idx * 12} fill="#64748b" fontSize="8" fontFamily="monospace" fontWeight="bold">
            {letter}
          </text>
        ))}
        {['F', 'G', 'H', 'I', 'J'].map((letter, idx) => (
          <text key={`lbl-${letter}`} x="28" y={148 + idx * 12} fill="#64748b" fontSize="8" fontFamily="monospace" fontWeight="bold">
            {letter}
          </text>
        ))}

        {/* Render 830 Pin Holes */}
        {terminals.map((term) => {
          const isActive = activeTerminalId === term.id;
          const isPower = term.type === 'vcc';
          const isGnd = term.type === 'gnd';

          return (
            <g key={term.id} className="cursor-pointer group/hole" onClick={() => onTerminalClick?.(term)}>
              {/* Square Metal Hole */}
              <rect
                x={term.relPos.x - 3.5}
                y={term.relPos.y - 3.5}
                width="7"
                height="7"
                rx="1"
                fill={isActive ? '#38bdf8' : '#1e293b'}
                stroke={isActive ? '#0284c7' : isPower ? '#f87171' : isGnd ? '#60a5fa' : '#94a3b8'}
                strokeWidth={isActive ? '2' : '0.8'}
              />
              {/* Hover Highlight Ring */}
              <circle
                cx={term.relPos.x}
                cy={term.relPos.y}
                r="6"
                fill="none"
                stroke="#0284c7"
                strokeWidth="1.5"
                className="opacity-0 group-hover/hole:opacity-100 transition-opacity"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
