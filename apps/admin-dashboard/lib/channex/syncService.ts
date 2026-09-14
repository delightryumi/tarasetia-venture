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

        // Process each booked room
        for (const bookedRoom of (booking.rooms || [])) {
            const mappedRoomType = roomTypes.find((rt: any) => 
                rt.channexRoomTypeId === bookedRoom.room_type_id || 
                rt.id === bookedRoom.room_type_id ||
                rt.name?.toLowerCase() === (bookedRoom.room_type_id || "").toLowerCase()
            ) || roomTypes[0];

            const roomTypeName = mappedRoomType?.name || "Standard Room";
            const roomTypeId = mappedRoomType?.id || bookedRoom.room_type_id;

            // Find an available physical room number
            const physicalRooms = (mappedRoomType?.physicalRooms || []).map((r: any) => typeof r === "string" ? r : r.number || r.name).filter(Boolean);
            const assignedRoomNumber = physicalRooms[0] || "AUTO";

            // Divide rate per night
            const roomNights = bookedRoom.days && bookedRoom.days.length > 0 ? bookedRoom.days.length : nights;
            const avgNightlyRate = Math.round(totalPrice / roomNights);

            for (let i = 0; i < roomNights; i++) {
                const currentDate = new Date(start);
                currentDate.setDate(currentDate.getDate() + i);
                const dateStr = currentDate.toISOString().split("T")[0];

                const dailyAmount = bookedRoom.days && bookedRoom.days[i] ? Number(bookedRoom.days[i].amount) : avgNightlyRate;
                const payTransfer = isChannelCollect && !isCancelled ? dailyAmount : 0;
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
                    roomCount: 1,
                    nights: 1,
                    channel: channelName,
                    voucherCode: otaBookingId,
                    amount: isCancelled ? 0 : dailyAmount,
                    totalAmount: totalPrice,
                    payHotel,
                    payTransfer,
                    paidCash: payHotel,
                    paidAmount1: payHotel,
                    paidTransfer: payTransfer,
                    paidAmount2: payTransfer,
                    initialPayHotel: payHotel,
                    initialPayTransfer: payTransfer,
                    paymentStatus,
                    source: "OTA",
                    status: finalStatus,
                    staffName: "Channex Channel Manager",
                    note: `OTA Booking via ${channelName}. Ref: ${otaBookingId}. ${booking.notes || ""}`.trim(),
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
                    // Remove duplicate or previous revision of this booking
                    const filteredEntries = existingEntries.filter((e: any) => 
                        e.bookingId !== otaBookingId && e.channexBookingId !== booking.id
                    );
                    
                    if (!isCancelled) {
                        filteredEntries.push(entryObject);
                    }

                    await dailyDocRef.update({
                        entries: filteredEntries,
                        date: dateStr,
                        lastUpdated: new Date().toISOString()
                    });
                } else if (!isCancelled) {
                    await dailyDocRef.set({
                        entries: [entryObject],
                        date: dateStr,
                        hotelId: hotelCode,
                        createdAt: new Date().toISOString()
                    });
                }
            }
        }

        // Trigger Availability recalculation & push back to Channex to lock remaining allotment
        try {
            await this.recalculateAndPushAvailability(hotelCode, arrivalDate, departureDate);
        } catch (pushErr) {
            console.error("[ChannexSync] Failed to push updated availability after booking:", pushErr);
        }

        // Send Mandatory Channex Booking Acknowledgement (Certification Test #11 Requirement)
        const revisionId = (booking as any).revision_id || booking.id;
        if (revisionId) {
            try {
                const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
                const customApiKey = hotelDoc.data()?.channelManager?.apiKey || process.env.CHANNEX_API_KEY;
                await channexClient.acknowledgeBooking(revisionId, customApiKey);
                console.log(`[ChannexSync] Successfully sent Booking Acknowledge (ACK) for revision: ${revisionId}`);
            } catch (ackErr: any) {
                console.warn(`[ChannexSync] Warning: Failed to send ACK for booking revision ${revisionId}:`, ackErr.message);
            }
        }

        return {
            success: true,
            message: `Booking ${otaBookingId} for ${guestName} processed successfully into Hotel [${hotelCode}].`,
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


        for (const rt of roomTypes as any[]) {
            const channexRoomTypeId = rt.channexRoomTypeId || rt.id;
            const totalAllotment = parseInt(rt.roomCount) || parseInt(rt.totalRooms) || (rt.physicalRooms?.length || 1);

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split("T")[0];
                const dayEntries = dailyMap[dateStr] || [];

                // Count occupied valid rooms
                const occupiedCount = dayEntries.filter((e: any) => {
                    const isCancelled = e.status === "CANCELLED" || e.status === "VOID" || e.isDeleted || e.isHidden;
                    if (isCancelled || e.type !== "accommodation") return false;
                    return (e.roomTypeId === rt.id || e.roomType?.toLowerCase() === rt.name?.toLowerCase());
                }).length;

                const availableQty = Math.max(0, totalAllotment - occupiedCount);

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
            return await channexClient.pushAvailability(payload);
        }

        return null;
    }

    /**
     * Pushes Rate Updates (BAR / Daily Rates) to Channex
     */
    async pushRateUpdate(hotelCode: string, ratePlanId: string, dateFrom: string, dateTo: string, rate: number, restrictions?: any): Promise<any> {
        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        const channexPropertyId = hotelDoc.data()?.channexPropertyId || hotelDoc.data()?.channelManager?.channexPropertyId;

        if (!channexPropertyId) {
            throw new Error(`Hotel ${hotelCode} has no channexPropertyId configured.`);
        }

        const payload: ChannexRestrictionsPayload = {
            values: [
                {
                    property_id: channexPropertyId,
                    rate_plan_id: ratePlanId,
                    date_from: dateFrom,
                    date_to: dateTo,
                    rate: Math.round(rate),
                    min_stay_arrival: restrictions?.minStay || 1,
                    min_stay_through: restrictions?.minStay || 1,
                    stop_sell: !!restrictions?.stopSell,
                    closed_to_arrival: !!restrictions?.closedToArrival,
                    closed_to_departure: !!restrictions?.closedToDeparture
                }
            ]
        };

        console.log(`[ChannexSync] Pushing Rate update to Channex for Rate Plan ${ratePlanId} (${dateFrom} - ${dateTo}): Rp ${rate}`);
        return await channexClient.pushRestrictions(payload);
    }
}

export const channexSyncService = new ChannexSyncService();
