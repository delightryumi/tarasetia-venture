import React from 'react';

/**
 * Injected CSS @media print rules for thermal receipt precision.
 * Forces receipt wrapper to fixed top-left, disables font smoothing,
 * and applies high-contrast filters on images.
 */
export default function PrintStyles() {
  return (
    <style>{`
      @media print {
        @page {
          margin: 0 !important;
          size: auto !important;
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: #fff !important;
          visibility: hidden !important;
        }

        .receipt-print-wrapper {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 4mm !important;
          -webkit-font-smoothing: none !important;
          -moz-osx-font-smoothing: none !important;
          text-rendering: optimizeSpeed !important;
          background: #fff !important;
          color: #000 !important;
          box-shadow: none !important;
          border: none !important;
          visibility: visible !important;
        }
        .receipt-print-wrapper * {
          visibility: visible !important;
          color: #000 !important;
          text-shadow: none !important;
          box-shadow: none !important;
        }
        .receipt-print-wrapper img {
          opacity: 1 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `}</style>
  );
}
