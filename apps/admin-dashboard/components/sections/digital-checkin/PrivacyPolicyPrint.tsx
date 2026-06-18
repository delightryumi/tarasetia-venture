"use client";

import React, { useEffect, useState } from "react";
import { DigitalCheckinData } from "./DigitalCheckinSection";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getHotelCollection } from "@/lib/firestoreHelper";

interface PrivacyPolicyPrintProps {
    checkin: DigitalCheckinData;
}

export function PrivacyPolicyPrint({ checkin }: PrivacyPolicyPrintProps) {
    const { activeHotelCode } = useAuth();
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [hotelInfo, setHotelInfo] = useState<{
        name: string;
        address: string;
        phone: string;
        email: string;
    } | null>(null);

    useEffect(() => {
        const fetchLogoAndInfo = async () => {
            if (!activeHotelCode) return;
            try {
                // Fetch Logo
                const docRef = doc(getHotelCollection(db, "settings"), "landingPage");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setLogoUrl(docSnap.data().lightLogo || null);
                }

                // Fetch Hotel Profile Settings
                const hotelRef = doc(db, "hotels", activeHotelCode);
                const hotelSnap = await getDoc(hotelRef);
                if (hotelSnap.exists()) {
                    const data = hotelSnap.data();
                    setHotelInfo({
                        name: data.name || "",
                        address: data.address || "",
                        phone: data.phone || "",
                        email: data.email || "",
                    });
                }
            } catch (err) {
                console.error("[PrivacyPolicyPrint] fetch error:", err);
            }
        };
        fetchLogoAndInfo();
    }, [activeHotelCode]);

    const formatDate = (ts: any) => {
        if (!ts) return "-";
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        return date.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short",
        });
    };

    const today = new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const s: Record<string, React.CSSProperties> = {
        page: {
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "11px",
            lineHeight: "1.55",
            color: "#000",
            padding: "20mm 18mm",
            backgroundColor: "#fff",
        },
        letterhead: {
            textAlign: "center",
            borderBottom: "2.5px solid #000",
            paddingBottom: "10px",
            marginBottom: "14px",
        },
        eyebrow: {
            fontSize: "8px",
            letterSpacing: "3px",
            textTransform: "uppercase" as const,
            color: "#666",
            margin: 0,
        },
        hotelName: {
            fontSize: "18px",
            fontWeight: 700,
            letterSpacing: "2px",
            textTransform: "uppercase" as const,
            margin: "5px 0 2px",
        },
        hotelContact: {
            fontSize: "9px",
            color: "#666",
            margin: 0,
        },
        docTitle: {
            textAlign: "center",
            marginBottom: "14px",
        },
        docTitleMain: {
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "1.2px",
            textTransform: "uppercase" as const,
            margin: 0,
        },
        docTitleSub: {
            fontSize: "9px",
            color: "#666",
            marginTop: "3px",
        },
        table: {
            width: "100%",
            borderCollapse: "collapse" as const,
            marginBottom: "14px",
        },
        tdLabel: {
            border: "1px solid #bbb",
            padding: "5px 8px",
            backgroundColor: "#f2f2f2",
            fontWeight: 600,
            width: "22%",
            verticalAlign: "top",
        },
        tdValue: {
            border: "1px solid #bbb",
            padding: "5px 8px",
            verticalAlign: "top",
        },
        sectionTitle: {
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.8px",
            textTransform: "uppercase" as const,
            borderBottom: "1px solid #000",
            paddingBottom: "3px",
            marginBottom: "10px",
        },
        clause: {
            marginBottom: "8px",
            textAlign: "justify" as const,
        },
        declaration: {
            border: "1.5px solid #000",
            padding: "10px 12px",
            marginBottom: "16px",
            backgroundColor: "#fafafa",
        },
        sigGrid: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            marginTop: "8px",
        },
        sigBox: {
            textAlign: "center",
        },
        sigLabel: {
            fontWeight: 600,
            fontSize: "10px",
            marginBottom: "5px",
            textTransform: "uppercase" as const,
            letterSpacing: "0.5px",
        },
        sigArea: {
            height: "80px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            marginBottom: "4px",
        },
        sigLine: {
            width: "80%",
            borderBottom: "1px solid #000",
        },
        sigMeta: {
            borderTop: "1px solid #444",
            paddingTop: "4px",
            marginTop: "4px",
        },
        sigName: {
            fontWeight: 700,
            margin: 0,
            fontSize: "11px",
        },
        sigNote: {
            color: "#777",
            fontSize: "8.5px",
            margin: "2px 0 0",
            fontStyle: "italic",
        },
        footer: {
            marginTop: "20px",
            paddingTop: "8px",
            borderTop: "1px solid #ccc",
            textAlign: "center",
            fontSize: "8px",
            color: "#999",
            fontStyle: "italic",
        },
    };

    return (
        <div className="hidden print:block printCheckinContainer w-full min-h-[297mm]" style={s.page}>

            {/* ══ LETTERHEAD ══ */}
            <div style={s.letterhead}>
                {/* Logo */}
                {logoUrl ? (
                    <div style={{ marginBottom: '8px' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={logoUrl}
                            alt="Hotel Logo"
                            style={{
                                maxHeight: '72px',
                                maxWidth: '220px',
                                objectFit: 'contain',
                                display: 'block',
                                margin: '0 auto',
                            }}
                        />
                    </div>
                ) : (
                    <p style={{ fontSize: '10px', color: '#aaa', marginBottom: '6px', fontStyle: 'italic' }}>[ Logo Hotel ]</p>
                )}
                <p style={s.eyebrow}>Hotel Property ID: {activeHotelCode}</p>
                <h1 style={s.hotelName}>{hotelInfo?.name || "Bumi Anyom Resort & Spa"}</h1>
                <p style={s.hotelContact}>
                    {hotelInfo?.address || "Jl. Raya Selemadeg Timur, Bali, Indonesia"} &nbsp;·&nbsp; Tel: {hotelInfo?.phone || "+62 (0)361 000 0000"} &nbsp;·&nbsp; {hotelInfo?.email || "reservasi@bumianyom.com"}
                </p>
            </div>


            {/* ══ DOCUMENT TITLE ══ */}
            <div style={s.docTitle}>
                <h2 style={s.docTitleMain}>Guest Registration Card &amp; Check-In Agreement</h2>
                <p style={s.docTitleSub}>Formulir Registrasi Tamu &amp; Perjanjian Check-In</p>
            </div>

            {/* ══ GUEST INFO TABLE ══ */}
            <table style={s.table}>
                <tbody>
                    <tr>
                        <td style={s.tdLabel}>Nama Tamu / Guest Name</td>
                        <td style={{ ...s.tdValue, fontWeight: 700, fontSize: "12px" }}>{checkin.name || "—"}</td>
                        <td style={s.tdLabel}>Nomor Kamar / Room No.</td>
                        <td style={{ ...s.tdValue, fontWeight: 700, fontSize: "14px", textAlign: "center" }}>{checkin.roomNumber || "—"}</td>
                    </tr>
                    <tr>
                        <td style={s.tdLabel}>NIK / ID Number</td>
                        <td style={{ ...s.tdValue, letterSpacing: "1px" }}>{checkin.nik || "—"}</td>
                        <td style={s.tdLabel}>Waktu Check-In / Arrival</td>
                        <td style={s.tdValue}>{formatDate(checkin.timestamp)}</td>
                    </tr>
                    <tr>
                        <td style={s.tdLabel}>Alamat / Address</td>
                        <td style={s.tdValue} colSpan={3}>{checkin.address || "—"}</td>
                    </tr>
                    <tr>
                        <td style={s.tdLabel}>Staf Penerima / Handled By</td>
                        <td style={s.tdValue}>{checkin.staffName || "—"}</td>
                        <td style={s.tdLabel}>Tanggal Dokumen</td>
                        <td style={s.tdValue}>{today}</td>
                    </tr>
                </tbody>
            </table>

            {/* ══ TERMS & CONDITIONS ══ */}
            <div>
                <p style={s.sectionTitle}>Syarat, Ketentuan &amp; Perjanjian Tamu · Terms, Conditions &amp; Guest Agreement</p>

                <p style={s.clause}>
                    <strong>1. Registrasi &amp; Verifikasi Identitas / Registration &amp; Identity Verification</strong><br />
                    Tamu wajib menyerahkan dokumen identitas resmi yang masih berlaku (KTP/Paspor/SIM) untuk keperluan verifikasi sesuai peraturan perundang-undangan yang berlaku di Indonesia. Hotel berhak menolak check-in apabila identitas tidak dapat diverifikasi. Seluruh data yang diberikan harus akurat dan dapat dipertanggungjawabkan secara hukum.{" "}
                    <em>Guests must present a valid government-issued photo ID (KTP/Passport/Driver's License) for verification. The hotel reserves the right to refuse check-in if identity cannot be verified. All data provided must be accurate and truthful.</em>
                </p>

                <p style={s.clause}>
                    <strong>2. Waktu Check-In &amp; Check-Out / Check-In &amp; Check-Out Times</strong><br />
                    Waktu check-in resmi: <strong>14:00 WIB</strong> · Check-out: <strong>12:00 WIB</strong>. Early check-in (08:00–14:00) &amp; late check-out (12:00–18:00) dikenakan biaya 50% tarif harian berdasarkan ketersediaan. Late check-out setelah 18:00 dikenakan tarif penuh 1 malam.{" "}
                    <em>Standard check-in: <strong>14:00</strong> · Check-out: <strong>12:00</strong>. Early check-in and late check-out (to 18:00) incur 50% of daily rate; after 18:00, full daily rate applies.</em>
                </p>

                <p style={s.clause}>
                    <strong>3. Deposit &amp; Pembayaran / Security Deposit &amp; Payment</strong><br />
                    Deposit keamanan diperlukan saat check-in sesuai dengan kesepakatan atau peraturan hotel ini untuk menjamin tagihan insidental (minibar, laundry, layanan kamar). Deposit dikembalikan penuh saat check-out apabila tidak ada kerusakan atau tagihan tertunggak. Metode pembayaran diterima: Tunai (IDR), Transfer Bank, Visa/Mastercard/JCB, QRIS.{" "}
                    <em>A security deposit is required at check-in in accordance with the agreement or rules of this hotel to cover incidentals. The deposit is refunded in full upon check-out if no damage or outstanding charges exist. Accepted: Cash (IDR), Bank Transfer, Visa/Mastercard/JCB, QRIS.</em>
                </p>

                <p style={s.clause}>
                    <strong>4. Tanggung Jawab Kerusakan Properti / Property Damage Liability</strong><br />
                    Tamu bertanggung jawab penuh atas seluruh kerusakan pada fasilitas dan properti hotel yang terjadi selama masa inap, termasuk kerusakan yang dilakukan oleh tamu undangan. Biaya perbaikan atau penggantian akan dibebankan langsung ke akun tamu berdasarkan penilaian manajemen hotel.{" "}
                    <em>Guests are fully liable for any damage to hotel property during their stay, including damage caused by invited guests. Repair or replacement costs will be charged directly to the guest's account based on management's assessment.</em>
                </p>

                <p style={s.clause}>
                    <strong>5. Keamanan Barang Berharga / Valuables &amp; Safe Security</strong><br />
                    Hotel tidak bertanggung jawab atas kehilangan, kerusakan, atau pencurian uang tunai, perhiasan, dokumen, atau barang berharga yang disimpan di kamar tanpa menggunakan brankas (in-room safe) yang tersedia. Barang berharga dapat dititipkan di Front Office dengan tanda terima resmi.{" "}
                    <em>The hotel is not liable for loss, damage, or theft of valuables left in the room without using the in-room safe provided. Valuables may be deposited at the Front Office with an official receipt.</em>
                </p>

                <p style={s.clause}>
                    <strong>6. Tamu &amp; Pengunjung / Guests &amp; Visitors</strong><br />
                    Tamu terdaftar boleh menerima kunjungan di area publik hingga pukul <strong>22:00 WIB</strong>. Pengunjung yang bermalam wajib mendaftar di Front Office dan dikenakan biaya ekstra. Tamu di bawah 18 tahun wajib didampingi orang tua atau wali yang sah.{" "}
                    <em>Registered guests may receive visitors in public areas until <strong>22:00</strong>. Overnight visitors must register at the Front Office and are subject to extra charges. Guests under 18 must be accompanied by a parent or legal guardian.</em>
                </p>

                <p style={s.clause}>
                    <strong>7. Larangan, Noda &amp; Denda / Prohibited Activities, Stains &amp; Penalties</strong><br />
                    Tamu <strong>dilarang keras</strong> merokok di dalam kamar atau area non-smoking lainnya. Denda/biaya pembersihan tambahan akan dikenakan untuk merokok (smoking), noda permanen atau kotoran berlebih pada linen/handuk/properti hotel lainnya (linen stains), serta segala bentuk kerusakan fisik pada fasilitas hotel. Besaran denda dan biaya pemulihan akan dikenakan sesuai dengan kesepakatan dan peraturan yang telah disampaikan oleh pihak hotel. Pelanggaran berat terhadap tata tertib hotel dapat mengakibatkan pemutusan masa inap secara sepihak tanpa pengembalian biaya.{" "}
                    <em>Smoking inside rooms or other non-smoking areas is <strong>strictly prohibited</strong>. Additional cleaning fees or penalties will be charged for smoking, permanent stains or excessive dirt on linens/towels/hotel properties, and any physical damage to hotel facilities. The amount of penalties and restoration fees will be charged in accordance with the agreement and regulations conveyed by the hotel. Serious violations of house rules may result in immediate eviction without refund.</em>
                </p>

                <p style={s.clause}>
                    <strong>8. Prosedur Keadaan Darurat / Emergency Procedures</strong><br />
                    Tamu wajib memahami prosedur evakuasi yang tertera pada pintu kamar dan area publik. Dalam keadaan darurat, ikuti petunjuk staf menuju titik kumpul yang ditentukan. Nomor darurat: <strong>Ext. 0</strong> (Internal) · <strong>+62 361 000 0000</strong> (Eksternal). Jangan gunakan lift saat kebakaran.{" "}
                    <em>Guests must familiarise themselves with evacuation procedures. In emergencies follow staff instructions to the designated muster point. Emergency: <strong>Ext. 0</strong> · <strong>+62 361 000 0000</strong>. Do not use elevators during fires.</em>
                </p>

                <p style={s.clause}>
                    <strong>9. Kebijakan Privasi &amp; Perlindungan Data / Privacy Policy &amp; Data Protection</strong><br />
                    Sesuai UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP), hotel mengumpulkan dan memproses data pribadi tamu secara terbatas untuk: registrasi, keamanan properti, kepatuhan hukum, dan peningkatan layanan. Data tidak akan dijual atau dibagikan kepada pihak ketiga tanpa persetujuan eksplisit tamu kecuali diwajibkan oleh hukum. Tamu berhak meminta koreksi atau penghapusan data melalui Front Office.{" "}
                    <em>Pursuant to Law No. 27/2022 on Personal Data Protection, the hotel collects and processes guest personal data solely for registration, security, legal compliance, and service improvement. Data will not be sold or shared without explicit consent, except as required by law.</em>
                </p>

                <p style={{ ...s.clause, marginBottom: "14px" }}>
                    <strong>10. Penyelesaian Sengketa / Dispute Resolution</strong><br />
                    Segala perselisihan yang timbul dari perjanjian ini diselesaikan secara musyawarah. Apabila tidak tercapai kesepakatan, para pihak sepakat untuk menyelesaikan sengketa di Pengadilan Negeri yang berwenang di wilayah hukum hotel beroperasi, berdasarkan hukum Negara Kesatuan Republik Indonesia.{" "}
                    <em>Any disputes shall be resolved amicably. Failing resolution, disputes shall be submitted to the competent District Court in the hotel's jurisdiction, governed by Indonesian law.</em>
                </p>
            </div>

            {/* ══ DECLARATION ══ */}
            <div style={s.declaration}>
                <p style={{ fontWeight: 700, fontSize: "10px", marginBottom: "5px", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Pernyataan Tamu / Guest Declaration
                </p>
                <p style={{ textAlign: "justify", margin: 0 }}>
                    Dengan menandatangani dokumen ini, saya menyatakan bahwa: <strong>(1)</strong> seluruh data yang saya berikan adalah benar, lengkap, dan dapat dipertanggungjawabkan; <strong>(2)</strong> saya telah membaca, memahami, dan menyetujui seluruh Syarat &amp; Ketentuan, Tata Tertib, dan Kebijakan Privasi yang tercantum di atas tanpa paksaan dari pihak manapun; <strong>(3)</strong> saya bersedia menanggung seluruh konsekuensi hukum dan finansial atas setiap pelanggaran yang saya lakukan.{" "}
                    <em>By signing this document, I declare that: (1) all data provided is true, complete, and accurate; (2) I have read, understood, and agreed to all Terms &amp; Conditions, House Rules, and Privacy Policy above without coercion; (3) I accept full legal and financial responsibility for any violations I commit.</em>
                </p>
            </div>

            {/* ══ SIGNATURE BLOCK ══ */}
            <div style={s.sigGrid}>
                {/* Guest */}
                <div style={s.sigBox}>
                    <p style={s.sigLabel}>Tamu / Guest</p>
                    <div style={s.sigArea}>
                        {checkin.signatureUrl ? (
                            <img
                                src={checkin.signatureUrl}
                                alt="Tanda Tangan Tamu"
                                style={{ maxHeight: "80px", maxWidth: "100%", objectFit: "contain" }}
                            />
                        ) : (
                            <div style={s.sigLine} />
                        )}
                    </div>
                    <div style={s.sigMeta}>
                        <p style={s.sigName}>{checkin.name || "________________________________"}</p>
                        <p style={s.sigNote}>NIK: {checkin.nik || "—"}</p>
                        <p style={s.sigNote}>Tanda Tangan Elektronik / Digital Signature</p>
                        <p style={s.sigNote}>{formatDate(checkin.timestamp)}</p>
                    </div>
                </div>

                {/* Hotel */}
                <div style={s.sigBox}>
                    <p style={s.sigLabel}>Manajemen Hotel / Hotel Management</p>
                    <div style={s.sigArea}>
                        <div style={s.sigLine} />
                    </div>
                    <div style={s.sigMeta}>
                        <p style={s.sigName}>{checkin.staffName || "Front Desk Officer"}</p>
                        <p style={s.sigNote}>Petugas Front Office</p>
                        <p style={s.sigNote}>{hotelInfo?.name || "Bumi Anyom Resort & Spa"}</p>
                        <p style={s.sigNote}>{today}</p>
                    </div>
                </div>
            </div>

            {/* ══ FOOTER ══ */}
            <div style={s.footer}>
                <p style={{ margin: 0 }}>
                    Dokumen ini merupakan perjanjian yang sah dan mengikat secara hukum · This document constitutes a legally binding agreement
                </p>
                <p style={{ margin: "2px 0 0" }}>
                    Dicetak melalui Sistem Front Office Terintegrasi · Hotel Code: {activeHotelCode} · {new Date().toLocaleString("id-ID")}
                </p>
            </div>
        </div>
    );
}
