"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { ChannelExtranetDesktopView } from "./ChannelExtranetDesktopView";
import { ChannelExtranetMobileView } from "./ChannelExtranetMobileView";
import styles from "./ChannelExtranet.module.css";

interface ChannelExtranetTabProps {
    hotelCode: string;
    hotelName?: string;
    channexEnv: "staging" | "production";
    userEmail?: string;
    onNavigateToTab?: (tab: string) => void;
}

export const ChannelExtranetTab: React.FC<ChannelExtranetTabProps> = ({
    hotelCode,
    hotelName,
    channexEnv,
    userEmail,
    onNavigateToTab
}) => {
    const [iframeUrl, setIframeUrl] = useState<string>("");
    const [loadingIframe, setLoadingIframe] = useState<boolean>(false);
    const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);
    const [authError, setAuthError] = useState<string | null>(null);

    const loadIframeUrl = async () => {
        if (!hotelCode || hotelCode === "0") {
            setAuthError("Kode properti hotel belum dipilih atau tidak valid.");
            return;
        }
        setLoadingIframe(true);
        setAuthError(null);
        setIframeLoaded(false);
        try {
            const res = await fetch("/api/channex/auth-iframe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode,
                    username: userEmail || "Admin Setara"
                })
            });

            const data = await res.json();
            if (data.success && data.iframeUrl) {
                setIframeUrl(data.iframeUrl);
                setAuthError(null);
            } else {
                const errMsg = data.error || "Gagal memuat konsol Channel Mapping Extranet.";
                setAuthError(errMsg);
                toast.error(errMsg);
            }
        } catch (err: any) {
            const errMsg = err?.message || "Gagal menghubungkan ke Channel Distribution Hub.";
            setAuthError(errMsg);
            toast.error(errMsg);
        } finally {
            setLoadingIframe(false);
        }
    };

    useEffect(() => {
        if (!iframeUrl && hotelCode && hotelCode !== "0") {
            loadIframeUrl();
        }
    }, [hotelCode]);

    const handleGoToGolive = () => {
        if (onNavigateToTab) {
            onNavigateToTab("golive");
        } else if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("tab", "golive");
            window.history.replaceState(null, "", url.toString());
            window.dispatchEvent(new CustomEvent("channel-tab-change", { detail: "golive" }));
        }
    };

    const handleGoToMapping = () => {
        if (onNavigateToTab) {
            onNavigateToTab("mapping");
        } else if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("tab", "mapping");
            window.history.replaceState(null, "", url.toString());
            window.dispatchEvent(new CustomEvent("channel-tab-change", { detail: "mapping" }));
        }
    };

    const sharedProps = {
        hotelCode,
        hotelName,
        channexEnv,
        iframeUrl,
        loadingIframe,
        iframeLoaded,
        authError,
        onLoadIframeUrl: loadIframeUrl,
        onIframeLoad: () => setIframeLoaded(true),
        onGoToGolive: handleGoToGolive,
        onGoToMapping: handleGoToMapping
    };

    return (
        <div className={styles.container}>
            <div className={styles.desktopOnly}>
                <ChannelExtranetDesktopView {...sharedProps} />
            </div>
            <div className={styles.mobileOnly}>
                <ChannelExtranetMobileView {...sharedProps} />
            </div>
        </div>
    );
};
