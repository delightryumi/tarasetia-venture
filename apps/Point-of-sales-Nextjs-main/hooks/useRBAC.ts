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
    const userJson = localStorage.getItem('user');
    let currentRole: string | null = null;
    
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        currentRole = user?.role || null;
      } catch (e) {
        console.error('Invalid user session JSON for RBAC');
      }
    }

    setRole(currentRole);

    if (!currentRole) {
      setLoading(false);
      return;
    }

    // superadmin has full access, we can either hardcode it or rely on DB
    if (currentRole === 'superadmin') {
      // Allow all permissions by default for superadmin if DB doesn't respond fast enough
    }

    // 2. Fetch role permissions from Firebase
    const roleId = currentRole.toLowerCase().replace(/\s+/g, '_');
    const roleDocRef = doc(db, 'roles_master', roleId);

    const unsubscribe = onSnapshot(
      roleDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPermissions(data.permissions || {});
        } else {
          setPermissions({});
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching RBAC permissions:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const canAccess = (menuId: string | undefined): boolean => {
    if (!menuId) return true; // If no id is provided, assume it's publicly accessible
    if (role === 'superadmin') return true; // Superadmin always has access
    return !!permissions[menuId];
  };

  return {
    permissions,
    role,
    loading,
    canAccess,
  };
};
