// src/components/SidebarLayout.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Cpu,
  Activity,
  Sliders,
  AlertTriangle,
  BarChart3,
  Clock,
  Settings as SettingsIcon,
  Menu,
  X,
  Droplet,
  Signal,
  WifiOff
} from "lucide-react";
import { api } from "@/lib/api";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [isMock, setIsMock] = useState(true);

  // Fetch alerts count periodically for notifications badge
  useEffect(() => {
    const updateStats = () => {
      const alerts = api.getAlerts();
      const unresolvedCritical = alerts.filter(a => !a.resolved && (a.severity === "critical" || a.severity === "warning"));
      setAlertCount(unresolvedCritical.length);
      setIsMock(api.getSettings().useMock);
    };

    updateStats();
    const interval = setInterval(updateStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Devices", href: "/devices", icon: Cpu },
    { name: "Sensors", href: "/sensors", icon: Activity },
    { name: "Controls", href: "/controls", icon: Sliders },
    {
      name: "Alerts",
      href: "/alerts",
      icon: AlertTriangle,
      badge: alertCount > 0 ? alertCount : undefined
    },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Automation", href: "/schedules", icon: Clock },
    { name: "Settings", href: "/settings", icon: SettingsIcon }
  ];

  const sidebarVariants = {
    open: { x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
    closed: { x: "-100%", transition: { type: "spring" as const, stiffness: 300, damping: 30 } }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface font-sans">
      {/* Desktop Sidebar (lg screens) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 bg-white border-r border-border h-full flex-shrink-0">
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 border-b border-border gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Droplet className="w-6 h-6 animate-float" />
          </div>
          <div>
            <span className="text-xl font-bold text-text tracking-tight">Hydro<span className="text-primary">Flow</span></span>
            <span className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider -mt-1">Automation Hub</span>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary-light text-primary-dark shadow-sm border-l-4 border-primary"
                    : "text-text-muted hover:bg-surface hover:text-text"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? "text-primary" : "text-text-muted"}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white leading-none">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer connection stats */}
        <div className="p-4 border-t border-border bg-surface/50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-border">
            <div className={`p-2 rounded-lg ${isMock ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>
              {isMock ? <WifiOff className="w-4 h-4" /> : <Signal className="w-4 h-4 animate-pulse" />}
            </div>
            <div className="overflow-hidden">
              <span className="block text-xs font-semibold text-text truncate">
                {isMock ? "Demo Environment" : "Connected API"}
              </span>
              <span className="block text-[10px] text-text-muted truncate">
                {isMock ? "Running simulated mock" : "192.168.1.26:5119"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black lg:hidden"
            />

            {/* Slide-out Panel */}
            <motion.aside
              initial="closed"
              animate="open"
              exit="closed"
              variants={sidebarVariants}
              className="fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-border h-full flex flex-col lg:hidden"
            >
              <div className="h-20 flex items-center justify-between px-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <Droplet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-text tracking-tight">Hydro<span className="text-primary">Flow</span></span>
                    <span className="block text-[9px] font-semibold text-text-muted uppercase tracking-wider -mt-1">Automation Hub</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg border border-border hover:bg-surface text-text-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-primary-light text-primary-dark border-l-4 border-primary"
                          : "text-text-muted hover:bg-surface hover:text-text"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-text-muted"}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className="flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white leading-none">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-border bg-surface/50">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-border">
                  <div className={`p-2 rounded-lg ${isMock ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>
                    {isMock ? <WifiOff className="w-4 h-4" /> : <Signal className="w-4 h-4 animate-pulse" />}
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-text">
                      {isMock ? "Demo Environment" : "Connected API"}
                    </span>
                    <span className="block text-[10px] text-text-muted">
                      {isMock ? "Running simulated mock" : "Local API Server"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Navbar for Mobile/Tablet */}
        <header className="flex items-center justify-between h-16 px-4 bg-white border-b border-border lg:hidden flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpen(true)}
              className="p-2 rounded-lg border border-border text-text-muted hover:bg-surface focus:outline-none"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-lg font-bold text-text tracking-tight">Hydro<span className="text-primary">Flow</span></span>
          </div>

          <div className="flex items-center gap-3">
            {alertCount > 0 && (
              <Link
                href="/alerts"
                className="relative p-2 rounded-lg border border-border text-danger hover:bg-danger-light transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-danger animate-pulse" />
              </Link>
            )}
            <div className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
              isMock ? "bg-warning/10 text-warning border border-warning/20" : "bg-primary/10 text-primary border border-primary/20"
            }`}>
              {isMock ? "Demo" : "Live"}
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto relative outline-none focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
