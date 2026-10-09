import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { emailToDocId } from "@/lib/security/inputSanitizer";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const hotelCode = searchParams.get("hotelCode");

    if (!email) {
      return NextResponse.json({ error: "Email wajib disertakan." }, { status: 400 });
    }

    const docId = emailToDocId(email);
    let userRef = adminDb.doc(`users_master/${docId}`);
    let snap = await userRef.get();

    if (!snap.exists && hotelCode && hotelCode !== "0") {
      userRef = adminDb.doc(`hotels/${hotelCode}/users_master/${docId}`);
      snap = await userRef.get();
    }

    if (!snap.exists) {
      const groupSnap = await adminDb.collectionGroup("users_master").where("email", "==", email.toLowerCase().trim()).limit(1).get();
      if (!groupSnap.empty) {
        userRef = groupSnap.docs[0].ref;
        snap = groupSnap.docs[0];
      }
    }

    if (!snap.exists) {
      return NextResponse.json({ enabled: false });
    }

    const userData = snap.data() || {};
    return NextResponse.json({
      enabled: userData.twoFactorEnabled === true,
      enabledAt: userData.twoFactorEnabledAt || null,
      recoveryCodesCount: Array.isArray(userData.twoFactorRecoveryCodes)
        ? userData.twoFactorRecoveryCodes.length
        : 0,
    });
  } catch (error: any) {
    console.error("2FA Status Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memeriksa status 2FA." },
      { status: 500 }
    );
  }
}
