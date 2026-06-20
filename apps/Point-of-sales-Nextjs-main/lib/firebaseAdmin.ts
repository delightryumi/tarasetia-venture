import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

if (getApps().length === 0) {
    let credential;
    
    if (process.env.FIREBASE_PRIVATE_KEY) {
        const formattedKey = process.env.FIREBASE_PRIVATE_KEY.replace(/^"|"$/g, "").replace(/\\n/g, '\n');
        credential = cert({
            projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: formattedKey
        });
    }

    initializeApp({
        credential,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "crs-nexura.firebasestorage.app"
    });
}

export const adminStorage = getStorage();
