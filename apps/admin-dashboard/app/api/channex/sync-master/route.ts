import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { channexClient } from "@/lib/channex/channexClient";
import { channexSyncService } from "@/lib/channex/syncService";

/**
 * Route: POST /api/channex/sync-master
 * Pushes Room Types and Rate Plans from My Tara to Channex automatically.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { hotelCode } = body;

        if (!hotelCode) {
            return NextResponse.json({ error: "hotelCode is required" }, { status: 400 });
        }

        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        if (!hotelDoc.exists) {
            return NextResponse.json({ error: `Hotel [${hotelCode}] not found` }, { status: 404 });
        }

        const hotelData = hotelDoc.data();
        let channexPropertyId = hotelData?.channexPropertyId || hotelData?.channelManager?.channexPropertyId;
        const customApiKey = hotelData?.channelManager?.apiKey || process.env.CHANNEX_API_KEY;
        const env = hotelData?.channelManager?.env || "staging";

        if (!customApiKey) {
            return NextResponse.json({
                error: "API Key Channex belum diisi. Masukkan User API Key di tab 'Konfigurasi & Akun Channex' terlebih dahulu."
            }, { status: 400 });
        }

        // 1. Ensure Property exists on Channex
        if (!channexPropertyId) {
            try {
                const createdProp = await channexClient.createProperty({
                    title: hotelData?.name || `Partner Hotel ${hotelCode}`,
                    currency: "IDR",
                    timezone: "Asia/Jakarta",
                    country: "ID",
                    address: hotelData?.address || "Indonesia"
                }, customApiKey, env);

                channexPropertyId = createdProp?.data?.id;
                if (channexPropertyId) {
                    await adminDb.collection("hotels").doc(hotelCode).set({
                        channexPropertyId,
                        channelManager: {
                            channexPropertyId,
                            isSyncActive: true,
                            lastSyncAt: new Date().toISOString()
                        }
                    }, { merge: true });
                }
            } catch (err: any) {
                return NextResponse.json({ error: `Gagal membuat properti di Channex: ${err.message}` }, { status: 500 });
            }
        }

        if (!channexPropertyId) {
            return NextResponse.json({ error: "Gagal mengaitkan Property ID Channex" }, { status: 500 });
        }

        // 2. Fetch existing Room Types on Channex
        let existingChannexRooms: any[] = [];
        try {
            const channexRoomsRes = await channexClient.getRoomTypes(channexPropertyId, customApiKey, env);
            existingChannexRooms = channexRoomsRes?.data || [];
        } catch (e) {
            console.warn("[SyncMaster] Warning fetching existing room types from Channex:", e);
        }

        // 3. Fetch local Room Types from Firestore
        const roomTypesSnap = await adminDb.collection(`hotels/${hotelCode}/roomTypes`).get();
        const localRoomTypes = roomTypesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const roomTypeMapping: Record<string, string> = {}; // localId -> channexRoomTypeId
        let syncedRoomsCount = 0;

        for (const rt of localRoomTypes as any[]) {
            const totalRooms = Number(rt.totalRooms || rt.roomCount || (rt.physicalRooms?.length) || 1);
            const capacity = Number(rt.capacity || 2);
            const roomTitle = rt.name || "Standard Room";

            // Check if already on Channex
            const existing = existingChannexRooms.find((cr: any) => 
                cr.id === rt.channexRoomTypeId || 
                cr.attributes?.title?.toLowerCase() === roomTitle.toLowerCase()
            );

            let assignedChannexRoomId = existing?.id || rt.channexRoomTypeId;

            if (!assignedChannexRoomId) {
                try {
                    const createdRoom = await channexClient.createRoomType({
                        property_id: channexPropertyId,
                        title: roomTitle,
                        count_of_rooms: totalRooms,
                        occ_adults: capacity,
                        occ_children: Number((rt as any).occChildren ?? 0),
                        occ_infants: Number((rt as any).occInfants ?? 0),
                        default_occupancy: capacity
                    }, customApiKey, env);

                    assignedChannexRoomId = createdRoom?.data?.id;
                    syncedRoomsCount++;
                } catch (roomErr: any) {
                    console.error(`[SyncMaster] Error creating room type ${roomTitle} on Channex:`, roomErr);
                }
            }

            if (assignedChannexRoomId) {
                roomTypeMapping[rt.id] = assignedChannexRoomId;
                // Update Firestore if changed
                if (rt.channexRoomTypeId !== assignedChannexRoomId) {
                    await adminDb.collection(`hotels/${hotelCode}/roomTypes`).doc(rt.id).update({
                        channexRoomTypeId: assignedChannexRoomId
                    });
                }
            }
        }

        // 4. Fetch existing Rate Plans on Channex
        let existingChannexRates: any[] = [];
        try {
            const channexRatesRes = await channexClient.getRatePlans(channexPropertyId, customApiKey, env);
            existingChannexRates = channexRatesRes?.data || [];
        } catch (e) {
            console.warn("[SyncMaster] Warning fetching existing rate plans from Channex:", e);
        }

        // 5. Fetch local Rate Plans from Firestore
        const ratePlansSnap = await adminDb.collection(`hotels/${hotelCode}/ratePlans`).get();
        const localRatePlans = ratePlansSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        let syncedRatePlansCount = 0;

        for (const rp of localRatePlans as any[]) {
            const targetChannexRoomTypeId = roomTypeMapping[rp.roomTypeId] || Object.values(roomTypeMapping)[0];
            if (!targetChannexRoomTypeId) continue;

            const rateTitle = rp.name || "Standard Rate";
            const baseRate = Number(rp.baseRate || rp.basePrice || rp.rate || 500000);

            const existingRate = existingChannexRates.find((cr: any) => 
                cr.id === rp.channexRatePlanId || 
                (cr.attributes?.title?.toLowerCase() === rateTitle.toLowerCase() && cr.attributes?.room_type_id === targetChannexRoomTypeId)
            );

            let assignedChannexRateId = existingRate?.id || rp.channexRatePlanId;

            if (!assignedChannexRateId) {
                try {
                    const createdPlan = await channexClient.createRatePlan({
                        property_id: channexPropertyId,
                        room_type_id: targetChannexRoomTypeId,
                        title: rateTitle,
                        currency: "IDR",
                        options: [
                            {
                                occupancy: 2,
                                rate: baseRate,
                                is_primary: true
                            }
                        ]
                    }, customApiKey, env);

                    assignedChannexRateId = createdPlan?.data?.id;
                    syncedRatePlansCount++;
                } catch (rateErr: any) {
                    console.error(`[SyncMaster] Error creating rate plan ${rateTitle} on Channex:`, rateErr);
                }
            }

            if (assignedChannexRateId && rp.channexRatePlanId !== assignedChannexRateId) {
                await adminDb.collection(`hotels/${hotelCode}/ratePlans`).doc(rp.id).update({
                    channexRatePlanId: assignedChannexRateId
                });
            }
        }

        // 6. Push initial availability for the next 30 days
        const start = new Date().toISOString().split("T")[0];
        const endD = new Date();
        endD.setDate(endD.getDate() + 30);
        const end = endD.toISOString().split("T")[0];

        try {
            await channexSyncService.recalculateAndPushAvailability(hotelCode, start, end);
        } catch (ariErr) {
            console.warn("[SyncMaster] Warning pushing initial availability:", ariErr);
        }

        return NextResponse.json({
            success: true,
            propertyId: channexPropertyId,
            syncedRooms: syncedRoomsCount,
            syncedRatePlans: syncedRatePlansCount,
            totalLocalRooms: localRoomTypes.length,
            totalLocalRatePlans: localRatePlans.length,
            message: `Berhasil menyinkronkan ${localRoomTypes.length} tipe kamar dan ${localRatePlans.length} rate plan ke Channex!`
        });
    } catch (error: any) {
        console.error("[Channex Sync-Master Error]:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Gagal menyinkronkan master kamar dan rate plan ke Channex"
        }, { status: 500 });
    }
}
