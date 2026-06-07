'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { db } from '@/lib/firebase';
import { localDb } from '@/lib/dexie';
import { collection, onSnapshot, query, where, deleteDoc, doc } from 'firebase/firestore';
import { useCurrency } from '@/hooks/useCurrency';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Trash2, Clock, RotateCcw, User, MapPin } from 'lucide-react';

export default function WaitingListPage() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const [heldOrders, setHeldOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoId, setRestoId] = useState('default-resto');

  useEffect(() => {
    // 1. Get restoId from localStorage
    const userJson = localStorage.getItem('user');
    let currentRestoId = 'default-resto';
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user.restoId) {
          setRestoId(user.restoId);
          currentRestoId = user.restoId;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // 2. Setup Firestore listener for real-time sync
    const q = query(
      collection(db, 'pos_held_orders'),
      where('restoId', '==', currentRestoId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        // Sort by createdAt desc
        orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setHeldOrders(orders);
        setLoading(false);
      },
      async (err) => {
        console.error('Firestore listener failed, falling back to local DB:', err);
        // Fallback to local Dexie database if offline
        try {
          const localOrders = await localDb.heldOrders
            .where('restoId')
            .equals(currentRestoId)
            .toArray();
          localOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setHeldOrders(localOrders);
        } catch (dexieErr) {
          console.error('Dexie read failed:', dexieErr);
        } finally {
          setLoading(false);
        }
      }
    );

    // Clean up listener on unmount
    return () => unsubscribe();
  }, []);

  const handleRestore = async (order: any) => {
    try {
      // 1. Save to localStorage so LexuPos page can retrieve it
      localStorage.setItem('restored_held_order', JSON.stringify(order));

      // 2. Delete from Firebase Firestore
      await deleteDoc(doc(db, 'pos_held_orders', order.id));

      // 3. Delete from local Dexie database
      await localDb.heldOrders.delete(order.id);

      toast.success(`Mengembalikan pesanan untuk ${order.customerName || 'Guest'} ke POS`);
      
      // 4. Redirect back to POS page
      router.push('/lexupos');
    } catch (err) {
      console.error('Failed to restore order:', err);
      toast.error('Gagal mengembalikan pesanan. Silakan coba lagi.');
    }
  };

  const handleDelete = async (orderId: string, customerName: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus pesanan held untuk "${customerName || 'Guest'}" secara permanen?`)) {
      return;
    }

    try {
      // 1. Delete from Firestore
      await deleteDoc(doc(db, 'pos_held_orders', orderId));

      // 2. Delete from local Dexie database
      await localDb.heldOrders.delete(orderId);

      toast.info(`Pesanan held untuk "${customerName}" berhasil dihapus.`);
    } catch (err) {
      console.error('Failed to delete held order:', err);
      toast.error('Gagal menghapus pesanan held.');
    }
  };

  const getElapsedTime = (isoString: string) => {
    try {
      const created = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - created.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} menit lalu`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} jam lalu`;
      return created.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    } catch (e) {
      return '-';
    }
  };

  return (
    <div className="w-full h-full p-4 md:p-6 lg:p-8 flex flex-col gap-6 overflow-y-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl md:text-2xl font-black tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-emerald-500" />
          <span>Daftar Tunggu Pesanan (Waiting List)</span>
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Kelola pesanan/bill yang ditunda sementara. Pulihkan kembali ke POS untuk melanjutkan transaksi.
        </p>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : heldOrders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center border-dashed border-2 border-neutral-200 dark:border-white/[0.05] bg-white/50 dark:bg-zinc-950/20 rounded-2xl">
          <ShoppingCart className="w-16 h-16 stroke-[1.2] text-neutral-300 dark:text-neutral-700 mb-4 animate-bounce" />
          <CardTitle className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Belum Ada Pesanan Ditunda</CardTitle>
          <CardDescription className="text-xs max-w-[280px] mt-1.5">
            Saat transaksi berlangsung di POS, klik tombol &quot;Hold Order&quot; untuk menyimpan pesanan sementara ke halaman ini.
          </CardDescription>
          <Button
            onClick={() => router.push('/lexupos')}
            className="mt-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs"
          >
            Kembali ke POS
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {heldOrders.map((order) => (
            <Card
              key={order.id}
              className="flex flex-col border border-neutral-200 dark:border-white/[0.08] hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.01] rounded-2xl bg-white dark:bg-zinc-950 overflow-hidden group"
            >
              <CardHeader className="pb-3 border-b border-neutral-100 dark:border-white/[0.04] bg-neutral-50/50 dark:bg-zinc-900/10">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black text-neutral-400 tracking-wider font-mono uppercase bg-neutral-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                    {order.id}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{getElapsedTime(order.createdAt)}</span>
                  </div>
                </div>
                
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px] font-bold py-0.5 px-2">
                    Tamu: {order.customerName || 'Guest'}
                  </Badge>
                  {order.tableNumber && (
                    <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 text-[10px] font-bold py-0.5 px-2">
                      <MapPin className="w-2.5 h-2.5 mr-1" />
                      Meja: {order.tableNumber}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-4 flex-grow flex flex-col gap-3.5">
                {/* Items List */}
                <div className="flex flex-col gap-2 flex-grow max-h-[160px] overflow-y-auto thin-scrollbar">
                  {order.cart.map((item: any) => (
                    <div key={item.product.id} className="flex justify-between text-xs text-neutral-600 dark:text-neutral-405">
                      <span className="truncate max-w-[70%] font-semibold">
                        {item.product.name}
                        <span className="ml-1.5 font-normal text-neutral-400 text-[10px]">x{item.quantity}</span>
                      </span>
                      <span className="font-bold">{formatCurrency(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-2.5 text-[10px] text-amber-800 dark:text-amber-250 italic font-medium">
                    <span className="font-bold block uppercase tracking-wider not-italic text-[8px] text-amber-500 mb-0.5">Catatan:</span>
                    {order.notes}
                  </div>
                )}

                <div className="border-t border-dashed border-neutral-100 dark:border-white/[0.05] pt-3 mt-auto">
                  <div className="flex flex-col gap-1 text-[11px] text-neutral-400">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-semibold text-neutral-600 dark:text-neutral-300">{formatCurrency(order.subtotal)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-red-500">
                        <span>Diskon:</span>
                        <span>-{formatCurrency(order.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Service TAX:</span>
                      <span className="font-semibold text-neutral-600 dark:text-neutral-300">{formatCurrency(order.tax)}</span>
                    </div>
                    <div className="flex justify-between items-baseline font-bold text-xs text-neutral-800 dark:text-white mt-1 border-t border-neutral-100 dark:border-white/[0.05] pt-1.5">
                      <span>Payable Amount:</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(order.payableAmount)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pb-4 pt-0 border-t border-neutral-100 dark:border-white/[0.04] bg-neutral-50/20 dark:bg-zinc-900/5 flex gap-2.5">
                <div className="flex items-center gap-1 text-[9px] text-neutral-400 font-bold uppercase tracking-wider flex-grow mt-3">
                  <User className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[90px]">{order.cashierName}</span>
                </div>
                
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(order.id, order.customerName)}
                    className="h-8 rounded-lg border-neutral-200 dark:border-white/[0.1] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 dark:hover:text-red-400 px-2.5 text-neutral-500"
                    title="Hapus Permanen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleRestore(order)}
                    className="h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 px-3 border-none"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Pulihkan</span>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
