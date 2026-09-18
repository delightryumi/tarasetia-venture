import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { channexClient } from "@/lib/channex/channexClient";

/**
 * Mapping of internal TARA channel codes to Channex adapter codes (56+ Channex Adapters)
 */
const TARA_TO_CHANNEX_ADAPTERS: Record<string, string> = {
    booking_com: "BookingCom",
    agoda: "Agoda",
    traveloka: "Traveloka",
    tiket: "Tiket",
    expedia: "Expedia",
    airbnb: "AirBNB",
    trip_com: "CTrip",
    google_hotel: "GoogleHotelARI",
    hotelbeds: "Hotelbeds",
    webbeds: "WebBeds",
    mg_bedbank: "MGBedbank",
    dida_travel: "DidaTravel",
    klook: "Klook",
    hostelworld: "Hostelworld",
    hopper: "Hopper",
    hopper_homes: "HopperHomes",
    hoteltonight: "HotelTonight",
    hrs: "HRS",
    roibos: "Roibos",
    reconline: "Reconline",
    ostrovok: "Ostrovok",
    goibibo: "Goibibo",
    yatra: "Yatra",
    hipcamp: "Hipcamp",
    glampinghub: "GlampingHub",
    hotelrez: "HotelRez",
    hoteltrader: "HotelTrader",
    open_channel: "OpenChannel",
    book_direct_open: "BookDirectOpen",
    cakrahub: "CakrahubBookingEngine",
    zenith: "ZenithBookingEngine",
    one_hotel_rez: "OneHotelRez",
    ascend_travel: "AscendTravel",
    avis: "Avis",
    budget: "Budget",
    europcar: "Europcar",
    hertz: "Hertz",
    crewdogs: "Crewdogs",
    dolcebot: "DolceBot",
    gopaddi: "Gopaddi",
    grevon_ai: "GrevonAI",
    guirez: "Guirez",
    guru_hotel: "GuruHotel",
    heytrip: "Heytrip",
    hlc_plus: "HLCPlus",
    hotel_point: "HotelPoint",
    jood_booking: "JoodBooking",
    julian_alps: "JulianAlpsBooking",
    levart: "Levart",
    more_com: "MoreCom",
    open_shopping: "OpenShopping",
    out_reserve: "OutReserve",
    padelbound: "Padelbound",
    payless: "Payless",
    reserva: "Reserva",
    revchill: "RevChill",
    revenatium: "Revenatium",
    room_panda: "RoomPanda",
    rukiye_zara: "RukiyeZara",
    selah_comfort: "SelahComfort",
    stayinto: "Stayinto",
    travia: "Travia",
    tripnera: "Tripnera",
    wespeak: "WeSpeak",
    wespeak_open: "WeSpeakOpen",
    wigwam_holidays: "WigwamHolidays",
    custom_engine: "OpenChannel"
};

/**
 * Helper to resolve hotel config (Channex Property ID, API Key, Environment)
 */
async function getHotelChannexContext(hotelCode: string, requirePropertyId: boolean = true) {
    const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
    if (!hotelDoc.exists) {
        throw new Error(`Hotel [${hotelCode}] tidak ditemukan di database.`);
    }

    const hotelData = hotelDoc.data() || {};
    const cm = hotelData.channelManager || {};

    const channexPropertyId = hotelData.channexPropertyId || cm.channexPropertyId || cm.propertyId || "";
    const apiKey = cm.apiKey || process.env.CHANNEX_API_KEY || "";
    const env = (cm.env === "production" ? "production" : "staging") as "staging" | "production";

    if (requirePropertyId && !channexPropertyId) {
        throw new Error(`Hotel [${hotelCode}] belum terhubung ke Properti Channex. Silakan buka tab Kredensial API terlebih dahulu.`);
    }

    return {
        hotelData,
        cm,
        channexPropertyId,
        apiKey,
        env
    };
}

