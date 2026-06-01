import React from 'react';
import { Layers } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { CategoryBreakdownItem } from '../hooks/useIncomeAnalytics';

interface CategoryBreakdownTableProps {
  categoryBreakdown: CategoryBreakdownItem[];
}

export const CategoryBreakdownTable: React.FC<CategoryBreakdownTableProps> = ({
  categoryBreakdown,
}) => {
  const { formatCurrency } = useCurrency();

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-neutral-100 dark:border-white/[0.06] bg-gradient-to-r from-neutral-50 to-white dark:from-zinc-900 dark:to-zinc-950">
        <Layers className="w-4 h-4 text-neutral-500" />
        <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Detail Pendapatan per Kategori & Sub-Kategori</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-neutral-50/50 dark:bg-zinc-900/50 text-neutral-500 dark:text-neutral-400">
            <tr>
              <th className="px-5 py-3 font-semibold border-b border-neutral-100 dark:border-white/[0.05]">Kategori</th>
              <th className="px-5 py-3 font-semibold border-b border-neutral-100 dark:border-white/[0.05]">Sub-Kategori</th>
              <th className="px-5 py-3 font-semibold text-right border-b border-neutral-100 dark:border-white/[0.05]">Omset Kotor (Gross)</th>
              <th className="px-5 py-3 font-semibold text-right border-b border-neutral-100 dark:border-white/[0.05]">Pajak (Tax & Service)</th>
              <th className="px-5 py-3 font-semibold text-right border-b border-neutral-100 dark:border-white/[0.05]">Net Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-white/[0.05]">
            {categoryBreakdown.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-neutral-400">
                  Tidak ada data untuk periode ini.
                </td>
              </tr>
            ) : (
              categoryBreakdown.map((item, index) => (
                <tr key={index} className="hover:bg-neutral-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-neutral-800 dark:text-neutral-200">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-neutral-100 dark:bg-zinc-800 text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-neutral-600 dark:text-neutral-300 capitalize">{item.subcategory}</td>
                  <td className="px-5 py-3 text-right text-neutral-800 dark:text-neutral-200 font-medium">
                    {formatCurrency(item.grossIncome)}
                  </td>
                  <td className="px-5 py-3 text-right text-red-500 font-medium">
                    {formatCurrency(item.taxIncome)}
                  </td>
                  <td className="px-5 py-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatCurrency(item.netProfit)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
