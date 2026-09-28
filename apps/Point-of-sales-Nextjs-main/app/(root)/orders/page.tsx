import React from 'react';
import KitchenDisplaySystem from '@/components/order/KitchenDisplaySystem';
import ErrorBoundary from '@/components/toaster/toaster';

const page = () => {
  return (
    <div className="w-full h-full">
      <ErrorBoundary>
        <KitchenDisplaySystem />
      </ErrorBoundary>
    </div>
  );
};

export default page;
