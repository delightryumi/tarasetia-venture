"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import type { AttendanceLog } from "./types";
import styles from "./hrd.module.css";

interface Props {
  hotelCode: string;
}

export function OvertimeApprovalTable({ hotelCode }: Props) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const yyyyMM = today.slice(0, 7);

  useEffect(() => {
    if (!hotelCode) return;
    // Listen to current month overtime flags
    const colRef = collection(db, `hotels/${hotelCode}/attendance/${yyyyMM}/logs`);
    const q = query(colRef, where("overtimeApproved", "==", null));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as AttendanceLog))
        .filter((l) => l.overtimeMinutes > 0);
      list.sort((a, b) => b.date.localeCompare(a.date));
      setLogs(list);
      setLoading(false);
    });
    return () => unsub();
  }, [hotelCode, yyyyMM]);

  const handleApprove = async (log: AttendanceLog, approved: boolean) => {
    setProcessing(log.id);
    try {
      await fetch("/api/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelCode,
          yyyyMM,
          logId: log.id,
          correctedBy: (user as any)?.name || user?.email || "HRD",
          correctionNote: approved ? "Lembur disetujui" : "Lembur tidak disetujui",
          overrides: { overtimeApproved: approved },
        }),
      });
    } catch {
      alert("Gagal memproses lembur.");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className={styles.loading}>Memuat data lembur...</div>;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <p className={styles.cardTitle}>Lembur Menunggu Persetujuan</p>
        <span style={{ fontSize: 11, color: "var(--s-muted)" }}>
          Bulan ini: {logs.length} pending
        </span>
      </div>

      {logs.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>⏱</div>
          <p className={styles.emptyStateText}>Tidak ada lembur yang perlu disetujui bulan ini.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Tanggal</th>
                <th>Durasi Lembur</th>
                <th>Clock Out</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const otH = Math.floor(log.overtimeMinutes / 60);
                const otM = log.overtimeMinutes % 60;
                const cout = log.clockOut?.time
                  ? new Date(log.clockOut.time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                  : "—";
                const dateLabel = new Date(log.date + "T00:00:00").toLocaleDateString("id-ID", {
                  weekday: "short", day: "numeric", month: "short",
                });
                return (
                  <tr key={log.id}>
                    <td style={{ fontWeight: 500 }}>{log.staffName}</td>
                    <td style={{ fontSize: 12 }}>{dateLabel}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: "#d97706" }}>
                        {otH > 0 ? `${otH}j ` : ""}{otM}m
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{cout}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className={styles.btnApprove}
                          disabled={processing === log.id}
                          onClick={() => handleApprove(log, true)}
                        >
                          ✅ Setuju
                        </button>
                        <button
                          className={styles.btnReject}
                          disabled={processing === log.id}
                          onClick={() => handleApprove(log, false)}
                        >
                          ❌ Tolak
                        </button>
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
  );
}
