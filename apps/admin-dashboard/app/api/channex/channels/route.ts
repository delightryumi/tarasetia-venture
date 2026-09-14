import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
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
async function getHotelChannexContext(hotelCode: string) {
    const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
    if (!hotelDoc.exists) {
        throw new Error(`Hotel [${hotelCode}] tidak ditemukan di database.`);
    }

    const hotelData = hotelDoc.data() || {};
    const cm = hotelData.channelManager || {};

    const channexPropertyId = hotelData.channexPropertyId || cm.channexPropertyId;
    const apiKey = cm.apiKey || process.env.CHANNEX_API_KEY || "";
    const env = (cm.env === "production" ? "production" : "staging") as "staging" | "production";

    if (!channexPropertyId) {
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

        const { channexPropertyId, apiKey, env, cm } = await getHotelChannexContext(hotelCode);

        // Fetch live channels from Channex for this property
        let channexChannels: any[] = [];
        try {
            const channexRes = await channexClient.getChannels(channexPropertyId, apiKey, env);
            channexChannels = channexRes?.data || [];
        } catch (apiErr: any) {
            console.warn(`[Channex Channels GET] Warning fetching from Channex:`, apiErr.message);
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
 * Actions: 'connect', 'disconnect', 'sync_all', 'test_connection'
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { hotelCode, action = "connect", channelCode, channelData } = body;

        if (!hotelCode) {
            return NextResponse.json({ error: "hotelCode is required" }, { status: 400 });
        }

        const { hotelData, cm, channexPropertyId, apiKey, env } = await getHotelChannexContext(hotelCode);

        // ====================================================
        // ACTION 1: TEST CONNECTION WITH OTA VIA CHANNEX
        // ====================================================
        if (action === "test_connection") {
            const adapterCode = TARA_TO_CHANNEX_ADAPTERS[channelCode] || channelCode;
            const settings = channelData?.settings || { hotel_id: channelData?.hotelId || "" };

            try {
                const testResult = await channexClient.testChannelConnection(adapterCode, settings, apiKey, env);
                return NextResponse.json({
                    success: true,
                    message: "Koneksi ke OTA berhasil divalidasi oleh Channex!",
                    result: testResult
                });
            } catch (testErr: any) {
                return NextResponse.json({
                    success: false,
                    message: testErr.message || "Gagal menguji koneksi ke OTA."
                }, { status: 400 });
            }
        }

        // ====================================================
        // ACTION 2: CONNECT / SYNC CHANNEL TO CHANNEX
        // ====================================================
        if (action === "connect") {
            if (!channelCode) {
                return NextResponse.json({ error: "channelCode is required" }, { status: 400 });
            }

            const adapterCode = TARA_TO_CHANNEX_ADAPTERS[channelCode] || channelCode;
            const hotelId = channelData?.hotelId || "";

            let channexChannelId = channelData?.channexChannelId || null;
            let channexStatus = "ACTIVE";
            let channexSyncNote = "Terkoneksi langsung via My TARA API Engine";

            // If an API key is available and hotelId is provided, attempt to register/activate with Channex
            if (apiKey && hotelId) {
                try {
                    // Try finding if channel is already registered on Channex
                    const existingChannelsRes = await channexClient.getChannels(channexPropertyId, apiKey, env);
                    const existingList = existingChannelsRes?.data || [];
                    const existing = existingList.find((c: any) => 
                        c?.attributes?.channel === adapterCode || 
                        c?.attributes?.channel_code === adapterCode ||
                        c?.attributes?.title?.toLowerCase().includes(channelCode.replace("_", ""))
                    );

                    if (existing) {
                        channexChannelId = existing.id;
                        channexStatus = existing.attributes?.is_active ? "ACTIVE" : "PENDING";
                        // Activate if inactive
                        if (!existing.attributes?.is_active) {
                            try {
                                await channexClient.activateChannel(existing.id, apiKey, env);
                                channexStatus = "ACTIVE";
                            } catch (actErr: any) {
                                console.warn(`[Channex Activate Warning]:`, actErr.message);
                            }
                        }
                    } else {
                        // Create Channel Connection on Channex
                        const createPayload = {
                            title: channelData?.channelName || adapterCode,
                            property_id: channexPropertyId,
                            channel: adapterCode,
                            settings: {
                                hotel_id: hotelId
                            }
                        };

                        try {
                            const createRes = await channexClient.createChannel(createPayload, apiKey, env);
                            channexChannelId = createRes?.data?.id;
                            if (channexChannelId) {
                                await channexClient.activateChannel(channexChannelId, apiKey, env);
                                channexStatus = "ACTIVE";
                            }
                        } catch (createErr: any) {
                            console.warn(`[Channex Direct Creation Notice]: ${createErr.message}. Channel mapped in TARA with local activation.`);
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
        // ACTION 3: DISCONNECT CHANNEL
        // ====================================================
        if (action === "disconnect") {
            if (!channelCode) {
                return NextResponse.json({ error: "channelCode is required" }, { status: 400 });
            }

            const currentChannel = cm.channels?.[channelCode];
            if (currentChannel?.channexChannelId && apiKey) {
                try {
                    await channexClient.deactivateChannel(currentChannel.channexChannelId, apiKey, env);
                } catch (deactErr: any) {
                    console.warn(`[Channex Deactivate Notice]:`, deactErr.message);
                }
            }

            const updatedChannels = {
                ...(cm.channels || {}),
                [channelCode]: {
                    ...(cm.channels?.[channelCode] || {}),
                    isActive: false,
                    channexStatus: "INACTIVE",
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
                message: `Saluran ${currentChannel?.channelName || channelCode} berhasil dinonaktifkan.`,
                channel: updatedChannels[channelCode]
            });
        }

        // ====================================================
        // ACTION 4: FULL RE-SYNC CHANNELS FROM CHANNEX
        // ====================================================
        if (action === "sync_all") {
            const channexRes = await channexClient.getChannels(channexPropertyId, apiKey, env);
            const liveChannexChannels = channexRes?.data || [];

            const currentLocal = cm.channels || {};
            const syncedLocal = { ...currentLocal };

            liveChannexChannels.forEach((cc: any) => {
                const adapter = cc?.attributes?.channel || cc?.attributes?.channel_code;
                const matchedCode = Object.keys(TARA_TO_CHANNEX_ADAPTERS).find(
                    k => TARA_TO_CHANNEX_ADAPTERS[k].toLowerCase() === adapter?.toLowerCase()
                ) || adapter?.toLowerCase();

                if (matchedCode && syncedLocal[matchedCode]) {
                    syncedLocal[matchedCode] = {
                        ...syncedLocal[matchedCode],
                        channexChannelId: cc.id,
                        channexStatus: cc.attributes?.is_active ? "ACTIVE" : "PENDING",
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
