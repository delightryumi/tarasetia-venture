import React from 'react';
import TableProduct from '@/components/tableproduct/table';
import { PageProps } from '@/types/paginations';
import ErrorBoundary from '@/components/toaster/toaster';
import CategorySubcategoryPanel from '@/components/tableproduct/components/CategorySubcategoryPanel';

const page = async (props: PageProps) => {
  return (
    <div className="w-full flex flex-col gap-6 pb-8">
      <ErrorBoundary>
        <TableProduct {...props} />
      </ErrorBoundary>
      <CategorySubcategoryPanel />
    </div>
  );
};

export default page;
