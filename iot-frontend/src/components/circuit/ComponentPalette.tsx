"use client";

import React from 'react';
import { StudioComponent } from '@/lib/circuit/types';
import {
  Cpu,
  Grid,
  Zap,
  Activity,
  Gauge,
  Droplet,
  Flame,
  Lightbulb,
  Thermometer,
  Power,
  Plus
} from 'lucide-react';

interface ComponentPaletteProps {
  onAddComponent: (type: StudioComponent['type']) => void;
}

const PALETTE_ITEMS: Array<{
  type: StudioComponent['type'];
  name: string;
  category: 'MCU' | 'Breadboard' | 'Sensors' | 'Actuators' | 'Power';
  icon: React.ElementType;
  desc: string;
}> = [
  { type: 'breadboard', name: '830-Point Breadboard', category: 'Breadboard', icon: Grid, desc: 'Solderless prototyping board with power rails' },
  { type: 'esp32', name: 'ESP32 WROOM-32', category: 'MCU', icon: Cpu, desc: '30-Pin Dual Core Wi-Fi + BT Module' },
  { type: 'esp8266', name: 'ESP8266 NodeMCU v2', category: 'MCU', icon: Cpu, desc: 'Wi-Fi Microcontroller' },
  { type: 'power_supply', name: '5V 2A Power Supply', category: 'Power', icon: Power, desc: 'External 5V VCC / GND Power Source' },
  { type: 'ph_sensor', name: 'pH Sensor Module', category: 'Sensors', icon: Activity, desc: 'Analog pH probe + BNC signal board' },
  { type: 'tds_sensor', name: 'EC / TDS Probe', category: 'Sensors', icon: Gauge, desc: 'Nutrient conductivity meter' },
  { type: 'water_level', name: 'Water Level Probe', category: 'Sensors', icon: Droplet, desc: 'Reservoir water level depth sensor' },
  { type: 'do_sensor', name: 'Dissolved O2 Probe', category: 'Sensors', icon: Flame, desc: 'Dissolved oxygen probe' },
  { type: 'relay', name: '5V Relay Module', category: 'Actuators', icon: Zap, desc: 'Peristaltic pump / valve control relay' },
  { type: 'led', name: 'Status LED Indicator', category: 'Actuators', icon: Lightbulb, desc: 'General status LED' },
  { type: 'dht22', name: 'DHT22 Sensor', category: 'Sensors', icon: Thermometer, desc: 'Greenhouse temp & humidity probe' },
];

export default function ComponentPalette({ onAddComponent }: ComponentPaletteProps) {
  return (
    <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-400" /> Component Library
        </h3>
        <p className="text-xs text-slate-400 mt-1">Click any item to place it onto the circuit workspace grid.</p>
      </div>

      {/* Palette Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
        {PALETTE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              onClick={() => onAddComponent(item.type)}
              className="w-full p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all text-left group flex items-start gap-3 shadow-md"
            >
              <div className="p-2.5 rounded-xl bg-slate-800 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">{item.name}</span>
                  <span className="text-[9px] font-mono font-semibold text-slate-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                    {item.category}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-tight">{item.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
