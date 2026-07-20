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
              <div className="font-mono font-bold text-[9px] text-black">{transactionInfo.date}</div>
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
        /* ── Kasir Full Header ── */
        <div className="text-center mb-3 flex flex-col items-center">
          {logoUrl && (
            <img src={logoUrl} alt="Store Logo" className="w-[36mm] h-auto object-contain mb-5" style={{ filter: 'grayscale(100%) brightness(0)' }} />
          )}
          <h2 className="text-[16px] font-serif font-light uppercase tracking-[0.15em] m-0 mt-1 mb-2 leading-tight" style={{ transform: 'scaleY(1.3) scaleX(0.9)', transformOrigin: 'center' }}>{shopInfo.name}</h2>
          {shopInfo.address && (
            <p className="text-[9px] mt-[2px] mb-0 leading-tight text-neutral-600 font-medium">{shopInfo.address}</p>
          )}
          {shopInfo.phone && (
            <p className="text-[9px] mt-[2px] mb-0 leading-tight font-semibold text-neutral-800">Tlp: {shopInfo.phone}</p>
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
          <div className="text-[9px] flex flex-col gap-[2px] mb-1.5">
            <div className="flex justify-between">
              <span>No. Transaksi:</span>
              <span className="font-bold">{transactionInfo.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal:</span>
              <span className="font-bold">{transactionInfo.date}</span>
            </div>
            {transactionInfo.tableName && (
              <div className="flex justify-between">
                <span>Meja:</span>
                <span className="font-bold">{transactionInfo.tableName}</span>
              </div>
            )}
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
            <div className="flex justify-between">
              <span>Metode:</span>
              <span className="font-bold uppercase">
                {transactionInfo.status === 'UNPAID' ? (
                  <span className="text-red-600 font-extrabold">BELUM BAYAR (UNPAID)</span>
                ) : transactionInfo.paymentMethod === 'cash' ? 'TUNAI'
                  : transactionInfo.paymentMethod === 'qris' ? 'QRIS'
                  : transactionInfo.paymentMethod === 'card' ? 'KARTU'
                  : transactionInfo.paymentMethod === 'compliment' ? 'COMPLIMENT'
                  : transactionInfo.paymentMethod}
              </span>
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

      {/* Items */}
      {sortedCats.map((cat) => (
        <div key={cat} className="mb-2">
          {/* Category header — hanya tampil di mode kasir */}
          {printMode === 'all' && (
            <div className="text-[10px] font-bold uppercase tracking-[1px] border-b border-dotted border-gray-500 pb-[2px] mb-1">
              {cat}
            </div>
          )}
          {/* KOT mode: tampilkan category sebagai section divider */}
          {printMode !== 'all' && (
            <div
              className="text-[9px] font-mono font-black uppercase tracking-widest mb-1 pb-[2px]"
              style={{ borderBottom: '1px solid #000', letterSpacing: '0.15em' }}
            >
              — {cat} —
            </div>
          )}
          {Object.keys(grouped[cat]).sort().map(sub => (
            <div key={sub} className="mb-1">
              {sub !== '—' && (
                <div className={`text-[8px] uppercase ml-1 mb-[2px] tracking-[0.5px] ${
                  printMode !== 'all' ? 'font-bold text-black' : 'text-gray-700'
                }`}>
                  {sub}
                </div>
              )}
              {grouped[cat][sub].map((item, i) => {
                const addonsTotal = item.selectedAddons ? item.selectedAddons.reduce((sum, a) => sum + a.price, 0) : 0;
                const itemPrice = item.price + addonsTotal;

                if (printMode !== 'all') {
                  return (
                    <div
                      key={i}
                      className={isCancelled ? 'opacity-60' : ''}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        marginBottom: '6px',
                        paddingBottom: '6px',
                        borderBottom: '1px dashed #555',
                        textDecoration: isCancelled ? 'line-through' : 'none',
                      }}
                    >
                      {/* QTY — big number box, border-only, black text */}
                      <div
                        style={{
                          flexShrink: 0,
                          minWidth: '38px',
                          textAlign: 'center',
                          border: '2px solid #000',
                          borderRadius: '3px',
                          padding: '2px 4px',
                          fontFamily: 'monospace',
                          fontWeight: 900,
                          fontSize: '18px',
                          lineHeight: '1.1',
                          color: '#000',
                          background: 'transparent',
                        }}
                      >
                        {item.quantity}
                        <div style={{ fontSize: '7px', fontWeight: 700, letterSpacing: '0.05em', marginTop: '-2px' }}>PCS</div>
                      </div>

                      {/* Item detail */}
                      <div style={{ flex: 1 }}>
                        {/* Nama item */}
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: '13px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em',
                            lineHeight: '1.2',
                            color: '#000',
                          }}
                        >
                          {item.name}
                          {item.isCompliment && (
                            <span
                              style={{
                                fontSize: '7px',
                                marginLeft: '4px',
                                border: '1px solid #000',
                                padding: '0 2px',
                                fontWeight: 700,
                                verticalAlign: 'middle',
                              }}
                            >
                              COMPLIMENT
                            </span>
                          )}
                        </div>

                        {/* Add-ons / Modifiers */}
                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                          <div
                            style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              color: '#000',
                              marginTop: '2px',
                              paddingLeft: '6px',
                              borderLeft: '2px solid #000',
                            }}
                          >
                            + {item.selectedAddons.map(a => a.name).join(', ')}
                          </div>
                        )}

                        {/* Qty x harga (info ringkas untuk double-check) */}
                        <div style={{ fontSize: '9px', color: '#000', marginTop: '2px', fontWeight: 600 }}>
                          {item.quantity} x {formatCurrency(itemPrice)}
                          {item.isCompliment && ' — GRATIS'}
                        </div>

                        {/* Special note / request */}
                        {item.note && (
                          <div
                            style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              color: '#000',
                              marginTop: '4px',
                              padding: '4px 6px',
                              border: '2px solid #000',
                              borderRadius: '2px',
                              background: 'transparent',
                              lineHeight: '1.3',
                            }}
                          >
                            ⚠ {item.note}
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
                          <span className="text-[8px] ml-1 border border-black text-black px-1 rounded-sm font-semibold">
                            COMPLIMENT
                          </span>
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

            {transactionInfo.status === 'UNPAID' ? (
              <div className="flex justify-between pt-1 mt-1">
                <span>Tipe Pembayaran:</span>
                <span className="font-black uppercase">BELUM BAYAR (UNPAID)</span>
              </div>
            ) : (
              transactionInfo.paymentMethod && (
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
              )
            )}

            {transactionInfo.status !== 'UNPAID' && totals.cashAmount !== undefined && totals.changeAmount !== undefined && (
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

          {transactionInfo.status === 'UNPAID' ? (
            <div className="text-center text-[8px] italic leading-relaxed text-red-650 font-bold mb-3">
              <p className="m-0">Pesanan belum dibayar / Unpaid Bill.</p>
              <p className="m-0 text-red-500">Bukan merupakan bukti pembayaran sah.</p>
            </div>
          ) : (
            <div className="text-center text-[8px] italic leading-relaxed text-gray-700 mb-3">
              <p className="m-0 font-medium">Terima kasih atas kunjungan Anda!</p>
              <p className="m-0 text-gray-500">Struk ini adalah bukti pembayaran sah.</p>
            </div>
          )}

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
