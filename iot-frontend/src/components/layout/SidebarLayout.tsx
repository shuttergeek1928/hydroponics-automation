"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import PageTransition from "./PageTransition";
import { ToastProvider } from "@/components/ui/Toast";
import { useShellStatus } from "@/lib/useShellStatus";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const status = useShellStatus();

  return (
    <ToastProvider>
    <div className="flex min-h-screen w-full bg-surface text-text overflow-hidden">
      {/* Navigation Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        status={status}
      />

      {/* Main Content Shell */}
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        {/* Persistent Top Header */}
        <Header setIsMobileOpen={setIsMobileOpen} status={status} />

        {/* Scrollable Viewport Wrapper */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-surface pattern-bg">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
    </ToastProvider>
  );
}
