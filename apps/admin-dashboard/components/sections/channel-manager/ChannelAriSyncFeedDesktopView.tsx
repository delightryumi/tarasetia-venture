"use client";

import React from "react";
import {
    Activity,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Search,
    Zap,
    ExternalLink,
    CalendarRange,
    Radio,
    Copy,
    Check,
    RefreshCw
} from "lucide-react";
import styles from "./ChannelAriSyncFeedDesktopView.module.css";
import { LogItem } from "./ChannelAriSyncFeedTab";

export interface ChannelAriSyncFeedViewProps {
    hotelCode: string;
    syncingAri: boolean;
    onSyncAllAri: () => Promise<void>;
    syncLog: Array<{ time: string; status: string; message: string }>;
    onNavigateToLogs?: () => void;
    filteredLogs: LogItem[];
    combinedLogs: LogItem[];
    searchTerm: string;
    setSearchTerm: (s: string) => void;
    filterStatus: "ALL" | "SUCCESS" | "ERROR";
    setFilterStatus: (s: "ALL" | "SUCCESS" | "ERROR") => void;
    fetchingLogs: boolean;
    fetchRemoteLogs: (showToast?: boolean) => Promise<void>;
    copiedTaskId: string | null;
    handleCopyTaskId: (id: string, e: React.MouseEvent) => void;
    successCount: number;
    errorCount: number;
    successRate: number;
    avgLatency: number;
    handleTriggerPush: () => Promise<void>;
}

