import { 
  Device, 
  SensorReading, 
  DeviceCommand, 
  HydroSystem, 
  AlertLog, 
  AutomationSchedule, 
  SystemStats,
  SystemSettings
} from './types';
import { 
  mockDevices, 
  mockSystems, 
  mockCommands, 
  mockAlerts, 
  mockSchedules,
  generateSensorHistory,
  generateReadingAtTime
} from './mock-data';

// Helper: Determine dynamic mode based on localStorage settings
export function getUseMock(): boolean {
  if (typeof window === 'undefined') return true;
  const settings = localStorage.getItem('hf_settings');
  if (settings) {
    try {
      return JSON.parse(settings).useMock;
    } catch (e) {}
  }
  return process.env.NEXT_PUBLIC_USE_MOCK === 'false' ? false : true;
}

// Helper: Determine dynamic backend URL
export function getBaseUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:5119';
  const settings = localStorage.getItem('hf_settings');
  if (settings) {
    try {
      return JSON.parse(settings).backendUrl;
    } catch (e) {}
  }
  return 'http://localhost:5119';
}

// Artificial delay to simulate network latency for loading skeletons
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for HTTP requests in real mode
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

// Initialize LocalStorage Mock Database
function initMockDb() {
  if (typeof window === 'undefined') return;
  
  if (!localStorage.getItem('hydroflow_devices')) {
    localStorage.setItem('hydroflow_devices', JSON.stringify(mockDevices));
  }
  if (!localStorage.getItem('hydroflow_systems')) {
    localStorage.setItem('hydroflow_systems', JSON.stringify(mockSystems));
  }
  if (!localStorage.getItem('hydroflow_commands')) {
    localStorage.setItem('hydroflow_commands', JSON.stringify(mockCommands));
  }
  if (!localStorage.getItem('hydroflow_alerts')) {
    localStorage.setItem('hydroflow_alerts', JSON.stringify(mockAlerts));
  }
  if (!localStorage.getItem('hydroflow_schedules')) {
    localStorage.setItem('hydroflow_schedules', JSON.stringify(mockSchedules));
  }
}

// Read/Write helper utilities
function getStoredItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  initMockDb();
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
}

function setStoredItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Override simulated telemetry readings based on user manual commands
function applyCommandOverrides(deviceId: string, readings: SensorReading[]): SensorReading[] {
  const commands = getStoredItem<DeviceCommand[]>('hydroflow_commands', []);
  
  // Sort executed commands chronologically
  const deviceCommands = commands
    .filter(c => (c.deviceId === deviceId || c.deviceId === 'all') && c.status === 'Executed')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (deviceCommands.length === 0) return readings;

  return readings.map(reading => {
    const readingTime = new Date(reading.timestamp).getTime();

    // Find latest LED command executed before this reading's timestamp
    const activeLedCmd = [...deviceCommands]
      .reverse()
      .find(c => c.commandType === 'led' && new Date(c.createdAt).getTime() <= readingTime);

    // Find latest Pump command executed before this reading's timestamp
    const activePumpCmd = [...deviceCommands]
      .reverse()
      .find(c => (c.commandType === 'pump' || c.commandType === 'pump_duration') && new Date(c.createdAt).getTime() <= readingTime);

    const updatedReading = { ...reading };

    if (activeLedCmd) {
      updatedReading.ledState = activeLedCmd.commandValue === 'on' ? 'on' : 'off';
    }
    if (activePumpCmd) {
      if (activePumpCmd.commandType === 'pump_duration') {
        const cmdTime = new Date(activePumpCmd.createdAt).getTime();
        const durationMs = parseInt(activePumpCmd.commandValue) * 60 * 1000;
        if (readingTime >= cmdTime && readingTime <= cmdTime + durationMs) {
          updatedReading.pumpState = 'on';
        } else {
          updatedReading.pumpState = 'off';
        }
      } else {
        updatedReading.pumpState = activePumpCmd.commandValue === 'on' ? 'on' : 'off';
      }
    }

    return updatedReading;
  });
}

// ==========================================
// API CLIENT IMPLEMENTATIONS
// ==========================================

export async function getDevices(): Promise<Device[]> {
  const useMock = getUseMock();
  if (useMock) {
    await delay(200);
    const devices = getStoredItem<Device[]>('hydroflow_devices', mockDevices);
    // Hydrate each device with its latest reading
    return Promise.all(devices.map(async (d) => {
      const latest = await getLatestReading(d.deviceId);
      return {
        ...d,
        sensorReadings: [latest]
      };
    }));
  }
  return apiFetch<Device[]>('/api/devices');
}

