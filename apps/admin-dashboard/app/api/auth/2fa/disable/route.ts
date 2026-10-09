import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { emailToDocId } from "@/lib/security/inputSanitizer";
import { verifyTotpToken } from "@/lib/totp";
import { logAuditEvent } from "@/lib/auditLogger";

export async function POST(req: NextRequest) {
  try {
    const { email, hotelCode, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email dan kode verifikasi 6 digit wajib diisi." },
        { status: 400 }
      );
    }

    const docId = emailToDocId(email);
    let userRef = adminDb.doc(`users_master/${docId}`);
    let snap = await userRef.get();
    let resolvedHotelCode = hotelCode || "0";

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
      return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    const userData = snap.data() || {};
    const secret = userData.twoFactorSecret;
    const recoveryCodes: string[] = userData.twoFactorRecoveryCodes || [];

    if (!userData.twoFactorEnabled || !secret) {
      return NextResponse.json(
        { error: "Two-Factor Authentication belum aktif pada akun ini." },
        { status: 400 }
      );
    }

    const cleanCode = String(code).trim().toUpperCase();
    const isTotpValid = verifyTotpToken({
      secret,
      token: cleanCode,
      window: 1,
    });

    const isRecoveryMatch = recoveryCodes.includes(cleanCode);

    if (!isTotpValid && !isRecoveryMatch) {
      return NextResponse.json(
        { error: "Kode verifikasi 6 digit atau kode recovery tidak valid." },
        { status: 400 }
      );
    }

    await userRef.update({
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorRecoveryCodes: [],
      twoFactorPendingSecret: null,
      twoFactorDisabledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Log security audit event
    await logAuditEvent({
      hotelCode: resolvedHotelCode,
      actor: {
        uid: userData.uid || docId,
        name: userData.name || userData.displayName || email,
        email: email,
        role: userData.role || "user",
      },
      category: "SECURITY",
      action: "DISABLE_2FA",
      description: `Pengguna ${email} menonaktifkan Two-Factor Authentication.`,
      targetId: docId,
      targetName: email,
    });

    return NextResponse.json({
      success: true,
      message: "Two-Factor Authentication berhasil dinonaktifkan.",
    });
  } catch (error: any) {
    console.error("2FA Disable Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menonaktifkan 2FA." },
      { status: 500 }
    );
  }
}
