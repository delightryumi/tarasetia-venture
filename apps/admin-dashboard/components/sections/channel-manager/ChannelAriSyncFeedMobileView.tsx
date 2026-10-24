"use client";

import React from "react";
import {
    Activity,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Search,
    Copy,
    Check,
    RefreshCw
} from "lucide-react";
import styles from "./ChannelAriSyncFeedMobileView.module.css";
import { ChannelAriSyncFeedViewProps } from "./ChannelAriSyncFeedDesktopView";

export const ChannelAriSyncFeedMobileView: React.FC<ChannelAriSyncFeedViewProps> = ({
    syncingAri,
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
            {/* Mobile Masthead */}
            <div className={styles.mastheadMobile}>
                <span className={styles.mastheadEyebrow}>Live ARI Transmission Feed</span>
                <div className={styles.mastheadTitleRow}>
                    <h2 className={styles.mastheadTitle}>ARI Feed</h2>
                    <div className={styles.liveIndicator}>
                        <span className={styles.pulseDot} />
                        <span>Live Stream</span>
                    </div>
                </div>
            </div>

            {/* 2x2 Metrics */}
            <div className={styles.metricsGrid}>
                <div className={styles.metricBox}>
                    <span className={styles.metricLabel}>Success Rate</span>
                    <span className={styles.metricValue}>{successRate}%</span>
                </div>
                <div className={styles.metricBox}>
                    <span className={styles.metricLabel}>Avg Latency</span>
                    <span className={styles.metricValue}>~{avgLatency} ms</span>
                </div>
            </div>

            {/* Search Input */}
            <div className={styles.searchWrapper}>
                <Search size={14} color="#71717a" />
                <input
                    type="text"
                    placeholder="Search task ID or message..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            {/* Filter Status Chips */}
            <div className={styles.filterScrollRow}>
                <button
                    type="button"
                    onClick={() => setFilterStatus("ALL")}
                    className={`${styles.filterChip} ${filterStatus === "ALL" ? styles.filterChipActive : ""}`}
                >
                    All ({combinedLogs.length})
                </button>
                <button
                    type="button"
                    onClick={() => setFilterStatus("SUCCESS")}
                    className={`${styles.filterChip} ${filterStatus === "SUCCESS" ? styles.filterChipActive : ""}`}
                >
                    Success ({successCount})
                </button>
                <button
                    type="button"
                    onClick={() => setFilterStatus("ERROR")}
                    className={`${styles.filterChip} ${filterStatus === "ERROR" ? styles.filterChipActive : ""}`}
                >
                    Failed ({errorCount})
                </button>
            </div>

            {/* Actions Row */}
            <div className={styles.actionsRow}>
                <button
                    type="button"
                    onClick={handleTriggerPush}
                    disabled={syncingAri}
                    className={styles.btnPushTouch}
                >
                    <RefreshCw size={13} className={syncingAri ? "animate-spin" : ""} />
                    <span>{syncingAri ? "Pushing..." : "Push Full Sync (500d)"}</span>
                </button>
                <button
                    type="button"
                    onClick={() => fetchRemoteLogs(true)}
                    disabled={fetchingLogs}
                    className={styles.btnRefreshTouch}
                    title="Refresh Feed"
                >
                    <RefreshCw size={13} className={fetchingLogs ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Transmission Events List */}
            <div className={styles.feedList}>
                {filteredLogs.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "28px 12px", color: "#71717a", fontSize: "12px" }}>
                        <Activity size={24} style={{ margin: "0 auto 8px auto", opacity: 0.4 }} />
                        <p style={{ margin: 0, fontWeight: 500 }}>No transmission events found.</p>
                    </div>
                ) : (
                    filteredLogs.map((log) => {
                        const isSuccess = log.status === "SUCCESS";
                        const isFailed = log.status === "ERROR";

                        return (
                            <div key={log.id} className={styles.feedCard}>
                                <div className={styles.cardHeaderRow}>
                                    <span
                                        className={`${styles.cardStatusPill} ${
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
                                    <span className={styles.cardTime}>{log.time}</span>
                                </div>

                                <h4 className={styles.cardTitle}>{log.action || "Sync ARI Feed"}</h4>
                                <p className={styles.cardMessage}>{log.message}</p>

                                <div className={styles.cardFooterRow}>
                                    <span className={styles.channelTag}>{log.channelName || "Live Stream"}</span>

                                    {log.taskId ? (
                                        <span
                                            className={styles.taskIdTouch}
                                            onClick={(e) => handleCopyTaskId(log.taskId!, e)}
                                            title="Click to copy Task ID"
                                        >
                                            {copiedTaskId === log.taskId ? (
                                                <Check size={9} color="#059669" />
                                            ) : (
                                                <Copy size={9} />
                                            )}
                                            <span>{log.taskId.slice(0, 10)}...</span>
                                        </span>
                                    ) : (
                                        <span style={{ fontSize: 10, color: "#a1a1aa" }}>session</span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
