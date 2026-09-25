"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

import { playChimeSound } from "@/lib/notifications/sound";

export function usePushNotifications(hotelCode: string, userEmail?: string) {
    const [isSupported, setIsSupported] = useState<boolean>(false);
    const [permission, setPermission] = useState<NotificationPermission>("default");
    const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [testing, setTesting] = useState<boolean>(false);

    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
            setIsSupported(true);
            setPermission(Notification.permission);

            // Proactively register SW if not yet registered
            navigator.serviceWorker.getRegistration().then(existing => {
                if (!existing) {
                    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(console.warn);
                }
            }).catch(console.warn);

            navigator.serviceWorker.ready.then(reg => {
                reg.pushManager.getSubscription().then(sub => {
                    setIsSubscribed(!!sub);
                });
            }).catch(console.warn);
        }
    }, []);

    const subscribeToPush = useCallback(async () => {
        if (!isSupported) {
            toast.error("Browser ini tidak mendukung Web Push Notification.");
            return false;
        }

        setLoading(true);
        try {
            // 1. Ensure ServiceWorker is registered and active
            let reg = await navigator.serviceWorker.getRegistration();
            if (!reg) {
                reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
            }
            await navigator.serviceWorker.ready;

            // 2. Request OS / Browser notification permission
            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm !== "granted") {
                toast.warning("Izin notifikasi ditolak. Silakan izinkan di pengaturan browser / ponsel Anda.");
                setLoading(false);
                return false;
            }

            // 3. Fetch VAPID public key from backend
            const keyRes = await fetch("/api/notifications/subscribe");
            const keyData = await keyRes.json();
            if (!keyData.success || !keyData.publicKey) {
                throw new Error("Gagal mengambil VAPID Public Key.");
            }

            const applicationServerKey = urlBase64ToUint8Array(keyData.publicKey);

            // 4. Register subscription with ServiceWorker
            const swReg = await navigator.serviceWorker.ready;
            let sub = await swReg.pushManager.getSubscription();

            if (!sub) {
                sub = await swReg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey
                });
            }

            // 5. Save subscription to hotel database
            const saveRes = await fetch("/api/notifications/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode,
                    subscription: sub,
                    userAgent: navigator.userAgent,
                    userEmail: userEmail || "staff"
                })
            });

            if (saveRes.ok) {
                setIsSubscribed(true);
                // Play celebratory bell sound
                playChimeSound("new_booking");
                toast.success("Notifikasi Layar & Suara Reservasi Berhasil Diaktifkan di Perangkat Ini!");
                return true;
            } else {
                throw new Error("Gagal menyimpan pendaftaran notifikasi ke server.");
            }
        } catch (err: any) {
            console.error("[usePushNotifications] Subscription error:", err);
            toast.error(`Gagal mengaktifkan notifikasi: ${err.message}`);
            return false;
        } finally {
            setLoading(false);
        }
    }, [hotelCode, isSupported, userEmail]);

    const unsubscribeFromPush = useCallback(async () => {
        setLoading(true);
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                await fetch(`/api/notifications/subscribe?hotelCode=${encodeURIComponent(hotelCode)}&endpoint=${encodeURIComponent(sub.endpoint)}`, {
                    method: "DELETE"
                });
                await sub.unsubscribe();
            }
            setIsSubscribed(false);
            toast.info("Notifikasi push dinonaktifkan di perangkat ini.");
        } catch (err: any) {
            toast.error(`Gagal menonaktifkan notifikasi: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [hotelCode]);

    const sendTestPush = useCallback(async (type: "booking_new" | "booking_cancelled" = "booking_new") => {
        setTesting(true);
        // Play local bell chime immediately for instant audio verification
        playChimeSound(type === "booking_cancelled" ? "cancellation" : "new_booking");

        try {
            const res = await fetch("/api/notifications/send-test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode,
                    type,
                    guestName: type === "booking_new" ? "Budi Santoso" : "Siti Rahma",
                    roomName: "Deluxe King Room #204",
                    otaName: type === "booking_new" ? "Booking.com" : "Traveloka"
                })
            });

            const data = await res.json();
            if (data.success) {
                if (data.sentCount > 0) {
                    toast.success(`Tes suara & notifikasi ${type === "booking_new" ? "Booking Baru" : "Pembatalan"} berhasil dikirim ke perangkat Anda!`);
                } else {
                    toast.info(`🔔 Bunyi bel notifikasi dimainkan! Aktifkan "Enable Push Notifications" jika ingin pop-up muncul saat browser tertutup.`);
                }
            } else {
                toast.info("🔔 Bunyi bel notifikasi dimainkan secara lokal.");
            }
        } catch (err: any) {
            toast.info(`🔔 Bunyi bel notifikasi dimainkan secara lokal.`);
        } finally {
            setTesting(false);
        }
    }, [hotelCode]);

    return {
        isSupported,
        permission,
        isSubscribed,
        loading,
        testing,
        subscribeToPush,
        unsubscribeFromPush,
        sendTestPush
    };
}
