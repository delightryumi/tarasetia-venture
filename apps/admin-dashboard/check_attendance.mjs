import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'fs/promises';

async function main() {
  const serviceAccount = JSON.parse(await readFile('./serviceAccountKey.json', 'utf-8'));
  
  if (!initializeApp.apps?.length) {
    initializeApp({ credential: cert(serviceAccount) });
  }

  const db = getFirestore();
  const hotelCode = "87241"; // Based on earlier context
  
  // Get attendance logs
  const snap = await db.collection(`hotels/${hotelCode}/attendance/2026-06/logs`).limit(5).get();
  snap.forEach(doc => {
    console.log("LOG:", doc.id, doc.data());
  });

  const leaveSnap = await db.collection(`hotels/${hotelCode}/leave_requests`).limit(5).get();
  leaveSnap.forEach(doc => {
    console.log("LEAVE:", doc.id, doc.data());
  });
}
main().catch(console.error);
