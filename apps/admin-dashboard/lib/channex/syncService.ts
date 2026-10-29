/**
 * Channex Sync Service
 * Handles 2-Way Synchronization between My Tara Firestore PMS and Channex Channel Manager
 */

import { adminDb } from "@/lib/firebaseAdmin";
import { channexClient } from "./channexClient";
import { formatRateForChannex, formatCurrencyAmount } from "@/lib/currency-utils";
import {
    ChannexWebhookPayload,
    ChannexBooking,
    ChannexAvailabilityPayload,
    ChannexRestrictionsPayload
} from "./types";

// ============================================================
// CHANNEX RATE LIMITER — In-process token bucket
// Limit: 10 Availability + 10 Restrictions requests per minute per property
// We conservatively use one global semaphore with 3s minimum gap between
// consecutive outgoing ARI requests to stay well within limits.
// Source: docs.channex.io "API Rate Limits"
// ============================================================
const _ariCallTimestamps: Map<string, number> = new Map(); // propertyId -> last call timestamp
const _propertyCallQueues: Map<string, Promise<void>> = new Map(); // propertyId -> active throttle promise chain

/**
 * Throttle ARI API calls per Channex property to strictly comply with 20 req/min limit.
 * Uses sequential promise-chaining and minimum spacing (3200ms) to prevent concurrent burst spikes.
 */
async function throttleAriCall(propertyId: string, minIntervalMs: number = 3200): Promise<void> {
    const prevPromise = _propertyCallQueues.get(propertyId) || Promise.resolve();
    
    let releaseLock!: () => void;
    const currentPromise = new Promise<void>(res => { releaseLock = res; });
    _propertyCallQueues.set(propertyId, currentPromise);

    try {
        await prevPromise;
        const lastCall = _ariCallTimestamps.get(propertyId) || 0;
        const now = Date.now();
        const elapsed = now - lastCall;
        if (elapsed < minIntervalMs) {
            const wait = minIntervalMs - elapsed;
            console.log(`[ChannexRateLimit] Throttling ARI call for property ${propertyId} — waiting ${wait}ms to respect 20 req/min limit...`);
            await new Promise(resolve => setTimeout(resolve, wait));
        }
        _ariCallTimestamps.set(propertyId, Date.now());
    } finally {
        releaseLock();
    }
}

// ============================================================
// CHANNEX OUTBOX DEBOUNCER — Buffers rapid UI / Front Office edits
// Consolidates rapid updates within a 4-second window into 1 Delta call
// Source: docs.channex.io "Best Practices Guide"
// ============================================================
interface QueuedDeltaEntry {
    hotelCode: string;
    delta: {
        rates?: any[];
        availability?: any[];
    };
    resolve: (res: any) => void;
    reject: (err: any) => void;
}

const _propertyOutboxMap: Map<string, {
    timer: NodeJS.Timeout | null;
    queue: QueuedDeltaEntry[];
}> = new Map();


/**
 * Helper to compress consecutive daily availability into run-length encoded date ranges (Channex Standard)
 */
function compressAvailabilityRanges(
    dailyList: Array<{ dateStr: string; qty: number }>,
    propertyId: string,
    roomTypeId: string
): any[] {
    if (!dailyList || dailyList.length === 0) return [];
    const ranges: any[] = [];
    let rangeStart = dailyList[0].dateStr;
    let rangeEnd = dailyList[0].dateStr;
    let currentQty = dailyList[0].qty;

    for (let i = 1; i < dailyList.length; i++) {
        const item = dailyList[i];
        if (item.qty === currentQty) {
            rangeEnd = item.dateStr;
        } else {
            if (rangeStart === rangeEnd) {
                ranges.push({
                    property_id: propertyId,
                    room_type_id: roomTypeId,
                    date: rangeStart,
                    availability: currentQty
                });
            } else {
                ranges.push({
                    property_id: propertyId,
                    room_type_id: roomTypeId,
                    date_from: rangeStart,
                    date_to: rangeEnd,
                    availability: currentQty
                });
            }
            rangeStart = item.dateStr;
            rangeEnd = item.dateStr;
            currentQty = item.qty;
        }
    }

    if (rangeStart === rangeEnd) {
        ranges.push({
            property_id: propertyId,
            room_type_id: roomTypeId,
            date: rangeStart,
            availability: currentQty
        });
    } else {
        ranges.push({
            property_id: propertyId,
            room_type_id: roomTypeId,
            date_from: rangeStart,
            date_to: rangeEnd,
            availability: currentQty
        });
    }

    return ranges;
}

/**
 * Helper to compress consecutive daily restrictions into run-length encoded date ranges (Channex Standard)
 * Merges consecutive date sequences sharing identical rate & restrictions into date_from & date_to
 */
function compressRestrictionRanges(items: any[]): any[] {
    if (!items || items.length === 0) return [];

    // 1. Separate items that already declare date_from / date_to from discrete daily items
    const alreadyRanges: any[] = [];
    const singleDays: any[] = [];

    items.forEach(item => {
        if (item.date_from && item.date_to) {
            alreadyRanges.push(item);
        } else if (item.date) {
            singleDays.push(item);
        } else {
            alreadyRanges.push(item);
        }
    });

    if (singleDays.length === 0) {
        return alreadyRanges;
    }

    // 2. Group single day items by unique signature (property_id + rate_plan_id + values)
    const groups: Map<string, any[]> = new Map();

    singleDays.forEach(item => {
        const signature = JSON.stringify({
            pId: item.property_id,
            rpId: item.rate_plan_id,
            rate: item.rate,
            minArr: item.min_stay_arrival,
            minThru: item.min_stay_through,
            maxStay: item.max_stay,
            stopSell: item.stop_sell,
            cta: item.closed_to_arrival,
            ctd: item.closed_to_departure,
            days: item.days ? [...item.days].sort().join(",") : ""
        });

        if (!groups.has(signature)) {
            groups.set(signature, []);
        }
        groups.get(signature)!.push(item);
    });

    const mergedRanges: any[] = [];

    // 3. For each group, sort by date ascending and merge consecutive date sequences
    groups.forEach((groupItems) => {
        groupItems.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

        let seqStart = groupItems[0].date;
        let seqEnd = groupItems[0].date;
        let baseTemplate = { ...groupItems[0] };
        delete baseTemplate.date;

        for (let i = 1; i < groupItems.length; i++) {
            const prevDate = new Date(seqEnd);
            const curDate = new Date(groupItems[i].date);
            const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Consecutive calendar day: extend current range
                seqEnd = groupItems[i].date;
            } else if (diffDays === 0) {
                // Duplicate date: ignore
                continue;
            } else {
                // Sequence break: flush previous range
                if (seqStart === seqEnd) {
                    mergedRanges.push({ ...baseTemplate, date: seqStart });
                } else {
                    mergedRanges.push({ ...baseTemplate, date_from: seqStart, date_to: seqEnd });
                }
                seqStart = groupItems[i].date;
                seqEnd = groupItems[i].date;
                baseTemplate = { ...groupItems[i] };
                delete baseTemplate.date;
            }
        }

        // Flush last sequence
        if (seqStart === seqEnd) {
            mergedRanges.push({ ...baseTemplate, date: seqStart });
        } else {
            mergedRanges.push({ ...baseTemplate, date_from: seqStart, date_to: seqEnd });
        }
    });

    return [...alreadyRanges, ...mergedRanges];
}

// ============================================================
// HIGH-SCALE MULTI-HOTEL FIREBASE COST OPTIMIZATION (100+ HOTELS)
// In-memory 60s TTL Caching for Static Hotel Data, Room Types & Rate Plans
// Reduces repetitive Firestore read queries by up to 90%
// ============================================================
interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

const _hotelDataCache: Map<string, CacheEntry<any>> = new Map();
const _roomTypesCache: Map<string, CacheEntry<any[]>> = new Map();
const _ratePlansCache: Map<string, CacheEntry<any[]>> = new Map();

export async function getCachedHotelData(hotelCode: string, ttlMs: number = 60000): Promise<any> {
    const cached = _hotelDataCache.get(hotelCode);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
        return cached.data;
    }
    const doc = await adminDb.collection("hotels").doc(hotelCode).get();
    const data = doc.exists ? doc.data() : {};
    _hotelDataCache.set(hotelCode, { data, expiresAt: now + ttlMs });
    return data;
}

export async function getCachedRoomTypes(hotelCode: string, ttlMs: number = 60000): Promise<any[]> {
    const cached = _roomTypesCache.get(hotelCode);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
        return cached.data;
    }
    const snap = await adminDb.collection(`hotels/${hotelCode}/roomTypes`).get();
    const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    _roomTypesCache.set(hotelCode, { data: list, expiresAt: now + ttlMs });
    return list;
}

export async function getCachedRatePlans(hotelCode: string, ttlMs: number = 60000): Promise<any[]> {
    const cached = _ratePlansCache.get(hotelCode);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
        return cached.data;
    }
    const snap = await adminDb.collection(`hotels/${hotelCode}/ratePlans`).get();
    const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    _ratePlansCache.set(hotelCode, { data: list, expiresAt: now + ttlMs });
    return list;
}

// In-memory cache for Channex Property ID to Hotel Code mapping
const _propertyIdToHotelCodeCache: Map<string, string> = new Map();

export class ChannexSyncService {
    /**
     * Resolves the internal hotelCode from a given Channex Property UUID
     * Uses in-memory caching and targeted indexed queries to avoid full collection scans
     */
    async findHotelCodeByChannexPropertyId(channexPropertyId: string): Promise<string | null> {
        if (!channexPropertyId) return null;

        // 1. Check in-memory cache
        if (_propertyIdToHotelCodeCache.has(channexPropertyId)) {
            return _propertyIdToHotelCodeCache.get(channexPropertyId)!;
        }

        try {
            // 2. Direct document ID lookup
            const directDoc = await adminDb.collection("hotels").doc(channexPropertyId).get();
            if (directDoc.exists) {
                _propertyIdToHotelCodeCache.set(channexPropertyId, directDoc.id);
                return directDoc.id;
            }

            // 3. Targeted indexed query for channexPropertyId
            const q1 = await adminDb.collection("hotels").where("channexPropertyId", "==", channexPropertyId).limit(1).get();
            if (!q1.empty) {
                const foundId = q1.docs[0].id;
                _propertyIdToHotelCodeCache.set(channexPropertyId, foundId);
                return foundId;
            }

            // 4. Targeted indexed query for channelManager.channexPropertyId
            const q2 = await adminDb.collection("hotels").where("channelManager.channexPropertyId", "==", channexPropertyId).limit(1).get();
            if (!q2.empty) {
                const foundId = q2.docs[0].id;
                _propertyIdToHotelCodeCache.set(channexPropertyId, foundId);
                return foundId;
            }

            // 5. Targeted indexed query for channelManager.openChannelHotelCode
            const q3 = await adminDb.collection("hotels").where("channelManager.openChannelHotelCode", "==", channexPropertyId).limit(1).get();
            if (!q3.empty) {
                const foundId = q3.docs[0].id;
                _propertyIdToHotelCodeCache.set(channexPropertyId, foundId);
                return foundId;
            }

            // Fallback: ONLY for single-property development/testing setups (where exactly 1 hotel exists)
            // In a multi-hotel portfolio (100 hotels), never attribute an unknown property ID to an arbitrary hotel
            const hotelsSnap = await adminDb.collection("hotels").limit(2).get();
            if (hotelsSnap.docs.length === 1) {
                const defaultHotel = hotelsSnap.docs[0];
                console.warn(`[ChannexSync] Single-hotel setup: Property ID ${channexPropertyId} not explicitly mapped. Falling back to only hotel: ${defaultHotel.id}`);
                _propertyIdToHotelCodeCache.set(channexPropertyId, defaultHotel.id);
                return defaultHotel.id;
            } else if (hotelsSnap.docs.length > 1) {
                console.warn(`[ChannexSync Security] Multi-hotel portfolio detected (${hotelsSnap.docs.length}+ hotels). Property ID ${channexPropertyId} is not mapped to any hotel. Refusing to guess to prevent ledger cross-contamination.`);
            }

            return null;
        } catch (error) {
            console.error("[ChannexSync] Error finding hotel by property_id:", error);
            return null;
        }
    }

