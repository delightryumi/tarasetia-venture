'use client';

import React from 'react';
import { Coffee, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PStatusChip } from '@/components/purchasing/ui/PStatusChip';
import { PButton } from '@/components/purchasing/ui/PButton';
import { formatRupiah } from '@/lib/purchasing/utils';
import s from '@/app/(dashboard)/purchasing/daily-market-list/DailyMarketList.module.css';

interface DeptDMLDetailProps {
  selectedDml: any;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPrint: () => void;
}

const slideInRight = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as any } },
  exit: { x: '100%', transition: { duration: 0.25 } },
};

export default function DeptDMLDetail({
  selectedDml,
  onClose,
  onEdit,
  onDelete,
  onPrint,
}: DeptDMLDetailProps) {
  if (!selectedDml) return null;

  const isDraft = selectedDml?.status === 'draft';
  const status = selectedDml.status || 'draft';
  const isPending = status === 'draft' || status === 'submitted' || status === 'approved';
  const isSubmitted = status === 'submitted' || status === 'approved';
  const isApproved = status === 'approved';

  return (
    <AnimatePresence>
      {selectedDml && (
        <>
          <motion.div
            className={s.drawerBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            key={selectedDml.id}
            variants={slideInRight}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={s.detailPanel}
          >
            <div className={s.detailHeader}>
              <div>
                <span className={s.detailDocNum}>{selectedDml.dml_number}</span>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 500 }}>
                  Culinary Fresh Market Procurement
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <PStatusChip status={selectedDml.status} />
                <button 
                  type="button" 
                  onClick={onClose} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 4 }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Workflow Stepper */}
            <div className={s.stepperContainer}>
              <div className={`${s.stepperItem} ${isPending ? s.stepperActive : ''}`}>
                <div className={s.stepperDot}>1</div>
                <div className={s.stepperLabel}>Draft</div>
              </div>
              <div className={`${s.stepperItem} ${isSubmitted ? s.stepperActive : ''}`}>
                <div className={s.stepperDot}>2</div>
                <div className={s.stepperLabel}>Verified</div>
              </div>
              <div className={`${s.stepperItem} ${isApproved ? s.stepperActive : ''}`}>
                <div className={s.stepperDot}>3</div>
                <div className={s.stepperLabel}>Approved</div>
              </div>
            </div>

            <div className={s.detailBody}>
              <div className={s.detailMeta}>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Department</div>
                  <div className={s.detailMetaValue}>{selectedDml.department || 'Food & Beverage'}</div>
                </div>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Prepared By</div>
                  <div className={s.detailMetaValue}>{selectedDml.submitted_by_name || selectedDml.submitted_by}</div>
                </div>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Total Direct Cost</div>
                  <div className={s.detailMetaValue} style={{ color: '#1e4d3a', fontWeight: 800 }}>
                    {formatRupiah(selectedDml.total_cost)}
                  </div>
                </div>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Market Date</div>
                  <div className={s.detailMetaValue}>
                    {selectedDml.order_date 
                      ? new Date(selectedDml.order_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
                      : selectedDml.date?.toDate
                        ? selectedDml.date.toDate().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
                        : new Date(selectedDml.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: 8 }}>
                  Market Checklist Items ({(selectedDml.items || []).length})
                </div>
                <table className={s.detailItemsTable}>
                  <thead>
                    <tr>
                      <th>Product / Supplier</th>
                      <th style={{ textAlign: 'center' }}>Settlement</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Unit Cost</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedDml.items || []).map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {item.category}{item.supplier_name ? ` · ${item.supplier_name}` : ''}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            borderRadius: '6px',
                            background: (item.paymentStatus || 'paid') === 'tempo' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                            color: (item.paymentStatus || 'paid') === 'tempo' ? '#ef4444' : '#10b981',
                            border: `1px solid ${(item.paymentStatus || 'paid') === 'tempo' ? '#ef4444' : '#10b981'}`
                          }}>
                            {(item.paymentStatus || 'paid').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--p-font-mono, monospace)', fontWeight: 600 }}>
                          {item.qty_ordered} <span style={{ fontSize: 11, color: '#64748b' }}>{item.unit}</span>
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--p-font-mono, monospace)', fontSize: 12 }}>
                          {formatRupiah(item.unit_price || 0)}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--p-font-mono, monospace)', fontWeight: 700, color: '#1e4d3a' }}>
                          {formatRupiah(item.total || (item.qty_ordered * (item.unit_price || 0)))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Cost Highlight */}
              <div className={s.totalHighlightCard}>
                <div className={s.totalHighlightLabel}>Direct Culinary Cost (COGS Food)</div>
                <div className={s.totalHighlightValue}>{formatRupiah(selectedDml.total_cost)}</div>
              </div>

              {selectedDml.notes && (
                <div className={s.remarksCard}>
                  <div className={s.remarksTitle}>Market Notes</div>
                  <div className={s.remarksBody}>{selectedDml.notes}</div>
                </div>
              )}
            </div>

            <div className={s.actionRow}>
              {isDraft && (
                <PButton variant="secondary" size="sm" onClick={onEdit}>
                  Edit Draft
                </PButton>
              )}
              {isDraft && (
                <PButton variant="danger" size="sm" onClick={onDelete}>
                  Delete
                </PButton>
              )}
              <PButton variant="secondary" size="sm" onClick={onPrint}>
                <Coffee size={14} /> Print DML
              </PButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
