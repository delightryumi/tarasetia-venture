"use client";

import React, { useEffect } from "react";
import { ChannelManagerSection } from "@/components/sections/channel-manager/ChannelManagerSection";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ChannelManagerPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login?redirect=/channel-manager");
            } else if (user.role !== "superadmin") {
                router.push("/select-module");
            }
        }
    }, [user, loading, router]);

    if (loading || !user || user.role !== "superadmin") {
        return (
            <div className="flex h-[70vh] w-full items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
        );
    }

    return <ChannelManagerSection />;
}

