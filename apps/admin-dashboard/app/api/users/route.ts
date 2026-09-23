import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

const ALL_KEYS = [
    // Modules
    "module_pos", "module_front_office", "module_innalytics", "module_housekeeping", 
    "module_food_beverage", "module_purchasing", "module_accounting", "module_cpanel", "module_hrd",
    // Submenus
    "overview", "digital-checkin", "forecast", "inventory-control", "invoice", 
    "pnl", "pnl-budget", "dsr", "budgeting", "statements",
    "logo", "hero", "room-type", "about", "gallery", "footer", "attractions", "promo", "packages", "seo", "users",
    "purchasing", "store-requisition", "purchase-requisition", "daily-market-list", 
    "stock-opname", "items", "suppliers", "purchase-order", "food-beverage-product", "food-beverage-realtime",
    // POS submenus
    "pos_home", "pos_lexupos", "pos_cashier", "pos_product", "pos_records", "pos_settings", "pos_self_order",
    "hrd"
];

// Helper to log user activity
async function logActivity(data: {
    hotelCode: string;
    userId: string;
    userName: string;
    userEmail: string;
    action: string;
    module: string;
    description: string;
    ipAddress?: string;
}) {
    try {
        const logDoc = {
            ...data,
            timestamp: new Date().toISOString()
        };
        // Log to hotel-level user_activities
        await adminDb.collection(`hotels/${data.hotelCode}/user_activities`).add(logDoc);
        // Also log to global system_activity_logs for master audit trail
        await adminDb.collection("system_activity_logs").add(logDoc);
    } catch (err) {
        console.warn("[User Activity Log Warning]:", err);
    }
}

