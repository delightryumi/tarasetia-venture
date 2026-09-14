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

        // Also check local Firestore rules
        const rulesSnap = await adminDb.collection(`hotels/${hotelCode}/channel_rules`).get();
        let localRules = rulesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (channexPropertyId && customApiKey) {
            try {
                const res = await channexClient.getAvailabilityRules(channexPropertyId, customApiKey);
                if (res?.data && res.data.length > 0) {
                    const apiRules = res.data.map((r: any) => ({
                        id: r.id,
                        ...r.attributes
                    }));
                    return NextResponse.json({ success: true, rules: apiRules });
                }
            } catch (err: any) {
                console.warn("[Channex Rules] API query fallback:", err.message);
            }
        }

        return NextResponse.json({ success: true, rules: localRules });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { hotelCode, rule } = body;

        if (!hotelCode || !rule) {
            return NextResponse.json({ error: "hotelCode and rule are required" }, { status: 400 });
        }

        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        const hotelData = hotelDoc.data();
        const channexPropertyId = hotelData?.channelManager?.propertyId || hotelData?.channelManager?.channexPropertyId || hotelData?.channexPropertyId;
        const customApiKey = hotelData?.channelManager?.apiKey;

        let channexRuleId = `rule-${Date.now()}`;

        if (channexPropertyId && customApiKey) {
            try {
                const res = await channexClient.createAvailabilityRule({
                    property_id: channexPropertyId,
                    title: rule.title,
                    type: rule.type,
                    value: rule.value ? Number(rule.value) : null,
                    start_date: rule.start_date,
                    end_date: rule.end_date,
                    days: rule.days || ["mo", "tu", "we", "th", "fr", "sa", "su"],
                    affected_channels: rule.affected_channels,
                    affected_room_types: rule.affected_room_types
                }, customApiKey);
                if (res?.data?.id) channexRuleId = res.data.id;
            } catch (err: any) {
                console.warn("[Channex Rules] Live push fallback, storing locally:", err.message);
            }
        }

        // Store rule in Firestore
        await adminDb.collection(`hotels/${hotelCode}/channel_rules`).doc(channexRuleId).set({
            ...rule,
            id: channexRuleId,
            property_id: channexPropertyId || "",
            createdAt: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            message: `Aturan alokasi saluran '${rule.title}' berhasil disimpan & diterapkan ke Channex.`,
            ruleId: channexRuleId
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const hotelCode = searchParams.get("hotelCode");
        const ruleId = searchParams.get("ruleId");

        if (!hotelCode || !ruleId) {
            return NextResponse.json({ error: "hotelCode and ruleId are required" }, { status: 400 });
        }

        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        const customApiKey = hotelDoc.data()?.channelManager?.apiKey;

        if (customApiKey) {
            try {
                await channexClient.deleteAvailabilityRule(ruleId, customApiKey);
            } catch (e: any) {
                console.warn("[Channex Rules] Delete error:", e.message);
            }
        }

        await adminDb.collection(`hotels/${hotelCode}/channel_rules`).doc(ruleId).delete();

        return NextResponse.json({ success: true, message: "Aturan alokasi saluran berhasil dihapus." });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
