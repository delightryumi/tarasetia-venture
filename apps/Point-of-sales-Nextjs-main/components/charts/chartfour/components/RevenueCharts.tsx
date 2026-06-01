import React from 'react';
import dynamic from 'next/dynamic';
import { Layers } from 'lucide-react';
import { ApexOptions } from 'apexcharts';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

interface RevenueChartsProps {
  alacarteSeries: any[];
  banquetSeries: any[];
  alacarteMax?: number;
  banquetMax?: number;
  chartOptions: ApexOptions;
}

export const RevenueCharts: React.FC<RevenueChartsProps> = ({
  alacarteSeries,
  banquetSeries,
  alacarteMax,
  banquetMax,
  chartOptions,
}) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* Ala Carte Chart */}
      <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-neutral-100 dark:border-white/[0.06] bg-gradient-to-r from-neutral-50 to-white dark:from-zinc-900 dark:to-zinc-950">
          <Layers className="w-4 h-4 text-neutral-500" />
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Ala Carte Revenue Timeline</h2>
        </div>
        <div className="p-4 flex-grow h-full min-h-[300px]">
          <ReactApexChart
            options={{
              ...chartOptions,
              yaxis: {
                ...chartOptions.yaxis,
                max: alacarteMax,
              },
            }}
            series={alacarteSeries}
            type="area"
            height="100%"
            width="100%"
          />
        </div>
      </div>

      {/* Banquet Chart */}
      <div className="rounded-xl border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-neutral-100 dark:border-white/[0.06] bg-gradient-to-r from-neutral-50 to-white dark:from-zinc-900 dark:to-zinc-950">
          <Layers className="w-4 h-4 text-neutral-500" />
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Banquet Revenue Timeline</h2>
        </div>
        <div className="p-4 flex-grow h-full min-h-[300px]">
          <ReactApexChart
            options={{
              ...chartOptions,
              yaxis: {
                ...chartOptions.yaxis,
                max: banquetMax,
              },
            }}
            series={banquetSeries}
            type="area"
            height="100%"
            width="100%"
          />
        </div>
      </div>
    </div>
  );
};
