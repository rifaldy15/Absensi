"use client";

import { useState, useMemo, useEffect } from "react";
import styles from "@/components/shared/CrudPage.module.css";
import { SHIFTS, type Shift } from "@/lib/mock-data";

interface Vendor {
  id: string;
  name: string;
  workers: any[];
}

export default function DataVendorPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<"add" | "edit" | "delete" | null>(
    null,
  );
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({
    name: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vendors");
      const data = await res.json();
      setVendors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return vendors;
    const q = search.toLowerCase();
    return vendors.filter((v) => v.name.toLowerCase().includes(q));
  }, [vendors, search]);

  const openAdd = () => {
    setFormData({
      name: "",
    });
    setEditing(null);
    setModalMode("add");
  };

  const openEdit = (v: Vendor) => {
    setFormData({
      name: v.name,
    });
    setEditing(v);
    setModalMode("edit");
  };

  const openDelete = (v: Vendor) => {
    setEditing(v);
    setModalMode("delete");
  };

  const handleSave = async () => {
    if (!formData.name) return;
    try {
      if (modalMode === "add") {
        await fetch("/api/vendors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else if (modalMode === "edit" && editing) {
        await fetch(`/api/vendors/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      setModalMode(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to save vendor.");
    }
  };

  const handleDelete = async () => {
    if (editing) {
      try {
        await fetch(`/api/vendors/${editing.id}`, {
          method: "DELETE",
        });
        setModalMode(null);
        fetchData();
      } catch (err) {
        console.error(err);
        alert("Failed to delete vendor. Ensure no worker is attached to it.");
      }
    }
  };

  if (loading && vendors.length === 0)
    return (
      <div style={{ padding: 40, color: "var(--text-muted)" }}>
        Memuat data vendor...
      </div>
    );

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Cari vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className={styles.addBtn} onClick={openAdd}>
          + Tambah Vendor
        </button>
      </div>

      <div className={styles.tableWrap}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>Tidak ada data vendor ditemukan.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Vendor</th>
                <th>Total Pekerja (DB)</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => {
                const total = v.workers ? v.workers.length : 0;
                return (
                  <tr key={v.id}>
                    <td>{i + 1}</td>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>{v.name.charAt(0)}</div>
                        <span className={styles.nameText}>{v.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.vendorCount}>👥 {total}</span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => openEdit(v)}>
                          ✏️ Edit
                        </button>
                        <button
                          className={styles.actionBtnDanger}
                          onClick={() => openDelete(v)}>
                          🗑️ Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.pagination}>
        <span className={styles.pageInfo}>Total {filtered.length} vendor</span>
      </div>

      {/* Add / Edit Modal */}
      {(modalMode === "add" || modalMode === "edit") && (
        <div className={styles.modalOverlay} onClick={() => setModalMode(null)}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 560 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalMode === "add" ? "➕ Tambah Vendor" : "✏️ Edit Vendor"}
              </h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setModalMode(null)}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Nama Vendor</label>
                <input
                  className={styles.formInput}
                  placeholder="PT / CV ..."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                  marginTop: "8px",
                }}>
                Note: PIC dan Kontak disederhanakan pada versi Database Live
                ini. Informasi distribusi shift pekerja akan dihitung secara
                live dari data pekerja yang ditautkan ke vendor ini.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelBtn}
                onClick={() => setModalMode(null)}>
                Batal
              </button>
              <button className={styles.saveBtn} onClick={handleSave}>
                {loading ? "..." : "💾 Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modalMode === "delete" && editing && (
        <div className={styles.modalOverlay} onClick={() => setModalMode(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>🗑️ Hapus Vendor</h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setModalMode(null)}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.deleteMsg}>
                Yakin ingin menghapus vendor
                <br />
                <span className={styles.deleteName}>{editing.name}</span>?
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelBtn}
                onClick={() => setModalMode(null)}>
                Batal
              </button>
              <button
                className={styles.deleteBtnConfirm}
                onClick={handleDelete}>
                🗑️ Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
