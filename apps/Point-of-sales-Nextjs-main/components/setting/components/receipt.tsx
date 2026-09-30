'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-toastify';
import { ReloadIcon } from '@radix-ui/react-icons';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Receipt, 
  Printer, 
  Store, 
  FileText, 
  MessageSquare, 
  Settings2, 
  Check, 
  QrCode, 
  Eye, 
  Wifi, 
  Instagram, 
  Phone, 
  MapPin, 
  UploadCloud, 
  Trash2,
  Ban,
  Globe,
  Lock,
  Smartphone,
  Network,
  Loader2
} from 'lucide-react';
import ThermalReceipt, { printThermalReceipt } from '@/components/shared/ThermalReceipt';

export interface PosReceiptConfig {
  shopName: string;
  address: string;
  phone: string;
  npwp?: string;
  headerNote?: string;
  showLogo: boolean;
  logoUrl?: string;
  
  // Transaction Display
  showCashier: boolean;
  showCustomer: boolean;
  showTable: boolean;
  showOrderNumber: boolean;
  groupByCategory: boolean;
  showNotes: boolean;
  showTaxService: boolean;
  showPaymentMethod: boolean;

  // Footer & Message
  footerMessage: string;
  socialMedia: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  wifiInfo: string;
  
  // QR Configuration (4 Options)
  qrType: 'none' | 'estruk' | 'wifi' | 'website';
  wifiSsid?: string;
  wifiPassword?: string;
  wifiSecurity?: 'WPA' | 'WEP' | 'nopass';
  websiteUrl?: string;
  qrCustomLabel?: string;
  receiptDomain?: string;

  // Thermal Printing
  paperWidth: '58mm' | '80mm';
  fontSize: 'compact' | 'normal' | 'large';
  printCopies: number;
  autoCut: boolean;

  // Direct IP LAN Printer Settings (Inline with LexuPOS)
  cashierPrinterIp?: string;
  kitchenPrinterIp?: string;
  barPrinterIp?: string;
  printerPort?: string;
}

const DEFAULT_RECEIPT_CONFIG: PosReceiptConfig = {
  shopName: 'Resto Setara',
  address: '',
  phone: '',
  npwp: '',
  headerNote: '',
  showLogo: true,
  logoUrl: '',
  
  showCashier: true,
  showCustomer: true,
  showTable: true,
  showOrderNumber: true,
  groupByCategory: true,
  showNotes: true,
  showTaxService: true,
  showPaymentMethod: true,

  footerMessage: 'Terima kasih atas kunjungan Anda!',
  socialMedia: '',
  instagram: '',
  facebook: '',
  tiktok: '',
  wifiInfo: '',
  
  qrType: 'estruk',
  wifiSsid: '',
  wifiPassword: '',
  wifiSecurity: 'WPA',
  websiteUrl: '',
  qrCustomLabel: '',
  receiptDomain: 'https://point.mytara.id',

  paperWidth: '80mm',
  fontSize: 'normal',
  printCopies: 1,
  autoCut: true,

  cashierPrinterIp: '192.168.1.200',
  kitchenPrinterIp: '',
  barPrinterIp: '',
  printerPort: '9100',
};

