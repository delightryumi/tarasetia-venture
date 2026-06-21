import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

const ALL_KEYS = [
    // Modules
    "module_pos", "module_front_office", "module_housekeeping", 
    "module_food_beverage", "module_purchasing", "module_accounting", "module_cpanel", "module_hrd",
    // Submenus
    "overview", "forecast", "invoice", "pnl", "logo", "hero", "room-type", 
    "about", "gallery", "footer", "attractions", "promo", "packages", "seo", "users",
    "purchasing", "store-requisition", "purchase-requisition", "daily-market-list", 
    "stock-opname", "items", "suppliers", "purchase-order", "food-beverage-product",
    // POS submenus
    "pos_home", "pos_lexupos", "pos_cashier", "pos_product", "pos_records", "pos_settings",
    "hrd"
];

// POST: Create User & Set Claims
export async function POST(request: Request) {
  try {
    const { email, password, name, role, hotelCode, permissions } = await request.json();

    if (!email || !password || !name || !role || !hotelCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const docId = cleanEmail.replace(/[@.]/g, "_");

    let uid = "";
    try {
      // Check if user already exists in Firebase Auth
      const existingUser = await adminAuth.getUserByEmail(cleanEmail);
      uid = existingUser.uid;
      
      const currentClaims = existingUser.customClaims || {};
      let allowedOutlets: string[] = Array.isArray(currentClaims.allowedOutlets) 
        ? [...currentClaims.allowedOutlets] 
        : (currentClaims.hotelCode ? [currentClaims.hotelCode as string] : []);
      
      if (!allowedOutlets.includes(hotelCode)) {
        allowedOutlets.push(hotelCode);
      }

      // Update custom claims
      await adminAuth.setCustomUserClaims(uid, { ...currentClaims, role, hotelCode, allowedOutlets });
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
        await adminAuth.setCustomUserClaims(uid, { role, hotelCode, allowedOutlets: [hotelCode] });
      } else {
        throw err;
      }
    }

    // Determine permissions
    const isSuper = role === "superadmin";
    let finalPerms = permissions;
    if (!finalPerms) {
      finalPerms = {};
      ALL_KEYS.forEach(k => {
        finalPerms[k] = isSuper;
      });
    }

    // Save profile to Firestore
    const userDocRef = adminDb.doc(`hotels/${hotelCode}/users_master/${docId}`);
    await userDocRef.set({
      email: cleanEmail,
      name: name.trim(),
      role,
      hotelCode,
      uid,
      permissions: finalPerms,
      createdAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({ success: true, uid });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}

// PUT: Update User & Claims
export async function PUT(request: Request) {
  try {
    const { email, password, name, role, hotelCode, permissions } = await request.json();

    if (!email || !hotelCode) {
      return NextResponse.json({ error: "Email and hotelCode are required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const docId = cleanEmail.replace(/[@.]/g, "_");

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

    // Update Claims if role changes
    if (role) {
      await adminAuth.setCustomUserClaims(uid, { role, hotelCode });
    }

    // Update Firestore Document
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = permissions;

    if (Object.keys(updateData).length > 0) {
      const userDocRef = adminDb.doc(`hotels/${hotelCode}/users_master/${docId}`);
      await userDocRef.update(updateData);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}

// DELETE: Remove User
export async function DELETE(request: Request) {
  try {
    const { email, hotelCode } = await request.json();

    if (!email || !hotelCode) {
      return NextResponse.json({ error: "Email and hotelCode are required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const docId = cleanEmail.replace(/[@.]/g, "_");

    try {
      // Find Auth User and Delete
      const userRecord = await adminAuth.getUserByEmail(cleanEmail);
      await adminAuth.deleteUser(userRecord.uid);
    } catch (authErr: any) {
      // If user not in Auth, just ignore and proceed with Firestore deletion
      if (authErr.code !== "auth/user-not-found") {
        throw authErr;
      }
    }

    // Delete Firestore Document
    const userDocRef = adminDb.doc(`hotels/${hotelCode}/users_master/${docId}`);
    await userDocRef.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 });
  }
}
