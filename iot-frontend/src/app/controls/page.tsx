// src/app/controls/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sliders,
  Cpu,
  RefreshCw,
  Droplet,
  Lightbulb,
  Clock,
  Play,
  RotateCcw,
  Zap,
  Trash2,
  CheckCircle,
  HelpCircle,
  AlertTriangle
} from "lucide-react";
import { api, Device, DeviceCommand } from "@/lib/api";
import PageTransition from "@/components/PageTransition";

export default function ControlsPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [pumpDuration, setPumpDuration] = useState<string>("10");
  const [customPollInterval, setCustomPollInterval] = useState<string>("30");
  const [queue, setQueue] = useState<DeviceCommand[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const devList = await api.getDevices();
      setDevices(devList);
      
      // Auto select first device if none selected
      if (devList.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(devList[0].deviceId);
      }

      // Sync active commands queue
      const activeQueue = api.getActiveCommandsQueue();
      setQueue(activeQueue);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [selectedDeviceId]);

  const sendCommand = async (type: DeviceCommand["commandType"], value: string, actionLabel: string) => {
    if (!selectedDeviceId) return;
    setIsSubmitting(actionLabel);
    try {
      await api.queueCommand(selectedDeviceId, type, value);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to queue command.");
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleClearQueue = () => {
    api.clearActiveCommandsQueue();
    setQueue([]);
  };

  const selectedDevice = devices.find(d => d.deviceId === selectedDeviceId);
  const latestReading = selectedDevice?.sensorReadings?.[0];

  return (
    <PageTransition>
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text">Manual Overrides</h1>
          <p className="text-text-muted mt-1">Directly control GPIO relays and broadcast debug signals to the hardware layer.</p>
        </div>
        <button
          onClick={fetchData}
          className="btn-secondary text-xs h-10 px-4 flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Sync State
        </button>
      </div>

      {loading && devices.length === 0 ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-border">
          <Sliders className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-lg font-bold text-text">No active controllers detected</p>
          <p className="text-xs text-text-muted mt-1">Start your ESP32 rigs to show override triggers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Control Panel (Left/Center) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Device Selector */}
            <div className="bg-white border border-border rounded-3xl p-6 shadow-xs">
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
                Target Cultivation Controller
              </label>
              <div className="relative">
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="w-full bg-surface border border-border px-4 py-3.5 rounded-2xl text-sm font-bold text-text focus:outline-none focus:border-primary cursor-pointer appearance-none"
                >
                  {devices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.name} ({d.deviceId}) — {d.isOnline ? "ONLINE" : "OFFLINE"}
                    </option>
                  ))}
                </select>
                <Cpu className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>

              {selectedDevice && !selectedDevice.isOnline && (
                <div className="mt-4 p-3 bg-danger/5 border border-danger/10 text-danger rounded-xl flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Warning: This device is currently **offline**. Commands will queue but won't deliver until reconnect.</span>
                </div>
              )}
            </div>

            {/* Manual Toggles */}
            <div className="bg-white border border-border rounded-3xl p-6 shadow-xs space-y-6">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> Core Relay Controls
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Pump relay toggle */}
                <div className="bg-surface/50 border border-border/80 rounded-2xl p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${latestReading?.pumpState === "on" ? "bg-primary-light text-primary" : "bg-border text-text-muted"}`}>
                        <Droplet className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-text text-sm">Water Pump Relay</h4>
                        <span className="text-[10px] text-text-muted block mt-0.5">GPIO pin 26</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      latestReading?.pumpState === "on" ? "bg-primary text-white" : "bg-border text-text-muted"
                    }`}>
                      {latestReading?.pumpState || "off"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      disabled={isSubmitting !== null}
                      onClick={() => sendCommand("pump", "on", "pump_on")}
                      className={`py-3 rounded-xl text-xs font-bold transition-all ${
                        latestReading?.pumpState === "on"
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "bg-white border border-border hover:border-primary text-text-muted hover:text-text"
                      }`}
                    >
                      {isSubmitting === "pump_on" ? "Queuing..." : "ON"}
                    </button>
                    <button
                      disabled={isSubmitting !== null}
                      onClick={() => sendCommand("pump", "off", "pump_off")}
                      className={`py-3 rounded-xl text-xs font-bold transition-all ${
                        latestReading?.pumpState !== "on"
                          ? "bg-text text-white"
                          : "bg-white border border-border hover:border-danger hover:text-danger text-text-muted"
                      }`}
                    >
                      {isSubmitting === "pump_off" ? "Queuing..." : "OFF"}
                    </button>
                  </div>
                </div>

                {/* LED light relay toggle */}
                <div className="bg-surface/50 border border-border/80 rounded-2xl p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${latestReading?.ledState === "on" ? "bg-orange-50 text-orange-600" : "bg-border text-text-muted"}`}>
                        <Lightbulb className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-text text-sm">Grow LED Relay</h4>
                        <span className="text-[10px] text-text-muted block mt-0.5">GPIO pin 2</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      latestReading?.ledState === "on" ? "bg-orange-500 text-white" : "bg-border text-text-muted"
                    }`}>
                      {latestReading?.ledState || "off"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      disabled={isSubmitting !== null}
                      onClick={() => sendCommand("led", "on", "led_on")}
                      className={`py-3 rounded-xl text-xs font-bold transition-all ${
                        latestReading?.ledState === "on"
                          ? "bg-orange-500 text-white shadow-lg shadow-orange-100"
                          : "bg-white border border-border hover:border-orange-500 text-text-muted hover:text-text"
                      }`}
                    >
                      {isSubmitting === "led_on" ? "Queuing..." : "ON"}
                    </button>
                    <button
                      disabled={isSubmitting !== null}
                      onClick={() => sendCommand("led", "off", "led_off")}
                      className={`py-3 rounded-xl text-xs font-bold transition-all ${
                        latestReading?.ledState !== "on"
                          ? "bg-text text-white"
                          : "bg-white border border-border hover:border-danger hover:text-danger text-text-muted"
                      }`}
                    >
                      {isSubmitting === "led_off" ? "Queuing..." : "OFF"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Dosed Watering (Duration Pumps) */}
            <div className="bg-white border border-border rounded-3xl p-6 shadow-xs">
              <h3 className="text-base font-bold text-text mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Dosed Timer-Based Watering
              </h3>
              <p className="text-xs text-text-muted mb-4">
                Command the water pump to start and run for a precise duration. The ESP32 will shut down the pump automatically once the duration ends.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 bg-surface p-4 rounded-2xl border border-border/60">
                <div className="w-full sm:w-auto flex-1">
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Duration (Seconds)</label>
                  <div className="flex gap-2">
                    {["5", "10", "30", "60", "120"].map(d => (
                      <button
                        key={d}
                        onClick={() => setPumpDuration(d)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                          pumpDuration === d
                            ? "bg-primary border-primary text-white"
                            : "bg-white border-border hover:border-primary text-text-muted hover:text-text"
                        }`}
                      >
                        {d}s
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  disabled={isSubmitting !== null}
                  onClick={() => sendCommand("pump_duration", pumpDuration, "duration_trigger")}
                  className="btn-primary w-full sm:w-auto h-12 px-6 flex items-center justify-center gap-2 text-xs"
                >
                  <Play className="w-4 h-4 fill-white" />
                  {isSubmitting === "duration_trigger" ? "Queuing Command..." : `Run Pump for ${pumpDuration}s`}
                </button>
              </div>
            </div>

            {/* Diagnostics and Utility commands */}
            <div className="bg-white border border-border rounded-3xl p-6 shadow-xs">
              <h3 className="text-base font-bold text-text mb-4 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-danger" /> System Relaunch & Diagnosis
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface p-4 rounded-2xl border border-border/50 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-text uppercase">Microcontroller Restart</h4>
                    <p className="text-[10px] text-text-muted mt-1 mb-4 leading-relaxed">
                      Queues a hard restart trigger on the ESP32 chip using the ESP.restart() core method.
                    </p>
                  </div>
                  <button
                    disabled={isSubmitting !== null}
                    onClick={() => sendCommand("restart", "true", "reboot_esp")}
                    className="py-2.5 rounded-xl border border-danger/20 text-danger bg-danger/5 hover:bg-danger/10 text-xs font-semibold text-center transition-all mt-auto"
                  >
                    {isSubmitting === "reboot_esp" ? "Queuing..." : "Send System Reboot"}
                  </button>
                </div>

                <div className="bg-surface p-4 rounded-2xl border border-border/50 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-text uppercase">Custom Sensor Polling Interval</h4>
                    <p className="text-[10px] text-text-muted mt-1 mb-2 leading-relaxed">
                      Adjust the frequency (in seconds) that the ESP32 sends telemetry back to `/sensor-data`.
                    </p>
                    <input
                      type="number"
                      value={customPollInterval}
                      onChange={(e) => setCustomPollInterval(e.target.value)}
                      placeholder="Interval in seconds..."
                      className="w-full bg-white border border-border px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-primary mb-4"
                    />
                  </div>
                  <button
                    disabled={isSubmitting !== null}
                    onClick={() => sendCommand("sensor_interval", customPollInterval, "interval_esp")}
                    className="py-2.5 rounded-xl border border-primary/20 text-primary-dark bg-primary-light hover:bg-primary hover:text-white text-xs font-semibold text-center transition-all"
                  >
                    {isSubmitting === "interval_esp" ? "Queuing..." : `Set Interval to ${customPollInterval}s`}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Execution Queue Monitor */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-border rounded-3xl p-5 shadow-xs h-full flex flex-col justify-between min-h-[400px]">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
                  <h2 className="text-base font-bold text-text flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-primary" /> Active Queue Monitor
                  </h2>
                  {queue.length > 0 && (
                    <button
                      onClick={handleClearQueue}
                      className="text-[10px] font-bold text-danger hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear Logs
                    </button>
                  )}
                </div>

                <p className="text-xs text-text-muted mb-4">
                  Visualizes commands queued in mock simulation or sent to the backend. In mock mode, commands execute and complete automatically.
                </p>

                {queue.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-primary/30 mb-2" />
                    <p className="text-xs text-text-muted font-bold">Execution queue empty</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Toggle controls to queue overrides.</p>
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
                    {queue.slice(0, 8).map((cmd) => (
                      <div
                        key={cmd.id}
                        className={`p-3 rounded-xl border text-xs flex flex-col gap-1.5 ${
                          cmd.status === "Executed"
                            ? "bg-primary-light/50 border-primary/10 text-primary-dark"
                            : cmd.status === "Pending"
                            ? "bg-warning/5 border-warning/10 text-warning"
                            : "bg-blue-50/50 border-blue-100 text-blue-800"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold uppercase tracking-wider text-[9px] font-mono">
                            {cmd.commandType}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                            cmd.status === "Executed" ? "bg-primary/10 text-primary" : "bg-warning/20 text-warning"
                          }`}>
                            {cmd.status}
                          </span>
                        </div>
                        <p className="font-semibold">
                          Signal: <code className="bg-white/60 px-1 rounded font-mono border border-border/30">{cmd.commandValue}</code>
                        </p>
                        <div className="flex justify-between text-[9px] text-text-muted/80">
                          <span>Target: {cmd.deviceId}</span>
                          <span>{new Date(cmd.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {queue.length > 0 && (
                <div className="border-t border-border/50 pt-4 mt-6 text-[10px] text-text-muted text-center font-semibold leading-relaxed">
                  ESP32 hardware polls for queued JSON commands every 5 seconds.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
