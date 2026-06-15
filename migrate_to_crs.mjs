import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";

const oldConfig = {
  apiKey: "AIzaSyAp3LWliLpKSuf1Pk-LRLbsqa9Ko23Di9Y",
  authDomain: "bumi-anyom.firebaseapp.com",
  projectId: "bumi-anyom",
  storageBucket: "bumi-anyom.firebasestorage.app",
  messagingSenderId: "656091999020",
  appId: "1:656091999020:web:66aa70ceb3788934e35a89",
};

const newConfig = {
  apiKey: "AIzaSyCXkuVRloHHbBYpKungDNWKCgNiqeVudqc",
  authDomain: "crs-nexura.firebaseapp.com",
  projectId: "crs-nexura",
  storageBucket: "crs-nexura.firebasestorage.app",
  messagingSenderId: "105295874197",
  appId: "1:105295874197:web:c10fe9ce787f21699bf39c",
};

// Initialize apps
const oldApp = initializeApp(oldConfig, "oldApp");
const newApp = initializeApp(newConfig, "newApp");

const dbOld = getFirestore(oldApp);
const dbNew = getFirestore(newApp);

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

const hotelCode = "bumi-anyom-resort";

async function migrate() {
  console.log("Starting migration from 'bumi-anyom' to 'crs-nexura'...");
  for (const colName of collectionsToMigrate) {
    try {
      console.log(`Migrating collection: ${colName}...`);
      const colRefOld = collection(dbOld, colName);
      const snapshot = await getDocs(colRefOld);
      console.log(`Found ${snapshot.size} documents in '${colName}'`);
      
      let count = 0;
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const docId = docSnap.id;
        
        // Save to new db under hotels/bumi-anyom-resort/collectionName/docId
        const newDocRef = doc(dbNew, `hotels/${hotelCode}/${colName}`, docId);
        await setDoc(newDocRef, data);
        count++;
      }
      console.log(`Successfully migrated ${count} documents for '${colName}'`);
    } catch (error) {
      console.error(`Error migrating collection '${colName}':`, error);
    }
  }
  console.log("Migration complete!");
}

migrate();
