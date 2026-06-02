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
      const urlParams = new URLSearchParams(window.location.search);
      const userParam = urlParams.get('user');
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

      if (!userEmail) {
        setLoading(false);
        return;
      }

    // 2. Fetch user-specific permissions from Firebase
    const userDocId = userEmail.toLowerCase().replace(/[@.]/g, '_');
    const userDocRef = doc(db, 'users_master', userDocId);

    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
        console.log('Fetched permissions from Firestore:', data.permissions);
        setPermissions(data.permissions || {});

        } else {
          setPermissions({});
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
    if (role && (role.toLowerCase() === 'superadmin' || role.toLowerCase() === 'super admin')) return true; // Superadmin always has access
    return !!permissions[menuId];
  };

  return {
    permissions,
    role,
    loading,
    canAccess,
  };
};
