import React from 'react';
import ChartFour from '@/components/charts/chartfour';

const page = () => {
  return (
    <div className="w-full h-full flex flex-col p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white">Analitik Omset & Penjualan POS</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Grafik tren pendapatan dan performa penjualan.</p>
        </div>
      </div>
      <div className="flex-1">
        <ChartFour />
      </div>
    </div>
  );
};

export default page;
