"use client";

import React, { useState, useEffect } from "react";
import styles from "./hrd.module.css";
import type { AttendanceLog, Staff, Shift } from "./types";
import { AttendancePhotoThumbnail } from "./AttendancePhotoThumbnail";
import { AttendancePhotoModal, type AttendancePhotoModalData } from "./AttendancePhotoModal";
import { formatLateBadge } from "./LiveMonitorTable";

interface Props {
  filteredLogs: AttendanceLog[];
  staffs: Staff[];
  shifts?: Shift[];
  periodLabel: string;
  onDetailClick: (name: string, staffId: string) => void;
}

export function ReportDataGrid({ filteredLogs, staffs, shifts, periodLabel, onDetailClick }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [modalPhotoData, setModalPhotoData] = useState<AttendancePhotoModalData | null>(null);
  const itemsPerPage = 10;

  // Reset to page 1 whenever filter or logs change (by length or item IDs)
  const logsSerialized = `${filteredLogs.length}:${filteredLogs.map(l => l.id).join(",")}`;

  useEffect(() => {
    setCurrentPage(1);
  }, [logsSerialized]);

  // Sort logs by date (newest first) then by staffName
  const sortedLogs = [...filteredLogs].sort((a, b) => b.date.localeCompare(a.date) || a.staffName.localeCompare(b.staffName));

  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);
  const paginatedLogs = sortedLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const startRange = sortedLogs.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endRange = Math.min(sortedLogs.length, currentPage * itemsPerPage);

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

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <p className={styles.cardTitle}>Laporan Absensi — {periodLabel}</p>
        <span style={{ fontSize: 12, color: "var(--s-muted)" }}>
          Menampilkan {startRange}-{endRange} dari {sortedLogs.length} log absensi
        </span>
      </div>

      {sortedLogs.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>📊</div>
          <p className={styles.emptyStateText}>Tidak ada data untuk periode dan divisi yang dipilih.</p>
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
                <th style={{ whiteSpace: "nowrap" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log) => {
                const staff = staffs.find((s) => s.id === log.staffId);
                const shift = shifts?.find((sh) => sh.id === (log.shiftId || staff?.shiftId));
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
                      <span className={`${styles.badge} ${
                        log.status === "hadir" ? styles.badgeHadir :
                        log.status === "terlambat" ? styles.badgeTerlambat :
                        log.status === "alpa" ? styles.badgeAlpa :
                        log.status === "izin" ? styles.badgeIzin :
                        log.status === "sakit" ? styles.badgeSakit :
                        styles.badgeCuti
                      }`}>
                        {log.status.toUpperCase()}
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
                    <td>
                      <button 
                        onClick={() => onDetailClick(log.staffName, log.staffId)}
                        style={{ padding: "6px 12px", fontSize: 11, background: "var(--s-primary)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button 
                className={styles.pageBtn} 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                &lt; Prev
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                if (
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button 
                      key={page} 
                      className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ''}`} 
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 2 || 
                  page === currentPage + 2
                ) {
                  return <span key={page} className={styles.pageEllipsis}>...</span>;
                }
                return null;
              })}

              <button 
                className={styles.pageBtn} 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Next &gt;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Full Photo Modal */}
      <AttendancePhotoModal
        data={modalPhotoData}
        onClose={() => setModalPhotoData(null)}
      />
    </div>
  );
}
