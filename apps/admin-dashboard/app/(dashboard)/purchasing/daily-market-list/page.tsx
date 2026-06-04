'use client';

import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDailyMarketList } from '@/hooks/purchasing/useDailyMarketList';
import { useItems } from '@/hooks/purchasing/useItems';
import { useSuppliers } from '@/hooks/purchasing/useSuppliers';
import { toast } from 'sonner';
import { PButton } from '@/components/purchasing/ui/PButton';
import { useAuth } from '@/context/AuthContext';
import s from '../shared-page.module.css';
import { pushCostToPnL, removeCostFromPnL } from '@/lib/purchasing/pnlHelper';
import { dmlService } from '@/services/purchasing/dmlService';

// Subcomponents
import DailyMarketListTable from './components/DailyMarketListTable';
import DailyMarketListDetail from './components/DailyMarketListDetail';
import DailyMarketListForm from './components/DailyMarketListForm';
import DailyMarketListPrint from './components/DailyMarketListPrint';
import DeleteConfirmModal from '@/components/purchasing/ui/DeleteConfirmModal';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as any } },
};

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DailyMarketListPage() {
  const { dmls, loading, createDML, updateDML, deleteDML } = useDailyMarketList();
  const { items } = useItems();
  const { suppliers } = useSuppliers();
  const { user } = useAuth();

  // Selected for view detail
  const [selectedDml, setSelectedDml] = useState<any>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDmlForForm, setSelectedDmlForForm] = useState<any>(null);

  // Filters
  const [dateFilter, setDateFilter] = useState(() => getTodayStr());

  // Delete modal states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const filteredDmls = useMemo(() => {
    return dmls.filter(dml => {
      if (!dateFilter) return true;
      const dateObj = dml.date?.toDate ? dml.date.toDate() : new Date(dml.date);
      const dateString = dateObj.toISOString().split('T')[0];
      return dateString === dateFilter;
    });
  }, [dmls, dateFilter]);

  const handleOpenCreate = () => {
    setSelectedDmlForForm(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (dml: any) => {
    setSelectedDmlForForm(dml);
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
      const dml = dmls.find(d => d.id === deleteTargetId);
      if (dml && dml.status === 'submitted') {
        await removeCostFromPnL(`dml-${deleteTargetId}`, dml.order_date || dml.date);
      }
      await deleteDML(deleteTargetId);
      toast.success('Daily Market List deleted successfully.');
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
      setSelectedDml(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete Daily Market List.');
    }
  };

  const handleSaveForm = async (targetStatus: 'draft' | 'submitted', formData: any) => {
    try {
      let targetId = selectedDmlForForm?.id || null;

      if (selectedDmlForForm) {
        // Edit mode
        await updateDML(selectedDmlForForm.id, { 
          status: targetStatus, 
          ...formData 
        } as any);
        toast.success(`Daily Market List updated as ${targetStatus}.`);
        setSelectedDml((prev: any) => ({ 
          ...prev, 
          status: targetStatus, 
          ...formData 
        }));
      } else {
        // Create mode
        const newId = await createDML({ 
          date: new Date(formData.order_date), 
          status: targetStatus, 
          submitted_by: user?.uid || 'unknown', 
          submitted_by_name: user?.displayName || user?.email || 'Chef', 
          verified_by: null, 
          verified_by_name: null, 
          ...formData 
        } as any);
        targetId = newId;
        toast.success(`Daily Market List ${targetStatus === 'draft' ? 'saved as draft' : 'submitted successfully'}.`);
      }

      if (targetStatus === 'submitted' && targetId) {
        const freshDoc = await dmlService.getById(targetId);
        if (freshDoc) {
          await pushCostToPnL({
            docId: `dml-${targetId}`,
            docNum: freshDoc.dml_number,
            department: formData.department,
            amount: formData.total_cost,
            date: formData.order_date,
            description: formData.notes || `Daily Market List ${freshDoc.dml_number}`,
            fbCategory: formData.department === 'Food & Beverage' ? formData.fb_category : null,
            eventCategory: formData.department === 'Food & Beverage' ? formData.event_category : null
          });
        }
      } else if (targetStatus === 'draft' && targetId) {
        await removeCostFromPnL(`dml-${targetId}`, formData.order_date);
      }

      setIsFormOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to process Daily Market List.');
    }
  };

  const handleVerify = async (dml: any) => {
    try {
      await updateDML(dml.id, { 
        status: 'submitted', 
        verified_by: user?.uid || 'system', 
        verified_by_name: user?.email || 'F&B Director' 
      });
      
      await pushCostToPnL({
        docId: `dml-${dml.id}`,
        docNum: dml.dml_number,
        department: dml.department || 'Food & Beverage',
        amount: dml.total_cost || 0,
        date: dml.order_date || dml.date,
        description: dml.notes || `Daily Market List ${dml.dml_number}`,
        fbCategory: dml.fb_category || null,
        eventCategory: dml.event_category || null
      });

      toast.success('Daily Market List verified and submitted.');
      setSelectedDml(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify.');
    }
  };

  const handleApprove = async (dml: any) => {
    try {
      await updateDML(dml.id, { 
        status: 'approved', 
        verified_by: user?.uid || 'system', 
        verified_by_name: user?.displayName || user?.email || 'Purchasing' 
      });
      toast.success('Daily Market List approved.');
      setSelectedDml(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve Daily Market List.');
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
            <h1 className={s.title}>Daily Market List</h1>
            <p className={s.subtitle}>Manage daily fresh produce procurement checklists for kitchen operations.</p>
          </div>
          <PButton onClick={handleOpenCreate}>
            <Plus size={16} strokeWidth={2} />
            Generate DML
          </PButton>
        </div>

        {/* Filter Bar */}
        <div className={s.filterBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Market List Date</span>
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
          <DailyMarketListTable 
            loading={loading}
            filteredDmls={filteredDmls}
            selectedDml={selectedDml}
            setSelectedDml={setSelectedDml}
          />

          <DailyMarketListDetail 
            selectedDml={selectedDml}
            onClose={() => setSelectedDml(null)}
            onEdit={() => handleOpenEdit(selectedDml)}
            onVerify={() => handleVerify(selectedDml)}
            onApprove={() => handleApprove(selectedDml)}
            onDelete={() => handleDeleteClick(selectedDml.id)}
            onPrint={handlePrint}
          />
        </div>

        {/* Slider Form */}
        <DailyMarketListForm 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={selectedDmlForForm}
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
      <DailyMarketListPrint selectedDml={selectedDml} />
    </motion.div>
  );
}
