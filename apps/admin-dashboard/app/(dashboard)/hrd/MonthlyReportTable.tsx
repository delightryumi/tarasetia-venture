"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import type { Staff, AttendanceLog } from "./types";
import { ExportReportButton } from "./ExportReportButton";
import { ManualCorrectionModal } from "./ManualCorrectionModal";
import { StaffLogModal } from "./StaffLogModal";
import { ReportFilterBar } from "./ReportFilterBar";
import { ReportDataGrid } from "./ReportDataGrid";
import styles from "./hrd.module.css";

interface Props {
  hotelCode: string;
}

export function MonthlyReportTable({ hotelCode }: Props) {
  const now = new Date();
  const defaultDate = now.toISOString().split("T")[0];
  const defaultMonth = defaultDate.slice(0, 7);

  const [reportType, setReportType] = useState<"daily" | "monthly" | "custom">("monthly");
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [startDate, setStartDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState(defaultDate);
  const [periodLabel, setPeriodLabel] = useState("");
  
  const [allLogs, setAllLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [correctionTarget, setCorrectionTarget] = useState<AttendanceLog | null>(null);
  const [detailTarget, setDetailTarget] = useState<{ name: string; staffId: string } | null>(null);
  const [filterDiv, setFilterDiv] = useState("all");
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [filterStaff, setFilterStaff] = useState("all");

  const divisions = ["all", ...Array.from(new Set(staffs.map((s) => s.division).filter(Boolean)))];

  useEffect(() => {
    if (!hotelCode) return;
    const fetchStaffs = async () => {
      try {
        const staffCol = collection(db, `hotels/${hotelCode}/staff`);
        const staffSnap = await getDocs(staffCol);
        const list = staffSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Staff));
        list.sort((a, b) => a.name.localeCompare(b.name));
        setStaffs(list);
      } catch (err) {
        console.error("Error loading staffs for filter:", err);
      }
    };
    fetchStaffs();
  }, [hotelCode]);

  useEffect(() => {
    if (!hotelCode) return;
    fetch(`/api/attendance/prune?hotelCode=${hotelCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.prunedCount > 0) {
          console.log(`Pruned ${data.prunedCount} old attendance logs/selfies (older than 3 months).`);
        }
      })
      .catch((err) => console.error("Pruning error:", err));
  }, [hotelCode]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const staffCol = collection(db, `hotels/${hotelCode}/staff`);
      const staffSnap = await getDocs(staffCol);
      const allStaffs = staffSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Staff));

      // Determine which months to query and exactly which dates to include
      let monthsToQuery: string[] = [];
      let label = "";
      
      if (reportType === "daily") {
        monthsToQuery = [selectedDate.slice(0, 7)];
        label = `Harian (${selectedDate})`;
      } else if (reportType === "monthly") {
        monthsToQuery = [selectedMonth];
        label = `Laporan (${selectedMonth})`;
      } else {
        // custom
        if (startDate > endDate) {
          alert("Tanggal mulai tidak boleh melebihi tanggal selesai.");
          setLoading(false);
          return;
        }
        let current = new Date(startDate);
        const end = new Date(endDate);
        while (current <= end) {
          const ym = current.toISOString().slice(0, 7);
          if (!monthsToQuery.includes(ym)) monthsToQuery.push(ym);
          current.setMonth(current.getMonth() + 1);
        }
        label = `Custom (${startDate} s/d ${endDate})`;
      }

      // Fetch logs from all required month collections
      let rawLogs: AttendanceLog[] = [];
      await Promise.all(
        monthsToQuery.map(async (ym) => {
          const colRef = collection(db, `hotels/${hotelCode}/attendance/${ym}/logs`);
          const snap = await getDocs(colRef);
          rawLogs.push(...snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceLog)));
        })
      );

      // Filter exactly by bounds
      const logs = rawLogs.filter(l => {
        if (reportType === "daily") return l.date === selectedDate;
        if (reportType === "monthly") return l.date.startsWith(selectedMonth);
        return l.date >= startDate && l.date <= endDate;
      });
      
      setAllLogs(logs);
      setPeriodLabel(label);
      setGenerated(true);
    } catch (err) {
      alert("Gagal memuat laporan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = allLogs.filter((log) => {
    const staff = staffs.find((s) => s.id === log.staffId);
    const matchDiv = filterDiv === "all" || staff?.division === filterDiv;
    const matchStaff = filterStaff === "all" || log.staffId === filterStaff;
    return matchDiv && matchStaff;
  });

  return (
    <div>
      <div className={styles.warningAlert}>
        <span className={styles.warningAlertIcon}>⚠️</span>
        <div className={styles.warningAlertText}>
          <strong>Perhatian:</strong> Jangan lupa untuk mengunduh dan mencadangkan laporan absensi Anda secara berkala. Seluruh data absensi beserta berkas foto selfie pendukung akan dihapus permanen oleh sistem setelah 3 bulan (90 hari) untuk menghemat ruang penyimpanan.
        </div>
      </div>

      <ReportFilterBar
        reportType={reportType} setReportType={setReportType}
        selectedDate={selectedDate} setSelectedDate={setSelectedDate}
        selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
        startDate={startDate} setStartDate={setStartDate}
        endDate={endDate} setEndDate={setEndDate}
        filterDiv={filterDiv} setFilterDiv={setFilterDiv}
        divisions={divisions}
        staffs={staffs}
        filterStaff={filterStaff}
        setFilterStaff={setFilterStaff}
        loading={loading} generateReport={generateReport}
        generated={generated} periodLabel={periodLabel}
        filteredLogs={filteredLogs} hotelCode={hotelCode}
        setGenerated={setGenerated}
      />

      {/* Report table */}
      {generated && (
        <ReportDataGrid
          filteredLogs={filteredLogs}
          staffs={staffs}
          periodLabel={periodLabel}
          onDetailClick={(name, staffId) => setDetailTarget({ name, staffId })}
        />
      )}

      {/* Manual correction modal */}
      {correctionTarget && (
        <ManualCorrectionModal
          hotelCode={hotelCode}
          log={correctionTarget}
          yyyyMM={correctionTarget.date.slice(0, 7)}
          onClose={() => setCorrectionTarget(null)}
        />
      )}

      {/* Staff Log Modal (Detail) */}
      {detailTarget && (
        <StaffLogModal
          staffName={detailTarget.name}
          logs={allLogs.filter(l => l.staffId === detailTarget.staffId)}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </div>
  );
}
