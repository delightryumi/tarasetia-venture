import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (privateKey && clientEmail && projectId) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
      console.log("Firebase Admin SDK initialized successfully via Service Account.");
    } else {
      // Fallback to Application Default Credentials (for Google App Hosting / Cloud Run)
      admin.initializeApp();
      console.log("Firebase Admin SDK initialized successfully via Application Default Credentials.");
    }
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
