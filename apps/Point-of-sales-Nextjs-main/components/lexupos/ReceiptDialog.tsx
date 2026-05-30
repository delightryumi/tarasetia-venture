'use client';

import React from 'react';
import { CheckCircle2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter
} from '@/components/ui/alert-dialog';
import { CartItem } from './types';
import { toast } from 'react-toastify';
import { useCurrency } from '@/hooks/useCurrency';
import axios from 'axios';

interface ReceiptDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  tableNumber: string;
  notes: string;
  paymentMethod: string;
  cart: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  payableAmount: number;
  cashAmount: string;
  cashierName: string;
  onClose: () => void;
}

/**
 * Groups cart items into:
 *   { category: { subcategory: CartItem[] } }
 */
function groupCartItems(cart: CartItem[]) {
  const grouped: Record<string, Record<string, CartItem[]>> = {};

  cart.forEach(item => {
    const cat = item.product.category || 'Lainnya';
    const sub = item.product.subcategory?.trim() || '—';

    if (!grouped[cat]) grouped[cat] = {};
    if (!grouped[cat][sub]) grouped[cat][sub] = [];
    grouped[cat][sub].push(item);
  });

  return grouped;
}

export default function ReceiptDialog({
  isOpen,
  onOpenChange,
  customerName,
  tableNumber,
  notes,
  paymentMethod,
  cart,
  subtotal,
  tax,
  discount,
  payableAmount,
  cashAmount,
  cashierName,
  onClose
}: ReceiptDialogProps) {
  const { formatCurrency } = useCurrency();
  const [storeName, setStoreName] = React.useState('BUMI ANYOM RESORT');
  const [address, setAddress] = React.useState('');
  const [phone, setPhone] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) return;

    // Fetch all shop info (name, address, phone) from API — single source of truth
    axios.get('/api/shopdata')
      .then(res => {
        const d = res.data?.data;
        if (d) {
          if (d.name)    setStoreName(d.name.toUpperCase());
          if (d.address) setAddress(d.address);
          if (d.phone)   setPhone(d.phone);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const calculatedChange = () => {
    const cashVal = parseFloat(cashAmount) || 0;
    const diff = cashVal - payableAmount;
    return diff >= 0 ? diff : 0;
  };

  // Group items by Category → Subcategory
  const groupedItems = groupCartItems(cart);
  const sortedCategories = Object.keys(groupedItems).sort();

  // Category subtotals
  const categoryTotals: Record<string, number> = {};
  sortedCategories.forEach(cat => {
    categoryTotals[cat] = Object.values(groupedItems[cat])
      .flat()
      .reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  });

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-2xl max-w-sm max-h-[90vh] flex flex-col overflow-hidden p-0">

        {/* ── Scrollable receipt body ── */}
        <div className="flex-1 flex flex-col items-center text-center px-4 pt-5 pb-2 font-mono text-neutral-700 dark:text-neutral-300 overflow-y-auto thin-scrollbar">

          {/* Header */}
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2.5" />
          <h2 className="text-sm font-bold text-neutral-800 dark:text-white uppercase tracking-widest leading-tight">
            {storeName}
          </h2>
          {address && <p className="text-[10px] text-neutral-500 mt-0.5">{address}</p>}
          {phone   && <p className="text-[10px] text-neutral-500 mb-2">Tlp: {phone}</p>}

          <div className="w-full border-t border-dashed border-neutral-300 dark:border-white/[0.1] my-2" />

          {/* Transaction info */}
          <div className="w-full text-left text-[11px] flex flex-col gap-1 text-neutral-600 dark:text-neutral-400">
            <div className="flex justify-between">
              <span>Pelanggan:</span>
              <span className="font-bold">{customerName || 'Walk-in Customer'}</span>
            </div>
            <div className="flex justify-between">
              <span>Nomor Meja:</span>
              <span className="font-bold">{tableNumber || 'Take Away'}</span>
            </div>
            {notes.trim() && (
              <div className="flex justify-between">
                <span>Catatan:</span>
                <span className="font-bold text-right max-w-[60%] truncate">{notes}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tanggal:</span>
              <span>{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir:</span>
              <span className="font-bold">{cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span>Metode:</span>
              <span className="uppercase font-bold">{paymentMethod}</span>
            </div>
          </div>

          <div className="w-full border-t border-dashed border-neutral-300 dark:border-white/[0.1] my-2" />

          {/* ── Grouped Items: Category → Subcategory → Items ── */}
          <div className="w-full text-left flex flex-col gap-0">
            {sortedCategories.map((cat, catIdx) => (
              <div key={cat} className={catIdx > 0 ? 'mt-3' : ''}>

                {/* Category header */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-800 dark:text-white border-b border-neutral-300 dark:border-white/[0.15] pb-0.5 w-full">
                    {cat}
                  </span>
                </div>

                {/* Subcategory groups */}
                {Object.keys(groupedItems[cat]).sort().map((sub, subIdx) => (
                  <div key={sub} className={subIdx > 0 ? 'mt-2' : ''}>

                    {/* Subcategory label (skip if it's the fallback "—") */}
                    {sub !== '—' && (
                      <p className="text-[9px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider ml-2 mb-0.5">
                        {sub}
                      </p>
                    )}

                    {/* Items */}
                    {groupedItems[cat][sub].map(item => (
                      <div key={item.product.id} className="flex justify-between items-start ml-2 mb-1 text-[11px]">
                        <div className="flex flex-col max-w-[68%]">
                          <span className="font-semibold leading-tight">{item.product.name}</span>
                          <span className="text-[10px] text-neutral-400">
                            {item.quantity} x {formatCurrency(item.product.price)}
                          </span>
                        </div>
                        <span className="font-bold text-neutral-700 dark:text-neutral-200">
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}

                {/* Category subtotal */}
                <div className="flex justify-between text-[10px] text-neutral-500 mt-1 border-t border-dotted border-neutral-200 dark:border-white/[0.08] pt-0.5">
                  <span>Subtotal {cat}</span>
                  <span className="font-semibold">{formatCurrency(categoryTotals[cat])}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full border-t border-dashed border-neutral-300 dark:border-white/[0.1] my-3" />

          {/* Totals */}
          <div className="w-full text-left text-[11px] flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Diskon:</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Service TAX ({subtotal > 0 ? Math.round((tax / subtotal) * 100) : 10}%):</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-neutral-800 dark:text-white pt-1 border-t border-neutral-300 dark:border-white/[0.1] mt-1">
              <span>TOTAL</span>
              <span>{formatCurrency(payableAmount)}</span>
            </div>

            {paymentMethod === 'cash' && (
              <>
                <div className="flex justify-between text-[11px] pt-1">
                  <span>Uang Diterima:</span>
                  <span>{formatCurrency(parseFloat(cashAmount))}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-emerald-500">
                  <span>Kembalian:</span>
                  <span>{formatCurrency(calculatedChange())}</span>
                </div>
              </>
            )}
          </div>

          <div className="w-full border-t border-dashed border-neutral-300 dark:border-white/[0.1] my-3" />
          <p className="text-[10px] italic text-neutral-400 mb-1">Terima kasih atas kunjungan Anda!</p>
        </div>

        {/* ── Footer buttons ── */}
        <AlertDialogFooter className="sm:justify-center gap-2 px-4 py-3 border-t border-neutral-100 dark:border-white/[0.06]">
          <Button
            variant="outline"
            onClick={() => toast.info('Printer tidak terhubung.')}
            className="rounded-xl flex items-center justify-center gap-1.5 border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 text-xs h-9"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak struk</span>
          </Button>
          <AlertDialogAction
            onClick={onClose}
            className="rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-100 flex-1 border-none text-xs font-bold h-9"
          >
            Selesai
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
