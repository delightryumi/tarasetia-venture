import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { ChannexClient } from "@/lib/channex/channexClient";

const channex = new ChannexClient();

/**
 * API Route: /api/channex/groups
 * Live Channex Multi-Property & Hotel Groups Hub for Tara Channel Manager
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        let apiKey = searchParams.get("apiKey") || "";
        let env = (searchParams.get("env") as "staging" | "production") || "staging";
        const hotelCode = searchParams.get("hotelCode") || "";

        // 1. Fetch all hotels from Firestore
        const hotelsSnap = await getDocs(collection(db, "hotels"));
        const localHotels: any[] = [];
        let foundApiKey = "";
        let foundEnv: "staging" | "production" = "staging";

        hotelsSnap.forEach((d) => {
            const data = d.data();
            const cm = data.channelManager || {};
            const key = cm.apiKey || data.channexApiKey || data.apiKey || "";
            if (key && !foundApiKey) {
                foundApiKey = key;
                foundEnv = cm.env || data.channexEnvironment || "staging";
            }
            if (hotelCode && d.id === hotelCode && key) {
                apiKey = key;
                foundEnv = cm.env || "staging";
            }

            localHotels.push({
                hotelCode: d.id,
                name: data.name || d.id,
                city: data.city || data.location || "-",
                groupId: data.groupId || "",
                groupName: data.groupName || "",
                channexPropertyId: data.channexPropertyId || cm.channexPropertyId || cm.propertyId || "",
                channexEnvironment: data.channexEnvironment || cm.env || "staging",
                totalRooms: data.totalRooms || 0,
                status: data.status || "active",
            });
        });

        // Use found API key if not supplied in query
        if (!apiKey) {
            apiKey = foundApiKey || process.env.CHANNEX_API_KEY || "";
            env = foundEnv;
        }

        // 2. Fetch local groups from Firestore
        const groupsSnap = await getDocs(collection(db, "hotel_groups"));
        const localGroups: any[] = [];
        groupsSnap.forEach((d) => {
            localGroups.push({ id: d.id, ...d.data() });
        });

        // 3. Fetch live Groups & Properties from Channex API if API key exists
        let channexGroups: any[] = [];
        let channexProperties: any[] = [];

        if (apiKey) {
            try {
                const cxGroupsRes = await channex.getGroups(apiKey, env);
                if (cxGroupsRes && Array.isArray(cxGroupsRes.data)) {
                    channexGroups = cxGroupsRes.data.map((g: any) => ({
                        id: g.id,
                        title: g.attributes?.title || g.title || "Unnamed Group",
                        created_at: g.attributes?.created_at,
                    }));
                }
            } catch (err: any) {
                console.warn("[Channex Groups API Warning]:", err.message);
            }

            try {
                const cxPropsRes = await channex.getProperties(apiKey, env);
                if (cxPropsRes && Array.isArray(cxPropsRes.data)) {
                    channexProperties = cxPropsRes.data.map((p: any) => ({
                        id: p.id,
                        title: p.attributes?.title || p.title || "Unnamed Property",
                        groupId: p.attributes?.group_id || p.group_id || "",
                        city: p.attributes?.city || p.city || "-",
                        currency: p.attributes?.currency || p.currency || "IDR",
                        country: p.attributes?.country || p.country || "ID",
                    }));
                }
            } catch (err: any) {
                console.warn("[Channex Properties API Warning]:", err.message);
            }
        }

        // 4. Merge Groups (Channex Groups + Firestore Groups)
        const combinedGroups: any[] = [...localGroups];
        channexGroups.forEach((cg) => {
            const existing = combinedGroups.find((lg) => lg.channexGroupId === cg.id || lg.id === cg.id);
            if (!existing) {
                combinedGroups.push({
                    id: `cx_${cg.id}`,
                    name: cg.title,
                    channexGroupId: cg.id,
                    source: "channex",
                });
            } else {
                existing.channexGroupId = cg.id;
            }
        });

        // 5. Merge Hotels / Properties
        const combinedHotels: any[] = [...localHotels];

        // For each Channex property, match with local hotel or add as imported property
        channexProperties.forEach((cp) => {
            const matchedLocal = combinedHotels.find(
                (h) => h.channexPropertyId === cp.id || h.hotelCode.toLowerCase() === cp.title.toLowerCase().replace(/\s+/g, "-")
            );

            if (matchedLocal) {
                matchedLocal.channexPropertyId = cp.id;
                // If Channex has a group assignment and local doesn't, map it
                if (cp.groupId) {
                    const matchedGrp = combinedGroups.find((g) => g.channexGroupId === cp.groupId || g.id === cp.groupId || g.id === `cx_${cp.groupId}`);
                    if (matchedGrp) {
                        matchedLocal.groupId = matchedGrp.id;
                        matchedLocal.groupName = matchedGrp.name;
                    }
                }
            } else {
                // Property exists in Channex sandbox but not yet in local list
                const matchedGrp = combinedGroups.find((g) => g.channexGroupId === cp.groupId || g.id === cp.groupId || g.id === `cx_${cp.groupId}`);
                combinedHotels.push({
                    hotelCode: cp.title.toLowerCase().replace(/[^a-z0-9]/g, "-"),
                    name: cp.title,
                    city: cp.city || "-",
                    groupId: matchedGrp ? matchedGrp.id : (cp.groupId ? `cx_${cp.groupId}` : ""),
                    groupName: matchedGrp ? matchedGrp.name : "",
                    channexPropertyId: cp.id,
                    channexEnvironment: env,
                    totalRooms: 0,
                    status: "active",
                    source: "channex",
                });
            }
        });

        return NextResponse.json({
            success: true,
            groups: combinedGroups,
            hotels: combinedHotels,
            hasApiKey: !!apiKey,
            environment: env,
        });
    } catch (err: any) {
        console.error("[Channex Groups GET Error]:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        let { name, description, apiKey, environment, hotelCode } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ success: false, error: "Nama Group wajib diisi." }, { status: 400 });
        }

        const groupTitle = name.trim();
        let channexGroupId = "";

        // If no API key passed, lookup from hotel or existing settings
        if (!apiKey) {
            const hotelsSnap = await getDocs(collection(db, "hotels"));
            hotelsSnap.forEach((d) => {
                const cm = d.data()?.channelManager || {};
                const key = cm.apiKey || d.data()?.channexApiKey;
                if (key && !apiKey) {
                    apiKey = key;
                    if (!environment) environment = cm.env || "staging";
                }
            });
        }

        // 1. Create Group in Channex API if API Key is available
        if (apiKey) {
            try {
                const cxRes = await channex.createGroup(groupTitle, apiKey, environment || "staging");
                if (cxRes?.data?.id) {
                    channexGroupId = cxRes.data.id;
                }
            } catch (cxErr: any) {
                console.warn("[Channex Group Creation Notice]:", cxErr.message);
            }
        }

        // 2. Save group to Firestore
        const groupId = channexGroupId ? `cx_${channexGroupId}` : `grp_${Date.now()}`;
        const groupData = {
            id: groupId,
            name: groupTitle,
            description: description || "",
            channexGroupId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await setDoc(doc(db, "hotel_groups", groupId), groupData);

        return NextResponse.json({
            success: true,
            group: groupData,
            message: channexGroupId
                ? `Group "${groupTitle}" berhasil dibuat dan tersinkron ke Master Channel Manager (ID: ${channexGroupId}).`
                : `Group "${groupTitle}" berhasil dibuat di Tara CRS.`,
        });
    } catch (err: any) {
        console.error("[Channex Groups POST Error]:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        let { hotelCode, groupId, groupName, apiKey, environment } = body;

        if (!hotelCode) {
            return NextResponse.json({ success: false, error: "hotelCode wajib disertakan." }, { status: 400 });
        }

        // 1. Update Hotel document in Firestore
        const hotelRef = doc(db, "hotels", hotelCode);
        const hotelSnap = await getDoc(hotelRef);

        let channexPropertyId = "";
        let hotelData: any = {};

        if (hotelSnap.exists()) {
            hotelData = hotelSnap.data();
            channexPropertyId = hotelData.channexPropertyId || hotelData.channelManager?.propertyId || "";
            await updateDoc(hotelRef, {
                groupId: groupId || "",
                groupName: groupName || "",
                updatedAt: new Date().toISOString(),
            });
        }

        // Lookup API key if not provided
        if (!apiKey) {
            apiKey = hotelData.channelManager?.apiKey || hotelData.channexApiKey || "";
            if (!apiKey) {
                const allHotels = await getDocs(collection(db, "hotels"));
                allHotels.forEach((d) => {
                    const k = d.data()?.channelManager?.apiKey;
                    if (k && !apiKey) apiKey = k;
                });
            }
        }

        // 2. If hotel has Channex property ID, update group in Channex
        if (channexPropertyId && apiKey) {
            try {
                let cxGroupId = "";
                if (groupId) {
                    const groupSnap = await getDoc(doc(db, "hotel_groups", groupId));
                    cxGroupId = groupSnap.exists() ? (groupSnap.data().channexGroupId || "") : "";
                    if (!cxGroupId && groupId.startsWith("cx_")) {
                        cxGroupId = groupId.replace("cx_", "");
                    }
                }

                await channex.updateProperty(
                    channexPropertyId,
                    { group_id: cxGroupId || undefined },
                    apiKey,
                    environment || hotelData.channelManager?.env || "staging"
                );
            } catch (cxErr: any) {
                console.warn("[Channex Update Property Group Warning]:", cxErr.message);
            }
        }

        return NextResponse.json({
            success: true,
            message: groupId
                ? `Hotel "${hotelData.name || hotelCode}" berhasil ditautkan ke Group "${groupName}".`
                : `Hotel "${hotelData.name || hotelCode}" berhasil dilepas dari group.`,
        });
    } catch (err: any) {
        console.error("[Channex Groups PUT Error]:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
