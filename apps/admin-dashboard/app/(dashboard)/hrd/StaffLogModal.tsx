"use client";

import React, { useState } from "react";
import type { AttendanceLog } from "./types";
import styles from "./hrd.module.css";
import { X, Image as ImageIcon } from "lucide-react";

interface Props {
  staffName: string;
  logs: AttendanceLog[];
  onClose: () => void;
}

export function StaffLogModal({ staffName, logs, onClose }: Props) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Sort logs by date (newest first)
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  const formatTime = (isoString?: string) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
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
                <th>Clock In</th>
                <th>Foto In</th>
                <th>Clock Out</th>
                <th>Foto Out</th>
                <th>Lembur</th>
              </tr>
            </thead>
            <tbody>
              {sortedLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 24, color: "var(--s-muted)" }}>
                    Tidak ada data absensi pada periode ini.
                  </td>
                </tr>
              ) : (
                sortedLogs.map((log) => (
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
                          {log.status === "terlambat" && log.lateMinutes ? (() => {
                            const mins = log.lateMinutes;
                            if (mins < 60) return ` (${mins}m)`;
                            const hrs = Math.floor(mins / 60);
                            const rem = mins % 60;
                            return rem > 0 ? ` (${hrs}j ${rem}m)` : ` (${hrs}j)`;
                          })() : ""}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--s-muted)", maxWidth: 180, whiteSpace: "normal", wordBreak: "break-word" }}>
                      {log.lateReason || "—"}
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: 13 }}>{formatTime(log.clockIn?.time)}</td>
                    <td>
                      {log.clockIn?.selfieUrl ? (
                        <button 
                          onClick={() => setSelectedPhoto(log.clockIn!.selfieUrl)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--s-primary)", display: "flex", alignItems: "center", gap: 4 }}
                          title="Lihat Foto"
                        >
                          <ImageIcon size={16} /> Lihat
                        </button>
                      ) : "—"}
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: 13 }}>{formatTime(log.clockOut?.time)}</td>
                    <td>
                      {log.clockOut?.selfieUrl ? (
                        <button 
                          onClick={() => setSelectedPhoto(log.clockOut!.selfieUrl)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--s-primary)", display: "flex", alignItems: "center", gap: 4 }}
                          title="Lihat Foto"
                        >
                          <ImageIcon size={16} /> Lihat
                        </button>
                      ) : "—"}
                    </td>
                    <td style={{ color: log.overtimeMinutes > 0 ? "#d97706" : "inherit" }}>
                      {log.overtimeMinutes > 0 ? `${(log.overtimeMinutes / 60).toFixed(1)} jam` : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo Viewer Modal (Stacked) */}
      {selectedPhoto && (
        <div className={styles.modalBackdrop} style={{ zIndex: 1100 }} onClick={() => setSelectedPhoto(null)}>
          <div className={styles.modal} style={{ maxWidth: 500, padding: 0, overflow: "hidden" }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader} style={{ position: "absolute", top: 0, width: "100%", background: "linear-gradient(rgba(0,0,0,0.5), transparent)", border: "none", zIndex: 10 }}>
              <h2 className={styles.modalTitle} style={{ color: "#fff" }}>Foto Selfie</h2>
              <button className={styles.closeBtn} style={{ color: "#fff" }} onClick={() => setSelectedPhoto(null)}><X size={20} /></button>
            </div>
            <img src={selectedPhoto} alt="Selfie" style={{ width: "100%", height: "auto", display: "block" }} />
          </div>
        </div>
      )}
    </div>
  );
}