    /**
     * Processes incoming Booking Webhook from Channex (Booking.com, Agoda, Traveloka, Tiket.com, etc.)
     */
    async processIncomingBookingWebhook(payload: ChannexWebhookPayload, explicitHotelCode?: string): Promise<{ 
        success: boolean; 
        message: string; 
        bookingId?: string; 
        previousStay?: { arrivalDate?: string; departureDate?: string };
        financials?: any;
    }> {
        const { event, property_id, booking } = payload;

        if (!booking || !property_id) {
            return { success: false, message: "Missing booking or property_id in webhook payload" };
        }

        const hotelCode = explicitHotelCode || await this.findHotelCodeByChannexPropertyId(property_id);
        if (!hotelCode) {
            return { success: false, message: `No active hotel found for Channex Property ID: ${property_id}` };
        }

        const rawOta = (booking as any)?.ota_name || (booking as any)?.channel || (booking as any)?.ota || (payload as any)?.channel_name;
        let channelName = (rawOta && rawOta.toLowerCase() !== "open channel" && rawOta.toLowerCase() !== "ota" && rawOta.toLowerCase() !== "ota channel") 
            ? rawOta 
            : (booking.channel_name && booking.channel_name.toLowerCase() !== "open channel" && booking.channel_name.toLowerCase() !== "ota" && booking.channel_name.toLowerCase() !== "ota channel"
                ? booking.channel_name 
                : (rawOta || ""));
        const revisionId = (payload as any)?.booking_revision_id || 
            (booking as any)?.revision_id || 
            (payload as any)?.data?.id || 
            (payload as any)?.id || 
            "";

        // Channex Booking ID: The authoritative UUID of the booking (distinct from Revision ID)
        const channexBookingId = (booking as any)?.booking_id ||
            (booking as any)?.bookingId ||
            (payload as any)?.relationships?.booking?.data?.id ||
            (payload as any)?.data?.relationships?.booking?.data?.id ||
            ((booking.id && booking.id !== revisionId) ? booking.id : undefined) ||
            (booking as any)?.channexBookingId ||
            booking.id;

        const reservationId = booking.channel_booking_id || 
            (booking as any)?.unique_id || 
            (booking as any)?.reservation_id || 
            (booking as any)?.reservationId ||
            (booking as any)?.ota_reservation_code || 
            channexBookingId;

        const otaReservationId = (booking as any)?.ota_reservation_code || 
            (booking as any)?.ota_reservation_id || 
            (booking as any)?.otaReservationId || 
            reservationId;

        const otaBookingId = reservationId;
        const guest = booking.customer || booking.guest || {};
        const guestName = (guest.name || `${guest.first_name || ""} ${guest.last_name || ""}`).trim() || "OTA Guest";
        const arrivalDate = booking.arrival_date;
        const departureDate = booking.departure_date;
        const eta = (booking as any)?.arrival_hour || 
            (booking as any)?.arrival_time || 
            (booking as any)?.checkin_time || 
            (booking as any)?.check_in_time || 
            (booking as any)?.estimated_arrival_time || 
            (booking as any)?.eta || 
            (payload as any)?.arrival_hour || 
            (payload as any)?.arrival_time || 
            "";
        const totalPrice = Number(booking.total_price || (booking as any)?.amount || (booking as any)?.total_amount) || 0;
        const isChannelCollect = booking.payment_type === "channel_collect" 
            || booking.payment_type === "virtual_card" 
            || booking.payment_collect === "channel"
            || (channelName && !["walk-in", "direct"].includes(channelName.toLowerCase()) && booking.payment_collect !== "property");

        // Calculate nights
        const start = new Date(arrivalDate);
        const end = new Date(departureDate);
        const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

        // Handle Booking Status
        const isCancelled = event === "booking_cancellation" || event === "booking_cancelled" || booking.status === "cancelled";
        const isModified = event === "booking_modification" || event === "booking_modified" || booking.status === "modified";
        const finalStatus = isCancelled ? "CANCELLED" : "CONFIRMED";
        const paymentStatus = isCancelled ? "CANCELLED" : (isChannelCollect ? "Lunas" : "Belum Bayar");

        console.log(`[ChannexSync] Processing ${event} for Hotel [${hotelCode}], Guest: ${guestName}, OTA: ${channelName}, BookingUUID: ${channexBookingId}, ResID: ${reservationId}, RevID: ${revisionId}`);

        const uniqueId = (booking as any)?.unique_id;
        const rawBookingId = (booking as any)?.booking_id || channexBookingId;
        const otaReservationCode = (booking as any)?.ota_reservation_code;
        const isMatchingBooking = (e: any) => Boolean(
            (otaBookingId && (e.bookingId === otaBookingId || e.reservationId === otaBookingId || e.voucherCode === otaBookingId || e.otaReservationId === otaBookingId)) ||
            (uniqueId && (e.bookingId === uniqueId || e.reservationId === uniqueId || e.voucherCode === uniqueId || e.otaReservationId === uniqueId)) ||
            (reservationId && (e.bookingId === reservationId || e.reservationId === reservationId || e.voucherCode === reservationId || e.otaReservationId === reservationId)) ||
            (channexBookingId && (e.channexBookingId === channexBookingId || e.bookingId === channexBookingId)) ||
            (rawBookingId && (e.channexBookingId === rawBookingId || e.bookingId === rawBookingId)) ||
            (otaReservationCode && (e.otaReservationId === otaReservationCode || e.voucherCode === otaReservationCode)) ||
            (revisionId && (e.initialRevisionId === revisionId || e.revisionId === revisionId || e.modifiedRevisionId === revisionId || e.cancelledRevisionId === revisionId)) ||
            (otaBookingId && e.bookingId === `${otaBookingId}-BFT`) ||
            (uniqueId && e.bookingId === `${uniqueId}-BFT`) ||
            (otaBookingId && e.parentBookingId === otaBookingId) ||
            (uniqueId && e.parentBookingId === uniqueId) ||
            (booking.id && e.parentBookingId === booking.id) ||
            (rawBookingId && e.parentBookingId === rawBookingId)
        );

        // Fetch cached room types and hotel data to minimize Firestore reads
        const roomTypes = await getCachedRoomTypes(hotelCode);
        const hotelData = (await getCachedHotelData(hotelCode)) || {};
        const propertyName = hotelData.name || hotelData.propertyName || "Setara Demo Partner";
        const propertyCurrency = (booking.currency || hotelData.currency || hotelData.channelManager?.currency || hotelData.settings?.currency || "IDR").toUpperCase().trim();

        // Channel Commission & Revenue Recording Mode (Net to Hotel vs Gross)
        const channelConfigs = hotelData.channelManager?.channels || hotelData.channelConfigs || hotelData.channels || {};
        const matchedChannel = Object.values(channelConfigs).find((ch: any) => 
            ch.channelName?.toLowerCase().includes(channelName.toLowerCase()) ||
            channelName.toLowerCase().includes(ch.channelName?.toLowerCase() || "") ||
            ch.code?.toLowerCase() === channelName.toLowerCase().replace(/[^a-z0-9]/g, "_")
        ) as any;

        const defaultCommissions: Record<string, number> = {
            "booking.com": 15,
            "agoda": 17,
            "traveloka": 18,
            "tiket.com": 15,
            "tiket": 15,
            "expedia": 18,
            "trip.com": 15,
            "airbnb": 14,
            "klook": 15,
            "hotelbeds": 20
        };

        const chanKey = channelName.toLowerCase().trim();
        const catalogDefaultComm = defaultCommissions[chanKey] || 15;

        // ── 3-TIER FINANCIAL RECONCILIATION ENGINE (Industry Standard Two-Way Normalizer) ──
        // 1. Identify Extranet Rate Model: Does the OTA extranet send Gross (Sell Rate) or Net (Payout Rate)?
        const isExtranetNetRate = matchedChannel?.extranetRateModel === "net" ||
            Boolean((booking as any)?.is_net_rate) ||
            ((booking as any)?.pricing_model === "net" && matchedChannel?.extranetRateModel !== "gross");

        // 2. Resolve Dynamic Deductions: Commission %, Marketing/Ads Booster %, Promo Subsidy %
        const finalCommissionPercent = Number(
            (payload as any).ota_commission_percent ??
            (booking as any)?.commission_percent ??
            matchedChannel?.commissionPercent ??
            hotelData.settings?.defaultOtaCommission ??
            catalogDefaultComm
        );
        const finalAdsPercent = Number(
            (payload as any).ota_ads_percent ??
            matchedChannel?.marketingAdsPercent ??
            0
        );
        const finalPromoPercent = Number(
            (payload as any).ota_promo_percent ??
            (booking as any)?.promo_percent ??
            matchedChannel?.promoDeductionPercent ??
            0
        );
        const totalDeductionPercentCalc = Math.min(99, Math.max(0, finalCommissionPercent + finalAdsPercent + finalPromoPercent));

        // 3. Resolve Virtual Credit Card (VCC) Balance if present
        const vccBalanceRaw = Number(
            (booking as any)?.guarantee?.meta?.virtual_card_current_balance ??
            (payload as any)?.guarantee?.meta?.virtual_card_current_balance ??
            (booking as any)?.virtual_card_current_balance ??
            (payload as any)?.virtual_card_current_balance
        );
        const hasVccBalance = !isNaN(vccBalanceRaw) && vccBalanceRaw > 0 && isChannelCollect;

        // 4. Resolve Explicit OTA Commission from webhook metadata
        const explicitCommissionRaw = Number(
            (booking as any)?.ota_commission ??
            (payload as any)?.ota_commission ??
            (booking as any)?.commission_amount
        );
        const hasExplicitCommission = !isNaN(explicitCommissionRaw) && explicitCommissionRaw > 0;

        let finalNetToHotel = 0;
        let finalCommissionAmount = 0;
        let finalAdsAmount = 0;
        let finalPromoAmount = 0;
        let finalTotalDeductions = 0;

        if (isExtranetNetRate) {
            // Case A: Extranet sends NETT. totalPrice is already Net to Hotel.
            finalNetToHotel = totalPrice;
            const grossCalc = totalDeductionPercentCalc > 0 
                ? Math.round(totalPrice / Math.max(0.01, 1 - (totalDeductionPercentCalc / 100))) 
                : totalPrice;
            finalCommissionAmount = Math.round(grossCalc * (finalCommissionPercent / 100));
            finalAdsAmount = Math.round(grossCalc * (finalAdsPercent / 100));
            finalPromoAmount = Math.round(grossCalc * (finalPromoPercent / 100));
            finalTotalDeductions = Math.max(0, grossCalc - finalNetToHotel);
        } else if (hasVccBalance) {
            // Case B: VCC Loaded Balance is the exact Net to Hotel
            finalNetToHotel = Math.min(totalPrice, vccBalanceRaw);
            finalTotalDeductions = Math.max(0, totalPrice - finalNetToHotel);
            if (hasExplicitCommission) {
                finalCommissionAmount = Math.min(finalTotalDeductions, explicitCommissionRaw);
                finalPromoAmount = Math.max(0, finalTotalDeductions - finalCommissionAmount);
            } else {
                finalCommissionAmount = finalTotalDeductions;
            }
        } else if (hasExplicitCommission) {
            // Case C: Explicit OTA Commission provided in payload
            finalCommissionAmount = Math.min(totalPrice, explicitCommissionRaw);
            finalPromoAmount = Math.round(totalPrice * (finalPromoPercent / 100));
            finalTotalDeductions = Math.min(totalPrice, finalCommissionAmount + finalPromoAmount);
            finalNetToHotel = Math.max(0, totalPrice - finalTotalDeductions);
        } else {
            // Case D: Standard Extranet GROSS (Agoda, Booking.com, Traveloka, Tiket.com, etc.)
            // Deduct dynamic commission, marketing/ads booster, and promo subsidies
            finalCommissionAmount = Math.round(totalPrice * (finalCommissionPercent / 100));
            finalAdsAmount = Math.round(totalPrice * (finalAdsPercent / 100));
            finalPromoAmount = Math.round(totalPrice * (finalPromoPercent / 100));
            finalTotalDeductions = Math.min(totalPrice, finalCommissionAmount + finalAdsAmount + finalPromoAmount);
            finalNetToHotel = Math.max(0, totalPrice - finalTotalDeductions);
        }

        const isWholesaler = isExtranetNetRate;
        const commissionPercent = finalCommissionPercent;
        const promoDeductionPercent = finalPromoPercent;
        const totalDeductionPercent = totalPrice > 0 ? Math.round((finalTotalDeductions / totalPrice) * 100 * 10) / 10 : 0;

        // Revenue Recording Mode: "net" (Net to Hotel) vs "gross" (Gross Sell Rate)
        const revenueRecordingMode = (
            matchedChannel?.pricingModel ||
            hotelData.channelManager?.pricingModel ||
            hotelData.settings?.revenueRecordingMode ||
            (payload as any).revenue_recording_mode ||
            (booking as any)?.revenue_recording_mode ||
            "net"
        ).toLowerCase() === "gross" ? "gross" : "net";

        // 1. GHOST BOOKING CLEANUP & CANCELLATION RETENTION (Certification Stage 5B & Audit Requirement)
        const affectedDates = new Set<string>();
        let previousStay: { arrivalDate?: string; departureDate?: string } | undefined = undefined;
        let matchedOriginalBooking: any = null;
        try {
            // Check explicit previous stay fields from payload or booking if present
            const rawPrevArr = (booking as any)?.previous_arrival_date || (payload as any)?.previous_arrival_date || (booking as any)?.original_arrival_date;
            const rawPrevDep = (booking as any)?.previous_departure_date || (payload as any)?.previous_departure_date || (booking as any)?.original_departure_date;

            // Scale-Optimized search window: New bookings only query stay dates (saving 95% reads)
            let minSearchDate: Date;
            let maxSearchDate: Date;

            if (!isModified && !isCancelled) {
                // New booking: check exact stay window only (typically 1-3 docs instead of 180 docs)
                minSearchDate = new Date(arrivalDate || new Date().toISOString().split("T")[0]);
                maxSearchDate = new Date(departureDate || arrivalDate || new Date().toISOString().split("T")[0]);
            } else if (rawPrevArr || rawPrevDep) {
                const pArr = rawPrevArr ? new Date(rawPrevArr) : new Date(arrivalDate);
                const pDep = rawPrevDep ? new Date(rawPrevDep) : new Date(departureDate);
                const curArr = new Date(arrivalDate);
                const curDep = new Date(departureDate);
                minSearchDate = pArr < curArr ? pArr : curArr;
                maxSearchDate = pDep > curDep ? pDep : curDep;
            } else {
                // Modifications without prior stay dates: focused +/- 21-day window
                minSearchDate = new Date(arrivalDate || new Date().toISOString().split("T")[0]);
                minSearchDate.setDate(minSearchDate.getDate() - 21);
                maxSearchDate = new Date(departureDate || arrivalDate || new Date().toISOString().split("T")[0]);
                maxSearchDate.setDate(maxSearchDate.getDate() + 21);
            }

            const startStr = minSearchDate.toISOString().split("T")[0];
            const endStr = maxSearchDate.toISOString().split("T")[0];

            const existingRevenueSnap = await adminDb.collection(`hotels/${hotelCode}/daily_revenue`)
                .where("date", ">=", startStr)
                .where("date", "<=", endStr)
                .get();
            for (const doc of existingRevenueSnap.docs) {
                const dayData = doc.data();
                const entries = dayData.entries || [];
                const matchingEntry = entries.find(isMatchingBooking);
                if (matchingEntry) {
                    if (!matchedOriginalBooking) {
                        matchedOriginalBooking = matchingEntry;
                    }
                    if (!previousStay && matchingEntry.checkInDate && matchingEntry.checkOutDate) {
                        previousStay = {
                            arrivalDate: matchingEntry.checkInDate,
                            departureDate: matchingEntry.checkOutDate
                        };
                    }
                    const docDate = dayData.date || doc.id.replace(`${hotelCode}_`, "");
                    affectedDates.add(docDate);
                    
                    if (isCancelled) {
                        // Keep transaction record for Front Office & Audit visibility, but mark as CANCELLED with roomCount: 0 & roomsCount: 0
                        const updatedEntries = entries.map((e: any) => {
                            if (isMatchingBooking(e)) {
                                const resolvedBookingId = (channexBookingId && channexBookingId !== revisionId)
                                    ? channexBookingId
                                    : (e.bookingId && e.bookingId !== e.revisionId ? e.bookingId : channexBookingId);
                                const origInitialRevId = e.initialRevisionId || (!e.isModified && !e.isCancelled ? e.revisionId : undefined) || existingInitialRevId;
                                return {
                                    ...e,
                                    bookingId: resolvedBookingId,
                                    channexBookingId: resolvedBookingId,
                                    reservationId: reservationId || e.reservationId,
                                    otaReservationId: otaReservationId || e.otaReservationId,
                                    amount: 0,
                                    status: "CANCELLED",
                                    paymentStatus: "CANCELLED",
                                    isCancelled: true,
                                    cancelledRevisionId: revisionId || e.cancelledRevisionId,
                                    initialRevisionId: origInitialRevId || e.initialRevisionId,
                                    revisionId: revisionId || e.revisionId,
                                    roomCount: 0,
                                    roomsCount: 0,
                                    note: `${e.note || ''} [CANCELLED by OTA Webhook]`.trim(),
                                    lastUpdated: new Date().toISOString()
                                };
                            }
                            return e;
                        });
                        const cleanEntry = (entry: any) => JSON.parse(JSON.stringify(entry, (_, v) => (v === undefined ? null : v)));
                        await doc.ref.update({
                            entries: cleanEntry(updatedEntries),
                            lastUpdated: new Date().toISOString()
                        });
                    } else {
                        // For date modifications: clear out slots that may no longer be part of new stay range
                        const cleanedEntries = entries.filter((e: any) => !isMatchingBooking(e));
                        const cleanEntry = (entry: any) => JSON.parse(JSON.stringify(entry, (_, v) => (v === undefined ? null : v)));
                        await doc.ref.update({
                            entries: cleanEntry(cleanedEntries),
                            lastUpdated: new Date().toISOString()
                        });
                    }
                }
            }
        } catch (cleanErr) {
            console.warn(`[ChannexSync] Warning checking previous booking dates for cleanup:`, cleanErr);
        }

        let primaryRoomTypeName = matchedOriginalBooking?.roomType || matchedOriginalBooking?.roomTypeName || "Standard Room";
        let primaryRoomNumber = matchedOriginalBooking?.roomNumber || "AUTO";

        if (matchedOriginalBooking) {
            if (!channelName || channelName.toLowerCase() === "open channel" || channelName.toLowerCase() === "ota" || channelName.toLowerCase() === "ota channel") {
                channelName = matchedOriginalBooking.channel || matchedOriginalBooking.otaName || matchedOriginalBooking.source || channelName || "OTA Channel";
            }
        }

        // Fetch cached rate plans and stay ARI overrides to enforce Stop Sell validation
        const hotelRatePlans = await getCachedRatePlans(hotelCode);

        const overridesSnap = await adminDb.collection(`hotels/${hotelCode}/ari_overrides`)
            .where("date", ">=", arrivalDate)
            .where("date", "<=", departureDate)
            .get();
        const ariOverridesMap: Record<string, any> = {};
        overridesSnap.docs.forEach((d: any) => {
            const data = d.data();
            const dateKey = data.date || d.id.replace(`${hotelCode}_`, "");
            ariOverridesMap[dateKey] = data;
        });

        // Check if any night of the booking is under STOP SELL
        let stopSellViolationDate: string | null = null;
        let stopSellRoomName: string = "";

        if (!isCancelled) {
            for (const bookedRoom of (booking.rooms || [])) {
                const mappedRoomType = roomTypes.find((rt: any) => 
                    rt.channexRoomTypeId === bookedRoom.room_type_id || 
                    rt.id === bookedRoom.room_type_id ||
                    rt.name?.toLowerCase() === (bookedRoom.room_type_id || "").toLowerCase()
                ) || roomTypes[0];

                const rPlans = hotelRatePlans.filter((rp: any) => 
                    rp.roomTypeId === mappedRoomType?.id || 
                    (Array.isArray(rp.roomTypeIds) && rp.roomTypeIds.includes(mappedRoomType?.id)) ||
                    (rp.channexRatePlanIds && typeof rp.channexRatePlanIds === "object" && Boolean(rp.channexRatePlanIds[mappedRoomType?.id])) ||
                    (rp.roomTypeName && rp.roomTypeName.trim().toLowerCase() === (mappedRoomType?.name || "").trim().toLowerCase())
                );

                const roomNights = bookedRoom.days && bookedRoom.days.length > 0 ? bookedRoom.days.length : nights;
                for (let i = 0; i < roomNights; i++) {
                    const checkDate = new Date(start);
                    checkDate.setDate(checkDate.getDate() + i);
                    const checkDateStr = checkDate.toISOString().split("T")[0];

                    const dayOverride = ariOverridesMap[checkDateStr];
                    
                    // Check if specific rate plan is stop sell or if ALL rate plans for room are stop sell
                    const isAllRatePlansStopSell = rPlans.length > 0 && rPlans.every((rp: any) => {
                        if (dayOverride?.stopSell?.[rp.id] !== undefined) {
                            return !!dayOverride.stopSell[rp.id];
                        }
                        return !!rp.stopSell;
                    });

                    // Also check if dayOverride has general stopSell matching any plan ID
                    const hasDayStopSell = dayOverride?.stopSell && Object.values(dayOverride.stopSell).some(v => v === true);

                    if (isAllRatePlansStopSell || (rPlans.length === 0 && hasDayStopSell)) {
                        stopSellViolationDate = checkDateStr;
                        stopSellRoomName = mappedRoomType?.name || "Kamar";
                        break;
                    }
                }
                if (stopSellViolationDate) break;
            }
        }

        // If booking violates Stop Sell
        if (stopSellViolationDate && !isCancelled) {
            console.warn(`[ChannexSync STOP SELL BLOCKED] Room [${stopSellRoomName}] is on STOP SELL on ${stopSellViolationDate} for Hotel [${hotelCode}]. OTA: ${channelName}, Ref: ${otaBookingId}`);

            await adminDb.collection(`hotels/${hotelCode}/channex_task_logs`).add({
                task_type: `OTA Booking Rejected (Stop Sell Active)`,
                entity: `Stop Sell Protection`,
                user: `Channex Sync Engine (${channelName})`,
                status: "STOP_SELL_BLOCKED",
                inserted_at: new Date().toISOString(),
                latency_ms: 0,
                message: `PERINGATAN KRITIS: Reservasi OTA dari ${channelName} (Ref: ${otaBookingId}, Tamu: ${guestName}) DITOLAK karena kamar [${stopSellRoomName}] sedang STOP SELL pada tanggal ${stopSellViolationDate}.`,
                ota_responses: [payload]
            });

            if (payload.is_simulation) {
                return {
                    success: false,
                    message: `DITOLAK OLEH PMS: Kamar "${stopSellRoomName}" berstatus STOP SELL pada tanggal ${stopSellViolationDate}. Reservasi simulasi tidak dapat masuk!`,
                    bookingId: otaBookingId
                };
            }
        }

        // Retrieve any existing booking revision history from daily_revenue
        let existingInitialRevId: string | undefined = undefined;
        let existingModifiedRevId: string | undefined = undefined;
        let existingCancelledRevId: string | undefined = undefined;
        let existingChannexBookingId: string | undefined = undefined;
        let existingReservationId: string | undefined = undefined;
        let existingOtaReservationId: string | undefined = undefined;

        if (matchedOriginalBooking) {
            if (matchedOriginalBooking.bookingId && matchedOriginalBooking.bookingId !== matchedOriginalBooking.revisionId) {
                existingChannexBookingId = matchedOriginalBooking.bookingId;
            } else if (matchedOriginalBooking.channexBookingId && matchedOriginalBooking.channexBookingId !== matchedOriginalBooking.revisionId) {
                existingChannexBookingId = matchedOriginalBooking.channexBookingId;
            }
            existingInitialRevId = matchedOriginalBooking.initialRevisionId || 
                ((!matchedOriginalBooking.isModified && !matchedOriginalBooking.isCancelled) ? matchedOriginalBooking.revisionId : undefined) ||
                matchedOriginalBooking.revisionId;
            existingModifiedRevId = matchedOriginalBooking.modifiedRevisionId;
            existingCancelledRevId = matchedOriginalBooking.cancelledRevisionId;
            existingReservationId = matchedOriginalBooking.reservationId;
            existingOtaReservationId = matchedOriginalBooking.otaReservationId;
        }

        try {
            // Re-use already fetched existingRevenueSnap.docs from above (ZERO extra Firestore reads!)
            for (const doc of (existingRevenueSnap ? existingRevenueSnap.docs : [])) {
                const entries = doc.data()?.entries || [];
                const match = entries.find(isMatchingBooking);
                if (match) {
                    existingInitialRevId = existingInitialRevId || match.initialRevisionId || (!match.isModified && !match.isCancelled ? match.revisionId : undefined) || match.revisionId;
                    existingModifiedRevId = existingModifiedRevId || match.modifiedRevisionId;
                    existingCancelledRevId = existingCancelledRevId || match.cancelledRevisionId;
                    if (!existingChannexBookingId) {
                        if (match.channexBookingId && match.channexBookingId !== match.revisionId) {
                            existingChannexBookingId = match.channexBookingId;
                        } else if (match.bookingId && match.bookingId !== match.revisionId) {
                            existingChannexBookingId = match.bookingId;
                        }
                    }
                    if (!existingReservationId && match.reservationId) {
                        existingReservationId = match.reservationId;
                    }
                    if (!existingOtaReservationId && match.otaReservationId) {
                        existingOtaReservationId = match.otaReservationId;
                    }
                    if (existingInitialRevId && existingChannexBookingId) break;
                }
            }
        } catch (e: any) {
            console.warn("[Channex Webhook] Error fetching previous revision IDs:", e.message);
        }

        // Process each booked room (skip creating new entries if already cancelled in existing daily records)
        if (!isCancelled || affectedDates.size === 0) {
            for (const bookedRoom of (booking.rooms || [])) {
                const mappedRoomType = roomTypes.find((rt: any) => 
                    rt.channexRoomTypeId === bookedRoom.room_type_id || 
                    rt.id === bookedRoom.room_type_id ||
                    rt.name?.toLowerCase() === (bookedRoom.room_type_id || "").toLowerCase()
                ) || roomTypes[0];

                const roomTypeName = mappedRoomType?.name || "Standard Room";
                const roomTypeId = mappedRoomType?.id || bookedRoom.room_type_id;
                primaryRoomTypeName = roomTypeName;

                // Find an available physical room number
                const physicalRooms = (mappedRoomType?.physicalRooms || []).map((r: any) => typeof r === "string" ? r : r.number || r.name).filter(Boolean);
                const assignedRoomNumber = physicalRooms[0] || "AUTO";
                primaryRoomNumber = assignedRoomNumber;

                // Check if rate plan or booking includes breakfast (USALI Package Plan)
                const bookedRatePlan = hotelRatePlans.find((rp: any) => 
                    rp.id === bookedRoom.rate_plan_id || 
                    rp.channexRatePlanId === bookedRoom.rate_plan_id ||
                    (rp.channexRatePlanIds && typeof rp.channexRatePlanIds === "object" && Object.values(rp.channexRatePlanIds).includes(bookedRoom.rate_plan_id)) ||
                    rp.code === bookedRoom.rate_plan_id
                );

                const isWithBreakfast = Boolean(
                    bookedRatePlan?.mealsIncluded ||
                    bookedRatePlan?.name?.toLowerCase().includes("breakfast") ||
                    bookedRatePlan?.name?.toLowerCase().includes("bb") ||
                    (bookedRatePlan?.code && bookedRatePlan.code.toLowerCase().endsWith("-bb")) ||
                    (booking as any).meals?.breakfast ||
                    (bookedRoom as any).meals?.breakfast
                );

                // Dynamic Breakfast Rate: from rate plan override, or hotel settings, or default 75.000 IDR
                const dynamicBreakfastRate = Number(
                    bookedRatePlan?.breakfastRate || 
                    hotelData.settings?.breakfastRate || 
                    hotelData.settings?.defaultBreakfastRate || 
                    hotelData.breakfastRate || 
                    75000
                );

                const adults = Math.max(1, Number((bookedRoom as any).occupancy?.adults || (bookedRoom as any).adults || (bookedRoom as any).occupancy || 2));

                // Divide rate per night
                const roomNights = bookedRoom.days && bookedRoom.days.length > 0 ? bookedRoom.days.length : nights;
                const avgNightlyRate = Math.round(totalPrice / roomNights);

                for (let i = 0; i < roomNights; i++) {
                    const currentDate = new Date(start);
                    currentDate.setDate(currentDate.getDate() + i);
                    const dateStr = currentDate.toISOString().split("T")[0];
                    affectedDates.add(dateStr);

                    const rawDailyAmount = bookedRoom.days && bookedRoom.days[i] ? Number(bookedRoom.days[i].amount) : avgNightlyRate;
                    const grossDailyAmount = rawDailyAmount;

                    // Calculate Commission, Promo Deductions, and Net to Hotel (Prorated per room night)
                    const dailyNetToHotel = roomNights > 0 ? Math.round(finalNetToHotel / roomNights) : finalNetToHotel;
                    const dailyCommissionAmount = roomNights > 0 ? Math.round(finalCommissionAmount / roomNights) : finalCommissionAmount;
                    const dailyPromoAmount = roomNights > 0 ? Math.round(finalPromoAmount / roomNights) : finalPromoAmount;
                    const dailyDeductions = Math.max(0, grossDailyAmount - dailyNetToHotel);

                    // If hotel accounting mode is "net", revenue recorded is net to hotel.
                    // If "gross", revenue recorded is full gross guest price.
                    const dailyAmount = revenueRecordingMode === "net" ? dailyNetToHotel : grossDailyAmount;

                    // USALI Standard 1: Package Revenue Allocation
                    // Allocate breakfast portion to F&B, remaining to Room Accommodation
                    const calculatedBreakfast = dynamicBreakfastRate * adults;
                    const breakfastAmount = isWithBreakfast ? Math.min(calculatedBreakfast, Math.round(dailyAmount * 0.45)) : 0;
                    const netRoomAmount = Math.max(0, dailyAmount - breakfastAmount);

                    const roomPayTransfer = isChannelCollect ? netRoomAmount : 0;
                    const bftPayTransfer = isChannelCollect ? breakfastAmount : 0;

                    const resolvedBookingId = (channexBookingId && channexBookingId !== revisionId)
                        ? channexBookingId
                        : (existingChannexBookingId || 
                           (matchedOriginalBooking?.bookingId && matchedOriginalBooking.bookingId !== matchedOriginalBooking.revisionId ? matchedOriginalBooking.bookingId : undefined) ||
                           (matchedOriginalBooking?.channexBookingId && matchedOriginalBooking.channexBookingId !== matchedOriginalBooking.revisionId ? matchedOriginalBooking.channexBookingId : undefined) ||
                           channexBookingId || 
                           otaBookingId);

                    const resolvedInitialRevId = existingInitialRevId || 
                        matchedOriginalBooking?.initialRevisionId || 
                        ((!matchedOriginalBooking?.isModified && !matchedOriginalBooking?.isCancelled) ? matchedOriginalBooking?.revisionId : undefined) ||
                        (!isModified && !isCancelled ? revisionId : undefined);

                    const resolvedReservationId = reservationId || existingReservationId || matchedOriginalBooking?.reservationId || otaBookingId;
                    const resolvedOtaReservationId = otaReservationId || existingOtaReservationId || matchedOriginalBooking?.otaReservationId || resolvedReservationId;

                    const entryObject = {
                        type: "accommodation",
                        guestName,
                        bookingId: resolvedBookingId,
                        channexBookingId: resolvedBookingId,
                        reservationId: resolvedReservationId,
                        revisionId: revisionId,
                        channexRevisionId: revisionId,
                        revisionEvent: payload.event,
                        initialRevisionId: resolvedInitialRevId || existingInitialRevId || revisionId,
                        modifiedRevisionId: isModified ? revisionId : (existingModifiedRevId || matchedOriginalBooking?.modifiedRevisionId || null),
                        cancelledRevisionId: isCancelled ? revisionId : (existingCancelledRevId || matchedOriginalBooking?.cancelledRevisionId || null),
                        isModified: isModified || Boolean(existingModifiedRevId || matchedOriginalBooking?.modifiedRevisionId),
                        isCancelled: isCancelled,
                        otaReservationId: resolvedOtaReservationId,
                        channel: channelName,
                        source: channelName,
                        otaName: channelName,
                        company: channelName,
                        connectionChannel: booking.channel_name || "Open Channel",
                        phone: guest.phone || "",
                        email: guest.email || "",
                        address: guest.address || "",
                        nationality: guest.country || "INDONESIA",
                        checkInDate: arrivalDate,
                        checkOutDate: departureDate,
                        effectiveDate: dateStr,
                        roomType: roomTypeName,
                        roomTypeId: roomTypeId,
                        ratePlanName: bookedRatePlan?.name || (isWithBreakfast ? `${roomTypeName} - With Breakfast` : `${roomTypeName} - Room Only`),
                        ratePlanId: bookedRoom.rate_plan_id || bookedRatePlan?.id || "",
                        rateCode: bookedRatePlan?.code || (isWithBreakfast ? "BB" : "RO"),
                        mealsIncluded: isWithBreakfast,
                        hasBreakfast: isWithBreakfast,
                        breakfastPax: isWithBreakfast ? adults : 0,
                        breakfastAmount: breakfastAmount,
                        breakfastRate: dynamicBreakfastRate,
                        pax: adults,
                        roomCount: isCancelled ? 0 : 1,
                        roomsCount: isCancelled ? 0 : 1,
                        roomNumber: assignedRoomNumber,
                        nights: 1,
                        amount: isCancelled ? 0 : netRoomAmount,
                        totalAmount: isCancelled ? 0 : netRoomAmount,
                        grossAmount: isCancelled ? 0 : grossDailyAmount,
                        netToHotel: isCancelled ? 0 : dailyNetToHotel,
                        otaCommissionPercent: commissionPercent,
                        otaCommissionAmount: isCancelled ? 0 : dailyCommissionAmount,
                        otaPromoPercent: promoDeductionPercent,
                        otaPromoAmount: isCancelled ? 0 : dailyPromoAmount,
                        totalDeductionPercent: totalDeductionPercent,
                        totalDeductionAmount: isCancelled ? 0 : dailyDeductions,
                        revenueRecordingMode: revenueRecordingMode.toUpperCase(),
                        reconStatus: "PENDING_RECON",
                        paidCash: 0,
                        paidAmount1: 0,
                        paidTransfer: roomPayTransfer,
                        paidAmount2: roomPayTransfer,
                        paidOta: roomPayTransfer,
                        paymentMethod: isChannelCollect ? "Channel Collect (OTA Collect / VCC)" : "Property Collect (Pay at Hotel)",
                        paymentCollect: isChannelCollect ? "channel" : "property",
                        paymentType: booking.payment_type || (isChannelCollect ? "virtual_card" : "cash"),
                        paymentStatus: isCancelled ? "CANCELLED" : paymentStatus,
                        payHotel: 0,
                        payTransfer: roomPayTransfer,
                        status: isCancelled ? "CANCELLED" : finalStatus,
                        propertyName,
                        currency: propertyCurrency,
                        staffName: "Channex Channel Manager",
                        note: `OTA Booking via ${channelName}. Ref: ${otaBookingId}.${isWithBreakfast ? ' [USALI Room Charge (Net of Breakfast)]' : ''} [Recon: ${revenueRecordingMode === 'net' ? 'Net-to-Hotel' : 'Gross'}] ${isCancelled ? '[CANCELLED]' : ''} ${booking.notes || ""}`.trim(),
                        timestamp: new Date().toISOString(),
                        isOTA: true,
                        channexRaw: {
                            eventId: payload.event || "booking",
                            insertedAt: payload.inserted_at || new Date().toISOString()
                        }
                    };

                    const cleanEntry = (entry: any) => JSON.parse(JSON.stringify(entry, (_, v) => (v === undefined ? null : v)));
                    const entriesToAdd: any[] = [cleanEntry(entryObject)];

                    if (isWithBreakfast && breakfastAmount > 0) {
                        const breakfastEntry = {
                            type: "other_income",
                            department: "F&B",
                            category: "F&B",
                            subCategory: "breakfast",
                            revenueType: "breakfast",
                            guestName: `${guestName} (Breakfast Package)`,
                            rawGuestName: guestName,
                            bookingId: `${otaBookingId}-BFT`,
                            parentBookingId: otaBookingId,
                            channexBookingId: resolvedBookingId,
                            phone: guest.phone || "",
                            email: guest.email || "",
                            nationality: guest.country || "INDONESIA",
                            company: channelName,
                            checkInDate: arrivalDate,
                            checkOutDate: departureDate,
                            effectiveDate: dateStr,
                            roomType: roomTypeName,
                            roomNumber: assignedRoomNumber,
                            description: `Package Breakfast (${adults} Pax) - ${roomTypeName}`,
                            amount: isCancelled ? 0 : breakfastAmount,
                            pax: adults,
                            source: "OTA Package",
                            channel: channelName,
                            voucherCode: otaBookingId,
                            payHotel: 0,
                            payTransfer: bftPayTransfer,
                            paidCash: 0,
                            paidAmount1: 0,
                            paidTransfer: bftPayTransfer,
                            paidAmount2: bftPayTransfer,
                            status: isCancelled ? "CANCELLED" : finalStatus,
                            paymentStatus: isCancelled ? "CANCELLED" : paymentStatus,
                            paymentCollect: isChannelCollect ? "channel" : "property",
                            paymentType: booking.payment_type || (isChannelCollect ? "virtual_card" : "cash"),
                            paymentMethod: isChannelCollect ? "Channel Collect (OTA Collect / VCC)" : "Property Collect (Pay at Hotel)",
                            timestamp: new Date().toISOString(),
                            isBreakfastPackage: true,
                            isOTA: true,
                            note: `USALI Package Allocation: Breakfast for ${adults} pax included in room package (${channelName})`,
                        };
                        entriesToAdd.push(cleanEntry(breakfastEntry));
                    }

                    const dailyDocRef = adminDb.collection(`hotels/${hotelCode}/daily_revenue`).doc(`${hotelCode}_${dateStr}`);
                    const dailyDoc = await dailyDocRef.get();

                    if (dailyDoc.exists) {
                        const existingEntries = dailyDoc.data()?.entries || [];
                        const filteredEntries = existingEntries.filter((e: any) => !isMatchingBooking(e));
                        filteredEntries.push(...entriesToAdd);

                        await dailyDocRef.update({
                            entries: cleanEntry(filteredEntries),
                            date: dateStr,
                            lastUpdated: new Date().toISOString()
                        });
                    } else {
                        await dailyDocRef.set({
                            entries: cleanEntry(entriesToAdd),
                            date: dateStr,
                            hotelId: hotelCode,
                            createdAt: new Date().toISOString()
                        });
                    }
                }
            }
        }

        // 2. AUDIT TRAIL LOGGING (Save to channex_task_logs for Audit / Action Logs Tab)
        try {
            const taskType = isCancelled 
                ? `OTA Booking Cancellation (${channelName})` 
                : (event === "booking_modification" ? `OTA Booking Modification (${channelName})` : `OTA New Booking (${channelName})`);
            
            await adminDb.collection(`hotels/${hotelCode}/channex_task_logs`).add({
                task_type: taskType,
                user: `Channex Webhook (${channelName})`,
                status: "SUCCESS",
                inserted_at: new Date().toISOString(),
                entity: "ota_booking",
                message: `${taskType}: Tamu "${guestName}" (${channelName}) | Periode: ${arrivalDate} s/d ${departureDate} | Kamar: ${primaryRoomTypeName} (${primaryRoomNumber}) | Ref: ${otaBookingId} | Total: ${formatCurrencyAmount(totalRecordedRevenue, propertyCurrency)} (${revenueRecordingMode.toUpperCase() === 'NET' ? 'Nett' : 'Gross'})`,
                ota_responses: [{
                    ota: channelName,
                    status: isCancelled ? "CANCELLED" : "CONFIRMED",
                    code: 200,
                    message: `Booking Ref: ${otaBookingId} | Tamu: ${guestName} | Tipe: ${primaryRoomTypeName}`
                }]
            });
            console.log(`[ChannexSync] Successfully logged Audit Trail for ${taskType} [${otaBookingId}]`);
        } catch (logErr) {
            console.warn("[ChannexSync] Warning recording webhook task log:", logErr);
        }

        // Trigger Availability recalculation & push back to Channex across all affected dates (both old & new)
        try {
            const sortedDates = Array.from(affectedDates).sort();
            const minDate = sortedDates[0] || arrivalDate;
            const maxDate = sortedDates[sortedDates.length - 1] || departureDate;
            await this.recalculateAndPushAvailability(hotelCode, minDate, maxDate);
        } catch (pushErr) {
            console.error("[ChannexSync] Failed to push updated availability after booking:", pushErr);
        }

        // Send Mandatory Channex Booking Acknowledgement (Certification Stage 5 Requirement)
        const ackRevisionId = payload.booking_revision_id || (payload.booking as any)?.revision_id || (booking as any)?.revision_id || booking.id;
        const isUuid = Boolean(ackRevisionId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ackRevisionId));

