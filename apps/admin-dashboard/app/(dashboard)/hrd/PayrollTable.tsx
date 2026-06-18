"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import type { Staff, AttendanceLog, Shift } from "./types";
import styles from "./hrd.module.css";

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

  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
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

  const generatePayroll = async () => {
    setLoading(true);
    try {
      // Fetch attendance logs for selected month
      const logColRef = collection(db, `hotels/${hotelCode}/attendance/${selectedMonth}/logs`);
      const logSnap = await getDocs(logColRef);
      const logs = logSnap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceLog));

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

        // Hitung Lembur (hanya yg di-approve)
        if (log.overtimeMinutes > 0 && log.overtimeApproved === true) {
          s.totalOvertimeMinutes += log.overtimeMinutes;
        }

        // Hitung Keterlambatan aktual (menit)
        if (log.status === "terlambat" && log.clockIn?.time) {
          const shift = shifts.find(sh => sh.id === log.shiftId);
          if (shift) {
            const clockInDate = new Date(log.clockIn.time);
            // shift.startTime is "HH:MM"
            const [sh, sm] = shift.startTime.split(":").map(Number);
            const expectedTime = new Date(log.clockIn.time);
            expectedTime.setHours(sh, sm, 0, 0);
            
            let lateDiff = Math.floor((clockInDate.getTime() - expectedTime.getTime()) / 60000);
            // Reduce by tolerance? Usually tolerance means "if <= 15m, not late. If > 15m, late by actual diff or diff-15?"
            // Assuming standard: if status="terlambat", we charge for the full lateness or lateness minus tolerance.
            // Let's charge full lateness to be safe, or just use actual diff.
            if (lateDiff > 0) {
              s.totalLateMinutes += lateDiff;
            }
          }
        }
      });

      // Hitung Total Gaji
      Object.values(summaries).forEach(s => {
        // Lembur
        s.overtimePay = (s.totalOvertimeMinutes / 60) * s.overtimeRate;
        
        // Potongan Telat
        s.lateDeduction = s.totalLateMinutes * s.lateRate;

        if (s.employmentType === "staff") {
          // STAFF: Gaji Pokok tetap
          s.grossSalary = s.baseSalary;
          
          // Opsi 2 (Auto-Alpa): Asumsi standar 26 hari kerja sebulan
          // Hari kosong (tidak absen sama sekali) dianggap otomatis Alpa
          const standardDays = 26;
          const totalPresent = s.totalHadir + s.totalIzinCutiSakit;
          s.totalAlpa = Math.max(0, standardDays - totalPresent);
          
          const dailyRate = s.baseSalary / standardDays;
          s.absenceDeduction = s.totalAlpa * dailyRate; 
        } else {
          // DW: Dibayar sesuai hari hadir (baseSalary = upah harian)
          s.grossSalary = s.totalHadir * s.baseSalary;
          // DW tidak ada potongan Alpa karena tidak hadir otomatis tidak dibayar (di-cover oleh grossSalary yg hanya menghitung hadir)
          s.absenceDeduction = 0;
        }

        // BPJS
        s.bpjsDeduction = (s.grossSalary * s.bpjsPercentage) / 100;

        // Net Salary
        s.netSalary = Math.max(0, s.grossSalary + s.overtimePay - s.lateDeduction - s.absenceDeduction - s.bpjsDeduction);
      });

      setPayrolls(Object.values(summaries).sort((a, b) => a.staffName.localeCompare(b.staffName)));

      // Hitung Total Pengeluaran Perusahaan untuk Payroll & Simpan ke Firestore
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

      setGenerated(true);
    } catch (err) {
      console.error(err);
      alert("Gagal mengkalkulasi payroll.");
    } finally {
      setLoading(false);
    }
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
          <tr><td>Uang Lembur (${(p.totalOvertimeMinutes/60).toFixed(1)} jam)</td><td style="text-align: right">${formatRp(p.overtimePay)}</td></tr>
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
      <div className={styles.filterBar}>
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
          <div>
            <label className={styles.filterLabel}>Bulan</label>
            <input type="month" className={styles.filterInput} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          </div>
          <button className={styles.btnPrimary} onClick={generatePayroll} disabled={loading || staffs.length === 0}>
            {loading ? "Menghitung..." : "Kalkulasi Payroll"}
          </button>
        </div>
      </div>

      {generated && (
        <div className={styles.card} style={{ marginTop: 20 }}>
          <div className={styles.cardHeader}>
            <p className={styles.cardTitle}>Laporan Penggajian — {selectedMonth}</p>
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
                    <td><span className={styles.badge} style={{ background: p.employmentType === 'staff' ? '#dbeafe' : '#fef3c7', color: p.employmentType === 'staff' ? '#1e40af' : '#b45309' }}>{p.employmentType.toUpperCase()}</span></td>
                    <td style={{ fontFamily: "monospace", whiteSpace: "nowrap" }}>{formatRp(p.baseSalary)}</td>
                    <td>{p.totalHadir} / {p.totalAlpa}</td>
                    <td>
                      <div style={{ fontWeight: 500, color: "var(--s-ink)", whiteSpace: "nowrap" }}>+{formatRp(p.overtimePay)}</div>
                      <div style={{ fontSize: 11, color: "var(--s-muted)", marginTop: 2 }}>{(p.totalOvertimeMinutes/60).toFixed(1)} jam</div>
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
                      <button onClick={() => printSlip(p)} style={{ padding: "6px 12px", fontSize: 12, background: "var(--s-primary)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Cetak Slip</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
