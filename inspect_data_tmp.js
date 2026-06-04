const fs = require('fs');
const path = require('path');
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, getDoc } = require("firebase/firestore");

// Parse .env.local
const envPath = path.join(__dirname, 'apps/admin-dashboard/.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const config = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) {
    config[parts[0].trim()] = parts[1].trim().replace(/"/g, '').replace(/\r/g, '');
  }
});

const firebaseConfig = {
  apiKey: config.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: config.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: config.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: config.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: config.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: config.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const docId = "bumi-anyom-resort_2026-06-04";
  console.log(`Fetching document ${docId}...`);
  const docSnap = await getDoc(doc(db, "daily_revenue", docId));
  if (docSnap.exists()) {
    console.log("Document found. Entries:");
    const entries = docSnap.data().entries || [];
    entries.forEach((e, idx) => {
      console.log(`[${idx}] JSON:`, JSON.stringify(e, null, 2));
    });
  } else {
    console.log("Document not found!");
  }
}

run().catch(console.error);
