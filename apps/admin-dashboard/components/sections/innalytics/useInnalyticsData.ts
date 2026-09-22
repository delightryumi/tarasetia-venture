'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { getHotelCollection } from '@/lib/firestoreHelper';
import { query, where, onSnapshot, getDocs, doc } from 'firebase/firestore';
import { detectBreakfastAllocation } from '@/lib/breakfast-utils';

export interface InnalyticsFilterState {
  reportBy: 'booking_date' | 'stay_date';
  filterBy: 'channel' | 'hotel' | 'room_type' | 'rate_plan' | 'country' | 'travel_agent';
  selectedChannels: string[];
  selectedHotels?: string[];
  selectedEntities?: string[];
  filterType: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  variance: boolean;
  dayWise?: boolean;
  discardNoData: boolean;
}

export interface HotelInfo {
  code: string;
  name: string;
}

export const PORTFOLIO_HOTELS: HotelInfo[] = [
  { code: '14034', name: 'Bumi Anyom Resort' },
  { code: '52942', name: 'Tropical Garden Resto' },
  { code: '97456', name: 'jambu klutuk' },
  { code: '1', name: 'Setara Demo Partner' }
];

export const PORTFOLIO_COUNTRIES = [
  'Indonesia',
  'Singapore',
  'Malaysia',
  'Australia',
  'United States',
  'Japan',
  'China',
  'South Korea',
  'United Kingdom',
  'Germany',
  'France',
  'Netherlands'
];

export const DEFAULT_TRAVEL_AGENTS = [
  'MG Holiday',
  'Darmawisata Indonesia',
  'B2B Traveloka',
  'Golden Rama',
  'AntaVaya',
  'Panorama Destination',
  'Voltras Travel'
];

export const PORTFOLIO_TRAVEL_AGENTS = DEFAULT_TRAVEL_AGENTS.map((name) => ({ name }));

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

export const DEFAULT_CHANNELS = [
  'Direct Cashless',
  'Direct Cash',
  'Booking Engine',
  'Traveloka',
  'Tiket.com',
  'Booking.com',
  'Agoda',
  'Expedia',
  'MG Bedbank',
  'Airbnb',
  'Trip.com',
  'Booking Engine (Direct Web)'
];

export const ALL_CHANNELS = DEFAULT_CHANNELS;

export const formatChannelName = (raw: string): string => {
  if (!raw) return '';
  const l = raw.toLowerCase().trim();
  if (l === 'traveloka') return 'Traveloka';
  if (l === 'tiket' || l === 'tiket.com') return 'Tiket.com';
  if (l === 'booking.com' || l === 'booking com' || l === 'booking') return 'Booking.com';
  if (l === 'agoda') return 'Agoda';
  if (l === 'expedia') return 'Expedia';
  if (l === 'airbnb') return 'Airbnb';
  if (l === 'trip.com' || l === 'trip') return 'Trip.com';
  if (l === 'mg' || l === 'mg bedbank' || l === 'bedbank') return 'MG Bedbank';
  if (l === 'open_channel') return 'Open Channel';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

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
  if (chLower.includes('trip.com') || chLower === 'trip') return 'Trip.com';
  if (chLower.includes('bedbank') || chLower.includes('mg bedbank')) return 'MG Bedbank';

  return rawCh || 'Other OTA';
};

