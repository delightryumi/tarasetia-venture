import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { ChannexClient } from "@/lib/channex/channexClient";

/**
 * GET /api/channex/channel-pricing?hotelCode=bumi-anyom-resort
 * Retrieves current pricing model (Net vs Gross) from Firestore and live Channex Channel settings.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const hotelCode = searchParams.get("hotelCode");

        if (!hotelCode) {
            return NextResponse.json({ error: "hotelCode query parameter is required" }, { status: 400 });
        }

        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        if (!hotelDoc.exists) {
            return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
        }

        const hotelData = hotelDoc.data() || {};
        const cm = hotelData.channelManager || {};
        const currentPricingModel: "net" | "gross" = (cm.pricingModel || hotelData.settings?.revenueRecordingMode || "net").toLowerCase() === "gross" ? "gross" : "net";

        const propertyId = cm.channexPropertyId;
        const apiKey = cm.apiKey || process.env.CHANNEX_API_KEY;
        const env: "staging" | "production" = cm.env || cm.environment || (process.env.CHANNEX_ENV as any) || "staging";

        let channexChannels: any[] = [];
        let channexStatus = "DISCONNECTED";

        if (propertyId && apiKey) {
            try {
                const client = new ChannexClient(apiKey, env === "production");
                const res = await client.getChannels(propertyId, apiKey, env);
                if (res?.data && Array.isArray(res.data)) {
                    channexChannels = res.data.map((c: any) => ({
                        id: c.id,
                        title: c.attributes?.title || c.title,
                        channelCode: c.attributes?.channel || c.channel,
                        isActive: c.attributes?.is_active ?? c.is_active,
                        bookingAmountSettings: c.attributes?.settings?.booking_amount_settings || "with_commission",
                        ariAmountSettings: c.attributes?.settings?.ari_amount_settings || "with_commission"
                    }));
                    channexStatus = "CONNECTED";
                }
            } catch (apiErr: any) {
                console.warn("[Channel Pricing API] Channex fetch warning:", apiErr.message);
                channexStatus = "ERROR_FETCHING";
            }
        }

        return NextResponse.json({
            success: true,
            hotelCode,
            currentPricingModel,
            propertyId: propertyId || null,
            channexStatus,
            channels: channexChannels
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

/**
 * POST /api/channex/channel-pricing
 * Updates pricing model in Firestore and synchronizes booking_amount_settings across connected Channex channels.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { hotelCode, pricingModel, syncToChannex = true } = body;

        if (!hotelCode) {
            return NextResponse.json({ error: "hotelCode is required" }, { status: 400 });
        }

        const normalizedModel: "net" | "gross" = pricingModel === "gross" ? "gross" : "net";

        // 1. Update Firestore hotel document
        const hotelRef = adminDb.collection("hotels").doc(hotelCode);
        const hotelDoc = await hotelRef.get();
        if (!hotelDoc.exists) {
            return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
        }

        const hotelData = hotelDoc.data() || {};
        const cm = hotelData.channelManager || {};

        await hotelRef.set({
            channelManager: {
                ...cm,
                pricingModel: normalizedModel,
                updatedAt: new Date().toISOString()
            },
            settings: {
                ...(hotelData.settings || {}),
                revenueRecordingMode: normalizedModel,
                updatedAt: new Date().toISOString()
            }
        }, { merge: true });

        // 2. Optionally sync to Channex channels
        let updatedChannelsCount = 0;
        const propertyId = cm.channexPropertyId;
        const apiKey = cm.apiKey || process.env.CHANNEX_API_KEY;
        const env: "staging" | "production" = cm.env || cm.environment || (process.env.CHANNEX_ENV as any) || "staging";

        if (syncToChannex && propertyId && apiKey) {
            try {
                const client = new ChannexClient(apiKey, env === "production");
                const res = await client.getChannels(propertyId, apiKey, env);
                const channelsList = res?.data || [];

                const targetAmountSetting = normalizedModel === "gross" ? "with_commission" : "without_commission";

                for (const ch of channelsList) {
                    if (ch.id) {
                        try {
                            const curSettings = ch.attributes?.settings || {};
                            await client.updateChannel(ch.id, {
                                settings: {
                                    ...curSettings,
                                    booking_amount_settings: targetAmountSetting,
                                    ari_amount_settings: targetAmountSetting
                                }
                            }, apiKey, env);
                            updatedChannelsCount++;
                        } catch (chErr: any) {
                            console.warn(`[Channel Pricing API] Could not update channel ${ch.id}:`, chErr.message);
                        }
                    }
                }
            } catch (syncErr: any) {
                console.warn("[Channel Pricing API] Error syncing channels to Channex:", syncErr.message);
            }
        }

        return NextResponse.json({
            success: true,
            pricingModel: normalizedModel,
            updatedChannelsCount,
            message: `Pricing model successfully updated to ${normalizedModel.toUpperCase()}.${updatedChannelsCount > 0 ? ` Synchronized with ${updatedChannelsCount} active Channex channels.` : ''}`
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
