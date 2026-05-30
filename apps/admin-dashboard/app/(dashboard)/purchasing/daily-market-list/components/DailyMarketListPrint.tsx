'use client';

import React from 'react';
import { formatRupiah } from '@/lib/purchasing/utils';
import s from '../../shared-page.module.css';

interface DailyMarketListPrintProps {
  selectedDml: any;
}

export default function DailyMarketListPrint({ selectedDml }: DailyMarketListPrintProps) {
  if (!selectedDml) return null;

  return (
    <div className={s.printArea}>
      <div className={s.printHeader}>
        <div className={s.printHeaderLeft}>
          <div className={s.printCompany}>Bumi Anyom Hospitality</div>
          <div className={s.printCompanyAddr}>Jl. Contoh Alamat No. 123, Bali, Indonesia</div>
        </div>
        <div>
          <div className={s.printDocTitle}>DAILY MARKET LIST (DML)</div>
          <div className={s.printDocNum}>NO: {selectedDml.dml_number}</div>
        </div>
      </div>

      <div className={s.printMetaGrid}>
        <div>
          <div className={s.printMetaLabel}>Tanggal Order</div>
          <div className={s.printMetaValue}>{selectedDml.order_date ? new Date(selectedDml.order_date).toLocaleDateString('id-ID') : '—'}</div>
        </div>
        <div>
          <div className={s.printMetaLabel}>Tanggal Datang</div>
          <div className={s.printMetaValue}>{selectedDml.delivery_date ? (selectedDml.delivery_date.toDate ? selectedDml.delivery_date.toDate().toLocaleDateString('id-ID') : new Date(selectedDml.delivery_date).toLocaleDateString('id-ID')) : '—'}</div>
        </div>
        <div>
          <div className={s.printMetaLabel}>Departemen</div>
          <div className={s.printMetaValue}>{selectedDml.department || 'Food & Beverage'}</div>
        </div>
        <div>
          <div className={s.printMetaLabel}>Kategori (F&B)</div>
          <div className={s.printMetaValue}>{selectedDml.fb_category || '—'}</div>
        </div>
        <div>
          <div className={s.printMetaLabel}>Service Type</div>
          <div className={s.printMetaValue}>{selectedDml.event_category || '—'}</div>
        </div>
        <div>
          <div className={s.printMetaLabel}>Supplier</div>
          <div className={s.printMetaValue}>{Array.from(new Set((selectedDml.items ?? []).map((i: any) => i.supplier_name))).filter(Boolean).join(', ') || '—'}</div>
        </div>
        <div>
          <div className={s.printMetaLabel}>Prepared By</div>
          <div className={s.printMetaValue}>{selectedDml.submitted_by_name || 'Chef'}</div>
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
          {(() => {
            const itemsList = selectedDml.items as any[];
            const grouped: Record<string, any[]> = {};
            itemsList.forEach(item => { const cat = item.category || 'Uncategorized'; if (!grouped[cat]) grouped[cat] = []; grouped[cat].push(item); });
            let counter = 0;
            return Object.keys(grouped).sort().flatMap(cat => [
              <tr key={`pcat-${cat}`}>
                <td colSpan={6} style={{ background: '#222', color: '#fff', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '5px 10px', border: 'none' }}>{cat}</td>
              </tr>,
              ...grouped[cat].map(item => { 
                counter++; 
                return (
                  <tr key={`p-${counter}`}>
                    <td style={{ textAlign: 'center' }}>{counter}</td>
                    <td style={{ paddingLeft: 16 }}>{item.name}</td>
                    <td style={{ textAlign: 'center' }}>{item.unit}</td>
                    <td style={{ textAlign: 'right' }}>{item.qty_ordered}</td>
                    <td style={{ textAlign: 'right' }}>{formatRupiah(item.unit_price || 0)}</td>
                    <td style={{ textAlign: 'right' }}>{formatRupiah(item.total || (item.qty_ordered * (item.unit_price || 0)))}</td>
                  </tr>
                ); 
              })
            ]);
          })()}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} style={{ textAlign: 'right' }}>TOTAL ESTIMASI:</td>
            <td style={{ textAlign: 'right' }}>{formatRupiah(selectedDml.total_cost)}</td>
          </tr>
        </tfoot>
      </table>

      {selectedDml.notes && (
        <div className={s.printNotes}>
          <div className={s.printNotesLabel}>Catatan Khusus (Chef's Notes)</div>
          <div>{selectedDml.notes}</div>
        </div>
      )}

      <div className={s.printSignatureRow}>
        <div className={s.printSignBlock}>
          <div className={s.printSignTitle}>Prepared By</div>
          <div className={s.printSignLine}></div>
          <div className={s.printSignName}>{selectedDml.submitted_by_name || 'Staff'}</div>
        </div>
        <div className={s.printSignBlock}>
          <div className={s.printSignTitle}>Acknowledged By</div>
          <div className={s.printSignLine}></div>
          <div className={s.printSignName}>Executive Chef</div>
        </div>
        <div className={s.printSignBlock}>
          <div className={s.printSignTitle}>Verified By</div>
          <div className={s.printSignLine}></div>
          <div className={s.printSignName}>F&B Director / Purchasing</div>
        </div>
      </div>
    </div>
  );
}
