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
        const customApiKey = hotelData?.channelManager?.apiKey || process.env.CHANNEX_API_KEY;

        let reviewList: any[] = [];

        // 1. Fetch from Channex Live API
        if (channexPropertyId && customApiKey) {
            try {
                const res = await channexClient.getReviews(channexPropertyId, customApiKey);
                if (res?.data && res.data.length > 0) {
                    reviewList = res.data.map((r: any) => ({
                        id: r.id,
                        ota: r.attributes?.ota || "OTA",
                        guest_name: r.attributes?.guest_name || "Tamu OTA",
                        ota_reservation_id: r.attributes?.ota_reservation_id || "-",
                        room_name: r.attributes?.room_name || "Standard Room",
                        stay_date: r.attributes?.stay_date || "",
                        overall_score: Number(r.attributes?.overall_score || 0),
                        received_at: r.attributes?.received_at || r.attributes?.inserted_at || new Date().toISOString(),
                        content: r.attributes?.content || "",
                        is_replied: !!r.attributes?.is_replied,
                        reply: r.attributes?.reply || null,
                        scores: r.attributes?.scores || [],
                        tags: r.attributes?.tags || []
                    }));
                }
            } catch (apiErr: any) {
                console.warn("[Channex Reviews] API query fallback to database:", apiErr.message);
            }
        }

        // 2. Also check local Firestore reviews
        if (reviewList.length === 0) {
            const revSnap = await adminDb.collection(`hotels/${hotelCode}/guest_reviews`).get();
            reviewList = revSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        // Compute real summary metrics from actual reviews
        const total = reviewList.length;
        let avgOverall = 0;
        let avgCleanliness = 0;
        let avgStaff = 0;
        let avgLocation = 0;
        let avgComfort = 0;
        let avgValue = 0;

        if (total > 0) {
            let sumOverall = 0;
            let sumCleanliness = 0;
            let sumStaff = 0;
            let sumLocation = 0;
            let sumComfort = 0;
            let sumValue = 0;

            reviewList.forEach((r: any) => {
                sumOverall += Number(r.overall_score || 0);
                (r.scores || []).forEach((s: any) => {
                    const cat = (s.category || "").toLowerCase();
                    const val = Number(s.score || 0);
                    if (cat.includes("clean")) sumCleanliness += val;
                    if (cat.includes("staff") || cat.includes("service")) sumStaff += val;
                    if (cat.includes("locat")) sumLocation += val;
                    if (cat.includes("comfort")) sumComfort += val;
                    if (cat.includes("value")) sumValue += val;
                });
            });

            avgOverall = Number((sumOverall / total).toFixed(1));
            avgCleanliness = Number((sumCleanliness / total || avgOverall).toFixed(1));
            avgStaff = Number((sumStaff / total || avgOverall).toFixed(1));
            avgLocation = Number((sumLocation / total || avgOverall).toFixed(1));
            avgComfort = Number((sumComfort / total || avgOverall).toFixed(1));
            avgValue = Number((sumValue / total || avgOverall).toFixed(1));
        }

        return NextResponse.json({
            success: true,
            summary: {
                averageScore: avgOverall,
                totalReviews: total,
                cleanliness: avgCleanliness,
                staff: avgStaff,
                location: avgLocation,
                comfort: avgComfort,
                value: avgValue
            },
            reviews: reviewList
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { hotelCode, reviewId, replyContent } = body;

        if (!hotelCode || !reviewId || !replyContent) {
            return NextResponse.json({ error: "hotelCode, reviewId, and replyContent are required" }, { status: 400 });
        }

        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        const customApiKey = hotelDoc.data()?.channelManager?.apiKey || process.env.CHANNEX_API_KEY;

        if (customApiKey) {
            try {
                await channexClient.replyReview(reviewId, replyContent, customApiKey);
            } catch (apiErr: any) {
                console.warn("[Channex Review Reply] Live API error, storing in database:", apiErr.message);
            }
        }

        const replyObj = {
            content: replyContent,
            replied_at: new Date().toISOString()
        };

        // Persist reply to Firestore
        await adminDb.collection(`hotels/${hotelCode}/guest_reviews`).doc(reviewId).set({
            is_replied: true,
            reply: replyObj,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return NextResponse.json({
            success: true,
            message: "Balasan resmi hotel berhasil dikirimkan dan disimpan.",
            reply: replyObj
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
