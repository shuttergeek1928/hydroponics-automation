"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Device, SensorReading } from '@/lib/api';
import { StudioComponent, CircuitWire, Point, WireColor, TerminalPin } from '@/lib/circuit/types';
import ComponentPalette from './ComponentPalette';
import WireCanvas, { WIRE_COLOR_HEX } from './WireCanvas';
import BreadboardSVG, { generateBreadboardTerminals } from './BreadboardSVG';
import MCUBoardSVG, { generateMcuTerminals } from './MCUBoardSVG';
import {
  Play,
  Pause,
  RotateCcw,
  Save,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Trash2,
  Cpu,
  Activity,
  Gauge,
  Droplet,
  Flame,
  Zap,
  Lightbulb,
  Thermometer,
  Power
} from 'lucide-react';

interface TinkercadStudioProps {
  device: Device | null;
}

// Helper: Dynamically space out pin terminals & compute exact card width for sensors/relays
function layoutTerminals(
  componentId: string,
  rawTerminals: Array<{ idSuffix: string; name: string; type: TerminalPin['type'] }>,
  y = 70
): { terminals: TerminalPin[]; width: number } {
  const PIN_SPACING = 56;
  const padding = 40;
  const width = Math.max(190, rawTerminals.length * PIN_SPACING + padding);
  const startX = Math.round((width - (rawTerminals.length - 1) * PIN_SPACING) / 2);

  const terminals: TerminalPin[] = rawTerminals.map((t, idx) => ({
    id: `${componentId}_${t.idSuffix}`,
    componentId,
    name: t.name,
    type: t.type,
    relPos: { x: startX + idx * PIN_SPACING, y },
  }));

  return { terminals, width };
}

const phLayout = layoutTerminals('ph_1', [
  { idSuffix: 'vcc', name: 'VCC', type: 'vcc' },
  { idSuffix: 'gnd', name: 'GND', type: 'gnd' },
  { idSuffix: 'sig', name: 'A0 Signal', type: 'signal' },
]);

const relayLayout = layoutTerminals('relay_1', [
  { idSuffix: 'vcc', name: 'VCC', type: 'vcc' },
  { idSuffix: 'gnd', name: 'GND', type: 'gnd' },
  { idSuffix: 'in', name: 'IN Trigger', type: 'signal' },
]);

const STARTER_COMPONENTS: StudioComponent[] = [
  {
    id: 'bb_1',
    type: 'breadboard',
    name: '830-Point Breadboard',
    pos: { x: 300, y: 380 },
    rotation: 0,
    width: 840,
    height: 250,
    terminals: generateBreadboardTerminals('bb_1'),
  },
  {
    id: 'esp32_1',
    type: 'esp32',
    name: 'ESP32 WROOM-32 DevKit',
    pos: { x: 420, y: 80 },
    rotation: 0,
    width: 600,
    height: 180,
    terminals: generateMcuTerminals('esp32_1', 'esp32'),
  },
  {
    id: 'ph_1',
    type: 'ph_sensor',
    name: 'pH Sensor Probe',
    pos: { x: 60, y: 80 },
    rotation: 0,
    width: phLayout.width,
    height: 110,
    terminals: phLayout.terminals,
  },
  {
    id: 'relay_1',
    type: 'relay',
    name: '5V Pump Relay',
    pos: { x: 1080, y: 80 },
    rotation: 0,
    width: relayLayout.width,
    height: 110,
    terminals: relayLayout.terminals,
  },
];

const STARTER_WIRES: CircuitWire[] = [
  { id: 'w1', fromTerminalId: 'ph_1_vcc', toTerminalId: 'esp32_1_vin', color: 'red', waypoints: [] },
  { id: 'w2', fromTerminalId: 'ph_1_gnd', toTerminalId: 'esp32_1_gnd1', color: 'black', waypoints: [] },
  { id: 'w3', fromTerminalId: 'ph_1_sig', toTerminalId: 'esp32_1_g36', color: 'green', waypoints: [] },
  { id: 'w4', fromTerminalId: 'relay_1_vcc', toTerminalId: 'esp32_1_vin', color: 'red', waypoints: [] },
  { id: 'w5', fromTerminalId: 'relay_1_gnd', toTerminalId: 'esp32_1_gnd1', color: 'black', waypoints: [] },
  { id: 'w6', fromTerminalId: 'relay_1_in', toTerminalId: 'esp32_1_g26', color: 'blue', waypoints: [] },
];

