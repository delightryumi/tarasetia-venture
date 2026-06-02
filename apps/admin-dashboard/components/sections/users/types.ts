import React from "react";

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions?: Record<string, boolean>;
}

export interface RolePermission {
    id: string;
    label: string;
    permissions: Record<string, boolean>;
}

export interface MenuItem {
    id: string;
    label: string;
    icon: React.ReactNode;
}