export async function getDeviceById(deviceId: string): Promise<Device | null> {
  const useMock = getUseMock();
  if (useMock) {
    await delay(200);
    const devices = getStoredItem<Device[]>('hydroflow_devices', mockDevices);
    const found = devices.find(d => d.deviceId === deviceId);
    if (!found) return null;

    const history = await getSensorHistory(deviceId, 24);
    const commands = await getCommands(deviceId);

    return {
      ...found,
      sensorReadings: history,
      commands: commands
    };
  }
  return apiFetch<Device | null>(`/api/devices/${deviceId}`);
}

export async function getLatestReading(deviceId: string): Promise<SensorReading> {
  const useMock = getUseMock();
  if (useMock) {
    const rawReading = generateReadingAtTime(deviceId, new Date());
    const [overridden] = applyCommandOverrides(deviceId, [rawReading]);
    return overridden;
  }
  return apiFetch<SensorReading>(`/api/devices/${deviceId}/telemetry/latest`);
}

export async function getSensorHistory(deviceId: string, hours = 24): Promise<SensorReading[]> {
  const useMock = getUseMock();
  if (useMock) {
    await delay(400);
    const rawHistory = generateSensorHistory(deviceId, hours);
    return applyCommandOverrides(deviceId, rawHistory);
  }
  return apiFetch<SensorReading[]>(`/api/devices/${deviceId}/telemetry?hours=${hours}`);
}

