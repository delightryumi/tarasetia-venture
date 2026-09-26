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
  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-950 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Unlock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-neutral-800 dark:text-neutral-200">Buka Register Kasir (Open Cashier Shift)</h3>
          <p className="text-xs text-neutral-500">Inisialisasi shift kasir dan penghitungan modal kas awal (house bank).</p>
        </div>
      </div>

      <div className="w-full h-[1px] bg-neutral-200 dark:bg-white/[0.1] my-1" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="cashierName" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              Petugas Kasir (Cashier on Duty)
            </Label>
            {cashierNameInput && (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> Akun Login
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
            className="h-10 bg-neutral-100 dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl text-sm font-semibold cursor-default"
          />
          <p className="text-[10px] text-neutral-400">
            Shift otomatis dicatat atas nama pengguna yang sedang aktif login.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="houseBank" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
            Modal Kas Awal (House Bank / Cash Float)
          </Label>
          <div className="relative">
            <span className="absolute left-3.5 top-3 text-sm text-neutral-400 font-bold">{symbol}</span>
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
              className="pl-12 h-10 bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl text-sm font-semibold"
            />
          </div>
          <p className="text-[10px] text-neutral-400">
            Uang pecahan kecil yang disiapkan di laci kas sebelum transaksi dimulai.
          </p>
        </div>
      </div>

      <div className="pt-3">
        <Button
          onClick={handleOpenShift}
          className="w-full sm:w-auto h-10 px-6 bg-neutral-900 text-white dark:bg-white dark:text-black rounded-xl hover:bg-neutral-800 hover:scale-[1.02] text-xs font-bold transition-all flex items-center justify-center gap-2 border-none shadow-sm"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Buka Register & Mulai Shift</span>
        </Button>
      </div>
    </div>
  );
}
