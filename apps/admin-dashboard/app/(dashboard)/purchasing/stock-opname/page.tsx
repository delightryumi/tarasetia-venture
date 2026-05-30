'use client';

import React, { useState, useMemo } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStockOpname } from '@/hooks/purchasing/useStockOpname';
import { useItems } from '@/hooks/purchasing/useItems';
import { toast } from 'sonner';
import { formatRupiah } from '@/lib/purchasing/utils';
import { PButton } from '@/components/purchasing/ui/PButton';
import { useAuth } from '@/context/AuthContext';
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
  const { opnames, loading, createOpname } = useStockOpname();
  const { items, updateItem } = useItems();
  const { user } = useAuth();

  const [selected, setSelected] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({});

  const handleOpen = () => {
    const init: Record<string, number> = {};
    items.filter(i => (i.procurement_module || 'SR') === 'SR').forEach(i => { init[i.id!] = i.current_stock || 0; });
    setCounts(init);
    setNotes('');
    setIsOpen(true);
  };

  const calculatedLines = useMemo(() => items.filter(i => (i.procurement_module || 'SR') === 'SR').map(item => {
    const systemQty = item.current_stock || 0;
    const physicalQty = counts[item.id!] ?? systemQty;
    const variance = physicalQty - systemQty;
    const unitPrice = item.last_purchase_price || 0;
    return {
      item_id: item.id!,
      name: item.name,
      unit: item.unit,
      system_qty: systemQty,
      physical_qty: physicalQty,
      variance,
      variance_type: 'none' as const,
      unit_price: unitPrice,
      variance_value: variance * unitPrice,
    };
  }), [items, counts]);

  const totalVariance = useMemo(() => calculatedLines.reduce((a, i) => a + i.variance_value, 0), [calculatedLines]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    try {
      await createOpname({
        period,
        status: 'submitted' as const,
        items: calculatedLines.map(({ unit_price, variance_value, ...rest }) => rest),
        conducted_by: user?.uid || 'unknown',
        conducted_by_name: user?.email || 'Inventory Clerk',
        approved_by: null,
        approved_by_name: null,
      });
      for (const line of calculatedLines) {
        if (line.variance !== 0) await updateItem(line.item_id, { current_stock: line.physical_qty });
      }
      toast.success('Stock opname submitted. Inventory levels synchronized.');
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit stock opname.');
    }
  };

  const getVarianceValue = (op: any) => {
    return (op.items || []).reduce((a: number, i: any) => {
      const unitPrice = items.find(item => item.id === i.item_id)?.last_purchase_price || 0;
      return a + (i.variance * unitPrice);
    }, 0);
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Stock Opname</h1>
          <p className={s.subtitle}>Physical inventory count, variance reconciliation, and stock synchronization.</p>
        </div>
        <PButton onClick={handleOpen}>
          <Plus size={16} strokeWidth={2} />
          Perform Opname
        </PButton>
      </div>

      <div className={s.twoPanel}>
        <div className={s.tableCard}>
          <table className={s.table}>
            <thead className={s.tableHead}>
              <tr>
                <th>Period</th>
                <th>Conducted By</th>
                <th className={s.thRight}>Lines</th>
                <th className={s.thRight}>Variance Items</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className={s.tableBody}>
              {loading ? (
                <tr><td colSpan={5}><div className={s.empty}><p className={s.emptyBody}>Loading…</p></div></td></tr>
              ) : opnames.length === 0 ? (
                <tr><td colSpan={5}>
                  <div className={s.empty}>
                    <ClipboardList size={40} className={s.emptyIcon} />
                    <p className={s.emptyTitle}>No stock opname records</p>
                    <p className={s.emptyBody}>Perform your first physical stock count to reconcile inventory levels.</p>
                  </div>
                </td></tr>
              ) : opnames.map(op => {
                const varianceCount = (op.items || []).filter((i: any) => i.variance !== 0).length;
                return (
                  <tr key={op.id} className={selected?.id === op.id ? s.rowSelected : ''} onClick={() => setSelected(op)}>
                    <td className={s.tdPrimary}>{op.period}</td>
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

      {/* Opname Count Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div className={s.modalOverlay} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} initial="hidden" animate="visible" exit="hidden" onClick={e => { if (e.target === e.currentTarget) setIsOpen(false); }}>
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className={`${s.modal} ${s.modalLarge}`} style={{ maxWidth: 800 }}>
              <h2 className={s.modalTitle}>Physical Stock Count</h2>
              <p className={s.modalSubtitle}>Enter actual physical quantities. Variances are calculated in real-time.</p>

              <form onSubmit={handleSubmit}>
                <div style={{ border: '1px solid var(--p-hairline)', borderRadius: 'var(--p-radius-md)', overflow: 'hidden', marginBottom: 'var(--p-space-lg)', maxHeight: 360, overflowY: 'auto' }}>
                  <table className={s.table}>
                    <thead className={s.tableHead}>
                      <tr>
                        <th>Item</th>
                        <th className={s.thRight}>System Qty</th>
                        <th>Physical Count</th>
                        <th className={s.thRight}>Variance</th>
                        <th className={s.thRight}>Value Diff</th>
                      </tr>
                    </thead>
                    <tbody className={s.tableBody}>
                      {calculatedLines.map(line => {
                        const isNeg = line.variance < 0;
                        const isPos = line.variance > 0;
                        return (
                          <tr key={line.item_id} style={{ cursor: 'default' }}>
                            <td className={s.tdPrimary}>{line.name}</td>
                            <td className={`${s.tdRight} ${s.tdMuted}`}>{line.system_qty} {line.unit}</td>
                            <td style={{ padding: '6px 20px' }}>
                              <input
                                type="number" min={0}
                                value={counts[line.item_id] ?? line.system_qty}
                                onChange={e => setCounts(c => ({ ...c, [line.item_id]: Number(e.target.value) }))}
                                required
                                style={{ width: 80, height: 36, padding: '0 10px', border: '1px solid var(--p-hairline)', borderRadius: 'var(--p-radius-sm)', fontFamily: 'var(--p-font)', fontSize: 14, outline: 'none' }}
                              />
                            </td>
                            <td className={s.tdRight} style={{ color: isNeg ? 'var(--p-coral)' : isPos ? 'var(--p-success)' : 'var(--p-muted)', fontWeight: 500 }}>
                              {isPos ? '+' : ''}{line.variance}
                            </td>
                            <td className={`${s.tdRight} ${s.tdMono}`} style={{ color: isNeg ? 'var(--p-coral)' : isPos ? 'var(--p-success)' : 'var(--p-muted)', fontWeight: 500 }}>
                              {isPos ? '+' : ''}{formatRupiah(line.variance_value)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className={s.darkCard} style={{ marginBottom: 'var(--p-space-lg)' }}>
                  <div className={s.darkCardLabel}>Net Variance Value</div>
                  <div className={s.darkCardValue} style={{ color: totalVariance < 0 ? 'var(--p-peach)' : totalVariance > 0 ? 'var(--p-mint)' : '#fff' }}>
                    {totalVariance > 0 ? '+' : ''}{formatRupiah(totalVariance)}
                  </div>
                </div>

                <div className={s.formField} style={{ marginBottom: 0 }}>
                  <label className={s.formLabel}>Audit Remarks</label>
                  <textarea className={s.formTextarea} placeholder="Justification for variances, damage notes, etc." value={notes} onChange={e => setNotes(e.target.value)} style={{ minHeight: 72 }} />
                </div>

                <div className={s.modalActions}>
                  <PButton type="submit">Submit & Sync Inventory</PButton>
                  <PButton type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</PButton>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
