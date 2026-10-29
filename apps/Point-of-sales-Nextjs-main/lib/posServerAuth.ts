import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { db as clientDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface PosAuthResult {
  authorized: boolean;
  status: number;
  error?: string;
  hotelCode: string;
  uid?: string;
  email?: string;
  name?: string;
  role?: string;
}

export interface VerifyPosAuthOptions {
  body?: Record<string, any> | null;
  requiredPermissions?: string[];
}

function sanitizeHotelCode(raw: string | null | undefined): string {
  if (!raw) return '';
  return String(raw).trim().replace(/[^a-zA-Z0-9_\-]/g, '');
}

function emailToDocId(email: string): string {
  return email.toLowerCase().trim().replace(/[@.]/g, '_');
}

async function fetchUserMasterDoc(hotelCode: string, docId: string): Promise<Record<string, any> | null> {
  // 1. Try Firebase Admin Firestore first
  try {
    if (hotelCode && hotelCode !== '0') {
      const hotelUserSnap = await adminDb
        .collection('hotels')
        .doc(hotelCode)
        .collection('users_master')
        .doc(docId)
        .get();
      if (hotelUserSnap.exists) {
        return hotelUserSnap.data() || null;
      }
    }
    const rootUserSnap = await adminDb.collection('users_master').doc(docId).get();
    if (rootUserSnap.exists) {
      return rootUserSnap.data() || null;
    }
  } catch {
    // Fallback to client Firestore SDK if Admin SDK credentials are not configured in local environment
    try {
      if (hotelCode && hotelCode !== '0') {
        const hotelSnap = await getDoc(doc(clientDb, 'hotels', hotelCode, 'users_master', docId));
        if (hotelSnap.exists()) {
          return hotelSnap.data() || null;
        }
      }
      const rootSnap = await getDoc(doc(clientDb, 'users_master', docId));
      if (rootSnap.exists()) {
        return rootSnap.data() || null;
      }
    } catch (clientErr) {
      console.error('Error reading users_master in posServerAuth:', clientErr);
    }
  }
  return null;
}

export async function verifyPosApiRequest(
  request: NextRequest,
  options?: VerifyPosAuthOptions
): Promise<PosAuthResult> {
  const { searchParams } = new URL(request.url);
  const rawHotelCode =
    request.headers.get('x-hotel-code') ||
    request.cookies.get('hotelCode')?.value ||
    options?.body?.hotelCode ||
    searchParams.get('hotelCode') ||
    process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE ||
    '';

  const hotelCode = sanitizeHotelCode(rawHotelCode);
  if (!hotelCode || hotelCode === '0') {
    return {
      authorized: false,
      status: 400,
      error: 'Hotel Code is missing or invalid',
      hotelCode: '',
    };
  }

  // Extract bearer token or __session cookie
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const sessionCookie = request.cookies.get('__session')?.value
    ? decodeURIComponent(request.cookies.get('__session')!.value)
    : '';
  const token = bearerToken || sessionCookie;

  let verifiedEmail = '';
  let verifiedUid = '';
  let tokenRole = '';
  let tokenHotelCode = '';
  let tokenVerified = false;

  // Path A: Verify Firebase Auth ID Token via adminAuth
  if (token) {
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      verifiedUid = decoded.uid;
      verifiedEmail = (decoded.email || '').toLowerCase().trim();
      tokenRole = String((decoded as any).role || '').toLowerCase().trim();
      tokenHotelCode = sanitizeHotelCode((decoded as any).hotelCode);
      tokenVerified = true;
    } catch (err) {
      console.warn('POS token verification via adminAuth failed, checking users_master fallback:', err);
    }
  }

  // Determine candidate email/uid from verified token or request headers/body
  const callerEmail = (
    verifiedEmail ||
    request.headers.get('x-user-email') ||
    options?.body?.requesterEmail ||
    options?.body?.cashierEmail ||
    ''
  )
    .toLowerCase()
    .trim();

  const callerUid = (
    verifiedUid ||
    request.headers.get('x-user-id') ||
    options?.body?.requesterId ||
    ''
  ).trim();

  if (!tokenVerified && !callerEmail && !callerUid) {
    return {
      authorized: false,
      status: 401,
      error: 'Unauthorized: Missing authentication token or user credentials',
      hotelCode,
    };
  }

  // Path B: Verify user record in Firestore users_master (hotels/{hotelCode}/users_master or root users_master)
  let userMasterData: Record<string, any> | null = null;
  if (callerEmail) {
    userMasterData = await fetchUserMasterDoc(hotelCode, emailToDocId(callerEmail));
  }
  if (!userMasterData && callerUid) {
    userMasterData = await fetchUserMasterDoc(hotelCode, callerUid);
  }

  // If token was cryptographically verified by Firebase Admin Auth with custom claims:
  if (tokenVerified && !userMasterData) {
    const isSuper = tokenRole === 'superadmin' || tokenRole === 'super admin';
    if (isSuper || (tokenHotelCode && tokenHotelCode === hotelCode)) {
      return {
        authorized: true,
        status: 200,
        hotelCode,
        uid: verifiedUid,
        email: verifiedEmail,
        role: tokenRole || 'admin',
      };
    }
    return {
      authorized: false,
      status: 403,
      error: 'Forbidden: User is not authorized for this hotel tenant',
      hotelCode,
    };
  }

  if (!userMasterData) {
    return {
      authorized: false,
      status: 403,
      error: 'Forbidden: User not found in hotel users_master registry',
      hotelCode,
    };
  }

  const realRole = String(userMasterData.role || 'WORKER').toLowerCase().trim();
  const isSuperOrAdmin =
    realRole === 'superadmin' ||
    realRole === 'super admin' ||
    realRole === 'admin' ||
    realRole === 'manager';

  // Ensure tenant isolation unless superadmin
  const userHotelCode = sanitizeHotelCode(userMasterData.hotelCode);
  if (
    realRole !== 'superadmin' &&
    realRole !== 'super admin' &&
    userHotelCode &&
    userHotelCode !== hotelCode
  ) {
    return {
      authorized: false,
      status: 403,
      error: 'Forbidden: Cross-tenant access denied',
      hotelCode,
    };
  }

  // Check optional granular permission requirements
  if (!isSuperOrAdmin && options?.requiredPermissions && options.requiredPermissions.length > 0) {
    const perms = userMasterData.permissions || {};
    const hasRequired = options.requiredPermissions.some((perm) => Boolean(perms[perm]));
    if (!hasRequired) {
      return {
        authorized: false,
        status: 403,
        error: 'Forbidden: Insufficient POS permissions for this action',
        hotelCode,
      };
    }
  }

  return {
    authorized: true,
    status: 200,
    hotelCode,
    uid: callerUid || userMasterData.uid || emailToDocId(callerEmail),
    email: callerEmail || userMasterData.email || '',
    name: userMasterData.displayName || userMasterData.name || callerEmail,
    role: realRole,
  };
}

export function unauthorizedResponse(authResult: PosAuthResult) {
  return NextResponse.json(
    { error: authResult.error || 'Unauthorized' },
    { status: authResult.status || 401 }
  );
}
