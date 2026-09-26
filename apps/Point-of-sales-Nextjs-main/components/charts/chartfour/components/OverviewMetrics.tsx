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
      <Link href={`/records?startDate=${startDate}&endDate=${endDate}`} className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex flex-col justify-between shadow-sm hover:border-neutral-300 dark:hover:border-white/[0.1] transition-colors cursor-pointer group">
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex items-center gap-1.5 text-neutral-450 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
            <Landmark className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">1. Gross Revenue</span>
          </div>
          <span className="text-xl font-bold text-neutral-850 dark:text-white">{formatCurrency(totalGrossIncome)}</span>
        </div>
      </Link>

      {/* 2. Nett Revenue */}
      <Link href={`/records?startDate=${startDate}&endDate=${endDate}`} className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex flex-col justify-between shadow-sm hover:border-neutral-300 dark:hover:border-white/[0.1] transition-colors cursor-pointer group">
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex items-center gap-1.5 text-neutral-450 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">2. Nett Revenue</span>
          </div>
          <span className="text-xl font-bold text-neutral-850 dark:text-white">{formatCurrency(nettRevenue)}</span>
        </div>
      </Link>

      {/* 3. Banquet Revenue */}
      <Link href={`/records?startDate=${startDate}&endDate=${endDate}`} className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex flex-col justify-between shadow-sm hover:border-neutral-300 dark:hover:border-white/[0.1] transition-colors cursor-pointer group">
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex items-center gap-1.5 text-neutral-450 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
            <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">3. Banquet Revenue</span>
          </div>
          <span className="text-xl font-bold text-neutral-850 dark:text-white">{formatCurrency(banquetRevenue)}</span>
        </div>
      </Link>

      {/* 4. Alacarte Revenue */}
      <Link href={`/records?startDate=${startDate}&endDate=${endDate}`} className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex flex-col justify-between shadow-sm hover:border-neutral-300 dark:hover:border-white/[0.1] transition-colors cursor-pointer group">
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex items-center gap-1.5 text-neutral-450 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
            <BarChart4 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">4. Alacarte Revenue</span>
          </div>
          <span className="text-xl font-bold text-neutral-850 dark:text-white">{formatCurrency(alacarteRevenue)}</span>
          <div className="flex gap-2 mt-1 pt-1.5 border-t border-neutral-100 dark:border-white/[0.04] text-[10px] text-neutral-450">
            <span className="font-medium italic">Food: {formatCurrency(foodRevenue)}</span>
            <span className="text-neutral-300">|</span>
            <span className="font-medium italic">Bev: {formatCurrency(beverageRevenue)}</span>
          </div>
        </div>
      </Link>

      {/* 5. Service Charge */}
      <Link href={`/records?startDate=${startDate}&endDate=${endDate}`} className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex flex-col justify-between shadow-sm bg-gradient-to-br from-white to-neutral-50/10 dark:from-zinc-900 dark:to-zinc-950 hover:border-neutral-300 dark:hover:border-white/[0.1] transition-colors cursor-pointer group">
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex items-center gap-1.5 text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
            <Percent className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">5. Service Charge ({serviceRate}%)</span>
          </div>
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(serviceCharge)}</span>
        </div>
      </Link>

      {/* 6. Tax */}
      <Link href={`/records?startDate=${startDate}&endDate=${endDate}`} className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex flex-col justify-between shadow-sm bg-gradient-to-br from-white to-neutral-50/10 dark:from-zinc-900 dark:to-zinc-950 hover:border-neutral-300 dark:hover:border-white/[0.1] transition-colors cursor-pointer group">
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex items-center gap-1.5 text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
            <Percent className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">6. Tax ({taxRateIndividual}%)</span>
          </div>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(taxAmount)}</span>
        </div>
      </Link>

      {/* 7. Lost & Breakage */}
      <Link href={`/records?startDate=${startDate}&endDate=${endDate}`} className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex flex-col justify-between shadow-sm bg-gradient-to-br from-white to-neutral-50/10 dark:from-zinc-900 dark:to-zinc-950 hover:border-neutral-300 dark:hover:border-white/[0.1] transition-colors cursor-pointer group">
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex items-center gap-1.5 text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
            <Percent className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">7. Lost & Breakage Fee ({lostBreakageRate}%)</span>
          </div>
          <span className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(lostBreakageAmount)}</span>
        </div>
      </Link>

      {/* 8. Total Service & Tax */}
      <Link href={`/records?startDate=${startDate}&endDate=${endDate}`} className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-4 flex flex-col justify-between shadow-sm bg-gradient-to-br from-white to-neutral-50/10 dark:from-zinc-900 dark:to-zinc-950 hover:border-neutral-300 dark:hover:border-white/[0.1] transition-colors cursor-pointer group">
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex items-center gap-1.5 text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
            <Percent className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">8. Total Service & Tax ({taxRate}%)</span>
          </div>
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(totalTaxIncome)}</span>
        </div>
      </Link>
    </div>
  );
};
