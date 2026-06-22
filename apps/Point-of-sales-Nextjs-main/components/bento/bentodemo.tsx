/* eslint-disable react/no-unescaped-entities */
'use client';
import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { BentoGrid, BentoGridItem } from '../ui/bento-grid';
import { IconClock, IconTableColumn } from '@tabler/icons-react';
import DigitalClock from '../clock/clock';
import ActiveShiftSummary from '../card/shiftsummary';
import ChartOne from '../charts/chartone';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, collection, deleteDoc, updateDoc } from 'firebase/firestore';
import { localDb } from '@/lib/dexie';
import { toast } from 'react-toastify';
import { Coffee, Users, Plus, Trash2, X, ClipboardList, CheckCircle } from 'lucide-react';

// Live Tables Component
function LiveTableGrid() {
  const [hotelCode, setHotelCode] = useState<string>('1');
  const [tablesList, setTablesList] = useState<string[]>([]);
  const [heldOrders, setHeldOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal detailed states
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isEditingTableName, setIsEditingTableName] = useState<boolean>(false);
  const [newTableName, setNewTableName] = useState<string>('');
  const [isSavingTableName, setIsSavingTableName] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
      };
      
      let code = getCookie('hotelCode');
      if (!code) {
        const userJson = localStorage.getItem('user');
        if (userJson) {
          try {
            const userObj = JSON.parse(userJson);
            code = userObj.hotelCode;
          } catch (e) {}
        }
      }
      if (!code) {
        code = localStorage.getItem('hotelCode') || '1';
      }
      setHotelCode(code);
    }
  }, []);

  useEffect(() => {
    if (!hotelCode) return;

    let unsub: any;
    const fetchConfigAndListen = async () => {
      try {
        // 1. Fetch registered tables from Firestore pos settings
        const posRef = doc(db, 'hotels', hotelCode, 'settings', 'pos');
        const posSnap = await getDoc(posRef);
        let rawTables = '10';
        if (posSnap.exists()) {
          rawTables = posSnap.data().tables || '10';
        }

        let parsedTables: string[] = [];
        if (/^\d+$/.test(rawTables.trim())) {
          const count = parseInt(rawTables.trim());
          for (let i = 1; i <= count; i++) {
            parsedTables.push(`Meja ${i}`);
          }
        } else {
          parsedTables = rawTables.split(',').map(t => t.trim()).filter(Boolean);
        }
        setTablesList(parsedTables);

        // 2. Listen in real-time to held orders
        const q = collection(db, 'hotels', hotelCode, 'pos_held_orders');
        unsub = onSnapshot(q, (snap) => {
          const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setHeldOrders(orders);
          setIsLoading(false);
        }, (err) => {
          console.error('Firestore live tables listener error:', err);
          setIsLoading(false);
        });

      } catch (err) {
        console.error('Failed to load tables status:', err);
        setIsLoading(false);
      }
    };

    fetchConfigAndListen();

    return () => {
      if (unsub) unsub();
    };
  }, [hotelCode]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  // Helper to normalize table names for comparison (strips "meja"/"table" prefix & non-alphanumeric)
  const normalizeTable = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val).toLowerCase().trim();
    const withoutPrefix = str.replace(/^(meja|table)\s*/g, '');
    return withoutPrefix.replace(/[^a-z0-9]/g, '');
  };

  const handleSaveTableName = async () => {
    if (!selectedTable || !newTableName.trim()) return;
    setIsSavingTableName(true);

    const oldName = selectedTable.trim();
    const cleanNewName = newTableName.trim();

    try {
      // 1. Check if the table is registered in tablesList
      const isRegistered = tablesList.some(
        t => t.toLowerCase().trim() === oldName.toLowerCase()
      );

      if (isRegistered) {
        const posRef = doc(db, 'hotels', hotelCode, 'settings', 'pos');
        const posSnap = await getDoc(posRef);
        
        let rawTables = '10';
        if (posSnap.exists()) {
          rawTables = posSnap.data().tables || '10';
        }

        let updatedTablesString = '';
        if (/^\d+$/.test(rawTables.trim())) {
          const count = parseInt(rawTables.trim());
          const list: string[] = [];
          for (let i = 1; i <= count; i++) {
            list.push(`Meja ${i}`);
          }
          const index = list.findIndex(t => t.toLowerCase() === oldName.toLowerCase());
          if (index !== -1) {
            list[index] = cleanNewName;
          }
          updatedTablesString = list.join(', ');
        } else {
          const list = rawTables.split(',').map(t => t.trim()).filter(Boolean);
          const index = list.findIndex(t => t.toLowerCase() === oldName.toLowerCase());
          if (index !== -1) {
            list[index] = cleanNewName;
          }
          updatedTablesString = list.join(', ');
        }

        // Save updated tables config back to Firestore
        await updateDoc(posRef, { tables: updatedTablesString });
        
        // Update local state tablesList immediately
        setTablesList(prev => {
          const list = [...prev];
          const index = list.findIndex(t => t.toLowerCase() === oldName.toLowerCase());
          if (index !== -1) list[index] = cleanNewName;
          return list;
        });
      }

      // 2. If there is an active order, update its tableNumber
      if (selectedOrder) {
        const orderRef = doc(db, 'hotels', hotelCode, 'pos_held_orders', selectedOrder.id);
        await updateDoc(orderRef, { tableNumber: cleanNewName });
        await localDb.heldOrders.update(selectedOrder.id, { tableNumber: cleanNewName });
      }

      toast.success(`Meja "${oldName}" berhasil diubah menjadi "${cleanNewName}".`);
      setSelectedTable(cleanNewName);
      setIsEditingTableName(false);
    } catch (err) {
      console.error('Failed to update table name:', err);
      toast.error('Gagal mengubah nama meja.');
    } finally {
      setIsSavingTableName(false);
    }
  };

  const handleTableClick = (tableName: string) => {
    const activeOrder = heldOrders.find(
      order => normalizeTable(order.tableNumber) === normalizeTable(tableName)
    );

    setSelectedTable(tableName);
    setSelectedOrder(activeOrder || null);
    setIsEditingTableName(false);
    setIsModalOpen(true);
  };

  const handleCheckout = () => {
    if (!selectedOrder) return;
    localStorage.setItem('restored_held_order', JSON.stringify(selectedOrder));
    toast.info(`Memulihkan meja ${selectedTable} ke kasir.`);
    window.location.href = '/lexupos';
  };

  const handleClearTable = () => {
    if (!selectedOrder) return;
    setIsConfirmClearOpen(true);
  };

  const handleConfirmClearTable = async () => {
    if (!selectedOrder) return;
    setIsDeleting(true);
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'hotels', hotelCode, 'pos_held_orders', selectedOrder.id));
      // Delete from IndexedDB
      await localDb.heldOrders.delete(selectedOrder.id);

      toast.success(`Meja ${selectedTable} berhasil dikosongkan.`);
      setIsConfirmClearOpen(false);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to clear table:', err);
      toast.error('Gagal mengosongkan meja.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenNewTable = () => {
    localStorage.setItem('prefilled_table_number', selectedTable || '');
    window.location.href = '/lexupos';
  };

  return (
    <div className="w-full bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/[0.08] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-500 dark:text-[#a1a1aa] font-bold uppercase tracking-widest">Real-time Layout</span>
          <h3 className="text-sm font-bold text-neutral-800 dark:text-[#f4f4f5] flex items-center gap-2">
            <IconTableColumn className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
            Status Denah Meja Aktif
          </h3>
        </div>
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500" />
              <span className="text-neutral-600 dark:text-neutral-400">Terisi ({heldOrders.length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500" />
              <span className="text-neutral-600 dark:text-neutral-400">Kosong ({Math.max(0, tablesList.length - heldOrders.filter(o => tablesList.some(t => normalizeTable(t) === normalizeTable(o.tableNumber))).length)})</span>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center items-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 animate-pulse">
          Memuat status meja...
        </div>
      ) : tablesList.length === 0 ? (
        <div className="py-12 border border-dashed border-neutral-200 dark:border-zinc-800 rounded-xl flex flex-col justify-center items-center text-xs font-medium text-neutral-500 dark:text-neutral-400 gap-2">
          <span>Belum ada meja yang didaftarkan.</span>
          <a href="/settings" className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold">Atur di Pengaturan Toko &rarr;</a>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {(() => {
            const registeredMatches = tablesList.map((tableName) => {
              const activeOrder = heldOrders.find(
                order => normalizeTable(order.tableNumber) === normalizeTable(tableName)
              );
              return {
                tableName,
                activeOrder,
                isOccupied: !!activeOrder,
                isExtra: false,
              };
            });

            const extraTables = heldOrders
              .filter(order => {
                const orderNorm = normalizeTable(order.tableNumber);
                return orderNorm && !tablesList.some(t => normalizeTable(t) === orderNorm);
              })
              .map(order => ({
                tableName: order.tableNumber || 'Meja Ekstra',
                activeOrder: order,
                isOccupied: true,
                isExtra: true,
              }));

            const allTables = [...registeredMatches, ...extraTables];

            return allTables.map(({ tableName, activeOrder, isOccupied, isExtra }) => (
              <button
                key={isOccupied && activeOrder ? `${tableName}-${activeOrder.id}` : tableName}
                onClick={() => handleTableClick(tableName)}
                className={cn(
                  "p-4 rounded-xl border flex flex-col justify-between items-start text-left transition-all relative overflow-hidden select-none cursor-pointer h-[115px] focus:outline-none",
                  isOccupied
                    ? "bg-emerald-100/80 dark:bg-emerald-950/40 border-emerald-400/60 dark:border-emerald-800 hover:border-emerald-500 hover:shadow-md"
                    : "bg-red-100/80 dark:bg-red-950/40 border-red-400/60 dark:border-red-800 hover:border-red-500 hover:shadow-md"
                )}
              >
                <div className="w-full flex justify-between items-start gap-1">
                  <span className={cn(
                    "text-xs font-black tracking-tight truncate pr-2 flex items-center gap-1",
                    isOccupied ? "text-emerald-950 dark:text-emerald-100" : "text-red-950 dark:text-red-100"
                  )}>
                    {tableName}
                  </span>
                  {isOccupied ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse shrink-0 mt-1" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0 mt-1" />
                  )}
                </div>

                {isOccupied ? (
                  <div className="w-full flex flex-col gap-0.5 mt-2">
                    <span className="text-[10px] font-bold text-emerald-900 dark:text-[#a1a1aa] truncate flex items-center gap-1">
                      <Users size={10} className="shrink-0" />
                      {activeOrder.customerName || 'Guest'}
                    </span>
                    <div className="flex items-center justify-between w-full mt-1">
                      <span className="text-[11px] font-black text-emerald-750 dark:text-emerald-400">
                        {formatCurrency(activeOrder.payableAmount || activeOrder.subtotal || 0)}
                      </span>
                      {activeOrder.isPaidDirectly ? (
                        <span className="text-[8px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.5 rounded-[6px] tracking-wide leading-none">
                          PAID
                        </span>
                      ) : (
                        <span className="text-[8px] bg-amber-500 text-white font-extrabold px-1.5 py-0.5 rounded-[6px] tracking-wide leading-none animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)] border border-amber-400">
                          UNPAID
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex flex-col gap-0.5 mt-2">
                    <span className="text-[10px] font-black text-red-700 dark:text-red-400 mt-auto">
                      Kosong
                    </span>
                  </div>
                )}
              </button>
            ));
          })()}
        </div>
      )}

      {/* Table Detailed Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="bg-white dark:bg-[#161618] border border-slate-200 dark:border-white/[0.08] w-full max-w-md rounded-xl shadow-2xl p-6 z-10 flex flex-col relative overflow-hidden font-sans">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-500 dark:text-neutral-400 border-none cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col gap-1.5 mb-5 border-b border-neutral-100 dark:border-zinc-800 pb-4 pr-8">
              <span className="text-[10px] text-neutral-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Detail Sesi Meja</span>
              {isEditingTableName ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-[6px] border border-neutral-200 dark:border-zinc-800 bg-transparent dark:text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Nama meja/gazebo..."
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTableName}
                    disabled={isSavingTableName}
                    className="px-3 py-1.5 text-[10px] font-bold bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 text-white rounded-xl cursor-pointer border-none transition-colors"
                  >
                    Simpan
                  </button>
                  <button
                    onClick={() => setIsEditingTableName(false)}
                    className="px-2 py-1.5 text-[10px] font-bold bg-neutral-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl cursor-pointer border-none text-neutral-600 dark:text-neutral-300 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-base font-black text-neutral-800 dark:text-[#f4f4f5] flex items-center gap-2 m-0">
                    <Coffee size={18} className={selectedOrder ? "text-stone-900 dark:text-white" : "text-red-500 dark:text-red-400"} />
                    {selectedTable}
                  </h3>
                  <button
                    onClick={() => {
                      setNewTableName(selectedTable || '');
                      setIsEditingTableName(true);
                    }}
                    className="text-[10px] text-stone-900 dark:text-white hover:underline font-bold bg-transparent border-none cursor-pointer p-0 ml-1.5"
                  >
                    Ubah Nama
                  </button>
                </div>
              )}
            </div>

            {selectedOrder ? (
              <div className="flex-grow flex flex-col min-h-0">
                {/* Guest Info */}
                <div className="flex flex-col gap-2 bg-neutral-50 dark:bg-white/[0.02] border border-neutral-150 dark:border-white/[0.05] rounded-[10px] p-3 mb-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500 dark:text-[#a1a1aa] font-medium">Nama Tamu</span>
                    <span className="text-neutral-800 dark:text-[#f4f4f5] font-black">{selectedOrder.customerName || 'Guest'}</span>
                  </div>
                  {selectedOrder.notes && (
                    <div className="flex flex-col gap-0.5 text-xs pt-1 border-t border-neutral-200/50 dark:border-zinc-800/50">
                      <span className="text-neutral-500 dark:text-[#a1a1aa] font-medium">Catatan Meja</span>
                      <span className="text-neutral-700 dark:text-neutral-300 italic">{selectedOrder.notes}</span>
                    </div>
                  )}
                </div>

                {/* Items List */}
                <span className="text-[10px] text-neutral-400 dark:text-zinc-500 font-bold uppercase tracking-wider mb-2">Item Pesanan</span>
                <div className="flex-grow max-h-[160px] overflow-y-auto border border-neutral-100 dark:border-zinc-800/80 rounded-[10px] p-3 flex flex-col gap-2 mb-4 bg-transparent no-scrollbar">
                  {selectedOrder.cart && selectedOrder.cart.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start text-xs">
                      <div className="flex flex-col min-w-0 pr-4">
                        <span className="text-neutral-800 dark:text-[#f4f4f5] font-bold truncate">
                          {item.product?.name || 'Item'}
                        </span>
                        <span className="text-[10px] text-neutral-500 dark:text-[#a1a1aa]">
                          {item.quantity} x {formatCurrency(item.product?.price || 0)}
                        </span>
                      </div>
                      <span className="text-neutral-800 dark:text-[#f4f4f5] font-bold shrink-0">
                        {formatCurrency((item.product?.price || 0) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-neutral-100 dark:border-zinc-800 pt-3 flex flex-col gap-1.5 mb-6">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500 dark:text-neutral-400 font-medium">Subtotal</span>
                    <span className="text-neutral-800 dark:text-[#f4f4f5] font-semibold">{formatCurrency(selectedOrder.subtotal || 0)}</span>
                  </div>
                  {selectedOrder.tax > 0 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-500 dark:text-neutral-400 font-medium">Pajak & Layanan</span>
                      <span className="text-neutral-800 dark:text-[#f4f4f5] font-semibold">{formatCurrency(selectedOrder.tax || 0)}</span>
                    </div>
                  )}
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between items-center text-xs text-red-500">
                      <span>Diskon</span>
                      <span>-{formatCurrency(selectedOrder.discount || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-neutral-100 dark:border-zinc-800/80 mt-1">
                    <span className="text-neutral-800 dark:text-neutral-200 font-black">Total Tagihan</span>
                    <span className="text-stone-900 dark:text-white font-black text-base">
                      {formatCurrency(selectedOrder.payableAmount || selectedOrder.subtotal || 0)}
                    </span>
                  </div>
                  {/* Status Banner */}
                  <div className={cn(
                    "mt-3 p-2 rounded-[10px] text-center text-[10px] font-black uppercase tracking-wider leading-none",
                    selectedOrder.isPaidDirectly 
                      ? "bg-emerald-500/10 text-emerald-650 dark:bg-emerald-500/20 dark:text-emerald-400"
                      : "bg-amber-500/10 text-amber-650 dark:bg-amber-500/20 dark:text-amber-400"
                  )}>
                    {selectedOrder.isPaidDirectly ? "Pembayaran: PAID (Lunas)" : "Pembayaran: UNPAID (Belum Bayar)"}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {!selectedOrder.isPaidDirectly ? (
                    <>
                      <button
                        onClick={handleCheckout}
                        className="flex-1 py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 font-black text-xs cursor-pointer border-none flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.98]"
                      >
                        <Plus size={14} />
                        Ubah & Tambah Orderan
                      </button>
                      <button
                        disabled={isDeleting}
                        onClick={handleClearTable}
                        className="py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-white font-black text-xs cursor-pointer border-none flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        Clear Table
                      </button>
                    </>
                  ) : (
                    <button
                      disabled={isDeleting}
                      onClick={handleClearTable}
                      className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 font-black text-xs cursor-pointer border-none flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                    >
                      <CheckCircle size={14} />
                      Selesai & Kosongkan Meja
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="py-6 border border-dashed border-neutral-150 dark:border-zinc-800 rounded-xl flex flex-col justify-center items-center text-center p-4 gap-2.5 mb-6">
                  <span className="text-xs text-neutral-500 dark:text-[#a1a1aa] font-semibold">
                    Meja ini saat ini kosong (tidak ada pesanan aktif).
                  </span>
                </div>
                <button
                  onClick={handleOpenNewTable}
                  className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 font-black text-xs cursor-pointer border-none flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.98]"
                >
                  <Plus size={14} />
                  Buka Meja Baru
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom CSS Confirmation Modal for Clearing Table */}
      {isConfirmClearOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsConfirmClearOpen(false)} />
          
          <div className="bg-white dark:bg-[#161618] border border-slate-200 dark:border-white/[0.08] w-full max-w-sm rounded-xl shadow-2xl p-6 z-10 flex flex-col relative overflow-hidden font-sans">
            <h4 className="text-sm font-black text-neutral-800 dark:text-[#f4f4f5] m-0 mb-3">
              Konfirmasi Kosongkan Meja
            </h4>
            
            <p className="text-xs text-neutral-600 dark:text-[#a1a1aa] leading-relaxed mb-6">
              Apakah Anda yakin ingin membersihkan meja <strong className="text-neutral-800 dark:text-[#f4f4f5]">{selectedTable}</strong>? Pesanan aktif ini akan dihapus/dibatalkan secara permanen.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsConfirmClearOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white dark:bg-zinc-800 hover:bg-neutral-100 dark:hover:bg-zinc-700 text-neutral-850 dark:text-neutral-200 border border-slate-200 dark:border-white/[0.08] font-black text-xs cursor-pointer transition-all active:scale-[0.98]"
              >
                Batal
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmClearTable}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs cursor-pointer border-none transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isDeleting ? 'Mengosongkan...' : 'Ya, Kosongkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function BentoGridHome() {
  return (
    <div className="w-full flex flex-col gap-4">
      {/* Row 1: Digital Clock & Shift Status Summary */}
      <BentoGrid className="w-full mx-auto md:auto-rows-auto">
        <BentoGridItem
          title={items[0].title}
          description={items[0].description}
          header={items[0].header}
          className={cn('[&>p:text-lg]', items[0].className)}
          icon={items[0].icon}
        />
        <BentoGridItem
          title={items[1].title}
          description={items[1].description}
          header={items[1].header}
          className={cn('[&>p:text-lg]', items[1].className)}
          icon={items[1].icon}
        />
      </BentoGrid>

      {/* Row 2: Live Meja Status Grid (New addition below sales report) */}
      <div className="w-full">
        <LiveTableGrid />
      </div>

      {/* Row 3: Timeline Trend chart */}
      <BentoGrid className="w-full mx-auto md:auto-rows-auto">
        <BentoGridItem
          title={items[2].title}
          description={items[2].description}
          header={items[2].header}
          className={cn('[&>p:text-lg]', items[2].className)}
          icon={items[2].icon}
        />
      </BentoGrid>
    </div>
  );
}

const getTodayString = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const items = [
  {
    title: "Don't Forget To Rest Your Soul",
    description: <span className="text-sm">Experience the power of time.</span>,
    header: <DigitalClock />,
    className: 'md:col-span-1 h-full min-h-[10rem]',
    icon: <IconClock className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: 'Shift Aktif',
    description: <span className="text-sm">Ringkasan kasir yang sedang bertugas.</span>,
    header: <ActiveShiftSummary />,
    className: 'md:col-span-2 h-full min-h-[10rem]',
    icon: <IconTableColumn className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Today's Income",
    description: <span className="text-sm">Grafik Pendapatan Hari Ini.</span>,
    header: (
      <div className="w-full rounded-xl">
        <ChartOne defaultStartDate={getTodayString()} defaultEndDate={getTodayString()} />
      </div>
    ),
    className: 'md:col-span-3',
    icon: <IconTableColumn className="h-4 w-4 text-neutral-500" />,
  },
];
