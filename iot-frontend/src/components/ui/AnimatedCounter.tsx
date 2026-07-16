"use client";

import React, { useEffect, useRef, useState } from "react";
import { animate, motion } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  decimals,
  prefix = "",
  suffix = "",
  duration = 0.75,
  className,
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  // Auto-detect decimals if not provided
  const getDecimalPlaces = (val: number) => {
    if (Math.floor(val) === val) return 0;
    const str = val.toString();
    const parts = str.split(".");
    return parts[1] ? Math.min(parts[1].length, 2) : 1;
  };

  const precision = decimals !== undefined ? decimals : getDecimalPlaces(value);

  useEffect(() => {
    const from = prevValueRef.current;
    const to = value;

    if (from === to) return;

    const controls = animate(from, to, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayValue(latest);
      },
    });

    prevValueRef.current = to;

    return () => controls.stop();
  }, [value, duration]);

  // Fallback in case of no change or component mount
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      setDisplayValue(value);
    }
  }, [value]);

  const formatted = displayValue.toFixed(precision);

  return (
    <motion.span
      className={className}
      layout
      transition={{ duration: 0.2 }}
    >
      {prefix}
      {formatted}
      {suffix}
    </motion.span>
  );
};
