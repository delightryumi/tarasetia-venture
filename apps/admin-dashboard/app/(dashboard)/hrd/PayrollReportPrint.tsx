'use client';

import React from 'react';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/context/AuthContext';
import s from './PayrollReportPrint.module.css';

interface PayrollReportPrintProps {
  periodLabel: string;
  payrolls: any[];
}

export function PayrollReportPrint({ periodLabel, payrolls }: PayrollReportPrintProps) {
  const { branding, property, pos } = useSettings();
  const { activeHotelName } = useAuth();
  const hotelInfo = property || pos;
  const logoSrc = branding?.lightLogo || branding?.logoUrl || branding?.darkLogo;
  const partnerName = hotelInfo?.name || activeHotelName || 'HOTEL & RESORT PROPERTY';

  const nowStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formatRp = (num: number) => 'Rp ' + Math.round(num || 0).toLocaleString('id-ID');

  const totalGross = payrolls.reduce((a, b) => a + (Number(b.grossSalary) || 0), 0);
  const totalOvertime = payrolls.reduce((a, b) => a + (Number(b.overtimePay) || 0), 0);
  const totalOvertimeHours = payrolls.reduce((a, b) => a + (Number(b.totalOvertimeHours) || 0), 0);
  const totalLate = payrolls.reduce((a, b) => a + (Number(b.lateDeduction) || 0), 0);
  const totalAbsence = payrolls.reduce((a, b) => a + (Number(b.absenceDeduction) || 0), 0);
  const totalBpjs = payrolls.reduce((a, b) => a + (Number(b.bpjsDeduction) || 0), 0);
  const totalDeductions = totalLate + totalAbsence + totalBpjs;
  const totalNet = payrolls.reduce((a, b) => a + (Number(b.netSalary) || 0), 0);

  return (
    <div className={s.printArea}>
      {/* ── Strict Print Page Setup (A4 Landscape & Standard Margins Override) ── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 landscape;
                margin: 12mm 15mm 15mm 15mm;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `,
        }}
      />

      {/* ── Document Header ── */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          {logoSrc ? (
            <img src={logoSrc} alt="Logo" className={s.logo} />
          ) : (
            <div className={s.companyName}>{partnerName}</div>
          )}
          {hotelInfo?.address && <div className={s.companyAddr}>{hotelInfo.address}</div>}
          {(hotelInfo?.phone || hotelInfo?.email) && (
            <div className={s.companyAddr}>
              {hotelInfo.phone && <span>Telp: {hotelInfo.phone}</span>}
              {hotelInfo.phone && hotelInfo.email && <span> · </span>}
              {hotelInfo.email && <span>Email: {hotelInfo.email}</span>}
            </div>
          )}
        </div>

        <div className={s.headerRight}>
          <div className={s.docBadge}>Human Resources & Payroll</div>
          <h1 className={s.docTitle}>Laporan Rekapitulasi Penggajian</h1>
          <div className={s.periodLabel}>Periode: {periodLabel}</div>
          <div className={s.printMeta}>Dicetak pada: {nowStr}</div>
        </div>
      </div>

      {/* ── KPI Summary Grid ── */}
      <div className={s.kpiGrid}>
        <div className={s.kpiCard}>
          <span className={s.kpiLabel}>Total Karyawan</span>
          <span className={s.kpiValue}>{payrolls.length} Orang</span>
          <span className={s.kpiSub}>Staff & DW terdaftar</span>
        </div>
        <div className={s.kpiCard}>
          <span className={s.kpiLabel}>Gaji Pokok / Upah</span>
          <span className={s.kpiValue}>{formatRp(totalGross)}</span>
          <span className={s.kpiSub}>Sebelum lembur & potongan</span>
        </div>
        <div className={s.kpiCard}>
          <span className={s.kpiLabel}>Total Lembur</span>
          <span className={s.kpiValue} style={{ color: '#047857' }}>{formatRp(totalOvertime)}</span>
          <span className={s.kpiSub}>{totalOvertimeHours} jam lembur disetujui</span>
        </div>
        <div className={s.kpiCard}>
          <span className={s.kpiLabel}>Total Potongan</span>
          <span className={s.kpiValue} style={{ color: '#dc2626' }}>{formatRp(totalDeductions)}</span>
          <span className={s.kpiSub}>Telat, Alpa & BPJS</span>
        </div>
        <div className={s.kpiCard}>
          <span className={s.kpiLabel}>Total Gaji Bersih</span>
          <span className={s.kpiValue} style={{ color: '#16a34a', fontSize: 15 }}>{formatRp(totalNet)}</span>
          <span className={s.kpiSub}>Take home pay netto</span>
        </div>
      </div>

      {/* ── Tabular Report ── */}
      <table className={s.table}>
        <thead>
          <tr>
            <th style={{ width: '32px' }} className={s.thCenter}>No</th>
            <th style={{ width: '135px' }}>Nama & Jabatan</th>
            <th style={{ width: '55px' }} className={s.thCenter}>Tipe</th>
            <th style={{ width: '95px' }} className={s.thRight}>Gaji Dasar</th>
            <th style={{ width: '70px' }} className={s.thCenter}>Hadir/Alpa</th>
            <th style={{ width: '100px' }} className={s.thRight}>Lembur</th>
            <th style={{ width: '80px' }} className={s.thRight}>Pot. Telat</th>
            <th style={{ width: '80px' }} className={s.thRight}>Pot. Alpa</th>
            <th style={{ width: '75px' }} className={s.thRight}>BPJS</th>
            <th style={{ width: '110px' }} className={s.thRight}>Gaji Bersih</th>
          </tr>
        </thead>
        <tbody>
          {payrolls.length === 0 ? (
            <tr>
              <td colSpan={10} style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>
                Tidak ada data penggajian untuk periode {periodLabel}.
              </td>
            </tr>
          ) : (
            payrolls.map((p, index) => (
              <tr key={p.staffId || index}>
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td>
                  <div className={s.staffName}>{p.staffName}</div>
                  <div className={s.staffPosition}>{p.position}</div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className={`${s.typeBadge} ${p.employmentType === 'staff' ? s.typeStaff : s.typeDw}`}>
                    {String(p.employmentType || 'STAFF').toUpperCase()}
                  </span>
                </td>
                <td className={s.amountCell}>{formatRp(p.baseSalary)}</td>
                <td style={{ textAlign: 'center' }}>
                  {p.totalHadir} / {p.totalAlpa}
                </td>
                <td className={s.amountCell}>
                  <div>+{formatRp(p.overtimePay)}</div>
                  {p.totalOvertimeHours > 0 && (
                    <div style={{ fontSize: '9px', color: '#64748b' }}>{p.totalOvertimeHours} jam</div>
                  )}
                </td>
                <td className={s.amountCell} style={{ color: p.lateDeduction > 0 ? '#dc2626' : 'inherit' }}>
                  {p.lateDeduction > 0 ? `-${formatRp(p.lateDeduction)}` : 'Rp 0'}
                </td>
                <td className={s.amountCell} style={{ color: p.absenceDeduction > 0 ? '#dc2626' : 'inherit' }}>
                  {p.absenceDeduction > 0 ? `-${formatRp(p.absenceDeduction)}` : 'Rp 0'}
                </td>
                <td className={s.amountCell}>
                  {p.bpjsDeduction > 0 ? `-${formatRp(p.bpjsDeduction)}` : 'Rp 0'}
                </td>
                <td className={`${s.amountCell} ${s.amountNet}`}>{formatRp(p.netSalary)}</td>
              </tr>
            ))
          )}

          {payrolls.length > 0 && (
            <tr className={s.grandTotalRow}>
              <td colSpan={3} style={{ textAlign: 'right', textTransform: 'uppercase' }}>
                TOTAL KESELURUHAN ({periodLabel}):
              </td>
              <td className={s.amountCell}>{formatRp(totalGross)}</td>
              <td style={{ textAlign: 'center' }}>—</td>
              <td className={s.amountCell}>+{formatRp(totalOvertime)}</td>
              <td className={s.amountCell}>-{formatRp(totalLate)}</td>
              <td className={s.amountCell}>-{formatRp(totalAbsence)}</td>
              <td className={s.amountCell}>-{formatRp(totalBpjs)}</td>
              <td className={`${s.amountCell} ${s.amountNet}`} style={{ fontSize: '11px', color: '#047857' }}>
                {formatRp(totalNet)}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── Signature Block ── */}
      <div className={s.signatureRow}>
        <div className={s.signBlock}>
          <div className={s.signTitle}>Disiapkan Oleh</div>
          <div className={s.signLine} />
          <div className={s.signDate}>HRD / Payroll Officer</div>
        </div>
        <div className={s.signBlock}>
          <div className={s.signTitle}>Diperiksa Oleh</div>
          <div className={s.signLine} />
          <div className={s.signDate}>Finance & Accounting</div>
        </div>
        <div className={s.signBlock}>
          <div className={s.signTitle}>Disetujui Oleh</div>
          <div className={s.signLine} />
          <div className={s.signDate}>General Manager / Owner</div>
        </div>
      </div>
    </div>
  );
}
