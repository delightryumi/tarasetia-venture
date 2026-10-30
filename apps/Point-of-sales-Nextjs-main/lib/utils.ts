import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generatePagination = (currentPage: number, totalPages: number) => {
  const pagination: (number | string)[] = [];
  const pageRange = 2; // range of pages to show around the current page

  if (totalPages <= 3) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Always show the first page
  pagination.push(1);

  // Add the previous ellipsis if currentPage is greater than pageRange + 2
  if (currentPage > pageRange + 2) {
    pagination.push('...');
  }

  // Add pages around the currentPage
  for (
    let i = Math.max(2, currentPage - pageRange);
    i <= Math.min(totalPages - 1, currentPage + pageRange);
    i++
  ) {
    pagination.push(i);
  }

  // Add the next ellipsis if currentPage is less than totalPages - pageRange - 1
  if (currentPage < totalPages - pageRange - 1) {
    pagination.push('...');
  }

  // Always show the last page
  pagination.push(totalPages);

  return pagination;
};

export function clearStorageSafe() {
  if (typeof window === 'undefined') return;
  try {
    const preservePrefix = 'tara_trusted_device_';
    const preserveKeys = ['tara_device_id'];
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && !k.startsWith(preservePrefix) && !preserveKeys.includes(k)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

