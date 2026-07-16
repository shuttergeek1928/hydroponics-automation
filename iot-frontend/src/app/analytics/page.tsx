// src/app/analytics/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Download,
  Calendar,
  RefreshCw,
  Cpu,
  TrendingUp,
  Thermometer,
  FlaskConical,
  Gauge,
  Droplet,
  Waves
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import { api, Device, generateCsvExport } from "@/lib/api";
import PageTransition from "@/components/PageTransition";

export default function AnalyticsPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [chartType, setChartType] = useState<"nutrients" | "climate">("climate");
  const [mounted, setMounted] = useState(false);

  const fetchDevices = async () => {
    try {
      const devList = await api.getDevices();
      setDevices(devList);
      if (devList.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(devList[0].deviceId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchDevices();
  }, [selectedDeviceId]);

  const handleCsvExport = () => {
    const device = devices.find(d => d.deviceId === selectedDeviceId);
    if (!device) {
      alert("Please select a device to export.");
      return;
    }

    const csvContent = generateCsvExport(device);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${device.deviceId}_telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedDevice = devices.find(d => d.deviceId === selectedDeviceId);
  const readings = selectedDevice?.sensorReadings || [];
  const chartData = [...readings].reverse(); // oldest first for line progression

  // Calculated metrics
  const getAggregates = () => {
    if (readings.length === 0) return null;
    const temps = readings.map(r => r.temperature);
    const phs = readings.map(r => r.ph);
    const tdss = readings.map(r => r.tds);
    const levels = readings.map(r => r.waterLevel);

    return {
      tempAvg: temps.reduce((a, b) => a + b, 0) / readings.length,
      tempMax: Math.max(...temps),
      tempMin: Math.min(...temps),
      phAvg: phs.reduce((a, b) => a + b, 0) / readings.length,
      phMax: Math.max(...phs),
      phMin: Math.min(...phs),
      tdsAvg: tdss.reduce((a, b) => a + b, 0) / readings.length,
      levelAvg: levels.reduce((a, b) => a + b, 0) / readings.length,
    };
  };

  const aggs = getAggregates();

  return (
    <PageTransition>
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text">Reports & Analytics</h1>
          <p className="text-text-muted mt-1">Export telemetry ledgers and chart systemic correlation cycles.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDevices}
            className="btn-secondary text-xs h-10 px-4 flex items-center gap-2 bg-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Dataset
          </button>
          <button
            disabled={!selectedDevice}
            onClick={handleCsvExport}
            className="btn-primary text-xs h-10 px-4 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV Log
          </button>
        </div>
      </div>

      {loading && devices.length === 0 ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-border">
          <BarChart3 className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-lg font-bold text-text">Telemetry data missing</p>
          <p className="text-xs text-text-muted mt-1">Start devices to accumulate analytics logs.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Controls Bar: Device & Chart Selector */}
          <div className="bg-white border border-border rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 max-w-sm">
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Analyze Device</label>
              <div className="relative">
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="w-full bg-surface border border-border px-3.5 py-2.5 rounded-xl text-xs font-bold text-text focus:outline-none focus:border-primary cursor-pointer appearance-none"
                >
                  {devices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>{d.name} ({d.deviceId})</option>
                  ))}
                </select>
                <Cpu className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-surface p-1 rounded-xl border border-border self-start md:self-auto">
              <button
                onClick={() => setChartType("climate")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  chartType === "climate" ? "bg-white text-primary-dark shadow-xs" : "text-text-muted hover:text-text"
                }`}
              >
                Water Temp & Oxygen Ratio
              </button>
              <button
                onClick={() => setChartType("nutrients")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  chartType === "nutrients" ? "bg-white text-primary-dark shadow-xs" : "text-text-muted hover:text-text"
                }`}
              >
                pH Balance & Nutrient Cycles (TDS)
              </button>
            </div>
          </div>

          {/* Interactive Chart */}
          <div className="bg-white border border-border rounded-3xl p-6 shadow-xs">
            <h2 className="text-base font-bold text-text mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Multi-Variable Agronomic Correlations
            </h2>

            <div className="h-[320px] w-full">
              {mounted && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                      stroke="var(--color-border)"
                    />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} stroke="var(--color-border)" />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} stroke="var(--color-border)" />
                    <Tooltip
                      labelFormatter={(l) => new Date(l).toLocaleString()}
                      contentStyle={{
                        background: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "12px",
                        fontSize: "12px"
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", fontWeight: 600 }} />

                    {chartType === "climate" ? (
                      <>
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="temperature"
                          name="Water Temp (°C)"
                          stroke="hsl(38, 92%, 50%)"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="dissolvedOxygen"
                          name="Dissolved Oxygen (mg/L)"
                          stroke="hsl(180, 70%, 40%)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </>
                    ) : (
                      <>
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="ph"
                          name="pH Balance"
                          stroke="hsl(142, 64%, 38%)"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="tds"
                          name="Nutrients (TDS - ppm)"
                          stroke="hsl(250, 70%, 50%)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-text-muted text-sm font-medium">
                  Loading trend matrices...
                </div>
              )}
            </div>
          </div>

          {/* Statistical Aggregates Grid */}
          {aggs && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Temperature metrics */}
              <div className="bg-white border border-border p-5 rounded-2xl shadow-xs">
                <div className="flex items-center gap-2 text-orange-500 mb-2">
                  <Thermometer className="w-4 h-4" />
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Water Temperature</span>
                </div>
                <span className="block text-xl font-bold text-text">Avg: {aggs.tempAvg.toFixed(1)}°C</span>
                <span className="block text-[10px] text-text-muted font-medium mt-1">
                  Min: {aggs.tempMin.toFixed(1)}°C • Max: {aggs.tempMax.toFixed(1)}°C
                </span>
              </div>

              {/* pH metrics */}
              <div className="bg-white border border-border p-5 rounded-2xl shadow-xs">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <FlaskConical className="w-4 h-4" />
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">pH Drift</span>
                </div>
                <span className="block text-xl font-bold text-text">Avg: {aggs.phAvg.toFixed(2)}</span>
                <span className="block text-[10px] text-text-muted font-medium mt-1">
                  Min: {aggs.phMin.toFixed(2)} • Max: {aggs.phMax.toFixed(2)}
                </span>
              </div>

              {/* TDS Average */}
              <div className="bg-white border border-border p-5 rounded-2xl shadow-xs">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <Gauge className="w-4 h-4" />
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Nutrients Concent.</span>
                </div>
                <span className="block text-xl font-bold text-text">{Math.round(aggs.tdsAvg)} ppm</span>
                <span className="block text-[10px] text-text-muted font-medium mt-1">
                  Average concentration of nutrient solids
                </span>
              </div>

              {/* Water Level Average */}
              <div className="bg-white border border-border p-5 rounded-2xl shadow-xs">
                <div className="flex items-center gap-2 text-blue-500 mb-2">
                  <Droplet className="w-4 h-4" />
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Avg Reservoir Level</span>
                </div>
                <span className="block text-xl font-bold text-text">{Math.round(aggs.levelAvg)}%</span>
                <span className="block text-[10px] text-text-muted font-medium mt-1">
                  Total average fluid volume reserve
                </span>
              </div>
            </div>
          )}

          {/* Export explanation card */}
          <div className="bg-primary-light/50 border border-primary/20 p-6 rounded-3xl text-primary-dark">
            <h3 className="font-bold text-base mb-2">Agri-Data Audit Ledgers</h3>
            <p className="text-xs leading-relaxed opacity-95">
              Downloading the CSV report gathers the last **100 sensor read logs** stored on this device node. The tabular format contains exact ISO-formatted timestamps, temperature metrics, pH offsets, TDS parameters, dissolved oxygen ratios, and the state logs of GPIO pins 2 (Lights) and 26 (Pump) for audits.
            </p>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
