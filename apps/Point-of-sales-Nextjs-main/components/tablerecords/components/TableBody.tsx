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
  discount?: number;
  createdAt: string;
  isComplete: boolean;
  products: Product[]; // Menggunakan array untuk produk
  paymentMethod: string;
  revenueType: string;
  customerName?: string;
  tableNumber?: string;
  cashierName?: string;
  isCompliment?: boolean;
  complimentValue?: number;
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
              <TableCell className="font-medium pl-4 whitespace-nowrap">{item.id}</TableCell>
              <TableCell className="pl-4 font-semibold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">{item.customerName || '-'}</TableCell>
              <TableCell className="pl-4 whitespace-nowrap">{item.tableNumber || '-'}</TableCell>
              <TableCell className="pl-4 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{item.cashierName || '-'}</TableCell>
              <TableCell className="text-center whitespace-nowrap">
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
              <TableCell className="hidden md:table-cell text-center whitespace-nowrap">
                {item.totalQuantity}
              </TableCell>
              <TableCell className="p-4 text-right text-red-500 font-medium whitespace-nowrap">
                {item.discount && item.discount > 0 ? `-${formatCurrency(item.discount)}` : '-'}
              </TableCell>
              <TableCell className="p-4 text-right font-bold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                {item.isCompliment ? (
                  <span className="text-purple-600 dark:text-purple-400 text-xs tracking-wider">COMPLIMENT ({formatCurrency(item.complimentValue || 0)})</span>
                ) : (
                  item.totalAmount ? formatCurrency(parseFloat(item.totalAmount)) : 'N/A'
                )}
              </TableCell>
              <TableCell className="p-4 text-center uppercase font-bold text-[10px] whitespace-nowrap">
                <Badge variant="outline" className={item.isCompliment ? "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800" : "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"}>
                  {item.isCompliment ? 'COMPLIMENT' : item.paymentMethod}
                </Badge>
              </TableCell>
              <TableCell className="p-4 text-center capitalize font-semibold text-[10px] whitespace-nowrap">
                <Badge variant="outline" className={item.revenueType === 'banquet' ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800' : 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800'}>
                  {item.revenueType === 'banquet' ? 'Banquet' : 'A la Carte'}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell pl-3 whitespace-nowrap">
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
