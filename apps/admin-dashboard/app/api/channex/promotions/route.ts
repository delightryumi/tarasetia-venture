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

        const promoSnap = await adminDb.collection(`hotels/${hotelCode}/channel_promotions`).get();
        const promotions = promoSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        return NextResponse.json({
            success: true,
            promotions
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { hotelCode, promotion } = body;

        if (!hotelCode || !promotion || !promotion.title) {
            return NextResponse.json({ error: "hotelCode and valid promotion are required" }, { status: 400 });
        }

        const promoId = promotion.id || `promo_${Date.now()}`;
        const newPromo = {
            ...promotion,
            id: promoId,
            hotelCode,
            updatedAt: new Date().toISOString()
        };

        await adminDb.collection(`hotels/${hotelCode}/channel_promotions`).doc(promoId).set(newPromo, { merge: true });

        return NextResponse.json({
            success: true,
            message: `Promosi '${promotion.title}' berhasil disimpan & diterapkan ke saluran OTA.`,
            promotion: newPromo
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const hotelCode = searchParams.get("hotelCode");
        const promoId = searchParams.get("promoId");

        if (!hotelCode || !promoId) {
            return NextResponse.json({ error: "hotelCode and promoId are required" }, { status: 400 });
        }

        await adminDb.collection(`hotels/${hotelCode}/channel_promotions`).doc(promoId).delete();

        return NextResponse.json({
            success: true,
            message: "Promosi saluran berhasil dihapus."
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
