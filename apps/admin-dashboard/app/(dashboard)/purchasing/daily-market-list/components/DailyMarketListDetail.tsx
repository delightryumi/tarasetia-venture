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
                  <div key={idx} className={s.detailItem} style={{ alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={s.detailItemName}>{item.name}</div>
                      <div className={s.detailItemNote}>{item.category}{item.supplier_name ? ` · ${item.supplier_name}` : ''}</div>
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
