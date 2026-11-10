"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Device, SensorReading } from '@/lib/api';
import {
  Activity,
  Droplet,
  Gauge,
  Flame,
  Zap,
  Lightbulb,
  Thermometer,
  RotateCcw,
  Plus,
  Trash2,
  Settings2,
  Save,
  Check,
  Power
} from 'lucide-react';

export type BoardType = 'esp32' | 'esp8266';

interface LiveCircuitBoardProps {
  device: Device | null;
}

export interface PlacedComponent {
  instanceId: string;
  type: 'ph' | 'tds' | 'waterLevel' | 'do' | 'pump' | 'led' | 'dht22' | 'solenoid';
  name: string;
  pinKey: string; // Pin ID it connects to
  pos: { x: number; y: number }; // Canvas coordinates
}

interface PinDef {
  id: string;
  label: string;
  row: 'top' | 'bottom';
  index: number; // 0 to 14
  pinType: 'gpio' | 'power' | 'gnd';
}

interface BoardProfile {
  name: string;
  chipLabel: string;
  subLabel: string;
  topPins: PinDef[];
  bottomPins: PinDef[];
  vccPinId: string;
  gndPinId: string;
}

const BOARD_PROFILES: Record<BoardType, BoardProfile> = {
  esp32: {
    name: 'ESP32 WROOM-32 (30-Pin DevKit)',
    chipLabel: 'ESP-WROOM-32',
    subLabel: 'Dual Core 2.4GHz Wi-Fi + BT',
    vccPinId: 'vin',
    gndPinId: 'gnd1',
    topPins: [
      { id: 'en', label: 'EN', row: 'top', index: 0, pinType: 'power' },
      { id: 'gpio-36', label: 'VP/36', row: 'top', index: 1, pinType: 'gpio' },
      { id: 'gpio-39', label: 'VN/39', row: 'top', index: 2, pinType: 'gpio' },
      { id: 'gpio-34', label: 'G34', row: 'top', index: 3, pinType: 'gpio' },
      { id: 'gpio-35', label: 'G35', row: 'top', index: 4, pinType: 'gpio' },
      { id: 'gpio-32', label: 'G32', row: 'top', index: 5, pinType: 'gpio' },
      { id: 'gpio-33', label: 'G33', row: 'top', index: 6, pinType: 'gpio' },
      { id: 'gpio-25', label: 'G25', row: 'top', index: 7, pinType: 'gpio' },
      { id: 'gpio-26', label: 'G26', row: 'top', index: 8, pinType: 'gpio' },
      { id: 'gpio-27', label: 'G27', row: 'top', index: 9, pinType: 'gpio' },
      { id: 'gpio-14', label: 'G14', row: 'top', index: 10, pinType: 'gpio' },
      { id: 'gpio-12', label: 'G12', row: 'top', index: 11, pinType: 'gpio' },
      { id: 'gpio-13', label: 'G13', row: 'top', index: 12, pinType: 'gpio' },
      { id: 'gnd1', label: 'GND', row: 'top', index: 13, pinType: 'gnd' },
      { id: 'vin', label: '5V', row: 'top', index: 14, pinType: 'power' },
    ],
    bottomPins: [
      { id: '3v3', label: '3V3', row: 'bottom', index: 0, pinType: 'power' },
      { id: 'gnd2', label: 'GND', row: 'bottom', index: 1, pinType: 'gnd' },
      { id: 'gpio-15', label: 'G15', row: 'bottom', index: 2, pinType: 'gpio' },
      { id: 'gpio-2', label: 'G2', row: 'bottom', index: 3, pinType: 'gpio' },
      { id: 'gpio-4', label: 'G4', row: 'bottom', index: 4, pinType: 'gpio' },
      { id: 'gpio-16', label: 'G16', row: 'bottom', index: 5, pinType: 'gpio' },
      { id: 'gpio-17', label: 'G17', row: 'bottom', index: 6, pinType: 'gpio' },
      { id: 'gpio-5', label: 'G5', row: 'bottom', index: 7, pinType: 'gpio' },
      { id: 'gpio-18', label: 'G18', row: 'bottom', index: 8, pinType: 'gpio' },
      { id: 'gpio-19', label: 'G19', row: 'bottom', index: 9, pinType: 'gpio' },
      { id: 'gpio-21', label: 'G21', row: 'bottom', index: 10, pinType: 'gpio' },
      { id: 'rx0', label: 'RX0', row: 'bottom', index: 11, pinType: 'gpio' },
      { id: 'tx0', label: 'TX0', row: 'bottom', index: 12, pinType: 'gpio' },
      { id: 'gpio-22', label: 'G22', row: 'bottom', index: 13, pinType: 'gpio' },
      { id: 'gpio-23', label: 'G23', row: 'bottom', index: 14, pinType: 'gpio' },
    ],
  },
  esp8266: {
    name: 'ESP8266 NodeMCU v2',
    chipLabel: 'ESP8266MOD',
    subLabel: '802.11 b/g/n Wi-Fi SoC',
    vccPinId: 'vin',
    gndPinId: 'gnd2',
    topPins: [
      { id: 'a0', label: 'A0', row: 'top', index: 0, pinType: 'gpio' },
      { id: 'rsv1', label: 'RSV', row: 'top', index: 1, pinType: 'gpio' },
      { id: 'rsv2', label: 'RSV', row: 'top', index: 2, pinType: 'gpio' },
      { id: 'sd3', label: 'SD3', row: 'top', index: 3, pinType: 'gpio' },
      { id: 'sd2', label: 'SD2', row: 'top', index: 4, pinType: 'gpio' },
      { id: 'sd1', label: 'SD1', row: 'top', index: 5, pinType: 'gpio' },
      { id: 'cmd', label: 'CMD', row: 'top', index: 6, pinType: 'gpio' },
      { id: 'sd0', label: 'SD0', row: 'top', index: 7, pinType: 'gpio' },
      { id: 'clk', label: 'CLK', row: 'top', index: 8, pinType: 'gpio' },
      { id: 'gnd1', label: 'GND', row: 'top', index: 9, pinType: 'gnd' },
      { id: '3v3_1', label: '3V3', row: 'top', index: 10, pinType: 'power' },
      { id: 'en', label: 'EN', row: 'top', index: 11, pinType: 'power' },
      { id: 'rst', label: 'RST', row: 'top', index: 12, pinType: 'power' },
      { id: 'gnd2', label: 'GND', row: 'top', index: 13, pinType: 'gnd' },
      { id: 'vin', label: '5V', row: 'top', index: 14, pinType: 'power' },
    ],
    bottomPins: [
      { id: 'd0', label: 'D0', row: 'bottom', index: 0, pinType: 'gpio' },
      { id: 'd1', label: 'D1', row: 'bottom', index: 1, pinType: 'gpio' },
      { id: 'd2', label: 'D2', row: 'bottom', index: 2, pinType: 'gpio' },
      { id: 'd3', label: 'D3', row: 'bottom', index: 3, pinType: 'gpio' },
      { id: 'd4', label: 'D4', row: 'bottom', index: 4, pinType: 'gpio' },
      { id: '3v3_2', label: '3V3', row: 'bottom', index: 5, pinType: 'power' },
      { id: 'gnd3', label: 'GND', row: 'bottom', index: 6, pinType: 'gnd' },
      { id: 'd5', label: 'D5', row: 'bottom', index: 7, pinType: 'gpio' },
      { id: 'd6', label: 'D6', row: 'bottom', index: 8, pinType: 'gpio' },
      { id: 'd7', label: 'D7', row: 'bottom', index: 9, pinType: 'gpio' },
      { id: 'd8', label: 'D8', row: 'bottom', index: 10, pinType: 'gpio' },
      { id: 'rx', label: 'RX', row: 'bottom', index: 11, pinType: 'gpio' },
      { id: 'tx', label: 'TX', row: 'bottom', index: 12, pinType: 'gpio' },
      { id: 'gnd4', label: 'GND', row: 'bottom', index: 13, pinType: 'gnd' },
      { id: '3v3_3', label: '3V3', row: 'bottom', index: 14, pinType: 'power' },
    ],
  },
};

