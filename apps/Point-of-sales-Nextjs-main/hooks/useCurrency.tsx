'use client';
import { useState, useEffect } from 'react';

export function getCurrencySymbol(code: string): string {
  switch (code) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'SGD': return 'S$';
    case 'MYR': return 'RM';
    case 'GBP': return '£';
    case 'AUD': return 'A$';
    case 'JPY': return '¥';
    case 'IDR': default: return 'Rp ';
  }
}

export function useCurrency() {
  const [symbol, setSymbol] = useState('Rp ');

  useEffect(() => {
    const updateCurrency = () => {
      const code = localStorage.getItem('shopCurrency') || 'IDR';
      setSymbol(getCurrencySymbol(code));
    };

    // Initial check
    updateCurrency();

    // Listen to custom event
    window.addEventListener('currencyChanged', updateCurrency);
    return () => {
      window.removeEventListener('currencyChanged', updateCurrency);
    };
  }, []);

  const formatCurrency = (amount: number | string | undefined | null): string => {
    if (amount === undefined || amount === null) return '';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '';
    
    return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  return { symbol, formatCurrency };
}
