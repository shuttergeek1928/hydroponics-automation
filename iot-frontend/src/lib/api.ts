import { 
  Device, 
  SensorReading, 
  DeviceCommand, 
  HydroSystem, 
  AlertLog, 
  AutomationSchedule, 
  SystemStats,
  SystemSettings,
  GrowthObservation
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
      const parsed = JSON.parse(settings);
      if (typeof parsed.useMock === 'boolean') return parsed.useMock;
    } catch {}
  }
  return process.env.NEXT_PUBLIC_USE_MOCK === 'false' ? false : true;
}

// Helper: Determine dynamic backend URL
export function getBaseUrl(): string {
  let url = 'http://localhost:5119';
  if (typeof window !== 'undefined') {
    const settings = localStorage.getItem('hf_settings');
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        if (typeof parsed.backendUrl === 'string' && parsed.backendUrl.trim()) url = parsed.backendUrl.trim();
      } catch {}
    }
  }
  // Paths already include /api, so tolerate users pasting it into the host field
  return url.replace(/\/+$/, '').replace(/\/api$/, '');
}

// Artificial delay to simulate network latency for loading skeletons
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for HTTP requests in real mode
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  } catch {
    throw new Error(`Cannot reach backend at ${getBaseUrl()}. Check that it is running and the URL in Settings is correct.`);
  }
  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.message || body?.title || '';
    } catch {}
    throw new Error(detail || `API Error: ${response.status} ${response.statusText}`);
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// The backend stores UTC timestamps but serializes them without a "Z" suffix,
// which browsers would otherwise parse as local time.
function toIso(value?: string | null): string {
  if (!value) return new Date().toISOString();
  return /(Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalizeReading(r: any): SensorReading {
  return {
    ...r,
    id: String(r.id),
    timestamp: toIso(r.timestamp),
    moisture: r.moisture ?? r.sensorValue,
    pumpState: r.pumpState === 'on' ? 'on' : 'off',
    ledState: r.ledState === 'on' ? 'on' : 'off',
  };
}

function normalizeCommand(c: any): DeviceCommand {
  return {
    ...c,
    id: String(c.id),
    createdAt: toIso(c.createdAt),
    executedAt: c.executedAt ? toIso(c.executedAt) : undefined,
  };
}

function normalizeDevice(d: any): Device {
  return {
    ...d,
    name: d.name || d.deviceId,
    system: d.system || 'Unassigned',
    ipAddress: d.ipAddress || '—',
    macAddress: d.macAddress || '—',
    firmwareVersion: d.firmwareVersion || '—',
    lastSeen: toIso(d.lastSeen),
    sensorReadings: (d.sensorReadings || [])
      .map(normalizeReading)
      .sort((a: SensorReading, b: SensorReading) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    commands: (d.commands || []).map(normalizeCommand),
  };
}

function normalizeAlert(a: any): AlertLog {
  return {
    ...a,
    timestamp: toIso(a.timestamp),
    resolvedAt: a.resolvedAt ? toIso(a.resolvedAt) : undefined,
    sensorType: a.sensorType || 'general',
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */


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
        const durationMs = parseInt(activePumpCmd.commandValue) * 1000; // pump_duration is in seconds
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
        sensorReadings: latest ? [latest] : []
      };
    }));
  }
  const devices = await apiFetch<unknown[]>('/api/devices');
  return devices.map(normalizeDevice);
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
  try {
    return normalizeDevice(await apiFetch<unknown>(`/api/devices/${encodeURIComponent(deviceId)}`));
  } catch (err) {
    if (err instanceof Error && /404/.test(err.message)) return null;
    throw err;
  }
}

export async function getLatestReading(deviceId: string): Promise<SensorReading | null> {
  const useMock = getUseMock();
  if (useMock) {
    const rawReading = generateReadingAtTime(deviceId, new Date());
    const [overridden] = applyCommandOverrides(deviceId, [rawReading]);
    return overridden;
  }
  try {
    return normalizeReading(await apiFetch<unknown>(`/api/devices/${encodeURIComponent(deviceId)}/telemetry/latest`));
  } catch (err) {
    // 404 simply means the device has not reported yet
    if (err instanceof Error && /404/.test(err.message)) return null;
    throw err;
  }
}

