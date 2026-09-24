import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export interface AuthenticatedUser {
    uid: string;
    email: string;
    role: string;
    hotelCode?: string;
    allowedOutlets?: string[];
    permissions?: Record<string, boolean>;
    isSuperadmin: boolean;
}

/**
 * Extract and cryptographically verify the Firebase ID token from the request.
 * Checks "Authorization: Bearer <token>" header or "__session" cookie.
 */
export async function getAuthenticatedUser(request: Request | NextRequest): Promise<AuthenticatedUser | null> {
    try {
        let token: string | null = null;
        const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");

        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7).trim();
        }

        // Fallback to cookie if available
        if (!token && "cookies" in request && typeof (request as any).cookies?.get === "function") {
            const cookie = (request as any).cookies.get("__session");
            if (cookie?.value) {
                token = cookie.value;
            }
        }

        if (!token) {
            return null;
        }

        // Check revoked to immediately reject tokens of deleted or revoked users
        const decodedToken = await adminAuth.verifyIdToken(token, true);
        const email = (decodedToken.email || "").toLowerCase();
        const role = (decodedToken.role || "").toLowerCase();
        
        let isSuperadmin = 
            role === "superadmin" || 
            role === "super_admin" ||
            role === "super admin" ||
            email === "superadmin@setara.co.id" || 
            email === "nexura.management@gmail.com";

        if (!isSuperadmin && email) {
            try {
                const docId = email.replace(/[@.]/g, "_");
                const snap = await adminDb.doc(`users_master/${docId}`).get();
                if (!snap.exists) {
                    // User was deleted from the database
                    return null;
                }
                const data = snap.data();
                if (data?.status === "inactive") {
                    // User was deactivated
                    return null;
                }
                if ((data?.role || "").toLowerCase() === "superadmin" || data?.isSuperadmin === true) {
                    isSuperadmin = true;
                }
            } catch (err) {
                console.warn("[ServerAuth] Fallback superadmin check error:", err);
            }
        }

        return {
            uid: decodedToken.uid,
            email,
            role: isSuperadmin ? "superadmin" : (decodedToken.role || "user"),
            hotelCode: decodedToken.hotelCode || undefined,
            allowedOutlets: Array.isArray(decodedToken.allowedOutlets) ? decodedToken.allowedOutlets : undefined,
            permissions: (decodedToken.permissions as Record<string, boolean>) || undefined,
            isSuperadmin
        };
    } catch (error) {
        console.warn("[ServerAuth] Token verification failed:", (error as any)?.message || error);
        return null;
    }
}

/**
 * Enforce that the request must have a valid authenticated user.
 */
export async function requireAuth(request: Request | NextRequest): Promise<{ user: AuthenticatedUser } | { errorResponse: NextResponse }> {
    const user = await getAuthenticatedUser(request);
    if (!user) {
        return {
            errorResponse: NextResponse.json(
                { error: "Akses Ditolak: Anda harus login untuk melakukan tindakan ini (Sesi tidak valid / kedaluwarsa)." },
                { status: 401 }
            )
        };
    }
    return { user };
}

/**
 * Enforce that the request must come from a verified Superadmin.
 */
export async function requireSuperadmin(request: Request | NextRequest): Promise<{ user: AuthenticatedUser } | { errorResponse: NextResponse }> {
    const authResult = await requireAuth(request);
    if ("errorResponse" in authResult) return authResult;

    if (!authResult.user.isSuperadmin) {
        return {
            errorResponse: NextResponse.json(
                { error: "Akses Ditolak: Tindakan ini memerlukan hak akses tingkat Superadmin." },
                { status: 403 }
            )
        };
    }
    return authResult;
}
