'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  Coins, 
  Clock, 
  User, 
  Plus, 
  History, 
  ClipboardList, 
  CheckCircle2, 
  Printer, 
  Unlock, 
  Lock, 
  FileSpreadsheet, 
  X,
  Play,
  AlertCircle,
  Trash2,
  Edit2,
  ArrowLeft,
  Calendar,
  Search,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/hooks/useCurrency';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, getDocs, query, where, deleteDoc, onSnapshot, arrayUnion } from 'firebase/firestore';

interface TransactionLog {
  id: string;
  amount: number;
  method: 'cash' | 'qris' | 'card';
  timestamp: string;
}

interface CashFlowEntry {
  id: string;
  amount: number;
  note: string;
  timestamp: string;
  type: 'in' | 'out';
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
  cashIn?: number;
  cashOut?: number;
  cashInNotes?: string;
  cashOutNotes?: string;
  cashFlows?: CashFlowEntry[];
}

export default function CashierPage() {
  const { formatCurrency, symbol } = useCurrency();
  const [activeShift, setActiveShift] = useState<ShiftData | null>(null);
  const [shiftHistory, setShiftHistory] = useState<ShiftData[]>([]);
  const [cashierNameInput, setCashierNameInput] = useState('');
  const [houseBankInput, setHouseBankInput] = useState('0');
  const [countedCashInput, setCountedCashInput] = useState('');
  const [cashFlowAmountInput, setCashFlowAmountInput] = useState('');
  const [cashFlowNoteInput, setCashFlowNoteInput] = useState('');
  const [cashFlowType, setCashFlowType] = useState<'in' | 'out'>('in');
  const [closingNotes, setClosingNotes] = useState('');
  const [editingCashFlowId, setEditingCashFlowId] = useState<string | null>(null);
  
  // View state
  const [viewMode, setViewMode] = useState<'main' | 'history'>('main');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  
  // Dialog state
  const [selectedHistoryShift, setSelectedHistoryShift] = useState<ShiftData | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailTransactions, setDetailTransactions] = useState<any[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Delete flow states
  const [shiftToDelete, setShiftToDelete] = useState<ShiftData | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  const [isDeleteCashFlowOpen, setIsDeleteCashFlowOpen] = useState(false);
  const [cashFlowToDelete, setCashFlowToDelete] = useState<string | null>(null);
  const [restoName, setRestoName] = useState('LEXURA POS');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rn = localStorage.getItem('restoName');
      if (rn) setRestoName(rn);
    }
  }, []);

  // Helper to load active shift from Firestore
  const loadActiveShift = async (restoId: string) => {
    try {
      const q = query(
        collection(db, 'cashier_shifts'),
        where('status', '==', 'open'),
        where('restoId', '==', restoId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const shiftData = { id: docSnap.id, ...docSnap.data() } as ShiftData;
        setActiveShift(shiftData);
        localStorage.setItem('active_shift', JSON.stringify(shiftData));
      } else {
        setActiveShift(null);
        localStorage.removeItem('active_shift');
      }
    } catch (e) {
      console.error('Error loading active shift:', e);
    }
  };

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

  // Initialize and load from Firestore
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem('user');
      let restoId = 'default-resto';
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          setCashierNameInput(user.name || '');
          restoId = user.restoId || 'default-resto';
        } catch (e) {
          console.error(e);
        }
      }

      loadActiveShift(restoId);
      loadShiftHistory(restoId);
    }
  }, []);

  // Set up real-time listener for active shift changes (e.g. transactions appended)
  useEffect(() => {
    if (!activeShift?.id) return;

    const unsub = onSnapshot(doc(db, 'cashier_shifts', activeShift.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as ShiftData;
        setActiveShift(data);
        localStorage.setItem('active_shift', JSON.stringify(data));
      }
    });

    return () => unsub();
  }, [activeShift?.id]);

  const handleOpenShift = async () => {
    if (!cashierNameInput.trim()) {
      toast.warning('Masukkan Nama Kasir terlebih dahulu!');
      return;
    }
    const bankVal = parseFloat(houseBankInput);
    if (isNaN(bankVal) || bankVal < 0) {
      toast.warning('Modal awal tidak valid!');
      return;
    }

    const userJson = localStorage.getItem('user');
    let restoId = 'default-resto';
    if (userJson) {
      try {
        restoId = JSON.parse(userJson).restoId || 'default-resto';
      } catch (e) {}
    }

    const newShift = {
      cashierName: cashierNameInput,
      openedAt: new Date().toISOString(),
      houseBank: bankVal,
      transactions: [],
      status: 'open',
      restoId
    };

    try {
      const docRef = await addDoc(collection(db, 'cashier_shifts'), newShift);
      const shiftData = { id: docRef.id, ...newShift } as ShiftData;
      setActiveShift(shiftData);
      localStorage.setItem('active_shift', JSON.stringify(shiftData));
      toast.success(`Shift berhasil dibuka oleh ${cashierNameInput}!`);
    } catch (e) {
      console.error('Error opening shift:', e);
      toast.error('Gagal membuka shift di database.');
    }
  };

  const getSalesBreakdown = (shift: ShiftData) => {
    const breakdown = {
      cash: 0,
      qris: 0,
      card: 0,
      total: 0,
      count: 0
    };

    if (shift && shift.transactions) {
      shift.transactions.forEach((tx) => {
        breakdown[tx.method] += tx.amount;
        breakdown.total += tx.amount;
        breakdown.count += 1;
      });
    }

    return breakdown;
  };

  const activeSales = activeShift ? getSalesBreakdown(activeShift) : { cash: 0, qris: 0, card: 0, total: 0, count: 0 };
  
  const getCashFlowTotals = (shift: ShiftData | null) => {
    let totalIn = shift?.cashIn || 0;
    let totalOut = shift?.cashOut || 0;
    if (shift && shift.cashFlows) {
      shift.cashFlows.forEach(c => {
        if (c.type === 'in') totalIn += c.amount;
        if (c.type === 'out') totalOut += c.amount;
      });
    }
    return { totalIn, totalOut };
  };

  const cashFlowsData = getCashFlowTotals(activeShift);
  const expectedCashInDrawer = activeShift 
    ? activeShift.houseBank + activeSales.cash + cashFlowsData.totalIn - cashFlowsData.totalOut 
    : 0;
  
  const countedCashVal = parseFloat(countedCashInput) || 0;
  const cashDifference = countedCashVal - expectedCashInDrawer;

  const handleEditCashFlow = (entry: CashFlowEntry) => {
    setEditingCashFlowId(entry.id);
    setCashFlowType(entry.type);
    setCashFlowAmountInput(entry.amount.toString());
    setCashFlowNoteInput(entry.note);
  };

  const handleCancelEditCashFlow = () => {
    setEditingCashFlowId(null);
    setCashFlowType('in');
    setCashFlowAmountInput('');
    setCashFlowNoteInput('');
  };

  const confirmDeleteCashFlow = (id: string) => {
    setCashFlowToDelete(id);
    setIsDeleteCashFlowOpen(true);
  };

  const handleDeleteCashFlow = async () => {
    if (!activeShift || !cashFlowToDelete) return;
    
    try {
      const updatedFlows = (activeShift.cashFlows || []).filter(c => c.id !== cashFlowToDelete);
      const shiftRef = doc(db, 'cashier_shifts', activeShift.id);
      await updateDoc(shiftRef, { cashFlows: updatedFlows });
      toast.success('Entri arus kas dihapus.');
      
      if (editingCashFlowId === cashFlowToDelete) {
        handleCancelEditCashFlow();
      }
      setIsDeleteCashFlowOpen(false);
      setCashFlowToDelete(null);
    } catch (e) {
      console.error('Error deleting cash flow:', e);
      toast.error('Gagal menghapus arus kas.');
    }
  };

  const handleAddOrEditCashFlow = async () => {
    if (!activeShift) return;
    const amount = parseFloat(cashFlowAmountInput);
    if (isNaN(amount) || amount <= 0) {
      toast.warning('Masukkan nominal arus kas yang valid!');
      return;
    }
    if (!cashFlowNoteInput.trim()) {
      toast.warning('Masukkan keterangan arus kas!');
      return;
    }

    try {
      const shiftRef = doc(db, 'cashier_shifts', activeShift.id);
      
      if (editingCashFlowId) {
        const updatedFlows = (activeShift.cashFlows || []).map(c => 
          c.id === editingCashFlowId 
            ? { ...c, amount, note: cashFlowNoteInput, type: cashFlowType }
            : c
        );
        await updateDoc(shiftRef, { cashFlows: updatedFlows });
        toast.success(`Berhasil mengubah arus kas`);
      } else {
        const entry: CashFlowEntry = {
          id: new Date().getTime().toString(),
          amount,
          note: cashFlowNoteInput,
          timestamp: new Date().toISOString(),
          type: cashFlowType
        };
        await updateDoc(shiftRef, { cashFlows: arrayUnion(entry) });
        toast.success(`Berhasil menambahkan Cash ${cashFlowType === 'in' ? 'In' : 'Out'}`);
      }

      handleCancelEditCashFlow();
    } catch (error) {
      console.error('Error saving cash flow:', error);
      toast.error('Gagal menyimpan arus kas.');
    }
  };

  const handleCloseShift = async () => {
    if (!activeShift) return;
    if (!countedCashInput.trim()) {
      toast.warning('Masukkan uang tunai fisik yang dihitung di laci!');
      return;
    }

    const userJson = localStorage.getItem('user');
    let restoId = 'default-resto';
    if (userJson) {
      try {
        restoId = JSON.parse(userJson).restoId || 'default-resto';
      } catch (e) {}
    }

    try {
      const shiftRef = doc(db, 'cashier_shifts', activeShift.id);
      const closingData = {
        closedAt: new Date().toISOString(),
        countedCash: countedCashVal,
        notes: closingNotes,
        status: 'closed'
      };

      await updateDoc(shiftRef, closingData);

      const finalizedShift: ShiftData = {
        ...activeShift,
        ...closingData
      } as ShiftData;

      await loadShiftHistory(restoId);
      setActiveShift(null);
      localStorage.removeItem('active_shift');

      setCountedCashInput('');
      setCashFlowAmountInput('');
      setCashFlowNoteInput('');
      setClosingNotes('');
      
      setSelectedHistoryShift(finalizedShift);
      setIsHistoryModalOpen(true);
      toast.success('Shift Berhasil Ditutup & Di-closing!');
    } catch (e) {
      console.error('Error closing shift:', e);
      toast.error('Gagal menutup shift di database.');
    }
  };

  const formatMoney = (val: number) => {
    return formatCurrency(val);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
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

  const openDetailModal = async (shift: ShiftData) => {
    setSelectedHistoryShift(shift);
    setIsDetailModalOpen(true);
    setIsLoadingDetail(true);
    setDetailTransactions([]);
    
    try {
      const ids = shift.transactions.map(t => t.id);
      if (ids.length === 0) {
        setIsLoadingDetail(false);
        return;
      }
      
      // Chunk array by 10 to comply with Firestore 'in' query limit
      const chunks = [];
      for (let i = 0; i < ids.length; i += 10) {
        chunks.push(ids.slice(i, i + 10));
      }
      
      const results: any[] = [];
      for (const chunk of chunks) {
        const q = query(collection(db, 'pos_orders'), where('transactionId', 'in', chunk));
        const snap = await getDocs(q);
        snap.forEach(docSnap => {
          results.push({ ...docSnap.data(), docId: docSnap.id });
        });
      }
      
      const merged = shift.transactions.map(tx => {
        const orderDoc = results.find(r => r.transactionId === tx.id || r.docId === tx.id);
        return {
          ...tx,
          items: orderDoc ? (orderDoc.items || []) : [],
          revenueType: orderDoc ? orderDoc.revenueType : undefined,
          category: orderDoc ? orderDoc.category : undefined
        };
      });
      
      setDetailTransactions(merged);
    } catch (error) {
      console.error('Failed to load detail:', error);
      toast.error('Gagal memuat detail menu dari transaksi.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handlePrintDetail = () => {
    if (!selectedHistoryShift || detailTransactions.length === 0) {
      toast.warning('Tidak ada data transaksi untuk dicetak.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
       toast.error('Pop-up terblokir. Izinkan pop-up untuk mencetak.');
       return;
    }
    
    const breakdown = getSalesBreakdown(selectedHistoryShift);
    
    let alacarteTotal = 0;
    let banquetTotal = 0;
    
    detailTransactions.forEach(tx => {
      const isBanquet = tx.revenueType?.toLowerCase() === 'banquet' || 
                        tx.category?.toLowerCase() === 'banquet' || 
                        tx.category?.toLowerCase().includes('banquet');
      if (isBanquet) {
        banquetTotal += tx.amount;
      } else {
        alacarteTotal += tx.amount;
      }
    });

    // Build a simple HTML string for clean PDF/Print output
    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Transaksi - ${selectedHistoryShift.cashierName}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #000; }
            h2 { font-size: 20px; margin-bottom: 5px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            p { font-size: 12px; color: #333; margin-top: 0; }
            .tx-box { border: 1px solid #ccc; padding: 12px; margin-bottom: 12px; border-radius: 6px; }
            .flex-between { display: flex; justify-content: space-between; align-items: flex-start; }
            .flex-between-center { display: flex; justify-content: space-between; align-items: center; }
            .text-sm { font-size: 14px; font-weight: bold; }
            .text-xs { font-size: 12px; }
            .text-xxs { font-size: 10px; color: #666; }
            .divider { height: 1px; background: #eee; margin: 8px 0; }
            .items { margin-top: 8px; }
            .item-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
            .summary-box { margin-top: 20px; border: 2px solid #000; padding: 15px; border-radius: 6px; page-break-inside: avoid; }
            @media print {
              body { padding: 0; }
              .tx-box { break-inside: avoid; border-color: #999; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <h2>Laporan Detail Transaksi Shift</h2>
          <p style="margin-bottom: 5px;"><strong>Restoran:</strong> ${restoName.toUpperCase()}</p>
          <p><strong>Kasir:</strong> ${selectedHistoryShift.cashierName} &nbsp;|&nbsp; <strong>Waktu Buka:</strong> ${formatDate(selectedHistoryShift.openedAt)}</p>
          <div style="margin-top: 20px;">
            ${detailTransactions.map(tx => `
              <div class="tx-box">
                <div class="flex-between">
                  <div>
                    <div class="text-sm">${tx.id}</div>
                    <div class="text-xxs">${formatDate(tx.timestamp)}</div>
                  </div>
                  <div style="text-align: right;">
                    <div class="text-sm">${formatMoney(tx.amount)}</div>
                    <div class="text-xxs" style="text-transform: uppercase; font-weight: bold;">${tx.method}</div>
                  </div>
                </div>
                <div class="divider"></div>
                <div class="text-xxs" style="font-weight: bold; margin-bottom: 4px; color: #000;">MENU TERJUAL:</div>
                <div class="items">
                  ${tx.items && tx.items.length > 0 ? tx.items.map((item: any) => `
                    <div class="item-row">
                      <span><strong>${item.quantity}x</strong> ${item.name || 'Produk'}</span>
                      <span>${formatMoney((item.price || 0) * (item.quantity || 1))}</span>
                    </div>
                  `).join('') : '<div class="text-xs" style="font-style: italic;">Data item tidak ditemukan</div>'}
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="summary-box">
            <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 14px; text-transform: uppercase;">Total Pendapatan Shift</h3>
            
            <div style="margin-bottom: 10px;">
              <div class="text-xxs" style="font-weight: bold; margin-bottom: 4px; color: #666;">METODE PEMBAYARAN:</div>
              <div class="flex-between-center" style="margin-bottom: 5px;">
                <span class="text-xs">Tunai (Cash):</span>
                <span class="text-sm">${formatMoney(breakdown.cash)}</span>
              </div>
              <div class="flex-between-center" style="margin-bottom: 5px;">
                <span class="text-xs">Debit / Card:</span>
                <span class="text-sm">${formatMoney(breakdown.card)}</span>
              </div>
              <div class="flex-between-center" style="margin-bottom: 5px;">
                <span class="text-xs">QRIS / E-Money:</span>
                <span class="text-sm">${formatMoney(breakdown.qris)}</span>
              </div>
            </div>
            
            <div class="divider" style="background: #ccc;"></div>
            
            <div style="margin-top: 10px; margin-bottom: 10px;">
              <div class="text-xxs" style="font-weight: bold; margin-bottom: 4px; color: #666;">SUMBER REVENUE:</div>
              <div class="flex-between-center" style="margin-bottom: 5px;">
                <span class="text-xs">Ala Carte Revenue:</span>
                <span class="text-sm">${formatMoney(alacarteTotal)}</span>
              </div>
              <div class="flex-between-center" style="margin-bottom: 5px;">
                <span class="text-xs">Banquet Revenue:</span>
                <span class="text-sm">${formatMoney(banquetTotal)}</span>
              </div>
            </div>

            <div class="divider" style="background: #ccc;"></div>

            <div style="margin-top: 10px; margin-bottom: 10px;">
              <div class="text-xxs" style="font-weight: bold; margin-bottom: 4px; color: #666;">ARUS KAS LACI (CASH FLOW):</div>
              <div class="flex-between-center" style="margin-bottom: 5px;">
                <span class="text-xs">Modal Awal (House Bank):</span>
                <span class="text-sm">${formatMoney(selectedHistoryShift.houseBank)}</span>
              </div>
              
              ${selectedHistoryShift.cashFlows ? selectedHistoryShift.cashFlows.filter(c => c.type === 'in').map(c => `
              <div class="flex-between-center" style="margin-bottom: 5px;">
                <span class="text-xs">Cash In <i style="color:#666;">(${c.note})</i>:</span>
                <span class="text-sm">+${formatMoney(c.amount)}</span>
              </div>`).join('') : ''}
              
              ${(!selectedHistoryShift.cashFlows && selectedHistoryShift.cashIn) ? `
              <div class="flex-between-center" style="margin-bottom: 5px;">
                <span class="text-xs">Cash In${selectedHistoryShift.cashInNotes ? ` <i style="color:#666;">(${selectedHistoryShift.cashInNotes})</i>` : ''}:</span>
                <span class="text-sm">+${formatMoney(selectedHistoryShift.cashIn)}</span>
              </div>` : ''}

              ${selectedHistoryShift.cashFlows ? selectedHistoryShift.cashFlows.filter(c => c.type === 'out').map(c => `
              <div class="flex-between-center" style="margin-bottom: 5px;">
                <span class="text-xs">Cash Out <i style="color:#666;">(${c.note})</i>:</span>
                <span class="text-sm">-${formatMoney(c.amount)}</span>
              </div>`).join('') : ''}
              
              ${(!selectedHistoryShift.cashFlows && selectedHistoryShift.cashOut) ? `
              <div class="flex-between-center" style="margin-bottom: 5px;">
                <span class="text-xs">Cash Out${selectedHistoryShift.cashOutNotes ? ` <i style="color:#666;">(${selectedHistoryShift.cashOutNotes})</i>` : ''}:</span>
                <span class="text-sm">-${formatMoney(selectedHistoryShift.cashOut)}</span>
              </div>` : ''}
              
              <div class="flex-between-center" style="margin-bottom: 5px; margin-top: 8px;">
                <span class="text-xs" style="font-weight: bold;">Uang Fisik di Laci:</span>
                <span class="text-sm" style="font-weight: bold;">${formatMoney(selectedHistoryShift.countedCash || 0)}</span>
              </div>
              <div class="flex-between-center" style="margin-bottom: 5px;">
                <span class="text-xs" style="font-weight: bold;">Selisih:</span>
                <span class="text-sm" style="font-weight: bold;">${(() => {
                  let tIn = selectedHistoryShift.cashIn || 0;
                  let tOut = selectedHistoryShift.cashOut || 0;
                  if (selectedHistoryShift.cashFlows) {
                    tIn += selectedHistoryShift.cashFlows.filter(c => c.type === 'in').reduce((s,c) => s + c.amount, 0);
                    tOut += selectedHistoryShift.cashFlows.filter(c => c.type === 'out').reduce((s,c) => s + c.amount, 0);
                  }
                  return formatMoney((selectedHistoryShift.countedCash || 0) - (selectedHistoryShift.houseBank + breakdown.cash + tIn - tOut));
                })()}</span>
              </div>
            </div>

            <div class="divider" style="background: #000; height: 2px;"></div>
            
            <div class="flex-between-center">
              <span class="text-sm" style="font-weight: bold;">TOTAL KESELURUHAN:</span>
              <span class="text-sm" style="font-weight: bold;">${formatMoney(breakdown.total)}</span>
            </div>
          </div>
          
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredHistory = shiftHistory.filter(shift => {
    if (!shift.closedAt) return false;
    const closedDate = new Date(shift.closedAt);
    
    if (historyStartDate) {
      const start = new Date(historyStartDate);
      start.setHours(0, 0, 0, 0);
      if (closedDate < start) return false;
    }
    
    if (historyEndDate) {
      const end = new Date(historyEndDate);
      end.setHours(23, 59, 59, 999);
      if (closedDate > end) return false;
    }
    
    return true;
  });

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 font-sans">
          
          {viewMode === 'main' ? (
          <>
          {/* Header Section matching home bento alignment */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 pb-2">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                <span>Manajemen Shift Kasir</span>
              </h1>
              <p className="text-xs text-neutral-500 mt-1">
                Pantau kas laci (House Bank), penerimaan sales, dan validasi selisih shift aktif.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setViewMode('history')} variant="outline" className="h-9 px-4 rounded-xl text-xs font-bold border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 shadow-sm">
                <History className="w-4 h-4 mr-2" />
                Lihat Riwayat
              </Button>
              {activeShift ? (
                <span className="flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-4 py-2 rounded-xl border border-emerald-500/20 shadow-sm animate-in fade-in duration-200">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Aktif: {activeShift.cashierName}
                </span>
              ) : (
                <span className="flex items-center gap-2 bg-red-500/10 dark:bg-red-500/5 text-red-600 dark:text-red-400 text-xs font-semibold px-4 py-2 rounded-xl border border-red-500/20 shadow-sm animate-in fade-in duration-200">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  Shift Tertutup
                </span>
              )}
            </div>
          </div>

          {/* Main Layout */}
          <div className="flex flex-col gap-6">
            
            {/* FULL WIDTH AREA */}
            <div className="w-full space-y-6">
              {!activeShift ? (
                /* OPEN SHIFT CARD: Bento Item matching */
                <div className="rounded-2xl border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-950 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Unlock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-800 dark:text-neutral-200">Buka Shift Kasir Baru</h3>
                      <p className="text-xs text-neutral-500">Masukkan nama petugas dan modal laci awal untuk memulai.</p>
                    </div>
                  </div>

                  <div className="w-full h-[1px] bg-neutral-200 dark:bg-white/[0.1] my-1" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="cashierName" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                        Nama Kasir
                      </Label>
                      <Input
                        id="cashierName"
                        type="text"
                        placeholder="E.g. Budi"
                        value={cashierNameInput}
                        onChange={(e) => setCashierNameInput(e.target.value)}
                        className="h-10 bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl text-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="houseBank" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                        Modal Awal (House Bank)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3 text-sm text-neutral-400 font-bold">{symbol}</span>
                        <Input
                          id="houseBank"
                          type="number"
                          onWheel={(e) => (e.target as HTMLInputElement).blur()}
                          placeholder="100.00"
                          value={houseBankInput}
                          onChange={(e) => setHouseBankInput(e.target.value)}
                          className="pl-12 h-10 bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl text-sm font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3">
                    <Button
                      onClick={handleOpenShift}
                      className="w-full sm:w-auto h-10 px-6 bg-neutral-900 text-white dark:bg-white dark:text-black rounded-xl hover:bg-neutral-800 hover:scale-[1.02] text-xs font-bold transition-all flex items-center justify-center gap-2 border-none shadow-sm"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Mulai & Buka Shift</span>
                    </Button>
                  </div>
                </div>
              ) : (
                /* ACTIVE REGISTER PANEL: Bento style cards */
                <div className="space-y-6 animate-in fade-in duration-300">
                  
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
                          {formatDate(activeShift.openedAt).split(',')[1]}
                        </span>
                        <span className="text-[10px] text-neutral-400 mt-2 font-medium">
                          Kasir: {activeShift.cashierName}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* SALES BREAKDOWN */}
                  <div className="rounded-2xl border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-950 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-350">
                      Rincian Penerimaan Sales
                    </h3>
                    <div className="w-full h-[1px] bg-neutral-200 dark:bg-white/[0.1]" />
                    <div className="grid grid-cols-3 gap-4 pt-1">
                      <div className="bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.05] p-4 rounded-xl shadow-sm hover:scale-[1.01] transition-transform">
                        <span className="text-[10px] text-neutral-400 font-bold block mb-1">TUNAI / CASH</span>
                        <span className="text-base font-black text-neutral-800 dark:text-neutral-200">
                          {formatMoney(activeSales.cash)}
                        </span>
                      </div>

                      <div className="bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.05] p-4 rounded-xl shadow-sm hover:scale-[1.01] transition-transform">
                        <span className="text-[10px] text-neutral-400 font-bold block mb-1">QRIS / E-MONEY</span>
                        <span className="text-base font-black text-neutral-800 dark:text-neutral-200">
                          {formatMoney(activeSales.qris)}
                        </span>
                      </div>

                      <div className="bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.05] p-4 rounded-xl shadow-sm hover:scale-[1.01] transition-transform">
                        <span className="text-[10px] text-neutral-400 font-bold block mb-1">DEBIT / KARTU</span>
                        <span className="text-base font-black text-neutral-800 dark:text-neutral-200">
                          {formatMoney(activeSales.card)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CASH FLOW LOGGING & TABLES */}
                  <div className="rounded-2xl border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-950 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                        <Coins className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-neutral-800 dark:text-neutral-200">Pencatatan Arus Kas (Cash In/Out)</h3>
                        <p className="text-xs text-neutral-500">Catat kas masuk atau keluar selama shift berlangsung.</p>
                      </div>
                    </div>

                    <div className="w-full h-[1px] bg-neutral-200 dark:bg-white/[0.1] my-1" />

                    <div className="flex flex-col sm:flex-row gap-3 pt-2 items-end">
                      <div className="flex flex-col gap-2 w-full sm:w-1/4">
                        <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Jenis Kas</Label>
                        <select 
                          value={cashFlowType} 
                          onChange={(e) => setCashFlowType(e.target.value as 'in'|'out')}
                          className="h-10 px-3 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.1] rounded-xl text-sm font-semibold w-full focus:outline-none focus:ring-1 focus:ring-neutral-400"
                        >
                          <option value="in">📥 Kas Masuk (In)</option>
                          <option value="out">📤 Kas Keluar (Out)</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-2 w-full sm:w-1/3">
                        <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Nominal</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-sm text-neutral-400 font-bold">{symbol}</span>
                          <Input
                            type="number"
                            placeholder="0"
                            value={cashFlowAmountInput}
                            onChange={(e) => setCashFlowAmountInput(e.target.value)}
                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            className="pl-12 h-10 bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl text-sm font-semibold w-full"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 w-full sm:w-1/3">
                        <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Keterangan</Label>
                        <Input
                          placeholder="Catatan..."
                          value={cashFlowNoteInput}
                          onChange={(e) => setCashFlowNoteInput(e.target.value)}
                          className="h-10 bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl text-sm w-full"
                        />
                      </div>
                      {editingCashFlowId ? (
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button onClick={handleCancelEditCashFlow} variant="outline" className="h-10 px-4 rounded-xl text-xs font-bold border-neutral-200 dark:border-white/[0.1]">
                            Batal
                          </Button>
                          <Button onClick={handleAddOrEditCashFlow} className="h-10 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm">
                            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Simpan
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={handleAddOrEditCashFlow} className="h-10 px-6 rounded-xl text-xs font-bold w-full sm:w-auto bg-neutral-800 hover:bg-neutral-700 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 border-none shadow-sm">
                          <Plus className="w-4 h-4 mr-1.5" /> Tambah
                        </Button>
                      )}
                    </div>

                    {/* Cash Flow Tables */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pt-4 border-t border-dashed border-neutral-200 dark:border-white/[0.1]">
                      {/* Table IN */}
                      <div>
                        <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wider">Riwayat Cash In</h4>
                        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto thin-scrollbar pr-1">
                          {activeShift?.cashFlows?.filter(c => c.type === 'in').map(c => (
                            <div key={c.id} className="p-2 border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-lg flex justify-between items-center text-[11px] shadow-sm group">
                              <div className="flex flex-col flex-1">
                                <span className="font-bold text-neutral-700 dark:text-neutral-200">{c.note}</span>
                                <span className="text-[9px] text-neutral-400">{formatDate(c.timestamp).split(',')[1]}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">+{formatMoney(c.amount)}</span>
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                  <button onClick={() => handleEditCashFlow(c)} className="p-1 hover:bg-neutral-200 dark:hover:bg-zinc-800 rounded text-blue-500 transition-colors">
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => confirmDeleteCashFlow(c.id)} className="p-1 hover:bg-neutral-200 dark:hover:bg-zinc-800 rounded text-red-500 transition-colors">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {(!activeShift?.cashFlows || activeShift.cashFlows.filter(c => c.type === 'in').length === 0) && (
                            <div className="text-[10px] text-neutral-400 italic text-center py-2 border border-dashed border-neutral-200 dark:border-white/[0.1] rounded-lg">Belum ada cash in.</div>
                          )}
                        </div>
                      </div>
                      {/* Table OUT */}
                      <div>
                        <h4 className="text-[10px] font-bold text-red-500 dark:text-red-400 mb-2 uppercase tracking-wider">Riwayat Cash Out</h4>
                        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto thin-scrollbar pr-1">
                          {activeShift?.cashFlows?.filter(c => c.type === 'out').map(c => (
                            <div key={c.id} className="p-2 border border-red-500/20 bg-red-500/5 dark:bg-red-500/10 rounded-lg flex justify-between items-center text-[11px] shadow-sm group">
                              <div className="flex flex-col flex-1">
                                <span className="font-bold text-neutral-700 dark:text-neutral-200">{c.note}</span>
                                <span className="text-[9px] text-neutral-400">{formatDate(c.timestamp).split(',')[1]}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-red-500 dark:text-red-400">-{formatMoney(c.amount)}</span>
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                  <button onClick={() => handleEditCashFlow(c)} className="p-1 hover:bg-neutral-200 dark:hover:bg-zinc-800 rounded text-blue-500 transition-colors">
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => confirmDeleteCashFlow(c.id)} className="p-1 hover:bg-neutral-200 dark:hover:bg-zinc-800 rounded text-red-500 transition-colors">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {(!activeShift?.cashFlows || activeShift.cashFlows.filter(c => c.type === 'out').length === 0) && (
                            <div className="text-[10px] text-neutral-400 italic text-center py-2 border border-dashed border-neutral-200 dark:border-white/[0.1] rounded-lg">Belum ada cash out.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CLOSING AUDIT RECONCILIATION */}
                  <div className="rounded-2xl border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-950 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-neutral-800 dark:text-neutral-200">Audit & Closing Shift</h3>
                        <p className="text-xs text-neutral-500">Hitung nominal kas fisik lalu validasikan selisih laci.</p>
                      </div>
                    </div>

                    <div className="w-full h-[1px] bg-neutral-200 dark:bg-white/[0.1] my-1" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="countedCash" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                          Uang Tunai Fisik Dihitung (Counted)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-sm text-neutral-400 font-bold">{symbol}</span>
                          <Input
                            id="countedCash"
                            type="number"
                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            placeholder="0.00"
                            value={countedCashInput}
                            onChange={(e) => setCountedCashInput(e.target.value)}
                            className="pl-12 h-10 bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl text-sm font-semibold"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col justify-end">
                        <div className="p-2.5 h-10 rounded-xl border flex items-center justify-between text-xs font-bold bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.05]">
                          <span className="text-neutral-500">Selisih Laci:</span>
                          {cashDifference === 0 ? (
                            <span className="text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/5 px-3 py-1 rounded-full text-[10px] font-bold">Cocok / Balanced</span>
                          ) : cashDifference > 0 ? (
                            <span className="text-amber-500 bg-amber-500/10 dark:bg-amber-500/5 px-3 py-1 rounded-full text-[10px] font-bold">Kelebihan (+{formatMoney(cashDifference)})</span>
                          ) : (
                            <span className="text-red-500 bg-red-500/10 dark:bg-red-500/5 px-3 py-1 rounded-full text-[10px] font-bold">Kekurangan ({formatMoney(cashDifference)})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="closingNotes" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                        Catatan Shift / Closing Notes
                      </Label>
                      <textarea
                        id="closingNotes"
                        rows={2}
                        placeholder="Masukkan catatan audit register..."
                        value={closingNotes}
                        onChange={(e) => setClosingNotes(e.target.value)}
                        className="p-3 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.1] rounded-xl text-xs text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 font-sans resize-none"
                      />
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={handleCloseShift}
                        className="w-full sm:w-auto h-10 px-6 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border-none shadow-md shadow-red-500/10 transition-transform hover:scale-[1.02]"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Closing & Selesai Shift</span>
                      </Button>
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>
          </>
          ) : (
            /* HISTORY VIEW MODE */
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 pb-2">
                <div className="flex items-center gap-4">
                  <Button onClick={() => setViewMode('main')} variant="outline" size="icon" className="h-10 w-10 rounded-full border-neutral-200 dark:border-white/[0.1]">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                      <History className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                      <span>Riwayat Shift Kasir</span>
                    </h1>
                    <p className="text-xs text-neutral-500 mt-1">
                      Arsip data closing kasir berdasarkan rentang tanggal.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-950 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-end mb-6 bg-neutral-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-neutral-200/60 dark:border-white/[0.05]">
                  <div className="flex flex-col gap-2 w-full md:w-auto">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Mulai Tanggal</Label>
                    <Input 
                      type="date" 
                      value={historyStartDate} 
                      onChange={(e) => setHistoryStartDate(e.target.value)}
                      className="h-9 text-sm rounded-lg border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900" 
                    />
                  </div>
                  <div className="flex flex-col gap-2 w-full md:w-auto">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Sampai Tanggal</Label>
                    <Input 
                      type="date" 
                      value={historyEndDate} 
                      onChange={(e) => setHistoryEndDate(e.target.value)}
                      className="h-9 text-sm rounded-lg border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900" 
                    />
                  </div>
                  <div className="w-full md:w-auto mt-2 md:mt-0">
                    <Button variant="secondary" onClick={() => { setHistoryStartDate(''); setHistoryEndDate(''); }} className="h-9 w-full md:w-auto text-xs rounded-lg">
                      Reset Filter
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredHistory.map((historyShift) => {
                    const breakdown = getSalesBreakdown(historyShift);
                    let tIn = historyShift.cashIn || 0;
                    let tOut = historyShift.cashOut || 0;
                    if (historyShift.cashFlows) {
                      tIn += historyShift.cashFlows.filter(c => c.type === 'in').reduce((s,c) => s + c.amount, 0);
                      tOut += historyShift.cashFlows.filter(c => c.type === 'out').reduce((s,c) => s + c.amount, 0);
                    }
                    const expected = historyShift.houseBank + breakdown.cash + tIn - tOut;
                    const diff = (historyShift.countedCash || 0) - expected;
                    
                    return (
                      <div
                        key={historyShift.id}
                        className="p-4 rounded-2xl border border-neutral-200 dark:border-white/[0.05] bg-white dark:bg-zinc-950 hover:border-neutral-300 dark:hover:border-white/[0.1] flex flex-col gap-3 transition-all duration-200 hover:shadow-md group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-neutral-100 dark:from-white/5 to-transparent rounded-bl-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-neutral-400 font-medium flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              {formatDate(historyShift.closedAt || '')}
                            </span>
                            <h4 className="font-bold text-neutral-800 dark:text-neutral-200 mt-1">Shift: {historyShift.cashierName}</h4>
                          </div>
                          {diff === 0 ? (
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/5 dark:text-emerald-400 px-2 py-1 rounded-full font-bold uppercase">Balanced</span>
                          ) : (
                            <span className="text-[9px] bg-red-500/10 text-red-600 dark:bg-red-500/5 dark:text-red-400 px-2 py-1 rounded-full font-bold uppercase">Selisih</span>
                          )}
                        </div>

                        <div className="w-full h-[1px] bg-neutral-100 dark:bg-white/[0.05]" />

                        <div className="flex justify-between items-end">
                          <div>
                            <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">Total Sales</span>
                            <span className="block text-lg font-black text-neutral-800 dark:text-white mt-0.5">{formatMoney(breakdown.total)}</span>
                          </div>
                          
                          <div className="text-right">
                             <span className="text-[9px] text-neutral-500 block mb-0.5 font-bold uppercase">Transactions</span>
                             <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300 block">{breakdown.count} TRX</span>
                          </div>
                        </div>

                        {/* Professional Action Footer */}
                        <div className="grid grid-cols-2 gap-2 mt-1 pt-3 border-t border-dashed border-neutral-200 dark:border-white/[0.1]">
                          <Button 
                            variant="secondary" 
                            className="w-full h-8 text-[10px] font-bold rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border-none shadow-none"
                            onClick={() => openDetailModal(historyShift)}
                          >
                            <FileText className="w-3.5 h-3.5 mr-1.5" /> Detail
                          </Button>
                          
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              className="w-full h-8 text-[10px] font-bold rounded-lg border-neutral-200 dark:border-white/[0.1] hover:bg-neutral-50 dark:hover:bg-white/[0.02]"
                              onClick={() => {
                                setSelectedHistoryShift(historyShift);
                                setIsHistoryModalOpen(true);
                              }}
                            >
                              <Printer className="w-3.5 h-3.5 mr-1.5" /> Cetak Slip
                            </Button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShiftToDelete(historyShift);
                                setIsDeleteOpen(true);
                              }}
                              className="h-8 px-2.5 rounded-lg border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Hapus Riwayat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredHistory.length === 0 && (
                    <div className="col-span-full text-center py-16 bg-neutral-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-white/[0.1]">
                      <Search className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
                      <p className="text-sm font-medium text-neutral-500">Tidak ada data riwayat shift ditemukan.</p>
                      <p className="text-[11px] text-neutral-400 mt-1">Coba sesuaikan filter tanggal atau lakukan closing shift.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CLOSED SHIFT PRINT MODAL */}
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
                  <p className="text-[9px] text-neutral-500 font-bold mt-0.5">{restoName.toUpperCase()}</p>
                  
                  <div className="w-full border-t border-dashed border-neutral-300 dark:border-white/[0.1] my-2" />
                  
                  <div className="w-full text-left text-[10px] flex flex-col gap-1 text-neutral-600 dark:text-neutral-400">
                    <div className="flex justify-between">
                      <span>Shift Kasir:</span>
                      <span className="font-bold">{selectedHistoryShift.cashierName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Waktu Buka:</span>
                      <span>{formatDate(selectedHistoryShift.openedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Waktu Tutup:</span>
                      <span>{formatDate(selectedHistoryShift.closedAt || '')}</span>
                    </div>
                  </div>
                  
                  <div className="w-full border-t border-dashed border-neutral-300 dark:border-white/[0.1] my-2" />
                  
                  {/* Sales Breakdown */}
                  <div className="w-full text-left text-[10px] flex flex-col gap-1 py-0.5">
                    <span className="font-bold block mb-1 text-[9px] uppercase tracking-wider text-neutral-400">Rincian Penjualan:</span>
                    
                    {isLoadingDetail ? (
                      <span className="text-neutral-500 italic flex items-center gap-1 animate-pulse">
                        Memuat rincian transaksi...
                      </span>
                    ) : (() => {
                      const b = getSalesBreakdown(selectedHistoryShift);
                      
                      let alacarteTotal = 0;
                      let banquetTotal = 0;
                      
                      detailTransactions.forEach(tx => {
                        const isBanquet = tx.revenueType?.toLowerCase() === 'banquet' || 
                                          tx.category?.toLowerCase() === 'banquet' || 
                                          tx.category?.toLowerCase().includes('banquet');
                        if (isBanquet) {
                          banquetTotal += tx.amount;
                        } else {
                          alacarteTotal += tx.amount;
                        }
                      });

                      return (
                        <>
                          <div className="flex justify-between">
                            <span>Ala Carte Revenue:</span>
                            <span>{formatMoney(alacarteTotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Banquet Revenue:</span>
                            <span>{formatMoney(banquetTotal)}</span>
                          </div>
                          
                          <div className="w-full border-t border-dotted border-neutral-200 dark:border-white/[0.05] my-1" />
                          
                          <div className="flex justify-between">
                            <span>Tunai / Cash:</span>
                            <span>{formatMoney(b.cash)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>QRIS / E-Money:</span>
                            <span>{formatMoney(b.qris)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Debit / Kredit:</span>
                            <span>{formatMoney(b.card)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-neutral-700 dark:text-neutral-200 border-t border-dotted border-neutral-200 dark:border-white/[0.05] pt-1 mt-1">
                            <span>Total Pendapatan:</span>
                            <span>{formatMoney(b.total)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="w-full border-t border-dashed border-neutral-300 dark:border-white/[0.1] my-2" />

                  {/* Cash Reconciliation */}
                  <div className="w-full text-left text-[10px] flex flex-col gap-1 py-0.5">
                    <span className="font-bold block mb-1 text-[9px] uppercase tracking-wider text-neutral-400">Rekonsiliasi Laci:</span>
                    
                    {(() => {
                      const b = getSalesBreakdown(selectedHistoryShift);
                      let tIn = selectedHistoryShift.cashIn || 0;
                      let tOut = selectedHistoryShift.cashOut || 0;
                      if (selectedHistoryShift.cashFlows) {
                        tIn += selectedHistoryShift.cashFlows.filter(c => c.type === 'in').reduce((s,c) => s + c.amount, 0);
                        tOut += selectedHistoryShift.cashFlows.filter(c => c.type === 'out').reduce((s,c) => s + c.amount, 0);
                      }
                      const expected = selectedHistoryShift.houseBank + b.cash + tIn - tOut;
                      const counted = selectedHistoryShift.countedCash || 0;
                      const diff = counted - expected;
                      
                      return (
                        <>
                          <div className="flex justify-between">
                            <span>House Bank (Modal Awal):</span>
                            <span>{formatMoney(selectedHistoryShift.houseBank)}</span>
                          </div>
                          
                          {/* Cash Flows IN */}
                          {selectedHistoryShift.cashFlows?.filter(c => c.type === 'in').map(c => (
                            <div key={c.id} className="flex justify-between">
                              <span>Cash In ({c.note}):</span>
                              <span>+{formatMoney(c.amount)}</span>
                            </div>
                          ))}
                          {!selectedHistoryShift.cashFlows && (selectedHistoryShift.cashIn || 0) > 0 && (
                            <div className="flex justify-between">
                              <span>Cash In {selectedHistoryShift.cashInNotes ? `(${selectedHistoryShift.cashInNotes})` : ''}:</span>
                              <span>+{formatMoney(selectedHistoryShift.cashIn!)}</span>
                            </div>
                          )}

                          {/* Cash Flows OUT */}
                          {selectedHistoryShift.cashFlows?.filter(c => c.type === 'out').map(c => (
                            <div key={c.id} className="flex justify-between text-red-500 dark:text-red-400">
                              <span>Cash Out ({c.note}):</span>
                              <span>-{formatMoney(c.amount)}</span>
                            </div>
                          ))}
                          {!selectedHistoryShift.cashFlows && (selectedHistoryShift.cashOut || 0) > 0 && (
                            <div className="flex justify-between text-red-500 dark:text-red-400">
                              <span>Cash Out {selectedHistoryShift.cashOutNotes ? `(${selectedHistoryShift.cashOutNotes})` : ''}:</span>
                              <span>-{formatMoney(selectedHistoryShift.cashOut!)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Estimasi Tunai di Laci:</span>
                            <span>{formatMoney(expected)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-neutral-700 dark:text-neutral-200">
                            <span>Tunai Fisik Dihitung:</span>
                            <span>{formatMoney(counted)}</span>
                          </div>
                          
                          <div className="flex justify-between font-bold mt-1 border-t border-dotted border-neutral-200 dark:border-white/[0.05] pt-1">
                            <span>Selisih Laci:</span>
                            {diff === 0 ? (
                              <span className="text-emerald-500">Balanced / Cocok</span>
                            ) : diff > 0 ? (
                              <span className="text-amber-500">Kelebihan (+{formatMoney(diff)})</span>
                            ) : (
                              <span className="text-red-500">Kekurangan ({formatMoney(diff)})</span>
                            )}
                          </div>
                        </>
                      );
                    })()}
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
                    <Button
                      variant="outline"
                      onClick={() => toast.info('Printer tidak terhubung.')}
                      className="rounded-xl flex items-center justify-center gap-1.5 border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 text-xs w-full"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Closing Slip</span>
                    </Button>
                    
                    <Button
                      onClick={() => {
                        setIsHistoryModalOpen(false);
                        setSelectedHistoryShift(null);
                      }}
                      className="rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-100 border-none text-xs font-bold w-full"
                    >
                      Tutup
                    </Button>
                  </div>
                  
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShiftToDelete(selectedHistoryShift);
                      setIsHistoryModalOpen(false);
                      setIsDeleteOpen(true);
                    }}
                    className="rounded-xl flex items-center justify-center gap-1.5 text-xs w-full"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Riwayat Shift</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* DETAIL TRANSAKSI MODAL */}
          {isDetailModalOpen && selectedHistoryShift && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.1] rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
                <button 
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setSelectedHistoryShift(null);
                  }}
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
                      {detailTransactions.map((tx, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-neutral-200 dark:border-white/[0.05] bg-neutral-50 dark:bg-zinc-950/50 flex flex-col gap-3 hover:border-neutral-300 dark:hover:border-white/[0.1] transition-colors shadow-sm">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{tx.id}</span>
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
                      ))}
                      
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
                              {formatMoney(getSalesBreakdown(selectedHistoryShift).cash)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-neutral-600 dark:text-neutral-300 font-medium">Debit / Card:</span>
                            <span className="font-bold text-neutral-800 dark:text-white">
                              {formatMoney(getSalesBreakdown(selectedHistoryShift).card)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-neutral-600 dark:text-neutral-300 font-medium">QRIS / E-Money:</span>
                            <span className="font-bold text-neutral-800 dark:text-white">
                              {formatMoney(getSalesBreakdown(selectedHistoryShift).qris)}
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-[1px] bg-emerald-500/10 my-2" />

                        <div className="flex flex-col gap-2 mt-1 mb-3">
                          <span className="text-[10px] font-bold text-neutral-500 uppercase">Sumber Revenue</span>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-neutral-600 dark:text-neutral-300 font-medium">Ala Carte Revenue:</span>
                            <span className="font-bold text-neutral-800 dark:text-white">
                              {(() => {
                                let total = 0;
                                detailTransactions.forEach(tx => {
                                  const isBanquet = tx.revenueType?.toLowerCase() === 'banquet' || 
                                                    tx.category?.toLowerCase() === 'banquet' || 
                                                    tx.category?.toLowerCase().includes('banquet');
                                  if (!isBanquet) total += tx.amount;
                                });
                                return formatMoney(total);
                              })()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-neutral-600 dark:text-neutral-300 font-medium">Banquet Revenue:</span>
                            <span className="font-bold text-neutral-800 dark:text-white">
                              {(() => {
                                let total = 0;
                                detailTransactions.forEach(tx => {
                                  const isBanquet = tx.revenueType?.toLowerCase() === 'banquet' || 
                                                    tx.category?.toLowerCase() === 'banquet' || 
                                                    tx.category?.toLowerCase().includes('banquet');
                                  if (isBanquet) total += tx.amount;
                                });
                                return formatMoney(total);
                              })()}
                            </span>
                          </div>
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
                              const diff = (selectedHistoryShift.countedCash || 0) - (selectedHistoryShift.houseBank + getSalesBreakdown(selectedHistoryShift).cash + tIn - tOut);
                              return (
                                <span className={`font-bold ${diff === 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {formatMoney(diff)}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                        
                        <div className="w-full h-[2px] bg-emerald-500/20 my-1" />
                        
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm font-black text-neutral-800 dark:text-white">TOTAL KESELURUHAN:</span>
                          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                            {formatMoney(getSalesBreakdown(selectedHistoryShift).total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 mt-2 border-t border-neutral-200 dark:border-white/[0.1] flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePrintDetail}
                    disabled={isLoadingDetail || detailTransactions.length === 0}
                    className="rounded-xl border-neutral-200 dark:border-white/[0.1] text-xs font-bold px-4"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1.5" />
                    Cetak PDF / Print
                  </Button>
                  <Button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      setSelectedHistoryShift(null);
                    }}
                    className="rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-100 border-none text-xs font-bold px-6"
                  >
                    Tutup
                  </Button>
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
                      className="h-10 text-sm bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl"
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
                      className="rounded-xl w-full text-xs"
                    >
                      Batal
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteShift}
                      className="rounded-xl w-full text-xs font-bold"
                    >
                      Hapus Permanen
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CASH FLOW DELETE CONFIRMATION MODAL */}
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
                      Konfirmasi Hapus Arus Kas
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      Apakah Anda yakin ingin menghapus pencatatan arus kas ini? Tindakan ini akan memengaruhi total selisih laci.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsDeleteCashFlowOpen(false);
                        setCashFlowToDelete(null);
                      }}
                      className="w-1/2 rounded-xl h-10 text-xs font-bold border-neutral-200 dark:border-white/[0.1]"
                    >
                      Batal
                    </Button>
                    <Button 
                      onClick={handleDeleteCashFlow}
                      className="w-1/2 rounded-xl h-10 bg-red-600 hover:bg-red-700 text-white border-none shadow-sm text-xs font-bold"
                    >
                      Ya, Hapus
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
