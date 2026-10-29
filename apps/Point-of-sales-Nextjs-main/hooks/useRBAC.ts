import { useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface RolePermissions {
  [menuId: string]: boolean;
}

export const useRBAC = () => {
  const [permissions, setPermissions] = useState<RolePermissions>({});
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let userJson = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

    if (typeof window !== 'undefined') {
      let hashParams = new URLSearchParams();
      if (window.location.hash) {
        hashParams = new URLSearchParams(window.location.hash.substring(1));
      }
      const urlParams = new URLSearchParams(window.location.search);
      const userParam = hashParams.get('user') || urlParams.get('user');
      if (userParam) {
        userJson = userParam;
      }
    }

    let userEmail: string | null = null;
    let userId: string | null = null;
    let hotelCode = '';

    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        userEmail = user?.email || null;
        userId = user?.id || user?.uid || null;
        hotelCode = user?.hotelCode || '';
      } catch (e) {
        console.error('Invalid user session JSON for RBAC');
      }
    }

    if (!hotelCode && typeof window !== 'undefined') {
      hotelCode = localStorage.getItem('active_hotel_code') || localStorage.getItem('hotelCode') || '';
    }

    if (!userEmail) {
      setRole(null);
      setPermissions({});
      setLoading(false);
      return;
    }

    const syncLocalUserRole = (verifiedRole: string | null) => {
      if (typeof window === 'undefined') return;
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.role !== verifiedRole) {
            parsed.role = verifiedRole || 'WORKER';
            localStorage.setItem('user', JSON.stringify(parsed));
          }
        }
      } catch {}
    };

    const userDocId = userEmail.toLowerCase().replace(/[@.]/g, '_');

    const checkRootUsersMaster = async (): Promise<{ exists: boolean; role: string | null; permissions: RolePermissions }> => {
      try {
        const rootEmailSnap = await getDoc(doc(db, 'users_master', userDocId));
        if (rootEmailSnap.exists()) {
          const d = rootEmailSnap.data();
          return {
            exists: true,
            role: d.role || null,
            permissions: d.permissions || {},
          };
        }
        if (userId) {
          const rootUidSnap = await getDoc(doc(db, 'users_master', String(userId)));
          if (rootUidSnap.exists()) {
            const d = rootUidSnap.data();
            return {
              exists: true,
              role: d.role || null,
              permissions: d.permissions || {},
            };
          }
        }
      } catch (err) {
        console.error('Error checking root users_master in useRBAC:', err);
      }
      return { exists: false, role: null, permissions: {} };
    };

    // When hotelCode is missing or "0" (e.g., superadmin without hotel preview), still verify against root users_master
    if (!hotelCode || hotelCode === '0') {
      let active = true;
      checkRootUsersMaster().then((res) => {
        if (!active) return;
        if (res.exists) {
          setRole(res.role);
          setPermissions(res.permissions);
          syncLocalUserRole(res.role);
          localStorage.setItem(`permissions_${userEmail}`, JSON.stringify(res.permissions));
        } else {
          setRole(null);
          setPermissions({});
          syncLocalUserRole(null);
          localStorage.removeItem(`permissions_${userEmail}`);
        }
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }

    // Always verify against Firestore (do NOT return early for admin/superadmin in localStorage)
    const userDocRef = doc(db, `hotels/${hotelCode}/users_master`, userDocId);

    const unsubscribe = onSnapshot(
      userDocRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const verifiedRole = data.role || 'WORKER';
          const newPermissions = data.permissions || {};
          setRole(verifiedRole);
          setPermissions(newPermissions);
          syncLocalUserRole(verifiedRole);
          localStorage.setItem(`permissions_${userEmail}`, JSON.stringify(newPermissions));
          setLoading(false);
        } else {
          // Fallback: check root users_master (e.g. for verified superadmin or global admin)
          const rootRes = await checkRootUsersMaster();
          if (rootRes.exists) {
            setRole(rootRes.role);
            setPermissions(rootRes.permissions);
            syncLocalUserRole(rootRes.role);
            localStorage.setItem(`permissions_${userEmail}`, JSON.stringify(rootRes.permissions));
          } else {
            // User does not exist in Firestore — revoke forged role & permissions
            setRole(null);
            setPermissions({});
            syncLocalUserRole(null);
            localStorage.setItem(`permissions_${userEmail}`, JSON.stringify({}));
          }
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error fetching user permissions:', error);
        setRole(null);
        setPermissions({});
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const canAccess = (menuId: string | undefined): boolean => {
    if (!menuId) return true;
    if (role && (role.toLowerCase() === 'superadmin' || role.toLowerCase() === 'super admin' || role.toLowerCase() === 'admin')) {
      return true;
    }
    return !!permissions[menuId];
  };

  return {
    permissions,
    role,
    loading,
    canAccess,
  };
};
