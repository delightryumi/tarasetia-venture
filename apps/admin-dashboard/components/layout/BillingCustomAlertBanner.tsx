'use client';

import React from 'react';
import { X, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface BillingCustomAlertBannerProps {
  alertMessage: string;
  onDismiss: () => void;
  offsetTop?: boolean;
}

export function BillingCustomAlertBanner({
  alertMessage,
  onDismiss,
  offsetTop = false,
}: BillingCustomAlertBannerProps) {
  return (
    <motion.div
      key="custom-alert-banner"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="fixed left-1/2 -translate-x-1/2 z-[9990] w-[92%] max-w-[540px] pointer-events-auto font-sans"
      style={{ top: offsetTop ? '160px' : '24px' }}
    >
      <div
        className="flex items-start gap-5 bg-white dark:bg-[#141416] border border-blue-500/30 dark:border-blue-500/20 rounded-md relative overflow-hidden"
        style={{ 
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          padding: '24px 28px'
        }}
      >
        {/* Left accent stripe */}
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#3b82f6]" />

        {/* Info Icon Badge */}
        <div className="shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
            <Info className="w-4 h-4 text-[#3b82f6]" strokeWidth={2.5} />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#3b82f6] mb-2">
            Pemberitahuan Sistem
          </p>
          <p className="text-[13px] text-neutral-600 dark:text-neutral-400 leading-[1.8] whitespace-pre-line">
            {alertMessage}
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
