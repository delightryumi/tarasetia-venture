'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PStatusChip } from '@/components/purchasing/ui/PStatusChip';
import { PButton } from '@/components/purchasing/ui/PButton';
import { formatRupiah } from '@/lib/purchasing/utils';
import s from '@/app/(dashboard)/purchasing/shared-page.module.css';

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
  const isDraft = selectedPr?.status === 'draft';

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
              <span className={s.detailDocNum}>{selectedPr.pr_number}</span>
              <PStatusChip status={selectedPr.status} />
            </div>
            <div className={s.detailBody}>
              <div className={s.detailMeta}>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Department</div>
                  <div className={s.detailMetaValue}>{selectedPr.department}</div>
                </div>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Requested By</div>
                  <div className={s.detailMetaValue}>{selectedPr.requested_by_name || selectedPr.requested_by}</div>
                </div>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Date Created</div>
                  <div className={s.detailMetaValue}>
                    {selectedPr.created_at?.toDate
                      ? selectedPr.created_at.toDate().toLocaleDateString('id-ID')
                      : new Date(selectedPr.created_at).toLocaleDateString('id-ID')}
                  </div>
                </div>
                <div className={s.detailMetaItem}>
                  <div className={s.detailMetaLabel}>Est. Total</div>
                  <div className={s.detailMetaValue}>{formatRupiah(selectedPr.total_estimated || 0)}</div>
                </div>
                {selectedPr.order_date && (
                  <div className={s.detailMetaItem}>
                    <div className={s.detailMetaLabel}>Order Date</div>
                    <div className={s.detailMetaValue}>{new Date(selectedPr.order_date).toLocaleDateString('id-ID')}</div>
                  </div>
                )}
                {selectedPr.approved_by_name && (
                  <div className={s.detailMetaItem}>
                    <div className={s.detailMetaLabel}>Approved By</div>
                    <div className={s.detailMetaValue}>{selectedPr.approved_by_name}</div>
                  </div>
                )}
              </div>

              <div className={s.detailItems}>
                {(selectedPr.items || []).map((item: any, idx: number) => (
                  <div key={idx} className={s.detailItem}>
                    <div>
                      <div className={s.detailItemName}>{item.name || item.item_name}</div>
                      {item.supplier_name && <div className={s.detailItemNote}>{item.supplier_name}</div>}
                      {item.notes && <div className={s.detailItemNote}>{item.notes}</div>}
                    </div>
                    <div className={s.detailItemQty}>
                      {item.qty} {item.unit} · {formatRupiah(item.estimated_price || 0)}
                      <div style={{ fontSize: 11, color: 'var(--p-muted)', marginTop: 2 }}>
                        Total: {formatRupiah(item.subtotal || (item.qty * (item.estimated_price || 0)))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={s.darkCard} style={{ marginTop: 12 }}>
                <div className={s.darkCardLabel}>Total Estimated Cost</div>
                <div className={s.darkCardValue}>{formatRupiah(selectedPr.total_estimated || 0)}</div>
              </div>

              {selectedPr.notes && (
                <div className={s.creamCard}>
                  <div className={s.creamCardTitle}>Remarks</div>
                  <div className={s.creamCardBody}>{selectedPr.notes}</div>
                </div>
              )}

              {!isDraft && (
                <div className={s.creamCard}>
                  <div className={s.creamCardTitle}>Status Info</div>
                  <div className={s.creamCardBody}>
                    {selectedPr?.status === 'approved' ? (
                      `Dokumen ini sudah di-approve oleh Purchasing / Finance${selectedPr.approved_by_name ? ` (${selectedPr.approved_by_name})` : ''}.`
                    ) : selectedPr?.status === 'po_issued' ? (
                      'PO telah diterbitkan untuk dokumen ini (PO Issued).'
                    ) : selectedPr?.status === 'received' ? (
                      'Barang untuk dokumen ini sudah diterima (Received).'
                    ) : selectedPr?.status === 'closed' ? (
                      'Dokumen ini sudah ditutup (Closed).'
                    ) : (
                      'Dokumen ini sedang dalam proses approval oleh Purchasing / Finance. Approval dan penghapusan hanya dapat dilakukan oleh Purchasing.'
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
                <FileText size={14} /> Print PR
              </PButton>
              <PButton variant="secondary" size="sm" style={{ marginLeft: 'auto' }} onClick={onClose}>Close</PButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
