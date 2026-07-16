// src/app/devices/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Cpu,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  Wifi,
  WifiOff,
  PlusCircle,
  HelpCircle,
  Clock,
  Settings,
  Flame,
  Activity
} from "lucide-react";
import { api, Device } from "@/lib/api";
import PageTransition from "@/components/PageTransition";

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");
  const [systemFilter, setSystemFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showHelper, setShowHelper] = useState(false);

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

  // Compute counters
  const totalCount = devices.length;
  const onlineCount = devices.filter(d => d.isOnline).length;
  const offlineCount = totalCount - onlineCount;

  // Get unique system names for filtering
  const systems = Array.from(new Set(devices.map(d => d.system)));

  // Filter devices list
  const filteredDevices = devices.filter(device => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "online" && device.isOnline) ||
      (statusFilter === "offline" && !device.isOnline);

    const matchesSystem = systemFilter === "all" || device.system === systemFilter;

    const matchesSearch =
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.system.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSystem && matchesSearch;
  });

  return (
    <PageTransition>
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text">Controllers & Devices</h1>
          <p className="text-text-muted mt-1">Manage connected microcontrollers and monitor their active telemetry status.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHelper(!showHelper)}
            className="btn-secondary text-xs h-10 px-4 flex items-center gap-2"
          >
            <HelpCircle className="w-4 h-4 text-primary" />
            Auto-Register Guide
          </button>
          <button
            onClick={fetchDevices}
            className="btn-primary text-xs h-10 px-4 flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Sync Devices
          </button>
        </div>
      </div>

      {/* Auto Registration Help Card */}
      {showHelper && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="mb-8 p-6 bg-primary-light/50 border border-primary/20 rounded-2xl text-primary-dark text-sm relative"
        >
          <button
            onClick={() => setShowHelper(false)}
            className="absolute top-4 right-4 text-text-muted hover:text-text"
          >
            ✕
          </button>
          <h3 className="font-bold text-base mb-2 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" /> How to connect a new ESP32 controller?
          </h3>
          <p className="mb-3 opacity-90 leading-relaxed">
            HydroFlow features **auto-provisioning**. To spin up and link a new controller node, you do not need to register it manually on the dashboard. Simply program your ESP32 with your system parameters:
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 opacity-90 font-medium">
            <li>Configure your firmware variables (`deviceID`, `ssid`, `password`).</li>
            <li>Set the `serverURL` matching your local backend URL (e.g., `http://192.168.1.26:5119/api`).</li>
            <li>Power on the ESP32. The first `/sensor-data` POST request auto-registers the device row instantly.</li>
          </ol>
        </motion.div>
      )}

      {/* Counters Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-border p-4 rounded-2xl shadow-xs">
          <span className="block text-[11px] font-bold text-text-muted uppercase tracking-wider">Total Configured</span>
          <span className="text-3xl font-extrabold text-text mt-1 block">{totalCount}</span>
        </div>
        <div className="bg-white border border-border p-4 rounded-2xl shadow-xs">
          <span className="block text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Online Nodes
          </span>
          <span className="text-3xl font-extrabold text-primary-dark mt-1 block">{onlineCount}</span>
        </div>
        <div className="bg-white border border-border p-4 rounded-2xl shadow-xs">
          <span className="block text-[11px] font-bold text-danger uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-danger" /> Offline Nodes
          </span>
          <span className="text-3xl font-extrabold text-danger mt-1 block">{offlineCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-border rounded-2xl p-4 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by ID, name or cultivation group..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-xl text-sm focus:outline-none focus:border-primary bg-surface/50 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-surface p-1 rounded-xl border border-border">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === "all" ? "bg-white text-text shadow-xs" : "text-text-muted hover:text-text"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("online")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === "online" ? "bg-white text-primary-dark shadow-xs" : "text-text-muted hover:text-text"
              }`}
            >
              Online
            </button>
            <button
              onClick={() => setStatusFilter("offline")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === "offline" ? "bg-white text-danger shadow-xs" : "text-text-muted hover:text-text"
              }`}
            >
              Offline
            </button>
          </div>

          {/* System Select Filter */}
          <div className="relative">
            <select
              value={systemFilter}
              onChange={(e) => setSystemFilter(e.target.value)}
              className="appearance-none bg-surface border border-border px-4 pr-8 py-2 rounded-xl text-xs font-semibold text-text focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">All Systems</option>
              {systems.map(sys => (
                <option key={sys} value={sys}>{sys}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Devices Grid List */}
      {loading && devices.length === 0 ? (
        <div className="flex justify-center py-20 text-primary font-medium animate-pulse">
          Syncing device list...
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-border">
          <Cpu className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-lg font-bold text-text">No controllers match filters</p>
          <p className="text-sm text-text-muted mt-1">Try resetting search string or active status settings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevices.map((device) => {
            const latest = device.sensorReadings?.[0];
            return (
              <motion.div
                key={device.deviceId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }}
                className="bg-white border border-border rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group"
              >
                {/* Visual Accent */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${device.isOnline ? "bg-primary" : "bg-danger"}`} />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-text-muted font-mono bg-surface px-2.5 py-1 rounded-lg border border-border">
                      {device.deviceId}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {device.isOnline ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          <span className="text-xs font-semibold text-primary">Online</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-danger" />
                          <span className="text-xs font-semibold text-danger">Offline</span>
                        </>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-text mb-1 group-hover:text-primary transition-colors flex items-center gap-1">
                    {device.name}
                  </h3>
                  <p className="text-xs text-text-muted font-semibold mb-6 uppercase tracking-wider">{device.system}</p>

                  {/* Quick telemetry overview */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-surface/50 border border-border/60 p-3 rounded-2xl">
                      <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">Water Temp</span>
                      <span className="text-base font-extrabold text-text mt-1 block">
                        {latest ? `${latest.temperature.toFixed(1)}°C` : "--"}
                      </span>
                    </div>
                    <div className="bg-surface/50 border border-border/60 p-3 rounded-2xl">
                      <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">pH Balance</span>
                      <span className="text-base font-extrabold text-text mt-1 block">
                        {latest ? latest.ph.toFixed(2) : "--"}
                      </span>
                    </div>
                  </div>

                  {/* Active Hardware States */}
                  <div className="flex items-center gap-4 text-xs font-medium text-text-muted border-t border-border/50 pt-4 mb-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${latest?.pumpState === "on" ? "bg-primary animate-pulse" : "bg-border"}`} />
                      <span>Pump: <strong className="text-text uppercase">{latest?.pumpState || "off"}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${latest?.ledState === "on" ? "bg-orange-500 animate-pulse" : "bg-border"}`} />
                      <span>Lights: <strong className="text-text uppercase">{latest?.ledState || "off"}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-auto">
                  <Link
                    href={`/devices/${device.deviceId}`}
                    className="flex-1 text-center py-2.5 rounded-xl text-xs font-bold text-primary bg-primary-light hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1.5"
                  >
                    Manage Controller
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageTransition>
  );
}
