import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Table } from '@/components/ui/table';
import TableHeadRecords from './components/TableHead';
import TableBodyRecords from './components/TableBody';
import { fetchRecords } from '@/data/records';
import { PageProps } from '@/types/paginations';
import { PaginationDemo } from '@/components/paginations/pagination';
import { SearchInput } from '@/components/search/search';
import RecordsDateFilter from './components/RecordsDateFilter';

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
  products: Product[];
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

export async function Records(props: PageProps) {
  const searchParams = await props.searchParams;
  const pageNumber = Number(searchParams?.page || 1); // Get the page number. Default to 1 if not provided.
  const take = 10;
  const skip = (pageNumber - 1) * take;
  const search =
    typeof searchParams?.search === 'string'
      ? searchParams?.search
      : undefined;
  const startDate =
    typeof searchParams?.startDate === 'string'
      ? searchParams?.startDate
      : undefined;
  const endDate =
    typeof searchParams?.endDate === 'string'
      ? searchParams?.endDate
      : undefined;

  const result = await fetchRecords({ take, skip, query: search, startDate, endDate });
  if (!result) {
    return (
      <Card className="h-full flex flex-col items-center justify-center p-8">
        <span className="text-sm font-semibold text-red-500">
          Gagal memuat data transaksi. Silakan coba beberapa saat lagi.
        </span>
      </Card>
    );
  }
  const { data, metadata } = result;
  const convertedData: Recordsdata[] = (data as any[]).map((item) => ({
    totalQuantity: item.totalQuantity,
    id: item.id,
    totalAmount: item.totalAmount ? item.totalAmount.toString() : null,
    discount: item.discount || 0,
    createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
    isComplete: item.isComplete,
    products: item.products,
    paymentMethod: item.paymentMethod || 'cash',
    revenueType: item.revenueType || 'alacarte',
    customerName: item.customerName || '',
    tableNumber: item.tableNumber || '',
    cashierName: item.cashierName || '',
    isCompliment: !!item.isCompliment,
    complimentValue: Number(item.complimentValue || 0),
    status: item.status || 'SUCCESS',
    cancelReason: item.cancelReason || '',
  }));
  return (
    <Card x-chunk="dashboard-06-chunk-0" className="h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full pr-0 md:pr-6">
        <CardHeader className="pb-4 md:pb-6">
          <CardTitle>Transaction Records</CardTitle>
          <CardDescription>Manage your transaction history and reports.</CardDescription>
        </CardHeader>
        <div className="flex flex-wrap items-center gap-4 px-6 md:px-0 pb-4 md:pb-0">
          <RecordsDateFilter />
          <div className="relative w-full sm:w-64">
            <SearchInput search={search} />
          </div>
        </div>
      </div>
      <CardContent className="flex-grow">
        <Table>
          <TableHeadRecords />
          <TableBodyRecords data={convertedData} />
        </Table>
      </CardContent>
      <CardFooter className="mt-auto">
        <PaginationDemo {...metadata} />
      </CardFooter>
    </Card>
  );
}
