'use client';

import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePurchaseRequisition } from '@/hooks/purchasing/usePurchaseRequisition';
import { useItems } from '@/hooks/purchasing/useItems';
import { useSuppliers } from '@/hooks/purchasing/useSuppliers';
import { toast } from 'sonner';
import { PButton } from '@/components/purchasing/ui/PButton';
import { useAuth } from '@/context/AuthContext';
import s from '../shared-page.module.css';
import { pushCostToPnL, removeCostFromPnL } from '@/lib/purchasing/pnlHelper';

// Subcomponents
import PurchaseRequisitionTable from './components/PurchaseRequisitionTable';
import PurchaseRequisitionDetail from './components/PurchaseRequisitionDetail';
import PurchaseRequisitionForm from './components/PurchaseRequisitionForm';
import PurchaseRequisitionPrint from './components/PurchaseRequisitionPrint';
import DeleteConfirmModal from '@/components/purchasing/ui/DeleteConfirmModal';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as any } },
};

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function PurchaseRequisitionPage() {
  const { prs, loading, createPR, approvePR, updatePR, deletePR } = usePurchaseRequisition();
  const { items, updateItem } = useItems();
  const { suppliers } = useSuppliers();
  const { user } = useAuth();

  // Selected for view detail
  const [selectedPr, setSelectedPr] = useState<any>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPrForForm, setSelectedPrForForm] = useState<any>(null);

  // Filters
  const [dateFilter, setDateFilter] = useState(() => getTodayStr());

  // Delete modal states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const filteredPrs = useMemo(() => {
    return prs.filter(pr => {
      if (!dateFilter) return true;
      const dateObj = pr.created_at?.toDate ? pr.created_at.toDate() : new Date(pr.created_at);
      const dateString = dateObj.toISOString().split('T')[0];
      return dateString === dateFilter;
    });
  }, [prs, dateFilter]);

  const handleOpenCreate = () => {
    setSelectedPrForForm(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (pr: any) => {
    setSelectedPrForForm(pr);
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
      const pr = prs.find(p => p.id === deleteTargetId);
      if (pr && (pr.status === 'approved' || pr.status === 'received')) {
        await removeCostFromPnL(`pr-${deleteTargetId}`, pr.order_date || pr.created_at);
      }
      await deletePR(deleteTargetId);
      toast.success('Purchase Requisition deleted successfully.');
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
      setSelectedPr(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete Purchase Requisition.');
    }
  };

  const handleSaveForm = async (targetStatus: 'draft' | 'submitted', formData: any) => {
    try {
      if (selectedPrForForm) {
        // Edit mode
        await updatePR(selectedPrForForm.id, { 
          status: targetStatus, 
          ...formData 
        } as any);
        toast.success(`Purchase Requisition updated as ${targetStatus}.`);
        setSelectedPr((prev: any) => ({ 
          ...prev, 
          status: targetStatus, 
          ...formData 
        }));
      } else {
        // Create mode
        await createPR({ 
          linked_sr_id: null, 
          linked_sr_number: null, 
          status: targetStatus, 
          total_actual: 0, 
          requested_by: user?.uid || 'unknown', 
          requested_by_name: user?.displayName || user?.email || 'Purchasing', 
          approved_by: null, 
          ...formData 
        } as any);
        toast.success(`Purchase Requisition ${targetStatus === 'draft' ? 'saved as draft' : 'submitted successfully'}.`);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to process Purchase Requisition.');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approvePR(id, user?.uid || 'system', user?.email || 'Finance Director');
      
      const pr = prs.find(p => p.id === id);
      if (pr) {
        await pushCostToPnL({
          docId: `pr-${id}`,
          docNum: pr.pr_number,
          department: pr.department || 'General',
          amount: pr.total_estimated || 0,
          date: pr.order_date || pr.created_at,
          description: pr.notes || `Purchase Requisition ${pr.pr_number}`,
          fbCategory: pr.fb_category || null,
          eventCategory: pr.event_category || null
        });
      }

      toast.success('Purchase Requisition approved.');
      setSelectedPr(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve.');
    }
  };

  const handleReceive = async (pr: any) => {
    try {
      await updatePR(pr.id, { status: 'received', total_actual: pr.total_estimated });
      for (const item of pr.items) {
        const cat = items.find(i => i.id === item.item_id);
        if (cat) {
          await updateItem(item.item_id, { 
            current_stock: (cat.current_stock || 0) + Number(item.qty), 
            last_purchase_price: item.estimated_price 
          });
        }
      }
      toast.success('Goods received. Inventory updated.');
      setSelectedPr(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to process goods receipt.');
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
            <h1 className={s.title}>Purchase Requisitions</h1>
            <p className={s.subtitle}>Manage external vendor orders, approvals, and goods receiving.</p>
          </div>
          <PButton onClick={handleOpenCreate}>
            <Plus size={16} strokeWidth={2} />
            New PR
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
          <PurchaseRequisitionTable 
            loading={loading}
            filteredPrs={filteredPrs}
            selectedPr={selectedPr}
            setSelectedPr={setSelectedPr}
            deletePR={deletePR}
            onDeleteClick={handleDeleteClick}
          />

          <PurchaseRequisitionDetail 
            selectedPr={selectedPr}
            onClose={() => setSelectedPr(null)}
            onEdit={() => handleOpenEdit(selectedPr)}
            onApprove={() => handleApprove(selectedPr.id)}
            onReceive={() => handleReceive(selectedPr)}
            onDelete={() => handleDeleteClick(selectedPr.id)}
            onPrint={handlePrint}
          />
        </div>

        {/* Slider Form */}
        <PurchaseRequisitionForm 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={selectedPrForForm}
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
      <PurchaseRequisitionPrint selectedPr={selectedPr} />
    </motion.div>
  );
}
