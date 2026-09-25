import React, { useState } from "react";
import { Edit3, Trash2, SlidersHorizontal, ShieldCheck } from "lucide-react";
import styles from "./RoleManagementTable.module.css";
import { toast } from "sonner";

export interface SystemRoleItem {
    id: string;
    name: string;
    parentRole: string;
    description: string;
    isSystemDefault?: boolean;
}

export const HOTEL_SYSTEM_ROLES: SystemRoleItem[] = [
    { id: "administrator", name: "Administrator", parentRole: "--", description: "Otoritas penuh konfigurasi properti & seluruh modul hotel", isSystemDefault: true },
    { id: "general_manager", name: "General Manager", parentRole: "Administrator", description: "Pengawasan eksekutif operasional, laporan keuangan, & otorisasi", isSystemDefault: true },
    { id: "front_office_manager", name: "Front Office Manager", parentRole: "General Manager", description: "Supervisor front desk, reservasi tamu, penugasan kamar, & folio", isSystemDefault: true },
    { id: "front_office_associate", name: "Front Office Associate", parentRole: "Front Office Manager", description: "Resepsionis, check-in, check-out, GRC, dan transaksi folio", isSystemDefault: true },
    { id: "reservation_associate", name: "Reservation Associate", parentRole: "Front Office Manager", description: "Pemesanan kamar tamu, alokasi OTA, konfirmasi, dan voucher", isSystemDefault: true },
    { id: "night_auditor", name: "Night Auditor", parentRole: "Front Office Manager", description: "Proses tutup hari, posting tarif kamar & pajak, audit kasir, & DSR", isSystemDefault: true },
    { id: "housekeeping_manager", name: "Housekeeping Manager", parentRole: "General Manager", description: "Matriks kebersihan kamar, inspeksi, linen par stock, & defect", isSystemDefault: true },
    { id: "food_beverage_manager", name: "Food & Beverage Manager", parentRole: "General Manager", description: "Restoran hotel, terminal POS, order dapur KDS, dan banquet BEO", isSystemDefault: true },
    { id: "cashier_pos", name: "Cashier (POS)", parentRole: "Food & Beverage Manager", description: "Kasir outlet POS, bill settlement, split bill, & shift handover", isSystemDefault: true },
    { id: "revenue_manager", name: "Revenue Manager", parentRole: "General Manager", description: "Manajemen harga dinamis, stop sell, kuota kamar, & Channel Manager", isSystemDefault: true },
    { id: "finance_accounting", name: "Finance & Accounting", parentRole: "General Manager", description: "Laporan P&L, City Ledger AR, hutang AP, pajak PB1, & rekonsiliasi", isSystemDefault: true },
    { id: "purchasing_officer", name: "Purchasing Officer", parentRole: "General Manager", description: "Pengadaan barang, PO supplier, penerimaan GRN, & stock opname", isSystemDefault: true },
    { id: "human_resource", name: "Human Resource", parentRole: "General Manager", description: "Pengelolaan staf karyawan, presensi biometrik GPS, permohonan cuti, & administrasi HRD", isSystemDefault: true }
];

interface RoleManagementTableProps {
    searchQuery: string;
    onEditRolePermissions: (role: SystemRoleItem) => void;
}

