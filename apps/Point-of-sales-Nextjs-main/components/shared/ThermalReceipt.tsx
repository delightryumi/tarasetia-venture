'use client';
import React, { useEffect, useState } from 'react';
import { useCurrency } from '@/hooks/useCurrency';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { encodeReceiptData } from '@/lib/receiptPayload';
import QRCode from 'qrcode';

// Define the shape of data required to print the receipt
export interface ReceiptItemData {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  quantity: number;
  isCompliment?: boolean;
  complimentReason?: string;
  selectedAddons?: {name: string, price: number}[];
  note?: string;
}

export interface ThermalReceiptProps {
  shopInfo: {
    name: string;
    address: string;
    phone: string;
  };
  transactionInfo: {
    id: string;
    date: string;
    customerName?: string;
    cashierName?: string;
    paymentMethod?: string;
    status?: string;
    cancelReason?: string;
    tableName?: string;
  };
  items: ReceiptItemData[];
  totals: {
    subtotal: number;
    discount: number;
    taxRate: number;
    taxAmount: number;
    serviceRate?: number;
    serviceAmount?: number;
    payableAmount: number;
    cashAmount?: number;
    changeAmount?: number;
  };
  className?: string;
  style?: React.CSSProperties;
  printMode?: 'all' | 'kitchen' | 'bar' | 'checker';
  onPrintModeChange?: (mode: 'all' | 'kitchen' | 'bar' | 'checker') => void;
  paperSize?: '80mm' | '58mm';
  customConfig?: any;
}

export function formatPaymentMethod(method?: string): string {
  if (!method) return 'TUNAI';
  const m = method.toLowerCase().trim();
  if (m === 'cash' || m === 'tunai') return 'TUNAI';
  if (m === 'qris' || m === 'e-money' || m === 'emoney') return 'QRIS';
  if (m === 'card' || m === 'kartu' || m === 'debit' || m === 'credit' || m === 'edc') return 'KARTU (EDC)';
  if (m === 'transfer') return 'TRANSFER';
  if (m === 'compliment') return 'COMPLIMENT';
  return method.toUpperCase();
}

