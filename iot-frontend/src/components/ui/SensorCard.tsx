"use client";

import React, { useId } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import {
  Thermometer,
  Droplets,
  Activity,
  Gauge,
  Sun,
  Wind,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  LucideIcon
} from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";

export type SensorStatus = "optimal" | "warning" | "critical";
export type SensorTrend = "up" | "down" | "stable";

interface SensorCardProps {
  name: string;
  value: number;
  unit: string;
  status: SensorStatus;
  trend: SensorTrend;
  history?: number[];
  decimals?: number;
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
}

const statusColors = {
  optimal: {
    dot: "bg-emerald-500 shadow-emerald-500/50",
    text: "text-emerald-700",
    bg: "bg-emerald-50/50 border-emerald-100",
    sparkline: "#10b981",
  },
  warning: {
    dot: "bg-amber-500 shadow-amber-500/50",
    text: "text-amber-700",
    bg: "bg-amber-50/50 border-amber-100",
    sparkline: "#f59e0b",
  },
  critical: {
    dot: "bg-rose-500 shadow-rose-500/50",
    text: "text-rose-700",
    bg: "bg-rose-50/50 border-rose-100",
    sparkline: "#ef4444",
  },
};

const trendIcons = {
  up: {
    icon: TrendingUp,
    color: "text-emerald-500 bg-emerald-50",
  },
  down: {
    icon: TrendingDown,
    color: "text-rose-500 bg-rose-50",
  },
  stable: {
    icon: ArrowRight,
    color: "text-gray-400 bg-gray-50",
  },
};

const getAutoIcon = (name: string): LucideIcon => {
  const n = name.toLowerCase();
  if (n.includes("temp")) return Thermometer;
  if (n.includes("ph")) return Droplets;
  if (n.includes("tds") || n.includes("ec") || n.includes("conductivity")) return Activity;
  if (n.includes("level") || n.includes("volume") || n.includes("tank")) return Gauge;
  if (n.includes("light") || n.includes("lux")) return Sun;
  if (n.includes("humidity") || n.includes("moisture")) return Wind;
  return Activity;
};

export const SensorCard: React.FC<SensorCardProps> = ({
  name,
  value,
  unit,
  status,
  trend,
  history = [],
  decimals,
  icon: PropIcon,
  onClick,
  className,
}) => {
  const uniqueId = useId().replace(/:/g, "");
  const config = statusColors[status] || statusColors.optimal;
  const TrendIcon = trendIcons[trend]?.icon || ArrowRight;
  const trendConfig = trendIcons[trend] || trendIcons.stable;
  const SensorIcon = PropIcon || getAutoIcon(name);

  // Sparkline Component Inside
  const renderSparkline = () => {
    if (!history || history.length < 2) return null;
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min === 0 ? 1 : max - min;

    const width = 80;
    const height = 28;
    const padding = 2;

    const points = history.map((val, index) => {
      const x = (index / (history.length - 1)) * (width - padding * 2) + padding;
      const y = height - ((val - min) / range) * (height - padding * 2) - padding;
      return { x, y };
    });

    const pathData = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    const areaData = `${pathData} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    const gradId = `sparkline-grad-${uniqueId}`;

    return (
      <svg width={width} height={height} className="overflow-visible select-none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={config.sparkline} stopOpacity="0.25" />
            <stop offset="100%" stopColor={config.sparkline} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaData} fill={`url(#${gradId})`} />
        <path
          d={pathData}
          fill="none"
          stroke={config.sparkline}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <motion.div
      whileHover={onClick ? { y: -4, scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      className={clsx(
        "glassmorphism-card flex flex-col justify-between p-4 rounded-xl relative overflow-hidden transition-all duration-200 select-none",
        onClick && "cursor-pointer hover:border-primary-dark/40",
        className
      )}
    >
      {/* Background soft glow based on status */}
      <div className={clsx("absolute top-0 right-0 w-24 h-24 rounded-full filter blur-2xl opacity-10 pointer-events-none -mr-8 -mt-8", status === "optimal" ? "bg-emerald-500" : status === "warning" ? "bg-amber-500" : "bg-rose-500")} />

      {/* Card Header */}
      <div className="flex items-start justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className={clsx("p-2 rounded-lg bg-white border border-gray-100 shadow-sm text-gray-600")}>
            <SensorIcon size={18} className="stroke-[2px]" />
          </div>
          <span className="text-sm font-medium text-gray-500 tracking-tight truncate max-w-[120px]">
            {name}
          </span>
        </div>

        {/* Status indicator dot */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            {status !== "optimal" && (
              <span className={clsx("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", config.dot)} />
            )}
            <span className={clsx("relative inline-flex rounded-full h-2 w-2 shadow-[0_0_8px]", config.dot)} />
          </span>
          <span className={clsx("text-[10px] font-semibold uppercase tracking-wider", config.text)}>
            {status}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex items-end justify-between relative z-10">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-0.5">
            <AnimatedCounter
              value={value}
              decimals={decimals}
              className="text-2xl font-bold text-gray-900 font-mono tracking-tight"
            />
            <span className="text-sm font-semibold text-gray-400 ml-0.5">{unit}</span>
          </div>
        </div>

        {/* Sparkline & Trend */}
        <div className="flex flex-col items-end gap-1.5">
          {history.length >= 2 ? (
            <div className="h-8 flex items-center justify-end">
              {renderSparkline()}
            </div>
          ) : null}

          <div className={clsx("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold", trendConfig.color)}>
            <TrendIcon size={10} className="stroke-[2.5px]" />
            <span className="capitalize">{trend}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
