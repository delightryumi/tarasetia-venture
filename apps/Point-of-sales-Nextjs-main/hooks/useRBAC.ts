import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface RolePermissions {
  [menuId: string]: boolean;
}

export const useRBAC = () => {
  const [permissions, setPermissions] = useState<RolePermissions>({});
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // 1. Get user role from localStorage
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

    let currentRole: string | null = null;
    let userEmail: string | null = null;
    
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        currentRole = user?.role || null;
        userEmail = user?.email || null;
      } catch (e) {
        console.error('Invalid user session JSON for RBAC');
      }
    }

      setRole(currentRole);
      console.log('RBAC role set to:', currentRole);
      console.log('RBAC user email:', userEmail);

      let hotelCode = "1";
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          hotelCode = user?.hotelCode || "1";
        } catch (e) {}
      }

      if (!userEmail) {
        setLoading(false);
        return;
      }

      // Check cache for instant loading
      try {
        const cached = localStorage.getItem(`permissions_${userEmail}`);
        if (cached) {
          setPermissions(JSON.parse(cached));
          setLoading(false);
        }
      } catch (e) {}

      if (currentRole && (currentRole.toLowerCase() === 'superadmin' || currentRole.toLowerCase() === 'super admin' || currentRole.toLowerCase() === 'admin')) {
        setLoading(false);
      }

    // 2. Fetch user-specific permissions from Firebase
    const userDocId = userEmail.toLowerCase().replace(/[@.]/g, '_');
    const userDocRef = doc(db, `hotels/${hotelCode}/users_master`, userDocId);

    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const newPermissions = data.permissions || {};
          setPermissions(newPermissions);
          localStorage.setItem(`permissions_${userEmail}`, JSON.stringify(newPermissions));
        } else {
          setPermissions({});
          // Store empty permissions in cache to prevent slow load next time
          localStorage.setItem(`permissions_${userEmail}`, JSON.stringify({}));
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching user permissions:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const canAccess = (menuId: string | undefined): boolean => {
    if (!menuId) return true; // If no id is provided, assume it's publicly accessible
    if (role && (role.toLowerCase() === 'superadmin' || role.toLowerCase() === 'super admin' || role.toLowerCase() === 'admin')) return true; // Superadmin and admin always have access
    return !!permissions[menuId];
  };

  return {
    permissions,
    role,
    loading,
    canAccess,
  };
};
