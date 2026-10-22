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
    console.log("=== 1. AUDIT HOTEL CONFIGURATION IN FIRESTORE ===");
    const hotelsSnap = await db.collection("hotels").get();
    console.log(`Found ${hotelsSnap.docs.length} hotels:`);
    let activeApiKey = null;
    let channexPropId = null;

    for (const doc of hotelsSnap.docs) {
        const d = doc.data();
        const cm = d.channelManager || {};
        console.log(`- Hotel ID: [${doc.id}]`);
        console.log(`  Name: ${d.name || d.propertyName}`);
        console.log(`  channexPropertyId: ${d.channexPropertyId || cm.channexPropertyId || "NOT_SET"}`);
        console.log(`  hasApiKey: ${Boolean(cm.apiKey)} (env: ${cm.environment || cm.env || "staging"})`);
        console.log(`  Owner Email: ${d.email || d.ownerEmail || "NOT_SET"}`);
        console.log(`  Owner WhatsApp: ${d.phone || d.ownerPhone || d.whatsappNumber || "NOT_SET"}`);

        if (cm.apiKey && !activeApiKey) activeApiKey = cm.apiKey;
        if ((d.channexPropertyId || cm.channexPropertyId) && !channexPropId) {
            channexPropId = d.channexPropertyId || cm.channexPropertyId;
        }
    }

    console.log("\n=== 2. AUDIT CHANNEX TASK LOGS (RECENT 10 LOGS) ===");
    for (const doc of hotelsSnap.docs) {
        const logsSnap = await db.collection(`hotels/${doc.id}/channex_task_logs`)
            .orderBy("inserted_at", "desc")
            .limit(5)
            .get();
        if (!logsSnap.empty) {
            console.log(`Logs for Hotel [${doc.id}]:`);
            logsSnap.docs.forEach(l => {
                const ld = l.data();
                console.log(`  [${ld.inserted_at}] Status: ${ld.status} | Task: ${ld.task_type} | Message: ${ld.message}`);
            });
        }
    }

    console.log("\n=== 3. SEARCH BOOKING ABB-1234 IN DAILY_REVENUE ===");
    let foundInDb = false;
    for (const doc of hotelsSnap.docs) {
        const revSnap = await db.collection(`hotels/${doc.id}/daily_revenue`).get();
        for (const rDoc of revSnap.docs) {
            const entries = rDoc.data()?.entries || [];
            const match = entries.find(e => 
                e.bookingId === "ABB-1234" || 
                e.reservationId === "ABB-1234" ||
                e.otaReservationId === "ABB-1234" ||
                e.channexBookingId === "ABB-1234" ||
                e.revisionId === "1951201d-5cf5-47e5-96c0-54c4475af6b6" ||
                (e.guestName && e.guestName.toLowerCase().includes("nexura"))
            );
            if (match) {
                console.log(`✅ FOUND booking ABB-1234 in Hotel [${doc.id}], doc [${rDoc.id}]!`);
                console.log("  Entry:", JSON.stringify(match, null, 2));
                foundInDb = true;
            }
        }
    }
    if (!foundInDb) {
        console.log("❌ Booking ABB-1234 NOT found in any hotel's daily_revenue collection.");
    }

    console.log("\n=== 4. FETCH REVISION 1951201d-5cf5-47e5-96c0-54c4475af6b6 FROM CHANNEX ===");
    if (activeApiKey) {
        try {
            const revRes = await fetch("https://staging.channex.io/api/v1/booking_revisions/1951201d-5cf5-47e5-96c0-54c4475af6b6", {
                headers: { "user-api-key": activeApiKey }
            });
            const revData = await revRes.json();
            console.log("Channex Revision Response Status:", revRes.status);
            console.log("Channex Revision Data:", JSON.stringify(revData, null, 2));
        } catch (err) {
            console.error("Error fetching revision from Channex:", err.message);
        }
    } else {
        console.log("No API key available to query Channex API.");
    }
}

runAudit().catch(console.error);
