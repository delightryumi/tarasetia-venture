"use client";

import React from "react";
import { ConfirmationLetter, HotelBranding } from "./ConfirmationLetterTypes";
import styles from "./ConfirmationLetterStyles.module.css";
import { Printer, Copy, CheckCircle2, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ConfirmationLetterPreviewProps {
    letter: ConfirmationLetter;
    branding: HotelBranding;
    isPrintPortal?: boolean;
}

export const ConfirmationLetterPreview: React.FC<ConfirmationLetterPreviewProps> = ({ letter, branding, isPrintPortal }) => {
    const formatIDR = (val: number) => {
        return "Rp " + (Number(val) || 0).toLocaleString("id-ID");
    };

    const bankName = letter.paymentTerms?.bankName?.trim() || (letter as any).bankName?.trim() || branding.bankName?.trim() || "BCA";
    const bankAccountNumber = letter.paymentTerms?.bankAccountNumber?.trim() || (letter as any).bankAccountNumber?.trim() || (letter as any).bankDetails?.accountNumber?.trim() || branding.bankAccountNumber?.trim() || "";
    const bankAccountName = letter.paymentTerms?.bankAccountName?.trim() || (letter as any).bankAccountName?.trim() || (letter as any).bankDetails?.accountName?.trim() || branding.bankAccountName?.trim() || branding.name || "Manajemen Hotel";

    const handlePrint = () => {
        window.print();
    };

    const handleCopySummary = () => {
        const text = `*SURAT KONFIRMASI RESERVASI HOTEL (${letter.letterNumber})*
Properti: ${branding.name}
Instansi / Perusahaan: ${letter.clientName || "-"}
Nama Kegiatan: ${letter.eventName || "-"}
No. SPK / PO: ${letter.spkNumber || "-"}
PIC: ${letter.contactPerson || letter.picName || "-"} (${letter.contactPhone || letter.picPhone || "-"})

*Jadwal Menginap:*
Check-in: ${letter.checkInDate} (${letter.checkInTime || "14:00 WIB"})
Check-out: ${letter.checkOutDate} (${letter.checkOutTime || "12:00 WIB"})
Durasi: ${letter.totalNights || 1} Malam | Estimasi: ${letter.totalPax || 2} Pax

*Alokasi Kamar (Accommodation Allotment):*
${(letter.rooms || []).map(r => `- ${r.roomTypeName} (${r.roomCount || r.quantity || 1} Kamar, Bed: ${r.bedType || r.occupancyType || "Standard"}) @ ${formatIDR(r.ratePerNight || r.nightlyRate || 0)}/malam [Meal: ${r.mealPlan || "BB"}]`).join("\n")}

${(letter.meetingPackages && letter.meetingPackages.length > 0) ? `*Paket Pertemuan / MICE:*
${letter.meetingPackages.map(m => `- ${m.packageName || m.name} (${m.pax} Pax, Layout: ${m.setupStyle || "Classroom"}) @ ${formatIDR(m.ratePerPax)}/pax`).join("\n")}
` : ""}
*Total Estimasi Kontrak:* ${formatIDR(letter.grandTotal || 0)} (Nett)
Instruksi Penagihan (Billing): ${letter.paymentTerms?.billingArrangement || "Bill to Company (BTC)"}
*Rekening Pembayaran Resmi:*
Bank: ${bankName} — No. Rek: ${bankAccountNumber || "-"}
Atas Nama: ${bankAccountName}

Terima kasih atas kerja sama dan kepercayaannya.`;

        navigator.clipboard.writeText(text);
        toast.success("Ringkasan standar hotel berhasil disalin ke clipboard!");
    };

    const totalRooms = (letter.rooms || []).reduce((acc, r) => acc + (r.roomCount || r.quantity || 1), 0);
    const starCount = branding.starRating || 4;
    const stars = "★".repeat(starCount);
    const logoSrc = branding.logoUrl || branding.lightLogo || branding.darkLogo || branding.logoLight || branding.logoDark || branding.logo;

    return (
        <div className={styles.previewCol}>
            {/* Action Toolbar (Hidden in Print Portal) */}
            {!isPrintPortal && (
                <div className={`${styles.previewToolbar} ${styles.noPrint}`}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.05em" }}>STATUS RESERVASI:</span>
                        <span style={{
                            padding: "3px 10px",
                            borderRadius: "20px",
                            fontSize: "10.5px",
                            fontWeight: 800,
                            backgroundColor: letter.status === "CONFIRMED" ? "rgba(34, 197, 94, 0.2)" : "rgba(234, 179, 8, 0.2)",
                            color: letter.status === "CONFIRMED" ? "#4ade80" : "#fde047",
                            border: `1px solid ${letter.status === "CONFIRMED" ? "rgba(34, 197, 94, 0.4)" : "rgba(234, 179, 8, 0.4)"}`
                        }}>
                            {letter.guaranteeStatus === "GUARANTEED" ? "GUARANTEED RESERVATION" : letter.status}
                        </span>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            type="button"
                            onClick={handleCopySummary}
                            className={`${styles.btnAction} ${styles.btnSecondary}`}
                            title="Salin ringkasan ke format chat WhatsApp"
                        >
                            <Copy size={15} />
                            <span>Salin Format WA</span>
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className={`${styles.btnAction} ${styles.btnPrimary}`}
                            title="Cetak Dokumen Resmi atau Simpan sebagai PDF A4"
                        >
                            <Printer size={15} />
                            <span>Cetak Dokumen (PDF)</span>
                        </button>
                    </div>
                </div>
            )}

            {/* A4 Paper Physical View */}
            <div className={styles.paperContainer}>
                <div className={styles.paper} id={isPrintPortal ? "printable-confirmation-letter-portal" : "printable-confirmation-letter"}>
                    {/* Official Hotel Letterhead */}
                    <div className={styles.letterheadRow}>
                        <div className={styles.hotelBranding}>
                            {logoSrc ? (
                                <div className={styles.hotelBrandWithLogo}>
                                    <img 
                                        src={logoSrc} 
                                        alt={branding.name || "Property Logo"} 
                                        className={styles.hotelLogoImg} 
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className={styles.hotelStars}>{stars}</div>
                                    <h1 className={styles.hotelName}>{branding.name}</h1>
                                </>
                            )}
                            <div className={styles.hotelMeta}>
                                {branding.address && <div>{branding.address}</div>}
                                {(branding.phone || branding.email) && (
                                    <div>
                                        {branding.phone && `Hunting: ${branding.phone}`}
                                        {branding.phone && branding.email && ` | `}
                                        {branding.email && `Email: ${branding.email}`}
                                    </div>
                                )}
                                {branding.website && branding.website.trim() && <div>Website Resmi: {branding.website}</div>}
                            </div>
                        </div>

                        <div className={styles.letterTitleBox}>
                            <div className={styles.docTitle}>CONFIRMATION LETTER</div>
                            <div className={styles.docSubtitle}>Surat Konfirmasi Pemesanan Resmi</div>
                            <div className={styles.docRefNo}>Nomor: {letter.letterNumber}</div>
                            <div className={styles.docDate}>Tanggal Terbit: {letter.letterDate}</div>
                            <div className={styles.docStatusTag}>
                                {letter.guaranteeStatus || "GUARANTEED BOOKING"}
                            </div>
                        </div>
                    </div>

                    {/* Formal Salutation */}
                    <div className={styles.formalGreeting}>
                        Dengan hormat, Manajemen <strong>{branding.name}</strong> mengucapkan terima kasih atas kepercayaan Anda memilih akomodasi kami. Bersama ini kami sampaikan rincian resmi konfirmasi pemesanan (<em>Hotel Reservation Agreement</em>) sebagai berikut:
                    </div>

                    {/* Modern Clean Client & Schedule Info Grid */}
                    <div className={styles.modernInfoGrid}>
                        {/* Left Column: Client & PIC Dossier */}
                        <div className={styles.infoColumn}>
                            <div className={styles.infoSectionTag}>Informasi Pemesan (Client & PIC)</div>
                            <div className={styles.infoPrimaryName}>{letter.clientName || "Pribadi / Direct Booker"}</div>
                            {letter.eventName && (
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Kegiatan:</span>
                                    <span className={styles.infoVal}>{letter.eventName}</span>
                                </div>
                            )}
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Contact Person:</span>
                                <span className={styles.infoVal}>
                                    {letter.contactPerson || letter.picName || "-"}
                                    {(letter.contactPhone || letter.picPhone) && ` (${letter.contactPhone || letter.picPhone})`}
                                </span>
                            </div>
                            {(letter.picTitle || letter.contactEmail || letter.picEmail) && (
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Email / Divisi:</span>
                                    <span className={styles.infoVal}>
                                        {[letter.picTitle, letter.contactEmail || letter.picEmail].filter(Boolean).join(" • ")}
                                    </span>
                                </div>
                            )}
                            {(letter.spkNumber || letter.npwp) && (
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Ref / NPWP:</span>
                                    <span className={styles.infoVal}>
                                        {[letter.spkNumber && `SPK: ${letter.spkNumber}`, letter.npwp && `NPWP: ${letter.npwp}`].filter(Boolean).join(" | ")}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Stay Dates & Overview Timeline */}
                        <div className={styles.infoColumn}>
                            <div className={styles.infoSectionTag}>Jadwal Menginap (Stay Schedule)</div>
                            <div className={styles.stayHighlightBar}>
                                <div className={styles.stayDateBlock}>
                                    <span className={styles.stayDateLabel}>CHECK-IN</span>
                                    <span className={styles.stayDateVal}>{letter.checkInDate}</span>
                                    <span className={styles.stayTimeVal}>Pukul {letter.checkInTime || "14:00 WIB"}</span>
                                </div>
                                <div className={styles.stayArrow}>→</div>
                                <div className={styles.stayDateBlock} style={{ textAlign: "right" }}>
                                    <span className={styles.stayDateLabel}>CHECK-OUT</span>
                                    <span className={styles.stayDateVal}>{letter.checkOutDate}</span>
                                    <span className={styles.stayTimeVal}>Pukul {letter.checkOutTime || "12:00 WIB"}</span>
                                </div>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Durasi & Unit:</span>
                                <span className={styles.infoVal}>{totalRooms} Kamar / {letter.totalNights || 1} Malam ({totalRooms * (letter.totalNights || 1)} Room Nights)</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Cut-Off List:</span>
                                <span className={styles.infoVal}>{letter.roomingListCutOff || letter.cutOffDate || letter.checkInDate}</span>
                            </div>
                        </div>
                    </div>

                    {/* Accommodation Allotment Table */}
                    <div className={styles.paperSectionTitle}>1. Alokasi Kamar & Harga Kontrak (Accommodation Allotment)</div>
                    <table className={styles.hotelTable}>
                        <thead>
                            <tr>
                                <th style={{ width: "28%" }}>Tipe Kamar / Category</th>
                                <th style={{ width: "14%", textAlign: "center" }}>Konfigurasi Bed</th>
                                <th style={{ width: "10%", textAlign: "center" }}>Meal Plan</th>
                                <th style={{ width: "9%", textAlign: "center" }}>Jumlah</th>
                                <th style={{ width: "7%", textAlign: "center" }}>Malam</th>
                                <th style={{ width: "15%", textAlign: "right" }}>Harga/Malam</th>
                                <th style={{ width: "17%", textAlign: "right" }}>Total (IDR)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(letter.rooms || []).map((room, idx) => {
                                const qty = room.roomCount || room.quantity || 1;
                                const nights = room.nights || letter.totalNights || 1;
                                const rate = room.ratePerNight || room.nightlyRate || 0;
                                const sub = room.subtotal || room.totalAmount || (qty * nights * rate);

                                return (
                                    <tr key={idx}>
                                        <td>
                                            <strong style={{ color: "#0f172a" }}>{room.roomTypeName}</strong>
                                            <div style={{ fontSize: "6.2pt", color: "#64748b" }}>
                                                {room.inclusions || "Termasuk Sarapan Pagi Buffet, Free Wi-Fi"}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: "center" }}>{room.bedType || room.occupancyType || "Standard Bed"}</td>
                                        <td style={{ textAlign: "center" }}>
                                            <span style={{ fontWeight: 700 }}>{room.mealPlan || (room.includesBreakfast ? "BB" : "RO")}</span>
                                            <div style={{ fontSize: "5.8pt", color: "#64748b" }}>{room.includesBreakfast ? "Breakfast" : "Room Only"}</div>
                                        </td>
                                        <td style={{ textAlign: "center", fontWeight: 700 }}>{qty} Unit</td>
                                        <td style={{ textAlign: "center" }}>{nights}</td>
                                        <td style={{ textAlign: "right" }}>{formatIDR(rate)}</td>
                                        <td style={{ textAlign: "right", fontWeight: 700 }}>{formatIDR(sub)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Banquet & Function Space Arrangement (MICE) if any */}
                    {letter.meetingPackages && letter.meetingPackages.length > 0 && (
                        <>
                            <div className={styles.paperSectionTitle}>2. Fasilitas Ruang Pertemuan & Banquet (Function Space)</div>
                            <table className={styles.hotelTable}>
                                <thead>
                                    <tr>
                                        <th style={{ width: "30%" }}>Paket / Ruangan</th>
                                        <th style={{ width: "14%", textAlign: "center" }}>Setup Layout</th>
                                        <th style={{ width: "10%", textAlign: "center" }}>Peserta</th>
                                        <th style={{ width: "8%", textAlign: "center" }}>Hari</th>
                                        <th style={{ width: "18%", textAlign: "right" }}>Harga/Pax/Hari</th>
                                        <th style={{ width: "20%", textAlign: "right" }}>Subtotal (IDR)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {letter.meetingPackages.map((mp, idx) => {
                                        const pax = mp.pax || 1;
                                        const days = mp.days || 1;
                                        const rate = mp.ratePerPax || 0;
                                        const sub = mp.subtotal || mp.totalAmount || (pax * days * rate);

                                        return (
                                            <tr key={idx}>
                                                <td>
                                                    <strong style={{ color: "#0f172a" }}>{mp.packageName || mp.name}</strong>
                                                    <div style={{ fontSize: "6.2pt", color: "#64748b" }}>
                                                        {mp.inclusions || "Standard Sound, Memo & Mineral Water"}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: "center" }}>{mp.setupStyle || "Classroom"}</td>
                                                <td style={{ textAlign: "center", fontWeight: 700 }}>{pax} Pax</td>
                                                <td style={{ textAlign: "center" }}>{days} Hari</td>
                                                <td style={{ textAlign: "right" }}>{formatIDR(rate)}</td>
                                                <td style={{ textAlign: "right", fontWeight: 700 }}>{formatIDR(sub)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </>
                    )}

                    {/* Total Summary */}
                    <div className={styles.totalsSummaryContainer}>
                        <div className={styles.totalsRow}>
                            <span>Subtotal Biaya Kontrak:</span>
                            <span style={{ fontWeight: 600 }}>{formatIDR(letter.subtotal || 0)}</span>
                        </div>
                        {(letter.taxAmount ?? 0) > 0 && (
                            <div className={styles.totalsRow}>
                                <span>Pajak Pemerintah ({letter.taxRate || 0}%):</span>
                                <span>{formatIDR(letter.taxAmount || 0)}</span>
                            </div>
                        )}
                        {(letter.serviceAmount ?? 0) > 0 && (
                            <div className={styles.totalsRow}>
                                <span>Service Charge ({letter.serviceRate || 0}%):</span>
                                <span>{formatIDR(letter.serviceAmount || 0)}</span>
                            </div>
                        )}
                        <div className={styles.totalsRowBold}>
                            <span>TOTAL ESTIMASI KONTRAK (NETT):</span>
                            <span>{formatIDR(letter.grandTotal || 0)}</span>
                        </div>
                    </div>

                    {/* Section 3 & 4: Compact Clean 2-Column Grid (Billing & Regulations) */}
                    <div className={styles.termsBillingGrid}>
                        {/* 3. Ketentuan Penagihan & Pembayaran */}
                        <div className={styles.billingDossierBox}>
                            <div className={styles.billingTitle}>2. Penagihan & Pembayaran (Billing Protocol)</div>
                            <div className={styles.billingItem}>
                                • <strong>Master Account:</strong> {letter.paymentTerms?.masterAccountBilling || "Sewa kamar & kegiatan ditagihkan ke instansi (Bill to Company)."}
                            </div>
                            <div className={styles.billingItem}>
                                • <strong>Incidentals:</strong> {letter.paymentTerms?.personalIncidentalBilling || "Pengeluaran pribadi tamu diselesaikan langsung oleh masing-masing tamu saat check-out."}
                            </div>
                            {/* Instruksi Transfer Bank Resmi Hotel */}
                            <div className={styles.bankMiniCard}>
                                <strong>Instruksi Transfer Bank Resmi:</strong><br />
                                Bank <strong>{bankName}</strong> — Rek. <strong style={{ color: "#0f172a" }}>{bankAccountNumber || "-"}</strong><br />
                                a.n. <strong>{bankAccountName}</strong>
                            </div>
                            {letter.paymentTerms?.billingNotes && (
                                <div className={styles.billingItem} style={{ fontStyle: "italic", color: "#64748b", marginTop: "2px" }}>
                                    Catatan: {letter.paymentTerms.billingNotes}
                                </div>
                            )}
                        </div>

                        {/* 4. Kebijakan Standar & Regulasi */}
                        <div className={styles.regulationsBox}>
                            <div className={styles.regulationsTitle}>3. Kebijakan & Regulasi (Hotel Regulations)</div>
                            <ul className={styles.regulationsList}>
                                {[
                                    "Jaminan & Konfirmasi: Pemesanan mengikat resmi setelah ditandatangani & disahkan pihak pemesan.",
                                    "Waktu CI & CO: Check-in resmi 14:00 WIB, check-out resmi 12:00 WIB. Early CI / Late CO sesuai ketersediaan.",
                                    "Rooming List & Deposit: Diserahkan paling lambat pada tanggal cut-off yang telah disepakati.",
                                    "Pembatalan (Cancellation): Pembatalan H-7 penalti 50%, pembatalan H-3 / No-Show dikenakan biaya penuh 100%."
                                ].map((term, i) => {
                                    const colonIdx = term.indexOf(":");
                                    return (
                                        <li key={i}>
                                            {colonIdx > 0 ? (
                                                <>
                                                    <strong>{term.slice(0, colonIdx + 1)}</strong>
                                                    {term.slice(colonIdx + 1)}
                                                </>
                                            ) : term}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>

                    {/* Dual Legal Acceptance & Authorization Block */}
                    <div className={styles.signaturesGrid}>
                        <div className={styles.sigBlock}>
                            <div className={styles.sigRole}>Dikonfirmasi oleh Pihak Hotel,</div>
                            <div className={styles.sigCompany}>{branding.name}</div>
                            <div className={styles.sigUnderline}>
                                {letter.signatoryHotel?.name || letter.hotelSignatory?.name || "Director of Sales & Marketing"}
                            </div>
                            <div className={styles.sigTitle}>
                                {letter.signatoryHotel?.title || letter.hotelSignatory?.title || "Director of Sales / Front Office Manager"}
                            </div>
                        </div>

                        <div className={styles.sigBlock}>
                            <div className={styles.sigRole}>Disetujui & Diterima oleh Pemesan,</div>
                            <div className={styles.sigCompany}>{letter.clientName || "Pihak Instansi / Perusahaan"}</div>
                            <div className={styles.sigUnderline}>
                                {letter.signatoryClient?.name || letter.clientSignatory?.name || "( Tanda Tangan & Cap Resmi )"}
                            </div>
                            <div className={styles.sigTitle}>
                                {letter.signatoryClient?.title || letter.clientSignatory?.title || "Pejabat Pembuat Komitmen (PPK) / Authorized Officer"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationLetterPreview;
