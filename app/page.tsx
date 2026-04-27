"use client";

import { useMemo, useState, useEffect } from "react";
import styles from "./page.module.css";
import StatCards from "@/components/dashboard/StatCards";
import LiveTable from "@/components/dashboard/LiveTable";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import AlertBanner from "@/components/dashboard/AlertBanner";
import { VendorDonutChart } from "@/components/dashboard/Charts";
import {
  isShiftActive,
  isShiftExpired,
  type Shift,
} from "@/lib/mock-data";

// Shift filter pill styles
const filterBarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "20px",
  flexWrap: "wrap",
};
const pillStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: "20px",
  fontSize: "0.78rem",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  color: "var(--text-secondary)",
};
const pillActiveStyle: React.CSSProperties = {
  ...pillStyle,
  background: "var(--primary)",
  color: "white",
  borderColor: "var(--primary)",
};
const labelStyle: React.CSSProperties = {
  fontSize: "0.78rem",
  color: "var(--text-muted)",
  fontWeight: 600,
};
const activeBadgeStyle: React.CSSProperties = {
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  background: "var(--success)",
  display: "inline-block",
  marginLeft: "4px",
  boxShadow: "0 0 4px var(--success)",
};


export default function DashboardPage() {
  const [shiftFilter, setShiftFilter] = useState<string>("all");
  const [, setTick] = useState(0);

  const [activeBreaks, setActiveBreaks] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [vendorStats, setVendorStats] = useState<any[]>([]);
  const [dynamicShifts, setDynamicShifts] = useState<string[]>([]);
  const [graceMinutes, setGraceMinutes] = useState(30);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [dashRes, setRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/settings")
      ]);
      const data = await dashRes.json();
      const sData = await setRes.json();

      if (sData && !sData.error) {
        setGraceMinutes(sData.graceMinutes);
        setDynamicShifts(sData.activeShifts.split(",").map((s: string) => s.trim()));
      }

      if (data) {
        // Map active breaks to match LiveTable structure
        const mappedBreaks =
          data.activeBreaks?.map((ab: any) => ({
            id: ab.workerId,
            name: ab.worker.name,
            ops: ab.worker.ops,
            vendor: ab.worker.vendor.name,
            shift: ab.worker.shift,
            checkOutTime: new Date(ab.checkOutTime),
          })) || [];
        setActiveBreaks(mappedBreaks);

        // Map recent logs to match ActivityFeed structure
        const mappedLogs =
          data.recentLogs?.map((log: any) => ({
            id: log.id,
            worker: log.worker.name,
            ops: log.worker.ops,
            type:
              log.type === "check-out"
                ? "Mulai Istirahat"
                : "Selesai Istirahat",
            time: new Date(log.time).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          })) || [];
        setRecentLogs(mappedLogs);

        // Map vendor stats to match VendorDonutChart structure
        const mappedVendors =
          data.vendors?.map((v: any) => ({
            vendor: v.name,
            count: v._count.workers,
          })) || [];
        setVendorStats(mappedVendors);
      }
    } catch (err) {
      console.error("Dashboard DB error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Poll every 10 seconds for relatively real-time updates
    const pollInterval = setInterval(fetchDashboardData, 10000);
    // Re-check shift expiry every 60 seconds
    const tickInterval = setInterval(() => setTick((t) => t + 1), 60000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(tickInterval);
    };
  }, []);

  const activeShifts = dynamicShifts.filter((s) => isShiftActive(s as Shift));

  // Filter workers based on shift
  const visibleWorkers = useMemo(() => {
    return activeBreaks.filter((w) => {
      // Apply shift filter
      if (shiftFilter !== "all" && w.shift !== shiftFilter) return false;
      return true;
    });
  }, [activeBreaks, shiftFilter]);

  const overdueWorkers = useMemo(() => {
    return visibleWorkers
      .map((w) => {
        const elapsed = Math.floor(
          (Date.now() - w.checkOutTime.getTime()) / 60000,
        );
        if (elapsed < breakMinutes) return null;
        return {
          id: w.id,
          name: w.name,
          ops: w.ops,
          vendor: w.vendor,
          minutesOver: elapsed - breakMinutes,
        };
      })
      .filter((w) => w !== null);
  }, [visibleWorkers, breakMinutes]);



  const statCards = [
    {
      icon: "👥",
      value: visibleWorkers.length,
      label: "Pekerja Shift Aktif",
      colorClass: "iconBlue",
    },
    {
      icon: "⏳",
      value: visibleWorkers.length, // Can refine active vs all break count later if needed
      label: "Sedang Istirahat",
      colorClass: "iconAmber",
    },
    {
      icon: "🔴",
      value: overdueWorkers.length,
      label: `Overdue (> ${breakMinutes} min)`,
      colorClass: "iconRed",
    },
    {
      icon: "✅",
      value: recentLogs.filter((l) => l.type === "Selesai Istirahat").length,
      label: "Sudah Kembali (10 Log Terakhir)", // Updated label since we only fetch last 10
      colorClass: "iconGreen",
    },
  ];

  if (loading && activeBreaks.length === 0)
    return (
      <div style={{ padding: 40, color: "var(--text-muted)" }}>
        Memuat data live...
      </div>
    );

  return (
    <div className={styles.page}>
      <AlertBanner workers={overdueWorkers} />

      {/* Shift Filter */}
      <div style={filterBarStyle}>
        <span style={labelStyle}>🕐 Shift:</span>
        <button
          style={shiftFilter === "all" ? pillActiveStyle : pillStyle}
          onClick={() => setShiftFilter("all")}>
          Semua
        </button>
        {dynamicShifts.map((s) => {
          const isActive = activeShifts.includes(s);
          const isExpired = isShiftExpired(s as Shift, graceMinutes);
          return (
            <button
              key={s}
              style={{
                ...(shiftFilter === s ? pillActiveStyle : pillStyle),
                ...(isExpired
                  ? { opacity: 0.4, textDecoration: "line-through" }
                  : {}),
              }}
              onClick={() => setShiftFilter(s)}>
              {s}
              {isActive && !isExpired && <span style={activeBadgeStyle} />}
            </button>
          );
        })}
      </div>


      <StatCards stats={statCards} />

      <div className={styles.body}>
        <div className={styles.mainCol}>
          <LiveTable workers={visibleWorkers} />
        </div>
        <div className={styles.sideCol}>
          <VendorDonutChart data={vendorStats} />
          <ActivityFeed items={recentLogs} />
        </div>
      </div>
    </div>
  );
}
