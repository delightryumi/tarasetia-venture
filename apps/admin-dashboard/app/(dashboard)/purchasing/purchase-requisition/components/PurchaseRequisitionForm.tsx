'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, CheckCircle2, FileSpreadsheet, ShoppingBag, CreditCard, Plus, Trash2, X } from 'lucide-react';
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

interface PurchaseRequisitionFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: any;
  items: any[];
  suppliers: any[];
  user: any;
  onSave: (status: 'draft' | 'submitted', data: any) => Promise<void>;
}

export default function PurchaseRequisitionForm({
  isOpen,
  onClose,
  initialData,
  items,
  suppliers,
  user,
  onSave
}: PurchaseRequisitionFormProps) {
  const [orderDate, setOrderDate] = useState(getTodayStr());
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0].name);
  const [fbCategory, setFbCategory] = useState(FB_CATEGORIES[0]);
  const [eventCategory, setEventCategory] = useState(EVENT_CATEGORIES[0]);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'tempo'>('paid');
  const [prItems, setPrItems] = useState<{ item_id: string; qty: number; estimated_price: number; supplier_id: string }[]>([]);

  useEffect(() => {
    if (initialData) {
      const createdDate = initialData.created_at?.toDate ? initialData.created_at.toDate() : new Date(initialData.created_at);
      setOrderDate(initialData.order_date || createdDate.toISOString().split('T')[0]);
      const formattedDate = initialData.delivery_date?.toDate
        ? initialData.delivery_date.toDate().toISOString().split('T')[0]
        : (initialData.delivery_date ? new Date(initialData.delivery_date).toISOString().split('T')[0] : '');
      setDeliveryDate(formattedDate);
      setDepartment(initialData.department || DEPARTMENTS[0].name);
      setPaymentStatus(initialData.paymentStatus || 'paid');
      
      const loadedFbCat = initialData.fb_category || FB_CATEGORIES[0];
      let loadedEvCat = initialData.event_category || EVENT_CATEGORIES[0];
      if (loadedFbCat === 'Beverage' && loadedEvCat === 'Banquet') {
        loadedEvCat = 'A la Carte';
      }
      setFbCategory(loadedFbCat);
      setEventCategory(loadedEvCat);
      setNotes(initialData.notes || '');
      setPrItems((initialData.items ?? []).map((i: any) => {
        const foundItem = items.find(itm => itm.id === i.item_id || itm.name === i.name);
        const foundSupplier = suppliers.find(sup => sup.id === i.supplier_id || sup.name === i.supplier_name);
        return {
          item_id: foundItem?.id || i.item_id || '',
          qty: i.qty,
          estimated_price: i.estimated_price || foundItem?.last_purchase_price || 0,
          supplier_id: foundSupplier?.id || i.supplier_id || foundItem?.default_supplier_id || ''
        };
      }));
    } else {
      setOrderDate(getTodayStr());
      setDeliveryDate('');
      setDepartment(DEPARTMENTS[0].name);
      setFbCategory(FB_CATEGORIES[0]);
      setEventCategory(EVENT_CATEGORIES[0]);
      setPaymentStatus('paid');
      setNotes('');
      setPrItems([]);
    }
  }, [initialData, items, suppliers, isOpen]);

  const handleSave = async (targetStatus: 'draft' | 'submitted') => {
    const invalid = prItems.some(i => !i.item_id || i.qty <= 0 || !i.supplier_id);
    if (invalid) {
      toast.error('Pastikan setiap baris barang memiliki barang, jumlah (>0), dan supplier yang valid.');
      return;
    }

    const payloadItems = prItems.map(pi => {
      const orig = items.find(i => i.id === pi.item_id)!;
      const sup = suppliers.find(s => s.id === pi.supplier_id);
      const estPrice = Number(pi.estimated_price || 0);
      return {
        item_id: pi.item_id,
        name: orig?.name || 'Item',
        unit: orig?.unit || 'pcs',
        qty: Number(pi.qty),
        estimated_price: estPrice,
        total_estimated: Number(pi.qty) * estPrice,
        supplier_id: pi.supplier_id,
        supplier_name: sup?.name || ''
      };
    });

    const totalEstimated = payloadItems.reduce((a, i) => a + (i.total_estimated || 0), 0);
    const extraData = {
      department,
      fb_category: department === 'Food & Beverage' ? fbCategory : null,
      event_category: department === 'Food & Beverage' ? eventCategory : null
    };

    const finalData = {
      notes,
      items: payloadItems,
      total_estimated: totalEstimated,
      order_date: orderDate,
      delivery_date: deliveryDate ? new Date(deliveryDate) : null,
      paymentStatus,
      ...extraData
    };

    await onSave(targetStatus, finalData);
  };

  const handleRemoveRow = (idx: number) => setPrItems(r => r.filter((_, i) => i !== idx));

  const handleItemChange = (idx: number, field: string, value: any) => {
    setPrItems(r => r.map((row, i) => {
      if (i === idx) {
        if (field === 'item_id') {
          const found = items.find(it => it.id === value);
          return {
            ...row,
            item_id: value,
            estimated_price: found?.last_purchase_price || 0,
            supplier_id: found?.default_supplier_id || row.supplier_id
          };
        }
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const totalCalculatedCost = prItems.reduce((acc, curr) => acc + (curr.qty * curr.estimated_price), 0);

  if (!isOpen) return null;

  return (
    <div className={s.pageWrapper}>
      {/* Top ERP Breadcrumb & Navigation Bar */}
      <div className={s.navBar}>
        <button type="button" className={s.backBtn} onClick={onClose}>
          <ArrowLeft size={16} />
          <span>Kembali ke Jurnal Purchase Requisition</span>
        </button>
        <div className={s.navBreadcrumb}>
          <span>Purchasing</span>
          <span className={s.navBreadcrumbDivider}>/</span>
          <span>Purchase Requisitions</span>
          <span className={s.navBreadcrumbDivider}>/</span>
          <span className={s.navBreadcrumbActive}>
            {initialData ? `Edit PR #${initialData.pr_number || initialData.id?.slice(0,8)}` : 'New Purchase Order Requisition'}
          </span>
        </div>
      </div>

      {/* Main Full-Page ERP Document */}
      <div className={s.documentCard}>
        {/* Enterprise Header */}
        <div className={s.docHeader}>
          <div className={s.headerLeft}>
            <div className={s.docIconBox}>
              <ShoppingBag size={22} />
            </div>
            <div className={s.headerTitleGroup}>
              <div className={s.headerTopMeta}>
                <span className={s.docCodeBadge}>FORM PR-01</span>
                <span className={s.docTypeSubtitle}>External Vendor Procurement Voucher</span>
              </div>
              <h1 className={s.docTitle}>
                {initialData ? 'Edit Purchase Requisition Order' : 'Form Purchase Requisition Baru'}
                <span className={s.hotelBadge}>Vendor Procurement & AP</span>
              </h1>
            </div>
          </div>

          <div className={s.headerRight}>
            <span className={s.statusIndicator}>
              {initialData?.status ? String(initialData.status).toUpperCase() : 'NEW ORDER'}
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
                <span className={s.sectionTitle}>Cost Center Allocation & Settlement Terms</span>
              </div>
              <span className={s.sectionNote}>Pusat Beban Biaya & Metode Pembayaran Supplier</span>
            </div>

            {/* Department Grid */}
            <div className={s.fieldItem}>
              <label className={s.fieldLabel}>Requesting Department (Cost Center)</label>
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
                  <div className={s.subAllocationGroup}>
                    <span className={s.subAllocationLabel}>Sub Category:</span>
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

                  <div className={s.subAllocationGroup} style={{ marginLeft: 16 }}>
                    <span className={s.subAllocationLabel}>Outlet / Service:</span>
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
                      PR Order Date (Tanggal Pengajuan)
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
                      Required Delivery Date (Target Terima)
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
                      <option value="paid">💵 Tunai / Langsung Lunas (Cash/Bank Transfer)</option>
                      <option value="tempo">📄 Tempo / Kredit Supplier (Accounts Payable 30-60d)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: PR Line Items */}
              <div className={s.formSection}>
                <div className={s.sectionHeader}>
                  <div className={s.sectionTitleGroup}>
                    <span className={s.sectionStep}>2</span>
                    <span className={s.sectionTitle}>Procurement Item Lines & Supplier Assignment</span>
                  </div>
                  <span className={s.sectionNote}>Penetapan Supplier & Estimasi Harga</span>
                </div>

                <div className={s.searchToolbar}>
                  <SearchableSelect 
                    items={items.filter(it => (it.procurement_module || 'PR') === 'PR' && !prItems.find(pi => pi.item_id === it.id))}
                    value=""
                    placeholder="🔍 Cari barang katalog pengadaan luar atau masukkan SKU..."
                    onChange={(val: string) => {
                      const foundItem = items.find(it => it.id === val);
                      if (foundItem) {
                        setPrItems(r => [...r, { 
                          item_id: val, 
                          qty: 1, 
                          estimated_price: foundItem.last_purchase_price || 0, 
                          supplier_id: foundItem.default_supplier_id || (suppliers[0]?.id || '') 
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
                        <th style={{ minWidth: 160 }}>Assigned Supplier</th>
                        <th style={{ width: 95, textAlign: 'right' }}>Order Qty</th>
                        <th style={{ width: 130, textAlign: 'right' }}>Est. Unit Price</th>
                        <th style={{ width: 130, textAlign: 'right' }}>Line Total</th>
                        <th style={{ width: 44, textAlign: 'center' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {prItems.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                            <FileSpreadsheet size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#64748b' }}>Belum ada item pembelian</div>
                            <div style={{ fontSize: 12 }}>Pilih barang di atas untuk menambahkan baris pengadaan dan supplier.</div>
                          </td>
                        </tr>
                      ) : (() => {
                        const enriched = prItems.map((pi, idx) => ({ ...pi, _idx: idx, _item: items.find(i => i.id === pi.item_id) }));
                        const grouped: Record<string, typeof enriched> = {};
                        enriched.forEach(e => { const cat = e._item?.category || 'General Procurement'; if (!grouped[cat]) grouped[cat] = []; grouped[cat].push(e); });
                        const sortedCats = Object.keys(grouped).sort();
                        
                        let counter = 1;
                        return sortedCats.flatMap(cat => [
                          <tr key={`cat-${cat}`} className={s.rowCategoryHeader}>
                            <td colSpan={8} className={s.categoryCell}>
                              📦 {cat}
                            </td>
                          </tr>,
                          ...grouped[cat].map(e => (
                            <tr key={e._idx}>
                              <td style={{ textAlign: 'center', color: '#94a3b8', fontFamily: 'monospace' }}>
                                {counter++}
                              </td>
                              <td>
                                <div className={s.itemNameCell}>{e._item?.name}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>SKU: {e._item?.sku || 'PR-ITEM'}</div>
                              </td>
                              <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                                {e._item?.unit || 'pcs'}
                              </td>
                              <td>
                                <select 
                                  className={s.fieldSelect} 
                                  style={{ height: 32, fontSize: 12, padding: '0 8px' }}
                                  value={e.supplier_id} 
                                  onChange={ev => handleItemChange(e._idx, 'supplier_id', ev.target.value)}
                                  required
                                >
                                  <option value="">-- Pilih Supplier Resmi --</option>
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
                                  value={e.qty} 
                                  onChange={ev => handleItemChange(e._idx, 'qty', Number(ev.target.value))} 
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
                                  value={e.estimated_price} 
                                  onChange={ev => handleItemChange(e._idx, 'estimated_price', Number(ev.target.value))} 
                                  required 
                                />
                              </td>
                              <td className={s.tableTotalCell}>
                                {formatRupiah((e.qty || 0) * (e.estimated_price || 0))}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button 
                                  type="button" 
                                  className={s.removeRowBtn} 
                                  onClick={() => handleRemoveRow(e._idx)}
                                  title="Hapus baris"
                                >
                                  <X size={14} />
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
                    <span className={s.summaryCount}>{prItems.length} Purchase Requisition Lines</span>
                    <span className={s.summaryAllocation}>
                      Payment Terms: <strong>{paymentStatus === 'paid' ? 'Cash / Transfer' : 'Tempo (AP Vendor Credit)'}</strong> &bull; Charged To: <strong>{department}</strong>
                    </span>
                  </div>
                  <div className={s.summaryRight}>
                    <span className={s.summaryTotalLabel}>Total Estimated Order:</span>
                    <span className={s.summaryTotalValue}>{formatRupiah(totalCalculatedCost)}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Justification & Purchase Purpose */}
              <div className={s.formSection}>
                <div className={s.sectionHeader}>
                  <div className={s.sectionTitleGroup}>
                    <span className={s.sectionStep}>3</span>
                    <span className={s.sectionTitle}>Procurement Justification & Delivery Notes</span>
                  </div>
                  <span className={s.sectionNote}>Alasan Pembelian & Catatan Khusus Vendor</span>
                </div>

                <div className={s.fieldItem}>
                  <textarea 
                    className={s.remarksTextarea} 
                    placeholder="Masukkan justifikasi pengadaan barang (contoh: Penambahan stok operasional Q3, Kebutuhan renovasi villa, Penggantian peralatan dapur yang rusak)..." 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            {/* Document Action Footer */}
            <div className={s.docFooter}>
              <button type="button" className={s.btnSecondary} onClick={onClose}>
                Batal / Discard
              </button>
              <div className={s.footerActionsRight}>
                <button type="button" className={s.btnSecondary} onClick={() => handleSave('draft')}>
                  Simpan Draft
                </button>
                <button type="button" className={s.btnSubmit} onClick={() => handleSave('submitted')}>
                  <CheckCircle2 size={16} />
                  Submit Purchase Requisition
                </button>
              </div>
            </div>
          </div>
        </div>
  );
}
