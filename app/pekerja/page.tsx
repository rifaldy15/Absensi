"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import styles from "@/components/shared/CrudPage.module.css";
import impStyles from "./import.module.css";
import {
  SHIFTS,
  type Shift,
  getShiftEndTime,
  isShiftExpired,
} from "@/lib/mock-data";

interface Vendor {
  id: string;
  name: string;
}

interface Worker {
  id: string;
  name: string;
  ops: string;
  vendorId: string;
  vendor: string; // resolved vendor name for UI display
  shift: Shift;
}

const PER_PAGE = 10;

export default function DataPekerjaPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [dynamicShifts, setDynamicShifts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterVendor, setFilterVendor] = useState("");
  const [filterShift, setFilterShift] = useState("");
  const [page, setPage] = useState(1);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "delete" | null>(
    null,
  );
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    ops: "",
    vendorId: "",
    shift: "" as Shift,
  });
  const [toast, setToast] = useState("");

  // Import states
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState<Worker[]>([]);
  const [importError, setImportError] = useState("");
  const [importFileName, setImportFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wRes, vRes, sRes] = await Promise.all([
        fetch("/api/workers"),
        fetch("/api/vendors"),
        fetch("/api/settings"),
      ]);
      const wData = await wRes.json();
      const vData = await vRes.json();
      const sData = await sRes.json();

      setVendors(vData);
      
      const shiftsArr = sData.activeShifts ? sData.activeShifts.split(",").map((s: string) => s.trim()) : [];
      setDynamicShifts(shiftsArr);

      const mappedWorkers = wData.map((w: any) => ({
        id: w.id,
        name: w.name,
        ops: w.ops,
        vendorId: w.vendor?.id,
        vendor: w.vendor?.name || "Tanpa Vendor",
        shift: w.shift,
      }));
      setWorkers(mappedWorkers);

      if (vData.length > 0) {
        setFormData((prev) => ({ 
          ...prev, 
          vendorId: vData[0].id,
          shift: shiftsArr.length > 0 ? shiftsArr[0] as Shift : "" as Shift
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered & paginated
  const filtered = useMemo(() => {
    return workers.filter((w) => {
      const matchSearch =
        !search ||
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.ops.toLowerCase().includes(search.toLowerCase());
      const matchVendor = !filterVendor || w.vendor === filterVendor;
      const matchShift = !filterShift || w.shift === filterShift;
      return matchSearch && matchVendor && matchShift;
    });
  }, [workers, search, filterVendor, filterShift]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openAdd = () => {
    setFormData({
      name: "",
      ops: "",
      vendorId: vendors.length > 0 ? vendors[0].id : "",
      shift: dynamicShifts.length > 0 ? dynamicShifts[0] as Shift : "" as Shift,
    });
    setEditingWorker(null);
    setModalMode("add");
  };

  const openEdit = (w: Worker) => {
    setFormData({
      name: w.name,
      ops: w.ops,
      vendorId: w.vendorId,
      shift: w.shift,
    });
    setEditingWorker(w);
    setModalMode("edit");
  };

  const openDelete = (w: Worker) => {
    setEditingWorker(w);
    setModalMode("delete");
  };

  const handleSave = async () => {
    if (!formData.name || !formData.ops || !formData.vendorId) return;

    try {
      if (modalMode === "add") {
        await fetch("/api/workers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        setToast("Pekerja berhasil ditambahkan!");
      } else if (modalMode === "edit" && editingWorker) {
        await fetch(`/api/workers/${editingWorker.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        setToast("Pekerja berhasil diubah!");
      }
      setTimeout(() => setToast(""), 3000);
      setModalMode(null);
      fetchData(); // Refresh list
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan data.");
    }
  };

  const handleDelete = async () => {
    if (editingWorker) {
      try {
        await fetch(`/api/workers/${editingWorker.id}`, {
          method: "DELETE",
        });
        setToast("Pekerja berhasil dihapus!");
        setTimeout(() => setToast(""), 3000);
        setModalMode(null);
        fetchData();
      } catch (err) {
        console.error(err);
        alert("Gagal menghapus data.");
      }
    }
  };

  // ========== EXCEL IMPORT ==========
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    setImportError("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

        if (json.length === 0) {
          setImportError("File Excel kosong.");
          return;
        }

        // Find best match vendor id by name
        const matchVendorId = (nameStr: string) => {
          const v = vendors.find(
            (v) => v.name.toLowerCase() === nameStr.toLowerCase(),
          );
          return v ? v.id : vendors[0]?.id;
        };

        const mapped: Worker[] = json.map((row, i) => {
          const vname = String(row["Vendor"] || row["vendor"] || "").trim();
          return {
            id: `import-${Date.now()}-${i}`,
            name: String(
              row["Nama"] || row["nama"] || row["Name"] || "",
            ).trim(),
            ops: String(row["OPS"] || row["ops"] || row["OPS ID"] || "").trim(),
            vendorId: matchVendorId(vname),
            vendor: vname,
            shift: String(
              row["Shift"] || row["shift"] || "08:00",
            ).trim() as Shift,
          };
        });

        const valid = mapped.filter((w) => w.name && w.ops && w.vendorId);
        if (valid.length === 0) {
          setImportError(
            'Tidak ditemukan data valid. Pastikan kolom "Nama" dan "OPS" ada, dan ada Vendor tersedia.',
          );
          return;
        }

        setImportData(valid);
        setShowImport(true);
      } catch {
        setImportError(
          "Gagal membaca file. Pastikan format .xlsx / .xls / .csv.",
        );
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImportConfirm = async () => {
    try {
      // In a real app we would send a batch POST request. For simplicity:
      for (const w of importData) {
        await fetch("/api/workers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: w.name,
            ops: w.ops,
            shift: w.shift,
            vendorId: w.vendorId,
          }),
        });
      }

      setShowImport(false);
      setImportData([]);
      setToast(`✅ ${importData.length} pekerja berhasil diimport!`);
      setTimeout(() => setToast(""), 3000);
      fetchData();
    } catch (err) {
      alert("Gagal mengimport sebagian atau seluruh data.");
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        Nama: "Contoh Pekerja 1",
        OPS: "OPS1700001",
        Vendor: vendors[0]?.name || "PT Contoh",
        Shift: "08:00",
      },
      {
        Nama: "Contoh Pekerja 2",
        OPS: "OPS1700002",
        Vendor: vendors[0]?.name || "PT Contoh",
        Shift: "15:00",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    ws["!cols"] = [{ wch: 20 }, { wch: 14 }, { wch: 24 }, { wch: 8 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Pekerja");
    XLSX.writeFile(wb, "template_data_pekerja.xlsx");
  };

  const importVendorSummary = useMemo(() => {
    const map = new Map<string, number>();
    importData.forEach((w) =>
      map.set(
        w.vendor || "(Tanpa Vendor)",
        (map.get(w.vendor || "(Tanpa Vendor)") || 0) + 1,
      ),
    );
    return Array.from(map.entries());
  }, [importData]);

  if (loading && workers.length === 0)
    return (
      <div style={{ padding: 40, color: "var(--text-muted)" }}>
        Memuat data pekerja...
      </div>
    );

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Cari nama atau OPS ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filterVendor}
          onChange={(e) => {
            setFilterVendor(e.target.value);
            setPage(1);
          }}>
          <option value="">Semua Vendor</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.name}>
              {v.name}
            </option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          value={filterShift}
          onChange={(e) => {
            setFilterShift(e.target.value);
            setPage(1);
          }}>
          <option value="">Semua Shift</option>
          {dynamicShifts.map((s) => (
            <option key={s} value={s}>
              Shift {s}
            </option>
          ))}
        </select>
        <label className={impStyles.importBtn}>
          📥 Import Excel
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
        </label>
        <button className={styles.addBtn} onClick={openAdd}>
          + Tambah Pekerja
        </button>
      </div>

      {/* Expired shift info removed */}

      {/* Table */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Pekerja</th>
              <th>OPS ID</th>
              <th>Vendor</th>
              <th>Shift</th>
              <th className={styles.actionCol}>Status</th>
              <th className={styles.actionCol}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  Tidak ada data pekerja ditemukan
                </td>
              </tr>
            ) : (
              paginated.map((w) => {
                return (
                  <tr key={w.id}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.avatar}>{w.name.charAt(0)}</div>
                        <div className={styles.nameWrap}>
                          <div className={styles.userName}>{w.name}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.opsBadge}>{w.ops}</span>
                    </td>
                    <td>{w.vendor}</td>
                    <td>
                      <div className={styles.shiftCol}>
                        <span className={styles.shiftBadge}>
                          {w.shift} - {getShiftEndTime(w.shift)}
                        </span>
                      </div>
                    </td>
                    <td className={styles.actionCol}>
                      <span className={styles.statusActive}>Aktif</span>
                    </td>
                    <td className={styles.actionCol}>
                      <button
                        className={styles.iconBtn}
                        title="Edit"
                        onClick={() => openEdit(w)}>
                        ✎
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.iconDanger}`}
                        title="Hapus"
                        onClick={() => openDelete(w)}>
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Info */}
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Menampilkan {paginated.length} dari {filtered.length} pekerja
          </span>
          <div className={styles.pageControls}>
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className={styles.pageBtn}>
              ← Prev
            </button>
            <span className={styles.pageCurrent}>
              Halaman {Math.max(1, page)} / {Math.max(1, totalPages)}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className={styles.pageBtn}>
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Modal Import Excel */}
      {showImport && (
        <div className={styles.modalOverlay}>
          <div className={impStyles.importModal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>📄 Konfirmasi Import Data</h2>
              <button
                className={styles.closeBtn}
                onClick={() => {
                  setShowImport(false);
                  setImportData([]);
                }}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={impStyles.importDesc}>
                File <strong>{importFileName}</strong> berhasil dibaca.
                Ditemukan <strong>{importData.length}</strong> data pekerja yang
                valid untuk ditambahkan.
              </p>

              <div className={impStyles.importSummary}>
                <h4 style={{ marginBottom: "8px", fontSize: "0.85rem" }}>
                  Ringkasan Vendor:
                </h4>
                <ul className={impStyles.summaryList}>
                  {importVendorSummary.map(([v, count]) => (
                    <li key={v}>
                      <span>{v}</span>
                      <strong>{count} pekerja</strong>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={impStyles.importPreview}>
                <table className={styles.table} style={{ fontSize: "0.85rem" }}>
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>OPS</th>
                      <th>Vendor</th>
                      <th>Shift</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importData.slice(0, 5).map((w, i) => (
                      <tr key={i}>
                        <td>{w.name}</td>
                        <td>{w.ops}</td>
                        <td>{w.vendor}</td>
                        <td>{w.shift}</td>
                      </tr>
                    ))}
                    {importData.length > 5 && (
                      <tr>
                        <td
                          colSpan={4}
                          style={{
                            textAlign: "center",
                            color: "var(--text-muted)",
                          }}>
                          ... dan {importData.length - 5} lainnya
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.btnSecondary}
                onClick={() => {
                  setShowImport(false);
                  setImportData([]);
                }}>
                Batal
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleImportConfirm}>
                🚀 Import {importData.length} Pekerja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit */}
      {(modalMode === "add" || modalMode === "edit") && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBody}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {modalMode === "add" ? "Tambah Pekerja Baru" : "Edit Pekerja"}
              </h2>
              <button
                className={styles.closeBtn}
                onClick={() => setModalMode(null)}>
                ×
              </button>
            </div>
            <div className={styles.formGroup}>
              <label>Nama Lengkap</label>
              <input
                className={styles.formInput}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Ahmad Fauzi"
              />
            </div>
            <div className={styles.formGroup}>
              <label>OPS Identifier (ID Scanner)</label>
              <input
                className={styles.formInput}
                value={formData.ops}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ops: e.target.value.toUpperCase(),
                  })
                }
                placeholder="Ex: OPS1702656"
              />
              <span className={impStyles.templateHint}>
                ID unik atau Nomor OPS, ini yang akan dicari oleh scanner di
                Scan Station
              </span>
            </div>
            <div className={styles.formGroup}>
              <label>Vendor Asal</label>
              <select
                className={styles.formSelect}
                value={formData.vendorId}
                onChange={(e) =>
                  setFormData({ ...formData, vendorId: e.target.value })
                }>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Shift Kerja (Wajib)</label>
              <select
                className={styles.formSelect}
                value={formData.shift}
                onChange={(e) =>
                  setFormData({ ...formData, shift: e.target.value as Shift })
                }>
                {dynamicShifts.map((s) => (
                  <option key={s} value={s}>
                    Shift {s} - {getShiftEndTime(s as Shift)}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.btnSecondary}
                onClick={() => setModalMode(null)}>
                Batal
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleSave}
                disabled={
                  !formData.name || !formData.ops || !formData.vendorId
                }>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {modalMode === "delete" && editingWorker && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBody}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Konfirmasi Hapus</h2>
            </div>
            <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
              Apakah Anda yakin ingin menghapus{" "}
              <strong>{editingWorker.name}</strong> ({editingWorker.ops})? Data
              log absensinya mungkin akan terpengaruh.
            </p>
            <div className={styles.modalFooter}>
              <button
                className={styles.btnSecondary}
                onClick={() => setModalMode(null)}>
                Batal
              </button>
              <button
                className={`${styles.btnPrimary} ${styles.btnDanger}`}
                onClick={handleDelete}>
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Basic Toast Notification */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
