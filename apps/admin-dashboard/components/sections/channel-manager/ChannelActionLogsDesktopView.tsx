"use client";

import React from "react";
import {
    RefreshCw,
    X,
    ChevronLeft,
    ChevronRight,
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
    Clock,
    Activity,
    Calendar,
    Terminal
} from "lucide-react";
import { ChannelTaskLog } from "./ChannelActionLogsTab";
import { EmptyStateExecutive } from "@/components/shared/EmptyStateExecutive";
import styles from "./ChannelActionLogsDesktopView.module.css";

export interface ChannelActionLogsViewProps {
    hotelCode: string;
    logs: ChannelTaskLog[];
    filteredLogs: ChannelTaskLog[];
    paginatedLogs: ChannelTaskLog[];
    loading: boolean;
    cleaningLogs: boolean;
    retentionDays: number;
    handleRetentionChange: (days: number) => Promise<void>;
    handleExecutePurge: () => Promise<void>;
    isPurgeModalOpen: boolean;
    setIsPurgeModalOpen: (open: boolean) => void;
    purgeMode: "all" | "obsolete";
    setPurgeMode: (mode: "all" | "obsolete") => void;
    logToDelete: ChannelTaskLog | null;
    setLogToDelete: (log: ChannelTaskLog | null) => void;
    handleExecuteDeleteSingle: () => Promise<void>;
    deletingSingleLog: boolean;
    actionFilter: string;
    setActionFilter: (val: string) => void;
    actionTypes: string[];
    startDate: string;
    setStartDate: (val: string) => void;
    endDate: string;
    setEndDate: (val: string) => void;
    resultFilter: string;
    setResultFilter: (val: string) => void;
    channelFilter: string;
    setChannelFilter: (val: string) => void;
    channelNames: string[];
    page: number;
    setPage: (p: number) => void;
    pageSize: number;
    setPageSize: (s: number) => void;
    totalPages: number;
    selectedEvent: ChannelTaskLog | null;
    setSelectedEvent: (log: ChannelTaskLog | null) => void;
    activeDetailTab: "diff" | "payload" | "ota" | "response";
    setActiveDetailTab: (t: "diff" | "payload" | "ota" | "response") => void;
    fetchingLiveTask: boolean;
    handleFetchLiveTask: (id: string) => Promise<void>;
    copiedField: string | null;
    handleCopy: (text: string, label: string) => void;
    fetchLogs: () => Promise<void>;
    formatTimestamp: (ts?: string) => string;
    formatTimestampWithMs: (ts?: string) => string;
    successRate: number;
    avgLatency: number;
}

