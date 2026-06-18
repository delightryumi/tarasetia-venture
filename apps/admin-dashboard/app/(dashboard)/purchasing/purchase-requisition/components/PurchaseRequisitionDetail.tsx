'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PStatusChip } from '@/components/purchasing/ui/PStatusChip';
import { PButton } from '@/components/purchasing/ui/PButton';
import { formatRupiah } from '@/lib/purchasing/utils';
import s from '../../shared-page.module.css';

interface PurchaseRequisitionDetailProps {
  selectedPr: any;
  onClose: () => void;
  onEdit: () => void;
  onApprove: () => void;
  onReceive: () => void;
  onDelete: () => void;
  onPrint: () => void;
  onUpdatePaymentStatus?: (itemIndex: number, status: string) => void;
}

const slideInRight = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as any } },
  exit: { x: '100%', transition: { duration: 0.25 } },
};

export default function PurchaseRequisitionDetail({
  selectedPr,
  onClose,
  onEdit,
  onApprove,
  onReceive,
  onDelete,
  onPrint,
  onUpdatePaymentStatus
}: PurchaseRequisitionDetailProps) {
  return (
    <AnimatePresence>
      {selectedPr && (
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
            key={selectedPr.id}
            variants={slideInRight}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={s.detailPanel}
          >
            <div className={s.detailHeader}>
              <span className={s.detailDocNum}>{selectedPr.pr_number}</span>
              <PStatusChip status={selectedPr.status} />
            </div>
            <div className={s.detailBody}>
              <div className={s.detailMeta}>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Department</div>
                  <div className={s.detailMetaValue}>
                    {selectedPr.department || '—'}
                    {selectedPr.department === 'Food & Beverage' && selectedPr.fb_category && ` (${selectedPr.fb_category})`}
                    {selectedPr.department === 'Food & Beverage' && selectedPr.event_category && ` - ${selectedPr.event_category}`}
                  </div>
                </div>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Requested By</div>
                  <div className={s.detailMetaValue}>{selectedPr.requested_by_name || selectedPr.requested_by}</div>
                </div>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Date Created</div>
                  <div className={s.detailMetaValue}>{selectedPr.created_at?.toDate ? selectedPr.created_at.toDate().toLocaleDateString('id-ID') : new Date(selectedPr.created_at).toLocaleDateString('id-ID')}</div>
                </div>
                {selectedPr.order_date && (
                  <div className={s.detailMetaItem}>
                    <div className={s.detailMetaLabel}>Order Date</div>
                    <div className={s.detailMetaValue}>{new Date(selectedPr.order_date).toLocaleDateString('id-ID')}</div>
                  </div>
                )}
                {selectedPr.delivery_date && (
                  <div className={s.detailMetaItem}>
                    <div className={s.detailMetaLabel}>Expected Delivery</div>
                    <div className={s.detailMetaValue}>{selectedPr.delivery_date?.toDate ? selectedPr.delivery_date.toDate().toLocaleDateString('id-ID') : new Date(selectedPr.delivery_date).toLocaleDateString('id-ID')}</div>
                  </div>
                )}
              </div>

              <div className={s.detailItems}>
                {(selectedPr.items ?? []).map((item: any, idx: number) => (
                  <div key={idx} className={s.detailItem} style={{ alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={s.detailItemName}>{item.name}</div>
                      <div className={s.detailItemNote}>{item.supplier_name}</div>
                      <div style={{ marginTop: 6 }}>
                        <select
                          value={item.paymentStatus || 'paid'}
                          onChange={(e) => onUpdatePaymentStatus && onUpdatePaymentStatus(idx, e.target.value)}
                          className={s.filterSelect}
                          style={{ 
                            padding: '1px 6px', 
                            fontSize: '11px', 
                            height: '22px', 
                            minWidth: '85px', 
                            cursor: 'pointer',
                            fontWeight: 600,
                            borderRadius: '4px',
                            background: (item.paymentStatus || 'paid') === 'tempo' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                            color: (item.paymentStatus || 'paid') === 'tempo' ? '#ef4444' : '#10b981',
                            border: `1px solid ${(item.paymentStatus || 'paid') === 'tempo' ? '#ef4444' : '#10b981'}`,
                            outline: 'none'
                          }}
                        >
                          <option value="paid" style={{ color: '#10b981', background: 'var(--p-canvas)' }}>Paid</option>
                          <option value="tempo" style={{ color: '#ef4444', background: 'var(--p-canvas)' }}>Tempo</option>
                        </select>
                      </div>
                    </div>
                    <div className={s.detailItemQty}>
                      {item.qty} {item.unit} · {formatRupiah(item.estimated_price)}
                      <div style={{ fontSize: 11, color: 'var(--p-muted)', marginTop: 2 }}>
                        Total: {formatRupiah(item.total || (item.qty * (item.estimated_price || 0)))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={s.darkCard}>
                <div className={s.darkCardLabel}>Estimated Total</div>
                <div className={s.darkCardValue}>{formatRupiah(selectedPr.total_estimated)}</div>
              </div>
            </div>

            <div className={s.actionRow} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%' }}>
              {selectedPr.status === 'draft' && (
                <PButton variant="secondary" size="sm" onClick={onEdit}>Edit Draft</PButton>
              )}
              {selectedPr.status === 'submitted' && (
                <>
                  <PButton variant="secondary" size="sm" onClick={onEdit}>Edit Request</PButton>
                  <PButton variant="success" size="sm" onClick={onApprove}>Approve PR</PButton>
                </>
              )}
              {selectedPr.status === 'approved' && (
                <PButton size="sm" onClick={onReceive}>Receive Goods</PButton>
              )}
              {(selectedPr.status === 'submitted' || selectedPr.status === 'approved' || selectedPr.status === 'draft') && (
                <PButton variant="danger" size="sm" onClick={onDelete}>Delete</PButton>
              )}
              <PButton variant="secondary" size="sm" onClick={onPrint} className={s.printBtn}>
                <ShoppingCart size={14} /> Print PR
              </PButton>
              <PButton variant="secondary" size="sm" style={{ marginLeft: 'auto' }} onClick={onClose}>Close</PButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
