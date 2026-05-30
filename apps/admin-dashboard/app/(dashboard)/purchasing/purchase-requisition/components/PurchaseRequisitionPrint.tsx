'use client';

import React from 'react';
import { formatRupiah } from '@/lib/purchasing/utils';
import s from '../../shared-page.module.css';

interface PurchaseRequisitionPrintProps {
  selectedPr: any;
}

export default function PurchaseRequisitionPrint({ selectedPr }: PurchaseRequisitionPrintProps) {
  if (!selectedPr) return null;

  return (
    <div className={s.printArea}>
      <div className={s.printHeader}>
        <div className={s.printHeaderLeft}>
          <div className={s.printCompany}>Bumi Anyom Hospitality</div>
          <div className={s.printCompanyAddr}>Jl. Contoh Alamat No. 123, Bali, Indonesia</div>
        </div>
        <div>
          <div className={s.printDocTitle}>PURCHASE REQUISITION (PR)</div>
          <div className={s.printDocNum}>NO: {selectedPr.pr_number}</div>
        </div>
      </div>

      <div className={s.printMetaGrid}>
        <div>
          <div className={s.printMetaLabel}>Tanggal Order</div>
          <div className={s.printMetaValue}>{selectedPr.order_date ? new Date(selectedPr.order_date).toLocaleDateString('id-ID') : '—'}</div>
        </div>
        <div>
          <div className={s.printMetaLabel}>Tanggal Datang</div>
          <div className={s.printMetaValue}>{selectedPr.delivery_date ? (selectedPr.delivery_date.toDate ? selectedPr.delivery_date.toDate().toLocaleDateString('id-ID') : new Date(selectedPr.delivery_date).toLocaleDateString('id-ID')) : '—'}</div>
        </div>
        <div>
          <div className={s.printMetaLabel}>Department</div>
          <div className={s.printMetaValue}>
            {selectedPr.department || '—'}
            {selectedPr.department === 'Food & Beverage' && selectedPr.fb_category && ` (${selectedPr.fb_category})`}
            {selectedPr.department === 'Food & Beverage' && selectedPr.event_category && ` - ${selectedPr.event_category}`}
          </div>
        </div>
        <div>
          <div className={s.printMetaLabel}>Supplier</div>
          <div className={s.printMetaValue}>{Array.from(new Set((selectedPr.items ?? []).map((i: any) => i.supplier_name))).filter(Boolean).join(', ') || '—'}</div>
        </div>
        <div>
          <div className={s.printMetaLabel}>Requested By</div>
          <div className={s.printMetaValue}>{selectedPr.requested_by_name || 'Staff'}</div>
        </div>
        <div>
          <div className={s.printMetaLabel}>Status</div>
          <div className={s.printMetaValue} style={{ textTransform: 'capitalize' }}>{selectedPr.status}</div>
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
          {selectedPr.items.map((item: any, idx: number) => (
            <tr key={idx}>
              <td style={{ textAlign: 'center' }}>{idx + 1}</td>
              <td>{item.name} <br/><span style={{ fontSize: 9, color: '#666' }}>{item.supplier_name}</span></td>
              <td style={{ textAlign: 'center' }}>{item.unit}</td>
              <td style={{ textAlign: 'right' }}>{item.qty}</td>
              <td style={{ textAlign: 'right' }}>{formatRupiah(item.estimated_price || 0)}</td>
              <td style={{ textAlign: 'right' }}>{formatRupiah(item.qty * (item.estimated_price || 0))}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} style={{ textAlign: 'right' }}>TOTAL ESTIMASI:</td>
            <td style={{ textAlign: 'right' }}>{formatRupiah(selectedPr.total_estimated || 0)}</td>
          </tr>
        </tfoot>
      </table>

      {selectedPr.notes && (
        <div className={s.printNotes}>
          <div className={s.printNotesLabel}>Purchase Order Memo</div>
          <div>{selectedPr.notes}</div>
        </div>
      )}

      <div className={s.printSignatureRow}>
        <div className={s.printSignBlock}>
          <div className={s.printSignTitle}>Requested By</div>
          <div className={s.printSignLine}></div>
          <div className={s.printSignName}>{selectedPr.requested_by_name || 'Purchasing'}</div>
        </div>
        <div className={s.printSignBlock}>
          <div className={s.printSignTitle}>Acknowledged By</div>
          <div className={s.printSignLine}></div>
          <div className={s.printSignName}>Procurement Manager</div>
        </div>
        <div className={s.printSignBlock}>
          <div className={s.printSignTitle}>Approved By</div>
          <div className={s.printSignLine}></div>
          <div className={s.printSignName}>Finance Director</div>
        </div>
      </div>
    </div>
  );
}
