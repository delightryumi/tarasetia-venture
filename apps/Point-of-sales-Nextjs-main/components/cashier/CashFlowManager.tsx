'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Coins, CheckCircle2, Plus, Edit2, Trash2 } from 'lucide-react';
import { ShiftData } from './types';

interface CashFlowManagerProps {
  activeShift: ShiftData;
  showCashFlowForm: boolean;
  setShowCashFlowForm: (val: boolean) => void;
  cashFlowAmount: string;
  setCashFlowAmount: (val: string) => void;
  cashFlowNote: string;
  setCashFlowNote: (val: string) => void;
  cashFlowType: 'in' | 'out';
  setCashFlowType: (val: 'in' | 'out') => void;
  isSubmittingCashFlow: boolean;
  handleAddCashFlow: () => void;
  formatMoney: (val: number) => string;
  formatDate: (val: any) => string;
  onDeleteCashFlowClick: (cf: any) => void;
}

export default function CashFlowManager({
  activeShift,
  showCashFlowForm, // Not used in this new layout
  setShowCashFlowForm, // Not used
  cashFlowAmount,
  setCashFlowAmount,
  cashFlowNote,
  setCashFlowNote,
  cashFlowType,
  setCashFlowType,
  isSubmittingCashFlow,
  handleAddCashFlow,
  formatMoney,
  formatDate,
  onDeleteCashFlowClick
}: CashFlowManagerProps) {
  
  const symbol = 'Rp';

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-950 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
          <Coins className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-neutral-800 dark:text-neutral-200">Pencatatan Arus Kas (Cash In/Out)</h3>
          <p className="text-xs text-neutral-500">Catat kas masuk atau keluar selama shift berlangsung.</p>
        </div>
      </div>

      <div className="w-full h-[1px] bg-neutral-200 dark:bg-white/[0.1] my-1" />

      <div className="flex flex-col sm:flex-row gap-3 pt-2 items-end">
        <div className="flex flex-col gap-2 w-full sm:w-1/4">
          <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Jenis Kas</Label>
          <select 
            value={cashFlowType} 
            onChange={(e) => setCashFlowType(e.target.value as 'in'|'out')}
            className="h-10 px-3 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.1] rounded-xl text-sm font-semibold w-full focus:outline-none focus:ring-1 focus:ring-neutral-400"
          >
            <option value="in">⬆️ Kas Masuk (In)</option>
            <option value="out">⬇️ Kas Keluar (Out)</option>
          </select>
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-1/3">
          <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Nominal</Label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-sm text-neutral-400 font-bold">{symbol}</span>
            <Input
              type="number"
              placeholder="0"
              value={cashFlowAmount}
              onChange={(e) => setCashFlowAmount(e.target.value)}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              className="pl-12 h-10 bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl text-sm font-semibold w-full"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-1/3">
          <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Keterangan</Label>
          <Input
            placeholder="Catatan..."
            value={cashFlowNote}
            onChange={(e) => setCashFlowNote(e.target.value)}
            className="h-10 bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl text-sm w-full"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isSubmittingCashFlow) {
                handleAddCashFlow();
              }
            }}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={handleAddCashFlow} disabled={isSubmittingCashFlow} className="h-10 px-6 rounded-xl text-xs font-bold w-full sm:w-auto bg-neutral-800 hover:bg-neutral-700 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 border-none shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" /> {isSubmittingCashFlow ? '...' : 'Tambah'}
          </Button>
        </div>
      </div>

      {/* Cash Flow Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pt-4 border-t border-dashed border-neutral-200 dark:border-white/[0.1]">
        {/* Table IN */}
        <div>
          <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wider">Riwayat Cash In</h4>
          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto thin-scrollbar pr-1">
            {activeShift?.cashFlows?.filter(c => c.type === 'in').map(c => (
              <div key={c.id} className="p-2 border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-lg flex justify-between items-center text-[11px] shadow-sm group">
                <div className="flex flex-col flex-1">
                  <span className="font-bold text-neutral-700 dark:text-neutral-200">{c.note}</span>
                  <span className="text-[9px] text-neutral-400">{formatDate(c.timestamp).split(',')[1]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">+{formatMoney(c.amount)}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    {/* Note: Edit feature removed in modular version to simplify, relying entirely on Delete */}
                    <button onClick={() => onDeleteCashFlowClick(c)} className="p-1 hover:bg-neutral-200 dark:hover:bg-zinc-800 rounded text-red-500 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {(!activeShift?.cashFlows || activeShift.cashFlows.filter(c => c.type === 'in').length === 0) && (
              <div className="text-[10px] text-neutral-400 italic text-center py-2 border border-dashed border-neutral-200 dark:border-white/[0.1] rounded-lg">Belum ada cash in.</div>
            )}
          </div>
        </div>
        {/* Table OUT */}
        <div>
          <h4 className="text-[10px] font-bold text-red-500 dark:text-red-400 mb-2 uppercase tracking-wider">Riwayat Cash Out</h4>
          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto thin-scrollbar pr-1">
            {activeShift?.cashFlows?.filter(c => c.type === 'out').map(c => (
              <div key={c.id} className="p-2 border border-red-500/20 bg-red-500/5 dark:bg-red-500/10 rounded-lg flex justify-between items-center text-[11px] shadow-sm group">
                <div className="flex flex-col flex-1">
                  <span className="font-bold text-neutral-700 dark:text-neutral-200">{c.note}</span>
                  <span className="text-[9px] text-neutral-400">{formatDate(c.timestamp).split(',')[1]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-red-500 dark:text-red-400">-{formatMoney(c.amount)}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button onClick={() => onDeleteCashFlowClick(c)} className="p-1 hover:bg-neutral-200 dark:hover:bg-zinc-800 rounded text-red-500 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {(!activeShift?.cashFlows || activeShift.cashFlows.filter(c => c.type === 'out').length === 0) && (
              <div className="text-[10px] text-neutral-400 italic text-center py-2 border border-dashed border-neutral-200 dark:border-white/[0.1] rounded-lg">Belum ada cash out.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
