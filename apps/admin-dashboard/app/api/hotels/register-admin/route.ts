import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/emailHelper";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const { email, hotelCode, hotelName } = await request.json();

    if (!email || !hotelCode) {
      return NextResponse.json(
        { error: "Email dan Kode Hotel wajib diisi." },
        { status: 400 }
      );
    }

    console.log("DEBUG ENV DI SERVER-SIDE API:");
    console.log("- SMTP_HOST:", process.env.SMTP_HOST);
    console.log("- SMTP_PORT:", process.env.SMTP_PORT);
    console.log("- SMTP_USER:", process.env.SMTP_USER);
    console.log("- SMTP_PASS:", process.env.SMTP_PASS ? "TERSEDIA (Panjang: " + process.env.SMTP_PASS.length + ")" : "UNDEFINED / KOSONG");
    console.log("- SMTP_FROM_EMAIL:", process.env.SMTP_FROM_EMAIL);

    // Generate password default yang aman dan unik: Nexura[hotelCode]!
    const defaultPassword = `Nexura${hotelCode}!`;

    let uid = "";
    let alreadyExists = false;

    try {
      // Check if user already exists
      const existingUser = await adminAuth.getUserByEmail(email);
      uid = existingUser.uid;
      alreadyExists = true;

      // Set custom claims for existing user
      await adminAuth.setCustomUserClaims(uid, { role: "admin", hotelCode });
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        // Create new Auth user
        const newUser = await adminAuth.createUser({
          email: email.trim(),
          password: defaultPassword,
          displayName: `${hotelName || "Hotel"} Admin`,
        });
        uid = newUser.uid;

        // Set custom claims
        await adminAuth.setCustomUserClaims(uid, { role: "admin", hotelCode });
      } else {
        throw err;
      }
    }

    if (alreadyExists) {
      return NextResponse.json({
        success: true,
        message: "Email sudah terdaftar di Auth, claims berhasil diperbarui dan dokumen akan ditautkan.",
        alreadyExists: true,
        defaultPassword: null,
        emailSent: false
      });
    }

    // Kirim email sambutan menggunakan Nodemailer SMTP
    let emailSent = false;
    try {
      emailSent = await sendWelcomeEmail({
        toEmail: email.trim(),
        hotelCode,
        hotelName: hotelName || "Properti CRS Baru",
        defaultPassword
      });
    } catch (emailErr) {
      console.error("Gagal mengirim email selamat datang:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Akun autentikasi berhasil dibuat.",
      uid,
      defaultPassword,
      emailSent
    });

  } catch (error: any) {
    console.error("Error in register-admin API:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
