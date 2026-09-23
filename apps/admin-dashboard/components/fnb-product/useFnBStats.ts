'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { usePnL } from '@/components/sections/pnl/usePnL';
import { useDrillDown } from '@/components/sections/pnl/hooks/useDrillDown';
import { usePnLExport } from '@/components/sections/pnl/hooks/usePnLExport';
import { processPnLData } from '@/lib/pnl-logic';

export function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const YEARS = [2024, 2025, 2026];
export const MONTHS = [
  { n: "Januari", v: "01" }, { n: "Februari", v: "02" }, { n: "Maret", v: "03" },
  { n: "April", v: "04" }, { n: "Mei", v: "05" }, { n: "Juni", v: "06" },
  { n: "Juli", v: "07" }, { n: "Agustus", v: "08" }, { n: "September", v: "09" },
  { n: "Oktober", v: "10" }, { n: "November", v: "11" }, { n: "Desember", v: "12" }
];

export function useFnBStats() {
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

  const [y] = (month || '').split("-");

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
      dateFilter, // period
      'monthly', // viewMode
      vatPercentage,
      {}, // hotelGopPercentages
      [], // allHotels
      mgmtFeePercentage, // mgmtFeeRoomPercentage
      mgmtFeePercentage, // mgmtFeeFnbPercentage
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
    lostBreakagePercentage,
    dateFilter
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

  return {
    viewMode,
    month,
    setMonth,
    displayMonth,
    dateFilter,
    setDateFilter,
    displayDate,
    viewScale,
    setViewScale,
    showMonthPicker,
    setShowMonthPicker,
    showDatePicker,
    setShowDatePicker,
    monthPickerRef,
    datePickerRef,
    viewYear,
    setViewYear,
    viewMonth,
    setViewMonth,
    cells,
    pnlLoading,
    activePnLStats,
    drillDown,
    handleExportDrillExcel,
  };
}
