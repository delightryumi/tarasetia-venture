import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { channexClient } from "@/lib/channex/channexClient";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const hotelCode = searchParams.get("hotelCode");

        if (!hotelCode) {
            return NextResponse.json({ error: "hotelCode is required" }, { status: 400 });
        }

        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        const hotelData = hotelDoc.data();
        const channexPropertyId = hotelData?.channelManager?.propertyId || hotelData?.channelManager?.channexPropertyId || hotelData?.channexPropertyId;
        const customApiKey = hotelData?.channelManager?.apiKey;

        // 1. Fetch local Firestore audit task logs (Fast & Instant)
        const localTasksSnap = await adminDb.collection(`hotels/${hotelCode}/channex_task_logs`)
            .orderBy("inserted_at", "desc")
            .limit(50)
            .get();

        const localTasks = localTasksSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        let taskLogs: any[] = [];

        // 2. Fetch remote Channex tasks with a strict 2.5s timeout so the UI never hangs
        if (channexPropertyId && customApiKey) {
            try {
                const timeoutPromise = new Promise<null>((_, reject) => 
                    setTimeout(() => reject(new Error("Channex tasks fetch timeout")), 2500)
                );
                const res: any = await Promise.race([
                    channexClient.getTasks(channexPropertyId, customApiKey),
                    timeoutPromise
                ]);

                if (res?.data && res.data.length > 0) {
                    taskLogs = res.data.map((t: any) => ({
                        id: t.id,
                        task_type: t.attributes?.task_type || "ari_push",
                        status: t.attributes?.status || "SUCCESS",
                        inserted_at: t.attributes?.inserted_at || new Date().toISOString(),
                        message: t.attributes?.message || "Task processed successfully",
                        ota_responses: t.attributes?.ota_responses || []
                    }));
                }
            } catch (err: any) {
                console.warn("[Channex Tasks] Live API fetch skipped/fallback:", err.message);
            }
        }

        // Merge both sources and sort by newest first
        const allLogs = [...localTasks, ...taskLogs].sort((a, b) => {
            const timeA = new Date(a.inserted_at || 0).getTime();
            const timeB = new Date(b.inserted_at || 0).getTime();
            return timeB - timeA;
        });

        return NextResponse.json({ success: true, logs: allLogs });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
