import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
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

        // 1. Fetch system_settings/channex first (Master Key)
        let foundApiKey = "";
        let foundEnv: "staging" | "production" = "staging";

        try {
            const sysDoc = await getDoc(doc(db, "system_settings", "channex"));
            if (sysDoc.exists()) {
                const sData = sysDoc.data();
                if (sData.apiKey) {
                    foundApiKey = sData.apiKey;
                    foundEnv = sData.env || "staging";
                }
            }
        } catch (err) {
            console.warn("[Groups API] Could not read system_settings/channex:", err);
        }

        // 2. Fetch all hotels from Firestore
        const hotelsSnap = await getDocs(collection(db, "hotels"));
        const localHotels: any[] = [];

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

        // 4. Merge Groups & Auto-Prune deleted Channex groups
        let activeLocalGroups = [...localGroups];
        if (apiKey && Array.isArray(channexGroups)) {
            const channexGroupIds = new Set(channexGroups.map((cg) => cg.id));
            const retainedLocalGroups: any[] = [];

            for (const lg of localGroups) {
                const cxId = lg.channexGroupId || (typeof lg.id === "string" && lg.id.startsWith("cx_") ? lg.id.replace("cx_", "") : null);
                // If it's a Channex-linked group, but no longer exists on Channex -> delete from Firestore!
                if (cxId && !channexGroupIds.has(cxId)) {
                    try {
                        await deleteDoc(doc(db, "hotel_groups", lg.id));
                        // Clean up references in hotels
                        for (const h of localHotels) {
                            if (h.groupId === lg.id || h.groupId === cxId || h.groupId === `cx_${cxId}`) {
                                await updateDoc(doc(db, "hotels", h.hotelCode), {
                                    groupId: "",
                                    groupName: "",
                                });
                                h.groupId = "";
                                h.groupName = "";
                            }
                        }
                    } catch (pErr: any) {
                        console.warn("[Auto-Prune Group Error]:", pErr.message);
                    }
                } else {
                    retainedLocalGroups.push(lg);
                }
            }
            activeLocalGroups = retainedLocalGroups;
        }

        const combinedGroups: any[] = [...activeLocalGroups];
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
            apiKey: apiKey,
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

        // Mode 0: Save API Key
        if (body.action === "save_api_key") {
            const { apiKey: newApiKey, environment: newEnv, hotelCode } = body;
            if (!newApiKey || !newApiKey.trim()) {
                return NextResponse.json({ success: false, error: "API Key tidak boleh kosong." }, { status: 400 });
            }

            const cleanKey = newApiKey.trim();
            const cleanEnv = newEnv === "production" ? "production" : "staging";

            // 1. Save to system_settings/channex
            try {
                await setDoc(doc(db, "system_settings", "channex"), {
                    apiKey: cleanKey,
                    env: cleanEnv,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
            } catch (sysErr: any) {
                console.warn("[Save API Key to system_settings error]:", sysErr.message);
            }

            // 2. Also update hotels collection
            try {
                const hotelsSnap = await getDocs(collection(db, "hotels"));
                for (const hDoc of hotelsSnap.docs) {
                    if (!hotelCode || hDoc.id === hotelCode) {
                        await setDoc(doc(db, "hotels", hDoc.id), {
                            channexApiKey: cleanKey,
                            channexEnvironment: cleanEnv,
                            channelManager: {
                                apiKey: cleanKey,
                                env: cleanEnv,
                                updatedAt: new Date().toISOString()
                            }
                        }, { merge: true });
                    }
                }
            } catch (hErr: any) {
                console.warn("[Save API Key to hotels error]:", hErr.message);
            }

            return NextResponse.json({
                success: true,
                message: "API Key Channel Manager berhasil disimpan ke database."
            });
        }

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

        // Mode A: Rename / Update Hotel Group Details
        if (body.action === "update_group" || (!body.hotelCode && body.groupId && body.name)) {
            const { groupId, name, description, apiKey: customKey, environment: customEnv } = body;
            if (!groupId || !name || !name.trim()) {
                return NextResponse.json({ success: false, error: "groupId dan name wajib diisi." }, { status: 400 });
            }
            const groupTitle = name.trim();
            let channexGroupId = "";

            const groupRef = doc(db, "hotel_groups", groupId);
            const groupSnap = await getDoc(groupRef);
            if (groupSnap.exists()) {
                channexGroupId = groupSnap.data()?.channexGroupId || "";
                await updateDoc(groupRef, {
                    name: groupTitle,
                    description: description !== undefined ? description : (groupSnap.data()?.description || ""),
                    updatedAt: new Date().toISOString()
                });
            } else {
                if (groupId.startsWith("cx_")) {
                    channexGroupId = groupId.replace("cx_", "");
                }
                await setDoc(groupRef, {
                    id: groupId,
                    name: groupTitle,
                    description: description || "",
                    channexGroupId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            if (!channexGroupId && groupId.startsWith("cx_")) {
                channexGroupId = groupId.replace("cx_", "");
            }

            // Lookup apiKey
            let effKey = customKey || "";
            let effEnv = customEnv || "staging";
            if (!effKey) {
                const hotelsSnap = await getDocs(collection(db, "hotels"));
                hotelsSnap.forEach((d) => {
                    const cm = d.data()?.channelManager || {};
                    const k = cm.apiKey || d.data()?.channexApiKey;
                    if (k && !effKey) {
                        effKey = k;
                        effEnv = cm.env || "staging";
                    }
                });
            }

            // Update in Channex
            if (channexGroupId && effKey) {
                try {
                    await channex.updateGroup(channexGroupId, groupTitle, effKey, effEnv);
                } catch (cxErr: any) {
                    console.warn("[Channex Update Group Warning]:", cxErr.message);
                }
            }

            // Also update groupName in hotels collection for assigned hotels
            const hotelsSnap = await getDocs(collection(db, "hotels"));
            for (const d of hotelsSnap.docs) {
                const data = d.data();
                if (data.groupId === groupId || (channexGroupId && (data.groupId === channexGroupId || data.groupId === `cx_${channexGroupId}`))) {
                    await updateDoc(doc(db, "hotels", d.id), {
                        groupName: groupTitle,
                        updatedAt: new Date().toISOString()
                    });
                }
            }

            return NextResponse.json({
                success: true,
                message: `Hotel Group berhasil diubah menjadi "${groupTitle}".`
            });
        }

        // Mode B: Assign Hotel to Group
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
                    { group_id: cxGroupId ? cxGroupId : (null as any) },
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

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        let groupId = searchParams.get("groupId") || "";
        let apiKey = searchParams.get("apiKey") || "";
        let env = (searchParams.get("env") as "staging" | "production") || "staging";

        if (!groupId) {
            const body = await req.json().catch(() => ({}));
            groupId = body.groupId || "";
            if (!apiKey) apiKey = body.apiKey || "";
            if (body.env) env = body.env;
        }

        if (!groupId) {
            return NextResponse.json({ success: false, error: "groupId wajib disertakan." }, { status: 400 });
        }

        // 1. Check if group exists in Firestore
        const groupRef = doc(db, "hotel_groups", groupId);
        const groupSnap = await getDoc(groupRef);
        let channexGroupId = "";
        let groupTitle = groupId;

        if (groupSnap.exists()) {
            const gData = groupSnap.data();
            channexGroupId = gData.channexGroupId || "";
            groupTitle = gData.name || groupId;
        }
        if (!channexGroupId && groupId.startsWith("cx_")) {
            channexGroupId = groupId.replace("cx_", "");
        }

        // Lookup API key if not provided
        if (!apiKey) {
            const hotelsSnap = await getDocs(collection(db, "hotels"));
            hotelsSnap.forEach((d) => {
                const cm = d.data()?.channelManager || {};
                const key = cm.apiKey || d.data()?.channexApiKey;
                if (key && !apiKey) {
                    apiKey = key;
                    if (!env) env = cm.env || "staging";
                }
            });
        }

        // 2. Unlink properties and delete from Channex API if linked
        if (channexGroupId && apiKey) {
            try {
                // Check total groups in Channex first
                const cxGroupsRes = await channex.getGroups(apiKey, env).catch(() => ({ data: [] }));
                const allCxGroups = cxGroupsRes?.data || [];
                if (allCxGroups.length <= 1) {
                    return NextResponse.json({
                        success: false,
                        error: "Channex Cloud mewajibkan setiap akun memiliki minimal 1 Hotel Group (Root Group). Grup ini tidak dapat dihapus karena merupakan satu-satunya grup yang ada di akun Anda. Silakan buat grup baru terlebih dahulu sebelum menghapus grup ini, atau gunakan tombol Edit untuk mengganti namanya."
                    }, { status: 422 });
                }

                // If multiple groups exist, reassign properties to another active group
                const fallbackGroup = allCxGroups.find((g: any) => g.id !== channexGroupId);
                const fallbackGroupId = fallbackGroup?.id || null;

                const channexPropsRes = await channex.getProperties(apiKey, env).catch(() => ({ data: [] }));
                const channexProps = channexPropsRes?.data || [];
                for (const cp of channexProps) {
                    const pGroupId = cp.attributes?.group_id || cp.group_id || cp.groupId;
                    if (pGroupId === channexGroupId && fallbackGroupId) {
                        try {
                            await channex.updateProperty(cp.id, { group_id: fallbackGroupId }, apiKey, env);
                        } catch (uErr: any) {
                            console.warn(`[Channex Reassign Property ${cp.id} Warning]:`, uErr.message);
                        }
                    }
                }

                // Now delete group from Channex
                await channex.deleteGroup(channexGroupId, apiKey, env);
            } catch (cxErr: any) {
                console.error("[Channex Delete Group Error]:", cxErr.message);
                const errMsg = cxErr.message || "";
                if (errMsg.toLowerCase().includes("at least one group") || errMsg.includes("should have at least one group")) {
                    return NextResponse.json({
                        success: false,
                        error: "Channex Cloud mewajibkan setiap akun memiliki minimal 1 Hotel Group (Root Group). Grup ini tidak dapat dihapus karena merupakan satu-satunya grup yang ada di akun Anda. Silakan buat grup baru terlebih dahulu sebelum menghapus grup ini, atau gunakan tombol Edit untuk mengganti namanya."
                    }, { status: 422 });
                }
                return NextResponse.json({
                    success: false,
                    error: `Gagal menghapus grup di Channex: ${errMsg}`
                }, { status: 400 });
            }
        }

        // 3. Delete from Firestore hotel_groups
        await deleteDoc(groupRef).catch(() => {});
        if (groupId.startsWith("cx_")) {
            await deleteDoc(doc(db, "hotel_groups", groupId.replace("cx_", ""))).catch(() => {});
        }
        if (channexGroupId) {
            const grpQuerySnap = await getDocs(collection(db, "hotel_groups"));
            for (const gd of grpQuerySnap.docs) {
                if (gd.data()?.channexGroupId === channexGroupId || gd.id === channexGroupId || gd.id === `cx_${channexGroupId}`) {
                    await deleteDoc(doc(db, "hotel_groups", gd.id)).catch(() => {});
                }
            }
        }

        // 4. Clean up hotels referencing this group
        const hotelsSnap = await getDocs(collection(db, "hotels"));
        for (const d of hotelsSnap.docs) {
            const data = d.data();
            if (
                data.groupId === groupId || 
                (channexGroupId && (data.groupId === channexGroupId || data.groupId === `cx_${channexGroupId}`)) ||
                (groupId.startsWith("cx_") && data.groupId === groupId.replace("cx_", ""))
            ) {
                await updateDoc(doc(db, "hotels", d.id), {
                    groupId: "",
                    groupName: "",
                    updatedAt: new Date().toISOString()
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Group "${groupTitle}" berhasil dihapus dari Tara CRS dan Channel Manager.`
        });
    } catch (err: any) {
        console.error("[Channex Groups DELETE Error]:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

