'use client';

import React, { useEffect, useState } from 'react';
import { 
  Printer, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  User, 
  Clock, 
  Utensils, 
  CreditCard,
  Receipt,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { TransactionData } from '@/types/transaction';
import { useRouter, useParams } from 'next/navigation';
import { useCurrency } from '@/hooks/useCurrency';
import ThermalReceipt, { formatPaymentMethod, ReceiptItemData, formatReceiptDate } from '@/components/shared/ThermalReceipt';
import ReceiptDialog from '@/components/lexupos/ReceiptDialog';

export default function DetailPage() {
  const { formatCurrency } = useCurrency();
  const [printMode, setPrintMode] = useState<'all' | 'kitchen' | 'bar'>('all');
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);

  const [taxRate, setTaxRate]         = useState<number>(0);
  const [shopName, setShopName]       = useState<string>('BUMI ANYOM RESORT');
  const [shopAddress, setShopAddress] = useState<string>('');
  const [shopPhone, setShopPhone]     = useState<string>('');
  const [transactionData, setTransactionData] = useState<TransactionData[]>([]);

  const route  = useRouter();
  const params = useParams();
  const id     = params?.id as string;

  // ── Totals ──────────────────────────────────────────────────────────────────
  let itemsSum = 0;
  transactionData.forEach(item => {
    if (item?.product && !item.isCompliment) {
      const p = item.product as any;
      itemsSum += Number(p.sellprice || p.price || 0) * Number(item.quantity || 1);
    }
  });

  const firstTx = transactionData[0] as any;
  const finalDiscount = Number(firstTx?.discount || 0);
  const recordedTotal = Number(firstTx?.total ?? firstTx?.amount ?? 0);
  let recordedSubtotal = firstTx?.subtotal !== undefined ? Number(firstTx.subtotal) : 0;
  let recordedTax = Number(firstTx?.tax ?? firstTx?.taxAmount ?? 0);
  let recordedService = Number(firstTx?.service ?? firstTx?.serviceAmount ?? 0);

  // If subtotal in db was equal to total or tax was unrecorded, but items sum is lower than total
  let finalSubtotal = itemsSum > 0 ? itemsSum : (recordedSubtotal > 0 ? recordedSubtotal : recordedTotal);
  let finalTotal = recordedTotal > 0 ? recordedTotal : Math.max(0, finalSubtotal - finalDiscount + recordedTax + recordedService);

  let finalService = recordedService;
  let finalTax = recordedTax;

  // Auto-detect tax if unrecorded but total > (subtotal - discount)
  if (finalTax === 0 && finalTotal > Math.max(0, finalSubtotal - finalDiscount)) {
    finalTax = finalTotal - Math.max(0, finalSubtotal - finalDiscount) - finalService;
  }

  const netBase = Math.max(1, finalSubtotal - finalDiscount);
  const effectiveTaxRate = finalTax > 0 ? Math.round((finalTax / netBase) * 100) : 0;
  const effectiveServiceRate = finalService > 0 ? Math.round((finalService / netBase) * 100) : 0;

  // Map transactionData to ReceiptItemData
  const receiptItems: ReceiptItemData[] = transactionData.map(item => {
    const prod = item.product as any;
    return {
      id: item.id || item.productId || '',
      name: prod?.productstock?.name || prod?.name || (item as any).name || 'Item',
      category: prod?.productstock?.cat || prod?.category || (item as any).category || 'Lainnya',
      subcategory: prod?.productstock?.subcategory || prod?.subcategory || (item as any).subcategory || '—',
      price: Number(prod?.sellprice ?? prod?.price ?? (item as any).price ?? 0),
      quantity: Number(item.quantity ?? (item as any).qty ?? 1),
      isCompliment: item.isCompliment,
      complimentReason: item.complimentReason,
      selectedAddons: item.selectedAddons || (item as any).addons || [],
      note: item.note || '',
    };
  });

  // ── Print handler: Open LexuPOS ReceiptDialog ────────────────────────────────
  const handlePrint = () => {
    setIsReceiptOpen(true);
  };

  // ── Fetch shop data ─────────────────────────────────────────────────────────
  useEffect(() => {
    axios.get('/api/shopdata')
      .then(res => {
        const d = res.data?.data;
        if (d) {
          if (d.name)    setShopName(d.name.toUpperCase());
          if (d.address) setShopAddress(d.address);
          if (d.phone)   setShopPhone(d.phone);
          if (d.tax !== undefined) {
            const svc = Number(d.service || 0);
            const tx = Number(d.tax || 0);
            const lb = Number(d.lostBreakage || 0);
            setTaxRate(svc + tx + lb);
          }
        }
      })
      .catch(() => {});
  }, []);

  // ── Fetch transaction ───────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    if (!id) return;
    axios.get(`/api/transactions/${id}`)
      .then(res => {
        if (mounted && res.status === 200) {
          const d = res.data;
          setTransactionData(Array.isArray(d) ? d : [d]);
        }
      })
      .catch(err => {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          route.push('/_error');
        }
      });
    return () => { mounted = false; };
  }, [id]);

  const saleDate = formatReceiptDate(transactionData[0]?.saledate || new Date());

  const isCancelled = firstTx?.status === 'CANCELLED' || firstTx?.status === 'VOID';
  const rawCustomer = firstTx?.customerName;
  const customerName = (!rawCustomer || 
    rawCustomer.toLowerCase() === 'walk-in customer' || 
    rawCustomer.toLowerCase() === 'walk-in' || 
    rawCustomer.toLowerCase() === 'guest' || 
    rawCustomer.toLowerCase() === 'tamu umum') 
    ? 'Tamu Umum' 
    : rawCustomer;

  const rawTable = firstTx?.tableNumber || firstTx?.table;
  const isTakeAway = !rawTable || 
    rawTable.toLowerCase().includes('take') || 
    rawTable === '-' || 
    rawTable === '—';
  const tableName = isTakeAway 
    ? 'Take Away' 
    : (rawTable.toLowerCase().includes('meja') 
        ? rawTable 
        : `Meja ${rawTable}`);

  const cashierName = firstTx?.cashierName || 'Master Superadmin';

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-zinc-950 font-sans">
      
      {/* ── Top Navigation Bar (Inline Header) ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border-b border-neutral-200 dark:border-white/[0.08] shrink-0 print:hidden shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => route.push('/records')}
            className="rounded-lg h-9 px-3 border-neutral-200 dark:border-white/[0.1] hover:bg-neutral-100 dark:hover:bg-zinc-800 text-xs font-semibold gap-1.5 cursor-pointer text-neutral-700 dark:text-neutral-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Riwayat</span>
          </Button>

          <div className="h-5 w-px bg-neutral-200 dark:bg-white/[0.1] hidden sm:block" />

          <div className="flex items-center gap-2">
            <h1 className="text-sm md:text-base font-bold text-neutral-900 dark:text-white tracking-tight">
              {id}
            </h1>
            {isCancelled ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                VOID / BATAL
              </span>
            ) : firstTx?.status === 'UNPAID' ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                BELUM LUNAS
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                LUNAS (PAID)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrint}
            disabled={receiptItems.length === 0}
            className="rounded-xl flex items-center gap-2 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-bold px-4 h-9 shadow-sm cursor-pointer transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </Button>
        </div>
      </div>

      {/* ── Main Inline Workspace ── */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 print:hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ═══════════════════════════════════════════════════════════════════════
              KOLOM KIRI: RINCIAN ORDER & FINANSIAL (7/12)
          ════════════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            
            {/* Kartu Informasi Metadata */}
            <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                <span>Informasi Transaksi</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-neutral-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-neutral-100 dark:border-white/[0.05]">
                  <span className="text-[10px] text-neutral-400 block mb-0.5">Pelanggan</span>
                  <span className="font-bold text-neutral-800 dark:text-white truncate block">
                    {customerName}
                  </span>
                </div>
                <div className="bg-neutral-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-neutral-100 dark:border-white/[0.05]">
                  <span className="text-[10px] text-neutral-400 block mb-0.5">Meja</span>
                  <span className="font-bold text-neutral-800 dark:text-white block">
                    {tableName}
                  </span>
                </div>
                <div className="bg-neutral-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-neutral-100 dark:border-white/[0.05]">
                  <span className="text-[10px] text-neutral-400 block mb-0.5">Kasir</span>
                  <span className="font-bold text-neutral-800 dark:text-white block">
                    {firstTx?.cashierName || 'Kasir'}
                  </span>
                </div>
                <div className="bg-neutral-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-neutral-100 dark:border-white/[0.05]">
                  <span className="text-[10px] text-neutral-400 block mb-0.5">Metode Bayar</span>
                  <span className="font-bold text-neutral-800 dark:text-white block uppercase">
                    {formatPaymentMethod(firstTx?.paymentMethod || firstTx?.paymethod || 'cash')}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-white/[0.05] flex items-center justify-between text-xs text-neutral-500">
                <span>Waktu Transaksi: <strong className="text-neutral-700 dark:text-neutral-300">{saleDate}</strong></span>
                <span>Outlet: <strong className="text-neutral-700 dark:text-neutral-300">{shopName}</strong></span>
              </div>
            </div>

            {/* Kartu Daftar Item Pesanan */}
            <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-neutral-100 dark:border-white/[0.08] flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                  <Utensils className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Daftar Pesanan ({receiptItems.reduce((acc, it) => acc + (it.quantity || 1), 0)} Item)</span>
                </div>
              </div>

              <div className="divide-y divide-neutral-100 dark:divide-white/[0.06] text-xs">
                {receiptItems.map((item, idx) => (
                  <div key={idx} className="p-4 flex items-start justify-between hover:bg-neutral-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-800 dark:text-white text-sm">
                          {item.name}
                        </span>
                        {item.isCompliment && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-white rounded">
                            COMPLIMENT
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        Kategori: {item.category} {item.subcategory && item.subcategory !== '—' ? `· ${item.subcategory}` : ''}
                      </div>
                      {item.selectedAddons && item.selectedAddons.length > 0 && (
                        <div className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1 pl-2 border-l-2 border-neutral-300 dark:border-neutral-700">
                          + {item.selectedAddons.map(a => a.name).join(', ')}
                        </div>
                      )}
                      {item.note && (
                        <div className="text-[11px] italic text-amber-600 dark:text-amber-400 mt-1">
                          Catatan: {item.note}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-neutral-900 dark:text-white text-sm">
                        {item.isCompliment ? formatCurrency(0) : formatCurrency(item.price * item.quantity)}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        {item.quantity} x {formatCurrency(item.price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rincian Finansial Pesanan */}
              <div className="bg-neutral-50/80 dark:bg-zinc-800/40 p-5 border-t border-neutral-200 dark:border-white/[0.08] text-xs space-y-2">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{formatCurrency(finalSubtotal)}</span>
                </div>

                {finalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Diskon</span>
                    <span className="font-semibold">-{formatCurrency(finalDiscount)}</span>
                  </div>
                )}

                {finalService > 0 && (
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Layanan / Service Charge ({effectiveServiceRate}%)</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">+{formatCurrency(finalService)}</span>
                  </div>
                )}

                {finalTax > 0 && (
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Pajak Resto PB1 ({effectiveTaxRate}%)</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">+{formatCurrency(finalTax)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-neutral-200 dark:border-white/[0.1] flex justify-between items-baseline">
                  <span className="text-sm font-bold text-neutral-900 dark:text-white">TOTAL TAGIHAN</span>
                  <span className="text-base font-black text-neutral-900 dark:text-white">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>

                {firstTx?.paymentMethod === 'cash' && (
                  <div className="pt-2 border-t border-dashed border-neutral-200 dark:border-white/[0.08] flex justify-between text-neutral-500">
                    <span>Tunai Diterima / Kembalian:</span>
                    <span>
                      {formatCurrency(firstTx?.cashAmount ?? finalTotal)} / {formatCurrency(firstTx?.changeAmount ?? 0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ═══════════════════════════════════════════════════════════════════════
              KOLOM KANAN: PRATINJAU STRUK THERMAL (5/12)
          ════════════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm flex flex-col items-center">
              
              <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-neutral-100 dark:border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                  <span className="text-xs font-bold text-neutral-800 dark:text-white uppercase tracking-wider">
                    Pratinjau Struk Kasir
                  </span>
                </div>
                <span className="text-[10px] font-medium text-neutral-500 bg-neutral-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  Thermal 80mm
                </span>
              </div>

              {/* Thermal paper container styled exactly like LexuPOS */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 p-4 flex justify-center w-full max-w-sm shadow-sm shrink-0">
                <ThermalReceipt
                  shopInfo={{ name: shopName, address: shopAddress, phone: shopPhone }}
                  transactionInfo={{ 
                    id, 
                    date: saleDate, 
                    customerName, 
                    cashierName,
                    paymentMethod: firstTx?.paymentMethod || firstTx?.paymethod || 'cash',
                    status: firstTx?.status,
                    cancelReason: firstTx?.cancelReason,
                    tableName,
                  }}
                  items={receiptItems}
                  totals={{
                    subtotal: finalSubtotal,
                    discount: finalDiscount,
                    taxRate: effectiveTaxRate,
                    taxAmount: finalTax,
                    serviceRate: effectiveServiceRate,
                    serviceAmount: finalService,
                    payableAmount: finalTotal,
                    cashAmount: firstTx?.cashAmount ?? (firstTx?.paymentMethod === 'cash' ? finalTotal : undefined),
                    changeAmount: firstTx?.changeAmount ?? (firstTx?.paymentMethod === 'cash' ? 0 : undefined),
                  }}
                  className="shadow-sm border border-neutral-200"
                />
              </div>

              <div className="w-full mt-4 flex items-center gap-2">
                <Button
                  onClick={handlePrint}
                  className="flex-1 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-bold h-10 shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Struk Sekarang</span>
                </Button>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          EXACT LEXUPOS RECEIPT DIALOG (Radix Portal Dialog for Printing)
      ════════════════════════════════════════════════════════════════════════ */}
      <ReceiptDialog
        isOpen={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        customerName={customerName}
        tableNumber={tableName}
        notes={firstTx?.notes || ''}
        paymentMethod={firstTx?.paymentMethod || firstTx?.paymethod || 'cash'}
        items={receiptItems}
        cart={transactionData}
        subtotal={finalSubtotal}
        discount={finalDiscount}
        tax={finalTax}
        taxRate={effectiveTaxRate}
        service={finalService}
        serviceRate={effectiveServiceRate}
        payableAmount={finalTotal}
        cashAmount={String(firstTx?.cashAmount ?? (firstTx?.paymentMethod === 'cash' ? finalTotal : 0))}
        cashierName={cashierName}
        status={firstTx?.status || 'PAID'}
        cancelReason={firstTx?.cancelReason || ''}
        date={saleDate}
        transactionId={id}
        onClose={() => setIsReceiptOpen(false)}
      />

    </div>
  );
}
