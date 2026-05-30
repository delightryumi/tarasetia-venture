'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import { PStatusChip } from '@/components/purchasing/ui/PStatusChip';
import s from '../../shared-page.module.css';

interface StoreRequisitionTableProps {
  loading: boolean;
  filteredSrs: any[];
  selectedSr: any;
  setSelectedSr: (sr: any) => void;
}

export default function StoreRequisitionTable({
  loading,
  filteredSrs,
  selectedSr,
  setSelectedSr
}: StoreRequisitionTableProps) {
  return (
    <div className={s.tableCard}>
      <table className={s.table}>
        <thead className={s.tableHead}>
          <tr>
            <th>SR Number</th>
            <th>Date</th>
            <th>Department</th>
            <th>Supplier</th>
            <th>Requested By</th>
            <th>Items</th>
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
          ) : filteredSrs.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <div className={s.empty}>
                  <FileText size={40} className={s.emptyIcon} />
                  <p className={s.emptyTitle}>No store requisitions</p>
                  <p className={s.emptyBody}>Create your first requisition to request items from the store.</p>
                </div>
              </td>
            </tr>
          ) : (
            filteredSrs.map((sr: any) => {
              const dateObj = sr.created_at?.toDate ? sr.created_at.toDate() : new Date(sr.created_at);
              const srSuppliers = Array.from(new Set((sr.items ?? []).map((i: any) => i.supplier_name))).filter(Boolean);
              return (
                <tr 
                  key={sr.id} 
                  className={selectedSr?.id === sr.id ? s.rowSelected : ''} 
                  onClick={() => setSelectedSr(sr)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className={s.tdPrimary}>{sr.sr_number}</td>
                  <td className={s.tdMuted}>{dateObj.toLocaleDateString('id-ID')}</td>
                  <td>
                    {sr.department}
                    {sr.department === 'Food & Beverage' && sr.fb_category && ` (${sr.fb_category})`}
                  </td>
                  <td className={s.tdMuted}>{srSuppliers.join(', ') || '—'}</td>
                  <td className={s.tdMuted}>{sr.requested_by_name || sr.requested_by}</td>
                  <td className={s.tdMuted}>{sr.items.length} lines</td>
                  <td><PStatusChip status={sr.status} /></td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
