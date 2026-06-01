import React from 'react';
import { Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const CostSections: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Food Cost Table */}
      <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-white/[0.06] bg-gradient-to-r from-neutral-50 to-white dark:from-zinc-900 dark:to-zinc-950">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-neutral-500" />
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Food Cost</h2>
          </div>
          <Badge variant="secondary" className="text-[9px] uppercase tracking-wider">
            Draft
          </Badge>
        </div>
        <div className="p-8 flex flex-col items-center justify-center text-center gap-2 min-h-[160px]">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Coming Soon</span>
          <span className="text-[11px] text-neutral-450 dark:text-neutral-500">Rincian laporan HPP Makanan sedang disiapkan.</span>
        </div>
      </div>

      {/* Beverage Cost Table */}
      <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-white/[0.06] bg-gradient-to-r from-neutral-50 to-white dark:from-zinc-900 dark:to-zinc-950">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-neutral-500" />
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Beverage Cost</h2>
          </div>
          <Badge variant="secondary" className="text-[9px] uppercase tracking-wider">
            Draft
          </Badge>
        </div>
        <div className="p-8 flex flex-col items-center justify-center text-center gap-2 min-h-[160px]">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Coming Soon</span>
          <span className="text-[11px] text-neutral-450 dark:text-neutral-500">Rincian laporan HPP Minuman sedang disiapkan.</span>
        </div>
      </div>

      {/* Banquet Cost Table */}
      <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-white/[0.06] bg-gradient-to-r from-neutral-50 to-white dark:from-zinc-900 dark:to-zinc-950">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-neutral-500" />
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Banquet Cost</h2>
          </div>
          <Badge variant="secondary" className="text-[9px] uppercase tracking-wider">
            Draft
          </Badge>
        </div>
        <div className="p-8 flex flex-col items-center justify-center text-center gap-2 min-h-[160px]">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Coming Soon</span>
          <span className="text-[11px] text-neutral-450 dark:text-neutral-500">Rincian laporan HPP Banquet sedang disiapkan.</span>
        </div>
      </div>
    </div>
  );
};
