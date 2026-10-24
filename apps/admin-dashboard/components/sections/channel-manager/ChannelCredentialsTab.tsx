"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ChannelCredentialsDesktopView, ReadinessCheckItem } from "./ChannelCredentialsDesktopView";
import { ChannelCredentialsMobileView } from "./ChannelCredentialsMobileView";
import styles from "./ChannelCredentials.module.css";

interface ChannelCredentialsTabProps {
    hotelCode: string;
    hotelName?: string;
    channexEnv: "staging" | "production";
    setChannexEnv: (env: "staging" | "production") => void;
    channexApiKey: string;
    setChannexApiKey: (key: string) => void;
    channexWebhookSecret: string;
    setChannexWebhookSecret: (secret: string) => void;
    channexPropertyId: string;
    setChannexPropertyId: (id: string) => void;
    hotelCurrency: string;
    setHotelCurrency: (curr: string) => void;
    savingSettings: boolean;
    onSave: () => Promise<void>;
    onSyncMasterToChannex?: () => Promise<void>;
    syncingMaster?: boolean;
    onUnlinkProperty?: () => void;
    onNavigateToTab?: (tab: string) => void;
}

export const ChannelCredentialsTab: React.FC<ChannelCredentialsTabProps> = ({
    hotelCode,
    hotelName,
    channexEnv,
    setChannexEnv,
    channexApiKey,
    setChannexApiKey,
    channexWebhookSecret,
    setChannexWebhookSecret,
    channexPropertyId,
    setChannexPropertyId,
    hotelCurrency,
    setHotelCurrency,
    savingSettings,
    onSave,
    onSyncMasterToChannex,
    syncingMaster,
    onUnlinkProperty,
    onNavigateToTab
}) => {
    const [showApiKey, setShowApiKey] = useState<boolean>(false);
    const [showWebhookSecret, setShowWebhookSecret] = useState<boolean>(false);
    const [webhookRegistrationStatus, setWebhookRegistrationStatus] = useState<{
        isRegistered: boolean;
        webhookId?: string;
        webhookUrl?: string;
        webhookRegisteredAt?: string;
    } | null>(null);
    const [registeringWebhook, setRegisteringWebhook] = useState<boolean>(false);
    const [checkingWebhookStatus, setCheckingWebhookStatus] = useState<boolean>(false);

    // Live Connection Test State
    const [testingConnection, setTestingConnection] = useState<boolean>(false);
    const [connectionStatus, setConnectionStatus] = useState<{
        tested: boolean;
        success: boolean;
        latencyMs?: number;
        message?: string;
    }>({ tested: false, success: false });

    const copyText = (txt: string, label: string) => {
        if (!txt) return;
        navigator.clipboard.writeText(txt);
        toast.success(`${label} disalin ke clipboard.`);
    };

    // Check webhook status from Channex via GET /api/channex/register-webhook
    const checkWebhookStatus = async () => {
        if (!hotelCode || hotelCode === "0") return;
        setCheckingWebhookStatus(true);
        try {
            const res = await fetch(`/api/channex/register-webhook?hotelCode=${encodeURIComponent(hotelCode)}`);
            const data = await res.json();
            if (data && data.isRegistered) {
                setWebhookRegistrationStatus({
                    isRegistered: true,
                    webhookId: data.webhookId,
                    webhookUrl: data.webhookUrl,
                    webhookRegisteredAt: data.webhookRegisteredAt
                });
            } else {
                setWebhookRegistrationStatus({
                    isRegistered: false
                });
            }
        } catch (err: any) {
            console.warn("Error checking webhook status:", err);
            setWebhookRegistrationStatus(null);
        } finally {
            setCheckingWebhookStatus(false);
        }
    };

    useEffect(() => {
        if (hotelCode && hotelCode !== "0") {
            checkWebhookStatus();
        }
    }, [hotelCode, channexPropertyId]);

    const webhookEndpointUrl = typeof window !== "undefined"
        ? `${window.location.origin}/api/channex/webhook`
        : "https://tara.crs-setara.com/api/channex/webhook";

    // 1-Click Webhook Registration via POST /api/channex/register-webhook
    const handleRegisterWebhook = async () => {
        if (!hotelCode || hotelCode === "0") return;
        if (!channexApiKey) {
            toast.warning("Masukkan API Key terlebih dahulu sebelum mendaftarkan webhook.");
            return;
        }
        if (!channexWebhookSecret) {
            toast.warning("Masukkan Webhook Secret terlebih dahulu sebelum mendaftarkan webhook.");
            return;
        }

        setRegisteringWebhook(true);
        const toastId = toast.loading("Mendaftarkan webhook ke Channex...");
        try {
            const res = await fetch("/api/channex/register-webhook", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode,
                    apiKey: channexApiKey,
                    env: channexEnv,
                    webhookSecret: channexWebhookSecret,
                    webhookUrl: webhookEndpointUrl
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "Webhook berhasil didaftarkan ke Channex!", { id: toastId });
                setWebhookRegistrationStatus({
                    isRegistered: true,
                    webhookId: data.webhookId,
                    webhookUrl: data.webhookUrl,
                    webhookRegisteredAt: new Date().toISOString()
                });
            } else {
                toast.error(data.error || "Gagal mendaftarkan webhook.", { id: toastId });
            }
        } catch (err: any) {
            toast.error("Gagal mendaftarkan webhook: " + err.message, { id: toastId });
        } finally {
            setRegisteringWebhook(false);
        }
    };

    // Live Gateway Connection Ping
    const handleTestConnection = async () => {
        if (!hotelCode || hotelCode === "0") return;
        if (!channexPropertyId) {
            toast.warning("Masukkan Property ID atau klik Auto-Register terlebih dahulu.");
            return;
        }
        setTestingConnection(true);
        const toastId = toast.loading("Menguji koneksi server Channex...");
        try {
            const res = await fetch("/api/channex/ping", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode,
                    type: "property"
                })
            });
            const data = await res.json();
            if (data.success) {
                setConnectionStatus({
                    tested: true,
                    success: true,
                    latencyMs: data.latencyMs,
                    message: data.message
                });
                toast.success(data.message || `Koneksi Channex berhasil terverifikasi! (${data.latencyMs}ms)`, { id: toastId });
            } else {
                setConnectionStatus({
                    tested: true,
                    success: false,
                    latencyMs: data.latencyMs,
                    message: data.message
                });
                toast.error(data.message || "Koneksi Channex gagal diverifikasi.", { id: toastId });
            }
        } catch (err: any) {
            setConnectionStatus({
                tested: true,
                success: false,
                message: err.message
            });
            toast.error("Gagal menghubungi server Channex: " + err.message, { id: toastId });
        } finally {
            setTestingConnection(false);
        }
    };

    // Go-Live Pre-Flight Readiness Matrix
    const readinessChecks: ReadinessCheckItem[] = useMemo(() => [
        {
            id: "api_key",
            label: "Channex API Key",
            desc: channexApiKey && channexApiKey.trim().length > 10
                ? "API Key telah dikonfigurasi dan tersimpan"
                : "Belum diisi. Dapatkan API Key dari portal Channex.",
            passed: !!channexApiKey && channexApiKey.trim().length > 10,
            badge: channexApiKey && channexApiKey.trim().length > 10 ? "Terkonfigurasi" : "Wajib Diisi"
        },
        {
            id: "property_guid",
            label: "Property GUID",
            desc: channexPropertyId && channexPropertyId.trim().length >= 32
                ? `Tertaut ke UUID: ${channexPropertyId.slice(0, 8)}...`
                : "Belum tertaut. Klik tombol Auto-Register untuk membuat otomatis.",
            passed: !!channexPropertyId && channexPropertyId.trim().length >= 32,
            badge: channexPropertyId && channexPropertyId.trim().length >= 32 ? "Tertaut" : "Belum Tertaut"
        },
        {
            id: "webhook_secret",
            label: "HMAC Webhook Secret",
            desc: channexWebhookSecret && channexWebhookSecret.trim().length > 6
                ? "Secret key validasi signature reservasi aktif"
                : "Belum diisi. Diperlukan untuk verifikasi keaslian payload OTA.",
            passed: !!channexWebhookSecret && channexWebhookSecret.trim().length > 6,
            badge: channexWebhookSecret && channexWebhookSecret.trim().length > 6 ? "Aktif" : "Belum Diisi"
        },
        {
            id: "webhook_registered",
            label: "Pendaftaran Webhook Callback",
            desc: webhookRegistrationStatus?.isRegistered
                ? `Aktif di Channex (ID: ${webhookRegistrationStatus.webhookId ? webhookRegistrationStatus.webhookId.slice(0, 8) + '...' : 'Registered'})`
                : "Belum terdaftar. Klik tombol 1-Click Register Webhook.",
            passed: !!webhookRegistrationStatus?.isRegistered,
            badge: webhookRegistrationStatus?.isRegistered ? "Terdaftar" : "Belum Terdaftar"
        },
        {
            id: "base_currency",
            label: "Mata Uang Dasar CRS",
            desc: `Standar tarif dasar PMS: ${hotelCurrency || "IDR"}`,
            passed: !!hotelCurrency,
            badge: hotelCurrency || "IDR"
        }
    ], [channexApiKey, channexPropertyId, channexWebhookSecret, webhookRegistrationStatus, hotelCurrency]);

    const passedCount = useMemo(() => readinessChecks.filter(c => c.passed).length, [readinessChecks]);
    const readinessScore = useMemo(() => Math.round((passedCount / readinessChecks.length) * 100), [passedCount, readinessChecks.length]);

    const viewProps = {
        hotelCode,
        hotelName,
        channexEnv,
        setChannexEnv,
        channexApiKey,
        setChannexApiKey,
        channexWebhookSecret,
        setChannexWebhookSecret,
        channexPropertyId,
        setChannexPropertyId,
        hotelCurrency,
        setHotelCurrency,
        savingSettings,
        onSave,
        onSyncMasterToChannex,
        syncingMaster,
        onUnlinkProperty,
        onNavigateToTab,
        showApiKey,
        setShowApiKey,
        showWebhookSecret,
        setShowWebhookSecret,
        webhookRegistrationStatus,
        registeringWebhook,
        checkingWebhookStatus,
        handleRegisterWebhook,
        webhookEndpointUrl,
        copyText,
        testingConnection,
        connectionStatus,
        handleTestConnection,
        readinessChecks,
        readinessScore,
        passedCount
    };

    return (
        <div className={styles.credentialsContainer}>
            {/* Desktop View */}
            <div className={styles.desktopOnly}>
                <ChannelCredentialsDesktopView {...viewProps} />
            </div>

            {/* Mobile View */}
            <div className={styles.mobileOnly}>
                <ChannelCredentialsMobileView {...viewProps} />
            </div>
        </div>
    );
};
