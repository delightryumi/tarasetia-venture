"use client";

import React from "react";
import styles from "./hrd.module.css";
import { ExportReportButton } from "./ExportReportButton";
import type { AttendanceLog, Staff } from "./types";

interface Props {
  reportType: "daily" | "monthly" | "custom";
  setReportType: (val: "daily" | "monthly" | "custom") => void;
  selectedDate: string;
  setSelectedDate: (val: string) => void;
  selectedMonth: string;
  setSelectedMonth: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  filterDiv: string;
  setFilterDiv: (val: string) => void;
  divisions: string[];
  staffs: Staff[];
  filterStaff: string;
  setFilterStaff: (val: string) => void;
  loading: boolean;
  generateReport: () => void;
  generated: boolean;
  periodLabel: string;
  filteredLogs: AttendanceLog[];
  hotelCode: string;
  setGenerated: (val: boolean) => void;
}

export function ReportFilterBar({
  reportType, setReportType,
  selectedDate, setSelectedDate,
  selectedMonth, setSelectedMonth,
  startDate, setStartDate,
  endDate, setEndDate,
  filterDiv, setFilterDiv,
  divisions,
  staffs,
  filterStaff, setFilterStaff,
  loading, generateReport,
  generated, periodLabel,
  filteredLogs, hotelCode,
  setGenerated
}: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.cardBody}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className={styles.formGroup} style={{ marginBottom: 0 }}>
            <label className={styles.formLabel}>Tipe Laporan</label>
            <select className={styles.formInput} value={reportType} onChange={(e) => { setReportType(e.target.value as any); setGenerated(false); }} style={{ maxWidth: 140 }}>
              <option value="daily">Harian</option>
              <option value="monthly">Bulanan</option>
              <option value="custom">Custom Date</option>
            </select>
          </div>
          
          {reportType === "daily" && (
            <div className={styles.formGroup} style={{ marginBottom: 0 }}>
              <label className={styles.formLabel}>Pilih Tanggal</label>
              <input type="date" className={styles.dateInput} value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setGenerated(false); }} style={{ maxWidth: 180 }} />
            </div>
          )}
          
          {reportType === "monthly" && (
            <div className={styles.formGroup} style={{ marginBottom: 0 }}>
              <label className={styles.formLabel}>Periode Bulan</label>
              <input type="month" className={styles.dateInput} value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setGenerated(false); }} style={{ maxWidth: 180 }} />
            </div>
          )}
          
          {reportType === "custom" && (
            <>
              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <label className={styles.formLabel}>Dari Tanggal</label>
                <input type="date" className={styles.dateInput} value={startDate} onChange={(e) => { setStartDate(e.target.value); setGenerated(false); }} style={{ maxWidth: 180 }} />
              </div>
              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <label className={styles.formLabel}>Sampai Tanggal</label>
                <input type="date" className={styles.dateInput} value={endDate} onChange={(e) => { setEndDate(e.target.value); setGenerated(false); }} min={startDate} style={{ maxWidth: 180 }} />
              </div>
            </>
          )}

          <div className={styles.formGroup} style={{ marginBottom: 0 }}>
            <label className={styles.formLabel}>Pilih Karyawan</label>
            <select className={styles.formInput} value={filterStaff} onChange={(e) => setFilterStaff(e.target.value)} style={{ maxWidth: 220 }}>
              <option value="all">Semua Karyawan</option>
              {staffs.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.nik || "Tanpa NIK"})</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup} style={{ marginBottom: 0 }}>
            <label className={styles.formLabel}>Filter Divisi</label>
            <select className={styles.formInput} value={filterDiv} onChange={(e) => setFilterDiv(e.target.value)} style={{ maxWidth: 200 }}>
              {divisions.map((d) => <option key={d} value={d}>{d === "all" ? "Semua Divisi" : d}</option>)}
            </select>
          </div>
          <button className={styles.btnPrimary} onClick={generateReport} disabled={loading}>
            {loading ? "Memuat..." : "Generate Laporan"}
          </button>
          {generated && (
            <ExportReportButton
              periodLabel={periodLabel}
              filteredLogs={filteredLogs}
              staffs={staffs}
              hotelCode={hotelCode}
            />
          )}
        </div>
      </div>
    </div>
  );
}
