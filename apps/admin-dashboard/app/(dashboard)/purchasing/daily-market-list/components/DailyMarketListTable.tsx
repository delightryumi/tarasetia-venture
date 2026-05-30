'use client';

import React from 'react';
import { Coffee } from 'lucide-react';
import { PStatusChip } from '@/components/purchasing/ui/PStatusChip';
import { formatRupiah } from '@/lib/purchasing/utils';
import s from '../../shared-page.module.css';

interface DailyMarketListTableProps {
  loading: boolean;
  filteredDmls: any[];
  selectedDml: any;
  setSelectedDml: (dml: any) => void;
}

export default function DailyMarketListTable({
  loading,
  filteredDmls,
  selectedDml,
  setSelectedDml
}: DailyMarketListTableProps) {
  return (
    <div className={s.tableCard}>
      <table className={s.table}>
        <thead className={s.tableHead}>
          <tr>
            <th>DML Number</th>
            <th>Date</th>
            <th>Prepared By</th>
            <th>Supplier</th>
            <th className={s.thRight}>Items</th>
            <th className={s.thRight}>Total Est.</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody className={s.tableBody}>
          {loading ? (
            <tr>
              <td colSpan={7}>
                <div className={s.empty}>
                  <p className={s.emptyBody}>Loading…</p>
                </div>
              </td>
            </tr>
          ) : filteredDmls.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <div className={s.empty}>
                  <Coffee size={40} className={s.emptyIcon} />
                  <p className={s.emptyTitle}>No daily market lists</p>
                  <p className={s.emptyBody}>Generate a fresh produce checklist to start procurement.</p>
                </div>
              </td>
            </tr>
          ) : (
            filteredDmls.map((dml: any) => {
              const dateObj = dml.date?.toDate ? dml.date.toDate() : new Date(dml.date);
              const dmlSuppliers = Array.from(new Set((dml.items ?? []).map((i: any) => i.supplier_name))).filter(Boolean);
              return (
                <tr 
                  key={dml.id} 
                  className={selectedDml?.id === dml.id ? s.rowSelected : ''} 
                  onClick={() => setSelectedDml(dml)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className={s.tdPrimary}>{dml.dml_number}</td>
                  <td>{dateObj.toLocaleDateString('id-ID')}</td>
                  <td className={s.tdMuted}>{dml.submitted_by_name || dml.submitted_by}</td>
                  <td className={s.tdMuted}>{dmlSuppliers.join(', ') || '—'}</td>
                  <td className={`${s.tdRight} ${s.tdMuted}`}>{dml.items.length}</td>
                  <td className={`${s.tdRight} ${s.tdMono}`}>{formatRupiah(dml.total_cost)}</td>
                  <td><PStatusChip status={dml.status} /></td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
