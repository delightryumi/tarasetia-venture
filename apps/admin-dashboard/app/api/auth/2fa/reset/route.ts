import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { emailToDocId } from "@/lib/security/inputSanitizer";
import { requireAuth } from "@/lib/security/serverAuth";
import { logAuditEvent } from "@/lib/auditLogger";

export async function POST(req: NextRequest) {
  try {
    const authCheck = await requireAuth(req);
    if ("errorResponse" in authCheck) return authCheck.errorResponse;

    const caller = authCheck.user;
    const isSuperadmin = caller.isSuperadmin;
    const callerRole = String(caller.role || "").toLowerCase();
    const canManage = isSuperadmin || callerRole === "admin" || callerRole === "administrator" || callerRole === "general manager" || caller.permissions?.users === true;

    if (!canManage) {
      return NextResponse.json(
        { error: "Akses Ditolak: Hanya Administrator atau Superadmin yang dapat mereset 2FA pengguna." },
        { status: 403 }
      );
    }

    const { targetEmail, hotelCode } = await req.json();

    if (!targetEmail || typeof targetEmail !== "string") {
      return NextResponse.json(
        { error: "Target email wajib disertakan." },
        { status: 400 }
      );
    }

    const cleanEmail = targetEmail.trim().toLowerCase();
    const docId = emailToDocId(cleanEmail);
    let resolvedHotelCode = hotelCode || caller.hotelCode || "0";

    let userRef = adminDb.doc(`users_master/${docId}`);
    let snap = await userRef.get();

    if (!snap.exists && resolvedHotelCode && resolvedHotelCode !== "0") {
      userRef = adminDb.doc(`hotels/${resolvedHotelCode}/users_master/${docId}`);
      snap = await userRef.get();
    }

    if (!snap.exists) {
      const groupSnap = await adminDb
        .collectionGroup("users_master")
        .where("email", "==", cleanEmail)
        .limit(1)
        .get();
      if (!groupSnap.empty) {
        userRef = groupSnap.docs[0].ref;
        snap = groupSnap.docs[0];
      }
    }

    if (!snap.exists) {
      return NextResponse.json(
        { error: `Pengguna dengan email ${cleanEmail} tidak ditemukan.` },
        { status: 404 }
      );
    }

    const userData = snap.data() || {};
    const targetName = userData.name || userData.displayName || cleanEmail;

    // Reset 2FA fields completely
    await userRef.set(
      {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorPendingSecret: null,
        twoFactorRecoveryCodes: [],
        twoFactorResetAt: new Date().toISOString(),
        twoFactorResetBy: caller.email,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Also update root users_master if it exists there
    try {
      const rootDocRef = adminDb.doc(`users_master/${docId}`);
      const rootSnap = await rootDocRef.get();
      if (rootSnap.exists) {
        await rootDocRef.set(
          {
            twoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorPendingSecret: null,
            twoFactorRecoveryCodes: [],
            twoFactorResetAt: new Date().toISOString(),
            twoFactorResetBy: caller.email,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    } catch (e) {
      console.warn("Could not sync 2FA reset to root users_master:", e);
    }

    // Security audit log
    await logAuditEvent({
      hotelCode: resolvedHotelCode,
      actor: {
        id: caller.uid,
        email: caller.email,
        name: (caller as any).name || caller.email.split("@")[0],
        role: caller.role || "Admin",
      },
      action: "ADMIN_RESET_2FA",
      category: "SECURITY",
      description: `Administrator ${caller.email} mereset 2FA untuk akun ${targetName} (${cleanEmail}).`,
      targetId: cleanEmail,
      metadata: {
        targetEmail: cleanEmail,
        targetName,
        resetBy: caller.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: `2FA untuk ${targetName} (${cleanEmail}) berhasil direset. User dapat mendaftarkan kembali Authenticator baru saat login berikutnya.`,
    });
  } catch (error: any) {
    console.error("2FA Admin Reset Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mereset 2FA pengguna." },
      { status: 500 }
    );
  }
}
