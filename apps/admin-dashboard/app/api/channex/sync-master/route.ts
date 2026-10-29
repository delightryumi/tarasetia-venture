import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { channexClient } from "@/lib/channex/channexClient";
import { channexSyncService } from "@/lib/channex/syncService";
import { formatRateForChannex } from "@/lib/currency-utils";
import { requireHotelAccess } from "@/lib/security/serverAuth";

/**
 * Route: POST /api/channex/sync-master
 * Production Registration & Two-Way Master Synchronization
 * - Registers real hotel properties to Channex
 * - Auto-detects if property was deleted on Channex (404 recovery)
 * - Pushes Room Types and Rate Plans with dynamic hotel currency
 * - Supports clean un-link / disconnect
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { hotelCode, action, currency: requestedCurrency } = body;

        if (!hotelCode) {
            return NextResponse.json({ error: "hotelCode is required" }, { status: 400 });
        }

        const authCheck = await requireHotelAccess(req, hotelCode);
        if ("errorResponse" in authCheck) return authCheck.errorResponse;

        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        if (!hotelDoc.exists) {
            return NextResponse.json({ error: `Hotel [${hotelCode}] not found` }, { status: 404 });
        }

        const hotelData = hotelDoc.data();
        let channexPropertyId = hotelData?.channexPropertyId || hotelData?.channelManager?.channexPropertyId || hotelData?.channelManager?.propertyId;
        let customApiKey = hotelData?.channelManager?.apiKey || hotelData?.channexApiKey || process.env.CHANNEX_API_KEY;
        let env = hotelData?.channelManager?.env || hotelData?.channelManager?.environment || "staging";

        if (!customApiKey) {
            try {
                const sysDoc = await adminDb.collection("system_settings").doc("channex").get();
                if (sysDoc.exists) {
                    const sData = sysDoc.data();
                    if (sData?.apiKey) {
                        customApiKey = sData.apiKey;
                        env = sData.env || env;
                    }
                }
            } catch (sysErr) {
                console.warn("[SyncMaster] Failed to read system_settings/channex:", sysErr);
            }
        }

        if (!customApiKey) {
            return NextResponse.json({
                error: "API Key Channex belum diisi. Masukkan User API Key di tab 'API Credentials & Production' terlebih dahulu."
            }, { status: 400 });
        }

        // ==========================================
        // ACTION: UNLINK / RESET CONNECTION
        // ==========================================
        if (action === "unlink") {
            // Attempt to delete property on Channex server if propertyId exists
            if (channexPropertyId && customApiKey) {
                try {
                    await channexClient.deleteProperty(channexPropertyId, customApiKey, env);
                    console.log(`[ChannexUnlink] Successfully deleted property ${channexPropertyId} on Channex server.`);
                } catch (delErr: any) {
                    console.log(`[ChannexUnlink] Note: Channex server returned (${delErr.message}). Clearing local database link.`);
                }
            }

            const currentCm = hotelData?.channelManager || {};
            const updatedCm = { ...currentCm };
            delete updatedCm.channexPropertyId;
            delete updatedCm.propertyId;
            delete updatedCm.openChannelHotelCode;
            updatedCm.isSyncActive = false;
            updatedCm.lastSyncAt = null;

            await adminDb.collection("hotels").doc(hotelCode).update({
                channexPropertyId: FieldValue.delete(),
                channelManager: updatedCm
            });

            const rtSnap = await adminDb.collection(`hotels/${hotelCode}/roomTypes`).get();
            for (const d of rtSnap.docs) {
                if (d.data()?.channexRoomTypeId) {
                    await d.ref.update({ channexRoomTypeId: FieldValue.delete() });
                }
            }

            const rpSnap = await adminDb.collection(`hotels/${hotelCode}/ratePlans`).get();
            for (const d of rpSnap.docs) {
                const rData = d.data();
                if (rData?.channexRatePlanId || rData?.channexRatePlanIds) {
                    await d.ref.update({ 
                        channexRatePlanId: FieldValue.delete(),
                        channexRatePlanIds: FieldValue.delete()
                    });
                }
            }

            return NextResponse.json({
                success: true,
                message: `Koneksi properti Channex untuk [${hotelData?.name || hotelCode}] berhasil diputus dan di-reset.`
            });
        }

        // Determine active hotel currency (requested > hotelData > default IDR)
        const targetCurrency = (requestedCurrency || hotelData?.currency || hotelData?.channelManager?.currency || "IDR").toUpperCase().trim();

        // Save currency to hotel doc if updated
        if (hotelData?.currency !== targetCurrency || hotelData?.channelManager?.currency !== targetCurrency) {
            await adminDb.collection("hotels").doc(hotelCode).set({
                currency: targetCurrency,
                baseCurrency: targetCurrency,
                "settings.currency": targetCurrency,
                "channelManager.currency": targetCurrency
            }, { merge: true });
        }

        // ==========================================
        // 1. VERIFY OR CREATE PROPERTY ON CHANNEX
        // ==========================================
        let propertyNeedsCreation = !channexPropertyId;

        // If ID exists locally, verify if it still exists on Channex (handle remote deletion / 404)
        if (channexPropertyId) {
            try {
                await channexClient.getProperty(channexPropertyId, customApiKey, env);
            } catch (checkErr: any) {
                if (checkErr.message?.includes("404") || checkErr.message?.toLowerCase().includes("not found")) {
                    console.warn(`[SyncMaster] Channex property ${channexPropertyId} not found on Channex (deleted). Creating a new one...`);
                    propertyNeedsCreation = true;
                    channexPropertyId = null;
                }
            }
        }

        if (propertyNeedsCreation) {
            try {
                const hotelTitle = hotelData?.name || hotelData?.propertyName || `Hotel ${hotelCode}`;
                console.log(`[SyncMaster] Registering new property on Channex: "${hotelTitle}" (${targetCurrency})...`);
                
                let groupToAssign: string | undefined = undefined;
                if (hotelData?.groupId) {
                    const groupSnap = await adminDb.collection("hotel_groups").doc(hotelData.groupId).get();
                    if (groupSnap.exists) {
                        groupToAssign = groupSnap.data()?.channexGroupId || hotelData.groupId;
                    } else if (hotelData.groupId.length > 20) {
                        groupToAssign = hotelData.groupId;
                    }
                }

                const createdProp = await channexClient.createProperty({
                    title: hotelTitle,
                    currency: targetCurrency,
                    timezone: hotelData?.timezone || "Asia/Jakarta",
                    country: hotelData?.country || "ID",
                    address: hotelData?.address || "Indonesia",
                    email: hotelData?.email || undefined,
                    phone: hotelData?.phone || undefined,
                    group_id: groupToAssign
                }, customApiKey, env);

                channexPropertyId = createdProp?.data?.id;
                if (!channexPropertyId) {
                    throw new Error("Channex tidak mengembalikan Property ID");
                }

                await adminDb.collection("hotels").doc(hotelCode).set({
                    channexPropertyId,
                    currency: targetCurrency,
                    channelManager: {
                        channexPropertyId,
                        currency: targetCurrency,
                        isSyncActive: true,
                        lastSyncAt: new Date().toISOString()
                    }
                }, { merge: true });

                console.log(`[SyncMaster] Property successfully registered on Channex with ID: ${channexPropertyId}`);
            } catch (err: any) {
                return NextResponse.json({ error: `Gagal mendaftarkan properti di Channex: ${err.message}` }, { status: 500 });
            }
        }

        if (!channexPropertyId) {
            return NextResponse.json({ error: "Gagal mengaitkan Property ID Channex" }, { status: 500 });
        }

        // ==========================================
        // 2. FETCH EXISTING ROOM TYPES ON CHANNEX
        // ==========================================
        let existingChannexRooms: any[] = [];
        try {
            const channexRoomsRes = await channexClient.getRoomTypes(channexPropertyId, customApiKey, env);
            existingChannexRooms = channexRoomsRes?.data || [];
        } catch (e) {
            console.warn("[SyncMaster] Warning fetching existing room types from Channex:", e);
        }

        // ==========================================
        // 3. SYNC LOCAL ROOM TYPES TO CHANNEX
        // ==========================================
        const roomTypesSnap = await adminDb.collection(`hotels/${hotelCode}/roomTypes`).get();
        const localRoomTypes = roomTypesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const roomTypeMapping: Record<string, string> = {}; // localId -> channexRoomTypeId
        let syncedRoomsCount = 0;

        for (const rt of localRoomTypes as any[]) {
            const totalRooms = Math.max(1, Number(rt.totalRooms || rt.roomCount || (rt.physicalRooms?.length) || 1));
            const capacity = Math.max(1, Number(rt.capacity || rt.occAdults || 2));
            const roomTitle = rt.name || rt.roomTypeName || "Standard Room";

            // Check if already exists on Channex
            const existing = existingChannexRooms.find((cr: any) => 
                cr.id === rt.channexRoomTypeId || 
                cr.attributes?.title?.toLowerCase() === roomTitle.toLowerCase()
            );

            let assignedChannexRoomId = existing?.id;

            if (!assignedChannexRoomId) {
                try {
                    const createdRoom = await channexClient.createRoomType({
                        property_id: channexPropertyId,
                        title: roomTitle,
                        count_of_rooms: totalRooms,
                        occ_adults: capacity,
                        occ_children: Number(rt.occChildren ?? 0),
                        occ_infants: Number(rt.occInfants ?? 0),
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
                if (rt.channexRoomTypeId !== assignedChannexRoomId) {
                    await adminDb.collection(`hotels/${hotelCode}/roomTypes`).doc(rt.id).update({
                        channexRoomTypeId: assignedChannexRoomId
                    });
                }
            }
        }

        // ==========================================
        // 4. FETCH EXISTING RATE PLANS ON CHANNEX
        // ==========================================
        let existingChannexRates: any[] = [];
        try {
            const channexRatesRes = await channexClient.getRatePlans(channexPropertyId, customApiKey, env);
            existingChannexRates = channexRatesRes?.data || [];
        } catch (e) {
            console.warn("[SyncMaster] Warning fetching existing rate plans from Channex:", e);
        }

        // ==========================================
        // 5. SYNC LOCAL RATE PLANS TO CHANNEX (Multi-Room Support)
        // ==========================================
        const ratePlansSnap = await adminDb.collection(`hotels/${hotelCode}/ratePlans`).get();
        const localRatePlans = ratePlansSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        let syncedRatePlansCount = 0;

        for (const rp of localRatePlans as any[]) {
            const rateTitle = rp.name || rp.ratePlanName || "Best Available Rate";
            
            // Determine all local room types linked to this rate plan
            let targetLocalRtIds: string[] = [];
            if (Array.isArray(rp.roomTypeIds) && rp.roomTypeIds.length > 0) {
                targetLocalRtIds = rp.roomTypeIds;
            } else if (rp.roomTypeId) {
                targetLocalRtIds = [rp.roomTypeId];
            } else {
                targetLocalRtIds = Object.keys(roomTypeMapping);
            }

            const updatedPlanChannexRateIds: Record<string, string> = { ...(rp.channexRatePlanIds || {}) };

            for (const localRtId of targetLocalRtIds) {
                const targetChannexRoomTypeId = roomTypeMapping[localRtId];
                if (!targetChannexRoomTypeId) continue;

                const localRt = localRoomTypes.find((r: any) => r.id === localRtId);
                const baseRate = Number(
                    rp.roomRates?.[localRtId] ?? 
                    rp.baseRate ?? 
                    rp.basePrice ?? 
                    rp.rate ?? 
                    (targetCurrency === "IDR" ? 500000 : 100)
                );
                const capacity = Math.max(1, Number(localRt?.capacity || localRt?.occAdults || 2));

                const existingRate = existingChannexRates.find((cr: any) => 
                    (cr.attributes?.room_type_id === targetChannexRoomTypeId && cr.attributes?.title?.toLowerCase() === rateTitle.toLowerCase()) ||
                    cr.id === updatedPlanChannexRateIds[localRtId] ||
                    (cr.id === rp.channexRatePlanId && cr.attributes?.room_type_id === targetChannexRoomTypeId)
                );

                let assignedChannexRateId = existingRate?.id;

                if (!assignedChannexRateId) {
                    try {
                        const createdPlan = await channexClient.createRatePlan({
                            property_id: channexPropertyId,
                            room_type_id: targetChannexRoomTypeId,
                            title: rateTitle,
                            currency: targetCurrency,
                            options: [
                                {
                                    occupancy: capacity,
                                    rate: formatRateForChannex(baseRate, targetCurrency),
                                    is_primary: true
                                }
                            ]
                        }, customApiKey, env);

                        assignedChannexRateId = createdPlan?.data?.id;
                        syncedRatePlansCount++;
                    } catch (rateErr: any) {
                        console.error(`[SyncMaster] Error creating rate plan ${rateTitle} for room type ${targetChannexRoomTypeId} on Channex:`, rateErr);
                    }
                }

                if (assignedChannexRateId) {
                    updatedPlanChannexRateIds[localRtId] = assignedChannexRateId;
                }
            }

            const primaryChannexRateId = updatedPlanChannexRateIds[rp.roomTypeId] || Object.values(updatedPlanChannexRateIds)[0] || rp.channexRatePlanId;
            if (primaryChannexRateId || Object.keys(updatedPlanChannexRateIds).length > 0) {
                await adminDb.collection(`hotels/${hotelCode}/ratePlans`).doc(rp.id).update({
                    channexRatePlanIds: updatedPlanChannexRateIds,
                    channexRatePlanId: primaryChannexRateId || FieldValue.delete()
                });
            }
        }

        // ==========================================
        // 6. INITIAL FULL PROPERTY ARI SEED (60 DAYS)
        // ==========================================
        try {
            await channexSyncService.fullPropertySync(hotelCode, 60);
            console.log(`[SyncMaster] Initial 60-day ARI (Availability & Restrictions) pushed successfully.`);
        } catch (ariErr) {
            console.warn("[SyncMaster] Warning pushing initial full property ARI:", ariErr);
        }

        return NextResponse.json({
            success: true,
            propertyId: channexPropertyId,
            currency: targetCurrency,
            syncedRooms: syncedRoomsCount,
            syncedRatePlans: syncedRatePlansCount,
            totalLocalRooms: localRoomTypes.length,
            totalLocalRatePlans: localRatePlans.length,
            message: `Properti [${hotelData?.name || hotelCode}] berhasil didaftarkan dan disinkronkan ke Channex (${targetCurrency})! (${localRoomTypes.length} tipe kamar, ${localRatePlans.length} rate plan)`
        });
    } catch (error: any) {
        console.error("[Channex Sync-Master Error]:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Gagal menyinkronkan master kamar dan rate plan ke Channex"
        }, { status: 500 });
    }
}
