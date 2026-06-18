"use client";

import React, { useState } from "react";
import type { AttendanceLog, Staff } from "./types";
import styles from "./hrd.module.css";

interface Props {
  periodLabel: string;
  filteredLogs: AttendanceLog[];
  staffs: Staff[];
  hotelCode: string;
}

export function ExportReportButton({ periodLabel, filteredLogs, staffs, hotelCode }: Props) {
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  const exportExcel = async () => {
    setExporting("excel");
    try {
      const XLSX = await import("xlsx");
      const sortedLogs = [...filteredLogs].sort((a, b) => b.date.localeCompare(a.date) || a.staffName.localeCompare(b.staffName));

      const wsData = [
        ["Tanggal", "Nama", "Jabatan", "Divisi", "Status", "Clock In", "Clock Out", "Durasi (jam)", "Lembur (jam)", "Alasan"],
        ...sortedLogs.map((l) => {
          const staff = staffs.find((s) => s.id === l.staffId);
          const inTime = l.clockIn?.time ? new Date(l.clockIn.time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—";
          const outTime = l.clockOut?.time ? new Date(l.clockOut.time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—";
          return [
            l.date,
            l.staffName,
            staff?.position || "—",
            staff?.division || "—",
            l.status.toUpperCase(),
            inTime,
            outTime,
            l.durationMinutes > 0 ? (l.durationMinutes / 60).toFixed(1) : "—",
            l.overtimeMinutes > 0 ? (l.overtimeMinutes / 60).toFixed(1) : "—",
            l.lateReason || "—",
          ];
        }),
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!cols"] = [
        { wch: 12 }, { wch: 24 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, 
        { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 30 }
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Laporan Absensi`);

      XLSX.writeFile(wb, `Laporan_Absensi_${hotelCode}_${periodLabel.replace(/\//g, '-')}.xlsx`);
    } catch (err) {
      alert("Gagal ekspor Excel. Coba lagi.");
    } finally {
      setExporting(null);
    }
  };

  const exportPDF = () => {
    setExporting("pdf");
    const sortedLogs = [...filteredLogs].sort((a, b) => b.date.localeCompare(a.date) || a.staffName.localeCompare(b.staffName));

    const tableRows = sortedLogs
      .map((l) => {
        const staff = staffs.find((s) => s.id === l.staffId);
        const inTime = l.clockIn?.time ? new Date(l.clockIn.time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—";
        const outTime = l.clockOut?.time ? new Date(l.clockOut.time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—";
        return `<tr>
          <td>${l.date}</td>
          <td>${l.staffName}</td>
          <td>${staff?.position || "—"}</td>
          <td>${staff?.division || "—"}</td>
          <td>${l.status.toUpperCase()}</td>
          <td>${inTime}</td>
          <td>${outTime}</td>
          <td>${l.durationMinutes > 0 ? (l.durationMinutes / 60).toFixed(1) : "—"}</td>
          <td>${l.overtimeMinutes > 0 ? (l.overtimeMinutes / 60).toFixed(1) : "—"}</td>
          <td>${l.lateReason || "—"}</td>
        </tr>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<title>Laporan Absensi ${periodLabel} — Hotel ${hotelCode}</title>
<style>
  body { font-family: 'Inter', Arial, sans-serif; padding: 32px; font-size: 11px; color: #111; }
  h1 { font-size: 16px; margin-bottom: 4px; }
  p.sub { color: #6b7280; margin-bottom: 24px; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f4f4f5; padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e4e4e7; }
  td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
  tr:last-child td { border-bottom: none; }
  .footer { margin-top: 24px; font-size: 10px; color: #9ca3af; border-top: 1px solid #e4e4e7; padding-top: 12px; }
</style>
</head>
<body>
<h1>Laporan Absensi Karyawan</h1>
<p class="sub">Periode: ${periodLabel} &nbsp;|&nbsp; Hotel: ${hotelCode} &nbsp;|&nbsp; Dicetak: ${new Date().toLocaleString("id-ID")}</p>
<table>
<thead><tr>
  <th>Tanggal</th><th>Nama</th><th>Jabatan</th><th>Divisi</th>
  <th>Status</th><th>Clock In</th><th>Clock Out</th><th>Durasi</th><th>Lembur</th><th>Alasan</th>
</tr></thead>
<tbody>${tableRows}</tbody>
</table>

<div class="footer">Dokumen ini dibuat otomatis oleh Sistem HRD. Total log absensi: ${sortedLogs.length}</div>
</body></html>`;

    const win = window.open("", "_blank");
    if (!win) { setExporting(null); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      setExporting(null);
    }, 300);
  };

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        className={styles.btnSecondary}
        onClick={exportPDF}
        disabled={!!exporting || filteredLogs.length === 0}
      >
        {exporting === "pdf" ? "Memuat..." : "⬇ Ekspor PDF"}
      </button>
      <button
        className={styles.btnSecondary}
        onClick={exportExcel}
        disabled={!!exporting || filteredLogs.length === 0}
      >
        {exporting === "excel" ? "Memuat..." : "⬇ Ekspor Excel"}
      </button>
    </div>
  );
}
