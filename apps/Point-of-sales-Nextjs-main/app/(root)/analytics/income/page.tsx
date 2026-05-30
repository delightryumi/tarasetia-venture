import React from 'react';
import ChartFour from '@/components/charts/chartfour';

const page = () => {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center px-5 pt-4 pb-2">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-white">Income Analytics</h2>
      </div>
      <div className="flex-1">
        <ChartFour />
      </div>
    </div>
  );
};

export default page;
