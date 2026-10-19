import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const envFile = readFileSync(resolve("./apps/admin-dashboard/.env.local"), "utf8");
const envVars = {};
for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        envVars[key] = val;
    }
}

if (!getApps().length) {
    const privateKey = envVars.FIREBASE_PRIVATE_KEY
        ? envVars.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
        : undefined;

    initializeApp({
        credential: cert({
            projectId: envVars.FIREBASE_PROJECT_ID,
            clientEmail: envVars.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        }),
    });
}

const db = getFirestore();

async function checkAllChannels() {
    const hotelDoc = await db.collection("hotels").doc("88888").get();
    const apiKey = hotelDoc.data()?.channelManager?.apiKey;

    console.log("Checking ALL channels across the account in Channex staging...");
    const chanRes = await fetch("https://staging.channex.io/api/v1/channels", {
        headers: { "user-api-key": apiKey }
    });
    const chanData = await chanRes.json();
    console.log("Channels count:", chanData?.data?.length || 0);
    if (chanData?.data) {
        for (const c of chanData.data) {
            console.log(`- ID: ${c.id}`);
            console.log(`  Title: ${c.attributes?.title}`);
            console.log(`  Channel: ${c.attributes?.channel}`);
            console.log(`  Property ID: ${c.attributes?.property_id}`);
            console.log(`  Active: ${c.attributes?.is_active}`);
            console.log(`  State: ${c.attributes?.state}`);
        }
    }
}

checkAllChannels().catch(console.error);
