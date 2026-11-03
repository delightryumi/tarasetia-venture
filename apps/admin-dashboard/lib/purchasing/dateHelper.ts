/**
 * Purchasing Date Utilities
 * Standardized date extraction, mode filtering, and label formatting for SR, PR, and DML.
 */

export type DateFilterMode = 'daily' | 'monthly' | 'custom' | 'all';

/**
 * Returns current date string formatted as YYYY-MM-DD
 */
export function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Returns current month string formatted as YYYY-MM
 */
export function getCurrentMonthStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Safely extracts YYYY-MM-DD string from a document's date fields (order_date, date, created_at)
 */
export function extractDocDateStr(doc: any): string {
  if (!doc) return '';
  const raw = doc.order_date || doc.date || doc.created_at;
  if (!raw) return '';

  if (typeof raw === 'string') {
    if (raw.includes('T')) return raw.split('T')[0];
    if (raw.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.substring(0, 10);
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    return raw;
  }
  if (raw.toDate && typeof raw.toDate === 'function') {
    const d = raw.toDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  if (typeof raw.seconds === 'number') {
    const d = new Date(raw.seconds * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  return '';
}

/**
 * Evaluates whether a document matches the active date filter mode
 */
export function isDocMatchingDateFilter(
  doc: any,
  mode: DateFilterMode,
  singleDate: string,
  selectedMonth: string,
  startDate: string,
  endDate: string
): boolean {
  if (mode === 'all') return true;
  const dStr = extractDocDateStr(doc);
  if (!dStr) return false;

  if (mode === 'daily') {
    if (!singleDate) return true;
    return dStr === singleDate;
  }

  if (mode === 'monthly') {
    if (!selectedMonth) return true;
    return dStr.startsWith(selectedMonth);
  }

  if (mode === 'custom') {
    if (startDate && dStr < startDate) return false;
    if (endDate && dStr > endDate) return false;
    return true;
  }

  return true;
}

/**
 * Returns a human-friendly period label for displays, headers, and printouts
 */
export function formatPeriodLabel(
  mode: DateFilterMode,
  singleDate: string,
  selectedMonth: string,
  startDate: string,
  endDate: string
): string {
  if (mode === 'daily') {
    if (!singleDate) return 'Semua Tanggal';
    const d = new Date(singleDate + 'T00:00:00');
    return isNaN(d.getTime())
      ? singleDate
      : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  if (mode === 'monthly') {
    if (!selectedMonth) return 'Semua Bulan';
    const parts = selectedMonth.split('-');
    if (parts.length === 2) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
      return isNaN(d.getTime())
        ? selectedMonth
        : d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }
    return selectedMonth;
  }

  if (mode === 'custom') {
    if (!startDate && !endDate) return 'Semua Periode';
    const s = startDate
      ? new Date(startDate + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Awal';
    const e = endDate
      ? new Date(endDate + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Hari Ini';
    return `${s} s/d ${e}`;
  }

  return 'Semua Data Riwayat';
}

/**
 * Formats date value into clean Indonesian string (e.g. "03 Nov 2026")
 */
export function formatDateDisplay(val: any): string {
  if (!val) return '—';
  if (val?.toDate) {
    return val.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

