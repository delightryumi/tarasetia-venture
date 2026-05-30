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
        toast.success('Supplier profile updated.');
      } else {
        await createSupplier(form as any);
        toast.success('Supplier profile created.');
      }
      setIsOpen(false);
    } catch (err: any) { toast.error(err.message || 'Failed to save supplier.'); }
  };

  const handleDelete = (id: string) => {
    const sup = suppliers.find(s => s.id === id);
    if (!sup) return;
    toast(`Remove supplier ${sup.name}?`, {
      description: "This will permanently remove the supplier profile from the directory.",
      action: {
        label: "Remove",
        onClick: async () => {
          try {
            await deleteSupplier(id);
            setSelected(null);
            toast.success("Supplier profile removed.");
          } catch (err: any) {
            toast.error(err.message || "Failed to remove supplier.");
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
          <h1 className={s.title}>Suppliers</h1>
          <p className={s.subtitle}>Manage authorized vendor profiles, contacts, and payment terms.</p>
        </div>
        <PButton onClick={openCreate}>
          <Plus size={16} strokeWidth={2} />
          Add Supplier
        </PButton>
      </div>

      <div className={s.filterBar}>
        <div className={s.searchWrap}>
          <Search size={15} className={s.searchIcon} />
          <input className={s.searchInput} placeholder="Search suppliers…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className={s.twoPanel}>
        <div className={s.tableCard}>
          <table className={s.table}>
            <thead className={s.tableHead}>
              <tr>
                <th>Supplier Name</th>
                <th>Contact PIC</th>
                <th>Phone</th>
                <th>Payment Terms</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className={s.tableBody}>
              {loading ? (
                <tr><td colSpan={5}><div className={s.empty}><p className={s.emptyBody}>Loading…</p></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5}>
                  <div className={s.empty}>
                    <Users size={40} className={s.emptyIcon} />
                    <p className={s.emptyTitle}>No suppliers found</p>
                    <p className={s.emptyBody}>Add your first supplier to the vendor directory.</p>
                  </div>
                </td></tr>
              ) : filtered.map(sup => (
                <tr key={sup.id} className={selected?.id === sup.id ? s.rowSelected : ''} onClick={() => setSelected(sup)}>
                  <td className={s.tdPrimary}>{sup.name}</td>
                  <td className={s.tdMuted}>{sup.pic_name || '—'}</td>
                  <td className={s.tdMuted}>{sup.pic_contact || '—'}</td>
                  <td className={s.tdMuted}>{sup.payment_terms || '—'}</td>
                  <td><span style={{ fontSize: 13, fontWeight: 500, color: sup.is_active ? 'var(--p-success)' : 'var(--p-muted)' }}>{sup.is_active ? 'Active' : 'Inactive'}</span></td>
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
                  <span style={{ fontSize: 13, fontWeight: 500, color: selected.is_active ? 'var(--p-success)' : 'var(--p-muted)' }}>{selected.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div className={s.detailBody}>
                  <div className={s.detailMeta}>
                    <div className={s.detailMetaItem}><div className={s.detailMetaLabel}>Contact PIC</div><div className={s.detailMetaValue}>{selected.pic_name || '—'}</div></div>
                    <div className={s.detailMetaItem}><div className={s.detailMetaLabel}>Phone / Email</div><div className={s.detailMetaValue}>{selected.pic_contact || '—'}</div></div>
                    <div className={s.detailMetaItem}><div className={s.detailMetaLabel}>Payment Terms</div><div className={s.detailMetaValue}>{selected.payment_terms || '—'}</div></div>
                  </div>

                  {selected.address && (
                    <div className={s.creamCard}>
                      <div className={s.creamCardTitle}>Address</div>
                      <div className={s.creamCardBody}>{selected.address}</div>
                    </div>
                  )}
                </div>

                <div className={s.actionRow}>
                  <PButton size="sm" onClick={() => openEdit(selected)}>Edit</PButton>
                  <PButton variant="danger" size="sm" onClick={() => handleDelete(selected.id)}>Remove</PButton>
                  <PButton variant="secondary" size="sm" onClick={() => setSelected(null)}>Close</PButton>
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
              <h2 className={s.modalTitle}>{isEditing ? 'Edit Supplier' : 'Add New Supplier'}</h2>
              <p className={s.modalSubtitle}>Record vendor profile, contact details, and payment arrangement.</p>

              <form onSubmit={handleSubmit}>
                <div className={s.formGrid}>
                  <div className={s.formField} style={{ gridColumn: '1 / -1' }}>
                    <label className={s.formLabel}>Company / Supplier Name</label>
                    <input className={s.formInput} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. PT. Fresh Foods Indonesia" required />
                  </div>
                  <div className={s.formField}>
                    <label className={s.formLabel}>Contact PIC Name</label>
                    <input className={s.formInput} value={form.pic_name} onChange={e => setForm(f => ({ ...f, pic_name: e.target.value }))} placeholder="e.g. Budi Santoso" />
                  </div>
                  <div className={s.formField}>
                    <label className={s.formLabel}>Phone / WhatsApp / Email</label>
                    <input className={s.formInput} value={form.pic_contact} onChange={e => setForm(f => ({ ...f, pic_contact: e.target.value }))} placeholder="e.g. +62812345678" />
                  </div>
                  <div className={s.formField}>
                    <label className={s.formLabel}>Payment Terms</label>
                    <select className={s.formSelect} value={form.payment_terms} onChange={e => setForm(f => ({ ...f, payment_terms: e.target.value }))}>
                      {['COD', 'NET 7', 'NET 14', 'NET 30', 'NET 45', 'NET 60'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className={s.formField} style={{ gridColumn: '1 / -1' }}>
                    <label className={s.formLabel}>Address</label>
                    <textarea className={s.formTextarea} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full business address…" style={{ minHeight: 72 }} />
                  </div>
                  <div className={s.formField} style={{ gridColumn: '1 / -1' }}>
                    <div className={s.checkRow}>
                      <input id="sup_active" type="checkbox" className={s.checkbox} checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                      <label htmlFor="sup_active" className={s.checkLabel}>Supplier is active and eligible for purchase orders</label>
                    </div>
                  </div>
                </div>

                <div className={s.modalActions}>
                  <PButton type="submit">{isEditing ? 'Save Changes' : 'Add Supplier'}</PButton>
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
