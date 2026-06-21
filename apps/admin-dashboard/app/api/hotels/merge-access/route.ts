import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const { email, selectedOutlets } = await request.json();

    if (!email || !selectedOutlets || !Array.isArray(selectedOutlets)) {
      return NextResponse.json(
        { error: "Email dan data outlet tidak valid." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    let uid = "";
    let existingUser;
    try {
      // Pastikan user ada di Firebase Auth
      existingUser = await adminAuth.getUserByEmail(cleanEmail);
      uid = existingUser.uid;
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        return NextResponse.json(
          { error: "Email belum terdaftar di sistem. Pastikan Owner sudah didaftarkan minimal di satu cabang." },
          { status: 404 }
        );
      }
      throw err;
    }

    // Update Custom Claims untuk menggabungkan akses
    const currentClaims = existingUser.customClaims || {};
    const newHotelCode = selectedOutlets.length > 0 ? selectedOutlets[0] : ""; // Jadikan outlet pertama sebagai primary hotelCode atau kosongkan
    
    await adminAuth.setCustomUserClaims(uid, { 
        ...currentClaims, 
        role: "admin", 
        hotelCode: newHotelCode, 
        allowedOutlets: selectedOutlets 
    });

    const batch = adminDb.batch();
    const userDocId = cleanEmail.replace(/[@.]/g, "_");

    // Hapus dokumen user dari cabang yang di-uncheck (revoke access)
    const oldOutlets: string[] = currentClaims.allowedOutlets || [];
    const removedOutlets = oldOutlets.filter(code => !selectedOutlets.includes(code));
    
    for (const code of removedOutlets) {
      const userRef = adminDb.doc(`hotels/${code}/users_master/${userDocId}`);
      batch.delete(userRef);
    }

    // Loop setiap cabang yang diceklis, tambahkan dokumen user di Firestore agar bisa login ke POS/CPanel
    for (const code of selectedOutlets) {
      const userRef = adminDb.doc(`hotels/${code}/users_master/${userDocId}`);
      batch.set(userRef, {
        email: cleanEmail,
        displayName: existingUser.displayName || "Owner",
        role: "admin",
        hotelCode: code,
        status: "active",
        createdAt: new Date().toISOString()
      }, { merge: true }); // Pakai merge true agar tidak menimpa jika sudah ada
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: selectedOutlets.length === 0 
        ? "Akses ke semua cabang berhasil dicabut (Unlink). Akun telah dipisahkan."
        : "Hak akses multi-cabang berhasil diperbarui!",
    });

  } catch (error: any) {
    console.error("Error Merge Access API:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server.", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
    }

    try {
      const existingUser = await adminAuth.getUserByEmail(email.trim().toLowerCase());
      const customClaims = existingUser.customClaims || {};
      const allowedOutlets = customClaims.allowedOutlets || [];
      
      return NextResponse.json({ allowedOutlets });
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        return NextResponse.json({ allowedOutlets: [] });
      }
      throw err;
    }
  } catch (error: any) {
    console.error("Error GET Merge Access:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
