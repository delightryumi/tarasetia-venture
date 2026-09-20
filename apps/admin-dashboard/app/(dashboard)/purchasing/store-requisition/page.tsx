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
import s from './StoreRequisition.module.css';
import { pushCostToPnL, removeCostFromPnL } from '@/lib/purchasing/pnlHelper';
import { formatRupiah } from '@/lib/purchasing/utils';

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
  const { items, updateItem } = useItems();
  const { suppliers } = useSuppliers();
  const { user } = useAuth();

  // Selected for view detail
  const [selectedSr, setSelectedSr] = useState<any>(null);
  
  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSrForForm, setSelectedSrForForm] = useState<any>(null);

  // Filters
  const [dateFilter, setDateFilter] = useState(() => getTodayStr());
  const [statusFilter, setStatusFilter] = useState<'submitted' | 'fulfilled' | null>(null);
  const [activeKpiFilter, setActiveKpiFilter] = useState<'all' | 'pending' | 'fulfilled' | 'value' | null>(null);

  // Delete modal states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const filteredSrs = useMemo(() => {
    let result = srs.filter(sr => {
      if (statusFilter && sr.status !== statusFilter) return false;
      if (!dateFilter) return true;
      const dateObj = sr.created_at?.toDate ? sr.created_at.toDate() : new Date(sr.created_at);
      const dateString = dateObj.toISOString().split('T')[0];
      return dateString === dateFilter;
    });

    if (activeKpiFilter === 'value') {
      result = [...result].sort((a, b) => (Number(b.total_cost) || 0) - (Number(a.total_cost) || 0));
    }
    return result;
  }, [srs, dateFilter, statusFilter, activeKpiFilter]);

  const handleKpiClick = (type: 'all' | 'pending' | 'fulfilled' | 'value') => {
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
      setStatusFilter('submitted');
      setDateFilter('');
    } else if (type === 'fulfilled') {
      setStatusFilter('fulfilled');
      setDateFilter('');
    } else if (type === 'value') {
      setStatusFilter(null);
      setDateFilter('');
    }
  };

  const kpis = useMemo(() => {
    const totalCount = srs.length;
    const pendingCount = srs.filter(s => s.status === 'submitted').length;
    const fulfilledCount = srs.filter(s => s.status === 'fulfilled').length;
    const totalVal = srs.reduce((acc, s) => acc + (Number(s.total_cost) || 0), 0);
    return {
      totalCount,
      pendingCount,
      fulfilledCount,
      totalVal
    };
  }, [srs]);

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
          requested_by_name: user?.displayName || (user as any)?.name || user?.email || 'Staff', 
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
        // Push cost ke P&L
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

        // Kurangi stok master barang saat SR di-approve
        for (const item of (sr.items || [])) {
          const masterItem = items.find(i => i.id === item.item_id);
          if (masterItem) {
            await updateItem(item.item_id, {
              current_stock: Math.max(0, (masterItem.current_stock || 0) - Number(item.qty_requested || 0))
            });
          }
        }
      }

      toast.success('Requisition approved & stok master telah dikurangi.');
      setSelectedSr(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve.');
    }
  };

  const handleFulfill = async (sr: any) => {
    try {
      // Fulfill hanya sebagai konfirmasi fisik barang sudah dikeluarkan
      // Stok sudah dikurangi saat Approve — tidak perlu potong lagi di sini
      await fulfillSR(sr.id, (sr.items || []).map((i: any) => ({ ...i, qty_fulfilled: i.qty_requested })));
      toast.success('Store Requisition marked as fulfilled.');
      setSelectedSr(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fulfill.');
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
        <StoreRequisitionForm 
          isOpen={true}
          onClose={() => setIsFormOpen(false)}
          initialData={selectedSrForForm}
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
              <span className={s.ribbonBadge}>SR</span>
              <span className={s.ribbonDivider}>/</span>
              <span className={s.ribbonTitle}>Internal Stock Disbursement</span>
            </div>
            <div className={s.statusLive}>
              <span className={s.liveDot} />
              <span>Central Store</span>
            </div>
          </div>

          <div className={s.headerRow}>
            <div className={s.titleArea}>
              <div className={s.titleWithBadge}>
                <h1 className={s.title}>Store Requisitions</h1>
                <span className={s.titleBadge}>Internal Control</span>
              </div>
              <p className={s.subtitle}>
                Departmental requisitions, warehouse inventory disbursement, and internal cost control.
              </p>
            </div>
            <div className={s.headerActions}>
              <button type="button" className={s.actionCtaBtn} onClick={handleOpenCreate}>
                <Plus size={16} strokeWidth={2.5} />
                <span>New Store Requisition</span>
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
              title="Klik untuk tampilkan semua request tanpa batas tanggal"
            >
              <div className={s.kpiHeader}>
                <span className={s.kpiLabel}>Total Requisitions</span>
                {activeKpiFilter === 'all' ? (
                  <span className={s.kpiActiveTag}>● Active</span>
                ) : (
                  <span className={s.kpiIcon}>📋</span>
                )}
              </div>
              <div className={s.kpiValueRow}>
                <span className={s.kpiValue}>{kpis.totalCount}</span>
                <span className={s.kpiSub}>Registered requests</span>
              </div>
            </div>

            <div 
              role="button"
              tabIndex={0}
              className={`${s.kpiCard} ${activeKpiFilter === 'pending' ? s.kpiCardActive : ''}`}
              onClick={() => handleKpiClick('pending')}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleKpiClick('pending'); }}
              title="Klik untuk filter request yang menunggu approval manager"
            >
              <div className={s.kpiHeader}>
                <span className={s.kpiLabel}>Pending Approval</span>
                {activeKpiFilter === 'pending' ? (
                  <span className={s.kpiActiveTag}>● Active</span>
                ) : (
                  <span className={s.kpiIcon}>⏳</span>
                )}
              </div>
              <div className={s.kpiValueRow}>
                <span className={s.kpiValue} style={{ color: '#d97706' }}>{kpis.pendingCount}</span>
                <span className={s.kpiSub}>Awaiting manager</span>
              </div>
            </div>

            <div 
              role="button"
              tabIndex={0}
              className={`${s.kpiCard} ${activeKpiFilter === 'fulfilled' ? s.kpiCardActive : ''}`}
              onClick={() => handleKpiClick('fulfilled')}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleKpiClick('fulfilled'); }}
              title="Klik untuk filter request yang sudah fulfilled & issued"
            >
              <div className={s.kpiHeader}>
                <span className={s.kpiLabel}>Fulfilled & Issued</span>
                {activeKpiFilter === 'fulfilled' ? (
                  <span className={s.kpiActiveTag}>● Active</span>
                ) : (
                  <span className={s.kpiIcon}>✅</span>
                )}
              </div>
              <div className={s.kpiValueRow}>
                <span className={s.kpiValue} style={{ color: '#1e4d3a' }}>{kpis.fulfilledCount}</span>
                <span className={s.kpiSub}>Stock released</span>
              </div>
            </div>

            <div 
              role="button"
              tabIndex={0}
              className={`${s.kpiCard} ${activeKpiFilter === 'value' ? s.kpiCardActive : ''}`}
              onClick={() => handleKpiClick('value')}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleKpiClick('value'); }}
              title="Klik untuk mengurutkan requisition berdasarkan nilai pengeluaran tertinggi"
            >
              <div className={s.kpiHeader}>
                <span className={s.kpiLabel}>Total Value</span>
                {activeKpiFilter === 'value' ? (
                  <span className={s.kpiActiveTag}>● Sorted</span>
                ) : (
                  <span className={s.kpiIcon}>💰</span>
                )}
              </div>
              <div className={s.kpiValueRow}>
                <span className={s.kpiValue} style={{ fontSize: '18px' }}>{formatRupiah(kpis.totalVal)}</span>
                <span className={s.kpiSub}>Material cost</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className={s.filterBar}>
          <div className={s.filterGroup}>
            <span className={s.filterLabel}>Requisition Date</span>
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
                {activeKpiFilter === 'all' && `Menampilkan Seluruh Request (${filteredSrs.length} records)`}
                {activeKpiFilter === 'pending' && `Status: Menunggu Approval (${filteredSrs.length} records)`}
                {activeKpiFilter === 'fulfilled' && `Status: Fulfilled & Issued (${filteredSrs.length} records)`}
                {activeKpiFilter === 'value' && `Urutan: Nilai Pengeluaran Tertinggi (${filteredSrs.length} records)`}
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
          <StoreRequisitionTable 
            loading={loading}
            filteredSrs={filteredSrs}
            selectedSr={selectedSr}
            setSelectedSr={setSelectedSr}
            onDelete={handleDeleteClick}
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

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal 
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDeleteConfirm}
        />
      </div>

      {/* Printable Template (hidden on screen) */}
      {selectedSr && <StoreRequisitionPrint selectedSr={selectedSr} />}
    </motion.div>
  );
}
