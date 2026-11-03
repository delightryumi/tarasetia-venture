"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import type { Staff, AttendanceLog, Shift } from "./types";
import styles from "./hrd.module.css";
import { PayrollFilterBar } from "./PayrollFilterBar";
import { PayrollReportPrint } from "./PayrollReportPrint";
import { toast } from "sonner";

interface Props {
  hotelCode: string;
}

interface PayrollSummary {
  staffId: string;
  staffName: string;
  position: string;
  employmentType: "staff" | "dw";
  baseSalary: number;
  totalHadir: number;
  totalAlpa: number;
  totalIzinCutiSakit: number; // For DW deductions
  totalOvertimeHours: number; // Jam lembur bulat per hari
  totalOvertimeMinutes: number;
  overtimeRate: number;
  totalLateMinutes: number;
  lateRate: number;
  bpjsPercentage: number;
  
  // Calculated
  grossSalary: number;
  overtimePay: number;
  lateDeduction: number;
  absenceDeduction: number;
  bpjsDeduction: number;
  netSalary: number;
}

export function PayrollTable({ hotelCode }: Props) {
  const now = new Date();
  const defaultMonth = now.toISOString().slice(0, 7);
  const defaultStartDate = `${defaultMonth}-01`;
  const defaultEndDate = now.toISOString().slice(0, 10);

  const [periodMode, setPeriodMode] = useState<"monthly" | "custom">("monthly");
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [loading, setLoading] = useState(false);
  const [payrolls, setPayrolls] = useState<PayrollSummary[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    if (!hotelCode) return;
    const fetchBaseData = async () => {
      try {
        const staffCol = collection(db, `hotels/${hotelCode}/staff`);
        const shiftCol = collection(db, `hotels/${hotelCode}/shifts`);
        const [staffSnap, shiftSnap] = await Promise.all([getDocs(staffCol), getDocs(shiftCol)]);
        
        const staffList = staffSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Staff));
        const shiftList = shiftSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Shift));
        
        setStaffs(staffList);
        setShifts(shiftList);
      } catch (err) {
        console.error("Error loading staffs/shifts:", err);
      }
    };
    fetchBaseData();
  }, [hotelCode]);

  const getPeriodLabel = () => {
    if (periodMode === "monthly") {
      if (!selectedMonth) return "";
      const [y, m] = selectedMonth.split("-").map(Number);
      const d = new Date(y, m - 1, 1);
      return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    } else {
      if (!startDate && !endDate) return "Semua Tanggal";
      const startStr = startDate ? new Date(startDate + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "";
      const endStr = endDate ? new Date(endDate + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "";
      return `${startStr} s/d ${endStr}`;
    }
  };

  const getMonthsInRange = (startStr: string, endStr: string): string[] => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
    
    const months: string[] = [];
    const cur = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (cur <= endMonth) {
      const yyyy = cur.getFullYear();
      const mm = String(cur.getMonth() + 1).padStart(2, "0");
      months.push(`${yyyy}-${mm}`);
      cur.setMonth(cur.getMonth() + 1);
    }
    return months;
  };

  const generatePayroll = async () => {
    if (periodMode === "custom" && (!startDate || !endDate)) {
      toast.error("Harap tentukan tanggal mulai dan tanggal selesai!");
      return;
    }
    if (periodMode === "custom" && startDate > endDate) {
      toast.error("Tanggal mulai tidak boleh lebih besar dari tanggal selesai!");
      return;
    }

    setLoading(true);
    try {
      let logs: AttendanceLog[] = [];

      if (periodMode === "monthly") {
        // Fetch attendance logs for selected month
        const logColRef = collection(db, `hotels/${hotelCode}/attendance/${selectedMonth}/logs`);
        const logSnap = await getDocs(logColRef);
        logs = logSnap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceLog));
      } else {
        // Custom Date Range: fetch distinct months in range (low-cost Firestore read)
        const months = getMonthsInRange(startDate, endDate);
        const snaps = await Promise.all(
          months.map((m) => getDocs(collection(db, `hotels/${hotelCode}/attendance/${m}/logs`)))
        );
        snaps.forEach((snap) => {
          snap.docs.forEach((d) => {
            const data = d.data() as AttendanceLog;
            if (data.date && data.date >= startDate && data.date <= endDate) {
              logs.push({ id: d.id, ...data });
            }
          });
        });
      }

      const summaries: Record<string, PayrollSummary> = {};

      // Initialize summaries for ALL active staff (so even if they have 0 attendance, they show up and get cut)
      staffs.filter(s => s.isActive).forEach(staff => {
        const config = staff.payrollConfig || {
          baseSalary: 0, overtimeRatePerHour: 0, lateDeductionPerMinute: 0, bpjsPercentage: 0
        };
        summaries[staff.id] = {
          staffId: staff.id,
          staffName: staff.name,
          position: staff.position,
          employmentType: staff.employmentType || "staff",
          baseSalary: config.baseSalary,
          overtimeRate: config.overtimeRatePerHour,
          lateRate: config.lateDeductionPerMinute,
          bpjsPercentage: config.bpjsPercentage,
          totalHadir: 0,
          totalAlpa: 0,
          totalIzinCutiSakit: 0,
          totalOvertimeHours: 0,
          totalOvertimeMinutes: 0,
          totalLateMinutes: 0,
          grossSalary: 0,
          overtimePay: 0,
          lateDeduction: 0,
          absenceDeduction: 0,
          bpjsDeduction: 0,
          netSalary: 0
        };
      });

      // Group logs by staff
      logs.forEach(log => {
        const s = summaries[log.staffId];
        if (!s) return; // Ignore inactive staff if they were deactivated

        // Hitung Kehadiran
        if (log.status === "hadir" || log.status === "terlambat") s.totalHadir++;
        if (log.status === "alpa") s.totalAlpa++;
        if (log.status === "izin" || log.status === "sakit" || log.status === "cuti") s.totalIzinCutiSakit++;

        // Hitung Lembur (hanya yg di-approve, dibulatkan jam penuh per hari transaksi - Pilihan 2 Opsi A)
        const dailyOtHours = typeof log.overtimeHours === "number" ? log.overtimeHours : Math.floor((log.overtimeMinutes || 0) / 60);
        if (dailyOtHours > 0 && log.overtimeApproved === true) {
          s.totalOvertimeHours += dailyOtHours;
          s.totalOvertimeMinutes += (log.overtimeMinutes || 0);
        }

        // Hitung Keterlambatan aktual (menit)
        if (log.status === "terlambat") {
          if (typeof log.lateMinutes === "number" && log.lateMinutes > 0) {
            s.totalLateMinutes += log.lateMinutes;
          } else if (log.clockIn?.time) {
            const shift = shifts.find(sh => sh.id === log.shiftId);
            if (shift && shift.startTime) {
              const clockInDate = new Date(log.clockIn.time);
              const [sh, sm] = shift.startTime.split(":").map(Number);
              const expectedTime = new Date(`${log.date}T${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}:00+07:00`);
              let lateDiff = Math.floor((clockInDate.getTime() - expectedTime.getTime()) / 60000);
              if (lateDiff > 0) {
                s.totalLateMinutes += lateDiff;
              }
            }
          }
        }
      });

      // Prorated standard days calculation for Custom mode vs Monthly mode
      let periodStandardDays = 26;
      if (periodMode === "custom") {
        const dayCount = Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1);
        periodStandardDays = Math.min(26, Math.max(1, Math.round(dayCount * (26 / 30))));
      }

      // Hitung Total Gaji
      Object.values(summaries).forEach(s => {
        // Lembur (bulat per jam penuh)
        s.overtimePay = s.totalOvertimeHours * s.overtimeRate;
        
        // Potongan Telat
        s.lateDeduction = s.totalLateMinutes * s.lateRate;

        if (s.employmentType === "staff") {
          // STAFF: Gaji Pokok tetap atau prorata jika custom period
          const dailyRate = s.baseSalary / 26;
          s.grossSalary = periodMode === "monthly" ? s.baseSalary : Math.round(dailyRate * periodStandardDays);
          
          // Opsi 2 (Auto-Alpa): Asumsi standar hari kerja periode
          const totalPresent = s.totalHadir + s.totalIzinCutiSakit;
          s.totalAlpa = Math.max(0, periodStandardDays - totalPresent);
          
          s.absenceDeduction = Math.round(s.totalAlpa * dailyRate); 
        } else {
          // DW: Dibayar sesuai hari hadir (baseSalary = upah harian)
          s.grossSalary = s.totalHadir * s.baseSalary;
          // DW tidak ada potongan Alpa karena tidak hadir otomatis tidak dibayar
          s.absenceDeduction = 0;
        }

        // BPJS
        s.bpjsDeduction = Math.round((s.grossSalary * s.bpjsPercentage) / 100);

        // Net Salary
        s.netSalary = Math.max(0, s.grossSalary + s.overtimePay - s.lateDeduction - s.absenceDeduction - s.bpjsDeduction);
      });

      setPayrolls(Object.values(summaries).sort((a, b) => a.staffName.localeCompare(b.staffName)));

      // Hitung Total Pengeluaran Perusahaan untuk Payroll & Simpan ke Firestore jika Monthly
      if (periodMode === "monthly") {
        let totalPayrollExpense = 0;
        Object.values(summaries).forEach(s => {
          const expense = s.grossSalary + s.overtimePay - s.lateDeduction - s.absenceDeduction;
          totalPayrollExpense += Math.max(0, expense);
        });

        try {
          const summaryRef = doc(db, `hotels/${hotelCode}/payroll_summaries/${selectedMonth}`);
          await setDoc(summaryRef, {
            month: selectedMonth,
            totalPayrollExpense: totalPayrollExpense,
            details: Object.values(summaries),
            updatedAt: new Date().toISOString()
          });
        } catch (saveErr) {
          console.error("Gagal menyimpan snapshot payroll ke Firestore:", saveErr);
        }
      }

      setGenerated(true);
      toast.success(`Kalkulasi payroll berhasil untuk periode ${getPeriodLabel()}`);
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal mengkalkulasi payroll: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = () => {
    if (!generated || payrolls.length === 0) {
      toast.error("Silakan klik 'Kalkulasi Payroll' terlebih dahulu sebelum export PDF.");
      return;
    }
    window.print();
  };

  const formatRp = (num: number) => "Rp " + Math.round(num).toLocaleString("id-ID");

  const printSlip = (p: PayrollSummary) => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; border: 1px solid #ddd;">
        <h2 style="text-align: center; margin: 0 0 5px;">SLIP GAJI</h2>
        <p style="text-align: center; margin: 0 0 20px; font-size: 14px; color: #555;">Bulan: ${selectedMonth}</p>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td><strong>Nama</strong></td><td>: ${p.staffName}</td></tr>
          <tr><td><strong>Jabatan</strong></td><td>: ${p.position} (${p.employmentType.toUpperCase()})</td></tr>
        </table>
        <hr style="margin: 15px 0; border: none; border-top: 1px dashed #ccc;" />
        
        <table style="width: 100%; font-size: 14px;">
          <tr><td colspan="2"><strong>PENERIMAAN</strong></td></tr>
          <tr><td>${p.employmentType === "staff" ? "Gaji Pokok" : `Upah Kehadiran (${p.totalHadir} hari)`}</td><td style="text-align: right">${formatRp(p.grossSalary)}</td></tr>
          <tr><td>Uang Lembur (${p.totalOvertimeHours} jam)</td><td style="text-align: right">${formatRp(p.overtimePay)}</td></tr>
          <tr><td colspan="2"><hr style="margin: 10px 0; border-top: 1px dashed #ccc;" /></td></tr>
          <tr><td><strong>Total Penerimaan</strong></td><td style="text-align: right; font-weight: bold;">${formatRp(p.grossSalary + p.overtimePay)}</td></tr>
        </table>
        
        <table style="width: 100%; font-size: 14px; margin-top: 15px;">
          <tr><td colspan="2"><strong>POTONGAN</strong></td></tr>
          <tr><td>Pot. Keterlambatan (${p.totalLateMinutes} mnt)</td><td style="text-align: right">${formatRp(p.lateDeduction)}</td></tr>
          ${p.employmentType === "staff" ? `<tr><td>Pot. Alpa (${p.totalAlpa} hari)</td><td style="text-align: right">${formatRp(p.absenceDeduction)}</td></tr>` : ''}
          <tr><td>Iuran BPJS (${p.bpjsPercentage}%)</td><td style="text-align: right">${formatRp(p.bpjsDeduction)}</td></tr>
          <tr><td colspan="2"><hr style="margin: 10px 0; border-top: 1px dashed #ccc;" /></td></tr>
          <tr><td><strong>Total Potongan</strong></td><td style="text-align: right; font-weight: bold; color: red;">${formatRp(p.lateDeduction + p.absenceDeduction + p.bpjsDeduction)}</td></tr>
        </table>
        
        <hr style="margin: 15px 0; border: none; border-top: 2px solid #000;" />
        <table style="width: 100%; font-size: 16px;">
          <tr><td><strong>TAKE HOME PAY</strong></td><td style="text-align: right; font-weight: bold; font-size: 18px;">${formatRp(p.netSalary)}</td></tr>
        </table>
        
        <table style="width: 100%; margin-top: 40px; text-align: center; font-size: 14px;">
          <tr>
            <td style="width: 50%; padding-bottom: 60px;">Diterima oleh,</td>
            <td style="width: 50%; padding-bottom: 60px;">Disetujui oleh,</td>
          </tr>
          <tr>
            <td><strong>( ${p.staffName} )</strong></td>
            <td><strong>( HRD / Manajemen )</strong></td>
          </tr>
        </table>
      </div>
    `;

    const printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.write(`
        <html>
          <head><title>Slip Gaji - ${p.staffName}</title></head>
          <body onload="window.print(); window.close();">${printContent}</body>
        </html>
      `);
      printWin.document.close();
    }
  };

  return (
    <div>
      {/* ── Screen UI Wrapper (Hidden during Print) ── */}
      <div className="no-print">
        <PayrollFilterBar
          periodMode={periodMode}
          onModeChange={setPeriodMode}
          onPeriodModeChange={setPeriodMode}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          onSelectedMonthChange={setSelectedMonth}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          periodLabel={getPeriodLabel()}
          onCalculate={generatePayroll}
          onExportPdf={handleExportPdf}
          loading={loading}
          generated={generated}
        />

        {generated && (
          <div className={styles.card} style={{ marginTop: 20 }}>
            <div className={styles.cardHeader}>
              <p className={styles.cardTitle}>Laporan Penggajian ({getPeriodLabel()})</p>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nama & Jabatan</th>
                    <th>Tipe</th>
                    <th>Gaji Dasar / Rate</th>
                    <th>Hadir / Alpa</th>
                    <th>Lembur</th>
                    <th>Telat (mnt)</th>
                    <th>Gaji Kotor</th>
                    <th style={{ color: "red" }}>Potongan</th>
                    <th style={{ color: "#16a34a" }}>Gaji Bersih</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map((p) => (
                    <tr key={p.staffId}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.staffName}</div>
                        <div style={{ fontSize: 12, color: "var(--s-muted)" }}>{p.position}</div>
                      </td>
                      <td>
                        <span
                          className={styles.badge}
                          style={{
                            background: p.employmentType === 'staff' ? '#dbeafe' : '#fef3c7',
                            color: p.employmentType === 'staff' ? '#1e40af' : '#b45309'
                          }}
                        >
                          {p.employmentType.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontFamily: "monospace", whiteSpace: "nowrap" }}>{formatRp(p.baseSalary)}</td>
                      <td>{p.totalHadir} / {p.totalAlpa}</td>
                      <td>
                        <div style={{ fontWeight: 500, color: "var(--s-ink)", whiteSpace: "nowrap" }}>+{formatRp(p.overtimePay)}</div>
                        <div style={{ fontSize: 11, color: "var(--s-muted)", marginTop: 2 }}>{p.totalOvertimeHours} jam</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: "red", whiteSpace: "nowrap" }}>-{formatRp(p.lateDeduction)}</div>
                        <div style={{ fontSize: 11, color: "var(--s-muted)", marginTop: 2 }}>{p.totalLateMinutes} mnt</div>
                      </td>
                      <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{formatRp(p.grossSalary + p.overtimePay)}</td>
                      <td style={{ color: "red", fontWeight: 500, whiteSpace: "nowrap" }}>
                        -{formatRp(p.lateDeduction + p.absenceDeduction + p.bpjsDeduction)}
                        <div style={{ fontSize: 11, marginTop: 2 }}>BPJS: {formatRp(p.bpjsDeduction)}</div>
                      </td>
                      <td style={{ color: "#16a34a", fontWeight: "bold", fontSize: 15, whiteSpace: "nowrap" }}>{formatRp(p.netSalary)}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => printSlip(p)}
                          style={{ padding: "6px 12px", fontSize: 12, background: "var(--s-primary)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
                        >
                          Cetak Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Printable Periodic Report Sheet (A4 Landscape) ── */}
      {generated && payrolls.length > 0 && (
        <PayrollReportPrint
          periodLabel={getPeriodLabel()}
          payrolls={payrolls}
        />
      )}
    </div>
  );
}
