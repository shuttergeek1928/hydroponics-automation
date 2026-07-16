// src/app/settings/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Database,
  Sliders,
  CheckCircle,
  RefreshCw,
  Cpu,
  FlaskConical,
  Gauge,
  Thermometer,
  Save,
  Check
} from "lucide-react";
import { api, SystemSettings } from "@/lib/api";
import PageTransition from "@/components/PageTransition";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form Inputs
  const [backendUrl, setBackendUrl] = useState("");
  const [useMock, setUseMock] = useState(true);
  const [phOffset, setPhOffset] = useState("0.0");
  const [tdsFactor, setTdsFactor] = useState("1.0");

  const [phMin, setPhMin] = useState("");
  const [phMax, setPhMax] = useState("");
  const [tdsMin, setTdsMin] = useState("");
  const [tdsMax, setTdsMax] = useState("");
  const [tempMin, setTempMin] = useState("");
  const [tempMax, setTempMax] = useState("");

  const loadSettings = () => {
    try {
      const data = api.getSettings();
      setSettings(data);
      
      setBackendUrl(data.backendUrl);
      setUseMock(data.useMock);
      setPhOffset(data.calibrationPhOffset.toString());
      setTdsFactor(data.calibrationTdsFactor.toString());
      
      setPhMin(data.phMin.toString());
      setPhMax(data.phMax.toString());
      setTdsMin(data.tdsMin.toString());
      setTdsMax(data.tdsMax.toString());
      setTempMin(data.tempMin.toString());
      setTempMax(data.tempMax.toString());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    api.updateSettings({
      backendUrl,
      useMock,
      calibrationPhOffset: parseFloat(phOffset),
      calibrationTdsFactor: parseFloat(tdsFactor),
      phMin: parseFloat(phMin),
      phMax: parseFloat(phMax),
      tdsMin: parseInt(tdsMin),
      tdsMax: parseInt(tdsMax),
      tempMin: parseFloat(tempMin),
      tempMax: parseFloat(tempMax)
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    loadSettings();
  };

  const handleResetDefaults = () => {
    if (confirm("Are you sure you want to restore default application settings?")) {
      localStorage.removeItem("hf_settings");
      loadSettings();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  return (
    <PageTransition>
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text">System Settings</h1>
          <p className="text-text-muted mt-1">Configure networking, calibrate sensor offsets, and manage ideal cultivation parameters.</p>
        </div>
        <button
          onClick={handleResetDefaults}
          className="btn-secondary text-xs h-10 px-4 flex items-center gap-2 self-start md:self-auto bg-white hover:border-danger hover:text-danger"
        >
          Restore Defaults
        </button>
      </div>

      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-primary-light text-primary-dark border border-primary/20 rounded-2xl text-xs font-semibold flex items-center gap-2"
        >
          <Check className="w-4 h-4" /> System parameters and connection options updated successfully!
        </motion.div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Connection and Calibration column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Connection configuration */}
              <div className="bg-white border border-border rounded-3xl p-6 shadow-xs space-y-4">
                <h2 className="text-base font-bold text-text flex items-center gap-2 border-b border-border/50 pb-3">
                  <Database className="w-5 h-5 text-primary" /> Connection & Data Source
                </h2>

                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                    Application Mode
                  </label>
                  <div className="grid grid-cols-2 gap-4 bg-surface p-1 rounded-2xl border border-border">
                    <button
                      type="button"
                      onClick={() => setUseMock(true)}
                      className={`py-3 rounded-xl text-xs font-bold transition-all ${
                        useMock ? "bg-white text-primary-dark shadow-xs" : "text-text-muted hover:text-text"
                      }`}
                    >
                      Demo Simulation Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseMock(false)}
                      className={`py-3 rounded-xl text-xs font-bold transition-all ${
                        !useMock ? "bg-white text-primary-dark shadow-xs" : "text-text-muted hover:text-text"
                      }`}
                    >
                      Live Backend API Mode
                    </button>
                  </div>
                </div>

                {!useMock && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2 pt-2"
                  >
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">
                      Local Backend API Host Address
                    </label>
                    <input
                      type="url"
                      value={backendUrl}
                      onChange={(e) => setBackendUrl(e.target.value)}
                      placeholder="http://192.168.1.XX:5119/api"
                      className="w-full bg-surface border border-border px-4 py-3.5 rounded-2xl text-xs font-mono focus:outline-none focus:border-primary"
                      required={!useMock}
                    />
                    <span className="block text-[10px] text-text-muted leading-relaxed font-semibold">
                      Verify that your ESP32 controller and backend host are on the exact same local Wi-Fi. Run `.NET run --urls="http://0.0.0.0:5119"` to bind correctly.
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Hardware Calibration parameters */}
              <div className="bg-white border border-border rounded-3xl p-6 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-text flex items-center gap-2 border-b border-border/50 pb-3">
                    <Sliders className="w-5 h-5 text-primary" /> Hardware Sensor Calibration
                  </h2>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
                    Adjust offsets directly in the UI layer. Telemetry received from microcontrollers will be run through these mathematical offsets before rendering.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* pH offset */}
                  <div className="bg-surface/50 border border-border/80 p-5 rounded-2xl">
                    <h3 className="font-bold text-xs text-text uppercase flex items-center gap-2 mb-3">
                      <FlaskConical className="w-4 h-4 text-primary" /> pH Probe Calibration
                    </h3>
                    <label className="text-[10px] font-bold text-text-muted block mb-1.5">Linear Offset Value</label>
                    <input
                      type="number"
                      step="0.01"
                      value={phOffset}
                      onChange={(e) => setPhOffset(e.target.value)}
                      className="w-full bg-white border border-border px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-primary font-mono font-bold"
                    />
                    <span className="block text-[9px] text-text-muted mt-2">
                      Corrects probe reading: <code>output = reading + {phOffset}</code>
                    </span>
                  </div>

                  {/* TDS scale factor */}
                  <div className="bg-surface/50 border border-border/80 p-5 rounded-2xl">
                    <h3 className="font-bold text-xs text-text uppercase flex items-center gap-2 mb-3">
                      <Gauge className="w-4 h-4 text-indigo-600" /> TDS Probe Scale Factor
                    </h3>
                    <label className="text-[10px] font-bold text-text-muted block mb-1.5">Scaling Multiplier</label>
                    <input
                      type="number"
                      step="0.01"
                      value={tdsFactor}
                      onChange={(e) => setTdsFactor(e.target.value)}
                      className="w-full bg-white border border-border px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-primary font-mono font-bold"
                    />
                    <span className="block text-[9px] text-text-muted mt-2">
                      Corrects solid scaling: <code>output = reading * {tdsFactor}</code>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Crop Threshold limits settings */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white border border-border rounded-3xl p-5 shadow-xs">
                <h2 className="text-base font-bold text-text mb-2 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" /> Crop Target Limits
                </h2>
                <p className="text-xs text-text-muted mb-4 leading-relaxed">
                  Update default agricultural operating targets across the dashboard.
                </p>

                <div className="space-y-4">
                  {/* pH range */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted block">pH Limits</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={phMin}
                        onChange={(e) => setPhMin(e.target.value)}
                        placeholder="Min"
                        className="bg-surface border border-border px-3 py-2 rounded-xl text-xs focus:outline-none font-mono focus:border-primary text-center"
                        required
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={phMax}
                        onChange={(e) => setPhMax(e.target.value)}
                        placeholder="Max"
                        className="bg-surface border border-border px-3 py-2 rounded-xl text-xs focus:outline-none font-mono focus:border-primary text-center"
                        required
                      />
                    </div>
                  </div>

                  {/* TDS range */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted block">TDS Target (ppm)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={tdsMin}
                        onChange={(e) => setTdsMin(e.target.value)}
                        placeholder="Min"
                        className="bg-surface border border-border px-3 py-2 rounded-xl text-xs focus:outline-none font-mono focus:border-primary text-center"
                        required
                      />
                      <input
                        type="number"
                        value={tdsMax}
                        onChange={(e) => setTdsMax(e.target.value)}
                        placeholder="Max"
                        className="bg-surface border border-border px-3 py-2 rounded-xl text-xs focus:outline-none font-mono focus:border-primary text-center"
                        required
                      />
                    </div>
                  </div>

                  {/* Temp range */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted block">Temperature Target (°C)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="0.5"
                        value={tempMin}
                        onChange={(e) => setTempMin(e.target.value)}
                        placeholder="Min"
                        className="bg-surface border border-border px-3 py-2 rounded-xl text-xs focus:outline-none font-mono focus:border-primary text-center"
                        required
                      />
                      <input
                        type="number"
                        step="0.5"
                        value={tempMax}
                        onChange={(e) => setTempMax(e.target.value)}
                        placeholder="Max"
                        className="bg-surface border border-border px-3 py-2 rounded-xl text-xs focus:outline-none font-mono focus:border-primary text-center"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full btn-primary h-11 text-xs font-bold flex items-center justify-center gap-2 mt-6 shadow-md"
                >
                  <Save className="w-4 h-4" /> Save System Settings
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </PageTransition>
  );
}
