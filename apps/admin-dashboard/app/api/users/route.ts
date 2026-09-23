import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { resolveLocationFromReq } from "@/lib/geoHelper";
import { getAuthenticatedUser } from "@/lib/security/serverAuth";
import { emailToDocId, sanitizeIdentifier, isValidEmail } from "@/lib/security/inputSanitizer";

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
    location?: string;
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
    const authUser = await getAuthenticatedUser(request);
    const body = await request.json();
    const { 
        email, password, name, role, hotelCode: rawHotelCode, permissions, 
        allowedOutlets: rawAllowedOutlets,
        timeZone
    } = body;

    const hotelCode = sanitizeIdentifier(rawHotelCode);
    if (!email || !password || !name || !role || !hotelCode) {
      return NextResponse.json({ error: "Kolom wajib belum lengkap (email, password, name, role, hotelCode)" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Format alamat email tidak valid." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const docId = emailToDocId(cleanEmail);

    // ── ROLE HIERARCHY & SERVER-SIDE AUTH VERIFICATION ──
    const targetRoleLower = role.toLowerCase();
    
    // Determine whether caller is verified superadmin
    let isRequesterSuper = authUser?.isSuperadmin ?? false;

    // Verify non-superadmin rights
    if (!isRequesterSuper) {
        const callerEmail = authUser?.email || body.requesterEmail?.trim().toLowerCase();
        if (!callerEmail) {
            return NextResponse.json({ error: "Akses Ditolak: Kredensial otentikasi tidak ditemukan." }, { status: 401 });
        }

        // Verify hotel assignment
        if (authUser && authUser.hotelCode && authUser.hotelCode !== hotelCode) {
            const hasOutlet = authUser.allowedOutlets && authUser.allowedOutlets.includes(hotelCode);
            if (!hasOutlet) {
                return NextResponse.json({ error: "Akses Ditolak: Anda tidak memiliki akses ke properti hotel ini." }, { status: 403 });
            }
        }

        try {
            const reqDocId = emailToDocId(callerEmail);
            const reqSnap = await adminDb.doc(`hotels/${hotelCode}/users_master/${reqDocId}`).get();
            if (reqSnap.exists) {
                const reqData = reqSnap.data() || {};
                const reqPerms = reqData.permissions || {};
                const reqRole = (reqData.role || "").toLowerCase();
                if (reqRole !== "superadmin" && reqPerms["sec_user_manage"] === false) {
                    return NextResponse.json({
                        error: "Akses Ditolak: Akun Anda tidak memiliki izin kelola staf (sec_user_manage)."
                    }, { status: 403 });
                }
            }
        } catch (e) {
            console.warn("Could not verify requester permissions:", e);
        }
    }

    // Only Superadmin can create a Superadmin user
    if (targetRoleLower === "superadmin" && !isRequesterSuper) {
        return NextResponse.json({ 
            error: "Akses Ditolak: Hanya Superadmin yang berhak membuat akun dengan role Superadmin." 
        }, { status: 403 });
    }

    // Multi-Hotel assignment restriction: HANYA Superadmin yang berhak mengatur hak multi-hotel
    let allowedOutlets: string[];
    if (isRequesterSuper && Array.isArray(rawAllowedOutlets) && rawAllowedOutlets.length > 0) {
        allowedOutlets = Array.from(new Set([...rawAllowedOutlets.map(sanitizeIdentifier), hotelCode]));
    } else {
        allowedOutlets = [hotelCode];
    }

    // Default permissions dictionary
    let finalPermissions: Record<string, boolean> = {};
    ALL_KEYS.forEach((key) => {
      finalPermissions[key] = false;
    });

    if (permissions && typeof permissions === "object") {
      finalPermissions = { ...finalPermissions, ...permissions };
    }

    let uid = "";
    let alreadyExists = false;

    try {
      const existingUser = await adminAuth.getUserByEmail(cleanEmail);
      uid = existingUser.uid;
      alreadyExists = true;

      // Update custom claims for existing user
      await adminAuth.setCustomUserClaims(uid, {
        role,
        hotelCode,
        allowedOutlets,
        permissions: finalPermissions,
      });

      // Update password if provided
      if (password && password.trim() !== "") {
        await adminAuth.updateUser(uid, {
          password,
          displayName: name,
        });
      }
    } catch (authError: any) {
      if (authError.code === "auth/user-not-found") {
        const newUser = await adminAuth.createUser({
          email: cleanEmail,
          password,
          displayName: name,
        });
        uid = newUser.uid;

        await adminAuth.setCustomUserClaims(uid, {
          role,
          hotelCode,
          allowedOutlets,
          permissions: finalPermissions,
        });
      } else {
        console.error("Error in Firebase Auth user creation:", authError);
        return NextResponse.json({ error: "Gagal membuat akun autentikasi pengguna." }, { status: 500 });
      }
    }

    const userData = {
      uid,
      name,
      email: cleanEmail,
      role,
      hotelCode,
      allowedOutlets,
      permissions: finalPermissions,
      isBlocked: false,
      loginCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    // Save to primary hotel collection
    await adminDb.doc(`hotels/${hotelCode}/users_master/${docId}`).set(userData, { merge: true });

    // Distribute to all assigned hotel outlets
    for (const outletCode of allowedOutlets) {
      if (outletCode !== hotelCode) {
        await adminDb.doc(`hotels/${outletCode}/users_master/${docId}`).set({
          ...userData,
          hotelCode: outletCode,
        }, { merge: true }).catch(err => {
          console.warn(`Could not sync user to outlet ${outletCode}:`, err);
        });
      }
    }

    // Save to global users_master
    await adminDb.doc(`users_master/${docId}`).set(userData, { merge: true });

    // Log Activity
    const { ip: ipAddress, location } = await resolveLocationFromReq(request, timeZone);
    await logActivity({
        hotelCode,
        userId: docId,
        userName: name,
        userEmail: cleanEmail,
        action: alreadyExists ? "LINK_USER" : "CREATE_USER",
        module: "USER_MANAGEMENT",
        description: `Akun user '${name}' (${role}) telah ${alreadyExists ? "ditautkan & diperbarui" : "dibuat"} di hotel ini.`,
        ipAddress,
        location
    });

    return NextResponse.json({ success: true, uid, allowedOutlets });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Gagal memproses pembuatan user." }, { status: 500 });
  }
}

// PUT: Update User & Multi-Hotel Claims
export async function PUT(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const body = await request.json();
    const { 
        email, password, name, role, hotelCode: rawHotelCode, permissions, 
        allowedOutlets: rawAllowedOutlets,
        timeZone
    } = body;

    const hotelCode = sanitizeIdentifier(rawHotelCode);
    if (!email || !hotelCode) {
      return NextResponse.json({ error: "Email dan hotelCode wajib diisi." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const docId = emailToDocId(cleanEmail);

    // Fetch existing user to enforce role hierarchy protection
    let existingDoc: any = null;
    const hotelUserSnap = await adminDb.doc(`hotels/${hotelCode}/users_master/${docId}`).get();
    if (hotelUserSnap.exists) {
        existingDoc = hotelUserSnap.data();
    } else {
        const globalUserSnap = await adminDb.doc(`users_master/${docId}`).get();
        if (globalUserSnap.exists) existingDoc = globalUserSnap.data();
    }

    let isRequesterSuper = authUser?.isSuperadmin ?? false;

    // Non-superadmin validation
    if (!isRequesterSuper) {
        const callerEmail = authUser?.email || body.requesterEmail?.trim().toLowerCase();
        if (!callerEmail) {
            return NextResponse.json({ error: "Akses Ditolak: Sesi otentikasi tidak valid." }, { status: 401 });
        }

        try {
            const reqDocId = emailToDocId(callerEmail);
            const reqSnap = await adminDb.doc(`hotels/${hotelCode}/users_master/${reqDocId}`).get();
            if (reqSnap.exists) {
                const reqData = reqSnap.data() || {};
                const reqPerms = reqData.permissions || {};
                const reqRole = (reqData.role || "").toLowerCase();
                if (reqRole !== "superadmin" && reqPerms["sec_user_manage"] === false) {
                    return NextResponse.json({
                        error: "Akses Ditolak: Akun Anda tidak memiliki izin kelola staf (sec_user_manage)."
                    }, { status: 403 });
                }
            }
        } catch (e) {
            console.warn("Could not verify requester permissions:", e);
        }
    }

    const currentRoleLower = (existingDoc?.role || "").toLowerCase();
    const targetRoleLower = (role || existingDoc?.role || "").toLowerCase();

    // Protection 1: Non-superadmin cannot edit a Superadmin account
    if (currentRoleLower === "superadmin" && !isRequesterSuper) {
        return NextResponse.json({ 
            error: "Akses Ditolak: Akun Superadmin hanya dapat dimodifikasi oleh Superadmin." 
        }, { status: 403 });
    }

    // Protection 2: Non-superadmin cannot elevate someone to Superadmin
    if (targetRoleLower === "superadmin" && !isRequesterSuper) {
        return NextResponse.json({ 
            error: "Akses Ditolak: Hanya Superadmin yang berhak menetapkan role Superadmin." 
        }, { status: 403 });
    }

    // Protection 3: Primary Hotel Owner Admin cannot have their role changed by normal admins
    const hotelDocSnap = await adminDb.doc(`hotels/${hotelCode}`).get();
    const hotelDocData = hotelDocSnap.exists ? hotelDocSnap.data() : null;
    const hotelOwnerEmail = (hotelDocData?.email || "").trim().toLowerCase();
    const isOwnerAccount = (existingDoc?.isOwner === true || (hotelOwnerEmail && cleanEmail === hotelOwnerEmail)) && !existingDoc?.createdBy;

    if (isOwnerAccount && !isRequesterSuper && targetRoleLower !== "admin" && targetRoleLower !== "administrator") {
        return NextResponse.json({ 
            error: "Akses Ditolak: Akun Admin Utama (Owner Properti) tidak dapat diubah rolenya oleh staf lain." 
        }, { status: 403 });
    }

    // Multi-Hotel assignment restriction
    let allowedOutlets: string[];
    if (isRequesterSuper) {
        if (Array.isArray(rawAllowedOutlets) && rawAllowedOutlets.length > 0) {
            allowedOutlets = Array.from(new Set([...rawAllowedOutlets.map(sanitizeIdentifier), hotelCode]));
        } else {
            allowedOutlets = existingDoc?.allowedOutlets || [hotelCode];
        }
    } else {
        allowedOutlets = existingDoc?.allowedOutlets || [hotelCode];
    }

    let uid = existingDoc?.uid;
    try {
      const userRecord = await adminAuth.getUserByEmail(cleanEmail);
      uid = userRecord.uid;
    } catch (authErr: any) {
      if (authErr.code === "auth/user-not-found") {
        // Auto-provision Auth user if missing
        const newPassword = password && password.trim() !== "" ? password.trim() : `User${Date.now()}!`;
        const newUser = await adminAuth.createUser({
          email: cleanEmail,
          password: newPassword,
          displayName: name || existingDoc?.name || cleanEmail.split("@")[0],
        });
        uid = newUser.uid;
      } else {
        console.error("Auth fetch error:", authErr);
        return NextResponse.json({ error: "Gagal memverifikasi user di sistem autentikasi." }, { status: 500 });
      }
    }

    // Update password if provided
    if (password && password.trim() !== "") {
      try {
        await adminAuth.updateUser(uid, { password: password.trim() });
      } catch (err: any) {
        return NextResponse.json({ error: `Gagal memperbarui kata sandi: ${err.message}` }, { status: 400 });
      }
    }

    // Update custom claims
    await adminAuth.setCustomUserClaims(uid, {
      role: role || existingDoc?.role || "user",
      hotelCode,
      allowedOutlets,
      permissions: permissions || existingDoc?.permissions || {},
    });

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = permissions;
    updateData.allowedOutlets = allowedOutlets;

    // Update primary hotel
    await adminDb.doc(`hotels/${hotelCode}/users_master/${docId}`).set(updateData, { merge: true });

    // Sync across outlets
    for (const outletCode of allowedOutlets) {
      if (outletCode !== hotelCode) {
        await adminDb.doc(`hotels/${outletCode}/users_master/${docId}`).set({
          ...existingDoc,
          ...updateData,
          hotelCode: outletCode,
        }, { merge: true }).catch(err => {
          console.warn(`Could not sync updated user to outlet ${outletCode}:`, err);
        });
      }
    }

    // Update global users_master
    await adminDb.doc(`users_master/${docId}`).set(updateData, { merge: true });

    // Log Activity
    const { ip: ipAddress, location } = await resolveLocationFromReq(request, timeZone);
    await logActivity({
        hotelCode,
        userId: docId,
        userName: name || existingDoc?.name || cleanEmail,
        userEmail: cleanEmail,
        action: "UPDATE_USER",
        module: "USER_MANAGEMENT",
        description: `Profil user '${name || cleanEmail}' (${role || existingDoc?.role}) telah diperbarui.`,
        ipAddress,
        location
    });

    return NextResponse.json({ success: true, allowedOutlets });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Gagal memperbarui data user." }, { status: 500 });
  }
}

// DELETE: Remove User
export async function DELETE(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const body = await request.json();
    const { email, hotelCode: rawHotelCode, timeZone } = body;

    const hotelCode = sanitizeIdentifier(rawHotelCode);
    if (!email || !hotelCode) {
      return NextResponse.json({ error: "Email dan hotelCode wajib diisi." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const docId = emailToDocId(cleanEmail);

    const userDocRef = adminDb.doc(`hotels/${hotelCode}/users_master/${docId}`);
    const snap = await userDocRef.get();
    const userData = snap.data();

    let isRequesterSuper = authUser?.isSuperadmin ?? false;

    // Non-superadmin must have sec_user_manage permission
    if (!isRequesterSuper) {
        const callerEmail = authUser?.email || body.requesterEmail?.trim().toLowerCase();
        if (!callerEmail) {
            return NextResponse.json({ error: "Akses Ditolak: Sesi otentikasi tidak valid." }, { status: 401 });
        }

        try {
            const reqDocId = emailToDocId(callerEmail);
            const reqSnap = await adminDb.doc(`hotels/${hotelCode}/users_master/${reqDocId}`).get();
            if (reqSnap.exists) {
                const reqData = reqSnap.data() || {};
                const reqPerms = reqData.permissions || {};
                const reqRole = (reqData.role || "").toLowerCase();
                if (reqRole !== "superadmin" && reqPerms["sec_user_manage"] === false) {
                    return NextResponse.json({
                        error: "Akses Ditolak: Akun Anda tidak memiliki izin kelola staf (sec_user_manage)."
                    }, { status: 403 });
                }
            }
        } catch (e) {
            console.warn("Could not verify requester permissions:", e);
        }
    }

    if (userData?.role?.toLowerCase() === "superadmin" && !isRequesterSuper) {
        return NextResponse.json({ 
            error: "Akses Ditolak: Akun Superadmin dilindungi dan tidak dapat dihapus oleh Admin hotel." 
        }, { status: 403 });
    }

    // Protection: Primary Hotel Owner Admin cannot be deleted
    const hotelDocSnap = await adminDb.doc(`hotels/${hotelCode}`).get();
    const hotelDocData = hotelDocSnap.exists ? hotelDocSnap.data() : null;
    const hotelOwnerEmail = (hotelDocData?.email || "").trim().toLowerCase();
    const isOwnerAccount = (userData?.isOwner === true || (hotelOwnerEmail && cleanEmail === hotelOwnerEmail)) && !userData?.createdBy;

    if (isOwnerAccount) {
        return NextResponse.json({ 
            error: "Akses Ditolak: Akun Admin Owner utama dari pendaftaran properti dilindungi dan tidak dapat dihapus." 
        }, { status: 403 });
    }

    try {
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
    const { ip: ipAddress, location } = await resolveLocationFromReq(request, timeZone);
    await logActivity({
        hotelCode,
        userId: docId,
        userName: userData?.name || cleanEmail,
        userEmail: cleanEmail,
        action: "DELETE_USER",
        module: "USER_MANAGEMENT",
        description: `Akun user '${userData?.name || cleanEmail}' telah dihapus dari sistem.`,
        ipAddress,
        location
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Gagal menghapus user dari sistem." }, { status: 500 });
  }
}