const DEFAULT_COMPONENTS: Record<BoardType, PlacedComponent[]> = {
  esp32: [
    { instanceId: 'c1', type: 'ph', name: 'pH Sensor Probe', pinKey: 'gpio-36', pos: { x: 50, y: 40 } },
    { instanceId: 'c2', type: 'tds', name: 'EC / TDS Probe', pinKey: 'gpio-39', pos: { x: 260, y: 40 } },
    { instanceId: 'c3', type: 'waterLevel', name: 'Water Level Probe', pinKey: 'gpio-34', pos: { x: 470, y: 40 } },
    { instanceId: 'c4', type: 'do', name: 'Dissolved O2 Probe', pinKey: 'gpio-35', pos: { x: 680, y: 40 } },
    { instanceId: 'c5', type: 'pump', name: 'Peristaltic Pump Relay', pinKey: 'gpio-26', pos: { x: 740, y: 500 } },
    { instanceId: 'c6', type: 'led', name: 'Status LED Indicator', pinKey: 'gpio-2', pos: { x: 260, y: 500 } },
  ],
  esp8266: [
    { instanceId: 'c1', type: 'ph', name: 'pH Sensor Probe', pinKey: 'a0', pos: { x: 50, y: 40 } },
    { instanceId: 'c2', type: 'tds', name: 'EC / TDS Probe', pinKey: 'd1', pos: { x: 100, y: 500 } },
    { instanceId: 'c3', type: 'waterLevel', name: 'Water Level Probe', pinKey: 'd2', pos: { x: 310, y: 500 } },
    { instanceId: 'c4', type: 'led', name: 'Status LED Indicator', pinKey: 'd4', pos: { x: 520, y: 500 } },
    { instanceId: 'c5', type: 'do', name: 'Dissolved O2 Probe', pinKey: 'd5', pos: { x: 680, y: 40 } },
    { instanceId: 'c6', type: 'pump', name: 'Peristaltic Pump Relay', pinKey: 'd6', pos: { x: 730, y: 500 } },
  ],
};

