"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Cpu,
  Gauge,
  Sliders,
  Bell,
  LineChart,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sprout,
  User,
  Activity,
  LogOut
} from "lucide-react";
import clsx from "clsx";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Devices", href: "/devices", icon: Cpu },
  { label: "Sensors", href: "/sensors", icon: Gauge },
  { label: "Controls", href: "/controls", icon: Sliders },
  { label: "Alerts", href: "/alerts", icon: Bell, badge: 3 },
  { label: "Analytics", href: "/analytics", icon: LineChart },
  { label: "Schedules", href: "/schedules", icon: Calendar },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}: SidebarProps) {
  const pathname = usePathname();

  // Find if a path is active
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const sidebarVariants = {
    expanded: { width: "16rem" },
    collapsed: { width: "5rem" },
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <motion.aside
        initial={false}
        animate={isCollapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        transition={{ type: "spring", stiffness: 220, damping: 24, mass: 0.8 }}
        className={clsx(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-border bg-white transition-colors duration-200 lg:static",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Top Branding Section */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20">
              <Sprout className="h-5 w-5 animate-float" />
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col select-none"
              >
                <span className="text-base font-bold tracking-tight text-primary-dark">
                  HydroFlow
                </span>
                <span className="text-[10px] font-medium tracking-wider text-text-muted uppercase">
                  Agri-Automation
                </span>
              </motion.div>
            )}
          </Link>

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface text-text-muted hover:bg-primary-light hover:text-primary-dark transition-colors duration-150 lg:flex"
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={clsx(
                  "group relative flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 outline-hidden select-none",
                  active
                    ? "text-primary-dark font-semibold"
                    : "text-text-muted hover:bg-primary-light/50 hover:text-text"
                )}
              >
                {/* Active Highlight sliding pill */}
                {active && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 z-0 rounded-xl bg-primary-light border-l-[3px] border-primary"
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                )}

                {/* Nav Icon */}
                <span className="relative z-10 shrink-0">
                  <item.icon
                    className={clsx(
                      "h-5 w-5 transition-transform duration-200 group-hover:scale-105",
                      active ? "text-primary" : "text-text-muted group-hover:text-primary"
                    )}
                  />
                </span>

                {/* Nav Label */}
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative z-10 whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}

                {/* Badge alert count */}
                {item.badge && (
                  <span
                    className={clsx(
                      "relative z-10 ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white",
                      isCollapsed && "absolute -top-1.5 -right-1"
                    )}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Tooltip for collapsed mode */}
                {isCollapsed && (
                  <div className="pointer-events-none absolute left-16 z-50 rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Active System Indicator */}
        <div className="px-3 py-2 border-t border-border">
          {isCollapsed ? (
            <div className="flex justify-center py-2 group relative">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-accent"></span>
              </span>
              <div className="pointer-events-none absolute left-16 z-50 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 whitespace-nowrap">
                <div className="font-semibold text-accent">SYSTEM NOMINAL</div>
                <div className="text-[10px] text-slate-300">EC: 1.8 | pH: 6.2</div>
              </div>
            </div>
          ) : (
            <div className="glassmorphism-card rounded-xl p-3 border border-border/80">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
                </span>
                <span className="text-xs font-semibold text-text uppercase tracking-wider">
                  System Nominal
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] font-mono text-text-muted">
                <div className="flex flex-col">
                  <span>EC Level</span>
                  <span className="font-semibold text-primary">1.8 mS</span>
                </div>
                <div className="flex flex-col">
                  <span>pH Level</span>
                  <span className="font-semibold text-primary">6.2 pH</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Status Profile */}
        <div className="border-t border-border p-3">
          <div
            className={clsx(
              "flex items-center justify-between gap-3",
              isCollapsed && "justify-center"
            )}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {/* User Avatar */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-accent font-semibold text-white text-sm shadow-inner">
                AG
              </div>

              {/* User Identity */}
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-sm font-semibold text-text">
                    Dr. Alana Green
                  </span>
                  <span className="truncate text-[10px] text-text-muted">
                    Master Grower
                  </span>
                </div>
              )}
            </div>

            {/* Logout/Actions button */}
            {!isCollapsed && (
              <button
                className="h-8 w-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-rose-50 hover:text-danger transition-colors duration-150"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
