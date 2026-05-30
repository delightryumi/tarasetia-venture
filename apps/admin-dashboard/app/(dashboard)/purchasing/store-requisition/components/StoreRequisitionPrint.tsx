'use client';

import React from 'react';
import { formatRupiah } from '@/lib/purchasing/utils';
import s from '../../shared-page.module.css';

interface StoreRequisitionPrintProps {
  selectedSr: any;
}

export default function StoreRequisitionPrint({ selectedSr }: StoreRequisitionPrintProps) {
  if (!selectedSr) return null;

  return (
    <div className={s.printArea}>
      <div className={s.printHeader}>
        <div className={s.printHeaderLeft}>
          <div className={s.printCompany}>Bumi Anyom Hospitality</div>
          <div className={s.printCompanyAddr}>Jl. Contoh Alamat No. 123, Bali, Indonesia</div>
        </div>
        <div>
          <div className={s.printDocTitle}>STORE REQUISITION (SR)</div>
          <div className={s.printDocNum}>NO: {selectedSr.sr_number}</div>
        </div>
      </div>

      <div className={s.printMetaGrid}>
        <div>
          <div className={s.printMetaLabel}>Tanggal Order</div>
          <div className={s.printMetaValue}>{selectedSr.order_date ? new Date(selectedSr.order_date).toLocaleDateString('id-ID') : '—'}</div>
        </div>
        <div>
          <div className={s.printMetaLabel}>Tanggal Datang</div>
          <div className={s.printMetaValue}>{selectedSr.delivery_date ? (selectedSr.delivery_date.toDate ? selectedSr.delivery_date.toDate().toLocaleDateString('id-ID') : new Date(selectedSr.delivery_date).toLocaleDateString('id-ID')) : '—'}</div>
        </div>
        <div>
          <div className={s.printMetaLabel}>Departemen</div>
          <div className={s.printMetaValue}>
            {selectedSr.department || '—'}
            {selectedSr.department === 'Food & Beverage' && selectedSr.fb_category && ` (${selectedSr.fb_category})`}
            {selectedSr.department === 'Food & Beverage' && selectedSr.event_category && ` - ${selectedSr.event_category}`}
          </div>
        </div>
        <div>
          <div className={s.printMetaLabel}>Supplier</div>
          <div className={s.printMetaValue}>{Array.from(new Set((selectedSr.items ?? []).map((i: any) => i.supplier_name))).filter(Boolean).join(', ') || '—'}</div>
        </div>
        <div>
          <div className={s.printMetaLabel}>Requested By</div>
          <div className={s.printMetaValue}>{selectedSr.requested_by_name || 'Staff'}</div>
        </div>
        <div>
          <div className={s.printMetaLabel}>Status</div>
          <div className={s.printMetaValue} style={{ textTransform: 'capitalize' }}>{selectedSr.status}</div>
        </div>
      </div>

      <table className={s.printTable}>
        <thead>
          <tr>
            <th style={{ width: 40 }}>NO</th>
            <th>NAMA BARANG</th>
            <th style={{ textAlign: 'center' }}>UNIT</th>
            <th style={{ textAlign: 'right' }}>JUMLAH</th>
            <th style={{ textAlign: 'right' }}>HARGA SATUAN</th>
            <th style={{ textAlign: 'right' }}>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {selectedSr.items.map((item: any, idx: number) => (
            <tr key={idx}>
              <td style={{ textAlign: 'center' }}>{idx + 1}</td>
              <td>{item.name} {item.notes && <><br/><span style={{ fontSize: 9, color: '#666' }}>{item.notes}</span></>}</td>
              <td style={{ textAlign: 'center' }}>{item.unit}</td>
              <td style={{ textAlign: 'right' }}>{item.qty_requested}</td>
              <td style={{ textAlign: 'right' }}>{formatRupiah(item.unit_price || 0)}</td>
              <td style={{ textAlign: 'right' }}>{formatRupiah(item.total || (item.qty_requested * (item.unit_price || 0)))}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} style={{ textAlign: 'right' }}>TOTAL ESTIMASI:</td>
            <td style={{ textAlign: 'right' }}>{formatRupiah(selectedSr.total_cost || 0)}</td>
          </tr>
        </tfoot>
      </table>

      {selectedSr.notes && (
        <div className={s.printNotes}>
          <div className={s.printNotesLabel}>Remarks / Remarks Tambahan</div>
          <div>{selectedSr.notes}</div>
        </div>
      )}

      <div className={s.printSignatureRow}>
        <div className={s.printSignBlock}>
          <div className={s.printSignTitle}>Requested By</div>
          <div className={s.printSignLine}></div>
          <div className={s.printSignName}>{selectedSr.requested_by_name || 'Staff'}</div>
        </div>
        <div className={s.printSignBlock}>
          <div className={s.printSignTitle}>Acknowledged By</div>
          <div className={s.printSignLine}></div>
          <div className={s.printSignName}>Department Head</div>
        </div>
        <div className={s.printSignBlock}>
          <div className={s.printSignTitle}>Approved / Fulfilled By</div>
          <div className={s.printSignLine}></div>
          <div className={s.printSignName}>Store / Purchasing</div>
        </div>
      </div>
    </div>
  );
}
