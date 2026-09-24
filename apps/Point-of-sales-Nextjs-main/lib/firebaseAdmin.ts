import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage, Storage } from 'firebase-admin/storage';

function initFirebaseAdmin() {
  if (getApps().length > 0) return;

  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "crs-nexura";
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "crs-nexura.firebasestorage.app";

  if (privateKey && clientEmail) {
    const formattedKey = privateKey.replace(/^"|"$/g, "").replace(/\\n/g, '\n');
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedKey,
      }),
      storageBucket,
    });
  } else {
    // When running in Google Cloud or build environments without explicit service account keys,
    // initialize using Application Default Credentials
    initializeApp({
      projectId,
      storageBucket,
    });
  }
}

function getAdminStorage(): Storage {
  initFirebaseAdmin();
  return getStorage();
}

export const adminStorage = new Proxy({} as Storage, {
  get(target, prop, receiver) {
    const instance = getAdminStorage();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});
