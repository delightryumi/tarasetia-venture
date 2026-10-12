'use client';
import { useState, useEffect, useCallback } from 'react';

const ZERO_DECIMAL_CURRENCIES = new Set(['IDR', 'JPY', 'VND', 'KRW']);

export function getCurrencySymbol(code: string): string {
  switch (code) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'SGD': return 'S$';
    case 'AUD': return 'A$';
    case 'MYR': return 'RM';
    case 'THB': return '฿';
    case 'JPY': return '¥';
    case 'CNY': return '¥';
    case 'AED': return 'AED ';
    case 'SAR': return 'SAR ';
    case 'VND': return '₫';
    case 'KRW': return '₩';
    case 'PHP': return '₱';
    case 'INR': return '₹';
    case 'CHF': return 'CHF ';
    case 'CAD': return 'C$';
    case 'NZD': return 'NZ$';
    case 'HKD': return 'HK$';
    case 'IDR': default: return 'Rp ';
  }
}

export function useCurrency() {
  const [currencyCode, setCurrencyCode] = useState<string>('IDR');
  const [symbol, setSymbol] = useState('Rp ');

  useEffect(() => {
    const updateCurrency = () => {
      const code = (typeof window !== 'undefined' ? localStorage.getItem('shopCurrency') : null) || 'IDR';
      setCurrencyCode(code);
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

  const formatCurrency = useCallback((amount: number | string | undefined | null): string => {
    if (amount === undefined || amount === null) return '';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '';

    const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currencyCode);
    const decimals = isZeroDecimal ? 0 : 2;

    const formatted = num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    const space = (symbol.endsWith('$') || symbol.endsWith('€') || symbol.endsWith('£') || symbol.endsWith('¥')) ? '' : ' ';
    return `${symbol.trim()}${space}${formatted}`;
  }, [symbol, currencyCode]);

  return { currencyCode, symbol, formatCurrency };
}
