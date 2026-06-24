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
  status?: string;
  cancelReason?: string;
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
        : recordsData.map((item, index) => (
            <TableRow 
              key={`${item.id}-${index}`} 
              className={item.status === 'CANCELLED' ? 'line-through text-neutral-400 dark:text-neutral-600 opacity-65 bg-red-500/5' : ''}
            >
              <TableCell className="font-medium pl-4 whitespace-nowrap">
                <div>{item.id}</div>
                {item.status === 'CANCELLED' && item.cancelReason && (
                  <div className="text-[10px] text-red-500 font-bold no-underline italic">Reason: {item.cancelReason}</div>
                )}
              </TableCell>
              <TableCell className="pl-4 font-semibold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">{item.customerName || '-'}</TableCell>
              <TableCell className="pl-4 whitespace-nowrap">{item.tableNumber || '-'}</TableCell>
              <TableCell className="pl-4 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{item.cashierName || '-'}</TableCell>
              <TableCell className="text-center whitespace-nowrap">
                <span
                  className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${
                    item.status === 'CANCELLED'
                      ? 'bg-rose-600 text-white border-rose-500'
                      : item.isComplete
                      ? 'bg-green-500 text-white border-green-400'
                      : 'bg-red-500 text-white border-red-400'
                  }`}
                >
                  {item.status === 'CANCELLED' ? 'Cancelled' : item.isComplete ? 'Complete' : 'Incomplete'}
                </span>
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
                <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${item.isCompliment ? "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800" : "bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800"}`}>
                  {item.isCompliment ? 'COMPLIMENT' : item.paymentMethod}
                </span>
              </TableCell>
              <TableCell className="p-4 text-center capitalize font-semibold text-[10px] whitespace-nowrap">
                <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${item.revenueType === 'banquet' ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800' : 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800'}`}>
                  {item.revenueType === 'banquet' ? 'Banquet' : 'A la Carte'}
                </span>
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
