'use client';

import React from 'react';
import { formatRupiah } from '@/lib/purchasing/utils';
import s from '../../PurchasingPrint.module.css';
import { useSettings } from '@/hooks/useSettings';

interface StoreRequisitionPrintProps {
  selectedSr: any;
}

export default function StoreRequisitionPrint({ selectedSr }: StoreRequisitionPrintProps) {
  const { branding, property, pos } = useSettings();
  const hotelInfo = property || pos;
  const logoSrc = branding?.lightLogo || branding?.logoUrl || branding?.darkLogo;

  if (!selectedSr) return null;

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
      case 'fulfilled':
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
          <div className={s.printDocBadge}>Internal Warehouse</div>
          <h1 className={s.printDocTitle}>Store Requisition</h1>
          <div className={s.printDocSubTitle}>Permintaan Pengambilan Gudang (SR)</div>
          <div className={s.printDocNumBox}>
            <span className={s.printDocNumLabel}>NO SR:</span>
            <span className={s.printDocNumValue}>{selectedSr.sr_number}</span>
          </div>
        </div>
      </div>

      {/* ── Metadata Grid ── */}
      <div className={s.printMetaGrid}>
        <div className={s.printMetaItem}>
          <div className={s.printMetaLabel}>Tanggal Permintaan</div>
          <div className={s.printMetaValue}>{formatDate(selectedSr.order_date || selectedSr.date)}</div>
        </div>
        <div className={s.printMetaItem}>
          <div className={s.printMetaLabel}>Tanggal Kebutuhan / Ambil</div>
          <div className={s.printMetaValue}>{formatDate(selectedSr.delivery_date)}</div>
        </div>
        <div className={s.printMetaItem}>
          <div className={s.printMetaLabel}>Departemen Pemohon</div>
          <div className={s.printMetaValue}>
            {selectedSr.department || '—'}
            {selectedSr.department === 'Food & Beverage' && selectedSr.fb_category && ` (${selectedSr.fb_category})`}
            {selectedSr.department === 'Food & Beverage' && selectedSr.event_category && ` - ${selectedSr.event_category}`}
          </div>
        </div>
        <div className={s.printMetaItem}>
          <div className={s.printMetaLabel}>Diajukan Oleh</div>
          <div className={s.printMetaValue}>{selectedSr.requested_by_name || selectedSr.requested_by || 'Staff'}</div>
        </div>
        <div className={s.printMetaItem}>
          <div className={s.printMetaLabel}>Status Pengeluaran</div>
          <div>
            <span className={getStatusClass(selectedSr.status)}>
              {selectedSr.status || 'Draft'}
            </span>
          </div>
        </div>
        <div className={s.printMetaItem}>
          <div className={s.printMetaLabel}>Total Baris Item</div>
          <div className={s.printMetaValue}>{(selectedSr.items || []).length} Item</div>
        </div>
      </div>

      {/* ── Items Table ── */}
      <table className={s.printTable}>
        <thead>
          <tr>
            <th style={{ width: 36, textAlign: 'center' }}>NO</th>
            <th>NAMA BARANG & KETERANGAN</th>
            <th style={{ width: 64, textAlign: 'center' }}>SATUAN</th>
            <th style={{ width: 70, textAlign: 'right' }}>JUMLAH</th>
            <th style={{ width: 110, textAlign: 'right' }}>HARGA SATUAN</th>
            <th style={{ width: 120, textAlign: 'right' }}>TOTAL NILAI</th>
          </tr>
        </thead>
        <tbody>
          {(selectedSr.items || []).map((item: any, idx: number) => (
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
              <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{item.qty_requested}</td>
              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(item.unit_price || 0)}</td>
              <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {formatRupiah(item.total || (item.qty_requested * (item.unit_price || 0)))}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} style={{ textAlign: 'right', letterSpacing: '0.04em' }}>TOTAL NILAI PENGELUARAN BARANG:</td>
            <td style={{ textAlign: 'right', fontSize: '12.5px', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
              {formatRupiah(selectedSr.total_cost || 0)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* ── Notes ── */}
      {selectedSr.notes && (
        <div className={s.printNotes}>
          <div className={s.printNotesLabel}>Remarks / Catatan Permintaan</div>
          <div className={s.printNotesBody}>{selectedSr.notes}</div>
        </div>
      )}

      {/* ── Signatures ── */}
      <div className={s.printSignatureRow}>
        <div className={s.printSignBlock}>
          <div className={s.printSignTitle}>Requested By</div>
          <div className={s.printSignSpace}></div>
          <div className={s.printSignName}>{selectedSr.requested_by_name || selectedSr.requested_by || 'Staff'}</div>
          <div className={s.printSignRole}>Requester Staff</div>
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
          <div className={s.printSignTitle}>Fulfilled / Issued By</div>
          <div className={s.printSignSpace}></div>
          <div className={s.printSignName}>Storekeeper / Purchasing</div>
          <div className={s.printSignRole}>General Store</div>
          <div className={s.printSignDate}>Tgl: ___________________</div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className={s.printFooter}>
        <div>Dicetak melalui Sistem CRS Setara Venture · {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        <div>Dokumen Pengeluaran Gudang Resmi</div>
      </div>
    </div>
  );
}
