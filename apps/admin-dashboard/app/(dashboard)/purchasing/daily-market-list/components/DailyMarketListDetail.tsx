'use client';

import React from 'react';
import { Coffee, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PStatusChip } from '@/components/purchasing/ui/PStatusChip';
import { PButton } from '@/components/purchasing/ui/PButton';
import { formatRupiah } from '@/lib/purchasing/utils';
import s from '../DailyMarketList.module.css';

interface DailyMarketListDetailProps {
  selectedDml: any;
  onClose: () => void;
  onEdit: () => void;
  onVerify: () => void;
  onApprove: () => void;
  onDelete: () => void;
  onPrint: () => void;
  onUpdatePaymentStatus?: (itemIndex: number, status: string) => void;
}

const slideInRight = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as any } },
  exit: { x: '100%', transition: { duration: 0.25 } },
};

export default function DailyMarketListDetail({
  selectedDml,
  onClose,
  onEdit,
  onVerify,
  onApprove,
  onDelete,
  onPrint,
  onUpdatePaymentStatus
}: DailyMarketListDetailProps) {
  if (!selectedDml) return null;

  const status = selectedDml.status || 'draft';
  const isDraft = status === 'draft' || status === 'submitted' || status === 'approved';
  const isSubmitted = status === 'submitted' || status === 'approved';
  const isApproved = status === 'approved';

  return (
    <AnimatePresence>
      {selectedDml && (
        <>
          {/* Backdrop */}
          <motion.div
            className={s.drawerBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer Content */}
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
              <div className={`${s.stepperItem} ${isDraft ? s.stepperActive : ''}`}>
                <div className={s.stepperDot}>1</div>
                <div className={s.stepperLabel}>Draft (Chef)</div>
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
              {/* Meta Grid */}
              <div className={s.detailMeta}>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Department</div>
                  <div className={s.detailMetaValue}>
                    {selectedDml.department || 'Food & Beverage'}
                    {selectedDml.department === 'Food & Beverage' && selectedDml.fb_category && ` (${selectedDml.fb_category})`}
                  </div>
                </div>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Prepared By</div>
                  <div className={s.detailMetaValue}>{selectedDml.submitted_by_name || selectedDml.submitted_by}</div>
                </div>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Total Cost</div>
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

              {/* Items Breakdown Table */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: 8 }}>
                  Market Checklist Items ({(selectedDml.items || []).length})
                </div>
                <table className={s.detailItemsTable}>
                  <thead>
                    <tr>
                      <th>Product / Vendor</th>
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
                          <select
                            value={item.paymentStatus || 'paid'}
                            onChange={(e) => onUpdatePaymentStatus && onUpdatePaymentStatus(idx, e.target.value)}
                            style={{ 
                              padding: '2px 8px', 
                              fontSize: '11px', 
                              fontWeight: 700,
                              borderRadius: '6px',
                              cursor: 'pointer',
                              background: (item.paymentStatus || 'paid') === 'tempo' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                              color: (item.paymentStatus || 'paid') === 'tempo' ? '#ef4444' : '#10b981',
                              border: `1px solid ${(item.paymentStatus || 'paid') === 'tempo' ? '#ef4444' : '#10b981'}`,
                              outline: 'none'
                            }}
                          >
                            <option value="paid">PAID</option>
                            <option value="tempo">TEMPO</option>
                          </select>
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

              {/* Total Highlight */}
              <div className={s.totalHighlightCard}>
                <div className={s.totalHighlightLabel}>Total Direct Culinary Cost</div>
                <div className={s.totalHighlightValue}>{formatRupiah(selectedDml.total_cost)}</div>
              </div>

              {selectedDml.notes && (
                <div className={s.remarksCard}>
                  <div className={s.remarksTitle}>Market Notes</div>
                  <div className={s.remarksBody}>{selectedDml.notes}</div>
                </div>
              )}
            </div>

            {/* Action Row */}
            <div className={s.actionRow}>
              {selectedDml.status === 'draft' && (
                <>
                  <PButton variant="secondary" size="sm" onClick={onEdit}>
                    Edit List
                  </PButton>
                  <PButton variant="success" size="sm" onClick={onVerify}>
                    <Check size={14} /> Verify & Submit
                  </PButton>
                </>
              )}
              {selectedDml.status === 'submitted' && (
                <>
                  <PButton variant="secondary" size="sm" onClick={onEdit}>
                    Edit List
                  </PButton>
                  <PButton variant="success" size="sm" onClick={onApprove}>
                    <Check size={14} /> Approve List
                  </PButton>
                </>
              )}
              {(selectedDml.status === 'submitted' || selectedDml.status === 'approved' || selectedDml.status === 'draft') && (
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
