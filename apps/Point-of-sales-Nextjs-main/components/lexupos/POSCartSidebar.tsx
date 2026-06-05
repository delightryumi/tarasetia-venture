'use client';

import React from 'react';
import { Trash2, Plus, Minus, Pause, ArrowRight, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CartItem } from './types';
import { useCurrency } from '@/hooks/useCurrency';

interface POSCartSidebarProps {
  customerName: string;
  setCustomerName: (name: string) => void;
  tableNumber: string;
  setTableNumber: (table: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onClearCart: () => void;
  subtotal: number;
  tax: number;
  discount: number;
  discountPercent: number;
  setDiscountPercent: (percent: number) => void;
  payableAmount: number;
  onHoldOrder: () => void;
  onProceed: () => void;
  onBackToCatalog?: () => void;
}

export default function POSCartSidebar({
  customerName,
  setCustomerName,
  tableNumber,
  setTableNumber,
  notes,
  setNotes,
  cart,
  onUpdateQuantity,
  onClearCart,
  subtotal,
  tax,
  discount,
  discountPercent,
  setDiscountPercent,
  payableAmount,
  onHoldOrder,
  onProceed,
  onBackToCatalog
}: POSCartSidebarProps) {
  const { formatCurrency } = useCurrency();
  return (
    <div className="w-full lg:w-[340px] xl:w-[385px] flex flex-col h-full border-l border-neutral-200 dark:border-white/[0.1] bg-white/40 dark:bg-zinc-950/20">
      {onBackToCatalog && (
        <div className="p-3 bg-neutral-100 dark:bg-zinc-900 border-b border-neutral-200 dark:border-white/[0.05] lg:hidden flex items-center shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToCatalog}
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1.5 text-xs font-semibold px-2 py-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Katalog</span>
          </Button>
        </div>
      )}
      
      {/* Customer & Table Inputs Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-white/[0.1] flex flex-col gap-2 shrink-0 bg-white/60 dark:bg-zinc-950/40">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-sans">
              Nama Pelanggan
            </label>
            <Input
              type="text"
              placeholder="E.g. Budi"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="h-8 px-2.5 bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl text-[11px] text-neutral-700 dark:text-neutral-200 focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400"
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-sans">
              Nomor Meja
            </label>
            <Input
              type="text"
              placeholder="E.g. Meja 05"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="h-8 px-2.5 bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl text-[11px] text-neutral-700 dark:text-neutral-200 focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mt-0.5">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-sans">
              Catatan / Notes
            </label>
            <Input
              type="text"
              placeholder="E.g. Less sugar, extra ice..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-8 px-2.5 bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl text-[11px] text-neutral-700 dark:text-neutral-200 focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-sans">
              Diskon (%)
            </label>
            <div className="relative w-full">
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={discountPercent || ''}
                onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                className="h-8 pl-2.5 pr-6 bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl text-[11px] text-neutral-700 dark:text-neutral-200 focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400"
              />
              <span className="absolute right-2.5 top-2.5 text-[10px] text-neutral-500 font-bold">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Item List */}
      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar p-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between mb-0.5 shrink-0">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-sans">
            Daftar Belanja ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          </h3>
          {cart.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-neutral-400 hover:text-red-500 transition-colors text-[10px] flex items-center gap-1 font-semibold"
              title="Bersihkan Keranjang"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          {cart.map((item) => (
            <div 
              key={item.product.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.1] hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-8 h-8 rounded-lg object-cover bg-slate-100 dark:bg-neutral-850 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-200 truncate font-sans">
                    {item.product.name}
                  </h4>
                  <p className="text-[9px] text-neutral-500 font-medium mt-0.5 font-sans">
                    {formatCurrency(item.product.price)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-3">
                <div className="flex items-center gap-1 bg-gray-100/[0.8] dark:bg-black border border-neutral-200 dark:border-white/[0.1] rounded-lg p-0.5">
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, -1)}
                    className="w-5 h-5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center text-neutral-500"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] font-bold px-0.5 text-neutral-600 dark:text-neutral-200 min-w-[12px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, 1)}
                    className="w-5 h-5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center text-neutral-500"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <span className="text-xs font-bold text-neutral-600 dark:text-neutral-200 w-14 text-right shrink-0">
                  {formatCurrency(item.product.price * item.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {cart.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-400">
            <ShoppingBag className="w-10 h-10 stroke-[1.5] mb-2 opacity-30" />
            <p className="text-[11px] font-medium font-sans">Belum ada item ditambahkan.</p>
          </div>
        )}
      </div>

      {/* Pricing Summary Actions */}
      <div className="p-4 bg-white/60 dark:bg-zinc-950/40 border-t border-neutral-200 dark:border-white/[0.1] flex flex-col gap-3 shrink-0">
        <div className="flex flex-col gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-neutral-700 dark:text-neutral-200">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Pajak ({subtotal > 0 ? Math.round((tax / subtotal) * 100) : 10}% Service TAX)</span>
            <span className="font-semibold text-neutral-700 dark:text-neutral-200">{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between">
            <span>Diskon</span>
            <span className="font-semibold text-red-500">-{formatCurrency(discount)}</span>
          </div>
          
          <div className="h-[1px] bg-neutral-200 dark:bg-white/[0.1] my-1" />

          <div className="flex justify-between items-baseline text-xs">
            <span className="font-bold text-neutral-700 dark:text-white font-sans">Payable Amount</span>
            <span className="text-base font-black text-neutral-800 dark:text-white">{formatCurrency(payableAmount)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={onHoldOrder}
            className="w-full h-9 rounded-xl border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 text-neutral-600 dark:text-neutral-400 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            <Pause className="w-3.5 h-3.5 text-neutral-500" />
            <span>Hold Order</span>
          </Button>

          <Button
            onClick={onProceed}
            className="w-full h-9 rounded-xl bg-gradient-to-r from-emerald-550 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 border-none"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Proceed</span>
          </Button>
        </div>
      </div>

    </div>
  );
}
