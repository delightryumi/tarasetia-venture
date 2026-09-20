'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, FileSpreadsheet, Package, ArrowLeft } from 'lucide-react';
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

interface StoreRequisitionFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: any;
  items: any[];
  suppliers: any[];
  user: any;
  onSave: (status: 'draft' | 'submitted', data: any) => Promise<void>;
}

export default function StoreRequisitionForm({
  isOpen,
  onClose,
  initialData,
  items,
  suppliers,
  user,
  onSave
}: StoreRequisitionFormProps) {
  const [department, setDepartment] = useState(DEPARTMENTS[0].name);
  const [fbCategory, setFbCategory] = useState(FB_CATEGORIES[0]);
  const [eventCategory, setEventCategory] = useState(EVENT_CATEGORIES[0]);
  const [notes, setNotes] = useState('');
  const [orderDate, setOrderDate] = useState(getTodayStr());
  const [deliveryDate, setDeliveryDate] = useState('');
  const [reqItems, setReqItems] = useState<{ item_id: string; qty_requested: number; unit_price: number; notes: string; supplier_id: string }[]>([]);

  useEffect(() => {
    if (initialData) {
      setDepartment(initialData.department || DEPARTMENTS[0].name);
      const loadedFbCat = initialData.fb_category || FB_CATEGORIES[0];
      let loadedEvCat = initialData.event_category || EVENT_CATEGORIES[0];
      if (loadedFbCat === 'Beverage' && loadedEvCat === 'Banquet') {
        loadedEvCat = 'A la Carte';
      }
      setFbCategory(loadedFbCat);
      setEventCategory(loadedEvCat);
      setNotes(initialData.notes || '');
      const createdDate = initialData.created_at?.toDate ? initialData.created_at.toDate() : new Date(initialData.created_at);
      setOrderDate(initialData.order_date || createdDate.toISOString().split('T')[0]);
      setDeliveryDate(initialData.delivery_date ? (initialData.delivery_date?.toDate ? initialData.delivery_date.toDate().toISOString().split('T')[0] : new Date(initialData.delivery_date).toISOString().split('T')[0]) : '');
      
      setReqItems((initialData.items ?? []).map((i: any) => {
        const foundItem = items.find(itm => itm.id === i.item_id || itm.name === i.name);
        const foundSupplier = suppliers.find(sup => sup.id === i.supplier_id || sup.name === i.supplier_name);
        return {
          item_id: foundItem?.id || i.item_id || '',
          qty_requested: i.qty_requested,
          unit_price: i.unit_price || foundItem?.last_purchase_price || 0,
          notes: i.notes || '',
          supplier_id: foundSupplier?.id || i.supplier_id || foundItem?.default_supplier_id || ''
        };
      }));
    } else {
      setDepartment(DEPARTMENTS[0].name);
      setFbCategory(FB_CATEGORIES[0]);
      setEventCategory(EVENT_CATEGORIES[0]);
      setNotes('');
      setOrderDate(getTodayStr());
      setDeliveryDate('');
      setReqItems([]);
    }
  }, [initialData, items, suppliers, isOpen]);

  const handleRemoveRow = (idx: number) => setReqItems(r => r.filter((_, i) => i !== idx));

  const handleItemChange = (idx: number, field: string, value: any) => {
    setReqItems(r => r.map((row, i) => {
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

  const handleSave = async (targetStatus: 'draft' | 'submitted') => {
    const invalid = reqItems.some(i => !i.item_id || i.qty_requested <= 0);
    if (invalid) {
      toast.error('Pastikan semua baris barang memiliki kuantitas valid (> 0).');
      return;
    }

    // Validate qty_requested does not exceed current stock (SR only — barang harus ada di gudang)
    const overStock = reqItems.find(ri => {
      const item = items.find(it => it.id === ri.item_id);
      const stock = Number(item?.current_stock ?? 0);
      return Number(ri.qty_requested) > stock;
    });
    if (overStock) {
      const item = items.find(it => it.id === overStock.item_id);
      toast.error(
        `❌ Kuantitas SR melebihi stok yang tersedia!\n"${item?.name}" — Stok sisa: ${item?.current_stock ?? 0} ${item?.unit || 'pcs'}, diminta: ${overStock.qty_requested}.`
      );
      return;
    }

    const payloadItems = reqItems.map(ri => {
      const orig = items.find(item => item.id === ri.item_id)!;
      const sup = suppliers.find(s => s.id === ri.supplier_id);
      const uPrice = Number(ri.unit_price || 0);
      return { 
        item_id: ri.item_id, 
        name: orig?.name || 'Item', 
        unit: orig?.unit || 'pcs', 
        qty_requested: Number(ri.qty_requested), 
        qty_fulfilled: 0, 
        unit_price: uPrice, 
        total: Number(ri.qty_requested) * uPrice, 
        notes: ri.notes, 
        supplier_id: ri.supplier_id || '', 
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
      ...extraData
    };

    await onSave(targetStatus, finalData);
  };

  const totalCalculatedCost = reqItems.reduce((acc, curr) => acc + (curr.qty_requested * curr.unit_price), 0);

  if (!isOpen) return null;

  return (
    <div className={s.pageWrapper}>
      {/* Top Navigation & Breadcrumbs Bar */}
      <div className={s.navBar}>
        <button type="button" className={s.backBtn} onClick={onClose}>
          <ArrowLeft size={16} />
          <span>Kembali ke Jurnal Requisition</span>
        </button>
        <div className={s.navBreadcrumb}>
          <span>Purchasing</span>
          <span className={s.navDivider}>/</span>
          <span>Store Requisition</span>
          <span className={s.navDivider}>/</span>
          <span className={s.navCurrent}>
            {initialData ? 'Edit Bon Permintaan' : 'Form Pengajuan Bon Baru'}
          </span>
        </div>
      </div>

      {/* Main Full-Page ERP Document */}
      <div className={s.documentCard}>
        {/* Enterprise Header */}
        <div className={s.docHeader}>
          <div className={s.headerLeft}>
            <div className={s.docIconBox}>
              <Package size={22} />
            </div>
            <div className={s.headerTitleGroup}>
              <div className={s.headerTopMeta}>
                <span className={s.docCodeBadge}>FORM SR-01</span>
                <span className={s.docTypeSubtitle}>Internal Stock Disbursement Voucher</span>
              </div>
              <h1 className={s.docTitle}>
                {initialData ? 'Edit Bon Permintaan Barang (Store Requisition)' : 'Form Permintaan Barang Baru (Store Requisition)'}
                <span className={s.hotelBadge}>Central Store / Warehouse</span>
              </h1>
            </div>
          </div>

          <div className={s.headerRight}>
            <span className={s.statusIndicator}>
              {initialData?.status ? String(initialData.status).toUpperCase() : 'NEW DRAFT'}
            </span>
          </div>
        </div>

        {/* Document Body */}
        <div className={s.docBody}>
          {/* Section 1: Department Cost Allocation & Logistics Schedule */}
          <div className={s.formSection}>
            <div className={s.sectionHeader}>
              <div className={s.sectionTitleGroup}>
                <span className={s.sectionStep}>1</span>
                <span className={s.sectionTitle}>Department Cost Allocation & Logistics Schedule</span>
              </div>
              <span className={s.sectionNote}>Pusat Biaya & Alokasi Departemen</span>
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
                  <div className={s.subGroup}>
                    <span className={s.subLabel}>Expense Category:</span>
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

            {/* Date and Requester Grid */}
            <div className={s.fieldGrid3}>
              <div className={s.fieldItem}>
                <label className={s.fieldLabel}>
                  <Calendar size={12} />
                  Requisition Date (Tanggal Bon)
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
                <label className={s.fieldLabel}>Originator / Requested By</label>
                <div className={s.readOnlyBadgeBox}>
                  <span className={s.readOnlyUser}>
                    {initialData ? (initialData.requested_by_name || initialData.requested_by || user?.displayName || 'Staff') : (user?.displayName || user?.email || 'Staff')}
                  </span>
                  <span className={s.readOnlySub}>{(user as any)?.role || 'Staff'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Requisition Item Lines */}
          <div className={s.formSection}>
            <div className={s.sectionHeader}>
              <div className={s.sectionTitleGroup}>
                <span className={s.sectionStep}>2</span>
                <span className={s.sectionTitle}>Requisition Lines (Warehouse Items)</span>
              </div>
              <span className={s.sectionNote}>Daftar Permintaan Barang Gudang</span>
            </div>

            <div className={s.searchToolbar}>
              <SearchableSelect 
                items={items.filter(it => (it.procurement_module || 'SR') === 'SR' && !reqItems.find(ri => ri.item_id === it.id))}
                value=""
                placeholder="🔍 Cari nama barang gudang atau barcode untuk menambahkan ke voucher..."
                onChange={(val: string) => {
                  const foundItem = items.find(it => it.id === val);
                  if (foundItem) {
                    setReqItems(r => [...r, { 
                      item_id: val, 
                      qty_requested: 1, 
                      unit_price: foundItem.last_purchase_price || 0, 
                      notes: '', 
                      supplier_id: foundItem.default_supplier_id || '' 
                    }]);
                  }
                }}
                showStock={true}
              />
            </div>

            <div className={s.itemTableWrapper}>
              <table className={s.itemTable}>
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: 'center' }}>#</th>
                    <th>Item Description</th>
                    <th style={{ width: 80, textAlign: 'center' }}>Unit</th>
                    <th style={{ width: 110, textAlign: 'center' }}>Current Stock</th>
                    <th style={{ width: 100, textAlign: 'right' }}>Req. Qty</th>
                    <th style={{ width: 130, textAlign: 'right' }}>Unit Cost</th>
                    <th style={{ width: 130, textAlign: 'right' }}>Line Total</th>
                    <th style={{ minWidth: 140 }}>Remarks / Cost Purpose</th>
                    <th style={{ width: 44, textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {reqItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                        <FileSpreadsheet size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#64748b' }}>Belum ada item permintaan</div>
                        <div style={{ fontSize: 12 }}>Gunakan kotak pencarian di atas untuk memilih barang dari katalog gudang.</div>
                      </td>
                    </tr>
                  ) : (() => {
                    const enriched = reqItems.map((ri, idx) => ({ ...ri, _idx: idx, _item: items.find(i => i.id === ri.item_id) }));
                    const grouped: Record<string, typeof enriched> = {};
                    enriched.forEach(e => { const cat = e._item?.category || 'General Store'; if (!grouped[cat]) grouped[cat] = []; grouped[cat].push(e); });
                    const sortedCats = Object.keys(grouped).sort();
                    
                    let counter = 1;
                    return sortedCats.flatMap(cat => [
                      <tr key={`cat-${cat}`} className={s.rowCategoryHeader}>
                        <td colSpan={9} className={s.categoryCell}>
                          📁 {cat}
                        </td>
                      </tr>,
                      ...grouped[cat].map(e => {
                        const curStock = Number(e._item?.current_stock ?? 0);
                        const isStockLow = curStock <= 0;
                        return (
                          <tr key={e._idx}>
                            <td style={{ textAlign: 'center', color: '#94a3b8', fontFamily: 'monospace' }}>
                              {counter++}
                            </td>
                            <td>
                              <div className={s.itemNameCell}>{e._item?.name}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>SKU: {e._item?.sku || e._item?.id?.slice(0, 8) || '—'}</div>
                            </td>
                            <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                              {e._item?.unit || 'pcs'}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`${s.stockBadge} ${isStockLow ? s.stockLow : s.stockAvailable}`}>
                                {curStock} {e._item?.unit || 'pcs'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <input 
                                className={`${s.tableInputNumber} ${Number(e.qty_requested) > curStock ? s.inputExceedStock : ''}`}
                                type="number" 
                                min={0.1}
                                max={curStock > 0 ? curStock : undefined}
                                step="any" 
                                value={e.qty_requested} 
                                onWheel={ev => ev.currentTarget.blur()}
                                onChange={ev => {
                                  const val = Number(ev.target.value);
                                  if (curStock > 0 && val > curStock) {
                                    toast.warning(`Maks qty SR adalah sisa stok: ${curStock} ${e._item?.unit || 'pcs'}`);
                                    handleItemChange(e._idx, 'qty_requested', curStock);
                                  } else {
                                    handleItemChange(e._idx, 'qty_requested', val);
                                  }
                                }}
                                required 
                              />
                              {curStock <= 0 && (
                                <div style={{ fontSize: 10, color: '#ef4444', marginTop: 2, fontWeight: 600 }}>Stok habis!</div>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#475569', fontWeight: 600 }}>
                              {formatRupiah(e.unit_price)}
                            </td>
                            <td className={s.tableTotalCell}>
                              {formatRupiah((e.qty_requested || 0) * (e.unit_price || 0))}
                            </td>
                            <td>
                              <input 
                                className={s.tableInputText} 
                                type="text" 
                                placeholder="Untuk keperluan apa..." 
                                value={e.notes} 
                                onChange={ev => handleItemChange(e._idx, 'notes', ev.target.value)} 
                              />
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
                        );
                      })
                    ]);
                  })()}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Box */}
            <div className={s.summaryFooterBox}>
              <div className={s.summaryLeft}>
                <span className={s.summaryCount}>{reqItems.length} Total Lines Requested</span>
                <span className={s.summaryAllocation}>
                  Cost Charged To: <strong>{department}</strong> {department === 'Food & Beverage' ? `(${fbCategory} - ${eventCategory})` : ''}
                </span>
              </div>
              <div className={s.summaryRight}>
                <span className={s.summaryTotalLabel}>Total Requisition Value:</span>
                <span className={s.summaryTotalValue}>{formatRupiah(totalCalculatedCost)}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Justification & Remarks */}
          <div className={s.formSection}>
            <div className={s.sectionHeader}>
              <div className={s.sectionTitleGroup}>
                <span className={s.sectionStep}>3</span>
                <span className={s.sectionTitle}>Justification & Department Authorization Notes</span>
              </div>
              <span className={s.sectionNote}>Catatan & Keperluan Pengajuan</span>
            </div>

            <div className={s.fieldItem}>
              <textarea 
                className={s.remarksTextarea} 
                placeholder="Masukkan alasan atau justifikasi pengeluaran barang gudang ini (contoh: Persiapan Banquet Wedding, Penggantian Amenitas Kamar Lt. 3)..." 
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
              Submit Requisition
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
