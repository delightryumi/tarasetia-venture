'use client';

import React from 'react';
import { CalendarRange, SlidersHorizontal, Calculator, Printer } from 'lucide-react';
import s from './PayrollFilterBar.module.css';

interface PayrollFilterBarProps {
  periodMode: 'monthly' | 'custom';
  onModeChange?: (mode: 'monthly' | 'custom') => void;
  onPeriodModeChange?: (mode: 'monthly' | 'custom') => void;
  selectedMonth: string;
  onMonthChange?: (m: string) => void;
  onSelectedMonthChange?: (m: string) => void;
  startDate: string;
  onStartDateChange: (d: string) => void;
  endDate: string;
  onEndDateChange: (d: string) => void;
  periodLabel: string;
  onCalculate: () => void;
  onExportPdf?: () => void;
  loading: boolean;
  generated: boolean;
  disabled?: boolean;
}

export function PayrollFilterBar({
  periodMode,
  onModeChange,
  onPeriodModeChange,
  selectedMonth,
  onMonthChange,
  onSelectedMonthChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  periodLabel,
  onCalculate,
  onExportPdf,
  loading,
  generated,
  disabled,
}: PayrollFilterBarProps) {
  const handleModeChange = onModeChange || onPeriodModeChange || (() => {});
  const handleMonthChange = onMonthChange || onSelectedMonthChange || (() => {});
  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7);

  return (
    <div className={s.filterCard}>
      {/* ── Mode Selection & Action Buttons ── */}
      <div className={s.topRow}>
        <div className={s.modeTabs}>
          <button
            type="button"
            className={`${s.modeTab} ${periodMode === 'monthly' ? s.modeTabActive : ''}`}
            onClick={() => handleModeChange('monthly')}
          >
            <CalendarRange size={14} />
            <span>Bulanan (Monthly)</span>
          </button>
          <button
            type="button"
            className={`${s.modeTab} ${periodMode === 'custom' ? s.modeTabActive : ''}`}
            onClick={() => handleModeChange('custom')}
          >
            <SlidersHorizontal size={14} />
            <span>Rentang Tanggal (Custom)</span>
          </button>
        </div>

        <div className={s.topActions}>
          <button
            type="button"
            className={s.btnCalculate}
            onClick={onCalculate}
            disabled={loading || disabled}
          >
            <Calculator size={15} />
            <span>{loading ? 'Menghitung...' : 'Kalkulasi Payroll'}</span>
          </button>

          {generated && onExportPdf && (
            <button
              type="button"
              className={s.btnExportPdf}
              onClick={onExportPdf}
              title="Cetak & Export Rekapitulasi Penggajian ke PDF"
            >
              <Printer size={15} />
              <span>Export PDF Laporan</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Dynamic Inputs based on active mode ── */}
      <div className={s.controlsRow}>
        <div className={s.controlsGroup}>
          {periodMode === 'monthly' ? (
            <>
              <span className={s.controlLabel}>Pilih Bulan:</span>
              <input
                type="month"
                className={s.dateInput}
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
              />
              <button
                type="button"
                className={s.quickBtn}
                onClick={() => handleMonthChange(currentMonthStr)}
              >
                Bulan Ini
              </button>
            </>
          ) : (
            <>
              <span className={s.controlLabel}>Rentang Penggajian:</span>
              <input
                type="date"
                className={s.dateInput}
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
              />
              <span className={s.rangeSeparator}>s/d</span>
              <input
                type="date"
                className={s.dateInput}
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
              />
            </>
          )}
        </div>

        <div className={s.periodSummary}>
          Periode Aktif:{' '}
          <span className={s.periodHighlight}>{periodLabel}</span>
        </div>
      </div>
    </div>
  );
}