export default function ReceiptSettingCard() {
  const [config, setConfig] = useState<PosReceiptConfig>(DEFAULT_RECEIPT_CONFIG);
  const [hotelCode, setHotelCode] = useState<string>('1');
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'header' | 'transaction' | 'footer' | 'paper'>('header');
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const [testingDepartment, setTestingDepartment] = useState<'cashier' | 'kitchen' | 'bar' | null>(null);

  // 1. Load configuration from Firestore & localStorage
  useEffect(() => {
    const getCookie = (name: string) => {
      if (typeof document === 'undefined') return '';
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
    setHotelCode(code);

    const savedCashierIp = (typeof window !== 'undefined' && (localStorage.getItem('pos_printer_ip_cashier') || localStorage.getItem('pos_printer_ip'))) || '192.168.1.200';
    const savedKitchenIp = (typeof window !== 'undefined' && localStorage.getItem('pos_printer_ip_kitchen')) || '';
    const savedBarIp = (typeof window !== 'undefined' && localStorage.getItem('pos_printer_ip_bar')) || '';
    const savedPort = (typeof window !== 'undefined' && localStorage.getItem('pos_printer_port')) || '9100';

    // Real-time listener for receipt config
    const receiptRef = doc(db, 'hotels', code, 'settings', 'pos_receipt');
    const unsubReceipt = onSnapshot(receiptRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const finalCashier = data.cashierPrinterIp || savedCashierIp;
        const finalKitchen = data.kitchenPrinterIp ?? savedKitchenIp;
        const finalBar = data.barPrinterIp ?? savedBarIp;
        const finalPort = data.printerPort || savedPort;

        if (typeof window !== 'undefined') {
          localStorage.setItem('pos_printer_ip_cashier', finalCashier);
          localStorage.setItem('pos_printer_ip', finalCashier);
          localStorage.setItem('pos_printer_ip_kitchen', finalKitchen);
          localStorage.setItem('pos_printer_ip_bar', finalBar);
          localStorage.setItem('pos_printer_port', finalPort);
        }

        const hasIndividualSocial = data.instagram !== undefined || data.facebook !== undefined || data.tiktok !== undefined;
        const currentSocial = hasIndividualSocial
          ? [
              data.instagram && `IG: ${data.instagram}`,
              data.facebook  && `FB: ${data.facebook}`,
              data.tiktok    && `Tiktok: ${data.tiktok}`
            ].filter(Boolean).join(' · ')
          : '';

        setConfig(prev => ({
          ...prev,
          ...data,
          socialMedia: currentSocial,
          cashierPrinterIp: finalCashier,
          kitchenPrinterIp: finalKitchen,
          barPrinterIp: finalBar,
          printerPort: finalPort,
        }));
      } else {
        // Fallback to pos main settings
        const posRef = doc(db, 'hotels', code, 'settings', 'pos');
        getDoc(posRef).then(posSnap => {
          if (posSnap.exists()) {
            const posData = posSnap.data();
            setConfig(prev => ({
              ...prev,
              shopName: posData.name || prev.shopName,
              address: posData.address || '',
              phone: posData.phone || '',
              logoUrl: posData.shopLogo || posData.logo || '',
              headerNote: '',
              socialMedia: '',
              instagram: '',
              facebook: '',
              tiktok: '',
              wifiInfo: '',
              cashierPrinterIp: savedCashierIp,
              kitchenPrinterIp: savedKitchenIp,
              barPrinterIp: savedBarIp,
              printerPort: savedPort,
            }));
          }
        });
      }
      setIsPageLoading(false);
    }, (err) => {
      console.error('Error loading receipt config:', err);
      setIsPageLoading(false);
    });

    return () => unsubReceipt();
  }, []);

  // IP Printer inline handlers
  const handlePrinterIpChange = (field: 'cashier' | 'kitchen' | 'bar' | 'port', val: string) => {
    if (field === 'cashier') {
      setConfig(prev => ({ ...prev, cashierPrinterIp: val }));
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_printer_ip_cashier', val);
        localStorage.setItem('pos_printer_ip', val);
      }
    } else if (field === 'kitchen') {
      setConfig(prev => ({ ...prev, kitchenPrinterIp: val }));
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_printer_ip_kitchen', val);
      }
    } else if (field === 'bar') {
      setConfig(prev => ({ ...prev, barPrinterIp: val }));
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_printer_ip_bar', val);
      }
    } else if (field === 'port') {
      setConfig(prev => ({ ...prev, printerPort: val }));
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_printer_port', val);
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('receiptConfigChanged'));
    }
  };

  const handleTestIpPrinter = async (dept: 'cashier' | 'kitchen' | 'bar') => {
    let targetIp = '';
    let deptName = '';
    if (dept === 'cashier') {
      targetIp = (config.cashierPrinterIp || '192.168.1.200').trim();
      deptName = 'Kasir';
    } else if (dept === 'kitchen') {
      targetIp = (config.kitchenPrinterIp || config.cashierPrinterIp || '192.168.1.200').trim();
      deptName = 'Kitchen';
    } else if (dept === 'bar') {
      targetIp = (config.barPrinterIp || config.cashierPrinterIp || '192.168.1.200').trim();
      deptName = 'Bar';
    }

    if (!targetIp) {
      toast.warning(`Masukkan IP Printer ${deptName} terlebih dahulu.`);
      return;
    }

    setTestingDepartment(dept);
    try {
      const res = await axios.post('/api/printer/test', {
        printerIp: targetIp,
        printerPort: Number(config.printerPort) || 9100
      });

      if (res.data?.success) {
        toast.success(`Printer ${deptName} (${targetIp}): ${res.data.message}`);
      } else {
        toast.error(res.data.message || `Printer ${deptName} (${targetIp}) tidak merespons.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Gagal menghubungi printer ${deptName} (${targetIp}).`);
    } finally {
      setTestingDepartment(null);
    }
  };

  // 2. Handle Save
  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const receiptRef = doc(db, 'hotels', hotelCode, 'settings', 'pos_receipt');
      await setDoc(receiptRef, config, { merge: true });

      // Sync key identity fields to main pos setting as well
      const posRef = doc(db, 'hotels', hotelCode, 'settings', 'pos');
      await setDoc(posRef, {
        name: config.shopName,
        address: config.address,
        phone: config.phone,
        logo: config.logoUrl || '',
        shopLogo: config.logoUrl || '',
        receiptPaperSize: config.paperWidth
      }, { merge: true });

      if (typeof window !== 'undefined') {
        localStorage.setItem('posReceiptConfig', JSON.stringify(config));
        localStorage.setItem('shop_info', JSON.stringify({ address: config.address, phone: config.phone }));
        if (config.logoUrl) {
          localStorage.setItem('shopLogo', config.logoUrl);
        } else {
          localStorage.removeItem('shopLogo');
        }

        // Sync Direct IP Printer settings to localStorage
        if (config.cashierPrinterIp) {
          localStorage.setItem('pos_printer_ip_cashier', config.cashierPrinterIp);
          localStorage.setItem('pos_printer_ip', config.cashierPrinterIp);
        }
        if (config.kitchenPrinterIp !== undefined) {
          localStorage.setItem('pos_printer_ip_kitchen', config.kitchenPrinterIp);
        }
        if (config.barPrinterIp !== undefined) {
          localStorage.setItem('pos_printer_ip_bar', config.barPrinterIp);
        }
        if (config.printerPort) {
          localStorage.setItem('pos_printer_port', config.printerPort);
        }

        window.dispatchEvent(new Event('receiptConfigChanged'));
        window.dispatchEvent(new Event('logoChanged'));
      }

      toast.success('Pengaturan struk kasir berhasil disimpan!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan pengaturan struk.');
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Handle Image Upload for Receipt Logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran logo maksimal 2 MB.');
      return;
    }

    setIsUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 400;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/png');
          setConfig(prev => ({ ...prev, logoUrl: compressed, showLogo: true }));
          localStorage.setItem('shopLogo', compressed);
          toast.success('Logo struk berhasil diunggah!');
        }
        setIsUploadingLogo(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 4. Test Print Handler
  const handleTestPrint = () => {
    printThermalReceipt('thermal-receipt-printable', config.paperWidth);
  };

  if (isPageLoading) {
    return (
      <Card className="my-5">
        <CardContent className="py-10 flex flex-col items-center justify-center gap-2">
          <ReloadIcon className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Memuat pengaturan struk...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full">
      <Card className="my-5 overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <CardHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs">
                  <Receipt size={16} />
                </span>
                <CardTitle className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  Pengaturan Struk Kasir
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                Atur identitas toko, rincian transaksi, catatan penutup, logo, serta ukuran kertas printer thermal (58mm / 80mm).
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestPrint}
                className="h-8 px-3 text-xs font-semibold rounded-lg flex items-center gap-1.5"
              >
                <Printer size={13} />
                <span>Cetak Uji Coba</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="h-8 px-4 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                {isSaving ? <ReloadIcon className="h-3 w-3 animate-spin" /> : <Check size={13} />}
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
              </Button>
            </div>
          </div>

          {/* POSONE Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pt-4 border-t border-neutral-100 dark:border-neutral-800/60 scrollbar-none">
            {[
              { id: 'header', label: 'Header & Toko', icon: Store },
              { id: 'transaction', label: 'Tampilan Transaksi', icon: FileText },
              { id: 'footer', label: 'Footer & Pesan', icon: MessageSquare },
              { id: 'paper', label: 'Format Printer', icon: Settings2 },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border-b-2 transition-all shrink-0 cursor-pointer -mb-[1px] ${
                    isActive
                      ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white font-bold'
                      : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT: Configuration Forms */}
            <div className="lg:col-span-7 space-y-6">
              {/* TAB 1: HEADER & TOKO */}
              {activeTab === 'header' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Nama Toko / Resto di Struk
                    </label>
                    <Input
                      value={config.shopName}
                      onChange={e => setConfig(prev => ({ ...prev, shopName: e.target.value }))}
                      placeholder="Nama usaha..."
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                      <span>NPWP Toko / Badan Usaha</span>
                      <span className="text-[10px] font-normal text-neutral-400">Opsional</span>
                    </label>
                    <Input
                      value={config.npwp ?? config.headerNote ?? ''}
                      onChange={e => setConfig(prev => ({ ...prev, npwp: e.target.value, headerNote: e.target.value }))}
                      placeholder="cth: 01.234.567.8-901.000 (kosongkan jika tidak ada)"
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                        <Phone size={12} /> No. Telepon / WhatsApp
                      </label>
                      <Input
                        value={config.phone}
                        onChange={e => setConfig(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+62 812..."
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                        <MapPin size={12} /> Alamat Outlet
                      </label>
                      <Input
                        value={config.address}
                        onChange={e => setConfig(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Alamat lengkap..."
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  {/* Logo Struk Upload */}
                  <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
                          Tampilkan Logo di Header Struk
                        </span>
                        <p className="text-[11px] text-neutral-500">
                          Logo monokrom / hitam-putih akan dicetak di bagian paling atas struk.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.showLogo}
                        onChange={e => setConfig(prev => ({ ...prev, showLogo: e.target.checked }))}
                        className="w-9 h-5 bg-neutral-300 checked:bg-neutral-900 dark:checked:bg-white rounded-full appearance-none relative cursor-pointer transition-all duration-300 before:content-[''] before:absolute before:h-4 before:w-4 before:bg-white dark:before:bg-stone-900 before:rounded-full before:top-0.5 before:left-0.5 before:transition-all before:duration-300 checked:before:left-4.5"
                      />
                    </div>

                    {config.showLogo && (
                      <div className="p-3.5 bg-neutral-50 dark:bg-neutral-900/60 border rounded-xl flex items-center gap-4">
                        {config.logoUrl ? (
                          <div className="w-16 h-16 rounded-lg bg-white p-1.5 border shrink-0 flex items-center justify-center">
                            <img src={config.logoUrl} alt="Receipt Logo" className="w-full h-full object-contain filter grayscale contrast-125" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-neutral-200 dark:bg-neutral-800 shrink-0 flex items-center justify-center text-neutral-400">
                            <Store size={24} />
                          </div>
                        )}

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <span className="text-xs font-bold block text-neutral-800 dark:text-neutral-200">
                            {config.logoUrl ? 'Logo Struk Terpasang' : 'Belum Ada Logo Struk'}
                          </span>
                          <div className="flex items-center gap-2">
                            <label className="h-7 px-3 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border text-[11px] font-bold rounded-md inline-flex items-center gap-1 cursor-pointer transition-colors">
                              <UploadCloud size={12} />
                              <span>{isUploadingLogo ? 'Mengunggah...' : 'Ganti Logo'}</span>
                              <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={isUploadingLogo} className="hidden" />
                            </label>

                            {config.logoUrl && (
                              <button
                                type="button"
                                onClick={() => setConfig(prev => ({ ...prev, logoUrl: '' }))}
                                className="h-7 px-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-[11px] font-medium rounded-md transition-colors flex items-center gap-1"
                              >
                                <Trash2 size={12} /> Hapus
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: TAMPILAN TRANSAKSI */}
              {activeTab === 'transaction' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'showOrderNumber', label: 'Nomor Struk / Antrean', desc: 'Tampilkan No. Order di header transaksi' },
                      { key: 'showTable', label: 'Nomor Meja', desc: 'Tampilkan tag meja resto (cth: Meja 1)' },
                      { key: 'showCustomer', label: 'Nama Tamu / Pelanggan', desc: 'Tampilkan nama pemesan di struk' },
                      { key: 'showCashier', label: 'Nama Kasir', desc: 'Tampilkan nama staf kasir bertugas' },
                      { key: 'groupByCategory', label: 'Kelompokkan Kategori', desc: 'Pisahkan Makanan & Minuman di struk' },
                      { key: 'showNotes', label: 'Catatan & Add-ons Item', desc: 'Cetak varian atau note khusus per pesanan' },
                      { key: 'showTaxService', label: 'Rincian Pajak & Service', desc: 'Tampilkan baris Pajak PPN & Service Charge' },
                      { key: 'showPaymentMethod', label: 'Metode Pembayaran', desc: 'Tampilkan TUNAI, QRIS, KARTU di bawah total' },
                    ].map(item => (
                      <label
                        key={item.key}
                        className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/70 dark:border-neutral-800 rounded-xl cursor-pointer hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40 transition-colors select-none"
                      >
                        <input
                          type="checkbox"
                          checked={(config as any)[item.key]}
                          onChange={e => setConfig(prev => ({ ...prev, [item.key]: e.target.checked }))}
                          className="mt-0.5 rounded border-neutral-300 text-neutral-900 focus:ring-0"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
                            {item.label}
                          </span>
                          <span className="text-[10px] text-neutral-500 leading-tight block mt-0.5">
                            {item.desc}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: FOOTER & PESAN */}
              {activeTab === 'footer' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Pesan Penutup / Ucapan Terima Kasih (Footer Note)
                    </label>
                    <textarea
                      rows={3}
                      value={config.footerMessage ?? ''}
                      onChange={e => setConfig(prev => ({ ...prev, footerMessage: e.target.value }))}
                      placeholder="Pesan ucapan terima kasih di bawah struk..."
                      className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-900 resize-none font-sans"
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <Instagram size={12} /> Media Sosial
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-neutral-500 w-14 shrink-0">Instagram</span>
                        <Input
                          value={config.instagram ?? ''}
                          onChange={e => setConfig(prev => ({ ...prev, instagram: e.target.value }))}
                          placeholder="@namatoko"
                          className="h-8 text-xs flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-neutral-500 w-14 shrink-0">Facebook</span>
                        <Input
                          value={config.facebook ?? ''}
                          onChange={e => setConfig(prev => ({ ...prev, facebook: e.target.value }))}
                          placeholder="nama halaman FB"
                          className="h-8 text-xs flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-neutral-500 w-14 shrink-0">TikTok</span>
                        <Input
                          value={config.tiktok ?? ''}
                          onChange={e => setConfig(prev => ({ ...prev, tiktok: e.target.value }))}
                          placeholder="@namatoko"
                          className="h-8 text-xs flex-1"
                        />
                      </div>
                    </div>
                    {(config.instagram || config.facebook || config.tiktok) && (
                      <p className="text-[10px] text-neutral-400 leading-snug">
                        Preview: {[
                          config.instagram && `IG: ${config.instagram}`,
                          config.facebook && `FB: ${config.facebook}`,
                          config.tiktok && `Tiktok: ${config.tiktok}`,
                        ].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>

                  {/* 4 QR Options Selector */}
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 rounded-xl space-y-4">
                    <div>
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                        <QrCode size={14} /> Pilihan QR Code di Footer Struk
                      </span>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Pilih jenis QR code yang akan dicetak pada bagian bawah struk kasir.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { 
                          type: 'none', 
                          title: 'Tanpa QR', 
                          desc: 'Tidak cetak QR', 
                          icon: Ban 
                        },
                        { 
                          type: 'estruk', 
                          title: 'QR e-Struk', 
                          desc: 'Struk Digital', 
                          icon: Smartphone 
                        },
                        { 
                          type: 'wifi', 
                          title: 'QR WiFi', 
                          desc: 'Auto connect', 
                          icon: Wifi 
                        },
                        { 
                          type: 'website', 
                          title: 'QR Website', 
                          desc: 'Link / Google Review', 
                          icon: Globe 
                        },
                      ].map(opt => {
                        const Icon = opt.icon;
                        const isSelected = (config.qrType || 'estruk') === opt.type;
                        return (
                          <button
                            key={opt.type}
                            type="button"
                            onClick={() => setConfig(prev => ({ 
                              ...prev, 
                              qrType: opt.type as any,
                              showQrFooter: opt.type !== 'none'
                            }))}
                            className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-xs font-bold'
                                : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-400'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <Icon size={16} />
                              {isSelected && <Check size={12} />}
                            </div>
                            <div>
                              <span className="text-[11px] font-bold block leading-tight">{opt.title}</span>
                              <span className="text-[9px] opacity-75 block leading-tight mt-0.5">{opt.desc}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Conditional Settings based on selected qrType */}
                    {config.qrType === 'estruk' && (
                      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3 animate-in fade-in duration-150">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                            Domain / URL e-Struk Publik
                          </label>
                          <Input
                            value={config.receiptDomain ?? 'https://point.mytara.id'}
                            onChange={e => setConfig(prev => ({ ...prev, receiptDomain: e.target.value }))}
                            placeholder="https://point.mytara.id"
                            className="h-8 text-xs font-mono"
                          />
                          <span className="text-[10px] text-neutral-400">
                            URL server publik agar struk dapat diakses tamu dari rumah / koneksi internet manapun.
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                            Label Teks di Bawah QR
                          </label>
                          <Input
                            value={config.qrCustomLabel || ''}
                            onChange={e => setConfig(prev => ({ ...prev, qrCustomLabel: e.target.value }))}
                            placeholder="Scan untuk e-Struk Digital"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {config.qrType === 'wifi' && (
                      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3 animate-in fade-in duration-150">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                              <Wifi size={12} /> Nama Jaringan WiFi (SSID)
                            </label>
                            <Input
                              value={config.wifiSsid || ''}
                              onChange={e => setConfig(prev => ({ ...prev, wifiSsid: e.target.value }))}
                              placeholder="cth: Tara_Cafe_Guest"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                              <Lock size={12} /> Kata Sandi WiFi
                            </label>
                            <Input
                              value={config.wifiPassword || ''}
                              onChange={e => setConfig(prev => ({ ...prev, wifiPassword: e.target.value }))}
                              placeholder="cth: kopi2026"
                              className="h-8 text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                              Tipe Keamanan WiFi
                            </label>
                            <select
                              value={config.wifiSecurity || 'WPA'}
                              onChange={e => setConfig(prev => ({ ...prev, wifiSecurity: e.target.value as any }))}
                              className="h-8 px-2.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none"
                            >
                              <option value="WPA">WPA / WPA2 / WPA3 (Standar)</option>
                              <option value="WEP">WEP (Router Lama)</option>
                              <option value="nopass">Tanpa Sandi (Terbuka)</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                              Label Teks di Bawah QR
                            </label>
                            <Input
                              value={config.qrCustomLabel || ''}
                              onChange={e => setConfig(prev => ({ ...prev, qrCustomLabel: e.target.value }))}
                              placeholder="Scan untuk Hubungkan ke WiFi"
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {config.qrType === 'website' && (
                      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3 animate-in fade-in duration-150">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                            <Globe size={12} /> Tautan Target Website / Google Review
                          </label>
                          <Input
                            value={config.websiteUrl || ''}
                            onChange={e => setConfig(prev => ({ ...prev, websiteUrl: e.target.value }))}
                            placeholder="https://g.page/r/... atau https://mytara.id"
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                            Label Teks di Bawah QR
                          </label>
                          <Input
                            value={config.qrCustomLabel || ''}
                            onChange={e => setConfig(prev => ({ ...prev, qrCustomLabel: e.target.value }))}
                            placeholder="Scan untuk Review di Google / Buka Menu"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: FORMAT PRINTER */}
              {activeTab === 'paper' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
                      Ukuran Kertas Thermal Printer
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, paperWidth: '80mm' }))}
                        className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          config.paperWidth === '80mm'
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-sm'
                            : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800'
                        }`}
                      >
                        <span className="text-xs font-bold flex items-center justify-between">
                          <span>80 mm (Standar Kasir)</span>
                          {config.paperWidth === '80mm' && <Check size={14} />}
                        </span>
                        <span className="text-[10px] opacity-80">
                          Kertas lebar 3 inci, muat 42–48 karakter per baris.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, paperWidth: '58mm' }))}
                        className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          config.paperWidth === '58mm'
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-sm'
                            : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800'
                        }`}
                      >
                        <span className="text-xs font-bold flex items-center justify-between">
                          <span>58 mm (Printer Mini / Mobile)</span>
                          {config.paperWidth === '58mm' && <Check size={14} />}
                        </span>
                        <span className="text-[10px] opacity-80">
                          Kertas compact 2 inci, muat 32 karakter per baris.
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        Ukuran Font Teks Struk
                      </label>
                      <select
                        value={config.fontSize}
                        onChange={e => setConfig(prev => ({ ...prev, fontSize: e.target.value as any }))}
                        className="h-9 px-3 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none"
                      >
                        <option value="compact">Compact (Hemat Kertas)</option>
                        <option value="normal">Normal (Standar Keterbacaan)</option>
                        <option value="large">Large (Huruf Besar / Jelas)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        Jumlah Rangkap Cetak Struk
                      </label>
                      <select
                        value={config.printCopies}
                        onChange={e => setConfig(prev => ({ ...prev, printCopies: parseInt(e.target.value) || 1 }))}
                        className="h-9 px-3 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none"
                      >
                        <option value={1}>1 Lembar (Pelanggan)</option>
                        <option value={2}>2 Lembar (Pelanggan + Kasir)</option>
                        <option value={3}>3 Lembar (Pelanggan + Kasir + Dapur)</option>
                      </select>
                    </div>
                  </div>

                  {/* ── Pengaturan Direct IP LAN Printer Per Departemen (Inline dengan LexuPOS) ── */}
                  <div className="p-4 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 rounded-xl space-y-3.5 mt-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-xs text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                        <Network className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Pengaturan Direct IP LAN Printer Per Departemen
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono hidden sm:inline">
                          Port default: 9100 (RAW Socket)
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-neutral-500 font-medium">Port:</span>
                          <input
                            type="text"
                            value={config.printerPort ?? '9100'}
                            onChange={e => handlePrinterIpChange('port', e.target.value)}
                            placeholder="9100"
                            className="w-14 h-6 text-[11px] px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800/80 bg-white dark:bg-zinc-900 font-mono text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* IP Kasir */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300">
                          IP Printer Kasir (Aktif):
                        </label>
                        <input
                          type="text"
                          placeholder="192.168.1.200"
                          value={config.cashierPrinterIp ?? ''}
                          onChange={e => handlePrinterIpChange('cashier', e.target.value)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* IP Kitchen */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300">
                          IP Printer Kitchen :
                        </label>
                        <input
                          type="text"
                          placeholder="Opsional (ikuti Kasir)"
                          value={config.kitchenPrinterIp ?? ''}
                          onChange={e => handlePrinterIpChange('kitchen', e.target.value)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* IP Bar */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300">
                          IP Printer Bar :
                        </label>
                        <input
                          type="text"
                          placeholder="Opsional (ikuti Kasir)"
                          value={config.barPrinterIp ?? ''}
                          onChange={e => handlePrinterIpChange('bar', e.target.value)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-blue-200/50 dark:border-blue-900/30">
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        Departemen aktif: <strong className="text-blue-700 dark:text-blue-300">Kasir</strong> &rarr; IP target: <strong className="font-mono text-neutral-800 dark:text-white">{config.cashierPrinterIp || '192.168.1.200'}</strong>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleTestIpPrinter('cashier')}
                          disabled={testingDepartment !== null}
                          className="h-7 rounded-lg text-[10.5px] bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 px-3 shadow-xs"
                        >
                          {testingDepartment === 'cashier' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
                          <span>Test IP Kasir</span>
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleTestIpPrinter('kitchen')}
                          disabled={testingDepartment !== null}
                          className="h-7 rounded-lg text-[10.5px] font-semibold flex items-center gap-1 px-2.5 bg-white dark:bg-zinc-900 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100"
                        >
                          {testingDepartment === 'kitchen' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3 text-neutral-500" />}
                          <span>Test Kitchen</span>
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleTestIpPrinter('bar')}
                          disabled={testingDepartment !== null}
                          className="h-7 rounded-lg text-[10.5px] font-semibold flex items-center gap-1 px-2.5 bg-white dark:bg-zinc-900 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100"
                        >
                          {testingDepartment === 'bar' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3 text-neutral-500" />}
                          <span>Test Bar</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Live Interactive Thermal Paper Mockup Preview (Exact LexuPOS Inline) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-3">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye size={13} /> Live Preview Struk (LexuPOS)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold">
                  {config.paperWidth}
                </span>
              </div>

              {/* Thermal Paper Roll Simulation */}
              <div 
                className="w-full flex justify-center p-3 bg-neutral-100/70 dark:bg-neutral-900/60 rounded-xl border border-neutral-200/80 dark:border-neutral-800 transition-all duration-200"
              >
                <ThermalReceipt
                  shopInfo={{
                    name: config.shopName || 'RESTO SETARA',
                    address: config.address,
                    phone: config.phone
                  }}
                  transactionInfo={{
                    id: 'ORD-9821',
                    date: new Date().toISOString(),
                    customerName: 'Bpk. Hendra',
                    cashierName: 'Sari',
                    tableName: '05',
                    paymentMethod: 'qris',
                    status: 'PAID'
                  }}
                  items={[
                    {
                      id: 'sample-1',
                      name: 'Nasi Goreng Spesial',
                      category: 'Makanan Utama',
                      subcategory: 'Nasi',
                      price: 35000,
                      quantity: 2,
                      selectedAddons: [{ name: 'Telur Mata Sapi', price: 5000 }],
                      note: 'Pedas sedang'
                    },
                    {
                      id: 'sample-2',
                      name: 'Es Teh Manis',
                      category: 'Minuman',
                      subcategory: 'Teh',
                      price: 8000,
                      quantity: 2,
                      selectedAddons: [],
                      note: 'Gula sedikit'
                    }
                  ]}
                  totals={{
                    subtotal: 96000,
                    discount: 0,
                    taxRate: 10,
                    taxAmount: 9600,
                    serviceRate: 5,
                    serviceAmount: 4800,
                    payableAmount: 110400,
                    cashAmount: 110400,
                    changeAmount: 0
                  }}
                  paperSize={config.paperWidth}
                  customConfig={config}
                  className="shadow-md border border-neutral-200/80 dark:border-zinc-800 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
