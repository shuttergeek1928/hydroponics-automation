// src/app/sensors/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  FlaskConical,
  Gauge,
  Thermometer,
  Droplet,
  Waves,
  Wind,
  AlertTriangle,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { api, Device } from "@/lib/api";
import PageTransition from "@/components/PageTransition";

export default function SensorsPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    try {
      const devList = await api.getDevices();
      setDevices(devList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  const onlineDevices = devices.filter(d => d.isOnline);

  // Helper to determine status based on target range
  const getStatus = (type: string, val: number) => {
    const s = api.getSettings();
    switch (type) {
      case "temp":
        if (val < s.tempMin || val > s.tempMax) return "warning";
        return "optimal";
      case "ph":
        if (val < s.phMin || val > s.phMax) return "warning";
        return "optimal";
      case "tds":
        if (val < s.tdsMin || val > s.tdsMax) return "warning";
        return "optimal";
      case "waterLevel":
        if (val < s.waterLevelMin) return "danger";
        return "optimal";
      case "humidity":
        if (val < s.humidityMin || val > s.humidityMax) return "warning";
        return "optimal";
      case "do":
        if (val < 5.0) return "warning";
        return "optimal";
      default:
        return "optimal";
    }
  };

  // Helper to format values
  const formatVal = (type: string, val: number) => {
    if (type === "ph" || type === "do" || type === "temp") return val.toFixed(1);
    return Math.round(val);
  };

  const getMetricDetails = () => {
    const s = api.getSettings();
    return [
      {
        id: "ph",
        name: "pH Balance",
        icon: FlaskConical,
        unit: "",
        min: s.phMin,
        max: s.phMax,
        chartMin: 4.0,
        chartMax: 8.0,
        color: "bg-emerald-500",
        bgLight: "bg-emerald-50/50",
        borderTheme: "border-emerald-100",
        description: "Controls nutrient solubility and uptake efficiency."
      },
      {
        id: "tds",
        name: "Total Dissolved Solids",
        icon: Gauge,
        unit: " ppm",
        min: s.tdsMin,
        max: s.tdsMax,
        chartMin: 0,
        chartMax: 2000,
        color: "bg-indigo-500",
        bgLight: "bg-indigo-50/50",
        borderTheme: "border-indigo-100",
        description: "Measures concentration of dissolved mineral salts."
      },
      {
        id: "temp",
        name: "Reservoir Temperature",
        icon: Thermometer,
        unit: "°C",
        min: s.tempMin,
        max: s.tempMax,
        chartMin: 10,
        chartMax: 35,
        color: "bg-orange-500",
        bgLight: "bg-orange-50/50",
        borderTheme: "border-orange-100",
        description: "Regulates root respiration rates and oxygen solubility."
      },
      {
        id: "waterLevel",
        name: "Reservoir Level",
        icon: Droplet,
        unit: "%",
        min: s.waterLevelMin,
        max: 100,
        chartMin: 0,
        chartMax: 100,
        color: "bg-blue-500",
        bgLight: "bg-blue-50/50",
        borderTheme: "border-blue-100",
        description: "Monitors overall water supply volume."
      },
      {
        id: "do",
        name: "Dissolved Oxygen",
        icon: Waves,
        unit: " mg/L",
        min: 5.0,
        max: 8.0,
        chartMin: 0,
        chartMax: 10,
        color: "bg-cyan-500",
        bgLight: "bg-cyan-50/50",
        borderTheme: "border-cyan-100",
        description: "Critical for aerobic root health and preventing pathogens."
      },
      {
        id: "humidity",
        name: "Ambient Humidity",
        icon: Wind,
        unit: "%",
        min: s.humidityMin,
        max: s.humidityMax,
        chartMin: 20,
        chartMax: 100,
        color: "bg-teal-500",
        bgLight: "bg-teal-50/50",
        borderTheme: "border-teal-100",
        description: "Affects plant transpiration and leaf temperature."
      }
    ];
  };

  const metrics = getMetricDetails();

  return (
    <PageTransition>
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text">Agricultural Sensors</h1>
          <p className="text-text-muted mt-1">Cross-system comparisons of critical cultivation parameters.</p>
        </div>
        <button
          onClick={fetchDevices}
          className="btn-secondary text-xs h-10 px-4 flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Sync Telemetry
        </button>
      </div>

      {onlineDevices.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-border">
          <Activity className="w-12 h-12 text-text-muted mx-auto mb-4 animate-pulse" />
          <p className="text-lg font-bold text-text">No active controllers online</p>
          <p className="text-xs text-text-muted mt-1">Make sure your ESP32 boards are online to fetch sensor statistics.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {metrics.map((metric) => {
            // Find values across online systems
            const dataPoints = onlineDevices.map(d => {
              const latest = d.sensorReadings?.[0];
              let val = 0;
              if (latest) {
                if (metric.id === "temp") val = latest.temperature;
                else if (metric.id === "ph") val = latest.ph;
                else if (metric.id === "tds") val = latest.tds;
                else if (metric.id === "waterLevel") val = latest.waterLevel;
                else if (metric.id === "do") val = latest.dissolvedOxygen;
                else if (metric.id === "humidity") val = latest.humidity;
              }
              return {
                deviceName: d.name,
                system: d.system,
                deviceId: d.deviceId,
                value: val,
                status: getStatus(metric.id, val)
              };
            });

            // Calculate averages and drift warnings
            const averageVal = dataPoints.reduce((acc, curr) => acc + curr.value, 0) / dataPoints.length;
            const hasWarnings = dataPoints.some(dp => dp.status !== "optimal");
            const IconComponent = metric.icon;

            return (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-border rounded-3xl p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Title & Target Banner */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl ${metric.bgLight} border ${metric.borderTheme} text-text`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-text leading-tight">{metric.name}</h3>
                        <span className="text-[10px] text-text-muted font-medium mt-0.5 block">{metric.description}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="block text-[9px] font-bold text-text-muted uppercase tracking-wider">Ideal Range</span>
                      <span className="inline-block bg-surface px-2.5 py-1 rounded-xl text-xs font-bold text-primary border border-border mt-1">
                        {metric.min} - {metric.max}
                        {metric.unit}
                      </span>
                    </div>
                  </div>

                  {/* Summary Metric and average bar */}
                  <div className="bg-surface border border-border/60 p-4 rounded-2xl mb-6">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Average Level</span>
                      <span className="text-2xl font-extrabold text-text">
                        {formatVal(metric.id, averageVal)}
                        {metric.unit}
                      </span>
                    </div>
                    {/* Visual Meter Bar */}
                    <div className="w-full bg-border h-2.5 rounded-full overflow-hidden relative">
                      {/* Highlight ideal region */}
                      <div
                        className="absolute top-0 bottom-0 bg-primary/20 border-x border-primary/10"
                        style={{
                          left: `${((metric.min - metric.chartMin) / (metric.chartMax - metric.chartMin)) * 100}%`,
                          width: `${((metric.max - metric.min) / (metric.chartMax - metric.chartMin)) * 100}%`
                        }}
                      />
                      {/* Mark current average */}
                      <div
                        className={`absolute top-0 bottom-0 rounded-full transition-all ${metric.color}`}
                        style={{
                          width: `${Math.max(0, Math.min(100, ((averageVal - metric.chartMin) / (metric.chartMax - metric.chartMin)) * 100))}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-text-muted mt-1.5 uppercase">
                      <span>Min: {metric.chartMin}</span>
                      <span>Max: {metric.chartMax}</span>
                    </div>
                  </div>

                  {/* Device List Comparison */}
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">System Contrast Breakdown</h4>
                  <div className="space-y-2.5">
                    {dataPoints.map((dp) => (
                      <div
                        key={dp.deviceId}
                        className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border/50 hover:bg-white hover:border-border transition-colors text-xs"
                      >
                        <div>
                          <span className="font-bold text-text leading-none block">{dp.deviceName}</span>
                          <span className="text-[10px] text-text-muted uppercase font-semibold mt-0.5 block">{dp.system}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-text font-mono text-sm">
                            {formatVal(metric.id, dp.value)}
                            {metric.unit}
                          </span>
                          <span className={`flex items-center justify-center p-1 rounded-full ${
                            dp.status === "optimal"
                              ? "bg-primary/10 text-primary"
                              : dp.status === "warning"
                              ? "bg-warning/10 text-warning"
                              : "bg-danger/10 text-danger"
                          }`}>
                            {dp.status === "optimal" ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <AlertTriangle className="w-4 h-4" />
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status summary banner */}
                <div className="mt-6 border-t border-border/50 pt-4 flex items-center justify-between text-xs font-semibold">
                  <span className="text-text-muted">Status:</span>
                  {hasWarnings ? (
                    <span className="text-warning flex items-center gap-1.5 bg-warning/5 px-2.5 py-1 rounded-xl border border-warning/10">
                      <AlertTriangle className="w-3.5 h-3.5" /> Drift Warnings Active
                    </span>
                  ) : (
                    <span className="text-primary flex items-center gap-1.5 bg-primary-light px-2.5 py-1 rounded-xl border border-primary/20">
                      <CheckCircle2 className="w-3.5 h-3.5" /> All Reservoirs Optimal
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageTransition>
  );
}
