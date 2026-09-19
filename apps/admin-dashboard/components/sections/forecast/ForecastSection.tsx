"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    TrendingUp,
    Hotel,
    CreditCard,
    UserPlus,
    Globe,
    MoreHorizontal,
    Percent,
    Coins
} from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useForecast } from "./useForecast";
import { GuestDetailModal } from "../overview/GuestDetailModal";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getHotelCollection } from "@/lib/firestoreHelper";
import styles from "./ForecastStyles.module.css";

// Sub-components
import { SummaryCard } from "./components/SummaryCard";
import { ForecastHeader } from "./components/ForecastHeader";
import { AnalyticsCharts } from "./components/AnalyticsCharts";
import { TransactionTable } from "./components/TransactionTable";
import { ChannelPerformance } from "./components/ChannelPerformance";
import { VoidConfirmModal } from "../overview/VoidConfirmModal";
import { CancelConfirmModal } from "../overview/CancelConfirmModal";
import { ForecastDetailDrawer } from "./components/ForecastDetailDrawer";
import { AuditLedger } from "../overview/AuditLedger";



/* ── Clean Undefined Helper to prevent Firestore errors ── */
const cleanUndefined = (obj: any): any => {
    if (!obj || typeof obj !== "object") return obj;
    const cleaned = { ...obj };
    Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === undefined) {
            delete cleaned[key];
        } else if (cleaned[key] && typeof cleaned[key] === "object" && !cleaned[key].toDate) {
            cleaned[key] = cleanUndefined(cleaned[key]);
        }
    });
    return cleaned;
};

/* ── Animations ── */
const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

