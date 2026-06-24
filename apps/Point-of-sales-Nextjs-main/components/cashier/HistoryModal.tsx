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
        const amt = tx.amount ?? tx.total ?? 0;
        const m = (tx.method ?? tx.paymentMethod ?? 'cash').toLowerCase();
        total += amt;
        if (m === 'cash' || m === 'tunai') cash += amt;
        else if (m === 'qris' || m === 'e-money' || m === 'emoney') qris += amt;
        else if (m === 'card' || m === 'debit' || m === 'kredit' || m === 'credit') card += amt;
        else if (m === 'transfer') transfer += amt;
        else qris += amt;
      });
      return { total, cash, qris, card, transfer };
    }
    const fb = getSalesBreakdown(selectedHistoryShift);
    return { ...fb, transfer: 0 };
  })();

  // ── Revenue breakdown by category ──
  let foodTotal = 0, beverageTotal = 0, banquetTotal = 0, otherTotal = 0;
  detailTransactions.forEach(tx => {
    const isBanquet = tx.revenueType?.toLowerCase() === 'banquet' ||
                      (tx.category?.toLowerCase() || '').includes('banquet');
    if (isBanquet) {
      banquetTotal += tx.amount ?? tx.total ?? 0;
    } else if (tx.items && Array.isArray(tx.items)) {
      tx.items.forEach((item: any) => {
        const itemTotal = (item.originalPrice ?? item.price ?? 0) * (item.quantity || 1);
        const target = item.pnlTarget?.toUpperCase() || '';
        const cat = item.category?.toUpperCase() || '';
        if (target === 'FOOD' || (!target && cat === 'FOOD')) foodTotal += itemTotal;
        else if (target === 'BEVERAGE' || (!target && cat === 'BEVERAGE')) beverageTotal += itemTotal;
        else if (target === 'BANQUET' || (!target && cat === 'BANQUET')) banquetTotal += itemTotal;
        else otherTotal += itemTotal;
      });
    } else {
      otherTotal += tx.amount ?? tx.total ?? 0;
    }
  });

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
    const low = (m || '').toLowerCase();
    if (low === 'cash' || low === 'tunai') return 'TUNAI';
    if (low === 'qris' || low === 'e-money' || low === 'emoney') return 'QRIS';
    if (low === 'card' || low === 'debit' || low === 'kredit' || low === 'credit') return 'KARTU';
    if (low === 'transfer') return 'TRANSFER';
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
    const pw = window.open('', '', 'height=800,width=900');
    if (!pw) { toast.error('Gagal membuka jendela cetak. Izinkan pop-up.'); return; }
    pw.document.write(`<html><head><title>Shift Closing Slip - ${selectedHistoryShift.cashierName}</title><style>
      @page { margin: 0; size: 80mm auto; }
      * { box-sizing: border-box; color: #000 !important; }
      body { margin: 0; padding: 8px 0; background: #fff; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 11px; display: flex; justify-content: center; }
      #wrap { width: 76mm; padding: 0 3mm; }
      .center { text-align: center; }
      .right { text-align: right; }
      .bold { font-weight: 700; }
      .row { display: flex; justify-content: space-between; align-items: flex-start; margin: 2px 0; }
      .row .val { font-weight: 700; white-space: nowrap; margin-left: 8px; text-align: right; }
      .row .lbl { flex: 1; }
      .section-title { font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #000 !important; margin: 8px 0 4px; border-bottom: 1px dashed #000; padding-bottom: 2px; }
      .dash { border: none; border-top: 1px dashed #000; margin: 6px 0; }
      .dot { border: none; border-top: 1px dotted #000; margin: 3px 0; }
      .outlet { font-size: 16px; font-weight: 300; letter-spacing: 0.15em; text-transform: uppercase; transform: scaleY(1.2); display: block; margin: 4px 0 2px; font-family: Georgia, serif; text-align: center; }
      .sub-outlet { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; text-align: center; color: #000 !important; }
      .tx-table { width: 100%; border-collapse: collapse; font-size: 9.5px; margin-top: 2px; }
      .tx-table th { font-weight: 700; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid #000; padding: 2px 1px; text-align: left; }
      .tx-table td { padding: 1.5px 1px; vertical-align: top; }
      .tx-table tr:last-child td { border-bottom: 1px dotted #000; }
      .total-row td { font-weight: 700; border-top: 1px solid #000; padding-top: 3px; }
      .green { color: #000 !important; font-weight: bold; }
      .red { color: #000 !important; font-weight: bold; }
      .amber { color: #000 !important; font-weight: bold; }
      .footer { font-size: 8px; color: #000 !important; text-align: center; margin-top: 10px; font-style: italic; }
      .logo { max-height: 45px; width: auto; display: block; margin: 0 auto 6px; filter: grayscale(100%) brightness(0); }
      .indent { padding-left: 8px; font-size: 9px; color: #000 !important; }
    </style></head><body><div id="wrap">`);
    pw.document.write(el.innerHTML);
    pw.document.write(`</div></body></html>`);
    pw.document.close();
    pw.focus();
    setTimeout(() => { pw.print(); pw.close(); }, 600);
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

        <div className="flex-1 overflow-y-auto px-4 py-5 bg-neutral-100 dark:bg-zinc-950 mx-4 my-3 rounded-xl border border-neutral-200 dark:border-white/[0.05]">
          
          <style>{`
            .closing-slip-preview-container * {
              box-sizing: border-box;
            }
            .closing-slip-preview-container {
              width: 76mm;
              padding: 10px 8px;
              background: #fff;
              color: #000;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              font-size: 11px;
              margin: 0 auto;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              border-radius: 6px;
            }
            .closing-slip-preview-container .center { text-align: center; }
            .closing-slip-preview-container .right { text-align: right; }
            .closing-slip-preview-container .bold { font-weight: 700; }
            .closing-slip-preview-container .row { display: flex; justify-content: space-between; align-items: flex-start; margin: 2px 0; }
            .closing-slip-preview-container .row .val { font-weight: 700; white-space: nowrap; margin-left: 8px; text-align: right; }
            .closing-slip-preview-container .row .lbl { flex: 1; }
            .closing-slip-preview-container .section-title { font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #000 !important; margin: 8px 0 4px; border-bottom: 1px dashed #000; padding-bottom: 2px; }
            .closing-slip-preview-container .dash { border: none; border-top: 1px dashed #000; margin: 6px 0; }
            .closing-slip-preview-container .dot { border: none; border-top: 1px dotted #000; margin: 3px 0; }
            .closing-slip-preview-container .outlet { font-size: 16px; font-weight: 300; letter-spacing: 0.15em; text-transform: uppercase; transform: scaleY(1.2); display: block; margin: 4px 0 2px; font-family: Georgia, serif; text-align: center; }
            .closing-slip-preview-container .sub-outlet { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; text-align: center; color: #000 !important; }
            .closing-slip-preview-container .tx-table { width: 100%; border-collapse: collapse; font-size: 9.5px; margin-top: 2px; }
            .closing-slip-preview-container .tx-table th { font-weight: 700; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid #000; padding: 2px 1px; text-align: left; }
            .closing-slip-preview-container .tx-table td { padding: 1.5px 1px; vertical-align: top; }
            .closing-slip-preview-container .tx-table tr:last-child td { border-bottom: 1px dotted #000; }
            .closing-slip-preview-container .total-row td { font-weight: 700; border-top: 1px solid #000; padding-top: 3px; }
            .closing-slip-preview-container .green { color: #166534 !important; }
            .closing-slip-preview-container .red { color: #991b1b !important; }
            .closing-slip-preview-container .amber { color: #92400e !important; }
            .closing-slip-preview-container .footer { font-size: 8px; color: #000 !important; text-align: center; margin-top: 10px; font-style: italic; }
            .closing-slip-preview-container .logo { max-height: 45px; width: auto; display: block; margin: 0 auto 6px; filter: grayscale(100%) brightness(0); }
            .closing-slip-preview-container .indent { padding-left: 8px; font-size: 9px; color: #000 !important; }
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
              <p className="sub-outlet bold" style={{ marginTop: 4 }}>Shift Closing Report</p>
            </div>

            <hr className="dash" />

            <div className="section-title">Informasi Shift</div>
            <div className="row"><span className="lbl">Kasir:</span><span className="val">{selectedHistoryShift.cashierName || '-'}</span></div>
            <div className="row"><span className="lbl">Shift ID:</span><span className="val bold font-mono">{selectedHistoryShift.id || '-'}</span></div>
            <div className="row"><span className="lbl">Dibuka:</span><span className="val">{fmtShort(selectedHistoryShift.openedAt)}</span></div>
            <div className="row"><span className="lbl">Ditutup:</span><span className="val">{fmtShort(selectedHistoryShift.closedAt)}</span></div>
            <div className="row"><span className="lbl">Total Transaksi:</span><span className="val">{detailTransactions.length} order</span></div>

            <hr className="dash" />

            <div className="section-title">Riwayat Transaksi</div>

            {isLoadingDetail ? (
              <div className="center italic py-2" style={{ fontSize: 9, color: '#555' }}>Memuat data transaksi...</div>
            ) : detailTransactions.length === 0 ? (
              <div className="center italic py-2" style={{ fontSize: 9, color: '#888' }}>Tidak ada transaksi dalam shift ini.</div>
            ) : (
              <table className="tx-table">
                <thead>
                  <tr>
                    <th style={{ width: '28%' }}>Waktu</th>
                    <th style={{ width: '22%' }}>No.</th>
                    <th className="center" style={{ width: '18%' }}>Metode</th>
                    <th className="right" style={{ width: '32%' }}>Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {detailTransactions.map((tx, i) => {
                    const amt = tx.amount ?? tx.total ?? 0;
                    const m = fmtMethod(tx.method ?? tx.paymentMethod ?? 'cash');
                    const ts = tx.timestamp?.toDate ? tx.timestamp.toDate() : new Date(tx.timestamp || Date.now());
                    const timeStr = ts.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
                    const txId = (tx.transactionId || tx.id || '').slice(-6).toUpperCase();
                    return (
                      <tr key={i}>
                        <td>{timeStr}</td>
                        <td className="bold font-mono">...{txId}</td>
                        <td className="center">{m}</td>
                        <td className="right bold">{formatMoney(amt)}</td>
                      </tr>
                    );
                  })}
                  <tr className="total-row">
                    <td colSpan={3} className="bold">TOTAL</td>
                    <td className="right bold">{formatMoney(b.total)}</td>
                  </tr>
                </tbody>
              </table>
            )}

            <hr className="dash" />

            <div className="section-title">Breakdown Pendapatan</div>
            {!isLoadingDetail && (
              <>
                {foodTotal > 0 && <div className="row"><span className="lbl">Food:</span><span className="val">{formatMoney(foodTotal)}</span></div>}
                {beverageTotal > 0 && <div className="row"><span className="lbl">Beverage:</span><span className="val">{formatMoney(beverageTotal)}</span></div>}
                {banquetTotal > 0 && <div className="row"><span className="lbl">Banquet:</span><span className="val">{formatMoney(banquetTotal)}</span></div>}
                {otherTotal > 0 && <div className="row"><span className="lbl">Lainnya:</span><span className="val">{formatMoney(otherTotal)}</span></div>}
                <hr className="dot" />
                <div className="row"><span className="lbl">Tunai / Cash:</span><span className="val">{formatMoney(b.cash)}</span></div>
                <div className="row"><span className="lbl">QRIS / E-Money:</span><span className="val">{formatMoney(b.qris)}</span></div>
                <div className="row"><span className="lbl">Debit / Kartu:</span><span className="val">{formatMoney(b.card)}</span></div>
                {b.transfer > 0 && <div className="row"><span className="lbl">Transfer:</span><span className="val">{formatMoney(b.transfer)}</span></div>}
                <hr className="dot" />
                <div className="row bold">
                  <span className="lbl">Total Pendapatan Shift:</span>
                  <span className="val">{formatMoney(b.total)}</span>
                </div>
              </>
            )}

            <hr className="dash" />

            <div className="section-title">Rekonsiliasi Laci Kas</div>
            <div className="row"><span className="lbl">House Bank (Modal Awal):</span><span className="val">{formatMoney(selectedHistoryShift.houseBank || 0)}</span></div>
            <div className="row"><span className="lbl">Penjualan Tunai:</span><span className="val">+{formatMoney(b.cash)}</span></div>
            {cashFlowIn > 0 && <div className="row"><span className="lbl">Cash In:</span><span className="val">+{formatMoney(cashFlowIn)}</span></div>}
            {cashFlowOut > 0 && <div className="row"><span className="lbl">Cash Out:</span><span className="val">-{formatMoney(cashFlowOut)}</span></div>}

            {(selectedHistoryShift.cashFlows || []).map((cf: any, i: number) => (
              <div key={i} className="row indent">
                <span className="lbl">↳ {cf.type === 'in' ? 'Masuk' : 'Keluar'} ({cf.note || '-'}):</span>
                <span className="val">{cf.type === 'in' ? '+' : '-'}{formatMoney(cf.amount || 0)}</span>
              </div>
            ))}

            <hr className="dot" />
            <div className="row"><span className="lbl">Estimasi Tunai di Laci:</span><span className="val bold">{formatMoney(expectedCash)}</span></div>
            <div className="row"><span className="lbl">Tunai Fisik Dihitung:</span><span className="val bold">{formatMoney(countedCash)}</span></div>
            <div className="row bold" style={{ marginTop: 4 }}>
              <span className="lbl">Selisih Laci:</span>
              <span className={`val ${cashDiff === 0 ? 'green' : cashDiff > 0 ? 'amber' : 'red'}`}>
                {cashDiff === 0 ? 'Balanced ✓' : cashDiff > 0 ? `+${formatMoney(cashDiff)} (Lebih)` : `${formatMoney(cashDiff)} (Kurang)`}
              </span>
            </div>

            {selectedHistoryShift.notes && (
              <>
                <hr className="dash" />
                <div className="section-title">Catatan Closing</div>
                <p className="italic" style={{ fontSize: 9.5, color: '#555', margin: '4px 0', lineHeight: 1.3 }}>{selectedHistoryShift.notes}</p>
              </>
            )}

            <hr className="dash" />

            <div className="center footer">
              <p>Dokumen ini adalah laporan resmi penutupan shift kasir.</p>
              <p>Dicetak: {new Date().toLocaleString('id-ID')}</p>
              <div className="center" style={{ borderTop: '1px dotted #000', marginTop: 8, paddingTop: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 7, color: '#000', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 900, marginBottom: 2 }}>powered by</span>
                <img src="/channels/1.png" alt="Setara Venture" style={{ height: 14, width: 'auto', opacity: 1, objectFit: 'contain', filter: 'grayscale(100%) brightness(0)' }} />
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
