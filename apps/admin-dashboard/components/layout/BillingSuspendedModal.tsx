'use client';

import React from 'react';
import { LogOut, Mail, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface BillingSuspendedModalProps {
  hotelName: string;
  formattedDueDate: string;
  signOutUser: () => void | Promise<void>;
  alertMessage?: string;
}

export function BillingSuspendedModal({
  hotelName,
  formattedDueDate,
  signOutUser,
  alertMessage,
}: BillingSuspendedModalProps) {
  return (
    <motion.div
      key="billing-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-6 font-sans select-none"
      style={{ background: 'rgba(8, 8, 10, 0.82)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ duration: 0.28, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[500px] bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 rounded-md overflow-hidden relative"
        style={{ boxShadow: '0 40px 80px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05)' }}
      >
        {/* Top Accent Line */}
        <div className="h-[4px] w-full bg-[#aa2d00]" />

        {/* Modal Content - Guaranteed 36px padding via style for clean layout */}
        <div className="flex flex-col" style={{ padding: '36px', gap: '32px' }}>
          
          {/* Header & Icon */}
          <div className="flex flex-col items-center text-center" style={{ gap: '16px' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
              <AlertTriangle className="w-5 h-5 text-[#aa2d00]" strokeWidth={2.5} />
            </div>
            
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">
                Central Reservation System
              </p>
              <h2 className="text-[24px] font-semibold tracking-tight text-neutral-900 dark:text-white leading-tight">
                Layanan Ditangguhkan
              </h2>
            </div>
          </div>

          {/* Description */}
          <div className="text-center">
            <p className="text-[13.5px] leading-[1.8] text-neutral-500 dark:text-neutral-400">
              {alertMessage ? (
                <span className="whitespace-pre-line">{alertMessage}</span>
              ) : (
                <>
                  Akses operasional sistem untuk{' '}
                  <strong className="font-semibold text-neutral-900 dark:text-neutral-200">
                    {hotelName}
                  </strong>{' '}
                  sementara ditangguhkan karena tagihan langganan telah melewati batas waktu pembayaran.
                </>
              )}
            </p>
          </div>

          {/* Table/Info Grid - Responsive Dark/Light colors with explicit padding */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-md overflow-hidden bg-neutral-50/50 dark:bg-neutral-900/20">
            <div className="flex justify-between items-center" style={{ padding: '20px 24px' }}>
              <span className="text-[10px] uppercase font-bold tracking-[0.16em] text-neutral-400 dark:text-neutral-500">
                Batas Jatuh Tempo
              </span>
              <span className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
                {formattedDueDate}
              </span>
            </div>
            
            <div className="h-px bg-neutral-200 dark:bg-neutral-800" style={{ height: '1px' }} />
            
            <div className="flex justify-between items-center" style={{ padding: '20px 24px' }}>
              <span className="text-[10px] uppercase font-bold tracking-[0.16em] text-neutral-400 dark:text-neutral-500">
                Status Akun
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#aa2d00] dark:text-rose-400 bg-[#aa2d00]/10 dark:bg-rose-500/15 px-3 py-1.5 rounded-sm">
                Suspended
              </span>
            </div>
          </div>

          {/* Action Buttons - Safe white text & dark colors */}
          <div className="flex flex-col" style={{ gap: '12px', paddingTop: '8px' }}>
            <a
              href="mailto:nexura.management@gmail.com"
              className="flex items-center justify-center gap-2.5 h-12 w-full rounded-md transition-colors hover:bg-black focus:outline-none"
              style={{
                backgroundColor: '#181d26',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <Mail className="w-4 h-4" style={{ color: '#ffffff' }} />
              <span style={{ color: '#ffffff', fontWeight: 600 }}>Hubungi Administrasi</span>
            </a>
            
            <button
              onClick={() => signOutUser()}
              className="flex items-center justify-center gap-2.5 h-12 w-full border border-neutral-200 dark:border-neutral-800 bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900/40 text-neutral-700 dark:text-neutral-300 text-[13px] font-medium rounded-md transition-all focus:outline-none"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Akun</span>
            </button>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}
