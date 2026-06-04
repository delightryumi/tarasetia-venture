'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Coffee, Store, Percent, Hotel, Wallet, Activity, Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

const YEARS = [2024, 2025, 2026];
const MONTHS = [
  { n: "Januari", v: "01" }, { n: "Februari", v: "02" }, { n: "Maret", v: "03" },
  { n: "April", v: "04" }, { n: "Mei", v: "05" }, { n: "Juni", v: "06" },
  { n: "Juli", v: "07" }, { n: "Agustus", v: "08" }, { n: "September", v: "09" },
  { n: "Oktober", v: "10" }, { n: "November", v: "11" }, { n: "Desember", v: "12" }
];

export default function FoodBeverageProductPage() {
  const [activeTab, setActiveTab] = useState<Tab>('ledger');
  
  // ── PNL Hooks and States ──
  const {
    viewMode,
    month, setMonth,
    loading: pnlLoading, pnlResult,
    expenses, vatPercentage, mgmtFeePercentage,
    serviceChargePercentage, lostBreakagePercentage,
    rawTransactions, customIncomes, posOrders,
  } = usePnL();

  const [dateFilter, setDateFilter] = useState(() => getTodayStr());
  
  // ── Toggle View: Daily vs Monthly ──
  const [viewScale, setViewScale] = useState<'daily' | 'monthly'>('monthly');

  // Ref for the PO Section
  const poSectionRef = useRef<FnbPurchaseOrderSectionRef>(null);

  // ── Custom Picker States ──
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const monthPickerRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  
  const [viewYear, setViewYear] = useState(() => {
    const today = new Date();
    return getTodayStr() ? new Date(getTodayStr()).getFullYear() : today.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const today = new Date();
    return getTodayStr() ? new Date(getTodayStr()).getMonth() : today.getMonth();
  });

  useEffect(() => {
    if (dateFilter) {
      const d = new Date(dateFilter);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [dateFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setShowMonthPicker(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayMonth = useMemo(() => {
    if (!month) return '';
    const [yearPart, monthPart] = month.split('-');
    const dateObj = new Date(parseInt(yearPart), parseInt(monthPart) - 1);
    return dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }, [month]);

  const displayDate = useMemo(() => {
    if (!dateFilter) return '';
    const dateObj = new Date(dateFilter);
    return dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [dateFilter]);

  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = useMemo(() => {
    return [
      ...Array(firstDayIndex).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
    ];
  }, [firstDayIndex, daysInMonth]);

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
                    <div className="relative" ref={monthPickerRef}>
                      <button 
                        type="button"
                        onClick={() => setShowMonthPicker(!showMonthPicker)}
                        className={ds.datepickerTrigger}
                      >
                        <Calendar size={14} style={{ color: '#7a7a7a' }} />
                        <span>{displayMonth}</span>
                        <ChevronDown size={12} style={{ color: '#7a7a7a' }} />
                      </button>

                      <AnimatePresence>
                        {showMonthPicker && (
                          <motion.div 
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className={ds.datepickerDropdown}
                          >
                            <div className={ds.datepickerGrid}>
                              <div className={ds.datepickerColumn}>
                                <p className={ds.datepickerHeader}>Year</p>
                                <div className={ds.datepickerList}>
                                  {YEARS.map(yr => (
                                    <button 
                                      key={yr} 
                                      type="button"
                                      onClick={() => {
                                        const [, currentMonthPart] = month.split('-');
                                        setMonth(`${yr}-${currentMonthPart}`);
                                      }}
                                      className={`${ds.datepickerBtn} ${parseInt(month.split('-')[0]) === yr ? ds.datepickerBtnActive : ds.datepickerBtnInactive}`}
                                    >
                                      {yr}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className={ds.datepickerColumn}>
                                <p className={ds.datepickerHeader}>Month</p>
                                <div className={`${ds.datepickerMonthsScroll} custom-scrollbar`}>
                                  {MONTHS.map(mth => (
                                    <button 
                                      key={mth.v} 
                                      type="button"
                                      onClick={() => {
                                        const [currentYearPart] = month.split('-');
                                        setMonth(`${currentYearPart}-${mth.v}`);
                                        setShowMonthPicker(false);
                                      }}
                                      className={`${ds.datepickerBtn} ${month.split('-')[1] === mth.v ? ds.datepickerBtnActive : ds.datepickerBtnInactive}`}
                                    >
                                      {mth.n}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                ) : (
                  <>
                    <span className={ds.filterLabel}>Tanggal</span>
                    <div className="relative" ref={datePickerRef}>
                      <button 
                        type="button"
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className={ds.datepickerTrigger}
                      >
                        <Calendar size={14} style={{ color: '#7a7a7a' }} />
                        <span>{displayDate || 'Pilih Tanggal'}</span>
                        <ChevronDown size={12} style={{ color: '#7a7a7a' }} />
                      </button>

                      <AnimatePresence>
                        {showDatePicker && (
                          <motion.div 
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className={ds.datepickerDropdown}
                          >
                            <div className={ds.dailyCalendarWrapper}>
                              <div className={ds.dailyCalendarHeader}>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    if (viewMonth === 0) {
                                      setViewMonth(11);
                                      setViewYear(y => y - 1);
                                    } else {
                                      setViewMonth(m => m - 1);
                                    }
                                  }}
                                  className="p-1 hover:bg-neutral-100 rounded-md transition-colors border-none bg-transparent cursor-pointer"
                                >
                                  <ChevronLeft size={14} />
                                </button>
                                <span className={ds.dailyCalendarTitle}>
                                  {MONTHS[viewMonth].n} {viewYear}
                                </span>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    if (viewMonth === 11) {
                                      setViewMonth(0);
                                      setViewYear(y => y + 1);
                                    } else {
                                      setViewMonth(m => m + 1);
                                    }
                                  }}
                                  className="p-1 hover:bg-neutral-100 rounded-md transition-colors border-none bg-transparent cursor-pointer"
                                >
                                  <ChevronRight size={14} />
                                </button>
                              </div>

                              <div className={ds.dailyCalendarDaysHead}>
                                {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(d => (
                                  <div key={d} className={ds.dailyCalendarDayName}>{d}</div>
                                ))}
                              </div>

                              <div className={ds.dailyCalendarGrid}>
                                {cells.map((day, idx) => {
                                  if (day === null) {
                                    return <div key={`empty-${idx}`} className={ds.dailyCalendarCell} />;
                                  }
                                  const cellDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                  const isActive = dateFilter === cellDateStr;
                                  const isToday = new Date().toISOString().split('T')[0] === cellDateStr;
                                  return (
                                    <div key={day} className={ds.dailyCalendarCell}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDateFilter(cellDateStr);
                                          setShowDatePicker(false);
                                        }}
                                        className={`${ds.dailyCalendarDayBtn} ${isActive ? ds.dailyCalendarDayBtnActive : ds.dailyCalendarDayBtnInactive} ${isToday && !isActive ? ds.dailyCalendarDayBtnToday : ''}`}
                                      >
                                        {day}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className={ds.filterGroup}>
              <span className={ds.filterLabel}>Tanggal Order</span>
              <div className="relative" ref={datePickerRef}>
                <button 
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={ds.datepickerTrigger}
                >
                  <Calendar size={14} style={{ color: '#7a7a7a' }} />
                  <span>{displayDate || 'Pilih Tanggal'}</span>
                  <ChevronDown size={12} style={{ color: '#7a7a7a' }} />
                </button>

                <AnimatePresence>
                  {showDatePicker && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className={ds.datepickerDropdown}
                    >
                      <div className={ds.dailyCalendarWrapper}>
                        <div className={ds.dailyCalendarHeader}>
                          <button 
                            type="button"
                            onClick={() => {
                              if (viewMonth === 0) {
                                setViewMonth(11);
                                setViewYear(y => y - 1);
                              } else {
                                setViewMonth(m => m - 1);
                              }
                            }}
                            className="p-1 hover:bg-neutral-100 rounded-md transition-colors border-none bg-transparent cursor-pointer"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <span className={ds.dailyCalendarTitle}>
                            {MONTHS[viewMonth].n} {viewYear}
                          </span>
                          <button 
                            type="button"
                            onClick={() => {
                              if (viewMonth === 11) {
                                setViewMonth(0);
                                setViewYear(y => y + 1);
                              } else {
                                setViewMonth(m => m + 1);
                              }
                            }}
                            className="p-1 hover:bg-neutral-100 rounded-md transition-colors border-none bg-transparent cursor-pointer"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>

                        <div className={ds.dailyCalendarDaysHead}>
                          {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(d => (
                            <div key={d} className={ds.dailyCalendarDayName}>{d}</div>
                          ))}
                        </div>

                        <div className={ds.dailyCalendarGrid}>
                          {cells.map((day, idx) => {
                            if (day === null) {
                              return <div key={`empty-${idx}`} className={ds.dailyCalendarCell} />;
                            }
                            const cellDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const isActive = dateFilter === cellDateStr;
                            const isToday = new Date().toISOString().split('T')[0] === cellDateStr;
                            return (
                              <div key={day} className={ds.dailyCalendarCell}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDateFilter(cellDateStr);
                                    setShowDatePicker(false);
                                  }}
                                  className={`${ds.dailyCalendarDayBtn} ${isActive ? ds.dailyCalendarDayBtnActive : ds.dailyCalendarDayBtnInactive} ${isToday && !isActive ? ds.dailyCalendarDayBtnToday : ''}`}
                                >
                                  {day}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
