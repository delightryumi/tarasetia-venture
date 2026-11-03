'use client';

import React from 'react';
import { 
  Calendar, 
  CalendarRange, 
  SlidersHorizontal, 
  Layers, 
  Printer, 
  RotateCcw 
} from 'lucide-react';
import { 
  DateFilterMode, 
  getTodayStr, 
  getCurrentMonthStr, 
  formatPeriodLabel 
} from '@/lib/purchasing/dateHelper';
import s from './PurchasingDateFilterBar.module.css';

interface PurchasingDateFilterBarProps {
  mode: DateFilterMode;
  onModeChange: (mode: DateFilterMode) => void;
  singleDate: string;
  onSingleDateChange: (date: string) => void;
  selectedMonth: string;
  onSelectedMonthChange: (month: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  filteredCount: number;
  totalCount: number;
  onExportPdf: () => void;
  onReset?: () => void;
}

export default function PurchasingDateFilterBar({
  mode,
  onModeChange,
  singleDate,
  onSingleDateChange,
  selectedMonth,
  onSelectedMonthChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  filteredCount,
  totalCount,
  onExportPdf,
  onReset,
}: PurchasingDateFilterBarProps) {
  const activePeriodLabel = formatPeriodLabel(mode, singleDate, selectedMonth, startDate, endDate);

  return (
    <div className={s.filterCard}>
      {/* ── Mode Selection & Action Row ── */}
      <div className={s.topRow}>
        <div className={s.modeTabs}>
          <button
            type="button"
            className={`${s.modeTab} ${mode === 'daily' ? s.modeTabActive : ''}`}
            onClick={() => onModeChange('daily')}
          >
            <Calendar size={14} />
            <span>Harian</span>
          </button>
          <button
            type="button"
            className={`${s.modeTab} ${mode === 'monthly' ? s.modeTabActive : ''}`}
            onClick={() => onModeChange('monthly')}
          >
            <CalendarRange size={14} />
            <span>Bulanan</span>
          </button>
          <button
            type="button"
            className={`${s.modeTab} ${mode === 'custom' ? s.modeTabActive : ''}`}
            onClick={() => onModeChange('custom')}
          >
            <SlidersHorizontal size={14} />
            <span>Custom Date</span>
          </button>
          <button
            type="button"
            className={`${s.modeTab} ${mode === 'all' ? s.modeTabActive : ''}`}
            onClick={() => onModeChange('all')}
          >
            <Layers size={14} />
            <span>Semua Data</span>
          </button>
        </div>

        <div className={s.topActions}>
          <div className={s.recordBadge}>
            <span>{filteredCount}</span>
            <span style={{ fontWeight: 500, color: '#64748b' }}>/ {totalCount} Records</span>
          </div>

          <button
            type="button"
            className={s.generatePdfBtn}
            onClick={onExportPdf}
            title="Generate & Export PDF Laporan"
          >
            <Printer size={15} />
            <span>Export PDF Laporan</span>
          </button>
        </div>
      </div>

      {/* ── Dynamic Inputs Row based on Mode ── */}
      <div className={s.controlsRow}>
        <div className={s.controlsGroup}>
          {mode === 'daily' && (
            <>
              <span className={s.controlLabel}>Pilih Tanggal:</span>
              <input
                type="date"
                className={s.dateInput}
                value={singleDate}
                onChange={(e) => onSingleDateChange(e.target.value)}
              />
              <button
                type="button"
                className={s.quickBtn}
                onClick={() => onSingleDateChange(getTodayStr())}
              >
                Hari Ini
              </button>
            </>
          )}

          {mode === 'monthly' && (
            <>
              <span className={s.controlLabel}>Pilih Bulan:</span>
              <input
                type="month"
                className={s.dateInput}
                value={selectedMonth}
                onChange={(e) => onSelectedMonthChange(e.target.value)}
              />
              <button
                type="button"
                className={s.quickBtn}
                onClick={() => onSelectedMonthChange(getCurrentMonthStr())}
              >
                Bulan Ini
              </button>
            </>
          )}

          {mode === 'custom' && (
            <>
              <span className={s.controlLabel}>Rentang:</span>
              <input
                type="date"
                className={s.dateInput}
                value={startDate}
                placeholder="Dari Tanggal"
                onChange={(e) => onStartDateChange(e.target.value)}
              />
              <span className={s.rangeSeparator}>s/d</span>
              <input
                type="date"
                className={s.dateInput}
                value={endDate}
                placeholder="Sampai Tanggal"
                onChange={(e) => onEndDateChange(e.target.value)}
              />
              {onReset && (
                <button
                  type="button"
                  className={s.quickBtn}
                  onClick={onReset}
                  title="Reset rentang tanggal"
                >
                  <RotateCcw size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Reset
                </button>
              )}
            </>
          )}

          {mode === 'all' && (
            <div className={s.allNotice}>
              <Layers size={14} />
              <span>Menampilkan seluruh riwayat transaksi tanpa filter rentang tanggal.</span>
            </div>
          )}
        </div>

        <div className={s.periodSummary}>
          Periode:{' '}
          <span className={s.periodHighlight}>{activePeriodLabel}</span>
        </div>
      </div>
    </div>
  );
}

