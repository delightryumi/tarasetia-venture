'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { PStatusChip } from '@/components/purchasing/ui/PStatusChip';
import { formatRupiah } from '@/lib/purchasing/utils';
import s from '../../shared-page.module.css';

interface PurchaseRequisitionTableProps {
  loading: boolean;
  filteredPrs: any[];
  selectedPr: any;
  setSelectedPr: (pr: any) => void;
}

export default function PurchaseRequisitionTable({
  loading,
  filteredPrs,
  selectedPr,
  setSelectedPr
}: PurchaseRequisitionTableProps) {
  return (
    <div className={s.tableCard}>
      <table className={s.table}>
        <thead className={s.tableHead}>
          <tr>
            <th>PR Number</th>
            <th>Date</th>
            <th>Department</th>
            <th>Supplier(s)</th>
            <th className={s.thRight}>Est. Cost</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody className={s.tableBody}>
          {loading ? (
            <tr>
              <td colSpan={6}>
                <div className={s.empty}>
                  <p className={s.emptyBody}>Loading…</p>
                </div>
              </td>
            </tr>
          ) : filteredPrs.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <div className={s.empty}>
                  <ShoppingCart size={40} className={s.emptyIcon} />
                  <p className={s.emptyTitle}>No purchase requisitions</p>
                  <p className={s.emptyBody}>Create your first Purchase Requisition to acquire assets or non-store items.</p>
                </div>
              </td>
            </tr>
          ) : (
            filteredPrs.map((pr: any) => {
              const sups = Array.from(new Set((pr.items ?? []).map((i: any) => i.supplier_name))).filter(Boolean);
              const dateObj = pr.created_at?.toDate ? pr.created_at.toDate() : new Date(pr.created_at);
              return (
                <tr 
                  key={pr.id} 
                  className={selectedPr?.id === pr.id ? s.rowSelected : ''} 
                  onClick={() => setSelectedPr(pr)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className={s.tdPrimary}>{pr.pr_number}</td>
                  <td className={s.tdMuted}>{dateObj.toLocaleDateString('id-ID')}</td>
                  <td>
                    {pr.department || '—'}
                    {pr.department === 'Food & Beverage' && pr.fb_category && ` (${pr.fb_category})`}
                  </td>
                  <td className={s.tdMuted}>{sups.join(', ') || '—'}</td>
                  <td className={`${s.tdRight} ${s.tdMono}`}>{formatRupiah(pr.total_estimated)}</td>
                  <td><PStatusChip status={pr.status} /></td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
