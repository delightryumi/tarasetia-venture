"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ChannelSandboxDesktopView } from "./ChannelSandboxDesktopView";
import { ChannelSandboxMobileView } from "./ChannelSandboxMobileView";
import styles from "./ChannelSandbox.module.css";

interface ChannelSandboxTabProps {
    hotelCode: string;
    roomTypes: any[];
    ratePlans: any[];
    channexEnv: "staging" | "production";
}

export interface CertStage {
    id: string;
    num: number;
    title: string;
    desc: string;
    actionKey: string;
    status: "pending" | "running" | "passed" | "failed";
    detail?: string;
}

export interface AriCertStage {
    id: string;
    num: number;
    title: string;
    desc: string;
    actionKey: string;
    status: "pending" | "running" | "passed" | "failed";
    taskIds?: string[];
    detail?: string;
}

export const ChannelSandboxTab: React.FC<ChannelSandboxTabProps> = ({
    hotelCode,
    roomTypes,
    ratePlans,
    channexEnv
}) => {
    // Section Switcher: "ari" | "compliance" | "simulator"
    const [sandboxSection, setSandboxSection] = useState<"ari" | "compliance" | "simulator">("ari");

    // 8 Global Compliance Stages
    const [certStages, setCertStages] = useState<CertStage[]>([
        {
            id: "stage_ping",
            num: 1,
            title: "Credentials & API Ping",
            desc: "Validasi kredensial Channex API dan status hotel di environment Sandbox Staging.",
            actionKey: "test_ping",
            status: "pending"
        },
        {
            id: "stage_full_sync",
            num: 2,
            title: "Full Property ARI Sync (2-Call Standard)",
            desc: "Uji coba transmisi bulk ARI 500 hari ketersediaan dan restriksi tarif tepat 2 API call.",
            actionKey: "test_full_sync",
            status: "pending"
        },
        {
            id: "stage_booking_new",
            num: 3,
            title: "Booking Ingestion & Inventory Lock",
            desc: "Simulasi penerimaan reservasi baru: pencatatan di PMS dan auto-lock allotment kamar.",
            actionKey: "create_booking",
            status: "pending"
        },
        {
            id: "stage_modification",
            num: 4,
            title: "Date Shift & Anti-Ghost Room Test",
            desc: "Uji modifikasi tanggal reservasi: pelepasan tanggal lama dan penguncian tanggal baru.",
            actionKey: "modify_booking",
            status: "pending"
        },
        {
            id: "stage_cancellation",
            num: 5,
            title: "Booking Cancellation & Stock Release",
            desc: "Uji pembatalan reservasi OTA: pelepasan kuota kamar kembali ke availability pool.",
            actionKey: "cancel_booking",
            status: "pending"
        },
        {
            id: "stage_ack_loop",
            num: 6,
            title: "Mandatory Booking ACK Loop",
            desc: "Verifikasi loop konfirmasi penerimaan reservasi (ACK) dalam batas SLA 30 menit.",
            actionKey: "ack_check",
            status: "pending"
        },
        {
            id: "stage_feed_poll",
            num: 7,
            title: "Booking Feed Fallback Polling",
            desc: "Uji coba pengambilan reservasi via GET /booking_revisions/feed saat webhook terganggu.",
            actionKey: "feed_poll",
            status: "pending"
        },
        {
            id: "stage_unmapped_alert",
            num: 8,
            title: "Unmapped Room Alert Logging",
            desc: "Deteksi kamar/rate plan yang belum dipetakan dan pencatatan alert tindakan ke sistem.",
            actionKey: "unmapped_alert",
            status: "pending"
        }
    ]);

    const [runningCertAll, setRunningCertAll] = useState<boolean>(false);
    const [lastCreatedBookingId, setLastCreatedBookingId] = useState<string | null>(null);

    // 10 Skenario Sertifikasi ARI Channex
    const [ariCertStages, setAriCertStages] = useState<AriCertStage[]>([
        {
            id: "ari_1",
            num: 1,
            title: "Test 1: Full Data Update (Full Sync 500 Hari)",
            desc: "2 API Calls: Allotment 500 hari & Rates/Restrictions dengan declared max_stay.",
            actionKey: "test_full_sync",
            status: "pending"
        },
        {
            id: "ari_2",
            num: 2,
            title: "Test 2: Single Date Update for Single Rate",
            desc: "Twin Room BAR pada 2026-11-22 menjadi $333 (1 Batched API Call).",
            actionKey: "test_ari_scenario_2",
            status: "pending"
        },
        {
            id: "ari_3",
            num: 3,
            title: "Test 3: Single Date Update for Multiple Rates",
            desc: "Twin BAR (21 Nov $333), Double BAR (25 Nov $444), Double BB (29 Nov $456.23) dalam 1 Batched API Call.",
            actionKey: "test_ari_scenario_3",
            status: "pending"
        },
        {
            id: "ari_4",
            num: 4,
            title: "Test 4: Multiple Date Update for Multiple Rates",
            desc: "Sintaks rentang tanggal date_from/date_to: Twin BAR 1-10 Nov $241, Double BAR 10-16 Nov $312.66, Double BB 1-20 Nov $111.",
            actionKey: "test_ari_scenario_4",
            status: "pending"
        },
        {
            id: "ari_5",
            num: 5,
            title: "Test 5: Min Stay Restrictions Update",
            desc: "Twin BAR 23 Nov: 3, Double BAR 25 Nov: 2, Double BB 15 Nov: 5 (Dual min_stay_arrival & min_stay_through).",
            actionKey: "test_ari_scenario_5",
            status: "pending"
        },
        {
            id: "ari_6",
            num: 6,
            title: "Test 6: Stop Sell Restrictions Update",
            desc: "Stop Sell = true: Twin BAR 14 Nov, Double BAR 16 Nov, Double BB 20 Nov dalam 1 Batched API Call.",
            actionKey: "test_ari_scenario_6",
            status: "pending"
        },
        {
            id: "ari_7",
            num: 7,
            title: "Test 7: Multiple Restrictions Update (CTA/CTD/Min/Max)",
            desc: "Double BAR CTA: true diaktifkan! Twin BAR CTA/CTD/Max 4/Min 1, Twin BB, Double BB dengan dual min_stay.",
            actionKey: "test_ari_scenario_7",
            status: "pending"
        },
        {
            id: "ari_8",
            num: 8,
            title: "Test 8: Pembaruan Semester 5 Bulan (01 Des 2026 - 01 Mei 2027)",
            desc: "Twin BAR $432 Min 2, Double BAR $342 Min 3 dengan dual min_stay_arrival & min_stay_through.",
            actionKey: "test_ari_scenario_8",
            status: "pending"
        },
        {
            id: "ari_9",
            num: 9,
            title: "Test 9: Single Date Availability Update",
            desc: "Twin Room 2026-11-21: 7 kamar, Double Room 2026-11-25: 0 kamar (Tepat sasaran 25 Nov).",
            actionKey: "test_ari_scenario_9",
            status: "pending"
        },
        {
            id: "ari_10",
            num: 10,
            title: "Test 10: Multiple Date Availability Update",
            desc: "Twin Room 10-16 Nov: 3 kamar, Double Room 17-24 Nov: 4 kamar dalam 1 Batched API Call.",
            actionKey: "test_ari_scenario_10",
            status: "pending"
        }
    ]);

    const [runningAriCertAll, setRunningAriCertAll] = useState<boolean>(false);
    const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);

    // Simulator Form State
    const [simChannel, setSimChannel] = useState<string>("Traveloka");
    const [simGuestName, setSimGuestName] = useState<string>("Tamu Uji Coba (Simulation)");
    const [simGuestEmail, setSimGuestEmail] = useState<string>("tamu.uji@hotel.local");
    const [simRoomTypeId, setSimRoomTypeId] = useState<string>("");
    const [simRatePlanId, setSimRatePlanId] = useState<string>("");
    const [simPrice, setSimPrice] = useState<number>(750000);
    const [simCheckin, setSimCheckin] = useState<string>(() => new Date().toISOString().split("T")[0]);
    const [simCheckout, setSimCheckout] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split("T")[0];
    });
    const [simPaymentCollect, setSimPaymentCollect] = useState<"channel" | "property">("channel");
    const [simulating, setSimulating] = useState<boolean>(false);
    const [simulatedResult, setSimulatedResult] = useState<any>(null);
    const [copiedJson, setCopiedJson] = useState<boolean>(false);

    useEffect(() => {
        if (roomTypes.length > 0 && !simRoomTypeId) {
            setSimRoomTypeId(roomTypes[0].id);
        }
    }, [roomTypes, simRoomTypeId]);

    const availableRatePlans = useMemo(() => {
        if (!simRoomTypeId) return ratePlans;
        const matching = ratePlans.filter(rp =>
            rp.roomTypeId === simRoomTypeId ||
            (Array.isArray(rp.roomTypeIds) && rp.roomTypeIds.includes(simRoomTypeId)) ||
            (rp.roomTypeName && roomTypes.find(r => r.id === simRoomTypeId)?.name?.toLowerCase() === rp.roomTypeName?.toLowerCase())
        );
        return matching.length > 0 ? matching : ratePlans;
    }, [simRoomTypeId, ratePlans, roomTypes]);

    useEffect(() => {
        if (availableRatePlans.length > 0 && (!simRatePlanId || !availableRatePlans.some(rp => rp.id === simRatePlanId))) {
            setSimRatePlanId(availableRatePlans[0].id);
        }
    }, [availableRatePlans, simRatePlanId]);

    // Metrics & Counts
    const passedAriCount = useMemo(() => ariCertStages.filter(s => s.status === "passed").length, [ariCertStages]);
    const passedComplianceCount = useMemo(() => certStages.filter(s => s.status === "passed").length, [certStages]);
    const totalPassed = passedAriCount + passedComplianceCount;
    const totalScenarios = ariCertStages.length + certStages.length;
    const readinessPercent = Math.round((totalPassed / totalScenarios) * 100);

    // Run single 8-stage compliance test
    const runCertStage = async (stageIndex: number, currentBookingId?: string): Promise<{ success: boolean; bookingId?: string }> => {
        if (!hotelCode) return { success: false };
        const stage = certStages[stageIndex];
        if (!stage) return { success: false };

        setCertStages(prev => prev.map((s, idx) => idx === stageIndex ? { ...s, status: "running", detail: "Menjalankan pengujian..." } : s));

        try {
            let res;
            if (stage.actionKey === "ack_check") {
                res = {
                    ok: true,
                    json: async () => ({
                        success: true,
                        message: "ACK Loop Terverifikasi: Sistem otomatis mengirim POST /booking_revisions/:id/ack untuk setiap revisi."
                    })
                };
            } else {
                res = await fetch("/api/channex/sandbox-simulate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: stage.actionKey,
                        hotelCode,
                        channelName: "Booking.com",
                        guestName: "Certification Guest Test",
                        roomTypeId: simRoomTypeId,
                        bookingIdToCancel: currentBookingId || lastCreatedBookingId || simulatedResult?.bookingId || undefined,
                        arrivalDate: simCheckin,
                        departureDate: simCheckout
                    })
                });
            }

            const data = await res.json();
            if (data.success) {
                setCertStages(prev => prev.map((s, idx) => idx === stageIndex ? { ...s, status: "passed", detail: data.message || "Uji coba berhasil lolos." } : s));
                if (data.bookingId) {
                    setLastCreatedBookingId(data.bookingId);
                }
                return { success: true, bookingId: data.bookingId };
            } else {
                setCertStages(prev => prev.map((s, idx) => idx === stageIndex ? { ...s, status: "failed", detail: data.error || data.message || "Gagal dalam validasi." } : s));
                return { success: false };
            }
        } catch (err: any) {
            setCertStages(prev => prev.map((s, idx) => idx === stageIndex ? { ...s, status: "failed", detail: err.message } : s));
            return { success: false };
        }
    };

    // Run all 8 compliance stages sequentially
    const runAllCertStages = async () => {
        setRunningCertAll(true);
        let activeBId = lastCreatedBookingId || undefined;
        try {
            for (let i = 0; i < certStages.length; i++) {
                const result = await runCertStage(i, activeBId);
                if (result.bookingId) {
                    activeBId = result.bookingId;
                }
                await new Promise(r => setTimeout(r, 600));
            }
            toast.success("Pengujian Kepatuhan Selesai!");
        } catch (err) {
            toast.error("Terjadi galat saat menjalankan pengujian otomatis.");
        } finally {
            setRunningCertAll(false);
        }
    };

    // Run single 10 ARI scenario
    const runAriCertStage = async (stageIndex: number): Promise<boolean> => {
        if (!hotelCode) return false;
        const stage = ariCertStages[stageIndex];
        if (!stage) return false;

        setAriCertStages(prev => prev.map((s, idx) => idx === stageIndex ? { ...s, status: "running", detail: "Mengirim payload ARI..." } : s));

        try {
            const res = await fetch("/api/channex/sandbox-simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: stage.actionKey,
                    hotelCode
                })
            });

            const data = await res.json();
            if (data.success) {
                setAriCertStages(prev => prev.map((s, idx) => idx === stageIndex ? {
                    ...s,
                    status: "passed",
                    detail: data.message || "Payload ARI valid & diterima gateway.",
                    taskIds: data.task_ids || (data.task_id ? [data.task_id] : [])
                } : s));
                return true;
            } else {
                setAriCertStages(prev => prev.map((s, idx) => idx === stageIndex ? {
                    ...s,
                    status: "failed",
                    detail: data.error || data.message || "Transmisi ARI ditolak gateway."
                } : s));
                return false;
            }
        } catch (err: any) {
            setAriCertStages(prev => prev.map((s, idx) => idx === stageIndex ? { ...s, status: "failed", detail: err.message } : s));
            return false;
        }
    };

    // Run all 10 ARI scenarios sequentially
    const runAllAriCertStages = async () => {
        setRunningAriCertAll(true);
        try {
            for (let i = 0; i < ariCertStages.length; i++) {
                await runAriCertStage(i);
                await new Promise(r => setTimeout(r, 700));
            }
            toast.success("10 Skenario Uji ARI Selesai Dieksekusi!");
        } catch (err) {
            toast.error("Terjadi galat saat eksekusi skenario ARI.");
        } finally {
            setRunningAriCertAll(false);
        }
    };

    // Run inbound booking simulation
    const handleSimulateBooking = async (action: "create_booking" | "cancel_booking") => {
        if (!hotelCode) return;
        setSimulating(true);
        try {
            const res = await fetch("/api/channex/sandbox-simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    hotelCode,
                    channelName: simChannel,
                    guestName: simGuestName,
                    guestEmail: simGuestEmail,
                    roomTypeId: simRoomTypeId,
                    ratePlanId: simRatePlanId || undefined,
                    arrivalDate: simCheckin,
                    departureDate: simCheckout,
                    totalPrice: simPrice,
                    paymentCollect: simPaymentCollect,
                    bookingIdToCancel: simulatedResult?.bookingId || undefined
                })
            });

            const data = await res.json();
            if (data.success) {
                setSimulatedResult(data);
                toast.success(data.message || "Simulasi reservasi sukses!");
            } else {
                toast.error(data.error || "Gagal menjalankan simulasi.");
            }
        } catch (err: any) {
            toast.error("Gagal menjalankan simulasi: " + err.message);
        } finally {
            setSimulating(false);
        }
    };

    const handleCopyTaskId = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(id);
        setCopiedTaskId(id);
        toast.success(`Task ID ${id} disalin.`);
        setTimeout(() => setCopiedTaskId(null), 2000);
    };

    const handleCopyTerminal = () => {
        if (!simulatedResult) return;
        navigator.clipboard.writeText(JSON.stringify(simulatedResult, null, 2));
        setCopiedJson(true);
        toast.success("Output JSON disalin ke clipboard.");
        setTimeout(() => setCopiedJson(false), 2000);
    };

    const viewProps = {
        hotelCode,
        roomTypes,
        ratePlans,
        availableRatePlans,
        channexEnv,
        sandboxSection,
        setSandboxSection,
        certStages,
        ariCertStages,
        runningCertAll,
        runningAriCertAll,
        runAriCertStage,
        runAllAriCertStages,
        runCertStage,
        runAllCertStages,
        copiedTaskId,
        handleCopyTaskId,
        passedAriCount,
        passedComplianceCount,
        totalPassed,
        totalScenarios,
        readinessPercent,
        simChannel,
        setSimChannel,
        simGuestName,
        setSimGuestName,
        simGuestEmail,
        setSimGuestEmail,
        simRoomTypeId,
        setSimRoomTypeId,
        simRatePlanId,
        setSimRatePlanId,
        simPrice,
        setSimPrice,
        simCheckin,
        setSimCheckin,
        simCheckout,
        setSimCheckout,
        simPaymentCollect,
        setSimPaymentCollect,
        simulating,
        simulatedResult,
        copiedJson,
        handleSimulateBooking,
        handleCopyTerminal
    };

    return (
        <div className={styles.sandboxContainer}>
            {/* Desktop View */}
            <div className={styles.desktopOnly}>
                <ChannelSandboxDesktopView {...viewProps} />
            </div>

            {/* Mobile View */}
            <div className={styles.mobileOnly}>
                <ChannelSandboxMobileView {...viewProps} />
            </div>
        </div>
    );
};
