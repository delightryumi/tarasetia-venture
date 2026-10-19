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

async function runAudit() {
    console.log("=== 1. CHECK FIRESTORE HOTEL 88888 ===");
    const hotelDoc = await db.collection("hotels").doc("88888").get();
    if (!hotelDoc.exists) {
        console.error("Hotel 88888 not found in Firestore!");
        return;
    }

    const hotelData = hotelDoc.data();
    const cm = hotelData.channelManager || {};
    const bookingComConfig = cm.channels?.booking_com || {};
    const apiKey = cm.apiKey || envVars.CHANNEX_API_KEY;
    const propId = hotelData.channexPropertyId || cm.channexPropertyId || cm.propertyId;

    console.log("Hotel Name:", hotelData.name);
    console.log("Channex Property ID:", propId);
    console.log("API Key present:", !!apiKey);
    console.log("Booking.com in Firestore:");
    console.log("- channexChannelId:", bookingComConfig.channexChannelId);
    console.log("- hotelId:", bookingComConfig.hotelId);
    console.log("- isActive:", bookingComConfig.isActive);
    console.log("- channexStatus:", bookingComConfig.channexStatus);
    console.log("- channexSyncNote:", bookingComConfig.channexSyncNote);
    console.log("- roomMappings:", JSON.stringify(bookingComConfig.roomMappings || {}));
    console.log("- rateMappings:", JSON.stringify(bookingComConfig.rateMappings || {}));

    console.log("\n=== 2. CHECK LOCAL ROOM TYPES & RATE PLANS ===");
    const rtSnap = await db.collection("hotels/88888/roomTypes").get();
    for (const d of rtSnap.docs) {
        const data = d.data();
        console.log(`- RoomType [${d.id}] "${data.name}": channexRoomTypeId = ${data.channexRoomTypeId || 'NONE'}`);
    }

    const rpSnap = await db.collection("hotels/88888/ratePlans").get();
    for (const d of rpSnap.docs) {
        const data = d.data();
        console.log(`- RatePlan [${d.id}] "${data.name}": channexRatePlanId = ${data.channexRatePlanId || 'NONE'}, channexRatePlanIds = ${JSON.stringify(data.channexRatePlanIds || {})}`);
    }

    if (!apiKey) {
        console.error("No Channex API key available!");
        return;
    }

    const targetChannelId = bookingComConfig.channexChannelId || "ac225c3d-b1d6-4fa6-8800-1636b71f1e40";
    console.log(`\n=== 3. QUERY CHANNEX STAGING DIRECT CHANNEL [${targetChannelId}] ===`);
    try {
        const cRes = await fetch(`https://staging.channex.io/api/v1/channels/${targetChannelId}`, {
            headers: { "user-api-key": apiKey }
        });
        const cData = await cRes.json();
        console.log(`HTTP ${cRes.status}`);
        if (cData.data) {
            console.log("Channel Title:", cData.data.attributes?.title);
            console.log("Channel Code/Type:", cData.data.attributes?.channel);
            console.log("Is Active:", cData.data.attributes?.is_active);
            console.log("State:", cData.data.attributes?.state);
            console.log("Properties (attributes):", cData.data.attributes?.properties);
            console.log("Properties (relationships):", JSON.stringify(cData.data.relationships?.properties?.data || []));
            console.log("Settings:", JSON.stringify(cData.data.attributes?.settings || {}));
            console.log("Rate Plans Count:", (cData.data.attributes?.rate_plans || []).length);
            console.log("Rate Plans Content:", JSON.stringify(cData.data.attributes?.rate_plans || []));
        } else {
            console.log("Response body:", JSON.stringify(cData));
        }
    } catch (err) {
        console.error("Failed to query channel:", err.message);
    }

    console.log(`\n=== 4. QUERY CHANNEX CHANNELS FOR PROPERTY [${propId}] ===`);
    try {
        const pRes = await fetch(`https://staging.channex.io/api/v1/channels?filter[property_id]=${propId}`, {
            headers: { "user-api-key": apiKey }
        });
        const pData = await pRes.json();
        console.log("Channels for Property count:", pData.data?.length || 0);
        for (const c of (pData.data || [])) {
            console.log(`- Channel ID: ${c.id}, Title: ${c.attributes?.title}, Active: ${c.attributes?.is_active}`);
        }
    } catch (err) {
        console.error("Failed to query property channels:", err.message);
    }
}

runAudit().catch(console.error);
