import { NextResponse } from "next/server";
import { adminAuth, adminDb, adminStorage } from "@/lib/firebaseAdmin";
import { sendWelcomeEmail } from "@/lib/emailHelper";
import { isValidEmail, sanitizeString, emailToDocId } from "@/lib/security/inputSanitizer";
import crypto from "crypto";

// Fallback module permissions untuk role admin (full owner pada modul aktif)
const ALL_KEYS = [
  "module_pos", "module_purchasing", "module_accounting", "module_cpanel", "module_hrd", "module_food_beverage",
  "overview", "invoice", "pnl", "logo", "users",
  "purchasing", "store-requisition", "purchase-requisition", "daily-market-list",
  "stock-opname", "items", "suppliers", "purchase-order", "food-beverage-product",
  "pos_home", "pos_lexupos", "pos_cashier", "pos_product", "pos_records", "pos_settings",
  "hrd"
];

// Preset modul Paket Free POS (POS, Accounting, Purchasing, HRD, tanpa self-order & kitchen monitoring)
const FREE_POS_MODULES = [
  "pos",
  "food-beverage",
  "purchasing",
  "accounting",
  "hrd",
  "cpanel-only"
];

const ALLOWED_LEAD_SOURCES = [
  "Facebook",
  "Instagram",
  "TikTok",
  "Rekomendasi Teman",
  "Google / Website",
  "Lainnya"
];

// In-Memory Rate Limiter per IP (Maksimal 3 registrasi sukses per 15 menit per IP)
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_REGISTRATIONS_PER_IP = 3;
const ipRegistrationLog = new Map<string, number[]>();

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = (ipRegistrationLog.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= MAX_REGISTRATIONS_PER_IP) {
    ipRegistrationLog.set(ip, timestamps);
    return false;
  }
  return true;
}

