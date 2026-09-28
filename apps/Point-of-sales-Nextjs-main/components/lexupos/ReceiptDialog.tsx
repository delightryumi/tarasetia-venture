'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Printer, UtensilsCrossed, Wine, CreditCard, 
  ClipboardCheck, Network, Settings, Loader2, Wifi, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription
} from '@/components/ui/alert-dialog';
import { CartItem } from './types';
import { toast } from 'react-toastify';
import { useCurrency } from '@/hooks/useCurrency';
import axios from 'axios';
import ThermalReceipt, { ReceiptItemData } from '@/components/shared/ThermalReceipt';

type PrintMode = 'all' | 'kitchen' | 'bar' | 'checker';

const PRINT_MODES: { key: PrintMode; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    key: 'all',
    label: 'Kasir',
    icon: <CreditCard size={13} />,
    desc: 'Struk kasir'
  },
  {
    key: 'checker',
    label: 'Checker',
    icon: <ClipboardCheck size={13} />,
    desc: 'Struk checker'
  },
  {
    key: 'kitchen',
    label: 'Kitchen',
    icon: <UtensilsCrossed size={13} />,
    desc: 'Tiket dapur'
  },
  {
    key: 'bar',
    label: 'Bar',
    icon: <Wine size={13} />,
    desc: 'Tiket bar'
  },
];

interface ReceiptDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  tableNumber: string;
  notes: string;
  paymentMethod: string;
  cart?: CartItem[] | any[];
  items?: ReceiptItemData[];
  subtotal: number;
  tax: number;
  discount: number;
  payableAmount: number;
  cashAmount: string;
  cashierName?: string;
  onClose?: () => void;
  transactionId?: string;
  status?: 'PAID' | 'UNPAID' | 'SUCCESS' | 'CANCELLED' | 'VOID' | string;
  service?: number;
  serviceRate?: number;
  taxRate?: number;
  date?: string;
  cancelReason?: string;
}

