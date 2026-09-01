"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { useAuth } from "@/context/AuthContext";

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
}

/* =========================================================================
   Apple-grade Pixel-Perfect SVG Prohibition Badges (Exact 1:1 Proportions)
   ========================================================================= */

function NoDurianIcon({ size = 30 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={{ display: "block", flexShrink: 0 }}>
            <circle cx="50" cy="50" r="40" stroke="#dc2626" strokeWidth="7" fill="#ffffff" />
            <g fill="#1d1d1f">
                <path d="M50 26c-1 0-2 1-2 3v2c-7 2-13 7-16 13-3 6-3 13 0 19 3 7 9 12 16 14 7-2 13-7 16-14 3-6 3-13 0-19-3-6-9-11-16-13v-2c0-2-1-3-2-3z" />
                <path d="M48 24l2-5 2 5 4 1 3-3 2 5 5 1 1-5 4 4 5 3-2 5 5 3-3 4 4 5-5 2 1 5-5 1-1 5-4-2-4 4-3-4-5 2-1-5-5-1 1-5-5-2 3-5-3-4 5-3-2-5 5-3 1-5 5-1 2-5 3 3z" />
            </g>
            <line x1="22" y1="22" x2="78" y2="78" stroke="#dc2626" strokeWidth="7" strokeLinecap="round" />
        </svg>
    );
}

function NoPetsIcon({ size = 30 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={{ display: "block", flexShrink: 0 }}>
            <circle cx="50" cy="50" r="40" stroke="#dc2626" strokeWidth="7" fill="#ffffff" />
            <path d="M34 40c-2-4-4-5-6-4-2 1-2 4 0 7l3 4v16c0 1 1 2 2 2h4c1 0 2-1 2-2v-9h14v9c0 1 1 2 2 2h4c1 0 2-1 2-2V57l7-9c2-2 1-4-1-5-2-1-5 0-7 2l-6 4v-7c0-2-2-4-4-4H42l-4-3c-2-2-5-1-6 2l2 4z" fill="#1d1d1f" />
            <line x1="22" y1="22" x2="78" y2="78" stroke="#dc2626" strokeWidth="7" strokeLinecap="round" />
        </svg>
    );
}

function NoSmokingIcon({ size = 30 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={{ display: "block", flexShrink: 0 }}>
            <circle cx="50" cy="50" r="40" stroke="#dc2626" strokeWidth="7" fill="#ffffff" />
            <rect x="25" y="47" width="34" height="8" rx="1.5" fill="#1d1d1f" />
            <rect x="61" y="47" width="14" height="8" rx="1.5" fill="#d97706" />
            <rect x="22" y="48.5" width="2" height="5" fill="#dc2626" />
            <path d="M22 42c-4-4 0-8-3-12" stroke="#86868b" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M28 42c-4-4 0-8-3-12" stroke="#86868b" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="22" y1="22" x2="78" y2="78" stroke="#dc2626" strokeWidth="7" strokeLinecap="round" />
        </svg>
    );
}

function NoDownBedIcon({ size = 30 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={{ display: "block", flexShrink: 0 }}>
            <circle cx="50" cy="50" r="40" stroke="#dc2626" strokeWidth="7" fill="#ffffff" />
            <g fill="#1d1d1f">
                <rect x="30" y="36" width="4" height="28" rx="1.5" />
                <rect x="66" y="36" width="4" height="28" rx="1.5" />
                <rect x="30" y="38" width="40" height="4" rx="1" />
                <rect x="37" y="44" width="10" height="6" rx="2" />
                <rect x="53" y="44" width="10" height="6" rx="2" />
                <rect x="32" y="52" width="36" height="8" rx="2" />
                <rect x="30" y="57" width="40" height="3" rx="1" />
            </g>
            <line x1="22" y1="22" x2="78" y2="78" stroke="#dc2626" strokeWidth="7" strokeLinecap="round" />
        </svg>
    );
}

