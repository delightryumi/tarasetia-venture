'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Split, 
  Users, 
  CheckCircle2, 
  Coins, 
  QrCode, 
  CreditCard,
  Plus,
  Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CartItem, PaymentMethodType } from './types';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'react-toastify';

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  tableNumber: string;
  customerName: string;
  taxRatePercent: number;
  serviceRatePercent?: number;
  payableAmount?: number;
  onConfirmSplitPayment: (splitData: {
    paidItems: CartItem[];
    remainingItems: CartItem[];
    paymentMethod: PaymentMethodType;
    payableAmount: number;
    subtotal: number;
    tax: number;
    service: number;
    splitLabel: string;
    customerName?: string;
    splitMode?: 'by_item' | 'even';
    splitCount?: number;
    splitIndex?: number;
    totalCartPayable?: number;
    remainingBalance?: number;
  }) => void;
}

export default function SplitBillModal({
  isOpen,
  onClose,
  cart,
  tableNumber,
  customerName,
  taxRatePercent,
  serviceRatePercent = 0,
  payableAmount,
  onConfirmSplitPayment
}: SplitBillModalProps) {
  const { formatCurrency, symbol } = useCurrency();
  const [splitMode, setSplitMode] = useState<'by_item' | 'even'>('by_item');
  
  // State for Split by Item: map of productId -> selected qty to pay now
  const [selectedQtyMap, setSelectedQtyMap] = useState<Record<string, number>>({});
  
  // State for Split Evenly
  const [splitCount, setSplitCount] = useState<number>(2);
  const [activeSplitIndex, setActiveSplitIndex] = useState<number>(1);

  // Payment method for the split
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cash');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [splitCustomerName, setSplitCustomerName] = useState<string>(customerName || '');

  // Reset or initialize state when opened
  React.useEffect(() => {
    if (isOpen) {
      const initialMap: Record<string, number> = {};
      cart.forEach((item, idx) => {
        const itemKey = item.cartItemId || `${item.product.id}-${idx}`;
        initialMap[itemKey] = 0;
      });
      setSelectedQtyMap(initialMap);
      setSplitCount(2);
      setActiveSplitIndex(1);
      setCashAmount('');
      setPaymentMethod('cash');
      setSplitCustomerName(customerName || '');
    }
  }, [isOpen, cart, customerName]);

  // ── Calculation for Split by Item ──────────────────────────────────────────
  const { splitSubtotal, splitTax, splitService, splitPayable, paidItemsList, remainingItemsList } = useMemo(() => {
    let sub = 0;
    const paidList: CartItem[] = [];
    const remainList: CartItem[] = [];

    cart.forEach((item, idx) => {
      const itemKey = item.cartItemId || `${item.product.id}-${idx}`;
      const selectedQty = selectedQtyMap[itemKey] || 0;
      const remainQty = item.quantity - selectedQty;

      const itemPrice = Number(item.product.price ?? (item.product as any).sellprice ?? 0);
      const addonsPrice = (item.selectedAddons || []).reduce((acc, a) => acc + (a.price || 0), 0);
      const unitTotal = itemPrice + addonsPrice;

      if (selectedQty > 0) {
        if (!item.isCompliment) {
          sub += unitTotal * selectedQty;
        }
        paidList.push({
          ...item,
          quantity: selectedQty
        });
      }

      if (remainQty > 0) {
        remainList.push({
          ...item,
          quantity: remainQty
        });
      }
    });

    const taxAmt = Math.round((sub * taxRatePercent) / 100);
    const serviceAmt = Math.round((sub * serviceRatePercent) / 100);
    const payable = sub + taxAmt + serviceAmt;

    return {
      splitSubtotal: sub,
      splitTax: taxAmt,
      splitService: serviceAmt,
      splitPayable: payable,
      paidItemsList: paidList,
      remainingItemsList: remainList
    };
  }, [cart, selectedQtyMap, taxRatePercent, serviceRatePercent]);

  // ── Calculation for Split Evenly ───────────────────────────────────────────
  const totalCartPayable = useMemo(() => {
    if (payableAmount !== undefined && payableAmount > 0) return payableAmount;
    const rawSub = cart.reduce((acc, item) => {
      if (item.isCompliment) return acc;
      const p = Number(item.product.price ?? (item.product as any).sellprice ?? 0);
      const addons = (item.selectedAddons || []).reduce((a, b) => a + (b.price || 0), 0);
      return acc + (p + addons) * item.quantity;
    }, 0);
    const rawTax = Math.round((rawSub * taxRatePercent) / 100);
    const rawService = Math.round((rawSub * serviceRatePercent) / 100);
    return rawSub + rawTax + rawService;
  }, [cart, payableAmount, taxRatePercent, serviceRatePercent]);

  const evenSplitAmount = Math.ceil(totalCartPayable / (splitCount || 1));

  // Current amount to pay based on mode
  const currentPayable = splitMode === 'by_item' ? splitPayable : evenSplitAmount;

  const handleQtyChange = (itemKey: string, delta: number, maxQty: number) => {
    setSelectedQtyMap((prev) => {
      const current = prev[itemKey] || 0;
      const next = Math.max(0, Math.min(maxQty, current + delta));
      return { ...prev, [itemKey]: next };
    });
  };

  const handleSelectAllItem = (itemKey: string, maxQty: number) => {
    setSelectedQtyMap((prev) => ({
      ...prev,
      [itemKey]: maxQty
    }));
  };

  const handleProcessSplit = () => {
    if (splitMode === 'by_item') {
      if (paidItemsList.length === 0) {
        toast.error('Pilih minimal 1 menu untuk dibayar pada bagian ini!');
        return;
      }
      if (paymentMethod === 'cash') {
        const cashVal = parseFloat(cashAmount);
        if (isNaN(cashVal) || cashVal < currentPayable) {
          toast.error('Uang tunai kurang dari nominal tagihan bagian ini!');
          return;
        }
      }

      onConfirmSplitPayment({
        paidItems: paidItemsList,
        remainingItems: remainingItemsList,
        paymentMethod,
        payableAmount: currentPayable,
        subtotal: splitSubtotal,
        tax: splitTax,
        service: splitService,
        splitLabel: `Split Item (${paidItemsList.length} menu)`,
        customerName: splitCustomerName.trim() || customerName || 'Guest',
        splitMode: 'by_item',
        totalCartPayable: totalCartPayable
      });
    } else {
      // Split evenly
      if (paymentMethod === 'cash') {
        const cashVal = parseFloat(cashAmount);
        if (isNaN(cashVal) || cashVal < currentPayable) {
          toast.error('Uang tunai kurang dari nominal tagihan bagian ini!');
          return;
        }
      }

      const isLastPortion = activeSplitIndex >= splitCount;
      const remainingBalance = Math.max(0, totalCartPayable - currentPayable);

      // Proportional items for even split
      onConfirmSplitPayment({
        paidItems: cart,
        remainingItems: isLastPortion || remainingBalance <= 50 ? [] : cart,
        paymentMethod,
        payableAmount: currentPayable,
        subtotal: Math.round(currentPayable / (1 + (taxRatePercent + serviceRatePercent) / 100)),
        tax: Math.round((currentPayable * taxRatePercent) / (100 + taxRatePercent + serviceRatePercent)),
        service: 0,
        splitLabel: `Split Rata Bagian ${activeSplitIndex} dari ${splitCount}`,
        customerName: splitCustomerName.trim() || customerName || 'Guest',
        splitMode: 'even',
        splitCount: splitCount,
        splitIndex: activeSplitIndex,
        totalCartPayable: totalCartPayable,
        remainingBalance: remainingBalance
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-950 border border-neutral-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-white/[0.06] bg-neutral-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm">
              <Split className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Pecah Tagihan (Split Bill)
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Meja {tableNumber || 'Take Away'} : Pelanggan {customerName || 'Walk-in'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2 p-4 bg-neutral-100/70 dark:bg-zinc-900/80 border-b border-neutral-200/80 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={() => setSplitMode('by_item')}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              splitMode === 'by_item'
                ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-xs border border-neutral-200/80 dark:border-white/[0.1]'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Split className="w-4 h-4" />
            <span>Pecah per Menu (Split by Item)</span>
          </button>

          <button
            type="button"
            onClick={() => setSplitMode('even')}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              splitMode === 'even'
                ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-xs border border-neutral-200/80 dark:border-white/[0.1]'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Bagi Rata Tagihan (Split Evenly)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {splitMode === 'by_item' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Pilih Menu yang Dibayar pada Bagian Ini
                </span>
                <span className="text-xs text-neutral-400">
                  {paidItemsList.length} menu terpilih
                </span>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {cart.map((item, idx) => {
                  const itemKey = item.cartItemId || `${item.product.id}-${idx}`;
                  const maxQty = item.quantity;
                  const currentSelected = selectedQtyMap[itemKey] || 0;
                  const itemPrice = Number(item.product.price ?? (item.product as any).sellprice ?? 0);

                  return (
                    <div
                      key={itemKey}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        currentSelected > 0
                          ? 'border-emerald-500/40 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06]'
                          : 'border-neutral-200/80 dark:border-white/[0.06] bg-neutral-50/50 dark:bg-zinc-900/40'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-4">
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">
                          {(item.product as any).productstock?.name || item.product.name}
                        </span>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {formatCurrency(itemPrice)} × total {maxQty} porsi
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center border border-neutral-200 dark:border-white/[0.1] rounded-lg bg-white dark:bg-zinc-900 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(itemKey, -1, maxQty)}
                            disabled={currentSelected <= 0}
                            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-neutral-800 dark:text-neutral-200">
                            {currentSelected}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQtyChange(itemKey, 1, maxQty)}
                            disabled={currentSelected >= maxQty}
                            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectAllItem(itemKey, maxQty)}
                          className="text-[10px] font-bold text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 px-2 py-1 rounded border border-neutral-200 dark:border-white/[0.08]"
                        >
                          Semua
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Jumlah Orang / Bagian Tagihan
                </Label>
                <div className="flex items-center gap-2">
                  {[2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSplitCount(num)}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        splitCount === num
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-xs'
                          : 'border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {num} Orang
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-zinc-900 border border-neutral-200/80 dark:border-white/[0.06] space-y-2">
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>Total Tagihan Meja:</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">{formatCurrency(totalCartPayable)}</span>
                </div>
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>Dibagi Ke:</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">{splitCount} Orang</span>
                </div>
                <div className="w-full h-px bg-neutral-200 dark:bg-white/[0.08] my-1" />
                <div className="flex justify-between text-sm font-black text-emerald-600 dark:text-emerald-400">
                  <span>Nominal per Orang:</span>
                  <span>{formatCurrency(evenSplitAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Customer Name for this Split Portion */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-white/[0.06]">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Nama Tamu di Struk Bagian Ini
              </Label>
              <span className="text-[10px] text-neutral-400">Sesuai nama tamu yang bayar</span>
            </div>
            <Input
              type="text"
              value={splitCustomerName}
              onChange={(e) => setSplitCustomerName(e.target.value)}
              placeholder="Contoh: Bu Dewo, Pak Budi, dll."
              className="text-xs rounded-xl h-9"
            />
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-white/[0.06]">
            <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Metode Pembayaran untuk Bagian Ini
            </Label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all gap-1.5 ${
                  paymentMethod === 'cash'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-900 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>Tunai</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all gap-1.5 ${
                  paymentMethod === 'qris'
                    ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300 shadow-xs'
                    : 'border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-900 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>QRIS</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all gap-1.5 ${
                  paymentMethod === 'card'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300 shadow-xs'
                    : 'border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-900 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Kartu (EDC)</span>
              </button>
            </div>

            {paymentMethod === 'cash' && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="splitCash" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    Uang Diterima
                  </Label>
                  <button
                    type="button"
                    onClick={() => setCashAmount(String(currentPayable))}
                    className="text-[10px] font-bold text-emerald-600 hover:underline"
                  >
                    Uang Pas ({formatCurrency(currentPayable)})
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-neutral-400 font-bold">{symbol}</span>
                  <Input
                    id="splitCash"
                    type="number"
                    placeholder="0"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="pl-11 h-10 text-xs font-bold bg-white dark:bg-zinc-900 rounded-xl"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Summary & Action */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-white/[0.06] bg-neutral-50/50 dark:bg-zinc-900/50 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10.5px] uppercase tracking-wider text-neutral-400 font-bold">Tagihan Bagian Ini</span>
            <span className="text-xl font-black text-neutral-900 dark:text-white tracking-tight">
              {formatCurrency(currentPayable)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-11 text-xs font-bold border-neutral-200 dark:border-white/[0.08]"
            >
              Batal
            </Button>

            <Button
              onClick={handleProcessSplit}
              disabled={currentPayable <= 0}
              className="rounded-xl h-11 px-6 bg-gradient-to-b from-neutral-900 to-neutral-950 hover:from-neutral-800 hover:to-neutral-900 text-white dark:from-white dark:to-neutral-100 dark:text-neutral-950 text-xs font-bold shadow-md flex items-center gap-2 active:scale-[0.98] transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Bayar & Selesaikan Bagian Ini</span>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