export default function ReceiptDialog({
  isOpen,
  onOpenChange,
  customerName,
  tableNumber,
  notes,
  paymentMethod,
  cart = [],
  items,
  subtotal,
  tax,
  discount,
  payableAmount,
  cashAmount,
  cashierName = 'Kasir',
  onClose,
  transactionId = '',
  status = 'PAID',
  service,
  serviceRate,
  taxRate,
  date,
  cancelReason,
}: ReceiptDialogProps) {
  const { formatCurrency } = useCurrency();
  const [storeName, setStoreName] = useState('BUMI ANYOM RESORT');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [printMode, setPrintMode] = useState<PrintMode>('all');
  const [paperSize, setPaperSize] = useState<'80mm' | '58mm'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pos_slip_paper_size');
      if (saved === '58mm' || saved === '80mm') return saved;
    }
    return '80mm';
  });

  // Direct IP Thermal Printer States
  const [printerIp, setPrinterIp] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pos_printer_ip') || '192.168.1.200';
    }
    return '192.168.1.200';
  });
  const [printerPort, setPrinterPort] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pos_printer_port') || '9100';
    }
    return '9100';
  });
  const [showIpConfig, setShowIpConfig] = useState<boolean>(false);
  const [isDirectPrinting, setIsDirectPrinting] = useState<boolean>(false);
  const [isTestingPrinter, setIsTestingPrinter] = useState<boolean>(false);

  const handlePaperSizeChange = (size: '80mm' | '58mm') => {
    setPaperSize(size);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_slip_paper_size', size);
    }
  };

  const handleSavePrinterIp = (ip: string, port: string) => {
    setPrinterIp(ip);
    setPrinterPort(port);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_printer_ip', ip);
      localStorage.setItem('pos_printer_port', port);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    // Fetch shop data
    axios.get('/api/shopdata')
      .then(res => {
        const d = res.data?.data;
        if (d) {
          if (d.name) setStoreName(d.name.toUpperCase());
          if (d.address) setAddress(d.address);
          if (d.phone) setPhone(d.phone);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const calculatedChange = () => {
    const cashVal = parseFloat(cashAmount) || 0;
    const diff = cashVal - payableAmount;
    return diff >= 0 ? diff : 0;
  };

  // Map cart items or use pre-mapped items
  const receiptItems: ReceiptItemData[] = items || (cart || []).map((item: any) => {
    const isCartItem = item && item.product;
    const name = isCartItem ? item.product.name : (item.name || 'Item');
    const price = isCartItem ? item.product.price : (item.price || 0);
    const quantity = isCartItem ? item.quantity : (item.quantity || item.qty || 1);
    const addons = isCartItem ? (item.selectedAddons || []) : (item.addons || []);
    const note = item.note || '';
    const category = isCartItem ? item.product.category : item.category;
    const subcategory = isCartItem ? item.product.subcategory : item.subcategory;

    return {
      id: item.id || item.cartItemId || item.product?.id || `rcp-${Math.random().toString(36).substring(7)}`,
      name,
      price,
      quantity,
      selectedAddons: addons,
      note,
      category: category || '',
      subcategory: subcategory || ''
    };
  });

  const now = new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Direct IP Thermal Print Execution (No Windows print dialog!)
  const handleDirectIpPrint = async () => {
    if (!printerIp.trim()) {
      toast.warning('Silakan atur IP Printer LAN terlebih dahulu.');
      setShowIpConfig(true);
      return;
    }

    setIsDirectPrinting(true);
    try {
      const res = await axios.post('/api/printer/direct-print', {
        printerIp: printerIp.trim(),
        printerPort: Number(printerPort) || 9100,
        paperSize,
        printMode,
        orderData: {
          storeName,
          storeAddress: address,
          storePhone: phone,
          transactionId: transactionId || 'TRX-POS',
          date: date || now,
          cashierName,
          tableNumber: tableNumber || 'Take Away',
          customerName: customerName || 'Guest',
          paymentMethod: status === 'UNPAID' ? 'BELUM BAYAR (HOLD)' : paymentMethod,
          notes,
          items: receiptItems,
          subtotal,
          discount,
          tax,
          taxRate: taxRate !== undefined ? taxRate : (subtotal - discount > 0 ? Math.round((tax / (subtotal - discount)) * 100) : 10),
          service,
          serviceRate,
          payableAmount,
          cashAmount: status === 'UNPAID' ? undefined : (paymentMethod === 'cash' || !isNaN(parseFloat(cashAmount)) ? parseFloat(cashAmount) : undefined),
          changeAmount: status === 'UNPAID' ? undefined : (paymentMethod === 'cash' ? calculatedChange() : undefined),
          status
        }
      });

      if (res.data?.success) {
        toast.success(`Struk berhasil dicetak langsung ke Printer IP ${printerIp}:${printerPort}!`);
      } else {
        toast.error(res.data?.error || 'Gagal mengirim sinyal ke printer.');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Koneksi ke printer IP gagal.';
      toast.error(errorMsg);
    } finally {
      setIsDirectPrinting(false);
    }
  };

  // Test Printer LAN connection
  const handleTestPrinter = async () => {
    if (!printerIp.trim()) {
      toast.warning('Masukkan IP Printer terlebih dahulu.');
      return;
    }

    setIsTestingPrinter(true);
    try {
      const res = await axios.post('/api/printer/test', {
        printerIp: printerIp.trim(),
        printerPort: Number(printerPort) || 9100
      });

      if (res.data?.success) {
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message || 'Printer tidak merespons.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghubungi printer.');
    } finally {
      setIsTestingPrinter(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl w-full max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-zinc-950 border border-neutral-200/80 dark:border-white/[0.08] shadow-2xl rounded-2xl print:m-0 print:p-0 print:border-none print:shadow-none print:w-full print:max-w-full">
        
        {/* ── Dialog Header ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 dark:border-white/[0.06] bg-neutral-50/50 dark:bg-zinc-900/50 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${status === 'UNPAID' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <AlertDialogTitle className="text-sm font-bold text-neutral-900 dark:text-white leading-tight">
                {status === 'UNPAID' ? 'Tagihan Sementara (Hold Bill)' : 'Struk Transaksi Selesai'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-tight">
                {transactionId ? `#${transactionId}` : 'Transaksi Kasir POS'}
              </AlertDialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* IP Printer Config Button */}
            <button
              type="button"
              onClick={() => setShowIpConfig(!showIpConfig)}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                showIpConfig 
                  ? 'bg-blue-600 text-white border-transparent' 
                  : 'bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100'
              }`}
              title="Pengaturan IP Printer"
            >
              <Network className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono hidden sm:inline">{printerIp}</span>
            </button>
          </div>
        </div>

        {/* ── IP Printer Configuration Collapsible Bar ── */}
        {showIpConfig && (
          <div className="p-3 bg-blue-50/80 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 text-xs flex flex-col gap-2 animate-in fade-in duration-150 print:hidden">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1">
                <Network className="w-3.5 h-3.5" />
                Pengaturan Direct IP LAN Printer
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400">
                Port default: 9100
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="IP Printer, misal: 192.168.1.200"
                value={printerIp}
                onChange={(e) => handleSavePrinterIp(e.target.value, printerPort)}
                className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 font-mono focus:outline-none"
              />
              <input
                type="text"
                placeholder="Port"
                value={printerPort}
                onChange={(e) => handleSavePrinterIp(printerIp, e.target.value)}
                className="w-16 text-xs px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 font-mono text-center focus:outline-none"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleTestPrinter}
                disabled={isTestingPrinter}
                className="h-8 rounded-lg text-[11px] bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 px-3"
              >
                {isTestingPrinter ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
                <span>Test IP</span>
              </Button>
            </div>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
              Direct IP mencetak langsung ke printer thermal LAN tanpa memunculkan dialog Windows.
            </p>
          </div>
        )}

        {/* ── Mode Selector Tabs (Kasir / Checker / Kitchen / Bar) ── */}
        <div className="px-4 pt-3 pb-2 border-b border-neutral-100 dark:border-white/[0.06] bg-neutral-50/30 dark:bg-zinc-900/30 print:hidden">
          <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-100 dark:bg-zinc-900 rounded-xl border border-neutral-200/80 dark:border-white/[0.06]">
            {PRINT_MODES.map((m) => {
              const isActive = printMode === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPrintMode(m.key)}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-xs border border-neutral-200/80 dark:border-white/[0.08]'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {m.icon}
                    <span>{m.label}</span>
                  </div>
                  <span className="text-[9px] font-normal text-neutral-400 dark:text-neutral-500 truncate max-w-full">
                    {m.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Paper Size Selector Bar ── */}
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-50/50 dark:bg-zinc-900/50 border-b border-neutral-100 dark:border-white/[0.06] print:hidden">
          <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
            Ukuran Kertas Thermal:
          </span>
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-neutral-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={() => handlePaperSizeChange('80mm')}
              className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-md transition-all ${
                paperSize === '80mm'
                  ? 'bg-white dark:bg-zinc-700 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              80mm (Standar)
            </button>
            <button
              type="button"
              onClick={() => handlePaperSizeChange('58mm')}
              className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-md transition-all ${
                paperSize === '58mm'
                  ? 'bg-white dark:bg-zinc-700 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              58mm (Mini)
            </button>
          </div>
        </div>

        {/* ── Scrollable receipt body (clean, single-layer scroll, no nested looping) ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-100/70 dark:bg-zinc-900/60 flex justify-center items-start print:p-0 print:block print:overflow-visible print:w-full print:max-w-full">
          <div className="w-full flex justify-center print:block print:w-full">
            <ThermalReceipt
              shopInfo={{ name: storeName, address, phone }}
              transactionInfo={{ 
                id: transactionId || 'TRX-POS', 
                date: date || now, 
                customerName, 
                cashierName, 
                paymentMethod: status === 'UNPAID' ? 'unpaid' : paymentMethod,
                status: status,
                cancelReason: cancelReason,
                tableName: tableNumber || undefined,
              }}
              items={receiptItems}
              totals={{
                subtotal, 
                discount, 
                taxRate: taxRate !== undefined ? taxRate : (subtotal - discount > 0 ? Math.round((tax / (subtotal - discount)) * 100) : 10), 
                taxAmount: tax, 
                serviceRate: serviceRate,
                serviceAmount: service,
                payableAmount, 
                cashAmount: status === 'UNPAID' ? undefined : (paymentMethod === 'cash' || !isNaN(parseFloat(cashAmount)) ? parseFloat(cashAmount) : undefined), 
                changeAmount: status === 'UNPAID' ? undefined : (paymentMethod === 'cash' ? calculatedChange() : undefined)
              }}
              printMode={printMode}
              paperSize={paperSize}
              className="shadow-md border border-neutral-200 dark:border-zinc-800 rounded-xl bg-white print:shadow-none print:border-none print:w-full print:rounded-none"
            />
          </div>
        </div>

        {/* ── Footer Print Buttons ── */}
        <AlertDialogFooter className="flex flex-row items-center justify-between gap-3 px-5 py-3 border-t border-neutral-100 dark:border-white/[0.06] bg-neutral-50/50 dark:bg-zinc-900/50 print:hidden">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Direct Print LAN / IP Button */}
            <Button
              type="button"
              onClick={handleDirectIpPrint}
              disabled={isDirectPrinting}
              className="rounded-xl flex-1 max-w-[270px] min-w-[190px] flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold h-9 shadow-sm"
            >
              {isDirectPrinting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <Network className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate">Direct IP ({printerIp})</span>
            </Button>

            {/* Windows Print Dialog (Fallback) */}
            <Button
              variant="outline"
              type="button"
              onClick={() => window.print()}
              className="rounded-xl flex items-center justify-center gap-1.5 border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 text-xs font-semibold h-9 px-3.5 shrink-0 hover:bg-neutral-100"
              title="Buka dialog printer Windows"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300 shrink-0" />
              <span>Windows Print</span>
            </Button>
          </div>

          <AlertDialogAction
            onClick={onClose}
            className="rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 border-none text-xs font-bold h-9 px-5 shrink-0 shadow-sm"
          >
            Selesai
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
