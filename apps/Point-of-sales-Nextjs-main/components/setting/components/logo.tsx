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

    const savedLogo = localStorage.getItem('shopLogo');
    if (savedLogo) {
      setLogoBase64(savedLogo);
    } else if (code) {
      // Fallback load from Firestore
      getDoc(doc(db, 'hotels', code)).then((snap) => {
        if (snap.exists()) {
          const d = snap.data();
          const remoteLogo = d.logo || d.shopLogo;
          if (remoteLogo) {
            setLogoBase64(remoteLogo);
            localStorage.setItem('shopLogo', remoteLogo);
          }
        }
      }).catch(console.error);
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

      // Sync to Firestore if hotelCode exists
      if (hotelCode) {
        try {
          await setDoc(doc(db, 'hotels', hotelCode), { logo: base64String, shopLogo: base64String }, { merge: true });
          await setDoc(doc(db, 'hotels', hotelCode, 'settings', 'pos_self_order'), { shopLogo: base64String }, { merge: true });
          await setDoc(doc(db, 'hotels', hotelCode, 'settings', 'pos'), { logo: base64String, shopLogo: base64String }, { merge: true });
        } catch (err) {
          console.error('Error syncing logo to Firestore:', err);
        }
      }

      toast.success('Logo berhasil diunggah dan disimpan!');

      // Dispatch an event so other components know the logo changed
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
        await setDoc(doc(db, 'hotels', hotelCode), { logo: '', shopLogo: '' }, { merge: true });
        await setDoc(doc(db, 'hotels', hotelCode, 'settings', 'pos_self_order'), { shopLogo: '' }, { merge: true });
        await setDoc(doc(db, 'hotels', hotelCode, 'settings', 'pos'), { logo: '', shopLogo: '' }, { merge: true });
      } catch (err) {
        console.error('Error removing logo in Firestore:', err);
      }
    }

    toast.success('Logo berhasil dihapus!');
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
