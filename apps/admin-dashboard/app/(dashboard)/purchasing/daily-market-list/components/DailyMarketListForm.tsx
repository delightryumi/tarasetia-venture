'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, User, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PButton } from '@/components/purchasing/ui/PButton';
import SearchableSelect from '@/components/purchasing/ui/SearchableSelect';
import { formatRupiah } from '@/lib/purchasing/utils';
import { toast } from 'sonner';
import s from '../../shared-page.module.css';

const DEPARTMENTS = ["Food & Beverage", "Front Office", "Housekeeping", "Accounting", "Purchasing"];
const FB_CATEGORIES = ["Food", "Beverage"];
const EVENT_CATEGORIES = ["A la Carte", "Banquet"];

const slideInFull = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as any } },
  exit: { x: '100%', transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as any } },
};

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface DailyMarketListFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: any;
  items: any[];
  suppliers: any[];
  user: any;
  onSave: (status: 'draft' | 'submitted', data: any) => Promise<void>;
}

export default function DailyMarketListForm({
  isOpen,
  onClose,
  initialData,
  items,
  suppliers,
  user,
  onSave
}: DailyMarketListFormProps) {
  const [orderDate, setOrderDate] = useState(getTodayStr());
  const [deliveryDate, setDeliveryDate] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [fbCategory, setFbCategory] = useState(FB_CATEGORIES[0]);
  const [eventCategory, setEventCategory] = useState(EVENT_CATEGORIES[0]);
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'tempo'>('paid');
  const [dmlItems, setDmlItems] = useState<{ item_id: string; qty_ordered: number; unit_price: number; supplier_id: string }[]>([]);

  useEffect(() => {
    if (initialData) {
      setNotes(initialData.notes || '');
      setDepartment(initialData.department || DEPARTMENTS[0]);
      setPaymentStatus(initialData.paymentStatus || 'paid');
      
      const loadedFbCat = initialData.fb_category || FB_CATEGORIES[0];
      let loadedEvCat = initialData.event_category || EVENT_CATEGORIES[0];
      if (loadedFbCat === 'Beverage' && loadedEvCat === 'Banquet') {
        loadedEvCat = 'A la Carte';
      }
      setFbCategory(loadedFbCat);
      setEventCategory(loadedEvCat);
      const dateObj = initialData.date?.toDate ? initialData.date.toDate() : new Date(initialData.date);
      setOrderDate(initialData.order_date || dateObj.toISOString().split('T')[0]);
      setDeliveryDate(initialData.delivery_date ? (initialData.delivery_date?.toDate ? initialData.delivery_date.toDate().toISOString().split('T')[0] : new Date(initialData.delivery_date).toISOString().split('T')[0]) : '');
      setDmlItems((initialData.items ?? []).map((i: any) => {
        const foundItem = items.find(itm => itm.id === i.item_id || itm.name === i.name);
        const foundSupplier = suppliers.find(sup => sup.id === i.supplier_id || sup.name === i.supplier_name);
        return {
          item_id: foundItem?.id || i.item_id || '',
          qty_ordered: i.qty_ordered,
          unit_price: i.unit_price || 0,
          supplier_id: foundSupplier?.id || i.supplier_id || foundItem?.default_supplier_id || ''
        };
      }));
    } else {
      setNotes('');
      setOrderDate(getTodayStr());
      setDeliveryDate('');
      setDepartment(DEPARTMENTS[0]);
      setFbCategory(FB_CATEGORIES[0]);
      setEventCategory(EVENT_CATEGORIES[0]);
      setPaymentStatus('paid');
      setDmlItems([]);
    }
  }, [initialData, items, suppliers, isOpen]);

  const handleSave = async (targetStatus: 'draft' | 'submitted') => {
    if (dmlItems.length === 0) {
      toast.error('Add at least one item.');
      return;
    }

    const payloadItems = dmlItems.map(di => {
      const orig = items.find(i => i.id === di.item_id)!;
      const sup = suppliers.find(s => s.id === di.supplier_id);
      const uPrice = Number(di.unit_price || 0);
      return { 
        item_id: di.item_id, 
        category: orig?.category || 'General', 
        name: orig?.name || 'Item', 
        unit: orig?.unit || 'pcs', 
        qty_ordered: Number(di.qty_ordered), 
        qty_received: 0, 
        unit_price: uPrice, 
        total: Number(di.qty_ordered) * uPrice, 
        supplier_id: di.supplier_id || '', 
        supplier_name: sup?.name || '' 
      };
    });

    const totalCost = payloadItems.reduce((a, i) => a + i.total, 0);
    const extraData = { 
      department, 
      fb_category: department === 'Food & Beverage' ? fbCategory : null, 
      event_category: department === 'Food & Beverage' ? eventCategory : null 
    };

    const finalData = {
      items: payloadItems,
      total_cost: totalCost,
      notes,
      order_date: orderDate,
      delivery_date: deliveryDate ? new Date(deliveryDate) : null,
      paymentStatus,
      ...extraData
    };

    await onSave(targetStatus, finalData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={s.createSliderBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={s.createSlider}
            variants={slideInFull}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className={s.createSliderHeader}>
              <button className={s.createSliderBackBtn} onClick={onClose}>
                <ArrowLeft size={18} />
              </button>
              <div className={s.createSliderHeaderInfo}>
                <h2 className={s.createSliderTitle}>{initialData ? 'Edit Daily Market Checklist' : 'Daily Market Checklist'}</h2>
                <p className={s.createSliderSubtitle}>Specify fresh produce requirements for kitchen operations.</p>
              </div>
            </div>

            {/* Body */}
            <div className={s.createSliderBody}>
              {/* Meta Info Bar */}
              <div className={s.metaInfoBar}>
                <div className={s.metaInfoItem}>
                  <span className={s.metaInfoLabel}><User size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />Prepared By</span>
                  <span className={s.metaInfoValue}>{user?.displayName || user?.email || 'Chef'}</span>
                </div>
                <div className={s.metaInfoItem}>
                  <span className={s.metaInfoLabel}>Account / UID</span>
                  <span className={s.metaInfoValue} style={{ fontSize: 12, color: 'var(--p-muted)' }}>{user?.email || user?.uid || '—'}</span>
                </div>
                <div className={s.metaInfoItem}>
                  <span className={s.metaInfoLabel}>Role</span>
                  <span className={s.metaInfoValue}>{(user as any)?.role || 'Staff'}</span>
                </div>
              </div>

              {/* Date Inputs */}
              <div className={s.dateInputsGrid}>
                <div className={s.formField}>
                  <label className={s.formLabel}><Calendar size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />Order Date (Tanggal Order)</label>
                  <input className={s.formInput} type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} required />
                </div>
                <div className={s.formField}>
                  <label className={s.formLabel}><Calendar size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />Expected Delivery Date (Tanggal Datang)</label>
                  <input className={s.formInput} type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
                </div>
              </div>

              {/* Department Selection */}
              <div className={s.formField}>
                <label className={s.formLabel}>Department</label>
                <div className={s.chipGroup}>
                  {DEPARTMENTS.map(dep => (
                    <button type="button" key={dep} className={`${s.chip} ${department === dep ? s.chipActive : ''}`} onClick={() => setDepartment(dep)}>{dep}</button>
                  ))}
                </div>
                {department === 'Food & Beverage' && (
                  <div style={{ marginTop: 12, paddingLeft: 12, borderLeft: '2px solid var(--p-hairline)' }}>
                    <label className={s.formLabel} style={{ fontSize: 11, color: 'var(--p-muted)' }}>F&B Category</label>
                    <div className={s.chipGroup}>
                      {FB_CATEGORIES.map(cat => (
                        <button
                          type="button"
                          key={cat}
                          className={`${s.chip} ${fbCategory === cat ? s.chipActive : ''}`}
                          onClick={() => {
                            setFbCategory(cat);
                            if (cat === 'Beverage') {
                              setEventCategory('A la Carte');
                            }
                          }}
                          style={{ padding: '4px 12px', fontSize: 12 }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <label className={s.formLabel} style={{ fontSize: 11, color: 'var(--p-muted)', marginTop: 8 }}>Service Type</label>
                    <div className={s.chipGroup}>
                      {EVENT_CATEGORIES.filter(cat => !(fbCategory === 'Beverage' && cat === 'Banquet')).map(cat => (
                        <button type="button" key={cat} className={`${s.chip} ${eventCategory === cat ? s.chipActive : ''}`} onClick={() => setEventCategory(cat)} style={{ padding: '4px 12px', fontSize: 12 }}>{cat}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Item Rows */}
              <div className={s.itemRowsHeader}>
                <span className={s.itemRowsLabel}>Fresh Produce Lines</span>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <SearchableSelect 
                  items={items.filter(it => (it.procurement_module || 'SR') === 'DML' && !dmlItems.find(di => di.item_id === it.id))}
                  value=""
                  placeholder="Search and select an item to add to the list..."
                  onChange={(val: string) => {
                    const foundItem = items.find(it => it.id === val);
                    if (foundItem) {
                      setDmlItems(r => [...r, { item_id: val, qty_ordered: 1, unit_price: foundItem.last_purchase_price || 0, supplier_id: foundItem.default_supplier_id || '' }]);
                    }
                  }}
                  showStock={false}
                />
              </div>

              <table className={s.excelTable}>
                <thead>
                  <tr>
                    <th>Nama Barang</th>
                    <th>Jumlah</th>
                    <th>Unit</th>
                    <th>Supplier</th>
                    <th className={s.excelThRight}>Harga Satuan</th>
                    <th className={s.excelThRight}>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {dmlItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--p-muted)', fontSize: 13 }}>
                        No items added yet. Search above to add items.
                      </td>
                    </tr>
                  ) : (() => {
                    const enriched = dmlItems.map((di, idx) => ({ ...di, _idx: idx, _item: items.find(i => i.id === di.item_id) }));
                    const grouped: Record<string, typeof enriched> = {};
                    enriched.forEach(e => { const cat = e._item?.category || 'Uncategorized'; if (!grouped[cat]) grouped[cat] = []; grouped[cat].push(e); });
                    const sortedCats = Object.keys(grouped).sort();
                    return sortedCats.flatMap(cat => [
                      <tr key={`cat-${cat}`} className={s.categoryHeaderRow}>
                        <td colSpan={7} className={s.categoryHeaderCell}>{cat}</td>
                      </tr>,
                      ...grouped[cat].map(e => (
                        <tr key={e._idx}>
                          <td style={{ minWidth: 200, paddingLeft: 24 }}>
                            <div style={{ fontWeight: 500, color: 'var(--p-ink)' }}>{e._item?.name}</div>
                          </td>
                          <td style={{ width: 80 }}>
                            <input className={s.formInput} type="number" min={0} step="any" value={e.qty_ordered} onChange={ev => setDmlItems(r => r.map((row, i) => i === e._idx ? { ...row, qty_ordered: Number(ev.target.value) } : row))} required />
                          </td>
                          <td className={s.excelTdCenter} style={{ width: 60, color: 'var(--p-muted)', fontSize: 12 }}>{e._item?.unit || '—'}</td>
                          <td style={{ width: 140, fontSize: 13, color: 'var(--p-ink)', verticalAlign: 'middle' }}>
                            {suppliers.find(sup => sup.id === e.supplier_id)?.name || e._item?.default_supplier_name || 'No Supplier'}
                          </td>
                          <td style={{ width: 140 }}>
                            <input className={s.formInput} type="text" readOnly value={formatRupiah(e.unit_price)} style={{ backgroundColor: 'var(--p-surface-soft)', color: 'var(--p-muted)' }} />
                          </td>
                          <td className={s.excelTdRight} style={{ width: 120 }}>
                            {formatRupiah((e.qty_ordered || 0) * (e.unit_price || 0))}
                          </td>
                          <td className={s.excelNoCol}>
                            <button type="button" className={s.removeBtn} onClick={() => setDmlItems(r => r.filter((_, i) => i !== e._idx))}><X size={14} /></button>
                          </td>
                        </tr>
                      ))
                    ]);
                  })()}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'right' }}>Total Estimated Cost:</td>
                    <td className={s.excelTdRight}>{formatRupiah(dmlItems.reduce((acc, curr) => acc + (curr.qty_ordered * curr.unit_price), 0))}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>

              <div className={s.formField} style={{ marginBottom: 0 }}>
                <label className={s.formLabel}>Chef's Notes</label>
                <textarea className={s.formTextarea} placeholder="Brand preferences, special notes, quality requirements…" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>

            {/* Footer */}
            <div className={s.createSliderFooter}>
              <PButton variant="secondary" onClick={onClose}>Cancel</PButton>
              <PButton variant="secondary" onClick={() => handleSave('draft')}>Save Draft</PButton>
              <PButton variant="primary" onClick={() => handleSave('submitted')}>Submit Requisition</PButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
