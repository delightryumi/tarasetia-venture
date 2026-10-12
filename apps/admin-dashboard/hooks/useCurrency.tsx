'use client';
import { useState, useEffect, useCallback } from 'react';
import { getCurrencyConfig, formatCurrencyAmount, DEFAULT_CURRENCY, CurrencyConfig } from '@/lib/currency-utils';
import { useAuth } from '@/context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function getCurrencySymbol(code: string): string {
  const config = getCurrencyConfig(code);
  return config.symbol + (config.symbol.endsWith('$') || config.symbol.endsWith('¥') || config.symbol.endsWith('£') || config.symbol.endsWith('€') ? '' : ' ');
}

export function useCurrency() {
  const { activeHotelCode } = useAuth();
  const [currencyCode, setCurrencyCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('shopCurrency') || DEFAULT_CURRENCY;
    }
    return DEFAULT_CURRENCY;
  });

  // 1. Real-time sync with active hotel document in Firestore
  useEffect(() => {
    if (!activeHotelCode || activeHotelCode === '0') return;

    const hotelRef = doc(db, 'hotels', activeHotelCode);
    const unsub = onSnapshot(hotelRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.currency && data.currency !== currencyCode) {
          setCurrencyCode(data.currency);
          if (typeof window !== 'undefined') {
            localStorage.setItem('shopCurrency', data.currency);
            window.dispatchEvent(new Event('currencyChanged'));
          }
        }
      }
    }, (err) => {
      console.warn('Error reading hotel currency:', err);
    });

    return () => unsub();
  }, [activeHotelCode]);

  // 2. Listen to local currencyChanged events
  useEffect(() => {
    const handleCurrencyChanged = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('shopCurrency') || DEFAULT_CURRENCY;
        setCurrencyCode(saved);
      }
    };

    window.addEventListener('currencyChanged', handleCurrencyChanged);
    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChanged);
    };
  }, []);

  const config: CurrencyConfig = getCurrencyConfig(currencyCode);
  const symbol = getCurrencySymbol(currencyCode);

  const formatCurrency = useCallback((amount: number | string | undefined | null): string => {
    if (amount === undefined || amount === null) return '';
    const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    if (isNaN(num)) return '';
    return formatCurrencyAmount(num, currencyCode);
  }, [currencyCode]);

  return { currencyCode, symbol, formatCurrency, config };
}
