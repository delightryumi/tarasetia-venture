import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { channexClient } from "@/lib/channex/channexClient";

/**
 * Route to generate Channex White-Label Mapping IFrame SSO URL
 * URL: POST /api/channex/auth-iframe
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { hotelCode, username = "Admin Staff" } = body;

        if (!hotelCode) {
            return NextResponse.json({ error: "hotelCode is required" }, { status: 400 });
        }

        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        if (!hotelDoc.exists) {
            return NextResponse.json({ error: `Hotel ${hotelCode} not found` }, { status: 404 });
        }

        const hotelData = hotelDoc.data();
        let channexPropertyId = hotelData?.channexPropertyId || hotelData?.channelManager?.channexPropertyId;
        const customApiKey = hotelData?.channelManager?.apiKey || process.env.CHANNEX_API_KEY;

        if (!customApiKey) {
            return NextResponse.json({
                error: "API Key Channex belum diisi. Silakan masukkan User API Key dari akun Sandbox Channex Anda pada tab 'Konfigurasi & Akun Channex' di Channel Manager atau di .env.local."
            }, { status: 400 });
        }

        // If not registered in Channex yet, create Property on Channex automatically
        if (!channexPropertyId) {
            console.log(`[Channex Auth-IFrame] Auto-creating Property on Channex for hotel [${hotelCode}] - ${hotelData?.name}`);
            try {
                const created = await channexClient.createProperty({
                    title: hotelData?.name || `Partner Hotel ${hotelCode}`,
                    currency: "IDR",
                    timezone: "Asia/Jakarta",
                    country: "ID",
                    address: hotelData?.address || "Indonesia"
                }, customApiKey);

                channexPropertyId = created?.data?.id;
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
            } catch (createErr: any) {
                console.error("[Channex Auth-IFrame] Auto-creation on Channex failed:", createErr);
                return NextResponse.json({
                    error: `Gagal membuat properti di Channex: ${createErr.message}`
                }, { status: 500 });
            }
        }

        if (!channexPropertyId) {
            return NextResponse.json({ error: "Channex Property ID could not be generated." }, { status: 500 });
        }

        // Generate One-Time Token for Iframe
        const { iframeUrl, token } = await channexClient.createOneTimeToken(channexPropertyId, username, customApiKey);

        return NextResponse.json({
            success: true,
            iframeUrl,
            token,
            propertyId: channexPropertyId
        });
    } catch (error: any) {
        console.error("[Channex Auth-IFrame Error]:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Failed to generate channel mapping token"
        }, { status: 500 });
    }
}
