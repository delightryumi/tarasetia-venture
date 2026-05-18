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

    const handleDeleteClick = (booking: any) => {
        setBookingToDelete(booking);
    };

    const executeDelete = async () => {
        if (!bookingToDelete) return;

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
            className="w-full max-w-[1440px] mx-auto px-6 md:px-10 py-8 flex flex-col gap-8 font-sans"
        >
            {/* ─── Header & Controls ─── */}
            <motion.header variants={rise} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-100">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3.5 mb-1">
                        <div className="w-7 h-7 rounded-md flex items-center justify-center transition-transform hover:rotate-12" style={{ backgroundColor: `${PEACH}30`, color: SAGE }}>
                            <Waves size={13} />
                        </div>
                        <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-stone-400">Nexura Analytics</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight">
                        Forecast <span style={{ color: SAGE }}>& POS</span>
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                    {/* View Toggle */}
                    <div className="flex p-1 bg-stone-100 rounded-xl border border-stone-200/40 shadow-inner overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setViewMode("daily")}
                            className={`flex items-center justify-center h-10 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap min-w-[140px] ${viewMode === "daily"
                                ? "shadow-sm"
                                : "text-stone-400 hover:text-stone-600 hover:bg-stone-200/50"
                                }`}
                            style={viewMode === "daily" ? { backgroundColor: PEACH, color: RICH_BLACK } : {}}
                        >
                            Daily
                        </button>
                        <button
                            onClick={() => setViewMode("monthly")}
                            className={`flex items-center justify-center h-10 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap min-w-[140px] ${viewMode === "monthly"
                                ? "shadow-sm"
                                : "text-stone-400 hover:text-stone-600 hover:bg-stone-200/50"
                                }`}
                            style={viewMode === "monthly" ? { backgroundColor: PEACH, color: RICH_BLACK } : {}}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setViewMode("yearly")}
                            className={`flex items-center justify-center h-10 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap min-w-[140px] ${viewMode === "yearly"
                                ? "shadow-sm"
                                : "text-stone-400 hover:text-stone-600 hover:bg-stone-200/50"
                                }`}
                            style={viewMode === "yearly" ? { backgroundColor: PEACH, color: RICH_BLACK } : {}}
                        >
                            Yearly
                        </button>
                    </div>

                    {/* Date Picker (Custom CSS) */}
                    <CustomDatePicker
                        mode={viewMode}
                        value={selectedDate}
                        onChange={setSelectedDate}
                        formatDisplay={formatDate}
                    />



                    {/* Export Dropdown - Desktop */}
                    <div className="flex items-center gap-2 border-l border-stone-200 pl-4 ml-2">
                        <button 
                            onClick={handleExportExcel}
                            className="h-10 w-10 flex items-center justify-center rounded-lg bg-stone-50 border border-stone-100 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm"
                            title="Export to Excel"
                        >
                            <Download size={16} />
                        </button>
                        <button 
                            onClick={handleExportPDF}
                            className="h-10 w-10 flex items-center justify-center rounded-lg bg-stone-50 border border-stone-100 text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all shadow-sm"
                            title="Export to PDF"
                        >
                            <FileText size={16} />
                        </button>
                    </div>
                    {/* Display Toggle (Cards vs Charts) */}
                    <div className="flex p-1 bg-stone-100 rounded-xl border border-stone-200/40 shadow-inner ml-2">
                        <button
                            onClick={() => setDisplayMode("cards")}
                            className={`flex items-center justify-center h-10 w-10 rounded-lg transition-all ${displayMode === "cards" ? "bg-white shadow-sm text-stone-900" : "text-stone-400 hover:text-stone-600"}`}
                            title="Card View"
                        >
                            <LayoutDashboard size={16} />
                        </button>
                        <button
                            onClick={() => setDisplayMode("charts")}
                            className={`flex items-center justify-center h-10 w-10 rounded-lg transition-all ${displayMode === "charts" ? "bg-white shadow-sm text-stone-900" : "text-stone-400 hover:text-stone-600"}`}
                            title="Analytics View"
                        >
                            <TrendingUp size={16} />
                        </button>
                    </div>
                </div>
            </motion.header>

            {/* ─── Main Content: Cards or Charts ─── */}
            <AnimatePresence mode="wait">
                {displayMode === "cards" ? (
                    <motion.section 
                        key="cards"
                        variants={stagger}
                        initial="hidden"
                        animate="show"
                        exit={{ opacity: 0, x: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
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
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                    >
                        {/* Revenue Distribution */}
                        <div className="bg-white border border-stone-100 rounded-2xl p-8 shadow-xl shadow-stone-200/20">
                            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-8">Revenue Distribution</h3>
                            <div className="h-[300px]">
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
                        <div className="bg-white border border-stone-100 rounded-2xl p-8 shadow-xl shadow-stone-200/20">
                            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-8">Booking Channel Performance</h3>
                            <div className="h-[300px]">
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
                        <div className="lg:col-span-2 bg-white border border-stone-100 rounded-2xl p-8 shadow-xl shadow-stone-200/20">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest">
                                    Performance Trajectory 
                                    <span className="ml-2 text-[10px] text-stone-300">
                                        ({viewMode === 'daily' ? 'Days of Month' : viewMode === 'monthly' ? 'Months of Year' : 'Multi-Year Trend'})
                                    </span>
                                </h3>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-sage"></div>
                                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Gross Revenue</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-peach"></div>
                                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">OCC %</span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-[400px]">
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
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        className="flex flex-col gap-5"
                    >
                        {/* Section Title — outside the card */}
                        <div className="flex items-center justify-between px-1">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight">
                                    Detail <span style={{ color: SAGE }}>Transaksi</span>
                                </h2>
                                {activeFilter && (
                                    <button 
                                        onClick={() => setActiveFilter(null)}
                                        className="text-[10px] font-bold text-sage uppercase tracking-widest hover:underline text-left"
                                    >
                                        Showing {activeFilter === 'other_income' ? 'Other Revenue' : activeFilter} — Click to clear
                                    </button>
                                )}
                            </div>
                            <input
                                type="text"
                                placeholder="Cari..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 px-4 rounded-lg bg-stone-50 border border-stone-100 focus:bg-white focus:border-stone-300 outline-none text-xs text-stone-600 transition-colors duration-200 w-full sm:w-80 placeholder:text-stone-300"
                            />
                        </div>

                        <div 
                            className="bg-white p-6 md:p-8 lg:p-12 rounded-[24px] border border-stone-100 shadow-xl overflow-hidden"
                        >

                            {/* Table */}
                            <div className="overflow-x-auto scrollbar-hide">
                                <table className="w-full text-left border-collapse min-w-[900px]">
                                    <thead>
                                        <tr className="border-b border-stone-50 text-[10px] uppercase font-medium text-stone-300 tracking-[0.15em]">
                                            <th className="py-4 px-8 min-w-[200px] text-left">Detail Tamu</th>
                                            <th className="py-4 px-8 min-w-[160px] text-center">Channel</th>
                                            <th className="py-4 px-8 min-w-[180px] text-center">Room & Notes</th>
                                            <th className="py-4 px-8 min-w-[160px] text-center">Tagihan / Info</th>
                                            <th className="py-4 px-8 min-w-[130px] text-center">Status</th>
                                            <th className="py-4 px-8 min-w-[120px] text-center">Sumber</th>
                                            <th className="py-4 px-8 min-w-[100px] text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.loading ? (
                                            [...Array(5)].map((_, i) => (
                                                <tr key={i} className="border-b border-stone-50 last:border-0">
                                                    <td colSpan={7} className="py-6 px-8">
                                                        <div className="h-10 w-full bg-stone-50 animate-pulse rounded-xl" />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : stats.entries.filter(e => 
                                            (!activeFilter || e.type === activeFilter) && 
                                            ((e.guestName || e.incomeCategory || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                                             (e.bookingId || "").toLowerCase().includes(searchQuery.toLowerCase()))
                                        ).length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center text-stone-200">
                                                            <Search size={24} />
                                                        </div>
                                                        <span className="text-xs font-medium text-stone-300 uppercase tracking-widest">
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
                                                <tr key={i} className="group border-b border-stone-50 last:border-0 hover:bg-stone-50/40 transition-colors duration-150">
                                                    {/* Detail Tamu / Item */}
                                                    <td className="py-6 px-8 text-left">
                                                        <div className="flex items-center justify-start gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 font-bold text-xs uppercase border border-stone-200 flex-shrink-0">
                                                                {(entry.guestName || entry.incomeCategory || "O").charAt(0)}
                                                            </div>
                                                            <div className="text-left min-w-0">
                                                                <div className="text-sm font-bold text-stone-800 truncate">{entry.guestName || entry.incomeCategory}</div>
                                                                <div className="text-[10px] text-stone-400 font-medium truncate">{entry.bookingId || (entry.type === 'other_income' ? `By: ${entry.staffName}` : "#N/A")}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {/* Channel */}
                                                    <td className="py-6 px-8 text-center">
                                                        <div className="flex items-center justify-center gap-2.5">
                                                            {entry.type === 'other_income' ? (
                                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center border border-stone-100 bg-stone-50 text-stone-400">
                                                                    <Coffee size={14} />
                                                                </div>
                                                            ) : (
                                                                <div className="w-7 h-7 rounded-lg overflow-hidden border border-stone-100 bg-white p-1">
                                                                    <img 
                                                                        src={`/channels/${entry.channel?.toLowerCase().replace('.com', '_com').replace(' ', '_')}.png`} 
                                                                        className="w-full h-full object-contain"
                                                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                                                    />
                                                                </div>
                                                            )}
                                                            <span className="text-xs font-medium text-stone-600">{entry.channel || "Internal"}</span>
                                                        </div>
                                                    </td>
                                                    {/* Room & Notes */}
                                                    <td className="py-6 px-8 text-center">
                                                        <div className="flex flex-col items-center gap-1.5">
                                                            <div className="text-xs font-bold text-stone-700">{entry.roomType || (entry.type === 'other_income' ? 'OTHER INCOME' : '—')}</div>
                                                            <div className="text-[10px] text-stone-400 font-medium max-w-[150px] truncate">{entry.roomNumber ? `Room ${entry.roomNumber}` : (entry.note || "—")}</div>
                                                            
                                                            {/* Room Status Badge - Only for Rooms */}
                                                            {entry.type !== 'other_income' && (
                                                                <div className="flex items-center gap-1.5 mt-1">
                                                                    <RoomStatusPicker 
                                                                        current={entry.roomStatus || 'dirty'} 
                                                                        onChange={(val) => handleStatusUpdate(entry, 'roomStatus', val)} 
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {/* Tagihan */}
                                                    <td className="py-6 px-8 text-center">
                                                        <div className="text-xs font-black text-stone-800">
                                                            Rp {formatCurrency(entry.amount)}
                                                        </div>
                                                        <div className={`text-[9px] font-bold uppercase tracking-wider ${entry.paymentStatus === 'Pay at Nexura' ? 'text-indigo-500' : 'text-amber-600'}`}>
                                                            {entry.paymentStatus}
                                                        </div>
                                                    </td>
                                                    {/* Status */}
                                                    <td className="py-6 px-8 text-center">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                                entry.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'
                                                            }`}>
                                                                {entry.status}
                                                            </div>
                                                            
                                                            {/* Guest Operational Status */}
                                                            <GuestStatusPicker 
                                                                current={entry.guestStatus || 'arriving'} 
                                                                onChange={(val) => handleStatusUpdate(entry, 'guestStatus', val)}
                                                            />
                                                        </div>
                                                    </td>
                                                    {/* Sumber */}
                                                    <td className="py-6 px-8 text-center">
                                                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{entry.source}</span>
                                                    </td>
                                                    {/* Aksi */}
                                                    <td className="py-6 px-8 text-center">
                                                        <div className="flex items-center justify-center gap-2 opacity-30 group-hover:opacity-100 transition-opacity duration-200">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setSelectedGuest(entry); }}
                                                                className="p-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
                                                            >
                                                                <Eye size={13} />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleEdit(entry); }}
                                                                className="p-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
                                                            >
                                                                <Pencil size={13} />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(entry); }}
                                                                className="p-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-100 text-stone-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between px-8 py-4 border-t border-stone-50 bg-stone-50/20">
                                <span className="text-[10px] font-medium text-stone-300 uppercase tracking-widest">{stats.entries.length} transaksi ditemukan</span>
                                <div className="flex items-center gap-1.5">
                                    <button className="h-8 w-8 rounded-lg border border-stone-100 bg-white flex items-center justify-center text-stone-300 cursor-not-allowed">
                                        <ChevronDown className="rotate-90" size={13} />
                                    </button>
                                    <button className="h-8 w-8 rounded-lg border border-stone-100 bg-white flex items-center justify-center text-stone-300 cursor-not-allowed">
                                        <ChevronDown className="-rotate-90" size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                ) : (

                    /* ── Monthly: Channel Performance ── */
                    <motion.section
                        key="monthly-channels"
                        variants={rise}
                        initial="hidden"
                        animate="show"
                        exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
                        className="flex flex-col gap-5"
                    >
                        {/* Section Title — outside the card */}
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight">
                                Channel <span style={{ color: SAGE }}>Performance</span>
                            </h2>
                            <span className="text-[10px] font-medium text-stone-400 uppercase tracking-widest">
                                {formatDate(selectedDate)}
                            </span>
                        </div>

                        <div 
                            className="bg-white p-6 md:p-8 lg:p-12 rounded-[24px] border border-stone-100 shadow-xl overflow-hidden"
                        >
                            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                        className={`group flex items-center gap-4 px-5 py-4 rounded-xl border border-stone-100 hover:border-stone-200 hover:shadow-lg transition-all duration-300 cursor-default bg-white overflow-hidden relative ${i === 10 ? "md:col-span-2 md:max-w-[calc(50%-6px)] md:mx-auto w-full" : ""
                                            }`}
                                    >
                                        {/* Accent glow background */}
                                        <div
                                            className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none"
                                            style={{ background: `radial-gradient(circle at 20% 50%, ${ch.color}, transparent 70%)` }}
                                        />

                                        {/* Channel Icon */}
                                        <div
                                            className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border transition-all duration-300 group-hover:scale-105 shadow-sm"
                                            style={{ backgroundColor: `${ch.color}10`, borderColor: `${ch.color}20` }}
                                        >
                                            <img
                                                src={`/channels/${ch.file}`}
                                                alt={ch.name}
                                                className="w-7 h-7 object-contain"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                            />
                                        </div>

                                        {/* Content: full width, 3 rows */}
                                        <div className="flex-1 min-w-0 flex flex-col gap-2">

                                            {/* Row 1: Name + % badge */}
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-medium text-stone-700 truncate">{ch.name}</span>
                                                <div
                                                    className="flex-shrink-0 px-2 py-0.5 rounded-md text-[10px] font-medium"
                                                    style={{ backgroundColor: `${ch.color}15`, color: ch.color }}
                                                >
                                                    <span>
                                                        {ch.percentage.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Row 2: Progress bar */}
                                            <div className="w-full h-1 rounded-full bg-stone-100 overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full"
                                                    initial={{ width: "0%" }}
                                                    animate={{ width: `${ch.percentage}%` }}
                                                    transition={{ duration: 1.2, delay: i * 0.07, ease: "easeOut" }}
                                                    style={{ backgroundColor: ch.color }}
                                                />
                                            </div>

                                            {/* Row 3: Trx + Nominal side by side — uses full width */}
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className="text-[9px] text-stone-400 uppercase tracking-wider flex-shrink-0">Trx</span>
                                                    <span className="text-xs font-medium text-stone-700 tabular-nums">
                                                        {ch.trxCount}
                                                    </span>
                                                </div>
                                                <div className="h-3 w-px bg-stone-200 flex-shrink-0" />
                                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                    <span className="text-[9px] text-stone-400 uppercase tracking-wider flex-shrink-0">Nominal</span>
                                                    <span className="text-xs font-medium text-stone-700 tabular-nums truncate">
                                                        Rp {formatCurrency(ch.revenue)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between px-8 py-4 border-t border-stone-50 bg-stone-50/20">
                                <span className="text-[10px] font-medium text-stone-300 uppercase tracking-widest">

                                </span>
                                <span className="text-[10px] font-medium uppercase tracking-widest flex items-center gap-1.5" style={{ color: SAGE }}>
                                    <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ backgroundColor: SAGE }} />
                                    Live
                                </span>
                            </div>
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedGuest && (
                    <GuestDetailModal 
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
                        className="fixed inset-0 z-[300] bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setBookingToDelete(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[24px] p-8 max-w-md w-full shadow-2xl border border-stone-100"
                        >
                            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6">
                                <Trash2 size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-stone-900 font-outfit uppercase tracking-tight mb-2">Confirm Deletion</h3>
                            <p className="text-[11px] text-stone-500 uppercase tracking-widest leading-relaxed mb-8">
                                Are you sure you want to permanently delete the transaction for <span className="font-bold text-stone-900">{bookingToDelete.guestName || bookingToDelete.incomeCategory}</span>? This action cannot be undone.
                            </p>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setBookingToDelete(null)}
                                    className="flex-1 h-12 rounded-xl border border-stone-200 text-[11px] font-bold text-stone-600 uppercase tracking-widest hover:bg-stone-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={executeDelete}
                                    className="flex-1 h-12 rounded-xl bg-red-500 text-[11px] font-bold text-white uppercase tracking-widest hover:bg-red-600 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
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
            className={`group relative flex flex-col gap-8 p-7 rounded-xl bg-white border shadow-xl shadow-stone-200/20 hover:shadow-2xl transition-all duration-500 overflow-hidden ${
                onClick ? 'cursor-pointer' : 'cursor-default'
            } ${active ? 'border-sage ring-1 ring-sage/20' : 'border-stone-100 hover:border-stone-300'}`}
        >
            {/* Background Accent Glow */}
            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-[0.04] blur-2xl group-hover:scale-150 transition-transform duration-1000 pointer-events-none" style={{ backgroundColor: accent }}></div>

            {/* Top Row: Icon & Label */}
            <div className="flex items-center gap-3.5 relative z-10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm transition-all group-hover:rotate-6 duration-500"
                    style={{ backgroundColor: `${accent}0D`, color: accent, borderColor: `${accent}1A` }}>
                    {icon}
                </div>
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400 leading-tight block">
                    {label}
                </span>
            </div>

            {/* Middle: Prominent Amount */}
            <div className="relative z-10 flex flex-col items-center justify-center py-4 text-center">
                <div className="flex items-baseline gap-1.5">
                    {prefix && (
                        <span className={`text-sm font-medium transition-colors ${loading ? 'text-stone-300' : 'text-stone-400'}`}>
                            {prefix}
                        </span>
                    )}
                    <p className={`text-3xl font-medium tracking-tighter transition-all duration-500 ${loading ? 'text-stone-200 animate-pulse' : 'text-stone-900'}`}>
                        {loading ? "—" : (formatter ? formatter(value) : value)}
                    </p>
                    {suffix && (
                        <span className={`text-sm font-medium transition-colors ${loading ? 'text-stone-300' : 'text-stone-400'}`}>
                            {suffix}
                        </span>
                    )}
                </div>
                <span className={`mt-2 text-[8px] font-medium uppercase tracking-[0.2em] transition-opacity duration-500 ${loading ? 'text-stone-300 opacity-100' : 'text-stone-400 opacity-0 group-hover:opacity-100'}`}>
                    {loading ? "Calculating metrics..." : "Real-time data"}
                </span>
                <div className="mt-4 w-12 h-0.5 rounded-full bg-stone-100 group-hover:w-20 transition-all duration-700" style={{ backgroundColor: `${accent}20` }} />
            </div>

            {/* Subtle Percentage (Optional - Bottom Corner) */}
            <div className="absolute bottom-4 right-5 opacity-40 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1 text-[9px] font-medium text-emerald-500">
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
        <div className="flex items-center gap-1">
            {statuses.map((s) => (
                <button
                    key={s.id}
                    onClick={() => onChange(s.id)}
                    title={s.label}
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 border ${
                        current === s.id 
                            ? 'scale-110 shadow-sm' 
                            : 'opacity-20 grayscale hover:opacity-100 hover:grayscale-0'
                    }`}
                    style={{ 
                        backgroundColor: current === s.id ? `${s.color}15` : 'transparent',
                        borderColor: current === s.id ? s.color : 'transparent',
                        color: s.color 
                    }}
                >
                    {s.icon}
                </button>
            ))}
            <span className="text-[8px] font-bold uppercase tracking-tighter ml-1" style={{ color: active.color }}>
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

    const active = statuses.find(s => s.id === current) || statuses[0];

    return (
        <div className="flex flex-wrap items-center justify-center gap-1 max-w-[120px]">
            {statuses.map((s) => (
                <button
                    key={s.id}
                    onClick={() => onChange(s.id)}
                    className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest transition-all duration-200 border ${
                        current === s.id 
                            ? 'shadow-sm translate-y-[-1px]' 
                            : 'opacity-40 hover:opacity-100'
                    }`}
                    style={{ 
                        backgroundColor: current === s.id ? `${s.color}10` : 'transparent',
                        borderColor: current === s.id ? `${s.color}40` : 'transparent',
                        color: current === s.id ? s.color : '#a8a29e'
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
                className="fixed inset-0 bg-stone-900/40 backdrop-blur-[2px] z-[100]"
            />
            
            {/* Drawer */}
            <motion.div 
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 h-full w-full max-w-[450px] bg-white shadow-2xl z-[101] flex flex-col font-sans"
            >
                <header className="p-8 border-b border-stone-100 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-sage uppercase tracking-[0.3em] block mb-1">Nexura Detail</span>
                        <h2 className="text-xl font-black text-stone-900 tracking-tight">Other <span style={{ color: SAGE }}>Revenue</span></h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors"
                    >
                        <LogOut size={18} className="rotate-180" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    {entries.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-stone-300 gap-4">
                            <Coffee size={32} strokeWidth={1} />
                            <p className="text-xs uppercase font-medium tracking-widest">No additional income today</p>
                        </div>
                    ) : (
                        entries.map((item, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="group p-5 rounded-2xl border border-stone-100 bg-stone-50/30 hover:bg-white hover:shadow-xl hover:shadow-stone-200/20 transition-all duration-300"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-stone-100 flex items-center justify-center text-sage shadow-sm">
                                            <Coffee size={16} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-stone-800 uppercase tracking-tight">{item.incomeCategory}</h3>
                                            <p className="text-[10px] font-medium text-stone-400 uppercase tracking-widest">{item.staffName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-stone-900">
                                            Rp {formatCurrency(item.amount)}
                                        </div>
                                        <div className="text-[9px] font-bold text-sage uppercase tracking-wider">
                                            {item.paymentStatus}
                                        </div>
                                    </div>
                                </div>
                                
                                {item.note && (
                                    <div className="pt-4 border-t border-stone-100/50">
                                        <p className="text-[11px] text-stone-500 italic leading-relaxed">
                                            "{item.note}"
                                        </p>
                                    </div>
                                )}
                                
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-[8px] font-bold text-stone-300 uppercase tracking-[0.2em]">
                                        {new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <div className="h-1 w-8 rounded-full bg-stone-100 group-hover:w-16 group-hover:bg-sage/20 transition-all duration-500" />
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                <footer className="p-8 bg-stone-50/50 border-t border-stone-100">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-400 uppercase tracking-widest">
                        <span>Total Items</span>
                        <span className="text-stone-900">{entries.length}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-base font-black text-stone-900">
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
