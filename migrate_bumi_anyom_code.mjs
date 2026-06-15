import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCXkuVRloHHbBYpKungDNWKCgNiqeVudqc",
  authDomain: "crs-nexura.firebaseapp.com",
  projectId: "crs-nexura",
  storageBucket: "crs-nexura.firebasestorage.app",
  messagingSenderId: "105295874197",
  appId: "1:105295874197:web:c10fe9ce787f21699bf39c",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const oldCode = "bumi-anyom-resort";
const newCode = "87241";

const collectionsToMigrate = [
  "roomTypes",
  "packages",
  "gallery",
  "attractions",
  "pos_products",
  "pos_categories",
  "pos_subcategories",
  "pos_orders",
  "revenue_transactions",
  "daily_revenue",
  "cashier_shifts",
  "pos_held_orders",
  "users_master"
];

async function runMigration() {
  console.log(`Starting migration from '${oldCode}' to '${newCode}'...`);

  // 1. Migrate Master Document
  const oldMasterRef = doc(db, "hotels", oldCode);
  const oldMasterSnap = await getDoc(oldMasterRef);
  
  if (oldMasterSnap.exists()) {
    const masterData = oldMasterSnap.data();
    masterData.hotelCode = newCode;
    masterData.subdomain = `${newCode}.nexuracrs.com`;
    
    const newMasterRef = doc(db, "hotels", newCode);
    await setDoc(newMasterRef, masterData);
    console.log("Master document migrated successfully!");
  } else {
    console.log("Old master document not found, seeding fresh default...");
    const newMasterRef = doc(db, "hotels", newCode);
    await setDoc(newMasterRef, {
      hotelCode: newCode,
      name: "Bumi Anyom Resort",
      active: true,
      domain: "resort.bumianyom.com",
      subdomain: `${newCode}.nexuracrs.com`,
      createdAt: new Date().toISOString(),
      suspendedAt: null,
      address: "Jl. Raya Anyom No. 42",
      phone: "+62 123-4567-890",
      email: "resort@bumianyom.com",
      billing: {
        plan: "premium",
        cycle: "monthly",
        nextDueDate: "2026-07-13T00:00:00Z",
        status: "paid"
      }
    });
  }

  // 2. Migrate Sub-collections
  for (const colName of collectionsToMigrate) {
    try {
      console.log(`Migrating sub-collection: ${colName}...`);
      const oldColRef = collection(db, `hotels/${oldCode}/${colName}`);
      const snapshot = await getDocs(oldColRef);
      console.log(`Found ${snapshot.size} documents in '${colName}'`);

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        let docId = docSnap.id;

        // Replace any occurrences of oldCode inside fields
        if (data.hotelId === oldCode) {
          data.hotelId = newCode;
        }
        if (data.hotelCode === oldCode) {
          data.hotelCode = newCode;
        }

        // Adjust document ID for daily_revenue if it contains the oldCode
        if (colName === "daily_revenue" && docId.startsWith(`${oldCode}_`)) {
          docId = docId.replace(`${oldCode}_`, `${newCode}_`);
        }

        const newDocRef = doc(db, `hotels/${newCode}/${colName}`, docId);
        await setDoc(newDocRef, data);

        // Delete old doc
        await deleteDoc(docSnap.ref);
      }
      console.log(`Successfully migrated and cleaned up sub-collection: ${colName}`);
    } catch (error) {
      console.error(`Error migrating sub-collection '${colName}':`, error);
    }
  }

  // 3. Delete old master document
  if (oldMasterSnap.exists()) {
    await deleteDoc(oldMasterRef);
    console.log("Old master document deleted successfully!");
  }

  console.log("Migration and cleanup complete!");
}

runMigration().catch(console.error);
