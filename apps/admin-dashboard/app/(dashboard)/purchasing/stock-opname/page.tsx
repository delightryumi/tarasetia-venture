'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStockOpname } from '@/hooks/purchasing/useStockOpname';
import { useItems } from '@/hooks/purchasing/useItems';
import { formatRupiah } from '@/lib/purchasing/utils';
import { PButton } from '@/components/purchasing/ui/PButton';
import s from '../shared-page.module.css';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as any } },
};

const slideInRight = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as any } },
  exit: { x: '100%', transition: { duration: 0.25 } },
};

export default function StockOpnamePage() {
  const router = useRouter();
  const { opnames, loading } = useStockOpname();
  const { items } = useItems();

  const [selected, setSelected] = useState<any>(null);
  const [departmentFilter, setDepartmentFilter] = useState('');

  const filteredOpnames = useMemo(() => {
    return opnames.filter(op => {
      if (!departmentFilter) return true;
      return (op.department || 'Purchasing').toLowerCase() === departmentFilter.toLowerCase();
    });
  }, [opnames, departmentFilter]);

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Stock Opname</h1>
          <p className={s.subtitle}>Physical inventory count, variance reconciliation, and stock synchronization.</p>
        </div>
        <PButton onClick={() => router.push('/purchasing/stock-opname/new?module=purchasing')}>
          <Plus size={16} strokeWidth={2} />
          Perform Opname
        </PButton>
      </div>

      {/* Filter Bar */}
      <div className={s.filterBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter Department</span>
          <select className={s.filterSelect} value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
            <option value="">All Departments</option>
            <option value="Food">Food</option>
            <option value="Beverage">Beverage</option>
            <option value="Front Office">Front Office</option>
            <option value="Housekeeping">Housekeeping</option>
            <option value="Purchasing">Purchasing</option>
          </select>
        </div>
      </div>

      <div className={s.twoPanel}>
        <div className={s.tableCard}>
          <table className={s.table}>
            <thead className={s.tableHead}>
              <tr>
                <th>Period</th>
                <th>Department</th>
                <th>Conducted By</th>
                <th className={s.thRight}>Lines</th>
                <th className={s.thRight}>Variance Items</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className={s.tableBody}>
              {loading ? (
                <tr><td colSpan={6}><div className={s.empty}><p className={s.emptyBody}>Loading…</p></div></td></tr>
              ) : filteredOpnames.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className={s.empty}>
                    <ClipboardList size={40} className={s.emptyIcon} />
                    <p className={s.emptyTitle}>No stock opname records</p>
                    <p className={s.emptyBody}>Perform your first physical stock count to reconcile inventory levels.</p>
                  </div>
                </td></tr>
              ) : filteredOpnames.map(op => {
                const varianceCount = (op.items || []).filter((i: any) => i.variance !== 0).length;
                return (
                  <tr key={op.id} className={selected?.id === op.id ? s.rowSelected : ''} onClick={() => setSelected(op)}>
                    <td className={s.tdPrimary}>{op.period}</td>
                    <td style={{ fontWeight: 600, color: 'var(--p-primary)' }}>{op.department || 'Purchasing'}</td>
                    <td className={s.tdMuted}>{op.conducted_by_name || op.conducted_by}</td>
                    <td className={`${s.tdRight} ${s.tdMuted}`}>{(op.items || []).length}</td>
                    <td className={`${s.tdRight}`} style={{ color: varianceCount > 0 ? 'var(--p-coral)' : 'var(--p-muted)', fontWeight: varianceCount > 0 ? 500 : 400 }}>
                      {varianceCount > 0 ? `${varianceCount} items` : '—'}
                    </td>
                    <td><span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 9999, fontSize: 13, fontWeight: 500, background: op.status === 'locked' ? 'var(--p-ink)' : op.status === 'approved' ? 'var(--p-forest)' : 'var(--p-mint)', color: op.status === 'locked' || op.status === 'approved' ? '#fff' : 'var(--p-ink)' }}>{op.status.charAt(0).toUpperCase() + op.status.slice(1)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail Drawer Popup */}
        <AnimatePresence>
          {selected && (
            <>
              {/* Backdrop */}
              <motion.div
                className={s.drawerBackdrop}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelected(null)}
              />

              {/* Drawer Content */}
              <motion.div
                key={selected.id}
                variants={slideInRight}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={s.detailPanel}
              >
                <div className={s.detailHeader}>
                  <span className={s.detailDocNum}>{selected.period}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--p-muted)' }}>{selected.status}</span>
                </div>
                <div className={s.detailBody}>
                  <div className={s.detailMeta}>
                    <div className={s.detailMetaItem}><div className={s.detailMetaLabel}>Department</div><div className={s.detailMetaValue} style={{ fontWeight: 600 }}>{selected.department || 'Purchasing'}</div></div>
                    <div className={s.detailMetaItem}><div className={s.detailMetaLabel}>Conducted By</div><div className={s.detailMetaValue}>{selected.conducted_by_name || selected.conducted_by}</div></div>
                    <div className={s.detailMetaItem}><div className={s.detailMetaLabel}>Variance Items</div><div className={s.detailMetaValue} style={{ color: 'var(--p-coral)' }}>{(selected.items || []).filter((i: any) => i.variance !== 0).length} items</div></div>
                  </div>
                  <div className={s.detailItems}>
                    {(selected.items || []).filter((i: any) => i.variance !== 0).slice(0, 10).map((item: any, idx: number) => (
                      <div key={idx} className={s.detailItem}>
                        <div>
                          <div className={s.detailItemName}>{item.name}</div>
                          <div className={s.detailItemNote}>System: {item.system_qty} → Physical: {item.physical_qty} {item.unit}</div>
                        </div>
                        <div className={s.detailItemQty} style={{ color: item.variance < 0 ? 'var(--p-coral)' : 'var(--p-success)' }}>
                          {item.variance > 0 ? '+' : ''}{item.variance} {item.unit}
                        </div>
                      </div>
                    ))}
                    {(selected.items || []).filter((i: any) => i.variance === 0).length > 0 && (
                      <div className={s.detailItem} style={{ justifyContent: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--p-muted)' }}>
                          {(selected.items || []).filter((i: any) => i.variance === 0).length} items with no variance
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className={s.actionRow}>
                  <PButton variant="secondary" size="sm" onClick={() => setSelected(null)}>Close</PButton>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
