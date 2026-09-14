import { NextRequest, NextResponse } from "next/server";
import { channexSyncService } from "@/lib/channex/syncService";
import { ChannexWebhookPayload } from "@/lib/channex/types";

/**
 * Global Webhook Endpoint for Channex.io
 * Receives incoming bookings, modifications, cancellations, and ARI events
 * URL: POST /api/channex/webhook
 */
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("x-channex-webhook-secret") || req.headers.get("authorization");
        const expectedSecret = process.env.CHANNEX_WEBHOOK_SECRET;

        // Verify Secret if configured in environment
        if (expectedSecret && authHeader !== expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
            console.warn("[Channex Webhook] Unauthorized request received. Invalid secret.");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = (await req.json()) as ChannexWebhookPayload;
        console.log(`[Channex Webhook] Received Event: ${payload?.event}, Property: ${payload?.property_id}`);

        if (!payload || !payload.event) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Handle Booking Events
        if (payload.event.startsWith("booking") || payload.booking) {
            const result = await channexSyncService.processIncomingBookingWebhook(payload);
            return NextResponse.json({
                success: true,
                message: result.message,
                bookingId: result.bookingId
            });
        }

        // Handle other webhook events (e.g. ARI sync notification, sync warning)
        return NextResponse.json({
            success: true,
            message: `Event ${payload.event} acknowledged.`
        });
    } catch (error: any) {
        console.error("[Channex Webhook Error]:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Internal server error"
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        status: "ACTIVE",
        service: "My Tara Channex Webhook Receiver",
        timestamp: new Date().toISOString()
    });
}
