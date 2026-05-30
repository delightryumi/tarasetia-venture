'use client';

import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';

export default function RecordsDateFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

  const startDate = searchParams.get('startDate') || today;
  const endDate = searchParams.get('endDate') || today;

  const handleDateChange = (key: 'startDate' | 'endDate', value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset page to 1 when filter changes
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleReset = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('startDate');
    params.delete('endDate');
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-3 bg-neutral-50 dark:bg-zinc-900/50 p-2 rounded-lg border border-neutral-100 dark:border-white/[0.05]">
      <div className="flex items-center gap-2">
        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">From:</label>
        <Input
          className="h-8 w-36 text-xs"
          type="date"
          value={startDate}
          onChange={(e) => handleDateChange('startDate', e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">To:</label>
        <Input
          className="h-8 w-36 text-xs"
          type="date"
          value={endDate}
          onChange={(e) => handleDateChange('endDate', e.target.value)}
        />
      </div>
      {(startDate || endDate) && (
        <button
          onClick={handleReset}
          className="text-xs font-bold text-red-500 hover:text-red-600 px-2 py-1 transition-all"
        >
          Reset
        </button>
      )}
    </div>
  );
}
