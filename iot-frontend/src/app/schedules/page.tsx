// src/app/schedules/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Plus,
  Droplet,
  Sun,
  FlaskConical,
  RefreshCw,
  Info,
  Calendar,
  X,
  PlusCircle,
  HelpCircle,
  Check
} from "lucide-react";
import { api, AutomationSchedule, Device } from "@/lib/api";
import PageTransition from "@/components/PageTransition";

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<AutomationSchedule[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // New Schedule Form States
  const [name, setName] = useState("");
  const [type, setType] = useState<"watering" | "lighting" | "nutrient">("watering");
  const [timeStart, setTimeStart] = useState("08:00");
  const [timeEnd, setTimeEnd] = useState("");
  const [duration, setDuration] = useState("15");
  const [targetDevice, setTargetDevice] = useState("");
  const [description, setDescription] = useState("");

  const fetchData = async () => {
    try {
      const schList = api.getSchedules();
      setSchedules(schList);
      
      const devList = await api.getDevices();
      setDevices(devList);
      if (devList.length > 0 && !targetDevice) {
        setTargetDevice(devList[0].deviceId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = (id: string, currentStatus: boolean) => {
    api.toggleSchedule(id, !currentStatus);
    fetchData();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    api.addSchedule({
      name,
      type,
      timeStart,
      timeEnd: type === "lighting" ? timeEnd : undefined,
      duration: type !== "lighting" ? parseInt(duration) : undefined,
      active: true,
      targetDevice,
      description
    });

    setIsModalOpen(false);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);

    // Reset Form
    setName("");
    setDescription("");
    fetchData();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "watering": return Droplet;
      case "lighting": return Sun;
      case "nutrient": return FlaskConical;
      default: return Clock;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "watering": return "bg-blue-50 text-blue-600 border-blue-100";
      case "lighting": return "bg-orange-50 text-orange-600 border-orange-100";
      case "nutrient": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      default: return "bg-surface text-text-muted border-border";
    }
  };

  return (
    <PageTransition>
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text">Automation Rules</h1>
          <p className="text-text-muted mt-1">Configure time-based schedules for lighting, feeding, and irrigation loops.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary text-xs h-10 px-4 flex items-center gap-2 self-start md:self-auto shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Custom Rule
        </button>
      </div>

      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-6 p-4 bg-primary-light text-primary-dark border border-primary/20 rounded-2xl text-xs font-semibold flex items-center gap-2"
        >
          <Check className="w-4 h-4" /> Custom automation rule created and activated successfully!
        </motion.div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((schedule) => {
            const Icon = getIcon(schedule.type);
            const targetDevName = devices.find(d => d.deviceId === schedule.targetDevice)?.name || schedule.targetDevice;

            return (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white border border-border rounded-3xl p-6 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all ${
                  !schedule.active ? "opacity-75 bg-surface/20" : ""
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase tracking-wider border ${getTypeColor(schedule.type)}`}>
                      {schedule.type}
                    </span>

                    {/* Premium Toggle Switch */}
                    <button
                      onClick={() => handleToggle(schedule.id, schedule.active)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        schedule.active ? "bg-primary" : "bg-border"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          schedule.active ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-text mb-1 leading-tight">{schedule.name}</h3>
                  <p className="text-xs text-text-muted mb-4">{schedule.description}</p>

                  <div className="bg-surface border border-border/50 rounded-2xl p-4 space-y-2 mb-6">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted font-semibold">Start Time</span>
                      <span className="font-bold text-text">{schedule.timeStart}</span>
                    </div>

                    {schedule.type === "lighting" ? (
                      <div className="flex justify-between text-xs">
                        <span className="text-text-muted font-semibold">End Time</span>
                        <span className="font-bold text-text">{schedule.timeEnd || "--:--"}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-xs">
                        <span className="text-text-muted font-semibold">Duration</span>
                        <span className="font-bold text-text">{schedule.duration} minutes</span>
                      </div>
                    )}

                    <div className="flex justify-between text-xs border-t border-border/40 pt-2">
                      <span className="text-text-muted font-semibold">Target Node</span>
                      <span className="font-bold text-text truncate max-w-[140px]">{targetDevName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-text-muted font-semibold border-t border-border/40 pt-4 mt-auto">
                  <Calendar className="w-3.5 h-3.5 text-text-muted" />
                  <span>Runs daily automatically</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Custom Schedule Dialog Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 z-40 bg-black"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white border border-border rounded-3xl p-6 z-50 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-text flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" /> Create Custom Schedule Rule
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg border border-border hover:bg-surface text-text-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Rule Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mid-Day Nutrient Flush"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface border border-border px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Schedule Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full bg-surface border border-border px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:border-primary font-semibold"
                    >
                      <option value="watering">Watering Timer</option>
                      <option value="lighting">Lighting Cycle</option>
                      <option value="nutrient">Nutrient Check</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Target Controller</label>
                    <select
                      value={targetDevice}
                      onChange={(e) => setTargetDevice(e.target.value)}
                      className="w-full bg-surface border border-border px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:border-primary font-semibold"
                    >
                      {devices.map(d => (
                        <option key={d.deviceId} value={d.deviceId}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Start Time</label>
                    <input
                      type="time"
                      required
                      value={timeStart}
                      onChange={(e) => setTimeStart(e.target.value)}
                      className="w-full bg-surface border border-border px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-primary font-mono"
                    />
                  </div>

                  {type === "lighting" ? (
                    <div>
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">End Time</label>
                      <input
                        type="time"
                        required
                        value={timeEnd}
                        onChange={(e) => setTimeEnd(e.target.value)}
                        className="w-full bg-surface border border-border px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-primary font-mono"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Duration (Minutes)</label>
                      <input
                        type="number"
                        required
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full bg-surface border border-border px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-primary font-mono"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Rule Description</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide a detailed explanation of the schedule cycle..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-surface border border-border px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full btn-primary h-12 text-xs font-bold flex items-center justify-center gap-2 mt-4"
                >
                  Create and Activate Rule
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
