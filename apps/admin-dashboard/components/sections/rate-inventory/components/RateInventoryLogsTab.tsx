"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
    RefreshCw, 
    X, 
    ChevronLeft, 
    ChevronRight, 
    ArrowUpDown,
    Copy,
    Check,
    Code2,
    Layers,
    GitCompare,
    Globe,
    CheckCircle2,
    AlertCircle,
    Clock,
    Search,
    ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import styles from "./RateInventoryLogsTab.module.css";

export interface RateInventoryTaskLog {
    id: string;
    task_id?: string;
    task_ids?: string[];
    action: string;
    task_type?: string;
    channelName: string;
    channelCode?: string;
    user: string;
    user_label?: string;
    user_name?: string;
    user_email?: string;
    user_role?: string;
    email?: string;
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

export function RateInventoryLogsTab({ hotelCode }: Props) {
    const { user } = useAuth();
    const isSuperadmin = user?.role?.toLowerCase() === "superadmin" || user?.role?.toLowerCase() === "admin";

    const [logs, setLogs] = useState<RateInventoryTaskLog[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // Formatter to strictly extract name, email, and role of whoever made the change
    const getUserDisplay = (item?: RateInventoryTaskLog | null) => {
        if (!item) return { name: "-", email: "", role: "" };
        let name = item.user_name || "";
        let email = item.user_email || item.email || "";
        let role = item.user_role || "";

        if (!email && item.user) {
            const match = item.user.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            if (match) email = match[1];
        }

        if (!name && item.user) {
            const cleaned = item.user.replace(/\s*\([^)]+\)/, "").trim();
            if (cleaned && !cleaned.toLowerCase().includes("operator")) {
                name = cleaned;
            } else if (email) {
                name = email.split("@")[0];
            } else {
                name = item.user;
            }
        }

        return {
            name: name || "Operator",
            email,
            role
        };
    };

    // Filters
    const [actionFilter, setActionFilter] = useState<string>("all");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [resultFilter, setResultFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Pagination
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);

    // Drawer modal state & tabs
    const [selectedEvent, setSelectedEvent] = useState<RateInventoryTaskLog | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<"diff" | "payload" | "ota" | "response">("diff");
    const [fetchingLiveTask, setFetchingLiveTask] = useState<boolean>(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Low-Cost Firebase Read: 3-minute session cache + on-demand fetch (No real-time onSnapshot)
    const fetchLogs = async (force: boolean = false) => {
        if (!hotelCode || !isSuperadmin) return;

        // 1. Read from 3-minute session cache unless force refresh is requested
        if (!force && typeof window !== "undefined") {
            const cachedKey = `ari_logs_${hotelCode}`;
            const cachedTimeKey = `ari_logs_time_${hotelCode}`;
            const cachedData = sessionStorage.getItem(cachedKey);
            const cachedTime = sessionStorage.getItem(cachedTimeKey);
            if (cachedData && cachedTime && (Date.now() - Number(cachedTime) < 3 * 60 * 1000)) {
                try {
                    const parsed = JSON.parse(cachedData);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setLogs(parsed);
                        return;
                    }
                } catch (_) {}
            }
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/channex/tasks?hotelCode=${encodeURIComponent(hotelCode)}&limit=100`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.logs)) {
                    setLogs(data.logs);
                    if (typeof window !== "undefined") {
                        sessionStorage.setItem(`ari_logs_${hotelCode}`, JSON.stringify(data.logs));
                        sessionStorage.setItem(`ari_logs_time_${hotelCode}`, String(Date.now()));
                    }
                }
            }
        } catch (err: any) {
            console.warn("[RateInventoryLogs] Could not load task logs:", err?.message || err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(false);
    }, [hotelCode, isSuperadmin]);

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

            if (startDate) {
                const itemDate = (item.started_at || item.inserted_at).slice(0, 10);
                if (itemDate < startDate) return false;
            }
            if (endDate) {
                const itemDate = (item.started_at || item.inserted_at).slice(0, 10);
                if (itemDate > endDate) return false;
            }

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const taskId = (item.task_id || (item.task_ids && item.task_ids[0]) || item.id || "").toLowerCase();
                const userName = (item.user || "").toLowerCase();
                const channel = (item.channelName || "").toLowerCase();
                const action = (item.action || "").toLowerCase();

                if (!taskId.includes(q) && !userName.includes(q) && !channel.includes(q) && !action.includes(q)) {
                    return false;
                }
            }

            return true;
        });
    }, [logs, actionFilter, resultFilter, startDate, endDate, searchQuery]);

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

    // Render git-style diff lines matching Channex Inspector
    const renderDiffLines = (diff: any, selectedEvent: RateInventoryTaskLog) => {
        if (Array.isArray(diff)) {
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
                <div className={styles.preDetailsBox}>
                    <pre className={styles.preDetails}>
                        {typeof selectedEvent.details === "string" 
                            ? selectedEvent.details 
                            : JSON.stringify(selectedEvent.details, null, 2)}
                    </pre>
                </div>
            );
        }

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
                    <span className={styles.diffText}>  &quot;action&quot;: &quot;{selectedEvent.action}&quot;,</span>
                </div>
                <div className={styles.diffLine}>
                    <span className={styles.diffColNum}>3</span>
                    <span className={styles.diffColNum}>3</span>
                    <span className={styles.diffSign}> </span>
                    <span className={styles.diffText}>  &quot;user&quot;: &quot;{selectedEvent.user}&quot;,</span>
                </div>
                <div className={styles.diffLine}>
                    <span className={styles.diffColNum}>4</span>
                    <span className={styles.diffColNum}>4</span>
                    <span className={styles.diffSign}> </span>
                    <span className={styles.diffText}>  &quot;timestamp&quot;: &quot;{selectedEvent.inserted_at}&quot;</span>
                </div>
                <div className={styles.diffLine}>
                    <span className={styles.diffColNum}>5</span>
                    <span className={styles.diffColNum}>5</span>
                    <span className={styles.diffSign}> </span>
                    <span className={styles.diffText}>&#125;</span>
                </div>
            </div>
        );
    };

    if (!isSuperadmin) {
        return (
            <div className={styles.restrictedContainer}>
                <ShieldAlert size={40} color="#dc2626" className={styles.restrictedIcon} />
                <h3 className={styles.restrictedTitle}>Akses Terbatas: Superadmin Saja</h3>
                <p className={styles.restrictedDesc}>
                    Tab audit log inventori dan rate hanya dapat dibuka oleh akun dengan role Superadmin untuk mengamankan riwayat dan menghemat kuota pembacaan basis data.
                </p>
            </div>
        );
    }

    return (
        <div className={styles.logsContainer}>
            {/* Filter Bar */}
            <div className={styles.filterBar}>
                <div className={styles.filterInputs}>
                    {/* Search */}
                    <div className={styles.searchWrapper}>
                        <Search size={13} color="#94a3b8" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => {
                                setSearchQuery(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Cari Task ID / User..."
                            className={styles.searchInput}
                        />
                    </div>

                    {/* Action Filter */}
                    <select
                        value={actionFilter}
                        onChange={e => {
                            setActionFilter(e.target.value);
                            setPage(1);
                        }}
                        className={`${styles.filterSelect} ${styles.filterSelectScope}`}
                    >
                        <option value="all">Action (All)</option>
                        {actionTypes.map(act => (
                            <option key={act} value={act}>{act}</option>
                        ))}
                    </select>

                    {/* Date Range */}
                    <div className={styles.dateRangeWrapper}>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => {
                                setStartDate(e.target.value);
                                setPage(1);
                            }}
                            className={styles.filterDateInput}
                            title="Tanggal Mulai"
                        />
                        <span className={styles.dateArrow}>→</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => {
                                setEndDate(e.target.value);
                                setPage(1);
                            }}
                            className={styles.filterDateInput}
                            title="Tanggal Akhir"
                        />
                    </div>

                    {/* Result Filter */}
                    <select
                        value={resultFilter}
                        onChange={e => {
                            setResultFilter(e.target.value);
                            setPage(1);
                        }}
                        className={`${styles.filterSelect} ${styles.filterSelectLimit}`}
                    >
                        <option value="all">Status (All)</option>
                        <option value="Success">Success</option>
                        <option value="Failed">Failed</option>
                    </select>
                </div>

                <button
                    type="button"
                    onClick={() => fetchLogs(true)}
                    className={styles.btnRefresh}
                    title="Refresh inventory audit logs"
                >
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Table */}
            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={`${styles.th} ${styles.thWithSort}`}>
                                <div className={styles.actionHeaderRow}>
                                    <span>Action</span>
                                    <ArrowUpDown size={11} color="#94a3b8" />
                                </div>
                            </th>
                            <th className={styles.th}>Task ID</th>
                            <th className={styles.th}>Channel / Scope</th>
                            <th className={styles.th}>User</th>
                            <th className={styles.th}>Started At</th>
                            <th className={styles.th}>Execution Time (ms)</th>
                            <th className={`${styles.th} ${styles.thRight}`}>Actions</th>
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
                                            <span className={styles.actionName}>{item.action}</span>
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
                                                    title={`Klik untuk menyalin Task ID: ${displayTaskId}`}
                                                >
                                                    <span className={styles.taskIdMono}>
                                                        {displayTaskId}
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
                                        <span className={styles.channelNameText}>
                                            {item.channelName || "Master Inventory"}
                                        </span>
                                    </td>
                                    <td className={styles.td}>
                                        {(() => {
                                            const u = getUserDisplay(item);
                                            return (
                                                <div className={styles.userCell}>
                                                    <div className={styles.userNameRow}>
                                                        <span className={styles.userText}>{u.name}</span>
                                                        {u.role && (
                                                            <span className={styles.roleBadge} title={`User Role: ${u.role}`}>
                                                                {u.role}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {u.email && (
                                                        <span className={styles.userEmailSubText}>
                                                            {u.email}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className={styles.td}>
                                        <span className={styles.timestampText}>
                                            {formatTimestamp(item.started_at || item.inserted_at)}
                                        </span>
                                    </td>
                                    <td className={styles.td}>
                                        <span className={styles.executionTimeText}>
                                            {item.execution_time_ms ? `${item.execution_time_ms}` : "-"}
                                        </span>
                                    </td>
                                    <td className={`${styles.td} ${styles.tdRight}`}>
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
                                <td colSpan={7} className={styles.emptyCell}>
                                    {loading ? "Memuat riwayat perubahan inventori..." : "Tidak ada log perubahan yang cocok dengan filter."}
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
                        title="Halaman sebelumnya"
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
                        title="Halaman berikutnya"
                    >
                        <ChevronRight size={14} />
                    </button>

                    <select
                        value={pageSize}
                        onChange={e => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                        }}
                        className={`${styles.filterSelect} ${styles.pageSizeSelect}`}
                    >
                        <option value={10}>10 / halaman</option>
                        <option value={20}>20 / halaman</option>
                        <option value={50}>50 / halaman</option>
                    </select>
                </div>
            </div>

            {/* Slide-Over Drawer Modal: Rate & Inventory Action View */}
            {selectedEvent && (
                <div className={styles.modalOverlay} onClick={() => setSelectedEvent(null)}>
                    <div className={styles.modalDrawer} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalTitle}>
                                <button 
                                    type="button" 
                                    onClick={() => setSelectedEvent(null)}
                                    className={styles.modalCloseBtn}
                                    title="Tutup Tampilan"
                                >
                                    <X size={18} />
                                </button>
                                <span>Inventory &amp; Rate Action View</span>
                            </div>
                            {(selectedEvent.task_id || selectedEvent.id) && (
                                <button
                                    type="button"
                                    onClick={() => handleFetchLiveTask(selectedEvent.task_id || selectedEvent.id)}
                                    disabled={fetchingLiveTask}
                                    className={styles.liveSyncBtn}
                                    title="Sinkronisasi status live dari server Channex"
                                >
                                    <RefreshCw size={12} className={fetchingLiveTask ? "animate-spin" : ""} />
                                    <span>{fetchingLiveTask ? "Syncing..." : "Sync Live Status"}</span>
                                </button>
                            )}
                        </div>

                        <div className={styles.modalBody}>
                            {/* Metadata Grid */}
                            <div className={styles.metaGrid}>
                                <div className={styles.metaRow}>
                                    <span className={styles.metaLabel}>Event:</span>
                                    <span className={`${styles.metaValue} ${styles.metaValueBold}`}>
                                        {selectedEvent.action}
                                    </span>
                                </div>
                                <div className={styles.metaRow}>
                                    <span className={styles.metaLabel}>Waktu Diubah:</span>
                                    <span className={`${styles.metaValue} ${styles.metaValueMono}`}>
                                        {formatTimestampWithMs(selectedEvent.inserted_at || selectedEvent.started_at)}
                                    </span>
                                </div>
                                <div className={styles.metaRow}>
                                    <span className={styles.metaLabel}>Hasil:</span>
                                    <span className={`${styles.metaValue} ${styles.metaValueLiveSynced}`}>
                                        <span className={selectedEvent.result.toLowerCase() === "success" ? styles.badgeSuccessOutline : styles.badgeErrorOutline}>
                                            {selectedEvent.result}
                                        </span>
                                        {selectedEvent.is_live_synced && (
                                            <span className={styles.badgeLivePill}>
                                                ✓ Channex API Live
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className={styles.metaRow}>
                                    <span className={styles.metaLabel}>Scope / Channel:</span>
                                    <span className={`${styles.metaValue} ${styles.metaValueBlue}`}>
                                        {selectedEvent.channelName}
                                    </span>
                                </div>
                                <div className={styles.metaRow}>
                                    <span className={styles.metaLabel}>User Pengubah:</span>
                                    <div className={styles.metaValue}>
                                        {(() => {
                                            const u = getUserDisplay(selectedEvent);
                                            return (
                                                <div className={styles.drawerUserBox}>
                                                    <div className={styles.drawerUserNameRow}>
                                                        <span className={styles.drawerUserName}>{u.name}</span>
                                                        {u.role && (
                                                            <span className={styles.roleBadgeDrawer} title={`User Role: ${u.role}`}>
                                                                {u.role}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {u.email && (
                                                        <span className={styles.drawerUserEmail}>
                                                            {u.email}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                                <div className={styles.metaRow}>
                                    <span className={styles.metaLabel}>Task ID:</span>
                                    <span className={`${styles.metaValue} ${styles.metaValueTaskId}`}>
                                        <span>{selectedEvent.task_id || (selectedEvent.task_ids && selectedEvent.task_ids.join(", ")) || selectedEvent.id}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(selectedEvent.task_id || (selectedEvent.task_ids && selectedEvent.task_ids[0]) || selectedEvent.id, "Task ID")}
                                            className={styles.copyCodeBtn}
                                            title="Salin Task ID"
                                        >
                                            {copiedField === "Task ID" ? <Check size={11} color="#16a34a" /> : <Copy size={11} />}
                                            <span>{copiedField === "Task ID" ? "Tersalin" : "Copy"}</span>
                                        </button>
                                    </span>
                                </div>
                                {selectedEvent.reason && (
                                    <div className={styles.metaRow}>
                                        <span className={styles.metaLabel}>Alasan / Info:</span>
                                        <span className={styles.metaValue}>
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
                                    <span>Perubahan &amp; Diff</span>
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
                                            <span>{copiedField === "Request Payload" ? "Tersalin" : "Copy Payload"}</span>
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
                                                        <div className={styles.syncPayloadRow}>
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
                                        <div className={styles.emptyOtaNotice}>
                                            <p className={styles.emptyOtaTitle}>Tidak Ada Respons OTA Langsung</p>
                                            <p className={styles.emptyOtaSubtext}>
                                                Tugas ini disimpan langsung di pangkalan data internal CRS dan/atau disinkronkan langsung via delta ARI Channex.
                                            </p>
                                            {!selectedEvent.is_live_synced && (selectedEvent.task_id || selectedEvent.id) && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleFetchLiveTask(selectedEvent.task_id || selectedEvent.id)}
                                                    disabled={fetchingLiveTask}
                                                    className={`${styles.liveSyncBtn} ${styles.liveSyncBtnSpaced}`}
                                                >
                                                    <RefreshCw size={12} className={fetchingLiveTask ? "animate-spin" : ""} />
                                                    <span>Tarik Respons Live OTA dari Channex</span>
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
                                            <span>{copiedField === "Channex Response" ? "Tersalin" : "Copy Response"}</span>
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
