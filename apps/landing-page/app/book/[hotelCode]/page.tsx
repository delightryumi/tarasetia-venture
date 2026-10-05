"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import styles from "../BookingEngine.module.css";
import {
    Calendar,
    Users,
    Bed,
    Check,
    ShieldCheck,
    CreditCard,
    ArrowLeft,
    Clock,
    Landmark,
    Lock,
    CheckCircle,
    Info,
    AlertCircle,
    Flame,
} from "lucide-react";
import {
    getBookingEngineData,
    createDirectBookingReservation,
    BookingEnginePublicData,
    BookingSelection,
    BookingGuestDetails,
    PublicRoomType,
} from "@/services/bookingEngineService";

export default function DirectBookingPage() {
    const params = useParams();
    const searchParams = useSearchParams();

    const hotelCodeParam = (params?.hotelCode as string) || "1";

    // Google Hotel Deep Link Query Parameters
    const initialCheckin = searchParams.get("checkin") || new Date().toISOString().split("T")[0];
    const initialCheckout =
        searchParams.get("checkout") ||
        new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const initialAdults = parseInt(searchParams.get("adults") || "2", 10);
    const initialChildren = parseInt(searchParams.get("children") || "0", 10);
    const requestedRoomTypeId = searchParams.get("roomType") || "";

    // State
    const [engineData, setEngineData] = useState<BookingEnginePublicData | null>(null);
    const [loading, setLoading] = useState(true);

    // Filter bar state
    const [checkIn, setCheckIn] = useState(initialCheckin);
    const [checkOut, setCheckOut] = useState(initialCheckout);
    const [adults, setAdults] = useState(initialAdults);
    const [children, setChildren] = useState(initialChildren);

    // Selected Room & Rate Plan
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [selectedRatePlanId, setSelectedRatePlanId] = useState<string | null>(null);

    // Step state: 1 = room selection, 2 = guest form & payment, 3 = confirmation
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Guest Info Form
    const [guestDetails, setGuestDetails] = useState<BookingGuestDetails>({
        fullName: "",
        email: "",
        phone: "",
        specialRequests: "",
        estimatedArrivalTime: "14:00",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmedBookingCode, setConfirmedBookingCode] = useState<string>("");

    // Fetch booking data (re-fetches inventory when checkIn or checkOut updates)
    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getBookingEngineData(hotelCodeParam, checkIn, checkOut);
            setEngineData(data);
            if (data?.rooms && data.rooms.length > 0) {
                const targetRoom = requestedRoomTypeId
                    ? data.rooms.find((r) => r.id === requestedRoomTypeId)
                    : data.rooms.find((r) => !r.isSoldOut) || data.rooms[0];
                const activeRoom = targetRoom || data.rooms[0];
                setSelectedRoomId(activeRoom.id);
                if (activeRoom.ratePlans.length > 0) {
                    setSelectedRatePlanId(activeRoom.ratePlans[0].id);
                }
            }
            setLoading(false);
        }
        load();
    }, [hotelCodeParam, checkIn, checkOut, requestedRoomTypeId]);

    // Calculate nights
    const nights = useMemo(() => {
        const start = new Date(checkIn).getTime();
        const end = new Date(checkOut).getTime();
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 1;
    }, [checkIn, checkOut]);

    // Selected room object
    const selectedRoom = useMemo(() => {
        return engineData?.rooms.find((r) => r.id === selectedRoomId) || null;
    }, [engineData, selectedRoomId]);

    // Selected rate plan object
    const selectedRatePlan = useMemo(() => {
        if (!selectedRoom) return null;
        return (
            selectedRoom.ratePlans.find((p) => p.id === selectedRatePlanId) ||
            selectedRoom.ratePlans[0] ||
            null
        );
    }, [selectedRoom, selectedRatePlanId]);

    // Price Breakdown Calculations
    const priceCalculation = useMemo(() => {
        const pricePerNight = selectedRatePlan?.price || selectedRoom?.basePrice || 0;
        const baseTotal = pricePerNight * nights;
        const taxRate = engineData?.paymentSettings.taxRate || 10;
        const serviceRate = engineData?.paymentSettings.serviceRate || 10;

        const taxAmount = Math.round((baseTotal * taxRate) / 100);
        const serviceAmount = Math.round((baseTotal * serviceRate) / 100);
        const grandTotal = baseTotal + taxAmount + serviceAmount;

        return {
            pricePerNight,
            baseTotal,
            taxAmount,
            serviceAmount,
            grandTotal,
            taxRate,
            serviceRate,
        };
    }, [selectedRatePlan, selectedRoom, nights, engineData]);

    // Handle room selection & jump to checkout step
    const handleProceedToGuestForm = (room: PublicRoomType, ratePlanId: string) => {
        if (room.isSoldOut) {
            alert("Maaf, tipe kamar ini telah habis terjual (Sold Out) pada tanggal yang dipilih.");
            return;
        }
        setSelectedRoomId(room.id);
        setSelectedRatePlanId(ratePlanId);
        setStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Handle final payment checkout
    const handleCheckoutSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestDetails.fullName || !guestDetails.email || !guestDetails.phone) {
            alert("Mohon lengkapi nama, email, dan nomor kontak aktif.");
            return;
        }

        setIsSubmitting(true);

        const selection: BookingSelection = {
            roomTypeId: selectedRoom?.id || "",
            roomTypeName: selectedRoom?.name || "",
            ratePlanId: selectedRatePlan?.id || "",
            ratePlanName: selectedRatePlan?.name || "",
            nights,
            roomsCount: 1,
            pricePerNight: priceCalculation.pricePerNight,
            baseTotal: priceCalculation.baseTotal,
            taxAmount: priceCalculation.taxAmount,
            serviceAmount: priceCalculation.serviceAmount,
            grandTotal: priceCalculation.grandTotal,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            adults,
            children,
        };

        const res = await createDirectBookingReservation(hotelCodeParam, {
            guest: guestDetails,
            selection,
            paymentMethod: engineData?.paymentSettings.activeProvider || "manual",
            paymentStatus: "pending",
        });

        setIsSubmitting(false);

        if (res.success) {
            setConfirmedBookingCode(res.bookingCode);
            setStep(3);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            alert(res.error || "Terjadi kesalahan saat memproses reservasi.");
        }
    };

    if (loading) {
        return (
            <div className={styles.pageWrapper} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ width: "36px", height: "36px", border: "3px solid #1e3a2f", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px auto" }} />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#64748b" }}>
                        Menyiapkan Tarif & Ketersediaan Kamar Real-time...
                    </span>
                </div>
            </div>
        );
    }

    // Add-on Inactive Gate
    if (engineData && !engineData.isAddonActive) {
        return (
            <div className={styles.pageWrapper} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                <div className={styles.clayBox} style={{ maxWidth: "480px", textAlign: "center" }}>
                    <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#fef3c7", color: "#b45309", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto" }}>
                        <Lock size={26} />
                    </div>
                    <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
                        Direct Booking Engine Belum Aktif
                    </h2>
                    <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.5, marginBottom: "20px" }}>
                        Layanan pemesanan kamar langsung untuk <strong>{engineData.hotelName}</strong> sedang dalam konfigurasi atau belum diaktifkan oleh pihak hotel.
                    </p>
                    <Link href="/" className={styles.clayBtnPrimary}>
                        <ArrowLeft size={16} />
                        <span>Kembali ke Website Hotel</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <div className={styles.brandGroup}>
                        <Link href="/" className={styles.btnBackHome} title="Kembali ke Beranda">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <span className={styles.hotelBadge}>Situs Resmi Properti</span>
                            <h1 className={styles.hotelName}>{engineData?.hotelName}</h1>
                        </div>
                    </div>

                    <div className={styles.badgeOfficial}>
                        <ShieldCheck size={16} />
                        <span>Jaminan Harga Terbaik</span>
                    </div>
                </div>
            </header>

            {/* Main Content Container */}
            <main style={{ maxWidth: "1200px", margin: "32px auto 0 auto", padding: "0 20px" }}>
                {/* STEP 1: ROOM SELECTION */}
                {step === 1 && (
                    <>
                        {/* Search & Date Filter Bar */}
                        <div className={styles.searchBarCard}>
                            <div className={styles.searchGrid}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>
                                        <Calendar size={14} color="#1e3a2f" />
                                        <span>Check-In</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={checkIn}
                                        onChange={(e) => setCheckIn(e.target.value)}
                                        className={styles.clayInput}
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>
                                        <Calendar size={14} color="#1e3a2f" />
                                        <span>Check-Out</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={checkOut}
                                        min={checkIn}
                                        onChange={(e) => setCheckOut(e.target.value)}
                                        className={styles.clayInput}
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>
                                        <Users size={14} color="#1e3a2f" />
                                        <span>Dewasa (Adults)</span>
                                    </label>
                                    <select
                                        value={adults}
                                        onChange={(e) => setAdults(parseInt(e.target.value, 10))}
                                        className={styles.clayInput}
                                    >
                                        {[1, 2, 3, 4, 5, 6].map((n) => (
                                            <option key={n} value={n}>{n} Orang Dewasa</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>
                                        <Users size={14} color="#1e3a2f" />
                                        <span>Anak-Anak (Children)</span>
                                    </label>
                                    <select
                                        value={children}
                                        onChange={(e) => setChildren(parseInt(e.target.value, 10))}
                                        className={styles.clayInput}
                                    >
                                        {[0, 1, 2, 3].map((n) => (
                                            <option key={n} value={n}>{n} Anak</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className={styles.searchBarFooter}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Clock size={15} color="#1e3a2f" />
                                    <span>Durasi Menginap: <strong>{nights} Malam</strong></span>
                                </div>
                                <div>
                                    Waktu Check-in: <strong>{engineData?.paymentSettings.checkInTime}</strong> | Check-out: <strong>{engineData?.paymentSettings.checkOutTime}</strong>
                                </div>
                            </div>
                        </div>

                        {/* Room Catalogue List */}
                        <div className={styles.sectionTitleRow}>
                            <h2 className={styles.sectionMainHeading}>Pilihan Kamar & Ketersediaan Kamar Real-time</h2>
                            <p className={styles.sectionSubHeading}>
                                Seluruh tarif kamar terhubung langsung dengan alokasi inventaris hotel tanpa komisi perantara OTA.
                            </p>
                        </div>

                        <div>
                            {engineData?.rooms.map((room) => (
                                <div key={room.id} className={styles.roomCard}>
                                    <div className={styles.roomGrid}>
                                        {/* Room Photo & Badges */}
                                        <div className={styles.roomImageArea}>
                                            {room.images?.[0]?.url ? (
                                                <Image
                                                    src={room.images[0].url}
                                                    alt={room.name}
                                                    fill
                                                    style={{ objectFit: "cover" }}
                                                />
                                            ) : (
                                                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                                                    <Bed size={48} />
                                                </div>
                                            )}

                                            <div className={styles.badgeSize}>
                                                Luas: {room.roomSizeValue} {room.roomSizeUnit}
                                            </div>

                                            {/* Real-time Inventory Status Badges */}
                                            <div className={styles.badgeStockWrap}>
                                                {room.isSoldOut ? (
                                                    <div className={styles.badgeStockSoldOut}>
                                                        <AlertCircle size={14} />
                                                        <span>Habis Terjual (Sold Out)</span>
                                                    </div>
                                                ) : room.availableRooms <= 3 ? (
                                                    <div className={styles.badgeStockUrgent}>
                                                        <Flame size={14} color="#b45309" />
                                                        <span>Hanya Sisa {room.availableRooms} Kamar!</span>
                                                    </div>
                                                ) : (
                                                    <div className={styles.badgeStockAvailable}>
                                                        <Check size={14} />
                                                        <span>Tersedia ({room.availableRooms} Kamar)</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Room Specs & Rate Plans */}
                                        <div className={styles.roomContent}>
                                            <div>
                                                <h3 className={styles.roomTitle}>{room.name}</h3>
                                                <p className={styles.roomDescription}>
                                                    {room.description || "Nikmati kenyamanan beristirahat dengan fasilitas lengkap kamar hotel standar bintang."}
                                                </p>

                                                {/* Amenities */}
                                                <div className={styles.amenityChips}>
                                                    {room.amenities?.slice(0, 5).map((amenity, idx) => (
                                                        <span key={idx} className={styles.chip}>
                                                            <Check size={12} color="#1e3a2f" />
                                                            <span>{amenity}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Rate Plans */}
                                            <div className={styles.ratePlanSection}>
                                                <div className={styles.ratePlanGrid}>
                                                    {room.ratePlans.map((plan) => (
                                                        <div key={plan.id} className={styles.clayRateCard}>
                                                            <div>
                                                                <h4 className={styles.ratePlanName}>{plan.name}</h4>
                                                                <p className={styles.ratePlanDesc}>{plan.description}</p>
                                                            </div>

                                                            <div className={styles.ratePriceRow}>
                                                                <div>
                                                                    <span className={styles.priceLabel}>Mulai dari</span>
                                                                    <span className={styles.priceAmount}>
                                                                        Rp {plan.price.toLocaleString("id-ID")}
                                                                    </span>
                                                                    <span className={styles.priceNight}> /malam</span>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    disabled={room.isSoldOut}
                                                                    onClick={() => handleProceedToGuestForm(room, plan.id)}
                                                                    className={styles.clayBtnPrimary}
                                                                >
                                                                    {room.isSoldOut ? "Sold Out" : "Pilih Kamar"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* STEP 2: GUEST FORM & CHECKOUT */}
                {step === 2 && (
                    <div>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "transparent", border: "none", color: "#475569", fontSize: "13px", fontWeight: 700, cursor: "pointer", marginBottom: "20px" }}
                        >
                            <ArrowLeft size={16} />
                            <span>Ganti Pilihan Kamar</span>
                        </button>

                        <div className={styles.checkoutLayout}>
                            {/* Guest Form */}
                            <div className={styles.clayBox}>
                                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", marginBottom: "4px" }}>
                                    Data Kontak & Informasi Tamu
                                </h3>
                                <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "24px" }}>
                                    Voucher konfirmasi resmi akan dikirimkan langsung ke email dan WhatsApp Anda.
                                </p>

                                <form onSubmit={handleCheckoutSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>Nama Lengkap Tamu *</label>
                                        <input
                                            type="text"
                                            required
                                            value={guestDetails.fullName}
                                            onChange={(e) => setGuestDetails((p) => ({ ...p, fullName: e.target.value }))}
                                            placeholder="Sesuai KTP / Paspor"
                                            className={styles.clayInput}
                                        />
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                        <div className={styles.fieldGroup}>
                                            <label className={styles.fieldLabel}>Alamat Email *</label>
                                            <input
                                                type="email"
                                                required
                                                value={guestDetails.email}
                                                onChange={(e) => setGuestDetails((p) => ({ ...p, email: e.target.value }))}
                                                placeholder="nama@email.com"
                                                className={styles.clayInput}
                                            />
                                        </div>

                                        <div className={styles.fieldGroup}>
                                            <label className={styles.fieldLabel}>Nomor WhatsApp / HP *</label>
                                            <input
                                                type="tel"
                                                required
                                                value={guestDetails.phone}
                                                onChange={(e) => setGuestDetails((p) => ({ ...p, phone: e.target.value }))}
                                                placeholder="081234567890"
                                                className={styles.clayInput}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>Permintaan Khusus (Opsional)</label>
                                        <textarea
                                            rows={2}
                                            value={guestDetails.specialRequests || ""}
                                            onChange={(e) => setGuestDetails((p) => ({ ...p, specialRequests: e.target.value }))}
                                            placeholder="Contoh: Bebas asap rokok, lantai atas, estimasi check-in terlambat"
                                            className={styles.clayInput}
                                            style={{ resize: "none" }}
                                        />
                                    </div>

                                    <div style={{ padding: "16px", borderRadius: "16px", background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: "13px", color: "#166534" }}>
                                        <strong>Metode Pembayaran Properti:</strong>{" "}
                                        {engineData?.paymentSettings.activeProvider === "midtrans" && "Didukung oleh Midtrans (QRIS, VA BCA, Mandiri, BNI, Kartu Kredit)."}
                                        {engineData?.paymentSettings.activeProvider === "xendit" && "Didukung oleh Xendit Invoice (QRIS, Multi-Bank VA, E-Wallet)."}
                                        {engineData?.paymentSettings.activeProvider === "manual" && "Transfer langsung ke rekening resmi hotel."}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={styles.clayBtnPrimary}
                                        style={{ width: "100%", padding: "14px", fontSize: "14px", marginTop: "10px" }}
                                    >
                                        {isSubmitting ? "Memproses Pemesanan..." : "Konfirmasi & Lanjutkan Pembayaran"}
                                    </button>
                                </form>
                            </div>

                            {/* Summary Sidebar */}
                            <div>
                                <div className={`${styles.clayBox} ${styles.summarySticky}`}>
                                    <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
                                        Ringkasan Reservasi
                                    </h3>

                                    <div className={styles.summaryRow}>
                                        <span>Tipe Kamar:</span>
                                        <strong>{selectedRoom?.name}</strong>
                                    </div>

                                    <div className={styles.summaryRow}>
                                        <span>Paket Tarif:</span>
                                        <span style={{ color: "#1e3a2f", fontWeight: 700 }}>{selectedRatePlan?.name}</span>
                                    </div>

                                    <div className={styles.summaryRow}>
                                        <span>Periode:</span>
                                        <span>{checkIn} s/d {checkOut} ({nights} Malam)</span>
                                    </div>

                                    <div className={styles.summaryRow}>
                                        <span>Tamu:</span>
                                        <span>{adults} Dewasa{children > 0 ? `, ${children} Anak` : ""}</span>
                                    </div>

                                    <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "12px" }}>
                                        <div className={styles.summaryRow}>
                                            <span>Tarif Kamar ({nights} malam):</span>
                                            <span>Rp {priceCalculation.baseTotal.toLocaleString("id-ID")}</span>
                                        </div>
                                        <div className={styles.summaryRow}>
                                            <span>Pajak Daerah PB1 ({priceCalculation.taxRate}%):</span>
                                            <span>Rp {priceCalculation.taxAmount.toLocaleString("id-ID")}</span>
                                        </div>
                                        <div className={styles.summaryRow}>
                                            <span>Service Charge ({priceCalculation.serviceRate}%):</span>
                                            <span>Rp {priceCalculation.serviceAmount.toLocaleString("id-ID")}</span>
                                        </div>
                                    </div>

                                    <div className={styles.summaryTotalRow}>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#64748b" }}>Total Bayar:</span>
                                        <span className={styles.totalPrice}>
                                            Rp {priceCalculation.grandTotal.toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: CONFIRMATION & INSTRUCTIONS */}
                {step === 3 && (
                    <div className={styles.confirmCard}>
                        <div className={styles.clayBox}>
                            <div className={styles.successIconWrap}>
                                <CheckCircle size={36} />
                            </div>

                            <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#0f172a", margin: "0 0 6px 0" }}>
                                Reservasi Berhasil Diterbitkan!
                            </h2>
                            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px 0" }}>
                                Terima kasih, {guestDetails.fullName}. Kode pemesanan resmi Anda telah tercatat pada sistem hotel.
                            </p>

                            <div className={styles.bookingCodeBox}>
                                <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#64748b", display: "block", marginBottom: "4px" }}>
                                    Nomor Kode Booking
                                </span>
                                <span className={styles.bookingCodeText}>{confirmedBookingCode}</span>
                            </div>

                            {/* Bank Details if manual */}
                            {engineData?.paymentSettings.activeProvider === "manual" && (
                                <div style={{ textAlign: "left", marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                                        Transfer ke Rekening Resmi Hotel:
                                    </span>
                                    {engineData.paymentSettings.manualBanks.map((b) => (
                                        <div key={b.id} style={{ padding: "14px", borderRadius: "14px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 800 }}>
                                                <span style={{ color: "#1e3a2f" }}>{b.bankName}</span>
                                                <span style={{ fontFamily: "monospace" }}>{b.accountNumber}</span>
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                                                Atas Nama: <strong>{b.accountHolder}</strong>
                                            </div>
                                        </div>
                                    ))}

                                    <div style={{ padding: "12px", borderRadius: "12px", background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e", fontSize: "12px" }}>
                                        Total yang harus ditransfer: <strong>Rp {priceCalculation.grandTotal.toLocaleString("id-ID")}</strong>. Cantumkan kode booking pada berita transfer.
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: "24px" }}>
                                <Link href="/" className={styles.clayBtnPrimary}>
                                    Kembali ke Beranda Hotel
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
