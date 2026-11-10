"use client";

import React from 'react';
import { TerminalPin } from '@/lib/circuit/types';
import { Trash2 } from 'lucide-react';

interface MCUBoardSVGProps {
  componentId: string;
  type: 'esp32' | 'esp8266';
  name: string;
  activeTerminalId?: string | null;
  onTerminalClick?: (terminal: TerminalPin) => void;
  onDelete?: () => void;
}

interface PinSpec {
  idSuffix: string;
  name: string;
  type: TerminalPin['type'];
}

export function generateMcuTerminals(componentId: string, type: 'esp32' | 'esp8266'): TerminalPin[] {
  const PIN_SPACING = 36;
  const startX = 50;

  const esp32Top: PinSpec[] = [
    { idSuffix: 'en', name: 'EN', type: 'vcc' },
    { idSuffix: 'g36', name: 'VP (36)', type: 'gpio' },
    { idSuffix: 'g39', name: 'VN (39)', type: 'gpio' },
    { idSuffix: 'g34', name: 'G34', type: 'gpio' },
    { idSuffix: 'g35', name: 'G35', type: 'gpio' },
    { idSuffix: 'g32', name: 'G32', type: 'gpio' },
    { idSuffix: 'g33', name: 'G33', type: 'gpio' },
    { idSuffix: 'g25', name: 'G25', type: 'gpio' },
    { idSuffix: 'g26', name: 'G26', type: 'gpio' },
    { idSuffix: 'g27', name: 'G27', type: 'gpio' },
    { idSuffix: 'g14', name: 'G14', type: 'gpio' },
    { idSuffix: 'g12', name: 'G12', type: 'gpio' },
    { idSuffix: 'g13', name: 'G13', type: 'gpio' },
    { idSuffix: 'gnd1', name: 'GND', type: 'gnd' },
    { idSuffix: 'vin', name: 'VIN (5V)', type: 'vcc' },
  ];

  const esp32Bot: PinSpec[] = [
    { idSuffix: '3v3', name: '3V3', type: 'vcc' },
    { idSuffix: 'gnd2', name: 'GND', type: 'gnd' },
    { idSuffix: 'g15', name: 'G15', type: 'gpio' },
    { idSuffix: 'g2', name: 'G2', type: 'gpio' },
    { idSuffix: 'g4', name: 'G4', type: 'gpio' },
    { idSuffix: 'g16', name: 'G16', type: 'gpio' },
    { idSuffix: 'g17', name: 'G17', type: 'gpio' },
    { idSuffix: 'g5', name: 'G5', type: 'gpio' },
    { idSuffix: 'g18', name: 'G18', type: 'gpio' },
    { idSuffix: 'g19', name: 'G19', type: 'gpio' },
    { idSuffix: 'g21', name: 'G21', type: 'gpio' },
    { idSuffix: 'rx0', name: 'RX0', type: 'gpio' },
    { idSuffix: 'tx0', name: 'TX0', type: 'gpio' },
    { idSuffix: 'g22', name: 'G22', type: 'gpio' },
    { idSuffix: 'g23', name: 'G23', type: 'gpio' },
  ];

  const esp8266Top: PinSpec[] = [
    { idSuffix: 'a0', name: 'A0', type: 'gpio' },
    { idSuffix: 'rsv1', name: 'RSV', type: 'gpio' },
    { idSuffix: 'rsv2', name: 'RSV', type: 'gpio' },
    { idSuffix: 'sd3', name: 'SD3', type: 'gpio' },
    { idSuffix: 'sd2', name: 'SD2', type: 'gpio' },
    { idSuffix: 'sd1', name: 'SD1', type: 'gpio' },
    { idSuffix: 'cmd', name: 'CMD', type: 'gpio' },
    { idSuffix: 'sd0', name: 'SD0', type: 'gpio' },
    { idSuffix: 'clk', name: 'CLK', type: 'gpio' },
    { idSuffix: 'gnd1', name: 'GND', type: 'gnd' },
    { idSuffix: '3v3_1', name: '3V3', type: 'vcc' },
    { idSuffix: 'en', name: 'EN', type: 'vcc' },
    { idSuffix: 'rst', name: 'RST', type: 'vcc' },
    { idSuffix: 'gnd2', name: 'GND', type: 'gnd' },
    { idSuffix: 'vin', name: 'VIN (5V)', type: 'vcc' },
  ];

  const esp8266Bot: PinSpec[] = [
    { idSuffix: 'd0', name: 'D0', type: 'gpio' },
    { idSuffix: 'd1', name: 'D1', type: 'gpio' },
    { idSuffix: 'd2', name: 'D2', type: 'gpio' },
    { idSuffix: 'd3', name: 'D3', type: 'gpio' },
    { idSuffix: 'd4', name: 'D4', type: 'gpio' },
    { idSuffix: '3v3_2', name: '3V3', type: 'vcc' },
    { idSuffix: 'gnd3', name: 'GND', type: 'gnd' },
    { idSuffix: 'd5', name: 'D5', type: 'gpio' },
    { idSuffix: 'd6', name: 'D6', type: 'gpio' },
    { idSuffix: 'd7', name: 'D7', type: 'gpio' },
    { idSuffix: 'd8', name: 'D8', type: 'gpio' },
    { idSuffix: 'rx', name: 'RX', type: 'gpio' },
    { idSuffix: 'tx', name: 'TX', type: 'gpio' },
    { idSuffix: 'gnd4', name: 'GND', type: 'gnd' },
    { idSuffix: '3v3_3', name: '3V3', type: 'vcc' },
  ];

  const topSpecs = type === 'esp32' ? esp32Top : esp8266Top;
  const botSpecs = type === 'esp32' ? esp32Bot : esp8266Bot;

  const terminals: TerminalPin[] = [];

  // Top Pins (y = 10)
  topSpecs.forEach((spec, idx) => {
    terminals.push({
      id: `${componentId}_${spec.idSuffix}`,
      componentId,
      name: spec.name,
      type: spec.type,
      relPos: { x: startX + idx * PIN_SPACING, y: 10 },
    });
  });

  // Bottom Pins (y = 170)
  botSpecs.forEach((spec, idx) => {
    terminals.push({
      id: `${componentId}_${spec.idSuffix}`,
      componentId,
      name: spec.name,
      type: spec.type,
      relPos: { x: startX + idx * PIN_SPACING, y: 170 },
    });
  });

  return terminals;
}

