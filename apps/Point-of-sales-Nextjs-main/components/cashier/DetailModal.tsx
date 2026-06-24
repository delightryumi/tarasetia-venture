import { useState, useEffect } from 'react';
import { X, FileText, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShiftData } from './types';

interface DetailModalProps {
  selectedHistoryShift: ShiftData;
  detailTransactions: any[];
  isLoadingDetail: boolean;
  onClose: () => void;
  formatMoney: (val: number) => string;
  formatDate: (val: any) => string;
  getSalesBreakdown: (shift: ShiftData) => { total: number; cash: number; qris: number; card: number };
}

export default function DetailModal({
  selectedHistoryShift,
  detailTransactions,
  isLoadingDetail,
  onClose,
  formatMoney,
  formatDate,
  getSalesBreakdown
}: DetailModalProps) {
  const [outletName, setOutletName] = useState('Partner Property');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const shopRaw = localStorage.getItem('shopData') || localStorage.getItem('shopInfo');
      if (shopRaw) {
        try {
          const shop = JSON.parse(shopRaw);
          if (shop.name) setOutletName(shop.name);
        } catch {}
      }
    }
    // Fetch from /api/shopdata for most accurate outlet name
    fetch('/api/shopdata', { cache: 'no-store' })
      .then(r => r.json())
      .then(res => {
        if (res?.data?.name) setOutletName(res.data.name);
      })
      .catch(() => {});
  }, []);

  const computeBreakdown = () => {
    if (detailTransactions.length > 0) {
      let total = 0, cash = 0, qris = 0, card = 0;
      detailTransactions.forEach(tx => {
        if (tx.status === 'CANCELLED' || tx.status === 'VOID') return;
        const amt = tx.amount ?? tx.total ?? 0;
        const m = (tx.method ?? tx.paymentMethod ?? 'cash').toLowerCase();
        total += amt;
        if (m === 'cash' || m === 'tunai') cash += amt;
        else if (m === 'qris' || m === 'e-money' || m === 'emoney') qris += amt;
        else if (m === 'card' || m === 'debit' || m === 'kredit' || m === 'credit' || m === 'kartu' || m === 'transfer') card += amt;
        else qris += amt; // default non-cash to qris bucket
      });
      return { total, cash, qris, card };
    }
    // fallback: shift.transactions[]
    const fb = getSalesBreakdown(selectedHistoryShift);
    return { ...fb };
  };
  const b = computeBreakdown();

  // ── Compute breakdown from detailTransactions for screen display ──
  let foodTotal = 0;
  let beverageTotal = 0;
  let banquetTotal = 0;
  let otherTotal = 0;

  detailTransactions.forEach(tx => {
    if (tx.status === 'CANCELLED' || tx.status === 'VOID') return;
    const isBanquet = tx.revenueType?.toLowerCase() === 'banquet' || 
                      (tx.category?.toLowerCase() || '').includes('banquet');
    if (isBanquet) {
      banquetTotal += tx.amount ?? tx.total ?? 0;
    } else if (tx.items && Array.isArray(tx.items)) {
      tx.items.forEach((item: any) => {
        const itemTotal = (item.originalPrice ?? item.price ?? 0) * (item.quantity || 1);
        const target = item.pnlTarget?.toUpperCase() || '';
        const cat = item.category?.toUpperCase() || '';
        if (target === 'FOOD' || (!target && cat === 'FOOD')) foodTotal += itemTotal;
        else if (target === 'BEVERAGE' || (!target && cat === 'BEVERAGE')) beverageTotal += itemTotal;
        else if (target === 'BANQUET' || (!target && cat === 'BANQUET')) banquetTotal += itemTotal;
        else otherTotal += itemTotal;
      });
    } else {
      otherTotal += tx.amount ?? tx.total ?? 0;
    }
  });


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.1] rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col gap-1 mb-4 border-b border-neutral-200 dark:border-white/[0.1] pb-4">
          <h2 className="text-lg font-bold text-neutral-800 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            Rincian Transaksi Shift
          </h2>
          <p className="text-xs text-neutral-500">Kasir: {selectedHistoryShift.cashierName} &bull; {formatDate(selectedHistoryShift.openedAt)}</p>
        </div>

        <div className="overflow-y-auto thin-scrollbar flex-1 pr-2">
          {isLoadingDetail ? (
            <div className="flex flex-col items-center justify-center h-40 text-neutral-400">
              <span className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
              <span className="text-xs font-semibold">Mengambil Data Item Transaksi...</span>
            </div>
          ) : detailTransactions.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-neutral-400 text-xs">
              Tidak ada transaksi pada shift ini.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
               {detailTransactions.map((tx, idx) => {
                const isCancelled = tx.status === 'CANCELLED' || tx.status === 'VOID';
                return (
                <div key={idx} className={`p-4 rounded-xl border border-neutral-200 dark:border-white/[0.05] bg-neutral-50 dark:bg-zinc-950/50 flex flex-col gap-3 hover:border-neutral-300 dark:hover:border-white/[0.1] transition-colors shadow-sm ${isCancelled ? 'line-through opacity-60 bg-red-500/5' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                        {tx.id}
                        {isCancelled && (
                          <span className="text-[9px] bg-red-600 text-white font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase font-mono">VOID</span>
                        )}
                      </span>
                      <span className="text-[10px] text-neutral-500 mt-0.5">{formatDate(tx.timestamp)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-black text-neutral-800 dark:text-white">{formatMoney(tx.amount)}</span>
                      <span className="text-[9px] bg-neutral-200 dark:bg-zinc-800 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider mt-1">{tx.method}</span>
                    </div>
                  </div>
                  
                  <div className="w-full h-[1px] bg-neutral-200 dark:bg-white/[0.05]" />
                  
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Menu Terjual:</span>
                    {tx.items && tx.items.length > 0 ? (
                      tx.items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs text-neutral-600 dark:text-neutral-300">
                          <span><span className="font-bold mr-1">{item.quantity}x</span> {item.name || 'Produk'}</span>
                          <span className="font-medium text-neutral-500">{formatMoney((item.price || 0) * (item.quantity || 1))}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-neutral-400 italic">Data item tidak ditemukan</span>
                    )}
                  </div>
                </div>
              );
              })}
              
              {/* Summary Block */}
              <div className="mt-2 mb-4 p-5 rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 flex flex-col shadow-sm">
                <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider border-b border-emerald-500/20 pb-2 mb-3">
                  Total Pendapatan Shift
                </h3>
                
                <div className="flex flex-col gap-2 mb-3">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase">Metode Pembayaran</span>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-600 dark:text-neutral-300 font-medium">Tunai (Cash):</span>
                    <span className="font-bold text-neutral-800 dark:text-white">
                      {formatMoney(b.cash)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-600 dark:text-neutral-300 font-medium">QRIS / E-Money:</span>
                    <span className="font-bold text-neutral-800 dark:text-white">
                      {formatMoney(b.qris)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-600 dark:text-neutral-300 font-medium">Kartu / Transfer:</span>
                    <span className="font-bold text-neutral-800 dark:text-white">
                      {formatMoney(b.card)}
                    </span>
                  </div>
                </div>

                <div className="w-full h-[1px] bg-emerald-500/10 my-2" />

                <div className="flex flex-col gap-2 mt-1 mb-3">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase">Sumber Revenue</span>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-600 dark:text-neutral-300 font-medium">Food Revenue:</span>
                    <span className="font-bold text-neutral-800 dark:text-white">{formatMoney(foodTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-600 dark:text-neutral-300 font-medium">Beverage Revenue:</span>
                    <span className="font-bold text-neutral-800 dark:text-white">{formatMoney(beverageTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-600 dark:text-neutral-300 font-medium">Banquet Revenue:</span>
                    <span className="font-bold text-neutral-800 dark:text-white">{formatMoney(banquetTotal)}</span>
                  </div>
                  {otherTotal > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-600 dark:text-neutral-300 font-medium">Other Revenue:</span>
                      <span className="font-bold text-neutral-800 dark:text-white">{formatMoney(otherTotal)}</span>
                    </div>
                  )}
                </div>

                <div className="w-full h-[1px] bg-emerald-500/10 my-2" />

                <div className="flex flex-col gap-2 mt-1 mb-3">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase">Arus Kas Laci (Cash Flow)</span>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-600 dark:text-neutral-300 font-medium">Modal Awal (House Bank):</span>
                    <span className="font-bold text-neutral-800 dark:text-white">
                      {formatMoney(selectedHistoryShift.houseBank)}
                    </span>
                  </div>
                  
                  {/* Cash Flows IN */}
                  {selectedHistoryShift.cashFlows?.filter(c => c.type === 'in').map(c => (
                    <div key={c.id} className="flex justify-between items-center text-sm">
                      <span className="text-neutral-600 dark:text-neutral-300 font-medium">
                        Cash In <span className="text-[10px] text-neutral-400">({c.note})</span>:
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatMoney(c.amount)}
                      </span>
                    </div>
                  ))}
                  {!selectedHistoryShift.cashFlows && (selectedHistoryShift.cashIn || 0) > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-600 dark:text-neutral-300 font-medium">
                        Cash In {selectedHistoryShift.cashInNotes ? <span className="text-[10px] text-neutral-400">({selectedHistoryShift.cashInNotes})</span> : ''}:
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatMoney(selectedHistoryShift.cashIn!)}
                      </span>
                    </div>
                  )}

                  {/* Cash Flows OUT */}
                  {selectedHistoryShift.cashFlows?.filter(c => c.type === 'out').map(c => (
                    <div key={c.id} className="flex justify-between items-center text-sm">
                      <span className="text-neutral-600 dark:text-neutral-300 font-medium">
                        Cash Out <span className="text-[10px] text-neutral-400">({c.note})</span>:
                      </span>
                      <span className="font-bold text-red-500 dark:text-red-400">
                        -{formatMoney(c.amount)}
                      </span>
                    </div>
                  ))}
                  {!selectedHistoryShift.cashFlows && (selectedHistoryShift.cashOut || 0) > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-600 dark:text-neutral-300 font-medium">
                        Cash Out {selectedHistoryShift.cashOutNotes ? <span className="text-[10px] text-neutral-400">({selectedHistoryShift.cashOutNotes})</span> : ''}:
                      </span>
                      <span className="font-bold text-red-500 dark:text-red-400">
                        -{formatMoney(selectedHistoryShift.cashOut!)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-neutral-800 dark:text-neutral-200 font-bold">Uang Fisik Dihitung:</span>
                    <span className="font-bold text-neutral-800 dark:text-white">
                      {formatMoney(selectedHistoryShift.countedCash || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-800 dark:text-neutral-200 font-bold">Selisih Kas:</span>
                    {(() => {
                      let tIn = selectedHistoryShift.cashIn || 0;
                      let tOut = selectedHistoryShift.cashOut || 0;
                      if (selectedHistoryShift.cashFlows) {
                        tIn += selectedHistoryShift.cashFlows.filter(c => c.type === 'in').reduce((s,c) => s + c.amount, 0);
                        tOut += selectedHistoryShift.cashFlows.filter(c => c.type === 'out').reduce((s,c) => s + c.amount, 0);
                      }
                      const diff = (selectedHistoryShift.countedCash || 0) - (selectedHistoryShift.houseBank + b.cash + tIn - tOut);
                      return (
                        <span className={`font-bold ${diff === 0 ? 'text-emerald-500' : diff > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                          {diff === 0 ? 'Balanced' : diff > 0 ? `+${formatMoney(diff)}` : formatMoney(diff)}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                
                <div className="w-full h-[2px] bg-emerald-500/20 my-1" />
                
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-black text-neutral-800 dark:text-white">TOTAL KESELURUHAN:</span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatMoney(b.total)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="pt-4 mt-2 border-t border-neutral-200 dark:border-white/[0.1] flex justify-end gap-2">
          <Button
            onClick={onClose}
            className="rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-100 border-none text-xs font-bold px-6"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
