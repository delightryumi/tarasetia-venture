'use client';

import React from 'react';
import { Coffee } from 'lucide-react';
import { PStatusChip } from '@/components/purchasing/ui/PStatusChip';
import { formatRupiah } from '@/lib/purchasing/utils';
import s from '../DailyMarketList.module.css';

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
      <div className={s.tableHeadBar}>
        <div className={s.tableInfo}>
          <span>Market Procurement Journal</span>{' '}
          <span className={s.tableRecordCount}>{filteredDmls.length} lists</span>
        </div>
      </div>

      <div className={s.tableWrapper}>
        <table className={s.table}>
          <thead className={s.tableHead}>
            <tr>
              <th>DML Number</th>
              <th>Date</th>
              <th>Department</th>
              <th>Prepared By</th>
              <th>Supplier</th>
              <th style={{ textAlign: 'center' }}>Items</th>
              <th style={{ textAlign: 'right' }}>Direct Cost</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody className={s.tableBody}>
            {loading ? (
              <tr>
                <td colSpan={8}>
                  <div className={s.empty}>
                    <p className={s.emptyBody}>Loading market lists…</p>
                  </div>
                </td>
              </tr>
            ) : filteredDmls.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className={s.empty}>
                    <Coffee size={38} className={s.emptyIcon} />
                    <p className={s.emptyTitle}>No daily market lists found</p>
                    <p className={s.emptyBody}>Generate a fresh produce checklist to start kitchen procurement.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDmls.map((dml: any) => {
                const dateObj = dml.date?.toDate ? dml.date.toDate() : new Date(dml.date);
                const dmlSuppliers = Array.from(new Set((dml.items ?? []).map((i: any) => i.supplier_name))).filter(Boolean);
                const itemsList = dml.items || [];
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

                const isSelected = selectedDml?.id === dml.id;

                return (
                  <tr 
                    key={dml.id} 
                    className={isSelected ? s.rowSelected : ''} 
                    onClick={() => setSelectedDml(dml)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className={s.dmlNumberBadge}>{dml.dml_number}</div>
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
                      <span className={s.deptBadge}>
                        {dml.department || 'Food & Beverage'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--p-heading, #0f172a)' }}>
                        {dml.submitted_by_name || dml.submitted_by}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>
                      {dmlSuppliers.join(', ') || 'Direct Vendors'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={s.linesBadge}>{dml.items.length} items</span>
                    </td>
                    <td className={s.costCell}>
                      {formatRupiah(dml.total_cost)}
                    </td>
                    <td>
                      <PStatusChip status={dml.status} />
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
