"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import styles from "./laporan.module.css";

type Tab = "harian" | "keterlambatan" | "vendor";

const TAB_NAMES: Record<Tab, string> = {
  harian: "Rekap Harian",
  keterlambatan: "Laporan Keterlambatan",
  vendor: "Rekap Vendor",
};

export default function LaporanPage() {
  const [activeTab, setActiveTab] = useState<Tab>("harian");
  const [filterVendor, setFilterVendor] = useState("");
  const [toast, setToast] = useState("");

  const [dailyData, setDailyData] = useState<any[]>([]);
  const [vendorsRecap, setVendorsRecap] = useState<any[]>([]);
  const [vendorList, setVendorList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/laporan")
      .then((res) => res.json())
      .then((data) => {
        setDailyData(data.dailyData || []);
        setVendorsRecap(data.vendorsRecap || []);
        setVendorList(data.vendors || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const lateOnly = dailyData.filter((d) => d.late > 0);
  const displayData = activeTab === "keterlambatan" ? lateOnly : dailyData;
  const filteredData = filterVendor
    ? displayData.filter((d) => d.vendor === filterVendor)
    : displayData;

  const totalRecords = filteredData.length;
  const avgDuration =
    totalRecords > 0
      ? Math.round(
          filteredData.reduce((s, d) => s + d.duration, 0) / totalRecords,
        )
      : 0;
  const totalLate = filteredData.filter((d) => d.late > 0).length;

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const today = new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    if (activeTab === "vendor") {
      // ===== VENDOR RECAP SHEET =====
      const titleRows = [
        ["LAPORAN REKAP VENDOR"],
        ["Break Monitor — Sistem Absensi Istirahat (Live Database)"],
        [`Tanggal: ${today}`],
        [],
      ];

      const headers = [
        "No",
        "Nama Vendor",
        "Total Log Istirahat",
        "Tepat Waktu",
        "Terlambat",
        "Rata-rata Durasi (menit)",
      ];
      const dataRows = vendorsRecap.map((v, i) => [
        i + 1,
        v.name,
        v.total,
        v.onTime,
        v.late,
        v.avgDuration,
      ]);

      // Summary
      const totalAll = vendorsRecap.reduce((s, v) => s + v.total, 0);
      const totalOnTime = vendorsRecap.reduce((s, v) => s + v.onTime, 0);
      const totalLateV = vendorsRecap.reduce((s, v) => s + v.late, 0);
      const avgAll =
        vendorsRecap.length > 0
          ? Math.round(
              vendorsRecap.reduce((s, v) => s + v.avgDuration, 0) /
                vendorsRecap.length,
            )
          : 0;
      const summaryRows = [
        [],
        ["", "TOTAL", totalAll, totalOnTime, totalLateV, avgAll],
      ];

      const sheetData = [...titleRows, headers, ...dataRows, ...summaryRows];
      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      // Column widths
      ws["!cols"] = [
        { wch: 5 }, // No
        { wch: 28 }, // Nama Vendor
        { wch: 14 }, // Total
        { wch: 14 }, // Tepat Waktu
        { wch: 14 }, // Terlambat
        { wch: 24 }, // Rata-rata
      ];

      // Merge title row
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Rekap Vendor");
    } else {
      // ===== HARIAN / KETERLAMBATAN SHEET =====
      const titleRows = [
        [`LAPORAN ${TAB_NAMES[activeTab].toUpperCase()}`],
        ["Break Monitor — Sistem Absensi Istirahat (Live Database)"],
        [
          `Tanggal: ${today}${filterVendor ? ` | Vendor: ${filterVendor}` : ""}`,
        ],
        [],
      ];

      const headers = [
        "No",
        "Nama Pekerja",
        "OPS ID",
        "Vendor",
        "Jam Keluar",
        "Jam Masuk",
        "Durasi (menit)",
        "Terlambat (menit)",
        "Status",
      ];
      const dataRows = filteredData.map((d, i) => [
        i + 1,
        d.name,
        d.ops,
        d.vendor,
        d.out,
        d.in,
        d.duration,
        d.late,
        d.late > 0 ? "TERLAMBAT" : "Tepat Waktu",
      ]);

      // Summary
      const summaryRows = [
        [],
        ["", "RINGKASAN", "", "", "", "", "", "", ""],
        [
          "",
          `Total Record: ${totalRecords}`,
          "",
          "",
          "",
          "",
          `Rata-rata: ${avgDuration} menit`,
          `Terlambat: ${totalLate} pekerja`,
          "",
        ],
      ];

      const sheetData = [...titleRows, headers, ...dataRows, ...summaryRows];
      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      // Column widths — auto-fit
      ws["!cols"] = [
        { wch: 5 }, // No
        { wch: 24 }, // Nama
        { wch: 14 }, // OPS
        { wch: 24 }, // Vendor
        { wch: 12 }, // Jam Keluar
        { wch: 12 }, // Jam Masuk
        { wch: 16 }, // Durasi
        { wch: 18 }, // Terlambat
        { wch: 14 }, // Status
      ];

      // Merge title rows
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
      ];

      XLSX.utils.book_append_sheet(wb, ws, TAB_NAMES[activeTab]);
    }

    // Export as .xlsx
    const fileName = `laporan-${activeTab}-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);

    setToast(`✅ "${fileName}" berhasil diexport!`);
    setTimeout(() => setToast(""), 3000);
  };

  if (loading)
    return (
      <div style={{ padding: 40, color: "var(--text-muted)" }}>
        Memuat Laporan...
      </div>
    );

  return (
    <div className={styles.page}>
      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={activeTab === "harian" ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab("harian")}>
          📋 Rekap Harian
        </button>
        <button
          className={
            activeTab === "keterlambatan" ? styles.tabActive : styles.tab
          }
          onClick={() => setActiveTab("keterlambatan")}>
          ⏰ Keterlambatan
        </button>
        <button
          className={activeTab === "vendor" ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab("vendor")}>
          🏢 Rekap Vendor
        </button>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <input
          type="date"
          className={styles.dateInput}
          defaultValue={new Date().toISOString().slice(0, 10)}
        />
        <span style={{ color: "var(--text-muted)" }}>s/d</span>
        <input
          type="date"
          className={styles.dateInput}
          defaultValue={new Date().toISOString().slice(0, 10)}
        />
        {activeTab !== "vendor" && (
          <select
            className={styles.filterSelect}
            value={filterVendor}
            onChange={(e) => setFilterVendor(e.target.value)}>
            <option value="">Semua Vendor</option>
            {vendorList.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        )}
        <button
          className={styles.exportBtn}
          onClick={handleExport}
          disabled={totalRecords === 0 && vendorsRecap.length === 0}>
          📥 Export Excel
        </button>
      </div>

      {/* Tab Content: Harian / Keterlambatan */}
      {(activeTab === "harian" || activeTab === "keterlambatan") && (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>No</th>
                <th>Pekerja</th>
                <th>OPS ID</th>
                <th>Vendor</th>
                <th>Jam Keluar</th>
                <th>Jam Masuk</th>
                <th>Durasi</th>
                {activeTab === "keterlambatan" && <th>Terlambat</th>}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeTab === "keterlambatan" ? 9 : 8}
                    style={{
                      textAlign: "center",
                      padding: "2rem",
                      color: "var(--text-muted)",
                    }}>
                    Belum ada rekaman istirahat hari ini.
                  </td>
                </tr>
              ) : (
                filteredData.map((d, i) => (
                  <tr
                    key={d.id}
                    className={d.late > 0 ? styles.rowOverdue : ""}>
                    <td>{i + 1}</td>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>{d.name.charAt(0)}</div>
                        {d.name}
                      </div>
                    </td>
                    <td>
                      <span className={styles.opsBadge}>{d.ops}</span>
                    </td>
                    <td>{d.vendor}</td>
                    <td>{d.out}</td>
                    <td>{d.in}</td>
                    <td>{d.duration} min</td>
                    {activeTab === "keterlambatan" && (
                      <td>
                        <span className={styles.lateMinutes}>
                          +{d.late} min
                        </span>
                      </td>
                    )}
                    <td>
                      {d.late > 0 ? (
                        <span className={styles.statusLate}>🔴 Terlambat</span>
                      ) : (
                        <span className={styles.statusOnTime}>
                          🟢 Tepat Waktu
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              Total:{" "}
              <span className={styles.summaryValue}>{totalRecords} record</span>
            </div>
            <div className={styles.summaryItem}>
              Rata-rata durasi:{" "}
              <span className={styles.summaryValue}>{avgDuration} menit</span>
            </div>
            <div className={styles.summaryItem}>
              Terlambat:{" "}
              <span
                className={styles.summaryValue}
                style={{ color: "var(--danger)" }}>
                {totalLate} pekerja
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Vendor Recap */}
      {activeTab === "vendor" && (
        <>
          {vendorsRecap.length === 0 ? (
            <div
              style={{
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "2rem",
              }}>
              Belum ada data istirahat per vendor hari ini.
            </div>
          ) : (
            <div className={styles.vendorStatGrid}>
              {vendorsRecap.map((v) => (
                <div key={v.name} className={styles.vendorStatCard}>
                  <div className={styles.vendorName}>{v.name}</div>
                  <div className={styles.vendorStats}>
                    <div className={styles.vendorStatItem}>
                      <div
                        className={`${styles.vendorStatValue} ${styles.colorPrimary}`}>
                        {v.total}
                      </div>
                      <div className={styles.vendorStatLabel}>Total Log</div>
                    </div>
                    <div className={styles.vendorStatItem}>
                      <div
                        className={`${styles.vendorStatValue} ${styles.colorSuccess}`}>
                        {v.onTime}
                      </div>
                      <div className={styles.vendorStatLabel}>Tepat Waktu</div>
                    </div>
                    <div className={styles.vendorStatItem}>
                      <div
                        className={`${styles.vendorStatValue} ${styles.colorDanger}`}>
                        {v.late}
                      </div>
                      <div className={styles.vendorStatLabel}>Terlambat</div>
                    </div>
                    <div className={styles.vendorStatItem}>
                      <div
                        className={`${styles.vendorStatValue} ${styles.colorWarning}`}>
                        {v.avgDuration}m
                      </div>
                      <div className={styles.vendorStatLabel}>Rata-rata</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Toast Notification */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
