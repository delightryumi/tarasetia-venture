'use client';

import React from 'react';
import { ClipboardList, ArrowUpDown, FileText, CheckCircle2, Lock, Trash2 } from 'lucide-react';
import s from '../stock-opname.module.css';
import { formatRupiah } from '@/lib/purchasing/utils';

interface StockOpnameTableProps {
  loading: boolean;
  opnames: any[];
  selected: any;
  onSelect: (opname: any) => void;
  onDelete: (id: string) => void;
}

export default function StockOpnameTable({ loading, opnames, selected, onSelect, onDelete }: StockOpnameTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'locked':
        return <span className={s.badgeStatusLocked}><Lock size={10} style={{ display: 'inline', marginRight: 3 }} /> Locked</span>;
      case 'approved':
        return <span className={s.badgeStatusApproved}><CheckCircle2 size={10} style={{ display: 'inline', marginRight: 3 }} /> Approved</span>;
      case 'submitted':
        return <span className={s.badgeStatusSubmitted}>Submitted</span>;
      default:
        return <span className={s.badgeStatusDraft}>{status || 'Draft'}</span>;
    }
  };

  return (
    <div className={s.tableCard}>
      <table className={s.table}>
        <thead>
          <tr>
            <th>Period</th>
            <th>Department / Location</th>
            <th>Audited By</th>
            <th className={s.thRight}>Total Items</th>
            <th className={s.thRight}>Discrepancies</th>
            <th className={s.thRight}>Net Variance</th>
            <th className={s.thCenter}>Status</th>
            <th className={s.thCenter} style={{ width: 55 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={8}>
                <div className={s.emptyState}>
                  <p className={s.emptyDesc}>Loading stock opname data...</p>
                </div>
              </td>
            </tr>
          ) : opnames.length === 0 ? (
            <tr>
              <td colSpan={8}>
                <div className={s.emptyState}>
                  <ClipboardList size={40} className={s.emptyIcon} />
                  <p className={s.emptyTitle}>No stock opname history found</p>
                  <p className={s.emptyDesc}>
                    Perform physical counts to reconcile book stock against actual inventory.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            opnames.map((op: any) => {
              const items = op.items || [];
              const varianceItems = items.filter((i: any) => i.variance !== 0);
              const varianceCount = varianceItems.length;
              const totalVarianceVal = items.reduce((sum: number, i: any) => {
                const price = i.unit_price || 0;
                return sum + (i.variance * price);
              }, 0);

              const isSelected = selected?.id === op.id;

              return (
                <tr
                  key={op.id}
                  className={isSelected ? s.rowSelected : ''}
                  onClick={() => onSelect(op)}
                >
                  <td>
                    <span className={s.badgePeriod}>{op.period}</span>
                  </td>
                  <td>
                    <span className={s.badgeDept}>{op.department || 'Purchasing'}</span>
                  </td>
                  <td className={s.tdMuted}>
                    {op.conducted_by_name || op.conducted_by || 'Staff'}
                  </td>
                  <td className={`${s.thRight} ${s.tdMono} ${s.tdMuted}`}>
                    {items.length} Items
                  </td>
                  <td className={s.thRight} style={{ fontWeight: 600 }}>
                    {varianceCount > 0 ? (
                      <span style={{ color: '#e11d48' }}>{varianceCount} items</span>
                    ) : (
                      <span style={{ color: '#16a34a' }}>Matched (0)</span>
                    )}
                  </td>
                  <td className={`${s.thRight} ${s.tdMono}`} style={{ fontWeight: 600 }}>
                    {totalVarianceVal < 0 ? (
                      <span style={{ color: '#e11d48' }}>{formatRupiah(totalVarianceVal)}</span>
                    ) : totalVarianceVal > 0 ? (
                      <span style={{ color: '#16a34a' }}>+{formatRupiah(totalVarianceVal)}</span>
                    ) : (
                      <span style={{ color: '#64748b' }}>Rp 0</span>
                    )}
                  </td>
                  <td className={s.thCenter}>
                    {getStatusBadge(op.status)}
                  </td>
                  <td className={s.thCenter} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onDelete(op.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px 6px',
                        borderRadius: '5px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      title="Void / Delete Stock Opname"
                    >
                      <Trash2 size={15} />
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
