'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStockOpname } from '@/hooks/purchasing/useStockOpname';
import { useItems } from '@/hooks/purchasing/useItems';
import { useStoreRequisition } from '@/hooks/purchasing/useStoreRequisition';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { formatRupiah } from '@/lib/purchasing/utils';
import { PButton } from '@/components/purchasing/ui/PButton';
import s from '../../shared-page.module.css';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as any } },
};

export default function PerformOpnamePage() {
  const router = useRouter();
  const { opnames, createOpname } = useStockOpname();
  const { items, updateItem } = useItems();
  const { srs } = useStoreRequisition();
  const { user } = useAuth();

  const [notes, setNotes] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [activeDept, setActiveDept] = useState('Purchasing');
  const [addedItemIds, setAddedItemIds] = useState<string[]>([]);
  const [modalSearch, setModalSearch] = useState('');
  const [showModalSuggestions, setShowModalSuggestions] = useState(false);

  useEffect(() => {
    if (user) {
      const role = (user.role || '').toLowerCase();
      let defaultDept = 'Purchasing';
      if (role.includes('food') || role.includes('kitchen') || role.includes('beverage')) {
        defaultDept = 'Food';
      } else if (role.includes('housekeeping')) {
        defaultDept = 'Housekeeping';
      } else if (role.includes('front')) {
        defaultDept = 'Front Office';
      }
      setActiveDept(defaultDept);
    }
  }, [user]);

  const getItemsForDept = (dept: string) => {
    const stockItems = items.filter(i => i.is_active);
    const target = dept.toLowerCase();
    if (target === 'purchasing') {
      return stockItems;
    }
    if (target === 'food') {
      return stockItems.filter(i => [
        'Vegetables', 'Fruits', 'Meat & Poultry', 'Seafood', 
        'Dairy & Eggs', 'Dry Goods & Groceries', 'Kitchen Equipment'
      ].includes(i.category));
    }
    if (target === 'beverage') {
      return stockItems.filter(i => [
        'Beverages', 'Dairy & Eggs', 'Others'
      ].includes(i.category));
    }
    if (target === 'housekeeping') {
      return stockItems.filter(i => [
        'Housekeeping Supplies', 'Others'
      ].includes(i.category));
    }
    if (target === 'front office') {
      return stockItems.filter(i => [
        'Office Stationery', 'Others'
      ].includes(i.category));
    }
    return [];
  };

  const getSystemQtyForDepartment = (itemId: string, dept: string) => {
    if (dept.toLowerCase() === 'purchasing') {
      const item = items.find(i => i.id === itemId);
      return item?.current_stock || 0;
    }
    
    const deptOpnames = opnames
      .filter(op => (op.department || 'Purchasing').toLowerCase() === dept.toLowerCase())
      .sort((a, b) => b.period.localeCompare(a.period));
      
    const lastOpname = deptOpnames[0];
    const lastCount = lastOpname?.items?.find(i => i.item_id === itemId)?.physical_qty || 0;
    const lastOpnameDate = lastOpname?.created_at?.toDate ? lastOpname.created_at.toDate() : (lastOpname?.created_at ? new Date(lastOpname.created_at) : new Date(0));

    const matchedSrs = srs.filter(sr => {
      if (sr.status !== 'fulfilled') return false;
      const srDate = sr.created_at?.toDate ? sr.created_at.toDate() : new Date(sr.created_at);
      if (srDate <= lastOpnameDate) return false;
      
      const srDept = (sr.department || '').toLowerCase();
      const targetDept = dept.toLowerCase();
      
      if (targetDept === 'food') {
        return srDept.includes('kitchen') || srDept.includes('food') || srDept === 'fb kitchen';
      }
      if (targetDept === 'beverage') {
        return srDept.includes('service') || srDept.includes('beverage') || srDept === 'fb service';
      }
      if (targetDept === 'front office') {
        return srDept.includes('front');
      }
      if (targetDept === 'housekeeping') {
        return srDept.includes('housekeeping');
      }
      return false;
    });

    const fulfilledQty = matchedSrs.reduce((sum, sr) => {
      const itemLine = sr.items.find(i => i.item_id === itemId);
      return sum + (itemLine?.qty_fulfilled || 0);
    }, 0);

    return lastCount + fulfilledQty;
  };

  const calculatedLines = useMemo(() => {
    const deptItems = getItemsForDept(activeDept).filter(item => addedItemIds.includes(item.id!));
    return deptItems.map(item => {
      const systemQty = getSystemQtyForDepartment(item.id!, activeDept);
      const physicalQty = counts[item.id!] ?? systemQty;
      const variance = physicalQty - systemQty;
      const unitPrice = customPrices[item.id!] ?? (item.last_purchase_price || 0);
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
    });
  }, [items, counts, customPrices, activeDept, opnames, srs, addedItemIds]);

  const totalVariance = useMemo(() => calculatedLines.reduce((a, i) => a + i.variance_value, 0), [calculatedLines]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (calculatedLines.length === 0) {
      toast.error('Please add at least one item to perform stock opname.');
      return;
    }

    try {
      await createOpname({
        period,
        department: activeDept,
        status: 'submitted' as const,
        items: calculatedLines.map(({ variance_value, ...rest }) => rest),
        conducted_by: user?.uid || 'unknown',
        conducted_by_name: `${user?.displayName || user?.email || 'Staff'} (${user?.role || 'Staff'})`,
        conducted_by_role: user?.role || 'staff',
        approved_by: null,
        approved_by_name: null,
      });

      if (activeDept.toLowerCase() === 'purchasing') {
        for (const line of calculatedLines) {
          if (line.variance !== 0) await updateItem(line.item_id, { current_stock: line.physical_qty });
        }
      }

      toast.success(`Stock opname for ${activeDept} submitted successfully.`);
      router.push('/purchasing/stock-opname?module=purchasing');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit stock opname.');
    }
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <style>{`
        /* Hide spin-buttons for Chrome, Safari, Edge, Opera */
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        /* Hide spin-buttons for Firefox */
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
      <div className={s.header} style={{ marginBottom: 'var(--p-space-lg)' }}>
        <div>
          <button type="button" onClick={() => router.push('/purchasing/stock-opname?module=purchasing')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--p-primary)', cursor: 'pointer', padding: 0, marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
            <ChevronLeft size={16} /> Back to List
          </button>
          <h1 className={s.title}>Perform Physical Stock Count</h1>
          <p className={s.subtitle}>Audit actual item stock levels, verify variances, and record updates.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={s.responsiveGrid}>
        {/* Left Panel: Inputs and Count list */}
        <div className={s.tableCard} style={{ padding: 'var(--p-space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--p-space-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--p-space-md)' }}>
            <div className={s.formField}>
              <label className={s.formLabel}>Department</label>
              <select 
                className={s.formSelect} 
                value={activeDept} 
                onChange={e => {
                  setActiveDept(e.target.value);
                  setAddedItemIds([]);
                  setCounts({});
                  setCustomPrices({});
                  setModalSearch('');
                  setShowModalSuggestions(false);
                }}
                required
              >
                <option value="Food">Food</option>
                <option value="Beverage">Beverage</option>
                <option value="Front Office">Front Office</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Purchasing">Purchasing</option>
              </select>
            </div>

            <div className={s.formField} style={{ position: 'relative' }}>
              <label className={s.formLabel}>Search & Add Item</label>
              <input 
                className={s.formInput} 
                placeholder="Type item name or code..." 
                value={modalSearch} 
                onChange={e => {
                  setModalSearch(e.target.value);
                  setShowModalSuggestions(true);
                }}
                onFocus={() => setShowModalSuggestions(true)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const query = modalSearch.toLowerCase().trim();
                    if (!query) return;
                    
                    const matches = getItemsForDept(activeDept).filter(item => {
                      const matchName = item.name.toLowerCase().includes(query);
                      const matchCode = (item.item_code || '').toLowerCase().includes(query);
                      const alreadyAdded = addedItemIds.includes(item.id!);
                      return (matchName || matchCode) && !alreadyAdded;
                    });
                    
                    if (matches.length > 0) {
                      const item = matches[0];
                      setAddedItemIds(prev => [...prev, item.id!]);
                      const sysQty = getSystemQtyForDepartment(item.id!, activeDept);
                      setCounts(c => ({ ...c, [item.id!]: sysQty }));
                      setCustomPrices(p => ({ ...p, [item.id!]: item.last_purchase_price || 0 }));
                      setModalSearch('');
                      setShowModalSuggestions(false);
                    } else {
                      toast.error('No matching item found or item already added.');
                    }
                  }
                }}
              />
              
              {showModalSuggestions && (
                <div 
                  onClick={() => setShowModalSuggestions(false)} 
                  style={{ position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, zIndex: 999 }} 
                />
              )}

              {showModalSuggestions && modalSearch.trim().length > 0 && (
                <div style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  right: 0, 
                  background: '#fff', 
                  border: '1px solid var(--p-hairline)', 
                  borderRadius: 4, 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                  zIndex: 1000,
                  maxHeight: 200,
                  overflowY: 'auto'
                }}>
                  {getItemsForDept(activeDept)
                    .filter(item => {
                      const query = modalSearch.toLowerCase();
                      const matchName = item.name.toLowerCase().includes(query);
                      const matchCode = (item.item_code || '').toLowerCase().includes(query);
                      const alreadyAdded = addedItemIds.includes(item.id!);
                      return (matchName || matchCode) && !alreadyAdded;
                    })
                    .map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => {
                          setAddedItemIds(prev => [...prev, item.id!]);
                          const sysQty = getSystemQtyForDepartment(item.id!, activeDept);
                          setCounts(c => ({ ...c, [item.id!]: sysQty }));
                          setCustomPrices(p => ({ ...p, [item.id!]: item.last_purchase_price || 0 }));
                          setModalSearch('');
                          setShowModalSuggestions(false);
                        }}
                        style={{ 
                          padding: '10px 12px', 
                          cursor: 'pointer', 
                          borderBottom: '1px solid var(--p-hairline)',
                          fontSize: 14,
                          display: 'flex',
                          justifyContent: 'space-between',
                          color: 'var(--p-ink)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 216, 166, 0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span>{item.name} {item.item_code ? `(${item.item_code})` : ''}</span>
                        <span style={{ fontSize: 12, color: 'var(--p-muted)' }}>{item.category}</span>
                      </div>
                    ))
                  }
                  {getItemsForDept(activeDept)
                    .filter(item => {
                      const query = modalSearch.toLowerCase();
                      const matchName = item.name.toLowerCase().includes(query);
                      const matchCode = (item.item_code || '').toLowerCase().includes(query);
                      const alreadyAdded = addedItemIds.includes(item.id!);
                      return (matchName || matchCode) && !alreadyAdded;
                    }).length === 0 && (
                      <div style={{ padding: '10px 12px', fontSize: 13, color: 'var(--p-muted)' }}>
                        No matching items found
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          <div style={{ border: '1px solid var(--p-hairline)', borderRadius: 'var(--p-radius-md)', overflow: 'hidden', maxHeight: 400, overflowY: 'auto' }}>
            <table className={s.table}>
              <thead className={s.tableHead}>
                <tr>
                  <th>Item</th>
                  <th style={{ width: 140 }}>Unit Price</th>
                  <th className={s.thRight}>System Qty</th>
                  <th>Physical Count</th>
                  <th className={s.thRight}>Variance</th>
                  <th className={s.thRight}>Value Diff</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody className={s.tableBody}>
                {calculatedLines.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--p-muted)', padding: '36px 0' }}>
                      No items added yet. Search and press Enter to add items to audit.
                    </td>
                  </tr>
                ) : calculatedLines.map(line => {
                  const isNeg = line.variance < 0;
                  const isPos = line.variance > 0;
                  return (
                    <tr key={line.item_id} style={{ cursor: 'default' }}>
                      <td className={s.tdPrimary}>{line.name}</td>
                      <td style={{ padding: '6px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 13, color: 'var(--p-muted)' }}>Rp</span>
                          <input
                            type="number" min={0}
                            value={customPrices[line.item_id] ?? line.unit_price}
                            onChange={e => setCustomPrices(p => ({ ...p, [line.item_id]: Number(e.target.value) }))}
                            onWheel={e => e.currentTarget.blur()}
                            required
                            style={{ width: '100%', height: 36, padding: '0 8px', border: '1px solid var(--p-hairline)', borderRadius: 'var(--p-radius-sm)', fontFamily: 'var(--p-font)', fontSize: 14, outline: 'none' }}
                          />
                        </div>
                      </td>
                      <td className={`${s.tdRight} ${s.tdMuted}`}>{line.system_qty} {line.unit}</td>
                      <td style={{ padding: '6px 20px' }}>
                        <input
                          type="number" min={0}
                          value={counts[line.item_id] ?? line.system_qty}
                          onChange={e => setCounts(c => ({ ...c, [line.item_id]: Number(e.target.value) }))}
                          onWheel={e => e.currentTarget.blur()}
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
                      <td style={{ padding: '0 12px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setAddedItemIds(prev => prev.filter(id => id !== line.item_id));
                            setCounts(c => {
                              const updated = { ...c };
                              delete updated[line.item_id];
                              return updated;
                            });
                            setCustomPrices(p => {
                              const updated = { ...p };
                              delete updated[line.item_id];
                              return updated;
                            });
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--p-coral)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}
                        >
                          <X size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel: Summary & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--p-space-md)' }}>
          <div className={s.darkCard} style={{ padding: 'var(--p-space-lg)' }}>
            <div className={s.darkCardLabel} style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.6)' }}>Net Variance Value</div>
            <div className={s.darkCardValue} style={{ fontSize: 24, fontWeight: 700, marginTop: 8, color: totalVariance < 0 ? 'var(--p-peach)' : totalVariance > 0 ? 'var(--p-mint)' : '#fff' }}>
              {totalVariance > 0 ? '+' : ''}{formatRupiah(totalVariance)}
            </div>
          </div>

          <div className={s.tableCard} style={{ padding: 'var(--p-space-lg)' }}>
            <div className={s.formField}>
              <label className={s.formLabel}>Audit Remarks</label>
              <textarea 
                className={s.formTextarea} 
                placeholder="Justification for variances, damage notes, etc." 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                style={{ minHeight: 96 }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'var(--p-space-md)' }}>
              <PButton type="submit" style={{ width: '100%' }}>Submit & Sync Inventory</PButton>
              <PButton type="button" variant="secondary" onClick={() => router.push('/purchasing/stock-opname?module=purchasing')} style={{ width: '100%' }}>Cancel</PButton>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
