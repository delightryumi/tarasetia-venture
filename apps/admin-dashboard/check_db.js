const fs = require("fs");
const path = require("path");
const envPath = path.resolve(__dirname, ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) process.env[match[1]] = match[2] || "";
  });
}
const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/^"|"$/g, "").replace(/\\n/g, "\n");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
if (getApps().length === 0) initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey }) });
const db = getFirestore();
const hotelCode = "1";

async function run() {
  const staffSnap = await db.collection(`hotels/${hotelCode}/staff`).where("name", "==", "Tara").get();
  if (staffSnap.empty) return console.log("Tara not found");
  const tara = staffSnap.docs[0];
  console.log("Tara ID:", tara.id);
  
  const scheds = await db.collection(`hotels/${hotelCode}/staff/${tara.id}/schedules`).get();
  scheds.forEach(s => console.log("Schedule:", s.id, "=>", s.data()));
  
  const shifts = await db.collection(`hotels/${hotelCode}/shifts`).get();
  shifts.forEach(s => console.log("Shift:", s.id, "=>", s.data()));
  
  process.exit(0);
}
run();
