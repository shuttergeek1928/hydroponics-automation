// src/app/growth/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sprout,
  Plus,
  Calendar,
  Ruler,
  HeartPulse,
  Trash2,
  Check,
  FileText
} from "lucide-react";
import { api, GrowthObservation } from "@/lib/api";
import PageTransition from "@/components/PageTransition";

export default function PlantGrowthTrackerPage() {
  const [observations, setObservations] = useState<GrowthObservation[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [plantName, setPlantName] = useState("");
  const [stage, setStage] = useState<GrowthObservation["stage"]>("Vegetative");
  const [heightCm, setHeightCm] = useState("");
  const [health, setHealth] = useState<GrowthObservation["health"]>("Good");
  const [notes, setNotes] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadObservations = async () => {
    try {
      const data = await api.getGrowthObservations();
      setObservations(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadObservations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantName.trim() || !notes.trim() || submitting) return;

    setSubmitting(true);
    try {
      await api.addGrowthObservation({
        date,
        plantName: plantName.trim(),
        stage,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
        health,
        notes: notes.trim(),
      });

      setPlantName("");
      setHeightCm("");
      setNotes("");
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
      await loadObservations();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await api.deleteGrowthObservation(id);
    await loadObservations();
  };

  const getHealthBadge = (status: GrowthObservation["health"]) => {
    switch (status) {
      case "Excellent":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Good":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Fair":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Poor":
        return "bg-red-50 text-red-700 border-red-200";
    }
  };

  const getStageBadge = (stg: GrowthObservation["stage"]) => {
    switch (stg) {
      case "Seedling":
        return "bg-lime-50 text-lime-700 border-lime-200";
      case "Vegetative":
        return "bg-green-50 text-green-700 border-green-200";
      case "Flowering":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Fruiting":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Harvest":
        return "bg-teal-50 text-teal-700 border-teal-200";
    }
  };

  return (
    <PageTransition>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text flex items-center gap-3">
            <Sprout className="w-8 h-8 text-primary" />
            Plant Growth Tracker
          </h1>
          <p className="text-text-muted mt-1">
            Record and review daily plant observations, height measurements, and crop health notes.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {savedNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 bg-primary-light text-primary-dark border border-primary/20 rounded-2xl text-xs font-semibold flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> Daily observation logged successfully!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Simple Entry Form */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-border rounded-3xl p-6 shadow-xs sticky top-6">
            <h2 className="text-base font-bold text-text mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              New Daily Observation
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-surface border border-border px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                  Plant / System Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Butterhead Lettuce (NFT-A)"
                  value={plantName}
                  onChange={(e) => setPlantName(e.target.value)}
                  className="w-full bg-surface border border-border px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                    Growth Stage
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as GrowthObservation["stage"])}
                    className="w-full bg-surface border border-border px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:border-primary font-semibold"
                  >
                    <option value="Seedling">Seedling</option>
                    <option value="Vegetative">Vegetative</option>
                    <option value="Flowering">Flowering</option>
                    <option value="Fruiting">Fruiting</option>
                    <option value="Harvest">Harvest</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                    Health Status
                  </label>
                  <select
                    value={health}
                    onChange={(e) => setHealth(e.target.value as GrowthObservation["health"])}
                    className="w-full bg-surface border border-border px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:border-primary font-semibold"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                  Height (cm) <span className="text-[10px] font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 14.5"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full bg-surface border border-border px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                  Observation Notes
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write your daily observations (leaf color, root condition, nutrient changes, etc.)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-surface border border-border px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full btn-primary h-11 text-xs font-bold flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Save Observation
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Daily Observations Log */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Observation Log ({observations.length})
            </h2>
          </div>

          {observations.length === 0 ? (
            <div className="bg-white border border-dashed border-border rounded-3xl p-12 text-center">
              <Sprout className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-50" />
              <h3 className="text-sm font-bold text-text">No observations recorded yet</h3>
              <p className="text-xs text-text-muted mt-1">
                Use the form on the left to add your first daily plant growth entry.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {observations.map((obs) => (
                <motion.div
                  key={obs.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-base font-bold text-text">{obs.plantName}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-text-muted mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{obs.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${getStageBadge(
                          obs.stage
                        )}`}
                      >
                        {obs.stage}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${getHealthBadge(
                          obs.health
                        )}`}
                      >
                        <HeartPulse className="w-3 h-3" />
                        {obs.health}
                      </span>
                      {obs.heightCm !== undefined && (
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-surface text-text border border-border flex items-center gap-1">
                          <Ruler className="w-3 h-3 text-text-muted" />
                          {obs.heightCm} cm
                        </span>
                      )}
                      <button
                        onClick={() => handleDelete(obs.id)}
                        title="Delete observation"
                        className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors ml-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-text leading-relaxed bg-surface/70 border border-border/50 rounded-xl p-3.5 whitespace-pre-wrap">
                    {obs.notes}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

