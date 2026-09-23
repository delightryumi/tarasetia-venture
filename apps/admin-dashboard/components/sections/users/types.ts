import React from "react";

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: string;
    hotelCode?: string;
    allowedOutlets?: string[];
    permissions?: Record<string, boolean>;
    isOwner?: boolean;
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
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

export interface UserActivityLog {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    hotelCode: string;
    action: string; // e.g. "LOGIN", "CREATE_USER", "UPDATE_PERMISSIONS", "VOID_TRANSACTION"
    module: string; // e.g. "USERS", "FRONT_OFFICE", "POS", "CHANNEL_MANAGER"
    description: string;
    ipAddress?: string;
    deviceInfo?: string;
    timestamp: string;
}

export interface DeviceSession {
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    hotelCode: string;
    deviceType: "desktop" | "mobile" | "tablet";
    os: string;
    browser: string;
    ipAddress: string;
    userAgent?: string;
    lastActive: string;
    isCurrent?: boolean;
    status: "active" | "revoked";
}
