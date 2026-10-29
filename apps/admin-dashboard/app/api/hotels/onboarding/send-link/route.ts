import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { sendOnboardingEmail } from "@/lib/emailHelper";
import { requireSuperadmin } from "@/lib/security/serverAuth";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    const authCheck = await requireSuperadmin(request);
    if ("errorResponse" in authCheck) return authCheck.errorResponse;

    const { email, plan, activeModules } = await request.json();

    if (!email || !plan) {
      return NextResponse.json(
        { error: "Email dan Paket Berlangganan wajib diisi." },
        { status: 400 }
      );
    }

    // Buat token unik
    const token = randomUUID();

    // Simpan ke Firestore
    const docRef = adminDb.collection("onboarding_tokens").doc(token);
    await docRef.set({
      email: email.trim(),
      plan,
      activeModules: activeModules || [],
      status: "pending",
      createdAt: new Date().toISOString()
    });

    // Kirim Email
    let emailSent = false;
    try {
      emailSent = await sendOnboardingEmail({
        toEmail: email.trim(),
        token,
        planName: plan
      });
    } catch (emailErr: any) {
      console.error("Gagal mengirim email onboarding:", emailErr);
      return NextResponse.json(
        { error: `Gagal mengirim email: ${emailErr.message || "Pastikan API Key valid."}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Onboarding link sent successfully",
      emailSent
    });

  } catch (error: any) {
    console.error("Error in onboarding send-link API:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