export const RoleManagementTable: React.FC<RoleManagementTableProps> = ({
    searchQuery,
    onEditRolePermissions
}) => {
    const [rolesStatus, setRolesStatus] = useState<Record<string, boolean>>({});

    const toggleRole = (roleId: string, isSystem: boolean) => {
        if (roleId === "administrator") {
            toast.error("Role Administrator sistem tidak dapat dinonaktifkan.");
            return;
        }
        setRolesStatus(prev => ({
            ...prev,
            [roleId]: prev[roleId] !== undefined ? !prev[roleId] : false
        }));
    };

    const filteredRoles = HOTEL_SYSTEM_ROLES.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.parentRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.tableContainer}>
            {/* Desktop / Tablet Table View */}
            <div className={styles.desktopTableWrapper}>
                <div className={styles.tableScrollWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={`${styles.th} ${styles.thStatus}`}>Status</th>
                                <th className={styles.th}>User Role Name</th>
                                <th className={styles.th}>Parent Role</th>
                                <th className={`${styles.th} ${styles.thAction}`}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRoles.map((role) => {
                                const isActive = rolesStatus[role.id] !== undefined ? rolesStatus[role.id] : true;
                                const isSuperAdminRole = role.id === "administrator";

                                return (
                                    <tr key={role.id} className={styles.tr}>
                                        {/* Toggle Switch */}
                                        <td className={`${styles.td} ${styles.tdStatus}`}>
                                            <button
                                                type="button"
                                                disabled={isSuperAdminRole}
                                                onClick={() => toggleRole(role.id, Boolean(role.isSystemDefault))}
                                                className={`${styles.toggleSwitch} ${isActive ? styles.toggleOn : styles.toggleOff}`}
                                                title={isSuperAdminRole ? "Administrator selalu aktif" : (isActive ? "Active" : "Inactive")}
                                                style={isSuperAdminRole ? { opacity: 0.85, cursor: "default" } : {}}
                                            >
                                                <span className={`${styles.toggleThumb} ${isActive ? styles.toggleThumbOn : styles.toggleThumbOff}`} />
                                                <span className={`${styles.toggleLabel} ${isActive ? styles.toggleLabelOn : styles.toggleLabelOff}`}>
                                                    {isActive ? "On" : "Off"}
                                                </span>
                                            </button>
                                        </td>

                                        {/* Role Name */}
                                        <td 
                                            className={styles.td}
                                            onClick={() => onEditRolePermissions(role)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                <span className={styles.roleNameText}>{role.name}</span>
                                                <span style={{ fontSize: "11px", color: "#64748b" }}>{role.description}</span>
                                            </div>
                                        </td>

                                        {/* Parent Role */}
                                        <td className={styles.td}>
                                            <span className={styles.parentRoleText}>{role.parentRole}</span>
                                        </td>

                                        {/* Actions */}
                                        <td className={`${styles.td} ${styles.tdAction}`}>
                                            <div className={styles.actionsGroup}>
                                                <button
                                                    type="button"
                                                    onClick={() => onEditRolePermissions(role)}
                                                    className={styles.actionIconBtn}
                                                    title="Edit Role & Privileges"
                                                >
                                                    <Edit3 size={14} />
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={isSuperAdminRole}
                                                    onClick={() => {
                                                        if (isSuperAdminRole) return;
                                                        toast.error("Role bawaan sistem terlindungi.");
                                                    }}
                                                    className={`${styles.actionIconBtn} ${styles.actionIconBtnDanger}`}
                                                    style={isSuperAdminRole ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                                                    title={isSuperAdminRole ? "Role bawaan sistem tidak dapat dihapus" : "Delete Role"}
                                                >
                                                    <Trash2 size={14} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => onEditRolePermissions(role)}
                                                    className={styles.actionIconBtn}
                                                    title="View Permissions Matrix"
                                                >
                                                    <SlidersHorizontal size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile View: Responsive Role Cards */}
            <div className={styles.mobileCardsWrapper}>
                {filteredRoles.map((role) => {
                    const isActive = rolesStatus[role.id] !== undefined ? rolesStatus[role.id] : true;
                    const isSuperAdminRole = role.id === "administrator";

                    return (
                        <div key={`m-role-${role.id}`} className={styles.mobileRoleCard}>
                            <div className={styles.mobileRoleHeader}>
                                <div className={styles.mobileRoleNameCluster}>
                                    <span className={styles.mobileRoleName}>{role.name}</span>
                                    <span className={styles.mobileParentBadge}>Parent: {role.parentRole}</span>
                                </div>

                                <button
                                    type="button"
                                    disabled={isSuperAdminRole}
                                    onClick={() => toggleRole(role.id, Boolean(role.isSystemDefault))}
                                    className={`${styles.toggleSwitch} ${isActive ? styles.toggleOn : styles.toggleOff}`}
                                    title={isSuperAdminRole ? "Administrator selalu aktif" : (isActive ? "Active" : "Inactive")}
                                    style={isSuperAdminRole ? { opacity: 0.85, cursor: "default" } : {}}
                                >
                                    <span className={`${styles.toggleThumb} ${isActive ? styles.toggleThumbOn : styles.toggleThumbOff}`} />
                                    <span className={`${styles.toggleLabel} ${isActive ? styles.toggleLabelOn : styles.toggleLabelOff}`}>
                                        {isActive ? "On" : "Off"}
                                    </span>
                                </button>
                            </div>

                            <p className={styles.mobileRoleDesc}>{role.description}</p>

                            <div className={styles.mobileRoleFooter}>
                                <button
                                    type="button"
                                    onClick={() => onEditRolePermissions(role)}
                                    className={styles.mobilePermissionBtn}
                                >
                                    <SlidersHorizontal size={14} />
                                    <span>Atur Izin & Akses</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
