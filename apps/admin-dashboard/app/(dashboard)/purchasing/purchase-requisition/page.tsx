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
import s from './PurchaseRequisition.module.css';
import { pushCostToPnL, removeCostFromPnL } from '@/lib/purchasing/pnlHelper';
import { formatRupiah } from '@/lib/purchasing/utils';

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
  const [statusFilter, setStatusFilter] = useState<'pending' | 'received' | null>(null);
  const [activeKpiFilter, setActiveKpiFilter] = useState<'all' | 'pending' | 'received' | 'value' | null>(null);

  // Delete modal states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const filteredPrs = useMemo(() => {
    let result = prs.filter(pr => {
      if (statusFilter === 'pending' && !(pr.status === 'draft' || pr.status === 'submitted')) return false;
      if (statusFilter === 'received' && !(pr.status === 'received' || pr.status === 'approved')) return false;
      if (!dateFilter) return true;
      const dateObj = pr.created_at?.toDate ? pr.created_at.toDate() : new Date(pr.created_at);
      const dateString = dateObj.toISOString().split('T')[0];
      return dateString === dateFilter;
    });

    if (activeKpiFilter === 'value') {
      result = [...result].sort((a, b) => (Number(b.total_estimated) || 0) - (Number(a.total_estimated) || 0));
    }
    return result;
  }, [prs, dateFilter, statusFilter, activeKpiFilter]);

  const handleKpiClick = (type: 'all' | 'pending' | 'received' | 'value') => {
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
    } else if (type === 'received') {
      setStatusFilter('received');
      setDateFilter('');
    } else if (type === 'value') {
      setStatusFilter(null);
      setDateFilter('');
    }
  };

  const kpis = useMemo(() => {
    const totalCount = prs.length;
    const pendingCount = prs.filter(p => p.status === 'draft' || p.status === 'submitted').length;
    const receivedCount = prs.filter(p => p.status === 'received').length;
    const totalVal = prs.reduce((acc, p) => acc + (Number(p.total_estimated) || 0), 0);
    return {
      totalCount,
      pendingCount,
      receivedCount,
      totalVal
    };
  }, [prs]);

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
          requested_by_name: user?.displayName || (user as any)?.name || user?.email || 'Purchasing', 
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
          eventCategory: pr.event_category || null,
          items: pr.items || []
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
      toast.success('Goods received, catalog stock and last purchase price updated.');
      setSelectedPr(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to receive goods.');
    }
  };

  const handleUpdatePaymentStatus = async (itemIndex: number, status: string) => {
    if (!selectedPr) return;
    try {
      const updatedItems = [...(selectedPr.items || [])];
      if (updatedItems[itemIndex]) {
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          paymentStatus: status
        };
      }
      
      await updatePR(selectedPr.id, { items: updatedItems });
      
      const newPr = { ...selectedPr, items: updatedItems };
      setSelectedPr(newPr);

      if (newPr.status === 'approved' || newPr.status === 'received') {
        await pushCostToPnL({
          docId: `pr-${newPr.id}`,
          docNum: newPr.pr_number,
          department: newPr.department || 'General',
          amount: newPr.total_estimated || 0,
          date: newPr.order_date || newPr.created_at,
          description: newPr.notes || `Purchase Requisition ${newPr.pr_number}`,
          fbCategory: newPr.fb_category || null,
          eventCategory: newPr.event_category || null,
          items: updatedItems
        });
      }
      
      toast.success('Payment status updated successfully.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to update payment status.');
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
        <PurchaseRequisitionForm 
          isOpen={true}
          onClose={() => setIsFormOpen(false)}
          initialData={selectedPrForForm}
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
              <span className={s.ribbonBadge}>PR</span>
              <span className={s.ribbonDivider}>/</span>
              <span className={s.ribbonTitle}>External Supplier Procurement</span>
            </div>
            <div className={s.statusLive}>
              <span className={s.liveDot} />
              Vendor Operations
            </div>
          </div>

          <div className={s.headerRow}>
            <div className={s.titleArea}>
              <div className={s.titleWithBadge}>
                <h1 className={s.title}>Purchase Requisitions</h1>
                <span className={s.titleBadge}>Supplier Orders</span>
              </div>
              <p className={s.subtitle}>
                Manage external vendor orders, financial approvals, receiving inspections, and warehouse intake.
              </p>
            </div>
            <div className={s.headerActions}>
              <button type="button" className={s.actionCtaBtn} onClick={handleOpenCreate}>
                <Plus size={16} strokeWidth={2.5} />
                <span>New Purchase Requisition</span>
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
                  <span className={s.kpiIcon}>📦</span>
                )}
              </div>
              <div className={s.kpiValueRow}>
                <span className={s.kpiValue}>{kpis.totalCount}</span>
                <span className={s.kpiSub}>Registered vendor orders</span>
              </div>
            </div>

            <div 
              role="button"
              tabIndex={0}
              className={`${s.kpiCard} ${activeKpiFilter === 'pending' ? s.kpiCardActive : ''}`}
              onClick={() => handleKpiClick('pending')}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleKpiClick('pending'); }}
              title="Klik untuk filter PR yang menunggu persetujuan / verifikasi"
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
                <span className={s.kpiSub}>Awaiting financial sign-off</span>
              </div>
            </div>

            <div 
              role="button"
              tabIndex={0}
              className={`${s.kpiCard} ${activeKpiFilter === 'received' ? s.kpiCardActive : ''}`}
              onClick={() => handleKpiClick('received')}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleKpiClick('received'); }}
              title="Klik untuk filter PR yang barangnya sudah diterima"
            >
              <div className={s.kpiHeader}>
                <span className={s.kpiLabel}>Goods Received</span>
                {activeKpiFilter === 'received' ? (
                  <span className={s.kpiActiveTag}>● Active</span>
                ) : (
                  <span className={s.kpiIcon}>📥</span>
                )}
              </div>
              <div className={s.kpiValueRow}>
                <span className={s.kpiValue} style={{ color: '#1e4d3a' }}>{kpis.receivedCount}</span>
                <span className={s.kpiSub}>Stock accepted & catalogued</span>
              </div>
            </div>

            <div 
              role="button"
              tabIndex={0}
              className={`${s.kpiCard} ${activeKpiFilter === 'value' ? s.kpiCardActive : ''}`}
              onClick={() => handleKpiClick('value')}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleKpiClick('value'); }}
              title="Klik untuk mengurutkan PR berdasarkan nilai estimasi pengadaan tertinggi"
            >
              <div className={s.kpiHeader}>
                <span className={s.kpiLabel}>Procurement Value</span>
                {activeKpiFilter === 'value' ? (
                  <span className={s.kpiActiveTag}>● Sorted</span>
                ) : (
                  <span className={s.kpiIcon}>💰</span>
                )}
              </div>
              <div className={s.kpiValueRow}>
                <span className={s.kpiValue} style={{ fontSize: '18px' }}>{formatRupiah(kpis.totalVal)}</span>
                <span className={s.kpiSub}>Total estimated commitment</span>
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
                {activeKpiFilter === 'all' && `Menampilkan Seluruh Requisition (${filteredPrs.length} records)`}
                {activeKpiFilter === 'pending' && `Status: Menunggu Persetujuan (${filteredPrs.length} records)`}
                {activeKpiFilter === 'received' && `Status: Barang Diterima / Approved (${filteredPrs.length} records)`}
                {activeKpiFilter === 'value' && `Urutan: Nilai Estimasi Tertinggi (${filteredPrs.length} records)`}
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
      {selectedPr && <PurchaseRequisitionPrint selectedPr={selectedPr} />}
    </motion.div>
  );
}
