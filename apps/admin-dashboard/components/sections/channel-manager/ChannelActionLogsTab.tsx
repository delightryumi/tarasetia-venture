"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ChannelActionLogsDesktopView } from "./ChannelActionLogsDesktopView";
import { ChannelActionLogsMobileView } from "./ChannelActionLogsMobileView";
import styles from "./ChannelActionLogs.module.css";

export interface ChannelTaskLog {
    id: string;
    task_id?: string;
    task_ids?: string[];
    action: string;
    task_type?: string;
    channelName: string;
    channelCode?: string;
    user: string;
    started_at: string;
    inserted_at: string;
    execution_time_ms?: number | null;
    result: "Success" | "Failed" | "Warning" | string;
    status: string;
    reason?: string;
    message?: string;
    diff?: any;
    details?: any;
    payload?: any;
    response?: any;
    ota_responses?: any[];
    timeline?: any[];
    is_live_synced?: boolean;
}

interface ChannelActionLogsTabProps {
    hotelCode: string;
}

export function ChannelActionLogsTab({ hotelCode }: ChannelActionLogsTabProps) {
    const [logs, setLogs] = useState<ChannelTaskLog[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [cleaningLogs, setCleaningLogs] = useState<boolean>(false);
    const [retentionDays, setRetentionDays] = useState<number>(60); // 60 days standard

    // Filters
    const [actionFilter, setActionFilter] = useState<string>("all");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [resultFilter, setResultFilter] = useState<string>("all");
    const [channelFilter, setChannelFilter] = useState<string>("all");

    // Pagination
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(6);

    // Drawer modal state & tabs
    const [selectedEvent, setSelectedEvent] = useState<ChannelTaskLog | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<"diff" | "payload" | "ota" | "response">("diff");
    const [fetchingLiveTask, setFetchingLiveTask] = useState<boolean>(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Modals for Purge & Single Delete
    const [isPurgeModalOpen, setIsPurgeModalOpen] = useState<boolean>(false);
    const [purgeMode, setPurgeMode] = useState<"all" | "obsolete">("obsolete");
    const [logToDelete, setLogToDelete] = useState<ChannelTaskLog | null>(null);
    const [deletingSingleLog, setDeletingSingleLog] = useState<boolean>(false);

    // Keyboard accessibility: Close modals on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (isPurgeModalOpen && !cleaningLogs) setIsPurgeModalOpen(false);
                if (logToDelete && !deletingSingleLog) setLogToDelete(null);
                if (selectedEvent) setSelectedEvent(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isPurgeModalOpen, cleaningLogs, logToDelete, deletingSingleLog, selectedEvent]);

    const handleCopy = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(label);
        toast.success(`${label} disalin ke clipboard!`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleFetchLiveTask = async (taskIdToFetch: string) => {
        if (!taskIdToFetch || !hotelCode) return;
        setFetchingLiveTask(true);
        try {
            const res = await fetch(`/api/channex/tasks?hotelCode=${encodeURIComponent(hotelCode)}&taskId=${encodeURIComponent(taskIdToFetch)}`);
            const data = await res.json();
            if (data.success && data.task) {
                setSelectedEvent(prev => prev ? ({
                    ...prev,
                    ...data.task,
                    is_live_synced: true
                }) : null);
                toast.success("Live task data synced from Channex API");
            } else {
                toast.error(data.error || "Could not retrieve live task from Channex");
            }
        } catch (err: any) {
            toast.error(`Sync error: ${err.message}`);
        } finally {
            setFetchingLiveTask(false);
        }
    };

    const fetchLogs = async () => {
        if (!hotelCode) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/channex/tasks?hotelCode=${encodeURIComponent(hotelCode)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.logs)) {
                    setLogs(data.logs);
                }
                if (data.retentionDays) {
                    setRetentionDays(data.retentionDays);
                }
            }
        } catch (err: any) {
            console.warn("[ChannelActionLogs] Could not load task logs:", err?.message || err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [hotelCode]);

    // Handle Retention Policy Change
    const handleRetentionChange = async (days: number) => {
        setRetentionDays(days);
        try {
            const res = await fetch("/api/channex/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode,
                    action: "set_retention",
                    retentionDays: days
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Kebijakan retensi diperbarui ke ${days} hari (~${Math.round(days / 30)} bulan).`);
                fetchLogs();
            } else {
                toast.error(data.error || "Gagal memperbarui kebijakan retensi");
            }
        } catch (err: any) {
            toast.error(`Error: ${err.message}`);
        }
    };

    // Execute Purge
    const handleExecutePurge = async () => {
        setCleaningLogs(true);
        const toastId = toast.loading(purgeMode === "all" ? "Membersihkan seluruh riwayat log..." : `Membersihkan log lebih dari ${retentionDays} hari...`);
        try {
            const url = purgeMode === "all"
                ? `/api/channex/tasks?hotelCode=${encodeURIComponent(hotelCode)}&purgeAll=true`
                : `/api/channex/tasks?hotelCode=${encodeURIComponent(hotelCode)}&retentionDays=${retentionDays}`;

            const res = await fetch(url, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "Log berhasil dibersihkan.", { id: toastId });
                setIsPurgeModalOpen(false);
                await fetchLogs();
            } else {
                toast.error(data.error || "Gagal membersihkan log", { id: toastId });
            }
        } catch (err: any) {
            toast.error(`Error: ${err.message}`, { id: toastId });
        } finally {
            setCleaningLogs(false);
        }
    };

    // Execute Single Log Deletion
    const handleExecuteDeleteSingle = async () => {
        if (!logToDelete) return;
        setDeletingSingleLog(true);
        const toastId = toast.loading("Menghapus log event...");
        try {
            const res = await fetch(`/api/channex/tasks?hotelCode=${encodeURIComponent(hotelCode)}&logId=${encodeURIComponent(logToDelete.id)}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "Log event berhasil dihapus.", { id: toastId });
                if (selectedEvent?.id === logToDelete.id) {
                    setSelectedEvent(null);
                }
                setLogToDelete(null);
                await fetchLogs();
            } else {
                toast.error(data.error || "Gagal menghapus log", { id: toastId });
            }
        } catch (err: any) {
            toast.error(`Error: ${err.message}`, { id: toastId });
        } finally {
            setDeletingSingleLog(false);
        }
    };

    // Distinct channel names for filter
    const channelNames = useMemo(() => {
        const set = new Set<string>();
        logs.forEach(l => {
            if (l.channelName) set.add(l.channelName);
        });
        return Array.from(set);
    }, [logs]);

    // Distinct action types
    const actionTypes = useMemo(() => {
        const set = new Set<string>();
        logs.forEach(l => {
            if (l.action) set.add(l.action);
        });
        return Array.from(set);
    }, [logs]);

    // Filtered logs
    const filteredLogs = useMemo(() => {
        return logs.filter(item => {
            if (actionFilter !== "all" && item.action !== actionFilter) return false;
            if (resultFilter !== "all" && item.result.toLowerCase() !== resultFilter.toLowerCase()) return false;
            if (channelFilter !== "all" && item.channelName !== channelFilter) return false;

            if (startDate) {
                const itemDate = (item.started_at || item.inserted_at).slice(0, 10);
                if (itemDate < startDate) return false;
            }
            if (endDate) {
                const itemDate = (item.started_at || item.inserted_at).slice(0, 10);
                if (itemDate > endDate) return false;
            }

            return true;
        });
    }, [logs, actionFilter, resultFilter, channelFilter, startDate, endDate]);

    // Paginated logs
    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
    const paginatedLogs = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredLogs.slice(start, start + pageSize);
    }, [filteredLogs, page, pageSize]);

    // Formatters
    const formatTimestamp = (ts?: string) => {
        if (!ts) return "-";
        try {
            const d = new Date(ts);
            const pad = (n: number) => String(n).padStart(2, "0");
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        } catch {
            return ts;
        }
    };

    const formatTimestampWithMs = (ts?: string) => {
        if (!ts) return "-";
        try {
            const d = new Date(ts);
            const pad = (n: number) => String(n).padStart(2, "0");
            const ms = String(d.getMilliseconds()).padStart(3, "0");
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}:${ms}`;
        } catch {
            return ts;
        }
    };

    // Telemetry stats
    const successCount = useMemo(() => logs.filter(l => l.result?.toLowerCase() === "success").length, [logs]);
    const successRate = useMemo(() => logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 100, [successCount, logs.length]);

    const avgLatency = useMemo(() => {
        const withLatency = logs.filter(l => typeof l.execution_time_ms === "number" && l.execution_time_ms > 0);
        if (withLatency.length === 0) return 0;
        const total = withLatency.reduce((acc, curr) => acc + (curr.execution_time_ms || 0), 0);
        return Math.round(total / withLatency.length);
    }, [logs]);

    const viewProps = {
        hotelCode,
        logs,
        filteredLogs,
        paginatedLogs,
        loading,
        cleaningLogs,
        retentionDays,
        handleRetentionChange,
        handleExecutePurge,
        isPurgeModalOpen,
        setIsPurgeModalOpen,
        purgeMode,
        setPurgeMode,
        logToDelete,
        setLogToDelete,
        handleExecuteDeleteSingle,
        deletingSingleLog,
        actionFilter,
        setActionFilter,
        actionTypes,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        resultFilter,
        setResultFilter,
        channelFilter,
        setChannelFilter,
        channelNames,
        page,
        setPage,
        pageSize,
        setPageSize,
        totalPages,
        selectedEvent,
        setSelectedEvent,
        activeDetailTab,
        setActiveDetailTab,
        fetchingLiveTask,
        handleFetchLiveTask,
        copiedField,
        handleCopy,
        fetchLogs,
        formatTimestamp,
        formatTimestampWithMs,
        successRate,
        avgLatency
    };

    return (
        <div className={styles.logsContainer}>
            {/* Desktop View */}
            <div className={styles.desktopOnly}>
                <ChannelActionLogsDesktopView {...viewProps} />
            </div>

            {/* Mobile View */}
            <div className={styles.mobileOnly}>
                <ChannelActionLogsMobileView {...viewProps} />
            </div>
        </div>
    );
}
