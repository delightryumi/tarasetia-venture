'use client';

import React from 'react';
import { CheckCircle2, Printer, UtensilsCrossed, Wine, CreditCard } from 'lucide-react';
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

type PrintMode = 'all' | 'kitchen' | 'bar';

const PRINT_MODES: { key: PrintMode; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    key: 'all',
    label: 'Kasir',
    icon: <CreditCard size={13} />,
    desc: 'Struk lengkap dengan total'
  },
  {
    key: 'kitchen',
    label: 'Kitchen',
    icon: <UtensilsCrossed size={13} />,
    desc: 'Tiket dapur (non-minuman)'
  },
  {
    key: 'bar',
    label: 'Bar',
    icon: <Wine size={13} />,
    desc: 'Tiket bar (minuman)'
  },
];

interface ReceiptDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  tableNumber: string;
  notes: string;
  paymentMethod: string;
  cart?: CartItem[] | any[];
  items?: ReceiptItemData[];
  subtotal: number;
  tax: number;
  discount: number;
  payableAmount: number;
  cashAmount: string;
  cashierName?: string;
  onClose?: () => void;
  transactionId?: string;
  status?: 'PAID' | 'UNPAID' | 'SUCCESS' | 'CANCELLED' | 'VOID' | string;
  service?: number;
  serviceRate?: number;
  taxRate?: number;
  date?: string;
  cancelReason?: string;
}

export default function ReceiptDialog({
  isOpen,
  onOpenChange,
  customerName,
  tableNumber,
  notes,
  paymentMethod,
  cart = [],
  items,
  subtotal,
  tax,
  discount,
  payableAmount,
  cashAmount,
  cashierName = 'Kasir',
  onClose,
  transactionId = '',
  status = 'PAID',
  service,
  serviceRate,
  taxRate,
  date,
  cancelReason,
}: ReceiptDialogProps) {
  const { formatCurrency } = useCurrency();
  const [storeName, setStoreName] = React.useState('BUMI ANYOM RESORT');
  const [address, setAddress] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [printMode, setPrintMode] = React.useState<PrintMode>('all');

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

  // Map cart items or use pre-mapped items
  const receiptItems: ReceiptItemData[] = React.useMemo(() => {
    if (items && Array.isArray(items) && items.length > 0) {
      return items;
    }
    const safeCart = Array.isArray(cart) ? cart : [];
    return safeCart.map((item: any) => ({
      id: item.product?.id || item.productId || item.id || '',
      name: item.product?.productstock?.name || item.product?.name || item.name || 'Item',
      category: item.product?.productstock?.cat || item.product?.category || item.category || 'Lainnya',
      subcategory: item.product?.productstock?.subcategory || item.product?.subcategory || item.subcategory || '—',
      price: Number(item.product?.sellprice ?? item.product?.price ?? item.price ?? 0),
      quantity: Number(item.quantity ?? item.qty ?? 1),
      isCompliment: item.isCompliment,
      complimentReason: item.complimentReason,
      selectedAddons: item.selectedAddons || item.addons || [],
      note: item.note || '',
    }));
  }, [items, cart]);

  const now = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const isCancelled = status === 'CANCELLED' || status === 'VOID';

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl max-w-sm max-h-[90vh] flex flex-col overflow-hidden p-0 print:absolute print:left-0 print:top-0 print:transform-none print:border-none print:shadow-none print:w-full print:max-w-full print:h-auto print:max-h-none print:overflow-visible print:bg-white print:m-0 print:p-0 print:visible print:block">
        <div className="sr-only">
          <AlertDialogTitle>Struk Pembayaran</AlertDialogTitle>
          <AlertDialogDescription>Rincian struk belanja transaksi kasir.</AlertDialogDescription>
        </div>

        {/* ── Print Mode Selector ── */}
        <div className="flex gap-1.5 px-4 pt-4 pb-0 print:hidden">
          {PRINT_MODES.map(({ key, label, icon, desc }) => (
            <button
              key={key}
              onClick={() => setPrintMode(key)}
              title={desc}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-1.5 rounded-xl border text-center cursor-pointer transition-all ${
                printMode === key
                  ? 'bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white text-white dark:text-neutral-900 shadow-md'
                  : 'bg-neutral-50 dark:bg-zinc-800 border-neutral-200 dark:border-zinc-700 text-neutral-500 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-zinc-500'
              }`}
            >
              <span className="flex items-center gap-1 font-bold text-[11px]">{icon}{label}</span>
              <span className="text-[9px] font-normal leading-tight opacity-70">{desc}</span>
            </button>
          ))}
        </div>

        {/* ── Scrollable receipt body ── */}
        <div className="flex-1 flex flex-col items-center text-center p-4 font-mono text-neutral-700 dark:text-neutral-300 overflow-y-auto thin-scrollbar print:p-0 print:block print:overflow-visible print:w-full print:max-w-full">
          {/* Reusable Thermal Receipt Component */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 p-4 flex justify-center w-full max-w-sm shadow-sm shrink-0 print:p-0 print:bg-white print:border-none print:shadow-none print:w-full print:max-w-full print:mx-0 print:block print:overflow-visible">
            <ThermalReceipt
              shopInfo={{ name: storeName, address, phone }}
              transactionInfo={{ 
                id: transactionId || '—', 
                date: date || now, 
                customerName, 
                cashierName, 
                paymentMethod: status === 'UNPAID' ? 'unpaid' : paymentMethod,
                status: status,
                cancelReason: cancelReason,
                tableName: tableNumber || undefined,
              }}
              items={receiptItems}
              totals={{
                subtotal, 
                discount, 
                taxRate: taxRate !== undefined ? taxRate : (subtotal - discount > 0 ? Math.round((tax / (subtotal - discount)) * 100) : 10), 
                taxAmount: tax, 
                serviceRate: serviceRate,
                serviceAmount: service,
                payableAmount, 
                cashAmount: status === 'UNPAID' ? undefined : (paymentMethod === 'cash' || !isNaN(parseFloat(cashAmount)) ? parseFloat(cashAmount) : undefined), 
                changeAmount: status === 'UNPAID' ? undefined : (paymentMethod === 'cash' ? calculatedChange() : undefined)
              }}
              printMode={printMode}
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
            <span>
              Cetak {printMode === 'kitchen' ? 'Tiket Dapur' : printMode === 'bar' ? 'Tiket Bar' : 'Struk Kasir'}
            </span>
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
