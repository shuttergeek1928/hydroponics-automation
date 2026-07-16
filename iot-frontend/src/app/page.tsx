// src/app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Cpu,
  Droplet,
  FlaskConical,
  Gauge,
  HelpCircle,
  Lightbulb,
  Play,
  RefreshCw,
  Sun,
  Thermometer,
  Waves,
  Wind
} from "lucide-react";
import { api, Device, AlertLog, SensorReading } from "@/lib/api";
import PageTransition from "@/components/PageTransition";

export default function DashboardHome() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickActionLoading, setQuickActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const devList = await api.getDevices();
      setDevices(devList);
      const alertList = api.getAlerts();
      setAlerts(alertList.filter(a => !a.resolved).slice(0, 4));
    } catch (err) {
      console.error("Error loading dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickAction = async (actionId: string, commandType: "led" | "pump" | "restart" | "pump_duration", value: string) => {
    setQuickActionLoading(actionId);
    try {
      const onlineDevices = devices.filter(d => d.isOnline);
      if (onlineDevices.length === 0) {
        alert("No online devices found to execute commands.");
        return;
      }
      
      // Send command to all online devices
      await Promise.all(
        onlineDevices.map(d => api.queueCommand(d.deviceId, commandType, value))
      );
      
      await fetchData();
      alert(`Quick Action executed successfully: ${actionId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to execute quick action.");
    } finally {
      setQuickActionLoading(null);
    }
  };

  // Calculations
  const onlineDevices = devices.filter(d => d.isOnline);
  const offlineDevices = devices.filter(d => !d.isOnline);
  const systemHealth =
    alerts.some(a => a.severity === "critical")
      ? "critical"
      : alerts.length > 0
      ? "warning"
      : "healthy";

  // Compute average sensor values across online devices
  const getLatestAverages = () => {
    if (onlineDevices.length === 0) return null;
    
    let sumTemp = 0, sumPh = 0, sumTds = 0, sumWater = 0, sumDO = 0, sumHum = 0;
    let count = 0;

    onlineDevices.forEach(d => {
      const latest = d.sensorReadings?.[0];
      if (latest) {
        sumTemp += latest.temperature;
        sumPh += latest.ph;
        sumTds += latest.tds;
        sumWater += latest.waterLevel;
        sumDO += latest.dissolvedOxygen;
        sumHum += latest.humidity;
        count++;
      }
    });

    if (count === 0) return null;

    return {
      temp: sumTemp / count,
      ph: sumPh / count,
      tds: sumTds / count,
      waterLevel: sumWater / count,
      do: sumDO / count,
      humidity: sumHum / count
    };
  };

  const averages = getLatestAverages();

  return (
    <PageTransition>
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text">Dashboard</h1>
          <p className="text-text-muted mt-1">Real-time macro-level metrics and system health indicators.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="btn-secondary text-xs h-10 px-4 flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <div className="text-xs font-semibold text-text-muted bg-white border border-border px-3 py-2 rounded-xl shadow-xs">
            Refreshes every 5s
          </div>
        </div>
      </div>

      {loading && devices.length === 0 ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-text-muted font-medium animate-pulse">Syncing hydroponic telemetry data...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* System Health Summary Alert Panel */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              systemHealth === "critical"
                ? "bg-danger/5 border-danger/20 text-danger"
                : systemHealth === "warning"
                ? "bg-warning/5 border-warning/20 text-warning"
                : "bg-primary/5 border-primary/20 text-primary-dark"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${
                systemHealth === "critical"
                  ? "bg-danger/10 text-danger"
                  : systemHealth === "warning"
                  ? "bg-warning/10 text-warning"
                  : "bg-primary/10 text-primary"
              }`}>
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">
                  {systemHealth === "critical"
                    ? "Attention Required: Critical Alerts Active"
                    : systemHealth === "warning"
                    ? "Warning Flags Raised"
                    : "All Hydroponic Systems Nominal"}
                </h3>
                <p className="text-sm opacity-90 mt-1">
                  {systemHealth === "critical"
                    ? "One or more sensors are breaching dangerous operating thresholds. Act immediately."
                    : systemHealth === "warning"
                    ? "Some metrics have drifted outside ideal cultivation parameters."
                    : `${onlineDevices.length} of ${devices.length} IoT controllers online. Continuous flow systems working normally.`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
              <Link
                href="/alerts"
                className={`w-full md:w-auto text-center px-4 py-2.5 rounded-xl font-semibold text-xs border ${
                  systemHealth === "critical"
                    ? "bg-danger text-white border-transparent hover:bg-danger/90"
                    : systemHealth === "warning"
                    ? "bg-warning text-white border-transparent hover:bg-warning/90"
                    : "bg-primary text-white border-transparent hover:bg-primary-dark"
                }`}
              >
                {systemHealth === "healthy" ? "View Alerts Log" : "Resolve Alerts"}
              </Link>
            </div>
          </motion.div>

          {/* Quick Metrics Grid */}
          <div>
            <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Active Sensor Matrix (Averages)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Sensor Card: Temperature */}
              <div className="glassmorphism-card p-4 rounded-2xl flex flex-col justify-between min-h-[120px]">
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded-xl bg-orange-50 border border-orange-100 text-orange-600">
                    <Thermometer className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                    18-24°C
                  </span>
                </div>
                <div className="mt-4">
                  <span className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider">Water Temp</span>
                  <span className="text-2xl font-bold text-text">
                    {averages ? `${averages.temp.toFixed(1)}°C` : "--"}
                  </span>
                </div>
              </div>

              {/* Sensor Card: pH */}
              <div className="glassmorphism-card p-4 rounded-2xl flex flex-col justify-between min-h-[120px]">
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded-xl bg-primary-light border border-primary/20 text-primary">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full border border-primary/20">
                    5.5-6.5
                  </span>
                </div>
                <div className="mt-4">
                  <span className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider">pH Balance</span>
                  <span className="text-2xl font-bold text-text">
                    {averages ? averages.ph.toFixed(2) : "--"}
                  </span>
                </div>
              </div>

              {/* Sensor Card: TDS */}
              <div className="glassmorphism-card p-4 rounded-2xl flex flex-col justify-between min-h-[120px]">
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    800-1200
                  </span>
                </div>
                <div className="mt-4">
                  <span className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider">Nutrients (TDS)</span>
                  <span className="text-2xl font-bold text-text">
                    {averages ? `${Math.round(averages.tds)} ppm` : "--"}
                  </span>
                </div>
              </div>

              {/* Sensor Card: Water Level */}
              <div className="glassmorphism-card p-4 rounded-2xl flex flex-col justify-between min-h-[120px]">
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                    <Droplet className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    &gt;50%
                  </span>
                </div>
                <div className="mt-4">
                  <span className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider">Reservoir Level</span>
                  <span className="text-2xl font-bold text-text">
                    {averages ? `${Math.round(averages.waterLevel)}%` : "--"}
                  </span>
                </div>
              </div>

              {/* Sensor Card: Dissolved Oxygen */}
              <div className="glassmorphism-card p-4 rounded-2xl flex flex-col justify-between min-h-[120px]">
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600">
                    <Waves className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-100">
                    5-8 mg/L
                  </span>
                </div>
                <div className="mt-4">
                  <span className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider">Dis. Oxygen</span>
                  <span className="text-2xl font-bold text-text">
                    {averages ? `${averages.do.toFixed(1)} mg/L` : "--"}
                  </span>
                </div>
              </div>

              {/* Sensor Card: Humidity */}
              <div className="glassmorphism-card p-4 rounded-2xl flex flex-col justify-between min-h-[120px]">
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded-xl bg-teal-50 border border-teal-100 text-teal-600">
                    <Wind className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                    50-70%
                  </span>
                </div>
                <div className="mt-4">
                  <span className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider">Air Humidity</span>
                  <span className="text-2xl font-bold text-text">
                    {averages ? `${Math.round(averages.humidity)}%` : "--"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Devices overview list */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-text flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-primary" /> Active Devices ({onlineDevices.length}/{devices.length})
                </h2>
                <Link href="/devices" className="text-xs font-semibold text-primary hover:underline">
                  View All Devices →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {devices.map((device) => {
                  const latest = device.sensorReadings?.[0];
                  return (
                    <motion.div
                      key={device.deviceId}
                      whileHover={{ y: -2 }}
                      className="bg-white border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            device.isOnline ? "bg-primary-light text-primary-dark" : "bg-danger/10 text-danger"
                          }`}>
                            {device.isOnline ? "Online" : "Offline"}
                          </span>
                          <span className="text-[11px] text-text-muted font-mono">{device.deviceId}</span>
                        </div>
                        <h3 className="font-bold text-text text-base">{device.name}</h3>
                        <p className="text-xs text-text-muted mb-4">{device.system}</p>

                        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                          <div className="bg-surface p-2.5 rounded-xl border border-border/50">
                            <span className="text-text-muted block text-[10px] uppercase font-semibold">Temperature</span>
                            <span className="font-bold text-text mt-0.5 block">
                              {latest ? `${latest.temperature.toFixed(1)}°C` : "--"}
                            </span>
                          </div>
                          <div className="bg-surface p-2.5 rounded-xl border border-border/50">
                            <span className="text-text-muted block text-[10px] uppercase font-semibold">Water Level</span>
                            <span className="font-bold text-text mt-0.5 block">
                              {latest ? `${latest.waterLevel}%` : "--"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-border/50 pt-3">
                        <span className="text-[10px] text-text-muted">
                          Last seen: {device.isOnline ? "Just now" : new Date(device.lastSeen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        <Link
                          href={`/devices/${device.deviceId}`}
                          className="text-xs font-semibold text-primary hover:text-primary-dark"
                        >
                          Device Dashboard →
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Side column: Quick actions + alerts */}
            <div className="space-y-6">
              {/* Quick Actions Panel */}
              <div className="bg-white border border-border rounded-2xl p-5 shadow-xs">
                <h2 className="text-base font-bold text-text mb-4 flex items-center gap-2">
                  <Play className="w-4 h-4 text-primary fill-primary" /> Quick Broadcast
                </h2>
                <p className="text-xs text-text-muted mb-4">Transmit system-wide signals directly to all online ESP32 controllers.</p>
                <div className="space-y-3">
                  <button
                    disabled={quickActionLoading !== null}
                    onClick={() => handleQuickAction("water_all", "pump_duration", "15")}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary-dark transition-all text-xs font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-primary" />
                      <span>Start All Pumps (15m Run)</span>
                    </div>
                    {quickActionLoading === "water_all" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Trigger</span>}
                  </button>

                  <button
                    disabled={quickActionLoading !== null}
                    onClick={() => handleQuickAction("lights_on", "led", "on")}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-orange-200 bg-orange-50/50 hover:bg-orange-50 text-orange-800 transition-all text-xs font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-orange-600" />
                      <span>Broadcasting: LED Lights ON</span>
                    </div>
                    {quickActionLoading === "lights_on" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Trigger</span>}
                  </button>

                  <button
                    disabled={quickActionLoading !== null}
                    onClick={() => handleQuickAction("lights_off", "led", "off")}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:bg-white hover:border-text-muted/30 text-text transition-all text-xs font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-text-muted" />
                      <span>Broadcasting: LED Lights OFF</span>
                    </div>
                    {quickActionLoading === "lights_off" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Trigger</span>}
                  </button>

                  <button
                    disabled={quickActionLoading !== null}
                    onClick={() => handleQuickAction("restart_all", "restart", "true")}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-danger/10 bg-danger/5 hover:bg-danger/10 text-danger transition-all text-xs font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-danger" />
                      <span>Reboot Online Gateways</span>
                    </div>
                    {quickActionLoading === "restart_all" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Trigger</span>}
                  </button>
                </div>
              </div>

              {/* Active Alerts Feed */}
              <div className="bg-white border border-border rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-text flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" /> Active Alerts Feed
                  </h2>
                  <Link href="/alerts" className="text-xs font-semibold text-primary hover:underline">
                    View Logs
                  </Link>
                </div>

                {alerts.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-border rounded-xl">
                    <p className="text-xs text-text-muted font-medium">No unresolved warning states.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-xl border text-xs flex flex-col gap-1.5 ${
                          alert.severity === "critical"
                            ? "bg-danger/5 border-danger/20 text-danger"
                            : alert.severity === "warning"
                            ? "bg-warning/5 border-warning/20 text-warning"
                            : "bg-blue-50 border-blue-100 text-blue-800"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold uppercase tracking-wider text-[9px]">
                            {alert.severity}
                          </span>
                          <span className="text-[10px] text-text-muted/80">
                            {new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <p className="font-medium">{alert.message}</p>
                        <span className="text-[10px] text-text-muted font-mono">{alert.deviceName} ({alert.deviceId})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
