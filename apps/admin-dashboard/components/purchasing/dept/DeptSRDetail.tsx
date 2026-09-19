'use client';

import React from 'react';
import { FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PStatusChip } from '@/components/purchasing/ui/PStatusChip';
import { PButton } from '@/components/purchasing/ui/PButton';
import { formatRupiah } from '@/lib/purchasing/utils';
import s from '@/app/(dashboard)/purchasing/store-requisition/StoreRequisition.module.css';

interface DeptSRDetailProps {
  selectedSr: any;
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

export default function DeptSRDetail({
  selectedSr,
  onClose,
  onEdit,
  onDelete,
  onPrint,
}: DeptSRDetailProps) {
  if (!selectedSr) return null;

  const isDraft = selectedSr?.status === 'draft';
  const status = selectedSr.status || 'draft';
  const isSubmitted = status === 'submitted' || status === 'approved' || status === 'fulfilled';
  const isApproved = status === 'approved' || status === 'fulfilled';
  const isFulfilled = status === 'fulfilled';

  return (
    <AnimatePresence>
      {selectedSr && (
        <>
          <motion.div
            className={s.drawerBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key={selectedSr.id}
            variants={slideInRight}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={s.detailPanel}
          >
            <div className={s.detailHeader}>
              <div>
                <span className={s.detailDocNum}>{selectedSr.sr_number}</span>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 500 }}>
                  Internal Stock Disbursement Requisition
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <PStatusChip status={selectedSr.status} />
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
              <div className={`${s.stepperItem} ${isSubmitted ? s.stepperActive : ''}`}>
                <div className={s.stepperDot}>1</div>
                <div className={s.stepperLabel}>Submitted</div>
              </div>
              <div className={`${s.stepperItem} ${isApproved ? s.stepperActive : ''}`}>
                <div className={s.stepperDot}>2</div>
                <div className={s.stepperLabel}>Approved</div>
              </div>
              <div className={`${s.stepperItem} ${isFulfilled ? s.stepperActive : ''}`}>
                <div className={s.stepperDot}>3</div>
                <div className={s.stepperLabel}>Fulfilled</div>
              </div>
            </div>

            <div className={s.detailBody}>
              <div className={s.detailMeta}>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Department</div>
                  <div className={s.detailMetaValue}>
                    {selectedSr.department}
                    {selectedSr.department === 'Food & Beverage' && selectedSr.fb_category && ` (${selectedSr.fb_category})`}
                  </div>
                </div>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Requested By</div>
                  <div className={s.detailMetaValue}>{selectedSr.requested_by_name || selectedSr.requested_by}</div>
                </div>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Date Created</div>
                  <div className={s.detailMetaValue}>
                    {selectedSr.created_at?.toDate
                      ? selectedSr.created_at.toDate().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
                      : new Date(selectedSr.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Total Value</div>
                  <div className={s.detailMetaValue} style={{ color: '#1e4d3a', fontWeight: 800 }}>
                    {formatRupiah(selectedSr.total_cost || 0)}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: 8 }}>
                  Disbursement Items ({(selectedSr.items || []).length})
                </div>
                <table className={s.detailItemsTable}>
                  <thead>
                    <tr>
                      <th>Item Description</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Unit Cost</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedSr.items || []).map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                          {item.notes && <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>Note: {item.notes}</div>}
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--p-font-mono, monospace)', fontWeight: 600 }}>
                          {item.qty_requested} <span style={{ fontSize: 11, color: '#64748b' }}>{item.unit}</span>
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--p-font-mono, monospace)', fontSize: 12 }}>
                          {formatRupiah(item.unit_price || 0)}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--p-font-mono, monospace)', fontWeight: 700, color: '#1e4d3a' }}>
                          {formatRupiah(item.total || (item.qty_requested * (item.unit_price || 0)))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Highlight */}
              <div className={s.totalHighlightCard}>
                <div className={s.totalHighlightLabel}>Total Departmental Expense</div>
                <div className={s.totalHighlightValue}>{formatRupiah(selectedSr.total_cost || 0)}</div>
              </div>

              {selectedSr.notes && (
                <div className={s.remarksCard}>
                  <div className={s.remarksTitle}>Requisition Remarks</div>
                  <div className={s.remarksBody}>{selectedSr.notes}</div>
                </div>
              )}
            </div>

            <div className={s.actionRow}>
              {isDraft && (
                <PButton variant="secondary" size="sm" onClick={onEdit}>Edit Draft</PButton>
              )}
              {isDraft && (
                <PButton variant="danger" size="sm" onClick={onDelete}>Delete</PButton>
              )}
              <PButton variant="secondary" size="sm" onClick={onPrint}>
                <FileText size={14} /> Print Requisition
              </PButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
