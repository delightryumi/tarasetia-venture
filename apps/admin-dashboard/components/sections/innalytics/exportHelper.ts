import * as XLSX from 'xlsx';

export interface ExportDataRow {
  [key: string]: string | number;
}

export const exportToExcel = (data: ExportDataRow[], fileName: string = 'innalytics_report') => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (err) {
    console.error('Failed to export Excel:', err);
  }
};

export const exportToCSV = (data: ExportDataRow[], fileName: string = 'innalytics_report') => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Failed to export CSV:', err);
  }
};

export const triggerPrint = () => {
  window.print();
};
