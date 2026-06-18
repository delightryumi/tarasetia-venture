import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET(request: Request, { params }: { params: { token: string } }) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 400 });
    }

    const docRef = adminDb.collection("onboarding_tokens").doc(token);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Link pendaftaran tidak ditemukan atau salah." }, { status: 404 });
    }

    const data = docSnap.data();

    if (data?.status !== "pending") {
      return NextResponse.json({ error: "Link pendaftaran ini sudah digunakan atau kedaluwarsa." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        email: data?.email,
        plan: data?.plan,
        activeModules: data?.activeModules,
        createdAt: data?.createdAt
      }
    });

  } catch (error: any) {
    console.error("Error fetching onboarding token:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
