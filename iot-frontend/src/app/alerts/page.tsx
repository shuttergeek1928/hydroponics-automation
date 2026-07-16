// src/app/alerts/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Trash2,
  Sliders,
  RefreshCw,
  Info,
  SlidersHorizontal,
  Save,
  Check
} from "lucide-react";
import { api, AlertLog, SystemSettings } from "@/lib/api";
import PageTransition from "@/components/PageTransition";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("active");

  // Threshold form inputs
  const [phMin, setPhMin] = useState("");
  const [phMax, setPhMax] = useState("");
  const [tdsMin, setTdsMin] = useState("");
  const [tdsMax, setTdsMax] = useState("");
  const [tempMin, setTempMin] = useState("");
  const [tempMax, setTempMax] = useState("");

  const fetchData = () => {
    try {
      const allAlerts = api.getAlerts();
      setAlerts(allAlerts);

      const sysSettings = api.getSettings();
      setSettings(sysSettings);
      
      // Initialize form values
      setPhMin(sysSettings.phMin.toString());
      setPhMax(sysSettings.phMax.toString());
      setTdsMin(sysSettings.tdsMin.toString());
      setTdsMax(sysSettings.tdsMax.toString());
      setTempMin(sysSettings.tempMin.toString());
      setTempMax(sysSettings.tempMax.toString());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDismiss = (id: string) => {
    api.dismissAlert(id);
    fetchData();
  };

  const handleClearResolved = () => {
    api.clearResolvedAlerts();
    fetchData();
  };

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    api.updateSettings({
      phMin: parseFloat(phMin),
      phMax: parseFloat(phMax),
      tdsMin: parseInt(tdsMin),
      tdsMax: parseInt(tdsMax),
      tempMin: parseFloat(tempMin),
      tempMax: parseFloat(tempMax)
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    fetchData();
  };

  // Filter logic
  const filteredAlerts = alerts.filter(a => {
    if (filter === "active") return !a.resolved;
    if (filter === "resolved") return a.resolved;
    return true;
  });

  const activeCount = alerts.filter(a => !a.resolved).length;
  const warningCount = alerts.filter(a => !a.resolved && a.severity === "warning").length;
  const criticalCount = alerts.filter(a => !a.resolved && a.severity === "critical").length;

  return (
    <PageTransition>
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text">Alerts & Warning Logs</h1>
          <p className="text-text-muted mt-1">Configure warning thresholds and handle system notifications.</p>
        </div>
        <button
          onClick={fetchData}
          className="btn-secondary text-xs h-10 px-4 flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sync Feed
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Area: Alert Logs List (Left/Center) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Statistics Banner */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-border p-4 rounded-2xl shadow-xs">
                <span className="block text-[11px] font-bold text-text-muted uppercase tracking-wider">Unresolved Logs</span>
                <span className="text-3xl font-extrabold text-text mt-1 block">{activeCount}</span>
              </div>
              <div className="bg-white border border-border p-4 rounded-2xl shadow-xs">
                <span className="block text-[11px] font-bold text-warning uppercase tracking-wider">Warnings</span>
                <span className="text-3xl font-extrabold text-warning mt-1 block">{warningCount}</span>
              </div>
              <div className="bg-white border border-border p-4 rounded-2xl shadow-xs">
                <span className="block text-[11px] font-bold text-danger uppercase tracking-wider">Criticals</span>
                <span className="text-3xl font-extrabold text-danger mt-1 block">{criticalCount}</span>
              </div>
            </div>

            {/* List and Filters Card */}
            <div className="bg-white border border-border rounded-3xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 mb-4">
                {/* Filter tabs */}
                <div className="flex gap-1.5 bg-surface p-1 rounded-xl border border-border self-start">
                  <button
                    onClick={() => setFilter("active")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filter === "active" ? "bg-white text-primary-dark shadow-xs" : "text-text-muted hover:text-text"
                    }`}
                  >
                    Active ({activeCount})
                  </button>
                  <button
                    onClick={() => setFilter("resolved")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filter === "resolved" ? "bg-white text-text shadow-xs" : "text-text-muted hover:text-text"
                    }`}
                  >
                    Resolved History
                  </button>
                  <button
                    onClick={() => setFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filter === "all" ? "bg-white text-text shadow-xs" : "text-text-muted hover:text-text"
                    }`}
                  >
                    All Logs
                  </button>
                </div>

                {filter !== "active" && alerts.some(a => a.resolved) && (
                  <button
                    onClick={handleClearResolved}
                    className="text-xs font-semibold text-danger hover:underline flex items-center gap-1 self-end sm:self-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear Resolved History
                  </button>
                )}
              </div>

              {/* Alerts Log List */}
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center bg-surface/30">
                  <CheckCircle2 className="w-10 h-10 text-primary mb-2" />
                  <p className="text-sm font-bold text-text">No alerts matching filter criteria</p>
                  <p className="text-xs text-text-muted mt-0.5">Everything is operating inside safety margins.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAlerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all ${
                        alert.resolved
                          ? "bg-surface/50 border-border/70 opacity-80"
                          : alert.severity === "critical"
                          ? "bg-danger/5 border-danger/25"
                          : alert.severity === "warning"
                          ? "bg-warning/5 border-warning/25"
                          : "bg-blue-50/50 border-blue-100"
                      }`}
                    >
                      <div className="flex gap-3.5 items-start">
                        <div className={`p-2.5 rounded-xl border mt-0.5 ${
                          alert.resolved
                            ? "bg-border/60 text-text-muted border-border"
                            : alert.severity === "critical"
                            ? "bg-danger/10 text-danger border-danger/10"
                            : alert.severity === "warning"
                            ? "bg-warning/10 text-warning border-warning/10"
                            : "bg-blue-100 text-blue-700 border-blue-200"
                        }`}>
                          {alert.resolved ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : alert.severity === "critical" || alert.severity === "warning" ? (
                            <AlertTriangle className="w-5 h-5 animate-pulse" />
                          ) : (
                            <Info className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              alert.resolved
                                ? "bg-border text-text-muted"
                                : alert.severity === "critical"
                                ? "bg-danger text-white animate-pulse"
                                : alert.severity === "warning"
                                ? "bg-warning text-white"
                                : "bg-blue-500 text-white"
                            }`}>
                              {alert.resolved ? "Resolved" : alert.severity}
                            </span>
                            <span className="text-[10px] text-text-muted font-bold font-mono">
                              {alert.deviceId}
                            </span>
                          </div>
                          <p className="font-bold text-text text-sm mt-1.5">{alert.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-text-muted font-semibold">{alert.deviceName}</span>
                            <span className="text-[9px] text-text-muted">•</span>
                            <span className="text-[10px] text-text-muted font-mono">{new Date(alert.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {!alert.resolved && (
                        <button
                          onClick={() => handleDismiss(alert.id)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold border border-border bg-white hover:border-primary text-text-muted hover:text-primary transition-all self-end sm:self-auto shadow-xs"
                        >
                          Resolve Alert
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Alert Threshold Calibration Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-border rounded-3xl p-5 shadow-xs">
              <h2 className="text-base font-bold text-text mb-2 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" /> Range Configurations
              </h2>
              <p className="text-xs text-text-muted mb-6 leading-relaxed">
                Calibrate thresholds used by HydroFlow to parse telemetry drift and raise warnings. Values are persisted locally.
              </p>

              <form onSubmit={handleSaveThresholds} className="space-y-5">
                {/* pH Limits */}
                <div className="space-y-2 border-b border-border pb-4">
                  <span className="block text-xs font-bold text-text-muted uppercase tracking-wider">pH Target Range</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-text-muted block mb-1">Min (Lower Limit)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={phMin}
                        onChange={(e) => setPhMin(e.target.value)}
                        className="w-full bg-surface border border-border px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-primary font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-muted block mb-1">Max (Upper Limit)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={phMax}
                        onChange={(e) => setPhMax(e.target.value)}
                        className="w-full bg-surface border border-border px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-primary font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* TDS Limits */}
                <div className="space-y-2 border-b border-border pb-4">
                  <span className="block text-xs font-bold text-text-muted uppercase tracking-wider">TDS Range (ppm)</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-text-muted block mb-1">Min (Lower Limit)</label>
                      <input
                        type="number"
                        value={tdsMin}
                        onChange={(e) => setTdsMin(e.target.value)}
                        className="w-full bg-surface border border-border px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-primary font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-muted block mb-1">Max (Upper Limit)</label>
                      <input
                        type="number"
                        value={tdsMax}
                        onChange={(e) => setTdsMax(e.target.value)}
                        className="w-full bg-surface border border-border px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-primary font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Temp Limits */}
                <div className="space-y-2 pb-2">
                  <span className="block text-xs font-bold text-text-muted uppercase tracking-wider">Water Temp Range (°C)</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-text-muted block mb-1">Min (Lower Limit)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={tempMin}
                        onChange={(e) => setTempMin(e.target.value)}
                        className="w-full bg-surface border border-border px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-primary font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-muted block mb-1">Max (Upper Limit)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={tempMax}
                        onChange={(e) => setTempMax(e.target.value)}
                        className="w-full bg-surface border border-border px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-primary font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full btn-primary h-11 text-xs font-bold flex items-center justify-center gap-2 mt-4"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4" /> Calibration Saved
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Ideal Calibration
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
