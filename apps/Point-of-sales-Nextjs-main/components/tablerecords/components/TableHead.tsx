import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

function TableHeadRecords() {
  return (
    <>
      <TableHeader>
        <TableRow>
          <TableHead className="p-4 whitespace-nowrap">Transactions Id</TableHead>
          <TableHead className="p-4 whitespace-nowrap">Tamu</TableHead>
          <TableHead className="p-4 whitespace-nowrap">No Meja</TableHead>
          <TableHead className="p-4 whitespace-nowrap">Kasir</TableHead>
          <TableHead className="p-4 whitespace-nowrap text-center">Status</TableHead>
          <TableHead className="hidden md:table-cell p-4 whitespace-nowrap text-center">
            Total Product Sales
          </TableHead>
          <TableHead className="p-4 whitespace-nowrap text-right">Discount</TableHead>
          <TableHead className="p-4 whitespace-nowrap text-right">Total Amount</TableHead>
          <TableHead className="p-4 whitespace-nowrap text-center">Metode Pembayaran</TableHead>
          <TableHead className="p-4 whitespace-nowrap text-center">Alokasi Pendapatan</TableHead>
          <TableHead className="hidden md:table-cell p-4 whitespace-nowrap">Create At</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
    </>
  );
}

export default TableHeadRecords;
