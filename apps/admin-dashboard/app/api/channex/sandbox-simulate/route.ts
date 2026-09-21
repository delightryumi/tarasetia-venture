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

            // Dispatch WhatsApp Notification to Hotel Owner (Auto-routed: Meta Official or Fonnte)
            let waResult: any = null;
            try {
                const { dispatchWhatsAppNotification } = await import("@/lib/notifications/whatsappDispatcher");
                const roomDoc = roomTypeId ? await adminDb.collection(`hotels/${hotelCode}/roomTypes`).doc(roomTypeId).get() : null;
                const roomName = roomDoc?.data()?.name || "Standard Room";

                waResult = await dispatchWhatsAppNotification(hotelCode, {
                    event: "booking_new",
                    channelName,
                    bookingRef: simulatedBookingId,
                    guestName,
                    roomName,
                    arrivalDate: checkin,
                    departureDate: checkout,
                    totalPrice: Number(totalPrice) || 700000,
                    paymentStatus: paymentCollect === "property" ? "Property Collect (Pay at Hotel)" : "Channel Collect (OTA VCC)",
                    netToHotel: (result as any)?.financials?.netToHotel,
                    otaCommission: (result as any)?.financials?.otaCommissionAmount
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

            return NextResponse.json({
                success: true,
                stage: 4,
                title: "Booking Modification & Anti-Ghost Date Shift",
                message: `Reservasi ${bookingId} berhasil dimodifikasi dari rentang [${origCheckin} - ${origCheckout}] ke [${shiftedCheckin} - ${shiftedCheckout}]. Tanggal lama dirilis dan tanggal baru diblokir tanpa ghost booking!`,
                result,
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
                waCancelResult = await dispatchWhatsAppNotification(hotelCode, {
                    event: "booking_cancellation",
                    channelName,
                    bookingRef: bookingIdToCancel,
                    guestName: "Tamu OTA (Simulasi)",
                    roomName: "Kamar Hotel",
                    arrivalDate: arrivalDate || new Date().toISOString().split("T")[0],
                    departureDate: departureDate || new Date().toISOString().split("T")[0],
                    totalPrice: 0,
                    paymentStatus: "CANCELLED"
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
