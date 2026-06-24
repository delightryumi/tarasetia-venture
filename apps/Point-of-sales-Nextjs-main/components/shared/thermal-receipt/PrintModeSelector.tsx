import React from 'react';
import { PrintMode } from './types';

interface PrintModeSelectorProps {
  printMode: PrintMode;
  onChange: (mode: PrintMode) => void;
}

const TABS: { key: PrintMode; label: string }[] = [
  { key: 'all', label: 'Kasir (Full)' },
  { key: 'kitchen', label: 'Dapur (KOT)' },
  { key: 'bar', label: 'Bar (Drink)' },
];

export default function PrintModeSelector({ printMode, onChange }: PrintModeSelectorProps) {
  return (
    <div className="flex gap-1 mb-4 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg print:hidden text-[10px] font-sans">
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-center transition-all border-none cursor-pointer ${
            printMode === key
              ? 'bg-white dark:bg-zinc-700 text-neutral-900 dark:text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white bg-transparent'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
