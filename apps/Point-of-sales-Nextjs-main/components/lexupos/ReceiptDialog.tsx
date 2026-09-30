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
import ThermalReceipt, { ReceiptItemData, printThermalReceipt } from '@/components/shared/ThermalReceipt';

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

  // Direct IP Thermal Printer States (Kasir, Kitchen, Bar)
  const [cashierPrinterIp, setCashierPrinterIp] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pos_printer_ip_cashier') || localStorage.getItem('pos_printer_ip') || '192.168.1.200';
    }
    return '192.168.1.200';
  });
  const [kitchenPrinterIp, setKitchenPrinterIp] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pos_printer_ip_kitchen') || '';
    }
    return '';
  });
  const [barPrinterIp, setBarPrinterIp] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pos_printer_ip_bar') || '';
    }
    return '';
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

  // Active printer IP dynamically resolved based on current printMode
  const activePrinterIp = (() => {
    if (printMode === 'kitchen' && kitchenPrinterIp.trim()) return kitchenPrinterIp.trim();
    if (printMode === 'bar' && barPrinterIp.trim()) return barPrinterIp.trim();
    return cashierPrinterIp.trim();
  })();

  const activeDepartmentLabel = (() => {
    if (printMode === 'kitchen') return 'Dapur (Kitchen)';
    if (printMode === 'bar') return 'Bar';
    if (printMode === 'checker') return 'Checker';
    return 'Kasir';
  })();

  const handlePaperSizeChange = (size: '80mm' | '58mm') => {
    setPaperSize(size);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_slip_paper_size', size);
    }
  };

  const handleSavePrinterSettings = (field: 'cashier' | 'kitchen' | 'bar' | 'port', val: string) => {
    if (typeof window === 'undefined') return;
    if (field === 'cashier') {
      setCashierPrinterIp(val);
      localStorage.setItem('pos_printer_ip_cashier', val);
      localStorage.setItem('pos_printer_ip', val);
    } else if (field === 'kitchen') {
      setKitchenPrinterIp(val);
      localStorage.setItem('pos_printer_ip_kitchen', val);
    } else if (field === 'bar') {
      setBarPrinterIp(val);
      localStorage.setItem('pos_printer_ip_bar', val);
    } else if (field === 'port') {
      setPrinterPort(val);
      localStorage.setItem('pos_printer_port', val);
    }
    window.dispatchEvent(new Event('receiptConfigChanged'));
  };

  const playNotificationSound = () => {
    try {
      const soundUrl = (typeof window !== 'undefined' && localStorage.getItem('pos_sound_url')) || '/sounds/notification.mp3';
      const audio = new Audio(soundUrl);
      audio.volume = 1.0;
      audio.play().catch(e => console.log('Audio autoplay blocked:', e));
    } catch (err) {
      console.warn('Audio playback error:', err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    // Play notification chime immediately upon completing order
    playNotificationSound();

    // Sync direct IP printer settings from localStorage/settings
    if (typeof window !== 'undefined') {
      setCashierPrinterIp(localStorage.getItem('pos_printer_ip_cashier') || localStorage.getItem('pos_printer_ip') || '192.168.1.200');
      setKitchenPrinterIp(localStorage.getItem('pos_printer_ip_kitchen') || '');
      setBarPrinterIp(localStorage.getItem('pos_printer_ip_bar') || '');
      setPrinterPort(localStorage.getItem('pos_printer_port') || '9100');
    }

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
    if (!activePrinterIp) {
      toast.warning(`Silakan atur IP Printer LAN untuk ${activeDepartmentLabel} terlebih dahulu.`);
      setShowIpConfig(true);
      return;
    }

    setIsDirectPrinting(true);
    try {
      const res = await axios.post('/api/printer/direct-print', {
        printerIp: activePrinterIp,
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
        playNotificationSound();
        toast.success(`Struk berhasil dicetak ke Printer ${activeDepartmentLabel} (${activePrinterIp}:${printerPort})!`);
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

  // Test Printer LAN connection for current active printer
  const handleTestPrinter = async (ipToTest?: string) => {
    const targetIp = (ipToTest || activePrinterIp).trim();
    if (!targetIp) {
      toast.warning('Masukkan IP Printer terlebih dahulu.');
      return;
    }

    setIsTestingPrinter(true);
    try {
      const res = await axios.post('/api/printer/test', {
        printerIp: targetIp,
        printerPort: Number(printerPort) || 9100
      });

      if (res.data?.success) {
        toast.success(`Printer ${targetIp}: ${res.data.message}`);
      } else {
        toast.error(res.data.message || `Printer ${targetIp} tidak merespons.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Gagal menghubungi printer ${targetIp}.`);
    } finally {
      setIsTestingPrinter(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl w-full max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-zinc-950 border border-neutral-200/80 dark:border-white/[0.08] shadow-2xl rounded-2xl print:static print:transform-none print:left-0 print:top-0 print:m-0 print:p-0 print:border-none print:shadow-none print:w-full print:max-w-full print:max-h-none print:h-auto print:overflow-visible print:bg-white">
        
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
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                showIpConfig 
                  ? 'bg-blue-600 text-white border-transparent' 
                  : 'bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100'
              }`}
              title="Pengaturan IP Printer Departemen"
            >
              <Network className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono hidden sm:inline">{activePrinterIp} ({activeDepartmentLabel})</span>
            </button>
          </div>
        </div>

        {/* ── IP Printer Configuration Collapsible Bar (Multi-Department) ── */}
        {showIpConfig && (
          <div className="p-3.5 bg-blue-50/90 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/40 text-xs flex flex-col gap-2.5 animate-in fade-in duration-150 print:hidden">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1">
                <Network className="w-3.5 h-3.5 text-blue-600" />
                Pengaturan Direct IP LAN Printer Per Departemen
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                Port default: 9100 (RAW Socket)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* IP Kasir */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300">
                  IP Printer Kasir {printMode === 'all' || printMode === 'checker' ? '(Aktif)' : ''}:
                </label>
                <input
                  type="text"
                  placeholder="192.168.1.200"
                  value={cashierPrinterIp}
                  onChange={(e) => handleSavePrinterSettings('cashier', e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 font-mono focus:outline-none"
                />
              </div>

              {/* IP Kitchen */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300">
                  IP Printer Kitchen {printMode === 'kitchen' ? '(Aktif)' : ''}:
                </label>
                <input
                  type="text"
                  placeholder="Opsional (ikuti Kasir)"
                  value={kitchenPrinterIp}
                  onChange={(e) => handleSavePrinterSettings('kitchen', e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 font-mono focus:outline-none"
                />
              </div>

              {/* IP Bar */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300">
                  IP Printer Bar {printMode === 'bar' ? '(Aktif)' : ''}:
                </label>
                <input
                  type="text"
                  placeholder="Opsional (ikuti Kasir)"
                  value={barPrinterIp}
                  onChange={(e) => handleSavePrinterSettings('bar', e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-blue-200/50 dark:border-blue-900/30">
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                Departemen aktif: <strong className="text-blue-700 dark:text-blue-300">{activeDepartmentLabel}</strong> &rarr; IP target: <strong className="font-mono text-neutral-800 dark:text-white">{activePrinterIp}</strong>
              </span>
              <Button
                type="button"
                size="sm"
                onClick={() => handleTestPrinter(activePrinterIp)}
                disabled={isTestingPrinter}
                className="h-7 rounded-lg text-[10.5px] bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 px-3 shrink-0"
              >
                {isTestingPrinter ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
                <span>Test IP {activeDepartmentLabel}</span>
              </Button>
            </div>
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-100/70 dark:bg-zinc-900/60 flex justify-center items-start print:p-0 print:m-0 print:block print:overflow-visible print:w-full print:max-w-full print:h-auto print:max-h-none">
          <div className="w-full flex justify-center print:block print:w-full print:m-0 print:p-0">
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
              title={`Cetak langsung via LAN Socket ke IP ${activePrinterIp}:${printerPort} (${activeDepartmentLabel})`}
            >
              {isDirectPrinting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <Network className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate">Direct IP ({activePrinterIp})</span>
            </Button>

            {/* Windows Print Dialog (Fallback) */}
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                playNotificationSound();
                printThermalReceipt('thermal-receipt-printable', paperSize);
              }}
              className="rounded-xl flex items-center justify-center gap-1.5 border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 text-xs font-semibold h-9 px-3.5 shrink-0 hover:bg-neutral-100"
              title={`Cetak struk ukuran ${paperSize} via Windows Print`}
            >
              <Printer className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300 shrink-0" />
              <span>Windows Print ({paperSize})</span>
            </Button>
          </div>

          <AlertDialogAction
            onClick={() => {
              playNotificationSound();
              if (onClose) {
                onClose();
              } else if (onOpenChange) {
                onOpenChange(false);
              }
            }}
            className="rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 border-none text-xs font-bold h-9 px-5 shrink-0 shadow-sm"
          >
            Selesai
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