export function formatReceiptDate(dateVal?: string | Date) {
  if (!dateVal) return '';
  if (typeof dateVal === 'string' && dateVal.includes('pukul')) return dateVal;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} pukul ${hours}.${minutes}`;
}

/**
 * Print a thermal receipt element via an isolated hidden iframe.
 * This completely isolates the receipt HTML & CSS from the main window DOM,
 * Next.js layout, and Radix UI modal constraints, preventing artificial page breaks
 * and continuous roll truncation.
 */
export function printThermalReceipt(
  element?: HTMLElement | string | null,
  paperSize: '80mm' | '58mm' = '80mm',
  onFinish?: () => void
) {
  if (typeof window === 'undefined') return;

  let targetEl: HTMLElement | null = null;
  if (typeof element === 'string') {
    targetEl = document.getElementById(element);
  } else if (element && typeof (element as any).cloneNode === 'function') {
    targetEl = element as HTMLElement;
  }

  if (!targetEl) {
    targetEl = document.getElementById('thermal-receipt-printable');
  }

  if (!targetEl) {
    window.print();
    return;
  }

  // Remove existing print iframes if any
  const oldIframe = document.getElementById('thermal-print-iframe');
  if (oldIframe) {
    oldIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'thermal-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-9999';

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    window.print();
    return;
  }

  const origin = window.location.origin;
  const is58 = paperSize === '58mm';
  const widthStr = is58 ? '58mm' : '80mm';
  const printableWidth = is58 ? '54mm' : '76mm';
  const baseFontSize = is58 ? '9.5px' : '10.5px';
  const sidePad = is58 ? '2mm' : '2mm';

  // Clone receipt element and strip internal <style>, buttons, and hidden controls
  const clone = targetEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('style, script, .print\\:hidden, button').forEach(el => el.remove());
  // Strip all dark-mode and decorative Tailwind classes that leak into print
  clone.classList.remove(
    'border', 'border-neutral-200', 'dark:border-zinc-800',
    'shadow-md', 'shadow-sm', 'rounded-xl', 'rounded-2xl', 'rounded-lg'
  );
  // Strip dark: variant classes from entire clone tree
  clone.querySelectorAll('*').forEach(el => {
    const classes = Array.from(el.classList);
    classes.forEach(c => {
      if (c.startsWith('dark:') || c.startsWith('hover:') || c.startsWith('focus:')) {
        el.classList.remove(c);
      }
    });
  });

  // Collect parent stylesheets for Tailwind utility class resolution
  const parentStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map(el => el.outerHTML)
    .join('\n');

  iframeDoc.open();
  iframeDoc.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <base href="${origin}/">
  <title>Struk Pembayaran</title>
  ${parentStyles}
  <style>
    @page {
      size: ${widthStr} auto;
      margin: 0mm;
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: ${widthStr} !important;
      max-width: ${widthStr} !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      font-size: ${baseFontSize} !important;
      line-height: 1.3 !important;
      -webkit-font-smoothing: antialiased !important;
    }
    #receipt-container {
      width: ${widthStr} !important;
      max-width: ${widthStr} !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #000000 !important;
      box-sizing: border-box !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
    }
    .receipt-print-wrapper,
    #thermal-receipt-printable {
      width: ${printableWidth} !important;
      max-width: ${printableWidth} !important;
      padding: ${is58 ? '2mm 2mm 3mm 2mm' : '3mm 2mm 4mm 2mm'} !important;
      margin: 0 auto !important;
      background: #ffffff !important;
      box-shadow: none !important;
      border: none !important;
      outline: none !important;
      box-sizing: border-box !important;
      font-size: ${baseFontSize} !important;
      line-height: 1.3 !important;
    }
    /* Force ALL text elements to black — overrides Tailwind color utilities */
    .receipt-print-wrapper *,
    #thermal-receipt-printable * {
      color: #000000 !important;
      background-color: transparent !important;
      background: transparent !important;
      text-shadow: none !important;
      box-shadow: none !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      animation: none !important;
      transition: none !important;
    }
    /* Restore border visibility */
    .receipt-print-wrapper [class*="border"],
    .receipt-print-wrapper hr,
    #thermal-receipt-printable [class*="border"],
    #thermal-receipt-printable hr {
      border-color: #cccccc !important;
    }
    .receipt-print-wrapper [style*="border: 2px solid"],
    #thermal-receipt-printable [style*="border: 2px solid"] {
      border-color: #000000 !important;
    }
    /* Images */
    .receipt-print-wrapper img,
    #thermal-receipt-printable img {
      opacity: 1 !important;
      background: transparent !important;
      visibility: visible !important;
      display: block !important;
    }
    .store-logo {
      max-width: ${is58 ? '36mm' : '44mm'} !important;
      max-height: ${is58 ? '16mm' : '20mm'} !important;
      width: auto !important;
      height: auto !important;
      object-fit: contain !important;
      margin: 0 auto 3px auto !important;
      display: block !important;
      filter: grayscale(100%) brightness(0) !important;
      image-rendering: crisp-edges !important;
    }
    .receipt-qr-code {
      width: ${is58 ? '54px' : '64px'} !important;
      height: ${is58 ? '54px' : '64px'} !important;
      max-width: ${is58 ? '54px' : '64px'} !important;
      max-height: ${is58 ? '54px' : '64px'} !important;
      object-fit: contain !important;
      margin: 4px auto 2px auto !important;
      display: block !important;
    }
    .powered-by-container {
      margin-top: 12px !important;
      padding-top: 0 !important;
      padding-bottom: 4px !important;
      border: none !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      text-align: center !important;
      width: 100% !important;
    }
    .powered-by-text {
      font-size: 7px !important;
      font-weight: 700 !important;
      letter-spacing: 0.12em !important;
      text-transform: lowercase !important;
      color: #888888 !important;
      margin-bottom: 2px !important;
      display: block !important;
      line-height: 1 !important;
    }
    .powered-by-logo {
      height: ${is58 ? '14px' : '16px'} !important;
      max-height: ${is58 ? '14px' : '16px'} !important;
      width: auto !important;
      object-fit: contain !important;
      margin: 0 auto !important;
      display: block !important;
    }
    /* Text size scale — match preview exactly */
    .text-\\[7px\\]  { font-size: 7px  !important; }
    .text-\\[7\.5px\\] { font-size: 7.5px !important; }
    .text-\\[8px\\]  { font-size: 8px  !important; }
    .text-\\[8\.5px\\] { font-size: 8.5px !important; }
    .text-\\[9px\\]  { font-size: 9px  !important; }
    .text-\\[9\.5px\\] { font-size: 9.5px !important; }
    .text-\\[10px\\] { font-size: 10px !important; }
    .text-\\[10\.5px\\] { font-size: 10.5px !important; }
    .text-\\[11px\\] { font-size: 11px !important; }
    .text-\\[12px\\] { font-size: 12px !important; }
    .text-\\[12\.5px\\] { font-size: 12.5px !important; }
    .text-\\[13px\\] { font-size: 13px !important; }
    .text-\\[15px\\] { font-size: 15px !important; }
    .text-xs   { font-size: 10px !important; }
    .font-bold { font-weight: 700 !important; }
    .font-black { font-weight: 900 !important; }
    .font-semibold { font-weight: 600 !important; }
    .font-medium { font-weight: 500 !important; }
    .font-normal { font-weight: 400 !important; }
    .uppercase { text-transform: uppercase !important; }
    .tracking-wide { letter-spacing: 0.025em !important; }
    .tracking-wider { letter-spacing: 0.05em !important; }
    .tracking-widest { letter-spacing: 0.1em !important; }
    .leading-tight { line-height: 1.2 !important; }
    .leading-snug  { line-height: 1.3 !important; }
    .leading-relaxed { line-height: 1.5 !important; }
    .text-center { text-align: center !important; }
    .text-left   { text-align: left   !important; }
    .text-right  { text-align: right  !important; }
    .flex { display: flex !important; }
    .flex-col { flex-direction: column !important; }
    .items-center { align-items: center !important; }
    .items-start  { align-items: flex-start !important; }
    .justify-between { justify-content: space-between !important; }
    .justify-center  { justify-content: center !important; }
    .w-full { width: 100% !important; }
    .flex-1 { flex: 1 !important; }
    .shrink-0 { flex-shrink: 0 !important; }
    .whitespace-nowrap { white-space: nowrap !important; }
    .break-words { word-break: break-word !important; }
    .line-through { text-decoration: line-through !important; }
    .italic { font-style: italic !important; }
    .mb-1 { margin-bottom: 2px !important; }
    .mb-2 { margin-bottom: 4px !important; }
    .mt-1 { margin-top: 2px !important; }
    .mt-2 { margin-top: 4px !important; }
    .mt-3 { margin-top: 6px !important; }
    .mt-4 { margin-top: 8px !important; }
    .my-1 { margin-top: 2px !important; margin-bottom: 2px !important; }
    .my-2 { margin-top: 4px !important; margin-bottom: 4px !important; }
    .py-1 { padding-top: 2px !important; padding-bottom: 2px !important; }
    .py-1\.5 { padding-top: 3px !important; padding-bottom: 3px !important; }
    .py-2 { padding-top: 4px !important; padding-bottom: 4px !important; }
    .pt-2 { padding-top: 4px !important; }
    .pt-2\.5 { padding-top: 5px !important; }
    .pb-1 { padding-bottom: 2px !important; }
    .pl-2 { padding-left: 4px !important; }
    .pr-1 { padding-right: 2px !important; }
    .gap-1 { gap: 2px !important; }
    .gap-1\.5 { gap: 3px !important; }
    .border-t { border-top-width: 1px !important; border-top-style: solid !important; }
    .border-b { border-bottom-width: 1px !important; border-bottom-style: solid !important; }
    .border-2 { border-width: 2px !important; border-style: solid !important; }
    .border-dashed { border-style: dashed !important; }
    .border-dotted { border-style: dotted !important; }
    .border-neutral-200, .border-neutral-300 { border-color: #cccccc !important; }
    .rounded-sm { border-radius: 2px !important; }
    .px-1 { padding-left: 2px !important; padding-right: 2px !important; }
    .print\\:hidden, [class*="print:hidden"] { display: none !important; }
    /* Powered-by link: no underline */
    a { text-decoration: none !important; color: #000 !important; }
  </style>
</head>
<body>
  <div id="receipt-container">
    ${clone.outerHTML}
  </div>
</body>
</html>`);
  iframeDoc.close();

  const images = iframeDoc.getElementsByTagName('img');
  let loaded = 0;
  const total = images.length;

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Error triggering iframe print:', e);
      window.print();
    } finally {
      if (onFinish) onFinish();
      setTimeout(() => {
        iframe.remove();
      }, 3000);
    }
  };

  if (total === 0) {
    setTimeout(triggerPrint, 150);
  } else {
    for (let i = 0; i < total; i++) {
      if (images[i].complete) {
        loaded++;
        if (loaded === total) setTimeout(triggerPrint, 150);
      } else {
        images[i].onload = () => {
          loaded++;
          if (loaded === total) setTimeout(triggerPrint, 150);
        };
        images[i].onerror = () => {
          loaded++;
          if (loaded === total) setTimeout(triggerPrint, 150);
        };
      }
    }
  }
}

