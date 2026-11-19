"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, Bell, Wifi, WifiOff, HelpCircle, Thermometer } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import type { ShellStatus } from "@/lib/useShellStatus";

const searchTargets = [
  { label: "Dashboard", href: "/", keywords: "home overview" },
  { label: "Devices", href: "/devices", keywords: "controllers esp32 nodes" },
  { label: "Circuit Diagram", href: "/circuit", keywords: "wiring breadboard studio" },
  { label: "Sensors", href: "/sensors", keywords: "ph tds temperature humidity level oxygen" },
  { label: "Controls", href: "/controls", keywords: "pump led relay override" },
  { label: "Alerts", href: "/alerts", keywords: "warnings thresholds notifications" },
  { label: "Analytics", href: "/analytics", keywords: "charts export csv history" },
  { label: "Plant Growth Tracker", href: "/growth", keywords: "plants observations" },
  { label: "Schedules", href: "/schedules", keywords: "automation rules timers" },
  { label: "Settings", href: "/settings", keywords: "calibration backend mock" },
];

interface HeaderProps {
  setIsMobileOpen: (open: boolean) => void;
  status: ShellStatus;
}

export default function Header({ setIsMobileOpen, status }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const results = query.trim()
    ? searchTargets.filter((t) => `${t.label} ${t.keywords}`.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const goTo = (href: string) => {
    router.push(href);
    setQuery("");
    setSearchOpen(false);
    searchRef.current?.blur();
  };

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    const crumbs = [{ label: "Home", href: "/" }];

    let currentHref = "";
    segments.forEach((segment) => {
      currentHref += `/${segment}`;
      // Clean up display name
      let label = segment.charAt(0).toUpperCase() + segment.slice(1);
      if (label === "Ph") label = "pH";
      if (label === "Ec") label = "EC";
      if (label === "Growth") label = "Plant Growth Tracker";
      crumbs.push({ label, href: currentHref });
    });

    // If we're at home, replace the last item with Dashboard
    if (crumbs.length === 1) {
      crumbs[0].label = "Dashboard";
    }

    return crumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-white/80 px-4 backdrop-blur-md md:px-6">
      {/* Left: Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text hover:bg-primary-light hover:text-primary transition-colors lg:hidden"
          aria-label="Open Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumbs */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-medium text-text-muted">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.href}>
                {idx > 0 && <span className="text-border">/</span>}
                <Link
                  href={crumb.href}
                  className={clsx(
                    "hover:text-primary transition-colors",
                    isLast ? "text-text font-semibold" : "text-text-muted"
                  )}
                >
                  {crumb.label}
                </Link>
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Center: Search Field */}
      <div className="relative max-w-md flex-1 px-4 hidden sm:block">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) goTo(results[0].href);
              if (e.key === "Escape") {
                setQuery("");
                searchRef.current?.blur();
              }
            }}
            placeholder="Jump to a page: sensors, controls, schedules..."
            aria-label="Search pages"
            className="w-full rounded-xl border border-border bg-surface py-2 pl-10 pr-16 text-sm text-text outline-hidden focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all duration-200"
          />
          <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 inline-flex h-5 items-center gap-0.5 rounded-sm border border-border bg-white px-1.5 font-mono text-[9px] font-medium text-text-muted shadow-xs select-none">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </div>
        {searchOpen && query.trim() && (
          <ul className="absolute left-4 right-4 top-full mt-2 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-lg">
            {results.length === 0 ? (
              <li className="px-4 py-2.5 text-xs text-text-muted">No matching pages</li>
            ) : (
              results.map((r) => (
                <li key={r.href}>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goTo(r.href)}
                    className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-primary-light/60"
                  >
                    {r.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {/* Right: Live status, Alert Badge */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div
          className={clsx(
            "hidden lg:flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium",
            !status.connected
              ? "border-danger/30 bg-rose-50 text-danger"
              : status.mock
              ? "border-warning/30 bg-amber-50 text-warning"
              : "border-border bg-primary-light/30 text-primary"
          )}
        >
          {status.connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          <span>
            {!status.connected
              ? "Backend Offline"
              : status.mock
              ? "Demo Mode"
              : `Live · ${status.onlineDevices}/${status.totalDevices} online`}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-text">
          <Thermometer className="h-3.5 w-3.5 text-info" />
          <span className="text-text-muted">Water:</span>
          <span className="font-semibold font-mono text-primary">
            {status.averageTemp === null ? "—" : `${status.averageTemp.toFixed(1)}°C`}
          </span>
        </div>

        <Link
          href="/alerts"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text hover:bg-primary-light hover:text-primary transition-colors"
          aria-label={`View alerts (${status.activeAlerts} active)`}
        >
          <Bell className="h-4.5 w-4.5" />
          {status.activeAlerts > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
              {status.activeAlerts > 9 ? "9+" : status.activeAlerts}
            </span>
          )}
        </Link>

        <a
          href="https://github.com/shuttergeek1928/hydroponics-automation#readme"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text hover:bg-primary-light hover:text-primary transition-colors"
          aria-label="Open documentation"
        >
          <HelpCircle className="h-4.5 w-4.5" />
        </a>
      </div>
    </header>
  );
}
