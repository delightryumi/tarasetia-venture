"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import type { Announcement, Staff } from "./types";
import styles from "./hrd.module.css";

interface Props {
  hotelCode: string;
  onClose: () => void;
  onSuccess: () => void;
  editTarget?: Announcement | null;
}

export function AnnouncementFormModal({ hotelCode, onClose, onSuccess, editTarget }: Props) {
  const { user } = useAuth();
  const isEdit = !!editTarget;

  const [form, setForm] = useState({
    title: editTarget?.title || "",
    text: editTarget?.text || "",
    type: editTarget?.type || "info",
    target: editTarget?.target || "all",
    targetStaffIds: editTarget?.targetStaffIds || [] as string[],
    active: editTarget?.active ?? true,
  });

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch staff list if target could be specific
    const fetchStaff = async () => {
      setLoadingStaff(true);
      try {
        const q = query(collection(db, `hotels/${hotelCode}/staff`), where("isActive", "==", true));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Staff));
        setStaffList(data);
      } catch (err) {
        console.error("Error fetching staff for announcement:", err);
      } finally {
        setLoadingStaff(false);
      }
    };
    fetchStaff();
  }, [hotelCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.target === "specific" && form.targetStaffIds.length === 0) {
      setError("Pilih setidaknya satu karyawan untuk notifikasi spesifik.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const collRef = collection(db, `hotels/${hotelCode}/announcements`);
      const docRef = isEdit ? doc(collRef, editTarget.id) : doc(collRef);
      
      const payload: Announcement = {
        id: docRef.id,
        title: form.title,
        text: form.text,
        type: form.type as any,
        target: form.target as any,
        targetStaffIds: form.target === "all" ? [] : form.targetStaffIds,
        active: form.active,
        createdAt: isEdit ? editTarget.createdAt : new Date().toISOString(),
        createdBy: isEdit ? editTarget.createdBy : ((user as any)?.name || user?.email || "admin"),
      };

      await setDoc(docRef, payload, { merge: true });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan pengumuman.");
    } finally {
      setSaving(false);
    }
  };

  const handleStaffToggle = (staffId: string) => {
    setForm(f => {
      const exists = f.targetStaffIds.includes(staffId);
      if (exists) {
        return { ...f, targetStaffIds: f.targetStaffIds.filter(id => id !== staffId) };
      } else {
        return { ...f, targetStaffIds: [...f.targetStaffIds, staffId] };
      }
    });
  };

  return (
    <div className={styles.modalBackdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <p className={styles.modalTitle}>{isEdit ? "Edit Pengumuman" : "Buat Pengumuman Baru"}</p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--s-muted)" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && (
              <div className={styles.errorBox}>
                {error}
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Judul Pengumuman *</label>
              <input 
                className={styles.formInput} 
                value={form.title} 
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} 
                required 
                placeholder="Misal: INFO PENTING / PERINGATAN" 
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Isi Pesan *</label>
              <textarea 
                className={styles.formInput} 
                value={form.text} 
                onChange={(e) => setForm(f => ({ ...f, text: e.target.value }))} 
                required 
                placeholder="Ketik detail pesan di sini..." 
                style={{ minHeight: "80px", resize: "vertical", fontFamily: "inherit" }}
              />
            </div>

            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tipe Notifikasi *</label>
                <select className={styles.formInput} value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value as any }))}>
                  <option value="info">Info (Biru)</option>
                  <option value="warning">Peringatan (Kuning/Merah)</option>
                  <option value="success">Sukses (Hijau)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Target Penerima *</label>
                <select className={styles.formInput} value={form.target} onChange={(e) => setForm(f => ({ ...f, target: e.target.value as any }))}>
                  <option value="all">Semua Karyawan (Broadcast)</option>
                  <option value="specific">Karyawan Tertentu (Targeted)</option>
                </select>
              </div>
            </div>

            {form.target === "specific" && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Pilih Karyawan Spesifik *</label>
                {loadingStaff ? (
                  <p style={{ fontSize: 13, color: "var(--s-muted)" }}>Memuat staf...</p>
                ) : (
                  <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid var(--s-border)", borderRadius: 6, padding: 8 }}>
                    {staffList.length === 0 ? (
                      <p style={{ fontSize: 13, color: "var(--s-muted)", margin: 0 }}>Belum ada staf yang terdaftar/aktif.</p>
                    ) : (
                      staffList.map(staff => (
                        <div key={staff.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <input 
                            type="checkbox" 
                            id={`staff-${staff.id}`} 
                            checked={form.targetStaffIds.includes(staff.id)}
                            onChange={() => handleStaffToggle(staff.id)}
                            style={{ cursor: "pointer", accentColor: "var(--s-brand)" }}
                          />
                          <label htmlFor={`staff-${staff.id}`} style={{ fontSize: 13, cursor: "pointer" }}>
                            {staff.name} <span style={{ color: "var(--s-muted)" }}>({staff.division} - {staff.position})</span>
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
              <input
                type="checkbox"
                id="announceActive"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--s-brand)" }}
              />
              <label htmlFor="announceActive" style={{ fontSize: 13, fontWeight: 600, color: "var(--s-ink)", cursor: "pointer" }}>
                Aktif (Tampilkan di Portal)
              </label>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Batal</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Pengumuman"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
