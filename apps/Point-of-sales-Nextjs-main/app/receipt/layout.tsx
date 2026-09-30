import React from 'react';
import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#18181b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'e-Struk Pembayaran Digital | My Tara',
  description: 'Tanda bukti pembayaran digital resmi',
};

export default function ReceiptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col items-center justify-start p-3 sm:p-6 font-sans">
      {children}
    </div>
  );
}
