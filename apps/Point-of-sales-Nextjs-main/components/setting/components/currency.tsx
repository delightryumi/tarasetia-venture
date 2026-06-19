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

const CURRENCIES = [
  { code: 'IDR', name: 'Indonesian Rupiah (Rp)' },
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'SGD', name: 'Singapore Dollar (S$)' },
  { code: 'MYR', name: 'Malaysian Ringgit (RM)' },
  { code: 'GBP', name: 'British Pound (£)' },
  { code: 'AUD', name: 'Australian Dollar (A$)' },
  { code: 'JPY', name: 'Japanese Yen (¥)' },
];

export default function CurrencyCard() {
  const [currency, setCurrency] = useState<string>('IDR');

  useEffect(() => {
    const savedCurrency = localStorage.getItem('shopCurrency');
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('shopCurrency', currency);
    toast.success(`Mata uang berhasil diatur ke ${currency}!`);
    window.dispatchEvent(new Event('currencyChanged'));
  };

  return (
    <Card x-chunk="dashboard-04-chunk-4">
      <CardHeader>
        <CardTitle>Mata Uang (Currency)</CardTitle>
        <CardDescription>
          Atur mata uang utama yang digunakan untuk transaksi, nota, dan laporan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder="Pilih Mata Uang" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code} - {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-xs text-muted-foreground">
          Perubahan ini akan diterapkan di seluruh sistem kasir.
        </p>
        <Button onClick={handleSave} className="bg-stone-900 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 transition-colors w-full sm:w-auto">Simpan Perubahan</Button>
      </CardFooter>
    </Card>
  );
}
