import React from 'react';
import Link from 'next/link';
import { Landmark, DollarSign, Layers, BarChart4, Percent } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

interface OverviewMetricsProps {
  startDate: string;
  endDate: string;
  totalGrossIncome: number;
  nettRevenue: number;
  banquetRevenue: number;
  alacarteRevenue: number;
  foodRevenue: number;
  beverageRevenue: number;
  serviceRate: number;
  serviceCharge: number;
  taxRateIndividual: number;
  taxAmount: number;
  lostBreakageRate: number;
  lostBreakageAmount: number;
  taxRate: number;
  totalTaxIncome: number;
}

export const OverviewMetrics: React.FC<OverviewMetricsProps> = ({
  startDate,
  endDate,
  totalGrossIncome,
  nettRevenue,
  banquetRevenue,
  alacarteRevenue,
  foodRevenue,
  beverageRevenue,
  serviceRate,
  serviceCharge,
  taxRateIndividual,
  taxAmount,
  lostBreakageRate,
  lostBreakageAmount,
  taxRate,
  totalTaxIncome,
}) => {
  const { formatCurrency } = useCurrency();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {/* 1. Gross Revenue */}
      <Link href={`/records?startDate=${startDate}&endDate=${endDate}`} className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex items-center justify-between shadow-sm hover:border-neutral-300 dark:hover:border-white/[0.1] transition-colors cursor-pointer group">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold text-neutral-450 uppercase tracking-wider group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">1. Gross Revenue</span>
          <span className="text-xl font-bold text-neutral-850 dark:text-white">{formatCurrency(totalGrossIncome)}</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
          <Landmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
      </Link>

      {/* 2. Nett Revenue */}
      <Link href={`/records?startDate=${startDate}&endDate=${endDate}`} className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex items-center justify-between shadow-sm hover:border-neutral-300 dark:hover:border-white/[0.1] transition-colors cursor-pointer group">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold text-neutral-450 uppercase tracking-wider group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">2. Nett Revenue</span>
          <span className="text-xl font-bold text-neutral-850 dark:text-white">{formatCurrency(nettRevenue)}</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
      </Link>

      {/* 3. Banquet Revenue */}
      <Link href={`/records?startDate=${startDate}&endDate=${endDate}`} className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex items-center justify-between shadow-sm hover:border-neutral-300 dark:hover:border-white/[0.1] transition-colors cursor-pointer group">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold text-neutral-450 uppercase tracking-wider group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">3. Banquet Revenue</span>
          <span className="text-xl font-bold text-neutral-850 dark:text-white">{formatCurrency(banquetRevenue)}</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
          <Layers className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
      </Link>

      {/* 4. Alacarte Revenue */}
      <Link href={`/records?startDate=${startDate}&endDate=${endDate}`} className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex items-center justify-between shadow-sm hover:border-neutral-300 dark:hover:border-white/[0.1] transition-colors cursor-pointer group">
        <div className="flex flex-col gap-0.5 w-full mr-2">
          <span className="text-[11px] font-semibold text-neutral-450 uppercase tracking-wider group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">4. Alacarte Revenue</span>
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
      </Link>

      {/* 5. Service Charge */}
      <Link href={`/records?startDate=${startDate}&endDate=${endDate}`} className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex items-center justify-between shadow-sm bg-gradient-to-br from-white to-neutral-50/10 dark:from-zinc-900 dark:to-zinc-950 hover:border-neutral-300 dark:hover:border-white/[0.1] transition-colors cursor-pointer group">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold text-neutral-505 uppercase tracking-wider group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">5. Service Charge ({serviceRate}%)</span>
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(serviceCharge)}</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
          <Percent className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
      </Link>

      {/* 6. Tax */}
      <Link href={`/records?startDate=${startDate}&endDate=${endDate}`} className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex items-center justify-between shadow-sm bg-gradient-to-br from-white to-neutral-50/10 dark:from-zinc-900 dark:to-zinc-950 hover:border-neutral-300 dark:hover:border-white/[0.1] transition-colors cursor-pointer group">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold text-neutral-505 uppercase tracking-wider group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">6. Tax ({taxRateIndividual}%)</span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(taxAmount)}</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
          <Percent className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
      </Link>

      {/* 7. Lost & Breakage */}
      <Link href={`/records?startDate=${startDate}&endDate=${endDate}`} className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex items-center justify-between shadow-sm bg-gradient-to-br from-white to-neutral-50/10 dark:from-zinc-900 dark:to-zinc-950 hover:border-neutral-300 dark:hover:border-white/[0.1] transition-colors cursor-pointer group">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold text-neutral-505 uppercase tracking-wider group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">7. Lost & Breakage Fee ({lostBreakageRate}%)</span>
          <span className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(lostBreakageAmount)}</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
          <Percent className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
      </Link>

      {/* 8. Total Service & Tax */}
      <Link href={`/records?startDate=${startDate}&endDate=${endDate}`} className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex items-center justify-between shadow-sm bg-gradient-to-br from-white to-neutral-50/10 dark:from-zinc-900 dark:to-zinc-950 hover:border-neutral-300 dark:hover:border-white/[0.1] transition-colors cursor-pointer group">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold text-neutral-505 uppercase tracking-wider group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">8. Total Service & Tax ({taxRate}%)</span>
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(totalTaxIncome)}</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
          <Percent className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
      </Link>
    </div>
  );
};
