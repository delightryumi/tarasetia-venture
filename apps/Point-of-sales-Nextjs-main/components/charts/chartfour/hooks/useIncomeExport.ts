import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CategoryBreakdownItem } from './useIncomeAnalytics';

interface UseIncomeExportProps {
  startDate: string;
  endDate: string;
  filterType: 'daily' | 'monthly' | 'custom';
  totalGrossIncome: number;
  nettRevenue: number;
  totalTaxIncome: number;
  banquetRevenue: number;
  alacarteRevenue: number;
  foodRevenue: number;
  beverageRevenue: number;
  otherRevenue: number;
  serviceRate: number;
  serviceCharge: number;
  taxRateIndividual: number;
  taxAmount: number;
  lostBreakageRate: number;
  lostBreakageAmount: number;
  taxRate: number;
  categoryBreakdown: CategoryBreakdownItem[];
  hotelName?: string;
  formatCurrency: (val: number) => string;
}

export function useIncomeExport({
  startDate,
  endDate,
  filterType,
  totalGrossIncome,
  nettRevenue,
  totalTaxIncome,
  banquetRevenue,
  alacarteRevenue,
  foodRevenue,
  beverageRevenue,
  otherRevenue,
  serviceRate,
  serviceCharge,
  taxRateIndividual,
  taxAmount,
  lostBreakageRate,
  lostBreakageAmount,
  taxRate,
  categoryBreakdown,
  hotelName = 'SETARA POS & RESTO',
  formatCurrency,
}: UseIncomeExportProps) {

  const formatIDR = (val: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const cleanHotelName = hotelName?.trim() || 'SETARA POS & RESTO';

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. EXCEL EXPORT (.xlsx)
  // ─────────────────────────────────────────────────────────────────────────────
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // --- SHEET 1: RINGKASAN FINANSIAL ---
    const summaryRows: any[][] = [
      [cleanHotelName.toUpperCase()],
      ['LAPORAN ANALITIK OMSET & PENDAPATAN POS'],
      [`Periode: ${formatDateDisplay(startDate)} s/d ${formatDateDisplay(endDate)} (${filterType.toUpperCase()})`],
      [`Tanggal Ekspor: ${new Date().toLocaleString('id-ID')}`],
      [], // blank line
      ['I. RINGKASAN EKSEKUTIF PENDAPATAN', '', ''],
      ['Metrik Keuangan', 'Keterangan', 'Nilai (IDR)'],
      ['1. Omset Kotor (Gross Revenue)', 'Total pendapatan kotor sebelum potongan pajak & service', totalGrossIncome],
      ['2. Pendapatan Bersih (Net Revenue / GOP)', 'Omset kotor dikurangi total pajak dan service charge', nettRevenue],
      ['3. Total Pajak & Service Charge', `Akumulasi seluruh komponen pemotongan (${taxRate}%)`, totalTaxIncome],
      [],
      ['II. DISTRIBUSI REVENUE STREAM', '', ''],
      ['Komponen Penjualan', 'Keterangan', 'Nilai (IDR)', 'Kontribusi (%)'],
      [
        'Penjualan Ala Carte (Resto / Dine-In / Takeaway)',
        'Akumulasi penjualan reguler POS',
        alacarteRevenue,
        totalGrossIncome > 0 ? Number(((alacarteRevenue / totalGrossIncome) * 100).toFixed(1)) : 0,
      ],
      [
        ' - Makanan (Food)',
        'Subtotal omset makanan Ala Carte',
        foodRevenue,
        totalGrossIncome > 0 ? Number(((foodRevenue / totalGrossIncome) * 100).toFixed(1)) : 0,
      ],
      [
        ' - Minuman (Beverage)',
        'Subtotal omset minuman Ala Carte',
        beverageRevenue,
        totalGrossIncome > 0 ? Number(((beverageRevenue / totalGrossIncome) * 100).toFixed(1)) : 0,
      ],
      [
        ' - Lainnya / Other',
        'Subtotal omset item lainnya',
        otherRevenue,
        totalGrossIncome > 0 ? Number(((otherRevenue / totalGrossIncome) * 100).toFixed(1)) : 0,
      ],
      [
        'Penjualan Banquet / Events',
        'Pendapatan acara, meeting & catering',
        banquetRevenue,
        totalGrossIncome > 0 ? Number(((banquetRevenue / totalGrossIncome) * 100).toFixed(1)) : 0,
      ],
      [],
      ['III. RINCIAN PAJAK & SERVICE CHARGE', '', ''],
      ['Komponen Pajak & Biaya', 'Tarif / Rate', 'Nilai (IDR)'],
      [`Pajak Restoran / PB1 (Tax)`, `${taxRateIndividual}%`, taxAmount],
      [`Service Charge`, `${serviceRate}%`, serviceCharge],
      [`Lost & Breakage Fee`, `${lostBreakageRate}%`, lostBreakageAmount],
      [`TOTAL KOMPONEN PAJAK & SERVICE`, `${taxRate}%`, totalTaxIncome],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary['!cols'] = [
      { wch: 45 },
      { wch: 40 },
      { wch: 22 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Finansial');

    // --- SHEET 2: BREAKDOWN KATEGORI ---
    const categoryRows: any[][] = [
      [cleanHotelName.toUpperCase()],
      ['DETAIL PENDAPATAN PER KATEGORI & SUB-KATEGORI'],
      [`Periode: ${formatDateDisplay(startDate)} s/d ${formatDateDisplay(endDate)}`],
      [],
      ['Kategori Utama', 'Sub-Kategori', 'Omset Kotor (IDR)', 'Pajak & Service (IDR)', 'Net Profit (IDR)', 'Pangsa Pasar (%)'],
    ];

    categoryBreakdown.forEach((item) => {
      const share = totalGrossIncome > 0 ? Number(((item.grossIncome / totalGrossIncome) * 100).toFixed(2)) : 0;
      categoryRows.push([
        item.category.toUpperCase(),
        item.subcategory,
        item.grossIncome,
        item.taxIncome,
        item.netProfit,
        share,
      ]);
    });

    // Total Row
    categoryRows.push([
      'TOTAL KESELURUHAN',
      `${categoryBreakdown.length} Sub-Kategori`,
      totalGrossIncome,
      totalTaxIncome,
      nettRevenue,
      100,
    ]);

    const wsCategory = XLSX.utils.aoa_to_sheet(categoryRows);
    wsCategory['!cols'] = [
      { wch: 22 },
      { wch: 28 },
      { wch: 22 },
      { wch: 24 },
      { wch: 22 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, wsCategory, 'Breakdown Kategori');

    // File download
    const filename = `Laporan_Pendapatan_POS_${cleanHotelName.replace(/\s+/g, '_')}_${startDate}_sd_${endDate}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. PDF EXPORT (.pdf)
  // ─────────────────────────────────────────────────────────────────────────────
  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Top Accent Bar
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, pageWidth, 5, 'F');

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(cleanHotelName.toUpperCase(), 14, 15);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // Blue 600
    doc.text('LAPORAN EKSEKUTIF ANALITIK OMSET & PENDAPATAN POS', 14, 21);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(`Periode: ${formatDateDisplay(startDate)} s/d ${formatDateDisplay(endDate)} | Tipe: ${filterType.toUpperCase()}`, 14, 26);
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, pageWidth - 14, 26, { align: 'right' });

    // Thin separator
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(14, 29, pageWidth - 14, 29);

    // ── Metric Summary Cards (2 rows of 4 cards) ──
    const cardStartX = 14;
    const cardStartY = 33;
    const totalW = pageWidth - 28;
    const cardGap = 4;
    const cardW = (totalW - cardGap * 3) / 4;
    const cardH = 16;

    const cardsRow1 = [
      { label: 'OMSET KOTOR (GROSS)', val: formatCurrency(totalGrossIncome), sub: 'Total omset sebelum pajak', col: [37, 99, 235] },
      { label: 'PENDAPATAN BERSIH (NET)', val: formatCurrency(nettRevenue), sub: 'Gross dikurangi tax & service', col: [16, 185, 129] },
      { label: 'BANQUET REVENUE', val: formatCurrency(banquetRevenue), sub: 'Pendapatan acara & catering', col: [217, 119, 6] },
      { label: 'ALACARTE REVENUE', val: formatCurrency(alacarteRevenue), sub: `Food: ${formatCurrency(foodRevenue)} | Bev: ${formatCurrency(beverageRevenue)}`, col: [147, 51, 234] },
    ];

    const cardsRow2 = [
      { label: `SERVICE CHARGE (${serviceRate}%)`, val: formatCurrency(serviceCharge), sub: 'Alokasi service karyawan', col: [37, 99, 235] },
      { label: `PAJAK RESTO / PB1 (${taxRateIndividual}%)`, val: formatCurrency(taxAmount), sub: 'Kewajiban pajak daerah', col: [16, 185, 129] },
      { label: `LOST & BREAKAGE (${lostBreakageRate}%)`, val: formatCurrency(lostBreakageAmount), sub: 'Cadangan kerusakan alat', col: [239, 68, 68] },
      { label: `TOTAL TAX & SERVICE (${taxRate}%)`, val: formatCurrency(totalTaxIncome), sub: 'Akumulasi pemotongan', col: [217, 119, 6] },
    ];

    const renderCardRow = (cards: any[], startY: number) => {
      cards.forEach((c, idx) => {
        const x = cardStartX + idx * (cardW + cardGap);
        // Card Background Box
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, startY, cardW, cardH, 1.5, 1.5, 'FD');

        // Left Accent Strip
        doc.setFillColor(c.col[0], c.col[1], c.col[2]);
        doc.roundedRect(x, startY, 2, cardH, 1, 1, 'F');

        // Label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(c.label, x + 5, startY + 4.5);

        // Value
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(c.val, x + 5, startY + 9.5);

        // Subtext
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(c.sub, x + 5, startY + 13.5, { maxWidth: cardW - 7 });
      });
    };

    renderCardRow(cardsRow1, cardStartY);
    renderCardRow(cardsRow2, cardStartY + cardH + 3);

    // ── Table: Category & Subcategory Breakdown ──
    const tableStartY = cardStartY + cardH * 2 + 8;

    const tableBody: any[] = categoryBreakdown.map((item, idx) => {
      const share = totalGrossIncome > 0 ? `${((item.grossIncome / totalGrossIncome) * 100).toFixed(1)}%` : '0%';
      return [
        idx + 1,
        item.category.toUpperCase(),
        item.subcategory,
        formatCurrency(item.grossIncome),
        formatCurrency(item.taxIncome),
        formatCurrency(item.netProfit),
        share,
      ];
    });

    // Summary Total Row
    tableBody.push([
      { content: 'TOTAL KESELURUHAN', colSpan: 3, styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } },
      { content: formatCurrency(totalGrossIncome), styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } },
      { content: formatCurrency(totalTaxIncome), styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [220, 38, 38] } },
      { content: formatCurrency(nettRevenue), styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [5, 150, 105] } },
      { content: '100%', styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } },
    ]);

    autoTable(doc, {
      startY: tableStartY,
      margin: { left: 14, right: 14 },
      head: [['No', 'Kategori', 'Sub-Kategori', 'Omset Kotor (Gross)', 'Pajak & Service', 'Net Profit', 'Pangsa (%)']],
      body: tableBody,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 2.2,
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left',
        fontSize: 8,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 35, fontStyle: 'bold' },
        2: { halign: 'left', cellWidth: 55 },
        3: { halign: 'right', cellWidth: 42, fontStyle: 'bold' },
        4: { halign: 'right', cellWidth: 42 },
        5: { halign: 'right', cellWidth: 42, fontStyle: 'bold', textColor: [5, 150, 105] },
        6: { halign: 'center', cellWidth: 25 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didDrawPage: (data) => {
        // Footer on each page
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Laporan Resmi POS & FnB Analytics | Halaman ${data.pageNumber} | ${cleanHotelName}`,
          14,
          pageHeight - 6
        );
        doc.text(
          'Sistem Kasir & Finansial Terintegrasi - Confidential',
          pageWidth - 14,
          pageHeight - 6,
          { align: 'right' }
        );
      },
    });

    // Check if we have space for Signatures on current page or need a section
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : tableStartY + 60;
    const signY = finalY + 10 > pageHeight - 35 ? pageHeight - 32 : finalY + 10;

    if (signY <= pageHeight - 20) {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);

      const signW = (pageWidth - 28) / 3;

      // Col 1: Dibuat
      doc.text('Dibuat Oleh (Kasir / Staff POS):', 14, signY);
      doc.setFont('helvetica', 'normal');
      doc.text('( ................................................ )', 14, signY + 15);

      // Col 2: Diperiksa
      doc.setFont('helvetica', 'bold');
      doc.text('Diperiksa (Supervisor / F&B Mgr):', 14 + signW, signY);
      doc.setFont('helvetica', 'normal');
      doc.text('( ................................................ )', 14 + signW, signY + 15);

      // Col 3: Disetujui
      doc.setFont('helvetica', 'bold');
      doc.text('Disetujui (General Mgr / Accounting):', 14 + signW * 2, signY);
      doc.setFont('helvetica', 'normal');
      doc.text('( ................................................ )', 14 + signW * 2, signY + 15);
    }

    const filename = `Laporan_Pendapatan_POS_${cleanHotelName.replace(/\s+/g, '_')}_${startDate}_sd_${endDate}.pdf`;
    doc.save(filename);
  };

  return {
    exportToExcel,
    exportToPDF,
  };
}
