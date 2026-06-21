const fs = require("fs");
const path = require("path");

const envPath = path.resolve(__dirname, ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
      process.env[key] = value;
    }
  });
}

const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const formattedKey = privateKey.replace(/^"|"$/g, "").replace(/\\n/g, "\n");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

if (getApps().length === 0) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey: formattedKey }) });
}
const db = getFirestore();
const hotelCode = "1";

async function deleteCollection(collectionPath) {
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.get();
  if (snapshot.empty) return;
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

async function run() {
  console.log("Menghapus SELURUH data operasional untuk Demo (Partner Code 1)...");
  await deleteCollection(`hotels/${hotelCode}/staff`);
  await deleteCollection(`hotels/${hotelCode}/shifts`);
  await deleteCollection(`hotels/${hotelCode}/roomTypes`);
  await deleteCollection(`hotels/${hotelCode}/pos_products`);
  await deleteCollection(`hotels/${hotelCode}/pos_orders`);
  await deleteCollection(`hotels/${hotelCode}/revenue_transactions`);
  await deleteCollection(`hotels/${hotelCode}/daily_revenue`);
  await deleteCollection(`hotels/${hotelCode}/items`);
  await deleteCollection(`hotels/${hotelCode}/suppliers`);
  await deleteCollection(`hotels/${hotelCode}/store_requisitions`);
  await deleteCollection(`hotels/${hotelCode}/daily_market_lists`);
  await deleteCollection(`hotels/${hotelCode}/purchase_requisitions`);
  await deleteCollection(`hotels/${hotelCode}/pos_held_orders`);
  await deleteCollection(`hotels/${hotelCode}/cashier_shifts`);
  
  for (let m = 5; m <= 12; m++) {
    const ym = `2026-${String(m).padStart(2, "0")}`;
    await deleteCollection(`hotels/${hotelCode}/attendance/${ym}/logs`);
    await db.doc(`global_pnl_reports/${ym}`).delete();
    await db.doc(`hotels/${hotelCode}/payroll_summaries/${ym}`).delete();
  }
  console.log("KOSONG 100%. Data berhasil dihapus semua tanpa seeding!");
  process.exit(0);
}
run();