function ThermalReceiptQr({ data, label, size }: { data: string; label: string; size: number }) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!data) return;
    let isMounted = true;
    QRCode.toDataURL(data, {
      width: 320,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M'
    })
      .then(url => {
        if (isMounted) setDataUrl(url);
      })
      .catch(err => {
        console.error('QR code generation error:', err);
      });
    return () => { isMounted = false; };
  }, [data]);

  const displaySize = size < 74 ? 76 : size;

  return (
    <div style={{ paddingTop: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {dataUrl ? (
        <img 
          src={dataUrl}
          alt="Receipt QR" 
          className="receipt-qr-code"
          style={{ 
            width: `${displaySize}px`, 
            height: `${displaySize}px`, 
            objectFit: 'contain', 
            display: 'block', 
            margin: '0 auto',
            imageRendering: 'pixelated'
          }}
        />
      ) : (
        <div style={{ width: `${displaySize}px`, height: `${displaySize}px`, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#999' }}>
          QR Code
        </div>
      )}
      <span style={{ fontSize: '7.5px', color: '#555555', marginTop: '3px', display: 'block', textAlign: 'center' }}>
        {label}
      </span>
    </div>
  );
}

export default function ThermalReceipt({
  shopInfo,
  transactionInfo,
  items,
  totals,
  className = '',
  style,
  printMode: controlledPrintMode,
  onPrintModeChange,
  paperSize = '80mm',
  customConfig: controlledCustomConfig
}: ThermalReceiptProps) {
  const { formatCurrency } = useCurrency();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [localPrintMode, setLocalPrintMode] = useState<'all' | 'kitchen' | 'bar' | 'checker'>('all');
  
  const printMode = controlledPrintMode ?? localPrintMode;
  const setPrintMode = onPrintModeChange ?? setLocalPrintMode;
  
  const isCancelled = transactionInfo.status === 'CANCELLED' || transactionInfo.status === 'VOID';
  const isCash = (() => {
    const m = (transactionInfo.paymentMethod || '').toLowerCase().trim();
    return m === 'cash' || m === 'tunai';
  })();
  const isCompliment = (() => {
    const m = (transactionInfo.paymentMethod || '').toLowerCase().trim();
    return m === 'compliment' || (items.length > 0 && items.every(i => i.isCompliment));
  })();

  const [customConfig, setCustomConfig] = useState<any>(null);
  const [activeHotelCode, setActiveHotelCode] = useState<string>('1');

  useEffect(() => {
    // Check if running in browser
    if (typeof window !== 'undefined') {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
        return '';
      };

      let code =
        localStorage.getItem('active_hotel_code') ||
        localStorage.getItem('hotelCode') ||
        getCookie('hotelCode') ||
        '';

      if (!code) {
        const userJson = localStorage.getItem('user');
        if (userJson) {
          try {
            const parsed = JSON.parse(userJson);
            code = parsed.hotelCode || '';
          } catch (e) {}
        }
      }
      if (!code) code = '1';
      setActiveHotelCode(code);

      // Realtime listener from Firestore so all cashier workstations get synced
      const receiptRef = doc(db, 'hotels', code, 'settings', 'pos_receipt');
      const unsubFirestore = onSnapshot(receiptRef, (snap) => {
        if (snap.exists()) {
          const cloudConfig = snap.data();
          setCustomConfig(cloudConfig);
          if (cloudConfig.logoUrl) {
            setLogoUrl(cloudConfig.logoUrl);
          }
        }
      }, (err) => {
        console.warn('ThermalReceipt Firestore sync note:', err);
      });

      const updateLogo = () => {
        const savedLogo = localStorage.getItem('shopLogo');
        if (savedLogo) setLogoUrl(savedLogo);
        try {
          const cfg = localStorage.getItem('posReceiptConfig');
          if (cfg) setCustomConfig((prev: any) => ({ ...prev, ...JSON.parse(cfg) }));
        } catch (e) {}
      };
      updateLogo();
      window.addEventListener('logoChanged', updateLogo);
      window.addEventListener('receiptConfigChanged', updateLogo);
      window.addEventListener('storage', updateLogo);
      return () => {
        unsubFirestore();
        window.removeEventListener('logoChanged', updateLogo);
        window.removeEventListener('receiptConfigChanged', updateLogo);
        window.removeEventListener('storage', updateLogo);
      };
    }
  }, []);

  const activeConfig = controlledCustomConfig !== undefined ? controlledCustomConfig : customConfig;
  const effectiveLogoUrl = controlledCustomConfig !== undefined 
    ? (controlledCustomConfig.showLogo ? (controlledCustomConfig.logoUrl || logoUrl) : null)
    : (activeConfig?.showLogo === false ? null : (logoUrl || activeConfig?.logoUrl));

  // Helper to determine if an item is a beverage
  const isBeverage = (cat: string, sub: string) => {
    const c = (cat || '').toLowerCase();
    const s = (sub || '').toLowerCase();
    return (
      c.includes('beverage') || 
      c.includes('minuman') || 
      c.includes('drink') || 
      c.includes('bar') || 
      c.includes('kopi') || 
      c.includes('coffee') ||
      c.includes('juice') ||
      c.includes('tea') ||
      s.includes('beverage') ||
      s.includes('minuman') ||
      s.includes('drink') ||
      s.includes('bar') ||
      s.includes('kopi') ||
      s.includes('coffee')
    );
  };

  // Filter items based on print mode
  const filteredItems = items.filter(item => {
    if (printMode === 'kitchen') {
      return !isBeverage(item.category, item.subcategory);
    }
    if (printMode === 'bar') {
      return isBeverage(item.category, item.subcategory);
    }
    return true; // 'all'
  });

  // Group items
  const grouped: Record<string, Record<string, ReceiptItemData[]>> = {};
  const categoryTotals: Record<string, number> = {};

  filteredItems.forEach(item => {
    const cat = item.category || 'Lainnya';
    const sub = item.subcategory || '—';
    if (!grouped[cat]) {
      grouped[cat] = {};
      categoryTotals[cat] = 0;
    }
    if (!grouped[cat][sub]) grouped[cat][sub] = [];
    grouped[cat][sub].push(item);
    
    // Total for category
    if (!item.isCompliment) {
      const addonsTotal = item.selectedAddons ? item.selectedAddons.reduce((sum, a) => sum + a.price, 0) : 0;
      categoryTotals[cat] += (item.price + addonsTotal) * item.quantity;
    }
  });

  const sortedCats = Object.keys(grouped).sort();
  const displayDate = formatReceiptDate(transactionInfo.date);
  const rawTable = transactionInfo.tableName;
  const isTakeAway = !rawTable || 
    rawTable.toLowerCase().includes('take') || 
    rawTable === '-' || 
    rawTable === '—';
  const displayTable = isTakeAway 
    ? 'Take Away' 
    : (rawTable.toLowerCase().includes('meja') 
        ? rawTable 
        : `Meja ${rawTable}`);

  const isGeneralGuest = !transactionInfo.customerName || 
    transactionInfo.customerName.toLowerCase() === 'walk-in customer' || 
    transactionInfo.customerName.toLowerCase() === 'walk-in' ||
    transactionInfo.customerName.toLowerCase() === 'guest' || 
    transactionInfo.customerName.toLowerCase() === 'tamu umum';
  const displayCustomer = isGeneralGuest ? 'Tamu Umum' : transactionInfo.customerName;

  const displayCashier = transactionInfo.cashierName || 'Master Superadmin';
  const isKot = printMode === 'kitchen' || printMode === 'bar';
  const is58mm = paperSize === '58mm';

  return (
    <div 
      id="thermal-receipt-printable"
      className={`receipt-print-wrapper w-full ${is58mm ? 'max-w-[58mm] p-[2mm] text-[9.5px]' : 'max-w-[80mm] p-[2mm] text-[10.5px]'} bg-white text-black text-left mx-auto font-normal ${className}`}
      style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', lineHeight: '1.3', ...style }}
    >
      <style>{`
        @media print {
          @page {
            margin: 0 !important;
            size: auto !important;
          }

          *, *::before, *::after {
            box-sizing: border-box !important;
          }

          /* Force root and body to exact thermal paper width */
          html, body {
            width: ${is58mm ? '58mm' : '80mm'} !important;
            min-width: ${is58mm ? '58mm' : '80mm'} !important;
            max-width: ${is58mm ? '58mm' : '80mm'} !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            box-sizing: border-box !important;
          }

          /* Unfix Radix portal and modal dialog so it flows straight onto paper without offset */
          [data-radix-portal] {
            position: static !important;
            display: block !important;
            width: ${is58mm ? '58mm' : '80mm'} !important;
            max-width: ${is58mm ? '58mm' : '80mm'} !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          [role="alertdialog"],
          div[data-state="open"][role="alertdialog"],
          [role="dialog"] {
            position: static !important;
            display: block !important;
            transform: none !important;
            left: 0 !important;
            top: 0 !important;
            right: auto !important;
            bottom: auto !important;
            width: ${is58mm ? '58mm' : '80mm'} !important;
            max-width: ${is58mm ? '58mm' : '80mm'} !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #fff !important;
          }

          /* Unconstrain all intermediate dialog container divs */
          [role="alertdialog"] div {
            overflow: visible !important;
            max-height: none !important;
          }

          /* Receipt Wrapper in-flow on paper sheet */
          .receipt-print-wrapper {
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: ${is58mm ? '58mm' : '80mm'} !important;
            min-width: ${is58mm ? '58mm' : '80mm'} !important;
            max-width: ${is58mm ? '58mm' : '80mm'} !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: ${is58mm ? '2mm 2.5mm 4mm 2.5mm' : '4mm 3.5mm 6mm 3.5mm'} !important;
            box-sizing: border-box !important;
            -webkit-font-smoothing: none !important;
            -moz-osx-font-smoothing: none !important;
            text-rendering: optimizeSpeed !important;
            background: #fff !important;
            color: #000 !important;
            box-shadow: none !important;
            border: none !important;
            display: block !important;
            visibility: visible !important;
            overflow: visible !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            ${is58mm ? 'font-size: 10px !important; line-height: 1.25 !important;' : 'font-size: 12px !important; line-height: 1.35 !important;'}
          }

          /* Force all receipt children: black text, transparent background, no shadows */
          .receipt-print-wrapper * {
            visibility: visible !important;
            color: #000 !important;
            background-color: transparent !important;
            background: transparent !important;
            text-shadow: none !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            animation: none !important;
            transition: none !important;
          }

          /* Keep borders and divider lines visible in print */
          .receipt-print-wrapper [style*="border"],
          .receipt-print-wrapper hr {
            border-color: #000 !important;
          }

          .receipt-print-wrapper img {
            opacity: 1 !important;
            background: transparent !important;
            visibility: visible !important;
            display: block !important;
          }

          .powered-by-logo {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            height: ${is58mm ? '18px' : '24px'} !important;
            width: auto !important;
          }

          /* Ensure all buttons, headers, selectors stay hidden */
          .print\\:hidden,
          [data-radix-portal] .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>

      {/* ── KOT Header (Dapur / Bar) ── */}
      {isKot ? (
        <div className="w-full mb-0">
          {/* Station Banner */}
          <div
            className="w-full text-center py-1.5 mb-1.5"
            style={{
              border: '2px solid #000',
              borderRadius: '2px',
            }}
          >
            <div
              className="font-mono font-black uppercase tracking-[0.1em] leading-none"
              style={{ fontSize: is58mm ? '12px' : '15px' }}
            >
              {printMode === 'kitchen' ? '▶ TIKET DAPUR' : '▶ TIKET BAR'}
            </div>
            <div className="font-mono text-[8px] uppercase tracking-widest mt-0.5">
              {printMode === 'kitchen' ? 'KITCHEN ORDER TICKET' : 'BAR ORDER TICKET'}
            </div>
          </div>

          {/* Order meta row */}
          <div className="flex justify-between items-start mb-1">
            {/* Order number – big */}
            <div>
              <div className="text-[7.5px] font-mono uppercase tracking-widest text-black leading-none mb-[1px]">
                No. Order
              </div>
              <div
                className="font-mono font-black text-black leading-none"
                style={{ fontSize: is58mm ? '18px' : '22px', letterSpacing: '-0.01em' }}
              >
                {String(transactionInfo.id.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffffff, 0) % 900000 + 100000)}
              </div>
            </div>
            {/* Time + Cashier + Meja */}
            <div className="text-right">
              <div className="font-mono font-bold text-[8.5px] text-black">{displayDate}</div>
              {transactionInfo.tableName && (
                <div className="font-mono text-[8.5px] text-black mt-[1px]">
                  Meja: <span className="font-bold">{transactionInfo.tableName}</span>
                </div>
              )}
              {transactionInfo.customerName && (
                <div className="font-mono text-[8.5px] text-black mt-[1px]">
                  Tamu: <span className="font-extrabold text-[9px] uppercase tracking-wide">{transactionInfo.customerName}</span>
                </div>
              )}
              {transactionInfo.cashierName && (
                <div className="font-mono text-[8px] text-neutral-800 mt-[1px]">
                  Kasir: <span className="font-semibold">{transactionInfo.cashierName}</span>
                </div>
              )}
            </div>
          </div>

          {isCancelled && (
            <div
              className="w-full text-center font-black text-[13px] uppercase font-mono tracking-widest py-1.5 my-1.5"
              style={{ border: '2px solid #000' }}
            >
              ✕ VOID / BATAL ✕
              {transactionInfo.cancelReason && (
                <div className="text-[8.5px] mt-1 font-normal italic lowercase">
                  Alasan: {transactionInfo.cancelReason}
                </div>
              )}
            </div>
          )}

          <div style={{ borderTop: '2px solid #000', marginTop: '4px', marginBottom: '6px' }} />
        </div>
      ) : (
        /* ── Kasir & Checker Full Header (Exact Match to LexuPOS) ── */
        <div className="text-center mb-2 flex flex-col items-center">
          {effectiveLogoUrl && (
            <div className="flex justify-center items-center w-full mb-1">
              <img 
                src={effectiveLogoUrl} 
                alt="Store Logo" 
                className="store-logo" 
                style={{ 
                  maxWidth: is58mm ? '36mm' : '44mm', 
                  maxHeight: is58mm ? '16mm' : '20mm', 
                  width: 'auto', 
                  height: 'auto', 
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto 4px auto',
                  filter: 'grayscale(100%) brightness(0)',
                  imageRendering: 'crisp-edges'
                }} 
              />
            </div>
          )}
          <h2 
            className={`store-title ${is58mm ? 'text-[13px]' : 'text-[15px]'} font-sans font-bold uppercase tracking-wide m-0 mt-0.5 mb-1 leading-tight text-center`} 
          >
            {shopInfo.name}
          </h2>
          {Boolean((activeConfig?.npwp || activeConfig?.headerNote || '').trim()) && (
            <p className={`${is58mm ? 'text-[7.5px]' : 'text-[8.5px]'} mt-[0.5px] mb-0 leading-tight text-neutral-600 font-medium max-w-[95%] text-center font-mono`}>
              {(() => {
                const val = (activeConfig?.npwp || activeConfig?.headerNote || '').trim();
                if (!val) return null;
                return /^npwp/i.test(val) ? val : `NPWP: ${val}`;
              })()}
            </p>
          )}
          {Boolean(shopInfo.address?.trim()) && (
            <p className={`${is58mm ? 'text-[8px]' : 'text-[9px]'} mt-[1px] mb-0 leading-tight text-neutral-600 font-medium max-w-[95%] text-center`}>
              {shopInfo.address.trim()}
            </p>
          )}
          {Boolean(shopInfo.phone?.trim()) && (
            <p className={`${is58mm ? 'text-[8.5px]' : 'text-[9px]'} mt-[1px] mb-0 leading-tight font-semibold text-neutral-800 text-center`}>
              Tlp: {shopInfo.phone.trim()}
            </p>
          )}
          {printMode === 'checker' && (
            <div className={`w-full text-center font-bold ${is58mm ? 'text-[10px]' : 'text-[12px]'} border-2 border-black py-1 my-2 uppercase font-mono tracking-widest text-black bg-neutral-100 print:bg-transparent`}>
              *** STRUK CHECKER ***
            </div>
          )}
        </div>
      )}

      {/* Kasir & Checker mode: dashed separator + transaction info */}
      {(printMode === 'all' || printMode === 'checker') && (
        <>
          <div style={{ borderTop: '1px dashed #cccccc', margin: '5px 0' }} />
          {isCancelled && (
            <div className="w-full text-center font-bold text-[12px] border-2 border-black py-2 my-2 uppercase font-mono tracking-widest">
              *** VOID / BATAL ***
              {transactionInfo.cancelReason && (
                <div className="text-[8.5px] mt-1 font-normal italic lowercase leading-tight">Alasan: {transactionInfo.cancelReason}</div>
              )}
            </div>
          )}
          <div className={`${is58mm ? 'text-[8.5px]' : 'text-[9.5px]'} flex flex-col gap-[2px] mb-1`}>
            {activeConfig?.showOrderNumber !== false && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-normal">No. Transaksi:</span>
                <span className="font-bold">{transactionInfo.id}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-neutral-500 font-normal">Tanggal:</span>
              <span className="font-bold">{displayDate}</span>
            </div>
            {activeConfig?.showTable !== false && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-normal">Meja:</span>
                <span className="font-bold">{displayTable}</span>
              </div>
            )}
            {activeConfig?.showCustomer !== false && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-normal">Pelanggan:</span>
                <span className="font-bold">{displayCustomer}</span>
              </div>
            )}
            {activeConfig?.showCashier !== false && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-normal">Kasir:</span>
                <span className="font-bold">{displayCashier}</span>
              </div>
            )}
            {printMode === 'checker' && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-normal">Tipe Dokumen:</span>
                <span className="font-bold uppercase">CHECKER PESANAN</span>
              </div>
            )}
            {transactionInfo.status === 'UNPAID' && (
              <div className="w-full text-center font-extrabold text-[10px] border border-black py-0.5 my-1 uppercase font-mono tracking-wider">
                *** BELUM LUNAS / UNPAID ***
              </div>
            )}
          </div>
          <div style={{ borderTop: '1px dashed #cccccc', margin: '5px 0' }} />
        </>
      )}

      {/* Items List (Exact Match: Bold Category, Name, Price, and 1 x Rp line) */}
      {sortedCats.map((cat) => (
        <div key={cat} className="mb-2">
          {/* Category header */}
          {activeConfig?.groupByCategory !== false && (
            <div
              className={`${is58mm ? 'text-[8.5px]' : 'text-[9.5px]'} font-bold uppercase tracking-wider pb-[2px] mb-[5px]`}
              style={{ borderBottom: '1px solid #dddddd' }}
            >
              {cat}
            </div>
          )}
          
          <div className="flex flex-col gap-1.5">
            {Object.keys(grouped[cat]).sort().map(sub => (
              <React.Fragment key={sub}>
                {grouped[cat][sub].map((item, i) => {
                  const addonsTotal = item.selectedAddons ? item.selectedAddons.reduce((sum, a) => sum + a.price, 0) : 0;
                  const itemPrice = item.price + addonsTotal;

                  return (
                    <div key={i} className={`flex flex-col ${is58mm ? 'text-[8.5px]' : 'text-[9.5px]'} w-full ${isCancelled ? 'line-through text-neutral-400 opacity-70' : ''}`}>
                      <div className="flex justify-between items-start gap-1">
                        <span className={`font-bold ${is58mm ? 'text-[8.5px]' : 'text-[9.5px]'} uppercase text-neutral-900 leading-tight flex-1 pr-1 break-words`}>
                          {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.name}
                          {item.isCompliment && (
                            <span className="text-[7px] ml-1 border border-neutral-800 text-neutral-900 px-1 rounded-sm font-semibold inline-block">
                              COMPLIMENT
                            </span>
                          )}
                        </span>
                        <span className={`font-bold ${is58mm ? 'text-[8.5px]' : 'text-[9.5px]'} whitespace-nowrap text-right text-neutral-900 shrink-0`}>
                          {item.isCompliment ? formatCurrency(0) : formatCurrency(itemPrice * item.quantity)}
                        </span>
                      </div>
                      {activeConfig?.showNotes !== false && item.selectedAddons && item.selectedAddons.length > 0 && (
                        <div className={`${is58mm ? 'text-[7px]' : 'text-[8px]'} text-neutral-500 pl-2 mt-[0.5px]`}>
                          + {item.selectedAddons.map(a => a.name).join(', ')}
                        </div>
                      )}
                      {activeConfig?.showNotes !== false && item.note && (
                        <div className={`${is58mm ? 'text-[7px]' : 'text-[8px]'} italic text-neutral-500 pl-2 mt-[0.5px]`}>
                          Catatan: {item.note}
                        </div>
                      )}
                      {(item.quantity > 1 || (item.isCompliment && item.complimentReason)) && (
                        <div className={`${is58mm ? 'text-[7.5px]' : 'text-[8px]'} text-neutral-400 pl-2 mt-[0.5px]`}>
                          {item.quantity > 1 && `@ ${formatCurrency(itemPrice)}`}
                          {item.isCompliment && item.complimentReason && ` (${item.complimentReason})`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}

      {(printMode === 'all' || printMode === 'checker') && (
        <>
          <div style={{ borderTop: '1px dashed #cccccc', margin: '5px 0' }} />

          {/* Totals */}
          <div className={`flex flex-col gap-[2px] ${is58mm ? 'text-[8.5px]' : 'text-[9.5px]'}`}>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500 font-normal">Subtotal:</span>
              <span className="font-bold">{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <span className="font-normal">Diskon:</span>
                  <span className="font-bold">-{formatCurrency(totals.discount)}</span>
                </div>
                <div className="flex justify-between items-center font-bold">
                  <span>Setelah Diskon:</span>
                  <span>{formatCurrency(totals.subtotal - totals.discount)}</span>
                </div>
              </>
            )}
            {activeConfig?.showTaxService !== false && totals.serviceAmount !== undefined && totals.serviceAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-normal">Service Charge ({totals.serviceRate || 5}%):</span>
                <span className="font-bold">+{formatCurrency(totals.serviceAmount)}</span>
              </div>
            )}
            {activeConfig?.showTaxService !== false && totals.taxAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-normal">Pajak Resto (PB1) ({totals.taxRate || 10}%):</span>
                <span className="font-bold">+{formatCurrency(totals.taxAmount)}</span>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px dashed #cccccc', margin: '5px 0' }} />

          <div className={`flex justify-between items-center font-black ${is58mm ? 'text-[11px]' : 'text-[12.5px]'} py-1`}>
            <span>TOTAL TAGIHAN:</span>
            <span>{formatCurrency(totals.payableAmount)}</span>
          </div>

          <div style={{ borderTop: '1px dashed #cccccc', margin: '5px 0' }} />

          <div className={`flex flex-col gap-[2px] ${is58mm ? 'text-[8.5px]' : 'text-[9.5px]'}`}>
            {activeConfig?.showPaymentMethod !== false && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-normal">Metode Pembayaran:</span>
                <span className="font-bold uppercase">
                  {transactionInfo.status === 'UNPAID' ? 'BELUM BAYAR' : formatPaymentMethod(transactionInfo.paymentMethod)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-neutral-500 font-normal">Status:</span>
              <span className="font-bold uppercase">
                {transactionInfo.status === 'UNPAID'
                  ? 'BELUM BAYAR (UNPAID)'
                  : isCancelled
                  ? 'VOID / BATAL'
                  : 'LUNAS (PAID)'}
              </span>
            </div>

            {isCash && totals.cashAmount !== undefined && totals.cashAmount > 0 && (
              <>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-neutral-500 font-normal">Tunai Diterima:</span>
                  <span className="font-bold">{formatCurrency(totals.cashAmount)}</span>
                </div>
                <div className="flex justify-between items-center font-bold">
                  <span>Kembalian:</span>
                  <span>{formatCurrency(totals.changeAmount || 0)}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {printMode === 'checker' ? (
            <div className="text-center text-[9px] leading-relaxed mt-4 mb-2 font-mono">
              <div style={{ borderTop: '1px dashed #cccccc', margin: '6px 0' }} />
              <p className="m-0 font-bold uppercase tracking-wider text-[9.5px]">
                *** NOTED: BUKAN NOTA / STRUK PEMBAYARAN SAH ***
              </p>
              <p className="m-0 text-neutral-500 text-[8px] mt-1 leading-snug">
                Struk ini adalah lembar checker untuk pengecekan pesanan internal dan bukan tanda terima / bukti pembayaran yang sah.
              </p>
              <div style={{ borderBottom: '1px dashed #cccccc', margin: '6px 0' }} />
            </div>
          ) : (
            <>
              <div style={{ borderTop: '1px dashed #cccccc', margin: '6px 0' }} />
              <div style={{ textAlign: 'center', fontSize: '8.5px', lineHeight: '1.4', margin: '6px 0' }}>
                {Boolean(activeConfig?.footerMessage?.trim()) && (
                  <p style={{ margin: 0, fontWeight: 500, fontSize: '8.5px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                    {activeConfig.footerMessage.trim()}
                  </p>
                )}
                {(() => {
                  const parts = [
                    activeConfig?.instagram?.trim() && `IG: ${activeConfig.instagram.trim()}`,
                    activeConfig?.facebook?.trim()  && `FB: ${activeConfig.facebook.trim()}`,
                    activeConfig?.tiktok?.trim()    && `Tiktok: ${activeConfig.tiktok.trim()}`,
                  ].filter(Boolean);
                  const socialLine = parts.join(' · ');
                  if (!socialLine) return null;
                  return (
                    <p style={{ margin: '3px 0 0 0', fontSize: '8px', letterSpacing: '0.01em' }}>
                      {socialLine}
                    </p>
                  );
                })()}
                {activeConfig?.qrType === 'wifi' && (
                  activeConfig?.wifiInfo?.trim() ? (
                    <p style={{ margin: '2px 0 0 0', fontSize: '8px', color: '#555555' }}>{activeConfig.wifiInfo.trim()}</p>
                  ) : (activeConfig?.wifiSsid?.trim() ? (
                    <p style={{ margin: '2px 0 0 0', fontSize: '8px', color: '#555555' }}>
                      SSID: {activeConfig.wifiSsid.trim()} {activeConfig?.wifiPassword?.trim() ? `(Pass: ${activeConfig.wifiPassword.trim()})` : ''}
                    </p>
                  ) : null)
                )}
                {(() => {
                  const qrType = activeConfig?.qrType || (activeConfig?.showQrFooter === false ? 'none' : 'estruk');
                  if (qrType === 'none') return null;

                  let qrData = '';
                  let qrLabel = '';

                  if (qrType === 'wifi') {
                    const ssid = activeConfig?.wifiSsid || '';
                    const pass = activeConfig?.wifiPassword || '';
                    const sec = activeConfig?.wifiSecurity || (pass ? 'WPA' : 'nopass');
                    if (!ssid) return null;
                    qrData = `WIFI:S:${ssid};T:${sec};P:${pass};;`;
                    qrLabel = activeConfig?.qrCustomLabel || `Scan untuk WiFi: ${ssid}`;
                  } else if (qrType === 'website') {
                    qrData = activeConfig?.websiteUrl || activeConfig?.qrFooterUrl || 'https://mytara.id';
                    qrLabel = activeConfig?.qrCustomLabel || 'Scan untuk Buka Website / Menu';
                  } else {
                    // 'estruk' (Real public web address so guests can scan from anywhere, including at home)
                    const baseDomain = activeConfig?.receiptDomain?.trim() || 'https://point.mytara.id';
                    const origin = baseDomain.replace(/\/+$/, '');

                    const txId = transactionInfo.id || 'ORD-9821';
                    const hotelCode = activeConfig?.hotelCode || activeHotelCode || '1';
                    qrData = `${origin}/receipt?id=${encodeURIComponent(txId)}&h=${encodeURIComponent(hotelCode)}`;
                    qrLabel = activeConfig?.qrCustomLabel || 'Scan untuk e-Struk Digital';
                  }

                  return (
                    <ThermalReceiptQr 
                      data={qrData} 
                      label={qrLabel} 
                      size={is58mm ? 84 : 96} 
                    />
                  );
                })()}
              </div>
            </>
          )}

          {/* Powered By Footer */}
          <div
            className="powered-by-container"
            style={{
              marginTop: '12px',
              paddingTop: '0',
              paddingBottom: '4px',
              borderTop: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <a href="https://mytara.id" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
              <span style={{ fontSize: '7px', color: '#bbbbbb', letterSpacing: '0.12em', textTransform: 'lowercase', fontWeight: 600, marginBottom: '3px', display: 'block', lineHeight: 1 }}>powered by</span>
              <img src="/channels/1.png" alt="My Tara" className="powered-by-logo" style={{ height: '14px', width: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
            </a>
          </div>
        </>
      )}
    </div>
  );
}
