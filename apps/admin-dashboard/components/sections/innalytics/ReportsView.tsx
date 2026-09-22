'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Star,
  ChevronDown,
  ChevronRight,
  Printer,
  Save,
  FileText,
  RotateCcw,
  ArrowLeft,
  Calendar,
  Filter
} from 'lucide-react';
import styles from './innalytics.module.css';
import { useInnalyticsData, ALL_CHANNELS } from './useInnalyticsData';
import { exportToExcel, exportToCSV, triggerPrint } from './exportHelper';
import { useAuth } from '@/context/AuthContext';

interface ReportsViewProps {
  activeHotelCode: string;
}

type ReportKey =
  | 'arrival_list'
  | 'cancelled_reservation'
  | 'country_wise'
  | 'departure_list'
  | 'reservation_activity'
  | 'void_reservation'
  | 'channelwise_bookings'
  | 'ota_monthly'
  | 'performance_analysis'
  | 'revenue_analysis'
  | 'source_summary';

interface ReportMeta {
  key: ReportKey;
  category: 'reservation' | 'statistical';
  title: string;
}

const ALL_REPORTS: ReportMeta[] = [
  // Reservation Reports
  { key: 'arrival_list', category: 'reservation', title: 'Arrival List' },
  { key: 'cancelled_reservation', category: 'reservation', title: 'Cancelled Reservation' },
  { key: 'country_wise', category: 'reservation', title: 'Country Wise Reservation Statistics' },
  { key: 'departure_list', category: 'reservation', title: 'Departure List' },
  { key: 'reservation_activity', category: 'reservation', title: 'Reservation Activity' },
  { key: 'void_reservation', category: 'reservation', title: 'Void Reservation' },
  // Statistical Reports
  { key: 'channelwise_bookings', category: 'statistical', title: 'Channelwise Bookings Report' },
  { key: 'ota_monthly', category: 'statistical', title: 'OTA Wise Monthly Breakdown' },
  { key: 'performance_analysis', category: 'statistical', title: 'Performance Analysis Report' },
  { key: 'revenue_analysis', category: 'statistical', title: 'Revenue Analysis Report' },
  { key: 'source_summary', category: 'statistical', title: 'Source-wise Revenue Summary' }
];

