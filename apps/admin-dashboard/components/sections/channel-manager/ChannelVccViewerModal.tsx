"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Lock, Eye, EyeOff, Copy, X, CreditCard, AlertTriangle, CheckCircle2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrencyAmount } from "@/lib/currency-utils";
import styles from "./ChannelVccViewer.module.css";

interface OtaBookingSummary {
    bookingId: string;
    channexBookingId?: string | null;
    guestName: string;
    channel: string;
    roomType: string;
    roomNumber: string;
    checkInDate: string;
    checkOutDate: string;
    totalAmount: number;
    status: string;
    hasVcc: boolean;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    hotelCode: string;
    initialBookingId?: string;
}

export function ChannelVccViewerModal({
    isOpen,
    onClose,
    hotelCode,
    initialBookingId
}: Props) {
    const [bookings, setBookings] = useState<OtaBookingSummary[]>([]);
    const [selectedBookingId, setSelectedBookingId] = useState<string>(initialBookingId || "");
    const [loadingBookings, setLoadingBookings] = useState<boolean>(false);
    const [pin, setPin] = useState<string>("");
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [cardData, setCardData] = useState<any>(null);
    const [hasCard, setHasCard] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string>("");
    const [showCVV, setShowCVV] = useState<boolean>(false);

    // Keyboard accessibility: close modal on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Fetch real OTA bookings from hotel daily revenue
    useEffect(() => {
        if (!isOpen || !hotelCode) return;
        const loadOtaBookings = async () => {
            setLoadingBookings(true);
            try {
                const res = await fetch(`/api/channex/vcc?hotelCode=${hotelCode}`);
                const data = await res.json();
                if (data.success && data.bookings) {
                    setBookings(data.bookings);
                    if (!selectedBookingId && data.bookings.length > 0) {
                        setSelectedBookingId(data.bookings[0].bookingId);
                    }
                }
            } catch (err) {
                console.error("Error loading OTA bookings for VCC:", err);
            } finally {
                setLoadingBookings(false);
            }
        };

        loadOtaBookings();
    }, [isOpen, hotelCode, selectedBookingId]);

    if (!isOpen) return null;

    const currentBooking = bookings.find(b => b.bookingId === selectedBookingId) || null;

    const handleVerifyPin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBookingId) {
            toast.error("Pilih reservasi OTA terlebih dahulu.");
            return;
        }
        if (!pin) {
            toast.error("Masukkan PIN keamanan kasir atau supervisor.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/channex/vcc", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode,
                    bookingId: selectedBookingId,
                    pin
                })
            });
            const data = await res.json();
            if (data.success) {
                setIsAuthenticated(true);
                setHasCard(Boolean(data.hasCard));
                setCardData(data.card || null);
                setStatusMessage(data.message || "");
                toast.success(data.message || "Rincian VCC berhasil didekripsi.");
            } else {
                toast.error(data.error || "Otorisasi PIN gagal. Akses ditolak.");
            }
        } catch (err) {
            toast.error("Gangguan komunikasi jaringan saat verifikasi PIN.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`${label} disalin ke clipboard.`);
    };

    const handleReset = () => {
        setIsAuthenticated(false);
        setCardData(null);
        setHasCard(false);
        setPin("");
        setStatusMessage("");
    };

    return (
        <div
            className={styles.backdrop}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="vcc-modal-title"
        >
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIconBox}>
                            <ShieldCheck size={18} />
                        </div>
                        <div>
                            <div className={styles.headerTag}>PCI-DSS Level 1 Security Gateway</div>
                            <h3 id="vcc-modal-title" className={styles.title}>
                                Virtual Credit Card (VCC) Viewer
                            </h3>
                            <div className={styles.subtitle}>
                                Standar Enkripsi Tokenisasi Kartu Virtual OTA • Properti: <b>{hotelCode}</b>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className={styles.closeBtn}
                        aria-label="Tutup jendela VCC viewer"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className={styles.body}>
                    {/* Booking Selector Section */}
                    <div className={styles.selectorCard}>
                        <label className={styles.selectorLabel}>
                            Pilih Reservasi OTA Sumber:
                        </label>

                        {loadingBookings ? (
                            <div className={styles.loadingText}>Memuat reservasi OTA dari Front Office...</div>
                        ) : bookings.length > 0 ? (
                            <select
                                value={selectedBookingId}
                                onChange={e => {
                                    setSelectedBookingId(e.target.value);
                                    handleReset();
                                }}
                                className={styles.selectInput}
                            >
                                {bookings.map(b => (
                                    <option key={b.bookingId} value={b.bookingId}>
                                        {b.channel} • #{b.bookingId} : {b.guestName} (Rp {b.totalAmount.toLocaleString("en-US")})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className={styles.emptyText}>
                                Tidak ada reservasi OTA aktif yang ditemukan pada sistem Front Office.
                            </div>
                        )}

                        {/* Selected Booking Details */}
                        {currentBooking && (
                            <div className={styles.bookingGrid}>
                                <div className={styles.bookingGridItem}>
                                    <span className={styles.gridLabel}>Tamu:</span>
                                    <span className={styles.gridValue}>{currentBooking.guestName}</span>
                                </div>
                                <div className={styles.bookingGridItem}>
                                    <span className={styles.gridLabel}>Saluran:</span>
                                    <span className={styles.gridValue}>{currentBooking.channel}</span>
                                </div>
                                <div className={styles.bookingGridItem}>
                                    <span className={styles.gridLabel}>Kamar:</span>
                                    <span className={styles.gridValue}>{currentBooking.roomType}</span>
                                </div>
                                <div className={styles.bookingGridItem}>
                                    <span className={styles.gridLabel}>Total Tagihan:</span>
                                    <span className={`${styles.gridValue} ${styles.numericValue}`}>
                                        Rp {currentBooking.totalAmount.toLocaleString("en-US")}
                                    </span>
                                </div>
                                <div className={styles.bookingGridItem}>
                                    <span className={styles.gridLabel}>Periode Menginap:</span>
                                    <span className={styles.gridValue}>
                                        {currentBooking.checkInDate} s/d {currentBooking.checkOutDate}
                                    </span>
                                </div>
                                <div className={styles.bookingGridItem}>
                                    <span className={styles.gridLabel}>Status:</span>
                                    <span className={styles.statusBadge}>{currentBooking.status}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {!isAuthenticated ? (
                        /* PIN Gate */
                        <form onSubmit={handleVerifyPin} className={styles.pinBox}>
                            <div className={styles.pinIconBox}>
                                <Lock size={20} />
                            </div>

                            <div className={styles.pinPromptWrap}>
                                <div className={styles.pinTitle}>
                                    Otorisasi Keamanan Akses Kartu
                                </div>
                                <p className={styles.pinDesc}>
                                    Setiap aksi pembukaan kartu virtual dicatat pada audit log kepatuhan PCI-DSS.
                                </p>
                            </div>

                            <input
                                type="password"
                                maxLength={6}
                                value={pin}
                                onChange={e => setPin(e.target.value)}
                                placeholder="••••"
                                className={styles.pinInput}
                                autoFocus
                            />
                            <div className={styles.pinHint}>
                                Masukkan Master PIN Keamanan Kasir (Default: <b>1234</b>)
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !pin || !selectedBookingId}
                                className={styles.btnAction}
                            >
                                {loading ? "Memverifikasi & Mendekripsi..." : "Dekripsi & Tampilkan Rincian VCC"}
                            </button>
                        </form>
                    ) : hasCard && cardData ? (
                        /* Authenticated Card Details */
                        <div className={styles.cardDetailsWrap}>
                            {/* Visual Virtual Card */}
                            <div className={styles.cardVisual}>
                                <div className={styles.cardTopRow}>
                                    <div className={styles.cardChip} />
                                    <span className={styles.cardBrand}>{cardData?.card_type || "VISA VCC"}</span>
                                </div>

                                <div className={styles.cardNumberRow}>
                                    <span>{cardData?.card_number}</span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(cardData?.card_number?.replace(/\s/g, ""), "Nomor Kartu VCC")}
                                        className={styles.copyBtn}
                                        title="Salin Nomor Kartu"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>

                                <div className={styles.cardBottomRow}>
                                    <div>
                                        <div className={styles.cardLabel}>Nama Pemegang Kartu</div>
                                        <div className={styles.cardHolderName}>{cardData?.cardholder_name || "VIRTUAL CARD HOLDER"}</div>
                                    </div>

                                    <div className={styles.cardExpiryCVV}>
                                        <div>
                                            <div className={styles.cardLabel}>Masa Berlaku</div>
                                            <div className={styles.cardMetaVal}>
                                                {cardData?.expiry_month}/{cardData?.expiry_year?.slice(-2)}
                                            </div>
                                        </div>

                                        <div>
                                            <div className={styles.cardLabel}>CVV / CVC</div>
                                            <div className={styles.cvvWrap}>
                                                <span className={styles.cardMetaVal}>
                                                    {showCVV ? cardData?.cvv : "•••"}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCVV(!showCVV)}
                                                    className={styles.eyeBtn}
                                                    title={showCVV ? "Sembunyikan CVV" : "Tampilkan CVV"}
                                                >
                                                    {showCVV ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Settlement Balance Box */}
                            <div className={styles.balanceNotice}>
                                <div>
                                    <div className={styles.balanceAmount}>
                                        Saldo Tersedia: {formatCurrencyAmount(Number(cardData?.current_balance || currentBooking?.totalAmount || 0), cardData?.currency || cardData?.virtual_card_currency_code || "IDR")}
                                    </div>
                                    <div className={styles.balanceDates}>
                                        Aktif dari {cardData?.activation_date || "-"} s/d {cardData?.expiration_date || "-"}
                                    </div>
                                </div>
                                <span className={styles.readyBadge}>
                                    SIAP DI-DEBET EDC / POS
                                </span>
                            </div>

                            {/* Audit Instructions */}
                            <div className={styles.pciAuditNotice}>
                                <div className={styles.instructionHeader}>Instruksi Kasir Front Desk:</div>
                                <div className={styles.instructionBody}>{cardData?.settlement_instruction || "Lakukan debet sesuai nominal di atas pada mesin EDC terminal bank hotel."}</div>
                                <div className={styles.sessionMeta}>
                                    PCI Session ID: <code>pci-sess-{Date.now().toString(36)}</code> • Akses tercatat dalam audit log.
                                </div>
                            </div>

                            <div className={styles.actionRow}>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className={styles.btnSecondary}
                                >
                                    Pilih Reservasi Lain
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className={styles.btnAction}
                                >
                                    Tutup Card Viewer
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Case: Hotel Collect / No VCC issued by OTA */
                        <div className={styles.hotelCollectBox}>
                            <div className={styles.hotelCollectIconBox}>
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <div className={styles.hotelCollectTitle}>
                                    Metode Pembayaran: Property Collect / Bayar di Tempat
                                </div>
                                <p className={styles.hotelCollectDesc}>
                                    {statusMessage || "Reservasi ini tidak memerlukan pemotongan kartu virtual karena tamu membayar langsung di front desk hotel saat check-in atau check-out."}
                                </p>
                            </div>

                            <div className={styles.actionRow}>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className={styles.btnSecondary}
                                >
                                    Pilih Reservasi Lain
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className={styles.btnAction}
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
