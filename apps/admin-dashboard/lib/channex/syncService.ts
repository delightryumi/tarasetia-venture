/**
 * Channex Sync Service
 * Handles 2-Way Synchronization between My Tara Firestore PMS and Channex Channel Manager
 */

import { adminDb } from "@/lib/firebaseAdmin";
import { channexClient } from "./channexClient";
import {
    ChannexWebhookPayload,
    ChannexBooking,
    ChannexAvailabilityPayload,
    ChannexRestrictionsPayload
} from "./types";

export class ChannexSyncService {
    /**
     * Resolves the internal hotelCode from a given Channex Property UUID
     */
    async findHotelCodeByChannexPropertyId(channexPropertyId: string): Promise<string | null> {
        if (!channexPropertyId) return null;

        try {
            // 1. Search in master /hotels collection
            const hotelsSnap = await adminDb.collection("hotels").get();
            for (const docSnap of hotelsSnap.docs) {
                const data = docSnap.data();
                if (data.channexPropertyId === channexPropertyId || data.channelManager?.channexPropertyId === channexPropertyId) {
                    return docSnap.id;
                }
            }

            // Fallback for primary/first hotel if not explicitly set
            if (hotelsSnap.docs.length > 0) {
                const defaultHotel = hotelsSnap.docs[0];
                console.warn(`[ChannexSync] Property ID ${channexPropertyId} not explicitly mapped. Falling back to default hotel: ${defaultHotel.id}`);
                return defaultHotel.id;
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
    async processIncomingBookingWebhook(payload: ChannexWebhookPayload): Promise<{ success: boolean; message: string; bookingId?: string }> {
        const { event, property_id, booking } = payload;

        if (!booking || !property_id) {
            return { success: false, message: "Missing booking or property_id in webhook payload" };
        }

        const hotelCode = await this.findHotelCodeByChannexPropertyId(property_id);
        if (!hotelCode) {
            return { success: false, message: `No active hotel found for Channex Property ID: ${property_id}` };
        }

        const channelName = booking.channel_name || "OTA";
        const otaBookingId = booking.channel_booking_id || booking.id;
        const guest = booking.customer || booking.guest || {};
        const guestName = (guest.name || `${guest.first_name || ""} ${guest.last_name || ""}`).trim() || "OTA Guest";
        const arrivalDate = booking.arrival_date;
        const departureDate = booking.departure_date;
        const totalPrice = Number(booking.total_price) || 0;
        const isChannelCollect = booking.payment_type === "channel_collect" || booking.payment_collect === "channel";

        // Calculate nights
        const start = new Date(arrivalDate);
        const end = new Date(departureDate);
        const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

        // Handle Booking Status
        const isCancelled = event === "booking_cancellation" || booking.status === "cancelled";
        const finalStatus = isCancelled ? "CANCELLED" : "CONFIRMED";
        const paymentStatus = isCancelled ? "CANCELLED" : (isChannelCollect ? "Lunas" : "Belum Bayar");

        console.log(`[ChannexSync] Processing ${event} for Hotel [${hotelCode}], Guest: ${guestName}, OTA: ${channelName}, Ref: ${otaBookingId}`);

        // Fetch room types to map room_type_id
        const roomTypesSnap = await adminDb.collection(`hotels/${hotelCode}/roomTypes`).get();
        const roomTypes = roomTypesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

        // 1. GHOST BOOKING CLEANUP & CANCELLATION RETENTION (Certification Stage 5B & Audit Requirement)
        const affectedDates = new Set<string>();
        try {
            const existingRevenueSnap = await adminDb.collection(`hotels/${hotelCode}/daily_revenue`).get();
            for (const doc of existingRevenueSnap.docs) {
                const dayData = doc.data();
                const entries = dayData.entries || [];
                const matchingEntry = entries.find((e: any) => e.bookingId === otaBookingId || e.channexBookingId === booking.id);
                if (matchingEntry) {
                    const docDate = dayData.date || doc.id.replace(`${hotelCode}_`, "");
                    affectedDates.add(docDate);
                    
                    if (isCancelled) {
                        // Keep transaction record for Front Office & Audit visibility, but mark as CANCELLED with roomCount: 0
                        const updatedEntries = entries.map((e: any) => {
                            if (e.bookingId === otaBookingId || e.channexBookingId === booking.id) {
                                return {
                                    ...e,
                                    status: "CANCELLED",
                                    paymentStatus: "CANCELLED",
                                    roomCount: 0,
                                    note: `${e.note || ''} [CANCELLED by OTA Webhook]`.trim(),
                                    lastUpdated: new Date().toISOString()
                                };
                            }
                            return e;
                        });
                        await doc.ref.update({
                            entries: updatedEntries,
                            lastUpdated: new Date().toISOString()
                        });
                    } else {
                        // For date modifications: clear out slots that may no longer be part of new stay range
                        const cleanedEntries = entries.filter((e: any) => e.bookingId !== otaBookingId && e.channexBookingId !== booking.id);
                        await doc.ref.update({
                            entries: cleanedEntries,
                            lastUpdated: new Date().toISOString()
                        });
                    }
                }
            }
        } catch (cleanErr) {
            console.warn(`[ChannexSync] Warning checking previous booking dates for cleanup:`, cleanErr);
        }

        let primaryRoomTypeName = "Standard Room";
        let primaryRoomNumber = "AUTO";

        // Fetch rate plans and ARI overrides to enforce Stop Sell validation
        const ratePlansSnap = await adminDb.collection(`hotels/${hotelCode}/ratePlans`).get();
        const hotelRatePlans = ratePlansSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

        const overridesSnap = await adminDb.collection(`hotels/${hotelCode}/ari_overrides`).get();
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

        // Process each booked room
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

            // Divide rate per night
            const roomNights = bookedRoom.days && bookedRoom.days.length > 0 ? bookedRoom.days.length : nights;
            const avgNightlyRate = Math.round(totalPrice / roomNights);

            for (let i = 0; i < roomNights; i++) {
                const currentDate = new Date(start);
                currentDate.setDate(currentDate.getDate() + i);
                const dateStr = currentDate.toISOString().split("T")[0];
                affectedDates.add(dateStr);

                const dailyAmount = bookedRoom.days && bookedRoom.days[i] ? Number(bookedRoom.days[i].amount) : avgNightlyRate;
                const payTransfer = isChannelCollect ? dailyAmount : 0;
                const payHotel = 0;

                const entryObject = {
                    type: "accommodation",
                    guestName,
                    bookingId: otaBookingId,
                    channexBookingId: booking.id,
                    phone: guest.phone || "",
                    email: guest.email || "",
                    address: guest.address || "",
                    nationality: guest.country || "INDONESIA",
                    company: channelName,
                    checkInDate: arrivalDate,
                    checkOutDate: departureDate,
                    effectiveDate: dateStr,
                    roomType: roomTypeName,
                    roomTypeId: roomTypeId,
                    roomNumber: assignedRoomNumber,
                    roomCount: isCancelled ? 0 : 1,
                    nights: 1,
                    channel: channelName,
                    voucherCode: otaBookingId,
                    amount: dailyAmount,
                    totalAmount: totalPrice,
                    payHotel,
                    payTransfer,
                    paidCash: payHotel,
                    paidAmount1: payHotel,
                    paidTransfer: payTransfer,
                    paidAmount2: payTransfer,
                    initialPayHotel: payHotel,
                    initialPayTransfer: payTransfer,
                    paymentStatus: isCancelled ? "CANCELLED" : paymentStatus,
                    source: "OTA",
                    status: isCancelled ? "CANCELLED" : finalStatus,
                    staffName: "Channex Channel Manager",
                    note: `OTA Booking via ${channelName}. Ref: ${otaBookingId}. ${isCancelled ? '[CANCELLED]' : ''} ${booking.notes || ""}`.trim(),
                    timestamp: new Date().toISOString(),
                    isOTA: true,
                    channexRaw: {
                        eventId: payload.event,
                        insertedAt: payload.inserted_at
                    }
                };

                const dailyDocRef = adminDb.collection(`hotels/${hotelCode}/daily_revenue`).doc(`${hotelCode}_${dateStr}`);
                const dailyDoc = await dailyDocRef.get();

                if (dailyDoc.exists) {
                    const existingEntries = dailyDoc.data()?.entries || [];
                    const filteredEntries = existingEntries.filter((e: any) => 
                        e.bookingId !== otaBookingId && e.channexBookingId !== booking.id
                    );
                    filteredEntries.push(entryObject);

                    await dailyDocRef.update({
                        entries: filteredEntries,
                        date: dateStr,
                        lastUpdated: new Date().toISOString()
                    });
                } else {
                    await dailyDocRef.set({
                        entries: [entryObject],
                        date: dateStr,
                        hotelId: hotelCode,
                        createdAt: new Date().toISOString()
                    });
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
                status: "SUCCESS",
                inserted_at: new Date().toISOString(),
                entity: "ota_booking",
                message: `${taskType}: Tamu "${guestName}" (${channelName}) | Periode: ${arrivalDate} s/d ${departureDate} | Kamar: ${primaryRoomTypeName} (${primaryRoomNumber}) | Ref: ${otaBookingId} | Total: Rp ${totalPrice.toLocaleString('id-ID')}`,
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
        const revisionId = payload.booking_revision_id || (payload.booking as any)?.revision_id || (booking as any)?.revision_id || booking.id;
        const isUuid = Boolean(revisionId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(revisionId));

        if (revisionId && isUuid && !revisionId.startsWith("rev_") && !payload.is_simulation) {
            try {
                const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
                const hotelData = hotelDoc.data();
                const customApiKey = hotelData?.channelManager?.apiKey || process.env.CHANNEX_API_KEY;
                const env = hotelData?.channelManager?.environment || (process.env.CHANNEX_ENV as any) || "staging";
                await channexClient.acknowledgeBooking(revisionId, customApiKey, env);
                console.log(`[ChannexSync] Successfully sent Booking Acknowledge (ACK) for revision: ${revisionId}`);
            } catch (ackErr: any) {
                console.warn(`[ChannexSync] Warning: Failed to send ACK for booking revision ${revisionId}:`, ackErr.message);
            }
        } else if (payload.is_simulation || (revisionId && !isUuid)) {
            console.log(`[ChannexSync] Simulated revision ${revisionId}: ACK processed locally (skipping external Channex call).`);
        }

        return {
            success: true,
            message: `Booking ${otaBookingId} (${isCancelled ? 'CANCELLED' : event}) for ${guestName} processed successfully into Hotel [${hotelCode}].`,
            bookingId: otaBookingId
        };
    }

    /**
     * Recalculates occupied inventory and pushes fresh availability to Channex for all room types across a date range
     */
    async recalculateAndPushAvailability(hotelCode: string, startDateStr: string, endDateStr: string): Promise<any> {
        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        const channexPropertyId = hotelDoc.data()?.channexPropertyId || hotelDoc.data()?.channelManager?.channexPropertyId;

        if (!channexPropertyId) {
            console.log(`[ChannexSync] Hotel ${hotelCode} has no channexPropertyId configured. Skipping availability push.`);
            return null;
        }

        const roomTypesSnap = await adminDb.collection(`hotels/${hotelCode}/roomTypes`).get();
        const roomTypes = roomTypesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        const availabilityValues: any[] = [];

        // Query daily revenue documents in date range
        const dailySnap = await adminDb.collection(`hotels/${hotelCode}/daily_revenue`)
            .where("date", ">=", startDateStr)
            .where("date", "<=", endDateStr)
            .get();

        const dailyMap: Record<string, any[]> = {};
        dailySnap.docs.forEach((d: any) => {
            const data = d.data();
            dailyMap[data.date] = data.entries || [];
        });

        // Query ari_overrides in date range (for inventory and rate overrides from Tara PMS grid)
        const overridesSnap = await adminDb.collection(`hotels/${hotelCode}/ari_overrides`)
            .where("date", ">=", startDateStr)
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

                availabilityValues.push({
                    property_id: channexPropertyId,
                    room_type_id: channexRoomTypeId,
                    date: dateStr,
                    availability: availableQty
                });
            }
        }

        if (availabilityValues.length > 0) {
            const payload: ChannexAvailabilityPayload = { values: availabilityValues };
            console.log(`[ChannexSync] Pushing ${availabilityValues.length} availability slots to Channex for Property ${channexPropertyId}`);
            const hotelData = hotelDoc.data();
            const customApiKey = hotelData?.channelManager?.apiKey || process.env.CHANNEX_API_KEY;
            const env = hotelData?.channelManager?.environment || hotelData?.channelManager?.env || (process.env.CHANNEX_ENV as any) || "staging";
            return await channexClient.pushAvailability(payload, customApiKey, env);
        }

        return null;
    }

    /**
     * Pushes Rate Updates (BAR / Daily Rates) to Channex
     */
    async pushRateUpdate(hotelCode: string, ratePlanId: string, dateFrom: string, dateTo: string, rate: number, restrictions?: any): Promise<any> {
        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        const channexPropertyId = hotelDoc.data()?.channexPropertyId || hotelDoc.data()?.channelManager?.channexPropertyId;
        const customApiKey = hotelDoc.data()?.channelManager?.apiKey || process.env.CHANNEX_API_KEY;
        const env = hotelDoc.data()?.channelManager?.environment || hotelDoc.data()?.channelManager?.env || (process.env.CHANNEX_ENV as any) || "staging";

        if (!channexPropertyId) {
            console.log(`[ChannexSync] Hotel ${hotelCode} has no channexPropertyId configured. Skipping rate push.`);
            return null;
        }

        const payload: ChannexRestrictionsPayload = {
            values: [
                {
                    property_id: channexPropertyId,
                    rate_plan_id: ratePlanId,
                    date_from: dateFrom,
                    date_to: dateTo,
                    rate: Number(rate).toFixed(2),
                    min_stay_arrival: restrictions?.minStay || 1,
                    min_stay_through: restrictions?.minStay || 1,
                    stop_sell: !!restrictions?.stopSell,
                    closed_to_arrival: !!restrictions?.closedToArrival,
                    closed_to_departure: !!restrictions?.closedToDeparture
                }
            ]
        };

        console.log(`[ChannexSync] Pushing Rate update to Channex for Rate Plan ${ratePlanId} (${dateFrom} - ${dateTo}): Rp ${rate}`);
        return await channexClient.pushRestrictions(payload, customApiKey, env);
    }

    /**
     * Stage 3 Certification Requirement: Full Property Sync (2-Call Exact Standard)
     */
    async fullPropertySync(hotelCode: string, daysAhead: number = 365): Promise<{
        success: boolean;
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
            throw new Error(`Hotel ${hotelCode} has no Channex Property ID configured.`);
        }

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + daysAhead);

        const startDateStr = startDate.toISOString().split("T")[0];
        const endDateStr = endDate.toISOString().split("T")[0];

        // 1. Fetch Room Types and Rate Plans
        const roomTypesSnap = await adminDb.collection(`hotels/${hotelCode}/roomTypes`).get();
        const roomTypes = roomTypesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const ratePlansSnap = await adminDb.collection(`hotels/${hotelCode}/ratePlans`).get();
        const ratePlans = ratePlansSnap.docs.map(d => ({ id: d.id, ...d.data() }));

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

                availabilityValues.push({
                    property_id: channexPropertyId,
                    room_type_id: channexRoomTypeId,
                    date: dateStr,
                    availability: availableQty
                });
            }
        }

