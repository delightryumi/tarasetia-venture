"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Lock, Eye, EyeOff, Copy, X, CreditCard, AlertTriangle, CheckCircle2, Building2 } from "lucide-react";
import { toast } from "sonner";
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
    }, [isOpen, hotelCode]);

    if (!isOpen) return null;

    const currentBooking = bookings.find(b => b.bookingId === selectedBookingId) || null;

    const handleVerifyPin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBookingId) {
            toast.error("Please select an OTA reservation ID first.");
            return;
        }
        if (!pin) {
            toast.error("Please enter the cashier or supervisor security PIN.");
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
                setHasCard(!!data.hasCard);
                setCardData(data.card || null);
                setStatusMessage(data.message || "");
                toast.success(data.message || "VCC details decrypted successfully.");
            } else {
                toast.error(data.error || "PIN authorization failed. Access denied.");
            }
        } catch (err) {
            toast.error("Network communication error during verification.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard!`);
    };

    const handleReset = () => {
        setIsAuthenticated(false);
        setCardData(null);
        setHasCard(false);
        setPin("");
        setStatusMessage("");
    };

    return (
        <div className={styles.backdrop}>
            <div className={styles.modal}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <ShieldCheck size={18} color="#86efac" />
                        <div>
                            <div className={styles.title}>PCI Virtual Credit Card (VCC) Viewer</div>
                            <div style={{ fontSize: "10px", opacity: 0.8 }}>PCI-DSS Level 1 Compliance &amp; Security Standard</div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer" }}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.body}>
                    {/* Real OTA Booking Selector */}
                    <div style={{ marginBottom: "16px", background: "#f8fafc", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                            Select OTA Reservation Source:
                        </label>

                        {loadingBookings ? (
                            <div style={{ fontSize: "12px", color: "#64748b" }}>Loading OTA reservations from Front Office...</div>
                        ) : bookings.length > 0 ? (
                            <select
                                value={selectedBookingId}
                                onChange={e => {
                                    setSelectedBookingId(e.target.value);
                                    handleReset();
                                }}
                                style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: 600, background: "#ffffff" }}
                            >
                                {bookings.map(b => (
                                    <option key={b.bookingId} value={b.bookingId}>
                                        {b.channel} • #{b.bookingId} - {b.guestName} (Rp {b.totalAmount.toLocaleString("en-US")})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                                No active OTA reservations found in the Front Office system.
                            </div>
                        )}

                        {/* Selected Booking Details Card */}
                        {currentBooking && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "10px", fontSize: "11px", color: "#475569" }}>
                                <div>Guest: <b>{currentBooking.guestName}</b></div>
                                <div>Channel: <b>{currentBooking.channel}</b></div>
                                <div>Room: <b>{currentBooking.roomType}</b></div>
                                <div>Total: <b>Rp {currentBooking.totalAmount.toLocaleString("en-US")}</b></div>
                                <div>Stay Period: <b>{currentBooking.checkInDate} to {currentBooking.checkOutDate}</b></div>
                                <div>Status: <b>{currentBooking.status}</b></div>
                            </div>
                        )}
                    </div>

                    {!isAuthenticated ? (
                        /* PIN Gate */
                        <form onSubmit={handleVerifyPin} className={styles.pinBox}>
                            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Lock size={24} color="#1e3a2f" />
                            </div>

                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                                    Card Access Security Authorization
                                </div>
                                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                                    All virtual credit card decryption events are recorded in the permanent PCI DSS compliance audit trail.
                                </div>
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
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                                Enter Security Master PIN (Default: <b>1234</b>)
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !pin || !selectedBookingId}
                                className={styles.btnAction}
                            >
                                {loading ? "Verifying & Decrypting..." : "Decrypt & Reveal VCC Details"}
                            </button>
                        </form>
                    ) : hasCard && cardData ? (
                        /* Authenticated Card Details */
                        <>
                            {/* Visual Virtual Card */}
                            <div className={styles.cardVisual}>
                                <div className={styles.cardTopRow}>
                                    <div className={styles.cardChip} />
                                    <span className={styles.cardBrand}>{cardData?.card_type}</span>
                                </div>

                                <div className={styles.cardNumberRow}>
                                    <span>{cardData?.card_number}</span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(cardData?.card_number?.replace(/\s/g, ""), "VCC Card Number")}
                                        style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                                        title="Copy Card Number"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>

                                <div className={styles.cardBottomRow}>
                                    <div>
                                        <div className={styles.cardLabel}>Cardholder Name</div>
                                        <div className={styles.cardHolderName}>{cardData?.cardholder_name}</div>
                                    </div>

                                    <div className={styles.cardExpiryCVV}>
                                        <div>
                                            <div className={styles.cardLabel}>Valid Thru</div>
                                            <div className={styles.cardMetaVal}>
                                                {cardData?.expiry_month}/{cardData?.expiry_year?.slice(-2)}
                                            </div>
                                        </div>

                                        <div>
                                            <div className={styles.cardLabel}>CVV / CVC</div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                <span className={styles.cardMetaVal}>
                                                    {showCVV ? cardData?.cvv : "•••"}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCVV(!showCVV)}
                                                    style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                                                >
                                                    {showCVV ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Balance & Merchant Settlement Box */}
                            <div className={styles.balanceNotice}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: "13px" }}>
                                        Available Settlement Balance: Rp {Number(cardData?.current_balance || currentBooking?.totalAmount || 0).toLocaleString("en-US")}
                                    </div>
                                    <div style={{ fontSize: "11px", opacity: 0.9 }}>
                                        Active from {cardData?.activation_date || "-"} to {cardData?.expiration_date || "-"}
                                    </div>
                                </div>
                                <span style={{ fontSize: "11px", fontWeight: 700, background: "#dcfce7", color: "#15803d", padding: "4px 8px", borderRadius: "4px" }}>
                                    READY FOR POS / EDC TERMINAL CHARGE
                                </span>
                            </div>

                            {/* Instructions & Audit Confirmation */}
                            <div className={styles.pciAuditNotice}>
                                <b>Front Desk Cashier Instructions:</b>
                                <div>{cardData?.settlement_instruction}</div>
                                <div style={{ marginTop: "6px", color: "#64748b", fontSize: "10px" }}>
                                    PCI Session ID: <code>pci-sess-{Date.now().toString(36)}</code> • Access logged and audited.
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: "12px", cursor: "pointer" }}
                                >
                                    Select Another Reservation
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className={styles.btnAction}
                                >
                                    Close Card Viewer
                                </button>
                            </div>
                        </>
                    ) : (
                        /* Case: Hotel Collect / No VCC issued by OTA */
                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <CheckCircle2 size={24} color="#059669" />
                            </div>
                            <div>
                                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                                    Payment Method: Property Collect / Pay at Front Desk
                                </div>
                                <p style={{ fontSize: "12px", color: "#64748b", maxWidth: "420px", margin: "6px auto 0" }}>
                                    {statusMessage || "This booking does not require virtual card settlement because the guest pays directly at the hotel front desk during check-in or check-out."}
                                </p>
                            </div>

                            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", fontSize: "12px", cursor: "pointer" }}
                                >
                                    Select Another Reservation
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className={styles.btnAction}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
