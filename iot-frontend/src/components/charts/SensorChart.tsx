"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { format, parseISO, isValid } from "date-fns";

export interface ChartSeries {
  key: string;
  name: string;
  color: string;
  unit: string;
  yAxisId?: "left" | "right";
}

interface SensorChartProps {
  data: any[];
  series: ChartSeries[];
  xAxisKey?: string;
  height?: number | string;
  grid?: boolean;
  className?: string;
}

export const SensorChart: React.FC<SensorChartProps> = ({
  data,
  series,
  xAxisKey = "timestamp",
  height = 300,
  grid = true,
  className,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatXAxis = (tickItem: any) => {
    try {
      const date = typeof tickItem === "number" ? new Date(tickItem) : parseISO(tickItem);
      if (isValid(date)) {
        return format(date, "HH:mm");
      }
      return String(tickItem);
    } catch {
      return String(tickItem);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      let formattedLabel = String(label);
      try {
        const date = typeof label === "number" ? new Date(label) : parseISO(label);
        if (isValid(date)) {
          formattedLabel = format(date, "MMM dd, yyyy HH:mm:ss");
        }
      } catch {
        // Fallback to raw label
      }

      return (
        <div className="glassmorphism-card p-3 rounded-lg border border-gray-150 shadow-lg text-xs flex flex-col gap-1.5 font-sans min-w-[150px] relative z-50">
          <p className="font-semibold text-gray-500 mb-0.5 border-b border-gray-100 pb-1">
            {formattedLabel}
          </p>
          {payload.map((item: any, index: number) => {
            const currentSeries = series.find((s) => s.key === item.dataKey);
            const unit = currentSeries ? currentSeries.unit : "";
            const name = currentSeries ? currentSeries.name : item.name;
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white"
                    style={{ backgroundColor: item.color }}
                  />
                  {name}:
                </span>
                <span className="font-bold font-mono text-gray-800">
                  {item.value} {unit}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 mt-4 select-none">
        {payload.map((entry: any, index: number) => {
          const currentSeries = series.find((s) => s.key === entry.dataKey);
          return (
            <div
              key={`item-${index}`}
              className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-default"
            >
              <span
                className="w-3.5 h-2 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span>
                {currentSeries?.name || entry.value} ({currentSeries?.unit})
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="w-full rounded-xl bg-white/40 border border-gray-100 animate-pulse flex items-center justify-center text-xs text-gray-400 font-medium select-none"
      >
        Loading live charts...
      </div>
    );
  }

  const hasRightAxis = series.some((s) => s.yAxisId === "right");

  return (
    <div className={className} style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0.0} />
              </linearGradient>
            ))}
          </defs>

          {grid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
          )}

          <XAxis
            dataKey={xAxisKey}
            tickFormatter={formatXAxis}
            stroke="#9ca3af"
            fontSize={10}
            fontFamily="var(--font-mono)"
            tickLine={false}
            axisLine={false}
            dy={8}
          />

          <YAxis
            yAxisId="left"
            stroke="#9ca3af"
            fontSize={10}
            fontFamily="var(--font-mono)"
            tickLine={false}
            axisLine={false}
            dx={-8}
          />

          {hasRightAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#9ca3af"
              fontSize={10}
              fontFamily="var(--font-mono)"
              tickLine={false}
              axisLine={false}
              dx={8}
            />
          )}

          <Tooltip content={<CustomTooltip />} />

          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.key}
              yAxisId={s.yAxisId || "left"}
              stroke={s.color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#grad-${s.key})`}
              activeDot={{
                r: 5,
                strokeWidth: 2,
                stroke: "#ffffff",
                style: { filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" },
              }}
            />
          ))}

          <Legend content={renderCustomLegend} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
