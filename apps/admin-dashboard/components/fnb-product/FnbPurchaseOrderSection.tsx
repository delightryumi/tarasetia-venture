'use client';

import React, { useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useDailyMarketList } from '@/hooks/purchasing/useDailyMarketList';
import { useStoreRequisition } from '@/hooks/purchasing/useStoreRequisition';
import { usePurchaseRequisition } from '@/hooks/purchasing/usePurchaseRequisition';
import { useItems } from '@/hooks/purchasing/useItems';
import { useSuppliers } from '@/hooks/purchasing/useSuppliers';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { pushCostToPnL, removeCostFromPnL } from '@/lib/purchasing/pnlHelper';
import { dmlService } from '@/services/purchasing/dmlService';
import s from '@/app/(dashboard)/purchasing/shared-page.module.css';

// Existing tables + forms + print (reused from purchasing)
import DailyMarketListTable from '@/app/(dashboard)/purchasing/daily-market-list/components/DailyMarketListTable';
import DailyMarketListForm from '@/app/(dashboard)/purchasing/daily-market-list/components/DailyMarketListForm';
import DailyMarketListPrint from '@/app/(dashboard)/purchasing/daily-market-list/components/DailyMarketListPrint';
import StoreRequisitionTable from '@/app/(dashboard)/purchasing/store-requisition/components/StoreRequisitionTable';
import StoreRequisitionForm from '@/app/(dashboard)/purchasing/store-requisition/components/StoreRequisitionForm';
import StoreRequisitionPrint from '@/app/(dashboard)/purchasing/store-requisition/components/StoreRequisitionPrint';
import PurchaseRequisitionTable from '@/app/(dashboard)/purchasing/purchase-requisition/components/PurchaseRequisitionTable';
import PurchaseRequisitionForm from '@/app/(dashboard)/purchasing/purchase-requisition/components/PurchaseRequisitionForm';
import PurchaseRequisitionPrint from '@/app/(dashboard)/purchasing/purchase-requisition/components/PurchaseRequisitionPrint';
import DeleteConfirmModal from '@/components/purchasing/ui/DeleteConfirmModal';

// Dept-specific detail panels
import DeptDMLDetail from '@/components/purchasing/dept/DeptDMLDetail';
import DeptSRDetail from '@/components/purchasing/dept/DeptSRDetail';
import DeptPRDetail from '@/components/purchasing/dept/DeptPRDetail';

const DEPARTMENT = 'Food & Beverage';

interface FnbPurchaseOrderSectionProps {
  activeTab: 'dml' | 'sr' | 'pr';
  dateFilter: string;
}

export interface FnbPurchaseOrderSectionRef {
  openCreateForm: () => void;
}

