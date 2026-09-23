import { NextRequest, NextResponse } from "next/server";
import { channexClient } from "@/lib/channex/channexClient";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * Channex Webhook Self-Registration Endpoint
 * ─────────────────────────────────────────────
 * CHANNEX PMS CERTIFICATION GAP FILLER:
 * Automatically registers My Tara's webhook URL with Channex via API,
 * so you don't need to manually configure it in the Channex dashboard.
 *
 * Call this once after setting up CHANNEX_API_KEY and CHANNEX_WEBHOOK_SECRET
 * in your environment variables.
 *
 * POST /api/channex/register-webhook
 * Body: { hotelCode: string }
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
        const customApiKey = hotelData?.channelManager?.apiKey || process.env.CHANNEX_API_KEY;
        const env: "staging" | "production" = (hotelData?.channelManager?.env || hotelData?.channelManager?.environment || process.env.CHANNEX_ENV || "staging") as any;

        if (!customApiKey) {
            return NextResponse.json({
                error: "CHANNEX_API_KEY is not configured. Set it in .env.local or hotel's channelManager.apiKey."
            }, { status: 400 });
        }

        // Build webhook URL from environment
        const webhookBaseUrl = process.env.NEXT_PUBLIC_CHANNEX_WEBHOOK_URL
            || process.env.NEXT_PUBLIC_DASHBOARD_URL
            || "https://yourdomain.com";

        const webhookUrl = webhookBaseUrl.endsWith("/api/channex/webhook")
            ? webhookBaseUrl
            : `${webhookBaseUrl.replace(/\/$/, "")}/api/channex/webhook`;

        const webhookSecret = process.env.CHANNEX_WEBHOOK_SECRET;

        if (!webhookSecret) {
            return NextResponse.json({
                error: "CHANNEX_WEBHOOK_SECRET is not configured. Set it in .env.local first."
            }, { status: 400 });
        }

        if (!webhookUrl.startsWith("https://")) {
            return NextResponse.json({
                error: `Channex requires HTTPS webhook URL. Current URL is: ${webhookUrl}. Update NEXT_PUBLIC_CHANNEX_WEBHOOK_URL in .env.local.`
            }, { status: 400 });
        }

        // Register Global Webhook with Channex (covers all properties in account)
        const result = await channexClient.registerGlobalWebhook(
            webhookUrl,
            webhookSecret,
            customApiKey,
            env
        );

        const webhookId = result?.data?.id;

        // Store webhook registration details in Firestore for tracking
        await adminDb.collection("hotels").doc(hotelCode).set({
            channelManager: {
                webhookId,
                webhookUrl,
                webhookRegisteredAt: new Date().toISOString(),
                webhookEnv: env
            }
        }, { merge: true });

        // Log to channex_task_logs
        await adminDb.collection(`hotels/${hotelCode}/channex_task_logs`).add({
            task_type: "POST /webhooks (Self-Registration)",
            entity: "Global Webhook Registration",
            status: "SUCCESS",
            inserted_at: new Date().toISOString(),
            latency_ms: 0,
            message: `Webhook successfully registered with Channex [${env}]. ID: ${webhookId}. URL: ${webhookUrl}`,
            ota_responses: [{ webhookId, webhookUrl, env }]
        });

        return NextResponse.json({
            success: true,
            webhookId,
            webhookUrl,
            environment: env,
            message: `✅ Webhook berhasil didaftarkan ke Channex [${env}]. ID: ${webhookId}. Channex akan mengirimkan semua booking events ke: ${webhookUrl}`
        });

    } catch (error: any) {
        console.error("[Channex Register Webhook Error]:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Failed to register webhook with Channex"
        }, { status: 500 });
    }
}

/**
 * GET — Check current webhook registration status
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const hotelCode = searchParams.get("hotelCode");

    if (!hotelCode) {
        return NextResponse.json({ error: "hotelCode is required" }, { status: 400 });
    }

    const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
    const hotelData = hotelDoc.data();
    const cm = hotelData?.channelManager || {};

    return NextResponse.json({
        webhookId: cm.webhookId || null,
        webhookUrl: cm.webhookUrl || null,
        webhookRegisteredAt: cm.webhookRegisteredAt || null,
        webhookEnv: cm.webhookEnv || null,
        isRegistered: !!cm.webhookId,
        currentWebhookUrlFromEnv: process.env.NEXT_PUBLIC_CHANNEX_WEBHOOK_URL || null,
        webhookSecretConfigured: !!process.env.CHANNEX_WEBHOOK_SECRET,
        apiKeyConfigured: !!(cm.apiKey || process.env.CHANNEX_API_KEY)
    });
}
