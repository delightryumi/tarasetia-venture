'use client';

import { Clock } from 'lucide-react';
import { ShiftData } from './types';

interface ActiveShiftPanelProps {
  activeShift: ShiftData;
  expectedCashInDrawer: number;
  formatMoney: (val: number) => string;
  formatDate: (val: any) => string;
}

export default function ActiveShiftPanel({
  activeShift,
  expectedCashInDrawer,
  formatMoney,
  formatDate
}: ActiveShiftPanelProps) {

  // Calculate active sales
  const activeSales: Record<string, number> = {
    cash: 0,
    qris: 0,
    card: 0,
    transfer: 0,
    total: 0,
    count: 0
  };

  if (activeShift && activeShift.transactions) {
    activeShift.transactions.forEach((tx) => {
      const method = tx.method || 'cash';
      if (activeSales[method] !== undefined) {
        activeSales[method] += (tx.amount || 0);
      } else {
        activeSales[method] = (tx.amount || 0);
      }
      activeSales.total += (tx.amount || 0);
      activeSales.count += 1;
    });
  }

  return (
    <div className="space-y-6">
      {/* Widgets row styled like clock/weather grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Expected Cash */}
        <div className="rounded-2xl border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-950 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Estimated Cash in Drawer</span>
          <span className="text-3xl font-black text-neutral-800 dark:text-white mt-3">
            {formatMoney(expectedCashInDrawer)}
          </span>
          <span className="text-[10px] text-neutral-400 mt-2 block">House Bank + Sales Tunai</span>
        </div>

        {/* Sales Revenue */}
        <div className="rounded-2xl border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-950 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Total Shift Revenue</span>
          <span className="text-3xl font-black text-emerald-500 mt-3">
            {formatMoney(activeSales.total)}
          </span>
          <span className="text-[10px] text-neutral-400 mt-2 block">{activeSales.count} Transaksi Terproses</span>
        </div>

        {/* Cashier Info */}
        <div className="rounded-2xl border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-950 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Active Shift Session</span>
          <div className="flex flex-col mt-3">
            <span className="text-sm font-bold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-neutral-400" />
              {formatDate(activeShift.openedAt).split(',')[1] || formatDate(activeShift.openedAt)}
            </span>
            <span className="text-[10px] text-neutral-400 mt-2 font-medium">
              Kasir: {activeShift.cashierName}
            </span>
          </div>
        </div>
      </div>

      {/* SALES BREAKDOWN */}
      <div className="rounded-2xl border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-950 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
          Rincian Penerimaan Sales
        </h3>
        <div className="w-full h-[1px] bg-neutral-200 dark:bg-white/[0.1]" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          <div className="bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.05] p-4 rounded-xl shadow-sm hover:scale-[1.01] transition-transform">
            <span className="text-[10px] text-neutral-400 font-bold block mb-1">TUNAI / CASH</span>
            <span className="text-base font-black text-neutral-800 dark:text-neutral-200">
              {formatMoney(activeSales.cash || 0)}
            </span>
          </div>

          <div className="bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.05] p-4 rounded-xl shadow-sm hover:scale-[1.01] transition-transform">
            <span className="text-[10px] text-neutral-400 font-bold block mb-1">QRIS / E-MONEY</span>
            <span className="text-base font-black text-neutral-800 dark:text-neutral-200">
              {formatMoney(activeSales.qris || 0)}
            </span>
          </div>

          <div className="bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.05] p-4 rounded-xl shadow-sm hover:scale-[1.01] transition-transform">
            <span className="text-[10px] text-neutral-400 font-bold block mb-1">DEBIT / KARTU</span>
            <span className="text-base font-black text-neutral-800 dark:text-neutral-200">
              {formatMoney(activeSales.card || 0)}
            </span>
          </div>
          
          <div className="bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.05] p-4 rounded-xl shadow-sm hover:scale-[1.01] transition-transform">
            <span className="text-[10px] text-neutral-400 font-bold block mb-1">TRANSFER BANK</span>
            <span className="text-base font-black text-neutral-800 dark:text-neutral-200">
              {formatMoney(activeSales.transfer || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
