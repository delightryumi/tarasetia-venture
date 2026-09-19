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
  printMode?: 'all' | 'kitchen' | 'bar';
  onPrintModeChange?: (mode: 'all' | 'kitchen' | 'bar') => void;
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
  onPrintModeChange
}: ThermalReceiptProps) {
  const { formatCurrency } = useCurrency();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [localPrintMode, setLocalPrintMode] = useState<'all' | 'kitchen' | 'bar'>('all');
  
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
      const savedLogo = localStorage.getItem('shopLogo');
      if (savedLogo) {
        setLogoUrl(savedLogo);
      }
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

  return (
    <div 
      className={`receipt-print-wrapper w-full max-w-[80mm] bg-white text-black p-[6mm] text-left mx-auto print:mx-0 print:px-[6mm] print:py-2 print:w-full print:max-w-full font-normal ${className}`}
      style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', ...style }}
    >
      <style>{`
        @media print {
          @page {
            margin: 0 !important;
            size: auto !important;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            visibility: hidden !important;
          }

          .receipt-print-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 4mm !important;
            -webkit-font-smoothing: none !important;
            -moz-osx-font-smoothing: none !important;
            text-rendering: optimizeSpeed !important;
            background: #fff !important;
            color: #000 !important;
            box-shadow: none !important;
            border: none !important;
            visibility: visible !important;
          }
          /* Force all children: black text, white background, no shadows */
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
          /* Keep borders and lines visible */
          .receipt-print-wrapper [style*="border"] {
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
            height: 24px !important;
            width: auto !important;
          }
        }
      `}</style>

      {/* ── KOT Header (Dapur / Bar) ── */}
      {printMode !== 'all' ? (
        <div className="w-full mb-0">
          {/* Station Banner */}
          <div
            className="w-full text-center py-2 mb-2"
            style={{
              border: '3px solid #000',
              borderRadius: '2px',
            }}
          >
            <div
              className="font-mono font-black uppercase tracking-[0.2em] leading-none"
              style={{ fontSize: '15px' }}
            >
              {printMode === 'kitchen' ? '▶ TIKET DAPUR' : '▶ TIKET BAR'}
            </div>
            <div className="font-mono text-[9px] uppercase tracking-widest mt-0.5">
              {printMode === 'kitchen' ? 'KITCHEN ORDER TICKET' : 'BAR ORDER TICKET'}
            </div>
          </div>

          {/* Order meta row */}
          <div className="flex justify-between items-start mb-1">
            {/* Order number – big */}
            <div>
              <div className="text-[8px] font-mono uppercase tracking-widest text-black leading-none mb-[1px]">
                No. Order
              </div>
              <div
                className="font-mono font-black text-black leading-none"
                style={{ fontSize: '22px', letterSpacing: '-0.01em' }}
              >
                {String(transactionInfo.id.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffffff, 0) % 900000 + 100000)}
              </div>
            </div>
            {/* Time + Cashier + Meja */}
            <div className="text-right">
              <div className="font-mono font-bold text-[9px] text-black">{displayDate}</div>
              {transactionInfo.tableName && (
                <div className="font-mono text-[8px] text-black mt-[1px]">
                  Meja: <span className="font-bold">{transactionInfo.tableName}</span>
                </div>
              )}
              {transactionInfo.customerName && (
                <div className="font-mono text-[8px] text-black mt-[1px]">
                  Tamu: <span className="font-bold">{transactionInfo.customerName}</span>
                </div>
              )}
              {transactionInfo.cashierName && (
                <div className="font-mono text-[8px] text-black">
                  Kasir: <span className="font-bold">{transactionInfo.cashierName}</span>
                </div>
              )}
            </div>
          </div>

          {isCancelled && (
            <div
              className="w-full text-center font-black text-[14px] uppercase font-mono tracking-widest py-2 my-2"
              style={{ border: '3px solid #000' }}
            >
              ✕ VOID / BATAL ✕
              {transactionInfo.cancelReason && (
                <div className="text-[9px] mt-1 font-normal italic lowercase">
                  Alasan: {transactionInfo.cancelReason}
                </div>
              )}
            </div>
          )}

          <div style={{ borderTop: '2px solid #000', marginTop: '4px', marginBottom: '6px' }} />
        </div>
      ) : (
        /* ── Kasir Full Header (Exact Match to LexuPOS) ── */
        <div className="text-center mb-2 flex flex-col items-center">
          {logoUrl && (
            <img src={logoUrl} alt="Store Logo" className="w-[36mm] h-auto object-contain mb-3" style={{ filter: 'grayscale(100%) brightness(0)' }} />
          )}
          <h2 className="text-[17px] font-serif font-light uppercase tracking-[0.15em] m-0 mt-0.5 mb-1 leading-tight" style={{ transform: 'scaleY(1.3) scaleX(0.9)', transformOrigin: 'center' }}>
            {shopInfo.name}
          </h2>
          {shopInfo.address && (
            <p className="text-[9px] mt-[1px] mb-0 leading-tight text-neutral-600 font-medium max-w-[90%]">
              {shopInfo.address}
            </p>
          )}
          {shopInfo.phone && (
            <p className="text-[9px] mt-[2px] mb-0 leading-tight font-semibold text-neutral-800">
              Tlp: {shopInfo.phone}
            </p>
          )}
        </div>
      )}

      {/* Kasir mode: dashed separator + transaction info */}
      {printMode === 'all' && (
        <>
          <div className="border-t border-dashed border-black my-1.5" />
          {isCancelled && (
            <div className="w-full text-center font-bold text-[13px] border-4 border-black py-2.5 my-2.5 uppercase font-mono tracking-widest text-black">
              *** VOID / BATAL ***
              {transactionInfo.cancelReason && (
                <div className="text-[9px] mt-1.5 font-normal italic lowercase leading-tight">Alasan: {transactionInfo.cancelReason}</div>
              )}
            </div>
          )}
          <div className="text-[9.5px] flex flex-col gap-[2px] mb-1.5">
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
            {transactionInfo.status === 'UNPAID' && (
              <div className="w-full text-center font-extrabold text-[11px] border border-black text-black py-1 my-1.5 uppercase font-mono tracking-wider">
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
          <div className="text-[10px] font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1 text-black">
            {cat}
          </div>
          
          <div className="flex flex-col gap-1.5">
            {Object.keys(grouped[cat]).sort().map(sub => (
              <React.Fragment key={sub}>
                {grouped[cat][sub].map((item, i) => {
                  const addonsTotal = item.selectedAddons ? item.selectedAddons.reduce((sum, a) => sum + a.price, 0) : 0;
                  const itemPrice = item.price + addonsTotal;

                  return (
                    <div key={i} className={`flex flex-col text-[10px] w-full ${isCancelled ? 'line-through text-neutral-500 opacity-70' : ''}`}>
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-[10px] uppercase text-black leading-tight flex-1 pr-2">
                          {item.name}
                          {item.isCompliment && (
                            <span className="text-[7.5px] ml-1.5 border border-black text-black px-1 rounded-sm font-semibold">
                              COMPLIMENT
                            </span>
                          )}
                        </span>
                        <span className="font-bold text-[10px] whitespace-nowrap text-right text-black shrink-0">
                          {item.isCompliment ? formatCurrency(0) : formatCurrency(itemPrice * item.quantity)}
                        </span>
                      </div>
                      {item.selectedAddons && item.selectedAddons.length > 0 && (
                        <div className="text-[8.5px] text-neutral-600 mt-[1px]">
                          + {item.selectedAddons.map(a => a.name).join(', ')}
                        </div>
                      )}
                      {item.note && (
                        <div className="text-[8.5px] italic text-neutral-600 mt-[1px]">
                          Catatan: {item.note}
                        </div>
                      )}
                      <div className="text-[8.5px] text-neutral-600 mt-[0.5px]">
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

      {printMode === 'all' && (
        <>
          <div className="border-t border-dashed border-black my-1.5" />

          {/* Totals (Exact Match to LexuPOS) */}
          <div className="flex flex-col gap-[2px] text-[9.5px]">
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

          <div className="flex justify-between font-bold text-[12px] py-0.5">
            <span>TOTAL TAGIHAN:</span>
            <span>{formatCurrency(totals.payableAmount)}</span>
          </div>

          <div className="border-t border-dashed border-black my-1.5" />

          <div className="flex flex-col gap-[2px] text-[9.5px]">
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

          {/* Footer (Exact Match: Terima kasih atas kunjungan Anda) */}
          <div className="text-center text-[9px] leading-relaxed text-neutral-600 mt-5 mb-2">
            <p className="m-0 font-medium">Terima kasih atas kunjungan Anda</p>
            <p className="m-0 text-neutral-500 text-[8px] mt-0.5">Struk ini adalah bukti pembayaran yang sah</p>
          </div>

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