/**
 * GET /api/channex/channels?hotelCode=1
 * Fetches connected channels from Channex and merges with local TARA configs
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const hotelCode = searchParams.get("hotelCode");

        if (!hotelCode) {
            return NextResponse.json({ error: "hotelCode is required" }, { status: 400 });
        }

        const { channexPropertyId, apiKey, env, cm } = await getHotelChannexContext(hotelCode, false);

        // Fetch live channels from Channex for this property if propertyId exists
        let channexChannels: any[] = [];
        if (channexPropertyId && apiKey) {
            try {
                const channexRes = await channexClient.getChannels(channexPropertyId, apiKey, env);
                channexChannels = channexRes?.data || [];
            } catch (apiErr: any) {
                console.warn(`[Channex Channels GET] Warning fetching from Channex:`, apiErr.message);
            }
        }

        return NextResponse.json({
            success: true,
            hotelCode,
            channexPropertyId,
            env,
            channexChannels,
            localChannels: cm.channels || {}
        });
    } catch (err: any) {
        console.error("[Channex Channels GET Error]:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * POST /api/channex/channels
 * Actions: 'connect', 'disconnect', 'sync_all', 'test_connection', 'mapping_details'
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { hotelCode, action = "connect", channelCode, channelData } = body;

        if (!hotelCode) {
            return NextResponse.json({ error: "hotelCode is required" }, { status: 400 });
        }

        // ====================================================
        // ACTION 1: TEST CONNECTION WITH OTA VIA CHANNEX
        // ====================================================
        if (action === "test_connection") {
            const adapterCode = TARA_TO_CHANNEX_ADAPTERS[channelCode] || channelCode;
            const hotelId = channelData?.hotelId || channelData?.settings?.hotel_id || channelData?.settings?.hotel_code || "";

            if (!hotelId) {
                return NextResponse.json({
                    success: false,
                    message: "Silakan masukkan Hotel ID Extranet terlebih dahulu untuk menguji koneksi."
                }, { status: 200 });
            }

            const { apiKey, env } = await getHotelChannexContext(hotelCode, false);

            if (!apiKey) {
                return NextResponse.json({
                    success: false,
                    message: "API Key Channex belum dikonfigurasi. Silakan isi API Key di tab 'Kredensial API' terlebih dahulu."
                }, { status: 200 });
            }

            // Populate settings for adapter (handles hotel_id and hotel_code)
            const settings = channelData?.settings || {
                hotel_id: hotelId,
                hotel_code: hotelId
            };

            try {
                const testResult = await channexClient.testChannelConnection(adapterCode, settings, apiKey, env);
                const isSuccess = testResult?.data?.success ?? true;
                const errorDetail = testResult?.data?.errors;

                if (!isSuccess) {
                    let errMsg = "Koneksi ditolak oleh OTA. Pastikan Hotel ID Extranet valid dan properti sudah diotorisasi.";
                    if (errorDetail === "implementation_not_defined") {
                        errMsg = `OTA ${adapterCode} tidak menyediakan endpoint uji probe langsung. Otorisasi dilakukan via portal Extranet ${adapterCode} (pilih Provider: Channex). Anda dapat langsung memetakan kamar & rate plan lalu klik 'Simpan & Sinkronkan ke Channex'.`;
                    } else if (errorDetail === "authentication_failed" || errorDetail === "invalid_credentials") {
                        errMsg = `Autentikasi gagal. Hotel ID atau kredensial ${adapterCode} belum terdaftar atau belum diizinkan oleh OTA.`;
                    } else if (typeof errorDetail === "string") {
                        errMsg = errorDetail;
                    } else if (errorDetail) {
                        errMsg = JSON.stringify(errorDetail);
                    }

                    return NextResponse.json({
                        success: false,
                        message: `OTA Validasi (${adapterCode}): ${errMsg}`,
                        result: testResult
                    }, { status: 200 });
                }

                return NextResponse.json({
                    success: true,
                    message: `Koneksi ke OTA (${adapterCode}) berhasil divalidasi oleh Channex!`,
                    result: testResult
                });
            } catch (testErr: any) {
                console.warn("[Channex Test Connection Error]:", testErr.message);
                return NextResponse.json({
                    success: false,
                    message: `Validasi gagal: ${testErr.message}`
                }, { status: 200 });
            }
        }

        // ====================================================
        // ACTION 1B: GET MAPPING DETAILS FROM OTA VIA CHANNEX
        // ====================================================
        if (action === "mapping_details") {
            const adapterCode = TARA_TO_CHANNEX_ADAPTERS[channelCode] || channelCode;
            const hotelId = channelData?.hotelId || channelData?.settings?.hotel_id || channelData?.settings?.hotel_code || "";
            const { apiKey, env } = await getHotelChannexContext(hotelCode, false);

            if (!apiKey || !hotelId) {
                return NextResponse.json({ success: false, message: "API Key dan Hotel ID diperlukan." }, { status: 200 });
            }

            const settings = { hotel_id: hotelId, hotel_code: hotelId, ...(channelData?.settings || {}) };
            try {
                const mappingRes = await channexClient.getChannelMappingDetails(adapterCode, settings, apiKey, env);
                return NextResponse.json({
                    success: true,
                    data: mappingRes?.data || {}
                });
            } catch (err: any) {
                return NextResponse.json({
                    success: false,
                    message: err.message || "Gagal mengambil data mapping dari OTA."
                }, { status: 200 });
            }
        }

        // ====================================================
        // ACTION 2: CONNECT / SYNC CHANNEL & MAPPINGS TO CHANNEX
        // ====================================================
        if (action === "connect" || action === "sync_mapping") {
            if (!channelCode) {
                return NextResponse.json({ error: "channelCode is required" }, { status: 400 });
            }

            const { hotelData, cm, channexPropertyId, apiKey, env } = await getHotelChannexContext(hotelCode, true);
            const adapterCode = TARA_TO_CHANNEX_ADAPTERS[channelCode] || channelCode;
            const hotelId = channelData?.hotelId || channelData?.settings?.hotel_id || channelData?.settings?.hotel_code || "";

            let channexChannelId = channelData?.channexChannelId || cm.channels?.[channelCode]?.channexChannelId || null;
            let channexStatus = "ACTIVE";
            let channexSyncNote = "Terkoneksi langsung via My TARA API Engine";

            // If an API key is available and hotelId is provided, attempt to register/activate with Channex
            if (apiKey && channexPropertyId && hotelId) {
                try {
                    // 1. Resolve Group ID
                    let groupId = cm.groupId || hotelData.groupId;
                    if (!groupId) {
                        try {
                            const propRes = await channexClient.getProperty(channexPropertyId, apiKey, env);
                            groupId = propRes?.data?.relationships?.groups?.data?.[0]?.id || propRes?.data?.relationships?.group?.data?.id;
                        } catch (propErr) {
                            console.warn("[Channex getProperty group resolution warning]:", propErr);
                        }
                    }

                    // 2. Fetch local roomTypes and ratePlans from Firestore to construct rate_plans mappings
                    const roomTypesSnap = await adminDb.collection("hotels").doc(hotelCode).collection("roomTypes").get();
                    const localRoomTypes = roomTypesSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

                    const ratePlansSnap = await adminDb.collection("hotels").doc(hotelCode).collection("ratePlans").get();
                    const localRatePlans = ratePlansSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

                    // Build mapping items for Channex
                    const roomMappings = channelData?.roomMappings || cm.channels?.[channelCode]?.roomMappings || {};
                    const rateMappings = channelData?.rateMappings || cm.channels?.[channelCode]?.rateMappings || {};

                    const ratePlansPayload: any[] = [];
                    const seenRatePlanIds = new Set<string>();

                    for (const rp of localRatePlans) {
                        const otaRateCode = rateMappings[rp.id];
                        const channexRateId = rp.channexRatePlanId;
                        if (!channexRateId || !otaRateCode) continue;

                        // Find corresponding room type
                        const matchedRt = localRoomTypes.find(r => r.id === rp.roomTypeId);
                        const otaRoomCode = (matchedRt && roomMappings[matchedRt.id]) 
                            ? roomMappings[matchedRt.id] 
                            : (hotelId || otaRateCode);

                        const capacity = Number(matchedRt?.capacity || 2);
                        const isPrimary = !seenRatePlanIds.has(channexRateId);
                        seenRatePlanIds.add(channexRateId);

                        ratePlansPayload.push({
                            rate_plan_id: channexRateId,
                            settings: {
                                room_type_code: String(otaRoomCode),
                                rate_plan_code: String(otaRateCode),
                                occupancy: capacity,
                                pricing_type: "OBP",
                                primary_occ: isPrimary,
                                readonly: false
                            }
                        });
                    }

                    // 3. Check existing channels on Channex
                    const existingChannelsRes = await channexClient.getChannels(channexPropertyId, apiKey, env);
                    const existingList = existingChannelsRes?.data || [];
                    const existing = existingList.find((c: any) => 
                        (channexChannelId && c.id === channexChannelId) ||
                        c?.attributes?.channel === adapterCode || 
                        c?.attributes?.channel_code === adapterCode ||
                        c?.attributes?.title?.toLowerCase().includes(channelCode.replace("_", ""))
                    );

                    const channelSettings = {
                        hotel_id: hotelId,
                        hotel_code: hotelId,
                        ...(channelData?.settings || {})
                    };

                    if (existing) {
                        channexChannelId = existing.id;
                        // Update existing channel with rate_plans mapping & settings
                        try {
                            const updatePayload = {
                                channel: adapterCode,
                                settings: channelSettings,
                                ...(ratePlansPayload.length > 0 ? { rate_plans: ratePlansPayload } : {})
                            };
                            await channexClient.updateChannel(existing.id, updatePayload, apiKey, env);
                        } catch (updErr: any) {
                            console.warn(`[Channex Channel Update Warning]:`, updErr.message);
                        }

                        // Activate if inactive
                        if (!existing.attributes?.is_active) {
                            try {
                                await channexClient.activateChannel(existing.id, apiKey, env);
                                channexStatus = "ACTIVE";
                            } catch (actErr: any) {
                                console.warn(`[Channex Activate Warning]:`, actErr.message);
                                channexStatus = existing.attributes?.is_active ? "ACTIVE" : "PENDING";
                            }
                        } else {
                            channexStatus = "ACTIVE";
                        }
                    } else {
                        // Create Channel Connection on Channex with official schema
                        const createPayload = {
                            title: `${channelData?.channelName || adapterCode} - ${hotelData?.name || hotelCode}`,
                            group_id: groupId,
                            properties: [channexPropertyId],
                            channel: adapterCode,
                            settings: channelSettings,
                            ...(ratePlansPayload.length > 0 ? { rate_plans: ratePlansPayload } : {})
                        };

                        try {
                            const createRes = await channexClient.createChannel(createPayload, apiKey, env);
                            channexChannelId = createRes?.data?.id;
                            if (channexChannelId) {
                                try {
                                    await channexClient.activateChannel(channexChannelId, apiKey, env);
                                    channexStatus = "ACTIVE";
                                } catch (actErr: any) {
                                    console.warn(`[Channex Activate Warning]:`, actErr.message);
                                }
                            }
                        } catch (createErr: any) {
                            console.warn(`[Channex Direct Creation Notice]: ${createErr.message}.`);
                            channexSyncNote = `Terkoneksi di TARA (Channex Staging: ${createErr.message})`;
                        }
                    }
                } catch (channexErr: any) {
                    console.warn(`[Channex Channel Sync Warning]:`, channexErr.message);
                }
            }

            // Save channel config to Firestore (Single atomic write: Low Cost!)
            const updatedChannels = {
                ...(cm.channels || {}),
                [channelCode]: {
                    ...(cm.channels?.[channelCode] || {}),
                    ...channelData,
                    channelCode,
                    isActive: true,
                    channexChannelId: channexChannelId || cm.channels?.[channelCode]?.channexChannelId || null,
                    channexStatus,
                    channexSyncNote,
                    lastChannexSync: new Date().toISOString()
                }
            };

            await adminDb.collection("hotels").doc(hotelCode).set({
                channelManager: {
                    channels: updatedChannels,
                    lastSyncAt: new Date().toISOString()
                }
            }, { merge: true });

            return NextResponse.json({
                success: true,
                message: `Saluran ${channelData?.channelName || channelCode} berhasil dihubungkan dan disinkronkan ke Channex!`,
                channel: updatedChannels[channelCode]
            });
        }

        // ====================================================
        // ACTION 3: DISCONNECT / DELETE CHANNEL
        // ====================================================
        if (action === "disconnect" || action === "delete") {
            if (!channelCode) {
                return NextResponse.json({ error: "channelCode is required" }, { status: 400 });
            }

            const { cm, apiKey, env } = await getHotelChannexContext(hotelCode, false);
            const currentChannel = cm.channels?.[channelCode];
            if (currentChannel?.channexChannelId && apiKey) {
                try {
                    await channexClient.deactivateChannel(currentChannel.channexChannelId, apiKey, env);
                } catch (deactErr: any) {
                    console.warn(`[Channex Deactivate Notice]:`, deactErr.message);
                }
            }

            const updatedChannels = { ...(cm.channels || {}) };
            delete updatedChannels[channelCode];

            // Use update with FieldValue.delete to completely remove the map entry from Firestore
            try {
                await adminDb.collection("hotels").doc(hotelCode).update({
                    [`channelManager.channels.${channelCode}`]: FieldValue.delete(),
                    "channelManager.lastSyncAt": new Date().toISOString()
                });
            } catch (fsErr: any) {
                // Fallback if document structure requires set
                await adminDb.collection("hotels").doc(hotelCode).set({
                    channelManager: {
                        channels: updatedChannels,
                        lastSyncAt: new Date().toISOString()
                    }
                }, { merge: true });
            }

            return NextResponse.json({
                success: true,
                message: `Saluran ${currentChannel?.channelName || channelCode} berhasil diputuskan dan dihapus.`,
                channels: updatedChannels
            });
        }

        // ====================================================
        // ACTION 3B: CLEAN DUMMY / UNMAPPED GHOST CHANNELS
        // ====================================================
        if (action === "clean_dummy") {
            const { cm, channexPropertyId, apiKey, env } = await getHotelChannexContext(hotelCode, true);
            const channexRes = await channexClient.getChannels(channexPropertyId, apiKey, env);
            const liveChannexChannels = channexRes?.data || [];
            const liveChannelIds = new Set(liveChannexChannels.map((c: any) => c.id));

            const currentChannels = cm.channels || {};
            const cleanedChannels: Record<string, any> = {};

            Object.entries(currentChannels).forEach(([k, v]: [string, any]) => {
                // Keep only if it has a legitimate channel in Channex or active
                if (v?.channexChannelId && liveChannelIds.has(v.channexChannelId)) {
                    cleanedChannels[k] = v;
                }
            });

            await adminDb.collection("hotels").doc(hotelCode).set({
                channelManager: {
                    channels: cleanedChannels,
                    lastSyncAt: new Date().toISOString()
                }
            }, { merge: true });

            return NextResponse.json({
                success: true,
                message: "Semua saluran dummy yang belum terpetakan ke Channex berhasil dibersihkan.",
                channels: cleanedChannels
            });
        }

        // ====================================================
        // ACTION 4: FULL RE-SYNC CHANNELS FROM CHANNEX
        // ====================================================
        if (action === "sync_all") {
            const { cm, channexPropertyId, apiKey, env } = await getHotelChannexContext(hotelCode, true);
            const channexRes = await channexClient.getChannels(channexPropertyId, apiKey, env);
            const liveChannexChannels = channexRes?.data || [];

            const currentLocal = cm.channels || {};
            const syncedLocal = { ...currentLocal };

            // Fetch local roomTypes and ratePlans for accurate ID cross-mapping
            const roomTypesSnap = await adminDb.collection("hotels").doc(hotelCode).collection("roomTypes").get();
            const localRoomTypes = roomTypesSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

            const ratePlansSnap = await adminDb.collection("hotels").doc(hotelCode).collection("ratePlans").get();
            const localRatePlans = ratePlansSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

            liveChannexChannels.forEach((cc: any) => {
                const adapter = cc?.attributes?.channel || cc?.attributes?.channel_code;
                const matchedCode = Object.keys(TARA_TO_CHANNEX_ADAPTERS).find(
                    k => TARA_TO_CHANNEX_ADAPTERS[k].toLowerCase() === adapter?.toLowerCase()
                ) || adapter?.toLowerCase();

                // Extract room mappings from Channex channel settings
                const channexRooms = cc.attributes?.settings?.mappingSettings?.rooms || cc.attributes?.settings?.mapping_settings?.rooms || {};
                const extractedRoomMappings: Record<string, string> = {};
                Object.entries(channexRooms).forEach(([otaRoomCode, channexRoomId]) => {
                    const matchedRt = localRoomTypes.find((r: any) => r.channexRoomTypeId === channexRoomId || r.id === channexRoomId);
                    const targetKey = matchedRt ? matchedRt.id : (channexRoomId as string);
                    extractedRoomMappings[targetKey] = otaRoomCode as string;
                });

                // Extract rate plan mappings from Channex channel rate_plans
                const channexRates = cc.attributes?.rate_plans || [];
                const extractedRateMappings: Record<string, string> = {};
                channexRates.forEach((cr: any) => {
                    const channexRatePlanId = cr.rate_plan_id;
                    const otaRatePlanCode = cr.settings?.rate_plan_code || channexRatePlanId;
                    const matchedRp = localRatePlans.find((r: any) => r.channexRatePlanId === channexRatePlanId || r.id === channexRatePlanId);
                    const targetKey = matchedRp ? matchedRp.id : channexRatePlanId;
                    extractedRateMappings[targetKey] = otaRatePlanCode;
                });

                const existingChannel = syncedLocal[matchedCode] || {};
                const mergedRoomMappings = { ...extractedRoomMappings, ...(existingChannel.roomMappings || {}) };
                // Ensure non-empty extracted takes precedence
                Object.entries(extractedRoomMappings).forEach(([k, v]) => {
                    if (v && (!mergedRoomMappings[k] || mergedRoomMappings[k].trim() === "")) {
                        mergedRoomMappings[k] = v;
                    }
                });

                const mergedRateMappings = { ...extractedRateMappings, ...(existingChannel.rateMappings || {}) };
                Object.entries(extractedRateMappings).forEach(([k, v]) => {
                    if (v && (!mergedRateMappings[k] || mergedRateMappings[k].trim() === "")) {
                        mergedRateMappings[k] = v;
                    }
                });

                if (matchedCode && syncedLocal[matchedCode]) {
                    syncedLocal[matchedCode] = {
                        ...syncedLocal[matchedCode],
                        channexChannelId: cc.id,
                        channexStatus: cc.attributes?.is_active ? "ACTIVE" : "PENDING",
                        isActive: cc.attributes?.is_active ?? true,
                        roomMappings: mergedRoomMappings,
                        rateMappings: mergedRateMappings,
                        lastChannexSync: new Date().toISOString()
                    };
                } else if (matchedCode) {
                    syncedLocal[matchedCode] = {
                        channelCode: matchedCode,
                        channelName: cc.attributes?.title || adapter || matchedCode,
                        hotelId: cc.attributes?.settings?.hotel_code || "",
                        commissionPercent: 0,
                        pricingModel: "gross",
                        channexChannelId: cc.id,
                        channexStatus: cc.attributes?.is_active ? "ACTIVE" : "PENDING",
                        isActive: cc.attributes?.is_active ?? true,
                        roomMappings: mergedRoomMappings,
                        rateMappings: mergedRateMappings,
                        lastChannexSync: new Date().toISOString()
                    };
                }
            });

            await adminDb.collection("hotels").doc(hotelCode).set({
                channelManager: {
                    channels: syncedLocal,
                    lastSyncAt: new Date().toISOString()
                }
            }, { merge: true });

            return NextResponse.json({
                success: true,
                message: `Sinkronisasi selesai. ${liveChannexChannels.length} saluran ditemukan di Channex.`,
                channels: syncedLocal
            });
        }

        return NextResponse.json({ error: `Unknown action [${action}]` }, { status: 400 });
    } catch (err: any) {
        console.error("[Channex Channels POST Error]:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