export const ForecastSection: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentModule = searchParams.get("module") || "front-office";
    const { user, activeHotelCode, activeHotelName } = useAuth();
    const isSuperadmin = user?.role?.toLowerCase() === "superadmin" || user?.role?.toLowerCase() === "admin";
    const canCancel = isSuperadmin || user?.permissions?.fo_cancel === true;
    const canVoid = isSuperadmin || user?.permissions?.fo_void === true;
    const [viewMode, setViewMode] = useState<"daily" | "monthly" | "yearly">("daily");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [detailDrawerConfig, setDetailDrawerConfig] = useState<{ title: string, entries: any[], summary?: { label: string, formula: string, values: string, result: string } } | null>(null);
    const [displayMode, setDisplayMode] = useState<"cards" | "charts">("cards");
    const [searchQuery, setSearchQuery] = useState("");

    const stats = useForecast(viewMode, selectedDate);

    const getFilteredEntries = (type: string) => {
        let filtered: any[] = [];
        let title = "";
        let summary;
        
        switch(type) {
            case "Gross":
            case "Total Gross Revenue":
            case "Total Pendapatan Kotor":
            case "Total Pendapatan Kotor (Gross Revenue)":
                filtered = stats.entries;
                title = "Total Gross Revenue";
                break;
            case "Hotel":
            case "Sales Pay at Hotel":
            case "Sales (Pay at Hotel)":
            case "Hotel Collect (Direct)":
            case "Penjualan (Hotel Collect)":
                filtered = stats.entries.filter((e: any) => {
                    const cashAmt = Number(e.payHotel || e.paidCash || e.paidAmount1 || 0);
                    return cashAmt > 0 || e.paymentStatus === "Pay at Hotel";
                });
                title = "Hotel Collect (Direct)";
                break;
            case "Nexura":
            case "Virtual":
            case "Sales Pay at Nexura":
            case "Sales (Virtual / OTA)":
            case "OTA Collect (City Ledger)":
            case "Penjualan (OTA Collect)":
                filtered = stats.entries.filter((e: any) => {
                    const digitalAmt = Number(e.payTransfer || e.payNexura || e.paidTransfer || e.paidAmount2 || 0);
                    return digitalAmt > 0 || e.paymentStatus === "Pay at Nexura" || e.paymentStatus === "Virtual Payment / OTA" || e.paymentStatus === "Virtual / OTA";
                });
                title = "OTA Collect (City Ledger)";
                break;
            case "WalkIn":
            case "Walk-in Revenue":
            case "Pendapatan Walk-in":
            case "Pendapatan Walk-in (Front Desk)":
                filtered = stats.entries.filter((e: any) => e.type !== "other_income" && (e.source === "Walk-in" || e.channel === "Walk-in" || e.channel === "WALKIN"));
                title = "Walk-in Revenue";
                break;
            case "OTA":
            case "OTA Revenue":
            case "OTA Channel Revenue":
            case "Pendapatan OTA":
            case "Pendapatan OTA (Channel Manager)":
                filtered = stats.entries.filter((e: any) => e.type !== "other_income" && e.source !== "Walk-in" && e.channel !== "Walk-in" && e.channel !== "WALKIN");
                title = "OTA Channel Revenue";
                break;
            case "Other":
            case "Other Revenue":
            case "Non-Room Revenue":
            case "Pendapatan Lainnya":
            case "Pendapatan Lainnya (Other Revenue)":
                filtered = stats.entries.filter((e: any) => e.type === "other_income");
                title = "Non-Room Revenue";
                break;
            case "OCC":
            case "Occupancy Bookings":
            case "Occupancy Rate (OCC)":
            case "Okupansi Kamar":
            case "Tingkat Okupansi (Occupancy Rate)":
                filtered = stats.entries.filter((e: any) => e.type === "accommodation" || (!e.type && e.guestName));
                title = "Occupancy Rate (OCC)";
                summary = {
                    label: "Occupancy Calculation",
                    formula: "Rooms Sold / Total Available Rooms",
                    values: `${stats.roomsSold} / ${stats.totalPossibleRoomNights}`,
                    result: `${stats.occ.toFixed(1)}%`
                };
                break;
            case "ARR":
            case "Average Room Rate":
            case "Average Daily Rate (ADR)":
            case "Tarif Rata-rata Kamar":
            case "Tarif Rata-rata Kamar (ADR / ARR)":
                filtered = stats.entries.filter((e: any) => e.type === "accommodation" || (!e.type && e.guestName));
                title = "Average Daily Rate (ADR)";
                summary = {
                    label: "ADR Calculation",
                    formula: "Room Revenue / Rooms Sold",
                    values: `IDR ${stats.totalGrossRevenue.toLocaleString()} / ${stats.roomsSold}`,
                    result: `IDR ${stats.arr.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                };
                break;
            case "RevPAR":
            case "RevPAR Performance":
            case "RevPar":
            case "Revenue Per Available Room (RevPAR)":
            case "Pendapatan per Kamar Tersedia (RevPAR)":
                filtered = stats.entries.filter((e: any) => e.type === "accommodation" || (!e.type && e.guestName));
                title = "Revenue Per Available Room (RevPAR)";
                summary = {
                    label: "RevPAR Calculation",
                    formula: "Total Room Revenue / Total Available Rooms",
                    values: `IDR ${stats.totalGrossRevenue.toLocaleString()} / ${stats.totalPossibleRoomNights}`,
                    result: `IDR ${stats.revPar.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                };
        }
        return { filtered, title, summary };
    };

    useEffect(() => {
        if (detailDrawerConfig && !stats.loading) {
            const { filtered, summary } = getFilteredEntries(detailDrawerConfig.title);
            setDetailDrawerConfig(prev => prev ? { ...prev, entries: filtered, summary } : null);
        }
    }, [stats.entries, stats.loading]);

    const handleCardClick = (type: string) => {
        const { filtered, title, summary } = getFilteredEntries(type);
        setDetailDrawerConfig({ title, entries: filtered, summary });
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID').format(Math.floor(val));
    };

    const [selectedGuest, setSelectedGuest] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);

    const handleEdit = (booking: any) => {
        const targetDate = booking.effectiveDate || booking.checkInDate || booking._docDate || selectedDate;
        const bId = booking.bookingId || "";
        const ts = booking.timestamp || "";
        router.push(`/forecast/add?date=${targetDate}&bookingId=${encodeURIComponent(bId)}&timestamp=${encodeURIComponent(ts)}&module=${currentModule}&mode=edit&from=forecast`);
    };

    const [bookingToVoid, setBookingToVoid] = useState<any>(null);
    const [bookingToCancel, setBookingToCancel] = useState<any>(null);

    const getDatesBetween = (checkInStr: string, checkOutStr: string, isAccommodation: boolean) => {
        if (!checkInStr) return [];
        if (!isAccommodation || !checkOutStr || new Date(checkOutStr) <= new Date(checkInStr)) {
            return [checkInStr];
        }
        const dates = [];
        let curr = new Date(checkInStr);
        const end = new Date(checkOutStr);
        while (curr < end) {
            dates.push(curr.toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
        }
        return dates;
    };

    const isBookingMatch = (e: any, target: any) => {
        if (!e || !target) return false;
        
        const targetBookingId = (target.bookingId || "").trim();
        const targetTimestamp = target.timestamp ? String(target.timestamp).trim() : "";
        const targetId = target.id ? String(target.id).trim() : "";
        const targetGuestName = (target.guestName || "").trim().toLowerCase();
        
        const eBookingId = (e.bookingId || "").trim();
        const eTimestamp = e.timestamp ? String(e.timestamp).trim() : "";
        const eId = e.id ? String(e.id).trim() : "";
        const eGuestName = (e.guestName || "").trim().toLowerCase();

        // 1. Direct ID / Key matches
        if (targetBookingId !== "" && eBookingId !== "" && targetBookingId === eBookingId) return true;
        if (targetTimestamp !== "" && eTimestamp !== "" && targetTimestamp === eTimestamp) return true;
        if (targetId !== "" && eId !== "" && targetId === eId) return true;

        // 2. Name match
        if (targetGuestName !== "" && eGuestName !== "") {
            if (eGuestName === targetGuestName) return true;
        }

        // 3. Linked pelunasan / reversal check
        if (e.isPelunasan || e.type === "pelunasan_ar" || e.type === "pelunasan_reversal" || eGuestName.startsWith("koreksi tanggal pelunasan") || eGuestName.startsWith("pelunasan piutang")) {
            const cleanEGuestName = eGuestName
                .replace(/^koreksi tanggal pelunasan\s*-\s*/i, "")
                .replace(/^pelunasan piutang\s*-\s*/i, "")
                .trim();
            if (
                (targetTimestamp && (String(e.refTimestamp) === targetTimestamp || eTimestamp === targetTimestamp)) ||
                (targetBookingId && (e.refBookingId === targetBookingId || eBookingId === targetBookingId)) ||
                (targetGuestName && cleanEGuestName === targetGuestName)
            ) {
                return true;
            }
        }

        return false;
    };

    const getCascadeDates = (b: any) => {
        const dates = new Set<string>();
        const todayStr = new Date().toISOString().split('T')[0];
        dates.add(todayStr);

        const addDateRange = (cIn?: string, cOut?: string) => {
            if (cIn && typeof cIn === 'string' && cIn.includes('-')) {
                dates.add(cIn);
                if (cOut && typeof cOut === 'string' && cOut.includes('-') && cOut > cIn) {
                    let curr = new Date(cIn);
                    const end = new Date(cOut);
                    while (curr <= end) {
                        dates.add(curr.toISOString().split('T')[0]);
                        curr.setDate(curr.getDate() + 1);
                    }
                }
            }
        };

        addDateRange(b.checkInDate || b.checkIn, b.checkOutDate || b.checkOut);
        if (b.effectiveDate) dates.add(b.effectiveDate);
        if (b._docDate) dates.add(b._docDate);

        if (b.timestamp) {
            try {
                const tStr = typeof b.timestamp === 'string' && b.timestamp.includes('T')
                    ? b.timestamp.split('T')[0]
                    : new Date(b.timestamp).toISOString().split('T')[0];
                if (tStr && tStr.length === 10) dates.add(tStr);
            } catch {}
        }
        if (b.createdAt) {
            try {
                const cStr = typeof b.createdAt === 'string' && b.createdAt.includes('T')
                    ? b.createdAt.split('T')[0]
                    : new Date(b.createdAt).toISOString().split('T')[0];
                if (cStr && cStr.length === 10) dates.add(cStr);
            } catch {}
        }

        return Array.from(dates).filter(Boolean).sort();
    };

    const executeVoid = async () => {
        if (!canVoid) {
            toast.error("Anda tidak memiliki izin untuk melakukan void booking/transaksi.");
            setBookingToVoid(null);
            return;
        }
        if (!bookingToVoid) return;
        try {
            const hotelId = activeHotelCode || localStorage.getItem("active_hotel_code") || "";
            if (!hotelId) {
                toast.error("Hotel Code is missing.");
                return;
            }
            const dates = getCascadeDates(bookingToVoid);

            for (const d of dates) {
                const docRef = doc(getHotelCollection(db, "daily_revenue"), `${hotelId}_${d}`);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const entries = docSnap.data().entries || [];
                    const mapped = entries.map((e: any) => {
                        if (isBookingMatch(e, bookingToVoid)) {
                            return cleanUndefined({ ...e, status: "VOID", paymentStatus: "VOID", roomCount: 0 });
                        }
                        return cleanUndefined(e);
                    });
                    await updateDoc(docRef, { entries: mapped, date: d });
                }
            }

            // Immediately trigger availability recalculation & push released inventory to Channex/OTAs
            if (dates.length > 0) {
                fetch("/api/channex/sync-ari", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        hotelCode: hotelId,
                        startDate: dates[0],
                        endDate: dates[dates.length - 1],
                        type: "availability"
                    })
                }).catch(err => console.warn("[Void Channex Sync Warning]:", err));
            }

            toast.success("Transaction voided successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to void transaction");
        } finally {
            setBookingToVoid(null);
            stats.refresh();
        }
    };

    const executeCancel = async () => {
        if (!canCancel) {
            toast.error("Anda tidak memiliki izin untuk membatalkan booking/transaksi.");
            setBookingToCancel(null);
            return;
        }
        if (!bookingToCancel) return;
        try {
            const hotelId = activeHotelCode || localStorage.getItem("active_hotel_code") || "";
            if (!hotelId) {
                toast.error("Hotel Code is missing.");
                return;
            }
            const dates = getCascadeDates(bookingToCancel);
            const todayStr = new Date().toISOString().split('T')[0];
            const cancelledByVal = user ? `${user.displayName} (${user.role || 'user'})` : "System";
 
            for (const d of dates) {
                const docRef = doc(getHotelCollection(db, "daily_revenue"), `${hotelId}_${d}`);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const entries = docSnap.data().entries || [];
                    const mapped = entries.map((e: any) => {
                        if (isBookingMatch(e, bookingToCancel)) {
                            return cleanUndefined({ 
                                ...e, 
                                status: "CANCELLED", 
                                paymentStatus: "CANCELLED",
                                roomCount: 0,
                                cancelledAt: todayStr,
                                cancelledBy: cancelledByVal
                            });
                        }
                        return cleanUndefined(e);
                    });
                    await updateDoc(docRef, { entries: mapped, date: d });
                }
            }

            // Immediately trigger availability recalculation & push released inventory to Channex/OTAs
            if (dates.length > 0) {
                fetch("/api/channex/sync-ari", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        hotelCode: hotelId,
                        startDate: dates[0],
                        endDate: dates[dates.length - 1],
                        type: "availability"
                    })
                }).catch(err => console.warn("[Cancel Channex Sync Warning]:", err));
            }

            toast.success("Transaction cancelled successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to cancel transaction");
        } finally {
            setBookingToCancel(null);
            stats.refresh();
        }
    };

    const handleStatusUpdate = async (booking: any, field: string, value: string) => {
        try {
            const hotelId = activeHotelCode || localStorage.getItem("active_hotel_code") || "";
            if (!hotelId) {
                toast.error("Hotel Code is missing.");
                return;
            }
            const dates = getCascadeDates(booking);
            const isCancelling = value === "CANCELLED" || value === "CANCEL";
            for (const d of dates) {
                const docRef = doc(getHotelCollection(db, "daily_revenue"), `${hotelId}_${d}`);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const entries = docSnap.data().entries || [];
                    const updatedEntries = entries.map((e: any) => {
                        if (isBookingMatch(e, booking)) {
                            const updated = { ...e, [field]: value };
                            if (field === "status" || field === "paymentStatus") {
                                if (isCancelling) {
                                    const now = new Date();
                                    const yyyy = now.getFullYear();
                                    const mm = String(now.getMonth() + 1).padStart(2, '0');
                                    const dd = String(now.getDate()).padStart(2, '0');
                                    updated.cancelledAt = `${yyyy}-${mm}-${dd}`;
                                    updated.status = "CANCELLED";
                                    updated.paymentStatus = "CANCELLED";
                                    updated.roomCount = 0;
                                    updated.cancelledBy = user ? `${user.displayName} (${user.role || 'user'})` : "System";
                                } else {
                                    updated.cancelledAt = null;
                                    updated.cancelledBy = null;
                                }
                            }
                            return cleanUndefined(updated);
                        }
                        return cleanUndefined(e);
                    });
                    await updateDoc(docRef, { entries: updatedEntries, date: d });
                }
            }

            // If status changed to/from cancel or void, sync ARI availability
            if (dates.length > 0 && (field === "status" || field === "paymentStatus")) {
                fetch("/api/channex/sync-ari", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        hotelCode: hotelId,
                        startDate: dates[0],
                        endDate: dates[dates.length - 1],
                        type: "availability"
                    })
                }).catch(err => console.warn("[Status Update Channex Sync Warning]:", err));
            }

            stats.refresh();
        } catch (error) {
            console.error("Failed to update status:", error);
            toast.error("Status update failed");
        }
    };

    // ── Export Logic ──
    const handleExportExcel = () => {
        const data = stats.entries.map((e: any) => ({
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
        doc.text(`Detailed Forecast Report`, 14, 15);
        doc.setFontSize(9);
        doc.text(`Periode: ${formatDate(selectedDate)} | Exported: ${new Date().toLocaleString('id-ID')}`, 14, 22);

        const tableData = stats.entries.map((e: any) => [
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
            <ForecastHeader
                viewMode={viewMode}
                setViewMode={setViewMode}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                displayMode={displayMode}
                setDisplayMode={setDisplayMode}
                handleExportExcel={handleExportExcel}
                handleExportPDF={handleExportPDF}
                formatDate={formatDate}
            />

            <main className={styles.mainContainer}>
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
                                onClick={() => handleCardClick("Gross")}
                            />
                            <SummaryCard
                                label="Hotel Collect (Direct)"
                                icon={<Hotel size={18} />}
                                accent="#3b82f6"
                                value={stats.salesPayAtHotel}
                                loading={stats.loading}
                                formatter={formatCurrency}
                                onClick={() => handleCardClick("Hotel")}
                            />
                            <SummaryCard
                                label="OTA Collect (City Ledger)"
                                icon={<CreditCard size={18} />}
                                accent="#8b5cf6"
                                value={stats.salesPayAtTransfer}
                                loading={stats.loading}
                                formatter={formatCurrency}
                                onClick={() => handleCardClick("Virtual")}
                            />
                            <SummaryCard
                                label="Walk-in Revenue"
                                icon={<UserPlus size={18} />}
                                accent="#cc6817ff"
                                value={stats.walkInRevenue}
                                loading={stats.loading}
                                formatter={formatCurrency}
                                onClick={() => handleCardClick("WalkIn")}
                            />
                            <SummaryCard
                                label="OTA Channel Revenue"
                                icon={<Globe size={18} />}
                                accent="#06b6d4"
                                value={stats.otaRevenue}
                                loading={stats.loading}
                                formatter={formatCurrency}
                                onClick={() => handleCardClick("OTA")}
                            />
                            <SummaryCard
                                label="Non-Room Revenue"
                                icon={<MoreHorizontal size={18} />}
                                accent="#ec4899"
                                value={stats.otherRevenue}
                                loading={stats.loading}
                                formatter={formatCurrency}
                                onClick={() => handleCardClick("Other")}
                            />
                            <SummaryCard
                                label="Occupancy Rate (OCC)"
                                icon={<Percent size={18} />}
                                accent="#f59e0b"
                                prefix=""
                                suffix="%"
                                value={stats.occ}
                                loading={stats.loading}
                                formatter={(v) => v.toFixed(1)}
                                onClick={() => handleCardClick("OCC")}
                            />
                            <SummaryCard
                                label="Average Daily Rate (ADR)"
                                icon={<Coins size={18} />}
                                accent="#10b981"
                                value={stats.arr}
                                loading={stats.loading}
                                formatter={formatCurrency}
                                onClick={() => handleCardClick("ARR")}
                            />
                            <SummaryCard
                                label="RevPAR"
                                icon={<TrendingUp size={18} />}
                                accent="#6366f1"
                                value={stats.revPar}
                                loading={stats.loading}
                                formatter={formatCurrency}
                                onClick={() => handleCardClick("RevPar")}
                            />
                        </motion.section>
                    ) : (
                        <AnalyticsCharts
                            stats={stats}
                            viewMode={viewMode}
                            formatCurrency={formatCurrency}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {displayMode === "cards" && (
                        viewMode === "daily" ? (
                            <AuditLedger
                                title="Daily Revenue & Folio Audit Ledger"
                                bookings={activeFilter ? stats.entries.filter((e: any) => e.type === activeFilter) : stats.entries}
                                activeFilter={activeFilter}
                                activeHotelName={activeHotelName}
                                onClearFilter={() => setActiveFilter(null)}
                                onRefresh={() => stats.refresh()}
                                onView={(b) => { setSelectedGuest(b); setIsEditing(false); }}
                                onEdit={(b) => { setSelectedGuest(b); setIsEditing(true); }}
                                onDelete={(b) => setBookingToVoid(b)}
                                onCancel={(b) => setBookingToCancel(b)}
                                onStatusUpdate={handleStatusUpdate}
                                onExportExcel={handleExportExcel}
                                onExportPDF={handleExportPDF}
                            />
                        ) : (
                            <ChannelPerformance
                                stats={stats}
                                selectedDate={selectedDate}
                                formatDate={formatDate}
                                formatCurrency={formatCurrency}
                            />
                        )
                    )}
                </AnimatePresence>

                {/* Right Drawer Overlay Popup */}
                <AnimatePresence>
                    {selectedGuest && (
                        <motion.div 
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={styles.sidebarBackdrop}
                            onClick={() => { setSelectedGuest(null); setIsEditing(false); }}
                        />
                    )}
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
                    {detailDrawerConfig && (
                        <ForecastDetailDrawer 
                            title={detailDrawerConfig.title}
                            entries={detailDrawerConfig.entries} 
                            summary={detailDrawerConfig.summary}
                            onClose={() => setDetailDrawerConfig(null)}
                            formatCurrency={formatCurrency}
                            onSelectGuest={(item) => {
                                setSelectedGuest(item);
                                setIsEditing(false);
                            }}
                        />
                    )}
                </AnimatePresence>

                <VoidConfirmModal 
                    isOpen={!!bookingToVoid}
                    itemName={bookingToVoid?.guestName || "General Sale"}
                    onConfirm={executeVoid}
                    onCancel={() => setBookingToVoid(null)}
                />

                <CancelConfirmModal 
                    isOpen={!!bookingToCancel}
                    itemName={bookingToCancel?.guestName || "General Sale"}
                    onConfirm={executeCancel}
                    onCancel={() => setBookingToCancel(null)}
                />
            </main>
        </motion.div>
    );
};
