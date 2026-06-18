"use client";

import React, { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import type { Shift } from "./types";
import styles from "./hrd.module.css";

interface Props {
  hotelCode: string;
  editTarget: Shift | null;
  onClose: () => void;
}

export function ShiftFormModal({ hotelCode, editTarget, onClose }: Props) {
  const isEdit = !!editTarget;
  const [form, setForm] = useState({
    name:             editTarget?.name || "",
    startTime:        editTarget?.startTime || "07:00",
    endTime:          editTarget?.endTime || "15:00",
    toleranceMinutes: editTarget?.toleranceMinutes ?? 15,
    minimumWorkHours: (editTarget as any)?.minimumWorkHours ?? 8,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updateDoc(doc(db, `hotels/${hotelCode}/shifts/${editTarget!.id}`), { ...form });
      } else {
        await addDoc(collection(db, `hotels/${hotelCode}/shifts`), { ...form });
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <p className={styles.modalTitle}>{isEdit ? "Edit Shift" : "Tambah Shift Baru"}</p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--s-muted)" }}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && (
              <div style={{ padding: 10, background: "#fef2f2", borderRadius: 8, fontSize: 13, color: "#b91c1c", marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nama Shift *</label>
              <input className={styles.formInput} value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Pagi / Siang / Malam" />
            </div>

            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Jam Masuk *</label>
                <input type="time" className={styles.formInput} value={form.startTime} onChange={(e) => set("startTime", e.target.value)} required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Jam Keluar *</label>
                <input type="time" className={styles.formInput} value={form.endTime} onChange={(e) => set("endTime", e.target.value)} required />
              </div>
            </div>

            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Toleransi Keterlambatan (menit)</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={form.toleranceMinutes}
                  onChange={(e) => set("toleranceMinutes", parseInt(e.target.value) || 0)}
                  min={0}
                  max={60}
                  placeholder="15"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Masa Jam Kerja (jam wajib)</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={form.minimumWorkHours}
                  onChange={(e) => set("minimumWorkHours", parseFloat(e.target.value) || 0)}
                  min={1}
                  max={24}
                  step={0.5}
                  placeholder="8"
                  required
                />
              </div>
            </div>
            <span style={{ fontSize: 11, color: "var(--s-muted)", display: "block", marginTop: -8, marginBottom: 12 }}>
              Karyawan terlambat hingga {form.toleranceMinutes} menit masih dihitung "Hadir". Lembur dihitung jika total durasi jam kerja riil melebihi {form.minimumWorkHours} jam.
            </span>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Batal</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? "Menyimpan..." : isEdit ? "Simpan" : "Tambah Shift"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
