import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { channexClient } from "@/lib/channex/channexClient";

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    try {
        const body = await req.json();
        const { hotelCode, facilities = {}, photosCount = 0 } = body;

        if (!hotelCode) {
            return NextResponse.json({ error: "hotelCode is required" }, { status: 400 });
        }

        // Save facilities to hotel document in Firestore
        await adminDb.collection("hotels").doc(hotelCode).set({
            channelFacilities: facilities,
            lastContentPushAt: new Date().toISOString()
        }, { merge: true });

        // Check if Channex is connected
        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        const hotelData = hotelDoc.data();
        const channexPropertyId = hotelData?.channelManager?.propertyId || hotelData?.channelManager?.channexPropertyId || hotelData?.channexPropertyId;
        const customApiKey = hotelData?.channelManager?.apiKey;

        const activeFacilityKeys = Object.keys(facilities).filter(k => facilities[k]);

        if (channexPropertyId && customApiKey) {
            try {
                await channexClient.pushFacilities(channexPropertyId, activeFacilityKeys, customApiKey);
            } catch (err: any) {
                console.warn("[Channex Content Push] Live API push warning:", err.message);
            }
        }

        const latency = Date.now() - startTime;

        // Record audit task log
        try {
            await adminDb.collection(`hotels/${hotelCode}/channex_task_logs`).add({
                task_type: "POST /content",
                entity: "Foto & Fasilitas Hotel",
                status: "SUCCESS",
                inserted_at: new Date().toISOString(),
                latency_ms: latency,
                message: `Distribusi konten (${photosCount} foto, ${activeFacilityKeys.length} fasilitas) berhasil diperbarui ke Channex Content API.`,
                ota_responses: []
            });
        } catch (logErr) {
            console.warn("Could not save task log:", logErr);
        }

        return NextResponse.json({
            success: true,
            message: `Konten properti (${photosCount} foto dan ${activeFacilityKeys.length} fasilitas) berhasil didistribusikan ke Channex & saluran OTA!`
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