export async function getSensorHistory(deviceId: string, hours = 24): Promise<SensorReading[]> {
  const useMock = getUseMock();
  if (useMock) {
    await delay(400);
    const rawHistory = generateSensorHistory(deviceId, hours);
    return applyCommandOverrides(deviceId, rawHistory);
  }
  const readings = await apiFetch<unknown[]>(`/api/devices/${encodeURIComponent(deviceId)}/telemetry?hours=${hours}`);
  return readings.map(normalizeReading);
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

  const created = await apiFetch<unknown>(`/api/devices/${encodeURIComponent(deviceId)}/commands`, {
    method: 'POST',
    body: JSON.stringify({ commandType, commandValue }),
  });
  return normalizeCommand(created);
}

// Alerts, schedules and settings are cached in localStorage so the UI can render synchronously.
// In backend mode the fetch* helpers refresh that cache from the API first.
export function getAlerts(): AlertLog[] {
  return getStoredItem<AlertLog[]>('hydroflow_alerts', mockAlerts);
}

export async function fetchAlerts(): Promise<AlertLog[]> {
  if (getUseMock()) return getAlerts();
  const alerts = (await apiFetch<unknown[]>('/api/alerts')).map(normalizeAlert);
  alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  setStoredItem('hydroflow_alerts', alerts);
  return alerts;
}

export async function dismissAlert(alertId: string): Promise<void> {
  if (!getUseMock()) {
    await apiFetch(`/api/alerts/${encodeURIComponent(alertId)}/resolve`, { method: 'POST' });
  }
  const alerts = getStoredItem<AlertLog[]>('hydroflow_alerts', mockAlerts);
  const updated = alerts.map(a => a.id === alertId ? { ...a, resolved: true, resolvedAt: new Date().toISOString() } : a);
  setStoredItem('hydroflow_alerts', updated);
}

export async function clearResolvedAlerts(): Promise<void> {
  if (!getUseMock()) {
    await apiFetch('/api/alerts/resolved', { method: 'DELETE' });
  }
  const alerts = getStoredItem<AlertLog[]>('hydroflow_alerts', mockAlerts);
  setStoredItem('hydroflow_alerts', alerts.filter(a => !a.resolved));
}

export function getSchedules(): AutomationSchedule[] {
  return getStoredItem<AutomationSchedule[]>('hydroflow_schedules', mockSchedules);
}

export async function fetchSchedules(): Promise<AutomationSchedule[]> {
  if (getUseMock()) return getSchedules();
  const schedules = await apiFetch<AutomationSchedule[]>('/api/schedules');
  setStoredItem('hydroflow_schedules', schedules);
  return schedules;
}

export async function toggleSchedule(id: string, active: boolean): Promise<void> {
  const schedules = getStoredItem<AutomationSchedule[]>('hydroflow_schedules', mockSchedules);
  const updated = schedules.map(s => s.id === id ? { ...s, active } : s);
  const target = updated.find(s => s.id === id);
  if (!getUseMock() && target) {
    await apiFetch(`/api/schedules/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(target)
    });
  }
  setStoredItem('hydroflow_schedules', updated);
}

export async function addSchedule(newSch: Omit<AutomationSchedule, 'id'>): Promise<AutomationSchedule> {
  const schedules = getStoredItem<AutomationSchedule[]>('hydroflow_schedules', mockSchedules);
  let created: AutomationSchedule = {
    ...newSch,
    id: `sch-${Math.random().toString(36).substring(2, 11)}`,
  };
  if (!getUseMock()) {
    created = await apiFetch<AutomationSchedule>('/api/schedules', {
      method: 'POST',
      body: JSON.stringify(created)
    });
  }
  setStoredItem('hydroflow_schedules', [...schedules, created]);
  return created;
}

export async function deleteSchedule(id: string): Promise<void> {
  if (!getUseMock()) {
    await apiFetch<void>(`/api/schedules/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }
  const schedules = getStoredItem<AutomationSchedule[]>('hydroflow_schedules', mockSchedules);
  setStoredItem('hydroflow_schedules', schedules.filter(s => s.id !== id));
}

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

export function getSettings(): SystemSettings {
  return { ...defaultSettings, ...getStoredItem<Partial<SystemSettings>>('hf_settings', defaultSettings) };
}

export async function fetchSettings(): Promise<SystemSettings> {
  const local = getSettings();
  if (local.useMock) return local;
  // Connection settings (mock toggle and URL) stay local; thresholds and calibration live on the backend.
  const remote = await apiFetch<SystemSettings>('/api/settings');
  const merged = { ...local, ...remote, useMock: local.useMock, backendUrl: local.backendUrl };
  setStoredItem('hf_settings', merged);
  return merged;
}

export async function updateSettings(newSettings: Partial<SystemSettings>): Promise<SystemSettings> {
  const updated = { ...getSettings(), ...newSettings };
  // Persist locally first so connection settings can be changed even when the backend is unreachable.
  setStoredItem('hf_settings', updated);
  if (!updated.useMock) {
    await apiFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(updated)
    });
  }
  return updated;
}

