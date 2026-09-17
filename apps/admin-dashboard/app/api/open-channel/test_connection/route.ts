import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * Channex Open Channel - Test Connection Endpoint
 * Method: GET
 * URL: /api/open-channel/test_connection/?hotel_code={HOTEL_CODE}
 * 
 * Channex calls this endpoint to verify that the target endpoint is reachable
 * and the property is valid.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const hotelCode = searchParams.get("hotel_code") || searchParams.get("hotelCode");

        // Optional API Key header verification
        const apiKeyHeader = req.headers.get("api-key");
        console.log(`[OpenChannel:TestConnection] Ping received for hotel_code: ${hotelCode}`);

        if (hotelCode) {
            // Check if hotel exists in Firestore (support "1" or slug or custom ID)
            const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
            if (hotelDoc.exists) {
                const hotelData = hotelDoc.data();
                const expectedKey = hotelData?.channelManager?.openChannelApiKey;
                if (expectedKey && apiKeyHeader && expectedKey !== apiKeyHeader) {
                    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
                }
            }
        }

        // Standard Channex Open Channel response
        return NextResponse.json({
            success: true
        }, { status: 200 });
    } catch (err: any) {
        console.error("[OpenChannel:TestConnection] Error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
