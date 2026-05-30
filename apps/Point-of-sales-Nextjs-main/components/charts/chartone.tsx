'use client';

import { ApexOptions } from 'apexcharts';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { initialChartoneOptions } from '@/lib/charts';
import { useCurrency } from '@/hooks/useCurrency';
import { Badge } from '@/components/ui/badge';
import { Tag, Layers, ChevronDown, ChevronRight, BarChart3, TrendingUp, DollarSign, Package } from 'lucide-react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

interface SeriesData {
  name: string;
  data: number[];
}

interface ItemBreakdown {
  name: string;
  quantity: number;
  revenue: number;
}

interface BreakdownGroup {
  category: string;
  subcategory: string;
  totalQuantity: number;
  totalRevenue: number;
  items: ItemBreakdown[];
}

const PREMIUM_COLORS = ['#3C50E0', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'];

export default function ChartOne() {
  const { formatCurrency } = useCurrency();

  // Date Range state
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7); // Last 7 days by default
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Data states
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Accordion state for table items
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Chart Series & Options state
  const [chartSeries, setChartSeries] = useState<SeriesData[]>([]);
  const [chartOptions, setChartOptions] = useState<ApexOptions>({
    ...initialChartoneOptions,
    colors: PREMIUM_COLORS,
  });

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }));
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/productsale?start=${startDate}&end=${endDate}`
      );
      const { combinedResult, categoryList, breakdown: bkList } = response.data;

      setTimelineData(combinedResult || []);
      setCategories(categoryList || []);
      setBreakdown(bkList || []);

      // Build Series dynamically based on categories returned
      const activeCats = categoryList || [];
      const newSeries: SeriesData[] = activeCats.map((cat: string) => {
        const data = (combinedResult || []).map((day: any) => {
          return day.categories?.[cat] ?? 0;
        });
        return {
          name: cat,
          data,
        };
      });

      setChartSeries(newSeries);

      // Find max value to calibrate y-axis limit
      let maxVal = 0;
      (combinedResult || []).forEach((day: any) => {
        activeCats.forEach((cat: string) => {
          const val = day.categories?.[cat] ?? 0;
          if (val > maxVal) maxVal = val;
        });
      });

      const dateLabels = generateDateRange(startDate, endDate);

      setChartOptions((prev) => ({
        ...prev,
        colors: PREMIUM_COLORS.slice(0, activeCats.length || 1),
        markers: {
          ...prev.markers,
          strokeColors: PREMIUM_COLORS.slice(0, activeCats.length || 1),
        },
        xaxis: {
          ...prev.xaxis,
          categories: dateLabels,
        },
        yaxis: {
          ...prev.yaxis,
          max: maxVal + 2,
        },
      }));
    } catch (error) {
      console.error('Error fetching analytics data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  // Aggregate stats
  const totalQtySold = breakdown.reduce((acc, curr) => acc + curr.totalQuantity, 0);
  const totalRevenue = breakdown.reduce((acc, curr) => acc + curr.totalRevenue, 0);
  const uniqueItemsCount = new Set(breakdown.flatMap((b) => b.items.map((i) => i.name))).size;

  return (
    <div className="flex flex-col gap-6 w-full h-full min-h-0">
      
      {/* ── Top Summary Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Quantity */}
        <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Item Terjual</span>
            <span className="text-xl font-bold text-neutral-850 dark:text-white">{totalQtySold} pcs</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* Total Revenue */}
        <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Total Omset</span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalRevenue)}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        {/* Unique Items */}
        <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Varian Produk</span>
            <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{uniqueItemsCount} menu</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* ── Main Chart Card ── */}
      <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 px-5 pb-5 pt-6 shadow-sm flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-neutral-500" />
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Timeline Tren Penjualan per Kategori</h2>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2 items-center">
              <label className="text-[10px] font-bold text-neutral-400 uppercase">Start:</label>
              <Input
                className="h-8 text-xs w-36 rounded-lg bg-neutral-50 dark:bg-zinc-800 border-neutral-200 dark:border-white/[0.08]"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-[10px] font-bold text-neutral-400 uppercase">End:</label>
              <Input
                className="h-8 text-xs w-36 rounded-lg bg-neutral-50 dark:bg-zinc-800 border-neutral-200 dark:border-white/[0.08]"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <div className="flex gap-1.5 border-l border-neutral-200 dark:border-white/[0.1] pl-3">
              <button
                onClick={() => {
                  const JakartaToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
                  setStartDate(JakartaToday);
                  setEndDate(JakartaToday);
                }}
                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-neutral-700 dark:text-neutral-300 rounded-lg transition-all"
              >
                Hari ini
              </button>
              <button
                onClick={() => {
                  const date = new Date();
                  const firstDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date(date.getFullYear(), date.getMonth(), 1));
                  const lastDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date(date.getFullYear(), date.getMonth() + 1, 0));
                  setStartDate(firstDay);
                  setEndDate(lastDay);
                }}
                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-neutral-700 dark:text-neutral-300 rounded-lg transition-all"
              >
                Bulan ini
              </button>
            </div>
          </div>
        </div>

        {/* Legend Indicator */}
        <div className="flex flex-wrap gap-4 mb-4">
          {categories.map((cat, idx) => (
            <div key={cat} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: PREMIUM_COLORS[idx % PREMIUM_COLORS.length] }}
              />
              <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">{cat}</span>
            </div>
          ))}
        </div>

        {/* Chart render */}
        <div id="chartOne" className="-ml-5">
          {loading ? (
            <div className="h-[380px] flex items-center justify-center">
              <p className="text-xs text-neutral-400">Loading chart data...</p>
            </div>
          ) : (
            <ReactApexChart
              options={chartOptions}
              series={chartSeries}
              type="area"
              height={380}
              width={'100%'}
            />
          )}
        </div>
      </div>

      {/* ── Breakdown Table Card ── */}
      <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
        
        {/* Table Header block */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-white/[0.06] bg-gradient-to-r from-neutral-50 to-white dark:from-zinc-900 dark:to-zinc-950">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-neutral-500" />
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Detail Breakdown Grouping</h2>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {breakdown.length} sub-kelompok
          </Badge>
        </div>

        {/* Detail Breakdown list */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-neutral-400">Memuat breakdown data...</div>
          ) : breakdown.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">Tidak ada data penjualan pada periode ini.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-neutral-500 bg-neutral-55/60 dark:bg-zinc-900/50 border-b border-neutral-100 dark:border-white/[0.04] text-left">
                  <th className="px-5 py-3 font-semibold w-10"></th>
                  <th className="px-4 py-3 font-semibold">Kategori</th>
                  <th className="px-4 py-3 font-semibold text-center">Total Kuantitas</th>
                  <th className="px-5 py-3 font-semibold text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((group, idx) => {
                  const key = `${group.category}-${group.subcategory}`;
                  const isExpanded = !!expandedRows[key];
                  const hasItems = group.items && group.items.length > 0;

                  return (
                    <React.Fragment key={key}>
                      <tr
                        onClick={() => hasItems && toggleRow(key)}
                        className={`border-b border-neutral-100 dark:border-white/[0.03] transition-colors hover:bg-neutral-50 dark:hover:bg-zinc-800/40 cursor-pointer ${
                          isExpanded ? 'bg-neutral-50/50 dark:bg-zinc-800/20' : ''
                        }`}
                      >
                        <td className="px-5 py-3 text-center">
                          {hasItems ? (
                            isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                            )
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[10px] font-bold px-2.5 py-0.5 border-neutral-300">
                            {group.category}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-semibold">
                          {group.totalQuantity} pcs
                        </td>
                        <td className="px-5 py-3 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(group.totalRevenue)}
                        </td>
                      </tr>

                      {/* Expandable item details */}
                      {isExpanded && hasItems && (
                        <tr className="bg-neutral-50/30 dark:bg-zinc-950/20 border-b border-neutral-100 dark:border-white/[0.03]">
                          <td colSpan={4} className="px-8 py-3 bg-neutral-50/30 dark:bg-zinc-950/10">
                            <div className="rounded-lg border border-neutral-100 dark:border-white/[0.05] bg-white dark:bg-zinc-900/60 overflow-hidden shadow-inner max-w-2xl">
                              <table className="w-full">
                                <thead>
                                  <tr className="text-[9px] uppercase font-bold text-neutral-400 border-b border-neutral-100 dark:border-white/[0.04] text-left">
                                    <th className="px-4 py-2">Nama Menu</th>
                                    <th className="px-4 py-2 text-center">Kuantitas</th>
                                    <th className="px-4 py-2 text-right">Revenue</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.items.map((item, itemIdx) => (
                                    <tr
                                      key={itemIdx}
                                      className="border-b border-neutral-50 dark:border-white/[0.02] last:border-none text-xs hover:bg-neutral-50 dark:hover:bg-zinc-800/30"
                                    >
                                      <td className="px-4 py-2 text-neutral-600 dark:text-neutral-350">
                                        {item.name}
                                      </td>
                                      <td className="px-4 py-2 text-center text-neutral-650 dark:text-neutral-300">
                                        {item.quantity} pcs
                                      </td>
                                      <td className="px-4 py-2 text-right font-medium text-neutral-700 dark:text-neutral-200">
                                        {formatCurrency(item.revenue)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
