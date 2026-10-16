'use client';
import { useState, useEffect, useCallback } from 'react';
import { getCurrencyConfig, formatCurrencyAmount, DEFAULT_CURRENCY, CurrencyConfig } from '@/lib/currency-utils';
import { useAuth } from '@/context/AuthContext';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function getCurrencySymbol(code: string): string {
  const config = getCurrencyConfig(code);
  return config.symbol + (config.symbol.endsWith('$') || config.symbol.endsWith('¥') || config.symbol.endsWith('£') || config.symbol.endsWith('€') ? '' : ' ');
}

export async function syncHotelCurrencyToAll(hotelCode: string, currency: string) {
  if (!hotelCode || hotelCode === '0') return;
  const clean = (currency || DEFAULT_CURRENCY).toUpperCase().trim();
  const hotelRef = doc(db, 'hotels', hotelCode);
  await updateDoc(hotelRef, {
    currency: clean,
    baseCurrency: clean,
    'settings.currency': clean,
    'channelManager.currency': clean
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem(`hotel_currency_${hotelCode}`, clean);
    localStorage.setItem('shopCurrency', clean);
    window.dispatchEvent(new Event('currencyChanged'));
  }
}

// ── Shared In-Memory Listener Pool (Low-Cost Firebase Pattern) ──────────
// Ensures only 1 Firestore onSnapshot listener is open per hotel across
// all rows, cards, subtabs, and modals on the screen.
interface HotelCurrencySubscription {
  callbacks: Set<(curr: string) => void>;
  unsub: () => void;
  cachedValue: string;
}

const activeSubscriptions = new Map<string, HotelCurrencySubscription>();

function subscribeToHotelCurrency(hotelCode: string, callback: (curr: string) => void): () => void {
  if (!hotelCode || hotelCode === '0') return () => {};

  let sub = activeSubscriptions.get(hotelCode);
  if (!sub) {
    const callbacks = new Set<(curr: string) => void>();

    let initialValue = DEFAULT_CURRENCY;
    if (typeof window !== 'undefined') {
      initialValue = localStorage.getItem(`hotel_currency_${hotelCode}`) || localStorage.getItem('shopCurrency') || DEFAULT_CURRENCY;
    }

    const hotelRef = doc(db, 'hotels', hotelCode);
    const firestoreUnsub = onSnapshot(hotelRef, (snap) => {
      let hotelCurrency = DEFAULT_CURRENCY;
      if (snap.exists()) {
        const data = snap.data();
        hotelCurrency = (
          data.currency ||
          data.channelManager?.currency ||
          data.baseCurrency ||
          data.settings?.currency ||
          data.cm?.currency ||
          DEFAULT_CURRENCY
        ).toUpperCase().trim();
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('shopCurrency', hotelCurrency);
        localStorage.setItem(`hotel_currency_${hotelCode}`, hotelCurrency);
        window.dispatchEvent(new Event('currencyChanged'));
      }

      const activeSub = activeSubscriptions.get(hotelCode);
      if (activeSub) {
        activeSub.cachedValue = hotelCurrency;
        activeSub.callbacks.forEach(cb => {
          try {
            cb(hotelCurrency);
          } catch (e) {
            console.error('Error notifying currency subscriber:', e);
          }
        });
      }
    }, (err) => {
      console.warn('Error reading hotel currency:', err);
    });

    sub = {
      callbacks,
      unsub: firestoreUnsub,
      cachedValue: initialValue
    };
    activeSubscriptions.set(hotelCode, sub);
  }

  sub.callbacks.add(callback);
  // Send latest cached value immediately to avoid UI flicker
  callback(sub.cachedValue);

  return () => {
    const currentSub = activeSubscriptions.get(hotelCode);
    if (!currentSub) return;
    currentSub.callbacks.delete(callback);
    if (currentSub.callbacks.size === 0) {
      currentSub.unsub();
      activeSubscriptions.delete(hotelCode);
    }
  };
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

  // 1. Shared single onSnapshot listener per hotelCode (Ref-counted, low-cost)
  useEffect(() => {
    if (!effectiveHotelCode || effectiveHotelCode === '0') return;
    const unsub = subscribeToHotelCurrency(effectiveHotelCode, (curr) => {
      setCurrencyCode(curr);
    });
    return () => unsub();
  }, [effectiveHotelCode]);

  // 2. Listen to local currencyChanged events (instant 2-way sync across tabs/components)
  useEffect(() => {
    const handleCurrencyChanged = () => {
      if (typeof window !== 'undefined') {
        const hCode = effectiveHotelCode || localStorage.getItem('active_hotel_code') || localStorage.getItem('hotelCode');
        const saved = (hCode ? localStorage.getItem(`hotel_currency_${hCode}`) : null) || localStorage.getItem('shopCurrency') || DEFAULT_CURRENCY;
        if (saved) setCurrencyCode(saved);
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
