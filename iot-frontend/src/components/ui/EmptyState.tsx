"use client";

import React from "react";
import { motion } from "framer-motion";
import { Leaf, LucideIcon } from "lucide-react";
import { clsx } from "clsx";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Leaf,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        "flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-gray-200 bg-white/30 backdrop-blur-sm select-none",
        className
      )}
    >
      <div className="p-4 rounded-full bg-emerald-50 text-emerald-600 mb-4 shadow-sm">
        <Icon size={32} className="stroke-[1.5px] animate-float" />
      </div>
      <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-xs text-gray-405 max-w-sm mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-primary py-2 px-4 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
};
