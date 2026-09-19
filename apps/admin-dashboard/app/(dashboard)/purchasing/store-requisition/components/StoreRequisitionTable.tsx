'use client';

import React from 'react';
import { Trash2, FileText, ArrowRight } from 'lucide-react';
import { PStatusChip } from '@/components/purchasing/ui/PStatusChip';
import { formatRupiah } from '@/lib/purchasing/utils';
import s from '../StoreRequisition.module.css';

interface StoreRequisitionTableProps {
  loading: boolean;
  filteredSrs: any[];
  selectedSr: any;
  setSelectedSr: (sr: any) => void;
  onDelete?: (id: string) => void;
}

export default function StoreRequisitionTable({
  loading,
  filteredSrs,
  selectedSr,
  setSelectedSr,
  onDelete
}: StoreRequisitionTableProps) {
  return (
    <div className={s.tableCard}>
      <div className={s.tableHeadBar}>
        <div className={s.tableTitleGroup}>
          <span className={s.tableTitle}>Requisitions Journal</span>{' '}
          <span className={s.tableBadgeCount}>{filteredSrs.length} records</span>
        </div>
      </div>

      <div className={s.tableWrapper}>
        <table className={s.table}>
          <thead className={s.tableHead}>
            <tr>
              <th>SR Number</th>
              <th>Date</th>
              <th>Department</th>
              <th>Requested By</th>
              <th>Lines</th>
              <th>Total Cost</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody className={s.tableBody}>
            {loading ? (
              <tr>
                <td colSpan={8}>
                  <div className={s.empty}>
                    <p className={s.emptyBody}>Loading store requisitions…</p>
                  </div>
                </td>
              </tr>
            ) : filteredSrs.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className={s.empty}>
                    <FileText size={38} className={s.emptyIcon} />
                    <p className={s.emptyTitle}>No store requisitions found</p>
                    <p className={s.emptyBody}>Create a new requisition to request supplies from the central store.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredSrs.map((sr: any) => {
                const dateObj = sr.created_at?.toDate ? sr.created_at.toDate() : new Date(sr.created_at);
                const isSelected = selectedSr?.id === sr.id;
                return (
                  <tr 
                    key={sr.id} 
                    className={isSelected ? s.rowSelected : ''} 
                    onClick={() => setSelectedSr(sr)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <span className={s.srNumberBadge}>{sr.sr_number}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--p-font-mono, monospace)', fontSize: 12 }}>
                      {dateObj.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td>
                      <span className={s.deptBadge}>{sr.department}</span>
                      {sr.department === 'Food & Beverage' && sr.fb_category && (
                        <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6, textTransform: 'capitalize' }}>
                          ({sr.fb_category})
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--p-heading, #0f172a)' }}>
                        {sr.requested_by_name || sr.requested_by}
                      </div>
                    </td>
                    <td>
                      <span className={s.linesBadge}>
                        {(sr.items || []).length} items
                      </span>
                    </td>
                    <td className={s.costCell}>
                      {formatRupiah(sr.total_cost || 0)}
                    </td>
                    <td>
                      <PStatusChip status={sr.status} />
                    </td>
                    <td className={s.actionCell} onClick={e => e.stopPropagation()}>
                      {onDelete && (
                        <button 
                          className={s.deleteBtn} 
                          onClick={() => onDelete(sr.id)} 
                          title="Delete Requisition"
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
