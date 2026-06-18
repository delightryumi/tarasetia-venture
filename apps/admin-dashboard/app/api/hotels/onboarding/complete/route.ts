import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { sendWelcomeEmail } from "@/lib/emailHelper";

// Daftar fallback permission untuk super claims
const ALL_KEYS = [
  "module_pos", "module_front_office", "module_housekeeping", 
  "module_food_beverage", "module_purchasing", "module_accounting", "module_cpanel", "module_hrd",
  "overview", "forecast", "invoice", "pnl", "logo", "hero", "room-type", 
  "about", "gallery", "footer", "attractions", "promo", "packages", "seo", "users",
  "purchasing", "store-requisition", "purchase-requisition", "daily-market-list", 
  "stock-opname", "items", "suppliers", "purchase-order", "food-beverage-product",
  "pos_home", "pos_lexupos", "pos_cashier", "pos_product", "pos_records", "pos_settings",
  "hrd"
];

export async function POST(request: Request) {
  try {
    const { token, businessName, address, phone } = await request.json();

    if (!token || !businessName || !address) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    const tokenRef = adminDb.collection("onboarding_tokens").doc(token);
    const tokenSnap = await tokenRef.get();

    if (!tokenSnap.exists) {
      return NextResponse.json({ error: "Token tidak valid." }, { status: 404 });
    }

    const tokenData = tokenSnap.data();

    if (tokenData?.status !== "pending") {
      return NextResponse.json({ error: "Link ini sudah digunakan." }, { status: 400 });
    }

    const email = tokenData.email;
    const plan = tokenData.plan;
    const activeModules = tokenData.activeModules || [];

    // Generate 5-digit hotelCode
    const hotelCode = Math.floor(10000 + Math.random() * 90000).toString();
    const subdomain = `${hotelCode}.crs.local`;

    // 1. Create Tenant Hotel Document
    const hotelRef = adminDb.collection("hotels").doc(hotelCode);
    
    // Hitung nextDueDate (1 bulan dari sekarang untuk default bulanan)
    const nextDue = new Date();
    nextDue.setMonth(nextDue.getMonth() + 1);

    await hotelRef.set({
      hotelCode,
      name: businessName,
      domain: "",
      subdomain,
      address,
      phone,
      email,
      active: true,
      billing: {
        plan,
        cycle: "monthly",
        status: "paid",
        nextDueDate: nextDue.toISOString(),
        activeModules
      },
      createdAt: new Date().toISOString()
    });

    // 2. Register Firebase Auth and Users Master
    const defaultPassword = `Setara${hotelCode}!`;
    let uid = "";

    try {
      // Check if user already exists
      const existingUser = await adminAuth.getUserByEmail(email);
      uid = existingUser.uid;
      // Set custom claims for existing user
      await adminAuth.setCustomUserClaims(uid, { role: "admin", hotelCode });
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        // Create new Auth user
        const newUser = await adminAuth.createUser({
          email: email.trim(),
          password: defaultPassword,
          displayName: `${businessName} Admin`,
        });
        uid = newUser.uid;
        // Set custom claims
        await adminAuth.setCustomUserClaims(uid, { role: "admin", hotelCode });
      } else {
        throw err;
      }
    }

    // Set permissions all true since they are the tenant owner
    const finalPerms: any = {};
    ALL_KEYS.forEach(k => {
      finalPerms[k] = true;
    });

    const docId = email.trim().toLowerCase().replace(/[@.]/g, "_");
    const userDocRef = adminDb.doc(`hotels/${hotelCode}/users_master/${docId}`);
    
    await userDocRef.set({
      email: email.trim(),
      name: `${businessName} Admin`,
      role: "admin",
      hotelCode,
      uid,
      permissions: finalPerms,
      createdAt: new Date().toISOString()
    }, { merge: true });

    // 3. Send final welcome email
    try {
      await sendWelcomeEmail({
        toEmail: email.trim(),
        hotelCode,
        hotelName: businessName,
        defaultPassword
      });
    } catch (emailErr) {
      console.error("Gagal mengirim email welcome:", emailErr);
    }

    // 4. Mark token as completed
    await tokenRef.update({
      status: "completed",
      hotelCode,
      completedAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: "Onboarding selesai.",
      hotelCode
    });

  } catch (error: any) {
    console.error("Error in onboarding complete API:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
