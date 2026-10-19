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

async function checkChannex() {
    const hotelDoc = await db.collection("hotels").doc("88888").get();
    const apiKey = hotelDoc.data()?.channelManager?.apiKey;
    const propId = hotelDoc.data()?.channexPropertyId || "5148a93c-0a4c-4646-813c-eda19117f0ce";

    console.log(`Using API Key from hotel 88888 (length: ${apiKey ? apiKey.length : 0})`);
    console.log(`Target Property ID: ${propId}`);

    console.log("\n1. Checking all bookings in Channex staging...");
    const res = await fetch(`https://staging.channex.io/api/v1/bookings?filter[property_id]=${propId}&limit=20`, {
        headers: { "user-api-key": apiKey }
    });
    const data = await res.json();
    console.log(`Total bookings found for property: ${data?.data?.length || 0}`);
    if (data?.data && data.data.length > 0) {
        for (const b of data.data) {
            const attr = b.attributes || {};
            console.log(`\n- Channex Booking ID: ${b.id}`);
            console.log(`  OTA Ref / Booking.com Ref: ${attr.ota_reservation_code || attr.channel_booking_id || attr.unique_id}`);
            console.log(`  Guest: ${attr.customer?.name || (attr.customer?.first_name + ' ' + attr.customer?.last_name)}`);
            console.log(`  Channel: ${attr.ota_name || attr.channel_name}`);
            console.log(`  Status: ${attr.status}`);
            console.log(`  Dates: ${attr.arrival_date} to ${attr.departure_date}`);
            console.log(`  Inserted At: ${attr.inserted_at}`);
        }
    } else {
        console.log("Bookings response:", JSON.stringify(data));
    }

    // 2. Also check channels attached to property
    console.log("\n2. Checking channels for property in Channex...");
    const chanRes = await fetch(`https://staging.channex.io/api/v1/channels?filter[property_id]=${propId}`, {
        headers: { "user-api-key": apiKey }
    });
    const chanData = await chanRes.json();
    if (chanData?.data) {
        for (const c of chanData.data) {
            console.log(`- Channel ID: ${c.id} | Title: "${c.attributes?.title}" | Channel: ${c.attributes?.channel} | Is Active: ${c.attributes?.is_active} | Hotel ID in OTA: ${c.attributes?.hotel_id || c.attributes?.ota_hotel_id || 'N/A'}`);
        }
    }

    // 3. Check property details
    console.log("\n3. Checking Property details in Channex...");
    const pRes = await fetch(`https://staging.channex.io/api/v1/properties/${propId}`, {
        headers: { "user-api-key": apiKey }
    });
    const pData = await pRes.json();
    console.log("Property Title:", pData?.data?.attributes?.title);
    console.log("Property Settings / Details:", JSON.stringify(pData?.data?.attributes?.settings || {}));
}

checkChannex().catch(console.error);
