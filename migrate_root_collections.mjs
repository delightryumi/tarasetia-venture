import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

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

const rootCollections = [
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

async function runRootMigration() {
  console.log(`Scanning and migrating root collections from '${oldCode}' to '${newCode}'...`);

  for (const colName of rootCollections) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      let migratedCount = 0;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        let docId = docSnap.id;
        let shouldMigrate = false;

        // Check if doc ID contains the old code
        if (docId.includes(oldCode)) {
          shouldMigrate = true;
          docId = docId.replace(new RegExp(oldCode, 'g'), newCode);
        }

        // Check if any fields reference the old code
        if (data.hotelId === oldCode) {
          data.hotelId = newCode;
          shouldMigrate = true;
        }
        if (data.hotelCode === oldCode) {
          data.hotelCode = newCode;
          shouldMigrate = true;
        }
        if (data.propertyId === oldCode) {
          data.propertyId = newCode;
          shouldMigrate = true;
        }

        if (shouldMigrate) {
          const newDocRef = doc(db, colName, docId);
          await setDoc(newDocRef, data);
          await deleteDoc(docSnap.ref);
          migratedCount++;
        }
      }
      if (migratedCount > 0) {
        console.log(`Migrated ${migratedCount} documents in root collection '${colName}'`);
      }
    } catch (error) {
      console.error(`Error migrating root collection '${colName}':`, error);
    }
  }

  console.log("Root collections migration complete!");
}

runRootMigration().catch(console.error);
