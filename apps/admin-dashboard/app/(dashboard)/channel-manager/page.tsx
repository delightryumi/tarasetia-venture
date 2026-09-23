"use client";

import React, { useEffect } from "react";
import { ChannelManagerSection } from "@/components/sections/channel-manager/ChannelManagerSection";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { hasPermission, isUserSuperadmin } from "@/lib/permissionCheck";

export default function ChannelManagerPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const isSuper = isUserSuperadmin(user);
    const canAccessCM = isSuper || (user?.permissions?.["channel-manager"] === true && hasPermission(user, "channel-manager", "module_channel_manager"));

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login?redirect=/channel-manager");
            } else if (!canAccessCM) {
                router.push("/select-module");
            }
        }
    }, [user, loading, router, canAccessCM]);

    if (loading || !user || !canAccessCM) {
        return (
            <div className="flex h-[70vh] w-full items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
        );
    }

    return <ChannelManagerSection />;
}

