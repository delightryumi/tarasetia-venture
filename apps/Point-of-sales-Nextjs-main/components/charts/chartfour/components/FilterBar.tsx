import React from 'react';
import { Input } from '@/components/ui/input';
import { TrendingUp, FileSpreadsheet, FileText, Download } from 'lucide-react';

interface FilterBarProps {
  filterType: 'daily' | 'monthly' | 'custom';
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  handleFilterTypeChange: (type: 'daily' | 'monthly' | 'custom') => void;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  loading?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterType,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  handleFilterTypeChange,
  onExportExcel,
  onExportPDF,
  loading = false,
}) => {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 dark:border-white/[0.05] pb-5">
        <div>
          <h2 className="text-sm font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Navigasi Periode Keuangan
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Type Pills */}
          <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-zinc-900 p-1 rounded-xl border border-neutral-200/50 dark:border-white/[0.05]">
            <button
              onClick={() => handleFilterTypeChange('daily')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'daily'
                  ? 'bg-white dark:bg-zinc-800 text-neutral-800 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
              }`}
            >
              Harian
            </button>
            <button
              onClick={() => handleFilterTypeChange('monthly')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'monthly'
                  ? 'bg-white dark:bg-zinc-800 text-neutral-800 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => handleFilterTypeChange('custom')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'custom'
                  ? 'bg-white dark:bg-zinc-800 text-neutral-800 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
              }`}
            >
              Kustom
            </button>
          </div>

          {/* Export Actions Group */}
          <div className="flex items-center gap-2">
            {onExportExcel && (
              <button
                type="button"
                onClick={onExportExcel}
                disabled={loading}
                title="Ekspor Laporan Analitik Pendapatan ke Excel (.xlsx)"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Ekspor Excel</span>
              </button>
            )}

            {onExportPDF && (
              <button
                type="button"
                onClick={onExportPDF}
                disabled={loading}
                title="Ekspor Laporan Analitik Pendapatan ke Dokumen PDF"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-rose-200 dark:border-rose-800/40 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Ekspor PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {filterType === 'custom' && (
        <div className="flex gap-4 items-center bg-neutral-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-neutral-100 dark:border-white/[0.05]">
          <div className="flex gap-4 items-center flex-wrap">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Rentang Tanggal:</span>
            <div className="flex gap-2 items-center">
              <label className="text-xs text-neutral-400">Dari</label>
              <Input
                className="h-8 w-36 text-xs rounded-lg border-neutral-200 dark:border-white/[0.08]"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-xs text-neutral-400">Sampai</label>
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
