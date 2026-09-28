'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Unlock, Play, UserCheck } from 'lucide-react';

interface OpenShiftPanelProps {
  cashierNameInput: string;
  setCashierNameInput: (val: string) => void;
  houseBankInput: string;
  setHouseBankInput: (val: string) => void;
  symbol: string;
  handleOpenShift: () => void;
}

export default function OpenShiftPanel({
  cashierNameInput,
  setCashierNameInput,
  houseBankInput,
  setHouseBankInput,
  symbol,
  handleOpenShift
}: OpenShiftPanelProps) {
  const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

  return (
    <div className="rounded-2xl border border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-950 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <Unlock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Buka Register Kasir (Open Cashier Shift)</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Inisialisasi shift kasir dan penghitungan modal kas awal (house bank).</p>
        </div>
      </div>

      <div className="w-full h-px bg-neutral-200/70 dark:bg-white/[0.08]" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="cashierName" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Petugas Kasir (Cashier on Duty)
            </Label>
            {cashierNameInput && (
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> Akun Terverifikasi
              </span>
            )}
          </div>
          <Input
            id="cashierName"
            type="text"
            readOnly={!!cashierNameInput}
            placeholder="Nama akun kasir..."
            value={cashierNameInput}
            onChange={(e) => setCashierNameInput(e.target.value)}
            className="h-11 bg-neutral-100/80 dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.08] rounded-xl text-sm font-semibold text-neutral-800 dark:text-neutral-200 cursor-default"
          />
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Shift otomatis dicatat atas nama pengguna yang sedang aktif login.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="houseBank" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Modal Kas Awal (House Bank / Float Cash)
          </Label>
          <div className="relative">
            <span className="absolute left-3.5 top-3 text-sm text-neutral-400 dark:text-neutral-500 font-bold">{symbol}</span>
            <Input
              id="houseBank"
              type="number"
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              placeholder="0"
              value={houseBankInput}
              onChange={(e) => setHouseBankInput(e.target.value)}
              onFocus={() => {
                if (houseBankInput === '0') {
                  setHouseBankInput('');
                }
              }}
              onBlur={() => {
                if (houseBankInput === '') {
                  setHouseBankInput('0');
                }
              }}
              className="pl-12 h-11 bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.08] rounded-xl text-sm font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          
          {/* NextLevel quick denomination chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10.5px] font-semibold text-neutral-400 mr-1">Pilih Cepat:</span>
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setHouseBankInput(String(amt))}
                className="text-[10.5px] font-bold px-2 py-0.5 rounded-lg border border-neutral-200 dark:border-white/[0.1] bg-neutral-50 dark:bg-zinc-800/80 hover:bg-neutral-100 dark:hover:bg-zinc-700 text-neutral-700 dark:text-neutral-300 active:scale-95 transition-all"
              >
                {symbol} {(amt / 1000).toLocaleString('id-ID')}k
              </button>
            ))}
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Uang pecahan kecil yang disiapkan di laci kas sebelum transaksi dimulai.
          </p>
        </div>
      </div>

      <div className="pt-2">
        <Button
          onClick={handleOpenShift}
          className="w-full sm:w-auto h-11 px-7 bg-gradient-to-b from-neutral-900 to-neutral-950 dark:from-white dark:to-neutral-100 text-white dark:text-neutral-950 rounded-xl hover:opacity-95 active:scale-[0.98] text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 border border-neutral-800 dark:border-neutral-200 shadow-md"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Buka Register & Mulai Shift</span>
        </Button>
      </div>
    </div>
  );
}
