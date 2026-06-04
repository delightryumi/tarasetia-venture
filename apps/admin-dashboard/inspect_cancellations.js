const fs = require('fs');
const path = require('path');
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, doc, updateDoc } = require("firebase/firestore");

// Parse .env.local
const envPath = path.join(__dirname, '.env.local');
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
  console.log("Fetching daily_revenue collection...");
  const snap = await getDocs(collection(db, "daily_revenue"));
  console.log(`Found ${snap.size} documents.`);
  
  for (const docSnap of snap.docs) {
    const docId = docSnap.id;
    const parts = docId.split('_');
    const dateStr = parts[parts.length - 1]; // e.g. "2026-06-03"
    
    // Validate format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      console.log(`Migrating doc ${docId} -> setting date = "${dateStr}"`);
      const docRef = doc(db, "daily_revenue", docId);
      await updateDoc(docRef, { date: dateStr });
    } else {
      console.log(`Skipping doc ${docId} due to invalid date format in ID.`);
    }
  }
  console.log("Unconditional migration completed successfully!");
}

run().catch(console.error);
