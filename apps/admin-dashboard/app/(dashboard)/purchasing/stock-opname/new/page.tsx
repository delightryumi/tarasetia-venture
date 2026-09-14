'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, FileSpreadsheet, Printer, RotateCcw, CheckCheck, Search, Filter, AlertTriangle, Save, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStockOpname } from '@/hooks/purchasing/useStockOpname';
import { useItems } from '@/hooks/purchasing/useItems';
import { useStoreRequisition } from '@/hooks/purchasing/useStoreRequisition';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { toast } from 'sonner';
import { formatRupiah } from '@/lib/purchasing/utils';
import { PButton } from '@/components/purchasing/ui/PButton';
import s from './stock-opname-form.module.css';
import printS from '../../PurchasingPrint.module.css';
import { exportStockOpnameToCSV } from '@/lib/purchasing/exportStockOpname';
import StockOpnamePrint from '../components/StockOpnamePrint';

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as any } },
};

export default function PerformOpnamePage() {
  const router = useRouter();
  const { opnames, createOpname } = useStockOpname();
  const { items, updateItem } = useItems();
  const { srs } = useStoreRequisition();
  const { user } = useAuth();
  const { property, pos } = useSettings();
  const hotelInfo = property || pos;
  const partnerName = hotelInfo?.name || 'HOTEL & RESORT';

  const [activeDept, setActiveDept] = useState('Purchasing');
  const [auditPeriod, setAuditPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});

  // Filter & Search dalam count sheet
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [varianceFilter, setVarianceFilter] = useState<'all' | 'variance_only' | 'surplus' | 'shortage' | 'match'>('all');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Set default department sesuai role pengguna
  useEffect(() => {
    if (user) {
      const role = (user.role || '').toLowerCase();
      let defaultDept = 'Purchasing';
      if (role.includes('food') || role.includes('kitchen') || role.includes('beverage')) {
        defaultDept = 'Food';
      } else if (role.includes('housekeeping')) {
        defaultDept = 'Housekeeping';
      } else if (role.includes('front')) {
        defaultDept = 'Front Office';
      }
      setActiveDept(defaultDept);
    }
  }, [user]);

  // Ambil daftar barang yang relevan dengan departemen yang dipilih
  const getItemsForDept = (dept: string) => {
    const stockItems = items.filter(i => i.is_active);
    const target = dept.toLowerCase();
    if (target === 'purchasing') {
      return stockItems;
    }
    if (target === 'food') {
      return stockItems.filter(i => [
        'Vegetables', 'Fruits', 'Meat & Poultry', 'Seafood',
        'Dairy & Eggs', 'Dry Goods & Groceries', 'Kitchen Equipment'
      ].includes(i.category));
    }
    if (target === 'beverage') {
      return stockItems.filter(i => [
        'Beverages', 'Dairy & Eggs', 'Others'
      ].includes(i.category));
    }
    if (target === 'housekeeping') {
      return stockItems.filter(i => [
        'Housekeeping Supplies', 'Others'
      ].includes(i.category));
    }
    if (target === 'front office') {
      return stockItems.filter(i => [
        'Office Stationery', 'Others'
      ].includes(i.category));
    }
    return stockItems;
  };

  // Hitung stok sistem (book stock) untuk departemen terkait
  const getSystemQtyForDepartment = (itemId: string, dept: string) => {
    if (dept.toLowerCase() === 'purchasing') {
      const item = items.find(i => i.id === itemId);
      return item?.current_stock || 0;
    }

    const deptOpnames = opnames
      .filter(op => (op.department || 'Purchasing').toLowerCase() === dept.toLowerCase())
      .sort((a, b) => b.period.localeCompare(a.period));

    const lastOpname = deptOpnames[0];
    const lastCount = lastOpname?.items?.find(i => i.item_id === itemId)?.physical_qty || 0;
    const lastOpnameDate = lastOpname?.created_at?.toDate ? lastOpname.created_at.toDate() : (lastOpname?.created_at ? new Date(lastOpname.created_at) : new Date(0));

    const matchedSrs = srs.filter(sr => {
      if (sr.status !== 'fulfilled') return false;
      const srDate = sr.created_at?.toDate ? sr.created_at.toDate() : new Date(sr.created_at);
      if (srDate <= lastOpnameDate) return false;

      const srDept = (sr.department || '').toLowerCase();
      const targetDept = dept.toLowerCase();

      if (targetDept === 'food') {
        return srDept.includes('kitchen') || srDept.includes('food') || srDept === 'fb kitchen';
      }
      if (targetDept === 'beverage') {
        return srDept.includes('service') || srDept.includes('beverage') || srDept === 'fb service';
      }
      if (targetDept === 'front office') {
        return srDept.includes('front');
      }
      if (targetDept === 'housekeeping') {
        return srDept.includes('housekeeping');
      }
      return false;
    });

    const fulfilledQty = matchedSrs.reduce((sum, sr) => {
      const itemLine = sr.items.find(i => i.item_id === itemId);
      return sum + (itemLine?.qty_fulfilled || 0);
    }, 0);

    return lastCount + fulfilledQty;
  };

  // Semua barang departemen aktif
  const deptItems = useMemo(() => {
    return getItemsForDept(activeDept);
  }, [items, activeDept]);

  // Daftar kategori unik untuk filter
  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(deptItems.map(i => i.category).filter(Boolean)));
  }, [deptItems]);

  // Inisialisasi awal default count saat ganti departemen: baseline = system qty
  useEffect(() => {
    const initialCounts: Record<string, number> = {};
    const initialPrices: Record<string, number> = {};

    deptItems.forEach(item => {
      const sysQty = getSystemQtyForDepartment(item.id!, activeDept);
      initialCounts[item.id!] = sysQty;
      initialPrices[item.id!] = item.last_purchase_price || 0;
    });

    setCounts(initialCounts);
    setCustomPrices(initialPrices);
    setItemNotes({});
  }, [activeDept, items]);

  // Baris yang sudah dikalkulasi
  const allCalculatedLines = useMemo(() => {
    return deptItems.map(item => {
      const systemQty = getSystemQtyForDepartment(item.id!, activeDept);
      const physicalQty = counts[item.id!] ?? systemQty;
      const variance = physicalQty - systemQty;
      const unitPrice = customPrices[item.id!] ?? (item.last_purchase_price || 0);
      const varianceValue = variance * unitPrice;

      return {
        item_id: item.id!,
        item_code: item.item_code || '',
        name: item.name,
        category: item.category || 'General',
        unit: item.unit,
        system_qty: systemQty,
        physical_qty: physicalQty,
        variance,
        variance_type: (variance === 0 ? 'none' : variance < 0 ? 'damage' : 'normal_shrinkage') as any,
        unit_price: unitPrice,
        variance_value: varianceValue,
        notes: itemNotes[item.id!] || ''
      };
    });
  }, [deptItems, counts, customPrices, itemNotes, activeDept, opnames, srs]);

  // Filtered lines untuk tampilan tabel count sheet
  const visibleLines = useMemo(() => {
    return allCalculatedLines.filter(line => {
      if (categoryFilter && line.category !== categoryFilter) {
        return false;
      }
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matchName = line.name.toLowerCase().includes(q);
        const matchCode = line.item_code.toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }
      if (varianceFilter === 'variance_only' && line.variance === 0) return false;
      if (varianceFilter === 'surplus' && line.variance <= 0) return false;
      if (varianceFilter === 'shortage' && line.variance >= 0) return false;
      if (varianceFilter === 'match' && line.variance !== 0) return false;
      return true;
    });
  }, [allCalculatedLines, categoryFilter, searchFilter, varianceFilter]);

  // Total Ringkasan KPI
  const totalBookValue = useMemo(() => {
    return allCalculatedLines.reduce((acc, l) => acc + (l.system_qty * l.unit_price), 0);
  }, [allCalculatedLines]);

  const totalPhysicalValue = useMemo(() => {
    return allCalculatedLines.reduce((acc, l) => acc + (l.physical_qty * l.unit_price), 0);
  }, [allCalculatedLines]);

  const totalNetVariance = useMemo(() => {
    return totalPhysicalValue - totalBookValue;
  }, [totalPhysicalValue, totalBookValue]);

  const totalVarianceCount = useMemo(() => {
    return allCalculatedLines.filter(l => l.variance !== 0).length;
  }, [allCalculatedLines]);

  // Bulk Actions
  const handleSetAllToSystem = () => {
    const updatedCounts: Record<string, number> = {};
    deptItems.forEach(item => {
      updatedCounts[item.id!] = getSystemQtyForDepartment(item.id!, activeDept);
    });
    setCounts(updatedCounts);
    toast.success('Semua hitungan fisik diisi sesuai stok sistem (Sisa by Data).');
  };

  const handleResetToZero = () => {
    const updatedCounts: Record<string, number> = {};
    deptItems.forEach(item => {
      updatedCounts[item.id!] = 0;
    });
    setCounts(updatedCounts);
    toast.info('Physical counts reset to 0 (Blind Count mode).');
  };

  // Export ke CSV / Excel
  const handleExportReconciliation = () => {
    exportStockOpnameToCSV({
      hotelName: partnerName,
      department: activeDept,
      period: auditPeriod,
      conductedBy: user?.displayName || user?.email || 'Auditor / Staff',
      status: 'Draft Count Sheet',
      items: allCalculatedLines
    });
    toast.success('Reconciliation count sheet exported to CSV / Excel.');
  };

  // Cetak Lembar Hitung Fisik
  const handlePrintCountSheet = () => {
    window.print();
  };

  // Submit Stock Opname
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (allCalculatedLines.length === 0) {
      toast.error('No items found in this department for stock opname.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createOpname({
        period: auditPeriod,
        department: activeDept,
        status: 'submitted',
        items: allCalculatedLines.map(({ variance_value, ...rest }) => rest),
        conducted_by: user?.uid || 'unknown',
        conducted_by_name: `${user?.displayName || user?.email || 'Staff'} (${user?.role || 'Staff'})`,
        conducted_by_role: user?.role || 'staff',
        approved_by: null,
        approved_by_name: null,
      });

      // Jika departemen Purchasing (Central Store), update current_stock barang otomatis
      if (activeDept.toLowerCase() === 'purchasing') {
        for (const line of allCalculatedLines) {
          if (line.variance !== 0) {
            await updateItem(line.item_id, { current_stock: line.physical_qty });
          }
        }
      }

      toast.success(`Stock Opname for period ${auditPeriod} (${activeDept}) submitted successfully.`);
      router.push('/purchasing/stock-opname?module=purchasing');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit stock opname.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className={s.container}>
      {/* Screen Content Wrapper (Sembunyikan seluruh UI web saat cetak laporan) */}
      <div className={printS.printHideRoot}>
        {/* Top Header */}
        <div className={s.header}>
        <div>
          <button
            type="button"
            onClick={() => router.push('/purchasing/stock-opname?module=purchasing')}
            className={s.backBtn}
          >
            <ChevronLeft size={16} /> Back to Stock Opname Records
          </button>
          <h1 className={s.title}>Physical Inventory Count Sheet</h1>
          <p className={s.subtitle}>
            Audit physical inventory levels, reconcile against system book stock, identify quantity & value variances, and export reconciliation reports.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleExportReconciliation}
            className={s.exportBtn}
            title="Export reconciliation data to Excel/CSV"
          >
            <FileSpreadsheet size={16} />
            Export Variance (CSV/Excel)
          </button>
          <button
            type="button"
            onClick={handlePrintCountSheet}
            className={s.printBtn}
            title="Print physical count sheet for inventory audit"
          >
            <Printer size={16} />
            Print Count Sheet
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Configuration Box */}
        <div className={s.configBox}>
          <div className={s.fieldGroup}>
            <label className={s.fieldLabel}>Department / Store Location</label>
            <select
              className={s.fieldSelect}
              value={activeDept}
              onChange={e => setActiveDept(e.target.value)}
              required
            >
              <option value="Food">Food & Kitchen (F&B Store)</option>
              <option value="Beverage">Beverage & Bar (F&B Store)</option>
              <option value="Housekeeping">Housekeeping & Linen Store</option>
              <option value="Front Office">Front Office & Guest Supplies</option>
              <option value="Purchasing">Central Store (Main Warehouse)</option>
            </select>
          </div>

          <div className={s.fieldGroup}>
            <label className={s.fieldLabel}>Audit Period (Month-Year)</label>
            <input
              type="month"
              className={s.fieldInput}
              value={auditPeriod}
              onChange={e => setAuditPeriod(e.target.value)}
              required
            />
          </div>

          <div className={s.fieldGroup}>
            <label className={s.fieldLabel}>Auditor / Conducted By</label>
            <input
              type="text"
              className={s.fieldInput}
              value={`${user?.displayName || user?.email || 'Staff'} (${user?.role || 'Staff'})`}
              disabled
              style={{ background: '#f1f5f9', color: '#64748b' }}
            />
          </div>
        </div>

        {/* Live Variance KPI Summary Bar */}
        <div className={s.kpiSummaryBar}>
          <div className={s.kpiItem}>
            <span className={s.kpiLabel}>Total Audited Items</span>
            <span className={s.kpiValue}>{allCalculatedLines.length} Items</span>
          </div>

          <div className={s.kpiItem}>
            <span className={s.kpiLabel}>Book Stock Value</span>
            <span className={s.kpiValue}>{formatRupiah(totalBookValue)}</span>
          </div>

          <div className={s.kpiItem}>
            <span className={s.kpiLabel}>Physical Stock Value</span>
            <span className={s.kpiValue}>{formatRupiah(totalPhysicalValue)}</span>
          </div>

          <div className={s.kpiItem}>
            <span className={s.kpiLabel}>Discrepancies</span>
            <span className={s.kpiValue} style={{ color: totalVarianceCount > 0 ? '#e11d48' : '#16a34a' }}>
              {totalVarianceCount} Items ({allCalculatedLines.length - totalVarianceCount} Matched)
            </span>
          </div>

          <div className={s.kpiItem}>
            <span className={s.kpiLabel}>Net Variance Value</span>
            <span
              className={s.kpiValue}
              style={{ color: totalNetVariance < 0 ? '#e11d48' : totalNetVariance > 0 ? '#16a34a' : '#0f172a' }}
            >
              {totalNetVariance > 0 ? '+' : ''}{formatRupiah(totalNetVariance)}
            </span>
          </div>
        </div>

        {/* Count Sheet Table Toolbar */}
        <div className={s.tableToolbar}>
          <div className={s.toolbarLeft}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: 9, color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search item description or code..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                style={{
                  height: 32,
                  padding: '0 10px 0 28px',
                  fontSize: 12.5,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 5,
                  outline: 'none',
                  minWidth: 220
                }}
              />
            </div>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{
                height: 32,
                padding: '0 8px',
                fontSize: 12.5,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 5,
                outline: 'none',
                color: '#334155'
              }}
            >
              <option value="">All Categories ({deptItems.length})</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={varianceFilter}
              onChange={e => setVarianceFilter(e.target.value as any)}
              style={{
                height: 32,
                padding: '0 8px',
                fontSize: 12.5,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 5,
                outline: 'none',
                color: '#334155'
              }}
            >
              <option value="all">All Discrepancies</option>
              <option value="variance_only">Discrepancies Only ({totalVarianceCount})</option>
              <option value="surplus">Surplus (+)</option>
              <option value="shortage">Shortage (-)</option>
              <option value="match">Matched (0)</option>
            </select>
          </div>

          <div className={s.toolbarRight}>
            <button
              type="button"
              onClick={handleSetAllToSystem}
              className={s.quickActionBtn}
              title="Set all physical counts to match system book stock"
            >
              <CheckCheck size={13} style={{ color: '#16a34a' }} />
              Set All = System Stock
            </button>
            <button
              type="button"
              onClick={handleResetToZero}
              className={s.quickActionBtn}
              title="Reset all physical counts to 0 (Blind Count mode)"
            >
              <RotateCcw size={13} style={{ color: '#e11d48' }} />
              Reset to 0
            </button>
          </div>
        </div>

        {/* Main Count Sheet Table */}
        <div className={s.tableContainer}>
          <table className={s.table}>
            <thead>
              <tr>
                <th style={{ width: '3%' }} className={s.thCenter}>No</th>
                <th style={{ width: '22%' }}>Item Description</th>
                <th style={{ width: '12%' }}>Category</th>
                <th style={{ width: '5%' }} className={s.thCenter}>Unit</th>
                <th style={{ width: '10%' }} className={s.thRight}>Unit Cost</th>
                <th style={{ width: '8%' }} className={s.thRight}>Book Stock</th>
                <th style={{ width: '9%' }} className={s.thRight}>Physical Count</th>
                <th style={{ width: '7%' }} className={s.thRight}>Variance</th>
                <th style={{ width: '10%' }} className={s.thRight}>Var. Value</th>
                <th style={{ width: '14%' }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {visibleLines.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b' }}>
                    No inventory items found matching the selected filter.
                  </td>
                </tr>
              ) : (
                visibleLines.map((line, idx) => {
                  const isPos = line.variance > 0;
                  const isNeg = line.variance < 0;
                  const rowClass = isNeg ? s.rowVarianceNeg : isPos ? s.rowVariancePos : '';

                  return (
                    <tr key={line.item_id} className={rowClass}>
                      <td className={s.thCenter} style={{ color: '#64748b', fontSize: 11 }}>
                        {idx + 1}
                      </td>
                      <td>
                        <div
                          style={{ fontWeight: 600, color: '#0f172a', fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={line.name}
                        >
                          {line.name}
                        </div>
                        {line.item_code && (
                          <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                            {line.item_code}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          style={{ fontSize: 10.5, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', whiteSpace: 'nowrap' }}
                          title={line.category}
                        >
                          {line.category}
                        </span>
                      </td>
                      <td className={s.thCenter} style={{ fontWeight: 600, color: '#334155', fontSize: 10.5 }}>
                        {line.unit}
                      </td>
                      <td className={s.thRight}>
                        <div className={s.inputWrapRight}>
                          <input
                            type="number"
                            min={0}
                            value={customPrices[line.item_id] ?? line.unit_price}
                            onChange={e => setCustomPrices(p => ({ ...p, [line.item_id]: Number(e.target.value) }))}
                            onWheel={e => e.currentTarget.blur()}
                            className={s.priceInput}
                            required
                          />
                        </div>
                      </td>
                      <td className={s.thRight} style={{ fontWeight: 600, color: '#334155', fontSize: 11 }}>
                        {line.system_qty}
                      </td>
                      <td className={s.thRight}>
                        <div className={s.inputWrapRight}>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={counts[line.item_id] ?? line.system_qty}
                            onChange={e => setCounts(c => ({ ...c, [line.item_id]: Number(e.target.value) }))}
                            onWheel={e => e.currentTarget.blur()}
                            className={s.qtyInput}
                            required
                          />
                        </div>
                      </td>
                      <td className={s.thRight} style={{ fontWeight: 700, fontSize: 11 }}>
                        {isPos ? (
                          <span style={{ color: '#16a34a' }}>+{line.variance}</span>
                        ) : isNeg ? (
                          <span style={{ color: '#e11d48' }}>{line.variance}</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>0</span>
                        )}
                      </td>
                      <td className={s.thRight} style={{ fontWeight: 700, fontSize: 10.5, fontFamily: 'monospace' }}>
                        {isPos ? (
                          <span style={{ color: '#16a34a' }}>+{formatRupiah(line.variance_value)}</span>
                        ) : isNeg ? (
                          <span style={{ color: '#e11d48' }}>{formatRupiah(line.variance_value)}</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Rp 0</span>
                        )}
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder={isNeg ? 'Damaged / lost...' : isPos ? 'Surplus count...' : 'Audit remarks...'}
                          value={itemNotes[line.item_id] || ''}
                          onChange={e => setItemNotes(n => ({ ...n, [line.item_id]: e.target.value }))}
                          className={s.notesInput}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Actions & General Audit Notes */}
        <div className={s.footerBar}>
          <div className={s.footerNotes}>
            <label className={s.fieldLabel} style={{ marginBottom: 4, display: 'block' }}>
              Audit Notes & Discrepancy Justification
            </label>
            <textarea
              placeholder="Enter reconciliation justification, storage conditions, discrepancy root cause, supervisor findings, etc..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{
                width: '100%',
                height: 52,
                padding: '8px 10px',
                fontSize: 12.5,
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div className={s.footerActions}>
            <PButton
              type="button"
              variant="secondary"
              onClick={() => router.push('/purchasing/stock-opname?module=purchasing')}
              disabled={isSubmitting}
            >
              Cancel
            </PButton>

            <PButton
              type="submit"
              disabled={isSubmitting}
              style={{ minWidth: 200 }}
            >
              <Save size={16} />
              {isSubmitting ? 'Submitting...' : 'Submit Stock Opname'}
            </PButton>
          </div>
        </div>
      </form>
      </div>

      {/* Official Audit Document Report (HANYA muncul saat dicetak ke PDF/Kertas) */}
      <StockOpnamePrint
        opname={{
          period: auditPeriod,
          department: activeDept,
          status: 'Draft Audit Count Sheet',
          conducted_by_name: user?.displayName || user?.email || 'Auditor / Staff',
          notes: notes,
          items: allCalculatedLines
        }}
        hotelName={partnerName}
      />
    </motion.div>
  );
}
