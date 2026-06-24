'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { History, FileText, Search, CreditCard, Banknote } from 'lucide-react';
import { ShiftData } from './types';

interface ShiftHistoryListProps {
  shiftHistory: ShiftData[];
  historyDateFilter: string;
  setHistoryDateFilter: (val: string) => void;
  formatMoney: (val: number) => string;
  formatDate: (val: any) => string;
  onOpenHistoryModal: (shift: ShiftData) => void;
  onOpenDetailModal: (shift: ShiftData) => void;
  getSalesBreakdown: (shift: ShiftData) => { total: number; cash: number; qris: number; card: number };
}

export default function ShiftHistoryList({
  shiftHistory,
  historyDateFilter,
  setHistoryDateFilter,
  formatMoney,
  formatDate,
  onOpenHistoryModal,
  onOpenDetailModal,
  getSalesBreakdown
}: ShiftHistoryListProps) {
  
  const filteredHistory = shiftHistory.filter(s => {
    if (!historyDateFilter) return true;
    try {
      const d = s.openedAt && typeof s.openedAt === 'object' && 'toDate' in s.openedAt 
        ? (s.openedAt as any).toDate() 
        : new Date(s.openedAt);
      const ds = d.toISOString().split('T')[0];
      return ds === historyDateFilter;
    } catch {
      return true;
    }
  });

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-950 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neutral-100 dark:bg-zinc-900 text-neutral-600 dark:text-neutral-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-800 dark:text-white">Riwayat Shift Kasir</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Lihat data penjualan dan selisih laci per shift.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="dateFilter" className="text-xs font-semibold text-neutral-500 whitespace-nowrap">Filter Tanggal:</Label>
          <div className="relative">
            <Input
              id="dateFilter"
              type="date"
              value={historyDateFilter}
              onChange={(e) => setHistoryDateFilter(e.target.value)}
              className="h-9 w-40 text-xs bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl pr-8"
            />
            {historyDateFilter && (
              <button 
                onClick={() => setHistoryDateFilter('')}
                className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 text-[10px] font-bold"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHistory.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 dark:border-zinc-800 rounded-2xl">
            <Search className="w-8 h-8 text-neutral-300 dark:text-zinc-700 mb-3" />
            <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Tidak ada riwayat shift ditemukan</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Coba sesuaikan filter pencarian tanggal.</p>
          </div>
        ) : (
          filteredHistory.map((s) => {
            const b = getSalesBreakdown(s);
            let tIn = s.cashIn || 0;
            let tOut = s.cashOut || 0;
            if (s.cashFlows) {
              tIn += s.cashFlows.filter(cf => cf.type === 'in').reduce((acc,cf) => acc + cf.amount, 0);
              tOut += s.cashFlows.filter(cf => cf.type === 'out').reduce((acc,cf) => acc + cf.amount, 0);
            }
            
            const expected = s.houseBank + b.cash + tIn - tOut;
            const diff = (s.countedCash || 0) - expected;

            return (
              <div key={s.id} className="relative group p-5 rounded-2xl border border-neutral-200 dark:border-white/[0.05] bg-white dark:bg-zinc-900/50 hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-all duration-300 flex flex-col gap-4 shadow-sm hover:shadow-md">
                
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-neutral-800 dark:text-white text-sm">{s.cashierName}</h4>
                    <span className="text-[10px] text-neutral-500 font-medium tracking-wide bg-neutral-100 dark:bg-zinc-800 px-2 py-0.5 rounded mt-1 inline-block">
                      {s.id.substring(0, 8)}...
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => onOpenDetailModal(s)}
                      className="p-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-600 dark:text-neutral-300 rounded-lg transition-colors"
                      title="Lihat Detail Transaksi PDF"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onOpenHistoryModal(s)}
                      className="p-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-600 dark:text-neutral-300 rounded-lg transition-colors"
                      title="Lihat Closing Slip / Print"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase">Dibuka</span>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{formatDate(s.openedAt)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase">Ditutup</span>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{s.closedAt ? formatDate(s.closedAt) : '-'}</span>
                  </div>
                </div>

                <div className="w-full h-[1px] bg-neutral-100 dark:bg-white/[0.05]" />

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between bg-neutral-50 dark:bg-zinc-950 p-2 rounded-lg border border-neutral-100 dark:border-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CreditCard className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Total Sales</span>
                    </div>
                    <span className="font-black text-sm text-neutral-800 dark:text-white">
                      {formatMoney(b.total)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs text-neutral-500 flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5" /> Selisih Kas:
                    </span>
                    <span className={`text-xs font-bold ${diff === 0 ? 'text-emerald-500' : diff > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                      {diff === 0 ? 'Balanced' : diff > 0 ? `+${formatMoney(diff)}` : formatMoney(diff)}
                    </span>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
