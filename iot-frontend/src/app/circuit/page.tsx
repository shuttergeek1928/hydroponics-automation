"use client";

import React, { useState, useEffect } from "react";
import { Cpu, RefreshCw, Layers, Grid } from "lucide-react";
import { api, Device } from "@/lib/api";
import PageTransition from "@/components/PageTransition";
import LiveCircuitBoard from "@/components/LiveCircuitBoard";
import TinkercadStudio from "@/components/circuit/TinkercadStudio";

export default function CircuitDiagramPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'tinkercad' | 'quick'>('tinkercad');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const devList = await api.getDevices();
      setDevices(devList);
      
      if (!selectedDeviceId && devList.length > 0) {
        setSelectedDeviceId(devList[0].deviceId);
      }
    } catch (err) {
      console.error("Error loading devices for circuit diagram", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [selectedDeviceId]);

  const selectedDevice = devices.find(d => d.deviceId === selectedDeviceId) || null;

  return (
    <PageTransition>
      <div className="h-[calc(100vh-7.5rem)] pb-4 flex flex-col overflow-hidden">
        {/* Fixed Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text flex items-center gap-3">
              <Cpu className="w-7 h-7 text-primary" />
              Circuit & Breadboard Studio
            </h1>
            <p className="text-text-muted text-xs mt-0.5">
              Interactive Tinkercad-style breadboard simulator, point-to-point wire drawing, and real-time hardware telemetry.
            </p>
          </div>

          {/* View Switcher & Device Select */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Selector */}
            <div className="flex items-center gap-1 bg-white border border-border p-1 rounded-xl shadow-xs">
              <button
                onClick={() => setViewMode('tinkercad')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'tinkercad'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-muted hover:text-text hover:bg-surface'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                Tinkercad Studio
              </button>
              <button
                onClick={() => setViewMode('quick')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'quick'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-muted hover:text-text hover:bg-surface'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Quick Schematic
              </button>
            </div>

            {/* Device Selector Dropdown */}
            {devices.length > 0 && (
              <select
                value={selectedDeviceId || ""}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="bg-white border border-border text-text text-sm rounded-xl focus:ring-primary focus:border-primary block p-2.5 shadow-xs"
              >
                {devices.map(dev => (
                  <option key={dev.deviceId} value={dev.deviceId}>
                    {dev.name} ({dev.system})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={fetchData}
              className="btn-secondary text-xs h-10 px-4 flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Sync Telemetry
            </button>
          </div>
        </div>

        {/* Main Studio Area (Fills remaining height, inner scroll only) */}
        {loading && devices.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-text-muted font-medium animate-pulse">Initializing Tinkercad Circuit Studio...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-hidden">
            {viewMode === 'tinkercad' ? (
              <TinkercadStudio device={selectedDevice} />
            ) : (
              <div className="h-full overflow-y-auto">
                <LiveCircuitBoard device={selectedDevice} />
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