export async function getSystemStats(): Promise<SystemStats> {
  const useMock = getUseMock();
  if (useMock) {
    await delay(200);
    const devices = getStoredItem<Device[]>('hydroflow_devices', mockDevices);
    const onlineDevs = devices.filter(d => d.isOnline);
    
    const latestReadings = (await Promise.all(
      onlineDevs.map(d => getLatestReading(d.deviceId))
    )).filter((r): r is SensorReading => r !== null);
    
    const validPh = latestReadings.map(r => r.ph).filter(v => v !== undefined);
    const validTds = latestReadings.map(r => r.tds).filter(v => v !== undefined);
    const validTemp = latestReadings.map(r => r.temperature).filter(v => v !== undefined);
    const validDo = latestReadings.map(r => r.dissolvedOxygen).filter(v => v !== undefined);

    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    return {
      totalSystems: devices.length,
      activeSystems: onlineDevs.length,
      alertSystems: new Set(getAlerts().filter(a => !a.resolved).map(a => a.deviceId)).size,
      onlineDevices: onlineDevs.length,
      offlineDevices: devices.length - onlineDevs.length,
      averagePh: avg(validPh),
      averageTds: avg(validTds),
      averageWaterTemp: avg(validTemp),
      averageDissolvedOxygen: avg(validDo),
    };
  }
  const raw = await apiFetch<Record<string, number | null>>('/api/stats');
  return {
    ...raw,
    averagePh: raw.averagePh ?? 0,
    averageTds: raw.averageTds ?? 0,
    averageWaterTemp: raw.averageWaterTemp ?? 0,
    averageDissolvedOxygen: raw.averageDissolvedOxygen ?? 0
  } as SystemStats;
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
  if (deviceId) {
    const commands = await apiFetch<unknown[]>(`/api/devices/${encodeURIComponent(deviceId)}/commands`);
    return commands.map(normalizeCommand);
  }
  // No global command listing exists on the backend; merge each device's recent commands.
  const devices = await apiFetch<{ deviceId: string }[]>('/api/devices');
  const perDevice = await Promise.all(devices.map(d => getCommands(d.deviceId)));
  return perDevice.flat().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

  const escape = (val: string | number | undefined) =>
    typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : (val ?? '');

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escape).join(','))
  ].join('\n');

  return csvContent;
}

export function getActiveCommandsQueue(): DeviceCommand[] {
  return getStoredItem<DeviceCommand[]>('hydroflow_commands', mockCommands);
}

// Backend mode has no endpoint for deleting command history, so "clear" hides everything up to now locally.
const QUEUE_CLEARED_KEY = 'hf_queue_cleared_at';

export async function fetchCommandQueue(): Promise<DeviceCommand[]> {
  if (getUseMock()) return getActiveCommandsQueue();
  const commands = await getCommands();
  const clearedAt = Number(localStorage.getItem(QUEUE_CLEARED_KEY) || 0);
  return commands.filter(c => new Date(c.createdAt).getTime() > clearedAt);
}

