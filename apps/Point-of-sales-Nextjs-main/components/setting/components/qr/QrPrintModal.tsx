'use client';
import React, { useState } from 'react';
import { QrLink, QrPrintTemplate } from './types';
import { QrSvg } from './QrSvg';
import { Printer, X, LayoutTemplate, Layers } from 'lucide-react';

interface QrPrintModalProps {
  links: QrLink[];
  storeName?: string;
  storeLogo?: string;
  defaultTemplate?: QrPrintTemplate;
  onClose: () => void;
}

export function QrPrintModal({
  links,
  storeName = 'Resto Setara',
  storeLogo,
  defaultTemplate = 'tent',
  onClose
}: QrPrintModalProps) {
  const [template, setTemplate] = useState<QrPrintTemplate>(defaultTemplate);

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#121214] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[92vh] overflow-hidden my-4 print:m-0 print:p-0 print:border-none print:shadow-none print:max-h-none print:max-w-none print:w-full print:bg-white">
        
        {/* Modal Header (Hidden during actual paper printing) */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#18181b]/50 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <Printer className="text-neutral-700 dark:text-neutral-300" size={20} />
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Pratinjau Cetak QR Meja ({links.length} QR)
              </h3>
              <p className="text-xs text-neutral-500">
                Pilih format template kertas cetak lalu klik Cetak Sekarang.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Template Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Template:</span>
              <select
                value={template}
                onChange={e => setTemplate(e.target.value as QrPrintTemplate)}
                className="h-9 px-3 text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none"
              >
                <option value="tent">Table Tent A6 (Tenda Meja Berdiri)</option>
                <option value="sticker">Stiker 3×3 (9 per lembar A4)</option>
                <option value="sheet">Lembar A4 (6 per lembar 2×3)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleTriggerPrint}
              className="px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Printer size={14} />
              <span>Cetak Sekarang</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Area with Scroll Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-100 dark:bg-neutral-950/60 print:bg-white print:p-0 print:overflow-visible">
          {/* ======================================================== */}
          {/* 1. TABLE TENT A6 TEMPLATE                                 */}
          {/* ======================================================== */}
          {template === 'tent' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 print:p-2">
              {links.map(link => (
                <div
                  key={link.id}
                  className="bg-white text-neutral-900 border-2 border-neutral-800 rounded-2xl p-6 shadow-md flex flex-col items-center justify-between text-center max-w-sm mx-auto w-full aspect-[1/1.414] print:shadow-none print:border-neutral-800 print:break-inside-avoid print:m-0 print:p-4"
                >
                  {/* Top Branding */}
                  <div className="flex flex-col items-center gap-1 w-full border-b border-neutral-200 pb-3">
                    {storeLogo ? (
                      <img src={storeLogo} alt="" className="h-8 object-contain max-w-[120px]" />
                    ) : null}
                    <span className="text-xs font-bold tracking-widest uppercase text-neutral-500">
                      {storeName}
                    </span>
                    <div className="inline-block bg-neutral-900 text-white font-extrabold text-sm px-4 py-1 rounded-full uppercase tracking-wider mt-1">
                      {link.tableName || link.label}
                    </div>
                  </div>

                  {/* QR Core Frame */}
                  <div className="my-auto flex flex-col items-center gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                    <QrSvg value={link.url} size={170} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                      Scan untuk Pesan Menu
                    </span>
                  </div>

                  {/* Guest Instructions */}
                  <div className="w-full pt-3 border-t border-neutral-200 flex flex-col gap-1">
                    <div className="flex items-center justify-around text-[10px] font-semibold text-neutral-600">
                      <span>1. Buka Kamera HP</span>
                      <span>•</span>
                      <span>2. Scan QR Code</span>
                      <span>•</span>
                      <span>3. Pilih &amp; Pesan</span>
                    </div>
                    <span className="text-[9px] text-neutral-400 mt-1">
                      Tidak perlu install aplikasi • Powered by Tara POS
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. STICKER 3x3 TEMPLATE                                  */}
          {/* ======================================================== */}
          {template === 'sticker' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 print:grid-cols-3 print:gap-2 print:p-2">
              {links.map(link => (
                <div
                  key={link.id}
                  className="bg-white text-neutral-900 border-2 border-neutral-800 rounded-xl p-3 shadow-sm flex flex-col items-center justify-between text-center aspect-square print:shadow-none print:break-inside-avoid"
                >
                  <div className="w-full flex items-center justify-between border-b border-neutral-200 pb-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 truncate max-w-[60%]">
                      {storeName}
                    </span>
                    <span className="text-[10px] font-extrabold bg-neutral-900 text-white px-2 py-0.5 rounded">
                      {link.tableName || link.label}
                    </span>
                  </div>

                  <div className="my-auto py-1">
                    <QrSvg value={link.url} size={110} />
                  </div>

                  <div className="w-full pt-1 border-t border-neutral-100 flex items-center justify-center">
                    <span className="text-[9px] font-bold uppercase tracking-tight text-neutral-700">
                      Pesan dari Meja
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. SHEET A4 (2x3) TEMPLATE                               */}
          {/* ======================================================== */}
          {template === 'sheet' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3 print:p-2">
              {links.map(link => (
                <div
                  key={link.id}
                  className="bg-white text-neutral-900 border-2 border-dashed border-neutral-400 rounded-xl p-4 flex items-center gap-4 print:border-neutral-800 print:break-inside-avoid"
                >
                  <div className="shrink-0 p-1 bg-neutral-50 rounded-lg border border-neutral-200">
                    <QrSvg value={link.url} size={120} />
                  </div>

                  <div className="flex-1 flex flex-col justify-center min-w-0 text-left">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      {storeName}
                    </span>
                    <h4 className="text-base font-extrabold text-neutral-900 leading-tight my-1">
                      {link.tableName || link.label}
                    </h4>
                    <p className="text-[11px] text-neutral-600 leading-snug">
                      Pindai QR ini untuk membuka daftar menu dan memesan langsung dari ponsel Anda.
                    </p>
                    <span className="text-[9px] font-bold text-neutral-400 mt-2 uppercase">
                      Pesan Mandiri • Tara POS
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Embedded Print CSS to enforce crisp layout & hide backdrop */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block,
          .print\\:grid,
          .print\\:flex,
          .print\\:bg-white,
          .print\\:m-0,
          .print\\:p-0,
          .print\\:p-2,
          .print\\:gap-2,
          .print\\:gap-3,
          .print\\:gap-4,
          .print\\:grid-cols-2,
          .print\\:grid-cols-3,
          .print\\:border-neutral-800,
          .print\\:break-inside-avoid,
          [class*="fixed"] {
            visibility: visible;
          }
          .fixed {
            position: absolute !important;
            inset: 0 !important;
            background: white !important;
            padding: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
        `
      }} />
    </div>
  );
}
