import React from 'react';
import type { Metadata, Viewport } from 'next';
import './self-order.css';

export const viewport: Viewport = {
  themeColor: '#00754A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Order Menu | Self-Order',
  description: 'Guest Self-Ordering System',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Self-Order',
  },
};

export default function SelfOrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="self-order-container w-full min-h-screen bg-sb-canvas text-sb-text">
      {children}
    </div>
  );
}
