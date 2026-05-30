import React from 'react';
import styles from './PStatusChip.module.css';

type Status =
  | 'draft' | 'submitted' | 'approved' | 'fulfilled' | 'received'
  | 'rejected' | 'completed' | 'locked' | 'sent_to_supplier' | 'po_issued';

const LABELS: Record<Status, string> = {
  draft:            'Draft',
  submitted:        'Submitted',
  approved:         'Approved',
  fulfilled:        'Fulfilled',
  received:         'Received',
  rejected:         'Rejected',
  completed:        'Completed',
  locked:           'Locked',
  sent_to_supplier: 'Sent to Supplier',
  po_issued:        'PO Issued',
};

interface PStatusChipProps {
  status: Status | string;
}

export function PStatusChip({ status }: PStatusChipProps) {
  const key = status as Status;
  const label = LABELS[key] ?? status;
  const cls = styles[key] ?? styles.submitted;

  return (
    <span className={`${styles.chip} ${cls}`}>
      {label}
    </span>
  );
}
