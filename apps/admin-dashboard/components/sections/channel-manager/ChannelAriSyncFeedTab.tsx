"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ChannelAriSyncFeedDesktopView } from "./ChannelAriSyncFeedDesktopView";
import { ChannelAriSyncFeedMobileView } from "./ChannelAriSyncFeedMobileView";
import styles from "./ChannelAriSyncFeed.module.css";

export interface LogItem {
    id: string;
    time: string;
    status: string;
    message: string;
    action?: string;
    channelName?: string;
    taskId?: string;
    execution_time_ms?: number | null;
}

interface ChannelAriSyncFeedTabProps {
    hotelCode: string;
    syncingAri: boolean;
    onSyncAllAri: () => Promise<void>;
    syncLog: Array<{ time: string; status: string; message: string }>;
    onNavigateToLogs?: () => void;
}

export const ChannelAriSyncFeedTab: React.FC<ChannelAriSyncFeedTabProps> = ({
    hotelCode,
    syncingAri,
    onSyncAllAri,
    syncLog,
    onNavigateToLogs
}) => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<"ALL" | "SUCCESS" | "ERROR">("ALL");
    const [remoteLogs, setRemoteLogs] = useState<LogItem[]>([]);
    const [fetchingLogs, setFetchingLogs] = useState<boolean>(false);
    const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);

    const fetchRemoteLogs = async (showToast: boolean = false) => {
        if (!hotelCode || hotelCode === "0") return;
        setFetchingLogs(true);
        try {
            const res = await fetch(`/api/channex/tasks?hotelCode=${encodeURIComponent(hotelCode)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.logs)) {
                    const mapped: LogItem[] = data.logs.map((t: any) => ({
                        id: t.id || t.task_id || Math.random().toString(),
                        time: t.inserted_at ? new Date(t.inserted_at).toLocaleTimeString() : new Date().toLocaleTimeString(),
                        status:
                            t.status === "SUCCESS" || t.result === "Success"
                                ? "SUCCESS"
                                : t.status === "FAILED" || t.result === "Failed"
                                ? "ERROR"
                                : t.status || "SUCCESS",
                        message: t.message || `Transmisi ${t.action || "ARI"} ke ${t.channelName || "saluran OTA"} selesai diproses.`,
                        action: t.action || "Sync ARI",
                        channelName: t.channelName || "OTA Channels",
                        taskId: t.task_id || (Array.isArray(t.task_ids) ? t.task_ids[0] : undefined),
                        execution_time_ms: t.execution_time_ms
                    }));
                    setRemoteLogs(mapped);
                    if (showToast) {
                        toast.success("Feed antrian ARI berhasil diperbarui.");
                    }
                }
            }
        } catch (err: any) {
            console.warn("[ChannelAriSyncFeedTab] Error fetching remote logs:", err);
            if (showToast) {
                toast.error("Gagal menyinkronkan feed aktivitas remote.");
            }
        } finally {
            setFetchingLogs(false);
        }
    };

    useEffect(() => {
        fetchRemoteLogs(false);
    }, [hotelCode]);

    // Combine in-memory session logs with remote logs
    const combinedLogs = useMemo<LogItem[]>(() => {
        const sessionMapped: LogItem[] = (syncLog || []).map((s, idx) => ({
            id: `session-${idx}-${s.time}`,
            time: s.time,
            status: s.status,
            message: s.message,
            action: s.message.includes("Full Sync") ? "Full Property Sync" : "Sync ARI Transmisi",
            channelName: "Live Stream"
        }));

        const existingMessages = new Set(sessionMapped.map(s => s.message));
        const filteredRemote = remoteLogs.filter(r => !existingMessages.has(r.message));
        return [...sessionMapped, ...filteredRemote];
    }, [syncLog, remoteLogs]);

    const filteredLogs = useMemo(() => {
        return combinedLogs.filter(log => {
            const matchesStatus =
                filterStatus === "ALL" ? true :
                filterStatus === "SUCCESS" ? log.status === "SUCCESS" :
                filterStatus === "ERROR" ? log.status === "ERROR" : true;

            const q = searchTerm.trim().toLowerCase();
            const matchesSearch = q === "" ? true :
                log.message.toLowerCase().includes(q) ||
                (log.action && log.action.toLowerCase().includes(q)) ||
                (log.channelName && log.channelName.toLowerCase().includes(q)) ||
                (log.taskId && log.taskId.toLowerCase().includes(q)) ||
                log.status.toLowerCase().includes(q);

            return matchesStatus && matchesSearch;
        });
    }, [combinedLogs, filterStatus, searchTerm]);

    const successCount = useMemo(() => combinedLogs.filter(l => l.status === "SUCCESS").length, [combinedLogs]);
    const errorCount = useMemo(() => combinedLogs.filter(l => l.status === "ERROR").length, [combinedLogs]);
    const successRate = useMemo(() => {
        if (combinedLogs.length === 0) return 100;
        return Math.round((successCount / combinedLogs.length) * 100);
    }, [combinedLogs, successCount]);

    const avgLatency = useMemo(() => {
        const latencies = combinedLogs
            .map(l => l.execution_time_ms)
            .filter((ms): ms is number => typeof ms === "number" && ms > 0);
        if (latencies.length === 0) return 120;
        const sum = latencies.reduce((a, b) => a + b, 0);
        return Math.round(sum / latencies.length);
    }, [combinedLogs]);

    const handleCopyTaskId = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(id);
        setCopiedTaskId(id);
        toast.success(`Task ID ${id} disalin.`);
        setTimeout(() => setCopiedTaskId(null), 2000);
    };

    const handleTriggerPush = async () => {
        await onSyncAllAri();
        await fetchRemoteLogs(false);
    };

    const viewProps = {
        hotelCode,
        syncingAri,
        onSyncAllAri,
        syncLog,
        onNavigateToLogs,
        filteredLogs,
        combinedLogs,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        fetchingLogs,
        fetchRemoteLogs,
        copiedTaskId,
        handleCopyTaskId,
        successCount,
        errorCount,
        successRate,
        avgLatency,
        handleTriggerPush
    };

    return (
        <div className={styles.syncContainer}>
            {/* Desktop View */}
            <div className={styles.desktopOnly}>
                <ChannelAriSyncFeedDesktopView {...viewProps} />
            </div>

            {/* Mobile View */}
            <div className={styles.mobileOnly}>
                <ChannelAriSyncFeedMobileView {...viewProps} />
            </div>
        </div>
    );
};
