"use client";

import React, { useState, useEffect } from "react";
import { Terminal, RefreshCw, CheckCircle2, AlertTriangle, XCircle, RotateCcw, Clock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import styles from "./ChannelActionLogs.module.css";

interface OtaResponseDetail {
    ota: string;
    status: string;
    code: number;
    message: string;
}

interface ChannelTaskLog {
    id: string;
    task_type: string;
    entity?: string;
    status: "SUCCESS" | "WARNING" | "FAILED" | "PENDING";
    inserted_at: string;
    latency_ms?: number;
    message: string;
    ota_responses?: OtaResponseDetail[];
}

interface Props {
    hotelCode: string;
}

export function ChannelActionLogsTab({ hotelCode }: Props) {
    const [logs, setLogs] = useState<ChannelTaskLog[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [retryingId, setRetryingId] = useState<string | null>(null);

    const fetchLogs = async () => {
        if (!hotelCode) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/channex/tasks?hotelCode=${hotelCode}`);
            const data = await res.json();
            if (data.success && data.logs) {
                setLogs(data.logs);
            }
        } catch (err: any) {
            console.error("Error fetching logs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [hotelCode]);

    const handleRetryTask = async (log: ChannelTaskLog) => {
        setRetryingId(log.id);
        try {
            // Trigger retry via sync-ari
            const res = await fetch("/api/channex/sync-ari", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hotelCode, type: "availability" })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Task ${log.id} berhasil dikirim ulang ke Channex.`);
                fetchLogs();
            } else {
                toast.error(data.error || "Gagal mengulang task");
            }
        } catch (err) {
            toast.error("Gagal melakukan retry koneksi.");
        } finally {
            setRetryingId(null);
        }
    };

    return (
        <div className={styles.container}>
            {/* Top Toolbar */}
            <div className={styles.topBar}>
                <div className={styles.titleGroup}>
                    <div className={styles.title}>
                        <Terminal size={16} color="#1e3a2f" />
                        <span>Real-Time Task &amp; Channel Actions Audit Log</span>
                    </div>
                    <span className={styles.desc}>
                        Audit trail komprehensif seluruh pembaruan API dari My Tara ke Channex beserta respons pengakuan (*OTA Acceptance / Rejection Diagnostics*).
                    </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                        type="button"
                        onClick={fetchLogs}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                        title="Segarkan Log"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                        Total <b>{logs.length} Log Aktivitas</b>
                    </span>
                </div>
            </div>

            {/* Table */}
            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Waktu &amp; Task ID</th>
                            <th className={styles.th}>Endpoint Operasi</th>
                            <th className={styles.th}>Status Channex</th>
                            <th className={styles.th}>Latensi</th>
                            <th className={styles.th}>Pesan / Diagnosa OTA</th>
                            <th className={styles.th} style={{ textAlign: "right" }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => {
                            const isSuccess = log.status === "SUCCESS";
                            const isWarning = log.status === "WARNING";
                            const isFailed = log.status === "FAILED";

                            return (
                                <tr key={log.id} className={styles.tr}>
                                    <td className={styles.td}>
                                        <div style={{ fontWeight: 600, color: "#0f172a" }}>
                                            {new Date(log.inserted_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                        </div>
                                        <div style={{ fontSize: "10px", color: "#64748b", fontFamily: "monospace" }}>
                                            {log.id}
                                        </div>
                                    </td>
                                    <td className={styles.td}>
                                        <span style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "11px", color: "#1e3a2f" }}>
                                            {log.task_type}
                                        </span>
                                        {log.entity && (
                                            <div style={{ fontSize: "10px", color: "#64748b" }}>{log.entity}</div>
                                        )}
                                    </td>
                                    <td className={styles.td}>
                                        <span className={isSuccess ? styles.badgeSuccess : isWarning ? styles.badgeWarning : styles.badgeError}>
                                            {isSuccess ? <CheckCircle2 size={12} /> : isWarning ? <AlertTriangle size={12} /> : <XCircle size={12} />}
                                            <span>{log.status}</span>
                                        </span>
                                    </td>
                                    <td className={styles.td}>
                                        <span style={{ fontSize: "11px", color: "#475569" }}>
                                            {log.latency_ms ? `${log.latency_ms} ms` : "-"}
                                        </span>
                                    </td>
                                    <td className={styles.td} style={{ maxWidth: "340px" }}>
                                        <div style={{ fontSize: "12px", color: "#334155" }}>{log.message}</div>
                                        {log.ota_responses && log.ota_responses.length > 0 && (
                                            <div className={styles.otaList}>
                                                {log.ota_responses.map((resp, i) => (
                                                    <div key={i} className={styles.otaItem}>
                                                        <span style={{ fontWeight: 600 }}>{resp.ota}</span>
                                                        <span style={{ color: resp.status === "ACK_OK" ? "#15803d" : "#b45309" }}>
                                                            {resp.message}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className={styles.td} style={{ textAlign: "right" }}>
                                        <button
                                            type="button"
                                            onClick={() => handleRetryTask(log)}
                                            disabled={retryingId === log.id}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "4px",
                                                padding: "3px 8px",
                                                fontSize: "11px",
                                                background: "#f1f5f9",
                                                border: "1px solid #cbd5e1",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                color: "#334155"
                                            }}
                                            title="Kirim ulang pembaruan ini"
                                        >
                                            <RotateCcw size={11} className={retryingId === log.id ? "animate-spin" : ""} />
                                            <span>{retryingId === log.id ? "Retrying..." : "Uji Ulang"}</span>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}

                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                                    Belum ada catatan log diagnostik saluran.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
