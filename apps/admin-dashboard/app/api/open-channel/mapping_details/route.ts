import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * Channex Open Channel - Mapping Details Endpoint
 * Method: GET
 * URL: /api/open-channel/mapping_details/?hotel_code={HOTEL_CODE}
 * 
 * Exposes active room types and rate plans from My Tara PMS so the user
 * can map them inside the Channex Channels UI.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const hotelCode = searchParams.get("hotel_code") || searchParams.get("hotelCode") || "1";

        console.log(`[OpenChannel:MappingDetails] Fetching mapping details for hotel_code: ${hotelCode}`);

        // Fetch room types from Firestore
        const roomTypesSnap = await adminDb.collection(`hotels/${hotelCode}/roomTypes`).get();
        const ratePlansSnap = await adminDb.collection(`hotels/${hotelCode}/ratePlans`).get();

        const firestoreRoomTypes = roomTypesSnap.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as any)
        }));

        const firestoreRatePlans = ratePlansSnap.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as any)
        }));

        // Format according to Channex Open Channel specification
        let roomTypes: any[] = [];

        if (firestoreRoomTypes.length > 0) {
            roomTypes = firestoreRoomTypes.map(rt => {
                const rtId = rt.channexRoomTypeId || rt.id;
                const rtTitle = rt.name || rt.title || "Standard Room";
                const maxPersons = Number(rt.capacity || rt.maxOccupancy || rt.max_persons || 2);

                // Find associated rate plans or attach all available rate plans
                let associatedRatePlans = firestoreRatePlans.filter(
                    rp => rp.roomTypeId === rt.id || rp.channexRoomTypeId === rtId || !rp.roomTypeId
                );

                if (associatedRatePlans.length === 0) {
                    // Fallback to standard Room Only rate plan
                    associatedRatePlans = [
                        {
                            id: rt.defaultRatePlanId || `rp_ro_${rt.id}`,
                            title: `${rtTitle} - Room Only`,
                            sell_mode: "per_room",
                            max_persons: maxPersons,
                            currency: "IDR",
                            read_only: false
                        }
                    ];
                }

                return {
                    id: rtId,
                    title: rtTitle,
                    rate_plans: associatedRatePlans.map(rp => ({
                        id: rp.channexRatePlanId || rp.id,
                        title: rp.name || rp.title || `${rtTitle} - Rate Plan`,
                        sell_mode: rp.sell_mode || "per_room",
                        max_persons: Number(rp.max_persons || maxPersons || 2),
                        currency: rp.currency || "IDR",
                        read_only: false
                    }))
                };
            });
        } else {
            // Default fallback for Hotel 1 (Setara Demo Partner) matching Channex Staging
            roomTypes = [
                {
                    id: "67c181f0-fb62-45e7-aef4-97e1af0c04d6",
                    title: "Deluxe Cottage",
                    rate_plans: [
                        {
                            id: "b85b7f20-290a-4b24-b4d7-8f3fb13b91af",
                            title: "Deluxe Cottage - Room Only",
                            sell_mode: "per_room",
                            max_persons: 2,
                            currency: "IDR",
                            read_only: false
                        },
                        {
                            id: "aaec5df5-ad9f-42ab-9618-fb3983d9679e",
                            title: "Deluxe Cottage - With Breakfast",
                            sell_mode: "per_room",
                            max_persons: 2,
                            currency: "IDR",
                            read_only: false
                        }
                    ]
                }
            ];
        }

        const responsePayload = {
            data: {
                type: "mapping_details",
                attributes: {
                    room_types: roomTypes
                }
            }
        };

        return NextResponse.json(responsePayload, { status: 200 });
    } catch (err: any) {
        console.error("[OpenChannel:MappingDetails] Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
