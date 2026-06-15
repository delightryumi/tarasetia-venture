'use client';

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface BillingExpirationBannerProps {
  hotelName: string;
  formattedDueDate: string;
  onDismiss: () => void;
}

export function BillingExpirationBanner({
  hotelName,
  formattedDueDate,
  onDismiss,
}: BillingExpirationBannerProps) {
  return (
    <motion.div
      key="expiry-banner"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[9990] w-[92%] max-w-[540px] pointer-events-auto font-sans"
    >
      <div
        className="flex items-start gap-5 bg-white dark:bg-[#141416] border border-amber-500/30 dark:border-amber-500/20 rounded-md relative overflow-hidden"
        style={{ 
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          padding: '24px 28px'
        }}
      >
        {/* Left accent stripe */}
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#d97706]" />

        {/* Warning Icon Badge */}
        <div className="shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
            <AlertTriangle className="w-4 h-4 text-[#d97706]" strokeWidth={2.5} />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d97706] mb-2">
            Pemberitahuan Masa Aktif
          </p>
          <p className="text-[13px] text-neutral-600 dark:text-neutral-400 leading-[1.8]">
            Layanan CRS untuk{' '}
            <strong className="font-semibold text-neutral-900 dark:text-white">
              {hotelName}
            </strong>{' '}
            akan dinonaktifkan dalam{' '}
            <strong className="font-semibold text-neutral-900 dark:text-white">3 hari</strong>{' '}
            pada <span className="font-medium text-neutral-800 dark:text-neutral-200">{formattedDueDate}</span>. Harap segera koordinasikan pembayaran tagihan sebelum masa aktif habis.
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onDismiss}
          className="shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-all focus:outline-none"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
