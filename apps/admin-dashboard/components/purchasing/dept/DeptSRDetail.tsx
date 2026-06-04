'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PStatusChip } from '@/components/purchasing/ui/PStatusChip';
import { PButton } from '@/components/purchasing/ui/PButton';
import { formatRupiah } from '@/lib/purchasing/utils';
import s from '@/app/(dashboard)/purchasing/shared-page.module.css';

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
  const isDraft = selectedSr?.status === 'draft';

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
                      ? selectedSr.created_at.toDate().toLocaleDateString('id-ID')
                      : new Date(selectedSr.created_at).toLocaleDateString('id-ID')}
                  </div>
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
              </div>

              <div className={s.detailItems}>
                {(selectedSr.items || []).map((item: any, idx: number) => (
                  <div key={idx} className={s.detailItem}>
                    <div>
                      <div className={s.detailItemName}>{item.name}</div>
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

              {!isDraft && (
                <div className={s.creamCard}>
                  <div className={s.creamCardTitle}>Status Info</div>
                  <div className={s.creamCardBody}>
                    {selectedSr?.status === 'approved' ? (
                      `Dokumen ini sudah di-approve oleh Purchasing${selectedSr.approved_by_name ? ` (${selectedSr.approved_by_name})` : ''}.`
                    ) : selectedSr?.status === 'fulfilled' ? (
                      'Dokumen ini sudah dipenuhi (fulfilled).'
                    ) : selectedSr?.status === 'rejected' ? (
                      'Dokumen ini ditolak (rejected).'
                    ) : (
                      'Dokumen ini sedang diproses oleh tim Purchasing. Approval dan penghapusan hanya dapat dilakukan oleh Purchasing.'
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={s.actionRow} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%' }}>
              {isDraft && (
                <PButton variant="secondary" size="sm" onClick={onEdit}>Edit Draft</PButton>
              )}
              {isDraft && (
                <PButton variant="danger" size="sm" onClick={onDelete}>Hapus</PButton>
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
