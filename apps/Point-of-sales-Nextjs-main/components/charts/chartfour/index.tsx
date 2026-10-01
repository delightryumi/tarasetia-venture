'use client';

import React, { useState, useEffect } from 'react';
import { useIncomeAnalytics } from './hooks/useIncomeAnalytics';
import { useIncomeExport } from './hooks/useIncomeExport';
import { useCurrency } from '@/hooks/useCurrency';
import { FilterBar } from './components/FilterBar';
import { OverviewMetrics } from './components/OverviewMetrics';
import { RevenueCharts } from './components/RevenueCharts';
import { CategoryBreakdownTable } from './components/CategoryBreakdownTable';
import { CostSections } from './components/CostSections';

const ChartFour: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [hotelName, setHotelName] = useState<string>('SETARA POS & RESTORAN');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName =
        localStorage.getItem('restoName') ||
        localStorage.getItem('active_hotel_name') ||
        localStorage.getItem('hotelName') ||
        'SETARA POS & RESTORAN';
      setHotelName(storedName);
    }
  }, []);

  const {
    filterType,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    handleFilterTypeChange,
    loading,
    totalGrossIncome,
    totalTaxIncome,
    nettRevenue,
    banquetRevenue,
    alacarteRevenue,
    foodRevenue,
    beverageRevenue,
    otherRevenue,
    serviceRate,
    serviceCharge,
    taxRateIndividual,
    taxAmount,
    lostBreakageRate,
    lostBreakageAmount,
    taxRate,
    alacarteSeries,
    banquetSeries,
    alacarteMax,
    banquetMax,
    chartOptions,
    categoryBreakdown,
  } = useIncomeAnalytics();

  const { exportToExcel, exportToPDF } = useIncomeExport({
    startDate,
    endDate,
    filterType,
    totalGrossIncome,
    nettRevenue,
    totalTaxIncome,
    banquetRevenue,
    alacarteRevenue,
    foodRevenue,
    beverageRevenue,
    otherRevenue,
    serviceRate,
    serviceCharge,
    taxRateIndividual,
    taxAmount,
    lostBreakageRate,
    lostBreakageAmount,
    taxRate,
    categoryBreakdown,
    hotelName,
    formatCurrency,
  });

  return (
    <div className="col-span-12 rounded-xl flex flex-col gap-6">
      
      {/* ── Filter Bar & Export Actions ── */}
      <FilterBar
        filterType={filterType}
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        handleFilterTypeChange={handleFilterTypeChange}
        onExportExcel={exportToExcel}
        onExportPDF={exportToPDF}
        loading={loading}
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-neutral-200 dark:border-white/[0.1] border-t-blue-500 animate-spin" />
          <span className="text-sm text-neutral-500 font-medium">Memuat data analitik...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* ── Overview Metrics Grid ── */}
          <OverviewMetrics
            startDate={startDate}
            endDate={endDate}
            totalGrossIncome={totalGrossIncome}
            nettRevenue={nettRevenue}
            banquetRevenue={banquetRevenue}
            alacarteRevenue={alacarteRevenue}
            foodRevenue={foodRevenue}
            beverageRevenue={beverageRevenue}
            serviceRate={serviceRate}
            serviceCharge={serviceCharge}
            taxRateIndividual={taxRateIndividual}
            taxAmount={taxAmount}
            lostBreakageRate={lostBreakageRate}
            lostBreakageAmount={lostBreakageAmount}
            taxRate={taxRate}
            totalTaxIncome={totalTaxIncome}
          />

          {/* ── Revenue Split Charts ── */}
          <RevenueCharts
            alacarteSeries={alacarteSeries}
            banquetSeries={banquetSeries}
            alacarteMax={alacarteMax}
            banquetMax={banquetMax}
            chartOptions={chartOptions}
          />

          {/* ── Detail Pendapatan per Kategori & Sub-Kategori ── */}
          <CategoryBreakdownTable categoryBreakdown={categoryBreakdown} />

          {/* ── Bottom Section: Cost Breakdowns ── */}
          <CostSections />

        </div>
      )}
    </div>
  );
};

export default ChartFour;