function recordIpRegistration(ip: string) {
  const now = Date.now();
  const timestamps = (ipRegistrationLog.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  timestamps.push(now);
  ipRegistrationLog.set(ip, timestamps);
}

// Validasi ketat untuk URL/DataURI Logo guna mencegah XSS (SVG/javascript:) & SSRF
function validateAndSanitizeLogoInput(rawLogo: unknown): {
  isValid: boolean;
  type: "empty" | "data-url" | "firebase-url" | "invalid";
  mimeType?: string;
  base64Data?: string;
  cleanUrl?: string;
} {
  if (!rawLogo || typeof rawLogo !== "string" || !rawLogo.trim()) {
    return { isValid: true, type: "empty", cleanUrl: "" };
  }

  const trimmed = rawLogo.trim();

  // 1. Jika berupa Data URL terkompresi dari Canvas (hanya raster aman: png, jpeg, jpg, webp, gif)
  const dataUrlMatch = trimmed.match(
    /^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,([A-Za-z0-9+/=]+)$/
  );
  if (dataUrlMatch) {
    // Batasi ukuran string base64 maksimal ~600KB agar aman untuk dokumen Firestore & memori
    if (trimmed.length > 650 * 1024) {
      return { isValid: false, type: "invalid" };
    }
    return {
      isValid: true,
      type: "data-url",
      mimeType: dataUrlMatch[1],
      base64Data: dataUrlMatch[2],
      cleanUrl: trimmed
    };
  }

  // 2. Jika berupa URL HTTPS dari Firebase Storage resmi
  if (
    trimmed.startsWith("https://firebasestorage.googleapis.com/") &&
    trimmed.length <= 2048
  ) {
    return { isValid: true, type: "firebase-url", cleanUrl: trimmed };
  }

  return { isValid: false, type: "invalid" };
}

export async function POST(request: Request) {
  let createdUid = "";

  try {
    // 0. Pemeriksaan Rate Limit Berbasis IP
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown-ip";

    if (!checkIpRateLimit(clientIp)) {
      return NextResponse.json(
        {
          error:
            "Terlalu banyak permintaan pendaftaran dari jaringan Anda. Silakan tunggu 15 menit sebelum mencoba kembali."
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const businessName = sanitizeString(body.businessName, 100);
    const address = sanitizeString(body.address, 250);
    const phone = sanitizeString(body.phone, 35);
    const email = sanitizeString(body.email, 120).toLowerCase();
    const leadSource = sanitizeString(body.leadSource, 50);
    const leadSourceOther = sanitizeString(body.leadSourceOther, 100);

    // 1. Validasi Input Wajib & Whitelist
    if (!businessName || !address || !phone || !email) {
      return NextResponse.json(
        { error: "Nama usaha, alamat, nomor telepon/WhatsApp, dan email wajib diisi." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Format alamat email tidak valid." },
        { status: 400 }
      );
    }

    if (!leadSource || !ALLOWED_LEAD_SOURCES.includes(leadSource)) {
      return NextResponse.json(
        { error: "Silakan pilih dari mana Anda mengetahui Tara." },
        { status: 400 }
      );
    }

    if (leadSource === "Lainnya" && !leadSourceOther) {
      return NextResponse.json(
        { error: "Keterangan sumber lainnya wajib diisi jika memilih opsi Lainnya." },
        { status: 400 }
      );
    }

    // Validasi Keamanan Input Logo
    const logoValidation = validateAndSanitizeLogoInput(body.logoUrl);
    if (!logoValidation.isValid) {
      return NextResponse.json(
        { error: "Format logo tidak valid atau ukuran melebihi batas aman." },
        { status: 400 }
      );
    }

    // 2. Pre-Flight Security Check: Pastikan Email Belum Terdaftar
    // Mencegah Privilege Escalation / Account Overwrite & mencegah pembuatan dokumen hotel yatim
    try {
      const existingUser = await adminAuth.getUserByEmail(email);
      if (existingUser) {
        return NextResponse.json(
          {
            error:
              "Alamat email ini sudah terdaftar di ekosistem Tara. Silakan masuk (Sign In) menggunakan akun Anda atau gunakan alamat email lain."
          },
          { status: 409 }
        );
      }
    } catch (authCheckErr: any) {
      if (authCheckErr.code !== "auth/user-not-found") {
        console.error("Error checking existing user email:", authCheckErr);
        throw new Error("Gagal memverifikasi ketersediaan email.");
      }
    }

    // 3. Generate Unique 5-digit Partner Code
    let hotelCode = "";
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      attempts++;
      const candidateCode = Math.floor(10000 + Math.random() * 90000).toString();
      const existingDoc = await adminDb.collection("hotels").doc(candidateCode).get();
      if (!existingDoc.exists) {
        hotelCode = candidateCode;
        isUnique = true;
      }
    }

    if (!hotelCode) {
      return NextResponse.json(
        { error: "Gagal membuat Partner Code unik. Silakan coba kembali." },
        { status: 500 }
      );
    }

    // 4. Proses Penyimpanan Logo ke Firebase Storage via Admin SDK (Fallback ke DataURL terkompresi)
    let finalLogoUrl = logoValidation.cleanUrl || "";
    if (
      logoValidation.type === "data-url" &&
      logoValidation.base64Data &&
      logoValidation.mimeType
    ) {
      try {
        const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
        if (bucketName) {
          const bucket = adminStorage.bucket(bucketName);
          const ext = logoValidation.mimeType.split("/")[1] || "png";
          const filePath = `hotels/${hotelCode}/branding/logo_${Date.now()}.${ext}`;
          const downloadToken = crypto.randomUUID();
          const buffer = Buffer.from(logoValidation.base64Data, "base64");

          const fileRef = bucket.file(filePath);
          await fileRef.save(buffer, {
            metadata: {
              contentType: logoValidation.mimeType,
              metadata: {
                firebaseStorageDownloadTokens: downloadToken
              }
            }
          });

          const encodedPath = encodeURIComponent(filePath);
          finalLogoUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;
        }
      } catch (storageUploadErr) {
        // Jika upload bucket gagal, gunakan Data URL PNG terkompresi yang sudah divalidasi (< 50KB)
        console.warn("Storage bucket upload fallback to compressed Data URL:", storageUploadErr);
      }
    }

    // 5. Buat Akun Firebase Auth Baru & Sematkan Custom Claims
    const randomSuffix = crypto.randomBytes(4).toString("hex");
    const defaultPassword = `Setara!${randomSuffix}`;

    const newUser = await adminAuth.createUser({
      email,
      password: defaultPassword,
      displayName: `${businessName} Admin`
    });
    createdUid = newUser.uid;

    await adminAuth.setCustomUserClaims(createdUid, {
      role: "admin",
      hotelCode,
      allowedOutlets: [hotelCode]
    });

    // 6. Hitung Jatuh Tempo Tepat 6 Bulan dari Pendaftaran Pertama
    const registrationDate = new Date();
    const dueDate = new Date(registrationDate);
    dueDate.setMonth(dueDate.getMonth() + 6);
    const nextDueDate = dueDate.toISOString().split("T")[0];
    const nowIso = registrationDate.toISOString();

    const finalLeadSource =
      leadSource === "Lainnya" ? `Lainnya: ${leadSourceOther}` : leadSource;

    // 7. Simpan Seluruh Dokumen Partner, Settings Struk/Report, dan Owner secara Atomik (Batch Write)
    const batch = adminDb.batch();

    // 7a. Dokumen Master Hotel Partner
    const hotelRef = adminDb.collection("hotels").doc(hotelCode);
    const hotelPayload: Record<string, any> = {
      hotelCode,
      name: businessName,
      domain: "",
      subdomain: `${hotelCode}.crs.local`,
      address,
      phone,
      email,
      active: true,
      createdAt: nowIso,
      leadSource: finalLeadSource,
      isSelfRegistered: true,
      activeModules: FREE_POS_MODULES,
      billing: {
        plan: "startup",
        cycle: "monthly",
        status: "paid",
        nextDueDate,
        activeModules: FREE_POS_MODULES,
        freeMonthsGranted: 6,
        isTrial: true
      }
    };

    if (finalLogoUrl) {
      hotelPayload.logoUrl = finalLogoUrl;
    }
    batch.set(hotelRef, hotelPayload);

    // 7b. Sinkronisasi ke settings/pos_receipt (agar Struk Thermal langsung menampilkan Nama Usaha, Alamat, Telepon & Logo)
    const receiptRef = adminDb.doc(`hotels/${hotelCode}/settings/pos_receipt`);
    batch.set(
      receiptRef,
      {
        shopName: businessName,
        address,
        phone,
        logoUrl: finalLogoUrl,
        showLogo: Boolean(finalLogoUrl),
        updatedAt: nowIso
      },
      { merge: true }
    );

    // 7c. Sinkronisasi ke settings/pos (Identitas Outlet POS & Kop Laporan)
    const posRef = adminDb.doc(`hotels/${hotelCode}/settings/pos`);
    batch.set(
      posRef,
      {
        name: businessName,
        address,
        phone,
        email,
        logoUrl: finalLogoUrl,
        shopLogo: finalLogoUrl,
        updatedAt: nowIso
      },
      { merge: true }
    );

    // 7d. Sinkronisasi ke settings/landingPage (dibaca oleh seluruh Export PDF Laporan Purchasing, HRD & Accounting)
    if (finalLogoUrl) {
      const landingRef = adminDb.doc(`hotels/${hotelCode}/settings/landingPage`);
      batch.set(
        landingRef,
        {
          lightLogo: finalLogoUrl,
          darkLogo: finalLogoUrl,
          logoUrl: finalLogoUrl,
          updatedAt: nowIso
        },
        { merge: true }
      );
    }

    // 7e. Dokumen Owner di users_master
    const finalPerms: Record<string, boolean> = {};
    ALL_KEYS.forEach((k) => {
      finalPerms[k] = true;
    });

    const docId = emailToDocId(email);
    const userDocRef = adminDb.doc(`hotels/${hotelCode}/users_master/${docId}`);
    batch.set(
      userDocRef,
      {
        email,
        name: `${businessName} Admin`,
        role: "admin",
        isOwner: true,
        hotelCode,
        allowedOutlets: [hotelCode],
        uid: createdUid,
        permissions: finalPerms,
        createdAt: nowIso
      },
      { merge: true }
    );

    await batch.commit();

    // Catat ke Rate Limiter setelah transaksi database berhasil
    recordIpRegistration(clientIp);

    // 8. Kirim Welcome Email Berisi Kredensial (Sesuai Alur Superadmin)
    let emailSent = false;
    let emailError = "";

    try {
      await sendWelcomeEmail({
        toEmail: email,
        adminName: `${businessName} Admin`,
        hotelName: businessName,
        hotelCode,
        password: defaultPassword
      });
      emailSent = true;
    } catch (mailErr: any) {
      console.error("Gagal mengirim email welcome partner:", mailErr);
      emailError = mailErr?.message || "Gagal mengirim email kredensial";
    }

    return NextResponse.json({
      success: true,
      message: "Pendaftaran kemitraan berhasil! Kredensial telah dikirimkan ke email Anda.",
      hotelCode,
      businessName,
      email,
      nextDueDate,
      emailSent,
      emailError: emailSent ? undefined : emailError
    });
  } catch (error: any) {
    // Rollback akun Firebase Auth jika penulisan database gagal di tengah jalan
    if (createdUid) {
      try {
        await adminAuth.deleteUser(createdUid);
      } catch (rollbackErr) {
        console.error("Rollback deleteUser error:", rollbackErr);
      }
    }

    console.error("Error in public register-partner:", error);
    return NextResponse.json(
      { error: error?.message || "Terjadi kesalahan pada sistem pendaftaran." },
      { status: 500 }
    );
  }
}
