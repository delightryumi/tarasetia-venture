'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Plus, Coffee, Store, Percent, Hotel, Wallet, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { PButton } from '@/components/purchasing/ui/PButton';
import s from '@/app/(dashboard)/purchasing/shared-page.module.css';
import ds from './fnb-product.module.css';
import '@/components/purchasing/shell/purchasing-tokens.css';

// PNL Components + Hooks
import { usePnL } from '@/components/sections/pnl/usePnL';
import { useDrillDown } from '@/components/sections/pnl/hooks/useDrillDown';
import { usePnLExport } from '@/components/sections/pnl/hooks/usePnLExport';
import { PNLDrillDownModal } from '@/components/sections/pnl/components/PNLDrillDownModal';
import { processPnLData } from '@/lib/pnl-logic';

// Subcomponents
import FoodBeverageLedgerTab from './FoodBeverageLedgerTab';
import FoodBeveragePerformanceTab from './FoodBeveragePerformanceTab';
import { FnbPurchaseOrderSection, FnbPurchaseOrderSectionRef } from './FnbPurchaseOrderSection';

const TABS = ['ledger', 'performance', 'dml', 'sr', 'pr'] as const;
type Tab = typeof TABS[number];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as any } },
};

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function FoodBeverageProductPage() {
  const [activeTab, setActiveTab] = useState<Tab>('ledger');
  const [dateFilter, setDateFilter] = useState(() => getTodayStr());
  
  // ── Toggle View: Daily vs Monthly ──
  const [viewScale, setViewScale] = useState<'daily' | 'monthly'>('monthly');

  // Ref for the PO Section
  const poSectionRef = useRef<FnbPurchaseOrderSectionRef>(null);

  // ── PNL Hooks and States ──
  const {
    viewMode,
    month, setMonth,
    loading: pnlLoading, pnlResult,
    expenses, vatPercentage, mgmtFeePercentage,
    serviceChargePercentage, lostBreakagePercentage,
    rawTransactions, customIncomes, posOrders,
  } = usePnL();

  const [y] = month.split("-");

  // ── Daily calculations when viewScale === 'daily' ──
  const dailyFilteredTransactions = useMemo(() => 
    rawTransactions.filter(t => {
      const tDate = t.date?.toDate ? t.date.toDate().toISOString().split('T')[0] : t.date;
      return tDate === dateFilter;
    }),
    [rawTransactions, dateFilter]
  );
  
  const dailyFilteredCustomIncomes = useMemo(() => 
    customIncomes.filter(i => i.date === dateFilter),
    [customIncomes, dateFilter]
  );
  
  const dailyFilteredExpenses = useMemo(() => 
    expenses.filter(e => e.date === dateFilter),
    [expenses, dateFilter]
  );

  const dailyFilteredPosOrders = useMemo(() => 
    posOrders.filter(o => o.date === dateFilter),
    [posOrders, dateFilter]
  );

  const dailyStats = useMemo(() => {
    let alacarteCalc = 0;
    let banquetCalc = 0;
    let foodRevCalc = 0;
    let beverageRevCalc = 0;
    let alacarteExpCalc = 0;
    let banquetExpCalc = 0;
    let foodExpCalc = 0;
    let beverageExpCalc = 0;

    dailyFilteredPosOrders.forEach(o => {
      const isBanquet = o.category === 'banquet';
      const isBeverage = o.category === 'beverage';
      
      if (isBanquet) {
        banquetCalc += o.amount;
      } else {
        alacarteCalc += o.amount;
      }

      if (!isBanquet) {
        if (isBeverage) {
          beverageRevCalc += o.amount;
        } else {
          foodRevCalc += o.amount;
        }
      }
    });

    const res = processPnLData(
      dailyFilteredTransactions,
      dailyFilteredCustomIncomes,
      [], // nonCommissionRevenue
      dailyFilteredExpenses,
      [], // investors
      vatPercentage,
      {}, // hotelGopPercentages
      [], // allHotels
      mgmtFeePercentage,
      alacarteCalc,
      banquetCalc,
      foodRevCalc,
      beverageRevCalc,
      alacarteExpCalc,
      banquetExpCalc,
      foodExpCalc,
      beverageExpCalc,
      serviceChargePercentage,
      lostBreakagePercentage
    );

    const posGrossRevenue = alacarteCalc + banquetCalc;
    const serviceRate = pnlResult?.posServiceRate || 10;
    const taxRateIndividual = pnlResult?.posTaxRateIndividual || 10;
    const lostBreakageRate = pnlResult?.posLostBreakageRate || 1;
    const taxRateCombined = serviceRate + taxRateIndividual + lostBreakageRate;

    const nettRevenue = taxRateCombined > 0 ? posGrossRevenue / (1 + taxRateCombined / 100) : posGrossRevenue;
    const serviceCharge = nettRevenue * (serviceRate / 100);
    const taxAmount = nettRevenue * (taxRateIndividual / 100);
    const lostBreakageAmount = nettRevenue * (lostBreakageRate / 100);
    const totalServiceTax = serviceCharge + taxAmount + lostBreakageAmount;

    res.pnlResult.revAlacarte = alacarteCalc;
    res.pnlResult.revBanquet = banquetCalc;
    res.pnlResult.revFood = foodRevCalc;
    res.pnlResult.revBeverage = beverageRevCalc;
    res.pnlResult.posGrossRevenue = posGrossRevenue;
    res.pnlResult.posNettRevenue = nettRevenue;
    res.pnlResult.posServiceCharge = serviceCharge;
    res.pnlResult.posTaxAmount = taxAmount;
    res.pnlResult.posLostBreakageAmount = lostBreakageAmount;
    res.pnlResult.posTotalServiceTax = totalServiceTax;
    res.pnlResult.posServiceRate = serviceRate;
    res.pnlResult.posTaxRateIndividual = taxRateIndividual;
    res.pnlResult.posLostBreakageRate = lostBreakageRate;
    res.pnlResult.posTaxRateCombined = taxRateCombined;

    return res.pnlResult;
  }, [
    dailyFilteredTransactions,
    dailyFilteredCustomIncomes,
    dailyFilteredExpenses,
    dailyFilteredPosOrders,
    pnlResult,
    vatPercentage,
    mgmtFeePercentage,
    serviceChargePercentage,
    lostBreakagePercentage
  ]);

  // Active dataset for cards
  const activePnLStats = viewScale === 'daily' ? dailyStats : pnlResult;

  // ── Drill down handler binding ──
  const drillDownOptions = useMemo(() => {
    if (viewScale === 'daily') {
      return {
        pnlResult: dailyStats,
        rawTransactions: dailyFilteredTransactions,
        customIncomes: dailyFilteredCustomIncomes,
        expenses: dailyFilteredExpenses,
        posOrders: dailyFilteredPosOrders,
        vatPercentage,
        mgmtFeePercentage,
        serviceChargePercentage,
        lostBreakagePercentage,
        month: dateFilter,
      };
    }
    return {
      pnlResult,
      rawTransactions,
      customIncomes,
      expenses,
      posOrders,
      vatPercentage,
      mgmtFeePercentage,
      serviceChargePercentage,
      lostBreakagePercentage,
      month,
    };
  }, [
    viewScale,
    pnlResult, dailyStats,
    rawTransactions, dailyFilteredTransactions,
    customIncomes, dailyFilteredCustomIncomes,
    expenses, dailyFilteredExpenses,
    posOrders, dailyFilteredPosOrders,
    vatPercentage,
    mgmtFeePercentage,
    serviceChargePercentage,
    lostBreakagePercentage,
    month,
    dateFilter,
  ]);

  const drillDown = useDrillDown(drillDownOptions);

  const { handleExportDrillExcel } = usePnLExport({
    pnlResult: activePnLStats,
    expenses: viewScale === 'daily' ? dailyFilteredExpenses : expenses,
    viewMode,
    month: viewScale === 'daily' ? dateFilter : month,
    year: y,
    selectedDrillDownTitle: drillDown.selectedDrillDown?.title,
    drillItems: drillDown.modalData?.filtered,
  });

  const tabLabels: Record<Tab, string> = {
    'ledger': 'F&B Ledger',
    'performance': 'F&B Performance',
    'dml': 'Daily Market List',
    'sr': 'Store Requisition',
    'pr': 'Purchase Requisition',
  };

  const tabDescriptions: Record<Tab, string> = {
    'ledger': 'Analisis dan pemetaan data laporan pendapatan F&B serta potongan pajak/layanan.',
    'performance': 'Perbandingan performa penjualan makanan/minuman dengan pengeluarannya.',
    'dml': 'Buat dan pantau daily market list untuk kebutuhan operasional dapur/restoran.',
    'sr': 'Ajukan permintaan stok bahan/barang dari gudang utama ke outlet F&B.',
    'pr': 'Ajukan permintaan pengadaan bahan baku ke vendor atau pihak ketiga eksternal.',
  };

  const handleCreateButtonClick = () => {
    poSectionRef.current?.openCreateForm();
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="purchasing-root">
      <div className={s.printHideRoot}>
        {/* Header */}
        <div className={ds.headerWrapper}>
          <div className={ds.headerTitleSec}>
            <h1 className={ds.title}>Food & Beverage Product</h1>
            <p className={ds.subtitle}>{tabDescriptions[activeTab]}</p>
          </div>
          {['dml', 'sr', 'pr'].includes(activeTab) && (
            <PButton onClick={handleCreateButtonClick}>
              <Plus size={16} strokeWidth={2} />{' '}
              {activeTab === 'dml' ? 'Generate DML' : activeTab === 'sr' ? 'New SR' : 'New PR'}
            </PButton>
          )}
        </div>

        {/* Tab switcher (Apple Pill Style) */}
        <div className={ds.tabsContainer}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${ds.tabBtn} ${activeTab === tab ? ds.tabActive : ''}`}
            >
              {tab === 'ledger' && <Store size={14} />}
              {tab === 'performance' && <Activity size={14} />}
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        {/* Filter Bar (Dynamic depending on active tab) */}
        <div className={ds.filterBar}>
          {['ledger', 'performance'].includes(activeTab) ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 16 }}>
              {/* Daily / Monthly Toggle */}
              <div className={ds.toggleContainer}>
                <button 
                  className={`${ds.toggleBtn} ${viewScale === 'daily' ? ds.toggleActive : ''}`}
                  onClick={() => setViewScale('daily')}
                >
                  Daily
                </button>
                <button 
                  className={`${ds.toggleBtn} ${viewScale === 'monthly' ? ds.toggleActive : ''}`}
                  onClick={() => setViewScale('monthly')}
                >
                  Monthly
                </button>
              </div>

              {/* Date / Month Picker */}
              <div className={ds.filterGroup}>
                {viewScale === 'monthly' ? (
                  <>
                    <span className={ds.filterLabel}>Periode Bulan</span>
                    <input 
                      type="month" 
                      className={ds.filterInput} 
                      value={month} 
                      onChange={e => setMonth(e.target.value)} 
                    />
                  </>
                ) : (
                  <>
                    <span className={ds.filterLabel}>Tanggal</span>
                    <input 
                      type="date" 
                      className={ds.filterInput} 
                      value={dateFilter} 
                      onChange={e => setDateFilter(e.target.value)} 
                    />
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className={ds.filterGroup}>
              <span className={ds.filterLabel}>Tanggal Order</span>
              <input 
                type="date" 
                className={ds.filterInput} 
                value={dateFilter} 
                onChange={e => setDateFilter(e.target.value)} 
              />
              {dateFilter && (
                <button className={ds.clearBtn} onClick={() => setDateFilter('')}>
                  Clear Filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab Contents */}
        <div className={ds.signatureLayout}>
          {activeTab === 'ledger' && (
            <FoodBeverageLedgerTab
              activePnLStats={activePnLStats}
              loading={pnlLoading}
              onCardClick={drillDown.handleCardClick}
              viewScale={viewScale}
            />
          )}

          {activeTab === 'performance' && (
            <FoodBeveragePerformanceTab
              activePnLStats={activePnLStats}
              loading={pnlLoading}
              onCardClick={drillDown.handleCardClick}
              viewScale={viewScale}
            />
          )}

          {['dml', 'sr', 'pr'].includes(activeTab) && (
            <FnbPurchaseOrderSection
              ref={poSectionRef}
              activeTab={activeTab as 'dml' | 'sr' | 'pr'}
              dateFilter={dateFilter}
            />
          )}
        </div>
      </div>

      {/* Drill-down Detail Modal from PNL */}
      <PNLDrillDownModal
        isOpen={drillDown.isDrillDownModalOpen}
        onClose={drillDown.closeModal}
        selectedDrillDown={drillDown.selectedDrillDown}
        modalData={drillDown.modalData}
        isFbPerformanceCard={drillDown.isFbPerformanceCard}
        fbPerformanceData={drillDown.fbPerformanceData}
        costConfig={drillDown.costConfig}
        modalBadgeInfo={drillDown.modalBadgeInfo}
        drillDownSearchQuery={drillDown.drillDownSearchQuery}
        setDrillDownSearchQuery={drillDown.setDrillDownSearchQuery}
        drillDownTab={drillDown.drillDownTab}
        setDrillDownTab={drillDown.setDrillDownTab}
        onExportDrillExcel={handleExportDrillExcel}
        month={viewScale === 'daily' ? dateFilter : month}
      />
    </motion.div>
  );
}
