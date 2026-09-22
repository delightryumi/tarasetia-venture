import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCXkuVRloHHbBYpKungDNWKCgNiqeVudqc",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "crs-nexura.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "crs-nexura",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "crs-nexura.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "105295874197",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:105295874197:web:c10fe9ce787f21699bf39c",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-M70FFJRVHN",
};

// Prevent duplicate initialization in Next.js dev mode (HMR)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firestore
const db = getFirestore(app);

// Storage
const storage = getStorage(app);

// Auth
const auth = getAuth(app);

export { app, db, storage, auth };
