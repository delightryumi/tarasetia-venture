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

export function useCurrency(hotelCodeOverride?: string) {
  const { activeHotelCode } = useAuth();
  const effectiveHotelCode = hotelCodeOverride || activeHotelCode || (typeof window !== 'undefined' ? (localStorage.getItem('active_hotel_code') || localStorage.getItem('hotelCode') || '') : '') || '';

  const [currencyCode, setCurrencyCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const hCode = effectiveHotelCode || localStorage.getItem('active_hotel_code') || localStorage.getItem('hotelCode');
      if (hCode) {
        const cached = localStorage.getItem(`hotel_currency_${hCode}`);
        if (cached) return cached;
      }
      return localStorage.getItem('shopCurrency') || DEFAULT_CURRENCY;
    }
    return DEFAULT_CURRENCY;
  });

  // 1. Real-time sync with active hotel document in Firestore
  useEffect(() => {
    if (!effectiveHotelCode || effectiveHotelCode === '0') return;

    // Check if there's already a cached hotel currency for this property
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`hotel_currency_${effectiveHotelCode}`);
      if (cached && cached !== currencyCode) {
        setCurrencyCode(cached);
      }
    }

    const hotelRef = doc(db, 'hotels', effectiveHotelCode);
    const unsub = onSnapshot(hotelRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const hotelCurrency = (
          data.channelManager?.currency ||
          data.currency ||
          data.cm?.currency ||
          data.settings?.currency ||
          data.baseCurrency ||
          DEFAULT_CURRENCY
        ).toUpperCase().trim();

        if (hotelCurrency && hotelCurrency !== currencyCode) {
          setCurrencyCode(hotelCurrency);
          if (typeof window !== 'undefined') {
            localStorage.setItem('shopCurrency', hotelCurrency);
            localStorage.setItem(`hotel_currency_${effectiveHotelCode}`, hotelCurrency);
            window.dispatchEvent(new Event('currencyChanged'));
          }
        }
      } else {
        if (currencyCode !== DEFAULT_CURRENCY) {
          setCurrencyCode(DEFAULT_CURRENCY);
          if (typeof window !== 'undefined') {
            localStorage.setItem('shopCurrency', DEFAULT_CURRENCY);
            localStorage.setItem(`hotel_currency_${effectiveHotelCode}`, DEFAULT_CURRENCY);
            window.dispatchEvent(new Event('currencyChanged'));
          }
        }
      }
    }, (err) => {
      console.warn('Error reading hotel currency:', err);
    });

    return () => unsub();
  }, [effectiveHotelCode]);

  // 2. Listen to local currencyChanged events
  useEffect(() => {
    const handleCurrencyChanged = () => {
      if (typeof window !== 'undefined') {
        const hCode = effectiveHotelCode || localStorage.getItem('active_hotel_code') || localStorage.getItem('hotelCode');
        const saved = (hCode ? localStorage.getItem(`hotel_currency_${hCode}`) : null) || localStorage.getItem('shopCurrency') || DEFAULT_CURRENCY;
        setCurrencyCode(saved);
      }
    };

    window.addEventListener('currencyChanged', handleCurrencyChanged);
    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChanged);
    };
  }, [effectiveHotelCode]);

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
