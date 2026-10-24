"use client";

import React from "react";
import {
    RefreshCw,
    X,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Copy,
    Check,
    Code2,
    Layers,
    GitCompare,
    Globe
} from "lucide-react";
import { ChannelActionLogsViewProps } from "./ChannelActionLogsDesktopView";
import styles from "./ChannelActionLogsMobileView.module.css";
import desktopStyles from "./ChannelActionLogsDesktopView.module.css";

export const ChannelActionLogsMobileView: React.FC<ChannelActionLogsViewProps> = ({
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
    resultFilter,
    setResultFilter,
    page,
    setPage,
    totalPages,
    selectedEvent,
    setSelectedEvent,
    activeDetailTab,
    setActiveDetailTab,
    fetchingLiveTask,
    handleFetchLiveTask,
    fetchLogs,
    formatTimestamp,
    formatTimestampWithMs,
    successRate,
    avgLatency
}) => {
    return (
        <div className={styles.container}>
            {/* 1. Mobile KPI Strip */}
            <div className={styles.kpiGridMobile}>
                <div className={styles.kpiCardMobile}>
                    <span className={styles.kpiLabelMobile}>Total Logs</span>
                    <span className={styles.kpiValueMobile}>{logs.length}</span>
                </div>
                <div className={styles.kpiCardMobile}>
                    <span className={styles.kpiLabelMobile}>Sukses</span>
                    <span className={styles.kpiValueMobile}>{successRate}%</span>
                </div>
                <div className={styles.kpiCardMobile}>
                    <span className={styles.kpiLabelMobile}>Rata Latensi</span>
                    <span className={styles.kpiValueMobile}>{avgLatency}ms</span>
                </div>
                <div className={styles.kpiCardMobile}>
                    <span className={styles.kpiLabelMobile}>Retensi</span>
                    <span className={styles.kpiValueMobile}>{retentionDays} Hari</span>
                </div>
            </div>

            {/* 2. Retention & Refresh Action Bar */}
            <div className={styles.actionHeaderMobile}>
                <select
                    value={retentionDays}
                    onChange={e => handleRetentionChange(Number(e.target.value))}
                    className={styles.retentionSelectMobile}
                >
                    <option value={30}>Retensi 30 Hari</option>
                    <option value={60}>Retensi 60 Hari</option>
                    <option value={90}>Retensi 90 Hari</option>
                </select>

                <button
                    type="button"
                    onClick={fetchLogs}
                    className={styles.btnRefreshMobile}
                >
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* 3. Filters */}
            <div className={styles.filterRowMobile}>
                <select
                    value={actionFilter}
                    onChange={e => {
                        setActionFilter(e.target.value);
                        setPage(1);
                    }}
                    className={styles.filterSelectMobile}
                >
                    <option value="all">Semua Aksi</option>
                    {actionTypes.map(act => (
                        <option key={act} value={act}>{act}</option>
                    ))}
                </select>

                <select
                    value={resultFilter}
                    onChange={e => {
                        setResultFilter(e.target.value);
                        setPage(1);
                    }}
                    className={styles.filterSelectMobile}
                >
                    <option value="all">Semua Status</option>
                    <option value="Success">Success</option>
                    <option value="Failed">Failed</option>
                    <option value="Warning">Warning</option>
                </select>
            </div>

            {/* 4. Log Cards List Mobile */}
            <div className={styles.logListMobile}>
                {paginatedLogs.length === 0 ? (
                    <div className={styles.logCardMobile}>
                        <span className={desktopStyles.tableEmptyCell}>
                            {loading ? "Memuat riwayat log event..." : "Tidak ada log event."}
                        </span>
                    </div>
                ) : (
                    paginatedLogs.map(item => {
                        const isSuccess = item.result.toLowerCase() === "success";
                        const isFailed = item.result.toLowerCase() === "failed";

                        return (
                            <div key={item.id} className={styles.logCardMobile}>
                                <div className={styles.cardTopRow}>
                                    <div className={styles.actionBadgeGroup}>
                                        <span
                                            className={`${styles.statusDot} ${
                                                isSuccess
                                                    ? styles.statusDotSuccess
                                                    : isFailed
                                                    ? styles.statusDotError
                                                    : styles.statusDotWarning
                                            }`}
                                        />
                                        <span className={styles.actionTitleMobile}>{item.action}</span>
                                    </div>
                                    <span className={styles.timestampMobile}>
                                        {formatTimestamp(item.started_at || item.inserted_at)}
                                    </span>
                                </div>

                                <div className={styles.cardMetaRow}>
                                    <span className={styles.channelPillMobile}>
                                        {item.channelName || "Channex"}
                                    </span>
                                    <span>{item.user || "System"}</span>
                                    <span>{item.execution_time_ms ? `${item.execution_time_ms}ms` : "-"}</span>
                                </div>

                                <div className={styles.cardActionsMobile}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedEvent(item);
                                            setActiveDetailTab("diff");
                                        }}
                                        className={styles.btnDetailMobile}
                                    >
                                        <span>Lihat Detail Event</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setLogToDelete(item)}
                                        className={styles.btnDeleteMobile}
                                        title="Hapus log"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 5. Mobile Pagination */}
            <div className={styles.paginationMobile}>
                <button
                    type="button"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className={styles.btnPageMobile}
                >
                    <ChevronLeft size={13} />
                    <span>Prev</span>
                </button>

                <span className={styles.pageInfoMobile}>
                    {page} / {totalPages}
                </span>

                <button
                    type="button"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className={styles.btnPageMobile}
                >
                    <span>Next</span>
                    <ChevronRight size={13} />
                </button>
            </div>

            {/* Detail Drawer Modal Mobile */}
            {selectedEvent && (
                <div
                    className={desktopStyles.modalOverlay}
                    onClick={() => setSelectedEvent(null)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className={desktopStyles.detailDrawer}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={desktopStyles.drawerHeader}>
                            <h3 className={desktopStyles.drawerTitle}>{selectedEvent.action}</h3>
                            <button
                                type="button"
                                onClick={() => setSelectedEvent(null)}
                                className={desktopStyles.drawerCloseBtn}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <div className={desktopStyles.drawerTabsBar}>
                            <button
                                type="button"
                                onClick={() => setActiveDetailTab("diff")}
                                className={`${desktopStyles.drawerTabBtn} ${
                                    activeDetailTab === "diff" ? desktopStyles.drawerTabBtnActive : ""
                                }`}
                            >
                                <GitCompare size={12} />
                                <span>Diff</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveDetailTab("payload")}
                                className={`${desktopStyles.drawerTabBtn} ${
                                    activeDetailTab === "payload" ? desktopStyles.drawerTabBtnActive : ""
                                }`}
                            >
                                <Code2 size={12} />
                                <span>Payload</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveDetailTab("ota")}
                                className={`${desktopStyles.drawerTabBtn} ${
                                    activeDetailTab === "ota" ? desktopStyles.drawerTabBtnActive : ""
                                }`}
                            >
                                <Layers size={12} />
                                <span>OTA</span>
                            </button>
                        </div>

                        <div className={desktopStyles.drawerBody}>
                            {activeDetailTab === "payload" ? (
                                <pre className={desktopStyles.codeBox}>
                                    {selectedEvent.payload
                                        ? JSON.stringify(selectedEvent.payload, null, 2)
                                        : "Tidak ada payload JSON."}
                                </pre>
                            ) : activeDetailTab === "ota" ? (
                                <pre className={desktopStyles.codeBox}>
                                    {selectedEvent.ota_responses && selectedEvent.ota_responses.length > 0
                                        ? JSON.stringify(selectedEvent.ota_responses, null, 2)
                                        : "Belum ada response OTA."}
                                </pre>
                            ) : (
                                <pre className={desktopStyles.codeBox}>
                                    {selectedEvent.details
                                        ? typeof selectedEvent.details === "string"
                                            ? selectedEvent.details
                                            : JSON.stringify(selectedEvent.details, null, 2)
                                        : JSON.stringify(selectedEvent, null, 2)}
                                </pre>
                            )}
                        </div>

                        <div className={desktopStyles.drawerFooter}>
                            <span className={desktopStyles.timestampCell}>
                                {formatTimestampWithMs(selectedEvent.inserted_at || selectedEvent.started_at)}
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelectedEvent(null)}
                                className={desktopStyles.btnCancel}
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
