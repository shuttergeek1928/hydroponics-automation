"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Menu, Search, Bell, Wifi, CloudLightning, HelpCircle, Thermometer } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

interface HeaderProps {
  setIsMobileOpen: (open: boolean) => void;
}

export default function Header({ setIsMobileOpen }: HeaderProps) {
  const pathname = usePathname();

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    const crumbs = [{ label: "Home", href: "/" }];

    let currentHref = "";
    segments.forEach((segment, index) => {
      currentHref += `/${segment}`;
      // Clean up display name
      let label = segment.charAt(0).toUpperCase() + segment.slice(1);
      if (label === "Ph") label = "pH";
      if (label === "Ec") label = "EC";
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
            type="text"
            placeholder="Search sensors, controls, schedules..."
            className="w-full rounded-xl border border-border bg-surface py-2 pl-10 pr-16 text-sm text-text outline-hidden focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all duration-200"
          />
          <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 inline-flex h-5 items-center gap-0.5 rounded-sm border border-border bg-white px-1.5 font-mono text-[9px] font-medium text-text-muted shadow-xs select-none">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Right: Info widgets, Status, Alert Badge */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Telemetry Live connection status */}
        <div className="hidden lg:flex items-center gap-2 rounded-full border border-border bg-primary-light/30 px-3 py-1 text-[11px] font-medium text-primary">
          <Wifi className="h-3.5 w-3.5 animate-pulse text-primary" />
          <span>Telemetry Live</span>
        </div>

        {/* Tank Level widget */}
        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-text">
          <Thermometer className="h-3.5 w-3.5 text-info" />
          <span className="text-text-muted">Temp:</span>
          <span className="font-semibold font-mono text-primary">22.4°C</span>
        </div>

        {/* Quick notification button */}
        <Link href="/alerts" className="relative group">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text hover:bg-primary-light hover:text-primary transition-colors"
            aria-label="View alerts"
          >
            <Bell className="h-4.5 w-4.5 text-text group-hover:scale-105 transition-transform" />
          </button>
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-danger"></span>
          </span>
        </Link>

        {/* Help Center */}
        <button
          className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text hover:bg-primary-light hover:text-primary transition-colors"
          aria-label="Help Documentation"
        >
          <HelpCircle className="h-4.5 w-4.5" />
        </button>
      </div>
    </header>
  );
}
