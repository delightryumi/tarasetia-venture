'use client';

import { useState, useEffect } from 'react';
import { History, FileSpreadsheet, ArrowLeft, X, CheckCircle2, Printer, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, query, where, deleteDoc } from 'firebase/firestore';

interface TransactionLog {
  id: string;
  amount: number;
  method: 'cash' | 'qris' | 'card';
  timestamp: string;
}

interface ShiftData {
  id: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  houseBank: number;
  transactions: TransactionLog[];
  countedCash?: number;
  notes?: string;
  status: 'open' | 'closed';
}

function getCurrencySymbol(code: string): string {
  switch (code) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'SGD': return 'S$';
    case 'MYR': return 'RM';
    case 'GBP': return '£';
    case 'AUD': return 'A$';
    case 'JPY': return '¥';
    case 'IDR': default: return 'Rp ';
  }
}

export default function CashierHistoryPage() {
  // Local currency formatter logic to keep the page completely self-contained
  const [currencySymbol, setCurrencySymbol] = useState('Rp ');
  const [shiftHistory, setShiftHistory] = useState<ShiftData[]>([]);
  const [selectedHistoryShift, setSelectedHistoryShift] = useState<ShiftData | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Delete flow states
  const [shiftToDelete, setShiftToDelete] = useState<ShiftData | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // Helper to load shift history from Firestore
  const loadShiftHistory = async (restoId: string) => {
    try {
      const q = query(
        collection(db, 'cashier_shifts'),
        where('status', '==', 'closed'),
        where('restoId', '==', restoId)
      );
      const snap = await getDocs(q);
      const history: ShiftData[] = [];
      snap.forEach((docSnap) => {
        history.push({ id: docSnap.id, ...docSnap.data() } as ShiftData);
      });
      // Sort in-memory desc by closedAt
      history.sort((a, b) => new Date(b.closedAt || '').getTime() - new Date(a.closedAt || '').getTime());
      setShiftHistory(history);
    } catch (e) {
      console.error('Error loading shift history:', e);
    }
  };

  // 1. Initial configuration and data load
  useEffect(() => {
    console.log('CashierHistoryPage: Mounted');
    
    // Load currency
    const shopCurrencyCode = localStorage.getItem('shopCurrency') || 'IDR';
    setCurrencySymbol(getCurrencySymbol(shopCurrencyCode));

    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem('user');
      let restoId = 'default-resto';
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          restoId = user.restoId || 'default-resto';
        } catch (e) {
          console.error(e);
        }
      }
      loadShiftHistory(restoId);
    }
  }, []);

  const formatCurrency = (amount: number | string | undefined | null): string => {
    if (amount === undefined || amount === null) return '';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '';
    return `${currencySymbol}${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const getSalesBreakdown = (shift: ShiftData | null) => {
    const breakdown = { cash: 0, qris: 0, card: 0, total: 0, count: 0 };
    if (shift && shift.transactions && Array.isArray(shift.transactions)) {
      shift.transactions.forEach((tx) => {
        if (!tx) return;
        const method = tx.method || 'cash';
        const amount = tx.amount || 0;
        if (method === 'cash' || method === 'qris' || method === 'card') {
          breakdown[method] += amount;
        }
        breakdown.total += amount;
        breakdown.count += 1;
      });
    }
    return breakdown;
  };

  const formatDate = (isoString: string | undefined | null) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch (e) {
      return '-';
    }
  };

  const handleDeleteShift = async () => {
    if (passwordInput !== 'admin123' && passwordInput !== 'owner123') {
      toast.error('Password Admin salah! Penghapusan dibatalkan.');
      return;
    }
    if (!shiftToDelete) return;

    const userJson = localStorage.getItem('user');
    let restoId = 'default-resto';
    if (userJson) {
      try {
        restoId = JSON.parse(userJson).restoId || 'default-resto';
      } catch (e) {}
    }

    try {
      await deleteDoc(doc(db, 'cashier_shifts', shiftToDelete.id));
      toast.success('Riwayat shift berhasil dihapus.');
      setIsDeleteOpen(false);
      setShiftToDelete(null);
      setPasswordInput('');
      await loadShiftHistory(restoId);
    } catch (e) {
      console.error('Error deleting shift:', e);
      toast.error('Gagal menghapus shift.');
    }
  };

  const safeShiftHistory = Array.isArray(shiftHistory) ? shiftHistory.filter(Boolean) : [];

  // Compute values beforehand to prevent rendering crashes
  const selectedBreakdown = selectedHistoryShift ? getSalesBreakdown(selectedHistoryShift) : { cash: 0, qris: 0, card: 0, total: 0, count: 0 };
  const expectedCash = selectedHistoryShift ? (selectedHistoryShift.houseBank || 0) + selectedBreakdown.cash : 0;
  const countedCashVal = selectedHistoryShift ? (selectedHistoryShift.countedCash || 0) : 0;
  const diffCash = countedCashVal - expectedCash;

  return (
    <div className="flex min-h-[calc(100vh_-_theme(spacing.16))] w-full flex-col p-4 md:p-10 bg-muted/20">
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
        
        <div className="flex items-center gap-4">
          <Link 
            href="/analytics/income"
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-200 dark:hover:bg-zinc-800 transition-colors text-neutral-600 dark:text-neutral-350"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
              <History className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
              <span>Riwayat Shift Kasir (Income Analytics)</span>
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Klik pada salah satu baris shift untuk melihat rincian transaksi lengkap dan detail rekonsiliasi.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-950 p-6 shadow-sm flex flex-col space-y-4">
          <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto thin-scrollbar pr-2">
            {safeShiftHistory.map((historyShift) => {
              const breakdown = getSalesBreakdown(historyShift);
              const expected = (historyShift.houseBank || 0) + breakdown.cash;
              const diff = (historyShift.countedCash || 0) - expected;
              
              return (
                <div
                  key={historyShift.id || Math.random().toString()}
                  onClick={() => {
                    setSelectedHistoryShift(historyShift);
                    setIsHistoryModalOpen(true);
                  }}
                  className="p-4 rounded-xl border border-neutral-200 dark:border-white/[0.05] bg-neutral-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-zinc-900/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                        Shift ID: {historyShift.id || '-'}
                      </span>
                      {diff === 0 ? (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/5 dark:text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">Cocok</span>
                      ) : (
                        <span className="text-[10px] bg-red-500/10 text-red-600 dark:bg-red-500/5 dark:text-red-400 px-2 py-0.5 rounded font-bold uppercase">Ada Selisih</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                      <div><span className="font-semibold text-neutral-600 dark:text-neutral-300">Kasir:</span> {historyShift.cashierName || '-'}</div>
                      <div><span className="font-semibold text-neutral-600 dark:text-neutral-300">Waktu:</span> {formatDate(historyShift.openedAt)} - {historyShift.closedAt ? formatDate(historyShift.closedAt) : 'Belum Tutup'}</div>
                      <div><span className="font-semibold text-neutral-600 dark:text-neutral-300">Modal Awal:</span> {formatCurrency(historyShift.houseBank || 0)}</div>
                      <div><span className="font-semibold text-neutral-600 dark:text-neutral-300">Total Transaksi:</span> {breakdown.count} pesanan</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-left sm:text-right bg-white dark:bg-zinc-950 p-3 rounded-lg border border-neutral-200 dark:border-white/[0.05] shadow-sm flex-1 sm:flex-initial">
                      <span className="text-lg font-black block text-neutral-800 dark:text-white">
                        {formatCurrency(breakdown.total)}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Revenue</span>
                    </div>
                    
                    <button
                      className="flex items-center justify-center w-8 h-8 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShiftToDelete(historyShift);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {safeShiftHistory.length === 0 && (
              <div className="text-center py-16 text-neutral-400">
                <FileSpreadsheet className="w-12 h-12 mx-auto opacity-30 mb-3" />
                <p className="text-sm">Belum ada riwayat shift yang tersimpan.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CLOSED SHIFT DETAIL MODAL */}
      {isHistoryModalOpen && selectedHistoryShift && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.1] rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => {
                setIsHistoryModalOpen(false);
                setSelectedHistoryShift(null);
              }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center font-mono text-neutral-700 dark:text-neutral-300">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
              <h2 className="text-xs font-bold text-neutral-800 dark:text-white uppercase tracking-wider">
                LAPORAN CLOSING REGISTER
              </h2>
              <p className="text-[9px] text-neutral-500">LEXURA WORKSPACE - COFFEE HUB</p>
              
              <div className="w-full border-t border-dashed border-neutral-300 dark:border-white/[0.1] my-2" />
              
              <div className="w-full text-left text-[10px] flex flex-col gap-1 text-neutral-600 dark:text-neutral-400">
                <div className="flex justify-between">
                  <span>Shift ID:</span>
                  <span className="font-bold">{selectedHistoryShift.id || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Petugas Kasir:</span>
                  <span className="font-bold">{selectedHistoryShift.cashierName || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu Buka:</span>
                  <span>{formatDate(selectedHistoryShift.openedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu Tutup:</span>
                  <span>{selectedHistoryShift.closedAt ? formatDate(selectedHistoryShift.closedAt) : '-'}</span>
                </div>
              </div>
              
              <div className="w-full border-t border-dashed border-neutral-300 dark:border-white/[0.1] my-2" />
              
              {/* Sales Breakdown */}
              <div className="w-full text-left text-[10px] flex flex-col gap-1 py-0.5">
                <span className="font-bold block mb-1 text-[9px] uppercase tracking-wider text-neutral-400">Rincian Penjualan:</span>
                <div className="flex justify-between">
                  <span>Tunai / Cash:</span>
                  <span>{formatCurrency(selectedBreakdown.cash)}</span>
                </div>
                <div className="flex justify-between">
                  <span>QRIS / E-Money:</span>
                  <span>{formatCurrency(selectedBreakdown.qris)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Debit / Kredit:</span>
                  <span>{formatCurrency(selectedBreakdown.card)}</span>
                </div>
                <div className="flex justify-between font-bold text-neutral-700 dark:text-neutral-200 border-t border-dotted border-neutral-200 dark:border-white/[0.05] pt-1">
                  <span>Total Pendapatan:</span>
                  <span>{formatCurrency(selectedBreakdown.total)}</span>
                </div>
              </div>

              <div className="w-full border-t border-dashed border-neutral-300 dark:border-white/[0.1] my-2" />

              {/* Cash Reconciliation */}
              <div className="w-full text-left text-[10px] flex flex-col gap-1 py-0.5">
                <span className="font-bold block mb-1 text-[9px] uppercase tracking-wider text-neutral-400">Rekonsiliasi Laci:</span>
                <div className="flex justify-between">
                  <span>House Bank (Modal Awal):</span>
                  <span>{formatCurrency(selectedHistoryShift.houseBank || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimasi Tunai di Laci:</span>
                  <span>{formatCurrency(expectedCash)}</span>
                </div>
                <div className="flex justify-between font-bold text-neutral-700 dark:text-neutral-200">
                  <span>Tunai Fisik Dihitung:</span>
                  <span>{formatCurrency(countedCashVal)}</span>
                </div>
                
                <div className="flex justify-between font-bold mt-1 border-t border-dotted border-neutral-200 dark:border-white/[0.05] pt-1">
                  <span>Selisih Laci:</span>
                  {diffCash === 0 ? (
                    <span className="text-emerald-500">Balanced / Cocok</span>
                  ) : diffCash > 0 ? (
                    <span className="text-amber-500">Kelebihan (+{formatCurrency(diffCash)})</span>
                  ) : (
                    <span className="text-red-500">Kekurangan ({formatCurrency(diffCash)})</span>
                  )}
                </div>
              </div>

              {selectedHistoryShift.notes && (
                <>
                  <div className="w-full border-t border-dashed border-neutral-300 dark:border-white/[0.1] my-2" />
                  <div className="w-full text-left text-[10px]">
                    <span className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block mb-0.5">Catatan Closing:</span>
                    <p className="italic text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">{selectedHistoryShift.notes}</p>
                  </div>
                </>
              )}
              
              <div className="w-full border-t border-dashed border-neutral-300 dark:border-white/[0.1] my-3" />
              <p className="text-[9px] italic text-neutral-400">Lexura POS &bull; Shift Report Slip</p>
            </div>

            <div className="flex flex-col gap-2 mt-5">
              <div className="flex gap-2">
                <button
                  onClick={() => toast.info('Printer tidak terhubung.')}
                  className="flex items-center justify-center gap-1.5 border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 text-xs w-full py-2 rounded-xl text-neutral-700 dark:text-neutral-200 font-bold hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
                
                <button
                  onClick={() => {
                    setIsHistoryModalOpen(false);
                    setSelectedHistoryShift(null);
                  }}
                  className="flex items-center justify-center rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-100 border-none text-xs font-bold w-full py-2 transition-colors"
                >
                  Tutup
                </button>
              </div>

              <button
                onClick={() => {
                  setShiftToDelete(selectedHistoryShift);
                  setIsHistoryModalOpen(false);
                  setIsDeleteOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 text-xs w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Riwayat Shift</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD CONFIRMATION MODAL */}
      {isDeleteOpen && shiftToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.1] rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => {
                setIsDeleteOpen(false);
                setShiftToDelete(null);
                setPasswordInput('');
              }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-neutral-800 dark:text-white">
                  Konfirmasi Penghapusan Shift
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Tindakan ini tidak dapat dibatalkan. Riwayat shift dengan ID <span className="font-bold text-neutral-800 dark:text-neutral-100">{shiftToDelete.id || '-'}</span> akan dihapus selamanya.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-neutral-200 dark:border-white/[0.05]">
                <label htmlFor="adminPassword" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Konfirmasi Password Admin
                </label>
                <input
                  id="adminPassword"
                  type="password"
                  placeholder="Masukkan password admin..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleDeleteShift();
                    }
                  }}
                  className="w-full px-3 h-10 text-sm bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.1] rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-400 font-sans"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsDeleteOpen(false);
                    setShiftToDelete(null);
                    setPasswordInput('');
                  }}
                  className="flex items-center justify-center border border-neutral-200 dark:border-white/[0.1] rounded-xl w-full text-xs py-2 hover:bg-neutral-50 dark:hover:bg-zinc-800 font-bold transition-colors text-neutral-700 dark:text-neutral-200"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteShift}
                  className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-xl w-full text-xs font-bold py-2 transition-colors"
                >
                  Hapus Permanen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
