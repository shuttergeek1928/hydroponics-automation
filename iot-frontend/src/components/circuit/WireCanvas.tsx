"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CircuitWire, Point, WireColor, TerminalPin } from '@/lib/circuit/types';
import { Trash2, Palette } from 'lucide-react';

interface WireCanvasProps {
  wires: CircuitWire[];
  terminals: Map<string, { term: TerminalPin; absPos: Point }>;
  selectedWireId: string | null;
  drawingWire: { fromTerminalId: string; currentMousePos: Point } | null;
  activeWireColor: WireColor;
  isSimulating: boolean;
  onSelectWire: (wireId: string | null) => void;
  onDeleteWire: (wireId: string) => void;
  onChangeWireColor: (color: WireColor) => void;
}

export const WIRE_COLOR_HEX: Record<WireColor, string> = {
  red: '#ef4444',
  black: '#1e293b',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  white: '#f8fafc',
};

// Helper: Calculate smooth Bezier path string between two points with waypoints
export function getWirePathD(start: Point, end: Point, waypoints: Point[] = []): string {
  if (waypoints.length > 0) {
    let d = `M ${start.x} ${start.y}`;
    waypoints.forEach((wp) => {
      d += ` L ${wp.x} ${wp.y}`;
    });
    d += ` L ${end.x} ${end.y}`;
    return d;
  }

  // Smooth curved wire (drapes naturally like a physical jumper wire)
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const slack = Math.min(dist * 0.25, 60);

  const ctrl1X = start.x + dx * 0.2;
  const ctrl1Y = start.y + dy * 0.2 + slack;
  const ctrl2X = start.x + dx * 0.8;
  const ctrl2Y = start.y + dy * 0.8 + slack;

  return `M ${start.x} ${start.y} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${end.x} ${end.y}`;
}

export default function WireCanvas({
  wires,
  terminals,
  selectedWireId,
  drawingWire,
  activeWireColor,
  isSimulating,
  onSelectWire,
  onDeleteWire,
  onChangeWireColor,
}: WireCanvasProps) {
  const activeWireObj = wires.find((w) => w.id === selectedWireId);

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      <svg className="w-full h-full">
        {/* Render Saved Wires */}
        {wires.map((wire) => {
          const from = terminals.get(wire.fromTerminalId)?.absPos;
          const to = terminals.get(wire.toTerminalId)?.absPos;
          if (!from || !to) return null;

          const pathD = getWirePathD(from, to, wire.waypoints);
          const isSelected = wire.id === selectedWireId;
          const strokeHex = WIRE_COLOR_HEX[wire.color] || WIRE_COLOR_HEX.blue;

          return (
            <g key={wire.id} className="pointer-events-auto cursor-pointer" onClick={() => onSelectWire(wire.id)}>
              {/* Outer Glow / Hit Target */}
              <path
                d={pathD}
                stroke={isSelected ? '#38bdf8' : 'transparent'}
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                opacity="0.8"
              />

              {/* Wire Core Insulation Line */}
              <motion.path
                d={pathD}
                stroke={strokeHex}
                strokeWidth={isSelected ? '4' : '3.5'}
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
              />

              {/* Terminal End Caps */}
              <circle cx={from.x} cy={from.y} r="4" fill={strokeHex} stroke="#0f172a" strokeWidth="1.5" />
              <circle cx={to.x} cy={to.y} r="4" fill={strokeHex} stroke="#0f172a" strokeWidth="1.5" />

              {/* Simulation Mode Data Pulse Animation */}
              {isSimulating && (
                <motion.circle
                  r="3.5"
                  fill="#ffffff"
                  initial={{ offsetDistance: '0%' }}
                  animate={{ offsetDistance: '100%' }}
                  style={{ offsetPath: `path('${pathD}')` }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              )}
            </g>
          );
        })}

        {/* Render In-Progress Wire Drawing Line */}
        {drawingWire && (() => {
          const from = terminals.get(drawingWire.fromTerminalId)?.absPos;
          if (!from) return null;
          const pathD = getWirePathD(from, drawingWire.currentMousePos);
          const strokeHex = WIRE_COLOR_HEX[activeWireColor];

          return (
            <g className="pointer-events-none">
              <path d={pathD} stroke={strokeHex} strokeWidth="3.5" strokeDasharray="5 3" fill="none" opacity="0.9" />
              <circle cx={from.x} cy={from.y} r="5" fill={strokeHex} />
              <circle cx={drawingWire.currentMousePos.x} cy={drawingWire.currentMousePos.y} r="4" fill={strokeHex} />
            </g>
          );
        })()}
      </svg>

      {/* Floating Wire Inspection & Color Selector Toolbar when wire selected */}
      {activeWireObj && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-3 p-2 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-2xl z-40">
          <div className="flex items-center gap-1 px-2 border-r border-slate-800">
            <Palette className="w-4 h-4 text-sky-400 mr-1" />
            <span className="text-xs font-bold text-slate-300">Wire Color:</span>
          </div>

          {/* Wire Color Picker Swatches */}
          <div className="flex items-center gap-1.5">
            {(Object.keys(WIRE_COLOR_HEX) as WireColor[]).map((cKey) => (
              <button
                key={cKey}
                onClick={() => onChangeWireColor(cKey)}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  activeWireObj.color === cKey ? 'scale-125 border-sky-400 shadow-lg' : 'border-slate-700 hover:scale-110'
                }`}
                style={{ backgroundColor: WIRE_COLOR_HEX[cKey] }}
                title={cKey.toUpperCase()}
              />
            ))}
          </div>

          {/* Delete Wire Button */}
          <button
            onClick={() => onDeleteWire(activeWireObj.id)}
            className="flex items-center gap-1 ml-2 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold hover:bg-rose-500/20 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Wire
          </button>
        </div>
      )}
    </div>
  );
}