export default function MCUBoardSVG({
  componentId,
  type,
  name,
  activeTerminalId,
  onTerminalClick,
  onDelete,
}: MCUBoardSVGProps) {
  const terminals = generateMcuTerminals(componentId, type);
  const chipLabel = type === 'esp32' ? 'ESP-WROOM-32' : 'ESP8266MOD';
  const subLabel = type === 'esp32' ? 'Dual Core 2.4GHz Wi-Fi + BT' : '802.11 b/g/n Wi-Fi SoC';

  return (
    <div className="relative group">
      {/* Floating Action Bar (Delete & Title) */}
      <div className="absolute -top-9 right-0 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <span className="text-xs font-bold text-slate-200">{name}</span>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
            title="Delete Board"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <svg width="600" height="180" viewBox="0 0 600 180" className="drop-shadow-2xl select-none overflow-visible">
        {/* Main Dark PCB Board Footprint */}
        <rect x="20" y="10" width="560" height="160" rx="14" fill="#090d16" stroke="#334155" strokeWidth="4" />
        
        {/* Micro USB Port on Left */}
        <rect x="0" y="55" width="20" height="70" rx="4" fill="#475569" stroke="#334155" strokeWidth="2" />
        <rect x="5" y="65" width="15" height="50" rx="2" fill="#0f172a" />

        {/* Wi-Fi Antenna Trace on Right */}
        <rect x="540" y="30" width="30" height="120" rx="4" fill="#020617" />
        <path d="M 555 40 Q 545 55 555 70 T 555 100 T 555 130" stroke="#f59e0b" strokeWidth="2" fill="none" />

        {/* Central Metal Shield */}
        <rect x="180" y="35" width="200" height="110" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
        <text x="280" y="85" fill="#f8fafc" fontSize="15" fontFamily="monospace" fontWeight="900" textAnchor="middle">
          {chipLabel}
        </text>
        <text x="280" y="108" fill="#94a3b8" fontSize="10" fontFamily="sans-serif" textAnchor="middle" fontWeight="500">
          {subLabel}
        </text>

        {/* Status LED PWR */}
        <circle cx="60" cy="35" r="4" fill="#22c55e" className="animate-pulse" />
        <text x="70" y="38" fill="#94a3b8" fontSize="9" fontFamily="monospace" fontWeight="bold">PWR</text>

        {/* Render 30 Metallic DIP Pins */}
        {terminals.map((term) => {
          const isActive = activeTerminalId === term.id;
          const isTop = term.relPos.y < 90;
          const textY = isTop ? term.relPos.y + 24 : term.relPos.y - 12;

          return (
            <g key={term.id} className="cursor-pointer group/pin" onClick={() => onTerminalClick?.(term)}>
              {/* Pin Header Square Socket */}
              <rect
                x={term.relPos.x - 7}
                y={term.relPos.y - 7}
                width="14"
                height="14"
                rx="3"
                fill={isActive ? '#38bdf8' : term.type === 'vcc' ? '#ef4444' : term.type === 'gnd' ? '#334155' : '#0284c7'}
                stroke={isActive ? '#ffffff' : '#090d16'}
                strokeWidth="2"
              />

              {/* Pin Text Label */}
              <text
                x={term.relPos.x}
                y={textY}
                fill={isActive ? '#ffffff' : term.type === 'vcc' ? '#f87171' : term.type === 'gnd' ? '#94a3b8' : '#38bdf8'}
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                {term.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
