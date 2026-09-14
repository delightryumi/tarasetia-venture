'use client';

import React from 'react';
import s from '../../PurchasingPrint.module.css';
import { formatRupiah } from '@/lib/purchasing/utils';
import { useSettings } from '@/hooks/useSettings';

interface StockOpnamePrintProps {
  opname: {
    period: string;
    department?: string;
    status: string;
    conducted_by_name?: string;
    conducted_by?: string;
    created_at?: any;
    notes?: string;
    items: Array<{
      item_id?: string;
      name: string;
      item_code?: string;
      category?: string;
      unit: string;
      system_qty: number;
      physical_qty: number;
      variance: number;
      unit_price?: number;
      notes?: string;
    }>;
  };
  hotelName?: string;
}

export default function StockOpnamePrint({ opname, hotelName }: StockOpnamePrintProps) {
  if (!opname) return null;

  const { branding, property, pos } = useSettings();
  const hotelInfo = property || pos;
  const logoSrc = branding?.lightLogo || branding?.logoUrl || branding?.darkLogo;
  const partnerName = hotelInfo?.name || hotelName || 'HOTEL & RESORT';

  const items = opname.items || [];
  const totalBookVal = items.reduce((acc, i) => acc + (i.system_qty * (i.unit_price || 0)), 0);
  const totalPhysVal = items.reduce((acc, i) => acc + (i.physical_qty * (i.unit_price || 0)), 0);
  const totalVarianceVal = totalPhysVal - totalBookVal;

  const dateStr = opname.created_at?.toDate
    ? opname.created_at.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    : (opname.created_at ? new Date(opname.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }));

  // Kelompokkan per kategori untuk tampilan report berstruktur
  const categories = Array.from(new Set(items.map(i => i.category || 'General')));

  const getStatusClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'locked':
        return `${s.printStatusPill} ${s.printStatusApproved}`;
      case 'submitted':
        return `${s.printStatusPill} ${s.printStatusSubmitted}`;
      default:
        return `${s.printStatusPill} ${s.printStatusDraft}`;
    }
  };

  return (
    <div className={s.printArea}>
      {/* ── Document Header ── */}
      <div className={s.printHeader}>
        <div className={s.printHeaderLeft}>
          {logoSrc ? (
            <img src={logoSrc} alt={partnerName} className={s.printLogo} />
          ) : (
            <div className={s.printCompany}>{partnerName}</div>
          )}
          {hotelInfo?.address && <div className={s.printCompanyAddr}>{hotelInfo.address}</div>}
          {(hotelInfo?.phone || hotelInfo?.email) && (
            <div className={s.printCompanyAddr}>
              {hotelInfo.phone && <span>Telp: {hotelInfo.phone}</span>}
              {hotelInfo.phone && hotelInfo.email && <span> · </span>}
              {hotelInfo.email && <span>Email: {hotelInfo.email}</span>}
            </div>
          )}
        </div>

        <div className={s.printHeaderRight}>
          <div className={s.printDocBadge}>Audit & Inventory Control</div>
          <h1 className={s.printDocTitle}>Berita Acara Stock Opname</h1>
          <div className={s.printDocSubTitle}>Laporan Rekonsiliasi Stok Fisik vs Stok Sistem</div>
          <div className={s.printDocNumBox}>
            <span className={s.printDocNumLabel}>No Dokumen:</span>
            <span className={s.printDocNumValue}>
              SO/{opname.period.replace('-', '')}/{(opname.department || 'GEN').substring(0, 4).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* ── Metadata Grid ── */}
      <div className={s.printMetaGrid}>
        <div className={s.printMetaItem}>
          <span className={s.printMetaLabel}>Departemen / Gudang</span>
          <span className={s.printMetaValue}>{opname.department || 'Purchasing / Central Store'}</span>
        </div>
        <div className={s.printMetaItem}>
          <span className={s.printMetaLabel}>Periode Audit</span>
          <span className={s.printMetaValue}>{opname.period}</span>
        </div>
        <div className={s.printMetaItem}>
          <span className={s.printMetaLabel}>Tanggal Pelaksanaan</span>
          <span className={s.printMetaValue}>{dateStr}</span>
        </div>
        <div className={s.printMetaItem}>
          <span className={s.printMetaLabel}>Auditor / Pelaksana</span>
          <span className={s.printMetaValue}>{opname.conducted_by_name || opname.conducted_by || 'Staff Auditor'}</span>
        </div>
        <div className={s.printMetaItem}>
          <span className={s.printMetaLabel}>Total SKU Di-audit</span>
          <span className={s.printMetaValue}>{items.length} Barang</span>
        </div>
        <div className={s.printMetaItem}>
          <span className={s.printMetaLabel}>Status Laporan</span>
          <span className={getStatusClass(opname.status)}>
            {opname.status?.toUpperCase() || 'DRAFT'}
          </span>
        </div>
      </div>

      {/* ── Financial Summary Box ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        padding: '10px 14px',
        marginBottom: '16px',
        border: '1px solid #cbd5e1',
        borderRadius: '6px',
        background: '#f8fafc',
        fontSize: '10.5px'
      }}>
        <div>
          <div style={{ fontSize: '8.5px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Total Nilai Sistem (Buku)</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{formatRupiah(totalBookVal)}</div>
        </div>
        <div>
          <div style={{ fontSize: '8.5px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Total Nilai Fisik (Aktual)</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{formatRupiah(totalPhysVal)}</div>
        </div>
        <div>
          <div style={{ fontSize: '8.5px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Selisih Bersih (Net Variance)</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: totalVarianceVal < 0 ? '#b91c1c' : totalVarianceVal > 0 ? '#15803d' : '#0f172a', marginTop: 2 }}>
            {totalVarianceVal > 0 ? '+' : ''}{formatRupiah(totalVarianceVal)}
          </div>
        </div>
      </div>

      {/* ── Items Table ── */}
      <table className={s.printTable}>
        <thead>
          <tr>
            <th style={{ width: '28px', textAlign: 'center' }}>No</th>
            <th>Item Description</th>
            <th style={{ width: '50px', textAlign: 'center' }}>Unit</th>
            <th style={{ width: '85px', textAlign: 'right' }}>Unit Cost</th>
            <th style={{ width: '70px', textAlign: 'right' }}>Book Stock</th>
            <th style={{ width: '70px', textAlign: 'right' }}>Physical Count</th>
            <th style={{ width: '60px', textAlign: 'right' }}>Variance</th>
            <th style={{ width: '90px', textAlign: 'right' }}>Var. Value</th>
            <th style={{ width: '110px' }}>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => {
            const catItems = items.filter(i => (i.category || 'General') === cat);
            return (
              <React.Fragment key={cat}>
                {/* Category Header Row */}
                <tr className={s.printCategoryRow}>
                  <td colSpan={9}>{cat} ({catItems.length} Barang)</td>
                </tr>
                {catItems.map((item, idx) => {
                  const varVal = item.variance * (item.unit_price || 0);
                  const isNeg = item.variance < 0;
                  const isPos = item.variance > 0;
                  return (
                    <tr key={item.item_id || idx}>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                      <td>
                        <div className={s.printItemName}>{item.name}</div>
                        {item.item_code && <div className={s.printItemSub}>Kode: {item.item_code}</div>}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.unit}</td>
                      <td style={{ textAlign: 'right' }}>{formatRupiah(item.unit_price || 0)}</td>
                      <td style={{ textAlign: 'right' }}>{item.system_qty}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{item.physical_qty}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: isNeg ? '#b91c1c' : isPos ? '#15803d' : '#0f172a' }}>
                        {isPos ? `+${item.variance}` : item.variance}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: isNeg ? '#b91c1c' : isPos ? '#15803d' : '#0f172a' }}>
                        {varVal > 0 ? `+${formatRupiah(varVal)}` : formatRupiah(varVal)}
                      </td>
                      <td style={{ fontSize: '9.5px', color: '#475569' }}>{item.notes || '—'}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} style={{ textAlign: 'right' }}>TOTAL NILAI AUDIT:</td>
            <td style={{ textAlign: 'right' }}>{formatRupiah(totalBookVal)}</td>
            <td style={{ textAlign: 'right' }}>{formatRupiah(totalPhysVal)}</td>
            <td></td>
            <td style={{ textAlign: 'right', color: totalVarianceVal < 0 ? '#b91c1c' : totalVarianceVal > 0 ? '#15803d' : '#0f172a' }}>
              {totalVarianceVal > 0 ? '+' : ''}{formatRupiah(totalVarianceVal)}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      {/* ── Notes Box ── */}
      {opname.notes && (
        <div className={s.printNotes}>
          <div className={s.printNotesLabel}>Catatan Khusus Audit & Kondisi Gudang</div>
          <div className={s.printNotesBody}>{opname.notes}</div>
        </div>
      )}

      {/* ── Signatures ── */}
      <div className={s.printSignatureRow}>
        <div className={s.printSignatureBox}>
          <div className={s.printSignatureRole}>Dihitung & Diaudit Oleh</div>
          <div className={s.printSignatureSpace}></div>
          <div className={s.printSignatureName}>({opname.conducted_by_name || opname.conducted_by || 'Staff Auditor'})</div>
          <div className={s.printSignatureTitle}>Cost Control / Staff Inventory</div>
        </div>

        <div className={s.printSignatureBox}>
          <div className={s.printSignatureRole}>Diperiksa & Diverifikasi</div>
          <div className={s.printSignatureSpace}></div>
          <div className={s.printSignatureName}>(...................................................)</div>
          <div className={s.printSignatureTitle}>Purchasing / Head of Department</div>
        </div>

        <div className={s.printSignatureBox}>
          <div className={s.printSignatureRole}>Disetujui Oleh</div>
          <div className={s.printSignatureSpace}></div>
          <div className={s.printSignatureName}>(...................................................)</div>
          <div className={s.printSignatureTitle}>Financial Controller / GM</div>
        </div>
      </div>
    </div>
  );
}
