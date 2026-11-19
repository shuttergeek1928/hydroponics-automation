"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface ShellStatus {
  activeAlerts: number;
  criticalAlerts: number;
  onlineDevices: number;
  totalDevices: number;
  averageTemp: number | null;
  averagePh: number | null;
  averageTds: number | null;
  connected: boolean;
  mock: boolean;
}

const initial: ShellStatus = {
  activeAlerts: 0,
  criticalAlerts: 0,
  onlineDevices: 0,
  totalDevices: 0,
  averageTemp: null,
  averagePh: null,
  averageTds: null,
  connected: true,
  mock: true,
};

// Live data for the persistent header/sidebar, polled so they reflect real state on every page.
export function useShellStatus(intervalMs = 10000): ShellStatus {
  const [status, setStatus] = useState<ShellStatus>(initial);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const mock = api.getSettings().useMock;
      try {
        const [stats, alerts] = await Promise.all([api.getSystemStats(), api.fetchAlerts()]);
        if (cancelled) return;
        const open = alerts.filter((a) => !a.resolved);
        const hasData = stats.onlineDevices > 0;
        setStatus({
          activeAlerts: open.length,
          criticalAlerts: open.filter((a) => a.severity === "critical").length,
          onlineDevices: stats.onlineDevices,
          totalDevices: stats.onlineDevices + stats.offlineDevices,
          averageTemp: hasData ? stats.averageWaterTemp : null,
          averagePh: hasData ? stats.averagePh : null,
          averageTds: hasData ? stats.averageTds : null,
          connected: true,
          mock,
        });
      } catch {
        if (!cancelled) setStatus((prev) => ({ ...prev, connected: false, mock }));
      }
    };

    load();
    const id = setInterval(load, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return status;
}
