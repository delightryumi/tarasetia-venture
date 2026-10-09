import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { emailToDocId } from "@/lib/security/inputSanitizer";
import { verifyTotpToken, generateRecoveryCodes } from "@/lib/totp";
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
    const pendingSecret = userData.twoFactorPendingSecret;

    if (!pendingSecret) {
      return NextResponse.json(
        { error: "Tidak ada proses aktivasi 2FA yang sedang berjalan. Silakan mulai ulang." },
        { status: 400 }
      );
    }

    // Verify token with +/- 1 time-step tolerance (90s window)
    const isValid = verifyTotpToken({
      secret: pendingSecret,
      token: String(code).trim(),
      window: 1,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Kode verifikasi 6 digit tidak cocok atau telah kedaluwarsa. Pastikan waktu pada perangkat Anda sudah sinkron." },
        { status: 400 }
      );
    }

    // Generate 8 backup recovery codes
    const recoveryCodes = generateRecoveryCodes(8);

    await userRef.set({
      twoFactorEnabled: true,
      twoFactorSecret: pendingSecret,
      twoFactorRecoveryCodes: recoveryCodes,
      twoFactorPendingSecret: null,
      twoFactorEnabledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

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
      action: "ENABLE_2FA",
      description: `Pengguna ${email} berhasil mengaktifkan Two-Factor Authentication (Google Authenticator).`,
      targetId: docId,
      targetName: email,
      metadata: {
        method: "TOTP_RFC6238",
        recoveryCodesCount: recoveryCodes.length,
      },
    });

    return NextResponse.json({
      success: true,
      recoveryCodes,
      message: "Two-Factor Authentication berhasil diaktifkan.",
    });
  } catch (error: any) {
    console.error("2FA Enable Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengaktifkan 2FA." },
      { status: 500 }
    );
  }
}
