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
import s from './DailyMarketList.module.css';
import { pushCostToPnL, removeCostFromPnL } from '@/lib/purchasing/pnlHelper';
import { dmlService } from '@/services/purchasing/dmlService';
import { formatRupiah } from '@/lib/purchasing/utils';

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
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'tempo' | null>(null);
  const [activeKpiFilter, setActiveKpiFilter] = useState<'all' | 'pending' | 'cost' | 'tempo' | null>(null);

  // Delete modal states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const filteredDmls = useMemo(() => {
    let result = dmls.filter(dml => {
      if (statusFilter === 'pending' && !(dml.status === 'draft' || dml.status === 'submitted')) return false;
      if (statusFilter === 'approved' && (dml.status as any) !== 'approved' && dml.status !== 'received') return false;
      if (statusFilter === 'tempo') {
        const hasTempo = (dml.items || []).some((i: any) => i.paymentStatus === 'tempo');
        if (!hasTempo) return false;
      }
      if (!dateFilter) return true;
      const dateObj = dml.date?.toDate ? dml.date.toDate() : new Date(dml.date);
      const dateString = dateObj.toISOString().split('T')[0];
      return dateString === dateFilter;
    });

    if (activeKpiFilter === 'cost') {
      result = [...result].sort((a, b) => (Number(b.total_cost) || 0) - (Number(a.total_cost) || 0));
    }
    return result;
  }, [dmls, dateFilter, statusFilter, activeKpiFilter]);

  const handleKpiClick = (type: 'all' | 'pending' | 'cost' | 'tempo') => {
    if (activeKpiFilter === type) {
      setActiveKpiFilter(null);
      setStatusFilter(null);
      setDateFilter(getTodayStr());
      return;
    }
    setActiveKpiFilter(type);
    if (type === 'all') {
      setStatusFilter(null);
      setDateFilter('');
    } else if (type === 'pending') {
      setStatusFilter('pending');
      setDateFilter('');
    } else if (type === 'cost') {
      setStatusFilter('approved');
      setDateFilter('');
    } else if (type === 'tempo') {
      setStatusFilter('tempo');
      setDateFilter('');
    }
  };

  const kpis = useMemo(() => {
    const totalCount = dmls.length;
    const pendingCount = dmls.filter(d => d.status === 'draft' || d.status === 'submitted').length;
    const totalVal = dmls.reduce((acc, d) => acc + (Number(d.total_cost) || 0), 0);
    let tempoCost = 0;
    dmls.forEach(d => {
      (d.items || []).forEach((i: any) => {
        if (i.paymentStatus === 'tempo') {
          tempoCost += Number(i.total || ((Number(i.qty_ordered || i.qty || 0)) * (Number(i.unit_price || 0))));
        }
      });
    });
    return {
      totalCount,
      pendingCount,
      totalVal,
      tempoCost
    };
  }, [dmls]);

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
          submitted_by_name: user?.displayName || (user as any)?.name || user?.email || 'Chef', 
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
            eventCategory: formData.department === 'Food & Beverage' ? formData.event_category : null,
            items: freshDoc.items || []
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
        eventCategory: dml.event_category || null,
        items: dml.items || []
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
        status: 'approved' as any, 
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
        eventCategory: dml.event_category || null,
        items: dml.items || []
      });

      toast.success('Daily Market List approved and posted to Cost of Sales.');
      setSelectedDml(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve.');
    }
  };

  const handleUpdatePaymentStatus = async (itemIndex: number, newStatus: string) => {
    if (!selectedDml) return;
    try {
      const updatedItems = [...selectedDml.items];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        paymentStatus: newStatus
      };

      await updateDML(selectedDml.id, { items: updatedItems } as any);

      setSelectedDml((prev: any) => ({
        ...prev,
        items: updatedItems
      }));

      if (selectedDml.status === 'submitted' || selectedDml.status === 'approved') {
        await pushCostToPnL({
          docId: `dml-${selectedDml.id}`,
          docNum: selectedDml.dml_number,
          department: selectedDml.department || 'Food & Beverage',
          amount: selectedDml.total_cost || 0,
          date: selectedDml.order_date || selectedDml.date,
          description: selectedDml.notes || `Daily Market List ${selectedDml.dml_number}`,
          fbCategory: selectedDml.fb_category || null,
          eventCategory: selectedDml.event_category || null,
          items: updatedItems
        });
      }

      toast.success(`Payment status updated to ${newStatus.toUpperCase()}`);
    } catch (error) {
      console.error("Failed to update item payment status:", error);
      toast.error("Failed to update payment status");
    }
  };

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // FULL PAGE DOCUMENT VIEW (not a popup)
  if (isFormOpen) {
    return (
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className={s.container}>
        <DailyMarketListForm 
          isOpen={true}
          onClose={() => setIsFormOpen(false)}
          initialData={selectedDmlForForm}
          items={items}
          suppliers={suppliers}
          user={user}
          onSave={handleSaveForm}
        />
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className={s.container}>
      {/* Screen Content Wrapper (hidden when printing) */}
      <div className={`${s.printHideRoot} no-print`}>
        {/* Header Card */}
        <div className={s.headerCard}>
          <div className={s.topRibbon}>
            <div className={s.ribbonLeft}>
              <span className={s.ribbonBadge}>DML</span>
              <span className={s.ribbonDivider}>/</span>
              <span className={s.ribbonTitle}>Culinary Direct Purchasing</span>
            </div>
            <div className={s.statusLive}>
              <span className={s.liveDot} />
              Kitchen Operations
            </div>
          </div>

          <div className={s.headerRow}>
            <div className={s.titleArea}>
              <div className={s.titleWithBadge}>
                <h1 className={s.title}>Daily Market List</h1>
                <span className={s.titleBadge}>Direct Culinary Cost</span>
              </div>
              <p className={s.subtitle}>
                Daily fresh produce procurement checklist, market receipts, and direct food cost control.
              </p>
            </div>
            <div className={s.headerActions}>
              <button type="button" className={s.actionCtaBtn} onClick={handleOpenCreate}>
                <Plus size={16} strokeWidth={2.5} />
                <span>New Daily Market List</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards - Clickable Filters */}
          <div className={s.kpiGrid}>
            <div 
              role="button"
              tabIndex={0}
              className={`${s.kpiCard} ${activeKpiFilter === 'all' ? s.kpiCardActive : ''}`}
              onClick={() => handleKpiClick('all')}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleKpiClick('all'); }}
              title="Klik untuk tampilkan semua lembar belanja pasar tanpa batas tanggal"
            >
              <div className={s.kpiHeader}>
                <span className={s.kpiLabel}>Total Market Lists</span>
                {activeKpiFilter === 'all' ? (
                  <span className={s.kpiActiveTag}>● Active</span>
                ) : (
                  <span className={s.kpiIcon}>🥬</span>
                )}
              </div>
              <div className={s.kpiValueRow}>
                <span className={s.kpiValue}>{kpis.totalCount}</span>
                <span className={s.kpiSub}>Registered procurement sheets</span>
              </div>
            </div>

            <div 
              role="button"
              tabIndex={0}
              className={`${s.kpiCard} ${activeKpiFilter === 'pending' ? s.kpiCardActive : ''}`}
              onClick={() => handleKpiClick('pending')}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleKpiClick('pending'); }}
              title="Klik untuk filter DML yang menunggu verifikasi kitchen / finance"
            >
              <div className={s.kpiHeader}>
                <span className={s.kpiLabel}>Pending Review</span>
                {activeKpiFilter === 'pending' ? (
                  <span className={s.kpiActiveTag}>● Active</span>
                ) : (
                  <span className={s.kpiIcon}>⏳</span>
                )}
              </div>
              <div className={s.kpiValueRow}>
                <span className={s.kpiValue} style={{ color: '#d97706' }}>{kpis.pendingCount}</span>
                <span className={s.kpiSub}>Draft / Awaiting verification</span>
              </div>
            </div>

            <div 
              role="button"
              tabIndex={0}
              className={`${s.kpiCard} ${activeKpiFilter === 'cost' ? s.kpiCardActive : ''}`}
              onClick={() => handleKpiClick('cost')}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleKpiClick('cost'); }}
              title="Klik untuk filter DML yang sudah disetujui (Direct Cost of Sales)"
            >
              <div className={s.kpiHeader}>
                <span className={s.kpiLabel}>Direct Culinary Cost</span>
                {activeKpiFilter === 'cost' ? (
                  <span className={s.kpiActiveTag}>● Approved</span>
                ) : (
                  <span className={s.kpiIcon}>💰</span>
                )}
              </div>
              <div className={s.kpiValueRow}>
                <span className={s.kpiValue} style={{ fontSize: '18px', color: '#1e4d3a' }}>{formatRupiah(kpis.totalVal)}</span>
                <span className={s.kpiSub}>Direct Cost of Sales (Food)</span>
              </div>
            </div>

            <div 
              role="button"
              tabIndex={0}
              className={`${s.kpiCard} ${activeKpiFilter === 'tempo' ? s.kpiCardActive : ''}`}
              onClick={() => handleKpiClick('tempo')}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleKpiClick('tempo'); }}
              title="Klik untuk filter DML yang memiliki tagihan Tempo / AP Pasar"
            >
              <div className={s.kpiHeader}>
                <span className={s.kpiLabel}>Tempo / Credit Cost</span>
                {activeKpiFilter === 'tempo' ? (
                  <span className={s.kpiActiveTag}>● Tempo</span>
                ) : (
                  <span className={s.kpiIcon}>💳</span>
                )}
              </div>
              <div className={s.kpiValueRow}>
                <span className={s.kpiValue} style={{ fontSize: '18px', color: '#dc2626' }}>{formatRupiah(kpis.tempoCost)}</span>
                <span className={s.kpiSub}>Market payables outstanding</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className={s.filterBar}>
          <div className={s.filterGroup}>
            <span className={s.filterLabel}>Market List Date</span>
            <input 
              type="date" 
              className={s.filterInput} 
              value={dateFilter} 
              onChange={e => {
                setDateFilter(e.target.value);
                setActiveKpiFilter(null);
              }} 
            />
          </div>
          <div className={s.filterActions}>
            <button 
              type="button" 
              className={s.filterTodayBtn}
              onClick={() => {
                setDateFilter(getTodayStr());
                setActiveKpiFilter(null);
              }}
            >
              Today
            </button>
            {dateFilter && (
              <button 
                type="button" 
                className={s.filterClearBtn}
                onClick={() => setDateFilter('')}
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Banner */}
        {activeKpiFilter && (
          <div className={s.activeFilterBanner}>
            <div className={s.activeFilterText}>
              <span>⚡ Filter Aktif:</span>
              <strong>
                {activeKpiFilter === 'all' && `Menampilkan Seluruh Daily Market List (${filteredDmls.length} records)`}
                {activeKpiFilter === 'pending' && `Status: Menunggu Review / Approval (${filteredDmls.length} records)`}
                {activeKpiFilter === 'cost' && `Status: Approved Direct Food Cost (${filteredDmls.length} records)`}
                {activeKpiFilter === 'tempo' && `Item Tagihan Tempo / AP Pasar (${filteredDmls.length} records)`}
              </strong>
            </div>
            <button 
              type="button" 
              className={s.activeFilterResetBtn}
              onClick={() => {
                setActiveKpiFilter(null);
                setStatusFilter(null);
                setDateFilter(getTodayStr());
              }}
            >
              Reset Filter
            </button>
          </div>
        )}

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
            onUpdatePaymentStatus={handleUpdatePaymentStatus}
          />
        </div>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal 
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDeleteConfirm}
        />
      </div>

      {/* Printable Template (hidden on screen) */}
      {selectedDml && <DailyMarketListPrint selectedDml={selectedDml} />}
    </motion.div>
  );
}