// POST: Create User & Set Multi-Hotel Claims
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
        email, password, name, role, hotelCode, permissions, 
        allowedOutlets: rawAllowedOutlets,
        requesterRole, requesterEmail 
    } = body;

    if (!email || !password || !name || !role || !hotelCode) {
      return NextResponse.json({ error: "Missing required fields (email, password, name, role, hotelCode)" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const docId = cleanEmail.replace(/[@.]/g, "_");

    // ── ROLE HIERARCHY PROTECTION ──
    const targetRoleLower = role.toLowerCase();
    const isRequesterSuper = requesterRole?.toLowerCase() === "superadmin" || requesterEmail?.toLowerCase() === "superadmin@setara.co.id";
    
    // Only Superadmin can create a Superadmin user
    if (targetRoleLower === "superadmin" && !isRequesterSuper) {
        return NextResponse.json({ 
            error: "Akses Ditolak: Hanya Superadmin yang berhak membuat akun dengan role Superadmin." 
        }, { status: 403 });
    }

    // Multi-Hotel assignment restriction: HANYA Superadmin yang berhak mengatur hak multi-hotel
    let allowedOutlets: string[];
    if (isRequesterSuper && Array.isArray(rawAllowedOutlets) && rawAllowedOutlets.length > 0) {
        allowedOutlets = Array.from(new Set([...rawAllowedOutlets, hotelCode]));
    } else {
        // Non-superadmin cannot assign multi-hotel, locked to the hotelCode
        allowedOutlets = [hotelCode];
    }

    let uid = "";
    try {
      // Check if user already exists in Firebase Auth
      const existingUser = await adminAuth.getUserByEmail(cleanEmail);
      uid = existingUser.uid;
      
      const currentClaims = existingUser.customClaims || {};
      const existingOutlets = Array.isArray(currentClaims.allowedOutlets) ? currentClaims.allowedOutlets : [];
      allowedOutlets = Array.from(new Set([...existingOutlets, ...allowedOutlets]));

      // Update custom claims with multi-hotel access
      await adminAuth.setCustomUserClaims(uid, { 
          ...currentClaims, 
          role, 
          hotelCode, 
          allowedOutlets 
      });
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        // Create new Firebase Auth user
        const newUser = await adminAuth.createUser({
          email: cleanEmail,
          password: password,
          displayName: name,
        });
        uid = newUser.uid;
        
        // Set custom claims
        await adminAuth.setCustomUserClaims(uid, { 
            role, 
            hotelCode, 
            allowedOutlets 
        });
      } else {
        throw err;
      }
    }

    // Determine permissions
    const isSuper = targetRoleLower === "superadmin";
    let finalPerms = permissions;
    if (!finalPerms) {
      finalPerms = {};
      ALL_KEYS.forEach(k => {
        finalPerms[k] = isSuper;
      });
    }

    const userData = {
      email: cleanEmail,
      name: name.trim(),
      role,
      hotelCode,
      allowedOutlets,
      uid,
      permissions: finalPerms,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Propagate profile to all assigned hotels in allowedOutlets
    for (const outletCode of allowedOutlets) {
        await adminDb.doc(`hotels/${outletCode}/users_master/${docId}`).set(userData, { merge: true });
    }

    // Also persist in global users_master
    await adminDb.doc(`users_master/${docId}`).set(userData, { merge: true });

    // Log Activity
    await logActivity({
        hotelCode,
        userId: uid,
        userName: name.trim(),
        userEmail: cleanEmail,
        action: "CREATE_USER",
        module: "USER_MANAGEMENT",
        description: `Akun staf baru dibuat dengan role '${role}' dan ditugaskan ke ${allowedOutlets.length} properti (${allowedOutlets.join(", ")}).`
    });

    return NextResponse.json({ success: true, uid, allowedOutlets });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}

// PUT: Update User & Multi-Hotel Claims
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
        email, password, name, role, hotelCode, permissions, 
        allowedOutlets: rawAllowedOutlets,
        requesterRole, requesterEmail 
    } = body;

    if (!email || !hotelCode) {
      return NextResponse.json({ error: "Email and hotelCode are required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const docId = cleanEmail.replace(/[@.]/g, "_");

    // Fetch existing user to enforce role hierarchy protection
    let existingDoc: any = null;
    const hotelUserSnap = await adminDb.doc(`hotels/${hotelCode}/users_master/${docId}`).get();
    if (hotelUserSnap.exists) {
        existingDoc = hotelUserSnap.data();
    } else {
        const globalUserSnap = await adminDb.doc(`users_master/${docId}`).get();
        if (globalUserSnap.exists) existingDoc = globalUserSnap.data();
    }

    const isRequesterSuper = requesterRole?.toLowerCase() === "superadmin" || requesterEmail?.toLowerCase() === "superadmin@setara.co.id";
    const currentRoleLower = (existingDoc?.role || "").toLowerCase();
    const targetRoleLower = (role || existingDoc?.role || "").toLowerCase();

    // Protection 1: Non-superadmin cannot edit a Superadmin account
    if (currentRoleLower === "superadmin" && !isRequesterSuper) {
        return NextResponse.json({ 
            error: "Akses Ditolak: Akun Superadmin dilindungi dan hanya dapat diedit oleh Superadmin." 
        }, { status: 403 });
    }

    // Protection 2: Non-superadmin cannot promote someone to Superadmin
    if (targetRoleLower === "superadmin" && !isRequesterSuper) {
        return NextResponse.json({ 
            error: "Akses Ditolak: Anda tidak memiliki wewenang untuk memberikan role Superadmin." 
        }, { status: 403 });
    }

    // Get Firebase Auth User
    const userRecord = await adminAuth.getUserByEmail(cleanEmail);
    const uid = userRecord.uid;

    // Update Auth Profile
    const updateParams: any = {};
    if (name) updateParams.displayName = name;
    if (password) updateParams.password = password;

    if (Object.keys(updateParams).length > 0) {
      await adminAuth.updateUser(uid, updateParams);
    }

    // Multi-Hotel calculation: HANYA Superadmin yang berhak mengubah multi-hotel
    let allowedOutlets: string[];
    if (isRequesterSuper && Array.isArray(rawAllowedOutlets) && rawAllowedOutlets.length > 0) {
        allowedOutlets = Array.from(new Set([...rawAllowedOutlets, hotelCode]));
    } else {
        // Non-superadmin retains existing assigned outlets or defaults to current hotel
        allowedOutlets = existingDoc?.allowedOutlets || [hotelCode];
    }

    // Update Claims
    await adminAuth.setCustomUserClaims(uid, { 
        role: role || existingDoc?.role, 
        hotelCode,
        allowedOutlets 
    });

    // Update Firestore Document
    const updateData: any = {
        updatedAt: new Date().toISOString()
    };
    if (name) updateData.name = name.trim();
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = permissions;
    updateData.allowedOutlets = allowedOutlets;

    // Update across all assigned hotels
    for (const outletCode of allowedOutlets) {
      await adminDb.doc(`hotels/${outletCode}/users_master/${docId}`).set(updateData, { merge: true });
    }

    // If previously assigned to hotels that are now unassigned, remove them from those hotels
    const previousOutlets: string[] = existingDoc?.allowedOutlets || [];
    const removedOutlets = previousOutlets.filter(c => !allowedOutlets.includes(c));
    for (const remCode of removedOutlets) {
        try {
            await adminDb.doc(`hotels/${remCode}/users_master/${docId}`).delete();
        } catch (e) {
            console.warn(`Could not remove user from unassigned hotel ${remCode}:`, e);
        }
    }

    // Also update global users_master
    await adminDb.doc(`users_master/${docId}`).set(updateData, { merge: true });

    // Log Activity
    await logActivity({
        hotelCode,
        userId: uid,
        userName: name?.trim() || existingDoc?.name || cleanEmail,
        userEmail: cleanEmail,
        action: "UPDATE_USER",
        module: "USER_MANAGEMENT",
        description: `Profil dan hak akses staf diperbarui. Role: '${role || existingDoc?.role}', Assigned Hotels: ${allowedOutlets.join(", ")}.`
    });

    return NextResponse.json({ success: true, allowedOutlets });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}

// DELETE: Remove User
export async function DELETE(request: Request) {
  try {
    const { email, hotelCode, requesterRole, requesterEmail } = await request.json();

    if (!email || !hotelCode) {
      return NextResponse.json({ error: "Email and hotelCode are required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const docId = cleanEmail.replace(/[@.]/g, "_");

    // Check user data before deletion
    const userDocRef = adminDb.doc(`hotels/${hotelCode}/users_master/${docId}`);
    const snap = await userDocRef.get();
    const userData = snap.data();

    const isRequesterSuper = requesterRole?.toLowerCase() === "superadmin" || requesterEmail?.toLowerCase() === "superadmin@setara.co.id";
    if (userData?.role?.toLowerCase() === "superadmin" && !isRequesterSuper) {
        return NextResponse.json({ 
            error: "Akses Ditolak: Akun Superadmin dilindungi dan tidak dapat dihapus oleh Admin hotel." 
        }, { status: 403 });
    }

    try {
      // Find Auth User and Delete
      const userRecord = await adminAuth.getUserByEmail(cleanEmail);
      await adminAuth.deleteUser(userRecord.uid);
    } catch (authErr: any) {
      if (authErr.code !== "auth/user-not-found") {
        throw authErr;
      }
    }

    // Delete across all assigned hotels
    const allowedOutlets: string[] = userData?.allowedOutlets || [hotelCode];
    for (const code of allowedOutlets) {
        await adminDb.doc(`hotels/${code}/users_master/${docId}`).delete().catch(() => {});
    }

    // Delete global users_master
    await adminDb.doc(`users_master/${docId}`).delete().catch(() => {});

    // Log Activity
    await logActivity({
        hotelCode,
        userId: docId,
        userName: userData?.name || cleanEmail,
        userEmail: cleanEmail,
        action: "DELETE_USER",
        module: "USER_MANAGEMENT",
        description: `Akun user '${userData?.name || cleanEmail}' telah dihapus dari sistem.`
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 });
  }
}
