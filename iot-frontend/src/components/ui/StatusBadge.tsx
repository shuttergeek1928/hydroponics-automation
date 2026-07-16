"use client";

import React from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

export type StatusType =
  | "online"
  | "offline"
  | "optimal"
  | "warning"
  | "critical"
  | "pending"
  | "sent"
  | "executed"
  | "failed";

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  className?: string;
  showDot?: boolean;
}

const statusConfig: Record<
  string,
  {
    bg: string;
    text: string;
    border: string;
    dotColor: string;
    pulse: boolean;
    labelText: string;
  }
> = {
  online: {
    bg: "bg-emerald-50/80",
    text: "text-emerald-700 font-medium",
    border: "border-emerald-200/60",
    dotColor: "bg-emerald-500",
    pulse: true,
    labelText: "Online",
  },
  offline: {
    bg: "bg-gray-50/80",
    text: "text-gray-500 font-medium",
    border: "border-gray-200",
    dotColor: "bg-gray-400",
    pulse: false,
    labelText: "Offline",
  },
  optimal: {
    bg: "bg-emerald-50/80",
    text: "text-emerald-700 font-semibold",
    border: "border-emerald-200/50",
    dotColor: "bg-emerald-600",
    pulse: true,
    labelText: "Optimal",
  },
  warning: {
    bg: "bg-amber-50/80",
    text: "text-amber-700 font-semibold",
    border: "border-amber-200/60",
    dotColor: "bg-amber-500",
    pulse: true,
    labelText: "Warning",
  },
  critical: {
    bg: "bg-rose-50/80",
    text: "text-rose-700 font-semibold",
    border: "border-rose-200/60",
    dotColor: "bg-rose-600",
    pulse: true,
    labelText: "Critical",
  },
  pending: {
    bg: "bg-sky-50/80",
    text: "text-sky-700 font-medium",
    border: "border-sky-200/60",
    dotColor: "bg-sky-500",
    pulse: true,
    labelText: "Pending",
  },
  sent: {
    bg: "bg-indigo-50/80",
    text: "text-indigo-700 font-medium",
    border: "border-indigo-200/60",
    dotColor: "bg-indigo-500",
    pulse: false,
    labelText: "Sent",
  },
  executed: {
    bg: "bg-emerald-50/85",
    text: "text-emerald-700 font-semibold",
    border: "border-emerald-200/60",
    dotColor: "bg-emerald-500",
    pulse: false,
    labelText: "Executed",
  },
  failed: {
    bg: "bg-rose-50/85",
    text: "text-rose-700 font-semibold",
    border: "border-rose-200/60",
    dotColor: "bg-rose-600",
    pulse: false,
    labelText: "Failed",
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className,
  showDot = true,
}) => {
  const normStatus = status.toLowerCase();
  const config = statusConfig[normStatus] || {
    bg: "bg-gray-50/80",
    text: "text-gray-600 font-medium",
    border: "border-gray-200",
    dotColor: "bg-gray-400",
    pulse: false,
    labelText: status,
  };

  const displayText = label || config.labelText;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border backdrop-blur-sm select-none",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          {config.pulse && (
            <span
              className={clsx(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                config.dotColor
              )}
            />
          )}
          <span
            className={clsx(
              "relative inline-flex rounded-full h-2 w-2",
              config.dotColor
            )}
          />
        </span>
      )}
      <span>{displayText}</span>
    </motion.div>
  );
};