        if (ackRevisionId && isUuid && !ackRevisionId.startsWith("rev_") && !payload.is_simulation) {
            try {
                const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
                const hotelData = hotelDoc.data();
                const customApiKey = hotelData?.channelManager?.apiKey || process.env.CHANNEX_API_KEY;
                const env = hotelData?.channelManager?.environment || (process.env.CHANNEX_ENV as any) || "staging";
                await channexClient.acknowledgeBooking(ackRevisionId, customApiKey, env);
                console.log(`[ChannexSync] Successfully sent Booking Acknowledge (ACK) for revision: ${ackRevisionId}`);
            } catch (ackErr: any) {
                console.warn(`[ChannexSync] Warning: Failed to send ACK for booking revision ${ackRevisionId}:`, ackErr.message);
            }
        } else if (payload.is_simulation || (revisionId && !isUuid)) {
            console.log(`[ChannexSync] Simulated revision ${revisionId}: ACK processed locally (skipping external Channex call).`);
        }

        const totalGross = isExtranetNetRate
            ? (totalDeductionPercentCalc > 0 ? Math.round(totalPrice / Math.max(0.01, 1 - (totalDeductionPercentCalc / 100))) : totalPrice)
            : (totalPrice || Number(matchedOriginalBooking?.grossAmount || matchedOriginalBooking?.totalAmount || matchedOriginalBooking?.amount) || 0);
        const totalCommission = finalCommissionAmount;
        const totalPromo = finalPromoAmount;
        const totalDeductions = finalTotalDeductions;
        const totalNetToHotel = finalNetToHotel;
        const totalRecordedRevenue = revenueRecordingMode === "net" ? totalNetToHotel : totalGross;
        const effectiveGuestName = (guestName && guestName !== "OTA Guest" && guestName !== "Tamu OTA")
            ? guestName
            : (matchedOriginalBooking?.guestName || guestName || "Tamu OTA");
        const effectiveChannelName = (channelName && channelName.toLowerCase() !== "open channel" && channelName.toLowerCase() !== "ota" && channelName.toLowerCase() !== "ota channel")
            ? channelName
            : (matchedOriginalBooking?.channel || matchedOriginalBooking?.otaName || matchedOriginalBooking?.source || "OTA Channel");
        const effectiveRoomName = (primaryRoomTypeName && primaryRoomTypeName !== "Standard Room" && primaryRoomTypeName !== "Kamar Hotel")
            ? primaryRoomTypeName
            : (matchedOriginalBooking?.roomType || matchedOriginalBooking?.roomTypeName || primaryRoomTypeName || "Standard Room");

