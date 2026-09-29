'use client';
import React, { useEffect, useState } from 'react';
import { useCurrency } from '@/hooks/useCurrency';

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

export default function ThermalReceipt({
  shopInfo,
  transactionInfo,
  items,
  totals,
  className = '',
  style,
  printMode: controlledPrintMode,
  onPrintModeChange,
  paperSize = '80mm'
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

  useEffect(() => {
    // Check if running in browser
    if (typeof window !== 'undefined') {
      const updateLogo = () => {
        const savedLogo = localStorage.getItem('shopLogo');
        setLogoUrl(savedLogo || null);
      };
      updateLogo();
      window.addEventListener('logoChanged', updateLogo);
      window.addEventListener('storage', updateLogo);
      return () => {
        window.removeEventListener('logoChanged', updateLogo);
        window.removeEventListener('storage', updateLogo);
      };
    }
  }, []);

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
      className={`receipt-print-wrapper w-full ${is58mm ? 'max-w-[58mm] p-[3mm] text-[10.5px]' : 'max-w-[80mm] p-[6mm] text-xs'} bg-white text-black text-left mx-auto font-normal ${className}`}
      style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', ...style }}
    >
      <style>{`
        @media print {
          @page {
            margin: 0 !important;
            size: ${is58mm ? '58mm' : '80mm'};
            size: ${is58mm ? '58mm auto' : '80mm auto'} !important;
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

          /* Hide all main application pages outside portal */
          body > *:not([data-radix-portal]) {
            display: none !important;
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
          {logoUrl && (
            <img 
              src={logoUrl} 
              alt="Store Logo" 
              className={`${is58mm ? 'w-[24mm]' : 'w-[36mm]'} h-auto object-contain mb-2`} 
              style={{ filter: 'grayscale(100%) brightness(0)' }} 
            />
          )}
          <h2 
            className={`${is58mm ? 'text-[13.5px]' : 'text-[17px]'} font-serif font-light uppercase tracking-[0.12em] m-0 mt-0.5 mb-1 leading-tight text-center`} 
            style={{ transform: is58mm ? 'scaleY(1.15) scaleX(0.95)' : 'scaleY(1.3) scaleX(0.9)', transformOrigin: 'center' }}
          >
            {shopInfo.name}
          </h2>
          {shopInfo.address && (
            <p className={`${is58mm ? 'text-[8px]' : 'text-[9px]'} mt-[1px] mb-0 leading-tight text-neutral-600 font-medium max-w-[95%] text-center`}>
              {shopInfo.address}
            </p>
          )}
          {shopInfo.phone && (
            <p className={`${is58mm ? 'text-[8.5px]' : 'text-[9px]'} mt-[1px] mb-0 leading-tight font-semibold text-neutral-800 text-center`}>
              Tlp: {shopInfo.phone}
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
          <div className="border-t border-dashed border-black my-1.5" />
          {isCancelled && (
            <div className="w-full text-center font-bold text-[12px] border-2 border-black py-2 my-2 uppercase font-mono tracking-widest text-black">
              *** VOID / BATAL ***
              {transactionInfo.cancelReason && (
                <div className="text-[8.5px] mt-1 font-normal italic lowercase leading-tight">Alasan: {transactionInfo.cancelReason}</div>
              )}
            </div>
          )}
          <div className={`${is58mm ? 'text-[8.5px]' : 'text-[9.5px]'} flex flex-col gap-[2px] mb-1.5`}>
            <div className="flex justify-between">
              <span className="text-neutral-700">No. Transaksi:</span>
              <span className="font-bold">{transactionInfo.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-700">Tanggal:</span>
              <span className="font-bold">{displayDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-700">Meja:</span>
              <span className="font-bold">{displayTable}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-700">Pelanggan:</span>
              <span className="font-bold">{displayCustomer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-700">Kasir:</span>
              <span className="font-bold">{displayCashier}</span>
            </div>
            {printMode === 'checker' && (
              <div className="flex justify-between">
                <span className="text-neutral-700">Tipe Dokumen:</span>
                <span className="font-bold uppercase text-black">CHECKER PESANAN</span>
              </div>
            )}
            {transactionInfo.status === 'UNPAID' && (
              <div className="w-full text-center font-extrabold text-[10.5px] border border-black text-black py-1 my-1.5 uppercase font-mono tracking-wider">
                *** BELUM LUNAS / UNPAID ***
              </div>
            )}
          </div>
          <div className="border-t border-dashed border-black my-1.5" />
        </>
      )}

      {/* Items List (Exact Match: Bold Category, Name, Price, and 1 x Rp line) */}
      {sortedCats.map((cat) => (
        <div key={cat} className="mb-2.5">
          {/* Category header */}
          <div className={`${is58mm ? 'text-[9px]' : 'text-[10px]'} font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1 text-black`}>
            {cat}
          </div>
          
          <div className="flex flex-col gap-1.5">
            {Object.keys(grouped[cat]).sort().map(sub => (
              <React.Fragment key={sub}>
                {grouped[cat][sub].map((item, i) => {
                  const addonsTotal = item.selectedAddons ? item.selectedAddons.reduce((sum, a) => sum + a.price, 0) : 0;
                  const itemPrice = item.price + addonsTotal;

                  return (
                    <div key={i} className={`flex flex-col ${is58mm ? 'text-[9px]' : 'text-[10px]'} w-full ${isCancelled ? 'line-through text-neutral-500 opacity-70' : ''}`}>
                      <div className="flex justify-between items-start gap-1">
                        <span className={`font-bold ${is58mm ? 'text-[9px]' : 'text-[10px]'} uppercase text-black leading-tight flex-1 pr-1 break-words`}>
                          {item.name}
                          {item.isCompliment && (
                            <span className="text-[7px] ml-1 border border-black text-black px-1 rounded-sm font-semibold inline-block">
                              COMPLIMENT
                            </span>
                          )}
                        </span>
                        <span className={`font-bold ${is58mm ? 'text-[9px]' : 'text-[10px]'} whitespace-nowrap text-right text-black shrink-0`}>
                          {item.isCompliment ? formatCurrency(0) : formatCurrency(itemPrice * item.quantity)}
                        </span>
                      </div>
                      {item.selectedAddons && item.selectedAddons.length > 0 && (
                        <div className={`${is58mm ? 'text-[7.5px]' : 'text-[8.5px]'} text-neutral-600 mt-[1px]`}>
                          + {item.selectedAddons.map(a => a.name).join(', ')}
                        </div>
                      )}
                      {item.note && (
                        <div className={`${is58mm ? 'text-[7.5px]' : 'text-[8.5px]'} italic text-neutral-600 mt-[1px]`}>
                          Catatan: {item.note}
                        </div>
                      )}
                      <div className={`${is58mm ? 'text-[8px]' : 'text-[8.5px]'} text-neutral-600 mt-[0.5px]`}>
                        {item.quantity} x {formatCurrency(itemPrice)}
                        {item.isCompliment && item.complimentReason && ` (${item.complimentReason})`}
                      </div>
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
          <div className="border-t border-dashed border-black my-1.5" />

          {/* Totals (Exact Match to LexuPOS) */}
          <div className={`flex flex-col gap-[2px] ${is58mm ? 'text-[8.5px]' : 'text-[9.5px]'}`}>
            <div className="flex justify-between">
              <span className="text-neutral-700">Subtotal:</span>
              <span className="font-bold">{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 && (
              <>
                <div className="flex justify-between text-neutral-700">
                  <span>Diskon:</span>
                  <span className="font-bold">-{formatCurrency(totals.discount)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Setelah Diskon:</span>
                  <span>{formatCurrency(totals.subtotal - totals.discount)}</span>
                </div>
              </>
            )}
            {totals.serviceAmount !== undefined && totals.serviceAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-700">Service Charge ({totals.serviceRate || 5}%):</span>
                <span className="font-bold">+{formatCurrency(totals.serviceAmount)}</span>
              </div>
            )}
            {totals.taxAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-700">Pajak Resto (PB1) ({totals.taxRate || 10}%):</span>
                <span className="font-bold">+{formatCurrency(totals.taxAmount)}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-black my-1.5" />

          <div className={`flex justify-between font-bold ${is58mm ? 'text-[10.5px]' : 'text-[12px]'} py-0.5`}>
            <span>TOTAL TAGIHAN:</span>
            <span>{formatCurrency(totals.payableAmount)}</span>
          </div>

          <div className="border-t border-dashed border-black my-1.5" />

          <div className={`flex flex-col gap-[2px] ${is58mm ? 'text-[8.5px]' : 'text-[9.5px]'}`}>
            <div className="flex justify-between">
              <span className="text-neutral-700">Metode Pembayaran:</span>
              <span className="font-bold uppercase text-black">
                {transactionInfo.status === 'UNPAID' ? 'BELUM BAYAR' : formatPaymentMethod(transactionInfo.paymentMethod)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-700">Status:</span>
              <span className="font-bold uppercase text-black">
                {transactionInfo.status === 'UNPAID' ? (
                  <span className="text-red-600">BELUM BAYAR (UNPAID)</span>
                ) : isCancelled ? (
                  <span className="text-red-600">VOID / BATAL</span>
                ) : (
                  'LUNAS (PAID)'
                )}
              </span>
            </div>

            {isCash && totals.cashAmount !== undefined && totals.cashAmount > 0 && (
              <>
                <div className="flex justify-between pt-0.5">
                  <span className="text-neutral-700">Tunai Diterima:</span>
                  <span className="font-bold">{formatCurrency(totals.cashAmount)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Kembalian:</span>
                  <span>{formatCurrency(totals.changeAmount || 0)}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {printMode === 'checker' ? (
            <div className="text-center text-[9px] leading-relaxed mt-4 mb-2 font-mono">
              <div className="border-t border-dashed border-black my-2" />
              <p className="m-0 font-bold uppercase tracking-wider text-[9.5px] text-black">
                *** NOTED: BUKAN NOTA / STRUK PEMBAYARAN SAH ***
              </p>
              <p className="m-0 text-neutral-600 text-[8px] mt-1 leading-snug">
                Struk ini adalah lembar checker untuk pengecekan pesanan internal dan bukan tanda terima / bukti pembayaran yang sah.
              </p>
              <div className="border-b border-dashed border-black my-2" />
            </div>
          ) : (
            <div className="text-center text-[9px] leading-relaxed text-neutral-600 mt-5 mb-2">
              <p className="m-0 font-medium">Terima kasih atas kunjungan Anda</p>
              <p className="m-0 text-neutral-500 text-[8px] mt-0.5">Struk ini adalah bukti pembayaran yang sah</p>
            </div>
          )}

          {/* Powered By Footer */}
          <div className="flex flex-col items-center justify-center mt-3 pt-2 border-t border-dotted border-neutral-300">
            <a href="https://mytara.id" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center no-underline text-inherit cursor-pointer">
              <span className="text-[7.5px] text-neutral-500 lowercase tracking-widest font-black mb-1">powered by</span>
              <img src="/channels/1.png" alt="My Tara" className="powered-by-logo h-6 w-auto object-contain" />
            </a>
          </div>
        </>
      )}
    </div>
  );
}