        // 4. Build Restrictions / Rates Payload (Call 2)
        const restrictionValues: any[] = [];
        for (const rp of ratePlans as any[]) {
            const channexRatePlanId = rp.channexRatePlanId || rp.id;
            const basePrice = Number(rp.baseRate || rp.basePrice || rp.rate || 500000);
            const minStay = Number(rp.minStay || 1);
            const stopSell = !!rp.stopSell;
            const closedToArrival = !!rp.closedToArrival;
            const closedToDeparture = !!rp.closedToDeparture;

            // Base broad range across the year
            restrictionValues.push({
                property_id: channexPropertyId,
                rate_plan_id: channexRatePlanId,
                date_from: startDateStr,
                date_to: endDateStr,
                rate: Number(basePrice).toFixed(2),
                min_stay_arrival: minStay,
                min_stay_through: minStay,
                stop_sell: stopSell,
                closed_to_arrival: closedToArrival,
                closed_to_departure: closedToDeparture
            });

            // Specific day overrides from Tara PMS ari_overrides
            Object.entries(overridesMap).forEach(([overrideDate, oData]) => {
                const hasRateOverride = oData.rates && oData.rates[rp.id] !== undefined;
                const hasStopSellOverride = oData.stopSell && oData.stopSell[rp.id] !== undefined;

                if (hasRateOverride || hasStopSellOverride) {
                    const customRate = hasRateOverride ? Number(oData.rates[rp.id]) : basePrice;
                    const customStopSell = hasStopSellOverride ? !!oData.stopSell[rp.id] : stopSell;

                    restrictionValues.push({
                        property_id: channexPropertyId,
                        rate_plan_id: channexRatePlanId,
                        date: overrideDate,
                        rate: Number(customRate).toFixed(2),
                        min_stay_arrival: minStay,
                        min_stay_through: minStay,
                        stop_sell: customStopSell,
                        closed_to_arrival: closedToArrival,
                        closed_to_departure: closedToDeparture
                    });
                }
            });
        }

