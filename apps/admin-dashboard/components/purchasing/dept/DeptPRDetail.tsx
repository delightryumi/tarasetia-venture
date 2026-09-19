'use client';

import React from 'react';
import { ShoppingCart, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PStatusChip } from '@/components/purchasing/ui/PStatusChip';
import { PButton } from '@/components/purchasing/ui/PButton';
import { formatRupiah } from '@/lib/purchasing/utils';
import s from '@/app/(dashboard)/purchasing/purchase-requisition/PurchaseRequisition.module.css';

interface DeptPRDetailProps {
  selectedPr: any;
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

export default function DeptPRDetail({
  selectedPr,
  onClose,
  onEdit,
  onDelete,
  onPrint,
}: DeptPRDetailProps) {
  if (!selectedPr) return null;

  const isDraft = selectedPr?.status === 'draft';
  const status = selectedPr.status || 'draft';
  const isRequested = status === 'draft' || status === 'submitted' || status === 'approved' || status === 'received';
  const isApproved = status === 'approved' || status === 'received';
  const isReceived = status === 'received';

  return (
    <AnimatePresence>
      {selectedPr && (
        <>
          <motion.div
            className={s.drawerBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key={selectedPr.id}
            variants={slideInRight}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={s.detailPanel}
          >
            <div className={s.detailHeader}>
              <div>
                <span className={s.detailDocNum}>{selectedPr.pr_number}</span>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 500 }}>
                  External Supplier Purchase Order Requisition
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <PStatusChip status={selectedPr.status} />
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
              <div className={`${s.stepperItem} ${isRequested ? s.stepperActive : ''}`}>
                <div className={s.stepperDot}>1</div>
                <div className={s.stepperLabel}>Requested</div>
              </div>
              <div className={`${s.stepperItem} ${isApproved ? s.stepperActive : ''}`}>
                <div className={s.stepperDot}>2</div>
                <div className={s.stepperLabel}>Approved</div>
              </div>
              <div className={`${s.stepperItem} ${isReceived ? s.stepperActive : ''}`}>
                <div className={s.stepperDot}>3</div>
                <div className={s.stepperLabel}>Received</div>
              </div>
            </div>

            <div className={s.detailBody}>
              <div className={s.detailMeta}>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Department</div>
                  <div className={s.detailMetaValue}>{selectedPr.department || 'General'}</div>
                </div>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Requested By</div>
                  <div className={s.detailMetaValue}>{selectedPr.requested_by_name || selectedPr.requested_by}</div>
                </div>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Date Created</div>
                  <div className={s.detailMetaValue}>
                    {selectedPr.created_at?.toDate
                      ? selectedPr.created_at.toDate().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
                      : new Date(selectedPr.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Est. Commitment</div>
                  <div className={s.detailMetaValue} style={{ color: '#1e4d3a', fontWeight: 800 }}>
                    {formatRupiah(selectedPr.total_estimated || 0)}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: 8 }}>
                  Ordered Items ({(selectedPr.items || []).length})
                </div>
                <table className={s.detailItemsTable}>
                  <thead>
                    <tr>
                      <th>Product / Supplier</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Est. Price</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedPr.items || []).map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name || item.item_name}</div>
                          {item.supplier_name && <div style={{ fontSize: 11, color: '#64748b' }}>Supplier: {item.supplier_name}</div>}
                          {item.notes && <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>Note: {item.notes}</div>}
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--p-font-mono, monospace)', fontWeight: 600 }}>
                          {item.qty} <span style={{ fontSize: 11, color: '#64748b' }}>{item.unit}</span>
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--p-font-mono, monospace)', fontSize: 12 }}>
                          {formatRupiah(item.estimated_price || 0)}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--p-font-mono, monospace)', fontWeight: 700, color: '#1e4d3a' }}>
                          {formatRupiah(item.subtotal || (item.qty * (item.estimated_price || 0)))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Cost Highlight */}
              <div className={s.totalHighlightCard}>
                <div className={s.totalHighlightLabel}>Total Estimated Commitment</div>
                <div className={s.totalHighlightValue}>{formatRupiah(selectedPr.total_estimated || 0)}</div>
              </div>

              {selectedPr.notes && (
                <div className={s.remarksCard}>
                  <div className={s.remarksTitle}>Remarks</div>
                  <div className={s.remarksBody}>{selectedPr.notes}</div>
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
                <ShoppingCart size={14} /> Print PR
              </PButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
