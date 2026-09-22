'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { getHotelCollection } from '@/lib/firestoreHelper';
import { query, where, onSnapshot, getDocs, doc } from 'firebase/firestore';
import { detectBreakfastAllocation } from '@/lib/breakfast-utils';

export interface InnalyticsFilterState {
  reportBy: 'booking_date' | 'stay_date';
  filterBy: 'channel' | 'room_type' | 'rate_plan';
  selectedChannels: string[];
  filterType: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  variance: boolean;
  discardNoData: boolean;
}

export interface ChannelMetric {
  channel: string;
  value: number;
  secondaryValue?: number;
}

export interface TimeSeriesPoint {
  date: string; // MM-DD
  [key: string]: string | number;
}

export interface DistributionMetric {
  name: string;
  roomNights: number;
  revenue: number;
}

export const STANDARD_CHANNELS = [
  'Direct Cashless',
  'Direct Cash',
  'Booking Engine',
  'Traveloka',
  'Tiket.com',
  'Booking.com',
  'Agoda',
  'Expedia',
  'MG Bedbank',
  'Booking Engine (Direct Web)'
];

export const ALL_CHANNELS = STANDARD_CHANNELS;

export const isOtaTx = (t: any) => {
  const ch = (t.channel || t.source || t.otaSource || '').toLowerCase().trim();
  return ch !== '' && !['direct', 'walk-in', 'internal', '-', 'direct / walk-in', 'offline'].includes(ch);
};

export const normalizeChannel = (t: any): string => {
  const rawCh = (t.channel || t.source || t.otaSource || '').trim();
  const chLower = rawCh.toLowerCase();

  // 1. Direct payment methods (Cash vs Cashless) matching PnL revCashHotel & revDirectCashless
  const isDirect = !chLower || ['direct', 'walk-in', 'internal', '-', 'direct / walk-in', 'offline'].includes(chLower);
  if (isDirect) {
    const pm = (t.paymentMethod || '').toLowerCase().trim();
    const isCashOnly = pm === 'cash' || pm === 'tunai' || (Number(t.paidCash || 0) > 0 && !pm.includes('qris') && !pm.includes('transfer') && !pm.includes('bank') && !pm.includes('edc') && !pm.includes('ledger'));
    return isCashOnly ? 'Direct Cash' : 'Direct Cashless';
  }

  // 2. Booking Engine variants
  if (chLower.includes('booking engine') || chLower.includes('direct web')) {
    return rawCh || 'Booking Engine';
  }

  // 3. Specific OTAs (Strict booking.com check to avoid collision with Booking Engine)
  if (chLower.includes('traveloka')) return 'Traveloka';
  if (chLower.includes('tiket')) return 'Tiket.com';
  if (chLower.includes('agoda')) return 'Agoda';
  if (chLower.includes('booking.com') || chLower === 'booking com' || chLower === 'booking') return 'Booking.com';
  if (chLower.includes('expedia')) return 'Expedia';
  if (chLower.includes('airbnb')) return 'Airbnb';
  if (chLower.includes('bedbank') || chLower.includes('mg bedbank')) return 'MG Bedbank';

  return rawCh || 'Other OTA';
};