        return {
            success: true,
            message: `Booking ${otaBookingId} (${isCancelled ? 'CANCELLED' : (isModified ? 'MODIFIED' : event)}) for ${effectiveGuestName} processed successfully into Hotel [${hotelCode}].`,
            bookingId: otaBookingId,
            isCancelled,
            isModified,
            previousStay,
            bookingDetails: {
                guestName: effectiveGuestName,
                guestPhone: guest.phone || matchedOriginalBooking?.phone || "",
                guestEmail: guest.email || matchedOriginalBooking?.email || "",
                channelName: effectiveChannelName,
                roomName: effectiveRoomName,
                roomCount: booking.rooms?.length || matchedOriginalBooking?.roomCount || 1,
                arrivalDate: arrivalDate || matchedOriginalBooking?.checkInDate || previousStay?.arrivalDate || "-",
                departureDate: departureDate || matchedOriginalBooking?.checkOutDate || previousStay?.departureDate || "-",
                eta: eta || matchedOriginalBooking?.eta || "",
                totalPrice: totalRecordedRevenue,
                grossPrice: totalGross,
                netToHotel: totalNetToHotel,
                recordedRevenue: totalRecordedRevenue,
                revenueRecordingMode: revenueRecordingMode.toUpperCase(),
                currency: propertyCurrency,
                nights: nights || matchedOriginalBooking?.nights || 1,
                isCancelled,
                isModified,
                previousArrivalDate: previousStay?.arrivalDate,
                previousDepartureDate: previousStay?.departureDate
            },
            financials: {
                guestPaidGross: totalGross,
                otaCommissionPercent: finalCommissionPercent,
                otaCommissionAmount: totalCommission,
                otaPromoPercent: finalPromoPercent,
                otaPromoAmount: totalPromo,
                totalDeductions,
                netToHotel: totalNetToHotel,
                vccBalance: hasVccBalance ? vccBalanceRaw : null,
                isWholesalerNet: isWholesaler,
                recordedRevenue: totalRecordedRevenue,
                revenueRecordingMode: revenueRecordingMode.toUpperCase(),
                currency: propertyCurrency
            }
        };
    }

    /**
     * Recalculates occupied inventory and pushes fresh availability to Channex for all room types across a date range
     */
    async recalculateAndPushAvailability(hotelCode: string, startDateStr: string, endDateStr: string): Promise<any> {
        const hotelData = await getCachedHotelData(hotelCode);
        if (!hotelData) return null;
        const channexPropertyId = hotelData?.channexPropertyId || 
            hotelData?.channelManager?.channexPropertyId || 
            hotelData?.channelManager?.propertyId;

        if (!channexPropertyId) {
            console.log(`[ChannexSync] Hotel ${hotelCode} has no channexPropertyId configured. Skipping availability push.`);
            return null;
        }

        const todayStr = new Date().toISOString().split("T")[0];
        // Never send past dates — Channex rejects them
        if (endDateStr < todayStr) {
            console.log(`[ChannexSync] Entire requested range is in the past (${startDateStr} s/d ${endDateStr}). Skipping push to Channex.`);
            return null;
        }

        const effectiveStartStr = startDateStr < todayStr ? todayStr : startDateStr;
        const start = new Date(effectiveStartStr);
        const end = new Date(endDateStr);

        const roomTypes = await getCachedRoomTypes(hotelCode);

        const availabilityValues: any[] = [];

        // Query daily revenue documents in date range
        const dailySnap = await adminDb.collection(`hotels/${hotelCode}/daily_revenue`)
            .where("date", ">=", effectiveStartStr)
            .where("date", "<=", endDateStr)
            .get();

        const dailyMap: Record<string, any[]> = {};
        dailySnap.docs.forEach((d: any) => {
            const data = d.data();
            dailyMap[data.date] = data.entries || [];
        });

        // Query ari_overrides in date range (for inventory and rate overrides from Tara PMS grid)
        const overridesSnap = await adminDb.collection(`hotels/${hotelCode}/ari_overrides`)
            .where("date", ">=", effectiveStartStr)
            .where("date", "<=", endDateStr)
            .get();

        const overridesMap: Record<string, any> = {};
        overridesSnap.docs.forEach((d: any) => {
            const data = d.data();
            overridesMap[data.date] = data;
        });

        for (const rt of roomTypes as any[]) {
            const channexRoomTypeId = rt.channexRoomTypeId || rt.id;
            const totalAllotment = parseInt(rt.roomCount) || parseInt(rt.totalRooms) || (rt.physicalRooms?.length || 1);
            const dailySlots: Array<{ dateStr: string; qty: number }> = [];

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split("T")[0];
                const dayEntries = dailyMap[dateStr] || [];
                const dayOverride = overridesMap[dateStr];

                // Count occupied valid rooms
                const occupiedCount = dayEntries.reduce((acc: number, e: any) => {
                    const isCancelled = e.status === "CANCELLED" || e.status === "VOID" || e.status === "CANCEL" || e.paymentStatus === "CANCELLED" || e.paymentStatus === "CANCEL" || e.isDeleted || e.isHidden || Number(e.roomCount) === 0;
                    const isAcc = e.type === "accommodation" || (!e.type && e.guestName && !e.guestName.startsWith("POS Order"));
                    if (isCancelled || !isAcc) return acc;
                    const isRoomMatch = (e.roomTypeId === rt.id || e.roomType?.toLowerCase() === rt.name?.toLowerCase());
                    if (!isRoomMatch) return acc;
                    const count = Math.max(1, Number(e.roomsCount || e.roomCount) || 1);
                    return acc + count;
                }, 0);

                let availableQty = Math.max(0, totalAllotment - occupiedCount);
                if (dayOverride?.inventoryOverrides && dayOverride.inventoryOverrides[rt.id] !== undefined) {
                    availableQty = Number(dayOverride.inventoryOverrides[rt.id]);
                }

                dailySlots.push({ dateStr, qty: availableQty });
            }

            // Run-length range compression
            const compressed = compressAvailabilityRanges(dailySlots, channexPropertyId, channexRoomTypeId);
            availabilityValues.push(...compressed);
        }

        if (availabilityValues.length > 0) {
            const payload: ChannexAvailabilityPayload = { values: availabilityValues };
            console.log(`[ChannexSync] Pushing ${availabilityValues.length} compressed availability ranges to Channex for Property ${channexPropertyId}`);
            const hotelData = hotelDoc.data();
            const customApiKey = hotelData?.channelManager?.apiKey || process.env.CHANNEX_API_KEY;
            const env = hotelData?.channelManager?.environment || hotelData?.channelManager?.env || (process.env.CHANNEX_ENV as any) || "staging";
            // Throttle to respect Channex 10 availability req/min limit
            await throttleAriCall(channexPropertyId);
            return await channexClient.pushAvailability(payload, customApiKey, env);
        }

        return null;
    }

    /**
     * Pushes Rate Updates (BAR / Daily Rates) to Channex
     */
    async pushRateUpdate(hotelCode: string, ratePlanId: string, dateFrom: string, dateTo: string, rate: number, restrictions?: any): Promise<any> {
        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        const hotelData = hotelDoc.data();
        const channexPropertyId = hotelData?.channexPropertyId || hotelData?.channelManager?.channexPropertyId;
        const customApiKey = hotelData?.channelManager?.apiKey || process.env.CHANNEX_API_KEY;
        const env = hotelData?.channelManager?.environment || hotelData?.channelManager?.env || (process.env.CHANNEX_ENV as any) || "staging";
        const hotelCurrency = (hotelData?.currency || hotelData?.channelManager?.currency || "IDR").toUpperCase();

        if (!channexPropertyId) {
            console.log(`[ChannexSync] Hotel ${hotelCode} has no channexPropertyId configured. Skipping rate push.`);
            return null;
        }

        const todayStr = new Date().toISOString().split("T")[0];
        if (dateTo < todayStr) {
            console.log(`[ChannexSync] Skipping rate push for past dates (${dateFrom} s/d ${dateTo}) as Channex rejects past dates.`);
            return null;
        }
        const effectiveDateFrom = dateFrom < todayStr ? todayStr : dateFrom;

        const payload: ChannexRestrictionsPayload = {
            values: [
                {
                    property_id: channexPropertyId,
                    rate_plan_id: ratePlanId,
                    date_from: effectiveDateFrom,
                    date_to: dateTo,
                    rate: formatRateForChannex(Number(rate), hotelCurrency),
                    min_stay_arrival: restrictions?.minStayArrival ?? restrictions?.minStayThrough ?? restrictions?.minStay ?? 1,
                    min_stay_through: restrictions?.minStayThrough ?? restrictions?.minStayArrival ?? restrictions?.minStay ?? 1,
                    max_stay: restrictions?.maxStay !== undefined && restrictions?.maxStay !== null ? Number(restrictions.maxStay) : 0,
                    stop_sell: !!restrictions?.stopSell,
                    closed_to_arrival: !!restrictions?.closedToArrival,
                    closed_to_departure: !!restrictions?.closedToDeparture
                }
            ]
        };

        console.log(`[ChannexSync] Pushing Rate update to Channex for Rate Plan ${ratePlanId} (${effectiveDateFrom} - ${dateTo}): ${hotelCurrency} ${rate}`);
        await throttleAriCall(channexPropertyId);
        const result = await channexClient.pushRestrictions(payload, customApiKey, env);
        const taskId = result?.data?.[0]?.id || result?.data?.id;
        return { ...result, taskId };
    }

    /**
     * Delta Batch Push for Staged UI Edits (Compliance with Channex Rate Limits & 1-Call Standard)
     * Batches all rate, min_stay (arrival & through), max_stay, stop_sell, CTA, CTD updates into 1 call to /restrictions
     * Batches all inventory allotment updates into 1 call to /availability
     */
    async pushDeltaBatch(hotelCode: string, deltaPayload: {
        rates?: Array<{
            ratePlanId: string;
            roomTypeId?: string;
            date?: string;
            dateFrom?: string;
            dateTo?: string;
            rate?: number;
            minStay?: number;
            minStayArrival?: number;
            minStayThrough?: number;
            maxStay?: number;
            stopSell?: boolean;
            closedToArrival?: boolean;
            closedToDeparture?: boolean;
            days?: Array<"mo" | "tu" | "we" | "th" | "fr" | "sa" | "su">;
        }>;
        availability?: Array<{
            roomTypeId: string;
            date?: string;
            dateFrom?: string;
            dateTo?: string;
            qty: number;
        }>;
    }, options?: { skipLog?: boolean }): Promise<{
        success: boolean;
        skipped?: boolean;
        taskIds: string[];
        restrictionsTaskId?: string;
        availabilityTaskId?: string;
        latencyMs: number;
        message: string;
    }> {
        const startTime = Date.now();
        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        if (!hotelDoc.exists) {
            throw new Error(`Hotel [${hotelCode}] not found`);
        }

        const hotelData = hotelDoc.data();
        const channexPropertyId = hotelData?.channexPropertyId || hotelData?.channelManager?.channexPropertyId || hotelData?.channelManager?.propertyId;
        const customApiKey = hotelData?.channelManager?.apiKey || process.env.CHANNEX_API_KEY;
        const env = hotelData?.channelManager?.environment || hotelData?.channelManager?.env || (process.env.CHANNEX_ENV as any) || "staging";

        if (!channexPropertyId) {
            return {
                success: true,
                skipped: true,
                taskIds: [],
                latencyMs: Date.now() - startTime,
                message: `Pembaruan tersimpan di database internal CRS. Saluran OTA belum dikonfigurasi pada properti [${hotelCode}].`
            };
        }

        // Fetch Room Types and Rate Plans to resolve channex IDs if needed
        const roomTypesSnap = await adminDb.collection(`hotels/${hotelCode}/roomTypes`).get();
        const roomTypes = roomTypesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const ratePlansSnap = await adminDb.collection(`hotels/${hotelCode}/ratePlans`).get();
        const ratePlans = ratePlansSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const taskIds: string[] = [];
        let restrictionsTaskId: string | undefined;
        let availabilityTaskId: string | undefined;

        const hotelCurrency = (hotelData?.channelManager?.currency || hotelData?.currency || "USD").toUpperCase();

        const isUuid = (val?: string) => typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

        // 1. Process Restrictions & Rates Batch
        const rateItems = deltaPayload.rates || [];
        if (rateItems.length > 0) {
            const restrictionValues: any[] = [];
            for (const r of rateItems) {
                let channexRatePlanId: string | undefined;

                if (isUuid(r.ratePlanId)) {
                    channexRatePlanId = r.ratePlanId;
                } else {
                    let rp: any = ratePlans.find((p: any) => 
                        p.id === r.ratePlanId || 
                        (p as any).channexRatePlanId === r.ratePlanId ||
                        (p.channexRatePlanIds && typeof p.channexRatePlanIds === "object" && Object.values(p.channexRatePlanIds).includes(r.ratePlanId))
                    );

                    if (rp) {
                        if (r.roomTypeId) {
                            if (rp.channexRatePlanIds?.[r.roomTypeId]) {
                                channexRatePlanId = rp.channexRatePlanIds[r.roomTypeId];
                            } else {
                                const matchedLocalRt = roomTypes.find((t: any) => t.id === r.roomTypeId || (t as any).channexRoomTypeId === r.roomTypeId);
                                if (matchedLocalRt && rp.channexRatePlanIds?.[matchedLocalRt.id]) {
                                    channexRatePlanId = rp.channexRatePlanIds[matchedLocalRt.id];
                                } else if (matchedLocalRt && (matchedLocalRt as any).channexRoomTypeId && rp.channexRatePlanIds?.[(matchedLocalRt as any).channexRoomTypeId]) {
                                    channexRatePlanId = rp.channexRatePlanIds[(matchedLocalRt as any).channexRoomTypeId];
                                }
                            }
                        }

                        if (!channexRatePlanId && rp.channexRatePlanId) {
                            channexRatePlanId = rp.channexRatePlanId;
                        }

                        if (!channexRatePlanId && rp.channexRatePlanIds && typeof rp.channexRatePlanIds === "object") {
                            channexRatePlanId = Object.values(rp.channexRatePlanIds)[0] as string;
                        }
                    } else {
                        // Check if r.ratePlanId is compound key: `${roomTypeId}_${actualRpId}`
                        for (const p of ratePlans as any[]) {
                            if (r.ratePlanId.endsWith(`_${p.id}`)) {
                                const rtId = r.ratePlanId.substring(0, r.ratePlanId.length - p.id.length - 1);
                                rp = p;
                                channexRatePlanId = p.channexRatePlanIds?.[rtId] || p.channexRatePlanId;
                                break;
                            }
                        }
                    }
                }

                if (!channexRatePlanId) {
                    channexRatePlanId = r.ratePlanId;
                }

                const valObj: any = {
                    property_id: channexPropertyId,
                    rate_plan_id: channexRatePlanId
                };

                if (r.date) {
                    valObj.date = r.date;
                } else if (r.dateFrom && r.dateTo) {
                    valObj.date_from = r.dateFrom;
                    valObj.date_to = r.dateTo;
                }

                if (r.days && Array.isArray(r.days) && r.days.length > 0 && r.days.length < 7) {
                    valObj.days = r.days;
                }

                if (r.rate !== undefined && r.rate !== null) {
                    valObj.rate = formatRateForChannex(Number(r.rate), hotelCurrency);
                }
                
                // Dual Min-Stay Synchronization (Both min_stay_arrival and min_stay_through must always be set)
                const resolvedMinStay = r.minStayThrough ?? r.minStayArrival ?? r.minStay;
                if (resolvedMinStay !== undefined && resolvedMinStay !== null) {
                    valObj.min_stay_arrival = Number(r.minStayArrival !== undefined && r.minStayArrival !== null ? r.minStayArrival : resolvedMinStay);
                    valObj.min_stay_through = Number(r.minStayThrough !== undefined && r.minStayThrough !== null ? r.minStayThrough : resolvedMinStay);
                } else if (resolvedMinStay === null) {
                    valObj.min_stay_arrival = null;
                    valObj.min_stay_through = null;
                }

                // Max Stay
                if (r.maxStay !== undefined && r.maxStay !== null) {
                    valObj.max_stay = Number(r.maxStay);
                } else if (r.maxStay === null) {
                    valObj.max_stay = null;
                }

                if (r.stopSell !== undefined) valObj.stop_sell = Boolean(r.stopSell);
                if (r.closedToArrival !== undefined) valObj.closed_to_arrival = Boolean(r.closedToArrival);
                if (r.closedToDeparture !== undefined) valObj.closed_to_departure = Boolean(r.closedToDeparture);

                restrictionValues.push(valObj);
            }

            try {
                if (restrictionValues.length > 0) {
                    // Compress single-date sequences into merged date_from and date_to ranges (Channex Standard)
                    const compressedRestrictions = compressRestrictionRanges(restrictionValues);
                    await throttleAriCall(channexPropertyId);
                    console.log(`[ChannexSync] Executing Delta Batch Restrictions (${compressedRestrictions.length} items compressed from ${restrictionValues.length}) in 1 API call...`);
                    const restRes = await channexClient.pushRestrictions({ values: compressedRestrictions }, customApiKey, env);
                    restrictionsTaskId = restRes?.data?.[0]?.id || restRes?.data?.id;
                    if (restrictionsTaskId) taskIds.push(restrictionsTaskId);
                }
            } catch (restErr: any) {
                console.error(`[ChannexSync] Restrictions push error for Hotel [${hotelCode}]:`, restErr?.message);
                return {
                    success: false,
                    taskIds,
                    restrictionsTaskId,
                    availabilityTaskId,
                    latencyMs: Date.now() - startTime,
                    message: restErr?.message || "Gagal mengirim restriksi tarif ke Channex."
                };
            }
        }

        // 2. Process Availability Batch
        const availItems = deltaPayload.availability || [];
        if (availItems.length > 0) {
            const availValues: any[] = [];
            for (const a of availItems) {
                let channexRoomTypeId: string | undefined;

                if (isUuid(a.roomTypeId)) {
                    channexRoomTypeId = a.roomTypeId;
                } else {
                    const rt: any = roomTypes.find((t: any) => t.id === a.roomTypeId || (t as any).channexRoomTypeId === a.roomTypeId);
                    channexRoomTypeId = rt?.channexRoomTypeId || a.roomTypeId;
                }

                const valObj: any = {
                    property_id: channexPropertyId,
                    room_type_id: channexRoomTypeId,
                    availability: Math.max(0, Math.round(Number(a.qty)))
                };

                if (a.date) {
                    valObj.date = a.date;
                } else if (a.dateFrom && a.dateTo) {
                    valObj.date_from = a.dateFrom;
                    valObj.date_to = a.dateTo;
                }

                availValues.push(valObj);
            }

            try {
                if (availValues.length > 0) {
                    // Compress availability if any single date items are consecutive (safe from underscore collision)
                    const alreadyAvailRanges: any[] = [];
                    const singleAvailMap: Map<string, { propertyId: string; roomTypeId: string; list: Array<{ dateStr: string; qty: number }> }> = new Map();
                    availValues.forEach(a => {
                        if (a.date_from && a.date_to) {
                            alreadyAvailRanges.push(a);
                        } else if (a.date) {
                            const mapKey = `${a.property_id}:::${a.room_type_id}`;
                            if (!singleAvailMap.has(mapKey)) {
                                singleAvailMap.set(mapKey, { propertyId: a.property_id, roomTypeId: a.room_type_id, list: [] });
                            }
                            singleAvailMap.get(mapKey)!.list.push({ dateStr: a.date, qty: a.availability });
                        } else {
                            alreadyAvailRanges.push(a);
                        }
                    });
                    const compressedAvail = [...alreadyAvailRanges];
                    singleAvailMap.forEach(({ propertyId, roomTypeId, list }) => {
                        list.sort((x, y) => (x.dateStr < y.dateStr ? -1 : 1));
                        compressedAvail.push(...compressAvailabilityRanges(list, propertyId, roomTypeId));
                    });

                    await throttleAriCall(channexPropertyId);
                    console.log(`[ChannexSync] Executing Delta Batch Availability (${compressedAvail.length} items compressed from ${availValues.length}) in 1 API call...`);
                    const availRes = await channexClient.pushAvailability({ values: compressedAvail }, customApiKey, env);
                    availabilityTaskId = availRes?.data?.[0]?.id || availRes?.data?.id;
                    if (availabilityTaskId) taskIds.push(availabilityTaskId);
                }
            } catch (availErr: any) {
                console.error(`[ChannexSync] Availability push error for Hotel [${hotelCode}]:`, availErr?.message);
                return {
                    success: false,
                    taskIds,
                    restrictionsTaskId,
                    availabilityTaskId,
                    latencyMs: Date.now() - startTime,
                    message: availErr?.message || "Gagal mengirim ketersediaan kamar ke Channex."
                };
            }
        }

        const latencyMs = Date.now() - startTime;

        // Log to channex_task_logs (skip duplicate write if caller handles user-level logging)
        if (!options?.skipLog) {
            try {
                await adminDb.collection(`hotels/${hotelCode}/channex_task_logs`).add({
                    task_type: "POST /delta_sync (Batch Standard)",
                    entity: `Delta Update: ${rateItems.length} rates/restrictions, ${availItems.length} inventory slots`,
                    user: "Channex Sync Engine",
                    status: "SUCCESS",
                    inserted_at: new Date().toISOString(),
                    latency_ms: latencyMs,
                    task_ids: taskIds,
                    message: `Delta Batch update completed in ${taskIds.length} API call(s). Task IDs: ${taskIds.join(", ")}`,
                    ota_responses: []
                });
            } catch (logErr) {
                console.warn("Could not save delta task log:", logErr);
            }
        }

        return {
            success: true,
            taskIds,
            restrictionsTaskId,
            availabilityTaskId,
            latencyMs,
            message: `Delta Batch sync successful (${latencyMs}ms). Task IDs: ${taskIds.join(", ") || "OK"}`
        };
    }

    /**
     * Stage 3 Certification Requirement: Full Property Sync (2-Call Exact Standard, 500 Days)
     */
    async fullPropertySync(hotelCode: string, daysAhead: number = 500): Promise<{
        success: boolean;
        taskIds: string[];
        availabilityTaskId?: string;
        restrictionsTaskId?: string;
        availabilityCount: number;
        restrictionsCount: number;
        latencyMs: number;
        message: string;
    }> {
        const startTime = Date.now();
        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        if (!hotelDoc.exists) {
            throw new Error(`Hotel [${hotelCode}] not found`);
        }

        const hotelData = hotelDoc.data();
        const channexPropertyId = hotelData?.channexPropertyId || hotelData?.channelManager?.channexPropertyId || hotelData?.channelManager?.propertyId;
        const customApiKey = hotelData?.channelManager?.apiKey || process.env.CHANNEX_API_KEY;
        const env = hotelData?.channelManager?.environment || hotelData?.channelManager?.env || (process.env.CHANNEX_ENV as any) || "staging";

        if (!channexPropertyId) {
            return {
                taskIds: [],
                availabilityCount: 0,
                restrictionsCount: 0,
                latencyMs: Date.now() - startTime,
                message: `Pembaruan tersimpan di database internal CRS. Saluran OTA belum dikonfigurasi pada properti [${hotelCode}].`
            };
        }

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + daysAhead);

        const startDateStr = startDate.toISOString().split("T")[0];
        const endDateStr = endDate.toISOString().split("T")[0];

        // 1. Fetch Room Types and Rate Plans (Cached for scale)
        const roomTypes = await getCachedRoomTypes(hotelCode);
        const ratePlans = await getCachedRatePlans(hotelCode);

        // 2. Fetch all daily_revenue in range
        const dailySnap = await adminDb.collection(`hotels/${hotelCode}/daily_revenue`)
            .where("date", ">=", startDateStr)
            .where("date", "<=", endDateStr)
            .get();

        const dailyMap: Record<string, any[]> = {};
        dailySnap.docs.forEach((d: any) => {
            const data = d.data();
            dailyMap[data.date] = data.entries || [];
        });

        // Query ari_overrides in date range
        const overridesSnap = await adminDb.collection(`hotels/${hotelCode}/ari_overrides`)
            .where("date", ">=", startDateStr)
            .where("date", "<=", endDateStr)
            .get();

        const overridesMap: Record<string, any> = {};
        overridesSnap.docs.forEach((d: any) => {
            const data = d.data();
            overridesMap[data.date] = data;
        });

        // 3. Build Availability Payload (Call 1)
        const availabilityValues: any[] = [];
        for (const rt of roomTypes as any[]) {
            const channexRoomTypeId = rt.channexRoomTypeId || rt.id;
            const totalAllotment = parseInt(rt.roomCount) || parseInt(rt.totalRooms) || (rt.physicalRooms?.length || 1);
            const dailySlots: Array<{ dateStr: string; qty: number }> = [];

            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split("T")[0];
                const dayEntries = dailyMap[dateStr] || [];
                const dayOverride = overridesMap[dateStr];

                const occupiedCount = dayEntries.reduce((acc: number, e: any) => {
                    const isCancelled = e.status === "CANCELLED" || e.status === "VOID" || e.status === "CANCEL" || e.paymentStatus === "CANCELLED" || e.paymentStatus === "CANCEL" || e.isDeleted || e.isHidden || Number(e.roomCount) === 0;
                    const isAcc = e.type === "accommodation" || (!e.type && e.guestName && !e.guestName.startsWith("POS Order"));
                    if (isCancelled || !isAcc) return acc;
                    const isRoomMatch = (e.roomTypeId === rt.id || e.roomType?.toLowerCase() === rt.name?.toLowerCase());
                    if (!isRoomMatch) return acc;
                    const count = Math.max(1, Number(e.roomsCount || e.roomCount) || 1);
                    return acc + count;
                }, 0);

                let availableQty = Math.max(0, totalAllotment - occupiedCount);
                if (dayOverride?.inventoryOverrides && dayOverride.inventoryOverrides[rt.id] !== undefined) {
                    availableQty = Number(dayOverride.inventoryOverrides[rt.id]);
                }

                dailySlots.push({ dateStr, qty: availableQty });
            }

            const compressed = compressAvailabilityRanges(dailySlots, channexPropertyId, channexRoomTypeId);
            availabilityValues.push(...compressed);
        }

        const hotelCurrency = (hotelData?.currency || hotelData?.channelManager?.currency || "IDR").toUpperCase();

        // 4. Build Restrictions / Rates Payload (Call 2)
        const restrictionValues: any[] = [];
        for (const rp of ratePlans as any[]) {
            const minStay = Number(rp.minStay || 1);
            const stopSell = !!rp.stopSell;
            const closedToArrival = !!rp.closedToArrival;
            const closedToDeparture = !!rp.closedToDeparture;

            // Determine all room-type targets for this rate plan
            const planTargets: Array<{ roomTypeId?: string; channexRateId: string }> = [];
            if (rp.channexRatePlanIds && typeof rp.channexRatePlanIds === "object" && Object.keys(rp.channexRatePlanIds).length > 0) {
                for (const [rtId, cId] of Object.entries(rp.channexRatePlanIds)) {
                    if (cId) planTargets.push({ roomTypeId: rtId, channexRateId: cId as string });
                }
            } else if (rp.channexRatePlanId) {
                planTargets.push({ roomTypeId: rp.roomTypeId, channexRateId: rp.channexRatePlanId });
            } else if (rp.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rp.id)) {
                planTargets.push({ roomTypeId: rp.roomTypeId, channexRateId: rp.id });
            }

            for (const target of planTargets) {
                const targetChannexRateId = target.channexRateId;
                const targetRoomTypeId = target.roomTypeId;
                const basePrice = Number(
                    rp.roomRates?.[targetRoomTypeId || ""] ?? 
                    rp.baseRate ?? 
                    rp.basePrice ?? 
                    rp.rate ?? 
                    (hotelCurrency === "IDR" ? 500000 : 100)
                );
                const formattedBaseRate = formatRateForChannex(basePrice, hotelCurrency);
                const baseMaxStay = rp.maxStay !== undefined && rp.maxStay !== null ? Number(rp.maxStay) : 0;

                // Base broad range across the sync window
                restrictionValues.push({
                    property_id: channexPropertyId,
                    rate_plan_id: targetChannexRateId,
                    date_from: startDateStr,
                    date_to: endDateStr,
                    rate: formattedBaseRate,
                    min_stay_arrival: minStay,
                    min_stay_through: minStay,
                    max_stay: baseMaxStay,
                    stop_sell: stopSell,
                    closed_to_arrival: closedToArrival,
                    closed_to_departure: closedToDeparture
                });

                // Specific day overrides from Tara PMS ari_overrides
                Object.entries(overridesMap).forEach(([overrideDate, oData]) => {
                    const compoundKey = targetRoomTypeId ? `${targetRoomTypeId}_${rp.id}` : rp.id;

                    const hasRateOverride = oData.rates && (oData.rates[compoundKey] !== undefined || oData.rates[rp.id] !== undefined);
                    const hasStopSellOverride = oData.stopSell && (oData.stopSell[compoundKey] !== undefined || oData.stopSell[rp.id] !== undefined);
                    const hasMinStayArrOverride = oData.minStayArrival && (oData.minStayArrival[compoundKey] !== undefined || oData.minStayArrival[rp.id] !== undefined);
                    const hasMinStayThruOverride = oData.minStayThrough && (oData.minStayThrough[compoundKey] !== undefined || oData.minStayThrough[rp.id] !== undefined);
                    const hasMinStayLegacyOverride = oData.minStay && (oData.minStay[compoundKey] !== undefined || oData.minStay[rp.id] !== undefined);
                    const hasMaxStayOverride = oData.maxStay && (oData.maxStay[compoundKey] !== undefined || oData.maxStay[rp.id] !== undefined);
                    const hasCtaOverride = oData.cta && (oData.cta[compoundKey] !== undefined || oData.cta[rp.id] !== undefined);
                    const hasCtdOverride = oData.ctd && (oData.ctd[compoundKey] !== undefined || oData.ctd[rp.id] !== undefined);

                    if (hasRateOverride || hasStopSellOverride || hasMinStayArrOverride || hasMinStayThruOverride || hasMinStayLegacyOverride || hasMaxStayOverride || hasCtaOverride || hasCtdOverride) {
                        const rawRate = hasRateOverride 
                            ? Number(oData.rates[compoundKey] !== undefined ? oData.rates[compoundKey] : oData.rates[rp.id]) 
                            : basePrice;
                        const customRateStr = formatRateForChannex(rawRate, hotelCurrency);

                        const customStopSell = hasStopSellOverride 
                            ? Boolean(oData.stopSell[compoundKey] !== undefined ? oData.stopSell[compoundKey] : oData.stopSell[rp.id]) 
                            : stopSell;
                        const customMinStayArr = hasMinStayArrOverride 
                            ? Number(oData.minStayArrival[compoundKey] !== undefined ? oData.minStayArrival[compoundKey] : oData.minStayArrival[rp.id]) 
                            : (hasMinStayLegacyOverride ? Number(oData.minStay[compoundKey] !== undefined ? oData.minStay[compoundKey] : oData.minStay[rp.id]) : minStay);
                        const customMinStayThru = hasMinStayThruOverride 
                            ? Number(oData.minStayThrough[compoundKey] !== undefined ? oData.minStayThrough[compoundKey] : oData.minStayThrough[rp.id]) 
                            : (hasMinStayLegacyOverride ? Number(oData.minStay[compoundKey] !== undefined ? oData.minStay[compoundKey] : oData.minStay[rp.id]) : minStay);
                        const customMaxStay = hasMaxStayOverride 
                            ? Number(oData.maxStay[compoundKey] !== undefined ? oData.maxStay[compoundKey] : oData.maxStay[rp.id]) 
                            : undefined;
                        const customCta = hasCtaOverride 
                            ? Boolean(oData.cta[compoundKey] !== undefined ? oData.cta[compoundKey] : oData.cta[rp.id]) 
                            : closedToArrival;
                        const customCtd = hasCtdOverride 
                            ? Boolean(oData.ctd[compoundKey] !== undefined ? oData.ctd[compoundKey] : oData.ctd[rp.id]) 
                            : closedToDeparture;

                        const overrideRestObj: any = {
                            property_id: channexPropertyId,
                            rate_plan_id: targetChannexRateId,
                            date: overrideDate,
                            rate: customRateStr,
                            min_stay_arrival: customMinStayArr,
                            min_stay_through: customMinStayThru,
                            max_stay: customMaxStay !== undefined && customMaxStay !== null ? customMaxStay : baseMaxStay,
                            stop_sell: customStopSell,
                            closed_to_arrival: customCta,
                            closed_to_departure: customCtd
                        };

                        restrictionValues.push(overrideRestObj);
                    }
                });
            }
        }

        // If no rate plans were resolved from Firestore, query live rate plans from Channex to ensure all rate plans are included with max_stay
        if (restrictionValues.length === 0 && channexPropertyId && customApiKey) {
            try {
                const liveRatesRes = await channexClient.getRatePlans(channexPropertyId, customApiKey, env);
                const liveRates = liveRatesRes?.data || [];
                for (const lr of liveRates) {
                    const rId = lr.id;
                    const baseMaxStay = 0;
                    const minStay = 1;
                    const basePrice = hotelCurrency === "IDR" ? 500000 : 100;
                    const formattedBaseRate = formatRateForChannex(basePrice, hotelCurrency);
                    restrictionValues.push({
                        property_id: channexPropertyId,
                        rate_plan_id: rId,
                        date_from: startDateStr,
                        date_to: endDateStr,
                        rate: formattedBaseRate,
                        min_stay_arrival: minStay,
                        min_stay_through: minStay,
                        max_stay: baseMaxStay,
                        stop_sell: false,
                        closed_to_arrival: false,
                        closed_to_departure: false
                    });
                }
            } catch (err: any) {
                console.warn("[fullPropertySync] Fallback live rate plans query failed:", err?.message);
            }
        }

        const taskIds: string[] = [];
        let availabilityTaskId: string | undefined;
        let restrictionsTaskId: string | undefined;

        // EXECUTE CALL 1: POST /availability (with rate limit throttle)
        console.log(`[FullSync] Executing Call 1/2: Pushing ${availabilityValues.length} availability slots...`);
        let availRes = null;
        if (availabilityValues.length > 0) {
            await throttleAriCall(channexPropertyId);
            availRes = await channexClient.pushAvailability({ values: availabilityValues }, customApiKey, env);
            availabilityTaskId = availRes?.data?.[0]?.id || availRes?.data?.id;
            if (availabilityTaskId) taskIds.push(availabilityTaskId);
        }

        // EXECUTE CALL 2: POST /restrictions (with rate limit throttle & sequence merger)
        console.log(`[FullSync] Executing Call 2/2: Pushing ${restrictionValues.length} rate restrictions...`);
        let restRes = null;
        if (restrictionValues.length > 0) {
            const compressedRestrictions = compressRestrictionRanges(restrictionValues);
            await throttleAriCall(channexPropertyId);
            restRes = await channexClient.pushRestrictions({ values: compressedRestrictions }, customApiKey, env);
            restrictionsTaskId = restRes?.data?.[0]?.id || restRes?.data?.id;
            if (restrictionsTaskId) taskIds.push(restrictionsTaskId);
        }

        const latencyMs = Date.now() - startTime;

        // Log to channex_task_logs
        try {
            await adminDb.collection(`hotels/${hotelCode}/channex_task_logs`).add({
                task_type: "POST /full_sync (2-Call Standard, 500 Days)",
                entity: `All Room Types (${roomTypes.length}) & Rate Plans (${ratePlans.length})`,
                user: "Channex Master Sync",
                status: "SUCCESS",
                inserted_at: new Date().toISOString(),
                latency_ms: latencyMs,
                task_ids: taskIds,
                message: `Full Property Sync (${daysAhead} days) completed in 2 API calls. Task IDs: ${taskIds.join(", ")}`,
                ota_responses: []
            });
        } catch (logErr) {
            console.warn("Could not save task log:", logErr);
        }

        return {
            success: true,
            taskIds,
            availabilityTaskId,
            restrictionsTaskId,
            availabilityCount: availabilityValues.length,
            restrictionsCount: restrictionValues.length,
            latencyMs,
            message: `Full Property ARI Sync (${daysAhead} days) successfully sent in exactly 2 API calls (${latencyMs}ms). Task IDs: ${taskIds.join(", ")}`
        };
    }

    /**
     * Process Incoming ARI / Rate Webhook from Channex
     * When prices or restrictions are updated directly on Channex/OTA
     */
    async processIncomingAriWebhook(payload: any): Promise<{ success: boolean; message: string }> {
        const propertyId = payload.property_id;
        const hotelCode = await this.findHotelCodeByChannexPropertyId(propertyId);
        if (!hotelCode) {
            return { success: false, message: `No hotel found for Channex property [${propertyId}]` };
        }

        const values = payload.values || payload.data || [payload];
        const ratePlansSnap = await adminDb.collection(`hotels/${hotelCode}/ratePlans`).get();
        const ratePlans = ratePlansSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        let updatedDatesCount = 0;

        for (const item of values) {
            const channexRatePlanId = item.rate_plan_id;
            const mappedRatePlan = ratePlans.find((rp: any) => 
                rp.channexRatePlanId === channexRatePlanId || 
                (rp.channexRatePlanIds && typeof rp.channexRatePlanIds === "object" && Object.values(rp.channexRatePlanIds).includes(channexRatePlanId)) ||
                rp.id === channexRatePlanId
            );

            if (!mappedRatePlan) continue;

            const datesToUpdate: string[] = [];
            if (item.date) {
                datesToUpdate.push(item.date);
            } else if (item.date_from && item.date_to) {
                let curr = new Date(item.date_from);
                const stop = new Date(item.date_to);
                while (curr <= stop) {
                    datesToUpdate.push(curr.toISOString().split("T")[0]);
                    curr.setDate(curr.getDate() + 1);
                }
            }

            for (const dStr of datesToUpdate) {
                const docId = `${hotelCode}_${dStr}`;
                const docRef = adminDb.collection(`hotels/${hotelCode}/ari_overrides`).doc(docId);
                const snap = await docRef.get();
                const existing = snap.exists ? snap.data() : {};

                const updatedRates = { ...(existing?.rates || {}) };
                const updatedStopSell = { ...(existing?.stopSell || {}) };
                const updatedMinStay = { ...(existing?.minStay || {}) };

                if (item.rate !== undefined && item.rate !== null) {
                    updatedRates[mappedRatePlan.id] = Number(item.rate);
                }
                if (item.stop_sell !== undefined && item.stop_sell !== null) {
                    updatedStopSell[mappedRatePlan.id] = Boolean(item.stop_sell);
                }
                if (item.min_stay_through !== undefined || item.min_stay_arrival !== undefined) {
                    updatedMinStay[mappedRatePlan.id] = Number(item.min_stay_through || item.min_stay_arrival || 1);
                }

                await docRef.set({
                    date: dStr,
                    hotelCode,
                    rates: updatedRates,
                    stopSell: updatedStopSell,
                    minStay: updatedMinStay,
                    lastUpdated: new Date().toISOString(),
                    source: "channex_webhook"
                }, { merge: true });

                updatedDatesCount++;
            }
        }

        return {
            success: true,
            message: `Updated ${updatedDatesCount} date overrides from Channex ARI Webhook for Hotel [${hotelCode}].`
        };
    }

    /**
     * Enqueues an ARI delta update into the debounced outbox buffer.
     * Consolidates rapid changes over a 4000ms window so rapid calendar edits or 
     * multiple front-office inputs are dispatched in exactly 1 batch call.
     */
    async enqueueDebouncedDelta(
        hotelCode: string,
        delta: { rates?: any[]; availability?: any[] },
        immediate: boolean = false
    ): Promise<any> {
        if (immediate) {
            return this.pushDeltaBatch(hotelCode, delta);
        }

        return new Promise((resolve, reject) => {
            let outbox = _propertyOutboxMap.get(hotelCode);
            if (!outbox) {
                outbox = { timer: null, queue: [] };
                _propertyOutboxMap.set(hotelCode, outbox);
            }

            outbox.queue.push({ hotelCode, delta, resolve, reject });

            if (outbox.timer) {
                clearTimeout(outbox.timer);
            }

            outbox.timer = setTimeout(async () => {
                const currentOutbox = _propertyOutboxMap.get(hotelCode);
                if (!currentOutbox || currentOutbox.queue.length === 0) return;

                const batchToProcess = [...currentOutbox.queue];
                currentOutbox.queue = [];
                currentOutbox.timer = null;

                // Merge all deltas: deduplicate by (ratePlanId + date/dateFrom) and (roomTypeId + date/dateFrom)
                const mergedRatesMap: Map<string, any> = new Map();
                const mergedAvailMap: Map<string, any> = new Map();

                for (const item of batchToProcess) {
                    for (const r of (item.delta.rates || [])) {
                        const key = `${r.ratePlanId}_${r.date || `${r.dateFrom}_${r.dateTo}`}`;
                        mergedRatesMap.set(key, { ...(mergedRatesMap.get(key) || {}), ...r });
                    }
                    for (const a of (item.delta.availability || [])) {
                        const key = `${a.roomTypeId}_${a.date || `${a.dateFrom}_${a.dateTo}`}`;
                        mergedAvailMap.set(key, { ...(mergedAvailMap.get(key) || {}), ...a });
                    }
                }

                const consolidatedDelta = {
                    rates: Array.from(mergedRatesMap.values()),
                    availability: Array.from(mergedAvailMap.values())
                };

                try {
                    console.log(`[ChannexOutbox] Flushing debounced batch for [${hotelCode}]: ${consolidatedDelta.rates.length} rates, ${consolidatedDelta.availability.length} availability items...`);
                    const result = await this.pushDeltaBatch(hotelCode, consolidatedDelta);
                    batchToProcess.forEach(q => q.resolve(result));
                } catch (err) {
                    batchToProcess.forEach(q => q.reject(err));
                }
            }, 4000);
        });
    }

    /**
     * Push Offline / Walk-in / Direct Reservation from My Tara to Channex (Two-Way CRS Booking Push)
     * Official Channex Specification: POST /api/v1/bookings
     */
    async pushCrsBookingToChannex(hotelCode: string, bookingData: {
        bookingId: string;
        reservationId?: string;
        guestName: string;
        email?: string;
        phone?: string;
        checkInDate: string;
        checkOutDate: string;
        roomTypeId?: string;
        roomTypeName?: string;
        ratePlanId?: string;
        ratePlanName?: string;
        totalAmount: number;
        currency?: string;
        notes?: string;
        channel?: string;
    }): Promise<{ success: boolean; channexBookingId?: string; message: string }> {
        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        if (!hotelDoc.exists) {
            throw new Error(`Hotel [${hotelCode}] not found`);
        }
        const hotelData = hotelDoc.data();
        const channexPropertyId = hotelData?.channexPropertyId || hotelData?.channelManager?.channexPropertyId || hotelData?.channelManager?.propertyId;
        const customApiKey = hotelData?.channelManager?.apiKey || process.env.CHANNEX_API_KEY;
        const env = hotelData?.channelManager?.environment || hotelData?.channelManager?.env || (process.env.CHANNEX_ENV as any) || "staging";
        const hotelCurrency = (bookingData.currency || hotelData?.currency || hotelData?.channelManager?.currency || "IDR").toUpperCase();

        if (!channexPropertyId) {
            throw new Error(`Hotel ${hotelCode} has no Channex Property ID configured.`);
        }

        // Fetch room types to resolve channexRoomTypeId
        const roomTypesSnap = await adminDb.collection(`hotels/${hotelCode}/roomTypes`).get();
        const roomTypes = roomTypesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const matchedRoom = roomTypes.find((rt: any) => 
            rt.id === bookingData.roomTypeId || 
            rt.channexRoomTypeId === bookingData.roomTypeId ||
            rt.name?.toLowerCase() === (bookingData.roomTypeName || "").toLowerCase()
        ) || roomTypes[0];

        const channexRoomTypeId = (matchedRoom as any)?.channexRoomTypeId || matchedRoom?.id || bookingData.roomTypeId;

        // Fetch rate plans to resolve channexRatePlanId
        const ratePlansSnap = await adminDb.collection(`hotels/${hotelCode}/ratePlans`).get();
        const ratePlans = ratePlansSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const matchedRatePlan = ratePlans.find((rp: any) =>
            rp.id === bookingData.ratePlanId ||
            rp.channexRatePlanId === bookingData.ratePlanId ||
            rp.name?.toLowerCase() === (bookingData.ratePlanName || "").toLowerCase()
        ) || ratePlans[0];

        const channexRatePlanId = (matchedRatePlan as any)?.channexRatePlanId || matchedRatePlan?.id || bookingData.ratePlanId;

        // Calculate nights
        const start = new Date(bookingData.checkInDate);
        const end = new Date(bookingData.checkOutDate);
        const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        const avgNightly = Math.round(bookingData.totalAmount / nights);

        const dailyAmounts = [];
        for (let i = 0; i < nights; i++) {
            const curr = new Date(start);
            curr.setDate(curr.getDate() + i);
            dailyAmounts.push({
                date: curr.toISOString().split("T")[0],
                amount: String(formatRateForChannex(avgNightly, hotelCurrency))
            });
        }

        const nameParts = (bookingData.guestName || "Guest").trim().split(" ");
        const firstName = nameParts[0] || "Guest";
        const lastName = nameParts.slice(1).join(" ") || firstName;

        const crsPayload = {
            property_id: channexPropertyId,
            status: "confirmed",
            channel_name: bookingData.channel || "Walk-In / Direct",
            channel_booking_id: bookingData.reservationId || bookingData.bookingId,
            arrival_date: bookingData.checkInDate,
            departure_date: bookingData.checkOutDate,
            currency: hotelCurrency,
            total_price: String(formatRateForChannex(bookingData.totalAmount, hotelCurrency)),
            payment_collect: "property",
            notes: bookingData.notes || `Created via My Tara Front Desk (Ref: ${bookingData.bookingId})`,
            customer: {
                name: bookingData.guestName,
                first_name: firstName,
                last_name: lastName,
                email: bookingData.email || `${bookingData.bookingId.toLowerCase()}@guest.mytara.id`,
                phone: bookingData.phone || "+62811111111"
            },
            rooms: [
                {
                    room_type_id: channexRoomTypeId,
                    rate_plan_id: channexRatePlanId,
                    occupancy: { adults: 2, children: 0 },
                    days: dailyAmounts
                }
            ]
        };

        console.log(`[ChannexCRS] Registering PMS booking ${bookingData.bookingId} to Channex for Property ${channexPropertyId}...`);
        const result = await channexClient.createBooking(crsPayload, customApiKey, env);
        const createdId = result?.data?.id;

        if (createdId) {
            // Log to channex_task_logs
            try {
                await adminDb.collection(`hotels/${hotelCode}/channex_task_logs`).add({
                    task_type: "POST /bookings (CRS Two-Way)",
                    entity: `CRS Reservation #${bookingData.bookingId} (${bookingData.guestName})`,
                    user: "My Tara Front Desk",
                    status: "SUCCESS",
                    inserted_at: new Date().toISOString(),
                    task_id: createdId,
                    message: `Booking successfully registered in Channex CRS. Channex Booking ID: ${createdId}`
                });
            } catch (lErr) {
                console.warn("Could not log CRS task:", lErr);
            }
        }

        return {
            success: true,
            channexBookingId: createdId,
            message: `Booking successfully registered in Channex CRS with ID: ${createdId}`
        };
    }
}

export const channexSyncService = new ChannexSyncService();

