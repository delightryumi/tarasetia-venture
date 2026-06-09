"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, LogIn, Calendar, XCircle, Download, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useOverview } from "./useOverview";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";

// Modular Imports
import styles from "./OverviewStyles.module.css";
import { StatCard } from "./StatCard";
import { InventoryCalendar } from "./InventoryCalendar";
import { AuditLedger } from "./AuditLedger";
import { GuestDetailModal } from "./GuestDetailModal";
import { VoidConfirmModal } from "./VoidConfirmModal";
import { CancelConfirmModal } from "./CancelConfirmModal";
import { GuestListDrawer } from "./GuestListDrawer";

const SAGE = "#788069";
const PEACH = "#8d7a52";
const RICH_BLACK = "#1A1C14";

export function OverviewSection() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentModule = searchParams.get("module") || "front-office";
    const isReadOnly = currentModule === "housekeeping"; // read‑only mode for housekeeping
    const { user } = useAuth();
    
    const todayStr = React.useMemo(() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }, []);
    
    const tomorrowStr = React.useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }, []);

    const [startDate, setStartDate] = React.useState(todayStr);
    const [endDate, setEndDate] = React.useState(todayStr);

    const isTodayActive = startDate === todayStr && endDate === todayStr;
    const isTomorrowActive = startDate === tomorrowStr && endDate === tomorrowStr;

    const { 
        loading, 
        checkInCount, checkOutCount, cancelCount,
        todayCheckIns, todayCheckOuts, todayCanceled,
        latestBookings, roomStatus, dailyData, roomTypesData
    } = useOverview(startDate, endDate);
    
    const [selectedGuest, setSelectedGuest] = React.useState<any>(null);
    const [isEditing, setIsEditing] = React.useState(false);
    const [bookingToVoid, setBookingToVoid] = React.useState<any>(null);
    const [bookingToCancel, setBookingToCancel] = React.useState<any>(null);
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(true);
    const [calendarContext, setCalendarContext] = React.useState<{ bookings: any[], date: string, type: string } | null>(null);

    const dash = loading ? "—" : null;

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


    const handleStatusUpdate = async (item: any, field: string, value: string) => {
        // Allow status updates even in housekeeping view (they manage room status/remarks)
        console.log("handleStatusUpdate triggered", { item, field, value });
        try {
            const hotelId = "bumi-anyom-resort";
            const checkInDate = item.checkInDate || item.checkIn;
            const checkOutDate = item.checkOutDate || item.checkOut;
            const isAcc = item.type === "accommodation" || (!item.type && item.guestName && !item.guestName.startsWith("POS Order") && !item.posItems && !item.revenueType);
            
            const dates = getDatesBetween(checkInDate, checkOutDate, isAcc);
            for (const d of dates) {
                const docRef = doc(db, "daily_revenue", `${hotelId}_${d}`);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const entries = docSnap.data().entries || [];
                    const updatedEntries = entries.map((e: any) => {
                        const isMatch = e.timestamp === item.timestamp || 
                            (isAcc && 
                             e.guestName === item.guestName && 
                             e.checkInDate === item.checkInDate && 
                             e.checkOutDate === item.checkOutDate && 
                             String(e.roomNumber) === String(item.roomNumber));
                        
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
        } catch (error) {
            console.error("Status Update Failed", error);
        }
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

            // Cascade void if it has a bookingId
            const bookingId = bookingToVoid.bookingId;
            if (bookingId) {
                const posQuery = query(collection(db, "pos_orders"), where("transactionId", "==", bookingId));
                const posSnap = await getDocs(posQuery);
                for (const d of posSnap.docs) {
                    await updateDoc(d.ref, { status: "VOID", isDeleted: true });
                }

                const revQuery = query(collection(db, "revenue_transactions"), where("transactionId", "==", bookingId));
                const revSnap = await getDocs(revQuery);
                for (const d of revSnap.docs) {
                    await updateDoc(d.ref, { status: "VOID", isDeleted: true });
                }
            }

            setBookingToVoid(null);
        } catch (error) {
            console.error("Void Failed", error);
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
            setBookingToCancel(null);
        } catch (error) {
            console.error("Cancel Failed", error);
        }
    };

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(latestBookings);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Audit");
        XLSX.writeFile(workbook, `Daily_Audit_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("Daily Audit Ledger - Bumi Anyom Resort", 14, 15);
        autoTable(doc, {
            startY: 20,
            head: [['Guest', 'Room', 'Channel', 'Amount', 'Status']],
            body: latestBookings.map(b => [
                b.guestName || "General Sale",
                b.roomNumber || "NA",
                b.channel,
                `Rp ${Number(b.amount).toLocaleString('id-ID')}`,
                b.paymentStatus || 'Pending'
            ]),
        });
        doc.save(`Detailed_Audit_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className={styles.overviewRoot}>
            {/* Header - Unified with Forecast */}
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerBadge} style={{ backgroundColor: PEACH, color: '#ffffff' }}>
                            <PlusCircle size={15} />
                        </div>
                        <div className={styles.headerMeta}>
                            <span className={styles.headerSubtitle}>Nexura Operational</span>
                            <h1 className={styles.headerTitle}>
                                Command <span style={{ color: SAGE }}>Center</span>
                            </h1>
                        </div>
                    </div>

                    <div className={styles.headerRight}>
                        {/* Today / Tomorrow Toggle */}
                        <div className={styles.toggleWrapper}>
                            <motion.button 
                                whileTap={{ scale: 0.97 }}
                                onClick={() => {
                                    setStartDate(todayStr);
                                    setEndDate(todayStr);
                                }}
                                className={`${styles.toggleBtn} ${isTodayActive ? styles.toggleBtnActive : ''}`}
                            >
                                Today
                            </motion.button>
                            <motion.button 
                                whileTap={{ scale: 0.97 }}
                                onClick={() => {
                                    setStartDate(tomorrowStr);
                                    setEndDate(tomorrowStr);
                                }}
                                className={`${styles.toggleBtn} ${isTomorrowActive ? styles.toggleBtnActive : ''}`}
                            >
                                Tomorrow
                            </motion.button>
                        </div>

                        <div className={styles.vDivider} />

                        {/* Custom Date Range Picker */}
                        <div className={styles.datePickerWrapper}>
                            <div className={styles.datePickerInputGroup}>
                                <span className={styles.datePickerLabel}>From</span>
                                <input 
                                    type="date" 
                                    value={startDate} 
                                    onChange={(e) => {
                                        if (e.target.value) setStartDate(e.target.value);
                                    }} 
                                    className={styles.dateInput}
                                />
                            </div>
                            <div className={styles.datePickerDivider}>→</div>
                            <div className={styles.datePickerInputGroup}>
                                <span className={styles.datePickerLabel}>To</span>
                                <input 
                                    type="date" 
                                    value={endDate} 
                                    onChange={(e) => {
                                        if (e.target.value) setEndDate(e.target.value);
                                    }} 
                                    className={styles.dateInput}
                                />
                            </div>
                        </div>

                        <div className={styles.vDivider} />

                        <button
                            onClick={() => {
                                if (isReadOnly) {
                                    alert('Add transaction is not allowed in housekeeping view.');
                                } else {
                                    router.push(`/forecast/add?date=${startDate}&module=${currentModule}`);
                                }
                            }}
                            className={styles.btnPrimary}
                            title="Add Transaction"
                            style={{ height: '36px', width: '36px', borderRadius: '8px' }}
                            disabled={isReadOnly}
                        >
                            <PlusCircle size={16} />
                        </button>

                        <div className={styles.vDivider} />

                        <button 
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                            className={styles.btnIcon}
                            style={isCalendarOpen ? { backgroundColor: SAGE, color: '#ffffff', borderColor: SAGE, height: '36px', width: '36px', borderRadius: '8px' } : { height: '36px', width: '36px', borderRadius: '8px' }}
                            title={isCalendarOpen ? "Close Calendar" : "Open Calendar"}
                        >
                            <Calendar size={16} />
                        </button>
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
                    </div>
                </div>
            </header>

            <main className={styles.mainContainer}>
                {/* SECTION 1: MOVEMENT GRID */}
                <section className={styles.statGrid}>
                    <StatCard 
                        accent={SAGE} icon={<LogIn size={18} />} 
                        label={isTodayActive ? "Check In Today" : (isTomorrowActive ? "Check In Tomorrow" : `Check In (${startDate} to ${endDate})`)} 
                        count={dash || checkInCount} items={todayCheckIns}
                        onItemClick={(b: any) => { setSelectedGuest(b); setIsEditing(false); }}
                        onStatusUpdate={handleStatusUpdate}
                    />
                    <StatCard 
                        accent={PEACH} icon={<Calendar size={18} />} 
                        label={isTodayActive ? "Check Out Today" : (isTomorrowActive ? "Check Out Tomorrow" : `Check Out (${startDate} to ${endDate})`)} 
                        count={dash || checkOutCount} items={todayCheckOuts}
                        onItemClick={(b: any) => { setSelectedGuest(b); setIsEditing(false); }}
                        onStatusUpdate={handleStatusUpdate}
                    />
                    <StatCard 
                        accent="#ef4444" icon={<XCircle size={18} />} 
                        label={isTodayActive ? "Cancellations Today" : (isTomorrowActive ? "Cancellations Tomorrow" : `Cancellations (${startDate} to ${endDate})`)} 
                        count={dash || cancelCount} items={todayCanceled}
                        onItemClick={(b: any) => { setSelectedGuest(b); setIsEditing(false); }}
                        onStatusUpdate={handleStatusUpdate}
                    />
                </section>

                {/* SECTION 2: AUDIT LEDGER */}
                <AuditLedger 
                    bookings={latestBookings}
                    onView={(b) => { setSelectedGuest(b); setIsEditing(false); }}
                    onEdit={(b) => setSelectedGuest(b) && setIsEditing(true)}
                    onDelete={(b) => setBookingToVoid(b)}
                    onCancel={(b) => setBookingToCancel(b)}
                    onStatusUpdate={handleStatusUpdate}
                    onExportExcel={handleExportExcel}
                    onExportPDF={handleExportPDF}
                />

                {/* SECTION 3: INVENTORY CALENDAR */}
                {isCalendarOpen && (
                    <div className={styles.twoColumnLayout}>
                        <div style={{ flex: 1, width: '100%', minWidth: 0 }}>
                            <InventoryCalendar 
                                targetDate={isTodayActive ? 'today' : (isTomorrowActive ? 'tomorrow' : 'today')}
                                data={dailyData} 
                                roomTypes={roomTypesData}
                                totalRooms={roomStatus.total} 
                                onDateSelect={(date) => router.push(`/forecast/add?date=${date}&module=${currentModule}`)}
                                onCellClick={(bookings, date, type) => setCalendarContext({ bookings, date, type })}
                            />
                        </div>
                        <GuestListDrawer 
                            isOpen={!!calendarContext}
                            onClose={() => setCalendarContext(null)}
                            date={calendarContext?.date || ""}
                            roomType={calendarContext?.type || ""}
                            bookings={calendarContext?.bookings || []}
                            onAdd={(date) => router.push(`/forecast/add?date=${date}&module=${currentModule}`)}
                        />
                    </div>
                )}
            </main>

            {/* Right Drawer Overlay Popup */}
            <AnimatePresence>
                {selectedGuest && (
                    <motion.div 
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={styles.sidebarBackdrop}
                        onClick={() => setSelectedGuest(null)}
                    />
                )}
                {selectedGuest && (
                    <GuestDetailModal 
                        key={selectedGuest.timestamp || selectedGuest.bookingId || Math.random()}
                        guest={selectedGuest} 
                        isEditing={isEditing} 
                        onClose={() => setSelectedGuest(null)} 
                        onSave={() => router.refresh()}
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
        </div>
    );
}