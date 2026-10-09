import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { emailToDocId } from "@/lib/security/inputSanitizer";
import { verifyTotpToken } from "@/lib/totp";
import { logAuditEvent } from "@/lib/auditLogger";

export async function POST(req: NextRequest) {
  try {
    const { email, hotelCode, code } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email wajib disertakan." }, { status: 400 });
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

    // If 2FA is not enabled on this account, pass directly
    if (!userData.twoFactorEnabled) {
      return NextResponse.json({ valid: true, required: false });
    }

    if (!code) {
      return NextResponse.json(
        { error: "Akun ini dilindungi oleh Google Authenticator. Masukkan kode 6 digit.", required: true },
        { status: 401 }
      );
    }

    const secret = userData.twoFactorSecret;
    const cleanCode = String(code).trim().toUpperCase();

    // 1. Verify TOTP token
    const isTotpValid = secret
      ? verifyTotpToken({
          secret,
          token: cleanCode,
          window: 1,
        })
      : false;

    // 2. Check emergency recovery code
    const recoveryCodes: string[] = userData.twoFactorRecoveryCodes || [];
    const recoveryIndex = recoveryCodes.indexOf(cleanCode);
    const isRecoveryMatch = recoveryIndex !== -1;

    if (!isTotpValid && !isRecoveryMatch) {
      return NextResponse.json(
        { error: "Kode verifikasi 2FA tidak valid atau sudah kedaluwarsa.", required: true },
        { status: 401 }
      );
    }

    // If recovery code was used, remove it from list
    if (isRecoveryMatch) {
      const remainingCodes = recoveryCodes.filter((_, idx) => idx !== recoveryIndex);
      await userRef.update({
        twoFactorRecoveryCodes: remainingCodes,
        updatedAt: new Date().toISOString(),
      });

      await logAuditEvent({
        hotelCode: resolvedHotelCode,
        actor: {
          uid: userData.uid || docId,
          name: userData.name || userData.displayName || email,
          email: email,
          role: userData.role || "user",
        },
        category: "SECURITY",
        action: "RECOVERY_CODE_USED",
        description: `Pengguna ${email} login menggunakan Emergency Recovery Code. Sisa kode: ${remainingCodes.length}`,
        targetId: docId,
        targetName: email,
      });
    }

    return NextResponse.json({
      valid: true,
      required: true,
      usedRecoveryCode: isRecoveryMatch,
      remainingRecoveryCodes: isRecoveryMatch ? recoveryCodes.length - 1 : undefined,
    });
  } catch (error: any) {
    console.error("2FA Validation Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memverifikasi kode 2FA." },
      { status: 500 }
    );
  }
}
