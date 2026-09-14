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

        let taskLogs: any[] = [];

        if (channexPropertyId && customApiKey) {
            try {
                const res = await channexClient.getTasks(channexPropertyId, customApiKey);
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
                console.warn("[Channex Tasks] Live API fetch error, using audit demo logs:", err.message);
            }
        }

        if (taskLogs.length === 0) {
            // Check real Firestore audit log collection
            const localTasksSnap = await adminDb.collection(`hotels/${hotelCode}/channex_task_logs`)
                .orderBy("inserted_at", "desc")
                .limit(50)
                .get();

            taskLogs = localTasksSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }

        return NextResponse.json({ success: true, logs: taskLogs });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
