'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'react-toastify';
import { Input } from '@/components/ui/input';
import { ReloadIcon } from '@radix-ui/react-icons';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Trash, QrCode, UploadCloud, Printer, Download } from 'lucide-react';

interface PromoBanner {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  linkToProductId?: string;
}

export default function SelfOrderCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [hotelCode, setHotelCode] = useState('87241');
  const [isEnterprise, setIsEnterprise] = useState(false);
  const [activePlan, setActivePlan] = useState('');
  
  // Self Order states
  const [enabled, setEnabled] = useState(false);
  const [paymentsAllowed, setPaymentsAllowed] = useState<string[]>(['cashier']);
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>([]);
  
  // New Banner form state
  const [newImgUrl, setNewImgUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB max upload
    if (file.size > MAX_SIZE) {
      toast.error('Gagal: Ukuran berkas terlalu besar (maksimal 10 MB).');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 500;
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width / height > MAX_WIDTH / MAX_HEIGHT) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setNewImgUrl(compressedBase64);
          toast.success('Gambar promo berhasil diunggah & dikompresi!');
        } else {
          setNewImgUrl(reader.result as string);
          toast.success('Gambar promo berhasil diunggah!');
        }
        setIsUploading(false);
      };
      img.onerror = () => {
        toast.error('Gagal memproses berkas gambar.');
        setIsUploading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => {
      console.error(err);
      toast.error('Gagal membaca berkas gambar.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  
  // Table QR generator state
  const [selectedTable, setSelectedTable] = useState('1');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [globalUrl, setGlobalUrl] = useState('');
  const [tablesCount, setTablesCount] = useState(10);

  useEffect(() => {
    const fetchHotelConfig = async () => {
      setIsPageLoading(true);
      try {
        let code = '87241';
        let isSuper = false;
        const userJson = localStorage.getItem('user');
        if (userJson) {
          const parsed = JSON.parse(userJson);
          code = parsed.hotelCode || '87241';
          isSuper =
            parsed?.role?.toLowerCase() === 'superadmin' ||
            parsed?.role?.toLowerCase() === 'super admin' ||
            parsed?.email?.toLowerCase() === 'nexura.management@gmail.com' ||
            parsed?.email?.toLowerCase() === 'admin@setara.co.id';
        }
        setHotelCode(code);
        
        // Set Global URL for QR
        if (typeof window !== 'undefined') {
          const origin = window.location.origin;
          setGlobalUrl(`${origin}/self-order/${code}`);
        }

        // 1. Check hotel plan
        const hotelDocRef = doc(db, 'hotels', code);
        const hotelSnap = await getDoc(hotelDocRef);
        let plan = 'basic';
        if (hotelSnap.exists()) {
          const data = hotelSnap.data();
          plan = data.billing?.plan || 'basic';
          setActivePlan(plan);
        }
        
        setIsEnterprise(isSuper || plan.toLowerCase() === 'enterprise');

        // 2. Fetch tables count from pos settings
        const posDocRef = doc(db, 'hotels', code, 'settings', 'pos');
        const posSnap = await getDoc(posDocRef);
        if (posSnap.exists()) {
          const posData = posSnap.data();
          const count = parseInt(posData.tables) || 10;
          setTablesCount(count);
        }

        // 3. Fetch self order settings
        const selfOrderRef = doc(db, 'hotels', code, 'settings', 'pos_self_order');
        const selfOrderSnap = await getDoc(selfOrderRef);
        if (selfOrderSnap.exists()) {
          const data = selfOrderSnap.data();
          setEnabled(!!data.enabled);
          setPaymentsAllowed(data.paymentsAllowed || ['cashier']);
          setPromoBanners(data.promoBanners || []);
        }
      } catch (err) {
        console.error('Error loading self-ordering config:', err);
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchHotelConfig();
  }, []);

  const handleSave = async () => {
    if (!isEnterprise) {
      toast.error('Gagal menyimpan: Fitur memerlukan paket Enterprise.');
      return;
    }
    setIsLoading(true);
    try {
      const selfOrderRef = doc(db, 'hotels', hotelCode, 'settings', 'pos_self_order');
      await setDoc(selfOrderRef, {
        enabled,
        paymentsAllowed,
        promoBanners
      }, { merge: true });

      toast.success('Self-ordering configurations updated successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save configurations.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBanner = async () => {
    if (!newImgUrl.trim()) {
      toast.warn('Gambar promo wajib diunggah terlebih dahulu.');
      return;
    }
    const newBanner: PromoBanner = {
      id: Math.random().toString(36).substr(2, 9),
      imageUrl: newImgUrl,
      title: newTitle,
      description: newDesc
    };
    
    const updatedBanners = [...promoBanners, newBanner];
    setPromoBanners(updatedBanners);
    setNewImgUrl('');
    setNewTitle('');
    setNewDesc('');

    // Auto save to prevent losing data on reload
    try {
      const selfOrderRef = doc(db, 'hotels', hotelCode, 'settings', 'pos_self_order');
      await setDoc(selfOrderRef, { promoBanners: updatedBanners }, { merge: true });
    } catch (err) {
      console.error(err);
      toast.error('Gagal sinkronisasi banner ke database.');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    const updatedBanners = promoBanners.filter(b => b.id !== id);
    setPromoBanners(updatedBanners);

    try {
      const selfOrderRef = doc(db, 'hotels', hotelCode, 'settings', 'pos_self_order');
      await setDoc(selfOrderRef, { promoBanners: updatedBanners }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateQR = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_POS_URL || 'http://localhost:3001');
    const orderUrl = `${origin}/self-order/${hotelCode}?table=${selectedTable}`;
    setGeneratedUrl(orderUrl);
  };

  const togglePayment = async (method: string) => {
    const newPayments = paymentsAllowed.includes(method)
      ? paymentsAllowed.filter(m => m !== method)
      : [...paymentsAllowed, method];
      
    setPaymentsAllowed(newPayments);
    
    // Auto-save
    try {
      const selfOrderRef = doc(db, 'hotels', hotelCode, 'settings', 'pos_self_order');
      await setDoc(selfOrderRef, { paymentsAllowed: newPayments }, { merge: true });
      toast.success('Metode pembayaran berhasil diperbarui!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui metode pembayaran.');
    }
  };

  const handleToggleEnabled = async (checked: boolean) => {
    setEnabled(checked);
    // Auto-save
    try {
      const selfOrderRef = doc(db, 'hotels', hotelCode, 'settings', 'pos_self_order');
      await setDoc(selfOrderRef, { enabled: checked }, { merge: true });
      toast.success(`Pemesanan tamu ${checked ? 'diaktifkan' : 'dinonaktifkan'}!`);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui status pemesanan.');
    }
  };

  if (isPageLoading) {
    return (
      <Card className="my-5">
        <CardContent className="py-10 flex flex-col items-center justify-center gap-2">
          <ReloadIcon className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Memuat konfigurasi...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full">
      {/* Main UI */}
      <Card className="my-5 relative overflow-hidden">
      {/* Visual Overlay for Non-Enterprise */}
      {!isEnterprise && (
        <div className="absolute inset-0 bg-stone-900/5 dark:bg-stone-950/20 backdrop-blur-[1.5px] z-10 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="bg-white dark:bg-[#18181a] p-8 rounded-2xl shadow-xl max-w-md border border-amber-200 dark:border-amber-900/30">
            <QrCode className="h-12 w-12 text-amber-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-100 uppercase tracking-wider mb-2">Upgrade to Enterprise</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed">
              Fitur <span className="font-bold">Self-Ordering Menu Tamu</span> eksklusif untuk Partner paket Enterprise. Akun Anda saat ini menggunakan paket <span className="font-bold">{activePlan.toUpperCase()}</span>.
            </p>
            <a href="mailto:admin@setaraventure.com" className="inline-flex h-9 items-center justify-center rounded-[8px] bg-stone-900 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 px-4 text-xs font-semibold transition-colors">
              Hubungi Sales Setup
            </a>
          </div>
        </div>
      )}

      <CardHeader>
        <CardTitle>Self-Ordering Menu</CardTitle>
        <CardDescription>Aktifkan menu digital pemesanan mandiri oleh tamu, pasang slider banner promosi, serta cetak QR Code meja.</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Toggle Switch */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
          <div>
            <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">Status Pemesanan Tamu</label>
            <p className="text-xs text-neutral-500">Tentukan apakah tamu diizinkan memesan langsung lewat web.</p>
          </div>
          <input 
            type="checkbox" 
            checked={enabled} 
            onChange={(e) => handleToggleEnabled(e.target.checked)} 
            disabled={!isEnterprise}
            className="w-10 h-5 bg-neutral-300 checked:bg-stone-900 dark:checked:bg-white rounded-full appearance-none relative cursor-pointer transition-all duration-300 before:content-[''] before:absolute before:h-4 before:w-4 before:bg-white dark:before:bg-stone-900 before:rounded-full before:top-0.5 before:left-0.5 before:transition-all before:duration-300 checked:before:left-5.5"
          />
        </div>

        {/* Global Access Link */}
        {enabled && (
          <div className="p-4 bg-muted/20 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Tautan Akses Global Pemesanan Tamu</span>
              <p className="text-[10px] text-neutral-500 mb-2 leading-relaxed">
                Tamu bisa mengakses menu pemesanan langsung dari link di bawah ini (tanpa QR meja). Cetak QR ini untuk dipajang di kasir atau pintu masuk.
              </p>
              <span className="text-[11px] font-mono select-all break-all whitespace-pre-wrap bg-white dark:bg-stone-900 px-2 py-1 rounded border inline-block text-neutral-700 dark:text-neutral-300 mb-3 max-w-full">
                {globalUrl || 'Memuat...'}
              </span>
              <div className="flex gap-2">
                <a 
                  href={globalUrl}
                  target="_blank" 
                  rel="noreferrer"
                  className="h-9 px-4 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
                >
                  Buka Web Tamu
                </a>
              </div>
            </div>
            
            {/* Global QR */}
            {globalUrl && (
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-28 h-28 bg-white p-2 rounded-lg border shadow-sm flex items-center justify-center">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(globalUrl)}`} 
                    alt="Global QR Code" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <a 
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(globalUrl)}`}
                  target="_blank"
                  download="QR-Global-Setara.png"
                  className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:text-stone-900 dark:hover:text-white transition-colors flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md"
                >
                  <Download size={12} /> Unduh QR
                </a>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Metode Pembayaran Tamu</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 bg-muted/20 border rounded-lg cursor-pointer select-none" onClick={() => togglePayment('cashier')}>
              <input type="checkbox" checked={paymentsAllowed.includes('cashier')} readOnly className="accent-stone-900" />
              <div>
                <span className="text-xs font-bold">Bayar di Kasir (Cashier Collect)</span>
                <p className="text-[10px] text-muted-foreground">Tamu memesan dulu, bayar di kasir saat checkout.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/20 border rounded-lg cursor-pointer select-none" onClick={() => togglePayment('qris')}>
              <input type="checkbox" checked={paymentsAllowed.includes('qris')} readOnly className="accent-stone-900" />
              <div>
                <span className="text-xs font-bold">QRIS Pembayaran</span>
                <p className="text-[10px] text-muted-foreground">Tamu dapat memindai QRIS toko secara langsung saat memesan.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Promo Slider Manager */}
        <div className="space-y-4 pt-4 border-t">
          <div>
            <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Manajemen Banner Promo</label>
            <p className="text-[11px] text-neutral-500">Buat banner promosi horizontal.</p>
          </div>

          {/* Form Banner Baru */}
          <div className="p-4 bg-muted/10 border border-dashed rounded-lg space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Gambar Banner Promo</label>
                <div className="flex items-center gap-3">
                  {newImgUrl ? (
                    <div className="relative w-20 h-10 border rounded overflow-hidden bg-muted shrink-0">
                      <img src={newImgUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewImgUrl('')}
                        className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 h-9 px-3 border rounded-lg text-xs bg-white dark:bg-stone-900 relative flex items-center justify-center cursor-pointer hover:bg-muted/10 transition-colors">
                      {isUploading ? (
                        <span className="text-[10px] text-muted-foreground animate-pulse">Mengunggah...</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <UploadCloud size={14} /> Pilih Gambar
                        </span>
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Judul Promo</label>
                <Input placeholder="cth: Diskon Breakfast 20%" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="h-9 text-xs bg-white dark:bg-stone-900" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Deskripsi Promo</label>
              <Input placeholder="cth: Khusus untuk tamu in-house" value={newDesc} onChange={e => setNewDesc(e.target.value)} className="h-9 text-xs bg-white dark:bg-stone-900" />
            </div>
            
            {/* Mobile sizing advice notification */}
            <p className="text-[10px] text-amber-600 dark:text-amber-500 font-medium">
              💡 Rekomendasi: Gunakan gambar berasio 21:9 (cth: 800x340 px atau 1200x510 px) dengan ukuran maksimal 800 KB agar presisi dan tidak terpotong saat diakses lewat HP tamu.
            </p>

            <Button size="sm" onClick={handleAddBanner} disabled={isUploading} className="bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 flex items-center gap-1.5 h-8 text-[11px] font-bold transition-colors">
              <Plus size={14} /> Tambahkan Banner
            </Button>
          </div>

          {/* List Banner Promo */}
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {promoBanners.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Belum ada banner promo aktif.</p>
            ) : (
              promoBanners.map(banner => (
                <div key={banner.id} className="flex items-center justify-between p-3 bg-muted/20 border rounded-lg gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={banner.imageUrl} alt="" className="w-12 h-8 object-cover rounded bg-neutral-200 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/120x80?text=Promo'; }} />
                    <div className="min-w-0">
                      <span className="text-xs font-bold block truncate">{banner.title}</span>
                      <span className="text-[10px] text-muted-foreground block truncate">{banner.description}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteBanner(banner.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 hover:dark:bg-red-950/20 shrink-0">
                    <Trash size={14} />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* QR Code Generator */}
        {enabled && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">QR Code Meja Resto</label>
              <p className="text-[11px] text-neutral-500">Pilih nomor meja untuk membuat tautan web order tamu dan unduh QR Code.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold shrink-0">Meja:</span>
                <select 
                  value={selectedTable} 
                  onChange={e => { setSelectedTable(e.target.value); setGeneratedUrl(''); }} 
                  className="h-9 px-3 border rounded-lg text-xs font-bold bg-white dark:bg-stone-900 focus:outline-none"
                >
                  {Array.from({ length: tablesCount }).map((_, i) => (
                    <option key={i+1} value={String(i+1)}>Meja {i+1}</option>
                  ))}
                </select>
              </div>
              <Button size="sm" onClick={handleGenerateQR} className="bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 flex items-center gap-1.5 h-9 text-xs font-bold transition-colors">
                <QrCode size={14} /> Generate QR Link
              </Button>
            </div>

            {generatedUrl && (
              <div className="p-4 bg-muted/20 border rounded-lg flex flex-col sm:flex-row gap-6 items-center">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="w-32 h-32 bg-white p-2 rounded-lg border shadow-sm flex items-center justify-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(generatedUrl)}`} 
                      alt={`Meja ${selectedTable} QR Code`} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <a 
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(generatedUrl)}`}
                    target="_blank"
                    download={`QR-Meja-${selectedTable}-Setara.png`}
                    className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:text-stone-900 dark:hover:text-white transition-colors flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md"
                  >
                    <Download size={12} /> Unduh QR
                  </a>
                </div>
                <div className="space-y-2 min-w-0 w-full">
                  <span className="text-xs font-bold text-emerald-600 block">Link Meja {selectedTable} Berhasil Dibuat!</span>
                  <span className="text-[10px] font-mono select-all break-all block p-2 bg-neutral-100 dark:bg-white/[0.03] border rounded">{generatedUrl}</span>
                  <p className="text-[10px] text-muted-foreground leading-normal mb-2">
                    Unduh gambar QR di samping dan cetak untuk ditempelkan di atas meja {selectedTable}. Tamu bisa langsung memesan setelah melakukan scan.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