export const ReportsView: React.FC<ReportsViewProps> = ({ activeHotelCode }) => {
  const { activeHotelName } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [reservationOpen, setReservationOpen] = useState(true);
  const [statisticalOpen, setStatisticalOpen] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportKey>('channelwise_bookings');
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Form Filter State (Default to Current Month aligned with PnL)
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();
  const lastDay = new Date(curYear, curMonth + 1, 0).getDate();
  const defaultFromDate = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-01`;
  const defaultToDate = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const [dateType, setDateType] = useState<'booked' | 'arrival'>('booked');
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const [selectedChannel, setSelectedChannel] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);

  // Fetch real data
  const { filteredEntries, aggregated, loading } = useInnalyticsData(activeHotelCode, {
    reportBy: dateType === 'booked' ? 'booking_date' : 'stay_date',
    filterBy: 'channel',
    selectedChannels: selectedChannel === 'All' ? [] : [selectedChannel],
    selectedHotels: [],
    filterType: 'Custom Date Range',
    startDate: fromDate,
    endDate: toDate,
    variance: false,
    discardNoData: false
  });

  const activeMeta = ALL_REPORTS.find((r) => r.key === selectedReport);

  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return ALL_REPORTS;
    return ALL_REPORTS.filter((r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Report generation logic using real records
  const generatedReportData = useMemo(() => {
    return filteredEntries.filter((item) => {
      // Status filter
      if (selectedStatus === 'Confirm Booking' && item.isCancelled) return false;
      if (selectedStatus === 'Cancelled' && !item.isCancelled) return false;

      // Report-specific logic
      if (selectedReport === 'arrival_list') {
        return item.checkInDate >= fromDate && item.checkInDate <= toDate;
      }
      if (selectedReport === 'departure_list') {
        return item.checkOutDate >= fromDate && item.checkOutDate <= toDate;
      }
      if (selectedReport === 'cancelled_reservation') {
        return item.isCancelled;
      }

      return true;
    });
  }, [filteredEntries, selectedReport, selectedStatus, fromDate, toDate]);

  const totalNights = generatedReportData.reduce((acc, r) => {
    let n = 1;
    if (r.checkInDate && r.checkOutDate) {
      const inT = new Date(r.checkInDate).getTime();
      const outT = new Date(r.checkOutDate).getTime();
      n = Math.max(1, Math.round((outT - inT) / (1000 * 60 * 60 * 24)));
    }
    return acc + n;
  }, 0);

  const totalRevenue = generatedReportData.reduce((acc, r) => acc + (r.revenue || 0), 0);

  const handleExportExcel = () => {
    const rows = generatedReportData.map((d) => ({
      'Booking ID': d.id,
      'Guest Name': d.guestName,
      'Room Number': d.roomNumber,
      'Room Type': d.roomType,
      'Rate Plan': d.ratePlan,
      'Channel': d.channel,
      'Booking Date': d.bookingDate,
      'Check-In': d.checkInDate,
      'Check-Out': d.checkOutDate,
      'Status': d.status,
      'Revenue (Rp)': d.revenue
    }));
    exportToExcel(rows, `${selectedReport}_${fromDate}_to_${toDate}`);
    setShowSaveDropdown(false);
  };

  const handleExportCSV = () => {
    const rows = generatedReportData.map((d) => ({
      'Booking ID': d.id,
      'Guest Name': d.guestName,
      'Room Number': d.roomNumber,
      'Room Type': d.roomType,
      'Channel': d.channel,
      'Check-In': d.checkInDate,
      'Check-Out': d.checkOutDate,
      'Status': d.status,
      'Revenue (Rp)': d.revenue
    }));
    exportToCSV(rows, `${selectedReport}_${fromDate}_to_${toDate}`);
    setShowSaveDropdown(false);
  };

  return (
    <div className={styles.reportsLayout}>
      {/* Left Sidebar */}
      <div className={styles.reportsSidebar}>
        {/* Search Header */}
        <div className={styles.sidebarSearchArea}>
          <input
            type="text"
            placeholder="Search report..."
            className={styles.reportSearchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Star size={16} color="#718096" style={{ cursor: 'pointer' }} />
        </div>

        {/* Accordion List */}
        <div className={styles.accordionGroup}>
          {/* Reservation Report Category */}
          <div>
            <div
              className={styles.accordionHeader}
              onClick={() => setReservationOpen(!reservationOpen)}
            >
              <span>Reservation Report</span>
              {reservationOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
            {reservationOpen && (
              <div className={styles.reportList}>
                {filteredReports
                  .filter((r) => r.category === 'reservation')
                  .map((rep) => (
                    <div
                      key={rep.key}
                      className={`${styles.reportListItem} ${selectedReport === rep.key ? styles.reportListItemActive : ''}`}
                      onClick={() => {
                        setSelectedReport(rep.key);
                        setIsViewerOpen(false);
                      }}
                    >
                      <span>• {rep.title}</span>
                      <Star size={12} color="#cbd5e0" />
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Statistical Report Category */}
          <div>
            <div
              className={styles.accordionHeader}
              onClick={() => setStatisticalOpen(!statisticalOpen)}
            >
              <span>Statistical Report</span>
              {statisticalOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
            {statisticalOpen && (
              <div className={styles.reportList}>
                {filteredReports
                  .filter((r) => r.category === 'statistical')
                  .map((rep) => (
                    <div
                      key={rep.key}
                      className={`${styles.reportListItem} ${selectedReport === rep.key ? styles.reportListItemActive : ''}`}
                      onClick={() => {
                        setSelectedReport(rep.key);
                        setIsViewerOpen(false);
                      }}
                    >
                      <span>• {rep.title}</span>
                      <Star size={12} color="#cbd5e0" />
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={styles.reportContentArea}>
        {/* Top Active Tab Header */}
        <div className={styles.reportsTopTabHeader}>
          <div className={styles.activeTabUnderline}>{activeMeta?.title}</div>
        </div>

        {/* Dynamic View: Criteria Form OR Stimulsoft Report Viewer */}
        {!isViewerOpen ? (
          <div className={styles.reportFormContainer}>
            <div className={styles.reportFormCard}>
              <div className={styles.twoColumnGrid}>
                {/* Left Form Column */}
                <div>
                  {/* Date Type Radio */}
                  <div className={styles.formRow}>
                    <label className={styles.formRowLabel}>Date Type</label>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="dateType"
                          checked={dateType === 'booked'}
                          onChange={() => setDateType('booked')}
                        />
                        Booked
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="dateType"
                          checked={dateType === 'arrival'}
                          onChange={() => setDateType('arrival')}
                        />
                        Arrival
                      </label>
                    </div>
                  </div>

                  {/* From & To Date */}
                  <div className={styles.formRow}>
                    <label className={styles.formRowLabel}>From / To</label>
                    <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                      <input
                        type="date"
                        className={styles.selectInput}
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <input
                        type="date"
                        className={styles.selectInput}
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>

                  {/* Channel Dropdown */}
                  <div className={styles.formRow}>
                    <label className={styles.formRowLabel}>
                      Channel <span className={styles.requiredAsterisk}>*</span>
                    </label>
                    <select
                      className={styles.selectInput}
                      value={selectedChannel}
                      onChange={(e) => setSelectedChannel(e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="All">--All Channels--</option>
                      {(aggregated.allDiscoveredChannels?.length ? aggregated.allDiscoveredChannels : ALL_CHANNELS).map((ch) => (
                        <option key={ch} value={ch}>
                          {ch}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Booking Status */}
                  <div className={styles.formRow}>
                    <label className={styles.formRowLabel}>
                      Booking Status <span className={styles.requiredAsterisk}>*</span>
                    </label>
                    <select
                      className={styles.selectInput}
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="All">--All Status--</option>
                      <option value="Confirm Booking">Confirm Booking</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Right Form Column */}
                <div>
                  <div className={styles.formRow}>
                    <label className={styles.formRowLabel}>Show Amount</label>
                    <select className={styles.selectInput} style={{ flex: 1 }}>
                      <option>Rent Per Night</option>
                      <option>Total Gross Amount</option>
                    </select>
                  </div>

                  {/* Remarks Checkbox Group */}
                  <div className={styles.formRow} style={{ alignItems: 'flex-start' }}>
                    <label className={styles.formRowLabel}>Remarks</label>
                    <div className={styles.multiCheckScrollBox} style={{ flex: 1 }}>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" defaultChecked /> Select All
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" defaultChecked /> Check In
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" /> Check Out
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" /> Guest Folio
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" defaultChecked /> House Keeping
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" /> Internal Note
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className={styles.formButtonRow}>
                <button
                  className={styles.reportSubmitBtn}
                  onClick={() => setIsViewerOpen(true)}
                >
                  Report
                </button>
                <button
                  className={styles.reportResetBtn}
                  onClick={() => {
                    setSelectedChannel('All');
                    setSelectedStatus('All');
                    setFromDate(defaultFromDate);
                    setToDate(defaultToDate);
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Stimulsoft Style Interactive Document Viewer */
          <div className={styles.stimulsoftViewer}>
            {/* Viewer Top Toolbar */}
            <div className={styles.viewerToolbar}>
              <button
                className={styles.toolbarToolBtn}
                onClick={() => setIsViewerOpen(false)}
                title="Back to Parameters"
              >
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>

              <div className={styles.toolbarActionGroup}>
                <button className={styles.toolbarToolBtn} onClick={triggerPrint} title="Print">
                  <Printer size={13} />
                  <span>Print</span>
                </button>

                <div style={{ position: 'relative' }}>
                  <button
                    className={styles.toolbarToolBtn}
                    onClick={() => setShowSaveDropdown(!showSaveDropdown)}
                    title="Save Report"
                  >
                    <Save size={13} />
                    <span>Save</span>
                    <ChevronDown size={11} />
                  </button>

                  {showSaveDropdown && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e0',
                        borderRadius: '4px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 70,
                        minWidth: '140px',
                        padding: '4px 0'
                      }}
                    >
                      <div
                        onClick={handleExportExcel}
                        style={{
                          padding: '6px 12px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <FileText size={12} /> Microsoft Excel
                      </div>
                      <div
                        onClick={handleExportCSV}
                        style={{
                          padding: '6px 12px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <FileText size={12} /> CSV Document
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.toolbarActionGroup}>
                <span>Page 1 of 1</span>
              </div>

              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>100%</span>
                <span>Continuous</span>
              </div>
            </div>

            {/* Document Canvas Sheet */}
            <div className={styles.viewerCanvasArea}>
              <div className={styles.paperSheet}>
                {/* Header Letterhead */}
                <div className={styles.reportHeaderSection}>
                  <div className={styles.reportHotelName}>
                    {activeHotelName || 'Titik Damai Nexura Collection'}
                  </div>
                  <div className={styles.reportMainTitle}>{activeMeta?.title}</div>
                </div>

                {/* Criteria Summary Strip */}
                <div className={styles.reportCriteriaSummary}>
                  <span>
                    <strong>Date From:</strong> {fromDate}
                  </span>
                  <span>
                    <strong>To:</strong> {toDate}
                  </span>
                  <span>
                    <strong>Channel:</strong> {selectedChannel}
                  </span>
                  <span>
                    <strong>Booking Status:</strong> {selectedStatus}
                  </span>
                </div>

                {/* Data Table */}
                <table className={styles.reportDataTable}>
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Guest Name</th>
                      <th>Room</th>
                      <th>Room Type</th>
                      <th>Channel</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Status</th>
                      <th className="numCol">Revenue (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedReportData.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                          NO RECORDS FOUND FOR THE SELECTED CRITERIA
                        </td>
                      </tr>
                    ) : (
                      generatedReportData.map((row) => (
                        <tr key={row.id}>
                          <td>{row.id}</td>
                          <td>{row.guestName}</td>
                          <td>{row.roomNumber}</td>
                          <td>{row.roomType}</td>
                          <td>{row.channel}</td>
                          <td>{row.checkInDate}</td>
                          <td>{row.checkOutDate}</td>
                          <td>{row.status}</td>
                          <td className="numCol">
                            {row.revenue.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                    {generatedReportData.length > 0 && (
                      <tr className={styles.subtotalRow}>
                        <td colSpan={5}>
                          <strong>Total Reservations: {generatedReportData.length}</strong>
                        </td>
                        <td colSpan={3}>
                          <strong>Total Room Nights: {totalNights}</strong>
                        </td>
                        <td className="numCol">
                          <strong>
                            Rp {totalRevenue.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                          </strong>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Footer Metadata */}
                <div style={{ marginTop: '30px', fontSize: '10px', color: '#6b7280', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Generated by Tara Inalytics Engine</span>
                  <span>{new Date().toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
