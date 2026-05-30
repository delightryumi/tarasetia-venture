'use client';

import React, { useState, useMemo } from 'react';
import { FileText, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStoreRequisition } from '@/hooks/purchasing/useStoreRequisition';
import { useItems } from '@/hooks/purchasing/useItems';
import { useSuppliers } from '@/hooks/purchasing/useSuppliers';
import { toast } from 'sonner';
import { PButton } from '@/components/purchasing/ui/PButton';
import { useAuth } from '@/context/AuthContext';
import s from '../shared-page.module.css';
import { pushCostToPnL, removeCostFromPnL } from '@/lib/purchasing/pnlHelper';

// Subcomponents
import StoreRequisitionTable from './components/StoreRequisitionTable';
import StoreRequisitionDetail from './components/StoreRequisitionDetail';
import StoreRequisitionForm from './components/StoreRequisitionForm';
import StoreRequisitionPrint from './components/StoreRequisitionPrint';
import DeleteConfirmModal from '@/components/purchasing/ui/DeleteConfirmModal';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as any } },
};

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function StoreRequisitionPage() {
  const { srs, loading, createSR, updateSR, approveSR, fulfillSR, deleteSR } = useStoreRequisition();
  const { items } = useItems();
  const { suppliers } = useSuppliers();
  const { user } = useAuth();

  // Selected for view detail
  const [selectedSr, setSelectedSr] = useState<any>(null);
  
  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSrForForm, setSelectedSrForForm] = useState<any>(null);

  // Filters
  const [dateFilter, setDateFilter] = useState(() => getTodayStr());

  // Delete modal states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const filteredSrs = useMemo(() => {
    return srs.filter(sr => {
      if (!dateFilter) return true;
      const dateObj = sr.created_at?.toDate ? sr.created_at.toDate() : new Date(sr.created_at);
      const dateString = dateObj.toISOString().split('T')[0];
      return dateString === dateFilter;
    });
  }, [srs, dateFilter]);

  const handleOpenCreate = () => {
    setSelectedSrForForm(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (sr: any) => {
    setSelectedSrForForm(sr);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async (password: string) => {
    if (password !== 'admin123' && password !== 'owner123') {
      toast.error('Password Admin salah! Penghapusan dibatalkan.');
      return;
    }
    if (!deleteTargetId) return;
    try {
      const sr = srs.find(s => s.id === deleteTargetId);
      if (sr && (sr.status === 'approved' || sr.status === 'fulfilled')) {
        await removeCostFromPnL(`sr-${deleteTargetId}`, sr.order_date || sr.created_at);
      }
      await deleteSR(deleteTargetId);
      toast.success('Store Requisition deleted successfully.');
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
      setSelectedSr(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete Store Requisition.');
    }
  };

  const handleSaveForm = async (targetStatus: 'draft' | 'submitted', formData: any) => {
    try {
      if (selectedSrForForm) {
        // Edit mode
        await updateSR(selectedSrForForm.id, { 
          status: targetStatus, 
          ...formData 
        } as any);
        toast.success(`Store Requisition updated as ${targetStatus}.`);
        setSelectedSr((prev: any) => ({ 
          ...prev, 
          status: targetStatus, 
          ...formData 
        }));
      } else {
        // Create mode
        await createSR({ 
          requested_by: user?.uid || 'unknown', 
          requested_by_name: user?.displayName || user?.email || 'Staff', 
          status: targetStatus, 
          approved_by: null, 
          ...formData 
        } as any);
        toast.success(`Store Requisition ${targetStatus === 'draft' ? 'saved as draft' : 'submitted successfully'}.`);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to process requisition.');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveSR(id, user?.uid || 'system', user?.email || 'Manager');
      
      const sr = srs.find(s => s.id === id);
      if (sr) {
        await pushCostToPnL({
          docId: `sr-${id}`,
          docNum: sr.sr_number,
          department: sr.department || 'General',
          amount: sr.total_cost || 0,
          date: sr.order_date || sr.created_at,
          description: sr.notes || `Store Requisition ${sr.sr_number}`,
          fbCategory: sr.fb_category || null,
          eventCategory: sr.event_category || null
        });
      }

      toast.success('Requisition approved.');
      setSelectedSr(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve.');
    }
  };

  const handleFulfill = async (sr: any) => {
    try {
      await fulfillSR(sr.id, sr.items.map((i: any) => ({ ...i, qty_fulfilled: i.qty_requested })));
      toast.success('Stock fulfilled and released.');
      setSelectedSr(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fulfill.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      {/* Screen Content Wrapper (hidden when printing) */}
      <div className={s.printHideRoot}>
        {/* Header */}
        <div className={s.header}>
          <div>
            <h1 className={s.title}>Store Requisitions</h1>
            <p className={s.subtitle}>Submit internal supply requests and manage approvals.</p>
          </div>
          <PButton onClick={handleOpenCreate}>
            <Plus size={16} strokeWidth={2} />
            New Requisition
          </PButton>
        </div>

        {/* Filter Bar */}
        <div className={s.filterBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requisition Date</span>
            <input type="date" className={s.filterSelect} value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
            {dateFilter && (
              <PButton variant="secondary" onClick={() => setDateFilter('')} style={{ padding: '0 12px', height: 40, fontSize: 13 }}>
                Clear Filter
              </PButton>
            )}
          </div>
        </div>

        {/* Table & Detail */}
        <div className={s.twoPanel}>
          <StoreRequisitionTable 
            loading={loading}
            filteredSrs={filteredSrs}
            selectedSr={selectedSr}
            setSelectedSr={setSelectedSr}
          />

          <StoreRequisitionDetail 
            selectedSr={selectedSr}
            onClose={() => setSelectedSr(null)}
            onEdit={() => handleOpenEdit(selectedSr)}
            onApprove={() => handleApprove(selectedSr.id)}
            onFulfill={() => handleFulfill(selectedSr)}
            onDelete={() => handleDeleteClick(selectedSr.id)}
            onPrint={handlePrint}
          />
        </div>

        {/* Slider Form */}
        <StoreRequisitionForm 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={selectedSrForForm}
          items={items}
          suppliers={suppliers}
          user={user}
          onSave={handleSaveForm}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal 
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDeleteConfirm}
        />
      </div>

      {/* Printable Template (hidden on screen) */}
      <StoreRequisitionPrint selectedSr={selectedSr} />
    </motion.div>
  );
}
