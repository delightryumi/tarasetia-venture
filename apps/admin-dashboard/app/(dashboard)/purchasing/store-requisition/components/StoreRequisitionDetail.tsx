'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PStatusChip } from '@/components/purchasing/ui/PStatusChip';
import { PButton } from '@/components/purchasing/ui/PButton';
import { formatRupiah } from '@/lib/purchasing/utils';
import s from '../../shared-page.module.css';

interface StoreRequisitionDetailProps {
  selectedSr: any;
  onClose: () => void;
  onEdit: () => void;
  onApprove: () => void;
  onFulfill: () => void;
  onDelete: () => void;
  onPrint: () => void;
}

const slideInRight = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as any } },
  exit: { x: '100%', transition: { duration: 0.25 } },
};

export default function StoreRequisitionDetail({
  selectedSr,
  onClose,
  onEdit,
  onApprove,
  onFulfill,
  onDelete,
  onPrint
}: StoreRequisitionDetailProps) {
  return (
    <AnimatePresence>
      {selectedSr && (
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
            key={selectedSr.id}
            variants={slideInRight}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={s.detailPanel}
          >
            <div className={s.detailHeader}>
              <span className={s.detailDocNum}>{selectedSr.sr_number}</span>
              <PStatusChip status={selectedSr.status} />
            </div>
            <div className={s.detailBody}>
              <div className={s.detailMeta}>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Department</div>
                  <div className={s.detailMetaValue}>
                    {selectedSr.department}
                    {selectedSr.department === 'Food & Beverage' && selectedSr.fb_category && ` (${selectedSr.fb_category})`}
                    {selectedSr.department === 'Food & Beverage' && selectedSr.event_category && ` - ${selectedSr.event_category}`}
                  </div>
                </div>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Requested By</div>
                  <div className={s.detailMetaValue}>{selectedSr.requested_by_name || selectedSr.requested_by}</div>
                </div>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Date Created</div>
                  <div className={s.detailMetaValue}>{selectedSr.created_at?.toDate ? selectedSr.created_at.toDate().toLocaleDateString('id-ID') : new Date(selectedSr.created_at).toLocaleDateString('id-ID')}</div>
                </div>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Total Cost</div>
                  <div className={s.detailMetaValue}>{formatRupiah(selectedSr.total_cost || 0)}</div>
                </div>
                {selectedSr.order_date && (
                  <div className={s.detailMetaItem}>
                    <div className={s.detailMetaLabel}>Order Date</div>
                    <div className={s.detailMetaValue}>{new Date(selectedSr.order_date).toLocaleDateString('id-ID')}</div>
                  </div>
                )}
                {selectedSr.delivery_date && (
                  <div className={s.detailMetaItem}>
                    <div className={s.detailMetaLabel}>Expected Delivery</div>
                    <div className={s.detailMetaValue}>{selectedSr.delivery_date?.toDate ? selectedSr.delivery_date.toDate().toLocaleDateString('id-ID') : new Date(selectedSr.delivery_date).toLocaleDateString('id-ID')}</div>
                  </div>
                )}
              </div>

              <div className={s.detailItems}>
                {selectedSr.items.map((item: any, idx: number) => (
                  <div key={idx} className={s.detailItem}>
                    <div>
                      <div className={s.detailItemName}>{item.name}</div>
                      {item.supplier_name && <div className={s.detailItemNote}>{item.supplier_name}</div>}
                      {item.notes && <div className={s.detailItemNote}>{item.notes}</div>}
                    </div>
                    <div className={s.detailItemQty}>
                      {item.qty_requested} {item.unit} · {formatRupiah(item.unit_price || 0)}
                      <div style={{ fontSize: 11, color: 'var(--p-muted)', marginTop: 2 }}>
                        Total: {formatRupiah(item.total || (item.qty_requested * (item.unit_price || 0)))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={s.darkCard} style={{ marginTop: 12 }}>
                <div className={s.darkCardLabel}>Total Requisition Cost</div>
                <div className={s.darkCardValue}>{formatRupiah(selectedSr.total_cost || 0)}</div>
              </div>

              {selectedSr.notes && (
                <div className={s.creamCard}>
                  <div className={s.creamCardTitle}>Remarks</div>
                  <div className={s.creamCardBody}>{selectedSr.notes}</div>
                </div>
              )}
            </div>

            <div className={s.actionRow} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%' }}>
              {selectedSr.status === 'draft' && (
                <PButton variant="secondary" size="sm" onClick={onEdit}>
                  Edit Draft
                </PButton>
              )}
              {selectedSr.status === 'submitted' && (
                <>
                  <PButton variant="secondary" size="sm" onClick={onEdit}>
                    Edit Request
                  </PButton>
                  <PButton variant="success" size="sm" onClick={onApprove}>
                    Approve Request
                  </PButton>
                </>
              )}
              {selectedSr.status === 'approved' && (
                <PButton size="sm" onClick={onFulfill}>
                  Fulfill & Release Stock
                </PButton>
              )}
              {(selectedSr.status === 'submitted' || selectedSr.status === 'approved' || selectedSr.status === 'draft') && (
                <PButton variant="danger" size="sm" onClick={onDelete}>
                  Delete
                </PButton>
              )}
              <PButton variant="secondary" size="sm" onClick={onPrint} className={s.printBtn}>
                <FileText size={14} /> Print SR
              </PButton>
              <PButton variant="secondary" size="sm" style={{ marginLeft: 'auto' }} onClick={onClose}>Close</PButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
