'use client';

import React, { useState, useMemo } from 'react';
import { Package, X, Plus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useItems } from '@/hooks/purchasing/useItems';
import { useSuppliers } from '@/hooks/purchasing/useSuppliers';
import { toast } from 'sonner';
import { ITEM_CATEGORIES, ITEM_UNITS } from '@/lib/purchasing/constants';
import { formatRupiah } from '@/lib/purchasing/utils';
import { PStatusChip } from '@/components/purchasing/ui/PStatusChip';
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

const BLANK_FORM = { name: '', category: '', unit: '', min_stock: 0, current_stock: 0, last_purchase_price: 0, default_supplier_id: '', is_active: true, item_code: '', procurement_module: 'SR' as 'SR' | 'PR' | 'DML' };

export default function ItemsPage() {
  const { items, loading, createItem, updateItem, deleteItem } = useItems();
  const { suppliers } = useSuppliers();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ ...BLANK_FORM });

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || (item.item_code || '').toLowerCase().includes(search.toLowerCase());
      const matchCat = !categoryFilter || item.category === categoryFilter;
      const matchMod = !moduleFilter || (item.procurement_module || 'SR') === moduleFilter;
      return matchSearch && matchCat && matchMod;
    });
  }, [items, search, categoryFilter, moduleFilter]);

  const lowStockItems = useMemo(() => items.filter(i => i.current_stock <= i.min_stock && i.is_active), [items]);

  const openCreate = () => { setForm({ ...BLANK_FORM, category: ITEM_CATEGORIES[0], unit: ITEM_UNITS[0], procurement_module: 'SR' }); setIsEditing(false); setIsOpen(true); };
  const openEdit = (item: any) => { setForm({ name: item.name, category: item.category, unit: item.unit, min_stock: item.min_stock, current_stock: item.current_stock, last_purchase_price: item.last_purchase_price, default_supplier_id: item.default_supplier_id || '', is_active: item.is_active, item_code: item.item_code || '', procurement_module: item.procurement_module || 'SR' }); setIsEditing(true); setIsOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sup = suppliers.find(s => s.id === form.default_supplier_id);
      const formData = { ...form, default_supplier_name: sup?.name || '' };
      if (isEditing && selectedItem) {
        await updateItem(selectedItem.id, formData);
        toast.success('Item updated successfully.');
      } else {
        await createItem(formData as any);
        toast.success('Item created successfully.');
      }
      setIsOpen(false);
    } catch (err: any) { toast.error(err.message || 'Failed to save item.'); }
  };

  const handleDelete = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    toast(`Delete item ${item.name}?`, {
      description: "This will permanently remove the item from the catalog.",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await deleteItem(id);
            setSelectedItem(null);
            toast.success("Item removed successfully.");
          } catch (err: any) {
            toast.error(err.message || "Failed to delete item.");
          }
        }
      },
      cancel: { label: "Keep", onClick: () => {} }
    });
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Items Master</h1>
          <p className={s.subtitle}>Central catalog of all purchasable and requestable items.</p>
        </div>
        <PButton onClick={openCreate}>
          <Plus size={16} strokeWidth={2} />
          Add Item
        </PButton>
      </div>

      {/* Low stock banner */}
      {lowStockItems.length > 0 && (
        <div className={s.inlineAlert}>
          <div className={s.inlineAlertTitle}>{lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} below minimum stock level</div>
          <div className={s.inlineAlertBody}>{lowStockItems.map(i => i.name).join(', ')}</div>
        </div>
      )}

      <div className={s.filterBar}>
        <div className={s.searchWrap}>
          <Search size={15} className={s.searchIcon} />
          <input className={s.searchInput} placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className={s.filterSelect} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className={s.filterSelect} value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
          <option value="">All modules</option>
          <option value="SR">Store Requisition (SR)</option>
          <option value="PR">Purchase Requisition (PR)</option>
          <option value="DML">Daily Market List (DML)</option>
        </select>
      </div>

      <div className={s.twoPanel}>
        <div className={s.tableCard}>
          <table className={s.table}>
            <thead className={s.tableHead}>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Module</th>
                <th>Unit</th>
                <th className={s.thRight}>Stock</th>
                <th className={s.thRight}>Min Stock</th>
                <th className={s.thRight}>Last Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className={s.tableBody}>
              {loading ? (
                <tr><td colSpan={8}><div className={s.empty}><p className={s.emptyBody}>Loading…</p></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className={s.empty}>
                    <Package size={40} className={s.emptyIcon} />
                    <p className={s.emptyTitle}>No items found</p>
                    <p className={s.emptyBody}>Add your first item to the catalog or adjust your search.</p>
                  </div>
                </td></tr>
              ) : filtered.map(item => {
                const isLow = item.current_stock <= item.min_stock;
                const procMod = item.procurement_module || 'SR';
                return (
                  <tr key={item.id} className={selectedItem?.id === item.id ? s.rowSelected : ''} onClick={() => setSelectedItem(item)}>
                    <td className={s.tdPrimary}>{item.name}{item.item_code ? <span style={{ color: 'var(--p-muted)', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{item.item_code}</span> : null}</td>
                    <td className={s.tdMuted}>{item.category}</td>
                    <td>
                      <span style={{ 
                        fontSize: 11, 
                        fontWeight: 600, 
                        padding: '2px 8px', 
                        borderRadius: 4, 
                        background: procMod === 'SR' ? 'rgba(59, 130, 246, 0.1)' : procMod === 'PR' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: procMod === 'SR' ? 'var(--p-primary)' : procMod === 'PR' ? '#f59e0b' : 'var(--p-success)'
                      }}>
                        {procMod}
                      </span>
                    </td>
                    <td className={s.tdMuted}>{item.unit}</td>
                    <td className={`${s.tdRight} ${s.tdMono}`} style={{ color: isLow ? 'var(--p-coral)' : 'var(--p-body)', fontWeight: isLow ? 500 : 400 }}>{item.current_stock}</td>
                    <td className={`${s.tdRight} ${s.tdMuted}`}>{item.min_stock}</td>
                    <td className={`${s.tdRight} ${s.tdMono}`}>{formatRupiah(item.last_purchase_price)}</td>
                    <td><span style={{ fontSize: 13, fontWeight: 500, color: item.is_active ? 'var(--p-success)' : 'var(--p-muted)' }}>{item.is_active ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail Drawer Popup */}
        <AnimatePresence>
          {selectedItem && (
            <>
              {/* Backdrop */}
              <motion.div
                className={s.drawerBackdrop}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedItem(null)}
              />

              {/* Drawer Content */}
              <motion.div
                key={selectedItem.id}
                variants={slideInRight}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={s.detailPanel}
              >
                <div className={s.detailHeader}>
                  <span className={s.detailDocNum}>{selectedItem.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: selectedItem.is_active ? 'var(--p-success)' : 'var(--p-muted)' }}>{selectedItem.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div className={s.detailBody}>
                  <div className={s.detailMeta}>
                    <div className={s.detailMetaItem}><div className={s.detailMetaLabel}>Category</div><div className={s.detailMetaValue}>{selectedItem.category}</div></div>
                    <div className={s.detailMetaItem}><div className={s.detailMetaLabel}>Procurement</div><div className={s.detailMetaValue} style={{ fontWeight: 600 }}>{selectedItem.procurement_module || 'SR'}</div></div>
                    <div className={s.detailMetaItem}><div className={s.detailMetaLabel}>Unit</div><div className={s.detailMetaValue}>{selectedItem.unit}</div></div>
                    <div className={s.detailMetaItem}><div className={s.detailMetaLabel}>Current Stock</div><div className={s.detailMetaValue} style={{ color: selectedItem.current_stock <= selectedItem.min_stock ? 'var(--p-coral)' : 'var(--p-ink)' }}>{selectedItem.current_stock} {selectedItem.unit}</div></div>
                    <div className={s.detailMetaItem}><div className={s.detailMetaLabel}>Min Stock</div><div className={s.detailMetaValue}>{selectedItem.min_stock} {selectedItem.unit}</div></div>
                  </div>

                  <div className={s.darkCard}>
                    <div className={s.darkCardLabel}>Last Purchase Price</div>
                    <div className={s.darkCardValue}>{formatRupiah(selectedItem.last_purchase_price)}</div>
                  </div>

                  {selectedItem.default_supplier_id && (
                    <div className={s.creamCard}>
                      <div className={s.creamCardTitle}>Default Supplier</div>
                      <div className={s.creamCardBody}>{suppliers.find(s => s.id === selectedItem.default_supplier_id)?.name || selectedItem.default_supplier_id}</div>
                    </div>
                  )}
                </div>

                <div className={s.actionRow}>
                  <PButton size="sm" onClick={() => { openEdit(selectedItem); }}>Edit Item</PButton>
                  <PButton variant="danger" size="sm" onClick={() => handleDelete(selectedItem.id)}>Delete</PButton>
                  <PButton variant="secondary" size="sm" onClick={() => setSelectedItem(null)}>Close</PButton>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div className={s.modalOverlay} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} initial="hidden" animate="visible" exit="hidden" onClick={e => { if (e.target === e.currentTarget) setIsOpen(false); }}>
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className={s.modal}>
              <h2 className={s.modalTitle}>{isEditing ? 'Edit Item' : 'Add New Item'}</h2>
              <p className={s.modalSubtitle}>Define catalog details, stock thresholds, and supplier assignment.</p>

              <form onSubmit={handleSubmit}>
                <div className={s.formGrid}>
                  <div className={s.formField} style={{ gridColumn: '1 / -1' }}>
                    <label className={s.formLabel}>Item Name</label>
                    <input className={s.formInput} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Chicken Breast" required />
                  </div>
                  <div className={s.formField}>
                    <label className={s.formLabel}>Item Code</label>
                    <input className={s.formInput} value={form.item_code} onChange={e => setForm(f => ({ ...f, item_code: e.target.value }))} placeholder="e.g. CHK-001" />
                  </div>
                  <div className={s.formField}>
                    <label className={s.formLabel}>Category</label>
                    <select className={s.formSelect} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required>
                      {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className={s.formField}>
                    <label className={s.formLabel}>Procurement Module</label>
                    <select className={s.formSelect} value={form.procurement_module} onChange={e => setForm(f => ({ ...f, procurement_module: e.target.value as any }))} required>
                      <option value="SR">Store Requisition (SR)</option>
                      <option value="PR">Purchase Requisition (PR)</option>
                      <option value="DML">Daily Market List (DML)</option>
                    </select>
                  </div>
                  <div className={s.formField}>
                    <label className={s.formLabel}>Unit</label>
                    <select className={s.formSelect} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} required>
                      {ITEM_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className={s.formField}>
                    <label className={s.formLabel}>Default Supplier</label>
                    <select className={s.formSelect} value={form.default_supplier_id} onChange={e => setForm(f => ({ ...f, default_supplier_id: e.target.value }))}>
                      <option value="">None</option>
                      {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                    </select>
                  </div>
                  <div className={s.formField}>
                    <label className={s.formLabel}>Current Stock</label>
                    <input className={s.formInput} type="number" min={0} value={form.current_stock} onChange={e => setForm(f => ({ ...f, current_stock: Number(e.target.value) }))} required />
                  </div>
                  <div className={s.formField}>
                    <label className={s.formLabel}>Minimum Stock</label>
                    <input className={s.formInput} type="number" min={0} value={form.min_stock} onChange={e => setForm(f => ({ ...f, min_stock: Number(e.target.value) }))} required />
                  </div>
                  <div className={s.formField} style={{ gridColumn: '1 / -1' }}>
                    <label className={s.formLabel}>Last Purchase Price (IDR)</label>
                    <input className={s.formInput} type="number" min={0} value={form.last_purchase_price} onChange={e => setForm(f => ({ ...f, last_purchase_price: Number(e.target.value) }))} required />
                  </div>
                  <div className={s.formField} style={{ gridColumn: '1 / -1' }}>
                    <div className={s.checkRow}>
                      <input id="is_active" type="checkbox" className={s.checkbox} checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                      <label htmlFor="is_active" className={s.checkLabel}>Item is active and available for requisitions</label>
                    </div>
                  </div>
                </div>

                <div className={s.modalActions}>
                  <PButton type="submit">{isEditing ? 'Save Changes' : 'Add Item'}</PButton>
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
