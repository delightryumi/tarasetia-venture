import React from 'react';

/**
 * Injected CSS @media print rules for thermal receipt precision.
 * Forces receipt wrapper to fixed top-left, disables font smoothing,
 * and applies high-contrast filters on images.
 */
export default function PrintStyles({ paperSize = '80mm' }: { paperSize?: '80mm' | '58mm' }) {
  const is58mm = paperSize === '58mm';
  const widthStr = is58mm ? '58mm' : '80mm';

  return (
    <style>{`
      @media print {
        @page {
          margin: 0 !important;
          size: ${widthStr};
          size: ${widthStr} auto !important;
        }

        *, *::before, *::after {
          box-sizing: border-box !important;
        }

        html, body {
          width: ${widthStr} !important;
          min-width: ${widthStr} !important;
          max-width: ${widthStr} !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #fff !important;
          color: #000 !important;
          height: auto !important;
          min-height: 0 !important;
          overflow: visible !important;
          box-sizing: border-box !important;
        }

        body > *:not([data-radix-portal]) {
          display: none !important;
        }

        [data-radix-portal] {
          position: static !important;
          display: block !important;
          width: ${widthStr} !important;
          max-width: ${widthStr} !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
        }

        [role="alertdialog"],
        div[data-state="open"][role="alertdialog"],
        [role="dialog"] {
          position: static !important;
          display: block !important;
          transform: none !important;
          left: 0 !important;
          top: 0 !important;
          width: ${widthStr} !important;
          max-width: ${widthStr} !important;
          height: auto !important;
          max-height: none !important;
          overflow: visible !important;
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
          box-shadow: none !important;
          background: #fff !important;
        }

        [role="alertdialog"] div {
          overflow: visible !important;
          max-height: none !important;
        }

        .receipt-print-wrapper {
          position: relative !important;
          left: 0 !important;
          top: 0 !important;
          width: ${widthStr} !important;
          min-width: ${widthStr} !important;
          max-width: ${widthStr} !important;
          height: auto !important;
          min-height: 0 !important;
          margin: 0 !important;
          padding: ${is58mm ? '2mm 2.5mm 4mm 2.5mm' : '4mm 3.5mm 6mm 3.5mm'} !important;
          box-sizing: border-box !important;
          -webkit-font-smoothing: none !important;
          -moz-osx-font-smoothing: none !important;
          text-rendering: optimizeSpeed !important;
          background: #fff !important;
          color: #000 !important;
          box-shadow: none !important;
          border: none !important;
          visibility: visible !important;
          display: block !important;
          overflow: visible !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          ${is58mm ? 'font-size: 10px !important; line-height: 1.25 !important;' : 'font-size: 12px !important; line-height: 1.35 !important;'}
        }

        .receipt-print-wrapper * {
          visibility: visible !important;
          color: #000 !important;
          background-color: transparent !important;
          text-shadow: none !important;
          box-shadow: none !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .receipt-print-wrapper [style*="border"],
        .receipt-print-wrapper hr {
          border-color: #000 !important;
        }

        .receipt-print-wrapper img {
          opacity: 1 !important;
          background: transparent !important;
          visibility: visible !important;
          display: block !important;
        }

        .print\\:hidden,
        [data-radix-portal] .print\\:hidden {
          display: none !important;
          visibility: hidden !important;
        }
      }
    `}</style>
  );
}