export function useInnalyticsData(
  activeHotelCode: string,
  filters: InnalyticsFilterState,
  accessibleHotels?: any[]
) {
  const [loading, setLoading] = useState(true);
  const [cleanTransactions, setCleanTransactions] = useState<any[]>([]);
  const [cancelledTransactions, setCancelledTransactions] = useState<any[]>([]);
  const [voidTransactions, setVoidTransactions] = useState<any[]>([]);
  const [ratePlans, setRatePlans] = useState<any[]>([]);
  const [hotelBreakfastRate, setHotelBreakfastRate] = useState<number | undefined>(undefined);
  const [roomTypesMap, setRoomTypesMap] = useState<Record<string, string>>({});
  const [channelManagerOtas, setChannelManagerOtas] = useState<string[]>([]);
  const [customTravelAgents, setCustomTravelAgents] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // 1. Fetch Hotel Settings (Breakfast Rate, Channel Manager OTAs) and Rate Plans
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

    // Fetch hotel doc for breakfastRate & channelManager.channels
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

        // Channels configured in Channel Manager
        const cmChannels = data.channelManager?.channels || {};
        const otas: string[] = [];
        Object.entries(cmChannels).forEach(([key, c]: [string, any]) => {
          const rawName = c?.channelName || c?.name || c?.title || key;
          const formatted = formatChannelName(rawName);
          if (formatted && (c?.isActive ?? true)) {
            otas.push(formatted);
          }
        });
        if (otas.length > 0) {
          setChannelManagerOtas(otas);
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

    // Fetch registered travel_agents
    getDocs(getHotelCollection(db, 'travel_agents', codeToUse))
      .then((snap) => {
        const list: string[] = [];
        snap.forEach((d) => {
          const dat = d.data();
          if (dat.name && dat.isActive !== false) {
            list.push(dat.name);
          }
        });
        if (list.length > 0) {
          setCustomTravelAgents(list);
        }
      })
      .catch((err) => console.warn('Could not fetch travel_agents in Innalytics:', err));

    return () => unsubHotel();
  }, [activeHotelCode]);

  // 2. Direct Firestore query from daily_revenue using real transactions across accessible hotels
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

    const hotelCodesToQuery: { code: string; name: string }[] = [];
    if (filters.filterBy === 'hotel' && accessibleHotels && accessibleHotels.length > 0) {
      accessibleHotels.forEach((h: any) => {
        const c = String(h.code || h.hotelCode || h.id || '');
        const n = String(h.name || h.hotelName || c);
        if (c && !hotelCodesToQuery.some((x) => x.code === c)) {
          hotelCodesToQuery.push({ code: c, name: n });
        }
      });
    } else {
      const foundName = accessibleHotels?.find(
        (h: any) => String(h.code || h.hotelCode || h.id || '') === codeToUse
      )?.name || '';
      hotelCodesToQuery.push({ code: codeToUse, name: foundName });
    }

    const hotelAccMap: Record<string, any[]> = {};
    const hotelCancMap: Record<string, any[]> = {};
    const hotelVoidMap: Record<string, any[]> = {};

    const unsubs = hotelCodesToQuery.map(({ code: hCode, name: hName }) => {
      // When reportBy is 'booking_date', we must query all daily revenue docs to find bookings made in this period regardless of stay date
      const q = filters.reportBy === 'booking_date'
        ? query(getHotelCollection(db, 'daily_revenue', hCode))
        : query(
            getHotelCollection(db, 'daily_revenue', hCode),
            where('date', '>=', filters.startDate),
            where('date', '<=', filters.endDate)
          );

      return onSnapshot(
        q,
        (querySnapshot) => {
          const hotelClean: any[] = [];
          const hotelCancelled: any[] = [];
          const hotelVoid: any[] = [];

          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const docDate = data.date || docSnap.id.replace(`${hCode}_`, '');
            const hotelId = data.hotelId || hCode;

            const dayAccommodationGroups: Record<string, any[]> = {};
            const dayCancelledGroups: Record<string, any[]> = {};
            const dayVoidGroups: Record<string, any[]> = {};

            (data.entries || []).forEach((t: any) => {
              const isPOS =
                t.guestName?.startsWith('POS Order') ||
                Array.isArray(t.posItems) ||
                (t.revenueType && t.revenueType !== 'breakfast');
              if (isPOS) return;

              const status = (t.status || '').toUpperCase();
              const payStatus = (t.paymentStatus || '').toUpperCase();
              const gst = String(t.guestStatus || '').toLowerCase();

              const isDeleted = t.isDeleted || t.isHidden;
              if (isDeleted) return;

              const isVoid =
                status === 'VOID' ||
                status === 'VOIDED' ||
                payStatus === 'VOID' ||
                payStatus === 'VOIDED' ||
                gst === 'void' ||
                t.isVoid === true;

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

              const enhancedEntry = { ...t, docDate, hotelId, hotelCode: hCode, hotelName: hName };

              if (isVoid) {
                if (!dayVoidGroups[key]) dayVoidGroups[key] = [];
                dayVoidGroups[key].push(enhancedEntry);
                return;
              }

              if (isCancel) {
                if (!dayCancelledGroups[key]) dayCancelledGroups[key] = [];
                dayCancelledGroups[key].push(enhancedEntry);
                return;
              }

              if (!dayAccommodationGroups[key]) {
                dayAccommodationGroups[key] = [];
              }
              dayAccommodationGroups[key].push(enhancedEntry);
            });

            Object.values(dayAccommodationGroups).forEach((group) => {
              group.sort((a, b) => {
                const tA = new Date(a.timestamp || 0).getTime();
                const tB = new Date(b.timestamp || 0).getTime();
                return tA - tB;
              });
              hotelClean.push(group[group.length - 1]);
            });

            Object.values(dayCancelledGroups).forEach((group) => {
              group.sort((a, b) => {
                const tA = new Date(a.timestamp || 0).getTime();
                const tB = new Date(b.timestamp || 0).getTime();
                return tA - tB;
              });
              hotelCancelled.push(group[group.length - 1]);
            });

            Object.values(dayVoidGroups).forEach((group) => {
              group.sort((a, b) => {
                const tA = new Date(a.timestamp || 0).getTime();
                const tB = new Date(b.timestamp || 0).getTime();
                return tA - tB;
              });
              hotelVoid.push(group[group.length - 1]);
            });
          });

          hotelAccMap[hCode] = hotelClean;
          hotelCancMap[hCode] = hotelCancelled;
          hotelVoidMap[hCode] = hotelVoid;

          const mergedAcc: any[] = [];
          const mergedCanc: any[] = [];
          const mergedVoid: any[] = [];
          Object.values(hotelAccMap).forEach((list) => mergedAcc.push(...list));
          Object.values(hotelCancMap).forEach((list) => mergedCanc.push(...list));
          Object.values(hotelVoidMap).forEach((list) => mergedVoid.push(...list));

          setCleanTransactions(mergedAcc);
          setCancelledTransactions(mergedCanc);
          setVoidTransactions(mergedVoid);
          setLoading(false);
          setLastUpdated(new Date());
        },
        (err) => {
          console.error(`Error fetching daily_revenue for hotel ${hCode}:`, err);
          setLoading(false);
        }
      );
    });

    return () => unsubs.forEach((unsub) => unsub());
  }, [activeHotelCode, filters.startDate, filters.endDate, filters.reportBy, filters.filterBy, accessibleHotels]);

  // 3. Process transactions using PnL's EXACT net room formula & room nights formula
  const processedTransactions = useMemo(() => {
    return cleanTransactions
      .map((t) => {
        const alloc = detectBreakfastAllocation(t, { ratePlans, hotelBreakfastRate });
        const netRoomAmount =
          alloc.hasBreakfast && !alloc.isPreSplit && alloc.breakfastAmount > 0
            ? alloc.netRoomAmount
            : Number(t.amount || 0);

        const roomNights = Math.max(
          1,
          Number(t.roomsCount || t.roomCount || t.quantity) || 1
        );

        const checkInDate = String(t.checkInDate || t.checkIn || t.docDate || t.date || '').slice(0, 10);
        const checkOutDate = String(t.checkOutDate || t.checkOut || checkInDate).slice(0, 10);
        const entryDate = String(t.date || t.effectiveDate || t.docDate || checkInDate).slice(0, 10);

        // Booking Date: Extracted from input/creation timestamp or booking date
        let bookingDate = '';
        if (t.bookingDate) {
          bookingDate = String(t.bookingDate).slice(0, 10);
        } else if (t.bookedAt) {
          bookingDate = String(t.bookedAt).slice(0, 10);
        } else if (t.createdAt) {
          bookingDate = typeof t.createdAt === 'string'
            ? t.createdAt.slice(0, 10)
            : new Date(t.createdAt).toISOString().slice(0, 10);
        } else if (t.channexRaw?.inserted_at || t.channexRaw?.created_at) {
          bookingDate = String(t.channexRaw.inserted_at || t.channexRaw.created_at).slice(0, 10);
        } else if (t.timestamp) {
          bookingDate = typeof t.timestamp === 'string'
            ? t.timestamp.slice(0, 10)
            : new Date(t.timestamp).toISOString().slice(0, 10);
        } else {
          bookingDate = checkInDate;
        }

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

        const travelAgent = (
          t.travelAgent ||
          t.travelAgentName ||
          t.agentName ||
          t.agent ||
          (t.channelType === 'travel_agent' ? t.channel : '') ||
          ''
        ).trim();

        const country = (
          t.country ||
          t.guestCountry ||
          t.nationality ||
          'Indonesia'
        ).trim();

        const pax = Math.max(1, Number(t.pax || t.adults || t.guestCount || 1));
        const breakfastAmount = alloc.breakfastAmount || 0;
        const grossAmount = Number(t.grossAmount || t.amount || 0);
        const paymentMethod = t.paymentMethod || 'Direct';
        const paymentStatus = t.paymentStatus || 'Paid';
        const notes = t.remarks || t.notes || t.specialRequest || '';
        const createdBy = t.userName || t.createdBy || t.cashier || 'Front Desk';

        return {
          id: t.bookingId || t.id || `${entryDate}_${t.roomNumber}_${t.guestName}`,
          bookingId: t.bookingId || '',
          hotelCode: t.hotelCode || t.hotelId || activeHotelCode,
          hotelName: t.hotelName || '',
          guestName: t.guestName || 'Guest',
          roomNumber: t.roomNumber || '-',
          roomType: roomTypeName,
          ratePlan: ratePlanName,
          rateType: rateTypeName,
          promotion: t.promotion || t.promoCode || '',
          package: t.package || t.packageName || '',
          channel,
          travelAgent,
          country,
          entryDate,
          docDate: t.docDate,
          bookingDate,
          checkInDate,
          checkOutDate,
          leadTime,
          netRoomAmount,
          breakfastAmount,
          grossAmount,
          revenue: netRoomAmount,
          roomNights,
          pax,
          paymentMethod,
          paymentStatus,
          notes,
          createdBy,
          isCancelled: false,
          isVoid: false,
          status: t.status || 'Confirmed',
          raw: t
        };
      })
      .filter((tx) => {
        // Correct separation: booking_date uses bookingDate; stay_date uses entryDate (stay/audit night)
        const targetDate = filters.reportBy === 'booking_date' ? tx.bookingDate : tx.entryDate;
        return targetDate >= filters.startDate && targetDate <= filters.endDate;
      });
  }, [cleanTransactions, ratePlans, hotelBreakfastRate, roomTypesMap, activeHotelCode, filters.reportBy, filters.startDate, filters.endDate]);

  // Cancelled transactions filtered by period mode (booking_date vs stay_date)
  const processedCancelledTransactions = useMemo(() => {
    return cancelledTransactions
      .map((t) => {
        const checkInDate = String(t.checkInDate || t.checkIn || t.docDate || t.date || '').slice(0, 10);
        const checkOutDate = String(t.checkOutDate || t.checkOut || checkInDate).slice(0, 10);
        const entryDate = String(t.date || t.effectiveDate || t.docDate || checkInDate).slice(0, 10);

        let bookingDate = '';
        if (t.bookingDate) bookingDate = String(t.bookingDate).slice(0, 10);
        else if (t.bookedAt) bookingDate = String(t.bookedAt).slice(0, 10);
        else if (t.createdAt) bookingDate = typeof t.createdAt === 'string' ? t.createdAt.slice(0, 10) : new Date(t.createdAt).toISOString().slice(0, 10);
        else if (t.channexRaw?.inserted_at || t.channexRaw?.created_at) bookingDate = String(t.channexRaw.inserted_at || t.channexRaw.created_at).slice(0, 10);
        else if (t.timestamp) bookingDate = typeof t.timestamp === 'string' ? t.timestamp.slice(0, 10) : new Date(t.timestamp).toISOString().slice(0, 10);
        else bookingDate = checkInDate;

        const roomTypeName = roomTypesMap[t.roomTypeId] || t.roomType || 'Standard';
        const channel = normalizeChannel(t);
        const roomNights = Math.max(1, Number(t.roomsCount || t.roomCount || t.quantity) || 1);
        const lostRevenue = Number(t.amount || t.rate || 0);
        const cancelledDate = String(t.cancelledAt || t.cancelledDate || t.docDate || entryDate).slice(0, 10);
        const cancellationReason = t.cancellationReason || t.cancelReason || t.remarks || 'Guest Cancellation';

        return {
          id: t.bookingId || t.id || `${entryDate}_${t.roomNumber}_${t.guestName}`,
          bookingId: t.bookingId || '',
          hotelCode: t.hotelCode || t.hotelId || activeHotelCode,
          hotelName: t.hotelName || '',
          guestName: t.guestName || 'Guest',
          roomNumber: t.roomNumber || '-',
          roomType: roomTypeName,
          channel,
          travelAgent: (t.travelAgent || t.agentName || '').trim(),
          country: (t.country || t.guestCountry || 'Indonesia').trim(),
          bookingDate,
          entryDate,
          checkInDate,
          checkOutDate,
          cancelledDate,
          cancellationReason,
          roomNights,
          revenue: lostRevenue,
          netRoomAmount: lostRevenue,
          isCancelled: true,
          isVoid: false,
          status: t.status || 'Cancelled',
          raw: t
        };
      })
      .filter((c) => {
        const targetDate = filters.reportBy === 'booking_date' ? c.bookingDate : c.entryDate;
        return targetDate >= filters.startDate && targetDate <= filters.endDate;
      });
  }, [cancelledTransactions, roomTypesMap, activeHotelCode, filters.reportBy, filters.startDate, filters.endDate]);

  // Void transactions filtered by period mode (booking_date vs stay_date)
  const processedVoidTransactions = useMemo(() => {
    return voidTransactions
      .map((t) => {
        const checkInDate = String(t.checkInDate || t.checkIn || t.docDate || t.date || '').slice(0, 10);
        const checkOutDate = String(t.checkOutDate || t.checkOut || checkInDate).slice(0, 10);
        const entryDate = String(t.date || t.effectiveDate || t.docDate || checkInDate).slice(0, 10);
        const voidDate = String(t.voidedAt || t.voidDate || entryDate).slice(0, 10);
        const channel = normalizeChannel(t);
        const roomTypeName = roomTypesMap[t.roomTypeId] || t.roomType || 'Standard';
        const voidAmount = Number(t.amount || t.revenue || 0);
        const voidReason = t.voidReason || t.reason || t.remarks || 'Voided by Front Office';
        const voidedBy = t.voidedBy || t.cashier || t.userName || 'Front Desk';

        return {
          id: t.bookingId || t.id || `${entryDate}_${t.roomNumber || 'void'}_${t.guestName || 'guest'}`,
          bookingId: t.bookingId || '',
          hotelCode: t.hotelCode || t.hotelId || activeHotelCode,
          hotelName: t.hotelName || '',
          guestName: t.guestName || 'Guest',
          roomNumber: t.roomNumber || '-',
          roomType: roomTypeName,
          channel,
          amount: voidAmount,
          revenue: voidAmount,
          voidReason,
          voidDate,
          voidedBy,
          entryDate,
          checkInDate,
          checkOutDate,
          isVoid: true,
          isCancelled: false,
          status: 'Voided',
          raw: t
        };
      })
      .filter((v) => {
        const targetDate = filters.reportBy === 'booking_date' ? (v.bookingDate || v.voidDate) : v.entryDate;
        return targetDate >= filters.startDate && targetDate <= filters.endDate;
      });
  }, [voidTransactions, roomTypesMap, activeHotelCode, filters.reportBy, filters.startDate, filters.endDate]);

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

  // Discovered channels and travel agents from actual transactions
  const discoveredChannels = useMemo(() => {
    const s = new Set<string>();
    processedTransactions.forEach((tx) => {
      if (tx.channel) s.add(tx.channel);
    });
    return Array.from(s);
  }, [processedTransactions]);

  const discoveredTravelAgents = useMemo(() => {
    const s = new Set<string>();
    processedTransactions.forEach((tx) => {
      if (tx.travelAgent) s.add(tx.travelAgent);
    });
    return Array.from(s);
  }, [processedTransactions]);

  // 5. Dynamic Channels: Default registered channels + Channel Manager setting + discovered channels
  const dynamicChannels = useMemo(() => {
    return Array.from(
      new Set([
        ...DEFAULT_CHANNELS,
        ...channelManagerOtas,
        ...discoveredChannels
      ])
    );
  }, [channelManagerOtas, discoveredChannels]);

  // 6. Dynamic Travel Agents: Default + Firestore collection + discovered in transactions
  const dynamicTravelAgents = useMemo(() => {
    return Array.from(
      new Set([
        ...DEFAULT_TRAVEL_AGENTS,
        ...customTravelAgents,
        ...discoveredTravelAgents
      ])
    );
  }, [customTravelAgents, discoveredTravelAgents]);

  // 7. Aggregate 12 Dashboard Widgets metrics purely from genuine transactions (0 dummy data)
  const aggregated = useMemo(() => {
    const roomTypeMap: Record<string, { nights: number; revenue: number }> = {};
    const ratePlanMap: Record<string, { nights: number; revenue: number }> = {};
    const rateTypeMap: Record<string, { nights: number; revenue: number }> = {};
    const promoMap: Record<string, { nights: number; revenue: number }> = {};
    const packageMap: Record<string, { nights: number; revenue: number }> = {};

    let totalRevenue = 0;
    let totalRoomNights = 0;
    const seenBookingIds = new Set<string>();
    let totalUniqueBookings = 0;

    processedTransactions.forEach((tx) => {
      totalRevenue += tx.netRoomAmount;
      totalRoomNights += tx.roomNights;

      const bKey = tx.bookingId || `${tx.guestName}_${tx.checkInDate}_${tx.roomNumber}`;
      if (!seenBookingIds.has(bKey)) {
        seenBookingIds.add(bKey);
        totalUniqueBookings += 1;
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
    });

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

    // ── CASE A: FILTER BY HOTEL ──
    if (filters.filterBy === 'hotel') {
      const baseHotels = accessibleHotels && accessibleHotels.length > 0
        ? accessibleHotels
        : [{ code: activeHotelCode, name: 'Active Hotel' }];

      const selectedHotels = filters.selectedHotels;
      const filteredHotels =
        selectedHotels && selectedHotels.length > 0
          ? baseHotels.filter(
              (h: any) =>
                selectedHotels.includes(h.name) ||
                selectedHotels.includes(h.code)
            )
          : baseHotels;

      const revenueTable: ChannelMetric[] = [];
      const bookingsTable: ChannelMetric[] = [];
      const roomNightsTable: ChannelMetric[] = [];
      const leadTimeTable: ChannelMetric[] = [];
      const cancellationTable: ChannelMetric[] = [];

      filteredHotels.forEach((h: any) => {
        const hCode = String(h.code || h.hotelCode || h.id || '');
        const hName = String(h.name || h.hotelName || hCode);

        const hTxs = processedTransactions.filter(
          (tx) => tx.hotelCode === hCode || tx.hotelName === hName || (!tx.hotelCode && hCode === activeHotelCode)
        );
        const hCancels = processedCancelledTransactions.filter(
          (c) => c.hotelCode === hCode || c.hotelName === hName || (!c.hotelCode && hCode === activeHotelCode)
        );

        let hRev = 0;
        let hNights = 0;
        let hLeadSum = 0;
        let hLeadCount = 0;
        const hSeenBookings = new Set<string>();

        hTxs.forEach((tx) => {
          hRev += tx.netRoomAmount;
          hNights += tx.roomNights;
          const bKey = tx.bookingId || `${tx.guestName}_${tx.checkInDate}_${tx.roomNumber}`;
          if (!hSeenBookings.has(bKey)) {
            hSeenBookings.add(bKey);
            hLeadSum += tx.leadTime;
            hLeadCount += 1;
          }
        });

        const hBookings = hSeenBookings.size;
        const hAvgLead = hLeadCount > 0 ? Number((hLeadSum / hLeadCount).toFixed(1)) : 0;
        const totalReservations = hBookings + hCancels.length;
        const hCancelRate = totalReservations > 0 ? Number(((hCancels.length / totalReservations) * 100).toFixed(1)) : 0;

        revenueTable.push({ channel: hName, value: hRev });
        bookingsTable.push({ channel: hName, value: hBookings });
        roomNightsTable.push({ channel: hName, value: hNights });
        leadTimeTable.push({ channel: hName, value: hAvgLead });
        cancellationTable.push({ channel: hName, value: hCancelRate, secondaryValue: hCancels.length });
      });

      const sumRev = revenueTable.reduce((acc, x) => acc + x.value, 0);
      const sumBookings = bookingsTable.reduce((acc, x) => acc + x.value, 0);
      const sumNights = roomNightsTable.reduce((acc, x) => acc + x.value, 0);

      const adrTable: ChannelMetric[] = filteredHotels.map((h: any, idx: number) => {
        const rev = revenueTable[idx]?.value || 0;
        const nights = roomNightsTable[idx]?.value || 0;
        const adr = nights > 0 ? Math.round(rev / nights) : 0;
        return { channel: h.name, value: adr };
      });
      const overallAdr = sumNights > 0 ? Math.round(sumRev / sumNights) : 0;

      const bookingsPercentTable: ChannelMetric[] = filteredHotels.map((h: any, idx: number) => {
        const b = bookingsTable[idx]?.value || 0;
        const pct = sumBookings > 0 ? Number(((b / sumBookings) * 100).toFixed(1)) : 0;
        return { channel: h.name, value: pct };
      });

      const avgLeadTime = Number(
        (leadTimeTable.reduce((acc, x) => acc + x.value, 0) / (leadTimeTable.length || 1)).toFixed(1)
      );
      const overallCancellationRate = Number(
        (cancellationTable.reduce((acc, x) => acc + x.value, 0) / (cancellationTable.length || 1)).toFixed(1)
      );

      // Time-series array for hotels
      const hotelSeriesArray = dateRangeList.map((d) => {
        const label = d.slice(5);
        const pt: TimeSeriesPoint = { date: label };
        filteredHotels.forEach((h: any) => {
          const hName = String(h.name || h.hotelName || h.code);
          const dayTxs = processedTransactions.filter(
            (tx) =>
              (tx.hotelName === hName || tx.hotelCode === h.code) &&
              (filters.reportBy === 'booking_date' ? tx.bookingDate === d : tx.entryDate === d)
          );
          let dayRev = 0;
          let dayNights = 0;
          dayTxs.forEach((tx) => {
            dayRev += tx.netRoomAmount;
            dayNights += tx.roomNights;
          });
          pt[`rev_${hName}`] = dayRev;
          pt[`book_${hName}`] = dayTxs.length;
          pt[`nights_${hName}`] = dayNights;
          pt[`adr_${hName}`] = dayNights > 0 ? Math.round(dayRev / dayNights) : 0;
        });
        return pt;
      });

      return {
        activeChannels: filteredHotels.map((h: any) => h.name),
        seriesArray: hotelSeriesArray,
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
        allDiscoveredChannels: filteredHotels.map((h: any) => h.name),
        totals: {
          revenue: sumRev,
          bookings: sumBookings,
          roomNights: sumNights,
          avgLeadTime,
          cancellationRate: overallCancellationRate,
          adr: overallAdr
        }
      };
    }

    // ── CASE B: FILTER BY TRAVEL AGENT ──
    if (filters.filterBy === 'travel_agent') {
      const baseAgents = filters.selectedEntities && filters.selectedEntities.length > 0
        ? filters.selectedEntities
        : dynamicTravelAgents;

      const revenueTable: ChannelMetric[] = [];
      const bookingsTable: ChannelMetric[] = [];
      const roomNightsTable: ChannelMetric[] = [];
      const leadTimeTable: ChannelMetric[] = [];
      const cancellationTable: ChannelMetric[] = [];

      baseAgents.forEach((agentName) => {
        const agLower = agentName.toLowerCase();
        const aTxs = processedTransactions.filter((tx) => {
          const tAg = (tx.travelAgent || '').toLowerCase();
          const tCh = (tx.channel || '').toLowerCase();
          const tSrc = (tx.raw?.source || '').toLowerCase();
          return tAg === agLower || tCh === agLower || tSrc.includes(agLower);
        });

        const aCancels = processedCancelledTransactions.filter((c) => {
          const tAg = (c.travelAgent || c.travelAgentName || c.agent || '').toLowerCase();
          const tCh = (c.channel || '').toLowerCase();
          const tSrc = (c.source || '').toLowerCase();
          return tAg === agLower || tCh === agLower || tSrc.includes(agLower);
        });

        let aRev = 0;
        let aNights = 0;
        let aLeadSum = 0;
        let aLeadCount = 0;
        const aSeenBookings = new Set<string>();

        aTxs.forEach((tx) => {
          aRev += tx.netRoomAmount;
          aNights += tx.roomNights;
          const bKey = tx.bookingId || `${tx.guestName}_${tx.checkInDate}_${tx.roomNumber}`;
          if (!aSeenBookings.has(bKey)) {
            aSeenBookings.add(bKey);
            aLeadSum += tx.leadTime;
            aLeadCount += 1;
          }
        });

        const aBookings = aSeenBookings.size;
        const aAvgLead = aLeadCount > 0 ? Number((aLeadSum / aLeadCount).toFixed(1)) : 0;
        const totalReservations = aBookings + aCancels.length;
        const aCancelRate = totalReservations > 0 ? Number(((aCancels.length / totalReservations) * 100).toFixed(1)) : 0;

        revenueTable.push({ channel: agentName, value: aRev });
        bookingsTable.push({ channel: agentName, value: aBookings });
        roomNightsTable.push({ channel: agentName, value: aNights });
        leadTimeTable.push({ channel: agentName, value: aAvgLead });
        cancellationTable.push({ channel: agentName, value: aCancelRate, secondaryValue: aCancels.length });
      });

      const sumRev = revenueTable.reduce((acc, x) => acc + x.value, 0);
      const sumBookings = bookingsTable.reduce((acc, x) => acc + x.value, 0);
      const sumNights = roomNightsTable.reduce((acc, x) => acc + x.value, 0);

      const adrTable: ChannelMetric[] = baseAgents.map((agentName, idx) => {
        const rev = revenueTable[idx]?.value || 0;
        const nights = roomNightsTable[idx]?.value || 0;
        return { channel: agentName, value: nights > 0 ? Math.round(rev / nights) : 0 };
      });
      const overallAdr = sumNights > 0 ? Math.round(sumRev / sumNights) : 0;

      const bookingsPercentTable: ChannelMetric[] = baseAgents.map((agentName, idx) => {
        const b = bookingsTable[idx]?.value || 0;
        const pct = sumBookings > 0 ? Number(((b / sumBookings) * 100).toFixed(1)) : 0;
        return { channel: agentName, value: pct };
      });

      const avgLeadTime = Number(
        (leadTimeTable.reduce((acc, x) => acc + x.value, 0) / (leadTimeTable.length || 1)).toFixed(1)
      );
      const overallCancellationRate = Number(
        (cancellationTable.reduce((acc, x) => acc + x.value, 0) / (cancellationTable.length || 1)).toFixed(1)
      );

      const agentSeriesArray = dateRangeList.map((d) => {
        const label = d.slice(5);
        const pt: TimeSeriesPoint = { date: label };
        baseAgents.forEach((agentName) => {
          const agLower = agentName.toLowerCase();
          const dayTxs = processedTransactions.filter((tx) => {
            const matchAg =
              (tx.travelAgent || '').toLowerCase() === agLower ||
              (tx.channel || '').toLowerCase() === agLower ||
              (tx.raw?.source || '').toLowerCase().includes(agLower);
            return matchAg && (filters.reportBy === 'booking_date' ? tx.bookingDate === d : tx.entryDate === d);
          });
          let dayRev = 0;
          let dayNights = 0;
          dayTxs.forEach((tx) => {
            dayRev += tx.netRoomAmount;
            dayNights += tx.roomNights;
          });
          pt[`rev_${agentName}`] = dayRev;
          pt[`book_${agentName}`] = dayTxs.length;
          pt[`nights_${agentName}`] = dayNights;
          pt[`adr_${agentName}`] = dayNights > 0 ? Math.round(dayRev / dayNights) : 0;
        });
        return pt;
      });

      return {
        activeChannels: baseAgents,
        seriesArray: agentSeriesArray,
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
        allDiscoveredChannels: baseAgents,
        totals: {
          revenue: sumRev,
          bookings: sumBookings,
          roomNights: sumNights,
          avgLeadTime,
          cancellationRate: overallCancellationRate,
          adr: overallAdr
        }
      };
    }

    // ── CASE C: FILTER BY COUNTRY ──
    if (filters.filterBy === 'country') {
      const baseCountries = filters.selectedEntities && filters.selectedEntities.length > 0
        ? filters.selectedEntities
        : PORTFOLIO_COUNTRIES;

      const revenueTable: ChannelMetric[] = [];
      const bookingsTable: ChannelMetric[] = [];
      const roomNightsTable: ChannelMetric[] = [];
      const leadTimeTable: ChannelMetric[] = [];
      const cancellationTable: ChannelMetric[] = [];

      baseCountries.forEach((country) => {
        const cLower = country.toLowerCase();
        const cTxs = processedTransactions.filter(
          (tx) => (tx.country || '').toLowerCase() === cLower
        );
        const cCancels = processedCancelledTransactions.filter(
          (c) => (c.country || c.guestCountry || c.nationality || '').toLowerCase() === cLower
        );

        let cRev = 0;
        let cNights = 0;
        let cLeadSum = 0;
        let cLeadCount = 0;
        const cSeenBookings = new Set<string>();

        cTxs.forEach((tx) => {
          cRev += tx.netRoomAmount;
          cNights += tx.roomNights;
          const bKey = tx.bookingId || `${tx.guestName}_${tx.checkInDate}_${tx.roomNumber}`;
          if (!cSeenBookings.has(bKey)) {
            cSeenBookings.add(bKey);
            cLeadSum += tx.leadTime;
            cLeadCount += 1;
          }
        });

        const cBookings = cSeenBookings.size;
        const cAvgLead = cLeadCount > 0 ? Number((cLeadSum / cLeadCount).toFixed(1)) : 0;
        const totalReservations = cBookings + cCancels.length;
        const cCancelRate = totalReservations > 0 ? Number(((cCancels.length / totalReservations) * 100).toFixed(1)) : 0;

        revenueTable.push({ channel: country, value: cRev });
        bookingsTable.push({ channel: country, value: cBookings });
        roomNightsTable.push({ channel: country, value: cNights });
        leadTimeTable.push({ channel: country, value: cAvgLead });
        cancellationTable.push({ channel: country, value: cCancelRate, secondaryValue: cCancels.length });
      });

      const sumRev = revenueTable.reduce((acc, x) => acc + x.value, 0);
      const sumBookings = bookingsTable.reduce((acc, x) => acc + x.value, 0);
      const sumNights = roomNightsTable.reduce((acc, x) => acc + x.value, 0);

      const adrTable: ChannelMetric[] = baseCountries.map((c, idx) => {
        const rev = revenueTable[idx]?.value || 0;
        const nights = roomNightsTable[idx]?.value || 0;
        return { channel: c, value: nights > 0 ? Math.round(rev / nights) : 0 };
      });
      const overallAdr = sumNights > 0 ? Math.round(sumRev / sumNights) : 0;

      const bookingsPercentTable: ChannelMetric[] = baseCountries.map((c, idx) => {
        const b = bookingsTable[idx]?.value || 0;
        const pct = sumBookings > 0 ? Number(((b / sumBookings) * 100).toFixed(1)) : 0;
        return { channel: c, value: pct };
      });

      const avgLeadTime = Number(
        (leadTimeTable.reduce((acc, x) => acc + x.value, 0) / (leadTimeTable.length || 1)).toFixed(1)
      );
      const overallCancellationRate = Number(
        (cancellationTable.reduce((acc, x) => acc + x.value, 0) / (cancellationTable.length || 1)).toFixed(1)
      );

      const countrySeriesArray = dateRangeList.map((d) => {
        const label = d.slice(5);
        const pt: TimeSeriesPoint = { date: label };
        baseCountries.forEach((c) => {
          const cLower = c.toLowerCase();
          const dayTxs = processedTransactions.filter(
            (tx) =>
              (tx.country || '').toLowerCase() === cLower &&
              (filters.reportBy === 'booking_date' ? tx.bookingDate === d : tx.entryDate === d)
          );
          let dayRev = 0;
          let dayNights = 0;
          dayTxs.forEach((tx) => {
            dayRev += tx.netRoomAmount;
            dayNights += tx.roomNights;
          });
          pt[`rev_${c}`] = dayRev;
          pt[`book_${c}`] = dayTxs.length;
          pt[`nights_${c}`] = dayNights;
          pt[`adr_${c}`] = dayNights > 0 ? Math.round(dayRev / dayNights) : 0;
        });
        return pt;
      });

      return {
        activeChannels: baseCountries,
        seriesArray: countrySeriesArray,
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
        allDiscoveredChannels: baseCountries,
        totals: {
          revenue: sumRev,
          bookings: sumBookings,
          roomNights: sumNights,
          avgLeadTime,
          cancellationRate: overallCancellationRate,
          adr: overallAdr
        }
      };
    }

    // ── CASE D: FILTER BY CHANNEL (DEFAULT) ──
    const activeChannels = filters.selectedChannels.length > 0
      ? filters.selectedChannels
      : dynamicChannels;

    const revMap: Record<string, number> = {};
    const bookMap: Record<string, number> = {};
    const nightsMap: Record<string, number> = {};
    const leadTimeMap: Record<string, { totalDays: number; count: number }> = {};

    activeChannels.forEach((ch) => {
      revMap[ch] = 0;
      bookMap[ch] = 0;
      nightsMap[ch] = 0;
      leadTimeMap[ch] = { totalDays: 0, count: 0 };
    });

    const timeSeriesData: Record<string, TimeSeriesPoint> = {};
    dateRangeList.forEach((d) => {
      const label = d.slice(5);
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
      const ch = tx.channel;
      if (activeChannels.includes(ch)) {
        revMap[ch] = (revMap[ch] || 0) + tx.netRoomAmount;
        nightsMap[ch] = (nightsMap[ch] || 0) + tx.roomNights;
        bookMap[ch] = (bookMap[ch] || 0) + 1;
        if (!leadTimeMap[ch]) leadTimeMap[ch] = { totalDays: 0, count: 0 };
        leadTimeMap[ch].totalDays += tx.leadTime;
        leadTimeMap[ch].count += 1;

        const targetDate = filters.reportBy === 'booking_date' ? tx.bookingDate : tx.entryDate;
        const pt = timeSeriesData[targetDate];
        if (pt) {
          pt[`rev_${ch}`] = Number(pt[`rev_${ch}`] || 0) + tx.netRoomAmount;
          pt[`nights_${ch}`] = Number(pt[`nights_${ch}`] || 0) + tx.roomNights;
          pt[`book_${ch}`] = Number(pt[`book_${ch}`] || 0) + 1;
          pt[`lead_${ch}`] = tx.leadTime;
        }
      }
    });

    // Update timeseries ADR
    dateRangeList.forEach((d) => {
      const pt = timeSeriesData[d];
      if (pt) {
        activeChannels.forEach((ch) => {
          const r = Number(pt[`rev_${ch}`] || 0);
          const n = Number(pt[`nights_${ch}`] || 0);
          pt[`adr_${ch}`] = n > 0 ? Math.round(r / n) : 0;
        });
      }
    });

    const seriesArray = dateRangeList.map((d) => timeSeriesData[d]);

    // Cancellation calculations
    const cancellationTable: ChannelMetric[] = activeChannels.map((ch) => {
      const chCancelled = processedCancelledTransactions.filter(
        (c) => normalizeChannel(c) === ch
      ).length;
      const chBooked = bookMap[ch] || 0;
      const chTotal = chBooked + chCancelled;
      const pct = chTotal > 0 ? Number(((chCancelled / chTotal) * 100).toFixed(1)) : 0;
      return { channel: ch, value: pct, secondaryValue: chCancelled };
    });

    const totalCancelledCount = processedCancelledTransactions.length;
    const totalReservations = totalUniqueBookings + totalCancelledCount;
    const overallCancellationRate =
      totalReservations > 0
        ? Number(((totalCancelledCount / totalReservations) * 100).toFixed(1))
        : 0;

    // Lead Time Table
    let totalLeadDays = 0;
    let totalLeadCount = 0;
    const leadTimeTable: ChannelMetric[] = activeChannels.map((ch) => {
      const item = leadTimeMap[ch] || { totalDays: 0, count: 0 };
      const avg = item.count > 0 ? Number((item.totalDays / item.count).toFixed(1)) : 0;
      totalLeadDays += item.totalDays;
      totalLeadCount += item.count;
      return { channel: ch, value: avg };
    });
    const avgLeadTime =
      totalLeadCount > 0 ? Number((totalLeadDays / totalLeadCount).toFixed(1)) : 0;

    // ADR Table
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
    let revenueTable: ChannelMetric[] = activeChannels.map((ch) => ({
      channel: ch,
      value: revMap[ch] || 0
    }));

    let bookingsTable: ChannelMetric[] = activeChannels.map((ch) => ({
      channel: ch,
      value: bookMap[ch] || 0
    }));

    let roomNightsTable: ChannelMetric[] = activeChannels.map((ch) => ({
      channel: ch,
      value: nightsMap[ch] || 0
    }));

    // If discardNoData is enabled in filters
    if (filters.discardNoData) {
      const kept = activeChannels.filter((ch) => (revMap[ch] || 0) > 0 || (bookMap[ch] || 0) > 0);
      revenueTable = revenueTable.filter((r) => kept.includes(r.channel));
      bookingsTable = bookingsTable.filter((r) => kept.includes(r.channel));
      roomNightsTable = roomNightsTable.filter((r) => kept.includes(r.channel));
    }

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
      allDiscoveredChannels: activeChannels,
      totals: {
        revenue: totalRevenue,
        bookings: totalUniqueBookings,
        roomNights: totalRoomNights,
        avgLeadTime,
        cancellationRate: overallCancellationRate,
        adr: overallAdr
      }
    };
  }, [
    processedTransactions,
    cancelledTransactions,
    dateRangeList,
    filters.selectedChannels,
    filters.selectedHotels,
    filters.selectedEntities,
    filters.filterBy,
    filters.reportBy,
    filters.discardNoData,
    accessibleHotels,
    activeHotelCode,
    dynamicChannels,
    dynamicTravelAgents
  ]);

  return {
    loading,
    lastUpdated,
    filteredEntries: processedTransactions,
    cancelledEntries: processedCancelledTransactions,
    voidEntries: processedVoidTransactions,
    rawEntries: cleanTransactions,
    aggregated,
    roomTypesMap,
    ratePlansMap: {},
    dynamicChannels,
    dynamicTravelAgents
  };
}
