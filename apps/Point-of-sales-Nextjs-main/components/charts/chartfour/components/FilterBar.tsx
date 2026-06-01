import React from 'react';
import { Input } from '@/components/ui/input';
import { TrendingUp } from 'lucide-react';

interface FilterBarProps {
  filterType: 'daily' | 'monthly' | 'custom';
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  handleFilterTypeChange: (type: 'daily' | 'monthly' | 'custom') => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterType,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  handleFilterTypeChange,
}) => {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 dark:border-white/[0.05] pb-5">
        <div>
          <h2 className="text-sm font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            Navigasi Periode Keuangan
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-neutral-100 dark:bg-zinc-900 p-1 rounded-lg">
          <button
            onClick={() => handleFilterTypeChange('daily')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filterType === 'daily'
                ? 'bg-white dark:bg-zinc-800 text-neutral-800 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
            }`}
          >
            Harian
          </button>
          <button
            onClick={() => handleFilterTypeChange('monthly')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filterType === 'monthly'
                ? 'bg-white dark:bg-zinc-800 text-neutral-800 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
            }`}
          >
            Bulanan
          </button>
          <button
            onClick={() => handleFilterTypeChange('custom')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filterType === 'custom'
                ? 'bg-white dark:bg-zinc-800 text-neutral-800 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
            }`}
          >
            Kustom
          </button>
        </div>
      </div>

      {filterType === 'custom' && (
        <div className="flex gap-4 items-center bg-neutral-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-neutral-100 dark:border-white/[0.05]">
          <div className="flex gap-4 items-center">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Date Range:</span>
            <div className="flex gap-2 items-center">
              <label className="text-xs text-neutral-400">Start</label>
              <Input
                className="h-8 w-36 text-xs rounded-lg border-neutral-200 dark:border-white/[0.08]"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-xs text-neutral-400">End</label>
              <Input
                className="h-8 w-36 text-xs rounded-lg border-neutral-200 dark:border-white/[0.08]"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
