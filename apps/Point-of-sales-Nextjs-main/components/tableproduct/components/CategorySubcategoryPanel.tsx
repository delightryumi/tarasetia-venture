'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  collection, getDocs, addDoc, deleteDoc, doc,
  updateDoc, arrayUnion, arrayRemove, query, where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getHotelCollection } from '@/lib/firestoreHelper';
import { toast } from 'react-toastify';
import { Plus, Trash2, Pencil, Check, X, Loader2, Tag, Layers, Lock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

// ─── Constants ───────────────────────────────────────────────────────────────
// Protected categories that cannot be renamed or deleted (but can have subcategories added)
const PROTECTED_CATEGORIES = ['BANQUET', 'FOOD', 'BEVERAGE'];
const VALID_PASSWORDS = ['admin123', 'owner123'];

const PNL_TARGET_OPTIONS = [
  { value: 'FOOD', label: 'F&B Food (Makanan)' },
  { value: 'BEVERAGE', label: 'F&B Beverage (Minuman)' },
  { value: 'BANQUET', label: 'F&B Banquet (Event)' },
  { value: 'OTHER', label: 'Other Income & Expense' }
];

interface Category {
  id: string;
  name: string;
  subcategories: string[];
  pnlTarget?: 'FOOD' | 'BEVERAGE' | 'BANQUET' | 'OTHER';
}

// ─── Admin Password Dialog ────────────────────────────────────────────────────
interface AdminDialogProps {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function AdminPasswordDialog({ open, title, description, onConfirm, onCancel, loading }: AdminDialogProps) {
  const [password, setPassword] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPassword('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleConfirm = () => {
    if (!VALID_PASSWORDS.includes(password)) {
      toast.error('Password Admin salah! Aksi dibatalkan.');
      setPassword('');
      return;
    }
    onConfirm();
    setPassword('');
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-sm bg-white dark:bg-zinc-950 rounded-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <AlertDialogTitle className="text-sm font-bold leading-snug">{title}</AlertDialogTitle>
          </div>
        </AlertDialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              Konfirmasi Password Admin
            </Label>
            <Input
              ref={inputRef}
              type="password"
              placeholder="Masukkan password admin..."
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              className="h-9 text-sm rounded-xl border-neutral-200 dark:border-white/[0.1]"
            />
          </div>
        </div>

        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel onClick={() => { setPassword(''); onCancel(); }} className="rounded-xl h-9 text-xs">
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading || !password}
            className="rounded-xl h-9 text-xs bg-red-600 hover:bg-red-700 text-white border-none"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Konfirmasi'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CategorySubcategoryPanel() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Category state
  const [newCat, setNewCat] = useState('');
  const [newCatPnlTarget, setNewCatPnlTarget] = useState<'FOOD' | 'BEVERAGE' | 'BANQUET' | 'OTHER'>('FOOD');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingCatPnlTarget, setEditingCatPnlTarget] = useState<'FOOD' | 'BEVERAGE' | 'BANQUET' | 'OTHER'>('FOOD');
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);

  // Subcategory state
  const [newSubcat, setNewSubcat] = useState('');

  // Admin password dialog state
  const [adminDialog, setAdminDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: '', description: '', onConfirm: () => {} });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(getHotelCollection(db, 'pos_categories'));
      const fetched: Category[] = snap.docs.map(d => ({
        id: d.id,
        name: d.data().name,
        subcategories: d.data().subcategories || [],
        pnlTarget: d.data().pnlTarget || (d.data().name === 'FOOD' ? 'FOOD' : d.data().name === 'BEVERAGE' ? 'BEVERAGE' : d.data().name === 'BANQUET' ? 'BANQUET' : 'FOOD')
      }));
      const sorted = fetched.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(sorted);
      if (selectedCat) {
        const updated = sorted.find(c => c.id === selectedCat.id);
        if (updated) setSelectedCat(updated);
      }
    } catch (e) {
      console.error(e);
      toast.error('Gagal memuat data kategori.');
    } finally {
      setLoading(false);
    }
  };

  const closeAdminDialog = () =>
    setAdminDialog(prev => ({ ...prev, open: false }));

  const requireAdmin = (title: string, description: string, action: () => void) => {
    setAdminDialog({ open: true, title, description, onConfirm: action });
  };

  const isProtected = (name: string) =>
    PROTECTED_CATEGORIES.includes(name.toUpperCase());

  // ── Category CRUD ───────────────────────────────────────────────────────────
  const doAddCategory = async () => {
    const trimmed = newCat.trim().toUpperCase();
    if (!trimmed) return;
    if (categories.some(c => c.name === trimmed)) {
      toast.warning('Kategori sudah ada!');
      return;
    }
    const resolvedPnlTarget = trimmed === 'FOOD' ? 'FOOD' : trimmed === 'BEVERAGE' ? 'BEVERAGE' : trimmed === 'BANQUET' ? 'BANQUET' : newCatPnlTarget;
    try {
      const ref = await addDoc(getHotelCollection(db, 'pos_categories'), {
        name: trimmed,
        subcategories: [],
        pnlTarget: resolvedPnlTarget,
        createdAt: new Date(),
      });
      setCategories(prev => [...prev, { id: ref.id, name: trimmed, subcategories: [], pnlTarget: resolvedPnlTarget }]
        .sort((a, b) => a.name.localeCompare(b.name)));
      setNewCat('');
      toast.success('Kategori berhasil ditambahkan.');
    } catch {
      toast.error('Gagal menambahkan kategori.');
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    requireAdmin(
      'Tambah Kategori Baru',
      `Anda akan menambahkan kategori "${trimmed.toUpperCase()}". Masukkan password admin untuk melanjutkan.`,
      doAddCategory
    );
  };

  const doSaveEditCategory = async (cat: Category) => {
    const trimmed = editingCatName.trim().toUpperCase();
    const hasNameChanged = trimmed && trimmed !== cat.name;
    const hasPnlTargetChanged = editingCatPnlTarget !== cat.pnlTarget;

    if (!hasNameChanged && !hasPnlTargetChanged) { setEditingCatId(null); return; }

    if (hasNameChanged && categories.some(c => c.id !== cat.id && c.name === trimmed)) {
      toast.warning('Nama kategori sudah digunakan!');
      return;
    }
    setLoadingId(cat.id);
    try {
      const updatePayload: any = {};
      if (hasNameChanged) updatePayload.name = trimmed;
      if (hasPnlTargetChanged) updatePayload.pnlTarget = editingCatPnlTarget;

      await updateDoc(doc(getHotelCollection(db, 'pos_categories'), cat.id), updatePayload);

      if (hasNameChanged) {
        const q = query(getHotelCollection(db, 'pos_products'), where('category', '==', cat.name));
        const snap = await getDocs(q);
        await Promise.all(snap.docs.map(d => updateDoc(doc(getHotelCollection(db, 'pos_products'), d.id), { category: trimmed })));
      }

      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, name: hasNameChanged ? trimmed : c.name, pnlTarget: editingCatPnlTarget } : c)
        .sort((a, b) => a.name.localeCompare(b.name)));
      if (selectedCat?.id === cat.id) {
        setSelectedCat(prev => prev ? { ...prev, name: hasNameChanged ? trimmed : prev.name, pnlTarget: editingCatPnlTarget } : null);
      }
      toast.success('Kategori berhasil diperbarui.');
      setEditingCatId(null);
    } catch {
      toast.error('Gagal memperbarui kategori.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleSaveEditCategory = (cat: Category) => {
    const trimmed = editingCatName.trim().toUpperCase();
    const hasNameChanged = trimmed && trimmed !== cat.name;
    const hasPnlTargetChanged = editingCatPnlTarget !== cat.pnlTarget;

    if (!hasNameChanged && !hasPnlTargetChanged) { setEditingCatId(null); return; }

    if (hasNameChanged) {
      requireAdmin(
        'Edit Kategori',
        `Anda akan mengubah nama kategori "${cat.name}" menjadi "${trimmed}". Ini akan mengupdate semua produk terkait.`,
        () => doSaveEditCategory(cat)
      );
    } else {
      requireAdmin(
        'Ubah Target P&L',
        `Anda akan mengubah target alokasi P&L untuk kategori "${cat.name}" menjadi "${editingCatPnlTarget}".`,
        () => doSaveEditCategory(cat)
      );
    }
  };

  const doDeleteCategory = async (cat: Category) => {
    setLoadingId(cat.id);
    try {
      const q = query(getHotelCollection(db, 'pos_products'), where('category', '==', cat.name));
      const snap = await getDocs(q);
      if (!snap.empty) {
        toast.error(`Kategori "${cat.name}" masih digunakan oleh ${snap.size} produk!`);
        return;
      }
      await deleteDoc(doc(getHotelCollection(db, 'pos_categories'), cat.id));
      setCategories(prev => prev.filter(c => c.id !== cat.id));
      if (selectedCat?.id === cat.id) setSelectedCat(null);
      toast.success(`Kategori "${cat.name}" dihapus.`);
    } catch {
      toast.error('Gagal menghapus kategori.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteCategory = (cat: Category) => {
    requireAdmin(
      'Hapus Kategori',
      `Anda akan menghapus kategori "${cat.name}". Aksi ini tidak dapat dibatalkan.`,
      () => doDeleteCategory(cat)
    );
  };

  // ── Subcategory CRUD ────────────────────────────────────────────────────────
  const doAddSubcategory = async () => {
    if (!selectedCat) return;
    const trimmed = newSubcat.trim().toUpperCase();
    if (!trimmed) return;
    if (selectedCat.subcategories.includes(trimmed)) {
      toast.warning('Subkategori sudah ada!');
      return;
    }
    setLoadingId(selectedCat.id);
    try {
      await updateDoc(doc(getHotelCollection(db, 'pos_categories'), selectedCat.id), { subcategories: arrayUnion(trimmed) });
      const updated: Category = { ...selectedCat, subcategories: [...selectedCat.subcategories, trimmed].sort() };
      setCategories(prev => prev.map(c => c.id === selectedCat.id ? updated : c));
      setSelectedCat(updated);
      setNewSubcat('');
      toast.success('Subkategori berhasil ditambahkan.');
    } catch {
      toast.error('Gagal menambahkan subkategori.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleAddSubcategory = () => {
    if (!selectedCat || !newSubcat.trim()) return;
    requireAdmin(
      'Tambah Sub-Kategori',
      `Anda akan menambahkan sub-kategori "${newSubcat.trim().toUpperCase()}" ke kategori "${selectedCat.name}".`,
      doAddSubcategory
    );
  };

  const doDeleteSubcategory = async (subName: string) => {
    if (!selectedCat) return;
    setLoadingId(selectedCat.id);
    try {
      await updateDoc(doc(getHotelCollection(db, 'pos_categories'), selectedCat.id), { subcategories: arrayRemove(subName) });
      const updated: Category = { ...selectedCat, subcategories: selectedCat.subcategories.filter(s => s !== subName) };
      setCategories(prev => prev.map(c => c.id === selectedCat.id ? updated : c));
      setSelectedCat(updated);
      toast.success(`Subkategori "${subName}" dihapus.`);
    } catch {
      toast.error('Gagal menghapus subkategori.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteSubcategory = (subName: string) => {
    if (!selectedCat) return;
    requireAdmin(
      'Hapus Sub-Kategori',
      `Anda akan menghapus sub-kategori "${subName}" dari kategori "${selectedCat.name}".`,
      () => doDeleteSubcategory(subName)
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Admin Password Dialog */}
      <AdminPasswordDialog
        open={adminDialog.open}
        title={adminDialog.title}
        description={adminDialog.description}
        onConfirm={() => {
          closeAdminDialog();
          adminDialog.onConfirm();
        }}
        onCancel={closeAdminDialog}
        loading={!!loadingId}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">

        {/* ── LEFT: Category Table ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 px-5 py-4 border-b border-neutral-100 dark:border-white/[0.06] bg-gradient-to-r from-neutral-50 to-white dark:from-zinc-900 dark:to-zinc-950">
            <Tag className="w-4 h-4 text-neutral-500" />
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Category</h2>
            <Badge variant="secondary" className="ml-auto text-[10px]">{categories.length}</Badge>
          </div>

          {/* Add Category */}
          <div className="flex flex-col gap-2 px-4 py-3 border-b border-neutral-100 dark:border-white/[0.04]">
            <div className="flex gap-2">
              <Input
                placeholder="Tambah kategori baru..."
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                className="h-8 text-xs flex-1"
              />
              <Button onClick={handleAddCategory} size="sm" className="h-8 bg-neutral-800 hover:bg-neutral-700 text-white text-xs shrink-0">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-[10px] font-semibold text-neutral-500 shrink-0">P&L Target:</Label>
              <select
                value={newCatPnlTarget}
                onChange={e => setNewCatPnlTarget(e.target.value as any)}
                className="h-7 px-2 text-[10px] font-medium rounded-[6px] bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.1] text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer flex-1 animate-none outline-none"
              >
                {PNL_TARGET_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category List */}
          <div className="flex-1 overflow-y-auto thin-scrollbar max-h-72">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin w-5 h-5 text-neutral-400" /></div>
            ) : categories.length === 0 ? (
              <p className="text-center text-xs text-neutral-400 py-8">Belum ada kategori.</p>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 bg-neutral-50 dark:bg-zinc-900 z-10">
                  <tr className="text-[11px] text-neutral-500 border-b border-neutral-100 dark:border-white/[0.04]">
                    <th className="text-left px-4 py-2 font-medium">Nama Kategori</th>
                    <th className="text-center px-2 py-2 font-medium">Sub</th>
                    <th className="text-right px-4 py-2 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => {
                    const locked = isProtected(cat.name);
                    return (
                      <tr
                        key={cat.id}
                        onClick={() => setSelectedCat(cat)}
                        className={`group cursor-pointer border-b border-neutral-100 dark:border-white/[0.03] transition-colors hover:bg-neutral-50 dark:hover:bg-zinc-800/40 ${selectedCat?.id === cat.id ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                      >
                        <td className="px-4 py-2.5">
                          {editingCatId === cat.id ? (
                            <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                              <Input
                                value={editingCatName}
                                onChange={e => setEditingCatName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSaveEditCategory(cat)}
                                className="h-7 text-xs"
                                autoFocus
                              />
                              <select
                                value={editingCatPnlTarget}
                                onChange={e => setEditingCatPnlTarget(e.target.value as any)}
                                className="h-7 px-2 text-[10px] rounded-[6px] bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.1] text-neutral-800 dark:text-neutral-200 focus:outline-none"
                              >
                                {PNL_TARGET_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5">
                                {locked && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
                                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">{cat.name}</span>
                                {locked && (
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-amber-600 border-amber-300 dark:border-amber-700 dark:text-amber-400">
                                    Protected
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-medium">
                                Target P&L: {cat.pnlTarget || (cat.name === 'FOOD' ? 'FOOD' : cat.name === 'BEVERAGE' ? 'BEVERAGE' : cat.name === 'BANQUET' ? 'BANQUET' : 'FOOD')}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="text-center px-2 py-2.5">
                          <Badge variant="outline" className="text-[10px]">{cat.subcategories.length}</Badge>
                        </td>
                        <td className="text-right px-4 py-2.5">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            {editingCatId === cat.id ? (
                              <>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600" onClick={() => handleSaveEditCategory(cat)} disabled={loadingId === cat.id}><Check className="w-3 h-3" /></Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-neutral-400" onClick={() => setEditingCatId(null)}><X className="w-3 h-3" /></Button>
                              </>
                            ) : locked ? (
                              // Protected: only show disabled icons as indicator
                              <span className="text-[10px] text-amber-500 flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Terkunci
                              </span>
                            ) : (
                              <>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-neutral-400 hover:text-neutral-700" onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); setEditingCatPnlTarget(cat.pnlTarget || (cat.name === 'FOOD' ? 'FOOD' : cat.name === 'BEVERAGE' ? 'BEVERAGE' : cat.name === 'BANQUET' ? 'BANQUET' : 'FOOD')); }} disabled={loadingId === cat.id}><Pencil className="w-3 h-3" /></Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => handleDeleteCategory(cat)} disabled={loadingId === cat.id}><Trash2 className="w-3 h-3" /></Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <div className="px-4 py-2 text-[10px] text-neutral-400 border-t border-neutral-100 dark:border-white/[0.04] flex items-center gap-1">
            <Lock className="w-2.5 h-2.5 text-amber-500" />
            <span>Kategori Protected tidak dapat diedit / dihapus.</span>
          </div>
        </div>

        {/* ── RIGHT: Subcategory Table ─────────────────────────────────────────── */}
        <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 px-5 py-4 border-b border-neutral-100 dark:border-white/[0.06] bg-gradient-to-r from-neutral-50 to-white dark:from-zinc-900 dark:to-zinc-950">
            <Layers className="w-4 h-4 text-neutral-500" />
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Sub-Category
              {selectedCat && <span className="ml-2 text-xs font-normal text-neutral-400">— {selectedCat.name}</span>}
            </h2>
            {selectedCat && (
              <Badge variant="secondary" className="ml-auto text-[10px]">{selectedCat.subcategories.length}</Badge>
            )}
          </div>

          {/* Add Subcategory */}
          <div className="flex gap-2 px-4 py-3 border-b border-neutral-100 dark:border-white/[0.04]">
            <Input
              placeholder={selectedCat ? `Tambah sub ke ${selectedCat.name}...` : 'Pilih kategori terlebih dahulu...'}
              value={newSubcat}
              onChange={e => setNewSubcat(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddSubcategory()}
              className="h-8 text-xs"
              disabled={!selectedCat}
            />
            <Button onClick={handleAddSubcategory} size="sm" className="h-8 bg-neutral-800 hover:bg-neutral-700 text-white text-xs shrink-0" disabled={!selectedCat}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add
            </Button>
          </div>

          {/* Subcategory List */}
          <div className="flex-1 overflow-y-auto thin-scrollbar max-h-72">
            {!selectedCat ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <Layers className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                <p className="text-xs text-neutral-400">Pilih kategori di sebelah kiri<br />untuk melihat sub-kategorinya.</p>
              </div>
            ) : selectedCat.subcategories.length === 0 ? (
              <p className="text-center text-xs text-neutral-400 py-8">Belum ada sub-kategori untuk <strong>{selectedCat.name}</strong>.</p>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 bg-neutral-50 dark:bg-zinc-900 z-10">
                  <tr className="text-[11px] text-neutral-500 border-b border-neutral-100 dark:border-white/[0.04]">
                    <th className="text-left px-4 py-2 font-medium">Nama Sub-Kategori</th>
                    <th className="text-center px-2 py-2 font-medium">Induk</th>
                    <th className="text-right px-4 py-2 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCat.subcategories.map((sub, idx) => (
                    <tr key={idx} className="group border-b border-neutral-100 dark:border-white/[0.03] hover:bg-neutral-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-200">{sub}</span>
                      </td>
                      <td className="text-center px-2 py-2.5">
                        <Badge variant="outline" className="text-[10px] text-neutral-500">{selectedCat.name}</Badge>
                      </td>
                      <td className="text-right px-4 py-2.5">
                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => handleDeleteSubcategory(sub)}
                            disabled={loadingId === selectedCat.id}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {selectedCat && (
            <div className="px-4 py-2 text-[10px] text-neutral-400 border-t border-neutral-100 dark:border-white/[0.04]">
              Hover baris untuk aksi hapus • Semua aksi membutuhkan password admin
            </div>
          )}
        </div>
      </div>
    </>
  );
}
