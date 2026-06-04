'use client';

import React from 'react';
import { Coffee, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PStatusChip } from '@/components/purchasing/ui/PStatusChip';
import { PButton } from '@/components/purchasing/ui/PButton';
import { formatRupiah } from '@/lib/purchasing/utils';
import s from '../../shared-page.module.css';

interface DailyMarketListDetailProps {
  selectedDml: any;
  onClose: () => void;
  onEdit: () => void;
  onVerify: () => void;
  onApprove: () => void;
  onDelete: () => void;
  onPrint: () => void;
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
  onPrint
}: DailyMarketListDetailProps) {
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
              <span className={s.detailDocNum}>{selectedDml.dml_number}</span>
              <PStatusChip status={selectedDml.status} />
            </div>
            <div className={s.detailBody}>
              <div className={s.detailMeta}>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Prepared By</div>
                  <div className={s.detailMetaValue}>{selectedDml.submitted_by_name || selectedDml.submitted_by}</div>
                </div>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Total Cost</div>
                  <div className={s.detailMetaValue}>{formatRupiah(selectedDml.total_cost)}</div>
                </div>
                {selectedDml.order_date && (
                  <div className={s.detailMetaItem}>
                    <div className={s.detailMetaLabel}>Order Date</div>
                    <div className={s.detailMetaValue}>{new Date(selectedDml.order_date).toLocaleDateString('id-ID')}</div>
                  </div>
                )}
                {selectedDml.delivery_date && (
                  <div className={s.detailMetaItem}>
                    <div className={s.detailMetaLabel}>Expected Delivery</div>
                    <div className={s.detailMetaValue}>{selectedDml.delivery_date?.toDate ? selectedDml.delivery_date.toDate().toLocaleDateString('id-ID') : new Date(selectedDml.delivery_date).toLocaleDateString('id-ID')}</div>
                  </div>
                )}
              </div>
              <div className={s.detailItems}>
                {selectedDml.items.map((item: any, idx: number) => (
                  <div key={idx} className={s.detailItem}>
                    <div>
                      <div className={s.detailItemName}>{item.name}</div>
                      <div className={s.detailItemNote}>{item.category}{item.supplier_name ? ` · ${item.supplier_name}` : ''}</div>
                    </div>
                    <div className={s.detailItemQty}>
                      {item.qty_ordered} {item.unit} · {formatRupiah(item.unit_price || 0)}
                      <div style={{ fontSize: 11, color: 'var(--p-muted)', marginTop: 2 }}>
                        Total: {formatRupiah(item.total || (item.qty_ordered * (item.unit_price || 0)))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className={s.darkCard}>
                <div className={s.darkCardLabel}>Estimated Market Cost</div>
                <div className={s.darkCardValue}>{formatRupiah(selectedDml.total_cost)}</div>
              </div>
            </div>
            <div className={s.actionRow} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%' }}>
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
              <PButton variant="secondary" size="sm" onClick={onPrint} className={s.printBtn}>
                <Coffee size={14} /> Print DML
              </PButton>
              <PButton variant="secondary" size="sm" style={{ marginLeft: 'auto' }} onClick={onClose}>Close</PButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
