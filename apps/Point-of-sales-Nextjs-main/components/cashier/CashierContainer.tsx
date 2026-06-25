'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  Coins, 
  User, 
  History, 
  ClipboardList, 
  CheckCircle2, 
  ArrowLeft,
  X,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/hooks/useCurrency';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, getDocs, query, where, deleteDoc, onSnapshot, arrayUnion, setDoc, getDoc } from 'firebase/firestore';
import { getHotelCollection } from '@/lib/firestoreHelper';
import { localDb } from '@/lib/dexie';
import { ShiftData } from './types';

import OpenShiftPanel from './OpenShiftPanel';
import ActiveShiftPanel from './ActiveShiftPanel';
import CashFlowManager from './CashFlowManager';
import ShiftHistoryList from './ShiftHistoryList';
import HistoryModal from './HistoryModal';
import DetailModal from './DetailModal';

export default function CashierContainer() {
  const { formatCurrency, symbol } = useCurrency();
  const formatMoney = (val: number) => {
    return formatCurrency(val);
  };
  const formatDate = (val: any) => {
    if (!val) return '-';
    try {
      const d = typeof val === 'string' ? new Date(val) : ('toDate' in val ? val.toDate() : new Date(val));
      return d.toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
      });
    } catch {
      return '-';
    }
  };

  const [activeShift, setActiveShift] = useState<ShiftData | null>(null);
  const [shiftHistory, setShiftHistory] = useState<ShiftData[]>([]);
  const [cashierNameInput, setCashierNameInput] = useState('');
  const [houseBankInput, setHouseBankInput] = useState('0');
  const [countedCashInput, setCountedCashInput] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  
  const [showCashFlowForm, setShowCashFlowForm] = useState(false);
  const [cashFlowAmount, setCashFlowAmount] = useState('');
  const [cashFlowNote, setCashFlowNote] = useState('');
  const [cashFlowType, setCashFlowType] = useState<'in' | 'out'>('in');
  const [isSubmittingCashFlow, setIsSubmittingCashFlow] = useState(false);
  
  const [viewMode, setViewMode] = useState<'main' | 'history'>('main');
  const [historyDateFilter, setHistoryDateFilter] = useState('');
  
  const [selectedHistoryShift, setSelectedHistoryShift] = useState<ShiftData | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailTransactions, setDetailTransactions] = useState<any[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const [shiftToDelete, setShiftToDelete] = useState<ShiftData | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  const [cashFlowToDelete, setCashFlowToDelete] = useState<any>(null);
  const [isDeleteCashFlowOpen, setIsDeleteCashFlowOpen] = useState(false);

  const [restoName, setRestoName] = useState('LEXURA POS');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rn = localStorage.getItem('restoName');
      if (rn) setRestoName(rn);

      const userJson = localStorage.getItem('user');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          if (user.name) setCashierNameInput(user.name);
        } catch (e) {}
      }
    }
  }, []);

  const getUserInfo = () => {
    let restoId = '1';
    let hotelCode = '1';
    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          restoId = user.restoId || '1';
          hotelCode = user.hotelCode || '1';
        } catch (e) {}
      } else {
         restoId = localStorage.getItem('restoId') || '1';
         hotelCode = restoId;
      }
    }
    return { restoId, hotelCode };
  };

  // loadActiveShift is removed because onSnapshot handles the real-time fetch with localStorage merging natively.

  const loadShiftHistory = async (restoId: string, hotelCode: string) => {
    try {
      // Fetch all shifts without where clauses to support legacy records that lack status/restoId fields
      const q = query(getHotelCollection(db, 'cashier_shifts', hotelCode));
      const snap = await getDocs(q);
      const history: ShiftData[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        // A shift is considered closed if it has status == 'closed', OR if it has a closedAt timestamp (legacy)
        if (data.status === 'closed' || data.closedAt || data.active === false) {
          history.push({ id: docSnap.id, ...data } as ShiftData);
        }
      });
      history.sort((a, b) => {
        const tA = a.closedAt ? new Date(a.closedAt).getTime() : 0;
        const tB = b.closedAt ? new Date(b.closedAt).getTime() : 0;
        return tB - tA;
      });

      // ── Patch each shift's transactions from pos_orders (source of truth) ──
      // This guarantees the cards in ShiftHistoryList show accurate totals
      const enrichedHistory = await Promise.all(
        history.map(async (shift) => {
          try {
            const ordersQ = query(
              getHotelCollection(db, 'pos_orders', hotelCode),
              where('shiftId', '==', shift.id)
            );
            const ordersSnap = await getDocs(ordersQ);
            if (!ordersSnap.empty) {
              const patchedTxs = ordersSnap.docs.map(d => {
                const od = d.data();
                return {
                  id: od.transactionId || d.id,
                  amount: (od.status === 'CANCELLED' || od.status === 'VOID') ? 0 : (od.total ?? od.amount ?? 0),
                  method: (od.paymentMethod ?? od.method ?? 'cash').toLowerCase(),
                  timestamp: od.timestamp?.toDate ? od.timestamp.toDate().toISOString() : (od.timestamp ?? new Date().toISOString()),
                  revenueType: od.revenueType ?? '',
                  status: od.status || 'SUCCESS',
                };
              });
              return { ...shift, transactions: patchedTxs };
            }
          } catch (e) {
            // silent fail — keep original shift
          }
          return shift;
        })
      );

      setShiftHistory(enrichedHistory);
    } catch (e) {
      console.error('Error loading shift history:', e);
    }
  };


  useEffect(() => {
    const { restoId, hotelCode } = getUserInfo();
    loadShiftHistory(restoId, hotelCode);

    // Query ALL open shifts for this hotel — shift is hotel-scoped, not per-device
    const q = query(
      getHotelCollection(db, 'cashier_shifts', hotelCode),
      where('status', '==', 'open')
    );

    let unsubscribeOrders: (() => void) | null = null;

    const unsubscribeShifts = onSnapshot(q, (snapshot) => {
      // Clean up previous orders listener if any
      if (unsubscribeOrders) {
        unsubscribeOrders();
        unsubscribeOrders = null;
      }

      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const dbShift = { id: docSnap.id, ...docSnap.data() } as ShiftData;

        // Set up real-time listener on pos_orders for this active shift
        const ordersQ = query(
          getHotelCollection(db, 'pos_orders', hotelCode),
          where('shiftId', '==', dbShift.id)
        );

        unsubscribeOrders = onSnapshot(ordersQ, (ordersSnapshot) => {
          const liveTransactions = ordersSnapshot.docs.map(d => {
            const od = d.data();
            return {
              id: od.transactionId || d.id,
              amount: (od.status === 'CANCELLED' || od.status === 'VOID') ? 0 : (od.total ?? od.amount ?? 0),
              method: (od.paymentMethod ?? od.method ?? 'cash').toLowerCase(),
              timestamp: od.timestamp?.toDate ? od.timestamp.toDate().toISOString() : (od.timestamp ?? new Date().toISOString()),
              revenueType: od.revenueType ?? '',
              status: od.status || 'SUCCESS',
            };
          });

          // Merge transactions from dbShift and liveTransactions
          const txMap = new Map<string, any>();
          if (dbShift.transactions) {
            dbShift.transactions.forEach((t: any) => {
              txMap.set(t.id, {
                id: t.id,
                amount: (t.status === 'CANCELLED' || t.status === 'VOID') ? 0 : t.amount,
                method: (t.method || 'cash').toLowerCase(),
                timestamp: t.timestamp || new Date().toISOString(),
                revenueType: t.revenueType || '',
                status: t.status || 'SUCCESS'
              });
            });
          }
          liveTransactions.forEach((t: any) => {
            txMap.set(t.id, t);
          });
          const mergedTransactions = Array.from(txMap.values());

          // Always merge cashFlows from localStorage
          const localStr = localStorage.getItem('active_shift');
          let mergedFlows = dbShift.cashFlows || [];
          if (localStr) {
            try {
              const localShift = JSON.parse(localStr);
              if (localShift && localShift.id === dbShift.id) {
                if ((localShift.cashFlows?.length || 0) > (dbShift.cashFlows?.length || 0)) {
                  mergedFlows = localShift.cashFlows;
                }
              }
            } catch (e) {}
          }

          const updatedShift = {
            ...dbShift,
            transactions: mergedTransactions,
            cashFlows: mergedFlows
          };

          setActiveShift(updatedShift);
          localStorage.setItem('active_shift', JSON.stringify(updatedShift));
        }, (ordersErr) => {
          console.error('Error listening to pos_orders for active shift:', ordersErr);
        });

      } else {
        setActiveShift(null);
        localStorage.removeItem('active_shift');
      }
    });

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'active_shift' && e.newValue) {
        try {
          const newShift = JSON.parse(e.newValue);
          setActiveShift(newShift);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribeShifts();
      if (unsubscribeOrders) {
        unsubscribeOrders();
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  const handleOpenShift = async () => {
    if (!cashierNameInput) {
      toast.error('Masukkan nama kasir');
      return;
    }
    const hb = parseFloat(houseBankInput) || 0;
    try {
      const { restoId, hotelCode } = getUserInfo();
      const newShift = {
        cashierName: cashierNameInput,
        openedAt: new Date().toISOString(),
        houseBank: hb,
        transactions: [],
        status: 'open',
        restoId: restoId,
        cashFlows: []
      };

      const cleanName = cashierNameInput.replace(/[^A-Za-z]/g, '');
      const prefix = cleanName.substring(0, 3).toUpperCase().padEnd(3, 'X');
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const shiftId = `${prefix}${randomNum}`;

      const docRef = doc(getHotelCollection(db, 'cashier_shifts', hotelCode), shiftId);
      await setDoc(docRef, newShift);
      const shiftData = { id: shiftId, ...newShift } as ShiftData;
      setActiveShift(shiftData);
      localStorage.setItem('active_shift', JSON.stringify(shiftData));
      setCashierNameInput('');
      setHouseBankInput('0');
      toast.success('Shift baru berhasil dibuka!');
    } catch (e) {
      console.error('Error opening shift:', e);
      toast.error('Gagal membuka shift baru.');
    }
  };

  const handleCloseShift = async () => {
    if (!activeShift) return;
    const counted = parseFloat(countedCashInput);
    if (isNaN(counted)) {
      toast.error('Masukkan jumlah uang fisik di laci dengan benar');
      return;
    }

    try {
      const { restoId, hotelCode } = getUserInfo();
      const shiftRef = doc(getHotelCollection(db, 'cashier_shifts', hotelCode), activeShift.id);
      const closedData = {
        status: 'closed',
        closedAt: new Date().toISOString(),
        countedCash: counted,
        notes: closingNotes,
        transactions: activeShift.transactions || [],
        cashFlows: activeShift.cashFlows || []
      };

      await updateDoc(shiftRef, closedData);
      toast.success('Shift berhasil ditutup!');
      
      setActiveShift(null);
      localStorage.removeItem('active_shift');
      setCountedCashInput('');
      setClosingNotes('');
      // Prefill cashierNameInput again from localStorage
      const userJson = localStorage.getItem('user');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          if (user.name) setCashierNameInput(user.name);
        } catch (e) {}
      }
      loadShiftHistory(restoId, hotelCode);
    } catch (e) {
      console.error('Error closing shift:', e);
      toast.error('Gagal menutup shift.');
    }
  };

  const handleAddCashFlow = async () => {
    if (!activeShift) return;
    const amount = parseFloat(cashFlowAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Masukkan nominal arus kas yang valid');
      return;
    }
    if (!cashFlowNote) {
      toast.error('Masukkan catatan/alasan');
      return;
    }

    setIsSubmittingCashFlow(true);
    try {
      const { hotelCode } = getUserInfo();
      const shiftRef = doc(getHotelCollection(db, 'cashier_shifts', hotelCode), activeShift.id);
      const newEntry = {
        id: Math.random().toString(36).substring(7),
        amount,
        note: cashFlowNote,
        timestamp: new Date().toISOString(),
        type: cashFlowType
      };

      await updateDoc(shiftRef, {
        cashFlows: arrayUnion(newEntry)
      });

      toast.success('Arus kas berhasil ditambahkan!');
      setCashFlowAmount('');
      setCashFlowNote('');
      setShowCashFlowForm(false);
    } catch (e) {
      console.error('Error adding cash flow:', e);
      toast.error('Gagal menambahkan arus kas.');
    } finally {
      setIsSubmittingCashFlow(false);
    }
  };

  const handleDeleteCashFlow = async () => {
    if (!activeShift || !cashFlowToDelete) return;
    try {
      const { hotelCode } = getUserInfo();
      const shiftRef = doc(getHotelCollection(db, 'cashier_shifts', hotelCode), activeShift.id);
      const updatedFlows = (activeShift.cashFlows || []).filter(c => c.id !== cashFlowToDelete.id);
      
      const newShift = { ...activeShift, cashFlows: updatedFlows };
      setActiveShift(newShift);
      localStorage.setItem('active_shift', JSON.stringify(newShift));
      
      await updateDoc(shiftRef, {
        cashFlows: updatedFlows
      });
      
      toast.success('Arus kas berhasil dihapus');
      setIsDeleteCashFlowOpen(false);
      setCashFlowToDelete(null);
    } catch (error) {
      console.error('Error deleting cash flow:', error);
      toast.error('Gagal menghapus arus kas');
    }
  };

  const fetchDetailTransactions = async (shift: ShiftData) => {
    setIsLoadingDetail(true);
    try {
      const { hotelCode } = getUserInfo();
      const q = query(
        getHotelCollection(db, 'pos_orders', hotelCode),
        where('shiftId', '==', shift.id)
      );
      const snap = await getDocs(q);
      const details: any[] = [];
      snap.forEach(docSnap => {
        const d = docSnap.data();
        // Normalize pos_orders fields → align with shift.transactions shape
        // pos_orders uses: total, paymentMethod
        // shift.transactions uses: amount, method
        details.push({
          ...d,
          id: d.transactionId || docSnap.id,
          // normalize
          amount: (d.status === 'CANCELLED' || d.status === 'VOID') ? 0 : (d.total ?? d.amount ?? 0),
          method: (d.paymentMethod ?? d.method ?? 'cash').toLowerCase(),
        });
      });
      // Sort by timestamp asc
      details.sort((a, b) => {
        const da = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const db2 = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return da.getTime() - db2.getTime();
      });
      setDetailTransactions(details);

      // ── Patch shift.transactions[] if pos_orders has more entries ──
      // This ensures getSalesBreakdown (which reads shift.transactions) is also accurate
      if (details.length > (shift.transactions?.length ?? 0)) {
        const patchedTxs = details.map(d => ({
          id: d.transactionId || d.id,
          amount: d.amount,
          method: d.method,
          timestamp: d.timestamp?.toDate ? d.timestamp.toDate().toISOString() : (d.timestamp ?? new Date().toISOString()),
          revenueType: d.revenueType ?? '',
        }));
        // Update in-memory shift state
        const { restoId } = getUserInfo();
        setShiftHistory(prev =>
          prev.map(s =>
            s.id === shift.id ? { ...s, transactions: patchedTxs } : s
          )
        );
      }
    } catch (error) {
      console.error('Error fetching detail transactions:', error);
      toast.error('Gagal memuat rincian transaksi');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const openHistoryModal = (shift: ShiftData) => {
    setSelectedHistoryShift(shift);
    setIsHistoryModalOpen(true);
    fetchDetailTransactions(shift);
  };

  const openDetailModal = (shift: ShiftData) => {
    setSelectedHistoryShift(shift);
    setIsDetailModalOpen(true);
    fetchDetailTransactions(shift);
  };

  const getSalesBreakdown = (shift: ShiftData) => {
    let total = 0, cash = 0, qris = 0, card = 0;
    if (shift.transactions) {
      shift.transactions.forEach(t => {
        if (t.status === 'CANCELLED' || t.status === 'VOID') {
          return;
        }
        const amt = t.amount;
        const m = (t.method || '').toLowerCase().trim();
        total += amt;
        if (m === 'cash' || m === 'tunai') cash += amt;
        else if (m === 'qris' || m === 'e-money' || m === 'emoney') qris += amt;
        else if (m === 'card' || m === 'debit' || m === 'kredit' || m === 'credit' || m === 'transfer') card += amt;
        else qris += amt;
      });
    }
    return { total, cash, qris, card };
  };

  const handleDeleteShift = async () => {
    if (passwordInput !== 'admin123') {
      toast.error('Password admin salah!');
      return;
    }
    if (!shiftToDelete) return;

    try {
      const { restoId, hotelCode } = getUserInfo();

      // 1. Fetch all pos_orders linked to this shift
      const ordersQ = query(
        getHotelCollection(db, 'pos_orders', hotelCode),
        where('shiftId', '==', shiftToDelete.id)
      );
      const ordersSnap = await getDocs(ordersQ);

      // Cascade deletion for all linked orders/transactions
      for (const orderDoc of ordersSnap.docs) {
        const orderData = orderDoc.data();
        const transactionId = orderData.transactionId || orderDoc.id;

        // A. Delete from pos_orders
        await deleteDoc(orderDoc.ref);

        // B. Delete from revenue_transactions
        const revQ = query(
          getHotelCollection(db, 'revenue_transactions', hotelCode),
          where('transactionId', '==', transactionId)
        );
        const revSnap = await getDocs(revQ);
        for (const revDoc of revSnap.docs) {
          await deleteDoc(revDoc.ref);
        }

        // C. Delete from daily_revenue entry matching transactionId
        let transactionDate: string | null = null;
        if (orderData.timestamp) {
          const tDate = orderData.timestamp.toDate ? orderData.timestamp.toDate() : new Date(orderData.timestamp);
          const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Jakarta',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          });
          transactionDate = formatter.format(tDate);
        }
        if (transactionDate) {
          const dailyRevDocId = `${hotelCode}_${transactionDate}`;
          const dailyRef = doc(getHotelCollection(db, 'daily_revenue', hotelCode), dailyRevDocId);
          const snapDaily = await getDoc(dailyRef);
          if (snapDaily.exists()) {
            const entries = snapDaily.data().entries || [];
            const updatedEntries = entries.filter((e: any) => e.bookingId !== transactionId);
            await updateDoc(dailyRef, {
              entries: updatedEntries,
            });
          }
        }

        // D. Delete from local Dexie database if exists
        try {
          await localDb.transactions.delete(transactionId);
          await localDb.transactionItems
            .where('transactionId')
            .equals(transactionId)
            .delete();
        } catch (dexieErr) {
          console.warn('Error deleting shift transaction from Dexie:', dexieErr);
        }
      }

      // 2. Finally, delete the shift document itself
      await deleteDoc(doc(getHotelCollection(db, 'cashier_shifts', hotelCode), shiftToDelete.id));
      toast.success('Shift dan semua transaksi terkait berhasil dihapus!');
      setIsDeleteOpen(false);
      setShiftToDelete(null);
      setPasswordInput('');
      loadShiftHistory(restoId, hotelCode);
    } catch (e) {
      console.error('Error deleting shift:', e);
      toast.error('Gagal menghapus shift.');
    }
  };

  const calculateExpectedCash = () => {
    const houseBank = Number(activeShift?.houseBank || 0);
    const cashSales = getSalesBreakdown(activeShift!).cash;
    const flowsIn = activeShift?.cashFlows?.filter(c => c.type === 'in').reduce((acc, c) => acc + Number(c.amount || 0), 0) || 0;
    const flowsOut = activeShift?.cashFlows?.filter(c => c.type === 'out').reduce((acc, c) => acc + Number(c.amount || 0), 0) || 0;
    return houseBank + cashSales + flowsIn - flowsOut;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      
      {/* Header Panel */}
      <div className="flex-none p-6 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.1] shadow-sm">
              <Coins className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-neutral-800 dark:text-white tracking-tight">Manajemen Kasir</h1>
              <p className="text-xs text-neutral-500 font-medium">{restoName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-neutral-100/50 dark:bg-zinc-900/50 p-1.5 rounded-xl border border-neutral-200 dark:border-white/[0.05]">
            <button
              onClick={() => setViewMode('main')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                viewMode === 'main' 
                  ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-sm' 
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Active Shift
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                viewMode === 'history' 
                  ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-sm' 
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <History className="w-4 h-4" />
              History
            </button>
          </div>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto thin-scrollbar p-6 pt-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-20">
          
          {viewMode === 'main' ? (
            <>
              {!activeShift ? (
                <OpenShiftPanel 
                  cashierNameInput={cashierNameInput}
                  setCashierNameInput={setCashierNameInput}
                  houseBankInput={houseBankInput}
                  setHouseBankInput={setHouseBankInput}
                  symbol={symbol}
                  handleOpenShift={handleOpenShift}
                />
              ) : (
                <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-300">
                  {/* Current Shift Header */}
                  <div className="rounded-2xl border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-950 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <User className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          Shift Aktif
                        </span>
                        <h2 className="text-xl font-black text-neutral-800 dark:text-white">{activeShift.cashierName}</h2>
                      </div>
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Waktu Mulai</span>
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300 text-sm">
                        {formatDate(activeShift.openedAt)}
                      </span>
                    </div>
                  </div>

                  <ActiveShiftPanel 
                    activeShift={activeShift}
                    expectedCashInDrawer={calculateExpectedCash()}
                    formatMoney={formatMoney}
                    formatDate={formatDate}
                  />

                  <CashFlowManager 
                    activeShift={activeShift}
                    showCashFlowForm={showCashFlowForm}
                    setShowCashFlowForm={setShowCashFlowForm}
                    cashFlowAmount={cashFlowAmount}
                    setCashFlowAmount={setCashFlowAmount}
                    cashFlowNote={cashFlowNote}
                    setCashFlowNote={setCashFlowNote}
                    cashFlowType={cashFlowType}
                    setCashFlowType={setCashFlowType}
                    isSubmittingCashFlow={isSubmittingCashFlow}
                    handleAddCashFlow={handleAddCashFlow}
                    formatMoney={formatMoney}
                    formatDate={formatDate}
                    onDeleteCashFlowClick={(cf) => {
                      setCashFlowToDelete(cf);
                      setIsDeleteCashFlowOpen(true);
                    }}
                  />

                  {/* Form Closing Shift */}
                  <div className="rounded-2xl border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-950 p-6 shadow-sm flex flex-col gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-[0.02] pointer-events-none">
                      <CheckCircle2 className="w-32 h-32" />
                    </div>
                    
                    <div className="flex flex-col gap-1 relative z-10">
                      <h3 className="text-lg font-black text-neutral-800 dark:text-white">Tutup Shift Kasir (Closing)</h3>
                      <p className="text-xs text-neutral-500">Hitung fisik uang tunai yang ada di laci dan cocokkan dengan sistem.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="countedCash" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 flex justify-between">
                            <span>Uang Fisik Dihitung (Di Laci)</span>
                            <span className="text-emerald-600 dark:text-emerald-400">
                              Estimasi: {formatMoney(calculateExpectedCash())}
                            </span>
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-3 text-sm text-neutral-400 font-bold">{symbol}</span>
                            <Input
                              id="countedCash"
                              type="number"
                              onWheel={(e) => (e.target as HTMLInputElement).blur()}
                              placeholder="0.00"
                              value={countedCashInput}
                              onChange={(e) => setCountedCashInput(e.target.value)}
                              className="pl-12 h-10 bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl text-sm font-semibold shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Label htmlFor="closingNotes" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                            Catatan Closing (Opsional)
                          </Label>
                          <Input
                            id="closingNotes"
                            type="text"
                            placeholder="Tulis alasan jika ada selisih uang..."
                            value={closingNotes}
                            onChange={(e) => setClosingNotes(e.target.value)}
                            className="h-10 bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl text-sm shadow-sm"
                          />
                        </div>
                      </div>

                      <div className="flex items-end">
                        <Button
                          onClick={handleCloseShift}
                          className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-black rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          Akhiri & Tutup Shift
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <ShiftHistoryList 
              shiftHistory={shiftHistory}
              historyDateFilter={historyDateFilter}
              setHistoryDateFilter={setHistoryDateFilter}
              formatMoney={formatMoney}
              formatDate={formatDate}
              onOpenHistoryModal={openHistoryModal}
              onOpenDetailModal={openDetailModal}
              getSalesBreakdown={getSalesBreakdown}
            />
          )}

        </div>
      </div>

      {isHistoryModalOpen && selectedHistoryShift && (
        <HistoryModal 
          selectedHistoryShift={selectedHistoryShift}
          detailTransactions={detailTransactions}
          isLoadingDetail={isLoadingDetail}
          onClose={() => {
            setIsHistoryModalOpen(false);
            setSelectedHistoryShift(null);
          }}
          onDeleteClick={(shift) => {
            setShiftToDelete(shift);
            setIsHistoryModalOpen(false);
            setIsDeleteOpen(true);
          }}
          formatMoney={formatMoney}
          formatDate={formatDate}
          getSalesBreakdown={getSalesBreakdown}
        />
      )}

      {isDetailModalOpen && selectedHistoryShift && (
        <DetailModal 
          selectedHistoryShift={selectedHistoryShift}
          detailTransactions={detailTransactions}
          isLoadingDetail={isLoadingDetail}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedHistoryShift(null);
          }}
          formatMoney={formatMoney}
          formatDate={formatDate}
          getSalesBreakdown={getSalesBreakdown}
        />
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
                <Label htmlFor="adminPassword" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Konfirmasi Password Admin
                </Label>
                <Input
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
                  className="h-9 bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteOpen(false);
                    setShiftToDelete(null);
                    setPasswordInput('');
                  }}
                  className="w-full rounded-xl border-neutral-200 dark:border-white/[0.1] text-xs font-bold"
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteShift}
                  className="w-full rounded-xl text-xs font-bold"
                >
                  Hapus
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Cash Flow Modal */}
      {isDeleteCashFlowOpen && cashFlowToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.1] rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => {
                setIsDeleteCashFlowOpen(false);
                setCashFlowToDelete(null);
              }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-neutral-800 dark:text-white">
                  Hapus Arus Kas?
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Anda akan menghapus riwayat {cashFlowToDelete.type === 'in' ? 'Cash IN' : 'Cash OUT'} sebesar <span className="font-bold">{formatMoney(cashFlowToDelete.amount)}</span>.
                </p>
              </div>
              <div className="flex gap-2 pt-2 border-t border-neutral-200 dark:border-white/[0.05]">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteCashFlowOpen(false);
                    setCashFlowToDelete(null);
                  }}
                  className="w-full rounded-xl border-neutral-200 dark:border-white/[0.1] text-xs font-bold"
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteCashFlow}
                  className="w-full rounded-xl text-xs font-bold"
                >
                  Hapus
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