export function GRCPrintTemplate({ data }: GRCPrintTemplateProps) {
    const { activeHotelCode, activeHotelName } = useAuth();
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [hotelInfo, setHotelInfo] = useState<{ name: string; address?: string; phone?: string } | null>(null);

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

    const labelStyle: React.CSSProperties = {
        fontWeight: 600,
        textDecoration: "underline",
        textUnderlineOffset: "3px",
        textDecorationThickness: "1px",
        textDecorationColor: "#1d1d1f",
        color: "#1d1d1f",
        fontSize: "10px"
    };

    const subtitleStyle: React.CSSProperties = {
        fontSize: "8.5px",
        color: "#86868b",
        marginTop: "2px",
        fontWeight: 400
    };

    const valueStyle: React.CSSProperties = {
        fontWeight: 600,
        marginLeft: "8px",
        color: "#1d1d1f",
        fontSize: "10.5px"
    };

    return (
        <div id="grc-printable-document" style={{
            width: "100%",
            maxWidth: "760px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            color: "#1d1d1f",
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif',
            fontSize: "10px",
            lineHeight: "1.5",
            padding: "16px 20px",
            boxSizing: "border-box",
            letterSpacing: "-0.01em"
        }}>
            {/* Header: Dynamic Property Logo Center, Registration Form on Right with Generous Breathing Room */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "28px", paddingBottom: "6px" }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#86868b" }}>
                        Guest Registration
                    </div>
                </div>
                <div style={{ flex: 2, textAlign: "center" }}>
                    {logoUrl ? (
                        <img 
                            src={logoUrl} 
                            alt={activeHotelName || "Hotel Logo"} 
                            style={{ maxHeight: "48px", maxWidth: "200px", objectFit: "contain", margin: "0 auto", display: "block" }} 
                        />
                    ) : (
                        <h2 style={{ fontSize: "16px", fontWeight: 700, textTransform: "uppercase", margin: 0, letterSpacing: "0.04em", color: "#1d1d1f" }}>
                            {activeHotelName || hotelInfo?.name || "HOTEL PROPERTY"}
                        </h2>
                    )}
                </div>
                <div style={{ flex: 1, textAlign: "right" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: "3px", textDecorationThickness: "1.2px", color: "#1d1d1f" }}>
                        Registration Form
                    </span>
                </div>
            </div>

            {/* Section 1: Room & Rate Details (Airy Apple Minimalist Spacing) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
                {/* Row 1: No. Kamar | Harga Kamar | No Reservasi */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", columnGap: "24px" }}>
                    <div>
                        <span style={labelStyle}>No. Kamar</span>
                        <span style={{ ...valueStyle, fontFamily: '"SF Mono", Menlo, monospace', fontSize: "11px" }}>{data.roomNumber || "-"}</span>
                        <div style={subtitleStyle}>Room Number</div>
                    </div>
                    <div>
                        <span style={labelStyle}>Harga Kamar</span>
                        <span style={valueStyle}>{formatCurrency(data.roomRate)}</span>
                        <div style={subtitleStyle}>Room Rate</div>
                    </div>
                    <div>
                        <span style={labelStyle}>No Reservasi</span>
                        <span style={{ ...valueStyle, fontFamily: '"SF Mono", Menlo, monospace', fontSize: "10.5px" }}>{data.bookingId || "-"}</span>
                        <div style={subtitleStyle}>Reservation No</div>
                    </div>
                </div>

                {/* Row 2: Tipe Kamar | Kode Harga | Jumlah Tamu */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", columnGap: "24px" }}>
                    <div>
                        <span style={labelStyle}>Tipe Kamar</span>
                        <span style={valueStyle}>{data.roomType || "-"}</span>
                        <div style={subtitleStyle}>Room Type</div>
                    </div>
                    <div>
                        <span style={labelStyle}>Kode Harga</span>
                        <span style={valueStyle}>{data.rateCode || "-"}</span>
                        <div style={subtitleStyle}>Rate Code</div>
                    </div>
                    <div>
                        <span style={labelStyle}>Jumlah Tamu</span>
                        <span style={valueStyle}>{data.noOfPax || "1"}</span>
                        <div style={subtitleStyle}>No of Pax</div>
                    </div>
                </div>

                {/* Row 3: Peningkatan Kamar */}
                <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
                    <div>
                        <span style={labelStyle}>Peningkatan Kamar</span>
                        <div style={subtitleStyle}>Room Up grade</div>
                    </div>
                    <div>
                        <span style={labelStyle}>Dari :</span>
                        <span style={valueStyle}>{data.upgradeFrom || "-"}</span>
                        <div style={{ ...subtitleStyle, textDecoration: "underline", textUnderlineOffset: "2px" }}>From :</div>
                    </div>
                    <div>
                        <span style={labelStyle}>Type Kamar :</span>
                        <span style={valueStyle}>{data.upgradeTo || "-"}</span>
                        <div style={{ ...subtitleStyle, textDecoration: "underline", textUnderlineOffset: "2px" }}>Room Type :</div>
                    </div>
                </div>
            </div>

            {/* Hairline Divider */}
            <div style={{ borderTop: "1px solid #d2d2d7", margin: "10px 0 12px 0" }} />

            {/* Section 2: Guest Profile (2 Columns with Generous Column Gap) */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", rowGap: "10px", columnGap: "32px", marginBottom: "12px" }}>
                {/* Row 1: Stay Period | Company */}
                <div>
                    <span style={labelStyle}>Tgl Menginap</span>
                    <span style={{ ...valueStyle, fontFamily: '"SF Mono", Menlo, monospace', fontSize: "10px" }}>{data.stayPeriod || "-"}</span>
                    <div style={subtitleStyle}>Stay Period</div>
                </div>
                <div>
                    <span style={labelStyle}>Perusahaan</span>
                    <span style={valueStyle}>{data.company || "-"}</span>
                    <div style={subtitleStyle}>Company</div>
                </div>

                {/* Row 2: Full Name | Nationality */}
                <div>
                    <span style={labelStyle}>Nama Lengkap</span>
                    <span style={{ ...valueStyle, textTransform: "uppercase", letterSpacing: "0.02em" }}>{data.guestName || "-"}</span>
                    <div style={subtitleStyle}>Full Name</div>
                </div>
                <div>
                    <span style={labelStyle}>Warga Negara</span>
                    <span style={{ ...valueStyle, textTransform: "uppercase" }}>{data.nationality || "INDONESIA"}</span>
                    <div style={subtitleStyle}>Nationality</div>
                </div>

                {/* Row 3: Phone | Identity No */}
                <div>
                    <span style={labelStyle}>No Telp/Hp</span>
                    <span style={{ ...valueStyle, fontFamily: '"SF Mono", Menlo, monospace', fontSize: "10px" }}>{data.phone || "-"}</span>
                    <div style={subtitleStyle}>Phone/Mobile</div>
                </div>
                <div>
                    <span style={labelStyle}>No Identitas</span>
                    <span style={{ ...valueStyle, fontFamily: '"SF Mono", Menlo, monospace', fontSize: "10px" }}>{data.identityNo || "-"}</span>
                    <div style={subtitleStyle}>Identity No</div>
                </div>

                {/* Row 4: Address | Email */}
                <div>
                    <span style={labelStyle}>Alamat</span>
                    <span style={{ ...valueStyle, textTransform: "uppercase", fontSize: "9.5px", lineHeight: "1.4" }}>{data.address || "-"}</span>
                    <div style={subtitleStyle}>Address</div>
                </div>
                <div>
                    <span style={labelStyle}>Email</span>
                    <span style={valueStyle}>{data.email || "-"}</span>
                    <div style={subtitleStyle}>Email</div>
                </div>
            </div>

            {/* Hairline Divider */}
            <div style={{ borderTop: "1px solid #d2d2d7", margin: "10px 0 0 0" }} />

            {/* Section 3: Payment Method & Signature Boxes (Clean Hairline Grid) */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
                borderBottom: "1px solid #d2d2d7",
                marginBottom: "12px"
            }}>
                {/* Column 1: Payment Method Checkbox List */}
                <div style={{ padding: "8px 12px 8px 0" }}>
                    <div style={labelStyle}>Pembayaran</div>
                    <div style={{ ...subtitleStyle, marginBottom: "8px" }}>Payment Method</div>

                    {/* Checkboxes with Consistent Border Styling */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <div style={{
                                width: "13px",
                                height: "13px",
                                borderTop: "1px solid #86868b",
                                borderLeft: "1px solid #86868b",
                                borderRight: "1px solid #86868b",
                                borderBottom: "1px solid #86868b",
                                borderRadius: "2px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "8px",
                                fontWeight: 700,
                                color: "#1d1d1f"
                            }}>
                                {data.paymentMethod === "personal" ? "✓" : ""}
                            </div>
                            <span style={{ marginLeft: "8px", fontSize: "9px", color: "#1d1d1f" }}>Personal Account</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <div style={{
                                width: "13px",
                                height: "13px",
                                borderTop: "1px solid #86868b",
                                borderLeft: "1px solid #86868b",
                                borderRight: "1px solid #86868b",
                                borderBottom: "1px solid #86868b",
                                borderRadius: "2px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "8px",
                                fontWeight: 700,
                                color: "#1d1d1f"
                            }}>
                                {data.paymentMethod === "company" ? "✓" : ""}
                            </div>
                            <span style={{ marginLeft: "8px", fontSize: "9px", color: "#1d1d1f" }}>Company Account</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <div style={{
                                width: "13px",
                                height: "13px",
                                borderTop: "1px solid #86868b",
                                borderLeft: "1px solid #86868b",
                                borderRight: "1px solid #86868b",
                                borderBottom: "1px solid #86868b",
                                borderRadius: "2px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "8px",
                                fontWeight: 700,
                                color: "#1d1d1f"
                            }}>
                                {isOta ? "✓" : ""}
                            </div>
                            <span style={{ marginLeft: "8px", fontSize: "9px", color: "#1d1d1f" }}>Travel Agent {isOta && data.travelAgentName ? `(${otaLabel})` : ""}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <div style={{
                                width: "13px",
                                height: "13px",
                                borderTop: "1px solid #86868b",
                                borderLeft: "1px solid #86868b",
                                borderRight: "1px solid #86868b",
                                borderBottom: "1px solid #86868b",
                                borderRadius: "2px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "8px",
                                fontWeight: 700,
                                color: "#1d1d1f"
                            }}>
                                {data.paymentMethod === "others" ? "✓" : ""}
                            </div>
                            <span style={{ marginLeft: "8px", fontSize: "9px", color: "#1d1d1f" }}>Others ____________________</span>
                        </div>
                    </div>
                </div>

                {/* Column 2: Checked In By */}
                <div style={{ borderLeft: "1px solid #d2d2d7", padding: "8px 10px", display: "flex", flexDirection: "column", justifyContent: "space-between", textAlign: "center" }}>
                    <div style={{ fontWeight: 600, fontSize: "9px", color: "#1d1d1f" }}>
                        Checked In By
                    </div>
                    <div style={{ height: "46px" }} />
                    <div style={{ fontWeight: 600, fontSize: "8.5px", color: "#1d1d1f" }}>
                        {data.checkedInBy || "FRONT OFFICE"}
                    </div>
                </div>

                {/* Column 3: Approved By */}
                <div style={{ borderLeft: "1px solid #d2d2d7", padding: "8px 10px", display: "flex", flexDirection: "column", justifyContent: "space-between", textAlign: "center" }}>
                    <div style={{ fontWeight: 600, fontSize: "9px", color: "#1d1d1f" }}>
                        Approved By
                    </div>
                    <div style={{ height: "46px" }} />
                    <div style={{ fontSize: "8.5px", color: "#636366" }}>
                        {data.approvedBy || "Assistant Front Office Manager"}
                    </div>
                </div>

                {/* Column 4: Guest Signature */}
                <div style={{ borderLeft: "1px solid #d2d2d7", padding: "8px 10px", display: "flex", flexDirection: "column", justifyContent: "space-between", textAlign: "center" }}>
                    <div />
                    <div style={{ height: "46px" }} />
                    <div style={{ fontWeight: 700, fontSize: "9.5px", color: "#1d1d1f" }}>
                        Guest Signature
                    </div>
                </div>
            </div>

            {/* Section 4: House Rules (Relaxed Line Height & Apple Muted Italic) */}
            <div style={{ fontSize: "8.5px", lineHeight: "1.45", color: "#1d1d1f", marginBottom: "10px" }}>
                <p style={{ margin: "0 0 2px 0" }}><strong>Jam Check Out Pukul 12.00/</strong> Check Out Time is 12 PM</p>
                <p style={{ margin: "0 0 4px 0" }}><strong>Jam Check In Pukul 14.00/</strong> Check In Time is 2 PM</p>
                
                <p style={{ margin: "0 0 1px 0" }}>
                    Silahkan menyimpan barang berharga Anda (paspor, uang, dan dokumen) di dalam brankas yang telah kami sediakan di dalam setiap kamar.
                </p>
                <p style={{ margin: "0 0 3px 0", color: "#86868b" }}>
                    <em>Please keep your valuable things (passport, money and documents) in the safe deposit box that we provided in each room.</em>
                </p>

                <p style={{ margin: "0 0 1px 0" }}>
                    Saya setuju untuk membayar semua Tagihan selama saya menginap, dengan cara pembayaran seperti disebut diatas.
                </p>
                <p style={{ margin: "0 0 3px 0", color: "#86868b" }}>
                    <em>I agree to pay all charges incured during my stay, and settle my account by above payment method.</em>
                </p>

                <p style={{ margin: "0 0 1px 0" }}>
                    Hotel tidak bertanggung jawab atas barang-barang tamu yang ditinggalkan di kamar.
                </p>
                <p style={{ margin: "0 0 3px 0", color: "#86868b" }}>
                    <em>Hotel will not be held responsible for any valuable left by the guest in the room.</em>
                </p>

                <p style={{ margin: "0 0 1px 0" }}>
                    <strong>Apabila menghilangkan kunci maka akan dikenakan denda Rp. 100.000 (seratus ribu rupiah)/kunci</strong>
                </p>
                <p style={{ margin: "0", color: "#86868b" }}>
                    <em>lost key chargeable at IDR 100.000/each</em>
                </p>
            </div>

            {/* Section 5: Non Smoking Statement with 2 Top Vector Icons */}
            <div style={{ borderTop: "1px solid #d2d2d7", paddingTop: "10px", marginTop: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "8px", position: "relative" }}>
                    {/* Top 2 Warning Icons on Left: No Durian & No Pets */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", position: "absolute", left: 0 }}>
                        <NoDurianIcon size={30} />
                        <NoPetsIcon size={30} />
                    </div>

                    {/* Centered Title */}
                    <h4 style={{ width: "100%", textAlign: "center", fontSize: "10.5px", fontWeight: 700, margin: 0, letterSpacing: "0.06em", color: "#1d1d1f" }}>
                        NON SMOKING STATEMENT
                    </h4>
                </div>

                {/* Statement Text with More Breathing Room */}
                <div style={{ fontSize: "8.5px", lineHeight: "1.5", color: "#1d1d1f", marginTop: "8px" }}>
                    <p style={{ margin: "0 0 2px 0" }}>Kamar yang Anda huni merupakan kamar bebas asap rokok dan akan kami jaga agar tetap demikian.</p>
                    <p style={{ margin: "0 0 4px 0", color: "#86868b" }}><em>The room you will occupy is Non-Smoking Room & the room must remain 100% free from smoke.</em></p>

                    <p style={{ margin: "0 0 2px 0" }}><strong>Biaya perawatan kamar Rp 500.000 (lima ratus ribu rupiah) apabila merokok di kamar.</strong></p>
                    <p style={{ margin: "0 0 4px 0", color: "#86868b" }}><em>Room Re-covery IDR 500.000 ( Fifty HundredThousand Rupiah ) if you are smoking in the room.</em></p>

                    <p style={{ margin: "0 0 2px 0" }}><strong>kami akan membebankan ke tamu jika tamu menurukan bed ke lantai sebesar harga Extra Bed Rp 250.000</strong></p>
                    <p style={{ margin: "0 0 4px 0", color: "#86868b" }}><em>we will also charge guests if the guest drops the mattress onto the floor and for chargeable 1 Extra Bed IDR 250.000</em></p>

                    <p style={{ margin: "0 0 2px 0" }}>Kami sangat menghargai kepedulian anda terhadap kesehatan. silahkan menanda tangani pernyataan persetujuan dibawah ini.</p>
                    <p style={{ margin: "0 0 4px 0", color: "#86868b" }}><em>We highly appreciate your health concern. Therefore, please confirm your willingness below.</em></p>

                    <p style={{ margin: "0" }}>Terima Kasih Atas Perhatiannya. / <span style={{ color: "#86868b" }}><em>Thank you for your kind attention.</em></span></p>
                </div>
            </div>

            {/* Bottom Section: 2 Left Stacked Icons (No Smoking & No Down Bed) & Final Guest Consent Signature */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "14px", paddingTop: "8px" }}>
                {/* Left Column: 2 Stacked Prohibition Badges with Text & Generous Gap */}
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", alignItems: "center", minWidth: "120px" }}>
                    {/* Icon 3: Non Smoking Room Badge */}
                    <div style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                            <NoSmokingIcon size={30} />
                        </div>
                        <span style={{ fontSize: "8px", fontWeight: 600, display: "block", marginTop: "6px", color: "#1d1d1f", letterSpacing: "0.01em" }}>
                            Non Smoking Room
                        </span>
                    </div>

                    {/* Icon 4: Not allowed down bed Badge */}
                    <div style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                            <NoDownBedIcon size={30} />
                        </div>
                        <span style={{ fontSize: "8px", fontWeight: 600, display: "block", marginTop: "6px", color: "#1d1d1f", letterSpacing: "0.01em" }}>
                            Not allowed down bed
                        </span>
                    </div>
                </div>

                {/* Right Column: Guest Signature Block */}
                <div style={{ textAlign: "center", minWidth: "280px", paddingBottom: "4px" }}>
                    <div style={{ fontSize: "9px", fontWeight: 600, color: "#1d1d1f" }}>
                        Acknowledge and agreed / Mengetahui & menyetujui,
                    </div>
                    <div style={{ height: "46px" }} />
                    <div style={{ borderTop: "1px solid #1d1d1f", paddingTop: "3px", fontSize: "8.5px", color: "#3a3a3c" }}>
                        (Guest’s name & signature / Nama terang & tanda tangan)
                    </div>
                </div>
            </div>

            {/* Printed Info */}
            <div style={{
                marginTop: "12px",
                paddingTop: "4px",
                borderTop: "1px solid #f2f2f7",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "7.5px",
                color: "#8e8e93"
            }}>
                <span>
                    Printed : {data.checkedInBy || "FRONT OFFICE"} on {data.printedAt || new Date().toLocaleString("id-ID")}
                </span>
                <span style={{ fontWeight: 500, color: "#636366" }}>
                    {activeHotelName || "Setara PMS Property"}
                </span>
            </div>
        </div>
    );
}
