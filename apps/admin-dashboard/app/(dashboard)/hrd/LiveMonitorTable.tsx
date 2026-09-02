"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, getDocs, query, where } from "firebase/firestore";
import type { AttendanceLog, Staff, Shift } from "./types";
import { AttendancePhotoThumbnail } from "./AttendancePhotoThumbnail";
import { AttendancePhotoModal, type AttendancePhotoModalData } from "./AttendancePhotoModal";
import styles from "./hrd.module.css";

interface Props {
  hotelCode: string;
  shifts?: Shift[];
}

export function formatLateBadge(log: AttendanceLog, shift?: Shift): string {
  if (log.status !== "terlambat") return "";
  let mins = 0;
  if (log.clockIn?.time && shift?.startTime) {
    const [shH, shM] = shift.startTime.split(":").map(Number);
    const shiftStart = new Date(`${log.date}T${String(shH).padStart(2, "0")}:${String(shM).padStart(2, "0")}:00+07:00`);
    const clockInTime = new Date(log.clockIn.time);
    const diffMs = clockInTime.getTime() - shiftStart.getTime();
    if (diffMs > 0) {
      mins = Math.round(diffMs / 60000);
    }
  }
  if (!mins && typeof log.lateMinutes === "number" && log.lateMinutes > 0) {
    mins = log.lateMinutes;
  }
  if (!mins) return "";

  if (mins < 60) return ` (${mins}m)`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? ` (${hrs}j ${rem}m)` : ` (${hrs}j)`;
}

const STATUS_BADGE: Record<string, string> = {
  hadir: styles.badgeHadir,
  terlambat: styles.badgeTerlambat,
  alpa: styles.badgeAlpa,
  izin: styles.badgeIzin,
  sakit: styles.badgeSakit,
  cuti: styles.badgeCuti,
};

export function LiveMonitorTable({ hotelCode, shifts: propShifts }: Props) {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [shifts, setShifts] = useState<Shift[]>(propShifts || []);
  const [loading, setLoading] = useState(true);
  const [modalPhotoData, setModalPhotoData] = useState<AttendancePhotoModalData | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const yyyyMM = today.slice(0, 7);

  // Sync shifts if passed or fetch if missing
  useEffect(() => {
    if (propShifts && propShifts.length > 0) {
      setShifts(propShifts);
      return;
    }
    if (!hotelCode) return;
    let isMounted = true;
    const fetchShifts = async () => {
      try {
        const shiftCol = collection(db, `hotels/${hotelCode}/shifts`);
        const snap = await getDocs(shiftCol);
        if (!isMounted) return;
        setShifts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Shift)));
      } catch (err) {
        console.error("Error loading shifts in LiveMonitor:", err);
      }
    };
    fetchShifts();
    return () => {
      isMounted = false;
    };
  }, [hotelCode, propShifts]);

  // Fetch staffs for lookup
  useEffect(() => {
    if (!hotelCode) return;
    let isMounted = true;
    const fetchStaffs = async () => {
      try {
        const staffCol = collection(db, `hotels/${hotelCode}/staff`);
        const staffSnap = await getDocs(staffCol);
        if (!isMounted) return;
        const list = staffSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Staff));
        setStaffs(list);
      } catch (err) {
        console.error("Error loading staffs for LiveMonitor:", err);
      }
    };
    fetchStaffs();
    return () => {
      isMounted = false;
    };
  }, [hotelCode]);

  // Real-time listener for today's logs only (optimized query to save Firestore reads)
  useEffect(() => {
    if (!hotelCode) return;
    const colRef = collection(db, `hotels/${hotelCode}/attendance/${yyyyMM}/logs`);
    const q = query(colRef, where("date", "==", today));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const todayLogs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceLog));
        todayLogs.sort((a, b) => a.staffName.localeCompare(b.staffName));
        setLogs(todayLogs);
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to today logs:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [hotelCode, yyyyMM, today]);

  const kpiHadir = logs.filter((l) => l.status === "hadir" || l.status === "terlambat").length;
  const kpiTerlambat = logs.filter((l) => l.status === "terlambat").length;
  const kpiAlpa = logs.filter((l) => l.status === "alpa").length;
  const kpiIzin = logs.filter((l) => ["izin", "sakit", "cuti"].includes(l.status)).length;

  const handleOpenPhoto = (
    log: AttendanceLog,
    type: "in" | "out",
    staff?: Staff
  ) => {
    const event = type === "in" ? log.clockIn : log.clockOut;
    if (!event?.selfieUrl) return;

    setModalPhotoData({
      photoUrl: event.selfieUrl,
      staffName: log.staffName,
      type,
      date: log.date,
      time: event.time,
      status: log.status,
      gps: event.gps,
      lateReason: type === "in" ? log.correctionNote || (log as any).lateReason : undefined,
      position: staff?.position,
      division: staff?.division,
    });
  };

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
                  <th style={{ whiteSpace: "nowrap" }}>Clock In (Masuk)</th>
                  <th style={{ whiteSpace: "nowrap" }}>Clock Out (Pulang)</th>
                  <th style={{ whiteSpace: "nowrap" }}>Durasi (jam)</th>
                  <th style={{ whiteSpace: "nowrap" }}>Lembur (jam)</th>
                  <th style={{ whiteSpace: "nowrap" }}>Alasan</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const staff = staffs.find((s) => s.id === log.staffId);
                  const shift = shifts.find((sh) => sh.id === (log.shiftId || staff?.shiftId));
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
                          {formatLateBadge(log, shift)}
                        </span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <AttendancePhotoThumbnail
                            photoUrl={log.clockIn?.selfieUrl}
                            staffName={log.staffName}
                            type="in"
                            onClick={() => handleOpenPhoto(log, "in", staff)}
                          />
                          <span style={{ fontFamily: "monospace", fontSize: 13 }}>
                            {formatTime(log.clockIn?.time)}
                          </span>
                        </div>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <AttendancePhotoThumbnail
                            photoUrl={log.clockOut?.selfieUrl}
                            staffName={log.staffName}
                            type="out"
                            onClick={() => handleOpenPhoto(log, "out", staff)}
                          />
                          <span style={{ fontFamily: "monospace", fontSize: 13 }}>
                            {formatTime(log.clockOut?.time)}
                          </span>
                        </div>
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

      {/* Full Photo Modal */}
      <AttendancePhotoModal
        data={modalPhotoData}
        onClose={() => setModalPhotoData(null)}
      />
    </div>
  );
}
