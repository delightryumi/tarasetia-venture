import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/emailHelper";
import { adminAuth } from "@/lib/firebaseAdmin";
import { getAuthenticatedUser } from "@/lib/security/serverAuth";
import { sanitizeIdentifier, isValidEmail } from "@/lib/security/inputSanitizer";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const body = await request.json();
    const { email: rawEmail, hotelCode: rawHotelCode, hotelName } = body;

    const email = (rawEmail || "").trim().toLowerCase();
    const hotelCode = sanitizeIdentifier(rawHotelCode);

    if (!email || !hotelCode) {
      return NextResponse.json(
        { error: "Email dan Kode Hotel wajib diisi." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Format alamat email tidak valid." },
        { status: 400 }
      );
    }

    // Role check: Only authenticated Superadmin can register hotel admins
    if (!authUser || !authUser.isSuperadmin) {
      return NextResponse.json(
        { error: "Akses Ditolak: Hanya Superadmin yang berwenang mendaftarkan admin hotel." },
        { status: 403 }
      );
    }

    // Generate strong unique random temporary password
    const randomSuffix = crypto.randomBytes(4).toString("hex");
    const defaultPassword = `Setara!${randomSuffix}`;

    let uid = "";
    let alreadyExists = false;

    try {
      // Check if user already exists
      const existingUser = await adminAuth.getUserByEmail(email);
      uid = existingUser.uid;
      alreadyExists = true;

      // Ambil existing claims
      const currentClaims = existingUser.customClaims || {};
      let allowedOutlets: string[] = Array.isArray(currentClaims.allowedOutlets) 
        ? [...currentClaims.allowedOutlets] 
        : (currentClaims.hotelCode ? [currentClaims.hotelCode as string] : []);
      
      // Tambahkan outlet baru jika belum ada
      if (!allowedOutlets.includes(hotelCode)) {
        allowedOutlets.push(hotelCode);
      }

      // Set custom claims for existing user
      await adminAuth.setCustomUserClaims(uid, { ...currentClaims, role: "admin", hotelCode, allowedOutlets });
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        // Create new Auth user
        const newUser = await adminAuth.createUser({
          email,
          password: defaultPassword,
          displayName: `${hotelName || "Outlet"} Admin`,
        });
        uid = newUser.uid;

        // Set custom claims
        await adminAuth.setCustomUserClaims(uid, { role: "admin", hotelCode, allowedOutlets: [hotelCode] });
      } else {
        console.error("Auth error in register-admin:", err);
        return NextResponse.json({ error: "Gagal memproses pendaftaran user di autentikasi." }, { status: 500 });
      }
    }

    if (alreadyExists) {
      return NextResponse.json({
        success: true,
        message: "Email sudah terdaftar di Auth, claims berhasil diperbarui dan dokumen akan ditautkan.",
        alreadyExists: true,
        defaultPassword: null,
      });
    }

    // Send Welcome Email jika akun baru dibuat
    let emailSent = false;
    let emailError = "";

    try {
      await sendWelcomeEmail({
        toEmail: email,
        adminName: `${hotelName || "Outlet"} Admin`,
        hotelName: hotelName || "Hotel Anda",
        hotelCode: hotelCode,
        password: defaultPassword,
      });
      emailSent = true;
    } catch (mailErr: any) {
      console.error("Gagal mengirim email onboarding ke", email, ":", mailErr);
      emailError = mailErr?.message || "Gagal mengirim email";
    }

    return NextResponse.json({
      success: true,
      message: emailSent 
        ? "Akun admin hotel berhasil dibuat dan email berisi kredensial telah dikirimkan."
        : "Akun admin hotel berhasil dibuat. (Email otomatis gagal dikirimkan).",
      defaultPassword,
      emailSent,
      emailError: emailSent ? null : emailError,
      alreadyExists: false,
    });
  } catch (error: any) {
    console.error("Error registering admin:", error);
    return NextResponse.json(
      { error: "Gagal memproses registrasi admin hotel." },
      { status: 500 }
    );
  }
}
