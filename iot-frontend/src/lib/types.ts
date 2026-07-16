export type SystemType = 'NFT' | 'DWC' | 'DRIP' | 'AEROPONICS';
export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';

export interface SystemSettings {
  backendUrl: string;
  useMock: boolean;
  calibrationPhOffset: number;
  calibrationTdsFactor: number;
  phMin: number;
  phMax: number;
  tdsMin: number;
  tdsMax: number;
  tempMin: number;
  tempMax: number;
  waterLevelMin: number;
  humidityMin: number;
  humidityMax: number;
}

export interface AutomationSchedule {
  id: string;
  name: string;
  description: string;
  type: 'watering' | 'lighting' | 'nutrient';
  timeStart: string;
  timeEnd?: string;
  duration?: number; // minutes
  active: boolean;
  targetDevice: string;
}

// Aliases for compatibility
export type Schedule = AutomationSchedule;

export interface Device {
  deviceId: string;
  name: string;
  system: string;
  isOnline: boolean;
  ipAddress: string;
  macAddress: string;
  firmwareVersion: string;
  lastSeen: string; // ISO string
  sensorReadings: SensorReading[];
  commands: DeviceCommand[];
}

export interface SensorReading {
  id: string;
  deviceId: string;
  timestamp: string; // ISO string
  ph: number;
  tds: number;
  temperature: number; // waterTemp (in °C)
  waterLevel: number; // % (0-100)
  dissolvedOxygen: number; // mg/L
  ambientTemp: number; // greenhouse temp
  humidity: number; // air humidity %
  moisture?: number; // drip root zone moisture %
  pumpState: 'on' | 'off';
  ledState: 'on' | 'off';
}

// Aliases for compatibility
export type SensorData = SensorReading;

export interface DeviceCommand {
  id: string;
  deviceId: string;
  commandType: 'led' | 'pump' | 'restart' | 'pump_duration' | 'sensor_interval';
  commandValue: string;
  status: 'Executed' | 'Pending' | 'Failed' | 'Sent';
  createdAt: string; // ISO string
  executedAt?: string; // ISO string
}

export interface HydroSystem {
  id: string;
  name: string;
  type: SystemType;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ALERT';
  cropType: string;
  plantedAt: string; // ISO string
  capacity: number; // Liters
  deviceId?: string;
}

export interface AlertLog {
  id: string;
  deviceId: string;
  deviceName: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string; // ISO string
  resolved: boolean;
  resolvedAt?: string; // ISO string
  sensorType?: 'ph' | 'tds' | 'waterTemp' | 'waterLevel' | 'dissolvedOxygen' | 'connection' | 'pump' | 'general';
  value?: number;
}

// Aliases for compatibility
export type Alert = AlertLog;

export interface SystemStats {
  totalSystems: number;
  activeSystems: number;
  alertSystems: number;
  onlineDevices: number;
  offlineDevices: number;
  averagePh: number;
  averageTds: number;
  averageWaterTemp: number;
  averageDissolvedOxygen: number;
}
