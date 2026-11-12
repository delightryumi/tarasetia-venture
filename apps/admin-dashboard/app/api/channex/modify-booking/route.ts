import { NextRequest, NextResponse } from "next/server";
import { channexClient } from "@/lib/channex/channexClient";
import { channexSyncService } from "@/lib/channex/syncService";
import { adminDb } from "@/lib/firebaseAdmin";
import { getAuthenticatedUser } from "@/lib/security/serverAuth";
import { formatRateForChannex } from "@/lib/currency-utils";

/**
 * Route: POST /api/channex/modify-booking
 * Pushes Reschedule / Modification of a reservation to Channex CRS and synchronizes ARI
 * Official Channex Specification: PUT /api/v1/bookings/{id}
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { hotelCode, bookingId, channexBookingId, modificationData, touchedDates = [] } = body;

        if (!hotelCode || (!bookingId && !channexBookingId)) {
            return NextResponse.json({ error: "hotelCode and bookingId or channexBookingId are required" }, { status: 400 });
        }

        const authUser = await getAuthenticatedUser(req).catch(() => null);

        // Fetch hotel configuration for Channex
        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        if (!hotelDoc.exists) {
            return NextResponse.json({ error: `Hotel [${hotelCode}] not found` }, { status: 404 });
        }
        const hotelData = hotelDoc.data() || {};
        const channexPropertyId = hotelData.channexPropertyId || hotelData.channelManager?.channexPropertyId || hotelData.channelManager?.propertyId;
        const customApiKey = hotelData.channelManager?.apiKey || process.env.CHANNEX_API_KEY;
        const env = hotelData.channelManager?.environment || hotelData.channelManager?.env || (process.env.CHANNEX_ENV as any) || "staging";
        const hotelCurrency = hotelData.currency || "IDR";

        let targetChannexId = channexBookingId;

        // If channexBookingId is not directly supplied, search in daily_revenue
        if (!targetChannexId && bookingId) {
            const snap = await adminDb.collection(`hotels/${hotelCode}/daily_revenue`).get();
            for (const docSnap of snap.docs) {
                const entries = docSnap.data().entries || [];
                const matched = entries.find((e: any) => e.bookingId === bookingId || e.reservationId === bookingId);
                if (matched?.channexBookingId) {
                    targetChannexId = matched.channexBookingId;
                    break;
                }
            }
        }

        let channexUpdated = false;
        let channexResponse: any = null;

        if (targetChannexId && channexPropertyId && customApiKey && modificationData) {
            try {
                console.log(`[ModifyBooking] Modifying booking ${targetChannexId} on Channex for property ${channexPropertyId}...`);

                // 1. Fetch current booking from Channex to preserve existing metadata
                const existingChannex = await channexClient.getBooking(targetChannexId, customApiKey, env).catch(() => null);
                const existingAttrs = existingChannex?.data?.attributes || {};

                const checkInDate = modificationData.checkInDate || modificationData.checkIn || existingAttrs.arrival_date;
                const checkOutDate = modificationData.checkOutDate || modificationData.checkOut || existingAttrs.departure_date;
                const totalAmount = Number(modificationData.totalAmount || modificationData.amount || existingAttrs.total_price || 0);

                // Fetch room types to resolve channexRoomTypeId
                const roomTypesSnap = await adminDb.collection(`hotels/${hotelCode}/roomTypes`).get();
                const roomTypes = roomTypesSnap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() }));
                let matchedRoom = roomTypes.find((rt: any) =>
                    rt.id === modificationData.roomTypeId ||
                    rt.channexRoomTypeId === modificationData.roomTypeId ||
                    rt.name?.toLowerCase() === (modificationData.roomType || modificationData.roomTypeName || "").toLowerCase()
                ) || roomTypes[0];

                let channexRoomTypeId = (matchedRoom as any)?.channexRoomTypeId;
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

                if (!channexRoomTypeId || !uuidRegex.test(channexRoomTypeId)) {
                    try {
                        const channexRoomsRes = await channexClient.getRoomTypes(channexPropertyId, customApiKey, env);
                        const channexRooms = channexRoomsRes?.data || [];
                        if (channexRooms.length > 0) {
                            const matchedChannexRoom = channexRooms.find((cr: any) =>
                                cr.attributes?.title?.toLowerCase() === (modificationData.roomType || matchedRoom?.name || "").toLowerCase()
                            ) || channexRooms[0];
                            if (matchedChannexRoom?.id) {
                                channexRoomTypeId = matchedChannexRoom.id;
                                if (matchedRoom?.ref) {
                                    await matchedRoom.ref.update({ channexRoomTypeId }).catch(() => {});
                                }
                            }
                        }
                    } catch (rErr) {
                        console.warn("[ModifyBooking] Warning resolving Channex room type:", rErr);
                    }
                }

                if (!channexRoomTypeId && existingAttrs.rooms?.[0]?.room_type_id) {
                    channexRoomTypeId = existingAttrs.rooms[0].room_type_id;
                }

                // Fetch rate plans to resolve channexRatePlanId
                const ratePlansSnap = await adminDb.collection(`hotels/${hotelCode}/ratePlans`).get();
                const ratePlans = ratePlansSnap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() }));
                let matchedRatePlan = ratePlans.find((rp: any) =>
                    rp.id === modificationData.ratePlanId ||
                    rp.channexRatePlanId === modificationData.ratePlanId ||
                    rp.name?.toLowerCase() === (modificationData.ratePlanName || "").toLowerCase()
                ) || ratePlans[0];

                let channexRatePlanId = (matchedRatePlan as any)?.channexRatePlanId;

                if (!channexRatePlanId || !uuidRegex.test(channexRatePlanId)) {
                    try {
                        const channexRatesRes = await channexClient.getRatePlans(channexPropertyId, customApiKey, env);
                        const channexRates = channexRatesRes?.data || [];
                        if (channexRates.length > 0) {
                            const matchedChannexRate = channexRates.find((cr: any) =>
                                (channexRoomTypeId ? cr.attributes?.room_type_id === channexRoomTypeId : true) &&
                                cr.attributes?.title?.toLowerCase() === (modificationData.ratePlanName || matchedRatePlan?.name || "").toLowerCase()
                            ) || channexRates.find((cr: any) => channexRoomTypeId ? cr.attributes?.room_type_id === channexRoomTypeId : true) || channexRates[0];
                            if (matchedChannexRate?.id) {
                                channexRatePlanId = matchedChannexRate.id;
                                if (matchedRatePlan?.ref) {
                                    await matchedRatePlan.ref.update({ channexRatePlanId }).catch(() => {});
                                }
                            }
                        }
                    } catch (rpErr) {
                        console.warn("[ModifyBooking] Warning resolving Channex rate plan:", rpErr);
                    }
                }

                if (!channexRatePlanId && existingAttrs.rooms?.[0]?.rate_plan_id) {
                    channexRatePlanId = existingAttrs.rooms[0].rate_plan_id;
                }

                // Calculate nights and daily amounts map: { [dateStr]: "500000.00" }
                const start = new Date(checkInDate);
                const end = new Date(checkOutDate);
                const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                const avgNightly = Math.round(totalAmount / nights);

                const dailyAmountsMap: Record<string, string> = {};
                for (let i = 0; i < nights; i++) {
                    const curr = new Date(start);
                    curr.setDate(curr.getDate() + i);
                    const dateStr = curr.toISOString().split("T")[0];
                    dailyAmountsMap[dateStr] = String(formatRateForChannex(avgNightly, hotelCurrency));
                }

                const guestFullName = modificationData.guestName || existingAttrs.customer?.name || "Guest";
                const nameParts = guestFullName.trim().split(" ");
                const firstName = nameParts[0] || "Guest";
                const lastName = nameParts.slice(1).join(" ") || firstName;

                const bookingPayload: any = {
                    property_id: channexPropertyId,
                    ota_name: existingAttrs.ota_name || "Offline",
                    ota_reservation_code: existingAttrs.ota_reservation_code || bookingId || targetChannexId,
                    status: "modified",
                    arrival_date: checkInDate,
                    departure_date: checkOutDate,
                    currency: hotelCurrency,
                    total_price: String(formatRateForChannex(totalAmount, hotelCurrency)),
                    notes: modificationData.note || modificationData.notes || existingAttrs.notes || `Modified via My Tara Front Desk (Ref: ${bookingId || targetChannexId})`,
                    customer: {
                        name: firstName,
                        surname: lastName,
                        email: modificationData.email || existingAttrs.customer?.email || existingAttrs.customer?.mail || `${(bookingId || targetChannexId).toLowerCase()}@guest.mytara.id`,
                        phone: modificationData.phone || existingAttrs.customer?.phone || "+62811111111"
                    },
                    rooms: [
                        {
                            room_type_id: channexRoomTypeId,
                            rate_plan_id: channexRatePlanId,
                            occupancy: { adults: Number(modificationData.pax || 2), children: 0 },
                            days: dailyAmountsMap
                        }
                    ]
                };

                channexResponse = await channexClient.updateBooking(
                    targetChannexId,
                    bookingPayload,
                    customApiKey,
                    env
                );
                channexUpdated = true;

                // Log task to channex_task_logs
                await adminDb.collection(`hotels/${hotelCode}/channex_task_logs`).add({
                    task_type: "PUT /bookings/{id} (CRS Modification/Reschedule)",
                    entity: `Booking #${bookingId || targetChannexId} (${modificationData.guestName || "Guest"})`,
                    user: authUser?.displayName || authUser?.email || "Front Desk",
                    status: "SUCCESS",
                    inserted_at: new Date().toISOString(),
                    task_id: targetChannexId,
                    message: `Booking successfully rescheduled/modified in Channex CRS. Dates: ${checkInDate} to ${checkOutDate}`
                });
            } catch (channexErr: any) {
                console.warn("[ModifyBooking] Channex API update call warning:", channexErr?.message);
            }
        }

        // Trigger ARI synchronization for all touched dates (both old dates freed and new dates occupied)
        if (touchedDates.length > 0 && channexPropertyId && customApiKey) {
            try {
                const sortedDates = [...touchedDates].sort();
                await channexSyncService.pushLiveAriToChannex(
                    hotelCode,
                    "availability",
                    sortedDates[0],
                    sortedDates[sortedDates.length - 1]
                );
            } catch (ariErr) {
                console.warn("[ModifyBooking] ARI inventory update sync warning:", ariErr);
            }
        }

        return NextResponse.json({
            success: true,
            channexUpdated,
            channexBookingId: targetChannexId,
            message: channexUpdated 
                ? "Perubahan / Reschedule reservasi berhasil disimpan dan disinkronkan ke Channex CRS & seluruh OTA."
                : "Perubahan reservasi berhasil disimpan secara lokal di My Tara PMS."
        });
    } catch (err: any) {
        console.error("[ModifyBooking] Error modifying booking in Channex CRS:", err);
        return NextResponse.json({
            success: false,
            error: err.message || "Failed to modify booking in Channex CRS"
        }, { status: 500 });
    }
}

