/**
 * Helper utilitas untuk mengekspor data Stock Opname ke CSV / Excel
 * Membandingkan Stok Sistem (Sisa by Data / Book Stock) vs Real Inventory (Fisik)
 * serta menghitung selisih (Variance) kuantitas dan nilai rupiah.
 */

export interface ExportOpnameLine {
  item_code?: string;
  name: string;
  category?: string;
  unit: string;
  system_qty: number;
  physical_qty: number;
  variance: number;
  unit_price: number;
  variance_value: number;
  notes?: string;
}

export interface ExportOpnamePayload {
  hotelName?: string;
  department: string;
  period: string;
  conductedBy?: string;
  conductedAt?: string;
  status?: string;
  items: ExportOpnameLine[];
}

export function exportStockOpnameToCSV(payload: ExportOpnamePayload) {
  const {
    hotelName = 'HOTEL & RESORT',
    department,
    period,
    conductedBy = '-',
    conductedAt = new Date().toLocaleDateString('id-ID'),
    status = 'Final',
    items = [],
  } = payload;

  // Ringkasan kalkulasi
  const totalItems = items.length;
  const matchedItems = items.filter(i => i.variance === 0).length;
  const surplusItems = items.filter(i => i.variance > 0).length;
  const shortageItems = items.filter(i => i.variance < 0).length;

  const totalBookValue = items.reduce((acc, i) => acc + ((i.system_qty || 0) * (i.unit_price || 0)), 0);
  const totalPhysicalValue = items.reduce((acc, i) => acc + ((i.physical_qty || 0) * (i.unit_price || 0)), 0);
  const totalNetVariance = items.reduce((acc, i) => acc + (i.variance_value || 0), 0);

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows: string[] = [];

  // Metadata Header (Standar Laporan Audit Hotel)
  rows.push(`${escapeCSV(hotelName.toUpperCase())}`);
  rows.push(`${escapeCSV('LAPORAN REKONSILIASI STOCK OPNAME FISIK & SISTEM (VARIANCE REPORT)')}`);
  rows.push('');
  rows.push(`${escapeCSV('Departemen / Gudang')},${escapeCSV(department)},${escapeCSV('Periode Audit')},${escapeCSV(period)}`);
  rows.push(`${escapeCSV('Auditor / Pelaksana')},${escapeCSV(conductedBy)},${escapeCSV('Tanggal Cetak/Audit')},${escapeCSV(conductedAt)}`);
  rows.push(`${escapeCSV('Status Dokumen')},${escapeCSV(status.toUpperCase())},${escapeCSV('Total SKU Di-audit')},${escapeCSV(totalItems)}`);
  rows.push('');

  // Ringkasan Ringkas
  rows.push(`${escapeCSV('RINGKASAN AUDIT NILAI INVENTARIS')}`);
  rows.push(`${escapeCSV('Total Nilai Stok Sistem (Buku)')},${escapeCSV(`Rp ${totalBookValue.toLocaleString('id-ID')}`)},${escapeCSV('Total Item Match')},${escapeCSV(matchedItems)}`);
  rows.push(`${escapeCSV('Total Nilai Real Fisik (Aktual)')},${escapeCSV(`Rp ${totalPhysicalValue.toLocaleString('id-ID')}`)},${escapeCSV('Total Item Selisih Lebih (+)')},${escapeCSV(surplusItems)}`);
  rows.push(`${escapeCSV('Total Nilai Selisih Bersih (Net)')},${escapeCSV(`Rp ${totalNetVariance.toLocaleString('id-ID')}`)},${escapeCSV('Total Item Selisih Kurang (-)')},${escapeCSV(shortageItems)}`);
  rows.push('');

  // Header Kolom Tabel
  const headers = [
    'No',
    'Kode Barang',
    'Nama Barang',
    'Kategori',
    'Satuan',
    'Sisa by Data (Stok Sistem)',
    'Real Inventory (Stok Fisik)',
    'Selisih Qty',
    'Harga Satuan (Rp)',
    'Nilai Buku Sistem (Rp)',
    'Nilai Real Fisik (Rp)',
    'Nilai Selisih (Rp)',
    'Status Selisih',
    'Keterangan / Alasan'
  ];
  rows.push(headers.map(escapeCSV).join(','));

  // Data baris
  items.forEach((item, index) => {
    const bookVal = (item.system_qty || 0) * (item.unit_price || 0);
    const physVal = (item.physical_qty || 0) * (item.unit_price || 0);
    const varVal = item.variance_value ?? ((item.physical_qty - item.system_qty) * item.unit_price);
    
    let statusSelisih = 'SESUAI (MATCH)';
    if (item.variance > 0) statusSelisih = 'SELISIH LEBIH (+ SURPLUS)';
    else if (item.variance < 0) statusSelisih = 'SELISIH KURANG (- SHORTAGE)';

    const row = [
      index + 1,
      item.item_code || '-',
      item.name,
      item.category || '-',
      item.unit,
      item.system_qty,
      item.physical_qty,
      item.variance > 0 ? `+${item.variance}` : item.variance,
      item.unit_price || 0,
      bookVal,
      physVal,
      varVal > 0 ? `+${varVal}` : varVal,
      statusSelisih,
      item.notes || '-'
    ];
    rows.push(row.map(escapeCSV).join(','));
  });

  // Baris Total di bagian bawah tabel
  rows.push('');
  const totalRow = [
    '',
    '',
    'TOTAL KESELURUHAN',
    '',
    '',
    '',
    '',
    '',
    '',
    totalBookValue,
    totalPhysicalValue,
    totalNetVariance,
    totalNetVariance === 0 ? 'SEIMBANG' : totalNetVariance > 0 ? 'SURPLUS' : 'DEFISIT',
    ''
  ];
  rows.push(totalRow.map(escapeCSV).join(','));

  // UTF-8 BOM agar terbaca sempurna di Microsoft Excel Windows/Mac
  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const safeDept = department.replace(/[^a-zA-Z0-9]/g, '_');
  const safePeriod = period.replace(/[^a-zA-Z0-9]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `Stock_Opname_${safeDept}_${safePeriod}_Reconciliation.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
