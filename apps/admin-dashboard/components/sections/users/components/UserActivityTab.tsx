import React, { useState, useEffect } from "react";
import { 
    Activity, Search, RefreshCw, Clock, 
    User, Globe, Shield, Laptop, MapPin
} from "lucide-react";
import { UserActivityLog } from "../types";
import styles from "./UserActivity.module.css";
import commonStyles from "../UsersStyles.module.css";
import { toast } from "sonner";
import { detectClientCity } from "@/lib/clientGeo";

interface UserActivityTabProps {
    hotelCode: string;
}

export const UserActivityTab: React.FC<UserActivityTabProps> = ({ hotelCode }) => {
    const [logs, setLogs] = useState<UserActivityLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedModule, setSelectedModule] = useState<string>("all");

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (hotelCode) queryParams.set("hotelCode", hotelCode);
            if (selectedModule !== "all") queryParams.set("module", selectedModule);
            queryParams.set("limit", "80");

            const res = await fetch(`/api/users/activity?${queryParams.toString()}`);
            let data: any = { success: false, logs: [] };
            try {
                data = await res.json();
            } catch {
                const text = await res.text().catch(() => "");
                data = { success: false, error: text || "Respons server tidak valid", logs: [] };
            }
            if (data.success) {
                const rawLogs: UserActivityLog[] = data.logs || [];
                setLogs(rawLogs);

                // Auto-enrich any logs whose location is generic or missing
                detectClientCity().then(currentCity => {
                    if (!currentCity || currentCity === "Indonesia") return;
                    setLogs(prev => prev.map(l => {
                        if (!l.location || l.location === "Indonesia" || l.location === "Indonesia (Online)") {
                            return { ...l, location: currentCity };
                        }
                        return l;
                    }));
                });
            } else {
                toast.error(data.error || "Gagal memuat log aktivitas");
            }
        } catch (err: any) {
            console.error("Fetch user activity error:", err);
            toast.error("Gagal mengambil catatan aktivitas pengguna");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [hotelCode, selectedModule]);

    const filteredLogs = logs.filter(log => {
        const query = searchQuery.toLowerCase();
        return (
            (log.userName || "").toLowerCase().includes(query) ||
            (log.userEmail || "").toLowerCase().includes(query) ||
            (log.description || "").toLowerCase().includes(query) ||
            (log.action || "").toLowerCase().includes(query)
        );
    });

    const formatTime = (isoString?: string) => {
        if (!isoString) return "-";
        try {
            const date = new Date(isoString);
            return date.toLocaleString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });
        } catch {
            return isoString;
        }
    };

    const getActionBadgeClass = (action: string) => {
        const act = action.toUpperCase();
        if (act.includes("CREATE") || act.includes("LOGIN")) return `${styles.actionBadge} ${styles.badgeCreate}`;
        if (act.includes("DELETE") || act.includes("VOID") || act.includes("CANCEL")) return `${styles.actionBadge} ${styles.badgeDelete}`;
        if (act.includes("UPDATE") || act.includes("EDIT")) return `${styles.actionBadge} ${styles.badgeUpdate}`;
        return `${styles.actionBadge} ${styles.badgeDefault}`;
    };

    return (
        <div className={styles.container}>
            {/* Filter Bar */}
            <div className={styles.filterCard}>
                <div className={styles.searchCluster}>
                    <div className={styles.searchInputWrapper}>
                        <Search size={14} className={styles.searchIcon} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Cari user, aksi, atau keterangan aktivitas..."
                            className={styles.searchInput}
                        />
                    </div>

                    <select
                        value={selectedModule}
                        onChange={e => setSelectedModule(e.target.value)}
                        className={styles.moduleSelect}
                    >
                        <option value="all">Semua Modul</option>
                        <option value="USER_MANAGEMENT">User Management</option>
                        <option value="FRONT_OFFICE">Front Office</option>
                        <option value="POS">POS (Kasir)</option>
                        <option value="CHANNEL_MANAGER">Channel Manager</option>
                        <option value="SYSTEM">System &amp; Auth</option>
                    </select>
                </div>

                <div className={styles.statsCluster}>
                    <span className={styles.statsText}>
                        Total: <b className={styles.statsBold}>{filteredLogs.length}</b> catatan
                    </span>
                    <button
                        type="button"
                        onClick={fetchLogs}
                        disabled={loading}
                        className={styles.btnRefresh}
                    >
                        <RefreshCw size={13} className={loading ? commonStyles.animateSpin : ""} />
                        <span>{loading ? "Menyegarkan..." : "Refresh"}</span>
                    </button>
                </div>
            </div>

            {/* Activity Table */}
            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr className={styles.tableHeaderRow}>
                            <th className={styles.thTime}>Waktu &amp; Tanggal</th>
                            <th className={styles.thUser}>Pengguna (Staff)</th>
                            <th className={styles.thAction}>Aksi &amp; Modul</th>
                            <th className={styles.thDesc}>Rincian Perubahan / Aktivitas</th>
                            <th className={styles.thLocation}>Lokasi &amp; IP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className={styles.emptyStateCell}>
                                    <RefreshCw size={24} className={`${commonStyles.animateSpin} ${styles.emptyIcon}`} />
                                    <p>Memuat catatan aktivitas pengguna...</p>
                                </td>
                            </tr>
                        ) : filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className={styles.emptyStateCell}>
                                    <Activity size={28} className={styles.emptyIcon} />
                                    <p>Belum ada catatan aktivitas yang sesuai dengan filter.</p>
                                </td>
                            </tr>
                        ) : (
                            filteredLogs.map(log => {
                                return (
                                    <tr key={log.id} className={styles.tableRow}>
                                        <td className={styles.tdTime}>
                                             <div className={styles.timeCluster}>
                                                <Clock size={12} className={styles.timeIcon} />
                                                <span>{formatTime(log.timestamp)}</span>
                                            </div>
                                        </td>
                                        <td className={styles.tdUser}>
                                            <div className={styles.userCluster}>
                                                <div className={styles.userAvatar}>
                                                    {(log.userName || "U").charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className={styles.userNameText}>{log.userName}</div>
                                                    <div className={styles.userEmailText}>{log.userEmail}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={styles.tdAction}>
                                            <span className={getActionBadgeClass(log.action)}>
                                                {log.action}
                                            </span>
                                            <div className={styles.moduleSubtitle}>
                                                {log.module}
                                            </div>
                                        </td>
                                        <td className={styles.tdDesc}>
                                            {log.description}
                                        </td>
                                        <td className={styles.tdLocation}>
                                            <div className={styles.locationCluster} title={log.location || "Indonesia"}>
                                                <MapPin size={11} className={styles.locationIcon} />
                                                <span className={styles.locationText}>{log.location || "Indonesia"}</span>
                                            </div>
                                            <div className={styles.ipSubtitle}>{log.ipAddress || "127.0.0.1"}</div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
