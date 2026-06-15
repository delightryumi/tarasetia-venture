'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { AnimatePresence } from 'framer-motion';
import { BillingSuspendedModal } from './BillingSuspendedModal';
import { BillingExpirationBanner } from './BillingExpirationBanner';

interface HotelBillingData {
  active: boolean;
  name: string;
  billing?: {
    plan: string;
    cycle: string;
    nextDueDate: string;
    status: string;
    showBillingAlert?: boolean;
    showExpirationAlert?: boolean;
    alertMessage?: string;
  };
}

export function BillingAlertModal() {
  const { user, activeHotelCode, signOutUser } = useAuth();
  const [hotelData, setHotelData] = useState<HotelBillingData | null>(null);
  const [isDismissedExpiration, setIsDismissedExpiration] = useState(false);

  const isUserSuperadmin =
    user?.role === 'superadmin' ||
    user?.email?.toLowerCase() === 'nexura.management@gmail.com';

  useEffect(() => {
    if (!activeHotelCode || isUserSuperadmin) {
      setHotelData(null);
      return;
    }
    const docRef = doc(db, 'hotels', activeHotelCode);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setHotelData(docSnap.data() as HotelBillingData);
      }
    }, (err) => {
      console.error('Error listening to hotel billing data:', err);
    });
    return () => unsubscribe();
  }, [activeHotelCode, isUserSuperadmin]);

  if (isUserSuperadmin || !hotelData) return null;

  const showBilling = hotelData.active === false || !!hotelData.billing?.showBillingAlert;
  const showExpiration = !!hotelData.billing?.showExpirationAlert && !isDismissedExpiration;

  const formattedDueDate = hotelData.billing?.nextDueDate
    ? new Date(hotelData.billing.nextDueDate).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '-';

  return (
    <>
      <AnimatePresence>
        {/* ── BILLING SUSPENDED MODAL ── */}
        {showBilling && (
          <BillingSuspendedModal
            hotelName={hotelData.name}
            formattedDueDate={formattedDueDate}
            signOutUser={signOutUser}
            alertMessage={hotelData.billing?.alertMessage}
          />
        )}

        {/* ── EXPIRATION BANNER (H-3) ── */}
        {!showBilling && showExpiration && (
          <BillingExpirationBanner
            hotelName={hotelData.name}
            formattedDueDate={formattedDueDate}
            onDismiss={() => setIsDismissedExpiration(true)}
            alertMessage={hotelData.billing?.alertMessage}
          />
        )}
      </AnimatePresence>
    </>
  );
}

