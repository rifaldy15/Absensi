"use client";

import { useState } from "react";
import styles from "./pengaturan.module.css";

export default function PengaturanPage() {
  const [breakDuration, setBreakDuration] = useState("60");
  const [companyName, setCompanyName] = useState("PT Industrial Corp");
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["umum", "scanner", "users", "offline"]),
  );
  const [autoAlert, setAutoAlert] = useState(true);
  const [soundEffect, setSoundEffect] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [toast, setToast] = useState("");

  const toggleSection = (s: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const handleSave = () => {
    setToast("✅ Pengaturan berhasil disimpan!");
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className={styles.page}>
      {/* Section: Umum */}
      <div className={styles.section}>
        <div
          className={styles.sectionHeader}
          onClick={() => toggleSection("umum")}>
          <h3 className={styles.sectionTitle}>⚙️ Umum</h3>
          <span
            className={`${styles.chevron} ${openSections.has("umum") ? styles.chevronOpen : ""}`}>
            ▶
          </span>
        </div>
        {openSections.has("umum") && (
          <div className={styles.sectionBody}>
            <div className={styles.field}>
              <label className={styles.label}>Nama Perusahaan</label>
              <input
                className={styles.input}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>
                Durasi Istirahat Default (Menit)
              </label>
              <p className={styles.description}>
                Batas waktu istirahat sebelum pekerja dianggap terlambat
              </p>
              <input
                className={styles.input}
                type="number"
                min="15"
                max="120"
                value={breakDuration}
                onChange={(e) => setBreakDuration(e.target.value)}
              />
            </div>
            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>Auto-Alert Overdue</span>
                <span className={styles.toggleDesc}>
                  Tampilkan alertbar merah saat pekerja lewat batas istirahat
                </span>
              </div>
              <button
                className={`${styles.toggle} ${autoAlert ? styles.active : ""}`}
                onClick={() => setAutoAlert(!autoAlert)}>
                <span className={styles.toggleDot} />
              </button>
            </div>
            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>Efek Suara Scan</span>
                <span className={styles.toggleDesc}>
                  Mainkan suara saat scan berhasil
                </span>
              </div>
              <button
                className={`${styles.toggle} ${soundEffect ? styles.active : ""}`}
                onClick={() => setSoundEffect(!soundEffect)}>
                <span className={styles.toggleDot} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section: Scanner */}
      <div className={styles.section}>
        <div
          className={styles.sectionHeader}
          onClick={() => toggleSection("scanner")}>
          <h3 className={styles.sectionTitle}>📷 Scanner</h3>
          <span
            className={`${styles.chevron} ${openSections.has("scanner") ? styles.chevronOpen : ""}`}>
            ▶
          </span>
        </div>
        {openSections.has("scanner") && (
          <div className={styles.sectionBody}>
            <div className={styles.statusRow}>
              <span
                className={`${styles.statusDot} ${styles.statusDotGreen}`}
              />
              <span className={styles.statusText}>
                Scanner terhubung (USB HID Mode)
              </span>
              <span className={styles.statusMeta}>Port: COM3</span>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Tipe Scanner</label>
              <select className={styles.select} defaultValue="usb">
                <option value="usb">USB (Keyboard Mode)</option>
                <option value="bluetooth">Bluetooth</option>
                <option value="serial">Serial Port</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Durasi Feedback (Detik)</label>
              <p className={styles.description}>
                Berapa lama tampilkan hasil scan sebelum kembali ke idle
              </p>
              <input
                className={styles.input}
                type="number"
                min="3"
                max="15"
                defaultValue="5"
              />
            </div>
          </div>
        )}
      </div>

      {/* Section: User & Akses */}
      <div className={styles.section}>
        <div
          className={styles.sectionHeader}
          onClick={() => toggleSection("users")}>
          <h3 className={styles.sectionTitle}>👤 User & Akses</h3>
          <span
            className={`${styles.chevron} ${openSections.has("users") ? styles.chevronOpen : ""}`}>
            ▶
          </span>
        </div>
        {openSections.has("users") && (
          <div className={styles.sectionBody}>
            <div className={styles.userList}>
              <div className={styles.userItem}>
                <div className={styles.userAvatar}>A</div>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>Admin HR</div>
                  <div className={styles.userRole}>admin_hr@company.com</div>
                </div>
                <span className={`${styles.roleBadge} ${styles.roleAdmin}`}>
                  Admin
                </span>
              </div>
              <div className={styles.userItem}>
                <div className={styles.userAvatar}>S</div>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>Supervisor Ops</div>
                  <div className={styles.userRole}>supervisor@company.com</div>
                </div>
                <span
                  className={`${styles.roleBadge} ${styles.roleSupervisor}`}>
                  Supervisor
                </span>
              </div>
              <div className={styles.userItem}>
                <div className={styles.userAvatar}>M</div>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>Manager Produksi</div>
                  <div className={styles.userRole}>manager@company.com</div>
                </div>
                <span
                  className={`${styles.roleBadge} ${styles.roleSupervisor}`}>
                  Supervisor
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section: Offline Mode */}
      <div className={styles.section}>
        <div
          className={styles.sectionHeader}
          onClick={() => toggleSection("offline")}>
          <h3 className={styles.sectionTitle}>📡 Offline Mode</h3>
          <span
            className={`${styles.chevron} ${openSections.has("offline") ? styles.chevronOpen : ""}`}>
            ▶
          </span>
        </div>
        {openSections.has("offline") && (
          <div className={styles.sectionBody}>
            <div className={styles.statusRow}>
              <span
                className={`${styles.statusDot} ${styles.statusDotGreen}`}
              />
              <span className={styles.statusText}>
                Koneksi online — data tersinkronisasi
              </span>
              <span className={styles.statusMeta}>
                Terakhir sync: 2 menit lalu
              </span>
            </div>
            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>Mode Offline</span>
                <span className={styles.toggleDesc}>
                  Simpan data secara lokal saat koneksi terputus
                </span>
              </div>
              <button
                className={`${styles.toggle} ${offlineMode ? styles.active : ""}`}
                onClick={() => setOfflineMode(!offlineMode)}>
                <span className={styles.toggleDot} />
              </button>
            </div>
            <div className={styles.statusRow}>
              <span
                className={`${styles.statusDot} ${styles.statusDotYellow}`}
              />
              <span className={styles.statusText}>0 data pending sync</span>
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      <div className={styles.saveBar}>
        <button className={styles.saveBtn} onClick={handleSave}>
          💾 Simpan Pengaturan
        </button>
      </div>

      {/* Toast */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
