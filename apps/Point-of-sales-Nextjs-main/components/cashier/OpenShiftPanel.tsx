'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Unlock, Play } from 'lucide-react';

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
          <h3 className="font-bold text-neutral-800 dark:text-neutral-200">Buka Shift Kasir Baru</h3>
          <p className="text-xs text-neutral-500">Masukkan nama petugas dan modal laci awal untuk memulai.</p>
        </div>
      </div>

      <div className="w-full h-[1px] bg-neutral-200 dark:bg-white/[0.1] my-1" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cashierName" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
            Nama Kasir
          </Label>
          <Input
            id="cashierName"
            type="text"
            placeholder="E.g. Budi"
            value={cashierNameInput}
            onChange={(e) => setCashierNameInput(e.target.value)}
            className="h-10 bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="houseBank" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
            Modal Awal (House Bank)
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
        </div>
      </div>

      <div className="pt-3">
        <Button
          onClick={handleOpenShift}
          className="w-full sm:w-auto h-10 px-6 bg-neutral-900 text-white dark:bg-white dark:text-black rounded-xl hover:bg-neutral-800 hover:scale-[1.02] text-xs font-bold transition-all flex items-center justify-center gap-2 border-none shadow-sm"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Mulai & Buka Shift</span>
        </Button>
      </div>
    </div>
  );
}
