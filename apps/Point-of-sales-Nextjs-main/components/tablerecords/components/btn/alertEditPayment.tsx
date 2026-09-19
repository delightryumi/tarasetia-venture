'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Coins, 
  QrCode, 
  Landmark, 
  Gift, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { ReloadIcon } from '@radix-ui/react-icons';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { localDb } from '@/lib/dexie';
import { useCurrency } from '@/hooks/useCurrency';

export type PaymentMethodOption = 'cash' | 'qris' | 'card' | 'transfer' | 'compliment';

interface PaymentMethodMeta {
  id: PaymentMethodOption;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  borderClass: string;
  activeBg: string;
  badgeClass: string;
}

const PAYMENT_METHODS: PaymentMethodMeta[] = [
  {
    id: 'cash',
    label: 'Tunai (Cash)',
    sublabel: 'Pembayaran uang tunai langsung',
    icon: Coins,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-500 ring-emerald-500/20',
    activeBg: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500',
    badgeClass: 'bg-emerald-500 text-white',
  },
  {
    id: 'qris',
    label: 'QRIS / E-Wallet',
    sublabel: 'Barcode QRIS / GoPay / OVO / DANA',
    icon: QrCode,
    colorClass: 'text-sky-600 dark:text-sky-400',
    borderClass: 'border-sky-500 ring-sky-500/20',
    activeBg: 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-500',
    badgeClass: 'bg-sky-500 text-white',
  },
  {
    id: 'card',
    label: 'Kartu (EDC)',
    sublabel: 'Mesin EDC Debit / Kartu Kredit',
    icon: CreditCard,
    colorClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500 ring-amber-500/20',
    activeBg: 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500',
    badgeClass: 'bg-amber-500 text-white',
  },
  {
    id: 'transfer',
    label: 'Transfer Bank',
    sublabel: 'Transfer ke rekening bank hotel/resto',
    icon: Landmark,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    borderClass: 'border-indigo-500 ring-indigo-500/20',
    activeBg: 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500',
    badgeClass: 'bg-indigo-500 text-white',
  },
  {
    id: 'compliment',
    label: 'Compliment',
    sublabel: 'Fasilitas gratis tamu (Total Rp 0)',
    icon: Gift,
    colorClass: 'text-purple-600 dark:text-purple-400',
    borderClass: 'border-purple-500 ring-purple-500/20',
    activeBg: 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-500',
    badgeClass: 'bg-purple-500 text-white',
  },
];

interface EditPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  data: {
    id: string;
    totalAmount?: string | number | null;
    paymentMethod?: string;
    isCompliment?: boolean;
    complimentValue?: number;
    customerName?: string;
    tableNumber?: string;
  };
  onUpdated?: (newMethod: string, isCompliment?: boolean) => void;
}

