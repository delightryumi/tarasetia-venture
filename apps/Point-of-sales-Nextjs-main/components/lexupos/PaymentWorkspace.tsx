'use client';

import React from 'react';
import { ArrowLeft, Coins, QrCode, CreditCard, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CartItem, PaymentMethodType } from './types';
import { useCurrency } from '@/hooks/useCurrency';

interface PaymentWorkspaceProps {
  customerName: string;
  tableNumber: string;
  notes: string;
  cart: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  payableAmount: number;
  paymentMethod: PaymentMethodType;
  setPaymentMethod: (method: PaymentMethodType) => void;
  cashAmount: string;
  setCashAmount: (amount: string) => void;
  onBackToPOS: () => void;
  onConfirmPayment: () => void;
  revenueType: 'alacarte' | 'banquet';
  setRevenueType: (type: 'alacarte' | 'banquet') => void;
}

export default function PaymentWorkspace({
  customerName,
  tableNumber,
  notes,
  cart,
  subtotal,
  tax,
  discount,
  payableAmount,
  paymentMethod,
  setPaymentMethod,
  cashAmount,
  setCashAmount,
  onBackToPOS,
  onConfirmPayment,
  revenueType,
  setRevenueType
}: PaymentWorkspaceProps) {
  const { formatCurrency, symbol } = useCurrency();
  const [staticQris, setStaticQris] = React.useState<string | null>(null);
  
  const hasBanquetItem = cart.some(
    (item) => item.product.category?.toUpperCase() === 'BANQUET'
  );

  React.useEffect(() => {
    if (hasBanquetItem && revenueType !== 'banquet') {
      setRevenueType('banquet');
    }
  }, [hasBanquetItem, revenueType, setRevenueType]);

  React.useEffect(() => {
    if (payableAmount === 0 && paymentMethod !== 'compliment') {
      setPaymentMethod('compliment');
    } else if (payableAmount > 0 && paymentMethod === 'compliment') {
      setPaymentMethod('cash');
    }
  }, [payableAmount, paymentMethod, setPaymentMethod]);

  React.useEffect(() => {
    const savedQris = localStorage.getItem('staticQris');
    if (savedQris) {
      setStaticQris(savedQris);
    }
  }, []);

  const calculatedChange = () => {
    const cashVal = parseFloat(cashAmount) || 0;
    const diff = cashVal - payableAmount;
    return diff >= 0 ? diff : 0;
  };

  const isCashInsufficient = () => {
    const cashVal = parseFloat(cashAmount) || 0;
    return cashVal < payableAmount;
  };

  return (
    <div className="flex flex-col lg:flex-row-reverse flex-1 h-full min-w-0 overflow-y-auto lg:overflow-hidden bg-neutral-50/30 dark:bg-zinc-950/30">
      
      {/* Visual Right Side (Review Transaksi) */}
      <div className="w-full lg:w-[420px] xl:w-[460px] flex flex-col min-w-0 p-5 lg:p-8 shrink-0 lg:overflow-y-auto thin-scrollbar border-b lg:border-b-0 lg:border-l border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-950 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToPOS}
          className="self-start text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1.5 text-xs font-semibold px-2 py-1 mb-4 border border-neutral-200 dark:border-white/10 rounded-[6px]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke POS</span>
        </Button>

        <div className="flex flex-col gap-3 mb-5 shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-800 dark:text-neutral-200">
              Review Transaksi
            </h1>
            <p className="text-[11px] text-neutral-500 mt-0.5">Konfirmasi detail pesanan</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-zinc-800/50 border border-neutral-200 dark:border-white/[0.05] rounded-[4px] px-2 py-1">
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Pelanggan:</span>
              <span className="text-[10px] font-semibold text-neutral-700 dark:text-neutral-300">
                {customerName.trim() || 'Walk-in Customer'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-zinc-800/50 border border-neutral-200 dark:border-white/[0.05] rounded-[4px] px-2 py-1">
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Meja:</span>
              <span className="text-[10px] font-semibold text-neutral-700 dark:text-neutral-300">
                {tableNumber.trim() || 'Take Away'}
              </span>
            </div>
          </div>
        </div>

        {notes.trim() && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-[10px] px-4 py-3 text-xs shrink-0 mb-6">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-bold uppercase tracking-widest mb-1">Catatan Pesanan</span>
            <span className="font-semibold text-amber-800 dark:text-amber-200">
              {notes.trim()}
            </span>
          </div>
        )}

        {/* Compact Item Summary on Mobile */}
        <div className="flex lg:hidden items-center justify-between bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.05] rounded-[10px] p-3 shadow-sm mb-4 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Total Item</span>
          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            {cart.reduce((sum, item) => sum + item.quantity, 0)} Pcs ({formatCurrency(subtotal)})
          </span>
        </div>

        <div className="hidden lg:flex flex-1 overflow-y-auto bg-neutral-50 dark:bg-zinc-900/50 border border-neutral-200/80 dark:border-white/[0.05] rounded-[10px] p-5 flex flex-col gap-4 thin-scrollbar shadow-sm">
          {cart.map((item) => (
            <div 
              key={item.product.id}
              className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-white/[0.05] last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-12 h-12 rounded-xl object-cover bg-slate-100 dark:bg-neutral-800 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">
                    {item.product.name}
                  </h4>
                  <p className="text-xs text-neutral-500 font-semibold mt-1">
                    {formatCurrency(item.product.price)} x {item.quantity}
                  </p>
                </div>
              </div>
              
              <span className="text-sm font-black text-neutral-800 dark:text-neutral-200 ml-4 shrink-0">
                {formatCurrency(item.product.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Left Side (Configuration & Checkout) */}
      <div className="flex-1 flex flex-col lg:h-full overflow-y-auto thin-scrollbar">
        
        {/* TOP LOCKED SECTION: Revenue Type & Payment Method */}
        <div className="p-4 pb-4 flex flex-col gap-4 shrink-0 z-10 border-b border-neutral-200 dark:border-white/[0.05]">
          <div className="flex flex-col gap-2">
            <div>
              <h3 className="text-[10px] font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-widest">
                Kategori Pendapatan
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => !hasBanquetItem && setRevenueType('alacarte')}
                disabled={hasBanquetItem}
                className={`py-1.5 px-3 rounded-[6px] border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                  hasBanquetItem
                    ? 'opacity-40 cursor-not-allowed border-neutral-200 dark:border-white/[0.05] bg-neutral-105 text-neutral-400'
                    : 'cursor-pointer ' + (revenueType === 'alacarte'
                      ? 'border-neutral-800 bg-neutral-100 dark:border-white dark:bg-zinc-800 text-neutral-800 dark:text-white shadow-sm'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50 dark:border-white/[0.05] dark:bg-zinc-900/50 dark:hover:bg-zinc-800 text-neutral-500')
                }`}
              >
                <span>A la Carte</span>
              </button>
              <button
                type="button"
                onClick={() => setRevenueType('banquet')}
                className={`py-1.5 px-3 rounded-[6px] border text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  revenueType === 'banquet'
                    ? 'border-neutral-800 bg-neutral-100 dark:border-white dark:bg-zinc-800 text-neutral-800 dark:text-white shadow-sm'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50 dark:border-white/[0.05] dark:bg-zinc-900/50 dark:hover:bg-zinc-800 text-neutral-500'
                }`}
              >
                <span>Banquet</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div>
              <h3 className="text-[10px] font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-widest">
                Metode Pembayaran
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-2.5 rounded-[6px] border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'border-neutral-800 bg-neutral-100 dark:border-white dark:bg-zinc-800 shadow-sm'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50 dark:border-white/[0.1] dark:bg-zinc-900/50 dark:hover:bg-zinc-800'
                }`}
              >
                <Coins className={`w-4 h-4 ${paymentMethod === 'cash' ? 'text-neutral-800 dark:text-white' : 'text-neutral-400'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Tunai</span>
              </button>

              <button
                onClick={() => setPaymentMethod('qris')}
                className={`p-2.5 rounded-[6px] border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'qris'
                    ? 'border-neutral-800 bg-neutral-100 dark:border-white dark:bg-zinc-800 shadow-sm'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50 dark:border-white/[0.1] dark:bg-zinc-900/50 dark:hover:bg-zinc-800'
                }`}
              >
                <QrCode className={`w-4 h-4 ${paymentMethod === 'qris' ? 'text-neutral-800 dark:text-white' : 'text-neutral-400'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">QRIS</span>
              </button>

              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-2.5 rounded-[6px] border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'border-neutral-800 bg-neutral-100 dark:border-white dark:bg-zinc-800 shadow-sm'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50 dark:border-white/[0.1] dark:bg-zinc-900/50 dark:hover:bg-zinc-800'
                }`}
              >
                <CreditCard className={`w-4 h-4 ${paymentMethod === 'card' ? 'text-neutral-800 dark:text-white' : 'text-neutral-400'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Kartu</span>
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Calculation, Cash Input, Confirm */}
        <div className="p-5 mt-auto border-t border-neutral-200 dark:border-white/[0.05] flex flex-col gap-5 bg-white dark:bg-zinc-950 z-10 flex-1">
          
          <div className={`grid gap-3 ${discount > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <div className="bg-neutral-50 dark:bg-zinc-900/50 p-3 rounded-[10px] border border-neutral-100 dark:border-white/[0.05]">
              <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Subtotal</span>
              <span className="text-xs font-black text-neutral-700 dark:text-neutral-200">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <>
                <div className="bg-red-50/50 dark:bg-red-950/20 p-3 rounded-[10px] border border-red-100 dark:border-red-900/30">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-red-400 block mb-1.5">Diskon</span>
                  <span className="text-xs font-black text-red-500">-{formatCurrency(discount)}</span>
                </div>
                <div className="bg-neutral-50 dark:bg-zinc-900/50 p-3 rounded-[10px] border border-neutral-100 dark:border-white/[0.05]">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Setelah Diskon</span>
                  <span className="text-xs font-black text-neutral-700 dark:text-neutral-200">{formatCurrency(subtotal - discount)}</span>
                </div>
              </>
            )}
            <div className="bg-neutral-50 dark:bg-zinc-900/50 p-3 rounded-[10px] border border-neutral-100 dark:border-white/[0.05]">
              <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Pajak ({subtotal - discount > 0 ? Math.round((tax / (subtotal - discount)) * 100) : 10}%)</span>
              <span className="text-xs font-black text-neutral-700 dark:text-neutral-200">{formatCurrency(tax)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-black text-neutral-500 uppercase tracking-widest">Total Tagihan</span>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(payableAmount)}</span>
          </div>

          {/* Dynamic input content */}
          <div className="bg-neutral-50 dark:bg-zinc-900 rounded-[10px] border border-neutral-200 dark:border-white/[0.05] p-5 flex flex-col gap-4 min-h-[160px] justify-center">
            {paymentMethod === 'cash' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                    Uang Tunai Diterima
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-sm text-neutral-500 font-bold">{symbol}</span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={cashAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        setCashAmount(val);
                      }}
                      className="pl-14 h-12 bg-white dark:bg-black border-neutral-200 dark:border-white/[0.2] rounded-[6px] text-lg text-neutral-800 dark:text-neutral-100 focus:ring-2 focus:ring-neutral-800 dark:focus:ring-white font-black"
                    />
                  </div>
                  <div className="flex gap-2 justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => setCashAmount(payableAmount.toString())}
                      className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-[6px] bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                    >
                      Uang Pas
                    </button>
                  </div>
                </div>

                {/* Change calculator display */}
                <div className="pt-3 border-t border-dashed border-neutral-300 dark:border-white/[0.1] flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Uang Kembali:</span>
                  {isCashInsufficient() ? (
                    <span className="text-[10px] text-red-500 font-bold bg-red-100 dark:bg-red-950/50 px-2.5 py-1 rounded-[4px] uppercase tracking-wider">
                      Uang Kurang
                    </span>
                  ) : (
                    <span className="font-black text-indigo-600 dark:text-indigo-400 text-xl">
                      {formatCurrency(calculatedChange())}
                    </span>
                  )}
                </div>
              </div>
            )}

            {paymentMethod === 'qris' && (
              <div className="flex flex-col items-center justify-center text-center gap-4">
                {staticQris ? (
                  <>
                    <img 
                      src={staticQris} 
                      alt="QRIS Code" 
                      className="w-80 h-80 lg:w-96 lg:h-96 object-contain bg-white p-3 rounded-2xl border-2 border-neutral-200 shadow-sm"
                    />
                    <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-2">
                      Menunggu Pelanggan Membayar
                    </span>
                    <span className="text-[10px] text-neutral-400 max-w-[220px]">
                      Arahkan tamu untuk memindai QRIS ini. Klik &quot;Konfirmasi Pembayaran&quot; HANYA JIKA uang sudah masuk.
                    </span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-12 h-12 text-neutral-400" />
                    <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mt-2">
                      Gambar QRIS Belum Diatur
                    </span>
                    <span className="text-[10px] text-neutral-400 max-w-[220px]">
                      Silakan upload gambar QRIS toko Anda di menu Pengaturan terlebih dahulu.
                    </span>
                  </>
                )}
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="flex flex-col items-center justify-center text-center gap-2">
                <div className="animate-pulse">
                  <CreditCard className="w-12 h-12 text-neutral-400" />
                </div>
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-2">
                  Menunggu Kartu Digesek/Tap
                </span>
                <span className="text-[10px] text-neutral-400 max-w-[220px]">
                  Silakan masukkan atau tempelkan kartu Debit/Kredit pada mesin EDC.
                </span>
              </div>
            )}

            {paymentMethod === 'compliment' && (
              <div className="flex flex-col items-center justify-center text-center gap-2">
                <CheckCircle2 className="w-12 h-12 text-purple-500" />
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-widest mt-2">
                  Full Compliment Order
                </span>
                <span className="text-[10px] text-neutral-400 max-w-[220px]">
                  Tagihan order ini adalah Rp 0 (Semua item bertanda compliment).
                </span>
              </div>
            )}
          </div>

          {/* Confirm Payment Action Footer */}
          <Button
            onClick={onConfirmPayment}
            disabled={paymentMethod === 'cash' && isCashInsufficient()}
            className={`w-full h-14 mt-auto rounded-[6px] bg-[#181d26] hover:bg-[#0d1218] text-white dark:bg-white dark:text-[#181d26] dark:hover:bg-neutral-100 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 border-none shadow-sm transition-all ${
              paymentMethod === 'cash' && isCashInsufficient()
                ? 'bg-neutral-300 dark:bg-neutral-800 cursor-not-allowed text-neutral-500 shadow-none'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/20 active:scale-[0.98]'
            }`}
          >
            <CheckCircle2 className="w-6 h-6" />
            <span>Konfirmasi Pembayaran</span>
          </Button>

        </div>
      </div>
    </div>
  );
}
