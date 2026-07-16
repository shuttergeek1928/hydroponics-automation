"use client";

import React from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { Lightbulb, Droplet, Clock, Cpu } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

export interface DeviceSensor {
  name: string;
  value: number;
  unit: string;
  status: "optimal" | "warning" | "critical";
}

interface DeviceCardProps {
  id: string;
  name: string;
  status: "online" | "offline";
  durationText: string;
  sensors: DeviceSensor[];
  pumpState: boolean;
  ledState: boolean;
  onPumpToggle?: (id: string, newState: boolean) => void;
  onLedToggle?: (id: string, newState: boolean) => void;
  onClick?: () => void;
  className?: string;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  id,
  name,
  status,
  durationText,
  sensors,
  pumpState,
  ledState,
  onPumpToggle,
  onLedToggle,
  onClick,
  className,
}) => {
  const isOnline = status === "online";

  const handlePumpClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOnline && onPumpToggle) {
      onPumpToggle(id, !pumpState);
    }
  };

  const handleLedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOnline && onLedToggle) {
      onLedToggle(id, !ledState);
    }
  };

  return (
    <motion.div
      whileHover={onClick ? { y: -4, scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      className={clsx(
        "glassmorphism-card rounded-xl p-5 flex flex-col justify-between transition-all duration-200 relative select-none",
        onClick && "cursor-pointer hover:border-primary-dark/40",
        className
      )}
    >
      {/* Device Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={clsx(
              "p-2 rounded-lg border shadow-sm",
              isOnline ? "bg-emerald-50/50 border-emerald-100 text-emerald-600" : "bg-gray-50 border-gray-200 text-gray-400"
            )}>
              <Cpu size={18} />
            </div>
            <h3 className="font-semibold text-gray-800 tracking-tight text-base truncate max-w-[150px]">
              {name}
            </h3>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Duration / Last Active */}
        <div className="flex items-center gap-1 text-[11px] text-gray-400 mb-4">
          <Clock size={12} />
          <span>{isOnline ? "Active for" : "Offline for"} {durationText}</span>
        </div>

        {/* Sensors Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {sensors.map((sensor, index) => {
            const statusDotColor =
              sensor.status === "optimal"
                ? "bg-emerald-500"
                : sensor.status === "warning"
                ? "bg-amber-500"
                : "bg-rose-500";

            return (
              <div
                key={index}
                className={clsx(
                  "p-2.5 rounded-lg border bg-white/40 flex flex-col justify-between gap-1 transition-opacity",
                  !isOnline && "opacity-60"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-gray-400 truncate max-w-[70px]">
                    {sensor.name}
                  </span>
                  <span className={clsx("h-1.5 w-1.5 rounded-full", statusDotColor)} />
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-sm font-bold text-gray-800 font-mono">
                    {sensor.value}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-400">
                    {sensor.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actuators / Controls Section */}
      <div className="border-t border-gray-100 pt-4 mt-auto">
        <div className="grid grid-cols-2 gap-4">
          {/* Pump Control */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={clsx(
                "p-1.5 rounded-md",
                pumpState && isOnline ? "bg-sky-50 text-sky-600" : "bg-gray-50 text-gray-400"
              )}>
                <Droplet size={14} className={clsx(pumpState && isOnline && "animate-pulse")} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-gray-750">Pump</span>
                <span className="text-[9px] text-gray-400 leading-none font-medium">
                  {isOnline ? (pumpState ? "ON" : "OFF") : "N/A"}
                </span>
              </div>
            </div>
            
            {/* Toggle switch button */}
            <button
              type="button"
              disabled={!isOnline}
              onClick={handlePumpClick}
              className={clsx(
                "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none",
                !isOnline && "opacity-40 cursor-not-allowed",
                isOnline && pumpState ? "bg-emerald-500" : "bg-gray-200",
                isOnline && "cursor-pointer"
              )}
            >
              <motion.span
                layout
                className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
                animate={{ x: pumpState && isOnline ? 16 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              />
            </button>
          </div>

          {/* LED Control */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={clsx(
                "p-1.5 rounded-md",
                ledState && isOnline ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-400"
              )}>
                <Lightbulb size={14} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-gray-750">LEDs</span>
                <span className="text-[9px] text-gray-400 leading-none font-medium">
                  {isOnline ? (ledState ? "ON" : "OFF") : "N/A"}
                </span>
              </div>
            </div>
            
            {/* Toggle switch button */}
            <button
              type="button"
              disabled={!isOnline}
              onClick={handleLedClick}
              className={clsx(
                "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none",
                !isOnline && "opacity-40 cursor-not-allowed",
                isOnline && ledState ? "bg-emerald-500" : "bg-gray-200",
                isOnline && "cursor-pointer"
              )}
            >
              <motion.span
                layout
                className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
                animate={{ x: ledState && isOnline ? 16 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
