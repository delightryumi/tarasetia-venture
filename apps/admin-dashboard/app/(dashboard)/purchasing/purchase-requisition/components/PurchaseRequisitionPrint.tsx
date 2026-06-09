'use client';

import React from 'react';
import Image from 'next/image';
import { formatRupiah } from '@/lib/purchasing/utils';
import s from '../../shared-page.module.css';
import { useSettings } from '@/hooks/useSettings';

interface PurchaseRequisitionPrintProps {
  selectedPr: any;
}

export default function PurchaseRequisitionPrint({ selectedPr }: PurchaseRequisitionPrintProps) {
  const { branding, pos } = useSettings();
  if (!selectedPr) return null;

  return (
    <div className={s.printArea}>
        <div className={s.darkCard}>
          <div className={s.printHeaderLeft}>
            {branding?.darkLogo && <img src={branding.darkLogo} alt="Logo" className={s.printLogo} />}
            <div className={s.printCompany}>{pos?.name || 'Hotel'}</div>
            <div className={s.printCompanyAddr}>{pos?.address || ''}</div>
            {pos?.phone && <div className={s.printCompanyAddr}>{pos.phone}</div>}
          </div>
          <div>
            <div className={s.printDocTitle}>PERMINTAAN PEMBELIAN (PR)</div>
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
          <div className={s.printMetaLabel}>Departemen</div>
          <div className={s.printMetaValue}>{selectedPr.department || '—'}</div>
        </div>
        <div>

        </div>
        <div>
          <div className={s.printMetaLabel}>Diajukan Oleh</div>
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
              <td style={{ paddingLeft: 16 }}>{item.name}<br/><span style={{ fontSize: 9, color: '#666' }}>{item.supplier_name}</span></td>
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
            <div className={s.printNotesLabel}>Catatan Tambahan</div>
            <div>{selectedPr.notes}</div>
          </div>
        )}
        {/* Render any extra fields */}
        {selectedPr.extra && Object.entries(selectedPr.extra).map(([key, value]) => (
          <div className={s.printNotes} key={key}>
            <div className={s.printNotesLabel}>{key}</div>
            <div>{String(value)}</div>
          </div>
        ))}

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