export async function queueCommand(
  deviceId: string, 
  commandType: DeviceCommand['commandType'], 
  commandValue: string
): Promise<DeviceCommand> {
  const useMock = getUseMock();
  if (useMock) {
    await delay(350);
    const devices = getStoredItem<Device[]>('hydroflow_devices', mockDevices);
    const targetDevice = devices.find(d => d.deviceId === deviceId);
    
    const newCommand: DeviceCommand = {
      id: `cmd-${Math.random().toString(36).substr(2, 9)}`,
      deviceId,
      commandType,
      commandValue,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    if (deviceId !== 'all' && !targetDevice) {
      newCommand.status = 'Failed';
      return newCommand;
    }

    if (targetDevice && !targetDevice.isOnline) {
      newCommand.status = 'Failed';
      newCommand.executedAt = new Date().toISOString();
      
      const commands = getStoredItem<DeviceCommand[]>('hydroflow_commands', mockCommands);
      setStoredItem('hydroflow_commands', [newCommand, ...commands]);
      return newCommand;
    }

    newCommand.status = 'Executed';
    newCommand.executedAt = new Date().toISOString();

    const commands = getStoredItem<DeviceCommand[]>('hydroflow_commands', mockCommands);
    setStoredItem('hydroflow_commands', [newCommand, ...commands]);

    return newCommand;
  }

  return apiFetch<DeviceCommand>(`/api/devices/${deviceId}/commands`, {
    method: 'POST',
    body: JSON.stringify({ commandType, commandValue }),
  });
}

// Synchronous operations using localStorage cache for seamless React rendering
export function getAlerts(): AlertLog[] {
  return getStoredItem<AlertLog[]>('hydroflow_alerts', mockAlerts);
}

export function dismissAlert(alertId: string): void {
  const alerts = getStoredItem<AlertLog[]>('hydroflow_alerts', mockAlerts);
  const updated = alerts.map(a => a.id === alertId ? { ...a, resolved: true, resolvedAt: new Date().toISOString() } : a);
  setStoredItem('hydroflow_alerts', updated);
  
  const useMock = getUseMock();
  if (!useMock) {
    apiFetch(`/api/alerts/${alertId}/resolve`, { method: 'POST' }).catch(console.error);
  }
}

export function clearResolvedAlerts(): void {
  const alerts = getStoredItem<AlertLog[]>('hydroflow_alerts', mockAlerts);
  const updated = alerts.filter(a => !a.resolved);
  setStoredItem('hydroflow_alerts', updated);
  
  const useMock = getUseMock();
  if (!useMock) {
    apiFetch('/api/alerts/resolved', { method: 'DELETE' }).catch(console.error);
  }
}

export function getSchedules(): AutomationSchedule[] {
  return getStoredItem<AutomationSchedule[]>('hydroflow_schedules', mockSchedules);
}

export function toggleSchedule(id: string, active: boolean): void {
  const schedules = getStoredItem<AutomationSchedule[]>('hydroflow_schedules', mockSchedules);
  const updated = schedules.map(s => s.id === id ? { ...s, active } : s);
  setStoredItem('hydroflow_schedules', updated);
  
  const useMock = getUseMock();
  if (!useMock) {
    const target = updated.find(s => s.id === id);
    if (target) {
      apiFetch(`/api/schedules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(target)
      }).catch(console.error);
    }
  }
}

export function addSchedule(newSch: Omit<AutomationSchedule, 'id'>): void {
  const schedules = getStoredItem<AutomationSchedule[]>('hydroflow_schedules', mockSchedules);
  const created: AutomationSchedule = {
    ...newSch,
    id: `sch-${Math.random().toString(36).substr(2, 9)}`,
  };
  const updated = [...schedules, created];
  setStoredItem('hydroflow_schedules', updated);
  
  const useMock = getUseMock();
  if (!useMock) {
    apiFetch('/api/schedules', {
      method: 'POST',
      body: JSON.stringify(created)
    }).catch(console.error);
  }
}

export function getSettings(): SystemSettings {
  const defaultSettings: SystemSettings = {
    backendUrl: 'http://localhost:5119',
    useMock: true,
    calibrationPhOffset: 0.0,
    calibrationTdsFactor: 1.0,
    phMin: 5.5,
    phMax: 6.5,
    tdsMin: 800,
    tdsMax: 1200,
    tempMin: 18.0,
    tempMax: 23.0,
    waterLevelMin: 70,
    humidityMin: 50,
    humidityMax: 70
  };
  return getStoredItem<SystemSettings>('hf_settings', defaultSettings);
}

export function updateSettings(newSettings: Partial<SystemSettings>): void {
  const current = getSettings();
  const updated = { ...current, ...newSettings };
  setStoredItem('hf_settings', updated);
  
  const useMock = getUseMock();
  if (!useMock) {
    apiFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(updated)
    }).catch(console.error);
  }
}

export async function getSystemStats(): Promise<SystemStats> {
  const useMock = getUseMock();
  if (useMock) {
    await delay(200);
    const devices = getStoredItem<Device[]>('hydroflow_devices', mockDevices);
    const onlineDevs = devices.filter(d => d.isOnline);
    
    const latestReadings = await Promise.all(
      onlineDevs.map(d => getLatestReading(d.deviceId))
    );
    
    const validPh = latestReadings.map(r => r.ph).filter(v => v !== undefined);
    const validTds = latestReadings.map(r => r.tds).filter(v => v !== undefined);
    const validTemp = latestReadings.map(r => r.temperature).filter(v => v !== undefined);
    const validDo = latestReadings.map(r => r.dissolvedOxygen).filter(v => v !== undefined);

    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    return {
      totalSystems: 4,
      activeSystems: 3,
      alertSystems: 1,
      onlineDevices: onlineDevs.length,
      offlineDevices: devices.length - onlineDevs.length,
      averagePh: avg(validPh),
      averageTds: avg(validTds),
      averageWaterTemp: avg(validTemp),
      averageDissolvedOxygen: avg(validDo),
    };
  }
  return apiFetch<SystemStats>('/api/stats');
}

export async function getCommands(deviceId?: string): Promise<DeviceCommand[]> {
  const useMock = getUseMock();
  if (useMock) {
    await delay(200);
    const commands = getStoredItem<DeviceCommand[]>('hydroflow_commands', mockCommands);
    if (deviceId) {
      return commands.filter(c => c.deviceId === deviceId);
    }
    return commands;
  }
  const path = deviceId ? `/api/devices/${deviceId}/commands` : '/api/commands';
  return apiFetch<DeviceCommand[]>(path);
}

export function generateCsvExport(device: Device): string {
  const readings = device.sensorReadings || [];
  const headers = [
    'Timestamp',
    'pH',
    'TDS (ppm)',
    'Water Temp (°C)',
    'Water Level (%)',
    'Dissolved Oxygen (mg/L)',
    'Ambient Temp (°C)',
    'Humidity (%)',
    'Pump State',
    'LED State'
  ];
  
  const rows = readings.map(r => [
    r.timestamp,
    r.ph,
    r.tds,
    r.temperature,
    r.waterLevel,
    r.dissolvedOxygen,
    r.ambientTemp,
    r.humidity,
    r.pumpState,
    r.ledState
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(val => typeof val === 'string' ? `"${val}"` : val).join(','))
  ].join('\n');

  return csvContent;
}

export function getActiveCommandsQueue(): DeviceCommand[] {
  return getStoredItem<DeviceCommand[]>('hydroflow_commands', mockCommands);
}

export function clearActiveCommandsQueue(): void {
  setStoredItem('hydroflow_commands', []);
  const useMock = getUseMock();
  if (!useMock) {
    apiFetch('/api/commands/queue', { method: 'DELETE' }).catch(console.error);
  }
}

// Unified api object representing the default and named api helper
export const api = {
  getDevices,
  getDeviceById,
  getLatestReading,
  getSensorHistory,
  queueCommand,
  getAlerts,
  dismissAlert,
  clearResolvedAlerts,
  getSchedules,
  toggleSchedule,
  addSchedule,
  getSettings,
  updateSettings,
  getSystemStats,
  getCommands,
  generateCsvExport,
  getActiveCommandsQueue,
  clearActiveCommandsQueue
};

// Re-export type definitions for import simplicity
export type { Device, SensorReading, DeviceCommand, HydroSystem, AlertLog, AutomationSchedule, SystemStats, SystemSettings };
