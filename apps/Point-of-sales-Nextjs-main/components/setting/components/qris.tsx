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
import { QrCode, Upload, Trash2 } from 'lucide-react';
import Image from 'next/image';

export default function QrisCard() {
  const [qrisBase64, setQrisBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedQris = localStorage.getItem('staticQris');
    if (savedQris) {
      setQrisBase64(savedQris);
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
      setQrisBase64(base64String);
      localStorage.setItem('staticQris', base64String);
      toast.success('QRIS berhasil diunggah dan disimpan di perangkat ini!');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQris = () => {
    setQrisBase64(null);
    localStorage.removeItem('staticQris');
    toast.success('QRIS berhasil dihapus dari perangkat ini!');
  };

  return (
    <Card x-chunk="dashboard-04-chunk-3">
      <CardHeader>
        <CardTitle>QRIS Pembayaran (Statis)</CardTitle>
        <CardDescription>
          Unggah gambar kode QRIS toko Anda. Gambar ini akan dimunculkan di layar Kasir saat memilih metode pembayaran QRIS.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex items-center justify-center w-32 h-32 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 overflow-hidden relative">
            {qrisBase64 ? (
              <Image
                src={qrisBase64}
                alt="QRIS Code"
                fill
                className="object-contain p-2"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-neutral-400">
                <QrCode className="h-8 w-8 mb-2" />
                <span className="text-xs">No QRIS</span>
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
              Upload QRIS
            </Button>
            {qrisBase64 && (
              <Button
                variant="destructive"
                onClick={handleRemoveQris}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Hapus QRIS
              </Button>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Format disarankan: PNG atau JPG. Gambar ini tersimpan secara lokal di perangkat Kasir ini.
        </p>
      </CardFooter>
    </Card>
  );
}
