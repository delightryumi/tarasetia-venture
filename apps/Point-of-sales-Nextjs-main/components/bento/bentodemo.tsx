/* eslint-disable react/no-unescaped-entities */
'use client';
import { cn } from '@/lib/utils';
import React, { useState, useEffect, useMemo } from 'react';
import { BentoGrid, BentoGridItem } from '../ui/bento-grid';
import { IconClock, IconTableColumn } from '@tabler/icons-react';
import DigitalClock from '../clock/clock';
import ActiveShiftSummary from '../card/shiftsummary';
import ChartOne from '../charts/chartone';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, collection, deleteDoc, updateDoc, setDoc, query, orderBy, limit } from 'firebase/firestore';
import { localDb } from '@/lib/dexie';
import { toast } from 'react-toastify';
import { Coffee, Users, Plus, Trash2, X, ClipboardList, CheckCircle, Printer, CreditCard, Settings, Eye, EyeOff, ArrowRightLeft, Move } from 'lucide-react';
import ReceiptDialog from '../lexupos/ReceiptDialog';
import TableSelectorModal from '../lexupos/TableSelectorModal';

// Live Tables Component
function LiveTableGrid() {
  const [hotelCode, setHotelCode] = useState<string>(() => {
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
        code = localStorage.getItem('active_hotel_code') || localStorage.getItem('hotelCode') || '';
      }
      return code || '';
    }
    return '';
  });
  const [tablesList, setTablesList] = useState<string[]>([]);
  const [heldOrders, setHeldOrders] = useState<any[]>([]);
  const [paidOrders, setPaidOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal detailed states
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isTableSetupOpen, setIsTableSetupOpen] = useState<boolean>(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState<boolean>(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isEditingTableName, setIsEditingTableName] = useState<boolean>(false);
  const [newTableName, setNewTableName] = useState<string>('');
  const [isSavingTableName, setIsSavingTableName] = useState<boolean>(false);

  // Void/2FA states
  const [adminPin, setAdminPin] = useState<string>('');
  const [showAdminPin, setShowAdminPin] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // Drag and Drop Table Move States
  const [draggedTable, setDraggedTable] = useState<{ tableName: string; order: any } | null>(null);
  const [dragOverTable, setDragOverTable] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState<boolean>(false);
  const [targetMoveTable, setTargetMoveTable] = useState<string>('');

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
        code = localStorage.getItem('active_hotel_code') || localStorage.getItem('hotelCode') || '';
      }
      if (code && code !== hotelCode) {
        setHotelCode(code);
      }
    }
  }, [hotelCode]);

  useEffect(() => {
    if (!hotelCode || hotelCode === '0') {
      setTablesList([]);
      setHeldOrders([]);
      setPaidOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHeldOrders([]);
    setPaidOrders([]);
    let unsubPos: any;
    let unsubHeld: any;
    let unsubPaid: any;
    const fetchConfigAndListen = async () => {
      try {
        // 1. Listen to pos settings in real-time
        const posRef = doc(db, 'hotels', hotelCode, 'settings', 'pos');
        unsubPos = onSnapshot(posRef, (posSnap) => {
          let parsedTables: string[] = [];
          if (posSnap.exists()) {
            const data = posSnap.data();
            if (data.tablesDetailed && Array.isArray(data.tablesDetailed) && data.tablesDetailed.length > 0) {
              parsedTables = data.tablesDetailed.map((t: any) => t.name);
            } else if (data.tables) {
              const raw = String(data.tables).trim();
              if (/^\d+$/.test(raw)) {
                const count = parseInt(raw);
                for (let i = 1; i <= count; i++) parsedTables.push(`Meja ${i}`);
              } else {
                parsedTables = Array.from(new Set(raw.split(',').map(t => t.trim()).filter(Boolean)));
              }
            }
          }
          if (parsedTables.length === 0) {
            for (let i = 1; i <= 10; i++) parsedTables.push(`Meja ${i}`);
          }
          setTablesList(parsedTables);
        });

        // 2. Listen in real-time to held orders (unpaid / dine-in / QR self-order)
        const qHeld = collection(db, 'hotels', hotelCode, 'pos_held_orders');
        unsubHeld = onSnapshot(qHeld, (snap) => {
          const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setHeldOrders(orders);
          setIsLoading(false);
        }, (err) => {
          console.error('Firestore live held tables listener error:', err);
          setIsLoading(false);
        });

        // 3. Listen in real-time to completed/paid orders (pay-as-you-go or cashier paid)
        const qPaid = query(collection(db, 'hotels', hotelCode, 'pos_orders'), orderBy('timestamp', 'desc'), limit(100));
        unsubPaid = onSnapshot(qPaid, (snap) => {
          const orders = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            isPaidDirectly: true,
            _collectionName: 'pos_orders'
          }));
          setPaidOrders(orders);
        }, (err) => {
          console.error('Firestore live paid tables listener error:', err);
        });

      } catch (err) {
        console.error('Failed to load tables status:', err);
        setIsLoading(false);
      }
    };

    fetchConfigAndListen();

    return () => {
      if (unsubPos) unsubPos();
      if (unsubHeld) unsubHeld();
      if (unsubPaid) unsubPaid();
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

  // Helper to extract items list from any order format
  const getOrderItems = (order: any) => {
    if (!order) return [];
    const rawList = order.cart || order.items || order.products || [];
    return rawList.map((item: any, idx: number) => {
      const name = item.product?.name || item.name || item.productstock?.name || 'Item';
      const quantity = Number(item.quantity ?? item.qty ?? item.count ?? 1);
      const price = Number(item.product?.price ?? item.price ?? item.product?.sellprice ?? 0);
      const addons = item.selectedAddons || item.addons || [];
      const note = item.note || '';
      const addonsTotal = addons.reduce((sum: number, a: any) => sum + (Number(a.price) || 0), 0);
      const itemTotal = (price + addonsTotal) * quantity;
      return {
        id: item.cartItemId || item.id || item.product?.id || `item-${idx}`,
        name,
        quantity,
        price,
        addons,
        note,
        addonsTotal,
        itemTotal,
        category: item.product?.category || item.category || '',
        subcategory: item.product?.subcategory || item.subcategory || '',
        image: item.product?.image || item.image || ''
      };
    });
  };

  // Helper to compute total bill
  const getOrderTotal = (order: any) => {
    if (!order) return 0;
    return Number(order.payableAmount ?? order.total ?? order.totalAmount ?? order.subtotal ?? 0);
  };

  // Normalize order for restoring to LexuPOS
  const normalizeOrderForRestore = (order: any) => {
    if (!order) return order;
    const items = getOrderItems(order);
    
    const cart = items.map((item: any) => ({
      cartItemId: item.id || Math.random().toString(36).substring(7),
      product: {
        id: item.id || '',
        name: item.name,
        price: item.price,
        category: item.category || '',
        subcategory: item.subcategory || '',
        image: item.image || ''
      },
      quantity: item.quantity,
      selectedAddons: item.addons || [],
      note: item.note || ''
    }));

    return {
      ...order,
      cart,
      items: order.items || items,
      payableAmount: getOrderTotal(order),
      subtotal: order.subtotal || items.reduce((s: number, i: any) => s + (i.itemTotal || 0), 0),
    };
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

  // Active table orders: combines held orders (unpaid) and recent paid orders (pay-as-you-go / lunas)
  const allActiveOrders = useMemo(() => {
    // 1. Valid active held orders
    const activeHeld = heldOrders.filter(o => {
      if (o.status === 'CANCELLED' || o.status === 'VOID') return false;
      return true;
    });

    // 2. Valid active paid orders (not cleared, recent within 18 hours, has tableNumber)
    const activePaid = paidOrders.filter(o => {
      if (o.tableCleared === true) return false;
      if (o.status === 'CANCELLED' || o.status === 'VOID') return false;
      const t = o.tableNumber && String(o.tableNumber).trim();
      if (!t || t === '-' || t === '—') return false;

      let orderTime = 0;
      if (o.timestamp) {
        orderTime = typeof o.timestamp.toDate === 'function' ? o.timestamp.toDate().getTime() : new Date(o.timestamp).getTime();
      } else if (o.createdAt) {
        orderTime = typeof o.createdAt.toDate === 'function' ? o.createdAt.toDate().getTime() : new Date(o.createdAt).getTime();
      }
      if (orderTime && (Date.now() - orderTime > 18 * 60 * 60 * 1000)) {
        return false;
      }
      return true;
    });

    // Track order IDs that are already paid so shadow/ghost held orders don't duplicate
    const seenOrderIds = new Set<string>();
    activePaid.forEach(o => {
      seenOrderIds.add(o.id);
      if (o.transactionId) seenOrderIds.add(o.transactionId);
      if (o.heldOrderId) seenOrderIds.add(o.heldOrderId);
    });

    // Filter out held orders that are already represented in activePaid
    const filteredHeld = activeHeld.filter(o => !seenOrderIds.has(o.id));

    const tableMap = new Map<string, any>();

    // Add paid orders: sort descending (newest first) and take latest order per table
    const sortedPaid = [...activePaid].sort((a, b) => {
      const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp || a.createdAt || 0).getTime();
      const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    sortedPaid.forEach(o => {
      const key = normalizeTable(o.tableNumber);
      if (!key) return;
      if (!tableMap.has(key)) {
        tableMap.set(key, o);
      }
    });

    // Held orders override or add if newer or present
    filteredHeld.forEach(o => {
      const key = normalizeTable(o.tableNumber);
      if (!key) {
        tableMap.set(`held-${o.id}`, o);
        return;
      }
      const existing = tableMap.get(key);
      if (!existing) {
        tableMap.set(key, o);
      } else {
        const heldTime = o.createdAt ? new Date(o.createdAt).getTime() : Date.now();
        const existingTime = existing.timestamp?.toDate ? existing.timestamp.toDate().getTime() : new Date(existing.timestamp || existing.createdAt || 0).getTime();
        if (heldTime >= existingTime) {
          tableMap.set(key, o);
        }
      }
    });

    return Array.from(tableMap.values());
  }, [heldOrders, paidOrders]);

  const handleTableClick = (tableName: string) => {
    const activeOrder = allActiveOrders.find(
      order => normalizeTable(order.tableNumber) === normalizeTable(tableName)
    );

    setSelectedTable(tableName);
    setSelectedOrder(activeOrder || null);
    setIsEditingTableName(false);
    setIsModalOpen(true);
  };

  const handlePayAtCashier = () => {
    if (!selectedOrder) return;
    const readyOrder = normalizeOrderForRestore(selectedOrder);
    localStorage.setItem('restored_held_order', JSON.stringify(readyOrder));
    toast.info(`Memuat meja ${selectedTable} ke kasir untuk proses pembayaran.`);
    window.location.href = '/lexupos';
  };

  const handleCheckout = () => {
    if (!selectedOrder) return;
    const readyOrder = normalizeOrderForRestore(selectedOrder);
    localStorage.setItem('restored_held_order', JSON.stringify(readyOrder));
    toast.info(`Memulihkan meja ${selectedTable} ke kasir.`);
    window.location.href = '/lexupos';
  };

  const handleClearTable = () => {
    if (!selectedOrder) return;
    setAdminPin('');
    setShowAdminPin(false);
    setCancelReason('');
    setPinError('');
    setIsConfirmClearOpen(true);
  };

  const handleConfirmClearTable = async () => {
    if (!selectedOrder) return;

    const isPaid = selectedOrder.isPaidDirectly || selectedOrder._collectionName === 'pos_orders';

    // Validate Password/PIN and Reason ONLY for unpaid tables (void/cancel)
    if (!isPaid) {
      if (!adminPin) {
        setPinError('Password Admin wajib diisi.');
        return;
      }
      if (adminPin.trim() !== 'admin123') {
        setPinError('Password Admin tidak valid.');
        return;
      }
      if (!cancelReason.trim()) {
        setPinError('Alasan pembatalan wajib diisi.');
        return;
      }
    }

    setIsDeleting(true);
    try {
      if (!isPaid) {
        // Save void transaction if unpaid
        const orderId = selectedOrder.id || `void-${Date.now()}`;
        const orderData = {
          transactionId: orderId,
          restoId: selectedOrder.restoId || 'default-resto',
          customerName: selectedOrder.customerName || 'Guest',
          tableNumber: selectedOrder.tableNumber || '',
          cashierName: selectedOrder.cashierName || 'Kasir',
          items: getOrderItems(selectedOrder),
          subtotal: Number(selectedOrder.subtotal) || 0,
          tax: Number(selectedOrder.tax) || 0,
          discount: Number(selectedOrder.discount) || 0,
          total: getOrderTotal(selectedOrder),
          paymentMethod: selectedOrder.paymentMethod || 'cash',
          revenueType: selectedOrder.revenueType || 'alacarte',
          status: 'CANCELLED',
          cancelReason: cancelReason.trim(),
          timestamp: new Date(),
        };
        await setDoc(doc(db, 'hotels', hotelCode, 'pos_orders', orderId), orderData);

        // Delete from Firestore pos_held_orders
        await deleteDoc(doc(db, 'hotels', hotelCode, 'pos_held_orders', selectedOrder.id));
        // Delete from IndexedDB heldOrders
        await localDb.heldOrders.delete(selectedOrder.id);
      } else {
        // For already paid orders: mark table cleared in pos_orders so table becomes free,
        // without deleting the financial/accounting transaction.
        await updateDoc(doc(db, 'hotels', hotelCode, 'pos_orders', selectedOrder.id), {
          tableCleared: true,
          tableClearedAt: new Date().toISOString()
        });

        // Also clean up any lingering held order with same ID if present
        try {
          await deleteDoc(doc(db, 'hotels', hotelCode, 'pos_held_orders', selectedOrder.id));
          await localDb.heldOrders.delete(selectedOrder.id);
        } catch (e) {}
      }

      toast.success(isPaid 
        ? `Meja ${selectedTable} berhasil dikosongkan.`
        : `Meja ${selectedTable} berhasil dibatalkan & dikosongkan.`
      );
      setIsConfirmClearOpen(false);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to clear table:', err);
      toast.error('Gagal mengosongkan meja.');
    } finally {
      setIsDeleting(false);
    }
  };

  const moveOrderToTable = async (sourceOrder: any, fromTable: string, toTable: string) => {
    if (!sourceOrder || !toTable) return;
    const cleanToTable = toTable.trim();
    const cleanFromTable = fromTable.trim();
    if (!cleanToTable || normalizeTable(cleanFromTable) === normalizeTable(cleanToTable)) return;

    setIsTransferring(true);
    try {
      const isPaid = sourceOrder.isPaidDirectly || sourceOrder._collectionName === 'pos_orders';
      const orderId = sourceOrder.id;
      const nowIso = new Date().toISOString();

      // 1. Update in pos_orders (if this order or transaction exists there)
      try {
        const orderRef = doc(db, 'hotels', hotelCode, 'pos_orders', orderId);
        const snap = await getDoc(orderRef);
        if (snap.exists()) {
          await updateDoc(orderRef, {
            tableNumber: cleanToTable,
            tableTransferHistory: [
              ...(snap.data().tableTransferHistory || []),
              { from: cleanFromTable, to: cleanToTable, at: nowIso }
            ],
            updatedAt: nowIso
          });
        }
      } catch (e) {
        console.warn('pos_orders direct update error:', e);
      }

      // Also update any matching transaction in paidOrders matching this orderId or same session
      try {
        const matchingPaid = paidOrders.filter(
          p => (p.id === orderId || p.transactionId === orderId || (p.tableNumber && normalizeTable(p.tableNumber) === normalizeTable(cleanFromTable) && p.customerName === sourceOrder.customerName))
        );
        for (const p of matchingPaid) {
          if (p.id !== orderId) {
            await updateDoc(doc(db, 'hotels', hotelCode, 'pos_orders', p.id), {
              tableNumber: cleanToTable,
              updatedAt: nowIso
            });
          }
        }
      } catch (e) {}

      // 2. Update or clean up in pos_held_orders
      try {
        const heldRef = doc(db, 'hotels', hotelCode, 'pos_held_orders', orderId);
        const heldSnap = await getDoc(heldRef);
        if (heldSnap.exists()) {
          if (isPaid) {
            // If already paid, held order shouldn't exist, delete it to prevent double order
            await deleteDoc(heldRef);
            await localDb.heldOrders.delete(orderId);
          } else {
            await updateDoc(heldRef, {
              tableNumber: cleanToTable,
              tableTransferHistory: [
                ...(heldSnap.data().tableTransferHistory || []),
                { from: cleanFromTable, to: cleanToTable, at: nowIso }
              ],
              updatedAt: nowIso
            });
            await localDb.heldOrders.update(orderId, { tableNumber: cleanToTable });
          }
        }
      } catch (e) {
        console.warn('pos_held_orders update error:', e);
      }

      // Also clean up any other document in heldOrders matching fromTable for this order/guest
      try {
        const matchingHeld = heldOrders.filter(
          h => h.id === orderId || (h.tableNumber && normalizeTable(h.tableNumber) === normalizeTable(cleanFromTable) && (h.customerName === sourceOrder.customerName || h.id === sourceOrder.id))
        );
        for (const h of matchingHeld) {
          if (h.id !== orderId) {
            if (isPaid) {
              await deleteDoc(doc(db, 'hotels', hotelCode, 'pos_held_orders', h.id));
              await localDb.heldOrders.delete(h.id);
            } else {
              await updateDoc(doc(db, 'hotels', hotelCode, 'pos_held_orders', h.id), {
                tableNumber: cleanToTable,
                updatedAt: nowIso
              });
              await localDb.heldOrders.update(h.id, { tableNumber: cleanToTable });
            }
          }
        }
      } catch (e) {}

      // 3. Clear any lingering older orders on fromTable so it doesn't resurrect phantom previous orders
      try {
        const lingeringOrders = paidOrders.filter(
          p => p.id !== orderId && p.tableCleared !== true && p.tableNumber && normalizeTable(p.tableNumber) === normalizeTable(cleanFromTable)
        );
        for (const lo of lingeringOrders) {
          await updateDoc(doc(db, 'hotels', hotelCode, 'pos_orders', lo.id), {
            tableCleared: true,
            tableClearedAt: nowIso
          });
        }
      } catch (e) {}

      toast.success(`Pesanan ${sourceOrder.customerName || 'Tamu'} berhasil dipindahkan dari ${cleanFromTable} ke ${cleanToTable}!`);
      setIsMoveModalOpen(false);
      setIsModalOpen(false);
      setSelectedOrder(null);
      setSelectedTable(null);
    } catch (err) {
      console.error('Failed to move table:', err);
      toast.error('Gagal memindahkan meja. Silakan coba lagi.');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleDropOnTable = async (targetTableName: string, targetActiveOrder: any) => {
    if (!draggedTable) return;
    const { tableName: sourceTableName, order: sourceOrder } = draggedTable;
    setDraggedTable(null);
    setDragOverTable(null);

    if (normalizeTable(sourceTableName) === normalizeTable(targetTableName)) {
      return;
    }

    if (targetActiveOrder) {
      toast.warning(`Meja "${targetTableName}" sudah terisi tamu! Pindahkan ke meja yang masih kosong.`);
      return;
    }

    await moveOrderToTable(sourceOrder, sourceTableName, targetTableName);
  };

  const availableEmptyTables = tablesList.filter(tableName => 
    !allActiveOrders.some(order => normalizeTable(order.tableNumber) === normalizeTable(tableName))
  );

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
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md">
              <Move size={10} /> Geser kartu meja untuk pindah meja
            </span>
          </h3>
        </div>
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500" />
              <span className="text-neutral-600 dark:text-neutral-400">Terisi ({allActiveOrders.length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500" />
              <span className="text-neutral-600 dark:text-neutral-400">Kosong ({Math.max(0, tablesList.length - allActiveOrders.filter(o => tablesList.some(t => normalizeTable(t) === normalizeTable(o.tableNumber))).length)})</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsTableSetupOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Setup Meja</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center items-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 animate-pulse">
          Memuat status meja...
        </div>
      ) : tablesList.length === 0 ? (
        <div className="py-12 border border-dashed border-neutral-200 dark:border-zinc-800 rounded-xl flex flex-col justify-center items-center text-xs font-medium text-neutral-500 dark:text-neutral-400 gap-2">
          <span>Belum ada meja yang didaftarkan.</span>
          <button
            type="button"
            onClick={() => setIsTableSetupOpen(true)}
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
          >
            Atur & Tambah Meja Sekarang &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {(() => {
            const registeredMatches = tablesList.map((tableName) => {
              const activeOrder = allActiveOrders.find(
                order => normalizeTable(order.tableNumber) === normalizeTable(tableName)
              );
              return {
                tableName,
                activeOrder,
                isOccupied: !!activeOrder,
                isExtra: false,
              };
            });

            const extraTables = allActiveOrders
              .filter(order => {
                const orderNorm = normalizeTable(order.tableNumber);
                if (!orderNorm) return true;
                return !tablesList.some(t => normalizeTable(t) === orderNorm);
              })
              .map(order => ({
                tableName: (order.tableNumber && String(order.tableNumber).trim() !== '' && order.tableNumber !== '-' && order.tableNumber !== '—')
                  ? order.tableNumber
                  : (order.orderNumber ? `Pesanan #${order.orderNumber}` : (order.customerName ? `Tamu: ${order.customerName}` : 'Antrian Baru')),
                activeOrder: order,
                isOccupied: true,
                isExtra: true,
              }));

            const allTables = [...registeredMatches, ...extraTables];

            return allTables.map(({ tableName, activeOrder, isOccupied, isExtra }, idx) => {
              const isBeingDragged = draggedTable?.tableName === tableName;
              const isTargeted = dragOverTable === tableName;

              return (
                <button
                  key={isOccupied && activeOrder?.id ? `${tableName}-${activeOrder.id}-${idx}` : `table-${tableName}-${idx}`}
                  onClick={() => handleTableClick(tableName)}
                  draggable={isOccupied && !isTransferring}
                  onDragStart={(e) => {
                    if (!isOccupied || !activeOrder) return;
                    e.dataTransfer.setData('text/plain', tableName);
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggedTable({ tableName, order: activeOrder });
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggedTable && draggedTable.tableName !== tableName) {
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverTable !== tableName) {
                        setDragOverTable(tableName);
                      }
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverTable === tableName) {
                      setDragOverTable(null);
                    }
                  }}
                  onDragEnd={() => {
                    setDraggedTable(null);
                    setDragOverTable(null);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    if (draggedTable) {
                      await handleDropOnTable(tableName, activeOrder);
                    }
                  }}
                  title={isOccupied ? "Tahan & geser untuk memindahkan meja ini" : undefined}
                  className={cn(
                    "p-4 rounded-xl border flex flex-col justify-between items-start text-left transition-all relative overflow-hidden select-none cursor-pointer h-[115px] focus:outline-none",
                    isOccupied
                      ? (activeOrder?.isSplitActive 
                          ? "bg-purple-50/90 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 hover:border-purple-500 hover:shadow-md"
                          : "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 hover:shadow-md")
                      : "bg-white dark:bg-[#18181b] border-slate-200 dark:border-zinc-800 hover:border-slate-300 hover:shadow-sm",
                    isBeingDragged && "opacity-35 scale-95 border-dashed border-neutral-400 dark:border-neutral-600 shadow-inner",
                    isTargeted && !isOccupied && "ring-2 ring-emerald-500 scale-[1.03] bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 shadow-xl z-20",
                    isTargeted && isOccupied && "ring-2 ring-rose-500 scale-[1.02] bg-rose-50 dark:bg-rose-950/40 border-rose-400 shadow-md"
                  )}
                >
                  {/* Drop overlay target indicator */}
                  {isTargeted && !isOccupied && (
                    <div className="absolute inset-0 bg-emerald-600/90 flex flex-col items-center justify-center text-white p-2 text-center z-30 backdrop-blur-xs rounded-xl pointer-events-none">
                      <ArrowRightLeft className="w-5 h-5 mb-1 animate-bounce" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Lepas di Sini</span>
                      <span className="text-[9px] opacity-90">Pindah ke {tableName}</span>
                    </div>
                  )}
                  {isTargeted && isOccupied && (
                    <div className="absolute inset-0 bg-rose-600/90 flex flex-col items-center justify-center text-white p-2 text-center z-30 backdrop-blur-xs rounded-xl pointer-events-none">
                      <X className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Meja Terisi</span>
                      <span className="text-[9px] opacity-90">Pilih meja kosong</span>
                    </div>
                  )}

                  <div className="w-full flex justify-between items-start gap-1">
                    <span className={cn(
                      "text-xs font-black tracking-tight truncate pr-2 flex items-center gap-1",
                      isOccupied 
                        ? (activeOrder?.isSplitActive ? "text-purple-950 dark:text-purple-100" : "text-emerald-950 dark:text-emerald-100")
                        : "text-neutral-700 dark:text-neutral-300 font-bold"
                    )}>
                      {isOccupied && <Move size={10} className="text-neutral-400 dark:text-neutral-500 shrink-0 opacity-70" />}
                      {tableName}
                    </span>
                    {isOccupied ? (
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0 mt-1",
                        activeOrder?.isSplitActive ? "bg-purple-600 animate-pulse" : "bg-emerald-600 animate-pulse"
                      )} />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1" />
                    )}
                  </div>

                  {isOccupied ? (
                    <div className="w-full flex flex-col gap-0.5 mt-2">
                      <span className={cn(
                        "text-[10px] font-bold truncate flex items-center gap-1",
                        activeOrder?.isSplitActive 
                          ? "text-purple-900 dark:text-purple-200" 
                          : "text-neutral-800 dark:text-neutral-200"
                      )}>
                        <Users size={10} className="shrink-0" />
                        {activeOrder.customerName || 'Guest'}
                      </span>
                      <div className="flex items-center justify-between w-full mt-1">
                        <span className={cn(
                          "text-[11px] font-black",
                          activeOrder?.isSplitActive ? "text-purple-700 dark:text-purple-400" : "text-emerald-700 dark:text-emerald-400"
                        )}>
                          {formatCurrency(getOrderTotal(activeOrder))}
                        </span>
                        <div className="flex items-center gap-1">
                          {activeOrder.isSplitActive ? (
                            <span className="text-[8px] bg-purple-600 text-white font-extrabold px-1.5 py-0.5 rounded-[6px] tracking-wide leading-none animate-pulse shadow-[0_0_8px_rgba(147,51,234,0.8)] border border-purple-400">
                              SPLIT SISA
                            </span>
                          ) : activeOrder.payableAmount === 0 || activeOrder.paymentMethod === 'compliment' || activeOrder.discountPercent === 100 ? (
                            <span className="text-[8px] bg-purple-600 text-white font-extrabold px-1.5 py-0.5 rounded-[6px] tracking-wide leading-none">
                              COMPLIMENT
                            </span>
                          ) : (activeOrder.discount > 0 || activeOrder.discountPercent > 0) ? (
                            <span className="text-[8px] bg-red-600 text-white font-extrabold px-1.5 py-0.5 rounded-[6px] tracking-wide leading-none">
                              DISKON
                            </span>
                          ) : null}
                          {!activeOrder.isSplitActive && (
                            activeOrder.isPaidDirectly ? (
                              <span className="text-[8px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.5 rounded-[6px] tracking-wide leading-none">
                                PAID
                              </span>
                            ) : (
                              <span className="text-[8px] bg-amber-500 text-white font-extrabold px-1.5 py-0.5 rounded-[6px] tracking-wide leading-none animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)] border border-amber-400">
                                UNPAID
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex justify-between items-center text-[11px] font-bold text-neutral-400 dark:text-zinc-500 mt-auto">
                      <span>Kosong</span>
                    </div>
                  )}
                </button>
              );
            });
          })()}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="bg-white dark:bg-[#161618] border border-slate-200 dark:border-white/[0.08] w-full max-w-md rounded-xl shadow-2xl p-6 z-10 flex flex-col relative overflow-hidden font-sans max-h-[90vh]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-500 dark:text-neutral-400 border-none cursor-pointer z-10"
            >
              <X size={16} />
            </button>

            {/* Header section (fixed, won't scroll) */}
            <div className="flex flex-col gap-1.5 mb-3 border-b border-neutral-100 dark:border-zinc-800 pb-2.5 pr-8 shrink-0">
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

            {/* Scrollable body section */}
            <div className="flex-1 overflow-y-auto pr-1 thin-scrollbar flex flex-col min-h-0">
              {selectedOrder ? (
                <div className="flex-grow flex flex-col min-h-0">
                  {/* Guest Info */}
                  <div className="flex flex-col gap-2 bg-neutral-50 dark:bg-white/[0.02] border border-neutral-150 dark:border-white/[0.05] rounded-[10px] p-3 mb-3 shrink-0">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-500 dark:text-[#a1a1aa] font-medium">Nama Tamu</span>
                      <span className="text-neutral-800 dark:text-[#f4f4f5] font-black">{selectedOrder.customerName || 'Guest'}</span>
                    </div>
                    {(() => {
                      const cleanNote = selectedOrder.cleanCustomerNotes || 
                        (selectedOrder.notes 
                          ? selectedOrder.notes
                              .replace(/\|?\s*Sisa tagihan\s*\([^)]*\)\s*\|?/gi, '')
                              .replace(/\|?\s*\[Split[^\]]*\]\s*\|?/gi, '')
                              .replace(/^\|\s*|\s*\|\s*$/g, '')
                              .trim() 
                          : '');
                      if (!cleanNote) return null;
                      return (
                        <div className="flex flex-col gap-0.5 text-xs pt-1 border-t border-neutral-200/50 dark:border-zinc-800/50">
                          <span className="text-neutral-500 dark:text-[#a1a1aa] font-medium">Catatan Meja</span>
                          <span className="text-neutral-700 dark:text-neutral-300 italic">{cleanNote}</span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Split Bill Active Status Banner */}
                  {(selectedOrder.isSplitActive || (Number(selectedOrder.totalPaid || 0) > 0)) && (
                    <div className="flex items-center justify-between bg-neutral-100 dark:bg-zinc-800/60 border border-neutral-200 dark:border-zinc-700/80 rounded-[10px] p-2.5 mb-3 text-xs shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-neutral-900 dark:bg-neutral-100 animate-pulse shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-bold text-neutral-900 dark:text-white text-[11px]">Sesi Split Bill Aktif</span>
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                            {selectedOrder.splitPaidBreakdown || `Sudah terbayar: ${formatCurrency(selectedOrder.totalPaid || 0)}`}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-stone-900 text-white dark:bg-white dark:text-stone-900 uppercase">
                        Sisa Kurangan
                      </span>
                    </div>
                  )}

                  {/* Items List (Internal scroll if item list is massive) */}
                  <span className="text-[10px] text-neutral-400 dark:text-zinc-500 font-bold uppercase tracking-wider mb-2 shrink-0">Item Pesanan</span>
                  <div className="max-h-[220px] overflow-y-auto border border-neutral-100 dark:border-zinc-800/80 rounded-[10px] p-3 flex flex-col gap-2.5 mb-4 bg-transparent thin-scrollbar shrink-0">
                    {(() => {
                      const items = getOrderItems(selectedOrder);
                      if (items.length === 0) {
                        return (
                          <span className="text-xs text-neutral-400 dark:text-zinc-500 italic py-2 text-center">
                            Tidak ada item pesanan terdaftar
                          </span>
                        );
                      }
                      return items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-start text-xs border-b border-neutral-50 dark:border-zinc-800/50 pb-2 last:border-none last:pb-0">
                          <div className="flex flex-col min-w-0 pr-3">
                            <span className="text-neutral-800 dark:text-[#f4f4f5] font-bold truncate">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-neutral-500 dark:text-[#a1a1aa]">
                              {item.quantity} x {formatCurrency(item.price)}
                            </span>
                            {item.addons && item.addons.length > 0 && (
                              <div className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                                +{item.addons.map((a: any) => `${a.name || a} (${formatCurrency(Number(a.price) || 0)})`).join(', ')}
                              </div>
                            )}
                            {item.note && (
                              <div className="text-[9px] text-amber-600 dark:text-amber-400 italic mt-0.5">
                                Catatan: {item.note}
                              </div>
                            )}
                          </div>
                          <span className="text-neutral-800 dark:text-[#f4f4f5] font-bold shrink-0">
                            {formatCurrency(item.itemTotal)}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-neutral-100 dark:border-zinc-800 pt-3 flex flex-col gap-1.5 mb-4 shrink-0">
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
                    {(selectedOrder.discount > 0 || selectedOrder.discountPercent > 0) && (
                      <div className="flex justify-between items-center text-xs text-red-500">
                        <span>Diskon {selectedOrder.discountPercent > 0 ? `(${selectedOrder.discountPercent}%)` : ''}</span>
                        <span>-{formatCurrency(selectedOrder.discount ?? 0)}</span>
                      </div>
                    )}

                    {/* Split payments breakdown if split active */}
                    {(selectedOrder.isSplitActive || Number(selectedOrder.totalPaid || 0) > 0) ? (
                      <>
                        <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold pt-1 border-t border-dashed border-neutral-200 dark:border-zinc-800">
                          <span>Telah Dibayar (Split)</span>
                          <span>-{formatCurrency(Number(selectedOrder.totalPaid || 0))}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-2 border-t-2 border-neutral-900 dark:border-neutral-100 mt-1 bg-neutral-50 dark:bg-zinc-800/40 p-2.5 rounded-lg">
                          <div className="flex flex-col">
                            <span className="text-neutral-900 dark:text-neutral-100 font-black text-xs uppercase tracking-wide">Sisa Kurangan Meja</span>
                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Harus dilunasi kasir</span>
                          </div>
                          <span className="text-red-600 dark:text-red-400 font-black text-base">
                            {formatCurrency(getOrderTotal(selectedOrder))}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between items-center text-sm pt-2 border-t border-neutral-100 dark:border-zinc-800/80 mt-1">
                        <span className="text-neutral-800 dark:text-neutral-200 font-black">Total Tagihan</span>
                        <span className="text-stone-900 dark:text-white font-black text-base">
                          {formatCurrency(getOrderTotal(selectedOrder))}
                        </span>
                      </div>
                    )}

                    {/* Status Banner */}
                    <div className={cn(
                      "mt-2 p-2 rounded-[10px] text-center text-[10px] font-black uppercase tracking-wider leading-none shrink-0",
                      selectedOrder.isPaidDirectly 
                        ? "bg-emerald-500/10 text-emerald-650 dark:bg-emerald-500/20 dark:text-emerald-400"
                        : (selectedOrder.isSplitActive || Number(selectedOrder.totalPaid || 0) > 0)
                        ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900"
                        : "bg-amber-500/10 text-amber-650 dark:bg-amber-500/20 dark:text-amber-400"
                    )}>
                      {selectedOrder.isPaidDirectly 
                        ? "Pembayaran: PAID (Lunas)" 
                        : (selectedOrder.isSplitActive || Number(selectedOrder.totalPaid || 0) > 0)
                        ? `Split Bill: Kurangan ${formatCurrency(getOrderTotal(selectedOrder))}`
                        : "Pembayaran: UNPAID (Belum Bayar)"}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    {!selectedOrder.isPaidDirectly ? (
                      <>
                        <button
                          onClick={handlePayAtCashier}
                          className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 text-white font-black text-xs cursor-pointer border-none flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
                        >
                          <CreditCard size={15} />
                          {(selectedOrder.isSplitActive || Number(selectedOrder.totalPaid || 0) > 0)
                            ? `Lanjutkan Bayar Sisa Split (${formatCurrency(getOrderTotal(selectedOrder))})`
                            : "Bayar di Kasir (Proses Pembayaran)"}
                        </button>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={handleCheckout}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs cursor-pointer border border-neutral-200 dark:border-white/[0.08] flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                          >
                            <Plus size={14} />
                            Ubah & Tambah Menu
                          </button>
                          <button
                            onClick={handleClearTable}
                            className="py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 font-bold text-xs cursor-pointer border border-red-200/60 dark:border-red-900/40 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                          >
                            <Trash2 size={14} />
                            Batalkan / Void
                          </button>
                        </div>
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

                  <button
                    onClick={() => {
                      setTargetMoveTable('');
                      setIsMoveModalOpen(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs cursor-pointer border border-neutral-200 dark:border-white/[0.08] flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98] mt-2 shrink-0"
                  >
                    <ArrowRightLeft size={14} className="text-emerald-600 dark:text-emerald-400" />
                    Pindah Meja (Transfer Meja)
                  </button>

                  <button
                    onClick={() => setIsPrintDialogOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs cursor-pointer border border-neutral-200 dark:border-white/[0.08] flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98] mt-2 shrink-0 mb-2"
                  >
                    <Printer size={14} />
                    Cetak Struk / KOT (Kitchen/Bar)
                  </button>
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
        </div>
      )}

      {isPrintDialogOpen && selectedOrder && (
        <ReceiptDialog
          isOpen={isPrintDialogOpen}
          onOpenChange={setIsPrintDialogOpen}
          customerName={selectedOrder.customerName || 'Guest'}
          tableNumber={selectedOrder.tableNumber || selectedTable || ''}
          notes={selectedOrder.notes || ''}
          paymentMethod={selectedOrder.isPaidDirectly ? (selectedOrder.paymentMethod || 'cash') : 'unpaid'}
          cart={normalizeOrderForRestore(selectedOrder).cart}
          subtotal={selectedOrder.subtotal || 0}
          tax={selectedOrder.tax || 0}
          discount={selectedOrder.discount || 0}
          payableAmount={getOrderTotal(selectedOrder)}
          cashAmount={selectedOrder.isPaidDirectly ? (selectedOrder.cashAmount || '0') : '0'}
          cashierName={selectedOrder.cashierName || 'Kasir'}
          status={selectedOrder.isPaidDirectly ? 'PAID' : 'UNPAID'}
          onClose={() => setIsPrintDialogOpen(false)}
          transactionId={selectedOrder.id || ''}
        />
      )}

      {/* Modal Pindah Meja (Transfer Order) */}
      {isMoveModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMoveModalOpen(false)} />
          <div className="bg-white dark:bg-[#161618] border border-slate-200 dark:border-white/[0.08] w-full max-w-sm rounded-xl shadow-2xl p-6 z-10 flex flex-col relative overflow-hidden font-sans">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black text-neutral-800 dark:text-[#f4f4f5] flex items-center gap-2 m-0">
                <ArrowRightLeft size={16} className="text-emerald-600 dark:text-emerald-400" />
                Pindah Meja (Transfer)
              </h4>
              <button
                onClick={() => setIsMoveModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 rounded-lg border-none bg-transparent cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-neutral-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-neutral-150 dark:border-white/[0.06] mb-4 text-xs flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-neutral-500">Meja Asal:</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{selectedTable}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Nama Tamu:</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{selectedOrder.customerName || 'Guest'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Status Pembayaran:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedOrder.isPaidDirectly ? 'PAID (Lunas)' : 'UNPAID (Belum Bayar)'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Pilih Meja Tujuan yang Kosong:
              </label>
              {availableEmptyTables.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 thin-scrollbar">
                  {availableEmptyTables.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTargetMoveTable(t)}
                      className={cn(
                        "py-2 px-2.5 rounded-lg text-xs font-bold text-center border transition-all cursor-pointer",
                        targetMoveTable === t
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white dark:bg-zinc-900 border-neutral-200 dark:border-zinc-800 text-neutral-800 dark:text-neutral-200 hover:border-emerald-400"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-neutral-500 italic py-2 text-center border border-dashed rounded-lg">
                  Tidak ada meja kosong yang terdaftar. Ketik nama meja tujuan di bawah:
                </div>
              )}

              <div className="mt-2 flex flex-col gap-1">
                <span className="text-[10px] text-neutral-500">Atau ketik nama meja tujuan lain:</span>
                <input
                  type="text"
                  value={targetMoveTable}
                  onChange={(e) => setTargetMoveTable(e.target.value)}
                  placeholder="Contoh: Meja 5"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-zinc-800 bg-transparent dark:text-white focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsMoveModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white dark:bg-zinc-800 hover:bg-neutral-100 dark:hover:bg-zinc-700 text-neutral-800 dark:text-neutral-200 border border-slate-200 dark:border-white/[0.08] font-bold text-xs cursor-pointer transition-all active:scale-[0.98]"
              >
                Batal
              </button>
              <button
                disabled={isTransferring || !targetMoveTable.trim()}
                onClick={() => moveOrderToTable(selectedOrder, selectedTable || '', targetMoveTable)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer border-none transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isTransferring ? 'Memindahkan...' : 'Pindahkan Meja'}
              </button>
            </div>
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
            
            {selectedOrder && !selectedOrder.isPaidDirectly ? (
              <div className="flex flex-col gap-3 mb-4">
                <p className="text-xs text-neutral-600 dark:text-[#a1a1aa] leading-relaxed m-0">
                  Meja <strong className="text-neutral-800 dark:text-[#f4f4f5]">{selectedTable}</strong> belum lunas. Memerlukan PIN Otorisasi Admin & alasan untuk membatalkan pesanan.
                </p>
                <div className="flex flex-col gap-1 text-left mt-2">
                  <label className="text-[10px] font-black uppercase text-neutral-500 dark:text-zinc-400">Password / PIN Admin (2FA)</label>
                  <div className="relative flex items-center">
                    <input
                      type={showAdminPin ? 'text' : 'password'}
                      value={adminPin}
                      onChange={(e) => {
                        setAdminPin(e.target.value);
                        setPinError('');
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent dark:text-white focus:outline-none focus:border-red-500 font-sans pr-10"
                      placeholder=""
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPin(!showAdminPin)}
                      className="absolute right-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer bg-transparent border-none p-0 flex items-center justify-center focus:outline-none"
                      tabIndex={-1}
                    >
                      {showAdminPin ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-black uppercase text-neutral-500 dark:text-zinc-400">Alasan Void</label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => {
                      setCancelReason(e.target.value);
                      setPinError('');
                    }}
                    rows={2}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent dark:text-white focus:outline-none focus:border-red-500 font-sans resize-none"
                    placeholder=""
                  />
                </div>
                {pinError && (
                  <span className="text-[10px] font-black text-red-500 text-left">{pinError}</span>
                )}
              </div>
            ) : (
              <p className="text-xs text-neutral-600 dark:text-[#a1a1aa] leading-relaxed mb-6">
                Apakah Anda yakin ingin mengosongkan meja <strong className="text-neutral-800 dark:text-[#f4f4f5]">{selectedTable}</strong>? Tamu sudah selesai bertransaksi dan meja siap dibersihkan untuk tamu berikutnya.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setIsConfirmClearOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white dark:bg-zinc-800 hover:bg-neutral-100 dark:hover:bg-zinc-700 text-neutral-850 dark:text-neutral-200 border border-slate-200 dark:border-white/[0.08] font-black text-xs cursor-pointer transition-all active:scale-[0.98]"
              >
                Batal
              </button>
              <button
                disabled={isDeleting || (!selectedOrder?.isPaidDirectly && (!adminPin || !cancelReason.trim()))}
                onClick={handleConfirmClearTable}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs cursor-pointer border-none transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Mengosongkan...' : (selectedOrder?.isPaidDirectly ? 'Ya, Kosongkan Meja' : 'Ya, Batalkan & Kosongkan')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isTableSetupOpen && (
        <TableSelectorModal
          isOpen={isTableSetupOpen}
          initialSetupMode={true}
          onClose={() => setIsTableSetupOpen(false)}
          selectedTable={selectedTable || ''}
          onSelectTable={(tableName) => {
            setIsTableSetupOpen(false);
            handleTableClick(tableName);
          }}
        />
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
    className: 'col-span-1 h-full min-h-[10rem]',
    icon: <IconClock className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: 'Shift Aktif',
    description: <span className="text-sm">Ringkasan kasir yang sedang bertugas.</span>,
    header: <ActiveShiftSummary />,
    className: 'col-span-2 h-full min-h-[10rem]',
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
    className: 'col-span-3',
    icon: <IconTableColumn className="h-4 w-4 text-neutral-500" />,
  },
];
