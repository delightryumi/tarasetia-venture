import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { emailToDocId } from "@/lib/security/inputSanitizer";
import { generateTotpSecret, generateTotpUri, generateQrCodeDataUrl } from "@/lib/totp";

export async function POST(req: NextRequest) {
  try {
    const { email, hotelCode } = await req.json();

    if (!email || typeof email !== "string") {
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
      return NextResponse.json({ error: "Pengguna tidak ditemukan dalam sistem." }, { status: 404 });
    }

    // Generate new TOTP Secret (Base32, RFC 6238)
    const secret = generateTotpSecret();
    const uri = generateTotpUri({
      secret,
      issuer: "Tara CRS",
      accountName: email.trim(),
    });

    const qrCodeDataUrl = await generateQrCodeDataUrl(uri);

    // Save pending secret (temporary until user verifies with 6-digit code)
    await userRef.set({
      twoFactorPendingSecret: secret,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      secret,
      qrCodeDataUrl,
      otpauthUrl: uri,
    });
  } catch (error: any) {
    console.error("2FA Setup Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menginisialisasi 2FA Google Authenticator." },
      { status: 500 }
    );
  }
}
