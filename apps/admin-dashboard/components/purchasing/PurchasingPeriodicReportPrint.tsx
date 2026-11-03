'use client';

import React from 'react';
import { formatRupiah } from '@/lib/purchasing/utils';
import { formatDateDisplay, extractDocDateStr } from '@/lib/purchasing/dateHelper';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/context/AuthContext';
import s from './PurchasingPeriodicReportPrint.module.css';

interface PurchasingPeriodicReportPrintProps {
  type: 'SR' | 'PR' | 'DML';
  periodLabel: string;
  records: any[];
  totalValue: number;
}

export default function PurchasingPeriodicReportPrint({
  type,
  periodLabel,
  records,
  totalValue,
}: PurchasingPeriodicReportPrintProps) {
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

  const getDocTitle = () => {
    switch (type) {
      case 'SR':
        return 'LAPORAN STORE REQUISITION (SR)';
      case 'PR':
        return 'LAPORAN PURCHASE REQUISITION (PR)';
      case 'DML':
        return 'LAPORAN DAILY MARKET LIST (DML)';
    }
  };

  const getDocBadge = () => {
    switch (type) {
      case 'SR':
        return 'Internal Warehouse Disbursement';
      case 'PR':
        return 'External Procurement Requisition';
      case 'DML':
        return 'Fresh Produce Kitchen Market';
    }
  };

  // Status counters
  const approvedCount = records.filter(
    (r) => r.status === 'approved' || r.status === 'fulfilled' || r.status === 'received'
  ).length;
  const pendingCount = records.filter(
    (r) => r.status === 'submitted' || r.status === 'draft' || r.status === 'pending'
  ).length;

  const renderItemsPreview = (items: any[]) => {
    if (!items || items.length === 0) return '—';
    const previewList = items.slice(0, 3).map((i) => {
      const name = i.item_name || i.name || 'Barang';
      const qty = i.qty_requested || i.qty || i.qty_ordered || 0;
      const unit = i.unit || i.uom || '';
      return `${name}${qty ? ` (${qty} ${unit})` : ''}`;
    });
    const extraCount = items.length - 3;
    return previewList.join(', ') + (extraCount > 0 ? ` +${extraCount} item lainnya` : '');
  };

  const getStatusClass = (status: string) => {
    const st = (status || '').toLowerCase();
    if (st === 'fulfilled' || st === 'approved' || st === 'received') return `${s.statusPill} ${s.statusApproved}`;
    if (st === 'submitted') return `${s.statusPill} ${s.statusSubmitted}`;
    return `${s.statusPill} ${s.statusDraft}`;
  };

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
          <div className={s.docBadge}>{getDocBadge()}</div>
          <h1 className={s.docTitle}>{getDocTitle()}</h1>
          <div className={s.periodLabel}>Periode: {periodLabel}</div>
          <div className={s.printMeta}>Dicetak pada: {nowStr}</div>
        </div>
      </div>

      {/* ── KPI Summary ── */}
      <div className={s.kpiGrid}>
        <div className={s.kpiCard}>
          <span className={s.kpiLabel}>Total Dokumen</span>
          <span className={s.kpiValue}>{records.length}</span>
          <span className={s.kpiSub}>Transaksi terdaftar</span>
        </div>
        <div className={s.kpiCard}>
          <span className={s.kpiLabel}>
            {type === 'SR' ? 'Total Nilai Gudang' : type === 'PR' ? 'Total Estimasi PR' : 'Total Belanja Pasar'}
          </span>
          <span className={s.kpiValue}>{formatRupiah(totalValue)}</span>
          <span className={s.kpiSub}>Akumulasi periode ini</span>
        </div>
        <div className={s.kpiCard}>
          <span className={s.kpiLabel}>Disetujui / Selesai</span>
          <span className={s.kpiValue} style={{ color: '#047857' }}>{approvedCount}</span>
          <span className={s.kpiSub}>Approved / Fulfilled</span>
        </div>
        <div className={s.kpiCard}>
          <span className={s.kpiLabel}>Menunggu Approval</span>
          <span className={s.kpiValue} style={{ color: '#d97706' }}>{pendingCount}</span>
          <span className={s.kpiSub}>Pending review</span>
        </div>
      </div>

      {/* ── Tabular Report ── */}
      <table className={s.table}>
        <thead>
          <tr>
            <th style={{ width: '36px' }} className={s.thCenter}>No</th>
            <th style={{ width: '125px' }}>No. Dokumen</th>
            <th style={{ width: '90px' }}>Tanggal</th>
            <th style={{ width: '140px' }}>{type === 'DML' ? 'Outlet / Kitchen' : 'Departemen'}</th>
            <th style={{ width: '120px' }}>{type === 'DML' ? 'Petugas Pasar' : 'Diajukan Oleh'}</th>
            <th>Rincian Barang / Keperluan</th>
            <th style={{ width: '90px' }} className={s.thCenter}>Status</th>
            <th style={{ width: '125px' }} className={s.thRight}>Total Nilai</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>
                Tidak ada data dokumen pada periode yang dipilih ({periodLabel}).
              </td>
            </tr>
          ) : (
            records.map((rec, index) => {
              const docNum = rec.sr_number || rec.pr_number || rec.dml_number || `DOC-${index + 1}`;
              const docDate = formatDateDisplay(rec.order_date || rec.date || rec.created_at);
              const dept = rec.department || rec.outlet || 'General';
              const userPic = rec.requested_by_name || rec.submitted_by_name || rec.purchaser_name || rec.requested_by || 'Staff';
              const items = rec.items || [];
              const cost = Number(rec.total_cost || rec.total_estimated || 0);

              return (
                <tr key={rec.id || index}>
                  <td style={{ textAlign: 'center' }}>{index + 1}</td>
                  <td>
                    <span className={s.docNum}>{docNum}</span>
                  </td>
                  <td className={s.dateCell}>{docDate}</td>
                  <td className={s.deptCell}>{dept}</td>
                  <td className={s.userCell}>{userPic}</td>
                  <td className={s.itemsList}>{renderItemsPreview(items)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={getStatusClass(rec.status)}>
                      {rec.status || 'Draft'}
                    </span>
                  </td>
                  <td className={s.amountCell}>{formatRupiah(cost)}</td>
                </tr>
              );
            })
          )}
          {records.length > 0 && (
            <tr className={s.grandTotalRow}>
              <td colSpan={7} style={{ textAlign: 'right', textTransform: 'uppercase' }}>
                TOTAL KESELURUHAN ({periodLabel}):
              </td>
              <td className={s.amountCell} style={{ fontSize: '11px', color: '#0f172a' }}>
                {formatRupiah(totalValue)}
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
          <div className={s.signDate}>Staff / Requisitioner</div>
        </div>
        <div className={s.signBlock}>
          <div className={s.signTitle}>Diperiksa Oleh</div>
          <div className={s.signLine} />
          <div className={s.signDate}>Cost Control / Finance</div>
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