export function clearActiveCommandsQueue(): void {
  if (getUseMock()) {
    setStoredItem('hydroflow_commands', []);
  } else {
    localStorage.setItem(QUEUE_CLEARED_KEY, String(Date.now()));
  }
}

export async function getCircuitLayout(deviceId: string) {
  const useMock = getUseMock();
  if (useMock) {
    const data = localStorage.getItem(`hf_circuit_backend_${deviceId}`);
    return data ? JSON.parse(data) : null;
  }
  try {
    return await apiFetch(`/api/circuit/${deviceId}`);
  } catch (e) {
    return null;
  }
}

export async function saveCircuitLayout(deviceId: string, componentsJson: string, wiresJson: string) {
  const useMock = getUseMock();
  const payload = { deviceId, componentsJson, wiresJson, updatedAt: new Date().toISOString() };
  if (useMock) {
    localStorage.setItem(`hf_circuit_backend_${deviceId}`, JSON.stringify(payload));
    return payload;
  }
  return await apiFetch(`/api/circuit/${deviceId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

const defaultGrowthObservations: GrowthObservation[] = [
  {
    id: 'obs-1',
    date: new Date().toISOString().split('T')[0],
    plantName: 'Butterhead Lettuce (NFT-A)',
    stage: 'Vegetative',
    heightCm: 12.5,
    health: 'Excellent',
    notes: 'Strong root development, vibrant green leaves with no tip burn.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'obs-2',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    plantName: 'Sweet Basil (DWC-B)',
    stage: 'Seedling',
    heightCm: 4.2,
    health: 'Good',
    notes: 'First true leaves expanding well. Adjusted LED height slightly.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export async function getGrowthObservations(): Promise<GrowthObservation[]> {
  if (getUseMock()) {
    return getStoredItem<GrowthObservation[]>('hydroflow_growth_logs', defaultGrowthObservations);
  }
  const data = await apiFetch<GrowthObservation[]>('/api/growth');
  const normalized = data.map(o => ({ ...o, createdAt: toIso(o.createdAt) }));
  setStoredItem('hydroflow_growth_logs', normalized);
  return normalized;
}

export async function addGrowthObservation(obs: Omit<GrowthObservation, 'id' | 'createdAt'>): Promise<GrowthObservation> {
  const current = getStoredItem<GrowthObservation[]>('hydroflow_growth_logs', defaultGrowthObservations);
  let created: GrowthObservation;
  if (getUseMock()) {
    created = {
      ...obs,
      id: `obs-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
  } else {
    // Failures propagate so the UI never shows an entry that was not persisted
    created = await apiFetch<GrowthObservation>('/api/growth', {
      method: 'POST',
      body: JSON.stringify(obs),
    });
    created = { ...created, createdAt: toIso(created.createdAt) };
  }
  setStoredItem('hydroflow_growth_logs', [created, ...current]);
  return created;
}

export async function deleteGrowthObservation(id: string): Promise<void> {
  if (!getUseMock()) {
    await apiFetch(`/api/growth/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }
  const current = getStoredItem<GrowthObservation[]>('hydroflow_growth_logs', defaultGrowthObservations);
  setStoredItem('hydroflow_growth_logs', current.filter(o => o.id !== id));
}

// Unified api object representing the default and named api helper
export const api = {
  getDevices,
  getDeviceById,
  getLatestReading,
  getSensorHistory,
  queueCommand,
  getAlerts,
  fetchAlerts,
  dismissAlert,
  clearResolvedAlerts,
  getSchedules,
  fetchSchedules,
  toggleSchedule,
  addSchedule,
  deleteSchedule,
  getSettings,
  fetchSettings,
  updateSettings,
  getSystemStats,
  getCommands,
  generateCsvExport,
  getActiveCommandsQueue,
  fetchCommandQueue,
  clearActiveCommandsQueue,
  getCircuitLayout,
  saveCircuitLayout,
  getGrowthObservations,
  addGrowthObservation,
  deleteGrowthObservation
};

// Re-export type definitions for import simplicity
export type { Device, SensorReading, DeviceCommand, HydroSystem, AlertLog, AutomationSchedule, SystemStats, SystemSettings, GrowthObservation };