const COMPONENT_TYPES = [
  { type: 'ph', name: 'pH Sensor Probe', icon: Activity },
  { type: 'tds', name: 'EC / TDS Meter', icon: Gauge },
  { type: 'waterLevel', name: 'Water Level Sensor', icon: Droplet },
  { type: 'do', name: 'Dissolved O2 Probe', icon: Flame },
  { type: 'pump', name: '5V Pump Relay', icon: Zap },
  { type: 'led', name: 'Status LED Indicator', icon: Lightbulb },
  { type: 'dht22', name: 'DHT22 Temp/Humidity', icon: Thermometer },
];

export default function LiveCircuitBoard({ device }: LiveCircuitBoardProps) {
  const [selectedBoard, setSelectedBoard] = useState<BoardType>('esp32');
  const [components, setComponents] = useState<PlacedComponent[]>(DEFAULT_COMPONENTS['esp32']);
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const reading: SensorReading | undefined = device?.sensorReadings?.[0];
  const isOnline = device?.isOnline ?? false;
  const board = BOARD_PROFILES[selectedBoard];

  // Load stored custom layout if available
  useEffect(() => {
    const saved = localStorage.getItem(`hf_circuit_${selectedBoard}`);
    if (saved) {
      try {
        setComponents(JSON.parse(saved));
      } catch (e) {
        setComponents(DEFAULT_COMPONENTS[selectedBoard]);
      }
    } else {
      setComponents(DEFAULT_COMPONENTS[selectedBoard]);
    }
  }, [selectedBoard]);

  const saveLayout = () => {
    localStorage.setItem(`hf_circuit_${selectedBoard}`, JSON.stringify(components));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const resetLayout = () => {
    localStorage.removeItem(`hf_circuit_${selectedBoard}`);
    setComponents(DEFAULT_COMPONENTS[selectedBoard]);
  };

  const addComponent = (type: PlacedComponent['type'], name: string) => {
    const availablePin = [...board.topPins, ...board.bottomPins].find(
      (p) => p.pinType === 'gpio' && !components.some((c) => c.pinKey === p.id)
    );
    const newComp: PlacedComponent = {
      instanceId: `c_${Date.now()}`,
      type,
      name,
      pinKey: availablePin?.id || 'gpio-14',
      pos: { x: 420, y: 40 },
    };
    setComponents((prev) => [...prev, newComp]);
  };

  const removeComponent = (instanceId: string) => {
    setComponents((prev) => prev.filter((c) => c.instanceId !== instanceId));
    if (activeConfigId === instanceId) setActiveConfigId(null);
  };

  const updatePinKey = (instanceId: string, pinKey: string) => {
    setComponents((prev) => prev.map((c) => (c.instanceId === instanceId ? { ...c, pinKey } : c)));
  };

  const updatePosition = (instanceId: string, pos: { x: number; y: number }) => {
    setComponents((prev) => prev.map((c) => (c.instanceId === instanceId ? { ...c, pos } : c)));
  };

  // Helper to format telemetry readings
  const getFormattedValue = (type: string) => {
    if (!isOnline || !reading) return 'N/A';
    switch (type) {
      case 'ph': return `${reading.ph.toFixed(2)} pH`;
      case 'tds': return `${Math.round(reading.tds)} ppm`;
      case 'waterLevel': return `${Math.round(reading.waterLevel)}%`;
      case 'do': return `${reading.dissolvedOxygen.toFixed(1)} mg/L`;
      case 'pump': return reading.pumpState.toUpperCase();
      case 'led': return reading.ledState.toUpperCase();
      case 'dht22': return `${reading.ambientTemp.toFixed(1)}°C / ${Math.round(reading.humidity)}%`;
      default: return 'ACTIVE';
    }
  };

  const getStatusColor = (type?: string) => {
    if (!isOnline || !reading || !type) return { stroke: '#64748b', fill: '#1e293b', status: 'offline', text: 'text-slate-400' };

    switch (type) {
      case 'ph':
        if (reading.ph >= 5.5 && reading.ph <= 6.5) return { stroke: '#22c55e', fill: '#15803d', status: 'optimal', text: 'text-emerald-400' };
        if (reading.ph >= 5.0 && reading.ph <= 7.0) return { stroke: '#f97316', fill: '#c2410c', status: 'warning', text: 'text-amber-400' };
        return { stroke: '#ef4444', fill: '#b91c1c', status: 'critical', text: 'text-rose-400' };

      case 'tds':
        if (reading.tds >= 800 && reading.tds <= 1200) return { stroke: '#22c55e', fill: '#15803d', status: 'optimal', text: 'text-emerald-400' };
        if (reading.tds >= 600 && reading.tds <= 1500) return { stroke: '#f97316', fill: '#c2410c', status: 'warning', text: 'text-amber-400' };
        return { stroke: '#ef4444', fill: '#b91c1c', status: 'critical', text: 'text-rose-400' };

      case 'waterLevel':
        if (reading.waterLevel >= 50) return { stroke: '#22c55e', fill: '#15803d', status: 'optimal', text: 'text-emerald-400' };
        if (reading.waterLevel >= 20) return { stroke: '#f97316', fill: '#c2410c', status: 'warning', text: 'text-amber-400' };
        return { stroke: '#ef4444', fill: '#b91c1c', status: 'critical', text: 'text-rose-400' };

      case 'do':
        if (reading.dissolvedOxygen >= 5) return { stroke: '#22c55e', fill: '#15803d', status: 'optimal', text: 'text-emerald-400' };
        if (reading.dissolvedOxygen >= 3) return { stroke: '#f97316', fill: '#c2410c', status: 'warning', text: 'text-amber-400' };
        return { stroke: '#ef4444', fill: '#b91c1c', status: 'critical', text: 'text-rose-400' };

      case 'pump':
        return reading.pumpState === 'on'
          ? { stroke: '#22c55e', fill: '#15803d', status: 'optimal', text: 'text-emerald-400' }
          : { stroke: '#ef4444', fill: '#b91c1c', status: 'critical', text: 'text-rose-400' };

      case 'led':
        return reading.ledState === 'on'
          ? { stroke: '#22c55e', fill: '#15803d', status: 'optimal', text: 'text-emerald-400' }
          : { stroke: '#ef4444', fill: '#b91c1c', status: 'critical', text: 'text-rose-400' };

      default:
        return { stroke: '#38bdf8', fill: '#0369a1', status: 'optimal', text: 'text-sky-400' };
    }
  };

  // Horizontal Layout Board Coordinates (Width: 1000, Height: 640)
  const BOARD_X = 200;
  const BOARD_Y = 240;
  const BOARD_W = 600;
  const BOARD_H = 180;
  const PIN_SPACING = 36;

  // Get absolute (x,y) of MCU pin headers
  const getPinCoords = (pinId: string) => {
    const allPins = [...board.topPins, ...board.bottomPins];
    const pinDef = allPins.find((p) => p.id === pinId);
    if (!pinDef) return { x: BOARD_X + 50, y: BOARD_Y + 90 };

    const x = BOARD_X + 30 + pinDef.index * PIN_SPACING;
    const y = pinDef.row === 'top' ? BOARD_Y : BOARD_Y + BOARD_H;
    return { x, y };
  };

  // Power Rail Coordinates (VCC Red 5V, GND Black)
  const vccPinPos = getPinCoords(board.vccPinId);
  const gndPinPos = getPinCoords(board.gndPinId);
  const POWER_SUPPLY_POS = { x: 30, y: 260 };

  return (
    <div className="relative w-full max-w-6xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col items-center">
      {/* Header Bar */}
      <div className="w-full flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black tracking-tight text-white">Interactive Circuit Designer</h2>
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {isOnline ? 'Live Telemetry' : 'Offline Mode'}
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Drag components around, inspect 3-wire power rails (VCC 🔴, GND ⬛, Signal 🔵), and customize pin routing.
          </p>
        </div>

        {/* Action Controls & Board Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Target Board Select */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            {(Object.keys(BOARD_PROFILES) as BoardType[]).map((bKey) => (
              <button
                key={bKey}
                onClick={() => setSelectedBoard(bKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedBoard === bKey
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {bKey === 'esp32' ? 'ESP32' : 'ESP8266'}
              </button>
            ))}
          </div>

          {/* Save Layout */}
          <button
            onClick={saveLayout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-bold hover:bg-sky-500/20 transition-all"
          >
            {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
            {isSaved ? 'Saved!' : 'Save Layout'}
          </button>

          {/* Reset Layout */}
          <button
            onClick={resetLayout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold hover:bg-slate-700 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Component Add Palette Drawer */}
      <div className="w-full flex items-center gap-2 overflow-x-auto pb-4 mb-4 border-b border-slate-800/60 scrollbar-thin">
        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-2">
          <Plus className="w-4 h-4 text-emerald-400" /> Add Component:
        </span>
        {COMPONENT_TYPES.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.type}
              onClick={() => addComponent(c.type as PlacedComponent['type'], c.name)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold hover:border-emerald-500/50 hover:text-emerald-400 transition-all shrink-0 shadow-sm"
            >
              <Icon className="w-3.5 h-3.5" />
              {c.name}
            </button>
          );
        })}
      </div>

      {/* Interactive SVG Canvas */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-950 rounded-2xl border border-slate-800/80 p-2 shadow-inner">
        <svg viewBox="0 0 1000 640" className="w-full h-full select-none">
          {/* Circuit Grid Background */}
          <defs>
            <pattern id="designer-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.8" opacity="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#designer-grid)" />

          {/* ========================================== */}
          {/* EXTERNAL POWER SUPPLY MODULE (5V 2A ADAPTER) */}
          {/* ========================================== */}
          <g id="power-supply">
            <rect x={POWER_SUPPLY_POS.x} y={POWER_SUPPLY_POS.y} width="120" height="120" rx="12" fill="#0f172a" stroke="#dc2626" strokeWidth="3" />
            <circle cx={POWER_SUPPLY_POS.x + 60} cy={POWER_SUPPLY_POS.y + 40} r="18" fill="#991b1b" />
            <Power className="w-5 h-5 text-white" x={POWER_SUPPLY_POS.x + 50} y={POWER_SUPPLY_POS.y + 30} />
            <text x={POWER_SUPPLY_POS.x + 60} y={POWER_SUPPLY_POS.y + 78} fill="#f8fafc" fontSize="12" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">
              5V 2A POWER
            </text>
            <text x={POWER_SUPPLY_POS.x + 60} y={POWER_SUPPLY_POS.y + 95} fill="#ef4444" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              MAINS INPUT
            </text>

            {/* Main Power Wires to MCU Board */}
            <path d={`M ${POWER_SUPPLY_POS.x + 120} ${POWER_SUPPLY_POS.y + 40} L ${vccPinPos.x} ${POWER_SUPPLY_POS.y + 40} L ${vccPinPos.x} ${vccPinPos.y}`} stroke="#ef4444" strokeWidth="4" fill="none" strokeDasharray="6 3" />
            <path d={`M ${POWER_SUPPLY_POS.x + 120} ${POWER_SUPPLY_POS.y + 80} L ${gndPinPos.x} ${POWER_SUPPLY_POS.y + 80} L ${gndPinPos.x} ${gndPinPos.y}`} stroke="#334155" strokeWidth="4" fill="none" />
          </g>

          {/* ========================================== */}
          {/* 3-WIRE CIRCUIT CONNECTIONS (POWER + SIGNAL) */}
          {/* ========================================== */}
          {components.map((comp) => {
            const signalPinPos = getPinCoords(comp.pinKey);
            const statusInfo = getStatusColor(comp.type);

            // Component connection terminals
            const cardConnX = comp.pos.x + 85;
            const isTop = comp.pos.y < BOARD_Y;
            const cardConnY = isTop ? comp.pos.y + 84 : comp.pos.y;

            // 1. SIGNAL WIRE (Dynamic status color)
            const midYSignal = isTop ? signalPinPos.y - 30 : signalPinPos.y + 30;
            const signalPathD = `M ${signalPinPos.x} ${signalPinPos.y} L ${signalPinPos.x} ${midYSignal} L ${cardConnX} ${midYSignal} L ${cardConnX} ${cardConnY}`;

            // 2. VCC POWER WIRE (🔴 Red Wire offset by -8px)
            const vccPathD = `M ${vccPinPos.x} ${vccPinPos.y} L ${vccPinPos.x} ${midYSignal - 6} L ${cardConnX - 10} ${midYSignal - 6} L ${cardConnX - 10} ${cardConnY}`;

            // 3. GND POWER WIRE (⬛ Dark Gray Wire offset by +8px)
            const gndPathD = `M ${gndPinPos.x} ${gndPinPos.y} L ${gndPinPos.x} ${midYSignal + 6} L ${cardConnX + 10} ${midYSignal + 6} L ${cardConnX + 10} ${cardConnY}`;

            return (
              <g key={`wires-${comp.instanceId}`}>
                {/* VCC Red Wire */}
                <path d={vccPathD} stroke="#ef4444" strokeWidth="2" fill="none" opacity="0.75" />
                
                {/* GND Dark Wire */}
                <path d={gndPathD} stroke="#334155" strokeWidth="2" fill="none" opacity="0.9" />

                {/* Signal Wire (Thicker with pulse) */}
                <motion.path
                  d={signalPathD}
                  stroke={statusInfo.stroke}
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5 }}
                />

                {/* Signal Flow Pulse Animation */}
                {isOnline && statusInfo.status !== 'offline' && (
                  <motion.circle
                    r="3.5"
                    fill="#ffffff"
                    initial={{ offsetDistance: '0%' }}
                    animate={{ offsetDistance: '100%' }}
                    style={{ offsetPath: `path('${signalPathD}')` }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                )}
              </g>
            );
          })}

          {/* ========================================== */}
          {/* HORIZONTAL MCU BOARD FOOTPRINT */}
          {/* ========================================== */}
          <g id="mcu-board-main">
            <rect x={BOARD_X} y={BOARD_Y} width={BOARD_W} height={BOARD_H} rx="14" fill="#090d16" stroke="#334155" strokeWidth="4" />
            
            {/* Micro USB Port */}
            <rect x={BOARD_X - 22} y={BOARD_Y + 55} width="22" height="70" rx="4" fill="#475569" stroke="#334155" strokeWidth="2" />
            <rect x={BOARD_X - 16} y={BOARD_Y + 65} width="16" height="50" rx="2" fill="#0f172a" />

            {/* PCB Antenna */}
            <rect x={BOARD_X + BOARD_W - 40} y={BOARD_Y + 30} width="30" height="120" rx="4" fill="#020617" />
            <path d={`M ${BOARD_X + BOARD_W - 25} 40 Q ${BOARD_X + BOARD_W - 35} 55 ${BOARD_X + BOARD_W - 25} 70 T ${BOARD_X + BOARD_W - 25} 100 T ${BOARD_X + BOARD_W - 25} 130`} stroke="#f59e0b" strokeWidth="2" fill="none" />

            {/* Metal Chip Shield */}
            <rect x={BOARD_X + 180} y={BOARD_Y + 25} width="200" height="130" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <text x={BOARD_X + 280} y={BOARD_Y + 85} fill="#f8fafc" fontSize="16" fontFamily="monospace" fontWeight="900" textAnchor="middle">
              {board.chipLabel}
            </text>
            <text x={BOARD_X + 280} y={BOARD_Y + 110} fill="#94a3b8" fontSize="11" fontFamily="sans-serif" textAnchor="middle" fontWeight="500">
              {board.subLabel}
            </text>

            {/* Power LED */}
            <circle cx={BOARD_X + 40} cy={BOARD_Y + 35} r="5" fill={isOnline ? '#22c55e' : '#ef4444'} className="animate-pulse" />
            <text x={BOARD_X + 52} y={BOARD_Y + 39} fill="#94a3b8" fontSize="10" fontFamily="monospace" fontWeight="bold">PWR</text>
          </g>

          {/* Pin Headers & Labels */}
          {[...board.topPins, ...board.bottomPins].map((pin) => {
            const pos = getPinCoords(pin.id);
            const isAssigned = components.some((c) => c.pinKey === pin.id);
            const isPowerPin = pin.pinType === 'power';
            const isGndPin = pin.pinType === 'gnd';

            return (
              <g key={`pin-header-${pin.id}`}>
                <rect
                  x={pos.x - 7}
                  y={pos.y - 7}
                  width="14"
                  height="14"
                  rx="3"
                  fill={isPowerPin ? '#ef4444' : isGndPin ? '#334155' : isAssigned ? '#0284c7' : '#1e293b'}
                  stroke={isAssigned ? '#38bdf8' : '#334155'}
                  strokeWidth="2"
                />
                <text
                  x={pos.x}
                  y={pin.row === 'top' ? pos.y + 22 : pos.y - 12}
                  fill={isPowerPin ? '#f87171' : isGndPin ? '#94a3b8' : isAssigned ? '#38bdf8' : '#64748b'}
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight={isAssigned || isPowerPin ? 'bold' : 'normal'}
                  textAnchor="middle"
                >
                  {pin.label}
                </text>
              </g>
            );
          })}

          {/* ========================================== */}
          {/* DRAGGABLE COMPONENT CARDS */}
          {/* ========================================== */}
          {components.map((comp) => {
            const statusInfo = getStatusColor(comp.type);
            const liveVal = getFormattedValue(comp.type);
            const matchingTypeObj = COMPONENT_TYPES.find((t) => t.type === comp.type);
            const Icon = matchingTypeObj?.icon || Activity;
            const availablePins = [...board.topPins, ...board.bottomPins].filter((p) => p.pinType === 'gpio');

            return (
              <foreignObject
                key={comp.instanceId}
                x={comp.pos.x}
                y={comp.pos.y}
                width="170"
                height="84"
                className="overflow-visible cursor-grab active:cursor-grabbing"
              >
                <motion.div
                  drag
                  dragMomentum={false}
                  onDragEnd={(_, info) => {
                    updatePosition(comp.instanceId, {
                      x: Math.max(20, Math.min(810, comp.pos.x + info.offset.x)),
                      y: Math.max(20, Math.min(540, comp.pos.y + info.offset.y)),
                    });
                  }}
                  className={`w-full h-full p-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border-2 shadow-2xl flex flex-col justify-between transition-all ${
                    statusInfo.status === 'optimal'
                      ? 'border-emerald-500/60 shadow-emerald-500/10'
                      : statusInfo.status === 'warning'
                      ? 'border-amber-500/60 shadow-amber-500/10'
                      : statusInfo.status === 'critical'
                      ? 'border-rose-500/60 shadow-rose-500/10'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Card Title & Delete Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <div className={`p-1 rounded-lg bg-slate-800 ${statusInfo.text} shrink-0`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200 truncate">{comp.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setActiveConfigId(activeConfigId === comp.instanceId ? null : comp.instanceId)}
                        className="p-1 text-slate-400 hover:text-sky-400 transition-colors"
                        title="Configure Pin"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeComponent(comp.instanceId)}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Remove Component"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Pin Selection Dropdown or Live Reading */}
                  {activeConfigId === comp.instanceId ? (
                    <div className="mt-1">
                      <select
                        value={comp.pinKey}
                        onChange={(e) => updatePinKey(comp.instanceId, e.target.value)}
                        className="w-full bg-slate-950 border border-sky-500 text-sky-300 text-[10px] rounded p-1 font-mono font-bold"
                      >
                        {availablePins.map((p) => (
                          <option key={p.id} value={p.id}>
                            Pin: {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-slate-800/80">
                      <span className="text-[10px] font-mono text-sky-400 font-bold">
                        {board.topPins.concat(board.bottomPins).find((p) => p.id === comp.pinKey)?.label || comp.pinKey}
                      </span>
                      <span className={`text-xs font-black tracking-tight ${statusInfo.text}`}>{liveVal}</span>
                    </div>
                  )}
                </motion.div>
              </foreignObject>
            );
          })}
        </svg>
      </div>

      {/* Wiring Legend */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mt-6 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 bg-rose-500 rounded-full"></span>
            <span className="text-xs text-slate-300 font-medium">🔴 VCC 5V Power Rail</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 bg-slate-600 rounded-full"></span>
            <span className="text-xs text-slate-300 font-medium">⬛ GND Ground Rail</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 bg-sky-400 rounded-full"></span>
            <span className="text-xs text-slate-300 font-medium">🔵 Signal Data Wire</span>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Drag components directly on the canvas to customize wiring layout.
        </div>
      </div>
    </div>
  );
}
