import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(dateString: string | Date): string {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return 'unknown';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return 'unknown';
  }
}

export interface SensorRange {
  minNormal: number;
  maxNormal: number;
  minWarning: number;
  maxWarning: number;
  unit: string;
}

export const SENSOR_RANGES: Record<string, SensorRange> = {
  ph: {
    minNormal: 5.5,
    maxNormal: 6.5,
    minWarning: 5.0,
    maxWarning: 7.0,
    unit: 'pH',
  },
  tds: {
    minNormal: 800,
    maxNormal: 1200,
    minWarning: 500,
    maxWarning: 1500,
    unit: 'ppm',
  },
  temperature: {
    minNormal: 18.0,
    maxNormal: 23.0,
    minWarning: 15.0,
    maxWarning: 26.0,
    unit: '°C',
  },
  waterTemp: {
    minNormal: 18.0,
    maxNormal: 23.0,
    minWarning: 15.0,
    maxWarning: 26.0,
    unit: '°C',
  },
  waterLevel: {
    minNormal: 70,
    maxNormal: 100,
    minWarning: 40,
    maxWarning: 100,
    unit: '%',
  },
  dissolvedOxygen: {
    minNormal: 6.0,
    maxNormal: 9.0,
    minWarning: 4.5,
    maxWarning: 12.0,
    unit: 'mg/L',
  },
  moisture: {
    minNormal: 40,
    maxNormal: 80,
    minWarning: 25,
    maxWarning: 90,
    unit: '%',
  },
  ambientTemp: {
    minNormal: 18.0,
    maxNormal: 28.0,
    minWarning: 15.0,
    maxWarning: 35.0,
    unit: '°C',
  },
  humidity: {
    minNormal: 50,
    maxNormal: 70,
    minWarning: 40,
    maxWarning: 80,
    unit: '%',
  },
};

export type SensorStatus = 'normal' | 'warning' | 'danger';

export function getSensorStatus(type: string, value: number | undefined): SensorStatus {
  if (value === undefined) return 'normal';
  
  const range = SENSOR_RANGES[type];
  if (!range) return 'normal';

  // For waterLevel and dissolvedOxygen, high is generally fine, low is bad.
  if (type === 'waterLevel' || type === 'dissolvedOxygen') {
    if (value >= range.minNormal) return 'normal';
    if (value >= range.minWarning) return 'warning';
    return 'danger';
  }

  // General range check
  if (value >= range.minNormal && value <= range.maxNormal) {
    return 'normal';
  } else if (value >= range.minWarning && value <= range.maxWarning) {
    return 'warning';
  } else {
    return 'danger';
  }
}

export function formatSensorValue(type: string, value: number | undefined): string {
  if (value === undefined) return 'N/A';
  
  const range = SENSOR_RANGES[type];
  const unit = range ? range.unit : '';
  
  // Format based on type
  if (type === 'ph') {
    return `${value.toFixed(1)} ${unit}`;
  } else if (type === 'tds') {
    return `${Math.round(value)} ${unit}`;
  } else if (type === 'temperature' || type === 'waterTemp' || type === 'ambientTemp') {
    return `${value.toFixed(1)}${unit}`;
  } else if (type === 'dissolvedOxygen') {
    return `${value.toFixed(1)} ${unit}`;
  } else {
    return `${Math.round(value)}${unit}`;
  }
}
