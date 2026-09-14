'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Download, Printer, CheckCircle, FileSpreadsheet, AlertTriangle, ShieldCheck, Trash2 } from 'lucide-react';
import s from '../stock-opname.module.css';
import { PButton } from '@/components/purchasing/ui/PButton';
import { formatRupiah } from '@/lib/purchasing/utils';
import { exportStockOpnameToCSV } from '@/lib/purchasing/exportStockOpname';
import { useSettings } from '@/hooks/useSettings';

interface StockOpnameDetailProps {
  opname: any;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPrint: () => void;
}

const slideInRight = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as any } },
  exit: { x: '100%', transition: { duration: 0.22 } },
};

export default function StockOpnameDetail({ opname, onClose, onApprove, onPrint }: StockOpnameDetailProps) {
  if (!opname) return null;

  const { property, pos } = useSettings();
  const hotelInfo = property || pos;
  const partnerName = hotelInfo?.name || 'HOTEL & RESORT';

  const items: any[] = opname.items || [];
  const varianceItems = items.filter(i => i.variance !== 0);
  const matchedCount = items.length - varianceItems.length;

  const totalBookVal = items.reduce((sum, i) => sum + (i.system_qty * (i.unit_price || 0)), 0);
  const totalPhysVal = items.reduce((sum, i) => sum + (i.physical_qty * (i.unit_price || 0)), 0);
  const totalVarianceVal = totalPhysVal - totalBookVal;

  const handleExportCSV = () => {
    exportStockOpnameToCSV({
      hotelName: partnerName,
      department: opname.department || 'Purchasing',
      period: opname.period,
      conductedBy: opname.conducted_by_name || opname.conducted_by,
      status: opname.status,
      items: items.map(i => ({
        item_code: i.item_code,
        name: i.name,
        category: i.category,
        unit: i.unit,
        system_qty: i.system_qty,
        physical_qty: i.physical_qty,
        variance: i.variance,
        unit_price: i.unit_price || 0,
        variance_value: i.variance * (i.unit_price || 0),
        notes: i.notes
      }))
    });
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className={s.drawerBackdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <motion.div
        variants={slideInRight}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={s.drawer}
      >
        <div className={s.drawerHeader}>
          <h2 className={s.drawerTitle}>
            <span>Inventory Reconciliation Sheet</span>
            <span className={s.badgePeriod}>{opname.period}</span>
          </h2>
          <button className={s.drawerClose} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={s.drawerBody}>
          {/* Metadata Hotel Grid */}
          <div className={s.drawerMetaGrid}>
            <div className={s.drawerMetaItem}>
              <span className={s.drawerMetaLabel}>Department / Store</span>
              <span className={s.drawerMetaValue}>{opname.department || 'Central Store (Purchasing)'}</span>
            </div>
            <div className={s.drawerMetaItem}>
              <span className={s.drawerMetaLabel}>Auditor / Staff</span>
              <span className={s.drawerMetaValue}>{opname.conducted_by_name || opname.conducted_by || '-'}</span>
            </div>
            <div className={s.drawerMetaItem}>
              <span className={s.drawerMetaLabel}>Audit Status</span>
              <span className={s.drawerMetaValue} style={{ textTransform: 'uppercase' }}>{opname.status}</span>
            </div>
            <div className={s.drawerMetaItem}>
              <span className={s.drawerMetaLabel}>Total Audited Items</span>
              <span className={s.drawerMetaValue}>{items.length} Items ({matchedCount} Matched, {varianceItems.length} Discrepant)</span>
            </div>
          </div>

          {/* Variance Summary Banner */}
          <div className={s.drawerVarianceSummary}>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Net Variance Value
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 3, color: totalVarianceVal < 0 ? '#e11d48' : totalVarianceVal > 0 ? '#16a34a' : '#0f172a' }}>
                {totalVarianceVal > 0 ? '+' : ''}{formatRupiah(totalVarianceVal)}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: '#475569' }}>
              <div>Book Stock: <strong>{formatRupiah(totalBookVal)}</strong></div>
              <div>Physical Count: <strong>{formatRupiah(totalPhysVal)}</strong></div>
            </div>
          </div>

          {/* Action Quick Buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={handleExportCSV}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 12px',
                background: '#f0fdf4',
                color: '#166534',
                border: '1px solid #bbf7d0',
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <FileSpreadsheet size={15} />
              Export Reconciliation (CSV)
            </button>
            <button
              onClick={onPrint}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 12px',
                background: '#eff6ff',
                color: '#1e40af',
                border: '1px solid #bfdbfe',
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Printer size={15} />
              Print Audit Report
            </button>
          </div>

          {/* Discrepancy Breakdown Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em' }}>
                Discrepancy Breakdown ({varianceItems.length})
              </span>
              {varianceItems.length === 0 && (
                <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>All Stock Matched Perfectly ✓</span>
              )}
            </div>

            <div className={s.drawerItemsList}>
              {varianceItems.map((item, idx) => {
                const varVal = item.variance * (item.unit_price || 0);
                const isNeg = item.variance < 0;
                return (
                  <div key={idx} className={s.drawerItemRow}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                        Book: <strong>{item.system_qty}</strong> → Physical: <strong>{item.physical_qty}</strong> {item.unit}
                        {item.unit_price ? ` @ ${formatRupiah(item.unit_price)}` : ''}
                      </div>
                      {item.notes && (
                        <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginTop: 2 }}>
                          Remarks: {item.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: isNeg ? '#e11d48' : '#16a34a' }}>
                        {item.variance > 0 ? '+' : ''}{item.variance} {item.unit}
                      </div>
                      <div style={{ fontSize: 11.5, color: isNeg ? '#e11d48' : '#16a34a', fontFamily: 'monospace' }}>
                        {varVal > 0 ? `+${formatRupiah(varVal)}` : formatRupiah(varVal)}
                      </div>
                    </div>
                  </div>
                );
              })}

              {matchedCount > 0 && (
                <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 12.5, color: '#64748b', background: '#f8fafc', borderRadius: 6, border: '1px dashed #cbd5e1' }}>
                  {matchedCount} other items match the system book stock perfectly (variance 0).
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className={s.drawerFooter}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <PButton variant="secondary" size="sm" onClick={onClose}>
              Close
            </PButton>
            {onDelete && (
              <PButton
                variant="danger"
                size="sm"
                onClick={() => onDelete(opname.id)}
              >
                <Trash2 size={13} style={{ display: 'inline', marginRight: 4 }} />
                Void / Delete
              </PButton>
            )}
          </div>

          {opname.status === 'submitted' && onApprove && (
            <PButton
              size="sm"
              onClick={() => onApprove(opname.id)}
              style={{ background: '#166534', color: '#fff', borderColor: '#166534' }}
            >
              <CheckCircle size={14} />
              Approve & Lock Opname
            </PButton>
          )}
        </div>
      </motion.div>
    </>
  );
}
