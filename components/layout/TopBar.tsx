"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./TopBar.module.css";

interface TopBarProps {
  collapsed: boolean;
}

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/scan": "Scan Station",
  "/pekerja": "Data Pekerja",
  "/vendor": "Data Vendor",
  "/laporan": "Laporan",
  "/pengaturan": "Pengaturan",
};

export default function TopBar({ collapsed }: TopBarProps) {
  const pathname = usePathname();
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const title = PAGE_TITLES[pathname] || "Dashboard";

  return (
    <header className={`${styles.topbar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.left}>
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>

      <div className={styles.right}>
        {/* Live Clock */}
        <span className={styles.clock}>{time}</span>

        {/* Live Indicator */}
        <div className={styles.liveIndicator}>
          <span className={styles.liveDot}></span>
          LIVE
        </div>

        {/* Notifications */}
        <button className={styles.iconBtn}>
          🔔
          <span className={styles.notifBadge}></span>
        </button>

        {/* User */}
        <div className={styles.userArea}>
          <div className={styles.userAvatar}>A</div>
          <div>
            <div className={styles.userName}>Admin HR</div>
            <div className={styles.userRole}>Administrator</div>
          </div>
        </div>
      </div>
    </header>
  );
}
