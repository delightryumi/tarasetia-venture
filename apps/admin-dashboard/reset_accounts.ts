import * as fs from "fs";
import * as path from "path";
import * as admin from "firebase-admin";

// Parse .env.local
const envPath = path.resolve(__dirname, ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!privateKey || !clientEmail || !projectId) {
  console.error("Missing Firebase environment variables.");
  process.exit(1);
}

const formattedKey = privateKey.replace(/^"|"$/g, "").replace(/\\n/g, "\n");

// Import dynamic to allow env variables to be set first
let adminAuth: any;
let adminDb: any;

async function deleteCollection(collectionPath: string) {
  const collectionRef = adminDb.collection(collectionPath);
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) {
    return;
  }

  const batch = adminDb.batch();
  snapshot.docs.forEach((doc: any) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

async function runReset() {
  const firebaseAdmin = await import("./lib/firebaseAdmin");
  adminAuth = firebaseAdmin.adminAuth;
  adminDb = firebaseAdmin.adminDb;

  try {
    console.log("=== MEMULAI RESET AKUN ===");

    // 1. HAPUS SEMUA AKUN DI FIREBASE AUTH
    console.log("Mengambil seluruh pengguna Firebase Auth...");
    let adminAuthUsers: string[] = [];
    let pageToken: string | undefined = undefined;
    do {
      const listUsersResult: any = await adminAuth.listUsers(1000, pageToken);
      listUsersResult.users.forEach((userRecord: any) => {
        adminAuthUsers.push(userRecord.uid);
      });
      pageToken = listUsersResult.pageToken;
    } while (pageToken);

    if (adminAuthUsers.length > 0) {
      console.log(`Ditemukan ${adminAuthUsers.length} pengguna. Menghapus massal...`);
      await adminAuth.deleteUsers(adminAuthUsers);
      console.log("Berhasil menghapus semua pengguna Firebase Auth.");
    } else {
      console.log("Tidak ada pengguna di Firebase Auth.");
    }

    // 2. HAPUS KOLEKSI users_master DI SETIAP HOTEL
    console.log("Mencari semua koleksi users_master di setiap hotel...");
    const hotelsSnapshot = await adminDb.collection("hotels").get();
    let hotelCodes: string[] = [];
    hotelsSnapshot.forEach((doc) => {
      hotelCodes.push(doc.id);
    });

    for (const code of hotelCodes) {
      const usersMasterPath = `hotels/${code}/users_master`;
      await deleteCollection(usersMasterPath);
      console.log(`Dihapus: ${usersMasterPath}`);
    }

    console.log("Juga menghapus koleksi users_master global (jika ada)...");
    await deleteCollection("users_master");

    // 3. SEEDING AKUN SUPERADMIN (Partner Code: 0)
    console.log("Membuat akun SUPERADMIN (admin@setara.co.id)...");
    const superadminRecord = await adminAuth.createUser({
      email: "admin@setara.co.id",
      password: "222222",
      displayName: "Master Superadmin",
    });
    await adminAuth.setCustomUserClaims(superadminRecord.uid, {
      role: "superadmin",
      hotelCode: "0"
    });
    console.log("Superadmin Auth dibuat.");

    const superadminDocId = "admin_setara_co_id";
    await adminDb.collection("users_master").doc(superadminDocId).set({
      email: "admin@setara.co.id",
      name: "Master Superadmin",
      role: "superadmin",
      hotelCode: "0",
      createdAt: new Date().toISOString(),
      permissions: {
        module_cpanel: true,
        users: true,
      }
    });

    // 4. SEEDING AKUN DEMO PARTNER (Partner Code: 1)
    console.log("Membuat akun DEMO PARTNER (demo@setara.co.id)...");
    const demoRecord = await adminAuth.createUser({
      email: "demo@setara.co.id",
      password: "000000",
      displayName: "Demo Partner",
    });
    await adminAuth.setCustomUserClaims(demoRecord.uid, {
      role: "admin",
      hotelCode: "1"
    });
    console.log("Demo Auth dibuat.");

    console.log("Membuat data Hotel Dummy untuk Demo (Kode: 1)...");
    await adminDb.collection("hotels").doc("1").set({
      name: "Setara Demo Partner",
      hotelCode: "1",
      domain: "demo.setara.co.id",
      subdomain: "demo.crs.local",
      email: "demo@setara.co.id",
      phone: "08123456789",
      address: "Demo Street No. 1",
      active: true,
      billing: {
        status: "paid",
        plan: "bisnis",
        cycle: "monthly",
        nextDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        showBillingAlert: false,
        showExpirationAlert: false,
        activeModules: ["pos", "front-office", "housekeeping", "food-beverage", "purchasing", "accounting", "hrd", "cpanel-full"]
      },
      createdAt: new Date().toISOString()
    }, { merge: true });

    const demoDocId = "demo_setara_co_id";
    await adminDb.collection("hotels").doc("1").collection("users_master").doc(demoDocId).set({
      email: "demo@setara.co.id",
      name: "Demo Partner",
      role: "admin",
      createdAt: new Date().toISOString(),
      permissions: {
        module_pos: true, module_front_office: true, module_housekeeping: true,
        module_food_beverage: true, module_purchasing: true, module_accounting: true, module_cpanel: true,
        overview: true, forecast: true, invoice: true, pnl: true, logo: true, hero: true,
        "room-type": true, about: true, gallery: true, footer: true, attractions: true,
        promo: true, packages: true, seo: true, users: true, purchasing: true,
        "store-requisition": true, "purchase-requisition": true, "daily-market-list": true,
        "stock-opname": true, items: true, suppliers: true, "purchase-order": true,
        "food-beverage-product": true,
        pos_home: true, pos_lexupos: true, pos_cashier: true, pos_product: true,
        pos_records: true, pos_settings: true, pos_self_order: true,
      }
    });
    console.log("Demo users_master dibuat.");

    console.log("=== RESET SELESAI ===");
    process.exit(0);

  } catch (error) {
    console.error("TERJADI KESALAHAN SAAT RESET:", error);
    process.exit(1);
  }
}

runReset();
