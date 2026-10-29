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

function extractCookieValue(cookieHeader: string | null, name: string): string | null {
    if (!cookieHeader) return null;
    const parts = cookieHeader.split(";");
    for (const part of parts) {
        const [k, ...v] = part.trim().split("=");
        if (k === name && v.length > 0) {
            return decodeURIComponent(v.join("=").trim());
        }
    }
    return null;
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
            const candidate = authHeader.substring(7).trim();
            if (candidate && candidate !== "null" && candidate !== "undefined") {
                token = candidate;
            }
        }

        // Fallback to NextRequest cookies API if available
        if (!token && "cookies" in request && typeof (request as any).cookies?.get === "function") {
            const cookie = (request as any).cookies.get("__session");
            if (cookie?.value) {
                token = cookie.value;
            }
        }

        // Fallback to raw Cookie header for standard Request objects
        if (!token) {
            token = extractCookieValue(request.headers.get("cookie"), "__session");
        }

        if (!token) {
            return null;
        }

        // Check revoked to immediately reject tokens of deleted or revoked users
        const decodedToken = await adminAuth.verifyIdToken(token, true);
        const email = (decodedToken.email || "").toLowerCase();
        let role = (decodedToken.role || "").toLowerCase();
        let hotelCode: string | undefined = decodedToken.hotelCode || undefined;
        let allowedOutlets: string[] | undefined = Array.isArray(decodedToken.allowedOutlets)
            ? decodedToken.allowedOutlets
            : undefined;
        let permissions: Record<string, boolean> | undefined =
            (decodedToken.permissions as Record<string, boolean>) || undefined;

        const masterSuperEmail = (process.env.SUPERADMIN_EMAIL || "superadmin@setara.co.id").toLowerCase();
        let isSuperadmin =
            role === "superadmin" ||
            role === "super_admin" ||
            role === "super admin" ||
            email === masterSuperEmail;

        if (email) {
            try {
                const docId = email.replace(/[@.]/g, "_");
                const snap = await adminDb.doc(`users_master/${docId}`).get();
                if (snap.exists) {
                    const data = snap.data();
                    if (data?.status === "inactive") {
                        return null;
                    }
                    if ((data?.role || "").toLowerCase() === "superadmin" || data?.isSuperadmin === true) {
                        isSuperadmin = true;
                    }
                    if (!role && data?.role) {
                        role = String(data.role).toLowerCase();
                    }
                    if (!hotelCode && data?.hotelCode) {
                        hotelCode = String(data.hotelCode);
                    }
                    if (!allowedOutlets && Array.isArray(data?.allowedOutlets)) {
                        allowedOutlets = data.allowedOutlets;
                    }
                    if (!permissions && data?.permissions && typeof data.permissions === "object") {
                        permissions = data.permissions;
                    }
                } else if (!isSuperadmin && !hotelCode) {
                    // User was deleted from master database and has no hotel claim
                    return null;
                }
            } catch (err) {
                console.warn("[ServerAuth] Fallback users_master check error:", err);
            }
        }

        return {
            uid: decodedToken.uid,
            email,
            role: isSuperadmin ? "superadmin" : (role || "user"),
            hotelCode,
            allowedOutlets,
            permissions,
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

/**
 * Enforce that the authenticated user is authorized to access `targetHotelCode`.
 * Checks custom claims (`hotelCode`, `allowedOutlets`) and falls back to verifying membership in
 * `hotels/{targetHotelCode}/users_master` for the authenticated email.
 */
export async function requireHotelAccess(
    request: Request | NextRequest,
    targetHotelCode?: string | null
): Promise<{ user: AuthenticatedUser } | { errorResponse: NextResponse }> {
    const authResult = await requireAuth(request);
    if ("errorResponse" in authResult) return authResult;

    const { user } = authResult;
    if (user.isSuperadmin) {
        return { user };
    }

    const cleanTarget = (targetHotelCode || "").trim();
    if (!cleanTarget || cleanTarget === "root" || cleanTarget === "0") {
        return {
            errorResponse: NextResponse.json(
                { error: "Akses Ditolak: Kode hotel tidak valid atau memerlukan hak akses Superadmin." },
                { status: 403 }
            )
        };
    }

    if (
        user.hotelCode === cleanTarget ||
        (Array.isArray(user.allowedOutlets) && user.allowedOutlets.includes(cleanTarget))
    ) {
        return { user };
    }

    // Fallback check in hotels/{cleanTarget}/users_master by verified email
    if (user.email) {
        try {
            const docId = user.email.replace(/[@.]/g, "_");
            const hotelUserSnap = await adminDb.doc(`hotels/${cleanTarget}/users_master/${docId}`).get();
            if (hotelUserSnap.exists && hotelUserSnap.data()?.status !== "inactive") {
                return {
                    user: {
                        ...user,
                        hotelCode: cleanTarget,
                        role: hotelUserSnap.data()?.role || user.role,
                        permissions: hotelUserSnap.data()?.permissions || user.permissions
                    }
                };
            }
        } catch (err) {
            console.warn("[ServerAuth] Fallback hotel membership check failed:", err);
        }
    }

    return {
        errorResponse: NextResponse.json(
            { error: "Akses Ditolak: Anda tidak memiliki otorisasi untuk mengakses properti hotel ini." },
            { status: 403 }
        )
    };
}

