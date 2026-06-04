"use client";

import React, { useState } from "react";
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
import styles from "./ForecastStyles.module.css";

// Sub-components
import { SummaryCard } from "./components/SummaryCard";
import { ForecastHeader } from "./components/ForecastHeader";
import { AnalyticsCharts } from "./components/AnalyticsCharts";
import { TransactionTable } from "./components/TransactionTable";
import { ChannelPerformance } from "./components/ChannelPerformance";
import { VoidConfirmModal } from "../overview/VoidConfirmModal";
import { CancelConfirmModal } from "../overview/CancelConfirmModal";
import { OtherRevenueDrawer } from "./components/OtherRevenueDrawer";

/* ── Brand Colors ── */
const PEACH = "#ffd8a6";
const SAGE = "#788069";

/* ── Animations ── */
const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

export const ForecastSection: React.FC = () => {
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState<"daily" | "monthly" | "yearly">("daily");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
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


    const executeVoid = async () => {
        if (!bookingToVoid) return;
        try {
            const hotelId = "bumi-anyom-resort";
            const checkInDate = bookingToVoid.checkInDate || bookingToVoid.checkIn;
            const checkOutDate = bookingToVoid.checkOutDate || bookingToVoid.checkOut;
            const isPOS = bookingToVoid.guestName?.startsWith("POS Order") || !!bookingToVoid.posItems || !!bookingToVoid.revenueType;
            const isAcc = !isPOS && (bookingToVoid.type === "accommodation" || (!bookingToVoid.type && bookingToVoid.guestName));
            
            const dates = getDatesBetween(checkInDate, checkOutDate, isAcc);
            for (const d of dates) {
                const docRef = doc(db, "daily_revenue", `${hotelId}_${d}`);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const entries = docSnap.data().entries || [];
                    const mapped = entries.map((e: any) => {
                        const isMatch = e.timestamp === bookingToVoid.timestamp || 
                            (isAcc && 
                             e.guestName === bookingToVoid.guestName && 
                             e.checkInDate === bookingToVoid.checkInDate && 
                             e.checkOutDate === bookingToVoid.checkOutDate && 
                             e.roomNumber === bookingToVoid.roomNumber);
                        if (isMatch) {
                            return { ...e, status: "VOID", paymentStatus: "VOID" };
                        }
                        return e;
                    });
                    await updateDoc(docRef, { entries: mapped, date: d });
                }
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
        if (!bookingToCancel) return;
        try {
            const hotelId = "bumi-anyom-resort";
            const checkInDate = bookingToCancel.checkInDate || bookingToCancel.checkIn;
            const checkOutDate = bookingToCancel.checkOutDate || bookingToCancel.checkOut;
            const isPOS = bookingToCancel.guestName?.startsWith("POS Order") || !!bookingToCancel.posItems || !!bookingToCancel.revenueType;
            const isAcc = !isPOS && (bookingToCancel.type === "accommodation" || (!bookingToCancel.type && bookingToCancel.guestName));
            
            const dates = getDatesBetween(checkInDate, checkOutDate, isAcc);
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const todayStr = `${yyyy}-${mm}-${dd}`;
            const cancelledByVal = user ? `${user.displayName} (${user.role || 'user'})` : "System";

            for (const d of dates) {
                const docRef = doc(db, "daily_revenue", `${hotelId}_${d}`);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const entries = docSnap.data().entries || [];
                    const mapped = entries.map((e: any) => {
                        const isMatch = e.timestamp === bookingToCancel.timestamp || 
                            (isAcc && 
                             e.guestName === bookingToCancel.guestName && 
                             e.checkInDate === bookingToCancel.checkInDate && 
                             e.checkOutDate === bookingToCancel.checkOutDate && 
                             e.roomNumber === bookingToCancel.roomNumber);
                        if (isMatch) {
                            return { 
                                ...e, 
                                status: "CANCELLED", 
                                paymentStatus: "CANCELLED",
                                cancelledAt: todayStr,
                                cancelledBy: cancelledByVal
                            };
                        }
                        return e;
                    });
                    await updateDoc(docRef, { entries: mapped, date: d });
                }
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
            const hotelId = "bumi-anyom-resort";
            const checkInDate = booking.checkInDate || booking.checkIn;
            const checkOutDate = booking.checkOutDate || booking.checkOut;
            const isPOS = booking.guestName?.startsWith("POS Order") || !!booking.posItems || !!booking.revenueType;
            const isAcc = !isPOS && (booking.type === "accommodation" || (!booking.type && booking.guestName));
            
            const dates = getDatesBetween(checkInDate, checkOutDate, isAcc);
            for (const d of dates) {
                const docRef = doc(db, "daily_revenue", `${hotelId}_${d}`);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const entries = docSnap.data().entries || [];
                    const updatedEntries = entries.map((e: any) => {
                        const isMatch = e.timestamp === booking.timestamp || 
                            (isAcc && 
                             e.guestName === booking.guestName && 
                             e.checkInDate === booking.checkInDate && 
                             e.checkOutDate === booking.checkOutDate && 
                             String(e.roomNumber) === String(booking.roomNumber));
                        
                        if (isMatch) {
                            const updated = { ...e, [field]: value };
                            if (field === "status" || field === "paymentStatus") {
                                if (value === "CANCELLED" || value === "CANCEL") {
                                    const now = new Date();
                                    const yyyy = now.getFullYear();
                                    const mm = String(now.getMonth() + 1).padStart(2, '0');
                                    const dd = String(now.getDate()).padStart(2, '0');
                                    updated.cancelledAt = `${yyyy}-${mm}-${dd}`;
                                    updated.status = "CANCELLED";
                                    updated.paymentStatus = "CANCELLED";
                                    updated.cancelledBy = user ? `${user.displayName} (${user.role || 'user'})` : "System";
                                } else {
                                    updated.cancelledAt = null;
                                    updated.cancelledBy = null;
                                }
                            }
                            return updated;
                        }
                        return e;
                    });
                    await updateDoc(docRef, { entries: updatedEntries, date: d });
                }
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
        doc.text(`Detailed Forecast Report - Bumi Anyom Resort`, 14, 15);
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
                            <TransactionTable
                                stats={stats}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                activeFilter={activeFilter}
                                setActiveFilter={setActiveFilter}
                                handleStatusUpdate={handleStatusUpdate}
                                setSelectedGuest={setSelectedGuest}
                                handleEdit={handleEdit}
                                handleDeleteClick={(b) => setBookingToVoid(b)}
                                handleCancelClick={(b) => setBookingToCancel(b)}
                                formatCurrency={formatCurrency}
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
                            entries={stats.entries.filter((e: any) => e.type === 'other_income')} 
                            onClose={() => setIsOtherRevenueOpen(false)}
                            formatCurrency={formatCurrency}
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
