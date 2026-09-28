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
  const activeSales: Record<string, number> = {
    cash: 0,
    qris: 0,
    card: 0,
    compliment: 0,
    total: 0,
    count: 0
  };

  if (activeShift && activeShift.transactions) {
    activeShift.transactions.forEach((tx: any) => {
      if (tx.status === 'CANCELLED' || tx.status === 'VOID') {
        return;
      }
      const isCompliment = !!tx.isCompliment || 
                           tx.method?.toLowerCase() === 'compliment' || 
                           tx.paymentMethod?.toLowerCase() === 'compliment';
      const amt = tx.amount || 0;
      const m = (tx.method || tx.paymentMethod || 'cash').toLowerCase().trim();

      if (isCompliment) {
        activeSales.compliment += amt;
      } else if (m === 'cash' || m === 'tunai') {
        activeSales.cash += amt;
        activeSales.total += amt;
      } else if (m === 'qris' || m === 'e-money' || m === 'emoney') {
        activeSales.qris += amt;
        activeSales.total += amt;
      } else if (m === 'card' || m === 'edc' || m === 'debit' || m === 'kredit' || m === 'credit' || m === 'kartu' || m === 'transfer') {
        activeSales.card += amt;
        activeSales.total += amt;
      } else {
        activeSales.qris += amt;
        activeSales.total += amt;
      }
      activeSales.count += 1;
    });
  }

  return (
    <div className="space-y-6">
      {/* NextLevel tactile metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Opening House Bank */}
        <div className="rounded-2xl border border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-950 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Modal Awal Kas</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300">
              House Bank
            </span>
          </div>
          <span className="text-2xl lg:text-3xl font-black text-neutral-900 dark:text-white mt-3 tracking-tight">
            {formatMoney(activeShift.houseBank || 0)}
          </span>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 block">Kas fisik awal di laci</span>
        </div>

        {/* Expected Cash in Drawer */}
        <div className="rounded-2xl border border-emerald-500/20 dark:border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.04] to-transparent dark:from-emerald-500/[0.08] dark:to-transparent p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Estimasi Uang Fisik Laci</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              Wajib di Laci
            </span>
          </div>
          <span className="text-2xl lg:text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-3 tracking-tight">
            {formatMoney(expectedCashInDrawer)}
          </span>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 block">
            Modal ({formatMoney(activeShift.houseBank || 0)}) + Sales Tunai ({formatMoney(activeSales.cash || 0)})
          </span>
        </div>

        {/* Total Shift Revenue */}
        <div className="rounded-2xl border border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-950 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Total Omset Shift</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300">
              {activeSales.count} Transaksi
            </span>
          </div>
          <span className="text-2xl lg:text-3xl font-black text-neutral-900 dark:text-white mt-3 tracking-tight">
            {formatMoney(activeSales.total)}
          </span>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 block">Seluruh metode pembayaran</span>
        </div>

        {/* Active Cashier Info */}
        <div className="rounded-2xl border border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-950 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Status Sesi Kasir</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Aktif
            </span>
          </div>
          <div className="flex flex-col mt-2">
            <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-neutral-400" />
              {formatDate(activeShift.openedAt).split(',')[1] || formatDate(activeShift.openedAt)}
            </span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1.5 font-medium">
              Petugas: <strong className="text-neutral-800 dark:text-neutral-200">{activeShift.cashierName}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* SALES BREAKDOWN */}
      <div className="rounded-2xl border border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-950 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
            Rincian Penerimaan Sales per Metode
          </h3>
          <span className="text-[11px] text-neutral-400 font-medium">Sinkronisasi Realtime</span>
        </div>
        <div className="w-full h-px bg-neutral-200/70 dark:bg-white/[0.08]" />
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="bg-neutral-50/80 dark:bg-zinc-900 border border-neutral-200/80 dark:border-white/[0.06] p-4 rounded-xl shadow-xs hover:border-neutral-300 dark:hover:border-white/[0.12] transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold tracking-wide">TUNAI / CASH</span>
              <span className="text-[9.5px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">Di Laci</span>
            </div>
            <span className="text-lg font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
              {formatMoney(activeSales.cash || 0)}
            </span>
          </div>

          <div className="bg-neutral-50/80 dark:bg-zinc-900 border border-neutral-200/80 dark:border-white/[0.06] p-4 rounded-xl shadow-xs hover:border-neutral-300 dark:hover:border-white/[0.12] transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold tracking-wide">QRIS / E-MONEY</span>
              <span className="text-[9.5px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/30 px-1.5 py-0.5 rounded">Digital</span>
            </div>
            <span className="text-lg font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
              {formatMoney(activeSales.qris || 0)}
            </span>
          </div>

          <div className="bg-neutral-50/80 dark:bg-zinc-900 border border-neutral-200/80 dark:border-white/[0.06] p-4 rounded-xl shadow-xs hover:border-neutral-300 dark:hover:border-white/[0.12] transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold tracking-wide">KARTU (EDC) / TRANSFER</span>
              <span className="text-[9.5px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/30 px-1.5 py-0.5 rounded">Bank</span>
            </div>
            <span className="text-lg font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
              {formatMoney(activeSales.card || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