export function useInnalyticsData(activeHotelCode: string, filters: InnalyticsFilterState) {
  const [loading, setLoading] = useState(true);
  const [cleanTransactions, setCleanTransactions] = useState<any[]>([]);
  const [cancelledTransactions, setCancelledTransactions] = useState<any[]>([]);
  const [ratePlans, setRatePlans] = useState<any[]>([]);
  const [hotelBreakfastRate, setHotelBreakfastRate] = useState<number | undefined>(undefined);
  const [roomTypesMap, setRoomTypesMap] = useState<Record<string, string>>({});
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // 1. Fetch Hotel Settings (Breakfast Rate) and Rate Plans directly aligned with usePnL.ts
  useEffect(() => {
    let codeToUse = activeHotelCode;
    if ((!codeToUse || codeToUse === '0') && typeof window !== 'undefined') {
      const stored = localStorage.getItem('active_hotel_code');
      if (stored && stored !== '0') {
        codeToUse = stored;
      }
    }
    if (!codeToUse || codeToUse === '0') {
      codeToUse = process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE || '14034';
    }

    // Fetch hotel doc for breakfastRate
    const hotelDocRef = doc(db, 'hotels', codeToUse);
    const unsubHotel = onSnapshot(hotelDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const bRate = Number(
          data.settings?.breakfastRate ||
          data.settings?.defaultBreakfastRate ||
          data.breakfastRate
        );
        if (bRate > 0) {
          setHotelBreakfastRate(bRate);
        }
      }
    });

    // Fetch ratePlans
    getDocs(getHotelCollection(db, 'ratePlans', codeToUse))
      .then((snap) => {
        const list: any[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setRatePlans(list);
      })
      .catch((err) => console.warn('Could not fetch ratePlans in Innalytics:', err));

    // Fetch roomTypes
    getDocs(getHotelCollection(db, 'roomTypes', codeToUse))
      .then((snap) => {
        const rtMap: Record<string, string> = {};
        snap.forEach((d) => {
          const dat = d.data();
          rtMap[d.id] = dat.name || d.id;
        });
        setRoomTypesMap(rtMap);
      })
      .catch((err) => console.warn('Could not fetch roomTypes in Innalytics:', err));

    return () => unsubHotel();
  }, [activeHotelCode]);

  // 2. Direct Firestore query from daily_revenue using PnL's exact deduplication & filtering
  useEffect(() => {
    let codeToUse = activeHotelCode;
    if ((!codeToUse || codeToUse === '0') && typeof window !== 'undefined') {
      const stored = localStorage.getItem('active_hotel_code');
      if (stored && stored !== '0') {
        codeToUse = stored;
      }
    }
    if (!codeToUse || codeToUse === '0') {
      codeToUse = process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE || '14034';
    }

    setLoading(true);

    const q = query(
      getHotelCollection(db, 'daily_revenue', codeToUse),
      where('date', '>=', filters.startDate),
      where('date', '<=', filters.endDate)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const allCleanAcc: any[] = [];
        const allCancelled: any[] = [];

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const docDate = data.date || docSnap.id.replace(`${codeToUse}_`, '');
          const hotelId = data.hotelId || codeToUse;

          // Deduplication group exactly as in useFrontOfficeData.ts (PnL)
          const dayAccommodationGroups: Record<string, any[]> = {};
          const dayCancelledGroups: Record<string, any[]> = {};

          (data.entries || []).forEach((t: any) => {
            // Exclude POS orders
            const isPOS =
              t.guestName?.startsWith('POS Order') ||
              Array.isArray(t.posItems) ||
              (t.revenueType && t.revenueType !== 'breakfast');
            if (isPOS) return;

            const status = (t.status || '').toUpperCase();
            const payStatus = (t.paymentStatus || '').toUpperCase();
            const gst = String(t.guestStatus || '').toLowerCase();

            const isDeleted = t.isDeleted || t.isHidden;
            const isVoid =
              status === 'VOID' ||
              status === 'VOIDED' ||
              payStatus === 'VOID' ||
              payStatus === 'VOIDED' ||
              gst === 'void' ||
              t.isVoid === true;

            if (isDeleted || isVoid) return;

            const isPelunasan =
              t.isPelunasan ||
              t.type === 'pelunasan_ar' ||
              t.type === 'pelunasan_reversal' ||
              t.guestName?.startsWith('Koreksi Tanggal Pelunasan') ||
              t.guestName?.startsWith('Pelunasan Piutang');
            if (isPelunasan) return;

            const isCancel =
              status === 'CANCEL' ||
              status === 'CANCELLED' ||
              status === 'NO-SHOW' ||
              payStatus === 'CANCEL' ||
              payStatus === 'CANCELLED' ||
              gst === 'cancelled' ||
              gst === 'cancel';

            const isAcc =
              t.type === 'accommodation' ||
              (!t.type && t.guestName && !t.revenueType);

            if (!isAcc) return;

            const normGuestName = (t.guestName || '').trim().toLowerCase();
            const roomIdent = String(
              t.roomNumber || t.roomTypeId || t.roomType || ''
            ).trim();
            const cIn = t.checkInDate || t.checkIn || '';
            const cOut = t.checkOutDate || t.checkOut || '';
            const bId = t.bookingId ? `b_${t.bookingId}` : '';
            const rIdx = t.roomIndex !== undefined ? `_rIdx_${t.roomIndex}` : '';
            const key =
              normGuestName && cIn
                ? `${normGuestName}_${roomIdent}_${cIn}_${cOut}_${bId}${rIdx}_${t.id || ''}`
                : bId
                ? `${bId}${rIdx}`
                : `t_${t.timestamp}`;

            if (isCancel) {
              if (!dayCancelledGroups[key]) dayCancelledGroups[key] = [];
              dayCancelledGroups[key].push({ ...t, docDate, hotelId });
              return;
            }

            if (!dayAccommodationGroups[key]) {
              dayAccommodationGroups[key] = [];
            }
            dayAccommodationGroups[key].push({ ...t, docDate, hotelId });
          });

          // Deduplicate within the day: pick the latest entry by timestamp
          Object.values(dayAccommodationGroups).forEach((group) => {
            group.sort((a, b) => {
              const tA = new Date(a.timestamp || 0).getTime();
              const tB = new Date(b.timestamp || 0).getTime();
              return tA - tB;
            });
            allCleanAcc.push(group[group.length - 1]);
          });

          Object.values(dayCancelledGroups).forEach((group) => {
            group.sort((a, b) => {
              const tA = new Date(a.timestamp || 0).getTime();
              const tB = new Date(b.timestamp || 0).getTime();
              return tA - tB;
            });
            allCancelled.push(group[group.length - 1]);
          });
        });

        setCleanTransactions(allCleanAcc);
        setCancelledTransactions(allCancelled);
        setLoading(false);
        setLastUpdated(new Date());
      },
      (err) => {
        console.error('Error fetching Innalytics data from daily_revenue:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeHotelCode, filters.startDate, filters.endDate]);

  // 3. Process transactions using PnL's EXACT net room formula & room nights formula
  const processedTransactions = useMemo(() => {
    return cleanTransactions.map((t) => {
      // Net room amount matching PnL's getNetRoomAmount(t)
      const alloc = detectBreakfastAllocation(t, { ratePlans, hotelBreakfastRate });
      const netRoomAmount =
        alloc.hasBreakfast && !alloc.isPreSplit && alloc.breakfastAmount > 0
          ? alloc.netRoomAmount
          : Number(t.amount || 0);

      // Rooms Sold / Room Nights matching PnL's roomsSold formula
      const roomNights = Math.max(
        1,
        Number(t.roomsCount || t.roomCount || t.quantity) || 1
      );

      // Date resolution matching PnL
      const entryDate =
        t.date || t.effectiveDate || t.checkInDate || t.checkIn || t.docDate || '';

      const checkInDate = t.checkInDate || t.checkIn || entryDate;
      const checkOutDate = t.checkOutDate || t.checkOut || checkInDate;
      const bookingDate =
        t.bookingDate || (t.timestamp ? new Date(t.timestamp).toISOString().slice(0, 10) : checkInDate);

      // Booking lead time
      let leadTime = 0;
      if (bookingDate && checkInDate) {
        const bTime = new Date(bookingDate).getTime();
        const cTime = new Date(checkInDate).getTime();
        leadTime = Math.max(0, Math.round((cTime - bTime) / (1000 * 60 * 60 * 24)));
      }

      const channel = normalizeChannel(t);
      const roomTypeName = roomTypesMap[t.roomTypeId] || t.roomType || 'Standard';
      const ratePlanName = t.ratePlanName || t.ratePlan || 'Standard Rate';
      const rateTypeName = t.rateType || (alloc.hasBreakfast ? 'Bed & Breakfast' : 'Room Only');

      return {
        id: t.bookingId || t.id || `${entryDate}_${t.roomNumber}_${t.guestName}`,
        bookingId: t.bookingId || '',
        guestName: t.guestName || 'Guest',
        roomNumber: t.roomNumber || '-',
        roomType: roomTypeName,
        ratePlan: ratePlanName,
        rateType: rateTypeName,
        promotion: t.promotion || t.promoCode || '',
        package: t.package || t.packageName || '',
        channel,
        entryDate,
        docDate: t.docDate,
        bookingDate,
        checkInDate,
        checkOutDate,
        leadTime,
        netRoomAmount,
        revenue: netRoomAmount,
        roomNights,
        isCancelled: false,
        status: t.status || 'Confirmed',
        raw: t
      };
    });
  }, [cleanTransactions, ratePlans, hotelBreakfastRate, roomTypesMap]);

  // 4. Generate all dates in the selected range for time-series charts
  const dateRangeList = useMemo(() => {
    const dates: string[] = [];
    const cur = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    while (cur <= end) {
      dates.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }, [filters.startDate, filters.endDate]);

  // 5. Aggregate 12 Dashboard Widgets metrics (Directly matching PnL totals)
  const aggregated = useMemo(() => {
    // Dynamically discover all active channels from current transactions
    const foundChannels = new Set<string>();
    processedTransactions.forEach((tx) => {
      if (tx.channel) foundChannels.add(tx.channel);
    });

    const priorityOrder = [
      'Direct Cashless',
      'Direct Cash',
      'Booking Engine',
      'Traveloka',
      'Tiket.com',
      'Booking.com',
      'Agoda',
      'Expedia',
      'MG Bedbank',
      'Booking Engine (Direct Web)'
    ];

    const allDiscoveredChannels = Array.from(foundChannels);
    allDiscoveredChannels.sort((a, b) => {
      const idxA = priorityOrder.indexOf(a);
      const idxB = priorityOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    const activeChannels =
      filters.selectedChannels.length > 0
        ? filters.selectedChannels
        : (allDiscoveredChannels.length > 0 ? allDiscoveredChannels : priorityOrder);

    const revMap: Record<string, number> = {};
    const bookMap: Record<string, number> = {};
    const nightsMap: Record<string, number> = {};
    const leadTimeMap: Record<string, { totalDays: number; count: number }> = {};
    const roomTypeMap: Record<string, { nights: number; revenue: number }> = {};
    const ratePlanMap: Record<string, { nights: number; revenue: number }> = {};
    const rateTypeMap: Record<string, { nights: number; revenue: number }> = {};
    const promoMap: Record<string, { nights: number; revenue: number }> = {};
    const packageMap: Record<string, { nights: number; revenue: number }> = {};

    activeChannels.forEach((ch) => {
      revMap[ch] = 0;
      bookMap[ch] = 0;
      nightsMap[ch] = 0;
      leadTimeMap[ch] = { totalDays: 0, count: 0 };
    });

    let totalRevenue = 0;
    let totalRoomNights = 0;

    // Track unique bookings
    const seenBookingIds = new Set<string>();
    let totalUniqueBookings = 0;

    // Timeseries data for charts
    const timeSeriesData: Record<string, TimeSeriesPoint> = {};
    dateRangeList.forEach((d) => {
      const label = d.slice(5); // MM-DD
      const pt: TimeSeriesPoint = { date: label };
      activeChannels.forEach((ch) => {
        pt[`rev_${ch}`] = 0;
        pt[`book_${ch}`] = 0;
        pt[`nights_${ch}`] = 0;
        pt[`lead_${ch}`] = 0;
        pt[`adr_${ch}`] = 0;
      });
      timeSeriesData[d] = pt;
    });

    processedTransactions.forEach((tx) => {
      // Channel filtering support
      if (filters.selectedChannels.length > 0) {
        const matches =
          filters.selectedChannels.includes(tx.channel) ||
          (filters.selectedChannels.includes('Direct / Walk-in') &&
            (tx.channel === 'Direct Cash' || tx.channel === 'Direct Cashless'));
        if (!matches) return;
      }

      const ch = activeChannels.includes(tx.channel)
        ? tx.channel
        : (activeChannels.includes('Direct / Walk-in') &&
           (tx.channel === 'Direct Cash' || tx.channel === 'Direct Cashless'))
        ? 'Direct / Walk-in'
        : tx.channel;

      if (revMap[ch] === undefined) revMap[ch] = 0;
      if (bookMap[ch] === undefined) bookMap[ch] = 0;
      if (nightsMap[ch] === undefined) nightsMap[ch] = 0;
      if (leadTimeMap[ch] === undefined) leadTimeMap[ch] = { totalDays: 0, count: 0 };

      // Aggregate revenue & room nights (exactly matching PnL ledgerRoomRevenue and roomsSold)
      revMap[ch] += tx.netRoomAmount;
      nightsMap[ch] += tx.roomNights;
      totalRevenue += tx.netRoomAmount;
      totalRoomNights += tx.roomNights;

      // Unique booking count
      const bKey = tx.bookingId || `${tx.guestName}_${tx.checkInDate}_${tx.roomNumber}`;
      if (!seenBookingIds.has(bKey)) {
        seenBookingIds.add(bKey);
        bookMap[ch] += 1;
        totalUniqueBookings += 1;
        leadTimeMap[ch].totalDays += tx.leadTime;
        leadTimeMap[ch].count += 1;
      }

      // Room Type
      if (!roomTypeMap[tx.roomType]) roomTypeMap[tx.roomType] = { nights: 0, revenue: 0 };
      roomTypeMap[tx.roomType].nights += tx.roomNights;
      roomTypeMap[tx.roomType].revenue += tx.netRoomAmount;

      // Rate Plan
      if (!ratePlanMap[tx.ratePlan]) ratePlanMap[tx.ratePlan] = { nights: 0, revenue: 0 };
      ratePlanMap[tx.ratePlan].nights += tx.roomNights;
      ratePlanMap[tx.ratePlan].revenue += tx.netRoomAmount;

      // Rate Type
      if (!rateTypeMap[tx.rateType]) rateTypeMap[tx.rateType] = { nights: 0, revenue: 0 };
      rateTypeMap[tx.rateType].nights += tx.roomNights;
      rateTypeMap[tx.rateType].revenue += tx.netRoomAmount;

      // Promotion
      if (tx.promotion) {
        if (!promoMap[tx.promotion]) promoMap[tx.promotion] = { nights: 0, revenue: 0 };
        promoMap[tx.promotion].nights += tx.roomNights;
        promoMap[tx.promotion].revenue += tx.netRoomAmount;
      }

      // Package
      if (tx.package) {
        if (!packageMap[tx.package]) packageMap[tx.package] = { nights: 0, revenue: 0 };
        packageMap[tx.package].nights += tx.roomNights;
        packageMap[tx.package].revenue += tx.netRoomAmount;
      }

      // Timeseries plot
      const targetDate =
        filters.reportBy === 'booking_date' ? tx.bookingDate : tx.entryDate;
      const pt = timeSeriesData[targetDate];
      if (pt) {
        pt[`rev_${ch}`] = Number(pt[`rev_${ch}`] || 0) + tx.netRoomAmount;
        pt[`nights_${ch}`] = Number(pt[`nights_${ch}`] || 0) + tx.roomNights;
        pt[`book_${ch}`] = Number(pt[`book_${ch}`] || 0) + 1;
        pt[`lead_${ch}`] = tx.leadTime;
      }
    });

    // Time-series array
    const seriesArray = dateRangeList.map((d) => timeSeriesData[d]);

    // Compute Cancellation % from cancelled transactions
    const totalCancelledCount = cancelledTransactions.length;
    const totalReservations = totalUniqueBookings + totalCancelledCount;
    const overallCancellationRate =
      totalReservations > 0
        ? Number(((totalCancelledCount / totalReservations) * 100).toFixed(2))
        : 0;

    const cancellationTable: ChannelMetric[] = activeChannels.map((ch) => {
      const chCancelled = cancelledTransactions.filter(
        (c) => normalizeChannel(c) === ch
      ).length;
      const chBooked = bookMap[ch] || 0;
      const chTotal = chBooked + chCancelled;
      const pct = chTotal > 0 ? Number(((chCancelled / chTotal) * 100).toFixed(2)) : 0;
      return { channel: ch, value: pct, secondaryValue: chCancelled };
    });

    // Lead Time Table
    let totalLeadDays = 0;
    let totalLeadCount = 0;
    const leadTimeTable: ChannelMetric[] = activeChannels.map((ch) => {
      const item = leadTimeMap[ch];
      const avg = item.count > 0 ? Number((item.totalDays / item.count).toFixed(2)) : 0;
      totalLeadDays += item.totalDays;
      totalLeadCount += item.count;
      return { channel: ch, value: avg };
    });
    const avgLeadTime =
      totalLeadCount > 0 ? Number((totalLeadDays / totalLeadCount).toFixed(2)) : 0;

    // ADR Table (matching PnL's arr formula: ledgerRoomRevenue / roomsSold)
    const adrTable: ChannelMetric[] = activeChannels.map((ch) => {
      const r = revMap[ch] || 0;
      const n = nightsMap[ch] || 0;
      const adr = n > 0 ? Math.round(r / n) : 0;
      return { channel: ch, value: adr };
    });
    const overallAdr =
      totalRoomNights > 0 ? Math.round(totalRevenue / totalRoomNights) : 0;

    // Bookings % Table
    const bookingsPercentTable: ChannelMetric[] = activeChannels.map((ch) => {
      const count = bookMap[ch] || 0;
      const pct =
        totalUniqueBookings > 0
          ? Number(((count / totalUniqueBookings) * 100).toFixed(1))
          : 0;
      return { channel: ch, value: pct };
    });

    // Revenue, Bookings, Room Nights Tables
    const revenueTable: ChannelMetric[] = activeChannels.map((ch) => ({
      channel: ch,
      value: revMap[ch] || 0
    }));

    const bookingsTable: ChannelMetric[] = activeChannels.map((ch) => ({
      channel: ch,
      value: bookMap[ch] || 0
    }));

    const roomNightsTable: ChannelMetric[] = activeChannels.map((ch) => ({
      channel: ch,
      value: nightsMap[ch] || 0
    }));

    const roomTypeTable: DistributionMetric[] = Object.keys(roomTypeMap).map((rt) => ({
      name: rt,
      roomNights: roomTypeMap[rt].nights,
      revenue: roomTypeMap[rt].revenue
    }));

    const ratePlanTable: DistributionMetric[] = Object.keys(ratePlanMap).map((rp) => ({
      name: rp,
      roomNights: ratePlanMap[rp].nights,
      revenue: ratePlanMap[rp].revenue
    }));

    const rateTypeTable: DistributionMetric[] = Object.keys(rateTypeMap).map((rt) => ({
      name: rt,
      roomNights: rateTypeMap[rt].nights,
      revenue: rateTypeMap[rt].revenue
    }));

    const promoTable: DistributionMetric[] = Object.keys(promoMap).map((pr) => ({
      name: pr,
      roomNights: promoMap[pr].nights,
      revenue: promoMap[pr].revenue
    }));

    const packageTable: DistributionMetric[] = Object.keys(packageMap).map((pkg) => ({
      name: pkg,
      roomNights: packageMap[pkg].nights,
      revenue: packageMap[pkg].revenue
    }));

    return {
      activeChannels,
      seriesArray,
      revenueTable,
      bookingsTable,
      roomNightsTable,
      leadTimeTable,
      cancellationTable,
      bookingsPercentTable,
      adrTable,
      roomTypeTable,
      ratePlanTable,
      rateTypeTable,
      promoTable,
      packageTable,
      allDiscoveredChannels,
      totals: {
        revenue: totalRevenue,       // 100% matches PnL's ledgerRoomRevenue
        bookings: totalUniqueBookings,
        roomNights: totalRoomNights, // 100% matches PnL's roomsSold
        avgLeadTime,
        cancellationRate: overallCancellationRate,
        adr: overallAdr              // 100% matches PnL's arr (ADR)
      }
    };
  }, [
    processedTransactions,
    cancelledTransactions,
    dateRangeList,
    filters.selectedChannels,
    filters.reportBy
  ]);

  return {
    loading,
    lastUpdated,
    filteredEntries: processedTransactions,
    aggregated,
    roomTypesMap,
    ratePlansMap: {}
  };
}
