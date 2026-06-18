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
import ThermalReceipt, { ReceiptItemData } from '@/components/shared/ThermalReceipt';

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

  // Map transactionData to ReceiptItemData
  const receiptItems: ReceiptItemData[] = transactionData.map(item => ({
    id: item.id,
    name: item.product?.productstock?.name || 'Item',
    category: item.product?.productstock?.cat || 'Lainnya',
    subcategory: item.product?.productstock?.subcategory || '—',
    price: item.product?.sellprice || 0,
    quantity: item.quantity,
    isCompliment: item.isCompliment,
    complimentReason: item.complimentReason,
  }));

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
    <div className="w-full h-full relative">

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

          <div className="font-semibold mb-3 text-neutral-700 dark:text-neutral-300">Pratinjau Struk</div>
          
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 p-4 flex justify-center">
             <ThermalReceipt
                shopInfo={{ name: shopName, address: shopAddress, phone: shopPhone }}
                transactionInfo={{ id, date: saleDate, customerName: 'Walk-in Customer', paymentMethod: transactionData[0]?.paymethod || transactionData[0]?.paymentMethod || 'TUNAI' }}
                items={receiptItems}
                totals={{
                  subtotal, discount, taxRate, taxAmount: tax, payableAmount: total
                }}
                className="shadow-sm border border-neutral-200"
             />
          </div>

        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════════
          THERMAL PRINT TEMPLATE (hidden on screen, only block on print)
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="hidden print:block w-full">
         <ThermalReceipt
            shopInfo={{ name: shopName, address: shopAddress, phone: shopPhone }}
            transactionInfo={{ id, date: saleDate, customerName: 'Walk-in Customer', paymentMethod: transactionData[0]?.paymethod || transactionData[0]?.paymentMethod || 'TUNAI' }}
            items={receiptItems}
            totals={{
              subtotal, discount, taxRate, taxAmount: tax, payableAmount: total
            }}
         />
      </div>
    </div>
  );
}
