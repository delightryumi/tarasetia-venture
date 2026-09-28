'use client';

import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Clock, 
  CheckCircle2, 
  Bell, 
  Utensils, 
  Coffee, 
  RefreshCw, 
  AlertCircle,
  Volume2,
  ChefHat
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc, limit } from 'firebase/firestore';
import { getHotelCollection } from '@/lib/firestoreHelper';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';

interface KitchenItem {
  id: string;
  name: string;
  quantity: number;
  category?: string;
  subcategory?: string;
  note?: string;
  selectedAddons?: { name: string; price: number }[];
}

interface KitchenTicket {
  id: string;
  transactionId: string;
  customerName: string;
  tableNumber: string;
  status: string;
  kitchenStatus: 'queue' | 'cooking' | 'ready' | 'served';
  items: KitchenItem[];
  timestamp: any;
  notes?: string;
}

export default function KitchenDisplaySystem() {
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [filterStation, setFilterStation] = useState<'all' | 'kitchen' | 'bar'>('all');
  const [filterStatus, setFilterStatus] = useState<'active' | 'queue' | 'cooking' | 'ready' | 'served'>('active');
  const [hotelCode, setHotelCode] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const userJson = localStorage.getItem('user');
    let code = '';
    if (userJson) {
      try {
        const u = JSON.parse(userJson);
        code = u.hotelCode || '';
      } catch {}
    }
    if (!code) {
      code = localStorage.getItem('active_hotel_code') || localStorage.getItem('hotelCode') || '';
    }
    setHotelCode(code);
  }, []);

  useEffect(() => {
    if (!hotelCode || hotelCode === '0') {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        getHotelCollection(db, 'pos_orders', hotelCode),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: KitchenTicket[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (data.status === 'CANCELLED' || data.status === 'VOID') return;
          
          list.push({
            id: d.id,
            transactionId: data.transactionId || d.id,
            customerName: data.customerName || 'Walk-in Customer',
            tableNumber: data.tableNumber || data.table || 'Take Away',
            status: data.status || 'PAID',
            kitchenStatus: data.kitchenStatus || 'queue',
            items: data.items || [],
            timestamp: data.timestamp,
            notes: data.notes || ''
          });
        });
        setTickets(list);
        setLoading(false);
      }, (err) => {
        console.error('KDS Firestore error:', err);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('KDS setup error:', err);
      setLoading(false);
    }
  }, [hotelCode]);

  const handleUpdateStatus = async (ticketId: string, nextStatus: 'queue' | 'cooking' | 'ready' | 'served') => {
    if (!hotelCode) return;
    try {
      const ticketRef = doc(getHotelCollection(db, 'pos_orders', hotelCode), ticketId);
      await updateDoc(ticketRef, {
        kitchenStatus: nextStatus,
        kitchenUpdatedAt: new Date().toISOString()
      });
      toast.success(`Status pesanan diperbarui menjadi ${nextStatus.toUpperCase()}`);
    } catch (err) {
      console.error('Failed to update kitchen status:', err);
      toast.error('Gagal memperbarui status dapur.');
    }
  };

  const formatElapsed = (timestamp: any) => {
    if (!timestamp) return 'Baru saja';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const diffMs = Date.now() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Baru saja';
      if (diffMin < 60) return `${diffMin} mnt lalu`;
      const diffHour = Math.floor(diffMin / 60);
      return `${diffHour} jam lalu`;
    } catch {
      return '-';
    }
  };

  // Filter logic
  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === 'active') {
      if (t.kitchenStatus === 'served') return false;
    } else {
      if (t.kitchenStatus !== filterStatus) return false;
    }

    if (filterStation === 'kitchen') {
      const hasFood = t.items.some((i) => {
        const cat = (i.category || '').toLowerCase();
        return cat.includes('makan') || cat.includes('food') || cat.includes('main') || cat.includes('snack') || cat.includes('dapur');
      });
      if (!hasFood) return false;
    } else if (filterStation === 'bar') {
      const hasBar = t.items.some((i) => {
        const cat = (i.category || '').toLowerCase();
        return cat.includes('minum') || cat.includes('beverage') || cat.includes('drink') || cat.includes('bar') || cat.includes('kopi') || cat.includes('coffee');
      });
      if (!hasBar) return false;
    }

    return true;
  });

  return (
    <div className="w-full h-full flex flex-col bg-neutral-100 dark:bg-zinc-950 overflow-hidden font-sans">
      
      {/* Top KDS Command Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                Kitchen Display System (KDS)
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Realtime Antrean Dapur
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Pantau dan perbarui alur pengerjaan masakan langsung dari layar dapur
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Station Selector */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-zinc-800 rounded-xl border border-neutral-200 dark:border-white/[0.08]">
            <button
              onClick={() => setFilterStation('all')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                filterStation === 'all'
                  ? 'bg-white dark:bg-zinc-700 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Semua Pos
            </button>
            <button
              onClick={() => setFilterStation('kitchen')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                filterStation === 'kitchen'
                  ? 'bg-white dark:bg-zinc-700 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" /> Dapur (Kitchen)
            </button>
            <button
              onClick={() => setFilterStation('bar')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                filterStation === 'bar'
                  ? 'bg-white dark:bg-zinc-700 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" /> Bar (Minuman)
            </button>
          </div>

          {/* Status Tab */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-zinc-800 rounded-xl border border-neutral-200 dark:border-white/[0.08]">
            <button
              onClick={() => setFilterStatus('active')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                filterStatus === 'active'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Antrean Aktif ({tickets.filter(t => t.kitchenStatus !== 'served').length})
            </button>
            <button
              onClick={() => setFilterStatus('cooking')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                filterStatus === 'cooking'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Sedang Dimasak
            </button>
            <button
              onClick={() => setFilterStatus('ready')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                filterStatus === 'ready'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Siap Saji
            </button>
          </div>
        </div>
      </div>

      {/* Ticket Cards Grid */}
      <div className="flex-1 overflow-y-auto p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-neutral-400 gap-2">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="text-xs font-semibold">Memuat data pesanan dapur...</span>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-center p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-neutral-300 dark:border-white/[0.1]">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2 opacity-80" />
            <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
              Semua Pesanan Selesai Disajikan
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mt-1">
              Saat ini tidak ada antrean masakan yang menunggu. Pesanan baru dari kasir atau self-order akan otomatis tampil di sini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTickets.map((ticket) => {
              const elapsedStr = formatElapsed(ticket.timestamp);
              const isCooking = ticket.kitchenStatus === 'cooking';
              const isReady = ticket.kitchenStatus === 'ready';

              return (
                <div
                  key={ticket.id}
                  className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-sm transition-all duration-200 ${
                    isReady
                      ? 'border-emerald-500/50 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06]'
                      : isCooking
                      ? 'border-sky-500/50 bg-sky-500/[0.03] dark:bg-sky-500/[0.06]'
                      : 'border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900'
                  }`}
                >
                  {/* Ticket Header */}
                  <div className="p-4 border-b border-neutral-100 dark:border-white/[0.06] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-neutral-900 dark:text-neutral-100">
                          {ticket.tableNumber}
                        </span>
                        <span className="text-[10px] font-bold text-neutral-500 truncate max-w-[120px]">
                          {ticket.customerName}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        #{ticket.transactionId.substring(0, 12)}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="flex items-center gap-1 text-[10.5px] font-bold text-neutral-500 dark:text-neutral-400">
                        <Clock className="w-3.5 h-3.5" />
                        {elapsedStr}
                      </span>
                      {ticket.kitchenStatus === 'queue' && (
                        <span className="text-[9.5px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-500/20">
                          Menunggu
                        </span>
                      )}
                      {ticket.kitchenStatus === 'cooking' && (
                        <span className="text-[9.5px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-full border border-sky-500/20 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-sky-500 animate-bounce" /> Dimasak
                        </span>
                      )}
                      {ticket.kitchenStatus === 'ready' && (
                        <span className="text-[9.5px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Siap Saji
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="p-4 flex-1 space-y-2.5 overflow-y-auto max-h-56">
                    {ticket.items.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-2 text-xs">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="font-black text-sm text-neutral-900 dark:text-white px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-zinc-800 shrink-0">
                            {item.quantity}×
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-neutral-800 dark:text-neutral-200 block truncate">
                              {item.name}
                            </span>
                            {item.note && (
                              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block">
                                Catatan: {item.note}
                              </span>
                            )}
                            {item.selectedAddons && item.selectedAddons.length > 0 && (
                              <span className="text-[10px] text-neutral-400 block truncate">
                                + {item.selectedAddons.map(a => a.name).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {ticket.notes && (
                      <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                        Catatan Order: {ticket.notes}
                      </div>
                    )}
                  </div>

                  {/* Action Stepper Button */}
                  <div className="p-3 border-t border-neutral-100 dark:border-white/[0.06] bg-neutral-50/50 dark:bg-zinc-900/50 flex gap-2">
                    {ticket.kitchenStatus === 'queue' && (
                      <Button
                        onClick={() => handleUpdateStatus(ticket.id, 'cooking')}
                        className="w-full h-9 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Mulai Masak</span>
                      </Button>
                    )}

                    {ticket.kitchenStatus === 'cooking' && (
                      <Button
                        onClick={() => handleUpdateStatus(ticket.id, 'ready')}
                        className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tandai Siap Saji</span>
                      </Button>
                    )}

                    {ticket.kitchenStatus === 'ready' && (
                      <Button
                        onClick={() => handleUpdateStatus(ticket.id, 'served')}
                        className="w-full h-9 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Selesai Diantar</span>
                      </Button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