export const ChannelAriSyncFeedDesktopView: React.FC<ChannelAriSyncFeedViewProps> = ({
    syncingAri,
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
}) => {
    return (
        <div className={styles.container}>
            {/* 1. Masthead */}
            <div className={styles.editorialMasthead}>
                <div className={styles.mastheadMeta}>
                    <span className={styles.mastheadEyebrow}>Live ARI Transmission Engine · Real-Time Telemetry</span>
                    <h2 className={styles.mastheadTitle}>ARI Sync Feed &amp; Distribution Log</h2>
                    <p className={styles.mastheadDesc}>
                        Live monitoring of 2-Call Bulk ARI 500-day forward transmissions, room allotments, CTA/CTD/LOS restrictions, and OTA channel deliveries.
                    </p>
                </div>
                <div className={styles.mastheadActions}>
                    <button
                        type="button"
                        onClick={() => fetchRemoteLogs(true)}
                        disabled={fetchingLogs}
                        className={styles.btnSecondary}
                        title="Refresh Transmission Feed"
                    >
                        <RefreshCw size={12} className={fetchingLogs ? "animate-spin" : ""} />
                        <span>{fetchingLogs ? "Refreshing..." : "Refresh Feed"}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleTriggerPush}
                        disabled={syncingAri}
                        className={styles.btnPrimary}
                        title="Force push full ARI 500-day inventory to all connected OTA channels"
                    >
                        <RefreshCw size={12} className={syncingAri ? "animate-spin" : ""} />
                        <span>{syncingAri ? "Pushing ARI..." : "Force Push Full Sync (500 Days)"}</span>
                    </button>

                    {onNavigateToLogs && (
                        <button
                            type="button"
                            onClick={onNavigateToLogs}
                            className={styles.btnSecondary}
                            title="Inspect full audit logs and raw payload webhooks"
                        >
                            <ExternalLink size={12} />
                            <span>Audit Log</span>
                        </button>
                    )}
                </div>
            </div>

            {/* 2. Compact Stat Strip */}
            <div className={styles.statStrip}>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>
                        <CalendarRange size={12} /> Sync Scope
                    </span>
                    <span className={styles.statValue}>500 Days Forward</span>
                    <span className={styles.statSubtext}>2-Call Bulk ARI payload</span>
                </div>

                <div className={styles.statItem}>
                    <span className={styles.statLabel}>
                        <CheckCircle2 size={12} /> Push Success Rate
                    </span>
                    <span className={styles.statValue}>{successRate}%</span>
                    <span className={styles.statSubtext}>{successCount} succeeded, {errorCount} failed</span>
                </div>

                <div className={styles.statItem}>
                    <span className={styles.statLabel}>
                        <Zap size={12} /> Average Latency
                    </span>
                    <span className={styles.statValue}>~{avgLatency} ms</span>
                    <span className={styles.statSubtext}>Throughput via Channex Gateway</span>
                </div>

                <div className={styles.statItem}>
                    <span className={styles.statLabel}>
                        <Radio size={12} /> Engine Status
                    </span>
                    <div className={styles.statValue}>
                        <span className={styles.statValueLive}>
                            <span className={styles.livePulseDot} />
                            <span>Online</span>
                        </span>
                    </div>
                    <span className={styles.statSubtext}>Live stream active (68+ OTAs)</span>
                </div>
            </div>

            {/* 3. Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                    <div className={styles.searchWrapper}>
                        <Search size={13} color="#71717a" />
                        <input
                            type="text"
                            placeholder="Search task ID, channel name, or message..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                </div>

                <div className={styles.toolbarCenter}>
                    <div className={styles.statusFilterGroup}>
                        <button
                            type="button"
                            onClick={() => setFilterStatus("ALL")}
                            className={`${styles.filterBtn} ${filterStatus === "ALL" ? styles.filterBtnActive : ""}`}
                        >
                            All ({combinedLogs.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus("SUCCESS")}
                            className={`${styles.filterBtn} ${filterStatus === "SUCCESS" ? styles.filterBtnActiveSuccess : ""}`}
                        >
                            Success ({successCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus("ERROR")}
                            className={`${styles.filterBtn} ${filterStatus === "ERROR" ? styles.filterBtnActiveError : ""}`}
                        >
                            Failed ({errorCount})
                        </button>
                    </div>
                </div>

                <div className={styles.toolbarRight}>
                    <span style={{ fontSize: 11, color: "#71717a", fontFamily: "var(--font-geist-mono, monospace)" }}>
                        Showing {filteredLogs.length} of {combinedLogs.length} events
                    </span>
                </div>
            </div>

            {/* 4. Transmission Ledger Table */}
            <div className={styles.ledgerCard}>
                <div className={styles.ledgerHeaderBar}>
                    <span className={styles.ledgerHeaderTitle}>
                        <Activity size={13} />
                        <span>Live Transmission Telemetry Feed</span>
                    </span>
                    <span className={styles.ledgerHeaderCount}>
                        Auto-refresh on transmission event
                    </span>
                </div>

                <div className={styles.ledgerResponsive}>
                    <table className={styles.ledgerTable}>
                        <thead>
                            <tr>
                                <th style={{ width: 85 }}>Status</th>
                                <th>Action &amp; Payload Message</th>
                                <th style={{ width: 140 }}>Target Channel</th>
                                <th style={{ width: 180 }}>Task UUID</th>
                                <th style={{ width: 90, textAlign: "right" }}>Latency</th>
                                <th style={{ width: 100, textAlign: "right" }}>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div className={styles.emptyState}>
                                            <Activity size={22} color="#a1a1aa" />
                                            <h4 className={styles.emptyTitle}>No matching transmission activities</h4>
                                            <p className={styles.emptySubtitle}>
                                                {searchTerm
                                                    ? "Adjust your search filter query above."
                                                    : "Click 'Force Push Full Sync' to transmit 500-day inventory to channels."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => {
                                    const isSuccess = log.status === "SUCCESS";
                                    const isFailed = log.status === "ERROR";

                                    return (
                                        <tr key={log.id}>
                                            <td>
                                                <span
                                                    className={`${styles.statusPill} ${
                                                        isSuccess
                                                            ? styles.statusSuccess
                                                            : isFailed
                                                            ? styles.statusError
                                                            : styles.statusPending
                                                    }`}
                                                >
                                                    {isSuccess ? (
                                                        <CheckCircle2 size={10} />
                                                    ) : isFailed ? (
                                                        <AlertTriangle size={10} />
                                                    ) : (
                                                        <Clock size={10} />
                                                    )}
                                                    <span>{log.status}</span>
                                                </span>
                                            </td>

                                            <td>
                                                <div className={styles.actionCell}>
                                                    <span className={styles.actionName}>{log.action || "Sync ARI Feed"}</span>
                                                    <span className={styles.actionMessage} title={log.message}>
                                                        {log.message}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <span className={styles.channelBadge}>
                                                    {log.channelName || "Live Stream"}
                                                </span>
                                            </td>

                                            <td>
                                                {log.taskId ? (
                                                    <span
                                                        className={styles.taskIdPill}
                                                        onClick={(e) => handleCopyTaskId(log.taskId!, e)}
                                                        title={`Click to copy Task ID: ${log.taskId}`}
                                                    >
                                                        {copiedTaskId === log.taskId ? (
                                                            <Check size={9} color="#059669" />
                                                        ) : (
                                                            <Copy size={9} />
                                                        )}
                                                        <span>{log.taskId.length > 16 ? `${log.taskId.slice(0, 14)}...` : log.taskId}</span>
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: 10, color: "#a1a1aa", fontStyle: "italic" }}>
                                                        session-stream
                                                    </span>
                                                )}
                                            </td>

                                            <td style={{ textAlign: "right" }}>
                                                <span className={styles.latencyText}>
                                                    {typeof log.execution_time_ms === "number" && log.execution_time_ms > 0
                                                        ? `${log.execution_time_ms} ms`
                                                        : "~120 ms"}
                                                </span>
                                            </td>

                                            <td style={{ textAlign: "right" }}>
                                                <span className={styles.timeText}>{log.time}</span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
