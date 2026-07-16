"use client";

import React, { useState, useEffect } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { clsx } from "clsx";

interface GaugeChartProps {
  value: number; // 0 to 100
  title: string;
  unit?: string;
  color?: string;
  mode?: "semi" | "full";
  height?: number | string;
  className?: string;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  title,
  unit = "%",
  color = "var(--color-primary)",
  mode = "full",
  height = 200,
  className,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="w-full rounded-xl bg-white/40 border border-gray-100 animate-pulse flex items-center justify-center text-xs text-gray-400 font-medium select-none"
      >
        Loading gauge...
      </div>
    );
  }

  // Constrain value between 0 and 100
  const normalizedValue = Math.min(Math.max(value, 0), 100);

  // Setup data for RadialBarChart
  const data = [
    {
      name: title,
      value: normalizedValue,
      fill: color,
    },
  ];

  // Configure angles
  const startAngle = mode === "semi" ? 180 : 225;
  const endAngle = mode === "semi" ? 0 : -45;

  return (
    <div
      className={clsx("relative flex flex-col items-center justify-center select-none", className)}
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy={mode === "semi" ? "80%" : "50%"}
          innerRadius="75%"
          outerRadius="95%"
          barSize={10}
          data={data}
          startAngle={startAngle}
          endAngle={endAngle}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          {/* Background Track bar */}
          <RadialBar
            background={{ fill: "rgba(0, 0, 0, 0.05)" }}
            dataKey="value"
            cornerRadius={5}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Central Label overlay */}
      <div
        className={clsx(
          "absolute flex flex-col items-center justify-center text-center",
          mode === "semi" ? "bottom-[15%]" : "inset-0 mt-3"
        )}
      >
        <span className="text-3xl font-extrabold text-gray-800 font-mono tracking-tight">
          {normalizedValue}
          <span className="text-sm font-semibold text-gray-400 ml-0.5">{unit}</span>
        </span>
        <span className="text-[10px] font-semibold text-gray-450 uppercase tracking-wider mt-1">
          {title}
        </span>
      </div>
    </div>
  );
};
