"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <div className={`main-wrapper ${collapsed ? "collapsed" : ""}`}>
        <TopBar collapsed={collapsed} />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
