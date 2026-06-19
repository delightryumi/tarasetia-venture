"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import type { Shift } from "./types";
import { ShiftFormModal } from "./ShiftFormModal";
import styles from "./hrd.module.css";

interface Props {
  hotelCode: string;
  onShiftsLoaded?: (shifts: Shift[]) => void;
}

export function ShiftTable({ hotelCode, onShiftsLoaded }: Props) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Shift | null>(null);

  useEffect(() => {
    if (!hotelCode) return;
    const colRef = collection(db, `hotels/${hotelCode}/shifts`);
    const unsub = onSnapshot(colRef, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shift));
      setShifts(list);
      onShiftsLoaded?.(list);
      setLoading(false);
    });
    return () => unsub();
  }, [hotelCode, onShiftsLoaded]);

  const handleDelete = async (s: Shift) => {
    if (!confirm(`Hapus shift "${s.name}"? Karyawan yang menggunakan shift ini perlu diperbarui.`)) return;
    await deleteDoc(doc(db, `hotels/${hotelCode}/shifts/${s.id}`));
  };

  if (loading) return <div className={styles.loading}>Memuat data shift...</div>;

  return (
    <div>
      <div className={styles.card}>
        <div className={styles.cardHeader} style={{ flexWrap: "nowrap", gap: "8px" }}>
          <p className={styles.cardTitle} style={{ flex: 1, fontSize: "clamp(12px, 3.5vw, 14px)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Daftar Shift Kerja</p>
          <button className={styles.btnPrimary} style={{ whiteSpace: "nowrap", padding: "6px 12px", fontSize: "12px", flexShrink: 0 }} onClick={() => { setEditTarget(null); setShowModal(true); }}>
            + Tambah Shift
          </button>
        </div>

        {shifts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>🕐</div>
            <p className={styles.emptyStateText}>Belum ada shift. Buat shift terlebih dahulu sebelum mendaftarkan karyawan.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nama Shift</th>
                  <th>Jam Masuk</th>
                  <th>Jam Keluar</th>
                  <th>Toleransi Terlambat</th>
                  <th>Masa Jam Kerja</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td>{s.startTime}</td>
                    <td>{s.endTime}</td>
                    <td>{s.toleranceMinutes} menit</td>
                    <td>{(s as any).minimumWorkHours ?? 8} jam</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className={styles.btnSecondary} style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => { setEditTarget(s); setShowModal(true); }}>
                          Edit
                        </button>
                        <button className={styles.btnDanger} style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => handleDelete(s)}>
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <ShiftFormModal
          hotelCode={hotelCode}
          editTarget={editTarget}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
