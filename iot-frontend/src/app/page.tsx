"use client";

import { useState, useEffect } from "react";

interface SensorData {
  sensorValue: number;
  temperature: number;
  ledState: string;
  pumpState: string;
  timestamp: string;
}

interface Device {
  deviceId: string;
  name: string;
  isOnline: boolean;
  lastSeen: string;
  sensorReadings: SensorData[];
}

export default function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    try {
      const res = await fetch("http://localhost:5119/api/devices");
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      }
    } catch (error) {
      console.error("Error fetching devices", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  const sendCommand = async (deviceId: string, type: string, value: string) => {
    try {
      await fetch(`http://localhost:5119/api/devices/${deviceId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commandType: type, commandValue: value }),
      });
      alert(`Command queued: ${type} = ${value}`);
    } catch (error) {
      console.error("Failed to send command", error);
      alert("Failed to send command");
    }
  };

  return (
    <div className="min-h-screen p-8 font-sans">
      <header className="mb-8 border-b border-emerald-100 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-light text-emerald-800 tracking-tight">Hydroponics <span className="font-semibold text-emerald-600">Hub</span></h1>
          <p className="text-emerald-900/60 mt-2 font-medium">Real-time automation dashboard</p>
        </div>
        <div className="text-sm font-medium text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl">
          Next.js + .NET 8 Backend
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20 text-emerald-600 font-medium animate-pulse">Loading devices...</div>
      ) : devices.length === 0 ? (
        <div className="text-center py-20 text-emerald-900/50 bg-white rounded-3xl shadow-sm border border-emerald-50">
          <p className="text-lg">No devices found.</p>
          <p className="mt-2 text-sm">Start the ESP32 simulator to register a device.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {devices.map((device) => {
            const latestReading = device.sensorReadings?.[0];
            const isOnline = device.isOnline;

            return (
              <div key={device.deviceId} className="bg-white rounded-[2rem] p-8 shadow-sm border border-emerald-50 transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-3xl font-semibold text-gray-800 tracking-tight">{device.name}</h2>
                    <p className="text-sm text-gray-400 font-mono mt-2 bg-gray-50 inline-block px-3 py-1 rounded-lg">{device.deviceId}</p>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide ${isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {isOnline ? "● ONLINE" : "● OFFLINE"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-emerald-50 rounded-[1.5rem] p-6 border border-emerald-100/50">
                    <p className="text-emerald-700 text-sm font-semibold mb-2 uppercase tracking-wider">Temperature</p>
                    <p className="text-4xl font-bold text-emerald-900">
                      {latestReading?.temperature ? `${latestReading.temperature.toFixed(1)}°C` : "--"}
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-[1.5rem] p-6 border border-emerald-100/50">
                    <p className="text-emerald-700 text-sm font-semibold mb-2 uppercase tracking-wider">Moisture</p>
                    <p className="text-4xl font-bold text-emerald-900">
                      {latestReading?.sensorValue ? `${latestReading.sensorValue.toFixed(1)}%` : "--"}
                    </p>
                  </div>
                  <div className="bg-gray-50/80 rounded-[1.5rem] p-6">
                    <p className="text-gray-500 text-sm font-semibold mb-2 uppercase tracking-wider">Pump State</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${latestReading?.pumpState?.toLowerCase() === 'on' ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                      <p className="text-2xl font-bold text-gray-700 capitalize">
                        {latestReading?.pumpState || "--"}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50/80 rounded-[1.5rem] p-6">
                    <p className="text-gray-500 text-sm font-semibold mb-2 uppercase tracking-wider">LED State</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${latestReading?.ledState?.toLowerCase() === 'on' ? 'bg-amber-400' : 'bg-gray-300'}`}></div>
                      <p className="text-2xl font-bold text-gray-700 capitalize">
                        {latestReading?.ledState || "--"}
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Manual Controls</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => sendCommand(device.deviceId, 'pump', 'on')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-semibold transition-all shadow-lg shadow-emerald-200 active:scale-95"
                  >
                    Start Pump
                  </button>
                  <button 
                    onClick={() => sendCommand(device.deviceId, 'pump', 'off')}
                    className="bg-white hover:bg-gray-50 text-gray-700 py-4 rounded-2xl font-semibold border border-gray-200 transition-all active:scale-95"
                  >
                    Stop Pump
                  </button>
                  <button 
                    onClick={() => sendCommand(device.deviceId, 'led', 'on')}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-800 py-4 rounded-2xl font-semibold transition-all active:scale-95"
                  >
                    Turn On LED
                  </button>
                  <button 
                    onClick={() => sendCommand(device.deviceId, 'led', 'off')}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-2xl font-semibold transition-all active:scale-95"
                  >
                    Turn Off LED
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
