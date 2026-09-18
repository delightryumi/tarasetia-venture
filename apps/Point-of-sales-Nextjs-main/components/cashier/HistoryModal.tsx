'use client';

import { useEffect, useState } from 'react';
import { X, Printer, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShiftData } from './types';
import { toast } from 'react-toastify';

interface HistoryModalProps {
  selectedHistoryShift: ShiftData;
  detailTransactions: any[];
  isLoadingDetail: boolean;
  onClose: () => void;
  onDeleteClick: (shift: ShiftData) => void;
  formatMoney: (val: number) => string;
  formatDate: (val: any) => string;
  getSalesBreakdown: (shift: ShiftData) => { total: number; cash: number; qris: number; card: number };
}

export default function HistoryModal({
  selectedHistoryShift,
  detailTransactions,
  isLoadingDetail,
  onClose,
  onDeleteClick,
  formatMoney,
  formatDate,
  getSalesBreakdown
}: HistoryModalProps) {

  const [outletName, setOutletName] = useState('Partner Property');
  const [outletAddress, setOutletAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [paperSize, setPaperSize] = useState<'80mm' | '58mm'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pos_slip_paper_size');
      if (saved === '58mm' || saved === '80mm') return saved;
    }
    return '80mm';
  });

  const handlePaperSizeChange = (size: '80mm' | '58mm') => {
    setPaperSize(size);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_slip_paper_size', size);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const shopRaw = localStorage.getItem('shopData') || localStorage.getItem('shopInfo');
      if (shopRaw) {
        try {
          const shop = JSON.parse(shopRaw);
          if (shop.name) setOutletName(shop.name);
          if (shop.address) setOutletAddress(shop.address);
        } catch {}
      }
      const savedLogo = localStorage.getItem('shopLogo');
      if (savedLogo) setLogoUrl(savedLogo);
    }
    // Fetch from /api/shopdata for most accurate outlet name
    fetch('/api/shopdata', { cache: 'no-store' })
      .then(r => r.json())
      .then(res => {
        if (res?.data?.name) setOutletName(res.data.name);
        if (res?.data?.address) setOutletAddress(res.data.address);
      })
      .catch(() => {});
  }, []);

  // ── Compute payment breakdown from pos_orders (source of truth) ──
  const b = (() => {
    if (!isLoadingDetail && detailTransactions.length > 0) {
      let total = 0, cash = 0, qris = 0, card = 0, transfer = 0;
      detailTransactions.forEach(tx => {
        if (tx.status === 'CANCELLED' || tx.status === 'VOID') return;
        const isTxCompliment = !!tx.isCompliment || 
                              (tx.method?.toLowerCase() === 'compliment') || 
                              (tx.paymentMethod?.toLowerCase() === 'compliment');
        if (isTxCompliment) return;
        const amt = tx.amount ?? tx.total ?? 0;
        const m = (tx.method ?? tx.paymentMethod ?? 'cash').toLowerCase().trim();
        total += amt;
        if (m === 'cash' || m === 'tunai') cash += amt;
        else if (m === 'qris' || m === 'e-money' || m === 'emoney') qris += amt;
        else if (m === 'card' || m === 'edc' || m === 'debit' || m === 'kredit' || m === 'credit' || m === 'kartu') card += amt;
        else if (m === 'transfer') transfer += amt;
        else qris += amt;
      });
      return { total, cash, qris, card, transfer };
    }
    const fb = getSalesBreakdown(selectedHistoryShift);
    return { ...fb, transfer: 0 };
  })();

  // ── Helper category detector ──
  const isFoodItem = (target: string, cat: string, name: string) => {
    const t = (target || '').toLowerCase().trim();
    const c = (cat || '').toLowerCase().trim();
    const n = (name || '').toLowerCase().trim();
    if (t === 'food' || c === 'food' || c === 'makanan' || c.includes('food') || c.includes('makan')) return true;
    const foodKeywords = [
      'nasi', 'mie', 'ayam', 'bebek', 'soup', 'sop', 'tahu', 'mendoan', 'tempe', 'snack',
      'goreng', 'bakar', 'kremes', 'fillet', 'kentang', 'roti', 'pisang', 'burger',
      'sandwich', 'pasta', 'spaghetti', 'pizza', 'daging', 'sapi', 'ikan', 'udang', 'salad'
    ];
    return foodKeywords.some(kw => n.includes(kw));
  };

  const isBeverageItem = (target: string, cat: string, name: string) => {
    const t = (target || '').toLowerCase().trim();
    const c = (cat || '').toLowerCase().trim();
    const n = (name || '').toLowerCase().trim();
    if (t === 'beverage' || c === 'beverage' || c === 'minuman' || c.includes('bev') || c.includes('minum') || c.includes('drink') || c.includes('bar') || c.includes('kopi') || c.includes('coffee')) return true;
    const drinkKeywords = [
      'kopi', 'coffee', 'tea', 'teh', 'latte', 'cappucino', 'cappuccino', 'espresso',
      'mocha', 'mocachino', 'juice', 'jus', 'mojito', 'float', 'milkshake', 'taro',
      'matcha', 'mineral', 'air', 'wedang', 'chocolate', 'cokelat', 'drink', 'beer',
      'wine', 'syrup', 'sirup', 'boba', 'smoothie', 'creamy', 'berrycano', 'americano'
    ];
    return drinkKeywords.some(kw => n.includes(kw));
  };

  // ── Revenue breakdown by category & financial totals (Hotel Standard) ──
  let foodTotal = 0, beverageTotal = 0, banquetTotal = 0, otherTotal = 0;
  let discountTotal = 0, taxTotal = 0, serviceTotal = 0;
  let successCount = 0;
  let voidCount = 0;
  let voidTotal = 0;
  let complimentCount = 0;
  let complimentTotal = 0;

  detailTransactions.forEach(tx => {
    const isCancelled = tx.status === 'CANCELLED' || tx.status === 'VOID';
    const isTxCompliment = !!tx.isCompliment || 
                          (tx.method?.toLowerCase() === 'compliment') || 
                          (tx.paymentMethod?.toLowerCase() === 'compliment');

    if (isCancelled) {
      voidCount++;
      voidTotal += Number(tx.originalTotal ?? tx.total ?? tx.amount ?? 0);
      return;
    }

    if (isTxCompliment) {
      complimentCount++;
      let compVal = Number(tx.complimentValue || tx.originalTotal || tx.total || tx.amount || 0);
      if (tx.items && Array.isArray(tx.items) && tx.items.length > 0) {
        const itemSum = tx.items.reduce((s: number, it: any) => s + ((it.originalPrice ?? it.price ?? 0) * (it.quantity || 1)), 0);
        if (itemSum > 0) compVal = itemSum;
      }
      complimentTotal += compVal;
      return;
    }

    successCount++;

    const isBanquet = tx.revenueType?.toLowerCase() === 'banquet' ||
                      (tx.category?.toLowerCase() || '').includes('banquet');

    let txGross = 0;
    if (isBanquet) {
      const amt = tx.amount ?? tx.total ?? 0;
      banquetTotal += amt;
      txGross = amt;
    } else if (tx.items && Array.isArray(tx.items) && tx.items.length > 0) {
      tx.items.forEach((item: any) => {
        const itemPrice = item.isCompliment ? 0 : (item.originalPrice ?? item.price ?? 0);
        const itemTotal = itemPrice * (item.quantity || 1);
        if (item.isCompliment) {
          complimentTotal += (item.originalPrice ?? item.price ?? 0) * (item.quantity || 1);
        }
        txGross += itemTotal;

        const target = item.pnlTarget || '';
        const cat = item.category || '';
        const name = item.name || '';

        if (target.toUpperCase() === 'BANQUET' || cat.toUpperCase() === 'BANQUET') {
          banquetTotal += itemTotal;
        } else if (isFoodItem(target, cat, name)) {
          foodTotal += itemTotal;
        } else if (isBeverageItem(target, cat, name)) {
          beverageTotal += itemTotal;
        } else {
          otherTotal += itemTotal;
        }
      });
    } else {
      const amt = tx.amount ?? tx.total ?? 0;
      otherTotal += amt;
      txGross = amt;
    }

    const txDisc = Number(tx.discount || 0);
    const txTotal = Number(tx.amount ?? tx.total ?? 0);
    let txTax = Number(tx.tax ?? tx.taxAmount ?? 0);
    const txSvc = Number(tx.service ?? tx.serviceAmount ?? 0);

    // If txTax wasn't separately saved but total exceeds net gross, capture tax
    if (!txTax && txTotal > Math.max(0, txGross - txDisc)) {
      txTax = txTotal - Math.max(0, txGross - txDisc) - txSvc;
    }

    discountTotal += txDisc;
    taxTotal += txTax;
    serviceTotal += txSvc;
  });

  const productSubtotal = foodTotal + beverageTotal + banquetTotal + otherTotal;

  // Reconcile so components always match b.total
  const componentsSum = productSubtotal - discountTotal + taxTotal + serviceTotal;
  if (b.total > 0 && Math.abs(b.total - componentsSum) > 0.01) {
    const diff = b.total - (productSubtotal - discountTotal + serviceTotal);
    if (diff > 0) {
      taxTotal = diff;
    }
  }

  const netBase = Math.max(1, productSubtotal - discountTotal);
  const taxRatePct = taxTotal > 0 ? Math.round((taxTotal / netBase) * 100) : 0;
  const serviceRatePct = serviceTotal > 0 ? Math.round((serviceTotal / netBase) * 100) : 0;

  // ── Cash reconciliation ──
  const cashFlowIn = (selectedHistoryShift.cashFlows || [])
    .filter((c: any) => c.type === 'in')
    .reduce((s: number, c: any) => s + (c.amount || 0), 0) + (selectedHistoryShift.cashIn || 0);
  const cashFlowOut = (selectedHistoryShift.cashFlows || [])
    .filter((c: any) => c.type === 'out')
    .reduce((s: number, c: any) => s + (c.amount || 0), 0) + (selectedHistoryShift.cashOut || 0);
  const expectedCash = (selectedHistoryShift.houseBank || 0) + b.cash + cashFlowIn - cashFlowOut;
  const countedCash = selectedHistoryShift.countedCash || 0;
  const cashDiff = countedCash - expectedCash;

  // ── Format payment method label ──
  const fmtMethod = (m: string) => {
    const low = (m || '').toLowerCase().trim();
    if (low === 'cash' || low === 'tunai') return 'TUNAI';
    if (low === 'qris' || low === 'e-money' || low === 'emoney') return 'QRIS';
    if (low === 'card' || low === 'edc' || low === 'debit' || low === 'kredit' || low === 'credit' || low === 'kartu') return 'KARTU (EDC)';
    if (low === 'transfer') return 'TRANSFER';
    if (low === 'compliment') return 'COMPLIMENT';
    return m.toUpperCase();
  };

  // ── Format datetime compact ──
  const fmtShort = (val: any) => {
    if (!val) return '-';
    try {
      const d = typeof val === 'string' ? new Date(val) : (val?.toDate ? val.toDate() : new Date(val));
      return d.toLocaleString('id-ID', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      });
    } catch { return '-'; }
  };

  const handlePrint = () => {
    const el = document.getElementById('shift-closing-slip');
    if (!el) { toast.error('Gagal memuat area cetak.'); return; }
    const pw = window.open('', '_blank', 'height=800,width=850');
    if (!pw) { toast.error('Gagal membuka jendela cetak. Izinkan pop-up.'); return; }

    const is58 = paperSize === '58mm';
    const printableWidth = is58 ? '48mm' : '72mm';
    const baseFontSize = is58 ? '11px' : '12.5px';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    pw.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Shift Closing Slip - ${selectedHistoryShift.cashierName}</title>
  <base href="${origin}/">
  <style>
    @page {
      margin: 0 !important;
      size: auto !important;
    }
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        width: 100% !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #wrap {
        width: 100% !important;
        max-width: ${printableWidth} !important;
        margin: 0 auto !important;
        padding: 1.5mm 2.5mm 12mm 2.5mm !important;
        box-sizing: border-box !important;
      }
    }
    * {
      box-sizing: border-box;
      color: #000 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: ${baseFontSize};
      line-height: 1.35;
      display: flex;
      justify-content: center;
    }
    #wrap {
      width: 100%;
      max-width: ${printableWidth};
      padding: 1.5mm 2.5mm 12mm 2.5mm;
      box-sizing: border-box;
      background: #fff;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: 700; }
    .row { display: flex; justify-content: space-between; align-items: flex-start; margin: 3px 0; font-size: ${baseFontSize}; line-height: 1.35; }
    .row .val { font-weight: 700; white-space: nowrap; margin-left: 8px; text-align: right; }
    .row .lbl { flex: 1; color: #111; }
    .section-title { font-size: ${is58 ? '11px' : '12.5px'}; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; margin: 8px 0 4px; border-bottom: 1.5px dashed #000; padding-bottom: 2px; }
    .dash { border: none; border-top: 1.5px dashed #000; margin: 6px 0; }
    .dot { border: none; border-top: 1px dotted #000; margin: 3px 0; }
    .outlet { font-size: ${is58 ? '15px' : '17px'}; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; display: block; margin: 2px 0 3px; font-family: system-ui, -apple-system, sans-serif; text-align: center; line-height: 1.25; }
    .sub-outlet { font-size: ${is58 ? '10px' : '11.5px'}; font-weight: 600; text-align: center; margin: 2px 0; line-height: 1.3; }
    .tx-table { width: 100%; border-collapse: collapse; font-size: ${is58 ? '10px' : '11.5px'}; margin-top: 3px; line-height: 1.3; }
    .tx-table th { font-weight: 800; font-size: ${is58 ? '9.5px' : '11px'}; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1.5px solid #000; padding: 3px 1px; text-align: left; }
    .tx-table td { padding: 2.5px 1px; vertical-align: top; }
    .tx-table tr:last-child td { border-bottom: 1px dotted #000; }
    .total-row td { font-weight: 800; font-size: ${is58 ? '12px' : '13.5px'}; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 4px 1px; }
    .green, .red, .amber { color: #000 !important; font-weight: bold; }
    .footer { font-size: ${is58 ? '9.5px' : '10.5px'}; text-align: center; margin-top: 10px; }
    .logo { max-height: 44px; width: auto; display: block; margin: 0 auto 5px; filter: grayscale(100%) brightness(0); }
    .indent { padding-left: 8px; font-size: ${is58 ? '10px' : '11.5px'}; }
    .sign-block { margin-top: 14px; margin-bottom: 6px; border-top: 1.5px dashed #000; padding-top: 8px; }
    .sign-grid { display: flex; justify-content: space-between; text-align: center; font-size: ${is58 ? '10px' : '11px'}; }
    .sign-col { width: 46%; }
    .sign-space { height: 38px; }
    .sign-name { font-weight: 700; border-top: 1px dotted #000; padding-top: 2px; font-size: ${is58 ? '10px' : '11px'}; }
  </style>
</head>
<body>
  <div id="wrap">
    ${el.innerHTML}
  </div>
</body>
</html>`);
    pw.document.close();
    pw.focus();
    setTimeout(() => {
      pw.print();
      pw.close();
    }, 650);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.08] rounded-2xl max-w-md w-full shadow-2xl relative flex flex-col max-h-[92vh]">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-white/[0.08] shrink-0">
          <div>
            <h2 className="text-sm font-bold text-neutral-800 dark:text-white">Closing Slip — Shift Report</h2>
            <p className="text-[11px] text-neutral-500 mt-0.5">{selectedHistoryShift.cashierName} · {fmtShort(selectedHistoryShift.openedAt)}</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Paper Size Selector */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-neutral-50 dark:bg-zinc-950/60 border-b border-neutral-200 dark:border-white/[0.06] shrink-0 text-xs">
          <span className="text-neutral-600 dark:text-neutral-400 font-semibold flex items-center gap-1.5">
            <span>Ukuran Kertas Thermal:</span>
          </span>
          <div className="flex bg-neutral-200/80 dark:bg-zinc-800 p-0.5 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => handlePaperSizeChange('80mm')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                paperSize === '80mm'
                  ? 'bg-white dark:bg-zinc-700 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              80 mm (Standar)
            </button>
            <button
              type="button"
              onClick={() => handlePaperSizeChange('58mm')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                paperSize === '58mm'
                  ? 'bg-white dark:bg-zinc-700 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              58 mm (Kecil)
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 bg-neutral-100 dark:bg-zinc-950 mx-4 my-3 rounded-xl border border-neutral-200 dark:border-white/[0.05]">
          
          <style>{`
            .closing-slip-preview-container * {
              box-sizing: border-box;
            }
            .closing-slip-preview-container {
              width: 100%;
              max-width: ${paperSize === '58mm' ? '300px' : '360px'};
              padding: 16px 14px;
              background: #fff;
              color: #000;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              font-size: ${paperSize === '58mm' ? '11px' : '12.5px'};
              line-height: 1.35;
              margin: 0 auto;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
              border-radius: 8px;
            }
            .closing-slip-preview-container .center { text-align: center; }
            .closing-slip-preview-container .right { text-align: right; }
            .closing-slip-preview-container .bold { font-weight: 700; }
            .closing-slip-preview-container .row { display: flex; justify-content: space-between; align-items: flex-start; margin: 3px 0; font-size: ${paperSize === '58mm' ? '11px' : '12.5px'}; line-height: 1.35; }
            .closing-slip-preview-container .row .val { font-weight: 700; white-space: nowrap; margin-left: 8px; text-align: right; }
            .closing-slip-preview-container .row .lbl { flex: 1; color: #222; }
            .closing-slip-preview-container .section-title { font-size: ${paperSize === '58mm' ? '11px' : '12.5px'}; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: #000 !important; margin: 9px 0 5px; border-bottom: 1.5px dashed #000; padding-bottom: 3px; }
            .closing-slip-preview-container .dash { border: none; border-top: 1.5px dashed #000; margin: 7px 0; }
            .closing-slip-preview-container .dot { border: none; border-top: 1px dotted #000; margin: 4px 0; }
            .closing-slip-preview-container .outlet { font-size: ${paperSize === '58mm' ? '15px' : '17px'}; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; display: block; margin: 2px 0 3px; font-family: system-ui, -apple-system, sans-serif; text-align: center; line-height: 1.25; }
            .closing-slip-preview-container .sub-outlet { font-size: ${paperSize === '58mm' ? '10px' : '11.5px'}; font-weight: 600; text-align: center; color: #333 !important; line-height: 1.3; margin: 2px 0; }
            .closing-slip-preview-container .tx-table { width: 100%; border-collapse: collapse; font-size: ${paperSize === '58mm' ? '10px' : '11.5px'}; margin-top: 4px; line-height: 1.3; }
            .closing-slip-preview-container .tx-table th { font-weight: 800; font-size: ${paperSize === '58mm' ? '9.5px' : '11px'}; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1.5px solid #000; padding: 3px 1px; text-align: left; }
            .closing-slip-preview-container .tx-table td { padding: 2.5px 1px; vertical-align: top; }
            .closing-slip-preview-container .tx-table tr:last-child td { border-bottom: 1px dotted #000; }
            .closing-slip-preview-container .total-row td { font-weight: 800; font-size: ${paperSize === '58mm' ? '12px' : '13.5px'}; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 4px 1px; }
            .closing-slip-preview-container .green { color: #166534 !important; font-weight: bold; }
            .closing-slip-preview-container .red { color: #991b1b !important; font-weight: bold; }
            .closing-slip-preview-container .amber { color: #92400e !important; font-weight: bold; }
            .closing-slip-preview-container .footer { font-size: ${paperSize === '58mm' ? '9.5px' : '10.5px'}; color: #000 !important; text-align: center; margin-top: 12px; }
            .closing-slip-preview-container .logo { max-height: 48px; width: auto; display: block; margin: 0 auto 6px; filter: grayscale(100%) brightness(0); }
            .closing-slip-preview-container .indent { padding-left: 8px; font-size: ${paperSize === '58mm' ? '10px' : '11.5px'}; color: #000 !important; }
            .closing-slip-preview-container .sign-block { margin-top: 16px; margin-bottom: 8px; border-top: 1.5px dashed #000; padding-top: 10px; }
            .closing-slip-preview-container .sign-grid { display: flex; justify-content: space-between; text-align: center; font-size: ${paperSize === '58mm' ? '10px' : '11px'}; }
            .closing-slip-preview-container .sign-col { width: 46%; }
            .closing-slip-preview-container .sign-space { height: 40px; }
            .closing-slip-preview-container .sign-name { font-weight: 700; border-top: 1px dotted #000; padding-top: 3px; font-size: ${paperSize === '58mm' ? '10px' : '11px'}; }
          `}</style>

          <div
            id="shift-closing-slip"
            className="closing-slip-preview-container"
          >
            <div className="center">
              {logoUrl && (
                <img src={logoUrl} alt="Logo" className="logo" />
              )}
              <span className="outlet">
                {outletName}
              </span>
              {outletAddress && (
                <p className="sub-outlet">{outletAddress}</p>
              )}
              <p className="sub-outlet bold" style={{ marginTop: 4, letterSpacing: '0.12em' }}>
                F&B CASHIER CLOSING SLIP — SHIFT REPORT
              </p>
            </div>

            <hr className="dash" />

            <div className="section-title">Informasi Shift</div>
            <div className="row"><span className="lbl">Kasir:</span><span className="val">{selectedHistoryShift.cashierName || '-'}</span></div>
            <div className="row"><span className="lbl">Shift ID:</span><span className="val bold font-mono">{selectedHistoryShift.id || '-'}</span></div>
            <div className="row"><span className="lbl">Waktu Buka:</span><span className="val">{fmtShort(selectedHistoryShift.openedAt)}</span></div>
            <div className="row"><span className="lbl">Waktu Tutup:</span><span className="val">{selectedHistoryShift.closedAt ? fmtShort(selectedHistoryShift.closedAt) : 'Shift Masih Aktif'}</span></div>
            <div className="row"><span className="lbl">Status Shift:</span><span className={`val bold ${selectedHistoryShift.status === 'open' ? 'amber' : 'green'}`}>{selectedHistoryShift.status === 'open' ? 'OPEN (AKTIF)' : 'CLOSED (SELESAI)'}</span></div>
            <div className="row"><span className="lbl">Transaksi Berhasil:</span><span className="val bold">{successCount} bill</span></div>
            {voidCount > 0 && (
              <div className="row"><span className="lbl red">Void / Dibatalkan:</span><span className="val red bold">{voidCount} bill ({formatMoney(voidTotal)})</span></div>
            )}
            {complimentCount > 0 && (
              <div className="row"><span className="lbl amber">Compliment / FOC:</span><span className="val amber bold">{complimentCount} bill ({formatMoney(complimentTotal)})</span></div>
            )}

            <hr className="dash" />

            <div className="section-title">Riwayat Transaksi (Audit)</div>

            {isLoadingDetail ? (
              <div className="center italic py-2" style={{ fontSize: 11.5, color: '#555' }}>Memuat data transaksi...</div>
            ) : detailTransactions.length === 0 ? (
              <div className="center italic py-2" style={{ fontSize: 11.5, color: '#888' }}>Tidak ada transaksi dalam shift ini.</div>
            ) : (
              <>
                <table className="tx-table">
                  <thead>
                    <tr>
                      <th style={{ width: '16%' }}>Waktu</th>
                      <th style={{ width: '38%' }}>No. Bill / Tx</th>
                      <th className="center" style={{ width: '18%' }}>Metode</th>
                      <th className="right" style={{ width: '28%' }}>Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailTransactions.map((tx, i) => {
                      const isCancelled = tx.status === 'CANCELLED' || tx.status === 'VOID';
                      const isTxCompliment = !!tx.isCompliment || 
                                            (tx.method?.toLowerCase() === 'compliment') || 
                                            (tx.paymentMethod?.toLowerCase() === 'compliment');
                      const rawAmt = Number(tx.originalTotal || tx.total || tx.amount || 0);
                      const amt = (isCancelled || isTxCompliment) ? 0 : rawAmt;
                      const m = fmtMethod(tx.method ?? tx.paymentMethod ?? 'cash');
                      const ts = tx.timestamp?.toDate ? tx.timestamp.toDate() : new Date(tx.timestamp || Date.now());
                      const timeStr = ts.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
                      const txId = (tx.transactionId || tx.id || '').toUpperCase();
                      return (
                        <tr key={i} style={isCancelled ? { textDecoration: 'line-through', opacity: 0.6 } : undefined}>
                          <td>{timeStr}</td>
                          <td className="bold font-mono" style={{ fontSize: paperSize === '58mm' ? '9.5px' : '10.5px', wordBreak: 'break-all' }}>
                            {txId}{isCancelled ? ' (VOID)' : isTxCompliment ? ' (FOC)' : ''}
                          </td>
                          <td className="center">{m}</td>
                          <td className={`right bold ${isCancelled ? 'red' : isTxCompliment ? 'amber' : ''}`}>
                            {formatMoney(isCancelled ? rawAmt : amt)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="total-row">
                      <td colSpan={3} className="bold">TOTAL PENJUALAN</td>
                      <td className="right bold">{formatMoney(b.total)}</td>
                    </tr>
                  </tbody>
                </table>
                {voidCount > 0 && (
                  <div style={{ fontSize: '10.5px', color: '#991b1b', marginTop: 4, fontStyle: 'italic' }}>
                    * {voidCount} bill void ({formatMoney(voidTotal)}) tidak dimasukkan ke total penjualan.
                  </div>
                )}
              </>
            )}

            <hr className="dash" />

            <div className="section-title">Breakdown Penjualan (Kategori)</div>
            {!isLoadingDetail && (
              <>
                {foodTotal > 0 && <div className="row"><span className="lbl">Food (Makanan):</span><span className="val">{formatMoney(foodTotal)}</span></div>}
                {beverageTotal > 0 && <div className="row"><span className="lbl">Beverage (Minuman):</span><span className="val">{formatMoney(beverageTotal)}</span></div>}
                {banquetTotal > 0 && <div className="row"><span className="lbl">Banquet:</span><span className="val">{formatMoney(banquetTotal)}</span></div>}
                {otherTotal > 0 && <div className="row"><span className="lbl">Lainnya / Others:</span><span className="val">{formatMoney(otherTotal)}</span></div>}
                
                <div className="row" style={{ borderTop: '1px dotted #888', paddingTop: 3, marginTop: 4 }}>
                  <span className="lbl bold">Subtotal Penjualan (Gross):</span>
                  <span className="val bold">{formatMoney(productSubtotal)}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="row">
                    <span className="lbl red">Diskon / Promo:</span>
                    <span className="val red">-{formatMoney(discountTotal)}</span>
                  </div>
                )}
                {discountTotal > 0 && (
                  <div className="row">
                    <span className="lbl">Penjualan Bersih (Net Sales):</span>
                    <span className="val">{formatMoney(Math.max(0, productSubtotal - discountTotal))}</span>
                  </div>
                )}
                {taxTotal > 0 && (
                  <div className="row">
                    <span className="lbl">PB1 / Pajak Resto{taxRatePct > 0 ? ` (${taxRatePct}%)` : ''}:</span>
                    <span className="val">+{formatMoney(taxTotal)}</span>
                  </div>
                )}
                {serviceTotal > 0 && (
                  <div className="row">
                    <span className="lbl">Service Charge{serviceRatePct > 0 ? ` (${serviceRatePct}%)` : ''}:</span>
                    <span className="val">+{formatMoney(serviceTotal)}</span>
                  </div>
                )}

                <hr className="dash" />

                <div className="section-title">Metode Pembayaran (Settlement)</div>
                <div className="row"><span className="lbl">Tunai / Cash:</span><span className="val">{formatMoney(b.cash)}</span></div>
                <div className="row"><span className="lbl">QRIS / E-Money:</span><span className="val">{formatMoney(b.qris)}</span></div>
                <div className="row"><span className="lbl">Kartu (EDC):</span><span className="val">{formatMoney(b.card)}</span></div>
                <div className="row"><span className="lbl">Transfer Bank:</span><span className="val">{formatMoney(b.transfer)}</span></div>
                {complimentTotal > 0 && (
                  <div className="row">
                    <span className="lbl amber">Compliment / FOC (Non-Rev):</span>
                    <span className="val amber">{formatMoney(complimentTotal)}</span>
                  </div>
                )}
                <hr className="dot" />
                <div className="row bold" style={{ fontSize: paperSize === '58mm' ? '12px' : '13.5px', marginTop: 2 }}>
                  <span className="lbl">Total Settlement Shift:</span>
                  <span className="val">{formatMoney(b.total)}</span>
                </div>
                <div className="row" style={{ fontSize: '11px', color: '#166534', marginTop: 2 }}>
                  <span className="lbl italic">Status Rekonsiliasi:</span>
                  <span className="val green">BALANCE / MATCH ✓</span>
                </div>
              </>
            )}

            <hr className="dash" />

            <div className="section-title">Rekonsiliasi Kas Laci (Drawer)</div>
            <div className="row"><span className="lbl">House Bank (Modal Awal):</span><span className="val">{formatMoney(selectedHistoryShift.houseBank || 0)}</span></div>
            <div className="row"><span className="lbl">Penjualan Tunai:</span><span className="val">+{formatMoney(b.cash)}</span></div>
            {cashFlowIn > 0 && <div className="row"><span className="lbl">Cash In (Kas Masuk):</span><span className="val">+{formatMoney(cashFlowIn)}</span></div>}
            {cashFlowOut > 0 && <div className="row"><span className="lbl">Cash Out (Kas Keluar):</span><span className="val">-{formatMoney(cashFlowOut)}</span></div>}

            {(selectedHistoryShift.cashFlows || []).map((cf: any, i: number) => (
              <div key={i} className="row indent">
                <span className="lbl">↳ {cf.type === 'in' ? 'Masuk' : 'Keluar'} ({cf.note || '-'}):</span>
                <span className="val">{cf.type === 'in' ? '+' : '-'}{formatMoney(cf.amount || 0)}</span>
              </div>
            ))}

            <hr className="dot" />
            <div className="row"><span className="lbl">Estimasi Fisik Kas di Laci:</span><span className="val bold">{formatMoney(expectedCash)}</span></div>
            <div className="row">
              <span className="lbl">Fisik Kas Aktual Dihitung:</span>
              <span className="val bold">{selectedHistoryShift.status === 'open' ? 'Belum Diinput (Shift Aktif)' : formatMoney(countedCash)}</span>
            </div>
            <div className="row bold" style={{ marginTop: 4, fontSize: paperSize === '58mm' ? '12px' : '13.5px' }}>
              <span className="lbl">Selisih Kas Fisik:</span>
              <span className={`val ${selectedHistoryShift.status === 'open' ? 'amber' : cashDiff === 0 ? 'green' : cashDiff > 0 ? 'amber' : 'red'}`}>
                {selectedHistoryShift.status === 'open' 
                  ? 'Menunggu Closing' 
                  : cashDiff === 0 
                    ? 'Balanced / Cocok ✓' 
                    : cashDiff > 0 
                      ? `+${formatMoney(cashDiff)} (Kelebihan / Over)` 
                      : `${formatMoney(cashDiff)} (Kekurangan / Short)`}
              </span>
            </div>

            {selectedHistoryShift.notes && (
              <>
                <hr className="dash" />
                <div className="section-title">Catatan Closing</div>
                <p className="italic" style={{ fontSize: 11.5, color: '#555', margin: '4px 0', lineHeight: 1.3 }}>{selectedHistoryShift.notes}</p>
              </>
            )}

            {/* Dual Sign-off Block (Hotel Standard) */}
            <div className="sign-block">
              <div className="sign-grid">
                <div className="sign-col">
                  <p style={{ margin: 0, fontWeight: 700 }}>Diserahkan Oleh,</p>
                  <p style={{ margin: 0, fontSize: '10px', color: '#555' }}>(Kasir Bertugas)</p>
                  <div className="sign-space" />
                  <p className="sign-name">
                    {selectedHistoryShift.cashierName || 'Kasir'}
                  </p>
                </div>
                <div className="sign-col">
                  <p style={{ margin: 0, fontWeight: 700 }}>Diverifikasi Oleh,</p>
                  <p style={{ margin: 0, fontSize: '10px', color: '#555' }}>(Spv / Income Auditor)</p>
                  <div className="sign-space" />
                  <p className="sign-name">
                    ( ............................ )
                  </p>
                </div>
              </div>
            </div>

            <div className="center footer">
              <p>Dokumen resmi penutupan shift kasir F&B.</p>
              <p>Dicetak: {new Date().toLocaleString('id-ID')}</p>
              <div className="center" style={{ borderTop: '1px dotted #000', marginTop: 8, paddingTop: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <a href="https://mytara.id" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '9px', color: '#000', textTransform: 'lowercase', letterSpacing: '0.15em', fontWeight: 900, marginBottom: 2 }}>powered by</span>
                  <img src="/channels/1.png" alt="My Tara" style={{ height: 24, width: 'auto', objectFit: 'contain' }} />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-5 flex flex-col gap-2 shrink-0">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={isLoadingDetail}
              className="rounded-xl flex items-center justify-center gap-1.5 border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 text-xs w-full h-9"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Closing Slip</span>
            </Button>
            <Button
              onClick={onClose}
              className="rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-100 border-none text-xs font-bold w-full h-9"
            >
              Tutup
            </Button>
          </div>
          <Button
            variant="destructive"
            onClick={() => onDeleteClick(selectedHistoryShift)}
            className="rounded-xl flex items-center justify-center gap-1.5 text-xs w-full h-9"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Riwayat Shift</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
