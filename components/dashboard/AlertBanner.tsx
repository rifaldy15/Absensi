"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./AlertBanner.module.css";

export interface OverdueWorker {
  id: string;
  name: string;
  ops: string;
  vendor: string;
  minutesOver: number; // minutes past the 60-min limit
}

interface AlertBannerProps {
  workers: OverdueWorker[];
}

type EscalationLevel = "warning" | "danger" | "critical";

function getEscalation(minutesOver: number): EscalationLevel {
  if (minutesOver >= 60) return "critical"; // 120+ min total (60+ min overdue)
  if (minutesOver >= 30) return "danger"; // 90+ min total (30+ min overdue)
  return "warning"; // 60+ min total (just overdue)
}

function getHighestLevel(workers: OverdueWorker[]): EscalationLevel {
  let highest: EscalationLevel = "warning";
  for (const w of workers) {
    const level = getEscalation(w.minutesOver);
    if (level === "critical") return "critical";
    if (level === "danger") highest = "danger";
  }
  return highest;
}

const LEVEL_CONFIG: Record<
  EscalationLevel,
  {
    icon: string;
    title: string;
    bannerClass: string;
    iconClass: string;
    titleClass: string;
    badgeClass: string;
    badgeText: string;
  }
> = {
  warning: {
    icon: "⚠️",
    title: "Pekerja Overdue",
    bannerClass: styles.levelWarning,
    iconClass: styles.iconWarning,
    titleClass: styles.titleWarning,
    badgeClass: styles.badgeWarning,
    badgeText: "PERINGATAN",
  },
  danger: {
    icon: "🔴",
    title: "Eskalasi — Overdue > 30 Menit",
    bannerClass: styles.levelDanger,
    iconClass: styles.iconDanger,
    titleClass: styles.titleDanger,
    badgeClass: styles.badgeDanger,
    badgeText: "ESKALASI",
  },
  critical: {
    icon: "🚨",
    title: "KRITIS — Overdue > 60 Menit!",
    bannerClass: styles.levelCritical,
    iconClass: styles.iconCritical,
    titleClass: styles.titleCritical,
    badgeClass: styles.badgeCritical,
    badgeText: "🚨 KRITIS",
  },
};

export default function AlertBanner({ workers }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevCountRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play alert sound using Web Audio API
  const playAlertSound = useCallback(
    (level: EscalationLevel) => {
      if (!soundEnabled) return;

      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        const ctx = audioContextRef.current;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Different tones for different levels
        if (level === "critical") {
          oscillator.frequency.value = 880; // High A
          oscillator.type = "square";
          gainNode.gain.value = 0.15;
        } else if (level === "danger") {
          oscillator.frequency.value = 660; // E
          oscillator.type = "sawtooth";
          gainNode.gain.value = 0.1;
        } else {
          oscillator.frequency.value = 440; // A
          oscillator.type = "sine";
          gainNode.gain.value = 0.08;
        }

        oscillator.start();

        // Beep pattern
        setTimeout(() => {
          gainNode.gain.value = 0;
          setTimeout(() => {
            gainNode.gain.value = level === "critical" ? 0.15 : 0.1;
            setTimeout(() => {
              oscillator.stop();
            }, 150);
          }, 100);
        }, 200);
      } catch {
        // Audio context may not be available
      }
    },
    [soundEnabled],
  );

  // Play sound when new overdue workers appear
  useEffect(() => {
    const activeWorkers = workers.filter((w) => !dismissed.has(w.id));
    if (
      activeWorkers.length > prevCountRef.current &&
      activeWorkers.length > 0
    ) {
      const level = getHighestLevel(activeWorkers);
      playAlertSound(level);
    }
    prevCountRef.current = activeWorkers.length;
  }, [workers, dismissed, playAlertSound]);

  const activeWorkers = workers.filter((w) => !dismissed.has(w.id));
  if (activeWorkers.length === 0) return null;

  // Group by escalation level
  const critical = activeWorkers.filter(
    (w) => getEscalation(w.minutesOver) === "critical",
  );
  const danger = activeWorkers.filter(
    (w) => getEscalation(w.minutesOver) === "danger",
  );
  const warning = activeWorkers.filter(
    (w) => getEscalation(w.minutesOver) === "warning",
  );

  const renderBanner = (group: OverdueWorker[], level: EscalationLevel) => {
    if (group.length === 0) return null;
    const config = LEVEL_CONFIG[level];
    const names = group.map((w) => w.name).join(", ");
    const maxOver = Math.max(...group.map((w) => w.minutesOver));

    return (
      <div key={level} className={`${styles.banner} ${config.bannerClass}`}>
        <div className={`${styles.iconWrap} ${config.iconClass}`}>
          {config.icon}
        </div>
        <div className={styles.content}>
          <div className={`${styles.title} ${config.titleClass}`}>
            {config.title}
          </div>
          <div className={styles.detail}>
            <span className={styles.names}>{names}</span> — sudah overdue{" "}
            {maxOver > 1 ? `hingga ${maxOver}` : maxOver} menit
            {level === "critical" && " · Segera hubungi supervisor!"}
            {level === "danger" && " · Perlu tindakan segera"}
          </div>
        </div>
        <span className={`${styles.badge} ${config.badgeClass}`}>
          {config.badgeText}
        </span>
        <button
          className={soundEnabled ? styles.soundActive : styles.soundToggle}
          onClick={() => setSoundEnabled(!soundEnabled)}>
          {soundEnabled ? "🔔 On" : "🔇 Off"}
        </button>
        <button
          className={styles.dismissBtn}
          onClick={() => {
            const ids = new Set(dismissed);
            group.forEach((w) => ids.add(w.id));
            setDismissed(ids);
          }}>
          ✕
        </button>
      </div>
    );
  };

  return (
    <div className={styles.alertStack}>
      {renderBanner(critical, "critical")}
      {renderBanner(danger, "danger")}
      {renderBanner(warning, "warning")}
    </div>
  );
}
