'use client';

import React, { useState, useMemo } from 'react';
import { Users, X, Plus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSuppliers } from '@/hooks/purchasing/useSuppliers';
import { toast } from 'sonner';
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

const BLANK = { name: '', contact_pic: '', phone: '', email: '', address: '', payment_terms: 'NET 30', is_active: true };

export default function SuppliersPage() {
  const { suppliers, loading, createSupplier, updateSupplier, deleteSupplier } = useSuppliers();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: '', pic_name: '', pic_contact: '', address: '', payment_terms: 'NET 30', is_active: true });

  const filtered = useMemo(() =>
    suppliers.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.pic_name || '').toLowerCase().includes(search.toLowerCase())),
    [suppliers, search]
  );

  const openCreate = () => { setForm({ name: '', pic_name: '', pic_contact: '', address: '', payment_terms: 'NET 30', is_active: true }); setIsEditing(false); setIsOpen(true); };
  const openEdit = (sup: any) => { setForm({ name: sup.name, pic_name: sup.pic_name || '', pic_contact: sup.pic_contact || '', address: sup.address || '', payment_terms: sup.payment_terms || 'NET 30', is_active: sup.is_active }); setIsEditing(true); setIsOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && selected) {
        await updateSupplier(selected.id, form);
        toast.success('Profil supplier diperbarui.');
      } else {
        await createSupplier(form as any);
        toast.success('Profil supplier dibuat.');
      }
      setIsOpen(false);
    } catch (err: any) { toast.error(err.message || 'Gagal menyimpan supplier.'); }
  };

  const handleDelete = (id: string) => {
    const sup = suppliers.find(s => s.id === id);
    if (!sup) return;
    toast(`Hapus supplier ${sup.name}?`, {
      description: "Tindakan ini akan menghapus profil supplier secara permanen dari direktori.",
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            await deleteSupplier(id);
            setSelected(null);
            toast.success("Profil supplier dihapus.");
          } catch (err: any) {
            toast.error(err.message || "Gagal menghapus supplier.");
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
          <h1 className={s.title}>Supplier</h1>
          <p className={s.subtitle}>Kelola profil vendor resmi, kontak, dan syarat pembayaran.</p>
        </div>
        <PButton onClick={openCreate}>
          <Plus size={16} strokeWidth={2} />
          Tambah Supplier
        </PButton>
      </div>

      <div className={s.filterBar}>
        <div className={s.searchWrap}>
          <Search size={15} className={s.searchIcon} />
          <input className={s.searchInput} placeholder="Cari supplier..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className={s.twoPanel}>
        <div className={s.tableCard}>
          <table className={s.table}>
            <thead className={s.tableHead}>
              <tr>
                <th>Nama Supplier</th>
                <th>Kontak PIC</th>
                <th>Telepon</th>
                <th>Syarat Pembayaran</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className={s.tableBody}>
              {loading ? (
                <tr><td colSpan={5}><div className={s.empty}><p className={s.emptyBody}>Memuat...</p></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5}>
                  <div className={s.empty}>
                    <Users size={40} className={s.emptyIcon} />
                    <p className={s.emptyTitle}>Supplier tidak ditemukan</p>
                    <p className={s.emptyBody}>Tambah supplier pertama Anda ke direktori vendor.</p>
                  </div>
                </td></tr>
              ) : filtered.map(sup => (
                <tr key={sup.id} className={selected?.id === sup.id ? s.rowSelected : ''} onClick={() => setSelected(sup)}>
                  <td className={s.tdPrimary}>{sup.name}</td>
                  <td className={s.tdMuted}>{sup.pic_name || '—'}</td>
                  <td className={s.tdMuted}>{sup.pic_contact || '—'}</td>
                  <td className={s.tdMuted}>{sup.payment_terms || '—'}</td>
                  <td><span style={{ fontSize: 13, fontWeight: 500, color: sup.is_active ? 'var(--p-success)' : 'var(--p-muted)' }}>{sup.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                </tr>
              ))}
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
                  <span className={s.detailDocNum}>{selected.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: selected.is_active ? 'var(--p-success)' : 'var(--p-muted)' }}>{selected.is_active ? 'Aktif' : 'Nonaktif'}</span>
                </div>
                <div className={s.detailBody}>
                  <div className={s.detailMeta}>
                    <div className={s.detailMetaItem}><div className={s.detailMetaLabel}>Kontak PIC</div><div className={s.detailMetaValue}>{selected.pic_name || '—'}</div></div>
                    <div className={s.detailMetaItem}><div className={s.detailMetaLabel}>Telepon / Email</div><div className={s.detailMetaValue}>{selected.pic_contact || '—'}</div></div>
                    <div className={s.detailMetaItem}><div className={s.detailMetaLabel}>Syarat Pembayaran</div><div className={s.detailMetaValue}>{selected.payment_terms || '—'}</div></div>
                  </div>

                  {selected.address && (
                    <div className={s.creamCard}>
                      <div className={s.creamCardTitle}>Alamat</div>
                      <div className={s.creamCardBody}>{selected.address}</div>
                    </div>
                  )}
                </div>

                <div className={s.actionRow}>
                  <PButton size="sm" onClick={() => openEdit(selected)}>Ubah</PButton>
                  <PButton variant="danger" size="sm" onClick={() => handleDelete(selected.id)}>Hapus</PButton>
                  <PButton variant="secondary" size="sm" onClick={() => setSelected(null)}>Tutup</PButton>
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
              <h2 className={s.modalTitle}>{isEditing ? 'Ubah Supplier' : 'Tambah Supplier Baru'}</h2>
              <p className={s.modalSubtitle}>Catat profil vendor, detail kontak, dan pengaturan pembayaran.</p>

              <form onSubmit={handleSubmit}>
                <div className={s.formGrid}>
                  <div className={s.formField} style={{ gridColumn: '1 / -1' }}>
                    <label className={s.formLabel}>Nama Perusahaan / Supplier</label>
                    <input className={s.formInput} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="misal. PT. Fresh Foods Indonesia" required />
                  </div>
                  <div className={s.formField}>
                    <label className={s.formLabel}>Nama PIC Kontak</label>
                    <input className={s.formInput} value={form.pic_name} onChange={e => setForm(f => ({ ...f, pic_name: e.target.value }))} placeholder="misal. Budi Santoso" />
                  </div>
                  <div className={s.formField}>
                    <label className={s.formLabel}>Telepon / WhatsApp / Email</label>
                    <input className={s.formInput} value={form.pic_contact} onChange={e => setForm(f => ({ ...f, pic_contact: e.target.value }))} placeholder="misal. +62812345678" />
                  </div>
                  <div className={s.formField}>
                    <label className={s.formLabel}>Syarat Pembayaran</label>
                    <select className={s.formSelect} value={form.payment_terms} onChange={e => setForm(f => ({ ...f, payment_terms: e.target.value }))}>
                      {['COD', 'NET 7', 'NET 14', 'NET 30', 'NET 45', 'NET 60'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className={s.formField} style={{ gridColumn: '1 / -1' }}>
                    <label className={s.formLabel}>Alamat</label>
                    <textarea className={s.formTextarea} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Alamat lengkap bisnis..." style={{ minHeight: 72 }} />
                  </div>
                  <div className={s.formField} style={{ gridColumn: '1 / -1' }}>
                    <div className={s.checkRow}>
                      <input id="sup_active" type="checkbox" className={s.checkbox} checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                      <label htmlFor="sup_active" className={s.checkLabel}>Supplier aktif dan memenuhi syarat untuk purchase order</label>
                    </div>
                  </div>
                </div>

                <div className={s.modalActions}>
                  <PButton type="submit">{isEditing ? 'Simpan Perubahan' : 'Tambah Supplier'}</PButton>
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
