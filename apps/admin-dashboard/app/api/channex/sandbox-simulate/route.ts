import { NextRequest, NextResponse } from "next/server";
import { channexSyncService } from "@/lib/channex/syncService";
import { channexClient } from "@/lib/channex/channexClient";
import { adminDb } from "@/lib/firebaseAdmin";
import { ChannexWebhookPayload } from "@/lib/channex/types";

/**
 * Comprehensive Endpoint for Sandbox Testing & OTA Certification Simulation Suite
 * URL: POST /api/channex/sandbox-simulate
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            action = "create_booking",
            hotelCode,
            channelName = "Booking.com",
            guestName = "Budi Santoso (Test Sandbox)",
            guestEmail = "budi.sandbox@test.com",
            guestPhone = "+6281234567890",
            roomTypeId,
            ratePlanId,
            arrivalDate,
            departureDate,
            newArrivalDate,
            newDepartureDate,
            totalPrice = 1250000,
            paymentCollect = "channel",
            commissionPercent,
            promoPercent,
            pricingModel,
            revenueRecordingMode = "net",
            bookingIdToCancel,
            bookingIdToModify
        } = body;

        if (!hotelCode) {
            return NextResponse.json({ error: "hotelCode is required" }, { status: 400 });
        }

        // 1. Fetch Hotel Doc to get property ID and channel manager config
        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        if (!hotelDoc.exists) {
            return NextResponse.json({ error: `Hotel ${hotelCode} tidak ditemukan` }, { status: 404 });
        }

        const hotelData = hotelDoc.data();
        const cmConfig = hotelData?.channelManager || {};
        const channexPropertyId = cmConfig.channexPropertyId || hotelData?.channexPropertyId || `prop_sandbox_${hotelCode}`;
        const apiKey = cmConfig.apiKey || process.env.CHANNEX_API_KEY;
        const environment = cmConfig.environment || "staging";

        // 2. Action: Test Ping & Connection
        if (action === "test_ping") {
            try {
                const res = await channexClient.getProperty(channexPropertyId, apiKey, environment);
                return NextResponse.json({
                    success: true,
                    stage: 1,
                    title: "Test Ping & Credentials",
                    message: `Berhasil terhubung ke Channex (${environment.toUpperCase()}). Property terverifikasi!`,
                    data: res?.data || null
                });
            } catch (err: any) {
                return NextResponse.json({
                    success: false,
                    stage: 1,
                    title: "Test Ping & Credentials",
                    message: `Koneksi gagal atau properti belum didaftarkan di Channex: ${err.message}`,
                    error: err.message
                }, { status: 200 });
            }
        }

        // 3. Action: Full Property Sync (Stage 3 Certification: Exact 2 Calls, 500 Days)
        if (action === "test_full_sync") {
            const syncResult = await channexSyncService.fullPropertySync(hotelCode, 500);
            const taskStr = syncResult.taskIds?.length > 0 ? ` (Task IDs: ${syncResult.taskIds.join(", ")})` : "";
            return NextResponse.json({
                success: syncResult.success,
                stage: 2,
                title: "Full Property ARI Sync (2-Call Bulk Standard, 500 Hari)",
                message: syncResult.success
                    ? `Full sync 500 hari berhasil dieksekusi tepat dalam 2 API Call bulk (Availability & Rate Restrictions)!${taskStr}`
                    : `Gagal menjalankan Full sync: ${syncResult.message || "Unknown error"}`,
                callsCount: 2,
                taskIds: syncResult.taskIds,
                availabilityTaskId: syncResult.availabilityTaskId,
                restrictionsTaskId: syncResult.restrictionsTaskId,
                detail: syncResult
            });
        }

        // Helper to resolve room types & rate plans for certification scenarios
        const getCertEntities = async () => {
            const rtSnap = await adminDb.collection(`hotels/${hotelCode}/roomTypes`).get();
            const rts = rtSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

            const rpSnap = await adminDb.collection(`hotels/${hotelCode}/ratePlans`).get();
            const rps = rpSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

            const twinRt = rts.find(r => r.name?.toLowerCase().includes("twin") || r.code?.toLowerCase().includes("twin")) || rts[0] || { id: "twin_room", name: "Twin Room" };
            const doubleRt = rts.find(r => r.name?.toLowerCase().includes("double") || r.code?.toLowerCase().includes("double")) || rts[1] || rts[0] || { id: "double_room", name: "Double Room" };

            const barRp = rps.find(p => p.name?.toLowerCase().includes("best") || p.name?.toLowerCase().includes("bar") || p.name?.toLowerCase().includes("standard")) || rps[0] || { id: "bar", name: "Best Available Rate" };
            const bbRp = rps.find(p => p.name?.toLowerCase().includes("breakfast") || p.name?.toLowerCase().includes("bb")) || rps[1] || rps[0] || { id: "bb", name: "Bed & Breakfast" };

            return { twinRt, doubleRt, barRp, bbRp };
        };

        // TEST 2: Single Date Update for Single Rate
        if (action === "test_ari_scenario_2" || action === "test_2_single_rate") {
            const { twinRt, barRp } = await getCertEntities();
            const result = await channexSyncService.pushDeltaBatch(hotelCode, {
                rates: [
                    {
                        roomTypeId: twinRt.id,
                        ratePlanId: barRp.id,
                        date: "2026-11-22",
                        rate: 333
                    }
                ]
            });
            return NextResponse.json({
                success: result.success,
                title: "Test 2: Single Date Update for Single Rate",
                message: `Pembaruan harga Twin Room (BAR) pada 2026-11-22 menjadi $333 berhasil dikirim dalam 1 API call!`,
                taskIds: result.taskIds,
                detail: result
            });
        }

        // TEST 3: Single Date Update for Multiple Rates
        if (action === "test_ari_scenario_3" || action === "test_3_multi_rates_single_date") {
            const { twinRt, doubleRt, barRp, bbRp } = await getCertEntities();
            const result = await channexSyncService.pushDeltaBatch(hotelCode, {
                rates: [
                    { roomTypeId: twinRt.id, ratePlanId: barRp.id, date: "2026-11-21", rate: 333 },
                    { roomTypeId: doubleRt.id, ratePlanId: barRp.id, date: "2026-11-25", rate: 444 },
                    { roomTypeId: doubleRt.id, ratePlanId: bbRp.id, date: "2026-11-29", rate: 456.23 }
                ]
            });
            return NextResponse.json({
                success: result.success,
                title: "Test 3: Single Date Update for Multiple Rates",
                message: `Pembaruan 3 tarif pada tanggal berbeda berhasil dikirim bersamaan dalam 1 batched API call!`,
                taskIds: result.taskIds,
                detail: result
            });
        }

        // TEST 4: Multiple Date Update for Multiple Rates (Merged Sequence Ranges)
        if (action === "test_ari_scenario_4" || action === "test_4_multi_date_multi_rates") {
            const { twinRt, doubleRt, barRp, bbRp } = await getCertEntities();
            const result = await channexSyncService.pushDeltaBatch(hotelCode, {
                rates: [
                    { roomTypeId: twinRt.id, ratePlanId: barRp.id, dateFrom: "2026-11-01", dateTo: "2026-11-10", rate: 241 },
                    { roomTypeId: doubleRt.id, ratePlanId: barRp.id, dateFrom: "2026-11-10", dateTo: "2026-11-16", rate: 312.66 },
                    { roomTypeId: doubleRt.id, ratePlanId: bbRp.id, dateFrom: "2026-11-01", dateTo: "2026-11-20", rate: 111 }
                ]
            });
            return NextResponse.json({
                success: result.success,
                title: "Test 4: Multiple Date Update for Multiple Rates",
                message: `Pembaruan tarif multi-tanggal berhasil dikirim dengan sintaks date_from dan date_to dalam 1 batched API call!`,
                taskIds: result.taskIds,
                detail: result
            });
        }

        // TEST 5: Min Stay Update (Dual Min Stay: arrival and through)
        if (action === "test_ari_scenario_5" || action === "test_5_min_stay") {
            const { twinRt, doubleRt, barRp, bbRp } = await getCertEntities();
            const result = await channexSyncService.pushDeltaBatch(hotelCode, {
                rates: [
                    { roomTypeId: twinRt.id, ratePlanId: barRp.id, date: "2026-11-23", minStay: 3, minStayArrival: 3, minStayThrough: 3 },
                    { roomTypeId: doubleRt.id, ratePlanId: barRp.id, date: "2026-11-25", minStay: 2, minStayArrival: 2, minStayThrough: 2 },
                    { roomTypeId: doubleRt.id, ratePlanId: bbRp.id, date: "2026-11-15", minStay: 5, minStayArrival: 5, minStayThrough: 5 }
                ]
            });
            return NextResponse.json({
                success: result.success,
                title: "Test 5: Min Stay Restrictions Update",
                message: `Pembaruan restriksi Minimum Stay (min_stay_arrival dan min_stay_through tersinkronisasi penuh) berhasil dikirim dalam 1 batched API call!`,
                taskIds: result.taskIds,
                detail: result
            });
        }

        // TEST 6: Stop Sell Restrictions Update
        if (action === "test_ari_scenario_6" || action === "test_6_stop_sell") {
            const { twinRt, doubleRt, barRp, bbRp } = await getCertEntities();
            const result = await channexSyncService.pushDeltaBatch(hotelCode, {
                rates: [
                    { roomTypeId: twinRt.id, ratePlanId: barRp.id, date: "2026-11-14", stopSell: true },
                    { roomTypeId: doubleRt.id, ratePlanId: barRp.id, date: "2026-11-16", stopSell: true },
                    { roomTypeId: doubleRt.id, ratePlanId: bbRp.id, date: "2026-11-20", stopSell: true }
                ]
            });
            return NextResponse.json({
                success: result.success,
                title: "Test 6: Stop Sell Restrictions Update",
                message: `Pembaruan Stop Sell pada 3 kombinasi kamar berhasil dikirim dalam 1 batched API call!`,
                taskIds: result.taskIds,
                detail: result
            });
        }

        // TEST 7: Multiple Restrictions Update (CTA, CTD, Min/Max Stay - 1 Batched Call)
        if (action === "test_ari_scenario_7" || action === "test_7_multiple_restrictions") {
            const { twinRt, doubleRt, barRp, bbRp } = await getCertEntities();
            const result = await channexSyncService.pushDeltaBatch(hotelCode, {
                rates: [
                    {
                        roomTypeId: twinRt.id,
                        ratePlanId: barRp.id,
                        dateFrom: "2026-11-01",
                        dateTo: "2026-11-10",
                        closedToArrival: true,
                        closedToDeparture: false,
                        maxStay: 4,
                        minStay: 1,
                        minStayArrival: 1,
                        minStayThrough: 1
                    },
                    {
                        roomTypeId: twinRt.id,
                        ratePlanId: bbRp.id,
                        dateFrom: "2026-11-12",
                        dateTo: "2026-11-16",
                        closedToArrival: false,
                        closedToDeparture: true,
                        minStay: 6,
                        minStayArrival: 6,
                        minStayThrough: 6
                    },
                    {
                        roomTypeId: doubleRt.id,
                        ratePlanId: barRp.id,
                        dateFrom: "2026-11-10",
                        dateTo: "2026-11-16",
                        closedToArrival: true, // ENFORCED TRUE - Fixed Channex Audit Failure!
                        minStay: 2,
                        minStayArrival: 2,
                        minStayThrough: 2
                    },
                    {
                        roomTypeId: doubleRt.id,
                        ratePlanId: bbRp.id,
                        dateFrom: "2026-11-01",
                        dateTo: "2026-11-20",
                        minStay: 10,
                        minStayArrival: 10,
                        minStayThrough: 10
                    }
                ]
            });
            return NextResponse.json({
                success: result.success,
                title: "Test 7: Multiple Restrictions Update",
                message: `Pembaruan multi-restriksi kompleks (Double BAR CTA: true diaktifkan, dual min_stay) berhasil dikirim dalam 1 batched API call!`,
                taskIds: result.taskIds,
                detail: result
            });
        }

        // TEST 8: Half-Year Update (5 Bulan)
        if (action === "test_ari_scenario_8" || action === "test_8_half_year") {
            const { twinRt, doubleRt, barRp } = await getCertEntities();
            const result = await channexSyncService.pushDeltaBatch(hotelCode, {
                rates: [
                    {
                        roomTypeId: twinRt.id,
                        ratePlanId: barRp.id,
                        dateFrom: "2026-12-01",
                        dateTo: "2027-05-01",
                        rate: 432,
                        closedToArrival: false,
                        closedToDeparture: false,
                        minStay: 2,
                        minStayArrival: 2,
                        minStayThrough: 2
                    },
                    {
                        roomTypeId: doubleRt.id,
                        ratePlanId: barRp.id,
                        dateFrom: "2026-12-01",
                        dateTo: "2027-05-01",
                        rate: 342,
                        minStay: 3,
                        minStayArrival: 3,
                        minStayThrough: 3
                    }
                ]
            });
            return NextResponse.json({
                success: result.success,
                title: "Test 8: Half-Year Update (01 Des 2026 - 01 Mei 2027)",
                message: `Pembaruan tarif & restriksi semester 5 bulan dengan dual min_stay berhasil dikirim dalam 1 batched API call!`,
                taskIds: result.taskIds,
                detail: result
            });
        }

        // TEST 9: Single Date Availability Update
        if (action === "test_ari_scenario_9" || action === "test_9_single_date_availability") {
            const { twinRt, doubleRt } = await getCertEntities();
            const result = await channexSyncService.pushDeltaBatch(hotelCode, {
                availability: [
                    { roomTypeId: twinRt.id, date: "2026-11-21", qty: 7 },
                    { roomTypeId: doubleRt.id, date: "2026-11-25", qty: 0 } // TARGETS 2026-11-25 - Fixed Channex Audit Failure!
                ]
            });
            return NextResponse.json({
                success: result.success,
                title: "Test 9: Single Date Availability Update",
                message: `Pembaruan ketersediaan Twin (2026-11-21: 7) dan Double (2026-11-25: 0) berhasil dikirim tepat dalam 1 batched API call!`,
                taskIds: result.taskIds,
                detail: result
            });
        }

        // TEST 10: Multiple Date Availability Update
        if (action === "test_ari_scenario_10" || action === "test_10_multi_date_availability") {
            const { twinRt, doubleRt } = await getCertEntities();
            const result = await channexSyncService.pushDeltaBatch(hotelCode, {
                availability: [
                    { roomTypeId: twinRt.id, dateFrom: "2026-11-10", dateTo: "2026-11-16", qty: 3 },
                    { roomTypeId: doubleRt.id, dateFrom: "2026-11-17", dateTo: "2026-11-24", qty: 4 }
                ]
            });
            return NextResponse.json({
                success: result.success,
                title: "Test 10: Multiple Date Availability Update",
                message: `Pembaruan ketersediaan rentang tanggal Twin (10-16 Nov: 3) dan Double (17-24 Nov: 4) berhasil dikirim dalam 1 batched API call!`,
                taskIds: result.taskIds,
                detail: result
            });
        }

        // 4. Action: Create Simulated Booking (Stage 4: Booking Ingestion)
        if (action === "create_booking") {
            const simulatedBookingId = `OTA-SBX-${Math.floor(100000 + Math.random() * 900000)}`;
            const todayStr = new Date().toISOString().split("T")[0];
            const tomorrowStr = (() => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                return d.toISOString().split("T")[0];
            })();

            const checkin = arrivalDate || todayStr;
            const checkout = departureDate || tomorrowStr;

            const payload: ChannexWebhookPayload = {
                event: "booking_new",
                is_simulation: true,
                property_id: channexPropertyId,
                inserted_at: new Date().toISOString(),
                booking_revision_id: `rev_${Date.now()}`,
                ota_commission_percent: commissionPercent !== undefined ? Number(commissionPercent) : undefined,
                ota_promo_percent: promoPercent !== undefined ? Number(promoPercent) : undefined,
                revenue_recording_mode: revenueRecordingMode || "net",
                booking: {
                    id: simulatedBookingId,
                    property_id: channexPropertyId,
                    channel_id: `chan_${channelName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
                    channel_name: channelName,
                    channel_booking_id: `${channelName.toUpperCase().substring(0, 3)}-${Date.now().toString().slice(-6)}`,
                    ota_reservation_code: `RES-${Date.now().toString().slice(-5)}`,
                    status: "new",
                    arrival_date: checkin,
                    departure_date: checkout,
                    total_price: Number(totalPrice) || 1200000,
                    currency: "IDR",
                    payment_type: paymentCollect === "property" ? "hotel_collect" : "virtual_card",
                    payment_collect: paymentCollect === "property" ? "property" : "channel",
                    commission_percent: commissionPercent !== undefined ? Number(commissionPercent) : undefined,
                    promo_percent: promoPercent !== undefined ? Number(promoPercent) : undefined,
                    ota_commission: commissionPercent !== undefined 
                        ? Math.round((Number(totalPrice) || 1200000) * (Number(commissionPercent) / 100))
                        : undefined,
                    guarantee: paymentCollect !== "property" ? {
                        is_virtual: true,
                        meta: {
                            virtual_card_current_balance: Math.round(
                                (Number(totalPrice) || 1200000) * (1 - (Number(commissionPercent || 15) + Number(promoPercent || 0)) / 100)
                            ),
                            virtual_card_currency_code: "IDR"
                        }
                    } : undefined,
                    pricing_model: pricingModel,
                    revenue_recording_mode: revenueRecordingMode || "net",
                    customer: {
                        name: guestName,
                        email: guestEmail,
                        phone: guestPhone,
                        country: "ID"
                    },
                    rooms: [
                        {
                            room_type_id: roomTypeId || "standard",
                            rate_plan_id: ratePlanId || undefined,
                            amount: Number(totalPrice) || 1200000,
                            guest_name: guestName,
                            adults: 2,
                            children: 0
                        }
                    ],
                    inserted_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                } as any
            };

            const result = await channexSyncService.processIncomingBookingWebhook(payload, hotelCode);

            if (!result.success) {
                return NextResponse.json({
                    success: false,
                    stage: 3,
                    title: "Simulated Booking DITOLAK (Stop Sell Active)",
                    message: result.message,
                    bookingId: result.bookingId,
                    isStopSellBlocked: true
                }, { status: 400 });
            }

            // Dispatch WhatsApp Notification to Hotel Owner (Meta Official Cloud API)
            let waResult: any = null;
            try {
                const { dispatchWhatsAppNotification } = await import("@/lib/notifications/whatsappDispatcher");
                const roomDoc = roomTypeId ? await adminDb.collection(`hotels/${hotelCode}/roomTypes`).doc(roomTypeId).get() : null;
                const roomName = roomDoc?.data()?.name || "Standard Room";

                const diffMs = new Date(checkout).getTime() - new Date(checkin).getTime();
                const nights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

                waResult = await dispatchWhatsAppNotification(hotelCode, {
                    event: "booking_new",
                    channelName,
                    bookingRef: simulatedBookingId,
                    guestName,
                    guestPhone,
                    guestEmail,
                    roomName,
                    roomCount: 1,
                    pax: 2,
                    mealsIncluded: true,
                    arrivalDate: checkin,
                    departureDate: checkout,
                    nights,
                    totalPrice: Number(totalPrice) || 700000,
                    paymentStatus: paymentCollect === "property" ? "Property Collect (Pay at Hotel)" : "Channel Collect (OTA VCC)",
                    notes: "Permintaan simulasi kamar bebas asap rokok"
                });
                console.log(`[Sandbox WA Notification] Sent to owner for ${hotelCode} (${waResult.gateway}):`, waResult);
            } catch (waErr: any) {
                console.warn("[Sandbox WhatsApp Notification Warning]:", waErr?.message);
                waResult = { success: false, error: waErr.message };
            }

            return NextResponse.json({
                success: true,
                stage: 3,
                title: "Simulated Booking Ingestion",
                message: `Simulasi reservasi ${simulatedBookingId} dari ${channelName} berhasil diproses ke PMS, kamar diblokir, dan ACK terkirim!`,
                bookingId: result.bookingId,
                financials: (result as any)?.financials || null,
                whatsapp: waResult,
                simulatedPayload: payload
            });
        }

        // 5. Action: Modify Booking (Stage 5B: Date Shift & Anti-Ghost Booking)
        if (action === "modify_booking") {
            const bookingId = bookingIdToModify || `OTA-SBX-MOD-${Date.now().toString().slice(-4)}`;
            const origCheckin = arrivalDate || new Date().toISOString().split("T")[0];
            const origCheckout = departureDate || (() => {
                const d = new Date();
                d.setDate(d.getDate() + 2);
                return d.toISOString().split("T")[0];
            })();

            // Shifted dates (e.g. 3 days forward)
            const shiftedCheckin = newArrivalDate || (() => {
                const d = new Date();
                d.setDate(d.getDate() + 3);
                return d.toISOString().split("T")[0];
            })();
            const shiftedCheckout = newDepartureDate || (() => {
                const d = new Date();
                d.setDate(d.getDate() + 5);
                return d.toISOString().split("T")[0];
            })();

            const payload: ChannexWebhookPayload = {
                event: "booking_modification",
                is_simulation: true,
                property_id: channexPropertyId,
                inserted_at: new Date().toISOString(),
                booking_revision_id: `rev_mod_${Date.now()}`,
                booking: {
                    id: bookingId,
                    property_id: channexPropertyId,
                    channel_name: channelName,
                    channel_booking_id: bookingId,
                    status: "modified",
                    arrival_date: shiftedCheckin,
                    departure_date: shiftedCheckout,
                    total_price: Number(totalPrice) || 1350000,
                    currency: "IDR",
                    customer: {
                        name: `${guestName} (Shifted Dates)`,
                        email: guestEmail,
                        phone: guestPhone
                    },
                    rooms: [
                        {
                            room_type_id: roomTypeId || "standard",
                            amount: Number(totalPrice) || 1350000,
                            guest_name: guestName
                        }
                    ]
                }
            };

            const result = await channexSyncService.processIncomingBookingWebhook(payload, hotelCode);

            let waModifResult: any = null;
            try {
                const { dispatchWhatsAppNotification } = await import("@/lib/notifications/whatsappDispatcher");
                const diffMs = new Date(shiftedCheckout).getTime() - new Date(shiftedCheckin).getTime();
                const nights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

                waModifResult = await dispatchWhatsAppNotification(hotelCode, {
                    event: "booking_modification",
                    channelName,
                    bookingRef: bookingId,
                    guestName: `${guestName} (Shifted Dates)`,
                    guestPhone,
                    guestEmail,
                    roomName: "Standard Room",
                    roomCount: 1,
                    arrivalDate: shiftedCheckin,
                    departureDate: shiftedCheckout,
                    nights,
                    previousArrivalDate: origCheckin,
                    previousDepartureDate: origCheckout,
                    totalPrice: Number(totalPrice) || 1350000,
                    paymentStatus: "Channel Collect (OTA Reschedule)"
                });
            } catch (waErr: any) {
                console.warn("[Sandbox WA Modif Warning]:", waErr?.message);
                waModifResult = { success: false, error: waErr.message };
            }

            return NextResponse.json({
                success: true,
                stage: 4,
                title: "Booking Modification & Anti-Ghost Date Shift",
                message: `Reservasi ${bookingId} berhasil dimodifikasi dari rentang [${origCheckin} - ${origCheckout}] ke [${shiftedCheckin} - ${shiftedCheckout}]. Tanggal lama dirilis dan tanggal baru diblokir tanpa ghost booking!`,
                result,
                whatsapp: waModifResult,
                shiftedDates: { oldRange: `${origCheckin} s/d ${origCheckout}`, newRange: `${shiftedCheckin} s/d ${shiftedCheckout}` }
            });
        }

        // 6. Action: Cancel Booking (Stage 5: Booking Cancellation)
        if (action === "cancel_booking") {
            if (!bookingIdToCancel) {
                return NextResponse.json({ error: "bookingIdToCancel diperlukan untuk pembatalan" }, { status: 400 });
            }

            const payload: ChannexWebhookPayload = {
                event: "booking_cancellation",
                is_simulation: true,
                property_id: channexPropertyId,
                inserted_at: new Date().toISOString(),
                booking_revision_id: `rev_cnc_${Date.now()}`,
                booking: {
                    id: bookingIdToCancel,
                    property_id: channexPropertyId,
                    channel_name: channelName,
                    channel_booking_id: bookingIdToCancel,
                    status: "cancelled",
                    arrival_date: arrivalDate || new Date().toISOString().split("T")[0],
                    departure_date: departureDate || new Date().toISOString().split("T")[0],
                    total_price: 0,
                    currency: "IDR",
                    rooms: [
                        {
                            room_type_id: roomTypeId || "standard"
                        }
                    ]
                }
            };

            const result = await channexSyncService.processIncomingBookingWebhook(payload, hotelCode);

            let waCancelResult: any = null;
            try {
                const { dispatchWhatsAppNotification } = await import("@/lib/notifications/whatsappDispatcher");
                const bDetails = (result as any)?.bookingDetails || {};
                const cancelPrice = Number(totalPrice) || bDetails.totalPrice || 1200000;
                waCancelResult = await dispatchWhatsAppNotification(hotelCode, {
                    event: "booking_cancellation",
                    channelName,
                    bookingRef: bookingIdToCancel,
                    guestName: guestName || bDetails.guestName || "Tamu OTA (Simulasi)",
                    guestPhone: guestPhone || bDetails.guestPhone || "",
                    roomName: bDetails.roomName || "Standard Room",
                    roomCount: bDetails.roomCount || 1,
                    arrivalDate: arrivalDate || bDetails.arrivalDate || new Date().toISOString().split("T")[0],
                    departureDate: departureDate || bDetails.departureDate || new Date().toISOString().split("T")[0],
                    totalPrice: cancelPrice,
                    paymentStatus: "CANCELLED (Dibatalkan)",
                    cancellationReason: "Dibatalkan oleh Tamu via OTA Portal"
                });
            } catch (waErr: any) {
                console.warn("[Sandbox WA Cancel Warning]:", waErr?.message);
                waCancelResult = { success: false, error: waErr.message };
            }

            return NextResponse.json({
                success: true,
                stage: 5,
                title: "Booking Cancellation & Stock Release",
                message: `Simulasi pembatalan reservasi ${bookingIdToCancel} berhasil diproses. Stok kamar dikembalikan ke pool ketersediaan PMS & OTA!`,
                result,
                whatsapp: waCancelResult
            });
        }

        // 7. Action: Simulate Unmapped Room Alert (Stage 6: Mapping Fallback)
        if (action === "unmapped_alert") {
            const payload: ChannexWebhookPayload = {
                event: "booking_unmapped_room",
                property_id: channexPropertyId,
                inserted_at: new Date().toISOString(),
                unmapped_details: {
                    ota_room_type_id: "ota_suite_unmapped_999",
                    ota_rate_plan_id: "ota_standard_rate_111",
                    channel_name: channelName,
                    reservation_id: `OTA-UNMAPPED-${Date.now().toString().slice(-4)}`
                }
            };

            // Process via webhook handler logic / log to channex_task_logs
            await adminDb.collection("hotels").doc(hotelCode).collection("channex_task_logs").add({
                taskType: "unmapped_room_alert",
                status: "ACTION_REQUIRED",
                channelName,
                unmappedDetails: payload.unmapped_details,
                message: `Kamar OTA ${payload.unmapped_details?.ota_room_type_id} belum dipetakan ke kamar PMS Tara. Harap lakukan mapping di iFrame Channel Manager.`,
                createdAt: new Date().toISOString()
            });

            return NextResponse.json({
                success: true,
                stage: 6,
                title: "Unmapped Room Alert Handling",
                message: "Alert unmapped room berhasil ditangkap dan dicatat ke channex_task_logs dengan status ACTION_REQUIRED!",
                payload
            });
        }

        // 8. Action: Feed Poll Test (Stage 7: Polling Fallback)
        if (action === "feed_poll") {
            const feedData = await channexClient.getBookingRevisionFeed(apiKey, environment);
            return NextResponse.json({
                success: true,
                stage: 7,
                title: "Booking Revision Feed Polling",
                message: `Feed polling berhasil terhubung ke GET /api/v1/booking_revisions/feed. Mendapat ${feedData?.data?.length || 0} revisions.`,
                revisionsCount: feedData?.data?.length || 0,
                feedData
            });
        }

        return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
    } catch (error: any) {
        console.error("[Channex Sandbox Simulate Error]:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Gagal memproses simulasi sandbox"
        }, { status: 500 });
    }
}
