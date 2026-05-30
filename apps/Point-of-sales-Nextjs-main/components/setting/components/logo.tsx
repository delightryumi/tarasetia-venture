'use client';
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

export default function LogoCard() {
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedLogo = localStorage.getItem('shopLogo');
    if (savedLogo) {
      setLogoBase64(savedLogo);
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
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setLogoBase64(base64String);
      localStorage.setItem('shopLogo', base64String);
      toast.success('Logo berhasil diunggah dan disimpan!');

      // Dispatch an event so other components (like reports) know the logo changed
      window.dispatchEvent(new Event('logoChanged'));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoBase64(null);
    localStorage.removeItem('shopLogo');
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
              className="flex items-center gap-2"
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
