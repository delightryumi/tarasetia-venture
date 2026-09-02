"use client";

import React, { useState } from "react";
import type { AttendanceLog, Shift } from "./types";
import { AttendancePhotoThumbnail } from "./AttendancePhotoThumbnail";
import { AttendancePhotoModal, type AttendancePhotoModalData } from "./AttendancePhotoModal";
import { formatLateBadge } from "./LiveMonitorTable";
import styles from "./hrd.module.css";
import { X } from "lucide-react";

interface Props {
  staffName: string;
  logs: AttendanceLog[];
  shifts?: Shift[];
  onClose: () => void;
}

export function StaffLogModal({ staffName, logs, shifts, onClose }: Props) {
  const [modalPhotoData, setModalPhotoData] = useState<AttendancePhotoModalData | null>(null);

  // Sort logs by date (newest first)
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  const formatTime = (isoString?: string) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const handleOpenPhoto = (log: AttendanceLog, type: "in" | "out") => {
    const event = type === "in" ? log.clockIn : log.clockOut;
    if (!event?.selfieUrl) return;

    setModalPhotoData({
      photoUrl: event.selfieUrl,
      staffName,
      type,
      date: log.date,
      time: event.time,
      status: log.status,
      gps: event.gps,
      lateReason: type === "in" ? log.correctionNote || (log as any).lateReason : undefined,
    });
  };

  return (
    <div className={styles.card} style={{ marginTop: 24 }}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Detail Absensi: {staffName}</h2>
        <button 
          className={styles.closeBtn} 
          onClick={onClose} 
          style={{ border: "none", background: "none", cursor: "pointer", color: "var(--s-muted)" }}
        >
          <X size={20} />
        </button>
      </div>

      <div className={styles.cardBody} style={{ padding: 0 }}>
        <div className={styles.tableWrapper} style={{ maxHeight: 500, overflowY: "auto" }}>
          <table className={styles.table}>
            <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--s-surface-card)" }}>
              <tr>
                <th>Tanggal</th>
                <th>Status</th>
                <th>Alasan</th>
                <th>Clock In (Masuk)</th>
                <th>Clock Out (Pulang)</th>
                <th>Lembur</th>
              </tr>
            </thead>
            <tbody>
              {sortedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--s-muted)" }}>
                    Tidak ada data absensi pada periode ini.
                  </td>
                </tr>
              ) : (
                sortedLogs.map((log) => {
                  const shift = shifts?.find((sh) => sh.id === log.shiftId);
                  return (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 500 }}>{log.date}</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span className={`${styles.badge} ${
                            log.status === "hadir" ? styles.badgeHadir :
                            log.status === "terlambat" ? styles.badgeTerlambat :
                            log.status === "alpa" ? styles.badgeAlpa :
                            styles.badgeIzin
                          }`} style={{ width: "fit-content" }}>
                            {log.status.toUpperCase()}
                            {formatLateBadge(log, shift)}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--s-muted)", maxWidth: 180, whiteSpace: "normal", wordBreak: "break-word" }}>
                        {log.lateReason || "—"}
                      </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <AttendancePhotoThumbnail
                          photoUrl={log.clockIn?.selfieUrl}
                          staffName={staffName}
                          type="in"
                          onClick={() => handleOpenPhoto(log, "in")}
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
                          staffName={staffName}
                          type="out"
                          onClick={() => handleOpenPhoto(log, "out")}
                        />
                        <span style={{ fontFamily: "monospace", fontSize: 13 }}>
                          {formatTime(log.clockOut?.time)}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: log.overtimeMinutes > 0 ? "#d97706" : "inherit" }}>
                      {log.overtimeMinutes > 0 ? `${(log.overtimeMinutes / 60).toFixed(1)} jam` : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Full Photo Modal */}
      <AttendancePhotoModal
        data={modalPhotoData}
        onClose={() => setModalPhotoData(null)}
      />
    </div>
  );
}
