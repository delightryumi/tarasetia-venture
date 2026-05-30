'use client';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import SkeletonRecords from '@/components/skeleton/records';

import { useState, useEffect } from 'react';
import { useCurrency } from '@/hooks/useCurrency';
import Dropdown from './btn/Dropdown';

interface Product {
  id: string;
  productId: string;
  quantity: number;
}

interface Recordsdata {
  totalQuantity: number;
  id: string;
  totalAmount: string | null;
  createdAt: string;
  isComplete: boolean;
  products: Product[]; // Menggunakan array untuk produk
  paymentMethod: string;
  revenueType: string;
}

interface TableBodyRecordsProps {
  data: Recordsdata[];
}

const TableBodyRecords: React.FC<TableBodyRecordsProps> = ({ data }) => {
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState<boolean>(true);

  const [recordsData, setRecordsData] = useState<Recordsdata[]>([]);

  useEffect(() => {
    // Simulate data fetching
    setTimeout(() => {
      setRecordsData(data);
      setLoading(false);
    }, 1000); // Simulate a delay
  }, [data]);

  return (
    <TableBody>
      {loading
        ? Array.from({ length: 5 }).map((_, i) => <SkeletonRecords key={i} />)
        : recordsData.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium pl-4">{item.id}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    item.isComplete
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                  }
                >
                  {item.isComplete ? 'Complete' : 'Incomplete'}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell pl-20 pr-20">
                {item.totalQuantity}
              </TableCell>
              <TableCell className="pl-5">
                {item.totalAmount ? formatCurrency(parseFloat(item.totalAmount)) : 'N/A'}
              </TableCell>
              <TableCell className="pl-4 uppercase font-bold text-[10px]">
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                  {item.paymentMethod}
                </Badge>
              </TableCell>
              <TableCell className="pl-4 capitalize font-semibold text-[10px]">
                <Badge variant="outline" className={item.revenueType === 'banquet' ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800' : 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800'}>
                  {item.revenueType === 'banquet' ? 'Banquet' : 'A la Carte'}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell pl-3">
                {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
              </TableCell>
              <TableCell>
                <Dropdown records={item} />
              </TableCell>
            </TableRow>
          ))}
    </TableBody>
  );
};

export default TableBodyRecords;
