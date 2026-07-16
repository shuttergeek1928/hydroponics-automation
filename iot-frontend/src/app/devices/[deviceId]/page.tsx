// src/app/devices/[deviceId]/page.tsx
"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Cpu,
  RefreshCw,
  Clock,
  Play,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Thermometer,
  FlaskConical,
  Gauge,
  Droplet,
  Waves,
  Wind
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { api, Device, DeviceCommand, SensorReading } from "@/lib/api";
import PageTransition from "@/components/PageTransition";

export default function DeviceDetailPage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = use(params);
  const router = useRouter();
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [commandLoading, setCommandLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ph" | "tds" | "temperature" | "waterLevel" | "dissolvedOxygen" | "humidity">("temperature");
  const [mounted, setMounted] = useState(false);

  const fetchDevice = async () => {
    try {
      const dev = await api.getDeviceById(deviceId);
      if (dev) {
        setDevice(dev);
      } else {
        setDevice(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchDevice();
    const interval = setInterval(fetchDevice, 5000);
    return () => clearInterval(interval);
  }, [deviceId]);

  const handleCommand = async (type: DeviceCommand["commandType"], value: string, label: string) => {
    setCommandLoading(label);
    try {
      await api.queueCommand(deviceId, type, value);
      await fetchDevice();
      alert(`Command queued successfully: ${type} = ${value}`);
    } catch (err) {
      console.error(err);
      alert("Failed to queue command.");
    } finally {
      setCommandLoading(null);
    }
  };

  if (loading && !device) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-text-muted font-medium animate-pulse">Syncing controller dashboard...</p>
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <PageTransition>
        <div className="text-center py-20 bg-white rounded-3xl border border-border">
          <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text">Device Not Found</h2>
          <p className="text-text-muted mt-2 mb-6">The controller with ID "{deviceId}" does not exist.</p>
          <Link href="/devices" className="btn-primary">
            Back to Devices
          </Link>
        </div>
      </PageTransition>
    );
  }

  const latestReading = device.sensorReadings?.[0];
  const chartData = [...(device.sensorReadings || [])].reverse();

  // Metric mappings for charts
  const metricConfigs = {
    temperature: { name: "Temperature", unit: "°C", color: "hsl(38, 92%, 50%)", key: "temperature" },
    ph: { name: "pH Level", unit: "", color: "hsl(142, 64%, 38%)", key: "ph" },
    tds: { name: "Nutrients (TDS)", unit: " ppm", color: "hsl(250, 70%, 50%)", key: "tds" },
    waterLevel: { name: "Water Level", unit: "%", color: "hsl(200, 72%, 50%)", key: "waterLevel" },
    dissolvedOxygen: { name: "Dissolved Oxygen", unit: " mg/L", color: "hsl(180, 70%, 40%)", key: "dissolvedOxygen" },
    humidity: { name: "Humidity", unit: "%", color: "hsl(160, 60%, 45%)", key: "humidity" }
  };

  const currentMetric = metricConfigs[activeTab];

  return (
    <PageTransition>
      {/* Back navigation and header */}
      <div className="flex flex-col gap-4 mb-8">
        <Link
          href="/devices"
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-text transition-colors self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Controllers list
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl bg-white border border-border shadow-xs ${device.isOnline ? "text-primary border-primary/20" : "text-text-muted"}`}>
              <Cpu className="w-8 h-8 animate-float" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-text">{device.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  device.isOnline ? "bg-primary-light text-primary-dark" : "bg-danger/10 text-danger"
                }`}>
                  {device.isOnline ? "Online" : "Offline"}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1 font-semibold uppercase tracking-wider">
                {device.system} • Node ID: <code className="bg-surface px-1.5 py-0.5 rounded text-[10px] font-mono border border-border">{device.deviceId}</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDevice}
              className="btn-secondary text-xs h-10 px-4 flex items-center gap-2 bg-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Sync Telemetry
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Column: Live Telemetry Cards */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold text-text flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Live Controller Outputs
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Temp */}
            <div className="bg-white border border-border p-4 rounded-2xl flex flex-col justify-between min-h-[100px] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Water Temp</span>
                <Thermometer className="w-4 h-4 text-orange-500" />
              </div>
              <span className="text-2xl font-extrabold text-text mt-2">
                {latestReading ? `${latestReading.temperature.toFixed(1)}°C` : "--"}
              </span>
            </div>

            {/* pH */}
            <div className="bg-white border border-border p-4 rounded-2xl flex flex-col justify-between min-h-[100px] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">pH Level</span>
                <FlaskConical className="w-4 h-4 text-primary" />
              </div>
              <span className="text-2xl font-extrabold text-text mt-2">
                {latestReading ? latestReading.ph.toFixed(2) : "--"}
              </span>
            </div>

            {/* TDS */}
            <div className="bg-white border border-border p-4 rounded-2xl flex flex-col justify-between min-h-[100px] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">TDS (Nutrients)</span>
                <Gauge className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="text-2xl font-extrabold text-text mt-2">
                {latestReading ? `${latestReading.tds} ppm` : "--"}
              </span>
            </div>

            {/* Level */}
            <div className="bg-white border border-border p-4 rounded-2xl flex flex-col justify-between min-h-[100px] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Water Level</span>
                <Droplet className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-2xl font-extrabold text-text mt-2">
                {latestReading ? `${latestReading.waterLevel}%` : "--"}
              </span>
            </div>

            {/* DO */}
            <div className="bg-white border border-border p-4 rounded-2xl flex flex-col justify-between min-h-[100px] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Dis. Oxygen</span>
                <Waves className="w-4 h-4 text-cyan-500" />
              </div>
              <span className="text-2xl font-extrabold text-text mt-2">
                {latestReading ? `${latestReading.dissolvedOxygen} mg/L` : "--"}
              </span>
            </div>

            {/* Humidity */}
            <div className="bg-white border border-border p-4 rounded-2xl flex flex-col justify-between min-h-[100px] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Air Humidity</span>
                <Wind className="w-4 h-4 text-teal-500" />
              </div>
              <span className="text-2xl font-extrabold text-text mt-2">
                {latestReading ? `${latestReading.humidity}%` : "--"}
              </span>
            </div>
          </div>

          {/* Current Relay Status Panel */}
          <div className="bg-white border border-border p-5 rounded-3xl shadow-xs">
            <h3 className="text-sm font-bold text-text mb-3 uppercase tracking-wider">Current GPIO Relays</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border/60">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${latestReading?.pumpState === "on" ? "bg-primary/10 text-primary" : "bg-border/60 text-text-muted"}`}>
                    <Droplet className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-text leading-none">Water Pump (GPIO 26)</span>
                    <span className="text-[10px] text-text-muted mt-0.5 block">Drives nutrient peristaltic flow</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${
                  latestReading?.pumpState === "on" ? "bg-primary text-white" : "bg-border text-text-muted"
                }`}>
                  {latestReading?.pumpState || "off"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border/60">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${latestReading?.ledState === "on" ? "bg-orange-500/10 text-orange-600" : "bg-border/60 text-text-muted"}`}>
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-text leading-none">Onboard LED (GPIO 2)</span>
                    <span className="text-[10px] text-text-muted mt-0.5 block">Simulates overhead light cycles</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${
                  latestReading?.ledState === "on" ? "bg-orange-500 text-white" : "bg-border text-text-muted"
                }`}>
                  {latestReading?.ledState || "off"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns (2/3 width): Interactive charts tab */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-text flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Dynamic Telemetry History
            </h2>
            
            {/* Metric Tab Selector */}
            <div className="flex flex-wrap gap-1 bg-surface p-1 rounded-xl border border-border">
              {Object.entries(metricConfigs).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    activeTab === key ? "bg-white text-primary-dark shadow-xs" : "text-text-muted hover:text-text"
                  }`}
                >
                  {config.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-border rounded-3xl p-5 shadow-xs">
            {/* Recharts Chart Container */}
            <div className="h-[280px] w-full mt-2">
              {mounted && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={currentMetric.color} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={currentMetric.color} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(time) => new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                      stroke="var(--color-border)"
                    />
                    <YAxis
                      domain={activeTab === "ph" ? [4.5, 7.5] : activeTab === "temperature" ? [15, 30] : ["auto", "auto"]}
                      tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                      stroke="var(--color-border)"
                    />
                    <Tooltip
                      labelFormatter={(label) => new Date(label).toLocaleString()}
                      formatter={(value: any) => [`${value}${currentMetric.unit}`, currentMetric.name]}
                      contentStyle={{
                        background: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "12px",
                        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
                        fontSize: "12px"
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey={currentMetric.key}
                      stroke={currentMetric.color}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#metricGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-text-muted text-sm font-medium">
                  Loading chart variables...
                </div>
              )}
            </div>
          </div>

          {/* Dedicated Troubleshooting & Test Triggers */}
          <div className="bg-white border border-border rounded-3xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-text mb-4">Hardware Diagnosis & Override Panel</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button
                disabled={commandLoading !== null}
                onClick={() => handleCommand("pump_duration", "5", "pump_test")}
                className="btn-secondary h-12 flex flex-col items-center justify-center p-2 rounded-2xl text-[10px] font-bold text-primary-dark gap-1"
              >
                <span>{commandLoading === "pump_test" ? "Queuing..." : "Pulse Pump (5s)"}</span>
              </button>

              <button
                disabled={commandLoading !== null}
                onClick={() => handleCommand("led", latestReading?.ledState === "on" ? "off" : "on", "led_toggle")}
                className="btn-secondary h-12 flex flex-col items-center justify-center p-2 rounded-2xl text-[10px] font-bold text-text gap-1"
              >
                <span>{commandLoading === "led_toggle" ? "Queuing..." : `LED On/Off Toggle`}</span>
              </button>

              <button
                disabled={commandLoading !== null}
                onClick={() => handleCommand("sensor_interval", "10", "poll_test")}
                className="btn-secondary h-12 flex flex-col items-center justify-center p-2 rounded-2xl text-[10px] font-bold text-text gap-1"
              >
                <span>{commandLoading === "poll_test" ? "Queuing..." : "Force Rapid Poll (10s)"}</span>
              </button>

              <button
                disabled={commandLoading !== null}
                onClick={() => handleCommand("restart", "true", "reboot")}
                className="btn-secondary h-12 flex flex-col items-center justify-center p-2 rounded-2xl text-[10px] font-bold text-danger border-danger/10 bg-danger/5 hover:bg-danger/10 gap-1"
              >
                <span>{commandLoading === "reboot" ? "Rebooting..." : "Reboot System"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Commands Log Audit Table */}
      <div className="bg-white border border-border rounded-3xl p-6 shadow-xs">
        <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" /> Command Dispatch Ledger
        </h2>

        {device.commands.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border rounded-2xl">
            <p className="text-xs text-text-muted font-semibold">No command history exists for this device node.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-text-muted font-bold tracking-wider uppercase text-[10px]">
                  <th className="pb-3 pr-4">Command Type</th>
                  <th className="pb-3 pr-4">Value</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Sent Time</th>
                  <th className="pb-3">Executed Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {device.commands.slice(0, 10).map((cmd) => (
                  <tr key={cmd.id} className="text-text hover:bg-surface/50">
                    <td className="py-3 pr-4 font-mono font-bold uppercase text-primary-dark">
                      {cmd.commandType}
                    </td>
                    <td className="py-3 pr-4 font-mono bg-surface/50 px-2 py-0.5 rounded-lg border border-border/40 inline-block mt-2">
                      {cmd.commandValue}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        cmd.status === "Executed"
                          ? "bg-primary-light text-primary"
                          : cmd.status === "Pending"
                          ? "bg-warning/10 text-warning"
                          : cmd.status === "Sent"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-danger/10 text-danger"
                      }`}>
                        {cmd.status === "Executed" && <CheckCircle className="w-3 h-3" />}
                        {cmd.status === "Failed" && <XCircle className="w-3 h-3" />}
                        {cmd.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-text-muted">
                      {new Date(cmd.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 text-text-muted">
                      {cmd.executedAt ? new Date(cmd.executedAt).toLocaleString() : "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