export const ChannelActionLogsDesktopView: React.FC<ChannelActionLogsViewProps> = ({
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
}) => {
    // Helper to render git-style diff lines matching Linear standard
    const renderDiffLines = (diff: any, event: ChannelTaskLog) => {
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

        if (event.details) {
            return (
                <pre className={styles.codeBox}>
                    {typeof event.details === "string"
                        ? event.details
                        : JSON.stringify(event.details, null, 2)}
                </pre>
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
                    <span className={styles.diffText}>  &quot;event&quot;: &quot;{event.action}&quot;,</span>
                </div>
                <div className={styles.diffLine}>
                    <span className={styles.diffColNum}>3</span>
                    <span className={styles.diffColNum}>3</span>
                    <span className={styles.diffSign}> </span>
                    <span className={styles.diffText}>  &quot;channel&quot;: &quot;{event.channelName}&quot;,</span>
                </div>
                <div className={styles.diffLine}>
                    <span className={styles.diffColNum}>4</span>
                    <span className={styles.diffColNum}>4</span>
                    <span className={styles.diffSign}> </span>
                    <span className={styles.diffText}>  &quot;user&quot;: &quot;{event.user}&quot;,</span>
                </div>
                <div className={styles.diffLine}>
                    <span className={styles.diffColNum}>5</span>
                    <span className={styles.diffColNum}>5</span>
                    <span className={styles.diffSign}> </span>
                    <span className={styles.diffText}>  &quot;status&quot;: &quot;{event.status}&quot;,</span>
                </div>
                <div className={styles.diffLine}>
                    <span className={styles.diffColNum}>6</span>
                    <span className={styles.diffColNum}>6</span>
                    <span className={styles.diffSign}> </span>
                    <span className={styles.diffText}>  &quot;timestamp&quot;: &quot;{event.inserted_at}&quot;</span>
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
            {/* 1. Executive Telemetry KPI Strip */}
            <div className={styles.kpiStrip}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabelRow}>
                        <span className={styles.kpiLabel}>Total Audit Logs</span>
                        <Terminal size={14} className={styles.kpiIcon} />
                    </div>
                    <div className={styles.kpiValueRow}>
                        <span className={styles.kpiValue}>{logs.length}</span>
                        <span className={styles.kpiSubtext}>event tercatat</span>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabelRow}>
                        <span className={styles.kpiLabel}>Tingkat Keberhasilan</span>
                        <CheckCircle2 size={14} className={styles.kpiIcon} />
                    </div>
                    <div className={styles.kpiValueRow}>
                        <span className={styles.kpiValue}>{successRate}%</span>
                        <span className={styles.kpiSubtext}>status sukses</span>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabelRow}>
                        <span className={styles.kpiLabel}>Rata-rata Latensi</span>
                        <Activity size={14} className={styles.kpiIcon} />
                    </div>
                    <div className={styles.kpiValueRow}>
                        <span className={styles.kpiValue}>{avgLatency}ms</span>
                        <span className={styles.kpiSubtext}>waktu eksekusi</span>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabelRow}>
                        <span className={styles.kpiLabel}>Kebijakan Retensi</span>
                        <Clock size={14} className={styles.kpiIcon} />
                    </div>
                    <div className={styles.kpiValueRow}>
                        <span className={styles.kpiValue}>{retentionDays} Hari</span>
                        <span className={styles.kpiSubtext}>auto-purge</span>
                    </div>
                </div>
            </div>

            {/* 2. Retention Management & Action Bar */}
            <div className={styles.retentionBar}>
                <div className={styles.retentionLeft}>
                    <span className={styles.retentionTitle}>
                        <ShieldCheck size={14} color="#059669" />
                        <span>Batas Retensi Database:</span>
                    </span>
                    <select
                        value={retentionDays}
                        onChange={e => handleRetentionChange(Number(e.target.value))}
                        className={styles.retentionSelect}
                    >
                        <option value={30}>Simpan 30 Hari (1 Bulan)</option>
                        <option value={60}>Simpan 60 Hari (2 Bulan) - Standar</option>
                        <option value={90}>Simpan 90 Hari (3 Bulan) - Rekomendasi</option>
                    </select>
                    <span className={styles.retentionDesc}>
                        Log lebih tua dari {retentionDays} hari otomatis dibersihkan untuk optimalisasi database.
                    </span>
                </div>

                <button
                    type="button"
                    onClick={() => setIsPurgeModalOpen(true)}
                    disabled={cleaningLogs}
                    className={styles.btnCleanLogs}
                >
                    <Trash2 size={12} className={cleaningLogs ? "animate-spin" : ""} />
                    <span>{cleaningLogs ? "Membersihkan..." : "Purge / Hapus Log"}</span>
                </button>
            </div>

            {/* 3. Filter Toolbar */}
            <div className={styles.filterBar}>
                <div className={styles.filterInputsGroup}>
                    {/* Action Filter */}
                    <select
                        value={actionFilter}
                        onChange={e => {
                            setActionFilter(e.target.value);
                            setPage(1);
                        }}
                        className={styles.filterSelect}
                    >
                        <option value="all">Semua Tipe Aksi</option>
                        {actionTypes.map(act => (
                            <option key={act} value={act}>{act}</option>
                        ))}
                    </select>

                    {/* Result Filter */}
                    <select
                        value={resultFilter}
                        onChange={e => {
                            setResultFilter(e.target.value);
                            setPage(1);
                        }}
                        className={styles.filterSelect}
                    >
                        <option value="all">Semua Status</option>
                        <option value="Success">Success</option>
                        <option value="Failed">Failed</option>
                        <option value="Warning">Warning</option>
                    </select>

                    {/* Channel Filter */}
                    {channelNames.length > 1 && (
                        <select
                            value={channelFilter}
                            onChange={e => {
                                setChannelFilter(e.target.value);
                                setPage(1);
                            }}
                            className={styles.filterSelect}
                        >
                            <option value="all">Semua Saluran</option>
                            {channelNames.map(cn => (
                                <option key={cn} value={cn}>{cn}</option>
                            ))}
                        </select>
                    )}

                    {/* Date Range */}
                    <div className={styles.dateRangeGroup}>
                        <Calendar size={12} color="#71717a" />
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
                        <span className={styles.dateArrow}>&rarr;</span>
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
                </div>

                <button
                    type="button"
                    onClick={fetchLogs}
                    className={styles.btnRefresh}
                    title="Refresh channel events log"
                >
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                    <span>Refresh Log</span>
                </button>
            </div>

            {/* 4. High-Density Audit Table */}
            <div className={styles.tableCard}>
                <div className={styles.tableResponsive}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Aksi / Event</th>
                                <th className={styles.th}>Channex Task ID</th>
                                <th className={styles.th}>Saluran</th>
                                <th className={styles.th}>Operator</th>
                                <th className={styles.th}>Waktu Mulai</th>
                                <th className={styles.th}>Latensi</th>
                                <th className={`${styles.th} ${styles.thActionRight}`}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className={styles.tableEmptyCellWrapper}>
                                        <EmptyStateExecutive
                                            illustrationSrc="/images/illustrations-3d/3d-biz-05.webp"
                                            illustrationAlt="Semua Jalur Distribusi Normal"
                                            title="Semua Jalur Distribusi Normal"
                                            description={loading ? "Sedang memverifikasi riwayat aktivitas distribusi..." : "Belum ada rekaman transmisi atau webhook bermasalah pada parameter filter saat ini."}
                                            actionLabel={resultFilter !== "all" || channelFilter !== "all" ? "Reset Parameter Filter" : undefined}
                                            onAction={resultFilter !== "all" || channelFilter !== "all" ? () => {
                                                setResultFilter("all");
                                                setChannelFilter("all");
                                                setPage(1);
                                            } : undefined}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                paginatedLogs.map(item => {
                                    const isSuccess = item.result.toLowerCase() === "success";
                                    const isFailed = item.result.toLowerCase() === "failed";
                                    const ids = (item.task_ids && item.task_ids.length > 0)
                                        ? item.task_ids
                                        : (item.task_id ? [item.task_id] : [item.id]);
                                    const isMulti = ids.length > 1;

                                    return (
                                        <tr key={item.id} className={styles.tr}>
                                            <td className={styles.td}>
                                                <div className={styles.actionCell}>
                                                    <span
                                                        className={`${styles.statusDot} ${
                                                            isSuccess
                                                                ? styles.statusDotSuccess
                                                                : isFailed
                                                                ? styles.statusDotError
                                                                : styles.statusDotWarning
                                                        }`}
                                                    />
                                                    <span className={styles.actionName}>{item.action}</span>
                                                </div>
                                            </td>

                                            <td className={styles.td}>
                                                {isMulti ? (
                                                    <div className={styles.multiTaskGroup}>
                                                        <div className={styles.multiTaskHeader}>
                                                            <span className={styles.multiTaskCount}>
                                                                {ids.length} Task IDs (Full Sync)
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCopy(ids.join("\n"), `task-all-${item.id}`);
                                                                }}
                                                                className={styles.btnCopyAllTasks}
                                                            >
                                                                {copiedField === `task-all-${item.id}` ? (
                                                                    <Check size={9} color="#10b981" />
                                                                ) : (
                                                                    <Copy size={9} />
                                                                )}
                                                                <span>{copiedField === `task-all-${item.id}` ? "Tersalin" : "Salin Keduanya"}</span>
                                                            </button>
                                                        </div>
                                                        <div className={styles.multiTaskList}>
                                                            {ids.map((tid, idx) => (
                                                                <div key={tid || idx} className={styles.multiTaskRow}>
                                                                    <span className={styles.multiTaskTag}>
                                                                        {idx === 0 ? "Avail" : "Rate"}
                                                                    </span>
                                                                    <span className={styles.multiTaskUuid} title={tid}>
                                                                        {tid}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleCopy(tid, `task-${item.id}-${idx}`);
                                                                        }}
                                                                        className={styles.btnIconSmall}
                                                                        title={`Salin Task ID: ${tid}`}
                                                                    >
                                                                        {copiedField === `task-${item.id}-${idx}` ? (
                                                                            <Check size={9} color="#10b981" />
                                                                        ) : (
                                                                            <Copy size={9} />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={styles.taskCellSingle}>
                                                        <span className={styles.taskUuidText} title={ids[0]}>
                                                            {ids[0]}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopy(ids[0], `task-${item.id}`);
                                                            }}
                                                            className={styles.btnIconSmall}
                                                            title={`Salin Task ID: ${ids[0]}`}
                                                        >
                                                            {copiedField === `task-${item.id}` ? (
                                                                <Check size={9} color="#10b981" />
                                                            ) : (
                                                                <Copy size={9} />
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>

                                            <td className={styles.td}>
                                                <span className={styles.channelPill}>
                                                    <Globe size={11} />
                                                    <span>{item.channelName || "Channex"}</span>
                                                </span>
                                            </td>

                                            <td className={styles.td}>
                                                <span className={styles.userCell}>{item.user || "System"}</span>
                                            </td>

                                            <td className={styles.td}>
                                                <span className={styles.timestampCell}>
                                                    {formatTimestamp(item.started_at || item.inserted_at)}
                                                </span>
                                            </td>

                                            <td className={styles.td}>
                                                <span className={styles.latencyCell}>
                                                    {item.execution_time_ms ? `${item.execution_time_ms}ms` : "-"}
                                                </span>
                                            </td>

                                            <td className={styles.td}>
                                                <div className={styles.actionsCell}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedEvent(item);
                                                            setActiveDetailTab("diff");
                                                        }}
                                                        className={styles.btnDetail}
                                                    >
                                                        <span>Detail</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setLogToDelete(item)}
                                                        className={styles.btnDeleteLog}
                                                        title="Hapus baris log ini"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 5. Pagination Bar */}
                <div className={styles.paginationBar}>
                    <div className={styles.paginationInfo}>
                        Menampilkan {filteredLogs.length > 0 ? (page - 1) * pageSize + 1 : 0} -{" "}
                        {Math.min(page * pageSize, filteredLogs.length)} dari {filteredLogs.length} total event
                    </div>

                    <div className={styles.paginationControls}>
                        <select
                            value={pageSize}
                            onChange={e => {
                                setPageSize(Number(e.target.value));
                                setPage(1);
                            }}
                            className={styles.pageSizeSelect}
                        >
                            <option value={6}>6 baris/hal</option>
                            <option value={12}>12 baris/hal</option>
                            <option value={24}>24 baris/hal</option>
                        </select>

                        <button
                            type="button"
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page <= 1}
                            className={styles.btnPage}
                        >
                            <ChevronLeft size={13} />
                        </button>
                        <span className={styles.pageNumber}>
                            {page} / {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page >= totalPages}
                            className={styles.btnPage}
                        >
                            <ChevronRight size={13} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 6. Event Detail Drawer Modal */}
            {selectedEvent && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setSelectedEvent(null)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className={styles.detailDrawer}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={styles.drawerHeader}>
                            <div className={styles.drawerTitleGroup}>
                                <h3 className={styles.drawerTitle}>{selectedEvent.action}</h3>
                                <span className={styles.channelPill}>
                                    {selectedEvent.channelName || "Channex"}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedEvent(null)}
                                className={styles.drawerCloseBtn}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <div className={styles.drawerTabsBar}>
                            <button
                                type="button"
                                onClick={() => setActiveDetailTab("diff")}
                                className={`${styles.drawerTabBtn} ${
                                    activeDetailTab === "diff" ? styles.drawerTabBtnActive : ""
                                }`}
                            >
                                <GitCompare size={12} />
                                <span>Git Diff</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveDetailTab("payload")}
                                className={`${styles.drawerTabBtn} ${
                                    activeDetailTab === "payload" ? styles.drawerTabBtnActive : ""
                                }`}
                            >
                                <Code2 size={12} />
                                <span>Payload JSON</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveDetailTab("ota")}
                                className={`${styles.drawerTabBtn} ${
                                    activeDetailTab === "ota" ? styles.drawerTabBtnActive : ""
                                }`}
                            >
                                <Layers size={12} />
                                <span>OTA Responses ({selectedEvent.ota_responses?.length || 0})</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveDetailTab("response")}
                                className={`${styles.drawerTabBtn} ${
                                    activeDetailTab === "response" ? styles.drawerTabBtnActive : ""
                                }`}
                            >
                                <Globe size={12} />
                                <span>Server Response</span>
                            </button>
                        </div>

                        <div className={styles.drawerBody}>
                            {activeDetailTab === "diff" && (
                                <div className={styles.diffContainer}>
                                    {renderDiffLines(selectedEvent.diff, selectedEvent)}
                                </div>
                            )}

                            {activeDetailTab === "payload" && (
                                <pre className={styles.codeBox}>
                                    {selectedEvent.payload
                                        ? JSON.stringify(selectedEvent.payload, null, 2)
                                        : "Tidak ada payload JSON tersimpan."}
                                </pre>
                            )}

                            {activeDetailTab === "ota" && (
                                <pre className={styles.codeBox}>
                                    {selectedEvent.ota_responses && selectedEvent.ota_responses.length > 0
                                        ? JSON.stringify(selectedEvent.ota_responses, null, 2)
                                        : "Belum ada response OTA delivery tercatat."}
                                </pre>
                            )}

                            {activeDetailTab === "response" && (
                                <pre className={styles.codeBox}>
                                    {selectedEvent.response
                                        ? JSON.stringify(selectedEvent.response, null, 2)
                                        : "Tidak ada response server spesifik."}
                                </pre>
                            )}
                        </div>

                        <div className={styles.drawerFooter}>
                            <span className={styles.timestampCell}>
                                Timestamp: {formatTimestampWithMs(selectedEvent.inserted_at || selectedEvent.started_at)}
                            </span>
                            <div className={styles.drawerFooterActions}>
                                {selectedEvent.task_id && (
                                    <button
                                        type="button"
                                        onClick={() => handleFetchLiveTask(selectedEvent.task_id!)}
                                        disabled={fetchingLiveTask}
                                        className={styles.btnDetail}
                                    >
                                        <RefreshCw size={11} className={fetchingLiveTask ? "animate-spin" : ""} />
                                        <span>{fetchingLiveTask ? "Syncing..." : "Live Task Sync"}</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setSelectedEvent(null)}
                                    className={styles.btnCancel}
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 7. Purge Confirmation Modal */}
            {isPurgeModalOpen && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => !cleaningLogs && setIsPurgeModalOpen(false)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className={styles.confirmDialog}
                        onClick={e => e.stopPropagation()}
                    >
                        <h4 className={styles.confirmTitle}>Konfirmasi Pembersihan Log</h4>
                        <p className={styles.confirmText}>
                            Pilih cakupan log yang ingin dihapus dari database CRS Setara:
                        </p>

                        <div className={styles.purgeScopeList}>
                            <label className={styles.purgeScopeLabel}>
                                <input
                                    type="radio"
                                    name="purgeScope"
                                    checked={purgeMode === "obsolete"}
                                    onChange={() => setPurgeMode("obsolete")}
                                />
                                <span>Hanya log kedaluwarsa (&gt; {retentionDays} hari)</span>
                            </label>

                            <label className={styles.purgeScopeLabelDanger}>
                                <input
                                    type="radio"
                                    name="purgeScope"
                                    checked={purgeMode === "all"}
                                    onChange={() => setPurgeMode("all")}
                                />
                                <span>Hapus seluruh log event (Reset Total)</span>
                            </label>
                        </div>

                        <div className={styles.confirmActions}>
                            <button
                                type="button"
                                onClick={() => setIsPurgeModalOpen(false)}
                                disabled={cleaningLogs}
                                className={styles.btnCancel}
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleExecutePurge}
                                disabled={cleaningLogs}
                                className={styles.btnDangerConfirm}
                            >
                                <Trash2 size={12} className={cleaningLogs ? "animate-spin" : ""} />
                                <span>{cleaningLogs ? "Membersihkan..." : "Hapus Sekarang"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 8. Single Delete Confirmation Modal */}
            {logToDelete && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => !deletingSingleLog && setLogToDelete(null)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className={styles.confirmDialog}
                        onClick={e => e.stopPropagation()}
                    >
                        <h4 className={styles.confirmTitle}>Hapus Baris Log Event?</h4>
                        <p className={styles.confirmText}>
                            Log event <b>{logToDelete.action}</b> ({logToDelete.id}) akan dihapus secara permanen dari database audit hotel.
                        </p>

                        <div className={styles.confirmActions}>
                            <button
                                type="button"
                                onClick={() => setLogToDelete(null)}
                                disabled={deletingSingleLog}
                                className={styles.btnCancel}
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleExecuteDeleteSingle}
                                disabled={deletingSingleLog}
                                className={styles.btnDangerConfirm}
                            >
                                <Trash2 size={12} className={deletingSingleLog ? "animate-spin" : ""} />
                                <span>{deletingSingleLog ? "Menghapus..." : "Hapus Log"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
