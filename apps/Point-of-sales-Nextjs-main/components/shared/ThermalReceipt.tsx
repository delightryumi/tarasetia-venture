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
  };
  items: ReceiptItemData[];
  totals: {
    subtotal: number;
    discount: number;
    taxRate: number;
    taxAmount: number;
    payableAmount: number;
    cashAmount?: number;
    changeAmount?: number;
  };
  className?: string;
  style?: React.CSSProperties;
  printMode?: 'all' | 'kitchen' | 'bar';
  onPrintModeChange?: (mode: 'all' | 'kitchen' | 'bar') => void;
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

  return (
    <div 
      className={`receipt-print-wrapper w-full max-w-[80mm] bg-white text-black p-[6mm] text-left mx-auto print:mx-0 print:px-[6mm] print:py-2 print:w-full print:max-w-full font-normal ${className}`}
      style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', ...style }}
    >
      <style>{`
        @media print {
          @page {
            margin: 0 !important;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          .receipt-print-wrapper {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            -webkit-font-smoothing: none !important;
            -moz-osx-font-smoothing: none !important;
            text-rendering: optimizeSpeed !important;
            background: #fff !important;
            color: #000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .receipt-print-wrapper * {
            color: #000 !important;
            text-shadow: none !important;
            box-shadow: none !important;
          }
          .receipt-print-wrapper img {
            opacity: 1 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Print Target Selector (Screen only) */}
      <div className="flex gap-1 mb-4 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg print:hidden text-[10px] font-sans">
        <button
          onClick={() => setPrintMode('all')}
          className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-center transition-all border-none cursor-pointer ${
            printMode === 'all'
              ? 'bg-white dark:bg-zinc-700 text-neutral-900 dark:text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white bg-transparent'
          }`}
        >
          Kasir (Full)
        </button>
        <button
          onClick={() => setPrintMode('kitchen')}
          className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-center transition-all border-none cursor-pointer ${
            printMode === 'kitchen'
              ? 'bg-white dark:bg-zinc-700 text-neutral-900 dark:text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white bg-transparent'
          }`}
        >
          Dapur (KOT)
        </button>
        <button
          onClick={() => setPrintMode('bar')}
          className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-center transition-all border-none cursor-pointer ${
            printMode === 'bar'
              ? 'bg-white dark:bg-zinc-700 text-neutral-900 dark:text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white bg-transparent'
          }`}
        >
          Bar (Drink)
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-3 flex flex-col items-center">
        {printMode === 'all' && logoUrl && (
          <img src={logoUrl} alt="Store Logo" className="w-[36mm] h-auto object-contain mb-5" style={{ filter: 'grayscale(100%) brightness(0)' }} />
        )}
        <h2 className="text-[16px] font-serif font-light uppercase tracking-[0.15em] m-0 mt-1 mb-2 leading-tight" style={{ transform: 'scaleY(1.3) scaleX(0.9)', transformOrigin: 'center' }}>{shopInfo.name}</h2>
        {printMode === 'all' && shopInfo.address && (
          <p className="text-[9px] mt-[2px] mb-0 leading-tight text-neutral-600 font-medium">{shopInfo.address}</p>
        )}
        {printMode === 'all' && shopInfo.phone && (
          <p className="text-[9px] mt-[2px] mb-0 leading-tight font-semibold text-neutral-800">Tlp: {shopInfo.phone}</p>
        )}
        
        {printMode === 'kitchen' && (
          <div className="w-full text-center font-bold text-[11px] border border-black py-1.5 my-2 uppercase font-mono tracking-wider">
            *** TIKET DAPUR (KITCHEN) ***
          </div>
        )}
        {printMode === 'bar' && (
          <div className="w-full text-center font-bold text-[11px] border border-black py-1.5 my-2 uppercase font-mono tracking-wider">
            *** TIKET BAR (DRINKS) ***
          </div>
        )}
      </div>
      
      <div className="border-t border-dashed border-black my-1.5" />

      {isCancelled && (
        <div className="w-full text-center font-bold text-[13px] border-4 border-black py-2.5 my-2.5 uppercase font-mono tracking-widest bg-neutral-100 text-black">
          *** VOID / BATAL ***
          {transactionInfo.cancelReason && (
            <div className="text-[9px] mt-1.5 font-normal italic lowercase leading-tight">Alasan: {transactionInfo.cancelReason}</div>
          )}
        </div>
      )}

      {/* Transaction Info */}
      <div className="text-[9px] flex flex-col gap-[2px] mb-1.5">
        <div className="flex justify-between">
          <span>No. Transaksi:</span>
          <span className="font-bold">{transactionInfo.id}</span>
        </div>
        <div className="flex justify-between">
          <span>Tanggal:</span>
          <span className="font-bold">{transactionInfo.date}</span>
        </div>
        <div className="flex justify-between">
          <span>Pelanggan:</span>
          <span className="font-bold">{transactionInfo.customerName || 'Walk-in Customer'}</span>
        </div>
        {transactionInfo.cashierName && (
          <div className="flex justify-between">
            <span>Kasir:</span>
            <span className="font-bold">{transactionInfo.cashierName}</span>
          </div>
        )}
        {printMode === 'all' && transactionInfo.paymentMethod && (
          <div className="flex justify-between">
            <span>Metode:</span>
            <span className="font-bold uppercase">
              {transactionInfo.paymentMethod === 'cash' ? 'TUNAI' : 
               transactionInfo.paymentMethod === 'qris' ? 'QRIS' : 
               transactionInfo.paymentMethod === 'card' ? 'KARTU' : 
               transactionInfo.paymentMethod === 'compliment' ? 'COMPLIMENT' : 
               transactionInfo.paymentMethod}
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-dashed border-black my-1.5" />

      {/* Items */}
      {sortedCats.map((cat) => (
        <div key={cat} className="mb-1.5">
          <div className="text-[10px] font-bold uppercase tracking-[1px] border-b border-dotted border-gray-500 pb-[2px] mb-1">
            {cat}
          </div>
          {Object.keys(grouped[cat]).sort().map(sub => (
            <div key={sub} className="mb-1">
              {sub !== '—' && (
                <div className="text-[8px] uppercase text-gray-700 ml-1 mb-[2px] tracking-[0.5px]">
                  {sub}
                </div>
              )}
              {grouped[cat][sub].map((item, i) => {
                const addonsTotal = item.selectedAddons ? item.selectedAddons.reduce((sum, a) => sum + a.price, 0) : 0;
                const itemPrice = item.price + addonsTotal;
                
                if (printMode !== 'all') {
                  return (
                    <div key={i} className={`flex items-start text-[11px] gap-2 mb-2 pb-2 border-b border-dotted border-gray-400 last:border-b-0 ${isCancelled ? 'line-through text-neutral-500 opacity-70' : ''}`}>
                      {/* Quantity box besar di sebelah kiri */}
                      <div className="flex-shrink-0 bg-black text-white font-mono font-bold text-[16px] px-2 py-0.5 rounded text-center min-w-[36px]">
                        {item.quantity}x
                      </div>
                      <div className="flex-grow">
                        <div className="font-extrabold text-[12px] text-black uppercase leading-tight">
                          {item.name}
                          {item.isCompliment && (
                            <span className="text-[8px] ml-1 bg-neutral-200 text-neutral-900 px-1 rounded-sm font-semibold">COMPLIMENT</span>
                          )}
                        </div>
                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                          <div className="text-[9px] text-neutral-800 font-bold mt-[1px] pl-1 border-l-2 border-black">
                            + {item.selectedAddons.map(a => a.name).join(', ')}
                          </div>
                        )}
                        {item.note && (
                          <div className="text-[9px] text-black font-extrabold mt-[2.5px] p-1.5 border-2 border-black rounded bg-neutral-50 leading-tight">
                            Catatan: {item.note}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={i} className={`flex justify-between items-start text-[10px] ml-2 mb-[2px] ${isCancelled ? 'line-through text-neutral-500 opacity-70' : ''}`}>
                    <div className="max-w-[70%]">
                      <div className="font-bold leading-tight">
                        {item.name}
                        {item.isCompliment && (
                          <span className="text-[8px] ml-1 bg-gray-200 text-gray-800 px-1 rounded-sm font-semibold">COMPLIMENT</span>
                        )}
                      </div>
                      {item.selectedAddons && item.selectedAddons.length > 0 && (
                        <div className="text-[8px] text-gray-600 mt-[1px]">
                          + {item.selectedAddons.map(a => a.name).join(', ')}
                        </div>
                      )}
                      {item.note && (
                        <div className="text-[8px] italic text-gray-600 mt-[1px]">
                          Catatan: {item.note}
                        </div>
                      )}
                      <div className="text-[8px] text-gray-700 mt-[1px]">
                        {item.quantity} x {formatCurrency(itemPrice)}
                        {item.isCompliment && item.complimentReason && ` (${item.complimentReason})`}
                      </div>
                    </div>
                    <span className="font-bold whitespace-nowrap ml-2">
                      {item.isCompliment ? formatCurrency(0) : formatCurrency(itemPrice * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}

      {printMode === 'all' && (
        <>
          <div className="border-t border-dashed border-black my-1.5" />

          {/* Totals */}
          <div className="flex flex-col gap-[2px] text-[9px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 && (
              <>
                <div className="flex justify-between text-gray-700">
                  <span>Diskon:</span>
                  <span>-{formatCurrency(totals.discount)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Setelah Diskon:</span>
                  <span>{formatCurrency(totals.subtotal - totals.discount)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span>Service TAX ({totals.taxRate}%):</span>
              <span>{formatCurrency(totals.taxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-[11px] border-t border-dashed border-black pt-1 mt-[2px]">
              <span>TOTAL:</span>
              <span>{formatCurrency(totals.payableAmount)}</span>
            </div>

            {transactionInfo.paymentMethod && (
              <div className="flex justify-between pt-1 mt-1 text-neutral-800">
                <span>Tipe Pembayaran:</span>
                <span className="font-bold uppercase">
                  {transactionInfo.paymentMethod === 'cash' ? 'TUNAI' : 
                   transactionInfo.paymentMethod === 'qris' ? 'QRIS' : 
                   transactionInfo.paymentMethod === 'card' ? 'KARTU' : 
                   transactionInfo.paymentMethod === 'compliment' ? 'COMPLIMENT' : 
                   transactionInfo.paymentMethod}
                </span>
              </div>
            )}

            {totals.cashAmount !== undefined && totals.changeAmount !== undefined && (
              <>
                <div className="flex justify-between pt-1 mt-1 border-t border-dotted border-gray-400">
                  <span>Uang Diterima:</span>
                  <span>{formatCurrency(totals.cashAmount)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Uang Kembali:</span>
                  <span>{formatCurrency(totals.changeAmount)}</span>
                </div>
              </>
            )}
          </div>

          <div className="border-t border-dashed border-black my-2" />
          
          {isCancelled && (
            <div className="w-full text-center font-bold text-[12px] border-2 border-black py-1.5 my-2.5 uppercase font-mono tracking-wider">
              *** VOID / BATAL ***
            </div>
          )}

          <div className="text-center text-[8px] italic leading-relaxed text-gray-700 mb-3">
            <p className="m-0 font-medium">Terima kasih atas kunjungan Anda!</p>
            <p className="m-0 text-gray-500">Struk ini adalah bukti pembayaran sah.</p>
          </div>

          {/* Powered By Footer */}
          <div className="flex flex-col items-center justify-center mt-4 pt-2 border-t border-dotted border-gray-300">
            <span className="text-[7px] text-gray-400 lowercase tracking-widest font-black mb-1.5">powered by</span>
            <img src="/channels/1.png" alt="Setara Venture" className="h-4 w-auto grayscale opacity-90 object-contain powered-by-logo" />
          </div>
        </>
      )}
    </div>
  );
}
