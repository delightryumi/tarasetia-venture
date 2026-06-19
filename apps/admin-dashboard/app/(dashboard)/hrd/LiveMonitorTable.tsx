"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, getDocs } from "firebase/firestore";
import type { AttendanceLog, Staff } from "./types";
import styles from "./hrd.module.css";

interface Props {
  hotelCode: string;
}

const STATUS_BADGE: Record<string, string> = {
  hadir: styles.badgeHadir,
  terlambat: styles.badgeTerlambat,
  alpa: styles.badgeAlpa,
  izin: styles.badgeIzin,
  sakit: styles.badgeSakit,
  cuti: styles.badgeCuti,
};

export function LiveMonitorTable({ hotelCode }: Props) {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];
  const yyyyMM = today.slice(0, 7);

  // Fetch staffs for lookup
  useEffect(() => {
    if (!hotelCode) return;
    const fetchStaffs = async () => {
      try {
        const staffCol = collection(db, `hotels/${hotelCode}/staff`);
        const staffSnap = await getDocs(staffCol);
        const list = staffSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Staff));
        setStaffs(list);
      } catch (err) {
        console.error("Error loading staffs for LiveMonitor:", err);
      }
    };
    fetchStaffs();
  }, [hotelCode]);

  // Real-time listener for today's logs
  useEffect(() => {
    if (!hotelCode) return;
    const colRef = collection(db, `hotels/${hotelCode}/attendance/${yyyyMM}/logs`);
    const unsub = onSnapshot(colRef, (snap) => {
      const todayLogs: AttendanceLog[] = [];
      snap.forEach((d) => {
        const data = d.data() as AttendanceLog;
        if (data.date === today) todayLogs.push({ id: d.id, ...data } as AttendanceLog);
      });
      todayLogs.sort((a, b) => a.staffName.localeCompare(b.staffName));
      setLogs(todayLogs);
      setLoading(false);
    });
    return () => unsub();
  }, [hotelCode, yyyyMM, today]);

  const kpiHadir = logs.filter((l) => l.status === "hadir" || l.status === "terlambat").length;
  const kpiTerlambat = logs.filter((l) => l.status === "terlambat").length;
  const kpiAlpa = logs.filter((l) => l.status === "alpa").length;
  const kpiIzin = logs.filter((l) => ["izin", "sakit", "cuti"].includes(l.status)).length;

  if (loading) return <div className={styles.loading}>Memuat data absensi hari ini...</div>;

  return (
    <div>
      {/* KPI */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Hadir Hari Ini</p>
          <p className={styles.kpiValue} style={{ color: "#16a34a" }}>{kpiHadir}</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Terlambat</p>
          <p className={styles.kpiValue} style={{ color: "#d97706" }}>{kpiTerlambat}</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Alpa</p>
          <p className={styles.kpiValue} style={{ color: "#dc2626" }}>{kpiAlpa}</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Izin/Sakit/Cuti</p>
          <p className={styles.kpiValue} style={{ color: "#2563eb" }}>{kpiIzin}</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Total Terdata</p>
          <p className={styles.kpiValue}>{logs.length}</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader} style={{ flexWrap: "nowrap" }}>
          <p className={styles.cardTitle} style={{ flex: 1, paddingRight: 12, lineHeight: 1.4 }}>
            Absensi Hari Ini —{" "}
            {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <span style={{ fontSize: 11, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 }}>
            🔴 Live
          </span>
        </div>

        {logs.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>📭</div>
            <p className={styles.emptyStateText}>Belum ada absensi tercatat hari ini.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ whiteSpace: "nowrap" }}>Tanggal</th>
                  <th style={{ whiteSpace: "nowrap" }}>Nama</th>
                  <th style={{ whiteSpace: "nowrap" }}>Jabatan</th>
                  <th style={{ whiteSpace: "nowrap" }}>Divisi</th>
                  <th style={{ whiteSpace: "nowrap" }}>Status</th>
                  <th style={{ whiteSpace: "nowrap" }}>Clock In</th>
                  <th style={{ whiteSpace: "nowrap" }}>Clock Out</th>
                  <th style={{ whiteSpace: "nowrap" }}>Durasi (jam)</th>
                  <th style={{ whiteSpace: "nowrap" }}>Lembur (jam)</th>
                  <th style={{ whiteSpace: "nowrap" }}>Alasan</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const staff = staffs.find((s) => s.id === log.staffId);
                  const formatTime = (isoString?: string) => {
                    if (!isoString) return "—";
                    return new Date(isoString).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
                  };

                  return (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{log.date}</td>
                      <td style={{ fontWeight: 500, whiteSpace: "nowrap" }}>{log.staffName}</td>
                      <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{staff?.position || "—"}</td>
                      <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{staff?.division || "—"}</td>
                      <td>
                        <span className={`${styles.badge} ${STATUS_BADGE[log.status] || ""}`} style={{ width: "fit-content" }}>
                          {log.status?.toUpperCase()}
                          {log.status === "terlambat" && log.lateMinutes ? (() => {
                            const mins = log.lateMinutes;
                            if (mins < 60) return ` (${mins}m)`;
                            const hrs = Math.floor(mins / 60);
                            const rem = mins % 60;
                            return rem > 0 ? ` (${hrs}j ${rem}m)` : ` (${hrs}j)`;
                          })() : ""}
                        </span>
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: 13, whiteSpace: "nowrap" }}>
                        {formatTime(log.clockIn?.time)}
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: 13, whiteSpace: "nowrap" }}>
                        {formatTime(log.clockOut?.time)}
                      </td>
                      <td>
                        {log.durationMinutes > 0 ? (log.durationMinutes / 60).toFixed(1) : "—"}
                      </td>
                      <td style={{ fontWeight: log.overtimeMinutes > 0 ? 600 : 400, color: log.overtimeMinutes > 0 ? "#d97706" : undefined }}>
                        {log.overtimeMinutes > 0 ? (log.overtimeMinutes / 60).toFixed(1) : "—"}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--s-muted)", minWidth: 150, maxWidth: 280, whiteSpace: "normal", wordBreak: "break-word" }}>
                        {log.lateReason || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
