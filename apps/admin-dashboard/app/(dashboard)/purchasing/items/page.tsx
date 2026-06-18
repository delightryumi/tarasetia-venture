'use client';

import React, { useState, useMemo, Suspense, useEffect } from 'react';
import { Package, X, Plus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useItems } from '@/hooks/purchasing/useItems';
import { useSuppliers } from '@/hooks/purchasing/useSuppliers';
import { toast } from 'sonner';
import { ITEM_CATEGORIES, ITEM_UNITS } from '@/lib/purchasing/constants';
import { itemsService } from '@/services/purchasing/itemsService';
import { formatRupiah } from '@/lib/purchasing/utils';
import { PStatusChip } from '@/components/purchasing/ui/PStatusChip';
import { PButton } from '@/components/purchasing/ui/PButton';
import { useSearchParams } from 'next/navigation';
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

function ItemsPageContent() {
  const { items, loading, createItem, updateItem, deleteItem } = useItems();
  const { suppliers } = useSuppliers();

  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [stockFilter, setStockFilter] = useState(() => {
    return filterParam === 'low-stock' ? 'low' : '';
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, moduleFilter, stockFilter]);

  useEffect(() => {
    if (filterParam === 'low-stock') {
      setStockFilter('low');
    } else {
      setStockFilter('');
    }
  }, [filterParam]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ ...BLANK_FORM });

  const [categories, setCategories] = useState<string[]>(ITEM_CATEGORIES);
  const [units, setUnits] = useState<string[]>(ITEM_UNITS);
  const [newCategory, setNewCategory] = useState('');
  const [newUnit, setNewUnit] = useState('');

  React.useEffect(() => {
    const loadDynamicOptions = async () => {
      try {
        const [dbCats, dbUnits] = await Promise.all([
          itemsService.getCategories(),
          itemsService.getUnits()
        ]);
        setCategories(prev => {
          const merged = [...ITEM_CATEGORIES, ...dbCats];
          return Array.from(new Set(merged));
        });
        setUnits(prev => {
          const merged = [...ITEM_UNITS, ...dbUnits];
          return Array.from(new Set(merged));
        });
      } catch (err) {
        console.error("Failed to load custom categories/units:", err);
      }
    };
    loadDynamicOptions();
  }, []);

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || (item.item_code || '').toLowerCase().includes(search.toLowerCase());
      const matchCat = !categoryFilter || item.category === categoryFilter;
      const matchMod = !moduleFilter || (item.procurement_module || 'SR') === moduleFilter;
      
      const isLow = item.current_stock <= item.min_stock && item.is_active && (item.procurement_module || 'SR') !== 'DML';
      const matchStock = !stockFilter || (stockFilter === 'low' ? isLow : !isLow);
      
      return matchSearch && matchCat && matchMod && matchStock;
    });
  }, [items, search, categoryFilter, moduleFilter, stockFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const lowStockItems = useMemo(() => items.filter(i => i.current_stock <= i.min_stock && i.is_active && (i.procurement_module || 'SR') !== 'DML'), [items]);

  const openCreate = () => { 
    setForm({ 
      ...BLANK_FORM, 
      category: categories[0] || ITEM_CATEGORIES[0], 
      unit: units[0] || ITEM_UNITS[0], 
      procurement_module: 'SR' 
    }); 
    setNewCategory('');
    setNewUnit('');
    setIsEditing(false); 
    setIsOpen(true); 
  };

  const openEdit = (item: any) => { 
    setForm({ 
      name: item.name, 
      category: item.category, 
      unit: item.unit, 
      min_stock: item.min_stock, 
      current_stock: item.current_stock, 
      last_purchase_price: item.last_purchase_price, 
      default_supplier_id: item.default_supplier_id || '', 
      is_active: item.is_active, 
      item_code: item.item_code || '', 
      procurement_module: item.procurement_module || 'SR' 
    }); 
    setNewCategory('');
    setNewUnit('');
    setIsEditing(true); 
    setIsOpen(true); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalCategory = form.category;
      let finalUnit = form.unit;

      if (form.category === '__NEW__') {
        const cleanCat = newCategory.trim();
        if (!cleanCat) {
          toast.error('Harap masukkan nama kategori yang valid.');
          return;
        }
        await itemsService.addCategory(cleanCat);
        finalCategory = cleanCat;
        setCategories(prev => Array.from(new Set([...prev, cleanCat])));
      }

      if (form.unit === '__NEW__') {
        const cleanUnit = newUnit.trim();
        if (!cleanUnit) {
          toast.error('Harap masukkan nama satuan yang valid.');
          return;
        }
        await itemsService.addUnit(cleanUnit);
        finalUnit = cleanUnit;
        setUnits(prev => Array.from(new Set([...prev, cleanUnit])));
      }

      const sup = suppliers.find(s => s.id === form.default_supplier_id);
      const formData = { 
        ...form, 
        category: finalCategory,
        unit: finalUnit,
        default_supplier_name: sup?.name || '' 
      };

      if (isEditing && selectedItem) {
        await updateItem(selectedItem.id, formData);
        toast.success('Barang berhasil diperbarui.');
      } else {
        await createItem(formData as any);
        toast.success('Barang berhasil dibuat.');
      }
      setIsOpen(false);
    } catch (err: any) { 
      toast.error(err.message || 'Gagal menyimpan barang.'); 
    }
  };

  const handleDelete = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    toast(`Hapus barang ${item.name}?`, {
      description: "Tindakan ini akan menghapus barang secara permanen dari katalog.",
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            await deleteItem(id);
            setSelectedItem(null);
            toast.success("Barang berhasil dihapus.");
          } catch (err: any) {
            toast.error(err.message || "Gagal menghapus barang.");
          }
        }
      },
      cancel: { label: "Batal", onClick: () => {} }
    });
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Master Barang</h1>
          <p className={s.subtitle}>Katalog pusat semua barang yang dapat dibeli dan diminta.</p>
        </div>
        <PButton onClick={openCreate}>
          <Plus size={16} strokeWidth={2} />
          Tambah Barang
        </PButton>
      </div>

      {/* Low stock banner */}
      {lowStockItems.length > 0 && (
        <div className={s.inlineAlert}>
          <div className={s.inlineAlertTitle}>{lowStockItems.length} barang di bawah stok minimum</div>
          <div className={s.inlineAlertBody}>{lowStockItems.map(i => i.name).join(', ')}</div>
        </div>
      )}

      <div className={s.filterBar}>
        <div className={s.searchWrap}>
          <Search size={15} className={s.searchIcon} />
          <input className={s.searchInput} placeholder="Cari barang..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className={s.filterSelect} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">Semua kategori</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className={s.filterSelect} value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
          <option value="">Semua modul</option>
          <option value="SR">Store Requisition (SR)</option>
          <option value="PR">Purchase Requisition (PR)</option>
          <option value="DML">Daily Market List (DML)</option>
        </select>
        <select className={s.filterSelect} value={stockFilter} onChange={e => setStockFilter(e.target.value)}>
          <option value="">Semua tingkat stok</option>
          <option value="low">Hanya Stok Rendah</option>
          <option value="normal">Stok Cukup</option>
        </select>
      </div>

      <div className={s.twoPanel}>
        <div className={s.tableCard}>
          <table className={s.table}>
            <thead className={s.tableHead}>
              <tr>
                <th>Nama Barang</th>
                <th>Kategori</th>
                <th>Modul</th>
                <th>Satuan</th>
                <th className={s.thRight}>Stok</th>
                <th className={s.thRight}>Stok Min</th>
                <th className={s.thRight}>Harga Terakhir</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className={s.tableBody}>
              {loading ? (
                <tr><td colSpan={8}><div className={s.empty}><p className={s.emptyBody}>Memuat...</p></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className={s.empty}>
                    <Package size={40} className={s.emptyIcon} />
                    <p className={s.emptyTitle}>Barang tidak ditemukan</p>
                    <p className={s.emptyBody}>Tambah barang pertama Anda ke katalog atau sesuaikan pencarian Anda.</p>
                  </div>
                </td></tr>
              ) : paginatedItems.map(item => {
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
                    <td className={`${s.tdRight} ${s.tdMono}`} style={{ color: isLow && procMod !== 'DML' ? 'var(--p-coral)' : 'var(--p-body)', fontWeight: isLow && procMod !== 'DML' ? 500 : 400 }}>
                      {procMod === 'DML' ? '—' : item.current_stock}
                    </td>
                    <td className={`${s.tdRight} ${s.tdMuted}`}>
                      {procMod === 'DML' ? '—' : item.min_stock}
                    </td>
                    <td className={`${s.tdRight} ${s.tdMono}`}>{formatRupiah(item.last_purchase_price)}</td>
                    <td><span style={{ fontSize: 13, fontWeight: 500, color: item.is_active ? 'var(--p-success)' : 'var(--p-muted)' }}>{item.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <div className={s.pagination}>
              <button 
                className={s.pageBtn} 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                &lt; Prev
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                if (
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button 
                      key={page} 
                      className={`${s.pageBtn} ${currentPage === page ? s.pageBtnActive : ''}`} 
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 2 || 
                  page === currentPage + 2
                ) {
                  return <span key={page} className={s.pageEllipsis}>...</span>;
                }
                return null;
              })}

              <button 
                className={s.pageBtn} 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Next &gt;
              </button>
            </div>
          )}
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
                  <span style={{ fontSize: 13, fontWeight: 500, color: selectedItem.is_active ? 'var(--p-success)' : 'var(--p-muted)' }}>{selectedItem.is_active ? 'Aktif' : 'Nonaktif'}</span>
                </div>
                <div className={s.detailBody}>
                  <div className={s.detailMeta}>
                    <div className={s.detailMetaItem}><div className={s.detailMetaLabel}>Kategori</div><div className={s.detailMetaValue}>{selectedItem.category}</div></div>
                    <div className={s.detailMetaItem}><div className={s.detailMetaLabel}>Modul Pengadaan</div><div className={s.detailMetaValue} style={{ fontWeight: 600 }}>{selectedItem.procurement_module || 'SR'}</div></div>
                    <div className={s.detailMetaItem}><div className={s.detailMetaLabel}>Satuan</div><div className={s.detailMetaValue}>{selectedItem.unit}</div></div>
                    {selectedItem.procurement_module !== 'DML' && (
                      <>
                        <div className={s.detailMetaItem}><div className={s.detailMetaLabel}>Stok Saat Ini</div><div className={s.detailMetaValue} style={{ color: selectedItem.current_stock <= selectedItem.min_stock ? 'var(--p-coral)' : 'var(--p-ink)' }}>{selectedItem.current_stock} {selectedItem.unit}</div></div>
                        <div className={s.detailMetaItem}><div className={s.detailMetaLabel}>Stok Minimum</div><div className={s.detailMetaValue}>{selectedItem.min_stock} {selectedItem.unit}</div></div>
                      </>
                    )}
                  </div>

                  <div className={s.darkCard}>
                    <div className={s.darkCardLabel}>Harga Pembelian Terakhir</div>
                    <div className={s.darkCardValue}>{formatRupiah(selectedItem.last_purchase_price)}</div>
                  </div>

                  {selectedItem.default_supplier_id && (
                    <div className={s.creamCard}>
                      <div className={s.creamCardTitle}>Supplier Default</div>
                      <div className={s.creamCardBody}>{suppliers.find(s => s.id === selectedItem.default_supplier_id)?.name || selectedItem.default_supplier_id}</div>
                    </div>
                  )}
                </div>

                <div className={s.actionRow}>
                  <PButton size="sm" onClick={() => { openEdit(selectedItem); }}>Ubah Barang</PButton>
                  <PButton variant="danger" size="sm" onClick={() => handleDelete(selectedItem.id)}>Hapus</PButton>
                  <PButton variant="secondary" size="sm" onClick={() => setSelectedItem(null)}>Tutup</PButton>
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
              <h2 className={s.modalTitle}>{isEditing ? 'Ubah Barang' : 'Tambah Barang Baru'}</h2>
              <p className={s.modalSubtitle}>Tentukan detail katalog, ambang batas stok, dan penugasan supplier.</p>

              <form onSubmit={handleSubmit}>
                <div className={s.formGrid}>
                  <div className={s.formField} style={{ gridColumn: '1 / -1' }}>
                    <label className={s.formLabel}>Nama Barang</label>
                    <input className={s.formInput} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="misal. Chicken Breast" required />
                  </div>
                  <div className={s.formField}>
                    <label className={s.formLabel}>Kode Barang</label>
                    <input className={s.formInput} value={form.item_code} onChange={e => setForm(f => ({ ...f, item_code: e.target.value }))} placeholder="misal. CHK-001" />
                  </div>
                  <div className={s.formField}>
                    <label className={s.formLabel}>Kategori</label>
                    <select className={s.formSelect} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="__NEW__">+ Tambah Kategori Baru...</option>
                    </select>
                  </div>
                  {form.category === '__NEW__' && (
                    <div className={s.formField} style={{ gridColumn: '1 / -1' }}>
                      <label className={s.formLabel}>Nama Kategori Baru</label>
                      <input className={s.formInput} value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="misal. Fresh Pasta" required />
                    </div>
                  )}
                  <div className={s.formField}>
                    <label className={s.formLabel}>Modul Pengadaan</label>
                    <select 
                      className={s.formSelect} 
                      value={form.procurement_module} 
                      onChange={e => {
                        const val = e.target.value as any;
                        setForm(f => ({ 
                          ...f, 
                          procurement_module: val,
                          ...(val === 'DML' ? { current_stock: 0, min_stock: 0 } : {})
                        }));
                      }} 
                      required
                    >
                      <option value="SR">Store Requisition (SR)</option>
                      <option value="PR">Purchase Requisition (PR)</option>
                      <option value="DML">Daily Market List (DML)</option>
                    </select>
                  </div>
                  <div className={s.formField}>
                    <label className={s.formLabel}>Satuan</label>
                    <select className={s.formSelect} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} required>
                      {units.map(u => <option key={u} value={u}>{u}</option>)}
                      <option value="__NEW__">+ Tambah Satuan Baru...</option>
                    </select>
                  </div>
                  {form.unit === '__NEW__' && (
                    <div className={s.formField} style={{ gridColumn: '1 / -1' }}>
                      <label className={s.formLabel}>Nama Satuan Baru</label>
                      <input className={s.formInput} value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder="misal. tray" required />
                    </div>
                  )}
                  <div className={s.formField}>
                    <label className={s.formLabel}>Supplier Default</label>
                    <select className={s.formSelect} value={form.default_supplier_id} onChange={e => setForm(f => ({ ...f, default_supplier_id: e.target.value }))}>
                      <option value="">Tidak ada</option>
                      {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                    </select>
                  </div>
                  {form.procurement_module !== 'DML' && (
                    <>
                      <div className={s.formField}>
                        <label className={s.formLabel}>Stok Saat Ini</label>
                        <input className={s.formInput} type="number" min={0} value={form.current_stock} onChange={e => setForm(f => ({ ...f, current_stock: Number(e.target.value) }))} required />
                      </div>
                      <div className={s.formField}>
                        <label className={s.formLabel}>Stok Minimum</label>
                        <input className={s.formInput} type="number" min={0} value={form.min_stock} onChange={e => setForm(f => ({ ...f, min_stock: Number(e.target.value) }))} required />
                      </div>
                    </>
                  )}
                  <div className={s.formField} style={{ gridColumn: '1 / -1' }}>
                    <label className={s.formLabel}>Harga Pembelian Terakhir (IDR)</label>
                    <input className={s.formInput} type="number" min={0} value={form.last_purchase_price} onChange={e => setForm(f => ({ ...f, last_purchase_price: Number(e.target.value) }))} required />
                  </div>
                  <div className={s.formField} style={{ gridColumn: '1 / -1' }}>
                    <div className={s.checkRow}>
                      <input id="is_active" type="checkbox" className={s.checkbox} checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                      <label htmlFor="is_active" className={s.checkLabel}>Barang aktif dan tersedia untuk requisition</label>
                    </div>
                  </div>
                </div>

                <div className={s.modalActions}>
                  <PButton type="submit">{isEditing ? 'Simpan Perubahan' : 'Tambah Barang'}</PButton>
                  <PButton type="button" variant="secondary" onClick={() => setIsOpen(false)}>Batal</PButton>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ItemsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}><div style={{ width: '48px', height: '48px', border: '2px solid rgba(0,0,0,0.05)', borderTopColor: 'var(--sidebar-link-active-bg, #181d26)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>}>
      <ItemsPageContent />
    </Suspense>
  );
}
