import * as admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const initFirebaseAdmin = () => {
  if (admin.getApps().length > 0) {
    return;
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!privateKey || !clientEmail || !projectId) {
    throw new Error("Kredensial Firebase Admin SDK belum lengkap. Silakan tambahkan FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, dan FIREBASE_PROJECT_ID di file .env.local Anda untuk mengaktifkan fitur ini.");
  }

  try {
    const formattedKey = privateKey.replace(/^"|"$/g, "").replace(/\\n/g, "\n");
    admin.initializeApp({
      credential: admin.cert({
        projectId,
        clientEmail,
        privateKey: formattedKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log("Firebase Admin SDK initialized successfully via Service Account.");
  } catch (error: any) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    throw new Error(`Gagal menginisialisasi Firebase Admin SDK: ${error.message}`);
  }
};

const getAdminAuth = () => {
  initFirebaseAdmin();
  return getAuth();
};

const getAdminDb = () => {
  initFirebaseAdmin();
  return getFirestore();
};

export const adminAuth = new Proxy({} as admin.auth.Auth, {
  get(target, prop, receiver) {
    const instance = getAdminAuth();
    const value = Reflect.get(instance, prop);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  }
});

export const adminDb = new Proxy({} as admin.firestore.Firestore, {
  get(target, prop, receiver) {
    const instance = getAdminDb();
    const value = Reflect.get(instance, prop);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  }
});
