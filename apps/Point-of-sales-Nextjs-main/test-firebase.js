const fs = require('fs');
const dotenvStr = fs.readFileSync('.env', 'utf8');
const env = {};
dotenvStr.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) env[key.trim()] = val.trim().replace(/^"|"$/g, '');
});

const { initializeApp, getApps, cert } = require('firebase-admin/app');
try {
    const formattedKey = env.FIREBASE_PRIVATE_KEY.replace(/^"|"$/g, "").replace(/\\n/g, '\n');
    initializeApp({
        credential: cert({
            projectId: env.FIREBASE_PROJECT_ID,
            clientEmail: env.FIREBASE_CLIENT_EMAIL,
            privateKey: formattedKey
        })
    });
    console.log("Firebase Admin initialized successfully.");
} catch(e) {
    console.error("Firebase Admin initialization failed:", e.message);
}
