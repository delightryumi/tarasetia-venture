'use client';
import React, { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const CURRENCIES = [
  { code: 'IDR', name: 'Indonesian Rupiah (Rp)', flag: '🇮🇩' },
  { code: 'USD', name: 'US Dollar ($)', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro (€)', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound (£)', flag: '🇬🇧' },
  { code: 'SGD', name: 'Singapore Dollar (S$)', flag: '🇸🇬' },
  { code: 'AUD', name: 'Australian Dollar (A$)', flag: '🇦🇺' },
  { code: 'MYR', name: 'Malaysian Ringgit (RM)', flag: '🇲🇾' },
  { code: 'THB', name: 'Thai Baht (฿)', flag: '🇹🇭' },
  { code: 'JPY', name: 'Japanese Yen (¥)', flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan (¥)', flag: '🇨🇳' },
  { code: 'AED', name: 'UAE Dirham (AED)', flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal (SAR)', flag: '🇸🇦' },
  { code: 'VND', name: 'Vietnamese Dong (₫)', flag: '🇻🇳' },
  { code: 'KRW', name: 'South Korean Won (₩)', flag: '🇰🇷' },
  { code: 'PHP', name: 'Philippine Peso (₱)', flag: '🇵🇭' },
  { code: 'INR', name: 'Indian Rupee (₹)', flag: '🇮🇳' },
  { code: 'CHF', name: 'Swiss Franc (CHF)', flag: '🇨🇭' },
  { code: 'CAD', name: 'Canadian Dollar (C$)', flag: '🇨🇦' },
  { code: 'NZD', name: 'New Zealand Dollar (NZ$)', flag: '🇳🇿' },
  { code: 'HKD', name: 'Hong Kong Dollar (HK$)', flag: '🇭🇰' },
];

const getHotelCode = (): string => {
  if (typeof window === 'undefined') return '';
  const direct = localStorage.getItem('active_hotel_code') || localStorage.getItem('hotelCode');
  if (direct && direct !== '0') return direct;
  try {
    const userJson = localStorage.getItem('user') || localStorage.getItem('crs_user');
    if (userJson) {
      const parsed = JSON.parse(userJson);
      if (parsed?.hotelCode && parsed.hotelCode !== '0') return parsed.hotelCode;
      if (parsed?.allowedOutlets?.[0] && parsed.allowedOutlets[0] !== '0') return parsed.allowedOutlets[0];
    }
  } catch {}
  return process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE || '1';
};

export default function CurrencyCard() {
  const [currency, setCurrency] = useState<string>('IDR');
  const [hotelName, setHotelName] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const code = getHotelCode();
    const savedCurrency = localStorage.getItem('shopCurrency');
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }

    if (code && code !== '0') {
      getDoc(doc(db, 'hotels', code)).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.name) setHotelName(data.name);
          if (data.currency) {
            setCurrency(data.currency);
            localStorage.setItem('shopCurrency', data.currency);
            window.dispatchEvent(new Event('currencyChanged'));
          }
        }
      }).catch((e) => {
        console.warn('Could not fetch hotel currency:', e);
      });
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const code = getHotelCode();
      if (code && code !== '0') {
        await updateDoc(doc(db, 'hotels', code), { currency });
      }
      localStorage.setItem('shopCurrency', currency);
      toast.success(`Mata uang ${currency} berhasil disimpan dan inline dengan Pengaturan Hotel & Akuntansi!`);
      window.dispatchEvent(new Event('currencyChanged'));
    } catch (err: any) {
      console.warn('Failed to update hotel doc, fallback to local storage:', err);
      localStorage.setItem('shopCurrency', currency);
      toast.success(`Mata uang kasir disimpan ke ${currency}.`);
      window.dispatchEvent(new Event('currencyChanged'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card x-chunk="dashboard-04-chunk-4">
      <CardHeader>
        <CardTitle>Mata Uang Utama (Inline Property Currency)</CardTitle>
        <CardDescription>
          Atur mata uang utama yang digunakan untuk kasir, nota pesanan, dan terintegrasi inline dengan Front Office, Channel Manager, serta Laporan Akuntansi{hotelName ? ` properti ${hotelName}` : ''}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-full sm:w-[320px]">
              <SelectValue placeholder="Pilih Mata Uang" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.flag} {c.code} - {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-xs text-muted-foreground">
          Perubahan otomatis disinkronkan ke dokumen hotel pusat dan berlaku untuk seluruh kasir & akuntansi.
        </p>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-stone-900 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 transition-colors w-full sm:w-auto"
        >
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </CardFooter>
    </Card>
  );
}
