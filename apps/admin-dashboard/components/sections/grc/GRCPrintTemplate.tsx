"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { useAuth } from "@/context/AuthContext";
import styles from "./GRCPrintTemplate.module.css";

export interface GRCData {
    roomNumber: string;
    roomRate: string | number;
    bookingId: string;
    roomType: string;
    rateCode: string;
    noOfPax: string | number;
    upgradeFrom?: string;
    upgradeTo?: string;
    stayPeriod: string;
    checkInDate?: string;
    checkOutDate?: string;
    company: string;
    guestName: string;
    nationality: string;
    phone: string;
    identityNo: string;
    address: string;
    email: string;
    paymentMethod: "personal" | "company" | "travel_agent" | "others";
    travelAgentName?: string;
    checkedInBy: string;
    approvedBy?: string;
    printedAt?: string;
}

interface GRCPrintTemplateProps {
    data: GRCData;
    paperSize?: "f4" | "a4";
}

/* =========================================================================
   Pixel-Perfect SVG Prohibition Badges (Large, Bold & Clean Pro Design)
   ========================================================================= */

function NoDurianIcon({ size = 30 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={{ display: "block", flexShrink: 0 }}>
            <circle cx="50" cy="50" r="40" stroke="#dc2626" strokeWidth="6.5" fill="#ffffff" />
            <g fill="#0f172a">
                <path d="M50 26c-1 0-2 1-2 3v2c-7 2-13 7-16 13-3 6-3 13 0 19 3 7 9 12 16 14 7-2 13-7 16-14 3-6 3-13 0-19-3-6-9-11-16-13v-2c0-2-1-3-2-3z" />
                <path d="M48 24l2-5 2 5 4 1 3-3 2 5 5 1 1-5 4 4 5 3-2 5 5 3-3 4 4 5-5 2 1 5-5 1-1 5-4-2-4 4-3-4-5 2-1-5-5-1 1-5-5-2 3-5-3-4 5-3-2-5 5-3 1-5 5-1 2-5 3 3z" />
            </g>
            <line x1="22" y1="22" x2="78" y2="78" stroke="#dc2626" strokeWidth="6.5" strokeLinecap="round" />
        </svg>
    );
}

function NoPetsIcon({ size = 30 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={{ display: "block", flexShrink: 0 }}>
            <circle cx="50" cy="50" r="40" stroke="#dc2626" strokeWidth="6.5" fill="#ffffff" />
            <path d="M34 40c-2-4-4-5-6-4-2 1-2 4 0 7l3 4v16c0 1 1 2 2 2h4c1 0 2-1 2-2v-9h14v9c0 1 1 2 2 2h4c1 0 2-1 2-2V57l7-9c2-2 1-4-1-5-2-1-5 0-7 2l-6 4v-7c0-2-2-4-4-4H42l-4-3c-2-2-5-1-6 2l2 4z" fill="#0f172a" />
            <line x1="22" y1="22" x2="78" y2="78" stroke="#dc2626" strokeWidth="6.5" strokeLinecap="round" />
        </svg>
    );
}

function NoSmokingIcon({ size = 30 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={{ display: "block", flexShrink: 0 }}>
            <circle cx="50" cy="50" r="40" stroke="#dc2626" strokeWidth="6.5" fill="#ffffff" />
            <rect x="25" y="47" width="34" height="8" rx="1.5" fill="#0f172a" />
            <rect x="61" y="47" width="14" height="8" rx="1.5" fill="#d97706" />
            <rect x="22" y="48.5" width="2" height="5" fill="#dc2626" />
            <path d="M22 42c-4-4 0-8-3-12" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M28 42c-4-4 0-8-3-12" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="22" y1="22" x2="78" y2="78" stroke="#dc2626" strokeWidth="6.5" strokeLinecap="round" />
        </svg>
    );
}

function NoDownBedIcon({ size = 30 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={{ display: "block", flexShrink: 0 }}>
            <circle cx="50" cy="50" r="40" stroke="#dc2626" strokeWidth="6.5" fill="#ffffff" />
            <g fill="#0f172a">
                <rect x="30" y="36" width="4" height="28" rx="1.5" />
                <rect x="66" y="36" width="4" height="28" rx="1.5" />
                <rect x="30" y="38" width="40" height="4" rx="1" />
                <rect x="37" y="44" width="10" height="6" rx="2" />
                <rect x="53" y="44" width="10" height="6" rx="2" />
                <rect x="32" y="52" width="36" height="8" rx="2" />
                <rect x="30" y="57" width="40" height="3" rx="1" />
            </g>
            <line x1="22" y1="22" x2="78" y2="78" stroke="#dc2626" strokeWidth="6.5" strokeLinecap="round" />
        </svg>
    );
}

