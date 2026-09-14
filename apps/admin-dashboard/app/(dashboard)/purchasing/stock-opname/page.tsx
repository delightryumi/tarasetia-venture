'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Building2, PackageCheck, AlertCircle, FileSpreadsheet, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStockOpname } from '@/hooks/purchasing/useStockOpname';
import { useItems } from '@/hooks/purchasing/useItems';
import { formatRupiah } from '@/lib/purchasing/utils';
import { PButton } from '@/components/purchasing/ui/PButton';
import s from './stock-opname.module.css';

// Subcomponents
import StockOpnameTable from './components/StockOpnameTable';
import StockOpnameDetail from './components/StockOpnameDetail';
import StockOpnamePrint from './components/StockOpnamePrint';
import DeleteConfirmModal from '@/components/purchasing/ui/DeleteConfirmModal';
import printS from '../PurchasingPrint.module.css';
import { useSettings } from '@/hooks/useSettings';
import { toast } from 'sonner';

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as any } },
};

export default function StockOpnamePage() {
  const router = useRouter();
  const { opnames, loading, approveOpname, deleteOpname } = useStockOpname();
  const { items } = useItems();
  const { property, pos } = useSettings();
  const hotelInfo = property || pos;
  const partnerName = hotelInfo?.name || 'HOTEL & RESORT';

  const [selected, setSelected] = useState<any>(null);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [opnameForPrint, setOpnameForPrint] = useState<any>(null);

  // Delete / Void confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Filtered opnames
  const filteredOpnames = useMemo(() => {
    return opnames.filter(op => {
      if (departmentFilter && (op.department || 'Purchasing').toLowerCase() !== departmentFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchPeriod = (op.period || '').toLowerCase().includes(q);
        const matchDept = (op.department || '').toLowerCase().includes(q);
        const matchAuditor = (op.conducted_by_name || op.conducted_by || '').toLowerCase().includes(q);
        if (!matchPeriod && !matchDept && !matchAuditor) return false;
      }
      return true;
    });
  }, [opnames, departmentFilter, searchQuery]);

  // KPI Metrics
  const totalAudits = opnames.length;
  const totalItemsAudited = opnames.reduce((acc, op) => acc + (op.items?.length || 0), 0);
  const totalVarianceCount = opnames.reduce((acc, op) => {
    return acc + (op.items || []).filter((i: any) => i.variance !== 0).length;
  }, 0);
  const totalNetVarianceValue = opnames.reduce((acc, op) => {
    return acc + (op.items || []).reduce((subAcc: number, i: any) => {
      const price = i.unit_price || 0;
      return subAcc + (i.variance * price);
    }, 0);
  }, 0);

  const handleApprove = async (id: string) => {
    try {
      await approveOpname(id, 'Admin', 'Cost Controller / Head of Dept');
      toast.success('Stock Opname approved and locked successfully.');
      setSelected(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve stock opname.');
    }
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
      await deleteOpname(deleteTargetId);
      toast.success('Stock Opname record successfully voided / deleted.');
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
      setSelected(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete stock opname.');
    }
  };

  const handlePrint = (op: any) => {
    setOpnameForPrint(op);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className={s.container}>
      {/* Screen Content Wrapper (Sembunyikan seluruh UI web saat cetak laporan) */}
      <div className={printS.printHideRoot}>
        {/* Page Header */}
        <div className={s.header}>
        <div className={s.titleArea}>
          <div className={s.badgeEnterprise}>
            <Building2 size={12} />
            Hospitality Inventory Control & Audit
          </div>
          <h1 className={s.title}>Stock Opname</h1>
          <p className={s.subtitle}>
            Physical inventory audit, book stock vs physical count reconciliation, and inventory variance control.
          </p>
        </div>

        <div className={s.actions}>
          <PButton onClick={() => router.push('/purchasing/stock-opname/new?module=purchasing')}>
            <Plus size={16} strokeWidth={2.2} />
            New Stock Opname Count
          </PButton>
        </div>
      </div>

      {/* Enterprise KPI Cards */}
      <div className={s.kpiGrid}>
        <div className={s.kpiCard}>
          <div className={s.kpiHeader}>
            <span>Total Audit Cycles</span>
            <PackageCheck className={s.kpiIcon} />
          </div>
          <div className={s.kpiValue}>{totalAudits}</div>
          <div className={s.kpiSub}>Documented audit count records</div>
        </div>

        <div className={s.kpiCard}>
          <div className={s.kpiHeader}>
            <span>Total Items Audited</span>
            <PackageCheck className={s.kpiIcon} />
          </div>
          <div className={s.kpiValue}>{totalItemsAudited}</div>
          <div className={s.kpiSub}>Active inventory records</div>
        </div>

        <div className={s.kpiCard}>
          <div className={s.kpiHeader}>
            <span>Variance Items</span>
            <AlertCircle className={s.kpiIcon} style={{ color: totalVarianceCount > 0 ? '#e11d48' : '#16a34a' }} />
          </div>
          <div className={s.kpiValue} style={{ color: totalVarianceCount > 0 ? '#e11d48' : '#16a34a' }}>
            {totalVarianceCount} Items
          </div>
          <div className={s.kpiSub}>Requiring verification or adjustment</div>
        </div>

        <div className={s.kpiCard}>
          <div className={s.kpiHeader}>
            <span>Net Variance Value</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: totalNetVarianceValue < 0 ? '#e11d48' : '#16a34a' }}>
              {totalNetVarianceValue < 0 ? 'Shortage' : totalNetVarianceValue > 0 ? 'Surplus' : 'Balanced'}
            </span>
          </div>
          <div className={s.kpiValue} style={{ color: totalNetVarianceValue < 0 ? '#e11d48' : totalNetVarianceValue > 0 ? '#16a34a' : '#0f172a' }}>
            {totalNetVarianceValue > 0 ? '+' : ''}{formatRupiah(totalNetVarianceValue)}
          </div>
          <div className={s.kpiSub}>Net valuation variance impact</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={s.filterBar}>
        <div className={s.filterGroup}>
          <span className={s.filterLabel}>Department:</span>
          <select
            className={s.filterSelect}
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
          >
            <option value="">All Departments & Locations</option>
            <option value="Food">Food & Kitchen (F&B Store)</option>
            <option value="Beverage">Beverage & Bar (F&B Store)</option>
            <option value="Housekeeping">Housekeeping & Linen Store</option>
            <option value="Front Office">Front Office & Guest Supplies</option>
            <option value="Purchasing">Central Store (Purchasing)</option>
          </select>
        </div>

        <div className={s.searchInputWrap}>
          <Search size={15} className={s.searchIcon} />
          <input
            type="text"
            className={s.searchInput}
            placeholder="Search period, department, auditor..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table */}
      <StockOpnameTable
        loading={loading}
        opnames={filteredOpnames}
        selected={selected}
        onSelect={setSelected}
        onDelete={handleDeleteClick}
      />

      {/* Detail Drawer Modal */}
      <AnimatePresence>
        {selected && (
          <StockOpnameDetail
            opname={selected}
            onClose={() => setSelected(null)}
            onApprove={handleApprove}
            onDelete={handleDeleteClick}
            onPrint={() => handlePrint(selected)}
          />
        )}
      </AnimatePresence>

      {/* Delete / Void Confirmation Modal with Admin Password */}
      <DeleteConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteTargetId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Void / Delete Stock Opname"
        subtitle="This action requires administrator authorization (credential verification)."
        confirmText="Void Opname"
      />
      </div>

      {/* Print Template Element (HANYA tampil saat dicetak) */}
      {opnameForPrint && (
        <StockOpnamePrint opname={opnameForPrint} hotelName={partnerName} />
      )}
    </motion.div>
  );
}
