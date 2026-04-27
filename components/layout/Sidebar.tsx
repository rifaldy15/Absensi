"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
}

const NAV_ITEMS = [
  {
    group: "MENU UTAMA",
    items: [
      { label: "Dashboard", icon: "🏠", href: "/" },
      { label: "Scan Station", icon: "📷", href: "/scan" },
    ],
  },
  {
    group: "DATA MASTER",
    items: [
      { label: "Data Pekerja", icon: "👥", href: "/pekerja" },
      { label: "Data Vendor", icon: "🏢", href: "/vendor" },
    ],
  },
  {
    group: "LAPORAN",
    items: [{ label: "Laporan", icon: "📊", href: "/laporan" }],
  },
  {
    group: "SISTEM",
    items: [{ label: "Pengaturan", icon: "⚙️", href: "/pengaturan" }],
  },
];

export default function Sidebar({ collapsed, mobileOpen, onToggle, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${mobileOpen ? styles.mobileOpen : ""}`}
    >
      {/* Logo */}
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>⏱️</div>
        <div className={styles.logoText}>
          <span className={styles.logoTitle}>Break Monitor</span>
          <span className={styles.logoSubtitle}>Sistem Absensi</span>
        </div>
        {/* Mobile close button */}
        <button
          className={styles.mobileCloseBtn}
          onClick={onMobileClose}
          aria-label="Tutup menu"
        >
          ✕
        </button>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map((group) => (
          <div key={group.group} className={styles.navGroup}>
            <div className={styles.navGroupLabel}>{group.group}</div>
            {group.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.active : ""}`}>
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse Toggle — desktop only */}
      <button className={styles.collapseBtn} onClick={onToggle}>
        <span className={styles.collapseIcon}>◀</span>
        <span className={styles.collapseLabel}>Tutup Menu</span>
      </button>
    </aside>
  );
}
