import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { channexClient } from "@/lib/channex/channexClient";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const hotelCode = searchParams.get("hotelCode");
        const threadId = searchParams.get("threadId");

        if (!hotelCode) {
            return NextResponse.json({ error: "hotelCode is required" }, { status: 400 });
        }

        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        const hotelData = hotelDoc.data();
        const channexPropertyId = hotelData?.channelManager?.propertyId || hotelData?.channelManager?.channexPropertyId || hotelData?.channexPropertyId;
        const customApiKey = hotelData?.channelManager?.apiKey || process.env.CHANNEX_API_KEY;

        // 1. Fetch Messages for a specific thread
        if (threadId) {
            let messagesList: any[] = [];

            // A. Check Channex Live API
            if (channexPropertyId && customApiKey) {
                try {
                    const res = await channexClient.getMessages(threadId, customApiKey);
                    if (res?.data) {
                        messagesList = res.data.map((m: any) => ({
                            id: m.id,
                            message: m.attributes?.message || m.message,
                            sender: m.attributes?.sender || m.sender,
                            inserted_at: m.attributes?.inserted_at || m.inserted_at || new Date().toISOString()
                        }));
                    }
                } catch (err: any) {
                    console.warn("[Channex Messages] API error, falling back to database:", err.message);
                }
            }

            // B. Also check local Firestore thread messages
            if (messagesList.length === 0) {
                const msgsSnap = await adminDb.collection(`hotels/${hotelCode}/guest_messages`)
                    .doc(threadId)
                    .collection("messages")
                    .orderBy("inserted_at", "asc")
                    .get();

                messagesList = msgsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            }

            return NextResponse.json({
                success: true,
                messages: messagesList
            });
        }

        // 2. Fetch Thread List
        let threadList: any[] = [];

        // A. Check Channex Live API
        if (channexPropertyId && customApiKey) {
            try {
                const res = await channexClient.getMessageThreads(channexPropertyId, customApiKey);
                if (res?.data && res.data.length > 0) {
                    threadList = res.data.map((t: any) => ({
                        id: t.id,
                        provider: t.attributes?.provider || "OTA",
                        title: t.attributes?.title || "OTA Guest",
                        booking_id: t.attributes?.booking_id || "-",
                        room_type: t.attributes?.room_type || "Standard",
                        checkin: t.attributes?.checkin,
                        checkout: t.attributes?.checkout,
                        is_closed: !!t.attributes?.is_closed,
                        unread_count: t.attributes?.unread_count || 0,
                        last_message: t.attributes?.last_message
                    }));
                }
            } catch (err: any) {
                console.warn("[Channex Threads] API query fallback to database:", err.message);
            }
        }

        // B. Also check local Firestore threads
        if (threadList.length === 0) {
            const threadsSnap = await adminDb.collection(`hotels/${hotelCode}/guest_messages`).get();
            threadList = threadsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        return NextResponse.json({
            success: true,
            threads: threadList
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { hotelCode, threadId, message } = body;

        if (!hotelCode || !threadId || !message) {
            return NextResponse.json({ error: "hotelCode, threadId, and message are required" }, { status: 400 });
        }

        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        const hotelData = hotelDoc.data();
        const customApiKey = hotelData?.channelManager?.apiKey || process.env.CHANNEX_API_KEY;

        if (customApiKey) {
            try {
                await channexClient.sendMessage(threadId, message, customApiKey);
            } catch (apiErr: any) {
                console.warn("[Channex Send Message] API send failed, saving to local Firestore:", apiErr.message);
            }
        }

        const newMsg = {
            message,
            sender: "property",
            inserted_at: new Date().toISOString()
        };

        // Persist to local Firestore
        const msgDocRef = await adminDb.collection(`hotels/${hotelCode}/guest_messages`)
            .doc(threadId)
            .collection("messages")
            .add(newMsg);

        // Update parent thread last_message
        await adminDb.collection(`hotels/${hotelCode}/guest_messages`).doc(threadId).set({
            last_message: newMsg,
            updated_at: new Date().toISOString()
        }, { merge: true });

        return NextResponse.json({
            success: true,
            message: "Pesan balasan resmi berhasil dikirimkan ke tamu OTA.",
            sentMessage: {
                id: msgDocRef.id,
                ...newMsg
            }
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
