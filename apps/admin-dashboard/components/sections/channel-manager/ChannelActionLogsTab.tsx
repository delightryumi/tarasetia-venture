"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
    RefreshCw, 
    X, 
    ChevronLeft, 
    ChevronRight, 
    ArrowUpDown,
    Trash2,
    ShieldCheck,
    Copy,
    Check,
    Code2,
    Layers,
    GitCompare,
    Globe,
    CheckCircle2,
    AlertCircle,
    Clock
} from "lucide-react";
import { toast } from "sonner";
import { ChannelNotificationWidget } from "./ChannelNotificationWidget";
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

interface Props {
    hotelCode: string;
}

export function ChannelActionLogsTab({ hotelCode }: Props) {
    const [logs, setLogs] = useState<ChannelTaskLog[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [cleaningLogs, setCleaningLogs] = useState<boolean>(false);
    const [retentionDays, setRetentionDays] = useState<number>(60); // 60 days = 2 months default

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

    const handleCopy = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(label);
        toast.success(`${label} copied to clipboard!`);
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

    // Handle Retention Policy Change (2 or 3 months)
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
                toast.success(`Retention policy updated to ${days} days (~${Math.round(days / 30)} months). ${data.purgedCount ? `Purged ${data.purgedCount} obsolete logs.` : "All logs retained."}`);
                fetchLogs();
            } else {
                toast.error(data.error || "Failed to update retention policy");
            }
        } catch (err: any) {
            toast.error(`Error: ${err.message}`);
        }
    };

    // Manual Purge of Old Logs
    const handleManualPurge = async () => {
        if (!confirm(`Purge all task logs older than ${retentionDays} days (~${Math.round(retentionDays / 30)} months)?`)) {
            return;
        }

        setCleaningLogs(true);
        try {
            const res = await fetch(`/api/channex/tasks?hotelCode=${encodeURIComponent(hotelCode)}&retentionDays=${retentionDays}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || `Successfully purged ${data.deletedCount} obsolete logs.`);
                fetchLogs();
            } else {
                toast.error(data.error || "Failed to purge obsolete logs");
            }
        } catch (err: any) {
            toast.error(`Error: ${err.message}`);
        } finally {
            setCleaningLogs(false);
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

    // Helper to render git-style diff lines matching Channex Screenshot 4
    const renderDiffLines = (diff: any, selectedEvent: ChannelTaskLog) => {
        if (Array.isArray(diff)) {
            // Already structured diff line array
            return diff.map((line: any, idx: number) => {
                const isAdd = line.type === "add" || line.sign === "+";
                const isDel = line.type === "remove" || line.type === "del" || line.sign === "-";
                return (
                    <div 
                        key={idx} 
                        className={`${styles.diffLine} ${isAdd ? styles.diffLineAdd : isDel ? styles.diffLineDel : ""}`}
                    >
                        <span className={styles.diffColNum}>{line.oldLine || (isDel ? idx + 1 : "")}</span>
                        <span className={styles.diffColNum}>{line.newLine || (isAdd ? idx + 1 : !isDel ? idx + 1 : "")}</span>
                        <span className={styles.diffSign}>{isAdd ? "+" : isDel ? "-" : " "}</span>
                        <span className={styles.diffText}>{line.text}</span>
                    </div>
                );
            });
        }

        if (diff && typeof diff === "object") {
            const entries = Object.entries(diff);
            return (
                <div>
                    <div className={styles.diffLine}>
                        <span className={styles.diffColNum}>1</span>
                        <span className={styles.diffColNum}>1</span>
                        <span className={styles.diffSign}> </span>
                        <span className={styles.diffText}>&#123;</span>
                    </div>
                    {entries.map(([key, change]: [string, any], idx) => {
                        const oldVal = change?.old !== undefined ? JSON.stringify(change.old) : null;
                        const newVal = change?.new !== undefined ? JSON.stringify(change.new) : JSON.stringify(change);
                        return (
                            <React.Fragment key={key}>
                                {oldVal !== null && (
                                    <div className={`${styles.diffLine} ${styles.diffLineDel}`}>
                                        <span className={styles.diffColNum}>{idx + 2}</span>
                                        <span className={styles.diffColNum}></span>
                                        <span className={styles.diffSign}>-</span>
                                        <span className={styles.diffText}>  &quot;{key}&quot;: {oldVal},</span>
                                    </div>
                                )}
                                <div className={`${styles.diffLine} ${styles.diffLineAdd}`}>
                                    <span className={styles.diffColNum}></span>
                                    <span className={styles.diffColNum}>{idx + 2}</span>
                                    <span className={styles.diffSign}>+</span>
                                    <span className={styles.diffText}>  &quot;{key}&quot;: {newVal},</span>
                                </div>
                            </React.Fragment>
                        );
                    })}
                    <div className={styles.diffLine}>
                        <span className={styles.diffColNum}>{entries.length + 2}</span>
                        <span className={styles.diffColNum}>{entries.length + 2}</span>
                        <span className={styles.diffSign}> </span>
                        <span className={styles.diffText}>&#125;</span>
                    </div>
                </div>
            );
        }

        if (selectedEvent.details) {
            return (
                <div style={{ padding: "12px", background: "#f8fafc", color: "#0f172a" }}>
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: "11px", fontFamily: "var(--font-mono-jb, monospace)" }}>
                        {typeof selectedEvent.details === "string" 
                            ? selectedEvent.details 
                            : JSON.stringify(selectedEvent.details, null, 2)}
                    </pre>
                </div>
            );
        }

        // Fallback standard diff view
        return (
            <div>
                <div className={styles.diffLine}>
                    <span className={styles.diffColNum}>1</span>
                    <span className={styles.diffColNum}>1</span>
                    <span className={styles.diffSign}> </span>
                    <span className={styles.diffText}>&#123;</span>
                </div>
                <div className={styles.diffLine}>
                    <span className={styles.diffColNum}>2</span>
                    <span className={styles.diffColNum}>2</span>
                    <span className={styles.diffSign}> </span>
                    <span className={styles.diffText}>  &quot;event&quot;: &quot;{selectedEvent.action}&quot;,</span>
                </div>
                <div className={styles.diffLine}>
                    <span className={styles.diffColNum}>3</span>
                    <span className={styles.diffColNum}>3</span>
                    <span className={styles.diffSign}> </span>
                    <span className={styles.diffText}>  &quot;channel&quot;: &quot;{selectedEvent.channelName}&quot;,</span>
                </div>
                <div className={styles.diffLine}>
                    <span className={styles.diffColNum}>4</span>
                    <span className={styles.diffColNum}>4</span>
                    <span className={styles.diffSign}> </span>
                    <span className={styles.diffText}>  &quot;user&quot;: &quot;{selectedEvent.user}&quot;,</span>
                </div>
                <div className={styles.diffLine}>
                    <span className={styles.diffColNum}>5</span>
                    <span className={styles.diffColNum}>5</span>
                    <span className={styles.diffSign}> </span>
                    <span className={styles.diffText}>  &quot;status&quot;: &quot;{selectedEvent.status}&quot;,</span>
                </div>
                <div className={styles.diffLine}>
                    <span className={styles.diffColNum}>6</span>
                    <span className={styles.diffColNum}>6</span>
                    <span className={styles.diffSign}> </span>
                    <span className={styles.diffText}>  &quot;timestamp&quot;: &quot;{selectedEvent.inserted_at}&quot;</span>
                </div>
                <div className={styles.diffLine}>
                    <span className={styles.diffColNum}>7</span>
                    <span className={styles.diffColNum}>7</span>
                    <span className={styles.diffSign}> </span>
                    <span className={styles.diffText}>&#125;</span>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.container}>
            {/* Header matching Channex Channel Events */}
            <div className={styles.eventsHeader}>
                <div className={styles.titleArea}>
                    <h2 className={styles.mainTitle}>Channel Events</h2>
                    <span className={styles.channelPill}>
                        <span className={styles.channelDot} />
                        <span>{channelNames.length > 0 ? channelNames[0] : "MyTara Open Channel"}</span>
                    </span>
                </div>

                {/* Auto-Delete & Retention Badge */}
                <div className={styles.retentionBadge} title="Automatic log purge active">
                    <span className={styles.retentionDot} />
                    <span>Auto-Purge Active (Logs &gt; {retentionDays} Days / ~{Math.round(retentionDays / 30)} Months)</span>
                </div>
            </div>

            {/* PWA Push Notification System (Lockscreen Alerts & Mobile Sound Notifications) */}
            <ChannelNotificationWidget hotelCode={hotelCode} />

            {/* Retention & Database Optimization Bar */}
            <div className={styles.retentionBar}>
                <div className={styles.retentionLeft}>
                    <span className={styles.retentionTitle}>
                        <ShieldCheck size={16} color="#059669" />
                        <span>Log Retention:</span>
                    </span>
                    <select
                        value={retentionDays}
                        onChange={e => handleRetentionChange(Number(e.target.value))}
                        className={styles.retentionSelect}
                        title="Configure automatic log purge threshold"
                    >
                        <option value={30}>Keep 30 Days (1 Month)</option>
                        <option value={60}>Keep 60 Days (2 Months) - Standard</option>
                        <option value={90}>Keep 90 Days (3 Months) - Recommended</option>
                    </select>
                    <span style={{ color: "#64748b", fontSize: "11px" }}>
                        Logs older than {retentionDays} days are automatically purged to optimize storage quota.
                    </span>
                </div>

                <button
                    type="button"
                    onClick={handleManualPurge}
                    disabled={cleaningLogs}
                    className={styles.btnCleanLogs}
                    title="Purge obsolete logs immediately"
                >
                    <Trash2 size={13} className={cleaningLogs ? "animate-spin" : ""} />
                    <span>{cleaningLogs ? "Purging..." : "Purge Obsolete Logs Now"}</span>
                </button>
            </div>

            {/* Filter Bar matching Channex UI */}
            <div className={styles.filterBar}>
                <div className={styles.filterInputs}>
                    {/* Action Filter */}
                    <select
                        value={actionFilter}
                        onChange={e => {
                            setActionFilter(e.target.value);
                            setPage(1);
                        }}
                        className={styles.filterSelect}
                        style={{ minWidth: "180px" }}
                    >
                        <option value="all">Action (All)</option>
                        {actionTypes.map(act => (
                            <option key={act} value={act}>{act}</option>
                        ))}
                    </select>

                    {/* Date Range */}
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => {
                                setStartDate(e.target.value);
                                setPage(1);
                            }}
                            className={styles.filterDateInput}
                            placeholder="Start date"
                            title="Start Date"
                        />
                        <span style={{ color: "#94a3b8", fontSize: "12px" }}>→</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => {
                                setEndDate(e.target.value);
                                setPage(1);
                            }}
                            className={styles.filterDateInput}
                            placeholder="End date"
                            title="End Date"
                        />
                    </div>

                    {/* Result Filter */}
                    <select
                        value={resultFilter}
                        onChange={e => {
                            setResultFilter(e.target.value);
                            setPage(1);
                        }}
                        className={styles.filterSelect}
                        style={{ minWidth: "120px" }}
                    >
                        <option value="all">Result (All)</option>
                        <option value="Success">Success</option>
                        <option value="Failed">Failed</option>
                    </select>

                    {/* Channel Filter if multiple */}
                    {channelNames.length > 1 && (
                        <select
                            value={channelFilter}
                            onChange={e => {
                                setChannelFilter(e.target.value);
                                setPage(1);
                            }}
                            className={styles.filterSelect}
                        >
                            <option value="all">All Channels</option>
                            {channelNames.map(cn => (
                                <option key={cn} value={cn}>{cn}</option>
                            ))}
                        </select>
                    )}
                </div>

                <button
                    type="button"
                    onClick={fetchLogs}
                    className={styles.btnRefresh}
                    title="Refresh channel events log"
                >
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Table matching Channex */}
            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={`${styles.th} ${styles.thWithSort}`}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span>Action</span>
                                    <ArrowUpDown size={11} color="#94a3b8" />
                                </div>
                            </th>
                            <th className={styles.th}>Task ID</th>
                            <th className={styles.th}>Channel</th>
                            <th className={styles.th}>User</th>
                            <th className={styles.th}>Started At</th>
                            <th className={styles.th}>Execution Time (ms)</th>
                            <th className={styles.th} style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedLogs.map(item => {
                            const isSuccess = item.result.toLowerCase() === "success";
                            const isFailed = item.result.toLowerCase() === "failed";

                            return (
                                <tr key={item.id} className={styles.tr}>
                                    <td className={styles.td}>
                                        <div className={styles.actionCell}>
                                            <span 
                                                className={
                                                    isSuccess ? styles.statusRingSuccess : 
                                                    isFailed ? styles.statusRingError : 
                                                    styles.statusRingWarning
                                                } 
                                            />
                                            <span>{item.action}</span>
                                        </div>
                                    </td>
                                    <td className={styles.td}>
                                        {(() => {
                                            const displayTaskId = item.task_id || (item.task_ids && item.task_ids[0]) || item.id;
                                            return (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCopy(displayTaskId, `task-${item.id}`);
                                                    }}
                                                    className={styles.taskIdChip}
                                                    title={`Click to copy Task ID: ${displayTaskId}`}
                                                >
                                                    <span className={styles.taskIdMono}>
                                                        {displayTaskId.length > 13 ? `${displayTaskId.slice(0, 8)}...` : displayTaskId}
                                                    </span>
                                                    {copiedField === `task-${item.id}` ? (
                                                        <Check size={11} color="#16a34a" />
                                                    ) : (
                                                        <Copy size={11} className={styles.taskIdCopyIcon} />
                                                    )}
                                                </button>
                                            );
                                        })()}
                                    </td>
                                    <td className={styles.td}>
                                        <span style={{ fontWeight: 600, color: "#334155" }}>
                                            {item.channelName}
                                        </span>
                                    </td>
                                    <td className={styles.td}>
                                        <span style={{ fontSize: "12px", color: "#475569" }}>
                                            {item.user}
                                        </span>
                                    </td>
                                    <td className={styles.td}>
                                        <span style={{ fontFamily: "var(--font-mono-jb, monospace)", fontSize: "12px", color: "#334155" }}>
                                            {formatTimestamp(item.started_at || item.inserted_at)}
                                        </span>
                                    </td>
                                    <td className={styles.td}>
                                        <span style={{ fontSize: "12px", color: "#475569" }}>
                                            {item.execution_time_ms ? `${item.execution_time_ms}` : "-"}
                                        </span>
                                    </td>
                                    <td className={styles.td} style={{ textAlign: "right" }}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedEvent(item)}
                                            className={styles.btnView}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}

                        {paginatedLogs.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                                    {loading ? "Loading channel events..." : "No channel events found matching the selected filter."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className={styles.paginationRow}>
                    <button
                        type="button"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className={styles.pageBtn}
                        title="Previous page"
                    >
                        <ChevronLeft size={14} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(pageNum => (
                        <button
                            key={pageNum}
                            type="button"
                            onClick={() => setPage(pageNum)}
                            className={`${styles.pageBtn} ${page === pageNum ? styles.pageBtnActive : ""}`}
                        >
                            {pageNum}
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className={styles.pageBtn}
                        title="Next page"
                    >
                        <ChevronRight size={14} />
                    </button>

                    <select
                        value={pageSize}
                        onChange={e => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                        }}
                        className={styles.filterSelect}
                        style={{ padding: "3px 8px", fontSize: "11px", marginLeft: "8px" }}
                    >
                        <option value={6}>6 / page</option>
                        <option value={10}>10 / page</option>
                        <option value={20}>20 / page</option>
                        <option value={50}>50 / page</option>
                    </select>
                </div>
            </div>

            {/* Slide-Over Drawer Modal: Channel Action View (Matching Channex UI) */}
            {selectedEvent && (
                <div className={styles.modalOverlay} onClick={() => setSelectedEvent(null)}>
                    <div className={styles.modalDrawer} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalTitle}>
                                <button 
                                    type="button" 
                                    onClick={() => setSelectedEvent(null)}
                                    className={styles.modalCloseBtn}
                                    title="Close View"
                                >
                                    <X size={18} />
                                </button>
                                <span>Channel Action View</span>
                            </div>
                            {(selectedEvent.task_id || selectedEvent.id) && (
                                <button
                                    type="button"
                                    onClick={() => handleFetchLiveTask(selectedEvent.task_id || selectedEvent.id)}
                                    disabled={fetchingLiveTask}
                                    className={styles.liveSyncBtn}
                                    title="Sync live status and OTA responses directly from Channex API"
                                >
                                    <RefreshCw size={12} className={fetchingLiveTask ? "animate-spin" : ""} />
                                    <span>{fetchingLiveTask ? "Syncing Channex..." : "Sync Live Status"}</span>
                                </button>
                            )}
                        </div>

                        <div className={styles.modalBody}>
                            {/* Metadata Grid */}
                            <div className={styles.metaGrid}>
                                <div className={styles.metaRow}>
                                    <span className={styles.metaLabel}>Event:</span>
                                    <span className={styles.metaValue} style={{ fontWeight: 700 }}>
                                        {selectedEvent.action}
                                    </span>
                                </div>
                                <div className={styles.metaRow}>
                                    <span className={styles.metaLabel}>Inserted At:</span>
                                    <span className={styles.metaValue} style={{ fontFamily: "var(--font-mono-jb, monospace)" }}>
                                        {formatTimestampWithMs(selectedEvent.inserted_at || selectedEvent.started_at)}
                                    </span>
                                </div>
                                <div className={styles.metaRow}>
                                    <span className={styles.metaLabel}>Result:</span>
                                    <span className={styles.metaValue} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                                        <span className={selectedEvent.result.toLowerCase() === "success" ? styles.badgeSuccessOutline : styles.badgeErrorOutline}>
                                            {selectedEvent.result}
                                        </span>
                                        {selectedEvent.is_live_synced && (
                                            <span style={{ fontSize: "11px", color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "1px 6px", borderRadius: "4px", fontWeight: 600 }}>
                                                ✓ Channex API Live
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className={styles.metaRow}>
                                    <span className={styles.metaLabel}>Channel:</span>
                                    <span className={styles.metaValue} style={{ color: "#2563eb", fontWeight: 600 }}>
                                        {selectedEvent.channelName}
                                    </span>
                                </div>
                                <div className={styles.metaRow}>
                                    <span className={styles.metaLabel}>User:</span>
                                    <span className={styles.metaValue}>
                                        {selectedEvent.user}
                                    </span>
                                </div>
                                <div className={styles.metaRow}>
                                    <span className={styles.metaLabel}>Channex Task ID:</span>
                                    <span className={styles.metaValue} style={{ fontFamily: "var(--font-mono-jb, monospace)", color: "#2563eb", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                        <span>{selectedEvent.task_id || (selectedEvent.task_ids && selectedEvent.task_ids.join(", ")) || selectedEvent.id}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(selectedEvent.task_id || (selectedEvent.task_ids && selectedEvent.task_ids[0]) || selectedEvent.id, "Task ID")}
                                            style={{
                                                border: "1px solid #cbd5e1",
                                                borderRadius: "4px",
                                                padding: "2px 8px",
                                                fontSize: "11px",
                                                cursor: "pointer",
                                                backgroundColor: "#f1f5f9",
                                                color: "#0f172a",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "4px"
                                            }}
                                            title="Copy for PMS Certification Form"
                                        >
                                            {copiedField === "Task ID" ? <Check size={11} color="#16a34a" /> : <Copy size={11} />}
                                            <span>{copiedField === "Task ID" ? "Copied" : "Copy"}</span>
                                        </button>
                                    </span>
                                </div>
                                {selectedEvent.reason && (
                                    <div className={styles.metaRow}>
                                        <span className={styles.metaLabel}>Reason:</span>
                                        <span className={styles.metaValue} style={{ color: "#475569" }}>
                                            {selectedEvent.reason}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Detail Tabs Bar matching Channex Inspector */}
                            <div className={styles.detailTabsRow}>
                                <button
                                    type="button"
                                    onClick={() => setActiveDetailTab("diff")}
                                    className={`${styles.detailTabBtn} ${activeDetailTab === "diff" ? styles.detailTabBtnActive : ""}`}
                                >
                                    <GitCompare size={13} />
                                    <span>Changes &amp; Diff</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveDetailTab("payload")}
                                    className={`${styles.detailTabBtn} ${activeDetailTab === "payload" ? styles.detailTabBtnActive : ""}`}
                                >
                                    <Code2 size={13} />
                                    <span>Request Payload</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveDetailTab("ota")}
                                    className={`${styles.detailTabBtn} ${activeDetailTab === "ota" ? styles.detailTabBtnActive : ""}`}
                                >
                                    <Globe size={13} />
                                    <span>OTA Responses {selectedEvent.ota_responses?.length ? `(${selectedEvent.ota_responses.length})` : ""}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveDetailTab("response")}
                                    className={`${styles.detailTabBtn} ${activeDetailTab === "response" ? styles.detailTabBtnActive : ""}`}
                                >
                                    <Layers size={13} />
                                    <span>Channex Response</span>
                                </button>
                            </div>

                            {/* Tab 1: Diff View */}
                            {activeDetailTab === "diff" && (
                                <div>
                                    <div className={styles.diffViewer}>
                                        {renderDiffLines(selectedEvent.diff, selectedEvent)}
                                    </div>
                                </div>
                            )}

                            {/* Tab 2: Request Payload */}
                            {activeDetailTab === "payload" && (
                                <div>
                                    <div className={styles.codeBoxHeader}>
                                        <span>Request Body (JSON)</span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(
                                                JSON.stringify(selectedEvent.payload || selectedEvent.diff || selectedEvent.details || { action: selectedEvent.action, task_id: selectedEvent.task_id || selectedEvent.id }, null, 2),
                                                "Request Payload"
                                            )}
                                            className={styles.copyCodeBtn}
                                        >
                                            {copiedField === "Request Payload" ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                                            <span>{copiedField === "Request Payload" ? "Copied" : "Copy Payload"}</span>
                                        </button>
                                    </div>
                                    <pre className={styles.jsonPre}>
                                        {JSON.stringify(selectedEvent.payload || selectedEvent.diff || selectedEvent.details || { action: selectedEvent.action, task_id: selectedEvent.task_id || selectedEvent.id }, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {/* Tab 3: OTA Responses */}
                            {activeDetailTab === "ota" && (
                                <div className={styles.otaGrid}>
                                    {Array.isArray(selectedEvent.ota_responses) && selectedEvent.ota_responses.length > 0 ? (
                                        selectedEvent.ota_responses.map((ota: any, idx: number) => {
                                            const isOtaSuccess = ota.status?.toString().startsWith("2") || ota.result === "Success" || ota.status === "OK" || ota.success;
                                            return (
                                                <div key={idx} className={styles.otaCard}>
                                                    <div className={styles.otaCardTop}>
                                                        <div className={styles.otaChannelTitle}>
                                                            <Globe size={14} color="#2563eb" />
                                                            <span>{ota.channel_name || ota.channel || ota.ota || "Connected OTA Channel"}</span>
                                                        </div>
                                                        <span className={`${styles.otaStatusBadge} ${isOtaSuccess ? styles.otaStatusSuccess : styles.otaStatusFailed}`}>
                                                            {isOtaSuccess ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                                            <span>{ota.status_code || ota.status || (isOtaSuccess ? "200 OK" : "Failed")}</span>
                                                        </span>
                                                    </div>
                                                    {ota.latency_ms && (
                                                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#64748b" }}>
                                                            <Clock size={11} />
                                                            <span>Latency: {ota.latency_ms} ms</span>
                                                        </div>
                                                    )}
                                                    <div className={styles.otaDetailText}>
                                                        {typeof ota.body === "string" 
                                                            ? ota.body 
                                                            : JSON.stringify(ota.body || ota.response || ota.message || ota, null, 2)}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ padding: "30px 20px", textAlign: "center", background: "#f8fafc", borderRadius: "6px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
                                            <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: "13px" }}>No Direct OTA Acknowledgements</p>
                                            <p style={{ margin: 0, fontSize: "11px" }}>
                                                This task was processed directly by Channex or internal CRS dispatch without separate third-party OTA roundtrips.
                                            </p>
                                            {!selectedEvent.is_live_synced && (selectedEvent.task_id || selectedEvent.id) && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleFetchLiveTask(selectedEvent.task_id || selectedEvent.id)}
                                                    disabled={fetchingLiveTask}
                                                    className={styles.liveSyncBtn}
                                                    style={{ marginTop: "12px" }}
                                                >
                                                    <RefreshCw size={12} className={fetchingLiveTask ? "animate-spin" : ""} />
                                                    <span>Fetch Live OTA Responses from Channex</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab 4: Channex API Response */}
                            {activeDetailTab === "response" && (
                                <div>
                                    <div className={styles.codeBoxHeader}>
                                        <span>Channex API Response (JSON)</span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(
                                                JSON.stringify(selectedEvent.response || selectedEvent.details || { status: selectedEvent.status, result: selectedEvent.result }, null, 2),
                                                "Channex Response"
                                            )}
                                            className={styles.copyCodeBtn}
                                        >
                                            {copiedField === "Channex Response" ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                                            <span>{copiedField === "Channex Response" ? "Copied" : "Copy Response"}</span>
                                        </button>
                                    </div>
                                    <pre className={styles.jsonPre}>
                                        {JSON.stringify(selectedEvent.response || selectedEvent.details || { status: selectedEvent.status, result: selectedEvent.result }, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