export function EditPaymentDialog({
  open,
  onClose,
  data,
  onUpdated,
}: EditPaymentDialogProps) {
  const router = useRouter();
  const { formatCurrency } = useCurrency();

  const normalizeMethod = (m?: string, isComp?: boolean): PaymentMethodOption => {
    if (isComp) return 'compliment';
    const low = (m || '').toLowerCase().trim();
    if (low === 'qris' || low === 'e-money' || low === 'emoney') return 'qris';
    if (low === 'card' || low === 'edc' || low === 'debit' || low === 'credit' || low === 'kartu') return 'card';
    if (low === 'transfer') return 'transfer';
    if (low === 'compliment') return 'compliment';
    return 'cash';
  };

  const initialMethod = normalizeMethod(data.paymentMethod, data.isCompliment);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodOption>(initialMethod);
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setSelectedMethod(normalizeMethod(data.paymentMethod, data.isCompliment));
      setNote('');
    }
  }, [open, data.paymentMethod, data.isCompliment]);

  const handleSave = async () => {
    if (selectedMethod === initialMethod) {
      toast.info('Metode pembayaran tidak berubah.');
      onClose();
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(`/api/transactions/${data.id}`, {
        paymentMethod: selectedMethod,
        notes: note.trim(),
      });

      // Update local IndexedDB if transaction exists locally
      try {
        await localDb.transactions.update(data.id, {
          paymentMethod: selectedMethod,
        });
      } catch (err) {
        console.warn('Could not update Dexie localDb transaction:', err);
      }

      toast.success(`Metode pembayaran berhasil diubah ke ${selectedMethod.toUpperCase()}`);

      if (onUpdated) {
        onUpdated(selectedMethod, selectedMethod === 'compliment');
      }

      onClose();
      router.refresh();
    } catch (error: any) {
      console.error('Failed to update payment method:', error);
      const errMsg = error.response?.data?.error || error.message || 'Gagal mengubah metode pembayaran';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const numericTotal = Number(data.totalAmount || 0);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !loading && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-lg w-[95vw] max-h-[88vh] flex flex-col p-0 overflow-hidden border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl">
        <DialogHeader className="shrink-0 px-6 pt-5 pb-3 border-b border-neutral-100 dark:border-white/[0.06] bg-neutral-50/70 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <CreditCard className="w-4 h-4" />
            <span>Pembaruan Transaksi</span>
          </div>
          <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
            Edit Metode Pembayaran
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
            Pilih metode pembayaran baru untuk transaksi ini. Perubahan akan disinkronkan ke laporan pendapatan dan kasir.
          </DialogDescription>

          {/* Quick Info Box */}
          <div className="mt-2.5 p-2.5 rounded-xl bg-neutral-100/80 dark:bg-zinc-800/60 border border-neutral-200/60 dark:border-white/[0.06] grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase font-bold tracking-wider">
                ID Transaksi
              </span>
              <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
                {data.id}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase font-bold tracking-wider">
                Total Nilai
              </span>
              <span className="font-bold text-neutral-900 dark:text-white text-xs">
                {data.isCompliment
                  ? `Compliment (${formatCurrency(data.complimentValue || numericTotal)})`
                  : formatCurrency(numericTotal)}
              </span>
            </div>
            {data.customerName && (
              <div className="col-span-2 pt-1 border-t border-neutral-200/40 dark:border-white/[0.04] flex items-center justify-between text-[11px]">
                <span className="text-neutral-500">
                  Pelanggan: <strong className="text-neutral-700 dark:text-neutral-300">{data.customerName}</strong>
                </span>
                {data.tableNumber && (
                  <span className="text-neutral-500">
                    Meja: <strong className="text-neutral-700 dark:text-neutral-300">{data.tableNumber}</strong>
                  </span>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Payment Method Cards - Scrollable area */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-3.5 space-y-3">
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Pilih Metode Pembayaran Baru
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((pm) => {
                const Icon = pm.icon;
                const isSelected = selectedMethod === pm.id;
                const isCurrent = initialMethod === pm.id;

                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setSelectedMethod(pm.id)}
                    className={`relative text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 select-none cursor-pointer ${
                      isSelected
                        ? `${pm.activeBg} ring-2 ${pm.borderClass} shadow-sm`
                        : 'bg-white dark:bg-zinc-900/60 border-neutral-200 dark:border-white/[0.08] hover:border-neutral-300 dark:hover:border-white/[0.15]'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-white dark:bg-zinc-800 shadow-sm'
                          : 'bg-neutral-100 dark:bg-zinc-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${pm.colorClass}`} />
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-neutral-900 dark:text-white">
                          {pm.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-neutral-200 dark:bg-zinc-700 text-neutral-700 dark:text-neutral-300">
                            Saat Ini
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight mt-0.5">
                        {pm.sublabel}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compliment Warning Banner */}
          {selectedMethod === 'compliment' && initialMethod !== 'compliment' && (
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 flex items-start gap-2 text-xs text-purple-800 dark:text-purple-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
              <div>
                <span className="font-bold text-xs">Perhatian: Mengubah ke Compliment</span>
                <p className="text-[11px] text-purple-700 dark:text-purple-400 mt-0.5">
                  Total tagihan transaksi ini akan dihitung sebagai Rp 0 (Compliment) pada laporan kasir & pendapatan harian.
                </p>
              </div>
            </div>
          )}

          {/* Optional Note Input */}
          <div className="space-y-1 pt-0.5">
            <Label htmlFor="paymentNote" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Catatan / Alasan Perubahan <span className="text-neutral-400 font-normal">(Opsional)</span>
            </Label>
            <Input
              id="paymentNote"
              type="text"
              placeholder="Contoh: Tamu mengganti pembayaran dari Tunai ke QRIS..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-9 text-xs bg-neutral-50/50 dark:bg-zinc-800/60 border-neutral-200 dark:border-white/[0.1] rounded-xl focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* DialogFooter - Permanently pinned at bottom */}
        <DialogFooter className="shrink-0 px-6 py-3 border-t border-neutral-100 dark:border-white/[0.06] bg-neutral-50/90 dark:bg-zinc-900/90 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl text-xs h-9 px-4 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-zinc-800"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || selectedMethod === initialMethod}
            className="rounded-xl text-xs h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
          >
            {loading ? (
              <>
                <ReloadIcon className="mr-2 h-3.5 w-3.5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan Perubahan'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
