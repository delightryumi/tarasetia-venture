import { readFileSync } from "fs";
import { resolve } from "path";

const envFile = readFileSync(resolve("./apps/admin-dashboard/.env.local"), "utf8");
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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
const hotelDoc = await db.collection("hotels").doc("88888").get();
const apiKey = hotelDoc.data()?.channelManager?.apiKey || envVars.CHANNEX_API_KEY;


async function test() {
    console.log("Using API key:", apiKey ? `${apiKey.slice(0, 8)}...` : "NONE");

    // 1. Get properties
    const pRes = await fetch("https://staging.channex.io/api/v1/properties", {
        headers: { "user-api-key": apiKey }
    });
    const pData = await pRes.json();
    console.log("Properties:", pData.data?.map(p => ({ id: p.id, title: p.attributes?.title })));

    // 2. Get user
    const uRes = await fetch("https://staging.channex.io/api/v1/user", {
        headers: { "user-api-key": apiKey }
    });
    const uData = await uRes.json();
    console.log("User:", uData.data?.id, uData.data?.attributes?.email);

    // 3. Try to create channel directly or see the exact error response
    console.log("\nAttempting create channel test to see raw response from Channex:");
    const testPayload = {
        channel: {
            title: "Booking.com - Test Property - My Tara",
            group_id: "0feecbe3-29a4-4ffc-b9b5-f126da35be19", // let's see what group id
            properties: ["5148a93c-0a4c-4646-813c-eda19117f0ce"],
            channel: "BookingCom",
            settings: {
                hotel_id: "10484818"
            }
        }
    };

    // get property details first to see group_id
    const propDetailsRes = await fetch("https://staging.channex.io/api/v1/properties/5148a93c-0a4c-4646-813c-eda19117f0ce", {
        headers: { "user-api-key": apiKey }
    });
    const propDetails = await propDetailsRes.json();
    const groupId = propDetails.data?.relationships?.group?.data?.id || propDetails.data?.relationships?.groups?.data?.[0]?.id;
    console.log("Resolved Group ID:", groupId);

    // 4. Query by group_id
    const gChanRes = await fetch(`https://staging.channex.io/api/v1/channels?filter[group_id]=${groupId}`, {
        headers: { "user-api-key": apiKey }
    });
    const gChanData = await gChanRes.json();
    console.log("Channels for group count:", gChanData.data?.length);
    if (gChanData.data?.length > 0) {
        console.log("Channels in group:", gChanData.data);
    }

    const testHotelIds = ["6519420", "5868189", "4372137", "11140466", "12152494"];
    console.log("\nTesting channel creation for other test hotel IDs:");
    for (const hid of testHotelIds) {
        const cRes = await fetch("https://staging.channex.io/api/v1/channels", {
            method: "POST",
            headers: { "Content-Type": "application/json", "user-api-key": apiKey },
            body: JSON.stringify({
                channel: {
                    title: `Booking.com - ${hid}`,
                    group_id: groupId,
                    properties: ["5148a93c-0a4c-4646-813c-eda19117f0ce"],
                    channel: "BookingCom",
                    settings: { hotel_id: hid }
                }
            })
        });
        const cData = await cRes.json();
        console.log(`Hotel ID ${hid}: HTTP ${cRes.status}`);
        if (cRes.status === 201 || cRes.status === 200) {
            console.log("SUCCESS! Created Channel ID:", cData.data?.id);
            // Delete it immediately so we don't pollute
            await fetch(`https://staging.channex.io/api/v1/channels/${cData.data?.id}`, {
                method: "DELETE",
                headers: { "user-api-key": apiKey }
            });
            console.log("Deleted test channel:", cData.data?.id);
            break;
        } else {
            console.log("Error details:", JSON.stringify(cData.errors || {}));
        }
    }
}

test().catch(console.error);
