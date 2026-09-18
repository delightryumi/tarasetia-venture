import { NextRequest, NextResponse } from "next/server";
import { channexClient } from "@/lib/channex/channexClient";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    try {
        const body = await req.json();
        const {
            hotelCode,
            type, // "room_type" | "rate_plan" | "property"
            id, // local ID
            channexId, // Channex Room Type UUID or Rate Plan UUID
            channelCode,
            otaId
        } = body;

        if (!hotelCode) {
            return NextResponse.json({ success: false, error: "hotelCode is required" }, { status: 400 });
        }

        // Fetch hotel configuration
        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        if (!hotelDoc.exists) {
            return NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 });
        }

        const hotelData = hotelDoc.data();
        const cm = hotelData?.channelManager || {};
        const channexPropertyId = cm.propertyId || cm.channexPropertyId || hotelData?.channexPropertyId;
        const customApiKey = cm.apiKey;
        const env = cm.environment || (process.env.CHANNEX_ENV === "production" ? "production" : "staging");

        // If no credentials set yet
        if (!channexPropertyId) {
            const latency = Date.now() - startTime;
            return NextResponse.json({
                success: false,
                latencyMs: latency,
                message: "Channex Property ID belum dikonfigurasi di tab 'Konfigurasi & Akun Channex'. Silakan isi Property ID dan API Key terlebih dahulu.",
                channexStatus: "NOT_CONFIGURED"
            });
        }

        // Perform test query to Channex
        try {
            if (type === "room_type") {
                const res = await channexClient.getRoomTypes(channexPropertyId, customApiKey, env);
                const rooms = res?.data || [];
                const matched = rooms.find((r: any) => r.id === channexId);
                const latency = Date.now() - startTime;

                if (matched) {
                    return NextResponse.json({
                        success: true,
                        latencyMs: latency,
                        target: "room_type",
                        title: matched.attributes?.title || "Room Type",
                        channexId,
                        message: `Koneksi Berhasil (${latency}ms)! Room Type '${matched.attributes?.title}' terverifikasi aktif di Channex Server.`,
                        otaStatus: otaId ? `Siap petakan ke OTA ID: ${otaId}` : "Belum diisi OTA Extranet ID"
                    });
                } else if (!channexId) {
                    return NextResponse.json({
                        success: false,
                        latencyMs: latency,
                        message: "Kategori kamar ini belum memiliki Channex Room ID. Silakan klik 'Sync Kamar & Rate ke Channex' terlebih dahulu.",
                        channexStatus: "UNSYNCED"
                    });
                } else {
                    return NextResponse.json({
                        success: false,
                        latencyMs: latency,
                        message: `Channex ID '${channexId}' tidak ditemukan di property Channex '${channexPropertyId}'. Silakan sinkronkan ulang.`,
                        channexStatus: "NOT_FOUND"
                    });
                }
            } else if (type === "rate_plan") {
                const res = await channexClient.getRatePlans(channexPropertyId, customApiKey, env);
                const rates = res?.data || [];
                const matched = rates.find((r: any) => r.id === channexId);
                const latency = Date.now() - startTime;

                if (matched) {
                    return NextResponse.json({
                        success: true,
                        latencyMs: latency,
                        target: "rate_plan",
                        title: matched.attributes?.title || "Rate Plan",
                        channexId,
                        message: `Koneksi Berhasil (${latency}ms)! Rate Plan '${matched.attributes?.title}' terverifikasi aktif di Channex Server.`,
                        otaStatus: otaId ? `Siap petakan ke OTA Rate ID: ${otaId}` : "Belum diisi OTA Extranet ID"
                    });
                } else if (!channexId) {
                    return NextResponse.json({
                        success: false,
                        latencyMs: latency,
                        message: "Rate Plan ini belum disinkronkan ke Channex. Silakan klik 'Sync Kamar & Rate ke Channex' terlebih dahulu.",
                        channexStatus: "UNSYNCED"
                    });
                } else {
                    return NextResponse.json({
                        success: false,
                        latencyMs: latency,
                        message: `Rate Plan ID '${channexId}' tidak ditemukan di property Channex '${channexPropertyId}'.`,
                        channexStatus: "NOT_FOUND"
                    });
                }
            } else {
                // General property connection ping
                await channexClient.getProperty(channexPropertyId, customApiKey, env);
                const latency = Date.now() - startTime;
                return NextResponse.json({
                    success: true,
                    latencyMs: latency,
                    message: `Ping Koneksi Server Channex Sukses (${latency}ms)! Property ID '${channexPropertyId}' aktif.`
                });
            }
        } catch (apiErr: any) {
            const latency = Date.now() - startTime;
            // If dry-run / sandbox without real key
            return NextResponse.json({
                success: false,
                latencyMs: latency,
                message: `Gagal ping ke Channex (${latency}ms): ${apiErr.message}`,
                error: apiErr.message
            });
        }
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
