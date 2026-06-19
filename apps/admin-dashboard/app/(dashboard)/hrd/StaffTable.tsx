"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { StaffFormModal } from "./StaffFormModal";
import type { Staff, Shift } from "./types";
import styles from "./hrd.module.css";
import { toast } from "sonner";

interface Props {
  hotelCode: string;
  shifts: Shift[];
}

export function StaffTable({ hotelCode, shifts }: Props) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Staff | null>(null);
  const [resetTarget, setResetTarget] = useState<Staff | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    if (!hotelCode) return;
    const colRef = collection(db, `hotels/${hotelCode}/staff`);
    const q = query(colRef, orderBy("name"));
    const unsub = onSnapshot(q, (snap) => {
      setStaffList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Staff)));
      setLoading(false);
    });
    return () => unsub();
  }, [hotelCode]);

  const handleAdd = () => { setEditTarget(null); setShowModal(true); };
  const handleEdit = (s: Staff) => { setEditTarget(s); setShowModal(true); };
  
  const handleResetPin = (s: Staff) => {
    setResetTarget(s);
    setNewPin("");
  };

  const confirmResetPin = async () => {
    if (!resetTarget || newPin.length !== 6) return;
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const ref = doc(db, `hotels/${hotelCode}/staff/${resetTarget.id}`);
      await updateDoc(ref, { pin: newPin });
      toast.success(`PIN untuk ${resetTarget.name} berhasil direset.`);
      setResetTarget(null);
    } catch (e) {
      console.error(e);
      toast.error("Gagal mereset PIN");
    }
  };

  const handleDeactivate = async (s: Staff) => {
    if (!confirm(`Nonaktifkan karyawan ${s.name}? Akun login akan diblokir.`)) return;
    try {
      const res = await fetch("/api/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: s.id, hotelCode, isActive: false }),
      });
      if (!res.ok) throw new Error("Gagal menonaktifkan");
      toast.success(`Karyawan ${s.name} berhasil dinonaktifkan.`);
    } catch (e) {
      console.error(e);
      toast.error("Gagal menonaktifkan karyawan");
    }
  };

  const handleActivate = async (s: Staff) => {
    if (!confirm(`Aktifkan kembali karyawan ${s.name}?`)) return;
    try {
      const res = await fetch("/api/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: s.id, hotelCode, isActive: true }),
      });
      if (!res.ok) throw new Error("Gagal mengaktifkan");
      toast.success(`Karyawan ${s.name} diaktifkan kembali.`);
    } catch (e) {
      console.error(e);
      toast.error("Gagal mengaktifkan karyawan");
    }
  };

  const handleDelete = (s: Staff) => {
    setDeleteTarget(s);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/staff", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id, hotelCode }),
      });
      if (!res.ok) {
        throw new Error("Gagal menghapus karyawan");
      }
      toast.success(`Karyawan ${deleteTarget.name} beserta seluruh datanya berhasil dihapus bersih.`);
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
      toast.error("Gagal menghapus karyawan secara permanen.");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = staffList.filter((s) =>
    s.name.toLowerCase().includes(searchQ.toLowerCase()) ||
    s.position.toLowerCase().includes(searchQ.toLowerCase()) ||
    s.division.toLowerCase().includes(searchQ.toLowerCase())
  );

  if (loading) return <div className={styles.loading}>Memuat data staf...</div>;

  return (
    <div>
      <div className={styles.card}>
        <div className={styles.cardHeader} style={{ flexWrap: "nowrap", gap: "8px" }}>
          <p className={styles.cardTitle} style={{ flex: 1, fontSize: "clamp(12px, 3.5vw, 14px)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Daftar Karyawan ({staffList.filter(s => s.isActive !== false).length} aktif)
          </p>
          <button className={styles.btnPrimary} style={{ whiteSpace: "nowrap", padding: "6px 12px", fontSize: "12px", flexShrink: 0 }} onClick={handleAdd}>+ Tambah Staf</button>
        </div>

        {/* Search */}
        <div style={{ padding: "12px 32px", borderBottom: `1px solid var(--s-hairline)` }}>
          <input
            className={styles.formInput}
            placeholder="Cari nama, posisi, divisi..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            style={{ maxWidth: 320 }}
          />
        </div>

        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>👥</div>
            <p className={styles.emptyStateText}>Belum ada karyawan terdaftar. Klik "+ Tambah Staf" untuk mendaftarkan karyawan baru.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>NIK</th>
                  <th>Jabatan</th>
                  <th>Divisi</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  return (
                    <tr key={s.id}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 500 }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: "var(--s-muted)" }}>{s.phone}</div>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--s-muted)", whiteSpace: "nowrap" }}>{s.nik}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{s.position}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{s.division}</td>
                      <td>
                        <span className={`${styles.badge} ${s.isActive !== false ? styles.badgeHadir : styles.badgeAlpa}`}>
                          {s.isActive !== false ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                          <button className={styles.btnSecondary} style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => handleEdit(s)}>Edit</button>
                          <button className={styles.btnSecondary} style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => handleResetPin(s)}>Reset PIN</button>
                          {s.isActive !== false ? (
                            <button className={styles.btnDanger} style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => handleDeactivate(s)}>Nonaktifkan</button>
                          ) : (
                            <button className={styles.btnPrimary} style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => handleActivate(s)}>Aktifkan</button>
                          )}
                          <button className={styles.btnDangerSolid} style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => handleDelete(s)}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <StaffFormModal
          hotelCode={hotelCode}
          shifts={shifts}
          editTarget={editTarget}
          onClose={() => setShowModal(false)}
        />
      )}

      {resetTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--s-canvas)', padding: 24, borderRadius: 12, width: '100%', maxWidth: 360, border: '1px solid var(--s-hairline)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--s-ink)' }}>Reset PIN Karyawan</h3>
            <p style={{ fontSize: 13, color: 'var(--s-muted)', marginBottom: 16 }}>Masukkan 6 digit PIN baru untuk <strong>{resetTarget.name}</strong>.</p>
            <input
              type="text"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--s-secondary-btn-border)', background: 'var(--s-canvas)', color: 'var(--s-ink)', borderRadius: 8, fontSize: 18, letterSpacing: 4, textAlign: 'center', marginBottom: 20 }}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className={styles.btnSecondary} onClick={() => setResetTarget(null)}>Batal</button>
              <button className={styles.btnPrimary} onClick={confirmResetPin} disabled={newPin.length !== 6}>Simpan PIN Baru</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--s-canvas)', padding: 24, borderRadius: 12, width: '100%', maxWidth: 400, border: '1px solid var(--s-hairline)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#dc2626" }}>Hapus Karyawan Permanen</h3>
            <p style={{ fontSize: 13, color: 'var(--s-muted)', marginBottom: 16, lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menghapus <strong>{deleteTarget.name}</strong> secara permanen?
            </p>
            <div className={styles.errorBox} style={{ fontSize: 12, lineHeight: 1.4, padding: 12, marginBottom: 20 }}>
              <strong>⚠️ Peringatan:</strong> Tindakan ini bersifat destruktif dan tidak dapat dibatalkan. Seluruh data berikut milik karyawan ini akan ikut terhapus bersih dari sistem:
              <ul style={{ paddingLeft: 16, marginTop: 4, listStyleType: 'disc' }}>
                <li>Data profil & info NIK</li>
                <li>Seluruh riwayat log presensi (Clock In & Out)</li>
                <li>Semua berkas foto selfie presensi di Storage</li>
                <li>Seluruh berkas dokumen pengajuan izin & lampirannya</li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className={styles.btnSecondary} onClick={() => setDeleteTarget(null)} disabled={deleting}>Batal</button>
              <button 
                className={styles.btnDangerSolid} 
                style={{ display: 'flex', alignItems: 'center', gap: 6 }} 
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Menghapus..." : "Ya, Hapus Bersih"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
