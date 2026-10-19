import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// 1. Read .env.local
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

async function audit() {
    console.log("=== STEP 1: AUDIT HOTELS & CHANNEX MAPPING IN FIRESTORE ===");
    const hotelsSnap = await db.collection("hotels").get();
    console.log(`Found ${hotelsSnap.docs.length} hotels in Firestore.`);

    let targetHotelDoc = null;
    for (const doc of hotelsSnap.docs) {
        const data = doc.data();
        console.log(`\nHotel ID: [${doc.id}] - Name: "${data.name || data.propertyName || '-'}"`);
        console.log(`- channexPropertyId: ${data.channexPropertyId || data.channelManager?.channexPropertyId || data.channelManager?.propertyId || 'NOT SET'}`);
        console.log(`- channelManager.apiKey: ${data.channelManager?.apiKey ? 'Configured (hidden)' : 'NOT SET'}`);
        console.log(`- emailNotification:`, JSON.stringify(data.emailNotification || {}));
        console.log(`- whatsappNotification:`, JSON.stringify(data.whatsappNotification || {}));

        if (doc.id === "88888" || data.name?.toLowerCase()?.includes("test property") || data.propertyId === "88888") {
            targetHotelDoc = doc;
        }
    }

    // Inspect target hotel room types
    if (targetHotelDoc) {
        console.log(`\n=== STEP 2: AUDIT ROOM TYPES FOR [${targetHotelDoc.id}] ===`);
        const roomTypesSnap = await db.collection(`hotels/${targetHotelDoc.id}/roomTypes`).get();
        console.log(`Found ${roomTypesSnap.docs.length} room types.`);
        for (const rt of roomTypesSnap.docs) {
            const rData = rt.data();
            console.log(`- RoomType [${rt.id}] "${rData.name}": channexRoomTypeId = ${rData.channexRoomTypeId || rData.channelManagerRoomId || 'NONE'}`);
        }

        // Check recent bookings in daily_revenue
        console.log(`\n=== STEP 3: CHECK RECENT BOOKINGS IN [${targetHotelDoc.id}] ===`);
        const revSnap = await db.collection(`hotels/${targetHotelDoc.id}/daily_revenue`).limit(15).get();
        let foundBookings = [];
        for (const revDoc of revSnap.docs) {
            const entries = revDoc.data()?.entries || [];
            for (const e of entries) {
                foundBookings.push({
                    date: revDoc.id,
                    bookingId: e.bookingId,
                    guestName: e.guestName,
                    status: e.status,
                    channel: e.channel,
                    checkIn: e.checkInDate,
                    checkOut: e.checkOutDate
                });
            }
        }
        console.log(`Found ${foundBookings.length} total entries in daily_revenue.`);
        console.log("Matching booking 5373120147 or recent entries:", foundBookings.filter(b => String(b.bookingId).includes("5373120147") || String(b.bookingId).includes("5474479145")));
    }

    // STEP 4: CHECK CHANNEX API
    const channexApiKey = envVars.CHANNEX_API_KEY || targetHotelDoc?.data()?.channelManager?.apiKey;
    console.log(`\n=== STEP 4: CHECK CHANNEX STAGING API ===`);
    console.log(`API Key present: ${!!channexApiKey}`);

    if (channexApiKey) {
        try {
            // Check properties
            const propRes = await fetch("https://staging.channex.io/api/v1/properties", {
                headers: { "user-api-key": channexApiKey }
            });
            const propData = await propRes.json();
            console.log("\nChannex Properties under this API key:");
            if (propData?.data) {
                for (const p of propData.data) {
                    console.log(`- Property ID: ${p.id} | Name: "${p.attributes?.title}" | Currency: ${p.attributes?.currency}`);
                }
            } else {
                console.log("Properties response:", JSON.stringify(propData));
            }

            // Check webhook endpoints configured in Channex
            const whRes = await fetch("https://staging.channex.io/api/v1/webhooks", {
                headers: { "user-api-key": channexApiKey }
            });
            const whData = await whRes.json();
            console.log("\nChannex Webhooks configured:");
            if (whData?.data) {
                for (const w of whData.data) {
                    console.log(`- Webhook ID: ${w.id} | URL: ${w.attributes?.callback_url} | Active: ${w.attributes?.is_active} | Events: ${JSON.stringify(w.attributes?.event_mask)}`);
                }
            } else {
                console.log("Webhooks response:", JSON.stringify(whData));
            }

            // Check booking revision feed (unacknowledged bookings)
            const feedRes = await fetch("https://staging.channex.io/api/v1/booking_revisions/feed", {
                headers: { "user-api-key": channexApiKey }
            });
            const feedData = await feedRes.json();
            console.log("\nChannex Booking Revision Feed (Unacknowledged queue):");
            console.log(`Feed count: ${feedData?.data?.length || 0}`);
            if (feedData?.data && feedData.data.length > 0) {
                for (const rev of feedData.data) {
                    const b = rev.attributes || {};
                    console.log(`- Revision ID: ${rev.id} | Booking ID: ${b.booking_id || b.ota_reservation_code || b.channel_booking_id} | Channel: ${b.ota_name || b.channel_name} | Guest: ${b.customer?.name} | Property: ${b.property_id}`);
                }
            }
        } catch (apiErr) {
            console.error("Channex API error:", apiErr.message);
        }
    }
}

audit().catch(console.error);
