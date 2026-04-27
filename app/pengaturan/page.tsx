"use client";

import { useState, useEffect } from "react";
import styles from "./pengaturan.module.css";
import { Shift } from "@/lib/mock-data";

export default function PengaturanPage() {
  const [loading, setLoading] = useState(true);
  const [graceMinutes, setGraceMinutes] = useState(30);
  const [breakMinutes, setBreakMinutes] = useState(60);
  const [activeShifts, setActiveShifts] = useState<string[]>([]);
  const [newShift, setNewShift] = useState("");
  
  const [companyName, setCompanyName] = useState("PT Industrial Corp");
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["umum", "shift", "scanner", "users", "offline"]),
  );
  const [autoAlert, setAutoAlert] = useState(true);
  const [soundEffect, setSoundEffect] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data && !data.error) {
        setGraceMinutes(data.graceMinutes);
        setBreakMinutes(data.breakMinutes || 60);
        setActiveShifts(data.activeShifts.split(",").map((s: string) => s.trim()));
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (s: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const handleSave = async () => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          graceMinutes,
          breakMinutes,
          activeShifts: activeShifts.join(","),
        }),
      });
      
      if (res.ok) {
        setToast("✅ Pengaturan berhasil disimpan!");
        setTimeout(() => setToast(""), 3000);
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      alert("Gagal menyimpan pengaturan.");
    }
  };

  const addShift = () => {
    if (!newShift) return;
    if (activeShifts.includes(newShift)) {
      alert("Shift sudah ada!");
      return;
    }
    // Simple HH:mm validation
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(newShift)) {
      alert("Format jam salah! Gunakan HH:mm (contoh: 08:00)");
      return;
    }
    setActiveShifts([...activeShifts, newShift].sort());
    setNewShift("");
  };

  const removeShift = (s: string) => {
    setActiveShifts(activeShifts.filter((item) => item !== s));
  };

  if (loading) return <div style={{ padding: 40, color: "var(--text-muted)" }}>Memuat pengaturan...</div>;

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
                Batas waktu istirahat sebelum pekerja dianggap terlambat (muncul alert merah)
              </p>
              <input
                className={styles.input}
                type="number"
                min="1"
                max="120"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 1)}
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

      {/* Section: Shift & Toleransi */}
      <div className={styles.section}>
        <div
          className={styles.sectionHeader}
          onClick={() => toggleSection("shift")}>
          <h3 className={styles.sectionTitle}>⏰ Shift & Toleransi</h3>
          <span
            className={`${styles.chevron} ${openSections.has("shift") ? styles.chevronOpen : ""}`}>
            ▶
          </span>
        </div>
        {openSections.has("shift") && (
          <div className={styles.sectionBody}>
             <div className={styles.field}>
              <label className={styles.label}>
                Toleransi Istirahat & Auto-Clear (Menit)
              </label>
              <p className={styles.description}>
                Batas waktu (menit) setelah shift berakhir sebelum data pekerja otomatis dihapus dari database.
              </p>
              <input
                className={styles.input}
                type="number"
                min="0"
                max="120"
                value={graceMinutes}
                onChange={(e) => setGraceMinutes(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Daftar Shift Aktif Hari Ini</label>
              <p className={styles.description}>
                Jam mulai shift yang berlaku di sistem saat ini.
              </p>
              
              <div className={styles.shiftList}>
                {activeShifts.map((s) => (
                  <div key={s} className={styles.shiftPill}>
                    <span>{s}</span>
                    <button onClick={() => removeShift(s)} className={styles.removeShift}>×</button>
                  </div>
                ))}
              </div>

              <div className={styles.addShiftRow}>
                <input 
                  type="time" 
                  className={styles.input} 
                  style={{ width: "120px" }}
                  value={newShift}
                  onChange={(e) => setNewShift(e.target.value)}
                />
                <button className={styles.addBtn} onClick={addShift}>+ Tambah Shift</button>
              </div>
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

