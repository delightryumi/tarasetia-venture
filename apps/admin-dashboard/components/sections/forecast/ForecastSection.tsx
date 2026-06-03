"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    Waves,
    Wallet,
    Hotel,
    CreditCard,
    UserPlus,
    Globe,
    MoreHorizontal,
    Search,
    ChevronDown,
    ArrowUpRight,
    Eye,
    Edit3,
    Trash2,
    PlusCircle,
    Percent,
    Coins,
    TrendingUp,
    Pencil,
    Sparkles,
    Droplets,
    Hammer,
    UserCheck,
    LogOut,
    Activity,
    Clock,
    AlertCircle,
    Coffee,
    Download,
    FileText,
    LayoutDashboard,
    PieChart as LucidePie, 
    BarChart as LucideBar
} from "lucide-react";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  CartesianGrid, AreaChart, Area
} from 'recharts';
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useRouter } from "next/navigation";
import { CustomDatePicker } from "./CustomDatePicker";
import { useForecast } from "./useForecast";
import { GuestDetailModal } from "../overview/GuestDetailModal";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import styles from "./ForecastStyles.module.css";

/* ── Brand Colors ── */
const PEACH = "#ffd8a6";
const SAGE = "#788069";
const RICH_BLACK = "#1A1C14";

/* ── Animations ── */
const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};
const rise = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export const ForecastSection: React.FC = () => {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<"daily" | "monthly" | "yearly">("daily");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [isOtherRevenueOpen, setIsOtherRevenueOpen] = useState(false);
    const [displayMode, setDisplayMode] = useState<"cards" | "charts">("cards");
    const [searchQuery, setSearchQuery] = useState("");
    const stats = useForecast(viewMode, selectedDate);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID').format(Math.floor(val));
    };

    const [selectedGuest, setSelectedGuest] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);

    const handleEdit = (booking: any) => {
        setSelectedGuest(booking);
        setIsEditing(true);
    };

    const [bookingToDelete, setBookingToDelete] = useState<any>(null);
    const [passwordInput, setPasswordInput] = useState("");

    const handleDeleteClick = (booking: any) => {
        setBookingToDelete(booking);
        setPasswordInput("");
    };

    const executeDelete = async () => {
        if (!bookingToDelete) return;

        if (passwordInput !== 'admin123' && passwordInput !== 'owner123') {
            toast.error("Password Admin salah! Penghapusan dibatalkan.");
            return;
        }

        try {
            const docRef = doc(db, "daily_revenue", bookingToDelete._docId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const entries = docSnap.data().entries || [];
                const updatedEntries = entries.filter((e: any) => e.timestamp !== bookingToDelete.timestamp);
                await updateDoc(docRef, { entries: updatedEntries });
                toast.success("Transaction deleted successfully");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete transaction");
        } finally {
            setBookingToDelete(null);
            setPasswordInput("");
            stats.refresh(); // Correctly trigger refresh using hook's internal state
        }
    };

    const handleStatusUpdate = async (booking: any, field: "guestStatus" | "roomStatus", value: string) => {
        try {
            const docRef = doc(db, "daily_revenue", booking._docId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const entries = docSnap.data().entries || [];
                const updatedEntries = entries.map((e: any) => {
                    if (e.timestamp === booking.timestamp) {
                        return { ...e, [field]: value };
                    }
                    return e;
                });
                await updateDoc(docRef, { entries: updatedEntries });
            }
        } catch (error) {
            console.error("Failed to update status:", error);
            toast.error("Status update failed");
        }
    };

    // ── Export Logic ──
    const handleExportExcel = () => {
        const data = stats.entries.map(e => ({
            "Waktu Input": new Date(e.timestamp).toLocaleString('id-ID'),
            "Nama Tamu / Kategori": e.guestName || e.incomeCategory,
            "Tipe": e.type === 'accommodation' ? 'Kamar' : 'Pendapatan Lain',
            "Check-In": e.checkInDate || '-',
            "Check-Out": e.checkOutDate || '-',
            "Room Type": e.roomType || '-',
            "Room No": e.roomNumber || '-',
            "Channel": e.channel || 'Internal',
            "Voucher": e.voucherCode || '-',
            "Total Tagihan": Number(e.amount),
            "Dibayar 1": Number(e.paidAmount1 || 0),
            "Dibayar 2": Number(e.paidAmount2 || 0),
            "Metode Bayar": e.paymentStatus,
            "Split Bill": e.isSplitBill ? 'Ya' : 'Tidak',
            "Sumber": e.source || '-',
            "Status Transaksi": e.status,
            "Input Oleh": e.staffName || '-',
            "Status Kamar": e.roomStatus || '-',
            "Status Tamu": e.guestStatus || '-',
            "Catatan": e.note || ''
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Full Report");
        XLSX.writeFile(wb, `Detailed_Forecast_${selectedDate}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4');
        
        doc.setFontSize(16);
        doc.text(`Detailed Forecast Report - Bumi Anyom Resort`, 14, 15);
        doc.setFontSize(9);
        doc.text(`Periode: ${formatDate(selectedDate)} | Exported: ${new Date().toLocaleString('id-ID')}`, 14, 22);

        const tableData = stats.entries.map(e => [
            e.checkInDate || '-',
            e.guestName || e.incomeCategory,
            e.roomNumber || '-',
            e.channel || 'Internal',
            `Rp ${formatCurrency(e.amount)}`,
            e.paymentStatus,
            e.status,
            e.staffName || '-'
        ]);

        autoTable(doc, {
            startY: 28,
            head: [['Date', 'Guest / Category', 'Room', 'Channel', 'Amount', 'Payment', 'Status', 'Staff']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [120, 128, 105], fontSize: 8 },
            styles: { fontSize: 7, cellPadding: 2 }
        });

        doc.save(`Detailed_Forecast_${selectedDate}.pdf`);
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;

            if (viewMode === "daily") {
                return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            }
            if (viewMode === "monthly") {
                return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            }
            return date.toLocaleDateString('id-ID', { year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    return (
        <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className={styles.overviewRoot}
        >
            {/* ─── Header & Controls ─── */}
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerBadge} style={{ backgroundColor: `${PEACH}30`, color: SAGE }}>
                            <Waves size={15} />
                        </div>
                        <div className={styles.headerMeta}>
                            <span className={styles.headerSubtitle}>Nexura Analytics</span>
                            <h1 className={styles.headerTitle}>
                                Forecast <span style={{ color: SAGE }}>& POS</span>
                            </h1>
                        </div>
                    </div>

                    <div className={styles.headerRight}>
                        {/* View Toggle */}
                        <div className={styles.toggleWrapper}>
                            <button
                                onClick={() => setViewMode("daily")}
                                className={`${styles.toggleBtn} ${viewMode === "daily" ? styles.toggleBtnActive : ""}`}
                            >
                                Daily
                            </button>
                            <button
                                onClick={() => setViewMode("monthly")}
                                className={`${styles.toggleBtn} ${viewMode === "monthly" ? styles.toggleBtnActive : ""}`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setViewMode("yearly")}
                                className={`${styles.toggleBtn} ${viewMode === "yearly" ? styles.toggleBtnActive : ""}`}
                            >
                                Yearly
                            </button>
                        </div>

                        <div className={styles.vDivider} />

                        {/* Date Picker (Custom CSS) */}
                        <CustomDatePicker
                            mode={viewMode}
                            value={selectedDate}
                            onChange={setSelectedDate}
                            formatDisplay={formatDate}
                        />

                        <div className={styles.vDivider} />

                        {/* Export Dropdown - Desktop */}
                        <button 
                            onClick={handleExportExcel}
                            className={styles.btnIcon}
                            style={{ height: '36px', width: '36px', borderRadius: '8px' }}
                            title="Export to Excel"
                        >
                            <Download size={16} />
                        </button>
                        <button 
                            onClick={handleExportPDF}
                            className={styles.btnIcon}
                            style={{ height: '36px', width: '36px', borderRadius: '8px' }}
                            title="Export to PDF"
                        >
                            <FileText size={16} />
                        </button>

                        <div className={styles.vDivider} />

                        {/* Display Toggle (Cards vs Charts) */}
                        <div className={styles.toggleWrapper}>
                            <button
                                onClick={() => setDisplayMode("cards")}
                                className={`${styles.toggleBtn} ${displayMode === "cards" ? styles.toggleBtnActive : ""}`}
                                style={{ padding: "0 12px", height: "36px" }}
                                title="Card View"
                            >
                                <LayoutDashboard size={16} />
                            </button>
                            <button
                                onClick={() => setDisplayMode("charts")}
                                className={`${styles.toggleBtn} ${displayMode === "charts" ? styles.toggleBtnActive : ""}`}
                                style={{ padding: "0 12px", height: "36px" }}
                                title="Analytics View"
                            >
                                <TrendingUp size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className={styles.mainContainer}>
                {/* ─── Main Content: Cards or Charts ─── */}
                <AnimatePresence mode="wait">
                    {displayMode === "cards" ? (
                        <motion.section 
                            key="cards"
                            variants={stagger}
                            initial="hidden"
                            animate="show"
                            exit={{ opacity: 0, x: -20 }}
                            className={styles.statGrid}
                        >
                            <SummaryCard
                                label="Total Gross Revenue"
                                icon={<TrendingUp size={18} />}
                                accent="#4ade80"
                                value={stats.totalGrossRevenue}
                                loading={stats.loading}
                                formatter={formatCurrency}
                            />
                            <SummaryCard
                                label="Sales (Pay at Hotel)"
                                icon={<Hotel size={18} />}
                                accent="#3b82f6"
                                value={stats.salesPayAtHotel}
                                loading={stats.loading}
                                formatter={formatCurrency}
                            />
                            <SummaryCard
                                label="Sales (Pay at Nexura)"
                                icon={<CreditCard size={18} />}
                                accent="#8b5cf6"
                                value={stats.salesPayAtNexura}
                                loading={stats.loading}
                                formatter={formatCurrency}
                            />
                            <SummaryCard
                                label="Walk-in Revenue"
                                icon={<UserPlus size={18} />}
                                accent="#cc6817ff"
                                value={stats.walkInRevenue}
                                loading={stats.loading}
                                formatter={formatCurrency}
                            />
                            <SummaryCard
                                label="OTA Revenue"
                                icon={<Globe size={18} />}
                                accent="#06b6d4"
                                value={stats.otaRevenue}
                                loading={stats.loading}
                                formatter={formatCurrency}
                            />
                            <SummaryCard
                                label="Other Revenue"
                                icon={<MoreHorizontal size={18} />}
                                accent="#ec4899"
                                value={stats.otherRevenue}
                                loading={stats.loading}
                                formatter={formatCurrency}
                                onClick={() => setIsOtherRevenueOpen(true)}
                            />
                            
                            {/* ─── NEW Performance Cards ─── */}
                            <SummaryCard
                                label="OCC (Occupancy)"
                                icon={<Percent size={18} />}
                                accent="#f59e0b"
                                prefix=""
                                suffix="%"
                                value={stats.occ}
                                loading={stats.loading}
                                formatter={(v) => v.toFixed(1)}
                            />
                            <SummaryCard
                                label="ARR (Avg Room Rate)"
                                icon={<Coins size={18} />}
                                accent="#10b981"
                                value={stats.arr}
                                loading={stats.loading}
                                formatter={formatCurrency}
                            />
                            <SummaryCard
                                label="RevPar"
                                icon={<TrendingUp size={18} />}
                                accent="#6366f1"
                                value={stats.revPar}
                                loading={stats.loading}
                                formatter={formatCurrency}
                            />
                        </motion.section>
                    ) : (
                        <motion.section
                            key="charts"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className={styles.chartsGrid}
                        >
                            {/* Revenue Distribution */}
                            <div className={styles.chartCard}>
                                <h3 className={styles.headerSubtitle} style={{ color: "var(--f-light-muted)", marginBottom: "32px" }}>Revenue Distribution</h3>
                                <div style={{ height: "300px" }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Hotel Collect', value: stats.salesPayAtHotel || 0 },
                                                    { name: 'Nexura Collect', value: stats.salesPayAtNexura || 0 },
                                                    { name: 'Other Income', value: stats.otherRevenue || 0 }
                                                ]}
                                                cx="50%" cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={8}
                                                dataKey="value"
                                                animationDuration={1500}
                                            >
                                                <Cell fill="#ffd8a6" />
                                                <Cell fill="#788069" />
                                                <Cell fill="#1A1C14" />
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: number) => `Rp ${formatCurrency(value)}`}
                                            />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Source Performance */}
                            <div className={styles.chartCard}>
                                <h3 className={styles.headerSubtitle} style={{ color: "var(--f-light-muted)", marginBottom: "32px" }}>Booking Channel Performance</h3>
                                <div style={{ height: "300px" }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={[
                                                { name: 'OTA', value: stats.otaRevenue || 0, fill: '#788069' },
                                                { name: 'Walk-in', value: stats.walkInRevenue || 0, fill: '#ffd8a6' },
                                                { name: 'Other', value: stats.otherRevenue || 0, fill: '#1A1C14' }
                                            ]}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#A8A29E' }} />
                                            <YAxis hide />
                                            <Tooltip 
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: number) => `Rp ${formatCurrency(value)}`}
                                            />
                                            <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={2000} barSize={50} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Performance Trajectory (Full Trend) */}
                            <div className={`${styles.chartCard} ${styles.spanFull}`}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
                                    <h3 className={styles.headerSubtitle} style={{ color: "var(--f-light-muted)" }}>
                                        Performance Trajectory 
                                        <span style={{ marginLeft: "8px", fontSize: "9px", color: "var(--f-light-muted)", opacity: 0.6 }}>
                                            ({viewMode === 'daily' ? 'Days of Month' : viewMode === 'monthly' ? 'Months of Year' : 'Multi-Year Trend'})
                                        </span>
                                    </h3>
                                    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#788069" }}></div>
                                            <span className={styles.headerSubtitle} style={{ fontSize: "8px" }}>Gross Revenue</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ffd8a6" }}></div>
                                            <span className={styles.headerSubtitle} style={{ fontSize: "8px" }}>OCC %</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ height: "400px" }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={stats.trendData}>
                                            <defs>
                                                <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={SAGE} stopOpacity={0.1}/>
                                                    <stop offset="95%" stopColor={SAGE} stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={PEACH} stopOpacity={0.1}/>
                                                    <stop offset="95%" stopColor={PEACH} stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis 
                                                dataKey="label" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fontSize: 10, fontWeight: 700, fill: '#A8A29E' }} 
                                            />
                                            <YAxis yAxisId="left" hide />
                                            <YAxis yAxisId="right" hide orientation="right" />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: any, name: string) => {
                                                    if (name === "gross") return [`Rp ${formatCurrency(value)}`, "Gross Revenue"];
                                                    if (name === "occ") return [`${value.toFixed(1)}%`, "Occupancy"];
                                                    if (name === "arr") return [`Rp ${formatCurrency(value)}`, "ADR"];
                                                    if (name === "revPar") return [`Rp ${formatCurrency(value)}`, "RevPAR"];
                                                    return [value, name];
                                                }}
                                            />
                                            <Area 
                                                yAxisId="left"
                                                type="monotone" 
                                                dataKey="gross" 
                                                stroke={SAGE} 
                                                strokeWidth={3} 
                                                fillOpacity={1} 
                                                fill="url(#colorGross)" 
                                                animationDuration={2000} 
                                            />
                                            <Area 
                                                yAxisId="right"
                                                type="monotone" 
                                                dataKey="occ" 
                                                stroke={PEACH} 
                                                strokeWidth={2} 
                                                strokeDasharray="5 5"
                                                fillOpacity={1} 
                                                fill="url(#colorOcc)" 
                                                animationDuration={2500} 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Efficiency Metrics */}
                            <div className={`${styles.spanFull} ${styles.summaryCardGrid3Col}`}>
                                <SummaryCard
                                    label="Occupancy Rate"
                                    icon={<Percent size={18} />}
                                    accent="#f59e0b"
                                    prefix=""
                                    suffix="%"
                                    value={stats.occ}
                                    loading={stats.loading}
                                    formatter={(v) => v.toFixed(1)}
                                />
                                <SummaryCard
                                    label="Average Room Rate"
                                    icon={<Coins size={18} />}
                                    accent="#10b981"
                                    value={stats.arr}
                                    loading={stats.loading}
                                    formatter={formatCurrency}
                                />
                                <SummaryCard
                                    label="RevPAR (Yield)"
                                    icon={<Activity size={18} />}
                                    accent="#6366f1"
                                    value={stats.revPar}
                                    loading={stats.loading}
                                    formatter={formatCurrency}
                                />
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>

            {/* ─── Bottom Section: Conditional by view mode ─── */}
            <AnimatePresence mode="wait">
                {viewMode === "daily" ? (

                    /* ── Daily: Transaction Table ── */
                    <motion.section
                        key="daily-table"
                        variants={rise}
                        initial="hidden"
                        animate="show"
                        exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
                        style={{ display: "flex", flexDirection: "column", gap: "20px" }}
                    >
                        <div className={styles.card} style={{ overflow: "hidden", padding: 0 }}>
                            <div className={styles.cardHeader} style={{ padding: "24px 24px 16px 24px", borderBottom: "1px solid var(--f-hairline)", marginBottom: 0 }}>
                                <div className={styles.cardHeaderLeft}>
                                    <div className={styles.headerBadge} style={{ backgroundColor: "#ffd8a6", color: "#788069" }}>
                                        <Activity size={15} />
                                    </div>
                                    <div className={styles.headerMeta}>
                                        <span className={styles.headerSubtitle}>Nexura Analytics</span>
                                        <h2 className={styles.headerTitle} style={{ fontSize: "13px" }}>
                                            Detail <span style={{ color: "#788069" }}>Transaksi</span>
                                        </h2>
                                        {activeFilter && (
                                            <button 
                                                onClick={() => setActiveFilter(null)}
                                                className={styles.guestSubtext}
                                                style={{ color: SAGE, cursor: "pointer", border: "none", background: "transparent", padding: 0, textDecoration: "underline", textAlign: "left", fontWeight: "bold" }}
                                            >
                                                Showing {activeFilter === 'other_income' ? 'Other Revenue' : activeFilter} — Clear Filter
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.headerRight}>
                                    <input
                                        type="text"
                                        placeholder="Cari transaksi..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className={styles.searchInput}
                                    />
                                </div>
                            </div>

                            {/* Table */}
                            <div className={styles.tableContainer}>
                                <table className={styles.tableElement}>
                                    <thead className={styles.tableHead}>
                                        <tr>
                                            <th className={styles.tableHeadCell}>Detail Tamu</th>
                                            <th className={styles.tableHeadCell}>Channel</th>
                                            <th className={styles.tableHeadCell} style={{ textAlign: "center" }}>Room & Notes</th>
                                            <th className={styles.tableHeadCell} style={{ textAlign: "center" }}>Tagihan / Info</th>
                                            <th className={styles.tableHeadCell} style={{ textAlign: "center" }}>Status</th>
                                            <th className={styles.tableHeadCell} style={{ textAlign: "center" }}>Sumber</th>
                                            <th className={styles.tableHeadCell} style={{ textAlign: "center" }}>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.loading ? (
                                            [...Array(5)].map((_, i) => (
                                                <tr key={i} className={styles.tableRow}>
                                                    <td colSpan={7} className={styles.tableCell} style={{ padding: "24px" }}>
                                                        <div style={{ height: "40px", width: "100%", backgroundColor: "var(--f-surface-soft)", borderRadius: "8px", animation: "pulse 1.5s infinite" }} />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : stats.entries.filter(e => 
                                            (!activeFilter || e.type === activeFilter) && 
                                            ((e.guestName || e.incomeCategory || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                                             (e.bookingId || "").toLowerCase().includes(searchQuery.toLowerCase()))
                                        ).length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className={styles.tableCell} style={{ padding: "80px 0", textAlign: "center" }}>
                                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                                                        <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "var(--f-surface-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--f-light-muted)" }}>
                                                            <Search size={24} />
                                                        </div>
                                                        <span className={styles.headerSubtitle} style={{ color: "var(--f-light-muted)" }}>
                                                            {activeFilter ? `No ${activeFilter.replace('_', ' ')} found` : "No transactions found for this period"}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            stats.entries.filter(e => 
                                                (!activeFilter || e.type === activeFilter) && 
                                                ((e.guestName || e.incomeCategory || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                 (e.bookingId || "").toLowerCase().includes(searchQuery.toLowerCase()))
                                            ).map((entry: any, i: number) => (
                                                <tr 
                                                    key={i} 
                                                    className={styles.tableRow}
                                                    style={i % 2 === 0 ? { backgroundColor: "#ffffff" } : { backgroundColor: "#fffbf9" }}
                                                >
                                                    {/* Detail Tamu */}
                                                    <td className={styles.tableCell}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                                            <div 
                                                                style={{ 
                                                                    width: "40px", 
                                                                    height: "40px", 
                                                                    borderRadius: "50%", 
                                                                    overflow: "hidden", 
                                                                    border: "1px solid var(--f-hairline)", 
                                                                    display: "flex", 
                                                                    alignItems: "center", 
                                                                    justifyContent: "center", 
                                                                    padding: 0,
                                                                    flexShrink: 0,
                                                                    backgroundColor: ['#ffd8a630', '#78806930', '#f3e8ff', '#e0e7ff', '#dcfce7', '#fee2e2', '#fef3c7'][((((entry.guestName || entry.incomeCategory || "O").charCodeAt(0) || 0) + (entry.amount || 0)) % 7)] 
                                                                }}
                                                            >
                                                                <img 
                                                                    src={`/avatar/memo_${((((entry.guestName || entry.incomeCategory || "O").charCodeAt(0) || 0) + (entry.amount || 0)) % 35) + 1}.png`} 
                                                                    alt={entry.guestName || "Guest"} 
                                                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                                />
                                                            </div>
                                                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                                <p className={styles.guestName} style={{ margin: 0, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "150px" }}>
                                                                    {entry.guestName || entry.incomeCategory}
                                                                </p>
                                                                <p className={styles.guestSubtext} style={{ fontSize: "8px", color: "var(--f-light-muted)", margin: 0, fontFamily: "var(--f-font-mono)" }}>
                                                                    {entry.checkInDate ? `${entry.checkInDate} — ${entry.checkOutDate || entry.checkInDate}` : (entry.bookingId || (entry.type === 'other_income' ? `By: ${entry.staffName}` : "—"))}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {/* Channel */}
                                                    <td className={styles.tableCell}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                            <div style={{ width: "32px", height: "32px", borderRadius: "6px", backgroundColor: "#ffffff", border: "1px solid var(--f-hairline)", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                {entry.type === 'other_income' ? (
                                                                    <Coffee size={14} style={{ color: "var(--f-light-muted)" }} />
                                                                ) : (
                                                                    <img 
                                                                        src={
                                                                            (() => {
                                                                                const c = entry.channel || "";
                                                                                const lower = c.toLowerCase();
                                                                                if (lower.includes("traveloka")) return "/channels/traveloka.png";
                                                                                if (lower.includes("booking.com")) return "/channels/booking_com.png";
                                                                                if (lower.includes("tiket")) return "/channels/tiket_com.png";
                                                                                if (lower.includes("agoda")) return "/channels/agoda.png";
                                                                                if (lower.includes("airbnb")) return "/channels/airbnb.png";
                                                                                if (lower.includes("trip")) return "/channels/trip.png";
                                                                                if (lower.includes("expedia")) return "/channels/expedia.png";
                                                                                if (lower.includes("mg")) return "/channels/mg.png";
                                                                                if (lower.includes("walk")) return "/channels/walk_in.png";
                                                                                return "/channels/nexura.png";
                                                                            })()
                                                                        } 
                                                                        style={{ width: "20px", height: "20px", objectFit: "contain", opacity: 0.6 }}
                                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                                    />
                                                                )}
                                                            </div>
                                                            <span className={styles.guestSubtext} style={{ margin: 0, fontWeight: 700, color: "var(--f-light-muted)" }}>{entry.channel || "Internal"}</span>
                                                        </div>
                                                    </td>
                                                    {/* Room & Notes */}
                                                    <td className={styles.tableCell} style={{ textAlign: "center" }}>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                                                            <div style={{ display: "flex" }}>
                                                                <span className={styles.guestSubtext} style={{ fontWeight: 700, backgroundColor: "var(--f-surface-soft)", padding: "2px 6px", borderRadius: "4px", border: "1px solid var(--f-hairline)" }}>
                                                                    {entry.roomType || (entry.type === 'other_income' ? 'OTHER INCOME' : '—')}
                                                                </span>
                                                            </div>
                                                            {entry.roomNumber && (
                                                                <span className={styles.guestSubtext} style={{ color: "var(--f-sage)", fontWeight: 700, fontSize: "9px" }}>
                                                                    Room {entry.roomNumber}
                                                                </span>
                                                            )}
                                                            {entry.type !== 'other_income' && (
                                                                <RoomStatusPicker 
                                                                    current={entry.roomStatus || 'dirty'} 
                                                                    onChange={(val) => handleStatusUpdate(entry, 'roomStatus', val)} 
                                                                />
                                                            )}
                                                        </div>
                                                    </td>
                                                    {/* Tagihan / Info */}
                                                    <td className={styles.tableCell} style={{ textAlign: "center" }}>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
                                                            <p className={styles.guestAmount} style={{ margin: 0 }}>Rp {formatCurrency(entry.amount)}</p>
                                                            <span className={`${styles.paymentBadge} ${entry.paymentStatus?.includes('Lunas') || !entry.paymentStatus ? styles.paymentLunas : styles.paymentPending}`}>
                                                                {entry.paymentStatus || 'Pending'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    {/* Status */}
                                                    <td className={styles.tableCell} style={{ textAlign: "center" }}>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                                                            <div className={`${styles.paymentBadge} ${entry.status === 'CONFIRMED' ? styles.paymentLunas : styles.paymentPending}`} style={{ margin: 0, fontSize: "8px" }}>
                                                                {entry.status}
                                                            </div>
                                                            {entry.type !== 'other_income' ? (
                                                                <GuestStatusPicker 
                                                                    current={entry.guestStatus || 'arriving'} 
                                                                    onChange={(val) => handleStatusUpdate(entry, 'guestStatus', val)}
                                                                />
                                                            ) : (
                                                                <span className={styles.guestSubtext} style={{ color: "var(--f-light-muted)", fontSize: "8px", fontWeight: 700, letterSpacing: "0.1em" }}>Service</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {/* Sumber */}
                                                    <td className={styles.tableCell} style={{ textAlign: "center" }}>
                                                        <span className={styles.guestSubtext} style={{ color: "var(--f-light-muted)", fontSize: "9px", fontWeight: 700 }}>{entry.source}</span>
                                                    </td>
                                                    {/* Aksi */}
                                                    <td className={styles.tableCell} style={{ textAlign: "center" }}>
                                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                                            <button onClick={() => setSelectedGuest(entry)} className={styles.btnIcon} style={{ width: "32px", height: "32px", borderRadius: "6px" }} title="View Details"><Eye size={14} /></button>
                                                            <button onClick={() => handleEdit(entry)} className={styles.btnIcon} style={{ width: "32px", height: "32px", borderRadius: "6px" }} title="Edit"><Pencil size={14} /></button>
                                                            <button onClick={() => handleDeleteClick(entry)} className={`${styles.btnIcon} ${styles.btnIconDanger}`} style={{ width: "32px", height: "32px", borderRadius: "6px" }} title="Delete"><Trash2 size={14} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderTop: "1px solid var(--f-hairline)", backgroundColor: "var(--f-surface)" }}>
                                <span className={styles.guestSubtext} style={{ fontSize: "9px", fontWeight: 700 }}>{stats.entries.length} transaksi ditemukan</span>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <button className={styles.btnIcon} style={{ width: "28px", height: "28px", borderRadius: "6px", cursor: "not-allowed", opacity: 0.5 }} disabled>
                                        <ChevronDown className="rotate-90" size={13} />
                                    </button>
                                    <button className={styles.btnIcon} style={{ width: "28px", height: "28px", borderRadius: "6px", cursor: "not-allowed", opacity: 0.5 }} disabled>
                                        <ChevronDown className="-rotate-90" size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                ) : (
                    /* ── Monthly/Yearly: Channel Performance ── */
                    <motion.section
                        key="monthly-channels"
                        variants={rise}
                        initial="hidden"
                        animate="show"
                        exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
                        style={{ display: "flex", flexDirection: "column", gap: "20px" }}
                    >
                        <div className={styles.card} style={{ overflow: "hidden", padding: 0 }}>
                            <div className={styles.cardHeader} style={{ padding: "24px 24px 16px 24px", borderBottom: "1px solid var(--f-hairline)", marginBottom: 0 }}>
                                <div className={styles.cardHeaderLeft}>
                                    <div className={styles.headerBadge} style={{ backgroundColor: "#ffd8a6", color: "#788069" }}>
                                        <Activity size={15} />
                                    </div>
                                    <div className={styles.headerMeta}>
                                        <span className={styles.headerSubtitle}>Nexura Analytics</span>
                                        <h2 className={styles.headerTitle} style={{ fontSize: "13px" }}>
                                            Channel <span style={{ color: "#788069" }}>Performance</span>
                                        </h2>
                                    </div>
                                </div>
                                <div className={styles.headerRight}>
                                    <span className={styles.headerSubtitle}>{formatDate(selectedDate)}</span>
                                </div>
                            </div>

                            <div className={styles.channelPerformanceGrid}>
                                {[
                                    { name: "Traveloka", file: "traveloka.png", color: "#00aaf2" },
                                    { name: "Booking.com", file: "booking_com.png", color: "#003580" },
                                    { name: "Tiket.com", file: "tiket_com.png", color: "#ff5e1a" },
                                    { name: "Agoda", file: "agoda.png", color: "#e8173e" },
                                    { name: "Airbnb", file: "airbnb.png", color: "#ff5a5f" },
                                    { name: "Trip.com", file: "trip.png", color: "#1890ff" },
                                    { name: "Expedia", file: "expedia.png", color: "#fbc02d" },
                                    { name: "MG Bedbank", file: "mg.png", color: "#6c3483" },
                                    { name: "Nexura Sales", file: "nexura.png", color: SAGE },
                                    { name: "Walk-in", file: "walk_in.png", color: "#2e7d32" },
                                    { name: "Booking Engine", file: "nexura.png", color: SAGE },
                                ].map((ch) => {
                                    const channelEntries = stats.entries.filter(e => e.channel === ch.name);
                                    const revenue = channelEntries.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
                                    const trxCount = channelEntries.length;
                                    const percentage = stats.totalGrossRevenue > 0 ? (revenue / stats.totalGrossRevenue) * 100 : 0;

                                    return { ...ch, revenue, trxCount, percentage };
                                }).map((ch, i) => (
                                    <motion.div
                                        key={ch.name}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
                                        whileHover={{ scale: 1.015, y: -2 }}
                                        className={`${styles.channelCard} ${i === 10 ? styles.channelCardSpan : ""}`}
                                    >
                                        {/* Accent glow background */}
                                        <div
                                            className={styles.summaryCardGlow}
                                            style={{ background: `radial-gradient(circle at 20% 50%, ${ch.color}, transparent 70%)`, opacity: 0.03 }}
                                        />

                                        {/* Channel Icon */}
                                        <div
                                            className={styles.cardIconBox}
                                            style={{ backgroundColor: `${ch.color}10`, borderColor: `${ch.color}20`, width: "44px", height: "44px", flexShrink: 0 }}
                                        >
                                            <img
                                                src={`/channels/${ch.file}`}
                                                alt={ch.name}
                                                style={{ width: "28px", height: "28px", objectFit: "contain" }}
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                            />
                                        </div>

                                        {/* Content: full width, 3 rows */}
                                        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                                            {/* Row 1: Name + % badge */}
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                                                <span className={styles.guestName} style={{ fontSize: "11px" }}>{ch.name}</span>
                                                <div
                                                    className={styles.paymentBadge}
                                                    style={{ backgroundColor: `${ch.color}15`, color: ch.color, fontSize: "9px" }}
                                                >
                                                    {ch.percentage.toFixed(1)}%
                                                </div>
                                            </div>

                                            {/* Row 2: Progress bar */}
                                            <div style={{ width: "100%", height: "4px", borderRadius: "9px", backgroundColor: "var(--f-hairline)", overflow: "hidden" }}>
                                                <motion.div
                                                    style={{ height: "100%", borderRadius: "9px", backgroundColor: ch.color }}
                                                    initial={{ width: "0%" }}
                                                    animate={{ width: `${ch.percentage}%` }}
                                                    transition={{ duration: 1.2, delay: i * 0.07, ease: "easeOut" }}
                                                />
                                            </div>

                                            {/* Row 3: Trx + Nominal side by side */}
                                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <span className={styles.datePickerLabel} style={{ fontSize: "8px" }}>Trx</span>
                                                    <span className={styles.guestSubtext} style={{ color: "var(--f-ink)", fontWeight: 700 }}>{ch.trxCount}</span>
                                                </div>
                                                <div className={styles.vDivider} style={{ height: "12px" }} />
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <span className={styles.datePickerLabel} style={{ fontSize: "8px" }}>Nominal</span>
                                                    <span className={styles.guestSubtext} style={{ color: "var(--f-ink)", fontWeight: 700 }}>Rp {formatCurrency(ch.revenue)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderTop: "1px solid var(--f-hairline)", backgroundColor: "var(--f-surface)" }}>
                                <span className={styles.guestSubtext}></span>
                                <span className={styles.guestSubtext} style={{ color: SAGE, fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: SAGE, display: "inline-block", animation: "pulse 2s infinite" }} />
                                    Live Analytics
                                </span>
                            </div>
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedGuest && (
                    <GuestDetailModal 
                        key={selectedGuest.timestamp || selectedGuest.bookingId || Math.random()}
                        guest={selectedGuest} 
                        isEditing={isEditing}
                        onClose={() => { setSelectedGuest(null); setIsEditing(false); }} 
                        onSave={() => { stats.refresh(); }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOtherRevenueOpen && (
                    <OtherRevenueDrawer 
                        entries={stats.entries.filter(e => e.type === 'other_income')} 
                        onClose={() => setIsOtherRevenueOpen(false)}
                        formatCurrency={formatCurrency}
                    />
                )}
            </AnimatePresence>

            {/* Custom Themed Confirmation Modal */}
            <AnimatePresence>
                {bookingToDelete && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="delete-modal-overlay"
                        onClick={() => setBookingToDelete(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="delete-modal-card"
                        >
                            <h3 className="delete-modal-title">
                                Are you absolutely sure want to delete ?
                            </h3>
                            <div className="delete-modal-desc">
                                <p>
                                    This action cannot be undone. This will permanently delete the transaction for{" "}
                                    <strong>
                                        {bookingToDelete.guestName || bookingToDelete.incomeCategory}
                                    </strong>.
                                </p>
                                
                                <div className="delete-modal-separator">
                                    <label htmlFor="adminPassword" className="delete-modal-label">
                                        Konfirmasi Password Admin
                                    </label>
                                    <input
                                        id="adminPassword"
                                        type="password"
                                        placeholder="Masukkan password admin..."
                                        value={passwordInput}
                                        onChange={(e) => setPasswordInput(e.target.value)}
                                        className="delete-modal-input"
                                        autoFocus
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') executeDelete();
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="delete-modal-footer">
                                <button 
                                    onClick={() => setBookingToDelete(null)}
                                    className="delete-modal-btn-cancel"
                                    style={{ cursor: "pointer" }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={executeDelete}
                                    className="delete-modal-btn-delete"
                                    style={{ cursor: "pointer" }}
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            </main>
        </motion.div>
    );
};

/* ── Summary Card Component ── */
function SummaryCard({ 
    label, 
    icon, 
    accent, 
    prefix = "Rp", 
    suffix = "",
    value = 0,
    loading = false,
    formatter,
    onClick,
    active
}: { 
    label: string, 
    icon: React.ReactNode, 
    accent: string,
    prefix?: string,
    suffix?: string,
    value?: number,
    loading?: boolean,
    formatter?: (val: number) => string,
    onClick?: () => void,
    active?: boolean
}) {
    return (
        <motion.div
            variants={rise}
            whileHover={{ y: -6, scale: 1.02 }}
            onClick={onClick}
            className={`${styles.summaryCard} ${onClick ? 'cursor-pointer' : 'cursor-default'} ${active ? styles.summaryCardActive : ''}`}
        >
            {/* Background Accent Glow */}
            <div 
                className={styles.summaryCardGlow} 
                style={{ backgroundColor: accent }}
            />

            {/* Top Row: Icon & Label */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", position: "relative", zIndex: 10 }}>
                <div 
                    className={styles.cardIconBox} 
                    style={{ backgroundColor: `${accent}0D`, color: accent, borderColor: `${accent}1A` }}
                >
                    {icon}
                </div>
                <span className={styles.cardLabel}>
                    {label}
                </span>
            </div>

            {/* Middle: Prominent Amount */}
            <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifycontent: "center", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    {prefix && (
                        <span className={styles.guestSubtext} style={{ fontSize: "12px", color: loading ? "var(--f-light-muted)" : "var(--f-muted)" }}>
                            {prefix}
                        </span>
                    )}
                    <p 
                        className={styles.cardValue} 
                        style={{ fontSize: "28px", color: loading ? "var(--f-light-muted)" : "var(--f-ink)" }}
                    >
                        {loading ? "—" : (formatter ? formatter(value) : value)}
                    </p>
                    {suffix && (
                        <span className={styles.guestSubtext} style={{ fontSize: "12px", color: loading ? "var(--f-light-muted)" : "var(--f-muted)" }}>
                            {suffix}
                        </span>
                    )}
                </div>
                <span className={styles.guestSubtext} style={{ fontSize: "7px", marginTop: "8px", opacity: loading ? 1 : 0, transition: "opacity 300ms" }}>
                    Real-time data
                </span>
                <div style={{ marginTop: "16px", width: "48px", height: "2px", borderRadius: "9px", backgroundColor: `${accent}20` }} />
            </div>

            {/* Subtle Percentage (Optional - Bottom Corner) */}
            <div style={{ position: "absolute", bottom: "16px", right: "20px", opacity: 0.4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px", fontWeight: "bold", color: "#10b981" }}>
                    <ArrowUpRight size={10} />
                    <span>0%</span>
                </div>
            </div>
        </motion.div>
    );
}

/* ── Status Picker Components ── */

function RoomStatusPicker({ current, onChange }: { current: string, onChange: (val: string) => void }) {
    const statuses = [
        { id: 'clean', label: 'Clean', color: '#10b981', icon: <Sparkles size={10} /> },
        { id: 'dirty', label: 'Dirty', color: '#f59e0b', icon: <Droplets size={10} /> },
        { id: 'maintenance', label: 'Maint.', color: '#ef4444', icon: <Hammer size={10} /> },
    ];

    const active = statuses.find(s => s.id === current) || statuses[1];

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {statuses.map((s) => (
                <button
                    key={s.id}
                    onClick={() => onChange(s.id)}
                    title={s.label}
                    style={{ 
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid",
                        cursor: "pointer",
                        transition: "all var(--f-duration-fast)",
                        backgroundColor: current === s.id ? `${s.color}15` : "transparent",
                        borderColor: current === s.id ? s.color : "transparent",
                        color: s.color,
                        opacity: current === s.id ? 1 : 0.3
                    }}
                >
                    {s.icon}
                </button>
            ))}
            <span className={styles.guestSubtext} style={{ fontSize: "8px", fontWeight: "bold", color: active.color, marginLeft: "4px" }}>
                {active.label}
            </span>
        </div>
    );
}

function GuestStatusPicker({ current, onChange }: { current: string, onChange: (val: string) => void }) {
    const statuses = [
        { id: 'arriving', label: 'Arriving', color: '#3b82f6', icon: <Clock size={10} /> },
        { id: 'checked_in', label: 'Checked In', color: '#10b981', icon: <UserCheck size={10} /> },
        { id: 'checked_out', label: 'Checked Out', color: '#71717a', icon: <LogOut size={10} /> },
        { id: 'no_show', label: 'No Show', color: '#ef4444', icon: <AlertCircle size={10} /> },
    ];

    return (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "4px", maxWidth: "120px" }}>
            {statuses.map((s) => (
                <button
                    key={s.id}
                    onClick={() => onChange(s.id)}
                    className={styles.guestSubtext}
                    style={{ 
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "7px",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        cursor: "pointer",
                        transition: "all var(--f-duration-fast)",
                        backgroundColor: current === s.id ? `${s.color}10` : "transparent",
                        borderColor: current === s.id ? `${s.color}40` : "transparent",
                        border: "1px solid",
                        color: current === s.id ? s.color : "#a8a29e",
                        opacity: current === s.id ? 1 : 0.4
                    }}
                >
                    {s.label}
                </button>
            ))}
        </div>
    );
}

/* ── Other Revenue Sidebar/Drawer ── */

function OtherRevenueDrawer({ entries, onClose, formatCurrency }: { entries: any[], onClose: () => void, formatCurrency: (v: number) => string }) {
    return (
        <>
            {/* Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className={styles.sidebarBackdrop}
            />
            
            {/* Drawer */}
            <motion.div 
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={styles.rightDrawer}
            >
                <header style={{ padding: "24px", borderBottom: "1px solid var(--f-hairline)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <span className={styles.headerSubtitle} style={{ fontSize: "8px" }}>Nexura Detail</span>
                        <h2 className={styles.headerTitle} style={{ fontSize: "13px", marginTop: "2px" }}>Other <span style={{ color: SAGE }}>Revenue</span></h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className={styles.btnIcon} 
                        style={{ width: "36px", height: "36px", borderRadius: "8px" }}
                    >
                        <LogOut size={16} style={{ transform: "rotate(180deg)" }} />
                    </button>
                </header>

                <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    {entries.length === 0 ? (
                        <div style={{ height: "200px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--f-light-muted)", gap: "16px" }}>
                            <Coffee size={32} strokeWidth={1} />
                            <p className={styles.headerSubtitle} style={{ fontSize: "8px" }}>No additional income today</p>
                        </div>
                    ) : (
                        entries.map((item, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={styles.channelCard}
                                style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", alignItems: "stretch" }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div className={styles.guestAvatar}>
                                            <Coffee size={14} style={{ color: "var(--f-sage)" }} />
                                        </div>
                                        <div>
                                            <h3 className={styles.guestName} style={{ margin: 0, fontSize: "11px" }}>{item.incomeCategory}</h3>
                                            <p className={styles.guestSubtext} style={{ margin: 0, fontSize: "8px" }}>{item.staffName}</p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <p className={styles.guestAmount} style={{ margin: 0 }}>Rp {formatCurrency(item.amount)}</p>
                                        <span className={`${styles.paymentBadge} ${item.paymentStatus?.includes('Lunas') || !item.paymentStatus ? styles.paymentLunas : styles.paymentPending}`} style={{ fontSize: "8px" }}>
                                            {item.paymentStatus}
                                        </span>
                                    </div>
                                </div>
                                
                                {item.note && (
                                    <div style={{ paddingTop: "8px", borderTop: "1px solid var(--f-hairline)", fontSize: "10px", color: "var(--f-muted)", fontStyle: "italic" }}>
                                        "{item.note}"
                                    </div>
                                )}
                                
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span className={styles.guestSubtext} style={{ fontSize: "8px", color: "var(--f-light-muted)" }}>
                                        {new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                <footer style={{ padding: "24px", backgroundColor: "var(--f-surface)", borderTop: "1px solid var(--f-hairline)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", fontWeight: 700, color: "var(--f-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        <span>Total Items</span>
                        <span style={{ color: "var(--f-ink)" }}>{entries.length}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", fontWeight: 800, marginTop: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        <span>Grand Total</span>
                        <span style={{ color: SAGE }}>
                            Rp {formatCurrency(entries.reduce((acc, e) => acc + (Number(e.amount) || 0), 0))}
                        </span>
                    </div>
                </footer>
            </motion.div>
        </>
    );
}

