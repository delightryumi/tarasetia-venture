'use client';

import React from 'react';
import { CheckCircle2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription
} from '@/components/ui/alert-dialog';
import { CartItem } from './types';
import { toast } from 'react-toastify';
import { useCurrency } from '@/hooks/useCurrency';
import axios from 'axios';
import ThermalReceipt, { ReceiptItemData } from '@/components/shared/ThermalReceipt';

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
  cashierName?: string;
  onClose?: () => void;
  transactionId?: string;
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
  cashierName = 'Kasir',
  onClose,
  transactionId = ''
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

  // Map cart items to ReceiptItemData
  const receiptItems: ReceiptItemData[] = cart.map(item => ({
    id: item.product.id,
    name: item.product.name,
    category: item.product.category || 'Lainnya',
    subcategory: item.product.subcategory || '—',
    price: item.product.price,
    quantity: item.quantity,
    isCompliment: item.isCompliment,
    complimentReason: item.complimentReason,
    selectedAddons: item.selectedAddons,
    note: item.note,
  }));

  const now = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });


  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl max-w-sm max-h-[90vh] flex flex-col overflow-hidden p-0 print:absolute print:left-0 print:top-0 print:transform-none print:border-none print:shadow-none print:w-full print:max-w-full print:h-auto print:max-h-none print:overflow-visible print:bg-white print:m-0 print:p-0">
        <div className="sr-only">
          <AlertDialogTitle>Struk Pembayaran</AlertDialogTitle>
          <AlertDialogDescription>Rincian struk belanja transaksi kasir.</AlertDialogDescription>
        </div>

        {/* ── Scrollable receipt body ── */}
        <div className="flex-1 flex flex-col items-center text-center px-4 pt-5 pb-2 font-mono text-neutral-700 dark:text-neutral-300 overflow-y-auto thin-scrollbar print:p-0 print:block">
          {/* Success Icon */}
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-4 shrink-0 print:hidden" />

          {/* Reusable Thermal Receipt Component */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 p-4 flex justify-center w-full max-w-sm shadow-sm shrink-0 print:p-0 print:bg-white print:border-none print:shadow-none print:w-full print:max-w-full print:mx-0 print:block">
            <ThermalReceipt
              shopInfo={{ name: storeName, address, phone }}
              transactionInfo={{ id: transactionId || '—', date: now, customerName, cashierName, paymentMethod }}
              items={receiptItems}
              totals={{
                subtotal, discount, 
                taxRate: subtotal - discount > 0 ? Math.round((tax / (subtotal - discount)) * 100) : 10, 
                taxAmount: tax, 
                payableAmount, 
                cashAmount: paymentMethod === 'cash' ? parseFloat(cashAmount) : undefined, 
                changeAmount: paymentMethod === 'cash' ? calculatedChange() : undefined
              }}
              className="shadow-sm border border-neutral-200 print:shadow-none print:border-none print:w-full"
            />
          </div>
        </div>

        {/* ── Footer buttons ── */}
        <AlertDialogFooter className="sm:justify-center gap-2 px-4 py-3 border-t border-neutral-100 dark:border-white/[0.06] print:hidden">
          <Button
            variant="outline"
            onClick={() => window.print()}
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
