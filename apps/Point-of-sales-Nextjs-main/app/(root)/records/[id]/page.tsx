'use client';
import { Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { TransactionData } from '@/types/transaction';
import { useRouter, useParams } from 'next/navigation';
import { useCurrency } from '@/hooks/useCurrency';

// ─── Helper: Group items by Category → Subcategory ───────────────────────────
function groupItems(data: TransactionData[]) {
  const grouped: Record<string, Record<string, TransactionData[]>> = {};
  data.forEach(item => {
    const cat = item.product?.productstock?.cat || 'Lainnya';
    const sub = item.product?.productstock?.subcategory?.trim() || '—';
    if (!grouped[cat]) grouped[cat] = {};
    if (!grouped[cat][sub]) grouped[cat][sub] = [];
    grouped[cat][sub].push(item);
  });
  return grouped;
}

export default function DetailPage() {
  const { formatCurrency } = useCurrency();

  const [taxRate, setTaxRate]         = useState<number>(0);
  const [shopName, setShopName]       = useState<string>('BUMI ANYOM RESORT');
  const [shopAddress, setShopAddress] = useState<string>('');
  const [shopPhone, setShopPhone]     = useState<string>('');
  const [transactionData, setTransactionData] = useState<TransactionData[]>([]);
  const [printing, setPrinting]       = useState(false);

  const route  = useRouter();
  const params = useParams();
  const id     = params?.id as string;
  const componentRef = useRef<HTMLDivElement>(null);

  // ── Totals ──────────────────────────────────────────────────────────────────
  let subtotal = 0;
  transactionData.forEach(item => {
    if (item?.product) subtotal += item.product.sellprice * item.quantity;
  });
  const discount = transactionData[0]?.discount || 0;
  const nettTotal = subtotal - discount;
  const tax   = nettTotal * (taxRate / 100);
  const total = nettTotal + tax;

  // Category totals
  const grouped = groupItems(transactionData);
  const sortedCats = Object.keys(grouped).sort();
  const categoryTotals: Record<string, number> = {};
  sortedCats.forEach(cat => {
    categoryTotals[cat] = Object.values(grouped[cat])
      .flat()
      .reduce((acc, item) => acc + item.product.sellprice * item.quantity, 0);
  });

  // ── Print ───────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
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

  const saleDate = transactionData[0]?.saledate
    ? new Date(transactionData[0].saledate).toLocaleDateString('id-ID', {
        year: 'numeric', month: 'long', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      })
    : new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: '2-digit' });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full">
      <style jsx>{`
        @media screen { .printable-receipt { display: none !important; } }
        @media print {
          @page { size: 80mm auto; margin: 0; }
          .printable-receipt {
            display: block !important;
            width: 80mm; max-width: 80mm;
            padding: 6mm; background: white; color: black;
          }
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════════════
          SCREEN VIEW
      ════════════════════════════════════════════════════════════════════════ */}
      <Card className="w-full flex flex-col h-full overflow-hidden print:hidden">
        <CardHeader className="flex flex-row items-start bg-muted/50">
          <div className="grid gap-0.5">
            <CardTitle className="text-lg font-bold">{id}</CardTitle>
            <CardDescription>Order Detail Archive — {saleDate}</CardDescription>
          </div>
          <div className="ml-auto">
            <Button
              variant="outline"
              className="rounded-xl flex items-center gap-1.5 border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 text-xs"
              onClick={handlePrint}
              disabled={total === 0 || printing}
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Struk
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 text-sm overflow-y-auto flex-1">
          {/* Shop Info */}
          <div className="mb-5 p-3 rounded-xl bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-100 dark:border-white/[0.06]">
            <p className="font-bold text-neutral-800 dark:text-white">{shopName}</p>
            {shopAddress && <p className="text-xs text-neutral-500">{shopAddress}</p>}
            {shopPhone   && <p className="text-xs text-neutral-500">Tlp: {shopPhone}</p>}
          </div>

          {/* Grouped Items — Category → Subcategory */}
          <div className="font-semibold mb-3 text-neutral-700 dark:text-neutral-300">Order Details</div>
          <div className="flex flex-col gap-4">
            {sortedCats.map((cat, ci) => (
              <div key={cat}>
                {/* Category header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-widest text-neutral-800 dark:text-white">
                    {cat}
                  </span>
                  <span className="text-xs font-semibold text-neutral-500">
                    {formatCurrency(categoryTotals[cat])}
                  </span>
                </div>

                {/* Subcategory groups */}
                <div className="flex flex-col gap-2 pl-3 border-l-2 border-neutral-200 dark:border-white/[0.1]">
                  {Object.keys(grouped[cat]).sort().map(sub => (
                    <div key={sub}>
                      {sub !== '—' && (
                        <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-1">
                          {sub}
                        </p>
                      )}
                      {grouped[cat][sub].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-1">
                          <span className="text-muted-foreground text-sm">
                            {item.product?.productstock?.name || 'Item'}
                            <span className="ml-1 text-xs">x{item.quantity}</span>
                          </span>
                          <span className="text-sm font-medium">
                            {formatCurrency((item.product?.sellprice || 0) * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                {ci < sortedCats.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Totals */}
          <ul className="grid gap-2 text-sm">
            <li className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </li>
            {discount > 0 && (
              <li className="flex justify-between text-red-500">
                <span className="text-muted-foreground text-red-400">Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </li>
            )}
            <li className="flex justify-between">
              <span className="text-muted-foreground">Service TAX ({taxRate}%)</span>
              <span>{formatCurrency(tax)}</span>
            </li>
            <li className="flex justify-between font-bold text-base pt-1 border-t border-neutral-200 dark:border-white/[0.1] mt-1">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </li>
          </ul>
        </CardContent>

        <CardFooter className="border-t bg-muted/50 px-6 py-3 mt-auto text-xs text-neutral-400">
          {sortedCats.map(cat => (
            <Badge key={cat} variant="outline" className="mr-1 text-[10px]">{cat}: {formatCurrency(categoryTotals[cat])}</Badge>
          ))}
        </CardFooter>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════════
          THERMAL PRINT TEMPLATE (hidden on screen)
      ════════════════════════════════════════════════════════════════════════ */}
      <div
        ref={componentRef}
        className="printable-receipt"
        style={{ fontFamily: 'Courier New, Courier, monospace' }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>{shopName}</h2>
          {shopAddress && <p style={{ fontSize: '9px', margin: '2px 0 0' }}>{shopAddress}</p>}
          {shopPhone   && <p style={{ fontSize: '9px', margin: '1px 0 0' }}>Tlp: {shopPhone}</p>}
        </div>
        <div style={{ borderTop: '1px dashed black', margin: '6px 0' }} />

        {/* Transaction info */}
        <div style={{ fontSize: '9px', display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '6px' }}>
          {[
            ['No. Transaksi', id],
            ['Tanggal', saleDate],
            ['Pelanggan', 'Walk-in Customer'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{label}:</span>
              <span style={{ fontWeight: 'bold' }}>{value}</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px dashed black', margin: '6px 0' }} />

        {/* Grouped items */}
        {sortedCats.map(cat => (
          <div key={cat} style={{ marginBottom: '6px' }}>
            {/* Category label */}
            <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px dotted #888', paddingBottom: '2px', marginBottom: '4px' }}>
              {cat}
            </div>

            {/* Subcategory groups */}
            {Object.keys(grouped[cat]).sort().map(sub => (
              <div key={sub} style={{ marginBottom: '4px' }}>
                {sub !== '—' && (
                  <div style={{ fontSize: '8px', textTransform: 'uppercase', color: '#555', marginLeft: '4px', marginBottom: '2px', letterSpacing: '0.5px' }}>
                    {sub}
                  </div>
                )}
                {grouped[cat][sub].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginLeft: '8px', marginBottom: '2px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{item.product?.productstock?.name}</div>
                      <div style={{ fontSize: '8px', color: '#444' }}>{item.quantity} x {formatCurrency(item.product?.sellprice || 0)}</div>
                    </div>
                    <span style={{ fontWeight: 'bold' }}>{formatCurrency((item.product?.sellprice || 0) * item.quantity)}</span>
                  </div>
                ))}
              </div>
            ))}

            {/* Category subtotal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#555', borderTop: '1px dotted #aaa', paddingTop: '2px', marginTop: '2px' }}>
              <span>Subtotal {cat}</span>
              <span style={{ fontWeight: 'bold' }}>{formatCurrency(categoryTotals[cat])}</span>
            </div>
          </div>
        ))}

        <div style={{ borderTop: '1px dashed black', margin: '6px 0' }} />

        {/* Totals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '9px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span><span>{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Discount:</span><span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Service TAX ({taxRate}%):</span><span>{formatCurrency(tax)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11px', borderTop: '1px dashed black', paddingTop: '4px', marginTop: '2px' }}>
            <span>TOTAL:</span><span>{formatCurrency(total)}</span>
          </div>
        </div>

        <div style={{ borderTop: '1px dashed black', margin: '8px 0' }} />
        <div style={{ textAlign: 'center', fontSize: '8px', fontStyle: 'italic', lineHeight: 1.5 }}>
          <p>Terima kasih atas kunjungan Anda!</p>
          <p>Struk ini adalah bukti pembayaran sah.</p>
        </div>
      </div>
    </div>
  );
}
