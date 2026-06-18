"use client";

import React, { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import type { AttendanceLog } from "./types";
import styles from "./hrd.module.css";

type AttendanceStatus = "hadir" | "terlambat" | "alpa" | "izin" | "sakit" | "cuti";

interface Props {
  hotelCode: string;
  log: AttendanceLog;
  yyyyMM: string;
  onClose: () => void;
}

export function ManualCorrectionModal({ hotelCode, log, yyyyMM, onClose }: Props) {
  const { user } = useAuth();
  const [status, setStatus] = useState<AttendanceStatus>(log.status as AttendanceStatus);
  const [clockIn, setClockIn] = useState(log.clockIn?.time ? new Date(log.clockIn.time).toTimeString().slice(0, 5) : "");
  const [clockOut, setClockOut] = useState(log.clockOut?.time ? new Date(log.clockOut.time).toTimeString().slice(0, 5) : "");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) { setError("Catatan koreksi wajib diisi."); return; }
    setSaving(true);
    setError(null);

    try {
      const overrides: any = { status };
      if (clockIn) {
        const t = new Date(`${log.date}T${clockIn}:00`).toISOString();
        overrides["clockIn.time"] = t;
      }
      if (clockOut) {
        const t = new Date(`${log.date}T${clockOut}:00`).toISOString();
        overrides["clockOut.time"] = t;
        if (clockIn) {
          const dur = Math.round((new Date(`${log.date}T${clockOut}:00`).getTime() - new Date(`${log.date}T${clockIn}:00`).getTime()) / 60000);
          overrides.durationMinutes = Math.max(0, dur);
        }
      }

      const res = await fetch("/api/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelCode,
          yyyyMM,
          logId: log.id,
          correctedBy: (user as any)?.name || user?.email || "HRD",
          correctionNote: note.trim(),
          overrides,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan koreksi");
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
          <p className={styles.modalTitle}>Koreksi Manual — {log.staffName}</p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--s-muted)" }}>✕</button>
        </div>
        <form onSubmit={handleSave}>
          <div className={styles.modalBody}>
            <div style={{ padding: 10, background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, marginBottom: 16, fontSize: 12, color: "#92400e" }}>
              ⚠️ Koreksi manual tercatat dalam audit trail. Pastikan alasan valid dan dapat dipertanggungjawabkan.
            </div>

            {error && (
              <div style={{ padding: 10, background: "#fef2f2", borderRadius: 8, fontSize: 13, color: "#b91c1c", marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, color: "var(--s-muted)", margin: "0 0 4px" }}>Tanggal: <strong>{log.date}</strong></p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Status Absensi</label>
              <select className={styles.formInput} value={status} onChange={(e) => setStatus(e.target.value as AttendanceStatus)}>
                <option value="hadir">Hadir</option>
                <option value="terlambat">Terlambat</option>
                <option value="alpa">Alpa</option>
                <option value="izin">Izin</option>
                <option value="sakit">Sakit</option>
                <option value="cuti">Cuti</option>
              </select>
            </div>

            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Jam Clock In</label>
                <input type="time" className={styles.formInput} value={clockIn} onChange={(e) => setClockIn(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Jam Clock Out</label>
                <input type="time" className={styles.formInput} value={clockOut} onChange={(e) => setClockOut(e.target.value)} />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Catatan Koreksi (Audit Trail) *</label>
              <textarea
                className={styles.formInput}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                required
                placeholder="Jelaskan alasan koreksi secara detail..."
                style={{ resize: "none" }}
              />
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Batal</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Koreksi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