export function GRCPrintTemplate({ data, paperSize = "f4" }: GRCPrintTemplateProps) {
    const { activeHotelCode, activeHotelName, user } = useAuth();
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [hotelInfo, setHotelInfo] = useState<{ name: string; address?: string; phone?: string } | null>(null);
    const [systemTime, setSystemTime] = useState<string>("");

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const d = now.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
            const t = now.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
            }).replace(/\./g, ":");
            setSystemTime(`${d}, ${t} WIB`);
        };
        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchLogo = async () => {
            if (!activeHotelCode) return;
            try {
                const docRef = doc(getHotelCollection(db, "settings"), "landingPage");
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const d = snap.data();
                    setLogoUrl(d.lightLogo || d.darkLogo || null);
                }

                const hotelRef = doc(db, "hotels", activeHotelCode);
                const hSnap = await getDoc(hotelRef);
                if (hSnap.exists()) {
                    setHotelInfo(hSnap.data() as any);
                }
            } catch (err) {
                console.error("Error loading hotel branding for GRC:", err);
            }
        };
        fetchLogo();
    }, [activeHotelCode]);

    const formatCurrency = (val: string | number) => {
        if (!val || val === "-" || val === 0) return "-";
        const num = typeof val === "number" ? val : parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
        if (isNaN(num)) return String(val);
        return "IDR " + num.toLocaleString("id-ID");
    };

    const isOta = data.paymentMethod === "travel_agent" || (data.travelAgentName && data.travelAgentName.toLowerCase() !== "walk-in");
    const otaLabel = data.travelAgentName ? data.travelAgentName.toUpperCase() : "OTA";
    const paperClass = paperSize === "a4" ? styles.paperA4 : styles.paperF4;
    const iconSize = paperSize === "a4" ? 26 : 30;

    const operatorName = user?.displayName || data.checkedInBy || "Front Office Staff";
    const operatorEmail = user?.email ? ` (${user.email})` : "";
    const activeTime = systemTime || data.printedAt || "Real-time WIB";

    return (
        <div id="grc-printable-document" className={`${styles.documentRoot} ${paperClass}`}>
            {/* Top Soft Architectural Divider */}
            <div className={styles.softHeaderDivider} />

            {/* Pure Clean Centered Letterhead (Zero Clutter Left & Right) */}
            <div className={styles.cleanLetterhead}>
                {logoUrl ? (
                    <img 
                        src={logoUrl} 
                        alt={activeHotelName || "Hotel Logo"} 
                        className={styles.propertyLogo}
                    />
                ) : (
                    <h2 className={styles.propertyTitleFallback}>
                        {activeHotelName || hotelInfo?.name || "HOTEL PROPERTY"}
                    </h2>
                )}
                {hotelInfo?.address && (
                    <div className={styles.propertySubtitle}>
                        {hotelInfo.address}
                    </div>
                )}
            </div>

            {/* Official Document Title & Non-Wrapping 3-Column Metadata Block */}
            <div className={styles.docHeaderBlock}>
                <div className={styles.docTitleRow}>
                    <h3 className={styles.docTitleMain}>Guest Registration Card</h3>
                    <span className={styles.docTitleSub}>/ Formulir Registrasi Tamu</span>
                </div>
                <div className={styles.docMetaGrid}>
                    <div className={styles.docMetaLeft}>
                        No. Dokumen: <strong className={styles.docCodeMono}>DOC-GRC/{paperSize.toUpperCase()}/{data.bookingId || "NEW"}</strong>
                    </div>
                    <div className={styles.docMetaCenter}>
                        Akun FO: <strong>{operatorName}</strong>
                    </div>
                    <div className={styles.docMetaRight}>
                        Waktu Cetak: <strong>{activeTime}</strong>
                    </div>
                </div>
            </div>

            {/* Section 1: Room & Rate Card (Precision Grid) */}
            <div className={styles.sectionCard}>
                <div className={styles.grid3Col}>
                    <div className={styles.fieldBox}>
                        <span className={styles.fieldLabel}>No. Kamar <small className={styles.fieldSubtitle}>/ Room Number</small></span>
                        <span className={`${styles.fieldValue} ${styles.fieldValueMono} ${styles.fieldValueLarge}`}>
                            {data.roomNumber || "-"}
                        </span>
                    </div>

                    <div className={styles.fieldBox}>
                        <span className={styles.fieldLabel}>Harga Kamar <small className={styles.fieldSubtitle}>/ Room Rate</small></span>
                        <span className={`${styles.fieldValue} ${styles.fieldValueLarge}`}>
                            {formatCurrency(data.roomRate)}
                        </span>
                    </div>

                    <div className={styles.fieldBox}>
                        <span className={styles.fieldLabel}>No Reservasi <small className={styles.fieldSubtitle}>/ Reservation No</small></span>
                        <span className={`${styles.fieldValue} ${styles.fieldValueMono}`}>
                            {data.bookingId || "-"}
                        </span>
                    </div>

                    <div className={styles.fieldBox}>
                        <span className={styles.fieldLabel}>Tipe Kamar <small className={styles.fieldSubtitle}>/ Room Type</small></span>
                        <span className={styles.fieldValue}>
                            {data.roomType || "-"}
                        </span>
                    </div>

                    <div className={styles.fieldBox}>
                        <span className={styles.fieldLabel}>Kode Harga <small className={styles.fieldSubtitle}>/ Rate Code</small></span>
                        <span className={styles.fieldValue}>
                            {data.rateCode || "-"}
                        </span>
                    </div>

                    <div className={styles.fieldBox}>
                        <span className={styles.fieldLabel}>Jumlah Tamu <small className={styles.fieldSubtitle}>/ No of Pax</small></span>
                        <span className={styles.fieldValue}>
                            {data.noOfPax || "1"} Pax
                        </span>
                    </div>
                </div>

                {/* Upgrade Row */}
                <div className={styles.upgradeRow}>
                    <div className={styles.fieldBox}>
                        <span className={styles.fieldLabel}>Peningkatan Kamar <small className={styles.fieldSubtitle}>/ Room Up-grade</small></span>
                    </div>
                    <div className={styles.fieldBox}>
                        <span className={styles.fieldLabel}>Dari <small className={styles.fieldSubtitle}>/ From :</small></span>
                        <span className={styles.fieldValue}>{data.upgradeFrom || "-"}</span>
                    </div>
                    <div className={styles.fieldBox}>
                        <span className={styles.fieldLabel}>Type Kamar <small className={styles.fieldSubtitle}>/ Room Type :</small></span>
                        <span className={styles.fieldValue}>{data.upgradeTo || "-"}</span>
                    </div>
                </div>
            </div>

            {/* Section 2: Guest Details Card (Precision 2-Column Grid) */}
            <div className={styles.sectionCard}>
                <div className={styles.gridGuest}>
                    <div className={styles.fieldBox}>
                        <span className={styles.fieldLabel}>Tgl Menginap <small className={styles.fieldSubtitle}>/ Stay Period</small></span>
                        <span className={`${styles.fieldValue} ${styles.fieldValueMono}`}>
                            {data.stayPeriod || "-"}
                        </span>
                    </div>

                    <div className={styles.fieldBox}>
                        <span className={styles.fieldLabel}>Perusahaan <small className={styles.fieldSubtitle}>/ Company</small></span>
                        <span className={styles.fieldValue}>
                            {data.company || "-"}
                        </span>
                    </div>

                    <div className={styles.fieldBox}>
                        <span className={styles.fieldLabel}>Nama Lengkap <small className={styles.fieldSubtitle}>/ Full Name</small></span>
                        <span className={`${styles.fieldValue} ${styles.fieldValueLarge}`} style={{ textTransform: "uppercase" }}>
                            {data.guestName || "-"}
                        </span>
                    </div>

                    <div className={styles.fieldBox}>
                        <span className={styles.fieldLabel}>Warga Negara <small className={styles.fieldSubtitle}>/ Nationality</small></span>
                        <span className={styles.fieldValue} style={{ textTransform: "uppercase" }}>
                            {data.nationality || "INDONESIA"}
                        </span>
                    </div>

                    <div className={styles.fieldBox}>
                        <span className={styles.fieldLabel}>No Telp / HP <small className={styles.fieldSubtitle}>/ Phone</small></span>
                        <span className={`${styles.fieldValue} ${styles.fieldValueMono}`}>
                            {data.phone || "-"}
                        </span>
                    </div>

                    <div className={styles.fieldBox}>
                        <span className={styles.fieldLabel}>No Identitas <small className={styles.fieldSubtitle}>/ ID No (KTP / Pass)</small></span>
                        <span className={`${styles.fieldValue} ${styles.fieldValueMono}`}>
                            {data.identityNo || "-"}
                        </span>
                    </div>

                    <div className={styles.fieldBox}>
                        <span className={styles.fieldLabel}>Alamat Lengkap <small className={styles.fieldSubtitle}>/ Address</small></span>
                        <span className={styles.fieldValue} style={{ textTransform: "uppercase", fontSize: "9.5pt", lineHeight: "1.25" }}>
                            {data.address || "-"}
                        </span>
                    </div>

                    <div className={styles.fieldBox}>
                        <span className={styles.fieldLabel}>Email <small className={styles.fieldSubtitle}>/ Email Address</small></span>
                        <span className={styles.fieldValue}>
                            {data.email || "-"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Section 3: Front Office Settlement Block (3-Column Clean Table) */}
            <div className={styles.signatureTable}>
                {/* Column 1: Payment Method */}
                <div className={styles.paymentCol}>
                    <span className={styles.fieldLabel}>Pembayaran <small className={styles.fieldSubtitle}>/ Payment Method</small></span>

                    <div className={styles.checkboxList}>
                        <div className={styles.checkboxItem}>
                            <div className={styles.checkboxBox}>
                                {data.paymentMethod === "personal" ? "✓" : ""}
                            </div>
                            <span className={styles.checkboxLabel}>Personal Account</span>
                        </div>
                        <div className={styles.checkboxItem}>
                            <div className={styles.checkboxBox}>
                                {data.paymentMethod === "company" ? "✓" : ""}
                            </div>
                            <span className={styles.checkboxLabel}>Company Account</span>
                        </div>
                        <div className={styles.checkboxItem}>
                            <div className={styles.checkboxBox}>
                                {isOta ? "✓" : ""}
                            </div>
                            <span className={styles.checkboxLabel}>
                                Travel Agent {isOta && data.travelAgentName ? `(${otaLabel})` : ""}
                            </span>
                        </div>
                        <div className={styles.checkboxItem}>
                            <div className={styles.checkboxBox}>
                                {data.paymentMethod === "others" ? "✓" : ""}
                            </div>
                            <span className={styles.checkboxLabel}>Others ____________</span>
                        </div>
                    </div>
                </div>

                {/* Column 2: Checked In By */}
                <div className={styles.sigCol}>
                    <div className={styles.sigHeader}>Checked In By</div>
                    <div className={styles.sigSpacer} />
                    <div className={styles.sigFooter}>
                        {data.checkedInBy || operatorName}
                    </div>
                </div>

                {/* Column 3: Approved By */}
                <div className={styles.sigCol}>
                    <div className={styles.sigHeader}>Approved By</div>
                    <div className={styles.sigSpacer} />
                    <div className={styles.sigFooter} style={{ fontSize: "8pt", color: "#64748b" }}>
                        {data.approvedBy || "Assistant Front Office Manager"}
                    </div>
                </div>
            </div>

            {/* Section 4: House Rules Card */}
            <div className={styles.houseRulesBox}>
                <p className={styles.ruleParagraph}>
                    <strong>• Jam Check Out 12.00 /</strong> <span className={styles.ruleSecondary}>Check Out 12 PM</span> &nbsp;|&nbsp; <strong>Jam Check In 14.00 /</strong> <span className={styles.ruleSecondary}>Check In 2 PM</span>.
                </p>
                <p className={styles.ruleParagraph}>
                    • Simpan barang berharga Anda (paspor, uang, dan dokumen) di safe deposit box kamar. Hotel tidak bertanggung jawab atas kehilangan di kamar.
                    <br />
                    <span className={styles.ruleSecondary}>Please store valuable items in the in-room safe deposit box. Hotel is not liable for loss in guest room.</span>
                </p>
                <p className={styles.ruleParagraph}>
                    • Saya setuju menyelesaikan seluruh biaya tagihan selama menginap dengan metode pembayaran di atas.
                    <br />
                    <span className={styles.ruleSecondary}>I agree to settle all charges incurred during stay by the selected payment method.</span>
                </p>
                <p style={{ margin: 0 }}>
                    • <strong>Denda kehilangan kunci kamar Rp 100.000 / kunci.</strong> / <span className={styles.ruleSecondary}>Lost key fine IDR 100,000 / key.</span>
                </p>
            </div>

            {/* Section 5: Policy Badges & Non-Smoking Card */}
            <div className={styles.policySection}>
                <div className={styles.policyHeader}>
                    <h4 className={styles.policyTitle}>
                        NON SMOKING & HOTEL PROPERTY POLICY
                    </h4>
                </div>

                {/* 4-Column Large Policy Badges */}
                <div className={styles.policyBadgesContainer}>
                    <div className={styles.policyBadgeItem}>
                        <div className={styles.policyBadgeIconWrap}>
                            <NoSmokingIcon size={iconSize} />
                        </div>
                        <span className={styles.policyBadgeText}>No Smoking Room</span>
                    </div>

                    <div className={styles.policyBadgeItem}>
                        <div className={styles.policyBadgeIconWrap}>
                            <NoDurianIcon size={iconSize} />
                        </div>
                        <span className={styles.policyBadgeText}>No Durian</span>
                    </div>

                    <div className={styles.policyBadgeItem}>
                        <div className={styles.policyBadgeIconWrap}>
                            <NoPetsIcon size={iconSize} />
                        </div>
                        <span className={styles.policyBadgeText}>No Pets Allowed</span>
                    </div>

                    <div className={styles.policyBadgeItem}>
                        <div className={styles.policyBadgeIconWrap}>
                            <NoDownBedIcon size={iconSize} />
                        </div>
                        <span className={styles.policyBadgeText}>No Down Bed</span>
                    </div>
                </div>

                {/* Policy Terms & Guest Confirmation */}
                <div className={styles.policyTerms}>
                    <p style={{ margin: "0 0 1.5px 0" }}>
                        • Kamar bebas asap rokok. <strong>Biaya pemulihan kamar Rp 500.000 jika merokok di kamar.</strong> / <span className={styles.ruleSecondary}>Recovery fee IDR 500,000 if smoking in room.</span>
                    </p>
                    <p style={{ margin: "0 0 1.5px 0" }}>
                        • <strong>Biaya extra bed (Rp 250.000) jika menurunkan kasur ke lantai.</strong> / <span className={styles.ruleSecondary}>Charge for dropping mattress is IDR 250,000.</span>
                    </p>
                    <p style={{ margin: 0 }}>
                        • Terima kasih atas kepedulian Anda menjaga kenyamanan & kesehatan bersama. / <span className={styles.ruleSecondary}>Thank you for your cooperation.</span>
                    </p>
                </div>
            </div>

            {/* Single Official Guest Consent Signature Row */}
            <div className={styles.consentRow}>
                <div className={styles.consentSigBox}>
                    <div className={styles.consentSigTitle}>
                        Acknowledge and agreed / Mengetahui & menyetujui,
                    </div>
                    <div className={styles.consentSigSpacer} />
                    <div className={styles.consentSigLine}>
                        (Guest’s name & signature / Nama terang & tanda tangan)
                    </div>
                </div>
            </div>

            {/* Pro Footer Bar */}
            <div className={styles.footerAccent}>
                <div className={styles.footerSoftLine} />
                <div className={styles.footerContent}>
                    <div className={styles.footerLeft}>
                        <span className={styles.footerStampPill}>SYSTEM AUDIT TRACE</span>
                        <span>
                            Dicetak oleh: <strong>{operatorName}{operatorEmail}</strong> &nbsp;|&nbsp; Jam Sistem: <strong>{activeTime}</strong>
                        </span>
                    </div>
                    <div className={styles.footerRight}>
                        {activeHotelName || "Setara PMS Property Management"} · Form Size {paperSize.toUpperCase()}
                    </div>
                </div>
            </div>
        </div>
    );
}
