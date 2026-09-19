'use client';

import React from 'react';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { PStatusChip } from '@/components/purchasing/ui/PStatusChip';
import { formatRupiah } from '@/lib/purchasing/utils';
import s from '../PurchaseRequisition.module.css';

interface PurchaseRequisitionTableProps {
  loading: boolean;
  filteredPrs: any[];
  selectedPr: any;
  setSelectedPr: (pr: any) => void;
  deletePR?: (id: string) => void;
  onDeleteClick?: (id: string) => void;
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
      <div className={s.tableHeadBar}>
        <div className={s.tableInfo}>
          <span>Purchase Requisitions Journal</span>{' '}
          <span className={s.tableRecordCount}>{filteredPrs.length} orders</span>
        </div>
      </div>

      <div className={s.tableWrapper}>
        <table className={s.table}>
          <thead className={s.tableHead}>
            <tr>
              <th>PR Number</th>
              <th>Date</th>
              <th>Department</th>
              <th>Requested By</th>
              <th>Supplier(s)</th>
              <th style={{ textAlign: 'right' }}>Est. Cost</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody className={s.tableBody}>
            {loading ? (
              <tr>
                <td colSpan={8}>
                  <div className={s.empty}>
                    <p className={s.emptyBody}>Loading purchase requisitions…</p>
                  </div>
                </td>
              </tr>
            ) : filteredPrs.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className={s.empty}>
                    <ShoppingCart size={38} className={s.emptyIcon} />
                    <p className={s.emptyTitle}>No purchase requisitions found</p>
                    <p className={s.emptyBody}>Create a purchase requisition to acquire items or equipment from external suppliers.</p>
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

                const isSelected = selectedPr?.id === pr.id;

                return (
                  <tr 
                    key={pr.id} 
                    className={isSelected ? s.rowSelected : ''} 
                    onClick={() => setSelectedPr(pr)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className={s.prNumberBadge}>{pr.pr_number}</div>
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
                    <td style={{ fontFamily: 'var(--p-font-mono, monospace)', fontSize: 12 }}>
                      {dateObj.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td>
                      <span className={s.deptBadge}>{pr.department || 'General'}</span>
                      {pr.department === 'Food & Beverage' && pr.fb_category && (
                        <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6, textTransform: 'capitalize' }}>
                          ({pr.fb_category})
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--p-heading, #0f172a)' }}>
                        {pr.requested_by_name || pr.requested_by || '—'}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>
                      {sups.join(', ') || '—'}
                    </td>
                    <td className={s.costCell}>
                      {formatRupiah(pr.total_estimated)}
                    </td>
                    <td>
                      <PStatusChip status={pr.status} />
                    </td>
                    <td className={s.actionCell} onClick={e => e.stopPropagation()}>
                      {onDeleteClick && (
                        <button 
                          className={s.deleteBtn} 
                          title="Delete Requisition" 
                          onClick={() => onDeleteClick(pr.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