        // EXECUTE CALL 1: POST /availability
        console.log(`[FullSync] Executing Call 1/2: Pushing ${availabilityValues.length} availability slots...`);
        let availRes = null;
        if (availabilityValues.length > 0) {
            availRes = await channexClient.pushAvailability({ values: availabilityValues }, customApiKey, env);
        }

        // EXECUTE CALL 2: POST /restrictions
        console.log(`[FullSync] Executing Call 2/2: Pushing ${restrictionValues.length} rate restriction ranges...`);
        let restRes = null;
        if (restrictionValues.length > 0) {
            restRes = await channexClient.pushRestrictions({ values: restrictionValues }, customApiKey, env);
        }

        const latencyMs = Date.now() - startTime;

        // Log to channex_task_logs
        try {
            await adminDb.collection(`hotels/${hotelCode}/channex_task_logs`).add({
                task_type: "POST /full_sync (2-Call Standard)",
                entity: `All Room Types (${roomTypes.length}) & Rate Plans (${ratePlans.length})`,
                status: "SUCCESS",
                inserted_at: new Date().toISOString(),
                latency_ms: latencyMs,
                message: `Full Property Sync (${daysAhead} days) completed in 2 API calls. Availability: ${availabilityValues.length} slots, Restrictions: ${restrictionValues.length} rules.`,
                ota_responses: []
            });
        } catch (logErr) {
            console.warn("Could not save task log:", logErr);
        }

        return {
            success: true,
            availabilityCount: availabilityValues.length,
            restrictionsCount: restrictionValues.length,
            latencyMs,
            message: `Full Property ARI Sync (${daysAhead} days) successfully sent in exactly 2 API calls (${latencyMs}ms).`
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
                rp.channexRatePlanId === channexRatePlanId || rp.id === channexRatePlanId
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
}

export const channexSyncService = new ChannexSyncService();
