import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// 1. Load env
import { existsSync } from "fs";
const envPath = existsSync(resolve("./.env.local")) ? resolve("./.env.local") : resolve("./apps/admin-dashboard/.env.local");
const envFile = readFileSync(envPath, "utf8");
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
    console.log("=================================================");
    console.log("🔍 AUDIT STOP SELL & CHANNEX INTEGRATION HOTEL 88888");
    console.log("=================================================");

    const hotelCode = "88888";
    const hotelDoc = await db.collection("hotels").doc(hotelCode).get();
    if (!hotelDoc.exists) {
        console.error(`❌ Hotel [${hotelCode}] NOT FOUND in Firestore!`);
        return;
    }

    const hData = hotelDoc.data();
    const channexPropertyId = hData.channexPropertyId || hData.channelManager?.channexPropertyId || hData.channelManager?.propertyId;
    const apiKey = hData.channelManager?.apiKey || envVars.CHANNEX_API_KEY;
    const env = hData.channelManager?.env || hData.channelManager?.environment || envVars.CHANNEX_ENV || "staging";

    console.log(`\n1. HOTEL DETAILS:`);
    console.log(`- Hotel Name: ${hData.name || hData.propertyName}`);
    console.log(`- channexPropertyId: ${channexPropertyId}`);
    console.log(`- API Key: ${apiKey ? `${apiKey.slice(0, 10)}... (length: ${apiKey.length})` : "MISSING"}`);
    console.log(`- Environment: ${env}`);
    console.log(`- raw channelManager:`, JSON.stringify(hData.channelManager || {}));

    console.log(`\n2. ROOM TYPES MAPPING (Firestore):`);
    const roomTypesSnap = await db.collection(`hotels/${hotelCode}/roomTypes`).get();
    const roomTypes = [];
    roomTypesSnap.forEach(d => {
        const r = d.data();
        roomTypes.push({ id: d.id, name: r.name, channexRoomTypeId: r.channexRoomTypeId || r.channelManagerRoomId || "NOT MAPPED" });
        console.log(`  - [${d.id}] "${r.name}" -> channexRoomTypeId: ${r.channexRoomTypeId || r.channelManagerRoomId || "❌ NOT MAPPED"}`);
    });

    console.log(`\n3. RATE PLANS MAPPING (Firestore):`);
    const ratePlansSnap = await db.collection(`hotels/${hotelCode}/ratePlans`).get();
    const ratePlans = [];
    ratePlansSnap.forEach(d => {
        const rp = d.data();
        ratePlans.push({
            id: d.id,
            name: rp.name,
            stopSell: rp.stopSell,
            channexRatePlanId: rp.channexRatePlanId || "NOT MAPPED",
            channexRatePlanIds: rp.channexRatePlanIds || {}
        });
        console.log(`  - [${d.id}] "${rp.name}" (Base stopSell: ${rp.stopSell}) -> channexRatePlanId: ${rp.channexRatePlanId || "❌ NOT MAPPED"}`);
        if (rp.channexRatePlanIds && Object.keys(rp.channexRatePlanIds).length > 0) {
            console.log(`    Per-room mapping:`, JSON.stringify(rp.channexRatePlanIds));
        }
    });

    console.log(`\n4. TODAY'S ARI OVERRIDES (Date: 2026-10-19 in Firestore):`);
    const todayDoc = await db.collection(`hotels/${hotelCode}/ari_overrides`).doc(`${hotelCode}_2026-10-19`).get();
    if (todayDoc.exists) {
        console.log("  Document exists! Content:");
        const d = todayDoc.data();
        console.log("  - stopSell:", JSON.stringify(d.stopSell || {}));
        console.log("  - roomStopSell:", JSON.stringify(d.roomStopSell || {}));
        console.log("  - inventoryOverrides:", JSON.stringify(d.inventoryOverrides || {}));
        console.log("  - rates:", JSON.stringify(d.rates || {}));
    } else {
        console.log("  ⚠️  Document hotels/88888/ari_overrides/88888_2026-10-19 does NOT exist in Firestore!");
    }

    const allOverrides = await db.collection(`hotels/${hotelCode}/ari_overrides`).limit(10).get();
    console.log(`  Total ari_overrides documents found in database: ${allOverrides.docs.length}`);
    allOverrides.forEach(doc => {
        console.log(`  - Doc ID: ${doc.id} -> date: ${doc.data().date}`);
    });

    console.log(`\n5. RECENT CHANNEX TASK LOGS (Last 5):`);
    const logsSnap = await db.collection(`hotels/${hotelCode}/channex_task_logs`)
        .orderBy("inserted_at", "desc")
        .limit(5)
        .get();
    
    if (logsSnap.empty) {
        console.log("  No task logs found in hotels/88888/channex_task_logs.");
    } else {
        logsSnap.forEach(l => {
            const ld = l.data();
            console.log(`  - [${ld.inserted_at}] Status: ${ld.status || ld.result} | Action: ${ld.action || ld.task_type} | Message: ${ld.message || '-'}`);
            if (ld.task_id) console.log(`    TaskId: ${ld.task_id}`);
        });
    }

    if (apiKey && channexPropertyId) {
        const baseUrl = env === "production" ? "https://api.channex.io" : "https://staging.channex.io";
        console.log(`\n6. CHANNEX API AUDIT (${baseUrl}):`);

        // Check Rate plans in Channex
        try {
            const rpRes = await fetch(`${baseUrl}/api/v1/rate_plans?filter[property_id]=${channexPropertyId}`, {
                headers: { "user-api-key": apiKey }
            });
            const rpData = await rpRes.json();
            console.log(`  Channex Rate Plans found: ${rpData?.data?.length || 0}`);
            if (rpData?.data) {
                for (const item of rpData.data) {
                    console.log(`  - Channex RP ID: [${item.id}] | Title: "${item.attributes?.title}" | RoomType: [${item.attributes?.room_type_id}]`);
                }
            }
        } catch (err) {
            console.error("  Error querying Channex rate plans:", err.message);
        }

        // Check the exact booking revision from Channex API
        let fullRevData = null;
        try {
            console.log(`\n  Fetching Channex Revision d63e58bd-8edd-481f-a2db-cd1d0ce27d47...`);
            const revRes = await fetch(`${baseUrl}/api/v1/booking_revisions/d63e58bd-8edd-481f-a2db-cd1d0ce27d47`, {
                headers: { "user-api-key": apiKey }
            });
            const revData = await revRes.json();
            console.log(`  Revision status: ${revRes.status}`);
            const attrs = revData?.data?.attributes || {};
            fullRevData = attrs;
            console.log(`  - Property ID in Channex: ${attrs.property_id}`);
            console.log(`  - Unique ID: ${attrs.unique_id || attrs.ota_reservation_code}`);
            console.log(`  - Status: ${attrs.status}`);
            console.log(`  - Rooms count: ${attrs.rooms?.length || 0}`);
            console.log(`  - Rooms details:`, JSON.stringify(attrs.rooms || []));
            console.log(`  - Arrival: ${attrs.arrival_date}, Departure: ${attrs.departure_date}`);
        } catch (err) {
            console.error("  Error fetching revision:", err.message);
        }

        console.log(`\n  Checking task logs across all hotels...`);
        const allHotelsSnap = await db.collection("hotels").get();
        for (const hDoc of allHotelsSnap.docs) {
            const tLogs = await db.collection(`hotels/${hDoc.id}/channex_task_logs`).orderBy("inserted_at", "desc").limit(3).get();
            tLogs.forEach(l => {
                console.log(`  Hotel [${hDoc.id}] log: ${l.data().inserted_at} | ${l.data().action || l.data().task_type} | ${l.data().message}`);
            });
        }

        // 7. Check Booking in daily_revenue
        console.log(`\n7. CHECKING BOOKINGS IN FIRESTORE:`);
        const todayRevDoc = await db.collection(`hotels/${hotelCode}/daily_revenue`).doc(`${hotelCode}_2026-10-19`).get();
        if (todayRevDoc.exists) {
            console.log(`  hotels/88888/daily_revenue/88888_2026-10-19 exists! Entries count: ${todayRevDoc.data()?.entries?.length || 0}`);
            const entries = todayRevDoc.data()?.entries || [];
            entries.forEach(e => {
                console.log(`  - Entry: Guest: "${e.guestName}" | BookingId: ${e.bookingId} | Status: ${e.status} | OTA: ${e.channel}`);
            });
        } else {
            console.log(`  hotels/88888/daily_revenue/88888_2026-10-19 does NOT exist!`);
        }

        // Search across ALL hotels in Firestore for BDC-TEST-BOOKING-01
        console.log(`\n  Searching for BDC-TEST-BOOKING-01 across ALL hotels in Firestore...`);
        for (const hDoc of allHotelsSnap.docs) {
            const hData = hDoc.data();
            console.log(`  Hotel [${hDoc.id}] "${hData.name}" -> channexPropertyId: ${hData.channexPropertyId || hData.channelManager?.channexPropertyId || 'NONE'}`);
            const drSnap = await db.collection(`hotels/${hDoc.id}/daily_revenue`).get();
            drSnap.forEach(snap => {
                const ents = snap.data()?.entries || [];
                ents.forEach(e => {
                    if (JSON.stringify(e).includes("BDC-TEST-BOOKING-01") || JSON.stringify(e).includes("Deki Agnesia")) {
                        console.log(`  🎯 FOUND in HOTEL [${hDoc.id}] (${hDoc.data().name}) doc [${snap.id}]!`);
                        console.log(`     Entry details:`, JSON.stringify(e, null, 2));
                    }
                });
            });
        }
    }
}

runAudit().catch(console.error);
