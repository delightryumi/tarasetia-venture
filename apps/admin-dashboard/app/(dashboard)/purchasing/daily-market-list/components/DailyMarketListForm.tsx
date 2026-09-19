'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, FileSpreadsheet, Coffee, CreditCard, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchableSelect from '@/components/purchasing/ui/SearchableSelect';
import { formatRupiah } from '@/lib/purchasing/utils';
import { toast } from 'sonner';
import s from '../../RequisitionFormModal.module.css';

const DEPARTMENTS = [
  { name: "Food & Beverage", code: "500" },
  { name: "Front Office", code: "400" },
  { name: "Housekeeping", code: "450" },
  { name: "POMEC", code: "600" },
  { name: "Accounting", code: "700" },
  { name: "Purchasing", code: "750" },
];

const FB_CATEGORIES = ["Food", "Beverage"];
const EVENT_CATEGORIES = ["A la Carte", "Banquet"];

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
  const [department, setDepartment] = useState(DEPARTMENTS[0].name);
  const [fbCategory, setFbCategory] = useState(FB_CATEGORIES[0]);
  const [eventCategory, setEventCategory] = useState(EVENT_CATEGORIES[0]);
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'tempo'>('paid');
  const [dmlItems, setDmlItems] = useState<{ item_id: string; qty_ordered: number; unit_price: number; supplier_id: string }[]>([]);

  useEffect(() => {
    if (initialData) {
      setNotes(initialData.notes || '');
      setDepartment(initialData.department || DEPARTMENTS[0].name);
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
      setDepartment(DEPARTMENTS[0].name);
      setFbCategory(FB_CATEGORIES[0]);
      setEventCategory(EVENT_CATEGORIES[0]);
      setPaymentStatus('paid');
      setDmlItems([]);
    }
  }, [initialData, items, suppliers, isOpen]);

  const handleSave = async (targetStatus: 'draft' | 'submitted') => {
    if (dmlItems.length === 0) {
      toast.error('Tambahkan minimal satu item pasar harian.');
      return;
    }

    const payloadItems = dmlItems.map(di => {
      const orig = items.find(i => i.id === di.item_id)!;
      const sup = suppliers.find(s => s.id === di.supplier_id);
      const uPrice = Number(di.unit_price || 0);
      return {
        item_id: di.item_id,
        name: orig?.name || 'Item',
        unit: orig?.unit || 'kg',
        qty_ordered: Number(di.qty_ordered),
        qty_received: 0,
        unit_price: uPrice,
        total: Number(di.qty_ordered) * uPrice,
        supplier_id: di.supplier_id || '',
        supplier_name: sup?.name || ''
      };
    });

    const totalCost = payloadItems.reduce((a, i) => a + (i.total || 0), 0);
    const extraData = {
      department,
      fb_category: department === 'Food & Beverage' ? fbCategory : null,
      event_category: department === 'Food & Beverage' ? eventCategory : null
    };

    const finalData = {
      notes,
      items: payloadItems,
      total_cost: totalCost,
      order_date: orderDate,
      delivery_date: deliveryDate ? new Date(deliveryDate) : null,
      paymentStatus,
      ...extraData
    };

    await onSave(targetStatus, finalData);
  };

  const handleRemoveRow = (idx: number) => setDmlItems(r => r.filter((_, i) => i !== idx));

  const handleItemChange = (idx: number, field: string, value: any) => {
    setDmlItems(r => r.map((row, i) => {
      if (i === idx) {
        if (field === 'item_id') {
          const found = items.find(it => it.id === value);
          return { ...row, item_id: value, unit_price: found?.last_purchase_price || 0 };
        }
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const totalCalculatedCost = dmlItems.reduce((acc, curr) => acc + (curr.qty_ordered * curr.unit_price), 0);

  if (!isOpen) return null;

  return (
    <div className={s.pageWrapper}>
      {/* Top Navigation & Breadcrumbs */}
      <div className={s.navBar}>
        <button type="button" className={s.backBtn} onClick={onClose}>
          <ArrowLeft size={16} />
          <span>Kembali ke Jurnal Pasar</span>
        </button>
        <div className={s.navBreadcrumb}>
          <span>Purchasing</span>
          <span className={s.navDivider}>/</span>
          <span>Daily Market List</span>
          <span className={s.navDivider}>/</span>
          <span className={s.navCurrent}>
            {initialData ? 'Edit Checklist Pasar' : 'Checklist Belanja Pasar Baru'}
          </span>
        </div>
      </div>

      {/* Main Full-Page Document */}
      <div className={s.documentCard}>
        {/* Enterprise Header */}
        <div className={s.docHeader}>
          <div className={s.headerLeft}>
            <div className={s.docIconBox}>
              <Coffee size={22} />
            </div>
            <div className={s.headerTitleGroup}>
              <div className={s.headerTopMeta}>
                <span className={s.docCodeBadge}>FORM DML-01</span>
                <span className={s.docTypeSubtitle}>Daily Fresh Market Procurement</span>
              </div>
              <h1 className={s.docTitle}>
                {initialData ? 'Edit Daily Market Checklist' : 'Daily Market Checklist (Belanja Harian Pasar)'}
                <span className={s.hotelBadge}>Kitchen & Fresh Produce</span>
              </h1>
            </div>
          </div>

          <div className={s.headerRight}>
            <span className={s.statusIndicator}>
              {initialData?.status ? String(initialData.status).toUpperCase() : 'NEW CHECKLIST'}
            </span>
          </div>
        </div>

        {/* Document Body */}
        <div className={s.docBody}>
          {/* Section 1: Department Cost Allocation & Payment Terms */}
          <div className={s.formSection}>
            <div className={s.sectionHeader}>
              <div className={s.sectionTitleGroup}>
                <span className={s.sectionStep}>1</span>
                <span className={s.sectionTitle}>Department Cost Allocation & Settlement Terms</span>
              </div>
              <span className={s.sectionNote}>Pusat Biaya & Metode Pembayaran Pasar</span>
            </div>

            {/* Department Selection */}
            <div className={s.fieldItem}>
              <label className={s.fieldLabel}>Operating Cost Center (Departemen)</label>
              <div className={s.deptSelectorGrid}>
                {DEPARTMENTS.map(dep => (
                  <button
                    type="button"
                    key={dep.name}
                    className={`${s.deptBtn} ${department === dep.name ? s.deptBtnActive : ''}`}
                    onClick={() => setDepartment(dep.name)}
                  >
                    <span className={s.deptCode}>DEPT {dep.code}</span>
                    <span className={s.deptName}>{dep.name}</span>
                  </button>
                ))}
              </div>

              {/* F&B Sub-allocation */}
              {department === 'Food & Beverage' && (
                <div className={s.subAllocationBar}>
                  <div className={s.subGroup}>
                    <span className={s.subLabel}>Sub Category:</span>
                    {FB_CATEGORIES.map(cat => (
                      <button
                        type="button"
                        key={cat}
                        className={`${s.pillBtn} ${fbCategory === cat ? s.pillBtnActive : ''}`}
                        onClick={() => {
                          setFbCategory(cat);
                          if (cat === 'Beverage') setEventCategory('A la Carte');
                        }}
                      >
                        {cat === 'Food' ? '5010 - Food Cost' : '5020 - Beverage Cost'}
                      </button>
                    ))}
                  </div>

                  <div className={s.subGroup} style={{ marginLeft: 16 }}>
                    <span className={s.subLabel}>Outlet / Service:</span>
                    {EVENT_CATEGORIES.filter(cat => !(fbCategory === 'Beverage' && cat === 'Banquet')).map(cat => (
                      <button
                        type="button"
                        key={cat}
                        className={`${s.pillBtn} ${eventCategory === cat ? s.pillBtnActive : ''}`}
                        onClick={() => setEventCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dates & Settlement Row */}
            <div className={s.fieldGrid3}>
              <div className={s.fieldItem}>
                <label className={s.fieldLabel}>
                  <Calendar size={12} />
                  Market Purchase Date (Tanggal Pasar)
                </label>
                <input 
                  className={`${s.fieldInput} ${s.fieldInputMono}`}
                  type="date" 
                  value={orderDate} 
                  onChange={e => setOrderDate(e.target.value)} 
                  required 
                />
              </div>

              <div className={s.fieldItem}>
                <label className={s.fieldLabel}>
                  <Calendar size={12} />
                  Delivery / Intake Date (Target Sampai)
                </label>
                <input 
                  className={`${s.fieldInput} ${s.fieldInputMono}`}
                  type="date" 
                  value={deliveryDate} 
                  onChange={e => setDeliveryDate(e.target.value)} 
                />
              </div>

              <div className={s.fieldItem}>
                <label className={s.fieldLabel}>
                  <CreditCard size={12} />
                  Settlement Terms (Pembayaran)
                </label>
                <select 
                  className={s.fieldSelect}
                  value={paymentStatus} 
                  onChange={(e: any) => setPaymentStatus(e.target.value)}
                >
                  <option value="paid">💵 Tunai Langsung / Kasbon Pasar (Paid)</option>
                  <option value="tempo">📄 Tempo / Kredit Supplier (Accounts Payable)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Market Items Lines */}
          <div className={s.formSection}>
            <div className={s.sectionHeader}>
              <div className={s.sectionTitleGroup}>
                <span className={s.sectionStep}>2</span>
                <span className={s.sectionTitle}>Daily Fresh Produce Lines (Daftar Belanja Pasar)</span>
              </div>
              <span className={s.sectionNote}>Sayuran, Daging, Bumbu, & Bahan Segar</span>
            </div>

            <div className={s.searchToolbar}>
              <SearchableSelect 
                items={items.filter(it => (it.procurement_module || 'DML') === 'DML' && !dmlItems.find(di => di.item_id === it.id))}
                value=""
                placeholder="🔍 Cari komoditas segar pasar (contoh: Daging Sapi, Ayam, Bawang Merah, Sayur)..."
                onChange={(val: string) => {
                  const foundItem = items.find(it => it.id === val);
                  if (foundItem) {
                    setDmlItems(r => [...r, { 
                      item_id: val, 
                      qty_ordered: 1, 
                      unit_price: foundItem.last_purchase_price || 0, 
                      supplier_id: foundItem.default_supplier_id || '' 
                    }]);
                  }
                }}
                showStock={false}
              />
            </div>

            <div className={s.itemTableWrapper}>
              <table className={s.itemTable}>
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: 'center' }}>#</th>
                    <th>Item Description</th>
                    <th style={{ width: 80, textAlign: 'center' }}>Unit</th>
                    <th style={{ minWidth: 150 }}>Vendor / Pasar</th>
                    <th style={{ width: 100, textAlign: 'right' }}>Target Qty</th>
                    <th style={{ width: 130, textAlign: 'right' }}>Est. Unit Price</th>
                    <th style={{ width: 130, textAlign: 'right' }}>Line Total</th>
                    <th style={{ width: 44, textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {dmlItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                        <FileSpreadsheet size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#64748b' }}>Belum ada item pasar harian</div>
                        <div style={{ fontSize: 12 }}>Pilih komoditas sayur, daging, atau bumbu di atas untuk menambahkan daftar belanja.</div>
                      </td>
                    </tr>
                  ) : (() => {
                    const enriched = dmlItems.map((di, idx) => ({ ...di, _idx: idx, _item: items.find(i => i.id === di.item_id) }));
                    const grouped: Record<string, typeof enriched> = {};
                    enriched.forEach(e => { const cat = e._item?.category || 'Fresh Market'; if (!grouped[cat]) grouped[cat] = []; grouped[cat].push(e); });
                    const sortedCats = Object.keys(grouped).sort();
                    
                    let counter = 1;
                    return sortedCats.flatMap(cat => [
                      <tr key={`cat-${cat}`} className={s.rowCategoryHeader}>
                        <td colSpan={8} className={s.categoryCell}>
                          🥬 {cat}
                        </td>
                      </tr>,
                      ...grouped[cat].map(e => (
                        <tr key={e._idx}>
                          <td style={{ textAlign: 'center', color: '#94a3b8', fontFamily: 'monospace' }}>
                            {counter++}
                          </td>
                          <td>
                            <div className={s.itemNameCell}>{e._item?.name}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>SKU: {e._item?.sku || 'DML-RAW'}</div>
                          </td>
                          <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                            {e._item?.unit || 'kg'}
                          </td>
                          <td>
                            <select 
                              className={s.fieldSelect} 
                              style={{ height: 34, fontSize: 12, padding: '0 8px' }}
                              value={e.supplier_id} 
                              onChange={ev => handleItemChange(e._idx, 'supplier_id', ev.target.value)}
                            >
                              <option value="">Pasar Tradisional / Kasbon</option>
                              {suppliers.map(sup => (
                                <option key={sup.id} value={sup.id}>{sup.name}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <input 
                              className={s.tableInputNumber} 
                              type="number" 
                              min={0.1} 
                              step="any" 
                              value={e.qty_ordered} 
                              onChange={ev => handleItemChange(e._idx, 'qty_ordered', Number(ev.target.value))} 
                              required 
                            />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <input 
                              className={s.tableInputNumber} 
                              style={{ width: 110 }}
                              type="number" 
                              min={0} 
                              step="any" 
                              value={e.unit_price} 
                              onChange={ev => handleItemChange(e._idx, 'unit_price', Number(ev.target.value))} 
                              required 
                            />
                          </td>
                          <td className={s.tableTotalCell}>
                            {formatRupiah((e.qty_ordered || 0) * (e.unit_price || 0))}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              type="button" 
                              className={s.removeRowBtn} 
                              onClick={() => handleRemoveRow(e._idx)}
                              title="Hapus baris"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    ]);
                  })()}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Box */}
            <div className={s.summaryFooterBox}>
              <div className={s.summaryLeft}>
                <span className={s.summaryCount}>{dmlItems.length} Commodities on Market Checklist</span>
                <span className={s.summaryAllocation}>
                  Terms: <strong>{paymentStatus === 'paid' ? 'Paid (Petty Cash)' : 'Tempo / AP Credit'}</strong> &bull; Charged To: <strong>{department}</strong>
                </span>
              </div>
              <div className={s.summaryRight}>
                <span className={s.summaryTotalLabel}>Total Market Estimate:</span>
                <span className={s.summaryTotalValue}>{formatRupiah(totalCalculatedCost)}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Chef / Purchasing Remarks */}
          <div className={s.formSection}>
            <div className={s.sectionHeader}>
              <div className={s.sectionTitleGroup}>
                <span className={s.sectionStep}>3</span>
                <span className={s.sectionTitle}>Kitchen Operational Notes & Instructions</span>
              </div>
              <span className={s.sectionNote}>Instruksi Khusus Pembelian Pasar</span>
            </div>

            <div className={s.fieldItem}>
              <textarea 
                className={s.remarksTextarea} 
                placeholder="Instruksi khusus belanja pasar (contoh: Pilih daging segar paha atas, ikan ukuran 500g, beli pagi sebelum jam 07:00)..." 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* Page Action Footer */}
        <div className={s.docFooter}>
          <button type="button" className={s.btnSecondary} onClick={onClose}>
            Batal / Kembali
          </button>
          <div className={s.footerActionsRight}>
            <button type="button" className={s.btnSecondary} onClick={() => handleSave('draft')}>
              Simpan Draft
            </button>
            <button type="button" className={s.btnSubmit} onClick={() => handleSave('submitted')}>
              <CheckCircle2 size={16} />
              Submit Market Checklist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
