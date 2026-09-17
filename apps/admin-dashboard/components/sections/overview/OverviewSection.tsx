"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, LogIn, Calendar, XCircle, Download, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useOverview } from "./useOverview";
import { useSettings } from "@/hooks/useSettings";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { getHotelCollection } from "@/lib/firestoreHelper";

// Modular Imports
import styles from "./OverviewStyles.module.css";
import { StatCard } from "./StatCard";
import { AuditLedger } from "./AuditLedger";
import { GuestDetailModal } from "./GuestDetailModal";
import { VoidConfirmModal } from "./VoidConfirmModal";
import { CancelConfirmModal } from "./CancelConfirmModal";
import { GuestListDrawer } from "./GuestListDrawer";

const SAGE = "var(--sidebar-link-active-bg, #181d26)";
const PEACH = "var(--sidebar-link-active-bg, #181d26)";
const RICH_BLACK = "#1A1C14";

const getBase64Image = async (url: string): Promise<string | null> => {
    if (!url) return null;
    if (url.startsWith("data:image")) return url;
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
};

export function OverviewSection() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentModule = searchParams.get("module") || "front-office";
    const isReadOnly = currentModule === "housekeeping"; // read‑only mode for housekeeping
    const { user, activeHotelCode, activeHotelName } = useAuth();
    const isSuperadmin = user?.role?.toLowerCase() === "superadmin" || user?.role?.toLowerCase() === "admin";
    const canCancel = isSuperadmin || user?.permissions?.fo_cancel === true;
    const canVoid = isSuperadmin || user?.permissions?.fo_void === true;
    const { branding, pos } = useSettings();
    
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

    const getCascadeDates = (b: any) => {
        const dates = new Set<string>();
        const checkIn = b.checkInDate || b.checkIn;
        const checkOut = b.checkOutDate || b.checkOut;
        if (checkIn) dates.add(checkIn);
        if (checkOut) dates.add(checkOut);
        
        const todayStr = new Date().toISOString().split('T')[0];
        dates.add(todayStr);

        if (b.timestamp) {
            const tStr = typeof b.timestamp === 'string' && b.timestamp.includes('T')
                ? b.timestamp.split('T')[0]
                : new Date(b.timestamp).toISOString().split('T')[0];
            dates.add(tStr);
        }
        if (b.createdAt) {
            const cStr = typeof b.createdAt === 'string' && b.createdAt.includes('T')
                ? b.createdAt.split('T')[0]
                : new Date(b.createdAt).toISOString().split('T')[0];
            dates.add(cStr);
        }

        const dateList = Array.from(dates).filter(Boolean).sort();
        if (dateList.length > 1) {
            const minDate = new Date(dateList[0]);
            const maxDate = new Date(dateList[dateList.length - 1]);
            const curr = new Date(minDate);
            while (curr <= maxDate) {
                dates.add(curr.toISOString().split('T')[0]);
                curr.setDate(curr.getDate() + 1);
            }
        }
        return Array.from(dates).sort();
    };
    const isBookingMatch = (e: any, target: any) => {
        if (!e || !target) return false;
        
        const targetBookingId = String(target.bookingId || "").trim();
        const eBookingId = String(e.bookingId || "").trim();
        if (targetBookingId !== "" && eBookingId !== "") {
            if (targetBookingId === eBookingId) return true;
            return false;
        }
        
        const targetTimestamp = target.timestamp ? String(target.timestamp).trim() : "";
        const eTimestamp = e.timestamp ? String(e.timestamp).trim() : "";
        if (targetTimestamp !== "" && eTimestamp !== "" && targetTimestamp === eTimestamp) return true;
        
        const targetId = target.id ? String(target.id).trim() : "";
        const eId = e.id ? String(e.id).trim() : "";
        if (targetId !== "" && eId !== "" && targetId === eId) return true;
        
        const targetGuestName = String(target.guestName || "").trim().toLowerCase();
        const eGuestName = String(e.guestName || "").trim().toLowerCase();
        
        if (targetGuestName !== "" && eGuestName !== "") {
            if (targetGuestName === eGuestName) {
                const targetCheckIn = target.checkInDate || target.checkIn || "";
                const eCheckIn = e.checkInDate || e.checkIn || "";
                if (targetCheckIn && eCheckIn) {
                    return targetCheckIn === eCheckIn;
                }
                return true;
            }
        }
        
        // Linked pelunasan or reversal records
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

    const handleStatusUpdate = async (item: any, field: string, value: string) => {
        // Allow status updates even in housekeeping view (they manage room status/remarks)
        console.log("handleStatusUpdate triggered", { item, field, value });
        try {
            const hotelId = activeHotelCode || localStorage.getItem("active_hotel_code") || "";
            if (!hotelId) {
                toast.error("Hotel Code is missing.");
                return;
            }
            const checkInDate = item.checkInDate || item.checkIn;
            const checkOutDate = item.checkOutDate || item.checkOut;
            const isAcc = item.type === "accommodation" || (!item.type && item.guestName && !item.guestName.startsWith("POS Order") && !item.posItems && !item.revenueType);
            
            const dates = getDatesBetween(checkInDate, checkOutDate, isAcc);
            for (const d of dates) {
                const docRef = doc(getHotelCollection(db, "daily_revenue"), `${hotelId}_${d}`);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const entries = docSnap.data().entries || [];
                    const updatedEntries = entries.map((e: any) => {
                        const isMatch = isBookingMatch(e, item);
                        
                        if (isMatch) {
                            const updated = { ...e, [field]: value };
                            if (field === "status" || field === "paymentStatus") {
                                if (value === "CANCELLED" || value === "CANCEL") {
                                    if (!canCancel) {
                                        toast.error("Anda tidak memiliki izin untuk membatalkan booking/transaksi.");
                                        return e;
                                    }
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
        if (!canVoid) {
            toast.error("Anda tidak memiliki izin untuk melakukan Void booking/transaksi.");
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
                    // Void completely deletes the matched transaction from daily entries
                    const remainingEntries = entries.filter((e: any) => !isBookingMatch(e, bookingToVoid));
                    await updateDoc(docRef, { entries: remainingEntries, date: d });
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

            // Cascade void if it has a bookingId
            const bookingId = bookingToVoid.bookingId;
            if (bookingId) {
                const posQuery = query(getHotelCollection(db, "pos_orders"), where("transactionId", "==", bookingId));
                const posSnap = await getDocs(posQuery);
                for (const d of posSnap.docs) {
                    await updateDoc(d.ref, { status: "VOID", isDeleted: true });
                }

                const revQuery = query(getHotelCollection(db, "revenue_transactions"), where("transactionId", "==", bookingId));
                const revSnap = await getDocs(revQuery);
                for (const d of revSnap.docs) {
                    await updateDoc(d.ref, { status: "VOID", isDeleted: true });
                }
            }

            setBookingToVoid(null);
            toast.success("Transaction voided successfully");
        } catch (error) {
            console.error("Void Failed", error);
            toast.error("Failed to void transaction");
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
                            return { 
                                ...e, 
                                status: "CANCELLED", 
                                paymentStatus: "CANCELLED",
                                roomCount: 0,
                                cancelledAt: todayStr,
                                cancelledBy: cancelledByVal
                            };
                        }
                        return e;
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

            setBookingToCancel(null);
            toast.success("Transaction cancelled successfully");
        } catch (error) {
            console.error("Cancel Failed", error);
            toast.error("Failed to cancel transaction");
        }
    };

    const isTransferTransaction = (b: any) => {
        const pm = (b.paymentMethod || "").toLowerCase();
        const ps = (b.paymentStatus || "").toLowerCase();
        const ch = (b.channel || "").toLowerCase();
        const payTransfer = Number(b.payTransfer || b.payNexura || b.paidTransfer || b.paidAmount2 || 0);
        const payHotel = Number(b.payHotel || b.paidCash || b.paidAmount1 || 0);

        if (payTransfer > 0 && payHotel === 0) return true;
        if (payHotel > 0 && payTransfer === 0) return false;
        
        if (
            pm.includes("transfer") || 
            ps.includes("transfer") || 
            ps.includes("nexura") || 
            pm.includes("card") || 
            pm.includes("qris") || 
            pm.includes("travel_agent") || 
            ps.includes("bank") ||
            ps.includes("virtual account")
        ) {
            return true;
        }
        if (
            pm.includes("hotel") || 
            ps.includes("hotel") || 
            pm.includes("cash") || 
            ps.includes("cash")
        ) {
            return false;
        }
        // Non-direct channels (OTAs like Agoda, Booking.com, Traveloka, Tiket.com)
        if (ch && !["direct", "walk-in", "internal", "-"].includes(ch)) {
            return true;
        }
        return false;
    };

    const handleExportExcel = () => {
        try {
            const hotelName = pos?.name || activeHotelName || "HOTEL OPERATIONAL SYSTEM";
            const sysTime = new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "medium" }) + " WIB";
            const staffStr = user?.displayName || user?.email || "Front Desk Officer";
            const periodStr = startDate === endDate ? startDate : `${startDate} s/d ${endDate}`;
            const periodFileName = startDate === endDate ? startDate : `${startDate}_sd_${endDate}`;

            const payHotelBookings = latestBookings.filter((b: any) => !isTransferTransaction(b));
            const transferBookings = latestBookings.filter((b: any) => isTransferTransaction(b));

            const subtotalPayHotel = payHotelBookings.reduce((sum: number, b: any) => {
                const isCancelled = b.status === "CANCELLED" || b.status === "CANCEL" || b.status === "VOID" || b.status === "VOIDED";
                return isCancelled ? sum : sum + (Number(b.amount) || 0);
            }, 0);

            const subtotalTransfer = transferBookings.reduce((sum: number, b: any) => {
                const isCancelled = b.status === "CANCELLED" || b.status === "CANCEL" || b.status === "VOID" || b.status === "VOIDED";
                return isCancelled ? sum : sum + (Number(b.amount) || 0);
            }, 0);

            const totalRevenue = subtotalPayHotel + subtotalTransfer;

            const formatRows = (list: any[]) => list.map((b: any, index: number) => {
                const entryTime = b.timestamp 
                    ? (b.timestamp.includes('T') ? b.timestamp.replace('T', ' ').substring(0, 16) : new Date(b.timestamp).toLocaleString('id-ID'))
                    : "-";
                
                const voucher = b.voucherCode || b.bookingId || b.voucher || (b.guestName?.startsWith("POS Order") ? "POS" : "WALK-IN");
                const guest = b.guestName || "General Sale";
                const roomType = (b.roomType || b.incomeCategory || b.type || "Standard");
                const roomNo = b.roomNumber || "-";
                const checkIn = b.checkInDate || "-";
                const checkOut = b.checkOutDate || "-";
                const channel = b.channel || "Direct";
                
                let paymentMethod = b.paymentMethod || b.settlement || "-";
                if (!b.paymentMethod || b.paymentMethod === "personal" || b.paymentMethod === "others") {
                    if (Number(b.paidCash || 0) > 0) paymentMethod = "Cash FO";
                    else if (Number(b.paidEdc || 0) > 0) paymentMethod = "EDC Card";
                    else if (Number(b.paidQris || 0) > 0) paymentMethod = "QRIS Hotel";
                    else if (Number(b.paidTransfer || 0) > 0) paymentMethod = "Bank Transfer";
                    else if (Number(b.paidOta || 0) > 0) paymentMethod = "OTA Virtual";
                    else if (b.payHotel) paymentMethod = "Pay at Hotel";
                    else if (b.payTransfer) paymentMethod = "Transfer / OTA";
                    else paymentMethod = b.paymentStatus || "Cash / Direct";
                }

                const paymentStatus = b.paymentStatus || "Pending";
                const amount = Number(b.amount || 0);
                const staff = b.staffName || b.createdBy || b.inputBy || (user?.displayName || "System");
                const resStatus = b.status || "CONFIRMED";
                const note = b.note || b.remarks || "";

                return [
                    index + 1,
                    entryTime,
                    voucher,
                    guest,
                    roomType,
                    roomNo,
                    checkIn,
                    checkOut,
                    channel,
                    paymentMethod,
                    paymentStatus,
                    amount,
                    staff,
                    resStatus,
                    note
                ];
            });

            const colWidths = [
                { wch: 6 },  // No
                { wch: 18 }, // Waktu
                { wch: 22 }, // Voucher
                { wch: 28 }, // Guest
                { wch: 22 }, // Room Type
                { wch: 12 }, // Room No
                { wch: 14 }, // In
                { wch: 14 }, // Out
                { wch: 16 }, // Channel
                { wch: 24 }, // Payment Method
                { wch: 16 }, // Status Bayar
                { wch: 20 }, // Total
                { wch: 18 }, // Staff
                { wch: 16 }, // Status
                { wch: 30 }, // Note
            ];

            const tableHeaderRow = [
                "No", "Waktu Input", "No. Voucher / ID", "Nama Tamu / Order", 
                "Tipe Kamar / Kategori", "No. Kamar", "Tgl Check-In", "Tgl Check-Out", 
                "Channel / Sumber", "Metode Pembayaran", "Status Pembayaran", 
                "Total Tagihan (IDR)", "Staf Input", "Status Transaksi", "Catatan / Note"
            ];

            const workbook = XLSX.utils.book_new();

            // ── Sheet 1: Master All Transactions (2 Sections) ──
            const masterHeader = [
                ["LAPORAN AUDIT & TRANSAKSI FRONT OFFICE — LENGKAP"],
                [`Properti: ${hotelName.toUpperCase()}`],
                [`Periode: ${periodStr} | Jam Sistem: ${sysTime} | Staf Cetak: ${staffStr}`],
                [],
                ["== 1. TRANSAKSI PAY AT HOTEL (CASH / BAYAR DI TEMPAT) =="],
                tableHeaderRow,
                ...formatRows(payHotelBookings),
                [],
                ["", "", "", "SUBTOTAL PAY AT HOTEL", "", "", "", "", "", "", "", subtotalPayHotel, "", "", ""],
                [],
                ["== 2. TRANSAKSI BANK TRANSFER & OTA (NON-CASH / SETTLEMENT) =="],
                tableHeaderRow,
                ...formatRows(transferBookings),
                [],
                ["", "", "", "SUBTOTAL TRANSFER & OTA", "", "", "", "", "", "", "", subtotalTransfer, "", "", ""],
                [],
                ["", "", "", "GRAND TOTAL ALL REVENUE", "", "", "", "", "", "", "", totalRevenue, "", "", ""]
            ];
            const wsMaster = XLSX.utils.aoa_to_sheet(masterHeader);
            wsMaster['!cols'] = colWidths;
            XLSX.utils.book_append_sheet(workbook, wsMaster, "All Ledger");

            // ── Sheet 2: Pay at Hotel ──
            const payHotelHeader = [
                ["LAPORAN TRANSAKSI PAY AT HOTEL (CASH / DIRECT)"],
                [`Properti: ${hotelName.toUpperCase()}`],
                [`Periode: ${periodStr} | Jam Sistem: ${sysTime} | Staf Cetak: ${staffStr}`],
                [],
                tableHeaderRow,
                ...formatRows(payHotelBookings),
                [],
                ["", "", "", "TOTAL PAY AT HOTEL", "", "", "", "", "", "", "", subtotalPayHotel, "", "", ""]
            ];
            const wsPayHotel = XLSX.utils.aoa_to_sheet(payHotelHeader);
            wsPayHotel['!cols'] = colWidths;
            XLSX.utils.book_append_sheet(workbook, wsPayHotel, "Pay at Hotel");

            // ── Sheet 3: Transfer & OTA ──
            const transferHeader = [
                ["LAPORAN TRANSAKSI BANK TRANSFER & OTA (NON-CASH)"],
                [`Properti: ${hotelName.toUpperCase()}`],
                [`Periode: ${periodStr} | Jam Sistem: ${sysTime} | Staf Cetak: ${staffStr}`],
                [],
                tableHeaderRow,
                ...formatRows(transferBookings),
                [],
                ["", "", "", "TOTAL TRANSFER & OTA", "", "", "", "", "", "", "", subtotalTransfer, "", "", ""]
            ];
            const wsTransfer = XLSX.utils.aoa_to_sheet(transferHeader);
            wsTransfer['!cols'] = colWidths;
            XLSX.utils.book_append_sheet(workbook, wsTransfer, "Transfer & OTA");

            XLSX.writeFile(workbook, `Detailed_Audit_Ledger_${periodFileName}.xlsx`);
            toast.success("Laporan Excel (2 Tabel Terpisah) berhasil di-export");
        } catch (error) {
            console.error("Excel Export error:", error);
            toast.error("Gagal mengekspor Excel");
        }
    };

    const handleExportPDF = async () => {
        try {
            const pdfDoc = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4",
            });

            const hotelName = pos?.name || activeHotelName || "HOTEL OPERATIONAL SYSTEM";
            const hotelAddress = pos?.address || "Front Office Department";
            const hotelPhone = pos?.phone ? `Telp: ${pos.phone}` : "";
            const periodStr = startDate === endDate ? startDate : `${startDate} s/d ${endDate}`;
            const periodFileName = startDate === endDate ? startDate : `${startDate}_sd_${endDate}`;
            const sysTime = new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "medium" }) + " WIB";
            const staffStr = user?.displayName || user?.email || "Front Desk Officer";

            // 1. Fetch CPanel Logo directly from settings/landingPage
            let logoUrl = null;
            try {
                const hotelId = activeHotelCode || (typeof window !== "undefined" ? localStorage.getItem("active_hotel_code") : "") || "";
                const docRef = doc(getHotelCollection(db, "settings", hotelId), "landingPage");
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const d = snap.data() as any;
                    logoUrl = d?.darkLogo || d?.lightLogo || d?.logoUrl || null;
                }
            } catch (e) {
                console.warn("Could not fetch cpanel logo:", e);
            }
            if (!logoUrl) {
                logoUrl = branding?.darkLogo || branding?.lightLogo || "/channels/nexura-logo.png";
            }

            let logoLoaded = false;
            if (logoUrl) {
                try {
                    const base64Logo = await getBase64Image(logoUrl);
                    if (base64Logo) {
                        pdfDoc.addImage(base64Logo, "PNG", 14, 9, 24, 13);
                        logoLoaded = true;
                    }
                } catch (e) {
                    console.warn("Could not render cpanel logo in PDF", e);
                }
            }

            const headerLeftX = logoLoaded ? 42 : 14;

            // Property Name & Details
            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setFontSize(13);
            pdfDoc.setTextColor(24, 29, 38);
            pdfDoc.text(hotelName.toUpperCase(), headerLeftX, 15);

            pdfDoc.setFont("helvetica", "normal");
            pdfDoc.setFontSize(7.5);
            pdfDoc.setTextColor(100, 100, 100);
            pdfDoc.text(`${hotelAddress} ${hotelPhone ? " | " + hotelPhone : ""}`, headerLeftX, 20);

            // Report Title & System Info Box (Right Side)
            const rightBoxX = 185;
            pdfDoc.setFillColor(248, 249, 250);
            pdfDoc.roundedRect(rightBoxX, 7, 98, 22, 2, 2, "F");
            pdfDoc.setDrawColor(220, 224, 230);
            pdfDoc.roundedRect(rightBoxX, 7, 98, 22, 2, 2, "D");

            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setFontSize(8.5);
            pdfDoc.setTextColor(24, 29, 38);
            pdfDoc.text("DAILY AUDIT & FRONT OFFICE LEDGER", rightBoxX + 4, 12);

            pdfDoc.setFont("helvetica", "normal");
            pdfDoc.setFontSize(6.5);
            pdfDoc.setTextColor(90, 95, 105);
            pdfDoc.text(`Periode: ${periodStr}`, rightBoxX + 4, 16.5);
            pdfDoc.text(`Jam Sistem: ${sysTime}`, rightBoxX + 4, 20.5);
            pdfDoc.text(`Staf Cetak: ${staffStr} (Front Office)`, rightBoxX + 4, 24.5);

            // 2. Separate Data into Pay at Hotel and Transfer
            const payHotelBookings = latestBookings.filter((b: any) => !isTransferTransaction(b));
            const transferBookings = latestBookings.filter((b: any) => isTransferTransaction(b));

            const subtotalPayHotel = payHotelBookings.reduce((sum: number, b: any) => {
                const isCancelled = b.status === "CANCELLED" || b.status === "CANCEL" || b.status === "VOID" || b.status === "VOIDED";
                return isCancelled ? sum : sum + (Number(b.amount) || 0);
            }, 0);

            const subtotalTransfer = transferBookings.reduce((sum: number, b: any) => {
                const isCancelled = b.status === "CANCELLED" || b.status === "CANCEL" || b.status === "VOID" || b.status === "VOIDED";
                return isCancelled ? sum : sum + (Number(b.amount) || 0);
            }, 0);

            const totalRevenue = subtotalPayHotel + subtotalTransfer;

            // Summary KPI Strip
            pdfDoc.setFillColor(24, 29, 38);
            pdfDoc.roundedRect(14, 31, 269, 9, 1.5, 1.5, "F");

            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setFontSize(6.5);
            pdfDoc.setTextColor(255, 255, 255);
            pdfDoc.text(`TOTAL TRANSAKSI: ${latestBookings.length}`, 18, 37);
            pdfDoc.text(`PAY AT HOTEL: Rp ${subtotalPayHotel.toLocaleString("id-ID")} (${payHotelBookings.length})`, 68, 37);
            pdfDoc.text(`TRANSFER & OTA: Rp ${subtotalTransfer.toLocaleString("id-ID")} (${transferBookings.length})`, 140, 37);
            pdfDoc.text(`GRAND TOTAL: Rp ${totalRevenue.toLocaleString("id-ID")}`, 220, 37);

            // Format Table Row helper
            const buildTableRows = (list: any[]) => {
                if (list.length === 0) {
                    return [["-", "-", "-", "Tidak ada transaksi", "-", "-", "-", "-", "-", "-", "-", "Rp 0", "-", "-"]];
                }
                return list.map((b: any, index: number) => {
                    const entryTime = b.timestamp 
                        ? (b.timestamp.includes('T') ? b.timestamp.split('T')[1].substring(0, 5) : new Date(b.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))
                        : "-";
                    
                    const voucher = b.voucherCode || b.bookingId || b.voucher || (b.guestName?.startsWith("POS Order") ? "POS" : "WALK-IN");
                    const guest = b.guestName || "General Sale";
                    const roomType = (b.roomType || b.incomeCategory || b.type || "Standard").toUpperCase();
                    const roomNo = b.roomNumber ? (b.roomNumber.toUpperCase().startsWith("ROOM") ? b.roomNumber : `RM ${b.roomNumber}`) : "-";
                    const checkIn = b.checkInDate || "-";
                    const checkOut = b.checkOutDate || "-";
                    const channel = (b.channel || "Direct").toUpperCase();
                    
                    let paymentMethod = b.paymentMethod || b.settlement || "-";
                    if (!b.paymentMethod || b.paymentMethod === "personal" || b.paymentMethod === "others") {
                        if (Number(b.paidCash || 0) > 0) paymentMethod = "Cash FO";
                        else if (Number(b.paidEdc || 0) > 0) paymentMethod = "EDC Card";
                        else if (Number(b.paidQris || 0) > 0) paymentMethod = "QRIS Hotel";
                        else if (Number(b.paidTransfer || 0) > 0) paymentMethod = "Bank Transfer";
                        else if (Number(b.paidOta || 0) > 0) paymentMethod = "OTA Virtual";
                        else if (b.payHotel) paymentMethod = "Pay at Hotel";
                        else if (b.payTransfer) paymentMethod = "Transfer / OTA";
                        else paymentMethod = b.paymentStatus || "Cash / Direct";
                    }

                    const paymentStatus = (b.paymentStatus || "Pending").toUpperCase();
                    const amountFormatted = `Rp ${Number(b.amount || 0).toLocaleString("id-ID")}`;
                    const staff = b.staffName || b.createdBy || b.inputBy || (user?.displayName || "System");
                    const resStatus = (b.status || "CONFIRMED").toUpperCase();

                    return [
                        index + 1,
                        entryTime,
                        voucher,
                        guest,
                        roomType,
                        roomNo,
                        checkIn,
                        checkOut,
                        channel,
                        paymentMethod,
                        paymentStatus,
                        amountFormatted,
                        staff,
                        resStatus
                    ];
                });
            };

            const sharedColumns = {
                0: { cellWidth: 7, halign: 'center' as const },
                1: { cellWidth: 11, halign: 'center' as const },
                2: { cellWidth: 23 },
                3: { cellWidth: 32 },
                4: { cellWidth: 23 },
                5: { cellWidth: 13, halign: 'center' as const },
                6: { cellWidth: 16, halign: 'center' as const },
                7: { cellWidth: 16, halign: 'center' as const },
                8: { cellWidth: 18 },
                9: { cellWidth: 24 },
                10: { cellWidth: 18, halign: 'center' as const },
                11: { cellWidth: 25, halign: 'right' as const },
                12: { cellWidth: 23 },
                13: { cellWidth: 18, halign: 'center' as const }
            };

            // ── TABLE 1: PAY AT HOTEL ──
            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setFontSize(7.5);
            pdfDoc.setTextColor(24, 29, 38);
            pdfDoc.text("1. TABEL TRANSAKSI PAY AT HOTEL (CASH / BAYAR DI TEMPAT)", 14, 45);

            autoTable(pdfDoc, {
                startY: 47,
                head: [[
                    "No", "Waktu", "No. Voucher / ID", "Nama Tamu / Order", "Tipe Kamar", 
                    "No. Kamar", "Check In", "Check Out", "Channel", "Metode Bayar", 
                    "Status Bayar", "Total Tagihan (IDR)", "Staf Input", "Status"
                ]],
                body: buildTableRows(payHotelBookings),
                theme: "grid",
                headStyles: {
                    fillColor: [44, 62, 80],
                    textColor: [255, 255, 255],
                    fontSize: 6.5,
                    fontStyle: "bold",
                    halign: "center",
                    cellPadding: 2
                },
                bodyStyles: {
                    fontSize: 6,
                    textColor: [40, 40, 40],
                    cellPadding: 1.8,
                    overflow: "linebreak"
                },
                columnStyles: sharedColumns,
                alternateRowStyles: {
                    fillColor: [250, 250, 250]
                },
                foot: [[
                    "", "", "", "SUBTOTAL PAY AT HOTEL", "", "", "", "", "", "", "",
                    `Rp ${subtotalPayHotel.toLocaleString("id-ID")}`, "", ""
                ]],
                footStyles: {
                    fillColor: [235, 240, 245],
                    textColor: [44, 62, 80],
                    fontStyle: "bold",
                    fontSize: 6.5,
                    halign: "right"
                }
            });

            // ── TABLE 2: TRANSFER & OTA ──
            let currentY = (pdfDoc as any).lastAutoTable?.finalY || 100;
            if (currentY > 150) {
                pdfDoc.addPage();
                currentY = 15;
            } else {
                currentY += 8;
            }

            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setFontSize(7.5);
            pdfDoc.setTextColor(24, 29, 38);
            pdfDoc.text("2. TABEL TRANSAKSI BANK TRANSFER & OTA (NON-CASH / SETTLEMENT)", 14, currentY);

            autoTable(pdfDoc, {
                startY: currentY + 2,
                head: [[
                    "No", "Waktu", "No. Voucher / ID", "Nama Tamu / Order", "Tipe Kamar", 
                    "No. Kamar", "Check In", "Check Out", "Channel", "Metode Bayar", 
                    "Status Bayar", "Total Tagihan (IDR)", "Staf Input", "Status"
                ]],
                body: buildTableRows(transferBookings),
                theme: "grid",
                headStyles: {
                    fillColor: [30, 58, 47],
                    textColor: [255, 255, 255],
                    fontSize: 6.5,
                    fontStyle: "bold",
                    halign: "center",
                    cellPadding: 2
                },
                bodyStyles: {
                    fontSize: 6,
                    textColor: [40, 40, 40],
                    cellPadding: 1.8,
                    overflow: "linebreak"
                },
                columnStyles: sharedColumns,
                alternateRowStyles: {
                    fillColor: [250, 250, 250]
                },
                foot: [[
                    "", "", "", "SUBTOTAL TRANSFER & OTA", "", "", "", "", "", "", "",
                    `Rp ${subtotalTransfer.toLocaleString("id-ID")}`, "", ""
                ]],
                footStyles: {
                    fillColor: [235, 245, 240],
                    textColor: [30, 58, 47],
                    fontStyle: "bold",
                    fontSize: 6.5,
                    halign: "right"
                },
                didDrawPage: (data) => {
                    const pageCount = (pdfDoc as any).internal.getNumberOfPages();
                    const pageCurrent = (pdfDoc as any).internal.getCurrentPageInfo().pageNumber;
                    
                    pdfDoc.setFontSize(5.5);
                    pdfDoc.setFont("helvetica", "normal");
                    pdfDoc.setTextColor(130, 130, 130);
                    pdfDoc.text(
                        `* Dokumen laporan resmi Front Office - Nexura Hospitality PMS | Dicetak otomatis pada ${sysTime}`,
                        14,
                        204
                    );
                    pdfDoc.text(
                        `Halaman ${pageCurrent} dari ${pageCount}`,
                        265,
                        204
                    );
                }
            });

            // ── GRAND TOTAL BOX & SIGNATURES ──
            const finalY = (pdfDoc as any).lastAutoTable?.finalY || 140;
            let sigY = finalY + 7;
            if (sigY > 165) {
                pdfDoc.addPage();
                sigY = 20;
            }

            // Grand Total summary banner
            pdfDoc.setFillColor(245, 245, 247);
            pdfDoc.roundedRect(14, sigY, 269, 8, 1, 1, "F");
            pdfDoc.setDrawColor(210, 215, 220);
            pdfDoc.roundedRect(14, sigY, 269, 8, 1, 1, "D");

            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setFontSize(7.5);
            pdfDoc.setTextColor(24, 29, 38);
            pdfDoc.text(`RINGKASAN TOTAL:  Pay at Hotel = Rp ${subtotalPayHotel.toLocaleString("id-ID")}  |  Transfer & OTA = Rp ${subtotalTransfer.toLocaleString("id-ID")}  |  GRAND TOTAL REVENUE = Rp ${totalRevenue.toLocaleString("id-ID")}`, 18, sigY + 5.5);

            // Signature columns
            const signTop = sigY + 12;
            pdfDoc.setFontSize(6.5);
            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setTextColor(60, 60, 60);

            pdfDoc.text("Dibuat & Diperiksa Oleh:", 30, signTop);
            pdfDoc.text("Diverifikasi Oleh:", 125, signTop);
            pdfDoc.text("Disetujui Oleh:", 220, signTop);

            pdfDoc.setFont("helvetica", "normal");
            pdfDoc.text("( Front Office / Night Auditor )", 25, signTop + 14);
            pdfDoc.text("( Duty Manager / Accounting )", 120, signTop + 14);
            pdfDoc.text("( General Manager )", 220, signTop + 14);

            pdfDoc.save(`Detailed_Audit_Ledger_${periodFileName}.pdf`);
            toast.success("Laporan PDF (2 Tabel Terpisah) berhasil di-export");
        } catch (error) {
            console.error("PDF Export error:", error);
            toast.error("Gagal mengekspor PDF");
        }
    };

    return (
        <div className={styles.overviewRoot}>
            {/* Header - Unified with Forecast */}
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerBadge} style={{ backgroundColor: PEACH, color: 'var(--sidebar-link-active-text, #ffffff)' }}>
                            <PlusCircle size={15} />
                        </div>
                        <div className={styles.headerMeta}>
                            <span className={styles.headerSubtitle}>Operational Status</span>
                            <h1 className={styles.headerTitle}>
                                Command Center
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
                                        const val = e.target.value;
                                        if (val) {
                                            setStartDate(val);
                                            setEndDate(val);
                                        }
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
                                    min={startDate}
                                    onChange={(e) => {
                                        if (e.target.value) setEndDate(e.target.value);
                                    }} 
                                    className={styles.dateInput}
                                />
                            </div>
                        </div>

                        <div className={styles.vDivider} />

                        <div className={styles.actionGroup}>
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
                                style={{ height: '38px', padding: '0 16px', borderRadius: '8px', gap: '8px' }}
                                disabled={isReadOnly}
                            >
                                <PlusCircle size={18} />
                                <span>Add Transaction</span>
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
                </div>
            </header>

            <main className={styles.mainContainer}>
                {/* SECTION 1: MOVEMENT GRID */}
                <section className={styles.statGrid}>
                    <StatCard 
                        accent="#212121" icon={<LogIn size={18} />} 
                        label={isTodayActive ? "Check In Today" : (isTomorrowActive ? "Check In Tomorrow" : `Check In (${startDate} to ${endDate})`)} 
                        count={dash || checkInCount} items={todayCheckIns}
                        onItemClick={(b: any) => { setSelectedGuest(b); setIsEditing(false); }}
                        onStatusUpdate={handleStatusUpdate}
                    />
                    <StatCard 
                        accent="#ef4444" icon={<Calendar size={18} />} 
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
                    onEdit={(b) => { setSelectedGuest(b); setIsEditing(true); }}
                    onDelete={(b) => {
                        if (!canVoid) {
                            toast.error("Anda tidak memiliki izin untuk melakukan Void booking/transaksi.");
                            return;
                        }
                        setBookingToVoid(b);
                    }}
                    onCancel={(b) => {
                        if (!canCancel) {
                            toast.error("Anda tidak memiliki izin untuk membatalkan booking/transaksi.");
                            return;
                        }
                        setBookingToCancel(b);
                    }}
                    onStatusUpdate={handleStatusUpdate}
                    onExportExcel={handleExportExcel}
                    onExportPDF={handleExportPDF}
                />
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
                        key={`${selectedGuest.bookingId || ''}_${selectedGuest.roomNumber || ''}_${selectedGuest.timestamp || ''}`}
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