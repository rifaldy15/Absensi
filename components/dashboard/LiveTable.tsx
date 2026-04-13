"use client";

import { useEffect, useState } from "react";
import styles from "./LiveTable.module.css";

export interface BreakWorker {
  id: string;
  name: string;
  ops: string;
  vendor: string;
  shift: string;
  checkOutTime: Date;
}

interface LiveTableProps {
  workers: BreakWorker[];
}

function getElapsedMinutes(checkOutTime: Date): number {
  return Math.floor((Date.now() - checkOutTime.getTime()) / 60000);
}

function formatDuration(checkOutTime: Date): string {
  const totalSec = Math.floor((Date.now() - checkOutTime.getTime()) / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

type EscalationTier = "normal" | "warning" | "overdue" | "danger" | "critical";

function getEscalationTier(elapsed: number): EscalationTier {
  if (elapsed >= 120) return "critical";
  if (elapsed >= 90) return "danger";
  if (elapsed >= 60) return "overdue";
  if (elapsed >= 50) return "warning";
  return "normal";
}

const TIER_ROW_CLASS: Record<EscalationTier, string> = {
  normal: "",
  warning: styles.rowWarning,
  overdue: styles.rowOverdue,
  danger: styles.rowDanger,
  critical: styles.rowCritical,
};

const TIER_TIMER_CLASS: Record<EscalationTier, string> = {
  normal: styles.timerNormal,
  warning: styles.timerWarning,
  overdue: styles.timerOverdue,
  danger: styles.timerDanger,
  critical: styles.timerCritical,
};

const TIER_STATUS: Record<
  EscalationTier,
  { icon: string; text: string; className: string }
> = {
  normal: { icon: "🟡", text: "Istirahat", className: styles.statusOnBreak },
  warning: {
    icon: "🟠",
    text: "Segera Kembali",
    className: styles.statusWarning,
  },
  overdue: { icon: "🔴", text: "Overdue", className: styles.statusOverdue },
  danger: { icon: "🚨", text: "Eskalasi!", className: styles.statusDanger },
  critical: { icon: "‼️", text: "KRITIS!", className: styles.statusCritical },
};

export default function LiveTable({ workers }: LiveTableProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Sort: most overdue first
  const sorted = [...workers].sort((a, b) => {
    const ea = getElapsedMinutes(a.checkOutTime);
    const eb = getElapsedMinutes(b.checkOutTime);
    return eb - ea;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>
          ⏳ Sedang Istirahat
          <span className={styles.count}>{workers.length}</span>
        </span>
      </div>
      <div className={styles.tableWrap}>
        {sorted.length === 0 ? (
          <div className={styles.empty}>
            Tidak ada pekerja yang sedang istirahat saat ini.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>No</th>
                <th>Pekerja</th>
                <th>OPS ID</th>
                <th>Vendor</th>
                <th>Jam Keluar</th>
                <th>Durasi</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((w, i) => {
                const elapsed = getElapsedMinutes(w.checkOutTime);
                const tier = getEscalationTier(elapsed);
                const status = TIER_STATUS[tier];

                return (
                  <tr key={w.id} className={TIER_ROW_CLASS[tier]}>
                    <td>{i + 1}</td>
                    <td>
                      <div className={styles.workerCell}>
                        <div className={styles.avatar}>
                          {w.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={styles.workerName}>{w.name}</span>
                      </div>
                    </td>
                    <td>{w.ops}</td>
                    <td>{w.vendor}</td>
                    <td>{formatTime(w.checkOutTime)}</td>
                    <td>
                      <span
                        className={`${styles.timer} ${TIER_TIMER_CLASS[tier]}`}>
                        {formatDuration(w.checkOutTime)}
                      </span>
                    </td>
                    <td>
                      <span className={status.className}>
                        {status.icon} {status.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
