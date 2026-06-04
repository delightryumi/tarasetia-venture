const fs = require('fs');
const path = require('path');
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, getDoc, updateDoc } = require("firebase/firestore");

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

function getDatesBetween(checkInStr, checkOutStr, isAccommodation) {
  if (!checkInStr) return [];
  if (!isAccommodation || !checkOutStr || new Date(checkOutStr) <= new Date(checkInStr)) {
      return [checkInStr];
  }
  const dates = [];
  let curr = new Date(checkInStr);
  const end = new Date(checkOutStr);
  while (curr < end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

async function run() {
  const hotelId = "bumi-anyom-resort";
  // Let's get bahlil lagi info from 2026-06-04
  const docId = "bumi-anyom-resort_2026-06-04";
  const docSnap = await getDoc(doc(db, "daily_revenue", docId));
  if (!docSnap.exists()) {
    console.log("Document not found");
    return;
  }
  
  const entries = docSnap.data().entries || [];
  const item = entries.find(e => e.guestName === "bahlil lagi");
  if (!item) {
    console.log("bahlil lagi not found in daily_revenue");
    return;
  }
  
  console.log("Found bahlil lagi item:", item);
  
  const checkInDate = item.checkInDate || item.checkIn;
  const checkOutDate = item.checkOutDate || item.checkOut;
  const isAcc = item.type === "accommodation" || (!item.type && item.guestName && !item.guestName.startsWith("POS Order") && !item.posItems && !item.revenueType);
  
  const dates = getDatesBetween(checkInDate, checkOutDate, isAcc);
  console.log("Stay dates:", dates);
  
  for (const d of dates) {
    const docRef = doc(db, "daily_revenue", `${hotelId}_${d}`);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const dayEntries = snap.data().entries || [];
      console.log(`Document for ${d} has ${dayEntries.length} entries`);
      
      const updatedEntries = dayEntries.map((e) => {
        const isMatch = e.timestamp === item.timestamp || 
            (isAcc && 
             e.guestName === item.guestName && 
             e.checkInDate === item.checkInDate && 
             e.checkOutDate === item.checkOutDate && 
             String(e.roomNumber) === String(item.roomNumber));
        
        console.log(`Matching entry ${e.guestName} (${e.timestamp}): isMatch=${isMatch}`);
        if (isMatch) {
          const updated = { ...e, status: "CONFIRMED", paymentStatus: "PAID" };
          updated.cancelledAt = null;
          updated.cancelledBy = null;
          return updated;
        }
        return e;
      });
      
      // Try to update
      await updateDoc(docRef, { entries: updatedEntries });
      console.log(`Updated document for ${d}`);
    } else {
      console.log(`Document for ${d} does not exist!`);
    }
  }
}

run().catch(console.error);
