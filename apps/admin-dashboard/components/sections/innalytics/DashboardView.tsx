'use client';

import React, { useState } from 'react';
import {
  BarChart2,
  AlignJustify,
  Download,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import styles from './innalytics.module.css';
import { WidgetCard, LegendDef } from './WidgetCard';
import {
  MultiLineChart,
  DualAxisChart,
  DonutChart,
  CHANNEL_COLORS,
  getChannelColor
} from './WidgetCharts';
import { SingleMetricTable, DualMetricTable } from './WidgetTables';
import { FilterDrawer } from './FilterDrawer';
import {
  InnalyticsFilterState,
  useInnalyticsData,
  ALL_CHANNELS
} from './useInnalyticsData';
import { exportToExcel } from './exportHelper';

interface DashboardViewProps {
  activeHotelCode: string;
}

const MONTH_OPTIONS = [
  { value: '2026-09', label: 'September 2026 (Live Audit)' },
  { value: '2026-08', label: 'August 2026' },
  { value: '2026-07', label: 'July 2026' },
  { value: '2026-06', label: 'June 2026' },
  { value: '2026-05', label: 'May 2026' },
  { value: '2026-04', label: 'April 2026' },
  { value: '2026-03', label: 'March 2026' },
  { value: '2026-02', label: 'February 2026' },
  { value: '2026-01', label: 'January 2026' }
];

export const DashboardView: React.FC<DashboardViewProps> = ({ activeHotelCode }) => {
  // Default to CURRENT MONTH (matching PnL at /pnl?module=accounting)
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth(); // 0-indexed
  const lastDayCurMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const defaultStartDate = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-01`;
  const defaultEndDate = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(lastDayCurMonth).padStart(2, '0')}`;
  const defaultMonthStr = `${curYear}-${String(curMonth + 1).padStart(2, '0')}`;

  const [selectedMonth, setSelectedMonth] = useState(defaultMonthStr);

  const [filters, setFilters] = useState<InnalyticsFilterState>({
    reportBy: 'stay_date', // Direct 1:1 alignment with PnL daily revenue audit dates
    filterBy: 'channel',
    selectedChannels: [],
    filterType: 'Monthly',
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    variance: false,
    discardNoData: false
  });

  const [isTableView, setIsTableView] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { loading, lastUpdated, aggregated, filteredEntries } = useInnalyticsData(
    activeHotelCode,
    filters
  );

  const handleMonthChange = (mVal: string) => {
    setSelectedMonth(mVal);
    const [y, m] = mVal.split('-');
    const lDay = new Date(parseInt(y), parseInt(m), 0).getDate();
    const start = `${y}-${m}-01`;
    const end = `${y}-${m}-${String(lDay).padStart(2, '0')}`;
    setFilters((prev) => ({
      ...prev,
      filterType: 'Monthly',
      startDate: start,
      endDate: end
    }));
  };

  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return '';
    const [y, m, d] = dStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const dateRangeText = `${formatDisplayDate(filters.startDate)} - ${formatDisplayDate(filters.endDate)}`;

  // Generate channel legends using dynamic colors
  const channelLegends: LegendDef[] = (
    filters.selectedChannels.length > 0 ? filters.selectedChannels : aggregated.activeChannels
  ).map((ch, idx) => ({
    label: ch,
    color: getChannelColor(ch, idx)
  }));

  const handleExport = () => {
    const exportRows = aggregated.revenueTable.map((r, i) => ({
      Channel: r.channel,
      'Revenue (Rp)': r.value,
      Bookings: aggregated.bookingsTable[i]?.value || 0,
      'Room Nights': aggregated.roomNightsTable[i]?.value || 0,
      'Avg Lead Time (Days)': aggregated.leadTimeTable[i]?.value || 0,
      'Cancellation (%)': aggregated.cancellationTable[i]?.value || 0,
      'ADR (Rp)': aggregated.adrTable[i]?.value || 0
    }));

    exportToExcel(exportRows, `innalytics_summary_${filters.startDate}_to_${filters.endDate}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Dashboard Sub-header / Toolbar */}
      <div className={styles.toolbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#047857',
              backgroundColor: '#ecfdf5',
              padding: '3px 9px',
              borderRadius: '12px',
              border: '1px solid #a7f3d0'
            }}
            title="Directly connected to Accounting PnL revenue ledger"
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            PnL Ledger Synced
          </span>
        </div>

        <div className={styles.toolbarActions}>
          {/* Quick Month Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '6px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#1e293b',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                cursor: 'pointer'
              }}
            >
              {MONTH_OPTIONS.map((mo) => (
                <option key={mo.value} value={mo.value}>
                  {mo.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Toggle: Chart vs Table */}
          <div className={styles.viewToggleGroup}>
            <button
              className={`${styles.viewToggleBtn} ${!isTableView ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setIsTableView(false)}
              title="Chart View"
            >
              <BarChart2 size={16} />
            </button>
            <button
              className={`${styles.viewToggleBtn} ${isTableView ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setIsTableView(true)}
              title="Table View"
            >
              <AlignJustify size={16} />
            </button>
          </div>

          {/* Download / Export Button */}
          <button
            className={styles.actionBtn}
            onClick={handleExport}
            title="Export to Excel"
          >
            <Download size={16} />
          </button>

          {/* Filter Drawer Toggle Button */}
          <button
            className={styles.actionBtn}
            onClick={() => setIsFilterOpen(true)}
            title="Search Filters"
          >
            <SlidersHorizontal size={16} />
          </button>

          {/* Refresh Status Indicator */}
          <button
            className={styles.refreshIndicator}
            onClick={() => setRefreshKey((k) => k + 1)}
            title="Refresh Data"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'PnL Live'}</span>
          </button>
        </div>
      </div>

      {/* 12 Analytics Widgets Grid */}
      <div className={styles.widgetGrid}>
        {/* ROW 1: Revenue, Bookings, Room Nights */}
        <WidgetCard
          title="Revenue"
          dateRangeText={dateRangeText}
          isTableView={isTableView}
          hasData={aggregated.totals.revenue > 0}
          chartComponent={
            <MultiLineChart
              data={aggregated.seriesArray}
              metricPrefix="rev"
              channels={aggregated.activeChannels}
              isCurrency={true}
            />
          }
          tableComponent={
            <SingleMetricTable
              labelCol="Channel"
              valCol="Total ( Rp )"
              data={aggregated.revenueTable}
              isCurrency={true}
              totalLabel="Total"
              totalValue={aggregated.totals.revenue}
            />
          }
          legends={channelLegends}
        />

        <WidgetCard
          title="Bookings"
          dateRangeText={dateRangeText}
          isTableView={isTableView}
          hasData={aggregated.totals.bookings > 0}
          chartComponent={
            <MultiLineChart
              data={aggregated.seriesArray}
              metricPrefix="book"
              channels={aggregated.activeChannels}
            />
          }
          tableComponent={
            <SingleMetricTable
              labelCol="Channel"
              valCol="Bookings"
              data={aggregated.bookingsTable}
              totalLabel="Total"
              totalValue={aggregated.totals.bookings}
            />
          }
          legends={channelLegends}
        />

        <WidgetCard
          title="Room Nights"
          dateRangeText={dateRangeText}
          isTableView={isTableView}
          hasData={aggregated.totals.roomNights > 0}
          chartComponent={
            <MultiLineChart
              data={aggregated.seriesArray}
              metricPrefix="nights"
              channels={aggregated.activeChannels}
            />
          }
          tableComponent={
            <SingleMetricTable
              labelCol="Channel"
              valCol="Room Nights"
              data={aggregated.roomNightsTable}
              totalLabel="Total"
              totalValue={aggregated.totals.roomNights}
            />
          }
          legends={channelLegends}
        />

        {/* ROW 2: Booking Lead Time, Cancellation %, Rate Plan */}
        <WidgetCard
          title="Booking Lead Time"
          dateRangeText={dateRangeText}
          isTableView={isTableView}
          hasData={aggregated.totals.bookings > 0}
          chartComponent={
            <MultiLineChart
              data={aggregated.seriesArray}
              metricPrefix="lead"
              channels={aggregated.activeChannels}
            />
          }
          tableComponent={
            <SingleMetricTable
              labelCol="Channel"
              valCol="Booking Lead Time"
              data={aggregated.leadTimeTable}
              totalLabel="Avg."
              totalValue={aggregated.totals.avgLeadTime}
            />
          }
          legends={channelLegends}
        />

        <WidgetCard
          title="Cancellation %"
          dateRangeText={dateRangeText}
          isTableView={isTableView}
          hasData={aggregated.totals.cancellationRate > 0}
          chartComponent={
            <DonutChart
              data={aggregated.cancellationTable.map((c) => ({
                name: c.channel,
                value: c.value
              }))}
            />
          }
          tableComponent={
            <SingleMetricTable
              labelCol="Channel"
              valCol="Cancellation %"
              data={aggregated.cancellationTable}
              isPercent={true}
              totalLabel="Avg."
              totalValue={aggregated.totals.cancellationRate}
            />
          }
          legends={channelLegends}
        />

        <WidgetCard
          title="Rate Plan"
          dateRangeText={dateRangeText}
          isTableView={isTableView}
          hasData={aggregated.ratePlanTable.length > 0}
          chartComponent={<DualAxisChart data={aggregated.ratePlanTable} />}
          tableComponent={
            <DualMetricTable
              labelCol="Rate Plan"
              data={aggregated.ratePlanTable}
            />
          }
          legends={[
            { label: 'Revenue', color: '#f97316' },
            { label: 'Room Nights', color: '#3b82f6' }
          ]}
        />

        {/* ROW 3: Room Type, Rate Type, Promotion */}
        <WidgetCard
          title="Room Type"
          dateRangeText={dateRangeText}
          isTableView={isTableView}
          hasData={aggregated.roomTypeTable.length > 0}
          chartComponent={<DualAxisChart data={aggregated.roomTypeTable} />}
          tableComponent={
            <DualMetricTable
              labelCol="Room Type"
              data={aggregated.roomTypeTable}
            />
          }
          legends={[
            { label: 'Revenue', color: '#f97316' },
            { label: 'Room Nights', color: '#3b82f6' }
          ]}
        />

        <WidgetCard
          title="Rate Type"
          dateRangeText={dateRangeText}
          isTableView={isTableView}
          hasData={aggregated.rateTypeTable.length > 0}
          chartComponent={<DualAxisChart data={aggregated.rateTypeTable} />}
          tableComponent={
            <DualMetricTable
              labelCol="Rate Type"
              data={aggregated.rateTypeTable}
            />
          }
          legends={[
            { label: 'Revenue', color: '#f97316' },
            { label: 'Room Nights', color: '#3b82f6' }
          ]}
        />

        <WidgetCard
          title="Promotion"
          dateRangeText={dateRangeText}
          isTableView={isTableView}
          hasData={aggregated.promoTable.length > 0}
          chartComponent={<DualAxisChart data={aggregated.promoTable} />}
          tableComponent={
            <DualMetricTable
              labelCol="Promotion"
              data={aggregated.promoTable}
            />
          }
          legends={[
            { label: 'Revenue', color: '#f97316' },
            { label: 'Room Nights', color: '#3b82f6' }
          ]}
        />

        {/* ROW 4: Package, Bookings %, Average Room Rate */}
        <WidgetCard
          title="Package"
          dateRangeText={dateRangeText}
          isTableView={isTableView}
          hasData={aggregated.packageTable.length > 0}
          chartComponent={<DualAxisChart data={aggregated.packageTable} />}
          tableComponent={
            <DualMetricTable
              labelCol="Package"
              data={aggregated.packageTable}
            />
          }
          legends={[
            { label: 'Revenue', color: '#f97316' },
            { label: 'Room Nights', color: '#3b82f6' }
          ]}
        />

        <WidgetCard
          title="Bookings %"
          dateRangeText={dateRangeText}
          isTableView={isTableView}
          hasData={aggregated.totals.bookings > 0}
          chartComponent={
            <DonutChart
              data={aggregated.bookingsPercentTable.map((b) => ({
                name: b.channel,
                value: b.value
              }))}
            />
          }
          tableComponent={
            <SingleMetricTable
              labelCol="Channel"
              valCol="Booking %"
              data={aggregated.bookingsPercentTable}
              isPercent={true}
              totalLabel="Total"
              totalValue={100}
            />
          }
          legends={channelLegends}
        />

        <WidgetCard
          title="Average Room Rate"
          dateRangeText={dateRangeText}
          isTableView={isTableView}
          hasData={aggregated.totals.adr > 0}
          chartComponent={
            <MultiLineChart
              data={aggregated.seriesArray}
              metricPrefix="adr"
              channels={aggregated.activeChannels}
              isCurrency={true}
            />
          }
          tableComponent={
            <SingleMetricTable
              labelCol="Channel"
              valCol="Average Room Rate ( Rp )"
              data={aggregated.adrTable}
              isCurrency={true}
              totalLabel="Total Avg."
              totalValue={aggregated.totals.adr}
            />
          }
          legends={channelLegends}
        />
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
        availableChannels={aggregated.allDiscoveredChannels}
      />
    </div>
  );
};
