'use client';

import React from 'react';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { PStatusChip } from '@/components/purchasing/ui/PStatusChip';
import { formatRupiah } from '@/lib/purchasing/utils';
import s from '../../shared-page.module.css';

interface PurchaseRequisitionTableProps {
  loading: boolean;
  filteredPrs: any[];
  selectedPr: any;
  setSelectedPr: (pr: any) => void;
  deletePR: (id: string) => void;
  onDeleteClick: (id: string) => void;
}

export default function PurchaseRequisitionTable({
  loading,
  filteredPrs,
  selectedPr,
  setSelectedPr,
  deletePR,
  onDeleteClick,
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
            <th>Action</th>
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
          ) : filteredPrs.length === 0 ? (
            <tr>
              <td colSpan={7}>
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
              const itemsList = pr.items || [];
              const hasTempo = itemsList.some((i: any) => i.paymentStatus === 'tempo');
              const hasPaid = itemsList.some((i: any) => (i.paymentStatus || 'paid') === 'paid');
              
              let badgeText = 'PAID';
              let badgeBg = 'rgba(16, 185, 129, 0.08)';
              let badgeColor = '#10b981';
              let badgeBorder = 'rgba(16, 185, 129, 0.2)';
              
              if (hasTempo && hasPaid) {
                badgeText = 'MIXED';
                badgeBg = 'rgba(245, 158, 11, 0.08)';
                badgeColor = '#f59e0b';
                badgeBorder = 'rgba(245, 158, 11, 0.2)';
              } else if (hasTempo) {
                badgeText = 'TEMPO';
                badgeBg = 'rgba(239, 68, 68, 0.08)';
                badgeColor = '#ef4444';
                badgeBorder = 'rgba(239, 68, 68, 0.2)';
              }

              return (
                <tr 
                  key={pr.id} 
                  className={selectedPr?.id === pr.id ? s.rowSelected : ''} 
                  onClick={() => setSelectedPr(pr)}
                  style={{ cursor: 'pointer' }}
                >
                   <td className={s.tdPrimary}>
                     <div>{pr.pr_number}</div>
                      <span style={{ 
                        fontSize: 10, 
                        fontWeight: 700, 
                        padding: '2px 8px', 
                        borderRadius: 12, 
                        background: badgeBg,
                        color: badgeColor,
                        border: `1px solid ${badgeBorder}`,
                        marginTop: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <span style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: badgeColor,
                          display: 'inline-block'
                        }} />
                        {badgeText}
                      </span>
                   </td>
                  <td className={s.tdMuted}>{dateObj.toLocaleDateString('id-ID')}</td>
                  <td>
                    {pr.department || '—'}
                    {pr.department === 'Food & Beverage' && pr.fb_category && ` (${pr.fb_category})`}
                  </td>
                  <td className={s.tdMuted}>{sups.join(', ') || '—'}</td>
                  <td className={s.tdRight}>{formatRupiah(pr.total_estimated)}</td>
                  <td><PStatusChip status={pr.status} /></td>
                  <td className={s.actionCell}>
                    <button className={s.iconBtn} title="Delete" onClick={e => { e.stopPropagation(); onDeleteClick(pr.id); }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
