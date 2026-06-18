'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FolderEdit, Trash2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'react-toastify';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import axios from 'axios';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getHotelCollection } from '@/lib/firestoreHelper';
import { ChevronDown, ChevronRight, X, Pencil, Check } from 'lucide-react';

const PNL_TARGET_OPTIONS = [
  { value: 'FOOD', label: 'F&B Food (Makanan)' },
  { value: 'BEVERAGE', label: 'F&B Beverage (Minuman)' },
  { value: 'BANQUET', label: 'F&B Banquet (Event)' },
  { value: 'OTHER', label: 'Other Income & Expense' }
];

export default function ManageCategoryComponent() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; subcategories: string[]; pnlTarget?: string }[]>([]);
  const [newCat, setNewCat] = useState('');
  const [newCatPnlTarget, setNewCatPnlTarget] = useState<'FOOD' | 'BEVERAGE' | 'BANQUET' | 'OTHER'>('FOOD');
  const [editingCatPnlTarget, setEditingCatPnlTarget] = useState<'FOOD' | 'BEVERAGE' | 'BANQUET' | 'OTHER'>('FOOD');
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [newSubcat, setNewSubcat] = useState<{ [key: string]: string }>({});
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState<string>('');

  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  const loadCategories = async () => {
    setIsFetching(true);
    try {
      const snap = await getDocs(getHotelCollection(db, 'pos_categories'));
      const fetchedCats = snap.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        subcategories: doc.data().subcategories || [],
        pnlTarget: doc.data().pnlTarget || (doc.data().name === 'FOOD' ? 'FOOD' : doc.data().name === 'BEVERAGE' ? 'BEVERAGE' : doc.data().name === 'BANQUET' ? 'BANQUET' : 'FOOD')
      }));
      setCategories(fetchedCats.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Failed to load categories', error);
      toast.error('Gagal memuat kategori dari database.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleAdd = async () => {
    const trimmed = newCat.trim().toUpperCase();
    if (!trimmed) return;
    
    // Check if category name already exists locally
    if (categories.some(c => c.name === trimmed)) {
      toast.warning('Kategori sudah ada!');
      return;
    }

    const resolvedPnlTarget = trimmed === 'FOOD' ? 'FOOD' : trimmed === 'BEVERAGE' ? 'BEVERAGE' : trimmed === 'BANQUET' ? 'BANQUET' : newCatPnlTarget;

    try {
      const docRef = await addDoc(getHotelCollection(db, 'pos_categories'), {
        name: trimmed,
        subcategories: [],
        pnlTarget: resolvedPnlTarget,
        createdAt: new Date()
      });
      setCategories([...categories, { id: docRef.id, name: trimmed, subcategories: [], pnlTarget: resolvedPnlTarget }].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCat('');
      toast.success('Kategori berhasil ditambahkan.');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Gagal menambahkan kategori.');
    }
  };

  const handleDelete = async (catId: string, catName: string) => {
    setLoadingCategory(catId);
    try {
      // Fetch products to see if this category is in use
      const q = query(getHotelCollection(db, 'pos_products'), where('category', '==', catName));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        toast.error(`Kategori "${catName}" sedang digunakan oleh produk! Tidak dapat dihapus.`);
      } else {
        await deleteDoc(doc(getHotelCollection(db, 'pos_categories'), catId));
        setCategories(categories.filter(c => c.id !== catId));
        toast.success(`Kategori "${catName}" berhasil dihapus.`);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Gagal menghapus kategori.');
    } finally {
      setLoadingCategory(null);
    }
  };

  const handleSaveEditCategory = async (catId: string, oldName: string, currentPnlTarget?: string) => {
    const trimmed = editingCatName.trim().toUpperCase();
    const hasNameChanged = trimmed && trimmed !== oldName;
    const hasPnlTargetChanged = editingCatPnlTarget !== currentPnlTarget;

    if (!hasNameChanged && !hasPnlTargetChanged) {
      setEditingCatId(null);
      return;
    }
    
    // Check if new name already exists
    if (hasNameChanged && categories.some(c => c.id !== catId && c.name === trimmed)) {
      toast.warning('Kategori dengan nama tersebut sudah ada!');
      return;
    }

    setLoadingCategory(catId);
    try {
      const catRef = doc(getHotelCollection(db, 'pos_categories'), catId);
      const updatePayload: any = {};
      if (hasNameChanged) updatePayload.name = trimmed;
      if (hasPnlTargetChanged) updatePayload.pnlTarget = editingCatPnlTarget;

      await updateDoc(catRef, updatePayload);
      
      if (hasNameChanged) {
        // Cascade update to all products using this category
        const q = query(getHotelCollection(db, 'pos_products'), where('category', '==', oldName));
        const snap = await getDocs(q);
        const updatePromises = snap.docs.map(d => updateDoc(doc(getHotelCollection(db, 'pos_products'), d.id), { category: trimmed }));
        await Promise.all(updatePromises);
      }
      
      setCategories(categories.map(c => 
        c.id === catId ? { ...c, name: hasNameChanged ? trimmed : c.name, pnlTarget: editingCatPnlTarget } : c
      ).sort((a, b) => a.name.localeCompare(b.name)));
      
      toast.success('Kategori berhasil diperbarui.');
      setEditingCatId(null);
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Gagal memperbarui kategori.');
    } finally {
      setLoadingCategory(null);
    }
  };

  const handleAddSubcategory = async (catId: string, subcatName: string) => {
    const trimmed = subcatName.trim().toUpperCase();
    if (!trimmed) return;
    
    setLoadingCategory(catId);
    try {
      const catRef = doc(getHotelCollection(db, 'pos_categories'), catId);
      await updateDoc(catRef, {
        subcategories: arrayUnion(trimmed)
      });
      
      setCategories(categories.map(c => 
        c.id === catId ? { ...c, subcategories: [...c.subcategories, trimmed].sort() } : c
      ));
      setNewSubcat({ ...newSubcat, [catId]: '' });
      toast.success('Subkategori berhasil ditambahkan.');
    } catch (error) {
      console.error('Error adding subcategory:', error);
      toast.error('Gagal menambahkan subkategori.');
    } finally {
      setLoadingCategory(null);
    }
  };

  const handleDeleteSubcategory = async (catId: string, subcatName: string) => {
    setLoadingCategory(catId);
    try {
      // In a real scenario, you might want to check if subcategory is in use by products
      const catRef = doc(getHotelCollection(db, 'pos_categories'), catId);
      await updateDoc(catRef, {
        subcategories: arrayRemove(subcatName)
      });
      
      setCategories(categories.map(c => 
        c.id === catId ? { ...c, subcategories: c.subcategories.filter(s => s !== subcatName) } : c
      ));
      toast.success(`Subkategori "${subcatName}" berhasil dihapus.`);
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      toast.error('Gagal menghapus subkategori.');
    } finally {
      setLoadingCategory(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={() => setOpen(true)} className="border-dashed border-neutral-300">
              <FolderEdit className="h-4 w-4 text-neutral-600" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Manage Categories</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center gap-2">
            <Input 
              placeholder="New Category Name (e.g. SNACKS)" 
              value={newCat} 
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="flex-1"
            />
            <Button onClick={handleAdd} size="sm" className="bg-neutral-800 text-white">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-semibold text-neutral-500 shrink-0">P&L Target:</label>
            <select
              value={newCatPnlTarget}
              onChange={e => setNewCatPnlTarget(e.target.value as any)}
              className="h-8 px-2 text-xs rounded-[6px] bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.1] text-neutral-800 dark:text-neutral-200 focus:outline-none flex-1 outline-none"
            >
              {PNL_TARGET_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 max-h-[50vh] overflow-y-auto thin-scrollbar p-1">
          {isFetching ? (
            <div className="text-center py-4 text-xs text-neutral-400">Loading categories...</div>
          ) : (
            categories.map(cat => (
              <div key={cat.id} className="flex flex-col border border-neutral-200 dark:border-white/[0.1] bg-neutral-50 dark:bg-zinc-900 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-2.5">
                  <div className="flex items-center gap-2 flex-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 shrink-0" 
                      onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                    >
                      {expandedCat === cat.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                    
                    {editingCatId === cat.id ? (
                      <div className="flex flex-col gap-2 w-full mr-2">
                        <div className="flex items-center gap-1 w-full">
                          <Input 
                            value={editingCatName}
                            onChange={(e) => setEditingCatName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEditCategory(cat.id, cat.name, cat.pnlTarget)}
                            className="h-7 text-xs flex-1"
                            autoFocus
                          />
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50 shrink-0"
                            onClick={() => handleSaveEditCategory(cat.id, cat.name, cat.pnlTarget)}
                            disabled={loadingCategory === cat.id}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="h-7 w-7 text-neutral-400 shrink-0"
                            onClick={() => setEditingCatId(null)}
                            disabled={loadingCategory === cat.id}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <select
                          value={editingCatPnlTarget}
                          onChange={e => setEditingCatPnlTarget(e.target.value as any)}
                          className="h-7 px-2 text-[10px] rounded-[6px] bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.1] text-neutral-800 dark:text-neutral-200 focus:outline-none outline-none"
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
                        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{cat.name}</span>
                        <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-medium">
                          P&L Target: {cat.pnlTarget || (cat.name === 'FOOD' ? 'FOOD' : cat.name === 'BEVERAGE' ? 'BEVERAGE' : cat.name === 'BANQUET' ? 'BANQUET' : 'FOOD')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {editingCatId !== cat.id && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        disabled={loadingCategory === cat.id}
                        onClick={() => {
                          setEditingCatId(cat.id);
                          setEditingCatName(cat.name);
                          setEditingCatPnlTarget((cat.pnlTarget || (cat.name === 'FOOD' ? 'FOOD' : cat.name === 'BEVERAGE' ? 'BEVERAGE' : cat.name === 'BANQUET' ? 'BANQUET' : 'FOOD')) as any);
                        }}
                        className="h-7 w-7 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        disabled={loadingCategory === cat.id}
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {expandedCat === cat.id && (
                  <div className="p-3 bg-white dark:bg-zinc-950 border-t border-neutral-200 dark:border-zinc-800 max-h-80 overflow-y-auto thin-scrollbar">
                    <div className="flex items-center gap-2 mb-3">
                      <Input 
                        placeholder="Add Subcategory..." 
                        value={newSubcat[cat.id] || ''} 
                        onChange={(e) => setNewSubcat({ ...newSubcat, [cat.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubcategory(cat.id, newSubcat[cat.id] || '')}
                        className="h-8 text-xs"
                      />
                      <Button 
                        onClick={() => handleAddSubcategory(cat.id, newSubcat[cat.id] || '')} 
                        size="sm" 
                        className="h-8 bg-neutral-800 text-white"
                        disabled={loadingCategory === cat.id}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto flex-1 thin-scrollbar">
                      {cat.subcategories?.length > 0 ? (
                        cat.subcategories.map(sub => (
                          <div key={sub} className="flex items-center justify-between px-2 py-1.5 bg-neutral-100 dark:bg-zinc-900 rounded-md">
                            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">{sub}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-5 w-5 text-neutral-400 hover:text-red-500"
                              onClick={() => handleDeleteSubcategory(cat.id, sub)}
                              disabled={loadingCategory === cat.id}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-neutral-400 text-center py-2">No subcategories</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          {!isFetching && categories.length === 0 && (
            <div className="text-center py-4 text-xs text-neutral-400">
              No categories available.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
