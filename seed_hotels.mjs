import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const newConfig = {
  apiKey: "AIzaSyCXkuVRloHHbBYpKungDNWKCgNiqeVudqc",
  authDomain: "crs-nexura.firebaseapp.com",
  projectId: "crs-nexura",
  storageBucket: "crs-nexura.firebasestorage.app",
  messagingSenderId: "105295874197",
  appId: "1:105295874197:web:c10fe9ce787f21699bf39c",
};

const app = initializeApp(newConfig);
const db = getFirestore(app);

const hotelCode = "bumi-anyom-resort";

async function seed() {
  console.log("Seeding hotels master doc for crs-nexura...");
  const docRef = doc(db, "hotels", hotelCode);
  await setDoc(docRef, {
    hotelCode: hotelCode,
    name: "Bumi Anyom Resort",
    active: true,
    domain: "resort.bumianyom.com",
    subdomain: "bumi-anyom-resort.nexuracrs.com",
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
  console.log("Seed complete successfully!");
}

seed();
