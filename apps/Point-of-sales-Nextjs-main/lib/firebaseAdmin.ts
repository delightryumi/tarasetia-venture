import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

function initFirebaseAdmin() {
  if (getApps().length > 0) return;

  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'crs-nexura';
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'crs-nexura.firebasestorage.app';

  if (privateKey && clientEmail) {
    const formattedKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
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

function getAdminAuth(): Auth {
  initFirebaseAdmin();
  return getAuth();
}

function getAdminDb(): Firestore {
  initFirebaseAdmin();
  const db = getFirestore();
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // Ignore error if settings already applied
  }
  return db;
}

function getAdminStorage(): Storage {
  initFirebaseAdmin();
  return getStorage();
}

export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop, receiver) {
    const instance = getAdminAuth();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop, receiver) {
    const instance = getAdminDb();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

export const adminStorage = new Proxy({} as Storage, {
  get(_target, prop, receiver) {
    const instance = getAdminStorage();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});
