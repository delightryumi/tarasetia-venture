'use client';

import React from 'react';
import { formatRupiah } from '@/lib/purchasing/utils';
import s from '../../PurchasingPrint.module.css';
import { useSettings } from '@/hooks/useSettings';

interface PurchaseRequisitionPrintProps {
  selectedPr: any;
}

export default function PurchaseRequisitionPrint({ selectedPr }: PurchaseRequisitionPrintProps) {
  const { branding, property, pos } = useSettings();
  const hotelInfo = property || pos;
  const logoSrc = branding?.lightLogo || branding?.logoUrl || branding?.darkLogo;

  if (!selectedPr) return null;

  const formatDate = (val: any) => {
    if (!val) return '—';
    if (val?.toDate) {
      return val.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return `${s.printStatusPill} ${s.printStatusApproved}`;
      case 'submitted': return `${s.printStatusPill} ${s.printStatusSubmitted}`;
      default: return `${s.printStatusPill} ${s.printStatusDraft}`;
    }
  };

  return (
    <div className={s.printArea}>
      {/* ── Document Header ── */}
      <div className={s.printHeader}>
        <div className={s.printHeaderLeft}>
          {logoSrc ? (
            <img src={logoSrc} alt="Logo" className={s.printLogo} />
          ) : (
            <div className={s.printCompany}>{hotelInfo?.name || 'BUMI ANYOM HOTEL'}</div>
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
          <div className={s.printDocBadge}>Official Procurement</div>
          <h1 className={s.printDocTitle}>Purchase Requisition</h1>
          <div className={s.printDocSubTitle}>Permintaan Pembelian Barang (PR)</div>
          <div className={s.printDocNumBox}>
            <span className={s.printDocNumLabel}>NO PR:</span>
            <span className={s.printDocNumValue}>{selectedPr.pr_number}</span>
          </div>
        </div>
      </div>

      {/* ── Metadata Grid ── */}
      <div className={s.printMetaGrid}>
        <div className={s.printMetaItem}>
          <div className={s.printMetaLabel}>Tanggal Order</div>
          <div className={s.printMetaValue}>{formatDate(selectedPr.order_date || selectedPr.date)}</div>
        </div>
        <div className={s.printMetaItem}>
          <div className={s.printMetaLabel}>Target Pengiriman</div>
          <div className={s.printMetaValue}>{formatDate(selectedPr.delivery_date)}</div>
        </div>
        <div className={s.printMetaItem}>
          <div className={s.printMetaLabel}>Departemen Pemohon</div>
          <div className={s.printMetaValue}>{selectedPr.department || '—'}</div>
        </div>
        <div className={s.printMetaItem}>
          <div className={s.printMetaLabel}>Diajukan Oleh</div>
          <div className={s.printMetaValue}>{selectedPr.requested_by_name || selectedPr.requested_by || 'Staff'}</div>
        </div>
        <div className={s.printMetaItem}>
          <div className={s.printMetaLabel}>Status PR</div>
          <div>
            <span className={getStatusClass(selectedPr.status)}>
              {selectedPr.status || 'Draft'}
            </span>
          </div>
        </div>
        <div className={s.printMetaItem}>
          <div className={s.printMetaLabel}>Total Baris Item</div>
          <div className={s.printMetaValue}>{(selectedPr.items || []).length} Item</div>
        </div>
      </div>

      {/* ── Items Table ── */}
      <table className={s.printTable}>
        <thead>
          <tr>
            <th style={{ width: 36, textAlign: 'center' }}>NO</th>
            <th>NAMA BARANG & SPESIFIKASI</th>
            <th style={{ width: 64, textAlign: 'center' }}>SATUAN</th>
            <th style={{ width: 70, textAlign: 'right' }}>JUMLAH</th>
            <th style={{ width: 110, textAlign: 'right' }}>HARGA ESTIMASI</th>
            <th style={{ width: 120, textAlign: 'right' }}>TOTAL ESTIMASI</th>
          </tr>
        </thead>
        <tbody>
          {(selectedPr.items || []).map((item: any, idx: number) => (
            <tr key={idx}>
              <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
              <td>
                <div className={s.printItemName}>{item.name}</div>
                {(item.supplier_name || item.notes) && (
                  <div className={s.printItemSub}>
                    {item.supplier_name && <span>Vendor: {item.supplier_name}</span>}
                    {item.supplier_name && item.notes && <span> · </span>}
                    {item.notes && <span>Catatan: {item.notes}</span>}
                  </div>
                )}
              </td>
              <td style={{ textAlign: 'center', fontWeight: 500 }}>{item.unit}</td>
              <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{item.qty}</td>
              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(item.estimated_price || 0)}</td>
              <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {formatRupiah(item.qty * (item.estimated_price || 0))}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} style={{ textAlign: 'right', letterSpacing: '0.04em' }}>TOTAL ESTIMASI BIAYA:</td>
            <td style={{ textAlign: 'right', fontSize: '12.5px', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
              {formatRupiah(selectedPr.total_estimated || 0)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* ── Notes ── */}
      {selectedPr.notes && (
        <div className={s.printNotes}>
          <div className={s.printNotesLabel}>Catatan Khusus / Remarks</div>
          <div className={s.printNotesBody}>{selectedPr.notes}</div>
        </div>
      )}

      {selectedPr.extra && Object.entries(selectedPr.extra).map(([key, value]) => (
        <div className={s.printNotes} key={key}>
          <div className={s.printNotesLabel}>{key}</div>
          <div className={s.printNotesBody}>{String(value)}</div>
        </div>
      ))}

      {/* ── Signatures ── */}
      <div className={s.printSignatureRow}>
        <div className={s.printSignBlock}>
          <div className={s.printSignTitle}>Requested By</div>
          <div className={s.printSignSpace}></div>
          <div className={s.printSignName}>{selectedPr.requested_by_name || selectedPr.requested_by || 'Staff'}</div>
          <div className={s.printSignRole}>Department Requester</div>
          <div className={s.printSignDate}>Tgl: ___________________</div>
        </div>
        <div className={s.printSignBlock}>
          <div className={s.printSignTitle}>Acknowledged By</div>
          <div className={s.printSignSpace}></div>
          <div className={s.printSignName}>Department Head</div>
          <div className={s.printSignRole}>Head of Department</div>
          <div className={s.printSignDate}>Tgl: ___________________</div>
        </div>
        <div className={s.printSignBlock}>
          <div className={s.printSignTitle}>Approved By</div>
          <div className={s.printSignSpace}></div>
          <div className={s.printSignName}>Finance Director / GM</div>
          <div className={s.printSignRole}>Financial Approval</div>
          <div className={s.printSignDate}>Tgl: ___________________</div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className={s.printFooter}>
        <div>Powered by <a href="https://mytara.id" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>Tara</a> · {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        <div>Dokumen Pengadaan Barang Resmi</div>
      </div>
    </div>
  );
}
