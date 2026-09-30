'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { decodeReceiptData, StatelessReceiptData } from '@/lib/receiptPayload';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  Printer, 
  Share2, 
  Utensils, 
  Wine, 
  Wifi, 
  Instagram, 
  AlertCircle,
  Download,
  Receipt as ReceiptIcon
} from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function EReceiptContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<StatelessReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const encodedPayload = searchParams.get('d');
    const hotelCode = searchParams.get('h') || searchParams.get('hotelCode') || '1';
    const orderId = searchParams.get('id') || searchParams.get('orderId');

    // 1. Client-Side Stateless Decoding
    if (encodedPayload) {
      const decoded = decodeReceiptData(encodedPayload);
      if (decoded) {
        setData(decoded);
        setIsLoading(false);
        return;
      }
    }

    // 2. Query Firestore or Render Live Preview
    if (hotelCode && orderId) {
      (async () => {
        try {
          // Fetch shop config from pos_receipt and hotel
          let cfg: any = {};
          let hotelData: any = {};
          try {
            const configSnap = await getDoc(doc(db, 'hotels', hotelCode, 'settings', 'pos_receipt'));
            if (configSnap.exists()) cfg = configSnap.data();
            const hotelSnap = await getDoc(doc(db, 'hotels', hotelCode));
            if (hotelSnap.exists()) hotelData = hotelSnap.data();
          } catch (e) {
            console.warn('Failed to load receipt settings:', e);
          }

          const socialParts = [
            cfg?.instagram && `IG: ${cfg.instagram}`,
            cfg?.facebook  && `FB: ${cfg.facebook}`,
            cfg?.tiktok    && `Tiktok: ${cfg.tiktok}`,
          ].filter(Boolean);
          const combinedSocial = socialParts.length ? socialParts.join(' · ') : (cfg?.socialMedia || '');

          // If this is the settings preview demo order
          if (orderId === 'ORD-9821') {
            const hasWifi = cfg.qrType === 'wifi' && Boolean(cfg.wifiInfo?.trim());
            const demoReceipt: StatelessReceiptData = {
              shopInfo: {
                name: (cfg.shopName || hotelData.name || 'RESTO SETARA').trim(),
                address: (cfg.address || hotelData.address || '').trim(),
                phone: (cfg.phone || hotelData.phone || '').trim(),
                npwp: (cfg.npwp || cfg.headerNote || '').trim()
              },
              transactionInfo: {
                id: 'ORD-9821',
                date: new Date().toISOString(),
                customerName: 'Budi Santoso',
                cashierName: 'Siti Aminah',
                tableName: 'Meja 04',
                paymentMethod: 'TUNAI',
                status: 'PAID'
              },
              items: [
                { name: 'Nasi Goreng Spesial', quantity: 2, price: 35000, addons: 'Pedas Sedang, Telur Ceplok' },
                { name: 'Ayam Bakar Madu', quantity: 1, price: 42000, note: 'Sambal dipisah' },
                { name: 'Es Teh Manis', quantity: 3, price: 8000 },
                { name: 'Pisang Goreng Keju', quantity: 1, price: 20000 }
              ],
              totals: {
                subtotal: 148000,
                discount: 10000,
                taxRate: 10,
                taxAmount: 13800,
                serviceRate: 5,
                serviceAmount: 6900,
                payableAmount: 158700,
                cashAmount: 200000,
                changeAmount: 41300
              },
              footer: {
                message: (cfg.footerMessage || '').trim(),
                socialMedia: combinedSocial || '',
                wifiInfo: hasWifi ? cfg.wifiInfo.trim() : ''
              }
            };
            setData(demoReceipt);
            setIsLoading(false);
            return;
          }

          // Otherwise, find the order in pos_orders
          let raw: any = null;

          // 1. Direct doc in pos_orders
          const posOrderSnap = await getDoc(doc(db, 'hotels', hotelCode, 'pos_orders', orderId));
          if (posOrderSnap.exists()) {
            raw = { id: posOrderSnap.id, ...posOrderSnap.data() };
          }

          // 2. Query by transactionId in pos_orders
          if (!raw) {
            const qTx = query(collection(db, 'hotels', hotelCode, 'pos_orders'), where('transactionId', '==', orderId));
            const qSnap = await getDocs(qTx);
            if (!qSnap.empty) {
              const docItem = qSnap.docs[0];
              raw = { id: docItem.id, ...docItem.data() };
            }
          }

          // 3. Query by orderNumber in pos_orders
          if (!raw) {
            const qNum = query(collection(db, 'hotels', hotelCode, 'pos_orders'), where('orderNumber', '==', orderId));
            const qSnap = await getDocs(qNum);
            if (!qSnap.empty) {
              const docItem = qSnap.docs[0];
              raw = { id: docItem.id, ...docItem.data() };
            }
          }

          // 4. Fallback to transactions collection
          if (!raw) {
            const legacySnap = await getDoc(doc(db, 'hotels', hotelCode, 'transactions', orderId));
            if (legacySnap.exists()) {
              raw = { id: legacySnap.id, ...legacySnap.data() };
            }
          }

          if (raw) {
            const rawItems = raw.items || raw.cart || [];
            const structured: StatelessReceiptData = {
              shopInfo: {
                name: cfg.shopName || hotelData.name || raw.shopName || 'RESTO SETARA',
                address: cfg.address || hotelData.address || raw.address || '',
                phone: cfg.phone || hotelData.phone || raw.phone || '',
                npwp: cfg.npwp || raw.npwp || ''
              },
              transactionInfo: {
                id: raw.orderNumber || raw.transactionId || raw.id || orderId,
                date: raw.createdAt 
                  ? (raw.createdAt.seconds ? new Date(raw.createdAt.seconds * 1000).toISOString() : new Date(raw.createdAt).toISOString())
                  : (raw.timestamp ? (raw.timestamp.seconds ? new Date(raw.timestamp.seconds * 1000).toISOString() : new Date(raw.timestamp).toISOString()) : new Date().toISOString()),
                customerName: raw.customerName || 'Tamu Umum',
                cashierName: raw.cashierName || raw.cashier || 'Kasir',
                tableName: raw.tableName || raw.tableNumber || '',
                paymentMethod: raw.paymentMethod || 'TUNAI',
                status: raw.status || 'PAID'
              },
              items: rawItems.map((it: any) => ({
                name: it.name || it.productName || 'Item',
                quantity: it.quantity || it.qty || 1,
                price: it.price || 0,
                addons: Array.isArray(it.selectedAddons) 
                  ? it.selectedAddons.map((a: any) => a.name || a).join(', ')
                  : (typeof it.addons === 'string' ? it.addons : ''),
                note: it.note || ''
              })),
              totals: {
                subtotal: raw.subtotal || raw.subTotal || 0,
                discount: raw.discount || 0,
                taxAmount: raw.taxAmount || raw.tax || 0,
                taxRate: raw.taxRate || 0,
                serviceAmount: raw.serviceAmount || raw.service || 0,
                serviceRate: raw.serviceRate || 0,
                payableAmount: raw.payableAmount || raw.totalAmount || raw.total || 0,
                cashAmount: raw.cashAmount,
                changeAmount: raw.changeAmount
              },
              footer: {
                message: (cfg.footerMessage || raw.footerMessage || '').trim(),
                socialMedia: combinedSocial || raw.socialMedia || '',
                wifiInfo: ((cfg.qrType === 'wifi' || raw.qrType === 'wifi') && Boolean((cfg.wifiInfo || raw.wifiInfo)?.trim()))
                  ? (cfg.wifiInfo || raw.wifiInfo || '').trim()
                  : ''
              }
            };
            setData(structured);
          } else {
            setError('Data transaksi tidak ditemukan.');
          }
        } catch (err) {
          console.error(err);
          setError('Gagal memuat e-struk.');
        } finally {
          setIsLoading(false);
        }
      })();
      return;
    }

    // Default sample view if opened without params
    setError('Tautan e-Struk tidak valid atau tidak memiliki parameter data.');
    setIsLoading(false);
  }, [searchParams]);

  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB';
    } catch {
      return dateStr;
    }
  };

  const handleShareWhatsApp = () => {
    if (!data) return;
    const lines = [
      `*🧾 e-Struk Pembayaran: ${data.shopInfo.name}*`,
      `No. Transaksi: #${data.transactionInfo.id}`,
      `Tanggal: ${formatDate(data.transactionInfo.date)}`,
      data.transactionInfo.tableName ? `Meja: ${data.transactionInfo.tableName}` : '',
      `Pelanggan: ${data.transactionInfo.customerName || 'Tamu Umum'}`,
      `---------------------------------`,
      ...data.items.map(it => `• ${it.quantity}x ${it.name} - ${formatRupiah(it.price * it.quantity)}`),
      `---------------------------------`,
      `*TOTAL: ${formatRupiah(data.totals.payableAmount)}* (${data.transactionInfo.status === 'UNPAID' ? 'BELUM LUNAS' : 'LUNAS'})`,
      `Metode: ${(data.transactionInfo.paymentMethod || 'TUNAI').toUpperCase()}`,
      `\nLihat e-Struk digital resmi: ${window.location.href}`
    ].filter(Boolean).join('\n');

    const url = `https://wa.me/?text=${encodeURIComponent(lines)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white rounded-full animate-spin" />
        <span className="text-xs font-semibold text-neutral-500">Memuat e-Struk digital...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md w-full my-auto p-6 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 mx-auto flex items-center justify-center">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-base font-bold text-neutral-900 dark:text-white">e-Struk Tidak Ditemukan</h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          {error || 'Pastikan QR code atau tautan e-Struk yang Anda pindai sudah benar.'}
        </p>
        <div className="pt-2">
          <a
            href="https://mytara.id"
            className="inline-flex items-center justify-center px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold rounded-xl transition-all"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  const isPaid = data.transactionInfo.status !== 'UNPAID';

  return (
    <div className="max-w-md w-full mx-auto space-y-4 pb-8">
      {/* Top Action Buttons (Hidden on Print) */}
      <div className="flex items-center justify-between gap-2 print:hidden">
        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-400">
          <ReceiptIcon size={16} />
          <span>e-Struk Digital</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Share2 size={13} />
            <span>Bagikan</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="h-8 px-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Printer size={13} />
            <span>Cetak / Simpan</span>
          </button>
        </div>
      </div>

      {/* Main E-Receipt Card (Clean Modern Card with Perforated Edge Design) */}
      <div 
        ref={receiptRef}
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden relative"
      >
        {/* Top Status Banner */}
        <div className={`p-4 text-center ${isPaid ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'} border-b border-neutral-100 dark:border-neutral-800`}>
          <div className="flex items-center justify-center gap-1.5 font-bold text-xs uppercase tracking-wider">
            {isPaid ? <CheckCircle2 size={15} /> : <Clock size={15} />}
            <span>{isPaid ? 'Pembayaran Berhasil (Lunas)' : 'Tagihan Sementara (Belum Lunas)'}</span>
          </div>
        </div>

        {/* Outlet Header */}
        <div className="p-6 text-center space-y-1.5 border-b border-dashed border-neutral-200 dark:border-neutral-800">
          <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900 dark:text-white">
            {data.shopInfo.name}
          </h1>
          {data.shopInfo.npwp && (
            <p className="text-[11px] font-mono font-medium text-neutral-500 dark:text-neutral-400">
              {/^npwp/i.test(data.shopInfo.npwp) ? data.shopInfo.npwp : `NPWP: ${data.shopInfo.npwp}`}
            </p>
          )}
          {data.shopInfo.address && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-center gap-1 max-w-[90%] mx-auto">
              <MapPin size={12} className="shrink-0" />
              <span>{data.shopInfo.address}</span>
            </p>
          )}
          {data.shopInfo.phone && (
            <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 flex items-center justify-center gap-1">
              <Phone size={12} className="shrink-0" />
              <span>{data.shopInfo.phone}</span>
            </p>
          )}
        </div>

        {/* Transaction Meta */}
        <div className="p-5 bg-neutral-50/70 dark:bg-neutral-900/40 border-b border-dashed border-neutral-200 dark:border-neutral-800 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-neutral-500 dark:text-neutral-400">No. Transaksi</span>
            <span className="font-mono font-bold text-neutral-900 dark:text-white">#{data.transactionInfo.id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-500 dark:text-neutral-400">Waktu</span>
            <span className="font-medium text-neutral-800 dark:text-neutral-200">{formatDate(data.transactionInfo.date)}</span>
          </div>
          {data.transactionInfo.cashierName && (
            <div className="flex justify-between items-center">
              <span className="text-neutral-500 dark:text-neutral-400">Kasir</span>
              <span className="font-medium text-neutral-800 dark:text-neutral-200">{data.transactionInfo.cashierName}</span>
            </div>
          )}
          {(data.transactionInfo.tableName || data.transactionInfo.customerName) && (
            <div className="flex justify-between items-center pt-1 border-t border-neutral-200/50 dark:border-neutral-800">
              {data.transactionInfo.tableName ? (
                <span className="font-bold text-neutral-800 dark:text-neutral-200">
                  Meja: {data.transactionInfo.tableName}
                </span>
              ) : <span />}
              {data.transactionInfo.customerName && (
                <span className="text-neutral-600 dark:text-neutral-400">
                  Tamu: <strong className="text-neutral-900 dark:text-white">{data.transactionInfo.customerName}</strong>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Items Breakdown */}
        <div className="p-6 space-y-4 border-b border-dashed border-neutral-200 dark:border-neutral-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block">
            Rincian Pesanan
          </span>
          <div className="space-y-3">
            {data.items.map((it, idx) => (
              <div key={idx} className="flex justify-between items-start text-xs">
                <div className="flex-1 pr-3">
                  <div className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <span>{it.quantity}x</span>
                    <span>{it.name}</span>
                  </div>
                  {it.addons && (
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 pl-4 mt-0.5">
                      + {it.addons}
                    </div>
                  )}
                  {it.note && (
                    <div className="text-[11px] italic text-neutral-500 dark:text-neutral-400 pl-4 mt-0.5">
                      Catatan: {it.note}
                    </div>
                  )}
                  {it.quantity > 1 && (
                    <div className="text-[10px] text-neutral-400 pl-4 mt-0.5">
                      @ {formatRupiah(it.price)}
                    </div>
                  )}
                </div>
                <div className="font-bold text-neutral-900 dark:text-white whitespace-nowrap">
                  {formatRupiah(it.price * it.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Breakdown */}
        <div className="p-6 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-2 text-xs border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
            <span>Subtotal</span>
            <span className="font-medium text-neutral-800 dark:text-neutral-200">{formatRupiah(data.totals.subtotal)}</span>
          </div>
          {data.totals.discount ? (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Diskon</span>
              <span className="font-medium">-{formatRupiah(data.totals.discount)}</span>
            </div>
          ) : null}
          {data.totals.serviceAmount ? (
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
              <span>Service Charge ({data.totals.serviceRate || 5}%)</span>
              <span className="font-medium text-neutral-800 dark:text-neutral-200">+{formatRupiah(data.totals.serviceAmount)}</span>
            </div>
          ) : null}
          {data.totals.taxAmount ? (
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
              <span>Pajak Resto (PB1) ({data.totals.taxRate || 10}%)</span>
              <span className="font-medium text-neutral-800 dark:text-neutral-200">+{formatRupiah(data.totals.taxAmount)}</span>
            </div>
          ) : null}

          <div className="flex justify-between items-baseline pt-3 border-t border-neutral-200 dark:border-neutral-700">
            <span className="font-extrabold text-sm text-neutral-900 dark:text-white uppercase">Total Bayar</span>
            <span className="font-black text-lg text-neutral-900 dark:text-white">{formatRupiah(data.totals.payableAmount)}</span>
          </div>

          <div className="flex justify-between text-xs pt-2 text-neutral-500 dark:text-neutral-400">
            <span>Metode Pembayaran</span>
            <span className="font-bold text-neutral-900 dark:text-white uppercase">{data.transactionInfo.paymentMethod}</span>
          </div>

          {data.totals.cashAmount ? (
            <div className="flex justify-between text-xs pt-1 text-neutral-600 dark:text-neutral-400">
              <span>Tunai Diterima</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{formatRupiah(data.totals.cashAmount)}</span>
            </div>
          ) : null}

          {data.totals.changeAmount !== undefined && data.totals.changeAmount > 0 ? (
            <div className="flex justify-between text-xs pt-0.5 text-neutral-600 dark:text-neutral-400">
              <span>Kembalian</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{formatRupiah(data.totals.changeAmount)}</span>
            </div>
          ) : null}
        </div>

        {/* Footer Notes & Social */}
        <div className="p-6 text-center space-y-2 text-xs">
          {data.footer?.message && (
            <p className="text-neutral-600 dark:text-neutral-300 font-medium whitespace-pre-wrap leading-relaxed">
              {data.footer.message}
            </p>
          )}
          {data.footer?.socialMedia && (
            <p className="text-neutral-800 dark:text-neutral-200 font-bold flex items-center justify-center gap-1">
              <Instagram size={13} /> {data.footer.socialMedia}
            </p>
          )}
          {data.footer?.wifiInfo && (
            <p className="text-neutral-500 dark:text-neutral-400 flex items-center justify-center gap-1 text-[11px]">
              <Wifi size={13} /> {data.footer.wifiInfo}
            </p>
          )}

          {/* Powered by Tara */}
          <div className="pt-4 mt-4 border-t border-dotted border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center gap-1">
            <a
              href="https://mytara.id"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center no-underline text-inherit hover:opacity-80 transition-opacity"
            >
              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                powered by
              </span>
              <img src="/channels/1.png" alt="My Tara" className="h-5 w-auto object-contain mt-0.5" />
            </a>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-neutral-400 dark:text-neutral-600 print:hidden">
        Struk ini adalah bukti pembayaran digital yang sah diterbitkan oleh sistem POS Resto.
      </div>
    </div>
  );
}

export default function EReceiptPage() {
  return (
    <Suspense fallback={<div className="text-xs text-neutral-400 p-8 text-center">Memuat e-Struk...</div>}>
      <EReceiptContent />
    </Suspense>
  );
}