export default function TinkercadStudio({ device }: TinkercadStudioProps) {
  const [components, setComponents] = useState<StudioComponent[]>(STARTER_COMPONENTS);
  const [wires, setWires] = useState<CircuitWire[]>(STARTER_WIRES);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [activeWireColor, setActiveWireColor] = useState<WireColor>('green');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Wire Drawing State
  const [drawingStartTerminalId, setDrawingStartTerminalId] = useState<string | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState<Point>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Load stored custom layout if available
  useEffect(() => {
    const savedComps = localStorage.getItem('hf_tinkercad_comps_v2');
    const savedWires = localStorage.getItem('hf_tinkercad_wires_v2');
    if (savedComps && savedWires) {
      try {
        setComponents(JSON.parse(savedComps));
        setWires(JSON.parse(savedWires));
      } catch (e) {}
    }
  }, []);

  const saveStudioState = () => {
    localStorage.setItem('hf_tinkercad_comps_v2', JSON.stringify(components));
    localStorage.setItem('hf_tinkercad_wires_v2', JSON.stringify(wires));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const resetStudioState = () => {
    localStorage.removeItem('hf_tinkercad_comps_v2');
    localStorage.removeItem('hf_tinkercad_wires_v2');
    setComponents(STARTER_COMPONENTS);
    setWires(STARTER_WIRES);
    setSelectedWireId(null);
    setDrawingStartTerminalId(null);
  };

  // Build absolute coordinates map for all component terminals
  const terminalMap = new Map<string, { term: TerminalPin; absPos: Point }>();
  components.forEach((comp) => {
    comp.terminals.forEach((term) => {
      const absPos: Point = {
        x: comp.pos.x + term.relPos.x,
        y: comp.pos.y + term.relPos.y,
      };
      terminalMap.set(term.id, { term, absPos });
    });
  });

  // Track mouse movements on canvas for dynamic wire drawing
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setCurrentMousePos({ x, y });
  };

  // Click terminal pin to start or complete wire drawing
  const handleTerminalClick = (term: TerminalPin) => {
    if (!drawingStartTerminalId) {
      setDrawingStartTerminalId(term.id);
      setSelectedWireId(null);
    } else {
      if (drawingStartTerminalId !== term.id) {
        const newWire: CircuitWire = {
          id: `w_${crypto.randomUUID()}`,
          fromTerminalId: drawingStartTerminalId,
          toTerminalId: term.id,
          color: activeWireColor,
          waypoints: [],
        };
        setWires((prev) => [...prev, newWire]);
      }
      setDrawingStartTerminalId(null);
    }
  };

  const handleAddComponent = (type: StudioComponent['type']) => {
    const newId = `${type}_${crypto.randomUUID()}`;

    if (type === 'breadboard') {
      const newComp: StudioComponent = {
        id: newId,
        type: 'breadboard',
        name: '830-Point Breadboard',
        pos: { x: 300, y: 350 },
        rotation: 0,
        width: 840,
        height: 250,
        terminals: generateBreadboardTerminals(newId),
      };
      setComponents((prev) => [...prev, newComp]);
      return;
    }

    if (type === 'esp32' || type === 'esp8266') {
      const name = type === 'esp32' ? 'ESP32 WROOM-32' : 'ESP8266 NodeMCU';
      const newComp: StudioComponent = {
        id: newId,
        type,
        name,
        pos: { x: 400, y: 100 },
        rotation: 0,
        width: 600,
        height: 180,
        terminals: generateMcuTerminals(newId, type),
      };
      setComponents((prev) => [...prev, newComp]);
      return;
    }

    let rawTerms: Array<{ idSuffix: string; name: string; type: TerminalPin['type'] }> = [];
    let name = `${type.toUpperCase()} Module`;

    switch (type) {
      case 'ph_sensor':
        name = 'pH Sensor Probe';
        rawTerms = [
          { idSuffix: 'vcc', name: 'VCC', type: 'vcc' },
          { idSuffix: 'gnd', name: 'GND', type: 'gnd' },
          { idSuffix: 'sig', name: 'A0 Signal', type: 'signal' },
        ];
        break;

      case 'tds_sensor':
        name = 'EC / TDS Meter';
        rawTerms = [
          { idSuffix: 'vcc', name: 'VCC', type: 'vcc' },
          { idSuffix: 'gnd', name: 'GND', type: 'gnd' },
          { idSuffix: 'sig', name: 'Signal', type: 'signal' },
        ];
        break;

      case 'water_level':
        name = 'Water Level Sensor';
        rawTerms = [
          { idSuffix: 'vcc', name: 'VCC', type: 'vcc' },
          { idSuffix: 'gnd', name: 'GND', type: 'gnd' },
          { idSuffix: 'sig', name: 'Signal', type: 'signal' },
        ];
        break;

      case 'do_sensor':
        name = 'Dissolved O2 Probe';
        rawTerms = [
          { idSuffix: 'vcc', name: 'VCC', type: 'vcc' },
          { idSuffix: 'gnd', name: 'GND', type: 'gnd' },
          { idSuffix: 'sig', name: 'Signal', type: 'signal' },
        ];
        break;

      case 'relay':
        name = '5V Relay Module';
        rawTerms = [
          { idSuffix: 'vcc', name: 'VCC', type: 'vcc' },
          { idSuffix: 'gnd', name: 'GND', type: 'gnd' },
          { idSuffix: 'in', name: 'IN Trigger', type: 'signal' },
        ];
        break;

      case 'led':
        name = 'Status LED Indicator';
        rawTerms = [
          { idSuffix: 'anode', name: 'Anode (+)', type: 'signal' },
          { idSuffix: 'cathode', name: 'Cathode (-)', type: 'gnd' },
        ];
        break;

      case 'dht22':
        name = 'DHT22 Sensor';
        rawTerms = [
          { idSuffix: 'vcc', name: 'VCC', type: 'vcc' },
          { idSuffix: 'gnd', name: 'GND', type: 'gnd' },
          { idSuffix: 'data', name: 'Data', type: 'signal' },
        ];
        break;

      default:
        rawTerms = [
          { idSuffix: 'vcc', name: 'VCC', type: 'vcc' },
          { idSuffix: 'gnd', name: 'GND', type: 'gnd' },
          { idSuffix: 'sig', name: 'SIG', type: 'signal' },
        ];
    }

    const { terminals, width } = layoutTerminals(newId, rawTerms);
    const newComp: StudioComponent = {
      id: newId,
      type,
      name,
      pos: { x: 350, y: 100 },
      rotation: 0,
      width,
      height: 110,
      terminals,
    };

    setComponents((prev) => [...prev, newComp]);
  };

  const removeComponent = (comp: StudioComponent) => {
    setComponents((prev) => prev.filter((c) => c.id !== comp.id));
    const termIds = comp.terminals.map((t) => t.id);
    setWires((prev) => prev.filter((w) => !termIds.includes(w.fromTerminalId) && !termIds.includes(w.toTerminalId)));
    if (selectedComponentId === comp.id) setSelectedComponentId(null);
  };

  const updateCompPos = (id: string, delta: Point) => {
    setComponents((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              pos: {
                x: Math.max(10, c.pos.x + delta.x / zoom),
                y: Math.max(10, c.pos.y + delta.y / zoom),
              },
            }
          : c
      )
    );
  };

  const deleteWire = (wireId: string) => {
    setWires((prev) => prev.filter((w) => w.id !== wireId));
    if (selectedWireId === wireId) setSelectedWireId(null);
  };

  const changeWireColor = (color: WireColor) => {
    setActiveWireColor(color);
    if (selectedWireId) {
      setWires((prev) => prev.map((w) => (w.id === selectedWireId ? { ...w, color } : w)));
    }
  };

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950 flex flex-col p-4 w-screen h-screen'
          : 'relative w-full h-full bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col'
      }
    >
      {/* Top Tinkercad Action Bar */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 z-30">
        {/* Left: Mode Switch & Status */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all ${
              isSimulating
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/20 animate-pulse'
                : 'bg-emerald-500 text-slate-950 shadow-emerald-500/20 hover:bg-emerald-400'
            }`}
          >
            {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
            {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
          </button>

          <span className="text-xs text-slate-400 font-medium border-l border-slate-800 pl-4 hidden sm:inline">
            Mode: <span className="font-extrabold text-white">{isSimulating ? 'Live Netlist Telemetry Run' : 'Edit & Wire Mode'}</span>
          </span>
        </div>

        {/* Center: Wire Color Palette & Draw Status */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400">Wire Color:</span>
          {(Object.keys(WIRE_COLOR_HEX) as WireColor[]).map((cKey) => (
            <button
              key={cKey}
              onClick={() => changeWireColor(cKey)}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${
                activeWireColor === cKey ? 'scale-125 border-sky-400 shadow-md' : 'border-slate-800 hover:scale-110'
              }`}
              style={{ backgroundColor: WIRE_COLOR_HEX[cKey] }}
              title={cKey.toUpperCase()}
            />
          ))}
          {drawingStartTerminalId && (
            <span className="text-xs font-bold text-sky-400 animate-pulse ml-2">Click target terminal...</span>
          )}
        </div>

        {/* Right: Studio Save, Reset, Fullscreen & Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.1, 1.5))}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.1, 0.7))}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Toggle Full Screen Workspace */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-2 rounded-xl border transition-colors ${
              isFullscreen ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Workspace'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <div className="w-px h-6 bg-slate-800 mx-1" />

          <button
            onClick={saveStudioState}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-bold hover:bg-sky-500/20 transition-all"
          >
            {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
            {isSaved ? 'Saved!' : 'Save'}
          </button>

          <button
            onClick={resetStudioState}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-rose-400 transition-colors"
            title="Reset Studio Workspace"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Studio Body (Sidebar + Interactive Canvas) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Component Palette Sidebar Drawer */}
        <ComponentPalette onAddComponent={handleAddComponent} />

        {/* Interactive 2D Circuit Canvas Grid */}
        <div
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onClick={() => {
            if (drawingStartTerminalId) setDrawingStartTerminalId(null);
          }}
          className="flex-1 h-full relative overflow-auto cursor-crosshair bg-slate-950"
          style={{
            backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          <div
            className="w-[2800px] h-[1800px] relative transform-origin-top-left transition-transform duration-75"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* Interactive Wire Canvas Layer */}
            <WireCanvas
              wires={wires}
              terminals={terminalMap}
              selectedWireId={selectedWireId}
              drawingWire={drawingStartTerminalId ? { fromTerminalId: drawingStartTerminalId, currentMousePos } : null}
              activeWireColor={activeWireColor}
              isSimulating={isSimulating}
              onSelectWire={setSelectedWireId}
              onDeleteWire={deleteWire}
              onChangeWireColor={changeWireColor}
            />

            {/* Placed Components Layer */}
            {components.map((comp) => {
              const isSelected = selectedComponentId === comp.id;

              return (
                <motion.div
                  key={comp.id}
                  onPan={!isSimulating ? (_, info) => updateCompPos(comp.id, info.delta) : undefined}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedComponentId(comp.id);
                  }}
                  className={`absolute z-10 cursor-grab active:cursor-grabbing select-none ${
                    isSelected ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-950 rounded-2xl' : ''
                  }`}
                  style={{ left: comp.pos.x, top: comp.pos.y }}
                >
                  {/* 1. Realistic Vector MCU Board (ESP32 / ESP8266) */}
                  {comp.type === 'esp32' || comp.type === 'esp8266' ? (
                    <MCUBoardSVG
                      componentId={comp.id}
                      type={comp.type}
                      name={comp.name}
                      activeTerminalId={drawingStartTerminalId}
                      onTerminalClick={handleTerminalClick}
                      onDelete={() => removeComponent(comp)}
                    />
                  ) : comp.type === 'breadboard' ? (
                    /* 2. Deletable Solderless Breadboard Component */
                    <BreadboardSVG
                      componentId={comp.id}
                      activeTerminalId={drawingStartTerminalId}
                      onTerminalClick={handleTerminalClick}
                      onDelete={() => removeComponent(comp)}
                    />
                  ) : (
                    /* 3. Dynamic Width Sensor / Relay Box Card Model */
                    <div
                      style={{ width: `${comp.width || 200}px` }}
                      className="p-3 rounded-2xl bg-slate-900/95 backdrop-blur-md border-2 border-slate-800 shadow-2xl flex flex-col justify-between"
                    >
                      {/* Component Title Bar */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <div className="p-1 rounded-lg bg-slate-800 text-sky-400 shrink-0">
                            <Activity className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-100 truncate">{comp.name}</span>
                        </div>
                        <button
                          onClick={() => removeComponent(comp)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Remove Component"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Pins / Terminals Container */}
                      <div className="relative h-10 mt-1 pt-1 border-t border-slate-800/80">
                        {comp.terminals.map((term) => {
                          const isStartPin = drawingStartTerminalId === term.id;
                          return (
                            <div
                              key={term.id}
                              style={{ left: term.relPos.x - 20 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTerminalClick(term);
                              }}
                              className="absolute top-1 w-10 flex flex-col items-center cursor-pointer group"
                              title={`Click to connect wire from ${term.name}`}
                            >
                              {/* Terminal Hole Pin */}
                              <div
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-125 ${
                                  isStartPin
                                    ? 'bg-sky-400 border-white shadow-lg animate-ping'
                                    : term.type === 'vcc'
                                    ? 'bg-rose-500/20 border-rose-500'
                                    : term.type === 'gnd'
                                    ? 'bg-slate-700 border-slate-500'
                                    : 'bg-emerald-500/20 border-emerald-500'
                                }`}
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              </div>
                              <span className="text-[9px] font-mono text-slate-400 font-bold mt-1 group-hover:text-sky-300 truncate w-full text-center">
                                {term.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
