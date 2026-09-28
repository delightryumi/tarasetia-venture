import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { ImageIcon, Upload, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function LogoCard() {
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [hotelCode, setHotelCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let code = '';
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const parsed = JSON.parse(userJson);
        code = parsed.hotelCode || '';
      } catch (e) {
        console.error(e);
      }
    }
    if (!code) {
      code = localStorage.getItem('hotelCode') || '';
    }
    setHotelCode(code);

    if (code) {
      // Load strictly POS receipt logo from Firestore (never fallback to hotel master logo)
      Promise.all([
        getDoc(doc(db, 'hotels', code, 'settings', 'pos')),
        getDoc(doc(db, 'hotels', code))
      ]).then(([posSnap, hotelSnap]) => {
        const posData = posSnap.exists() ? posSnap.data() : null;
        const hotelData = hotelSnap.exists() ? hotelSnap.data() : null;

        // Valid receipt logo must strictly be shopLogo, and NOT the hotel master branding logo (d.logo)
        const receiptLogo = posData?.shopLogo || hotelData?.shopLogo;
        const hotelMasterLogo = hotelData?.logo;

        if (receiptLogo && receiptLogo !== hotelMasterLogo && receiptLogo.trim() !== '') {
          setLogoBase64(receiptLogo);
          localStorage.setItem('shopLogo', receiptLogo);
        } else {
          // If no specific cashier receipt logo is set, default to empty and purge any poisoned local cache
          setLogoBase64(null);
          localStorage.removeItem('shopLogo');
          window.dispatchEvent(new Event('logoChanged'));
        }
      }).catch((err) => {
        console.error('Error loading receipt logo:', err);
        const savedLogo = localStorage.getItem('shopLogo');
        if (savedLogo) {
          setLogoBase64(savedLogo);
        }
      }).finally(() => {
        setIsLoading(false);
      });
    } else {
      const savedLogo = localStorage.getItem('shopLogo');
      if (savedLogo) {
        setLogoBase64(savedLogo);
      } else {
        setLogoBase64(null);
      }
      setIsLoading(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File terlalu besar! Maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      setLogoBase64(base64String);
      localStorage.setItem('shopLogo', base64String);

      // Sync strictly as shopLogo (do NOT overwrite hotel master 'logo')
      if (hotelCode) {
        try {
          await setDoc(doc(db, 'hotels', hotelCode), { shopLogo: base64String }, { merge: true });
          await setDoc(doc(db, 'hotels', hotelCode, 'settings', 'pos_self_order'), { shopLogo: base64String }, { merge: true });
          await setDoc(doc(db, 'hotels', hotelCode, 'settings', 'pos'), { shopLogo: base64String }, { merge: true });
        } catch (err) {
          console.error('Error syncing receipt logo to Firestore:', err);
        }
      }

      toast.success('Logo nota kasir berhasil diunggah!');
      window.dispatchEvent(new Event('logoChanged'));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveLogo = async () => {
    setLogoBase64(null);
    localStorage.removeItem('shopLogo');

    if (hotelCode) {
      try {
        await setDoc(doc(db, 'hotels', hotelCode), { shopLogo: '' }, { merge: true });
        await setDoc(doc(db, 'hotels', hotelCode, 'settings', 'pos_self_order'), { shopLogo: '' }, { merge: true });
        await setDoc(doc(db, 'hotels', hotelCode, 'settings', 'pos'), { shopLogo: '' }, { merge: true });
      } catch (err) {
        console.error('Error removing receipt logo in Firestore:', err);
      }
    }

    toast.success('Logo nota kasir berhasil dihapus!');
    window.dispatchEvent(new Event('logoChanged'));
  };

  return (
    <Card x-chunk="dashboard-04-chunk-3">
      <CardHeader>
        <CardTitle>Logo</CardTitle>
        <CardDescription>
          Unggah logo untuk digunakan pada nota kasir (struk) dan halaman laporan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex items-center justify-center w-32 h-32 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 overflow-hidden relative">
            {logoBase64 ? (
              <Image
                src={logoBase64}
                alt="Store Logo"
                fill
                className="object-contain p-2"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-neutral-400">
                <ImageIcon className="h-8 w-8 mb-2" />
                <span className="text-xs">No Logo</span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 w-full sm:w-auto">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-stone-900 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Logo
            </Button>
            {logoBase64 && (
              <Button
                variant="destructive"
                onClick={handleRemoveLogo}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Hapus Logo
              </Button>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Format disarankan: PNG atau JPG dengan latar transparan. Ukuran maksimal 2MB.
        </p>
      </CardFooter>
    </Card>
  );
}
