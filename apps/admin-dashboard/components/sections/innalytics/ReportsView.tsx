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
import { useInnalyticsData, ALL_CHANNELS, formatChannelName } from './useInnalyticsData';
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

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ReportsView: React.FC<ReportsViewProps> = ({ activeHotelCode }) => {
  const { activeHotelName } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [reservationOpen, setReservationOpen] = useState(true);
  const [statisticalOpen, setStatisticalOpen] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportKey>('channelwise_bookings');
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Form Filter State (Default to Current Month)
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

  // Fetch real data from Innalytics data hook
  const {
    filteredEntries,
    cancelledEntries,
    voidEntries,
    aggregated,
    loading
  } = useInnalyticsData(activeHotelCode, {
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

  // Date list helper for performance and revenue analysis
  const dateRangeList = useMemo(() => {
    const dates: string[] = [];
    const cur = new Date(fromDate);
    const end = new Date(toDate);
    while (cur <= end) {
      dates.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }, [fromDate, toDate]);

  // ──────────────────────────────────────────────────────────────────────────
  // 1. ARRIVAL LIST DATA
  // ──────────────────────────────────────────────────────────────────────────
  const arrivalData = useMemo(() => {
    return filteredEntries
      .filter((item) => {
        if (selectedChannel !== 'All' && item.channel !== selectedChannel) return false;
        if (selectedStatus === 'Confirm Booking' && item.isCancelled) return false;
        if (selectedStatus === 'Cancelled' && !item.isCancelled) return false;
        return item.checkInDate >= fromDate && item.checkInDate <= toDate;
      })
      .sort((a, b) => (a.checkInDate > b.checkInDate ? 1 : -1));
  }, [filteredEntries, fromDate, toDate, selectedChannel, selectedStatus]);

  // ──────────────────────────────────────────────────────────────────────────
  // 2. DEPARTURE LIST DATA
  // ──────────────────────────────────────────────────────────────────────────
  const departureData = useMemo(() => {
    return filteredEntries
      .filter((item) => {
        if (selectedChannel !== 'All' && item.channel !== selectedChannel) return false;
        if (selectedStatus === 'Confirm Booking' && item.isCancelled) return false;
        if (selectedStatus === 'Cancelled' && !item.isCancelled) return false;
        return item.checkOutDate >= fromDate && item.checkOutDate <= toDate;
      })
      .sort((a, b) => (a.checkOutDate > b.checkOutDate ? 1 : -1));
  }, [filteredEntries, fromDate, toDate, selectedChannel, selectedStatus]);

  // ──────────────────────────────────────────────────────────────────────────
  // 3. CANCELLED RESERVATION DATA
  // ──────────────────────────────────────────────────────────────────────────
  const cancelledData = useMemo(() => {
    return (cancelledEntries || [])
      .filter((item) => {
        if (selectedChannel !== 'All' && item.channel !== selectedChannel) return false;
        return true;
      })
      .sort((a, b) => (a.cancelledDate > b.cancelledDate ? -1 : 1));
  }, [cancelledEntries, selectedChannel]);

  // ──────────────────────────────────────────────────────────────────────────
  // 4. VOID RESERVATION DATA
  // ──────────────────────────────────────────────────────────────────────────
  const voidData = useMemo(() => {
    return (voidEntries || [])
      .filter((item) => {
        if (selectedChannel !== 'All' && item.channel !== selectedChannel) return false;
        return true;
      })
      .sort((a, b) => (a.voidDate > b.voidDate ? -1 : 1));
  }, [voidEntries, selectedChannel]);

  // ──────────────────────────────────────────────────────────────────────────
  // 5. RESERVATION ACTIVITY LOG DATA
  // ──────────────────────────────────────────────────────────────────────────
  const activityData = useMemo(() => {
    return filteredEntries
      .filter((item) => {
        if (selectedChannel !== 'All' && item.channel !== selectedChannel) return false;
        if (selectedStatus === 'Confirm Booking' && item.isCancelled) return false;
        if (selectedStatus === 'Cancelled' && !item.isCancelled) return false;
        return true;
      })
      .sort((a, b) => (a.bookingDate > b.bookingDate ? -1 : 1));
  }, [filteredEntries, selectedChannel, selectedStatus]);

  // ──────────────────────────────────────────────────────────────────────────
  // 6. COUNTRY WISE STATISTICS DATA
  // ──────────────────────────────────────────────────────────────────────────
  const countryWiseData = useMemo(() => {
    const map: Record<string, {
      country: string;
      reservations: number;
      roomNights: number;
      revenue: number;
      leadSum: number;
      leadCount: number;
    }> = {};

    filteredEntries.forEach((tx) => {
      const c = tx.country || 'Indonesia';
      if (!map[c]) {
        map[c] = { country: c, reservations: 0, roomNights: 0, revenue: 0, leadSum: 0, leadCount: 0 };
      }
      map[c].reservations += 1;
      map[c].roomNights += tx.roomNights;
      map[c].revenue += tx.netRoomAmount;
      map[c].leadSum += tx.leadTime;
      map[c].leadCount += 1;
    });

    const totalRev = Object.values(map).reduce((acc, x) => acc + x.revenue, 0);

    return Object.values(map)
      .map((row) => ({
        country: row.country,
        reservations: row.reservations,
        roomNights: row.roomNights,
        revenue: row.revenue,
        adr: row.roomNights > 0 ? Math.round(row.revenue / row.roomNights) : 0,
        avgLeadTime: row.leadCount > 0 ? Number((row.leadSum / row.leadCount).toFixed(1)) : 0,
        sharePct: totalRev > 0 ? Number(((row.revenue / totalRev) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredEntries]);

  // ──────────────────────────────────────────────────────────────────────────
  // 7. CHANNELWISE BOOKINGS DATA
  // ──────────────────────────────────────────────────────────────────────────
  const channelwiseData = useMemo(() => {
    const map: Record<string, {
      channel: string;
      confirmed: number;
      cancelled: number;
      roomNights: number;
      revenue: number;
      leadSum: number;
      leadCount: number;
    }> = {};

    filteredEntries.forEach((tx) => {
      const ch = tx.channel || 'Direct';
      if (!map[ch]) {
        map[ch] = { channel: ch, confirmed: 0, cancelled: 0, roomNights: 0, revenue: 0, leadSum: 0, leadCount: 0 };
      }
      map[ch].confirmed += 1;
      map[ch].roomNights += tx.roomNights;
      map[ch].revenue += tx.netRoomAmount;
      map[ch].leadSum += tx.leadTime;
      map[ch].leadCount += 1;
    });

    (cancelledEntries || []).forEach((c) => {
      const ch = c.channel || 'Direct';
      if (!map[ch]) {
        map[ch] = { channel: ch, confirmed: 0, cancelled: 0, roomNights: 0, revenue: 0, leadSum: 0, leadCount: 0 };
      }
      map[ch].cancelled += 1;
    });

    const totalRev = Object.values(map).reduce((acc, x) => acc + x.revenue, 0);

    return Object.values(map)
      .map((row) => {
        const totalBookings = row.confirmed + row.cancelled;
        return {
          channel: row.channel,
          totalBookings,
          confirmed: row.confirmed,
          cancelled: row.cancelled,
          roomNights: row.roomNights,
          revenue: row.revenue,
          adr: row.roomNights > 0 ? Math.round(row.revenue / row.roomNights) : 0,
          avgLeadTime: row.leadCount > 0 ? Number((row.leadSum / row.leadCount).toFixed(1)) : 0,
          sharePct: totalRev > 0 ? Number(((row.revenue / totalRev) * 100).toFixed(1)) : 0
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredEntries, cancelledEntries]);

  // ──────────────────────────────────────────────────────────────────────────
  // 8. OTA MONTHLY BREAKDOWN MATRIX
  // ──────────────────────────────────────────────────────────────────────────
  const otaMonthlyData = useMemo(() => {
    const otaList = [
      'Traveloka',
      'Tiket.com',
      'Booking.com',
      'Agoda',
      'Expedia',
      'Airbnb',
      'Trip.com',
      'MG Bedbank',
      'Booking Engine'
    ];

    const map: Record<string, {
      channel: string;
      monthlyNights: number[];
      monthlyRevenue: number[];
      totalNights: number;
      totalRevenue: number;
    }> = {};

    otaList.forEach((ch) => {
      map[ch] = {
        channel: ch,
        monthlyNights: Array(12).fill(0),
        monthlyRevenue: Array(12).fill(0),
        totalNights: 0,
        totalRevenue: 0
      };
    });

    filteredEntries.forEach((tx) => {
      const ch = tx.channel;
      if (map[ch]) {
        const dStr = dateType === 'booked' ? tx.bookingDate : tx.entryDate;
        if (dStr) {
          const mIdx = new Date(dStr).getMonth();
          if (mIdx >= 0 && mIdx < 12) {
            map[ch].monthlyNights[mIdx] += tx.roomNights;
            map[ch].monthlyRevenue[mIdx] += tx.netRoomAmount;
            map[ch].totalNights += tx.roomNights;
            map[ch].totalRevenue += tx.netRoomAmount;
          }
        }
      }
    });

    return Object.values(map)
      .map((row) => ({
        ...row,
        adr: row.totalNights > 0 ? Math.round(row.totalRevenue / row.totalNights) : 0
      }))
      .filter((r) => r.totalNights > 0 || r.totalRevenue > 0);
  }, [filteredEntries, dateType]);

  // ──────────────────────────────────────────────────────────────────────────
  // 9. PERFORMANCE ANALYSIS DATA (DAY BY DAY)
  // ──────────────────────────────────────────────────────────────────────────
  const performanceData = useMemo(() => {
    return dateRangeList.map((d) => {
      const dayObj = new Date(d);
      const dayName = DAY_NAMES[dayObj.getDay()];
      const dayTxs = filteredEntries.filter(
        (tx) => (dateType === 'booked' ? tx.bookingDate === d : tx.entryDate === d)
      );
      const dayCancels = (cancelledEntries || []).filter(
        (c) => (dateType === 'booked' ? c.bookingDate === d : c.entryDate === d)
      );

      let roomNights = 0;
      let roomRevenue = 0;
      let leadSum = 0;
      let leadCount = 0;

      dayTxs.forEach((tx) => {
        roomNights += tx.roomNights;
        roomRevenue += tx.netRoomAmount;
        leadSum += tx.leadTime;
        leadCount += 1;
      });

      const totalBookings = dayTxs.length;
      const adr = roomNights > 0 ? Math.round(roomRevenue / roomNights) : 0;
      const avgLead = leadCount > 0 ? Number((leadSum / leadCount).toFixed(1)) : 0;

      return {
        date: d,
        dayName,
        roomNights,
        totalBookings,
        avgLeadTime: avgLead,
        roomRevenue,
        adr,
        cancelledCount: dayCancels.length
      };
    });
  }, [dateRangeList, filteredEntries, cancelledEntries, dateType]);

  // ──────────────────────────────────────────────────────────────────────────
  // 10. REVENUE ANALYSIS DATA (DAY BY DAY BREAKDOWN)
  // ──────────────────────────────────────────────────────────────────────────
  const revenueAnalysisData = useMemo(() => {
    return dateRangeList.map((d) => {
      const dayTxs = filteredEntries.filter(
        (tx) => (dateType === 'booked' ? tx.bookingDate === d : tx.entryDate === d)
      );

      let netRoomRev = 0;
      let breakfastRev = 0;
      let grossRev = 0;
      let directCash = 0;
      let directCashless = 0;
      let otaSettlement = 0;

      dayTxs.forEach((tx) => {
        netRoomRev += tx.netRoomAmount || 0;
        breakfastRev += tx.breakfastAmount || 0;
        grossRev += (tx.grossAmount || tx.netRoomAmount || 0);

        if (tx.channel === 'Direct Cash') {
          directCash += tx.netRoomAmount;
        } else if (tx.channel === 'Direct Cashless') {
          directCashless += tx.netRoomAmount;
        } else {
          otaSettlement += tx.netRoomAmount;
        }
      });

      const totalDaily = netRoomRev + breakfastRev;

      return {
        date: d,
        netRoomRev,
        breakfastRev,
        grossRev,
        directCash,
        directCashless,
        otaSettlement,
        totalDaily
      };
    });
  }, [dateRangeList, filteredEntries, dateType]);

  // ──────────────────────────────────────────────────────────────────────────
  // 11. SOURCE WISE REVENUE SUMMARY DATA
  // ──────────────────────────────────────────────────────────────────────────
  const sourceSummaryData = useMemo(() => {
    const categories: Record<string, {
      category: string;
      bookings: number;
      roomNights: number;
      revenue: number;
      leadSum: number;
      leadCount: number;
    }> = {
      'Direct Walk-in / Cash': { category: 'Direct Walk-in / Cash', bookings: 0, roomNights: 0, revenue: 0, leadSum: 0, leadCount: 0 },
      'Direct Cashless (Transfer/QRIS/EDC)': { category: 'Direct Cashless (Transfer/QRIS/EDC)', bookings: 0, roomNights: 0, revenue: 0, leadSum: 0, leadCount: 0 },
      'Direct Web / Booking Engine': { category: 'Direct Web / Booking Engine', bookings: 0, roomNights: 0, revenue: 0, leadSum: 0, leadCount: 0 },
      'Online Travel Agent (OTA)': { category: 'Online Travel Agent (OTA)', bookings: 0, roomNights: 0, revenue: 0, leadSum: 0, leadCount: 0 },
      'Corporate / Travel Agent': { category: 'Corporate / Travel Agent', bookings: 0, roomNights: 0, revenue: 0, leadSum: 0, leadCount: 0 }
    };

    filteredEntries.forEach((tx) => {
      let cat = 'Online Travel Agent (OTA)';
      if (tx.channel === 'Direct Cash') {
        cat = 'Direct Walk-in / Cash';
      } else if (tx.channel === 'Direct Cashless') {
        cat = 'Direct Cashless (Transfer/QRIS/EDC)';
      } else if (tx.channel.toLowerCase().includes('booking engine') || tx.channel.toLowerCase().includes('direct web')) {
        cat = 'Direct Web / Booking Engine';
      } else if (tx.travelAgent || tx.channel.toLowerCase().includes('agent') || tx.channel.toLowerCase().includes('bedbank')) {
        cat = 'Corporate / Travel Agent';
      }

      categories[cat].bookings += 1;
      categories[cat].roomNights += tx.roomNights;
      categories[cat].revenue += tx.netRoomAmount;
      categories[cat].leadSum += tx.leadTime;
      categories[cat].leadCount += 1;
    });

    const totalRev = Object.values(categories).reduce((acc, x) => acc + x.revenue, 0);

    return Object.values(categories).map((row) => ({
      category: row.category,
      bookings: row.bookings,
      roomNights: row.roomNights,
      revenue: row.revenue,
      adr: row.roomNights > 0 ? Math.round(row.revenue / row.roomNights) : 0,
      avgLeadTime: row.leadCount > 0 ? Number((row.leadSum / row.leadCount).toFixed(1)) : 0,
      sharePct: totalRev > 0 ? Number(((row.revenue / totalRev) * 100).toFixed(1)) : 0
    }));
  }, [filteredEntries]);

  // ──────────────────────────────────────────────────────────────────────────
  // EXPORT EXCEL & CSV HANDLERS
  // ──────────────────────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    let rows: any[] = [];
    if (selectedReport === 'arrival_list') {
      rows = arrivalData.map((d) => ({
        'Booking ID': d.id,
        'Guest Name': d.guestName,
        'Room': d.roomNumber,
        'Room Type': d.roomType,
        'Rate Plan': d.ratePlan,
        'Channel': d.channel,
        'Check In': d.checkInDate,
        'Check Out': d.checkOutDate,
        'Nights': d.roomNights,
        'Pax': d.pax,
        'Status': d.status,
        'Total Bill (Rp)': d.revenue
      }));
    } else if (selectedReport === 'departure_list') {
      rows = departureData.map((d) => ({
        'Booking ID': d.id,
        'Guest Name': d.guestName,
        'Room': d.roomNumber,
        'Room Type': d.roomType,
        'Channel': d.channel,
        'Check In': d.checkInDate,
        'Check Out': d.checkOutDate,
        'Nights': d.roomNights,
        'Pax': d.pax,
        'Payment Status': d.paymentStatus,
        'Total Revenue (Rp)': d.revenue
      }));
    } else if (selectedReport === 'cancelled_reservation') {
      rows = cancelledData.map((d) => ({
        'Booking ID': d.id,
        'Guest Name': d.guestName,
        'Room': d.roomNumber,
        'Room Type': d.roomType,
        'Channel': d.channel,
        'Booked Date': d.bookingDate,
        'Check In': d.checkInDate,
        'Check Out': d.checkOutDate,
        'Nights': d.roomNights,
        'Cancelled Date': d.cancelledDate,
        'Reason': d.cancellationReason,
        'Status': d.status,
        'Lost Revenue (Rp)': d.revenue
      }));
    } else if (selectedReport === 'void_reservation') {
      rows = voidData.map((d) => ({
        'Voucher / ID': d.id,
        'Guest Name': d.guestName,
        'Room': d.roomNumber,
        'Room Type': d.roomType,
        'Channel': d.channel,
        'Void Date': d.voidDate,
        'Check In': d.checkInDate,
        'Void Reason': d.voidReason,
        'Voided By': d.voidedBy,
        'Amount (Rp)': d.amount
      }));
    } else if (selectedReport === 'country_wise') {
      rows = countryWiseData.map((d) => ({
        'Country': d.country,
        'Reservations': d.reservations,
        'Room Nights': d.roomNights,
        'Revenue (Rp)': d.revenue,
        'ADR (Rp)': d.adr,
        'Avg Lead Time (Days)': d.avgLeadTime,
        'Share (%)': `${d.sharePct}%`
      }));
    } else if (selectedReport === 'channelwise_bookings') {
      rows = channelwiseData.map((d) => ({
        'Channel': d.channel,
        'Total Bookings': d.totalBookings,
        'Confirmed': d.confirmed,
        'Cancelled': d.cancelled,
        'Room Nights': d.roomNights,
        'Revenue (Rp)': d.revenue,
        'ADR (Rp)': d.adr,
        'Avg Lead Time (Days)': d.avgLeadTime,
        'Share (%)': `${d.sharePct}%`
      }));
    } else if (selectedReport === 'ota_monthly') {
      rows = otaMonthlyData.map((d) => ({
        'OTA Channel': d.channel,
        ...MONTH_NAMES.reduce((acc, m, idx) => ({ ...acc, [m]: d.monthlyRevenue[idx] }), {}),
        'Total Nights': d.totalNights,
        'Total Revenue (Rp)': d.totalRevenue,
        'ADR (Rp)': d.adr
      }));
    } else if (selectedReport === 'performance_analysis') {
      rows = performanceData.map((d) => ({
        'Date': d.date,
        'Day': d.dayName,
        'Room Nights Sold': d.roomNights,
        'Total Bookings': d.totalBookings,
        'Avg Lead Time': d.avgLeadTime,
        'Room Revenue (Rp)': d.roomRevenue,
        'ADR (Rp)': d.adr,
        'Cancellations': d.cancelledCount
      }));
    } else if (selectedReport === 'revenue_analysis') {
      rows = revenueAnalysisData.map((d) => ({
        'Date': d.date,
        'Net Room Revenue (Rp)': d.netRoomRev,
        'Breakfast Revenue (Rp)': d.breakfastRev,
        'Gross Room Rev (Rp)': d.grossRev,
        'Direct Cash (Rp)': d.directCash,
        'Direct Cashless (Rp)': d.directCashless,
        'OTA Settlement (Rp)': d.otaSettlement,
        'Total Daily Revenue (Rp)': d.totalDaily
      }));
    } else if (selectedReport === 'source_summary') {
      rows = sourceSummaryData.map((d) => ({
        'Source Category': d.category,
        'Bookings Count': d.bookings,
        'Room Nights': d.roomNights,
        'Total Revenue (Rp)': d.revenue,
        'ADR (Rp)': d.adr,
        'Avg Lead Time (Days)': d.avgLeadTime,
        'Revenue Share (%)': `${d.sharePct}%`
      }));
    } else {
      rows = activityData.map((d) => ({
        'Booking ID': d.id,
        'Guest Name': d.guestName,
        'Booked Date': d.bookingDate,
        'Check In': d.checkInDate,
        'Check Out': d.checkOutDate,
        'Room': d.roomNumber,
        'Room Type': d.roomType,
        'Channel': d.channel,
        'Rate Plan': d.ratePlan,
        'Status': d.status,
        'Revenue (Rp)': d.revenue
      }));
    }

    exportToExcel(rows, `${selectedReport}_${fromDate}_to_${toDate}`);
    setShowSaveDropdown(false);
  };

  const handleExportCSV = () => {
    let rows: any[] = [];
    if (selectedReport === 'arrival_list') {
      rows = arrivalData.map((d) => ({
        'Booking ID': d.id,
        'Guest Name': d.guestName,
        'Room': d.roomNumber,
        'Room Type': d.roomType,
        'Channel': d.channel,
        'Check In': d.checkInDate,
        'Check Out': d.checkOutDate,
        'Nights': d.roomNights,
        'Status': d.status,
        'Revenue (Rp)': d.revenue
      }));
    } else if (selectedReport === 'departure_list') {
      rows = departureData.map((d) => ({
        'Booking ID': d.id,
        'Guest Name': d.guestName,
        'Room': d.roomNumber,
        'Room Type': d.roomType,
        'Channel': d.channel,
        'Check In': d.checkInDate,
        'Check Out': d.checkOutDate,
        'Nights': d.roomNights,
        'Payment Status': d.paymentStatus,
        'Revenue (Rp)': d.revenue
      }));
    } else if (selectedReport === 'channelwise_bookings') {
      rows = channelwiseData.map((d) => ({
        'Channel': d.channel,
        'Bookings': d.totalBookings,
        'Room Nights': d.roomNights,
        'Revenue': d.revenue,
        'ADR': d.adr
      }));
    } else {
      rows = activityData.map((d) => ({
        'Booking ID': d.id,
        'Guest Name': d.guestName,
        'Room': d.roomNumber,
        'Channel': d.channel,
        'Check In': d.checkInDate,
        'Check Out': d.checkOutDate,
        'Status': d.status,
        'Revenue': d.revenue
      }));
    }

    exportToCSV(rows, `${selectedReport}_${fromDate}_to_${toDate}`);
    setShowSaveDropdown(false);
  };

  return (
    <div className={styles.reportsLayout}>
      {/* Explicit Print Rules */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm 12mm !important;
            }
            body {
              background: #ffffff !important;
              color: #000000 !important;
              font-size: 10pt !important;
            }
            header, nav, aside, .dashboard-top-bar, .dashboard-sidebar, .dock-mode-sidebar, .expanded-mode-sidebar, .status-widget-container, .dashboard-footer-clean, .mobile-bottom-nav, .no-print {
              display: none !important;
              visibility: hidden !important;
            }
          }
        `
      }} />

      {/* Left Sidebar */}
      <div className={`${styles.reportsSidebar} no-print`}>
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
        <div className={`${styles.reportsTopTabHeader} no-print`}>
          <div className={styles.activeTabUnderline}>{activeMeta?.title}</div>
        </div>

        {/* Dynamic View: Criteria Form OR Document Viewer */}
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
                        Arrival / Stay Date
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
            <div className={`${styles.viewerToolbar} no-print`}>
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
                    <strong>Date Mode:</strong> {dateType === 'booked' ? 'Booking Date' : 'Stay / Arrival Date'}
                  </span>
                  <span>
                    <strong>From:</strong> {fromDate}
                  </span>
                  <span>
                    <strong>To:</strong> {toDate}
                  </span>
                  <span>
                    <strong>Channel:</strong> {selectedChannel}
                  </span>
                  <span>
                    <strong>Status:</strong> {selectedStatus}
                  </span>
                </div>

                {/* ════════════════════════════════════════════════════════════ */}
                {/* TABLE 1: ARRIVAL LIST                                        */}
                {/* ════════════════════════════════════════════════════════════ */}
                {selectedReport === 'arrival_list' && (
                  <table className={styles.reportDataTable}>
                    <thead>
                      <tr>
                        <th>Booking ID</th>
                        <th>Guest Name</th>
                        <th>Room</th>
                        <th>Room Type</th>
                        <th>Rate Plan</th>
                        <th>Channel</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Nights</th>
                        <th>Pax</th>
                        <th>Status</th>
                        <th className="numCol">Total Bill (Rp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {arrivalData.length === 0 ? (
                        <tr>
                          <td colSpan={12} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                            NO ARRIVAL RECORDS FOUND FOR THE SELECTED PERIOD
                          </td>
                        </tr>
                      ) : (
                        arrivalData.map((row, idx) => (
                          <tr key={`arr_${row.id}_${idx}`}>
                            <td>{row.id}</td>
                            <td>{row.guestName}</td>
                            <td>{row.roomNumber}</td>
                            <td>{row.roomType}</td>
                            <td>{row.ratePlan}</td>
                            <td>{row.channel}</td>
                            <td>{row.checkInDate}</td>
                            <td>{row.checkOutDate}</td>
                            <td>{row.roomNights}</td>
                            <td>{row.pax}</td>
                            <td>{row.status}</td>
                            <td className="numCol">
                              {row.revenue.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                      {arrivalData.length > 0 && (
                        <tr className={styles.subtotalRow}>
                          <td colSpan={6}>
                            <strong>Total Arrivals: {arrivalData.length}</strong>
                          </td>
                          <td colSpan={2}>
                            <strong>Nights: {arrivalData.reduce((acc, r) => acc + r.roomNights, 0)}</strong>
                          </td>
                          <td colSpan={3}>
                            <strong>Pax: {arrivalData.reduce((acc, r) => acc + r.pax, 0)}</strong>
                          </td>
                          <td className="numCol">
                            <strong>
                              Rp {arrivalData.reduce((acc, r) => acc + r.revenue, 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                            </strong>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                {/* ════════════════════════════════════════════════════════════ */}
                {/* TABLE 2: DEPARTURE LIST                                      */}
                {/* ════════════════════════════════════════════════════════════ */}
                {selectedReport === 'departure_list' && (
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
                        <th>Nights</th>
                        <th>Pax</th>
                        <th>Payment Status</th>
                        <th className="numCol">Total Revenue (Rp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departureData.length === 0 ? (
                        <tr>
                          <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                            NO DEPARTURE RECORDS FOUND FOR THE SELECTED PERIOD
                          </td>
                        </tr>
                      ) : (
                        departureData.map((row, idx) => (
                          <tr key={`dep_${row.id}_${idx}`}>
                            <td>{row.id}</td>
                            <td>{row.guestName}</td>
                            <td>{row.roomNumber}</td>
                            <td>{row.roomType}</td>
                            <td>{row.channel}</td>
                            <td>{row.checkInDate}</td>
                            <td>{row.checkOutDate}</td>
                            <td>{row.roomNights}</td>
                            <td>{row.pax}</td>
                            <td>{row.paymentStatus}</td>
                            <td className="numCol">
                              {row.revenue.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                      {departureData.length > 0 && (
                        <tr className={styles.subtotalRow}>
                          <td colSpan={5}>
                            <strong>Total Departures: {departureData.length}</strong>
                          </td>
                          <td colSpan={3}>
                            <strong>Nights: {departureData.reduce((acc, r) => acc + r.roomNights, 0)}</strong>
                          </td>
                          <td colSpan={2}>
                            <strong>Pax: {departureData.reduce((acc, r) => acc + r.pax, 0)}</strong>
                          </td>
                          <td className="numCol">
                            <strong>
                              Rp {departureData.reduce((acc, r) => acc + r.revenue, 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                            </strong>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                {/* ════════════════════════════════════════════════════════════ */}
                {/* TABLE 3: CANCELLED RESERVATION                               */}
                {/* ════════════════════════════════════════════════════════════ */}
                {selectedReport === 'cancelled_reservation' && (
                  <table className={styles.reportDataTable}>
                    <thead>
                      <tr>
                        <th>Booking ID</th>
                        <th>Guest Name</th>
                        <th>Room</th>
                        <th>Room Type</th>
                        <th>Channel</th>
                        <th>Booked Date</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Nights</th>
                        <th>Cancellation Reason</th>
                        <th>Status</th>
                        <th className="numCol">Lost Revenue (Rp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cancelledData.length === 0 ? (
                        <tr>
                          <td colSpan={12} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                            NO CANCELLED RESERVATIONS FOUND FOR THE SELECTED PERIOD
                          </td>
                        </tr>
                      ) : (
                        cancelledData.map((row, idx) => (
                          <tr key={`canc_${row.id}_${idx}`}>
                            <td>{row.id}</td>
                            <td>{row.guestName}</td>
                            <td>{row.roomNumber}</td>
                            <td>{row.roomType}</td>
                            <td>{row.channel}</td>
                            <td>{row.bookingDate}</td>
                            <td>{row.checkInDate}</td>
                            <td>{row.checkOutDate}</td>
                            <td>{row.roomNights}</td>
                            <td>{row.cancellationReason}</td>
                            <td style={{ color: '#dc2626', fontWeight: 600 }}>{row.status}</td>
                            <td className="numCol">
                              {row.revenue.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                      {cancelledData.length > 0 && (
                        <tr className={styles.subtotalRow}>
                          <td colSpan={5}>
                            <strong>Total Cancellations: {cancelledData.length}</strong>
                          </td>
                          <td colSpan={4}>
                            <strong>Lost Nights: {cancelledData.reduce((acc, r) => acc + r.roomNights, 0)}</strong>
                          </td>
                          <td colSpan={2}>
                            <strong>Lost Revenue Total:</strong>
                          </td>
                          <td className="numCol">
                            <strong>
                              Rp {cancelledData.reduce((acc, r) => acc + r.revenue, 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                            </strong>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                {/* ════════════════════════════════════════════════════════════ */}
                {/* TABLE 4: VOID RESERVATION                                    */}
                {/* ════════════════════════════════════════════════════════════ */}
                {selectedReport === 'void_reservation' && (
                  <table className={styles.reportDataTable}>
                    <thead>
                      <tr>
                        <th>Voucher / ID</th>
                        <th>Guest Name</th>
                        <th>Room</th>
                        <th>Room Type</th>
                        <th>Channel</th>
                        <th>Void Date</th>
                        <th>Check In</th>
                        <th>Void Reason</th>
                        <th>Voided By</th>
                        <th className="numCol">Amount (Rp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voidData.length === 0 ? (
                        <tr>
                          <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                            NO VOIDED TRANSACTIONS FOUND FOR THE SELECTED PERIOD
                          </td>
                        </tr>
                      ) : (
                        voidData.map((row, idx) => (
                          <tr key={`void_${row.id}_${idx}`}>
                            <td>{row.id}</td>
                            <td>{row.guestName}</td>
                            <td>{row.roomNumber}</td>
                            <td>{row.roomType}</td>
                            <td>{row.channel}</td>
                            <td>{row.voidDate}</td>
                            <td>{row.checkInDate}</td>
                            <td>{row.voidReason}</td>
                            <td>{row.voidedBy}</td>
                            <td className="numCol">
                              {row.amount.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                      {voidData.length > 0 && (
                        <tr className={styles.subtotalRow}>
                          <td colSpan={5}>
                            <strong>Total Void Items: {voidData.length}</strong>
                          </td>
                          <td colSpan={4}>
                            <strong>Total Voided Value:</strong>
                          </td>
                          <td className="numCol">
                            <strong>
                              Rp {voidData.reduce((acc, r) => acc + r.amount, 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                            </strong>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                {/* ════════════════════════════════════════════════════════════ */}
                {/* TABLE 5: RESERVATION ACTIVITY LOG                           */}
                {/* ════════════════════════════════════════════════════════════ */}
                {selectedReport === 'reservation_activity' && (
                  <table className={styles.reportDataTable}>
                    <thead>
                      <tr>
                        <th>Booking ID</th>
                        <th>Guest Name</th>
                        <th>Booked Date</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Room</th>
                        <th>Room Type</th>
                        <th>Channel</th>
                        <th>Rate Plan</th>
                        <th>Status</th>
                        <th className="numCol">Revenue (Rp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityData.length === 0 ? (
                        <tr>
                          <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                            NO RESERVATION ACTIVITY FOUND FOR THE SELECTED CRITERIA
                          </td>
                        </tr>
                      ) : (
                        activityData.map((row, idx) => (
                          <tr key={`act_${row.id}_${idx}`}>
                            <td>{row.id}</td>
                            <td>{row.guestName}</td>
                            <td>{row.bookingDate}</td>
                            <td>{row.checkInDate}</td>
                            <td>{row.checkOutDate}</td>
                            <td>{row.roomNumber}</td>
                            <td>{row.roomType}</td>
                            <td>{row.channel}</td>
                            <td>{row.ratePlan}</td>
                            <td>{row.status}</td>
                            <td className="numCol">
                              {row.revenue.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                      {activityData.length > 0 && (
                        <tr className={styles.subtotalRow}>
                          <td colSpan={6}>
                            <strong>Total Reservations: {activityData.length}</strong>
                          </td>
                          <td colSpan={4}>
                            <strong>Total Room Nights: {activityData.reduce((acc, r) => acc + r.roomNights, 0)}</strong>
                          </td>
                          <td className="numCol">
                            <strong>
                              Rp {activityData.reduce((acc, r) => acc + r.revenue, 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                            </strong>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                {/* ════════════════════════════════════════════════════════════ */}
                {/* TABLE 6: COUNTRY WISE STATISTICS                             */}
                {/* ════════════════════════════════════════════════════════════ */}
                {selectedReport === 'country_wise' && (
                  <table className={styles.reportDataTable}>
                    <thead>
                      <tr>
                        <th>Country</th>
                        <th className="numCol">Total Reservations</th>
                        <th className="numCol">Room Nights</th>
                        <th className="numCol">Total Revenue (Rp)</th>
                        <th className="numCol">ADR (Rp)</th>
                        <th className="numCol">Avg Lead Time (Days)</th>
                        <th className="numCol">Revenue Share (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {countryWiseData.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                            NO COUNTRY DATA FOUND FOR THE SELECTED PERIOD
                          </td>
                        </tr>
                      ) : (
                        countryWiseData.map((row, idx) => (
                          <tr key={`cnt_${row.country}_${idx}`}>
                            <td><strong>{row.country}</strong></td>
                            <td className="numCol">{row.reservations}</td>
                            <td className="numCol">{row.roomNights}</td>
                            <td className="numCol">{row.revenue.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
                            <td className="numCol">{row.adr.toLocaleString('id-ID')}</td>
                            <td className="numCol">{row.avgLeadTime}</td>
                            <td className="numCol">{row.sharePct}%</td>
                          </tr>
                        ))
                      )}
                      {countryWiseData.length > 0 && (
                        <tr className={styles.subtotalRow}>
                          <td><strong>Total / Summary</strong></td>
                          <td className="numCol"><strong>{countryWiseData.reduce((acc, r) => acc + r.reservations, 0)}</strong></td>
                          <td className="numCol"><strong>{countryWiseData.reduce((acc, r) => acc + r.roomNights, 0)}</strong></td>
                          <td className="numCol">
                            <strong>
                              Rp {countryWiseData.reduce((acc, r) => acc + r.revenue, 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                            </strong>
                          </td>
                          <td className="numCol">
                            <strong>
                              Rp {Math.round(
                                countryWiseData.reduce((acc, r) => acc + r.revenue, 0) /
                                Math.max(1, countryWiseData.reduce((acc, r) => acc + r.roomNights, 0))
                              ).toLocaleString('id-ID')}
                            </strong>
                          </td>
                          <td className="numCol">-</td>
                          <td className="numCol"><strong>100%</strong></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                {/* ════════════════════════════════════════════════════════════ */}
                {/* TABLE 7: CHANNELWISE BOOKINGS REPORT                         */}
                {/* ════════════════════════════════════════════════════════════ */}
                {selectedReport === 'channelwise_bookings' && (
                  <table className={styles.reportDataTable}>
                    <thead>
                      <tr>
                        <th>Channel Name</th>
                        <th className="numCol">Total Bookings</th>
                        <th className="numCol">Confirmed</th>
                        <th className="numCol">Cancelled</th>
                        <th className="numCol">Room Nights</th>
                        <th className="numCol">Total Revenue (Rp)</th>
                        <th className="numCol">ADR (Rp)</th>
                        <th className="numCol">Avg Lead Time</th>
                        <th className="numCol">Share (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {channelwiseData.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                            NO CHANNEL RECORDS FOUND FOR THE SELECTED PERIOD
                          </td>
                        </tr>
                      ) : (
                        channelwiseData.map((row, idx) => (
                          <tr key={`ch_${row.channel}_${idx}`}>
                            <td><strong>{row.channel}</strong></td>
                            <td className="numCol">{row.totalBookings}</td>
                            <td className="numCol">{row.confirmed}</td>
                            <td className="numCol" style={{ color: row.cancelled > 0 ? '#dc2626' : undefined }}>{row.cancelled}</td>
                            <td className="numCol">{row.roomNights}</td>
                            <td className="numCol">{row.revenue.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
                            <td className="numCol">{row.adr.toLocaleString('id-ID')}</td>
                            <td className="numCol">{row.avgLeadTime} d</td>
                            <td className="numCol">{row.sharePct}%</td>
                          </tr>
                        ))
                      )}
                      {channelwiseData.length > 0 && (
                        <tr className={styles.subtotalRow}>
                          <td><strong>Total / Summary</strong></td>
                          <td className="numCol"><strong>{channelwiseData.reduce((acc, r) => acc + r.totalBookings, 0)}</strong></td>
                          <td className="numCol"><strong>{channelwiseData.reduce((acc, r) => acc + r.confirmed, 0)}</strong></td>
                          <td className="numCol"><strong>{channelwiseData.reduce((acc, r) => acc + r.cancelled, 0)}</strong></td>
                          <td className="numCol"><strong>{channelwiseData.reduce((acc, r) => acc + r.roomNights, 0)}</strong></td>
                          <td className="numCol">
                            <strong>
                              Rp {channelwiseData.reduce((acc, r) => acc + r.revenue, 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                            </strong>
                          </td>
                          <td className="numCol">
                            <strong>
                              Rp {Math.round(
                                channelwiseData.reduce((acc, r) => acc + r.revenue, 0) /
                                Math.max(1, channelwiseData.reduce((acc, r) => acc + r.roomNights, 0))
                              ).toLocaleString('id-ID')}
                            </strong>
                          </td>
                          <td className="numCol">-</td>
                          <td className="numCol"><strong>100%</strong></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                {/* ════════════════════════════════════════════════════════════ */}
                {/* TABLE 8: OTA MONTHLY BREAKDOWN MATRIX                        */}
                {/* ════════════════════════════════════════════════════════════ */}
                {selectedReport === 'ota_monthly' && (
                  <table className={styles.reportDataTable}>
                    <thead>
                      <tr>
                        <th>OTA Channel</th>
                        {MONTH_NAMES.map((m) => (
                          <th key={m} className="numCol">{m}</th>
                        ))}
                        <th className="numCol">Total Nights</th>
                        <th className="numCol">Total Revenue (Rp)</th>
                        <th className="numCol">ADR (Rp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {otaMonthlyData.length === 0 ? (
                        <tr>
                          <td colSpan={16} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                            NO OTA MONTHLY DATA FOUND FOR THIS YEAR
                          </td>
                        </tr>
                      ) : (
                        otaMonthlyData.map((row, idx) => (
                          <tr key={`ota_${row.channel}_${idx}`}>
                            <td><strong>{row.channel}</strong></td>
                            {row.monthlyRevenue.map((val, mIdx) => (
                              <td key={`m_${mIdx}`} className="numCol">
                                {val > 0 ? (val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${Math.round(val / 1000)}k`) : '-'}
                              </td>
                            ))}
                            <td className="numCol"><strong>{row.totalNights}</strong></td>
                            <td className="numCol">
                              <strong>Rp {row.totalRevenue.toLocaleString('id-ID')}</strong>
                            </td>
                            <td className="numCol">{row.adr.toLocaleString('id-ID')}</td>
                          </tr>
                        ))
                      )}
                      {otaMonthlyData.length > 0 && (
                        <tr className={styles.subtotalRow}>
                          <td><strong>Monthly Total</strong></td>
                          {MONTH_NAMES.map((_, mIdx) => (
                            <td key={`sum_m_${mIdx}`} className="numCol">
                              <strong>
                                {(() => {
                                  const s = otaMonthlyData.reduce((acc, r) => acc + r.monthlyRevenue[mIdx], 0);
                                  return s > 0 ? (s >= 1000000 ? `${(s / 1000000).toFixed(1)}M` : `${Math.round(s / 1000)}k`) : '-';
                                })()}
                              </strong>
                            </td>
                          ))}
                          <td className="numCol">
                            <strong>{otaMonthlyData.reduce((acc, r) => acc + r.totalNights, 0)}</strong>
                          </td>
                          <td className="numCol">
                            <strong>
                              Rp {otaMonthlyData.reduce((acc, r) => acc + r.totalRevenue, 0).toLocaleString('id-ID')}
                            </strong>
                          </td>
                          <td className="numCol">
                            <strong>
                              Rp {Math.round(
                                otaMonthlyData.reduce((acc, r) => acc + r.totalRevenue, 0) /
                                Math.max(1, otaMonthlyData.reduce((acc, r) => acc + r.totalNights, 0))
                              ).toLocaleString('id-ID')}
                            </strong>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                {/* ════════════════════════════════════════════════════════════ */}
                {/* TABLE 9: PERFORMANCE ANALYSIS REPORT                         */}
                {/* ════════════════════════════════════════════════════════════ */}
                {selectedReport === 'performance_analysis' && (
                  <table className={styles.reportDataTable}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Day</th>
                        <th className="numCol">Rooms Sold (RN)</th>
                        <th className="numCol">Bookings Count</th>
                        <th className="numCol">Avg Lead Time</th>
                        <th className="numCol">Room Revenue (Rp)</th>
                        <th className="numCol">ADR (Rp)</th>
                        <th className="numCol">Cancellations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceData.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                            NO PERFORMANCE DATA FOR THIS RANGE
                          </td>
                        </tr>
                      ) : (
                        performanceData.map((row, idx) => (
                          <tr key={`perf_${row.date}_${idx}`}>
                            <td><strong>{row.date}</strong></td>
                            <td>{row.dayName}</td>
                            <td className="numCol">{row.roomNights}</td>
                            <td className="numCol">{row.totalBookings}</td>
                            <td className="numCol">{row.avgLeadTime} d</td>
                            <td className="numCol">{row.roomRevenue.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
                            <td className="numCol">{row.adr.toLocaleString('id-ID')}</td>
                            <td className="numCol" style={{ color: row.cancelledCount > 0 ? '#dc2626' : undefined }}>
                              {row.cancelledCount}
                            </td>
                          </tr>
                        ))
                      )}
                      {performanceData.length > 0 && (
                        <tr className={styles.subtotalRow}>
                          <td colSpan={2}><strong>Period Total / Average</strong></td>
                          <td className="numCol"><strong>{performanceData.reduce((acc, r) => acc + r.roomNights, 0)}</strong></td>
                          <td className="numCol"><strong>{performanceData.reduce((acc, r) => acc + r.totalBookings, 0)}</strong></td>
                          <td className="numCol">-</td>
                          <td className="numCol">
                            <strong>
                              Rp {performanceData.reduce((acc, r) => acc + r.roomRevenue, 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                            </strong>
                          </td>
                          <td className="numCol">
                            <strong>
                              Rp {Math.round(
                                performanceData.reduce((acc, r) => acc + r.roomRevenue, 0) /
                                Math.max(1, performanceData.reduce((acc, r) => acc + r.roomNights, 0))
                              ).toLocaleString('id-ID')}
                            </strong>
                          </td>
                          <td className="numCol"><strong>{performanceData.reduce((acc, r) => acc + r.cancelledCount, 0)}</strong></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                {/* ════════════════════════════════════════════════════════════ */}
                {/* TABLE 10: REVENUE ANALYSIS REPORT                            */}
                {/* ════════════════════════════════════════════════════════════ */}
                {selectedReport === 'revenue_analysis' && (
                  <table className={styles.reportDataTable}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th className="numCol">Net Room Revenue (Rp)</th>
                        <th className="numCol">Breakfast Allocation (Rp)</th>
                        <th className="numCol">Gross Accommodation (Rp)</th>
                        <th className="numCol">Direct Cash (Rp)</th>
                        <th className="numCol">Direct Cashless (Rp)</th>
                        <th className="numCol">OTA Settlement (Rp)</th>
                        <th className="numCol">Total Daily (Rp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueAnalysisData.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                            NO REVENUE DATA FOR THIS RANGE
                          </td>
                        </tr>
                      ) : (
                        revenueAnalysisData.map((row, idx) => (
                          <tr key={`rev_${row.date}_${idx}`}>
                            <td><strong>{row.date}</strong></td>
                            <td className="numCol">{row.netRoomRev.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
                            <td className="numCol">{row.breakfastRev.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
                            <td className="numCol">{row.grossRev.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
                            <td className="numCol">{row.directCash.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
                            <td className="numCol">{row.directCashless.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
                            <td className="numCol">{row.otaSettlement.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
                            <td className="numCol"><strong>{row.totalDaily.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</strong></td>
                          </tr>
                        ))
                      )}
                      {revenueAnalysisData.length > 0 && (
                        <tr className={styles.subtotalRow}>
                          <td><strong>Period Total</strong></td>
                          <td className="numCol"><strong>Rp {revenueAnalysisData.reduce((acc, r) => acc + r.netRoomRev, 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</strong></td>
                          <td className="numCol"><strong>Rp {revenueAnalysisData.reduce((acc, r) => acc + r.breakfastRev, 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</strong></td>
                          <td className="numCol"><strong>Rp {revenueAnalysisData.reduce((acc, r) => acc + r.grossRev, 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</strong></td>
                          <td className="numCol"><strong>Rp {revenueAnalysisData.reduce((acc, r) => acc + r.directCash, 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</strong></td>
                          <td className="numCol"><strong>Rp {revenueAnalysisData.reduce((acc, r) => acc + r.directCashless, 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</strong></td>
                          <td className="numCol"><strong>Rp {revenueAnalysisData.reduce((acc, r) => acc + r.otaSettlement, 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</strong></td>
                          <td className="numCol"><strong>Rp {revenueAnalysisData.reduce((acc, r) => acc + r.totalDaily, 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</strong></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                {/* ════════════════════════════════════════════════════════════ */}
                {/* TABLE 11: SOURCE WISE REVENUE SUMMARY                        */}
                {/* ════════════════════════════════════════════════════════════ */}
                {selectedReport === 'source_summary' && (
                  <table className={styles.reportDataTable}>
                    <thead>
                      <tr>
                        <th>Source Category</th>
                        <th className="numCol">Bookings Count</th>
                        <th className="numCol">Room Nights</th>
                        <th className="numCol">Total Revenue (Rp)</th>
                        <th className="numCol">ADR (Rp)</th>
                        <th className="numCol">Avg Lead Time</th>
                        <th className="numCol">Revenue Share (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sourceSummaryData.map((row, idx) => (
                        <tr key={`src_${row.category}_${idx}`}>
                          <td><strong>{row.category}</strong></td>
                          <td className="numCol">{row.bookings}</td>
                          <td className="numCol">{row.roomNights}</td>
                          <td className="numCol">{row.revenue.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
                          <td className="numCol">{row.adr.toLocaleString('id-ID')}</td>
                          <td className="numCol">{row.avgLeadTime} d</td>
                          <td className="numCol">{row.sharePct}%</td>
                        </tr>
                      ))}
                      {sourceSummaryData.length > 0 && (
                        <tr className={styles.subtotalRow}>
                          <td><strong>Total / Summary</strong></td>
                          <td className="numCol"><strong>{sourceSummaryData.reduce((acc, r) => acc + r.bookings, 0)}</strong></td>
                          <td className="numCol"><strong>{sourceSummaryData.reduce((acc, r) => acc + r.roomNights, 0)}</strong></td>
                          <td className="numCol">
                            <strong>
                              Rp {sourceSummaryData.reduce((acc, r) => acc + r.revenue, 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                            </strong>
                          </td>
                          <td className="numCol">
                            <strong>
                              Rp {Math.round(
                                sourceSummaryData.reduce((acc, r) => acc + r.revenue, 0) /
                                Math.max(1, sourceSummaryData.reduce((acc, r) => acc + r.roomNights, 0))
                              ).toLocaleString('id-ID')}
                            </strong>
                          </td>
                          <td className="numCol">-</td>
                          <td className="numCol"><strong>100%</strong></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

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
