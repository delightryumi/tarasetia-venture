import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

function TableHeadRecords() {
  return (
    <>
      <TableHeader>
        <TableRow>
          <TableHead className="p-4 whitespace-nowrap">No. Bill / Transaksi</TableHead>
          <TableHead className="p-4 whitespace-nowrap">Nama Tamu / Kamar</TableHead>
          <TableHead className="p-4 whitespace-nowrap">No. Meja</TableHead>
          <TableHead className="p-4 whitespace-nowrap">Petugas Kasir</TableHead>
          <TableHead className="p-4 whitespace-nowrap text-center">Status Bill</TableHead>
          <TableHead className="hidden md:table-cell p-4 whitespace-nowrap text-center">
            Item Terjual
          </TableHead>
          <TableHead className="p-4 whitespace-nowrap text-right">Diskon</TableHead>
          <TableHead className="p-4 whitespace-nowrap text-right">Total Tagihan</TableHead>
          <TableHead className="p-4 whitespace-nowrap text-center">Metode Settlement</TableHead>
          <TableHead className="p-4 whitespace-nowrap text-center">Revenue Center</TableHead>
          <TableHead className="hidden md:table-cell p-4 whitespace-nowrap">Waktu Posting</TableHead>
          <TableHead>
            <span className="sr-only">Aksi</span>
          </TableHead>
        </TableRow>
      </TableHeader>
    </>
  );
}

export default TableHeadRecords;