export const FnbPurchaseOrderSection = forwardRef<FnbPurchaseOrderSectionRef, FnbPurchaseOrderSectionProps>(
  ({ activeTab, dateFilter }, ref) => {
    const { user } = useAuth();

    // ── Purchase Order hooks ──
    const { dmls, loading: dmlLoading, createDML, updateDML, deleteDML } = useDailyMarketList();
    const [selectedDml, setSelectedDml] = useState<any>(null);
    const [dmlFormOpen, setDmlFormOpen] = useState(false);
    const [selectedDmlForForm, setSelectedDmlForForm] = useState<any>(null);
    const [dmlDeleteOpen, setDmlDeleteOpen] = useState(false);
    const [dmlDeleteId, setDmlDeleteId] = useState<string | null>(null);

    const { srs, loading: srLoading, createSR, updateSR, deleteSR } = useStoreRequisition();
    const [selectedSr, setSelectedSr] = useState<any>(null);
    const [srFormOpen, setSrFormOpen] = useState(false);
    const [selectedSrForForm, setSelectedSrForForm] = useState<any>(null);
    const [srDeleteOpen, setSrDeleteOpen] = useState(false);
    const [srDeleteId, setSrDeleteId] = useState<string | null>(null);

    const { prs, loading: prLoading, createPR, updatePR, deletePR } = usePurchaseRequisition();
    const [selectedPr, setSelectedPr] = useState<any>(null);
    const [prFormOpen, setPrFormOpen] = useState(false);
    const [selectedPrForForm, setSelectedPrForForm] = useState<any>(null);
    const [prDeleteOpen, setPrDeleteOpen] = useState(false);
    const [prDeleteId, setPrDeleteId] = useState<string | null>(null);

    const { items } = useItems();
    const { suppliers } = useSuppliers();

    // Expose openCreateForm via ref
    useImperativeHandle(ref, () => ({
      openCreateForm() {
        if (activeTab === 'dml') {
          setSelectedDmlForForm(null);
          setDmlFormOpen(true);
        } else if (activeTab === 'sr') {
          setSelectedSrForForm(null);
          setSrFormOpen(true);
        } else if (activeTab === 'pr') {
          setSelectedPrForForm(null);
          setPrFormOpen(true);
        }
      }
    }));

    // ── Filtered by department + date
    const filteredDmls = useMemo(() =>
      dmls.filter(d => {
        if (d.department !== DEPARTMENT) return false;
        if (!dateFilter) return true;
        const dateObj = d.date?.toDate ? d.date.toDate() : new Date(d.date);
        return dateObj.toISOString().split('T')[0] === dateFilter;
      }),
      [dmls, dateFilter]
    );

    const filteredSrs = useMemo(() =>
      srs.filter(s => {
        if (s.department !== DEPARTMENT) return false;
        if (!dateFilter) return true;
        const dateObj = s.created_at?.toDate ? s.created_at.toDate() : new Date(s.created_at);
        return dateObj.toISOString().split('T')[0] === dateFilter;
      }),
      [srs, dateFilter]
    );

    const filteredPrs = useMemo(() =>
      prs.filter(p => {
        if (p.department !== DEPARTMENT) return false;
        if (!dateFilter) return true;
        const dateObj = p.created_at?.toDate ? p.created_at.toDate() : new Date(p.created_at);
        return dateObj.toISOString().split('T')[0] === dateFilter;
      }),
      [prs, dateFilter]
    );

    // ── DML Handlers
    const handleDmlSave = async (targetStatus: 'draft' | 'submitted', formData: any) => {
      try {
        let targetId = selectedDmlForForm?.id || null;
        if (selectedDmlForForm) {
          await updateDML(selectedDmlForForm.id, { status: targetStatus, ...formData } as any);
          toast.success(`DML updated as ${targetStatus}.`);
          setSelectedDml((prev: any) => ({ ...prev, status: targetStatus, ...formData }));
        } else {
          const newId = await createDML({
            date: new Date(formData.order_date),
            status: targetStatus,
            department: DEPARTMENT,
            submitted_by: user?.uid || 'unknown',
            submitted_by_name: user?.displayName || user?.email || DEPARTMENT,
            verified_by: null, verified_by_name: null,
            ...formData,
          } as any);
          targetId = newId;
          toast.success(`DML ${targetStatus === 'draft' ? 'disimpan sebagai draft' : 'disubmit'}.`);
        }
        if (targetStatus === 'submitted' && targetId) {
          const freshDoc = await dmlService.getById(targetId);
          if (freshDoc) {
            await pushCostToPnL({
              docId: `dml-${targetId}`,
              docNum: freshDoc.dml_number,
              department: DEPARTMENT,
              amount: formData.total_cost,
              date: formData.order_date,
              description: formData.notes || `Daily Market List ${freshDoc.dml_number}`,
              fbCategory: null, eventCategory: null,
            });
          }
        } else if (targetStatus === 'draft' && targetId) {
          await removeCostFromPnL(`dml-${targetId}`, formData.order_date);
        }
        setDmlFormOpen(false);
      } catch (err: any) {
        toast.error(err.message || 'Gagal menyimpan DML.');
      }
    };

    const handleDmlDeleteConfirm = async (password: string) => {
      if (password !== 'admin123' && password !== 'owner123') {
        toast.error('Password salah!'); return;
      }
      if (!dmlDeleteId) return;
      try {
        await deleteDML(dmlDeleteId);
        toast.success('DML dihapus.');
        setDmlDeleteOpen(false); setDmlDeleteId(null); setSelectedDml(null);
      } catch (err: any) { toast.error(err.message || 'Gagal menghapus DML.'); }
    };

    // ── SR Handlers
    const handleSrSave = async (targetStatus: 'draft' | 'submitted', formData: any) => {
      try {
        if (selectedSrForForm) {
          await updateSR(selectedSrForForm.id, { status: targetStatus, ...formData } as any);
          toast.success(`SR updated as ${targetStatus}.`);
          setSelectedSr((prev: any) => ({ ...prev, status: targetStatus, ...formData }));
        } else {
          await createSR({
            requested_by: user?.uid || 'unknown',
            requested_by_name: user?.displayName || user?.email || DEPARTMENT,
            department: DEPARTMENT,
            status: targetStatus,
            approved_by: null,
            ...formData,
          } as any);
          toast.success(`SR ${targetStatus === 'draft' ? 'disimpan sebagai draft' : 'disubmit'}.`);
        }
        setSrFormOpen(false);
      } catch (err: any) { toast.error(err.message || 'Gagal menyimpan SR.'); }
    };

    const handleSrDeleteConfirm = async (password: string) => {
      if (password !== 'admin123' && password !== 'owner123') {
        toast.error('Password salah!'); return;
      }
      if (!srDeleteId) return;
      try {
        await deleteSR(srDeleteId);
        toast.success('SR dihapus.');
        setSrDeleteOpen(false); setSrDeleteId(null); setSelectedSr(null);
      } catch (err: any) { toast.error(err.message || 'Gagal menghapus SR.'); }
    };

    // ── PR Handlers
    const handlePrSave = async (targetStatus: 'draft' | 'submitted', formData: any) => {
      try {
        if (selectedPrForForm) {
          await updatePR(selectedPrForForm.id, { status: targetStatus, ...formData } as any);
          toast.success(`PR updated as ${targetStatus}.`);
          setSelectedPr((prev: any) => ({ ...prev, status: targetStatus, ...formData }));
        } else {
          await createPR({
            linked_sr_id: null, linked_sr_number: null,
            status: targetStatus, total_actual: 0,
            requested_by: user?.uid || 'unknown',
            requested_by_name: user?.displayName || user?.email || DEPARTMENT,
            department: DEPARTMENT,
            approved_by: null,
            ...formData,
          } as any);
          toast.success(`PR ${targetStatus === 'draft' ? 'disimpan sebagai draft' : 'disubmit'}.`);
        }
        setPrFormOpen(false);
      } catch (err: any) { toast.error(err.message || 'Gagal menyimpan PR.'); }
    };

    const handlePrDeleteConfirm = async (password: string) => {
      if (password !== 'admin123' && password !== 'owner123') {
        toast.error('Password salah!'); return;
      }
      if (!prDeleteId) return;
      try {
        await deletePR(prDeleteId);
        toast.success('PR dihapus.');
        setPrDeleteOpen(false); setPrDeleteId(null); setSelectedPr(null);
      } catch (err: any) { toast.error(err.message || 'Gagal menghapus PR.'); }
    };

    return (
      <>
        {/* TAB 3: DML */}
        {activeTab === 'dml' && (
          <div className={s.twoPanel}>
            <DailyMarketListTable
              loading={dmlLoading}
              filteredDmls={filteredDmls}
              selectedDml={selectedDml}
              setSelectedDml={setSelectedDml}
            />
            <DeptDMLDetail
              selectedDml={selectedDml}
              onClose={() => setSelectedDml(null)}
              onEdit={() => { setSelectedDmlForForm(selectedDml); setDmlFormOpen(true); }}
              onDelete={() => { setDmlDeleteId(selectedDml.id); setDmlDeleteOpen(true); }}
              onPrint={() => window.print()}
            />
          </div>
        )}

        {/* TAB 4: SR */}
        {activeTab === 'sr' && (
          <div className={s.twoPanel}>
            <StoreRequisitionTable
              loading={srLoading}
              filteredSrs={filteredSrs}
              selectedSr={selectedSr}
              setSelectedSr={setSelectedSr}
            />
            <DeptSRDetail
              selectedSr={selectedSr}
              onClose={() => setSelectedSr(null)}
              onEdit={() => { setSelectedSrForForm(selectedSr); setSrFormOpen(true); }}
              onDelete={() => { setSrDeleteId(selectedSr.id); setSrDeleteOpen(true); }}
              onPrint={() => window.print()}
            />
          </div>
        )}

        {/* TAB 5: PR */}
        {activeTab === 'pr' && (
          <div className={s.twoPanel}>
            <PurchaseRequisitionTable
              loading={prLoading}
              filteredPrs={filteredPrs}
              selectedPr={selectedPr}
              setSelectedPr={setSelectedPr}
            />
            <DeptPRDetail
              selectedPr={selectedPr}
              onClose={() => setSelectedPr(null)}
              onEdit={() => { setSelectedPrForForm(selectedPr); setPrFormOpen(true); }}
              onDelete={() => { setPrDeleteId(selectedPr.id); setPrDeleteOpen(true); }}
              onPrint={() => window.print()}
            />
          </div>
        )}

        {/* Forms */}
        <DailyMarketListForm
          isOpen={dmlFormOpen}
          onClose={() => setDmlFormOpen(false)}
          initialData={selectedDmlForForm}
          items={items}
          suppliers={suppliers}
          user={user}
          onSave={handleDmlSave}
        />
        <StoreRequisitionForm
          isOpen={srFormOpen}
          onClose={() => setSrFormOpen(false)}
          initialData={selectedSrForForm}
          items={items}
          suppliers={suppliers}
          user={user}
          onSave={handleSrSave}
        />
        <PurchaseRequisitionForm
          isOpen={prFormOpen}
          onClose={() => setPrFormOpen(false)}
          initialData={selectedPrForForm}
          items={items}
          suppliers={suppliers}
          user={user}
          onSave={handlePrSave}
        />

        {/* Delete Modals */}
        <DeleteConfirmModal isOpen={dmlDeleteOpen} onClose={() => setDmlDeleteOpen(false)} onConfirm={handleDmlDeleteConfirm} />
        <DeleteConfirmModal isOpen={srDeleteOpen} onClose={() => setSrDeleteOpen(false)} onConfirm={handleSrDeleteConfirm} />
        <DeleteConfirmModal isOpen={prDeleteOpen} onClose={() => setPrDeleteOpen(false)} onConfirm={handlePrDeleteConfirm} />

        {/* Print templates */}
        <DailyMarketListPrint selectedDml={selectedDml} />
        <StoreRequisitionPrint selectedSr={selectedSr} />
        <PurchaseRequisitionPrint selectedPr={selectedPr} />
      </>
    );
  }
);

FnbPurchaseOrderSection.displayName = 'FnbPurchaseOrderSection';
