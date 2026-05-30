'use client';

import { ApexOptions } from 'apexcharts';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { initialChartfourOptions } from '@/lib/charts';
import { useCurrency } from '@/hooks/useCurrency';
import { Badge } from '@/components/ui/badge';
import { Layers, Landmark, DollarSign, Percent, BarChart4, TrendingUp } from 'lucide-react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

interface CategoryBreakdownItem {
  category: string;
  subcategory: string;
  grossIncome: number;
  taxIncome: number;
  netProfit: number;
}

const ChartFour: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const formatCurrencyRef = React.useRef(formatCurrency);
  React.useEffect(() => {
    formatCurrencyRef.current = formatCurrency;
  }, [formatCurrency]);

  const getLocalYYYYMMDD = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split('T')[0];
  };

  const getInitialMonthlyRange = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      start: getLocalYYYYMMDD(firstDay),
      end: getLocalYYYYMMDD(today)
    };
  };

  const initialRange = getInitialMonthlyRange();

  const [filterType, setFilterType] = useState<'daily' | 'monthly' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState<string>(initialRange.start);
  const [endDate, setEndDate] = useState<string>(initialRange.end);
  const [totalAlacarte, setTotalAlacarte] = useState<number>(0);
  const [totalBanquet, setTotalBanquet] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(10);
  const [serviceRate, setServiceRate] = useState<number>(0);
  const [taxRateIndividual, setTaxRateIndividual] = useState<number>(10);
  const [lostBreakageRate, setLostBreakageRate] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Income Breakdown per Category/Subcategory state
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdownItem[]>([]);

  // State for data split
  const [alacarteChartData, setAlacarteChartData] = useState<{
    [date: string]: {
      netIncome: number;
      taxIncome: number;
      grossIncomeWithTax: number;
    };
  }>({});

  const [banquetChartData, setBanquetChartData] = useState<{
    [date: string]: {
      netIncome: number;
      taxIncome: number;
      grossIncomeWithTax: number;
    };
  }>({});

  // Series and dynamic maximums
  const [alacarteSeries, setAlacarteSeries] = useState<any[]>([]);
  const [banquetSeries, setBanquetSeries] = useState<any[]>([]);
  const [alacarteMax, setAlacarteMax] = useState<number | undefined>(undefined);
  const [banquetMax, setBanquetMax] = useState<number | undefined>(undefined);

  // Shared chart options
  const [chartOptions, setChartOptions] = useState<ApexOptions>(initialChartfourOptions);

  const handleFilterTypeChange = (type: 'daily' | 'monthly' | 'custom') => {
    setFilterType(type);
    if (type === 'daily') {
      const today = new Date();
      const dateStr = getLocalYYYYMMDD(today);
      setStartDate(dateStr);
      setEndDate(dateStr);
    } else if (type === 'monthly') {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(getLocalYYYYMMDD(firstDay));
      setEndDate(getLocalYYYYMMDD(today));
    }
  };

  const generateDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const dateArray: string[] = [];
    let currentDate = startDate;

    const isSameMonth =
      startDate.getFullYear() === endDate.getFullYear() &&
      startDate.getMonth() === endDate.getMonth();
    const isSameYear = startDate.getFullYear() === endDate.getFullYear();

    while (currentDate <= endDate) {
      let formattedDate: string;

      if (!isSameYear) {
        formattedDate = currentDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } else if (!isSameMonth) {
        formattedDate = currentDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      } else {
        formattedDate = currentDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
        });
      }

      if (!dateArray.includes(formattedDate)) {
        dateArray.push(formattedDate);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
  };

  useEffect(() => {
    const newCategories = generateDateRange(startDate, endDate);
    
    setChartOptions((prevOptions) => ({
      ...prevOptions,
      xaxis: {
        ...prevOptions.xaxis,
        categories: newCategories,
      },
      yaxis: {
        ...prevOptions.yaxis,
        labels: {
          formatter: (value) => formatCurrencyRef.current(value),
        },
      },
      tooltip: {
        ...prevOptions.tooltip,
        y: {
          formatter: (value) => formatCurrencyRef.current(value),
        },
      },
    }));
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/profit?start=${startDate}&end=${endDate}`
      );
      
      const formatGroupedArray = (arr: any[]) => {
        return (arr || []).reduce(
          (acc: any, curr: any) => {
            acc[curr.date] = {
              netIncome: curr.netIncome,
              taxIncome: curr.taxIncome,
              grossIncomeWithTax: curr.grossIncomeWithTax,
            };
            return acc;
          },
          {}
        );
      };

      const formattedAlacarteData = formatGroupedArray(response.data.alacarteGroupedData);
      const formattedBanquetData = formatGroupedArray(response.data.banquetGroupedData);

      // Save dynamic breakdown details
      setCategoryBreakdown(response.data.categoryBreakdown || []);
      setTaxRate(response.data.taxRate ?? 10);
      setServiceRate(response.data.serviceRate ?? 0);
      setTaxRateIndividual(response.data.taxRateIndividual ?? 10);
      setLostBreakageRate(response.data.lostBreakageRate ?? 0);

      setAlacarteChartData(formattedAlacarteData);
      setBanquetChartData(formattedBanquetData);
      setTotalAlacarte(response.data.summary?.totalAlacarte ?? 0);
      setTotalBanquet(response.data.summary?.totalBanquet ?? 0);
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  useEffect(() => {
    const dateStrings: string[] = [];
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    let cur = new Date(startObj.getTime());

    while (cur <= endObj) {
      const dateStr = cur.toISOString().split('T')[0];
      dateStrings.push(dateStr);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    const netIncomeData = dateStrings.map((d) =>
      Number((alacarteChartData[d]?.netIncome || 0).toFixed(1))
    );
    const taxIncomeData = dateStrings.map((d) =>
      Number((alacarteChartData[d]?.taxIncome || 0).toFixed(1))
    );
    const grossIncomeWithTaxData = dateStrings.map((d) =>
      Number((alacarteChartData[d]?.grossIncomeWithTax || 0).toFixed(1))
    );
    const maxVal = grossIncomeWithTaxData.length > 0 ? Math.max(...grossIncomeWithTaxData) + 1 : 100;

    setAlacarteSeries([
      { name: 'Net Profit', data: netIncomeData },
      { name: 'Pajak', data: taxIncomeData },
      { name: 'Omset Kotor', data: grossIncomeWithTaxData },
    ]);
    setAlacarteMax(maxVal);
  }, [alacarteChartData, startDate, endDate]);

  useEffect(() => {
    const dateStrings: string[] = [];
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    let cur = new Date(startObj.getTime());

    while (cur <= endObj) {
      const dateStr = cur.toISOString().split('T')[0];
      dateStrings.push(dateStr);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    const netIncomeData = dateStrings.map((d) =>
      Number((banquetChartData[d]?.netIncome || 0).toFixed(1))
    );
    const taxIncomeData = dateStrings.map((d) =>
      Number((banquetChartData[d]?.taxIncome || 0).toFixed(1))
    );
    const grossIncomeWithTaxData = dateStrings.map((d) =>
      Number((banquetChartData[d]?.grossIncomeWithTax || 0).toFixed(1))
    );
    const maxVal = grossIncomeWithTaxData.length > 0 ? Math.max(...grossIncomeWithTaxData) + 1 : 100;

    setBanquetSeries([
      { name: 'Net Profit', data: netIncomeData },
      { name: 'Pajak', data: taxIncomeData },
      { name: 'Omset Kotor', data: grossIncomeWithTaxData },
    ]);
    setBanquetMax(maxVal);
  }, [banquetChartData, startDate, endDate]);

  // Aggregate breakdown stats
  const totalGrossIncome = categoryBreakdown.reduce((acc, curr) => acc + curr.grossIncome, 0);
  const totalTaxIncome = categoryBreakdown.reduce((acc, curr) => acc + curr.taxIncome, 0);
  const totalNetProfit = categoryBreakdown.reduce((acc, curr) => acc + curr.netProfit, 0);

  const nettRevenue = totalGrossIncome - totalTaxIncome;
  const banquetRevenue = totalBanquet;
  const alacarteRevenue = totalAlacarte;

  const foodRevenue = categoryBreakdown
    .filter((item) => item.category.toUpperCase() === 'FOOD')
    .reduce((acc, curr) => acc + curr.grossIncome, 0);

  const beverageRevenue = categoryBreakdown
    .filter((item) => item.category.toUpperCase() === 'BEVERAGE')
    .reduce((acc, curr) => acc + curr.grossIncome, 0);

  const otherRevenue = Math.max(0, alacarteRevenue - foodRevenue - beverageRevenue);

  const serviceCharge = taxRate > 0 ? (totalTaxIncome * serviceRate) / taxRate : 0;
  const taxAmount = taxRate > 0 ? (totalTaxIncome * taxRateIndividual) / taxRate : 0;
  const lostBreakageAmount = taxRate > 0 ? (totalTaxIncome * lostBreakageRate) / taxRate : 0;

  return (
    <div className="flex flex-col gap-6 w-full h-full min-h-0">
      
      {/* Filters & Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 dark:border-white/[0.05] pb-5">
        <div>
          <h2 className="text-sm font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            Navigasi Periode Keuangan
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-neutral-100 dark:bg-zinc-900 p-1 rounded-lg">
          <button
            onClick={() => handleFilterTypeChange('daily')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filterType === 'daily'
                ? 'bg-white dark:bg-zinc-800 text-neutral-800 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
            }`}
          >
            Harian
          </button>
          <button
            onClick={() => handleFilterTypeChange('monthly')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filterType === 'monthly'
                ? 'bg-white dark:bg-zinc-800 text-neutral-800 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
            }`}
          >
            Bulanan
          </button>
          <button
            onClick={() => handleFilterTypeChange('custom')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filterType === 'custom'
                ? 'bg-white dark:bg-zinc-800 text-neutral-800 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
            }`}
          >
            Kustom
          </button>
        </div>
      </div>

      {filterType === 'custom' && (
        <div className="flex gap-4 items-center bg-neutral-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-neutral-100 dark:border-white/[0.05]">
          <div className="flex gap-4 items-center">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Date Range:</span>
            <div className="flex gap-2 items-center">
              <label className="text-xs text-neutral-400">Start</label>
              <Input
                className="h-8 w-36 text-xs rounded-lg border-neutral-200 dark:border-white/[0.08]"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-xs text-neutral-400">End</label>
              <Input
                className="h-8 w-36 text-xs rounded-lg border-neutral-200 dark:border-white/[0.08]"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Overview Metrics Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* 1. Gross Revenue */}
        <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold text-neutral-450 uppercase tracking-wider">1. Gross Revenue</span>
            <span className="text-xl font-bold text-neutral-850 dark:text-white">{formatCurrency(totalGrossIncome)}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
            <Landmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* 2. Nett Revenue */}
        <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold text-neutral-450 uppercase tracking-wider">2. Nett Revenue</span>
            <span className="text-xl font-bold text-neutral-850 dark:text-white">{formatCurrency(nettRevenue)}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        {/* 3. Banquet Revenue */}
        <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold text-neutral-450 uppercase tracking-wider">3. Banquet Revenue</span>
            <span className="text-xl font-bold text-neutral-850 dark:text-white">{formatCurrency(banquetRevenue)}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
            <Layers className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        {/* 4. Alacarte Revenue */}
        <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-0.5 w-full mr-2">
            <span className="text-[11px] font-semibold text-neutral-450 uppercase tracking-wider">4. Alacarte Revenue</span>
            <span className="text-xl font-bold text-neutral-850 dark:text-white">{formatCurrency(alacarteRevenue)}</span>
            <div className="flex gap-2 mt-1.5 pt-1.5 border-t border-neutral-100 dark:border-white/[0.04] text-[10px] text-neutral-450">
              <span className="font-medium italic">Food: {formatCurrency(foodRevenue)}</span>
              <span className="text-neutral-300">|</span>
              <span className="font-medium italic">Bev: {formatCurrency(beverageRevenue)}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center shrink-0">
            <BarChart4 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        {/* 5. Service Charge */}
        <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex items-center justify-between shadow-sm bg-gradient-to-br from-white to-neutral-50/10 dark:from-zinc-900 dark:to-zinc-950">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold text-neutral-505 uppercase tracking-wider">5. Service Charge ({serviceRate}%)</span>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(serviceCharge)}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
            <Percent className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* 6. Tax */}
        <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex items-center justify-between shadow-sm bg-gradient-to-br from-white to-neutral-50/10 dark:from-zinc-900 dark:to-zinc-950">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold text-neutral-505 uppercase tracking-wider">6. Tax ({taxRateIndividual}%)</span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(taxAmount)}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
            <Percent className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        {/* 7. Lost & Breakage */}
        <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex items-center justify-between shadow-sm bg-gradient-to-br from-white to-neutral-50/10 dark:from-zinc-900 dark:to-zinc-950">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold text-neutral-505 uppercase tracking-wider">7. Lost & Breakage Fee ({lostBreakageRate}%)</span>
            <span className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(lostBreakageAmount)}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
            <Percent className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* 8. Total Service & Tax */}
        <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex items-center justify-between shadow-sm bg-gradient-to-br from-white to-neutral-50/10 dark:from-zinc-900 dark:to-zinc-950">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold text-neutral-505 uppercase tracking-wider">8. Total Service & Tax ({taxRate}%)</span>
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(totalTaxIncome)}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
            <Percent className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
      </div>

      {/* ── Revenue Split Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ala Carte Chart */}
        <div className="rounded-xl border border-neutral-250 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-800 dark:text-white">A la Carte Revenue Timeline</h3>
              <Badge variant="outline" className="text-[10px]">{formatCurrency(totalAlacarte)}</Badge>
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-550 mt-0.5">Pendapatan bersih, pajak, dan omset A la Carte.</p>
          </div>
          <div id="chartAlacarte" className="-ml-5">
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-xs text-neutral-400">Loading...</div>
            ) : (
              <ReactApexChart
                options={{
                  ...chartOptions,
                  yaxis: {
                    ...chartOptions.yaxis,
                    max: alacarteMax,
                  }
                }}
                series={alacarteSeries}
                type="line"
                height={300}
                width={'100%'}
              />
            )}
          </div>
        </div>

        {/* Banquet Chart */}
        <div className="rounded-xl border border-neutral-250 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-800 dark:text-white">Banquet Revenue Timeline</h3>
              <Badge variant="outline" className="text-[10px]">{formatCurrency(totalBanquet)}</Badge>
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-550 mt-0.5">Pendapatan bersih, pajak, dan omset dari event Banquet.</p>
          </div>
          <div id="chartBanquet" className="-ml-5">
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-xs text-neutral-400">Loading...</div>
            ) : (
              <ReactApexChart
                options={{
                  ...chartOptions,
                  yaxis: {
                    ...chartOptions.yaxis,
                    max: banquetMax,
                  }
                }}
                series={banquetSeries}
                type="line"
                height={300}
                width={'100%'}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Category & Subcategory Income Breakdown Table ── */}
      <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col mt-4">
        
        {/* Table Header block */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-white/[0.06] bg-gradient-to-r from-neutral-50 to-white dark:from-zinc-900 dark:to-zinc-950">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-neutral-500" />
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Detail Pendapatan per Kategori & Sub-Kategori</h2>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {categoryBreakdown.length} sub-divisi
          </Badge>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-neutral-400">Memuat rincian laporan keuangan...</div>
          ) : categoryBreakdown.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">Tidak ada transaksi keuangan pada periode ini.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-neutral-500 bg-neutral-55/60 dark:bg-zinc-900/50 border-b border-neutral-100 dark:border-white/[0.04] text-left">
                  <th className="px-5 py-3 font-bold">Item Laporan Keuangan</th>
                  <th className="px-5 py-3 font-bold text-right">Nilai Pendapatan</th>
                </tr>
              </thead>
              <tbody>
                {/* 1. Gross Revenue */}
                <tr className="bg-neutral-50/50 dark:bg-zinc-900/30 font-bold border-b border-neutral-100 dark:border-white/[0.03] text-xs">
                  <td className="px-5 py-3.5 text-neutral-800 dark:text-white uppercase tracking-wider">1. Gross Revenue</td>
                  <td className="px-5 py-3.5 text-right text-neutral-800 dark:text-white">{formatCurrency(totalGrossIncome)}</td>
                </tr>

                {/* 2. Nett Revenue */}
                <tr className="bg-neutral-50/50 dark:bg-zinc-900/30 font-bold border-b border-neutral-100 dark:border-white/[0.03] text-xs">
                  <td className="px-5 py-3.5 text-neutral-800 dark:text-white uppercase tracking-wider">2. Nett Revenue</td>
                  <td className="px-5 py-3.5 text-right text-neutral-800 dark:text-white">{formatCurrency(nettRevenue)}</td>
                </tr>

                {/* 3. Banquet Revenue */}
                <tr className="border-b border-neutral-100 dark:border-white/[0.03] text-xs">
                  <td className="px-5 py-3 text-neutral-700 dark:text-neutral-300 pl-8">3. Banquet Revenue</td>
                  <td className="px-5 py-3 text-right text-neutral-750 dark:text-neutral-200">{formatCurrency(banquetRevenue)}</td>
                </tr>

                {/* 4. Alacarte Revenue */}
                <tr className="border-b border-neutral-100 dark:border-white/[0.03] text-xs">
                  <td className="px-5 py-3 text-neutral-700 dark:text-neutral-300 pl-8 font-semibold">4. Alacarte Revenue</td>
                  <td className="px-5 py-3 text-right text-neutral-750 dark:text-neutral-200 font-semibold">{formatCurrency(alacarteRevenue)}</td>
                </tr>

                {/* Food */}
                <tr className="border-b border-neutral-100 dark:border-white/[0.03] text-[11px] text-neutral-500">
                  <td className="px-5 py-2.5 pl-12 font-medium italic">— Food</td>
                  <td className="px-5 py-2.5 text-right font-medium">{formatCurrency(foodRevenue)}</td>
                </tr>

                {/* Beverage */}
                <tr className="border-b border-neutral-100 dark:border-white/[0.03] text-[11px] text-neutral-500">
                  <td className="px-5 py-2.5 pl-12 font-medium italic">— Beverage</td>
                  <td className="px-5 py-2.5 text-right font-medium">{formatCurrency(beverageRevenue)}</td>
                </tr>

                {/* Others */}
                {otherRevenue > 0 && (
                  <tr className="border-b border-neutral-100 dark:border-white/[0.03] text-[11px] text-neutral-500">
                    <td className="px-5 py-2.5 pl-12 font-medium italic">— Others</td>
                    <td className="px-5 py-2.5 text-right font-medium">{formatCurrency(otherRevenue)}</td>
                  </tr>
                )}

                {/* 5. Service Charge */}
                <tr className="border-b border-neutral-100 dark:border-white/[0.03] text-xs">
                  <td className="px-5 py-3 text-neutral-700 dark:text-neutral-300 pl-8">5. Service Charge ({serviceRate}%)</td>
                  <td className="px-5 py-3 text-right text-blue-600 dark:text-blue-400 font-medium">{formatCurrency(serviceCharge)}</td>
                </tr>

                {/* 6. Tax */}
                <tr className="border-b border-neutral-100 dark:border-white/[0.03] text-xs">
                  <td className="px-5 py-3 text-neutral-700 dark:text-neutral-300 pl-8">6. Tax ({taxRateIndividual}%)</td>
                  <td className="px-5 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">{formatCurrency(taxAmount)}</td>
                </tr>

                {/* 7. Lost & Breakage */}
                <tr className="border-b border-neutral-100 dark:border-white/[0.03] text-xs">
                  <td className="px-5 py-3 text-neutral-700 dark:text-neutral-300 pl-8">7. Lost & Breakage Fee ({lostBreakageRate}%)</td>
                  <td className="px-5 py-3 text-right text-red-600 dark:text-red-400 font-medium">{formatCurrency(lostBreakageAmount)}</td>
                </tr>

                {/* 8. Total Service & Tax */}
                <tr className="bg-neutral-50/50 dark:bg-zinc-900/30 font-bold text-xs">
                  <td className="px-5 py-3.5 text-neutral-800 dark:text-white uppercase tracking-wider">8. Total Service & Tax ({taxRate}%)</td>
                  <td className="px-5 py-3.5 text-right text-amber-600 dark:text-amber-400">{formatCurrency(totalTaxIncome)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Cost Sections (Food, Beverage, Banquet) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {/* Food Cost Table */}
        <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-white/[0.06] bg-gradient-to-r from-neutral-50 to-white dark:from-zinc-900 dark:to-zinc-950">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-neutral-500" />
              <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Food Cost</h2>
            </div>
            <Badge variant="secondary" className="text-[9px] uppercase tracking-wider">
              Draft
            </Badge>
          </div>
          <div className="p-8 flex flex-col items-center justify-center text-center gap-2 min-h-[160px]">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Coming Soon</span>
            <span className="text-[11px] text-neutral-450 dark:text-neutral-500">Rincian laporan HPP Makanan sedang disiapkan.</span>
          </div>
        </div>

        {/* Beverage Cost Table */}
        <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-white/[0.06] bg-gradient-to-r from-neutral-50 to-white dark:from-zinc-900 dark:to-zinc-950">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-neutral-500" />
              <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Beverage Cost</h2>
            </div>
            <Badge variant="secondary" className="text-[9px] uppercase tracking-wider">
              Draft
            </Badge>
          </div>
          <div className="p-8 flex flex-col items-center justify-center text-center gap-2 min-h-[160px]">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Coming Soon</span>
            <span className="text-[11px] text-neutral-450 dark:text-neutral-500">Rincian laporan HPP Minuman sedang disiapkan.</span>
          </div>
        </div>

        {/* Banquet Cost Table */}
        <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-white/[0.06] bg-gradient-to-r from-neutral-50 to-white dark:from-zinc-900 dark:to-zinc-950">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-neutral-500" />
              <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Banquet Cost</h2>
            </div>
            <Badge variant="secondary" className="text-[9px] uppercase tracking-wider">
              Draft
            </Badge>
          </div>
          <div className="p-8 flex flex-col items-center justify-center text-center gap-2 min-h-[160px]">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Coming Soon</span>
            <span className="text-[11px] text-neutral-450 dark:text-neutral-500">Rincian laporan HPP Banquet sedang disiapkan.</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ChartFour;
