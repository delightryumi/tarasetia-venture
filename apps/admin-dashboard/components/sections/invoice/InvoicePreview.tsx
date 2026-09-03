"use client";

import React from "react";
import { type BrandingData, type InvoiceItem } from "./useInvoice";
import { useAuth } from "@/context/AuthContext";
import styles from "./InvoicePreview.module.css";

interface InvoicePreviewProps {
    branding: BrandingData;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    checkInDate: string;
    checkOutDate: string;
    clientName: string;
    clientDetails: string;
    items: InvoiceItem[];
    taxRate?: number | string;
    serviceRate?: number | string;
    taxAmount?: number;
    serviceAmount?: number;
    notes: string;
    subtotal: number;
    total: number;
    operatorName?: string;
    isPrintPortal?: boolean;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
    branding, invoiceNumber, invoiceDate, dueDate, checkInDate, checkOutDate, clientName,
    clientDetails, items, taxRate = 0, serviceRate = 0, taxAmount = 0, serviceAmount = 0,
    notes, subtotal, total, operatorName, isPrintPortal = false
}) => {
    const { user, activeHotelName } = useAuth();
    const effectiveOperator = operatorName || user?.displayName || user?.email?.split('@')[0] || "Front Office Staff";
    const effectiveCompany = branding.companyName || activeHotelName || "Partner Property";

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val);
    };

    const logoSrc = branding.logoUrl || branding.lightLogo || branding.darkLogo;

    return (
        <div 
            id={isPrintPortal ? "invoice-to-print-portal" : "invoice-to-print"}
            className={`${styles.paper} printInvoiceContainer`}
        >
            {/* ── Top Architectural Dual Hairline Accent ── */}
            <div className={styles.headerAccent} />

            {/* ── Pro Header: Left Letterhead + Right Invoice Title ── */}
            <div className={styles.headerRow}>
                <div className={styles.letterhead}>
                    {logoSrc ? (
                        <img 
                            src={logoSrc} 
                            alt={effectiveCompany} 
                            className={styles.logoImg} 
                        />
                    ) : (
                        <h2 className={styles.brandTitle}>{effectiveCompany}</h2>
                    )}
                    <div className={styles.brandMeta}>
                        {branding.address && <p className={styles.brandAddress}>{branding.address}</p>}
                        <p className={styles.brandContacts}>
                            {branding.phones && branding.phones.length > 0 && `Telp: ${branding.phones.join(', ')}`}
                            {branding.phones && branding.phones.length > 0 && branding.email && ` • `}
                            {branding.email && `Email: ${branding.email}`}
                        </p>
                    </div>
                </div>

                <div className={styles.titleBox}>
                    <h1 className={styles.docTitle}>INVOICE</h1>
                    <p className={styles.docSubtitle}>OFFICIAL GUEST FOLIO</p>
                    <div className={styles.statusBadge}>
                        <span>PAID IN FULL</span>
                    </div>
                </div>
            </div>

            {/* ── Metadata & Bill To Grid (Spacious 2-Column Box) ── */}
            <div className={styles.infoGrid}>
                <div className={styles.infoCard}>
                    <div className={styles.cardLabel}>BILLED TO</div>
                    <div className={styles.guestName}>{clientName || "VALUED GUEST"}</div>
                    <div className={styles.guestDetails}>
                        {clientDetails ? (
                            <p>{clientDetails}</p>
                        ) : (
                            <p className="text-slate-400 italic">Direct Guest (Tamu Langsung)</p>
                        )}
                    </div>
                </div>

                <div className={`${styles.infoCard} ${styles.metaCard}`}>
                    <div className={styles.metaRow}>
                        <span className={styles.metaLabel}>Invoice No:</span>
                        <span className={`${styles.metaValue} ${styles.mono}`}>#{invoiceNumber}</span>
                    </div>
                    <div className={styles.metaRow}>
                        <span className={styles.metaLabel}>Issue Date:</span>
                        <span className={styles.metaValue}>{invoiceDate}</span>
                    </div>
                    {(checkInDate || checkOutDate) && (
                        <div className={styles.metaRow}>
                            <span className={styles.metaLabel}>Stay Period:</span>
                            <span className={`${styles.metaValue} ${styles.mono}`}>
                                {checkInDate && checkOutDate 
                                    ? `${checkInDate} — ${checkOutDate}` 
                                    : checkInDate || checkOutDate}
                            </span>
                        </div>
                    )}
                    <div className={styles.metaRow}>
                        <span className={styles.metaLabel}>Issued By:</span>
                        <span className={styles.metaValue}>{effectiveOperator}</span>
                    </div>
                </div>
            </div>

            {/* ── Services & Line Items Table (Generous Row Heights) ── */}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: '8%', textAlign: 'center' }}>NO</th>
                            <th style={{ width: '46%', textAlign: 'left' }}>DESCRIPTION OF SERVICE</th>
                            <th style={{ width: '12%', textAlign: 'center' }}>QTY</th>
                            <th style={{ width: '17%', textAlign: 'right' }}>UNIT RATE</th>
                            <th style={{ width: '17%', textAlign: 'right' }}>TOTAL (IDR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={item.id || index}>
                                <td style={{ textAlign: 'center', color: '#94a3b8' }}>{index + 1}</td>
                                <td>
                                    <div className={styles.itemTitle}>{item.description || 'Room Stay & Hospitality Services'}</div>
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                                <td style={{ textAlign: 'right' }} className={styles.mono}>
                                    {formatCurrency(item.rate)}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 700 }} className={styles.mono}>
                                    {formatCurrency(item.quantity * item.rate)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Financial Summary & Payment Notes ── */}
            <div className={styles.summarySection}>
                <div className={styles.notesBox}>
                    <div className={styles.notesLabel}>TERMS & NOTES</div>
                    <p className={styles.notesText}>
                        {notes || "Terima kasih atas kunjungan dan kepercayaan Anda. Bukti pembayaran ini sah dan tercatat pada sistem manajemen properti."}
                    </p>
                </div>

                <div className={styles.calcBox}>
                    <div className={styles.calcLine}>
                        <span>Subtotal</span>
                        <span className={styles.mono}>{formatCurrency(subtotal)}</span>
                    </div>
                    {Number(serviceRate) > 0 && (
                        <div className={styles.calcLine}>
                            <span>Service Charge ({serviceRate}%)</span>
                            <span className={styles.mono}>{formatCurrency(serviceAmount)}</span>
                        </div>
                    )}
                    {Number(taxRate) > 0 && (
                        <div className={styles.calcLine}>
                            <span>Pajak PB1 / Tax ({taxRate}%)</span>
                            <span className={styles.mono}>{formatCurrency(taxAmount)}</span>
                        </div>
                    )}
                    {Number(serviceRate) === 0 && Number(taxRate) === 0 && (
                        <div className={styles.calcLine}>
                            <span>Tax & Service (0%)</span>
                            <span className={styles.mono}>{formatCurrency(0)}</span>
                        </div>
                    )}
                    <div className={styles.totalLine}>
                        <span>TOTAL PAYABLE</span>
                        <span className={styles.totalAmount}>{formatCurrency(total)}</span>
                    </div>
                </div>
            </div>

            {/* ── Dual Signatory Block ── */}
            <div className={styles.signatureSection}>
                <div className={styles.sigCol}>
                    <p className={styles.sigTitle}>Guest Signature</p>
                    <div className={styles.sigSpace} />
                    <div className={styles.sigLine} />
                    <p className={styles.sigPerson}>{clientName || "Valued Guest"}</p>
                </div>

                <div className={styles.sigCol}>
                    <p className={styles.sigTitle}>Authorized Front Desk</p>
                    <div className={styles.sigSpace} />
                    <div className={styles.sigLine} />
                    <p className={styles.sigPerson}>{effectiveOperator}</p>
                </div>
            </div>

            {/* ── Bottom Verification Footer ── */}
            <div className={styles.bottomFooter}>
                <div className={styles.footerDivider} />
                <div className={styles.footerContent}>
                    <span>{effectiveCompany}</span>
                    {branding.website && <span>{branding.website}</span>}
                    <span>Computer-generated document by CRS Setara System</span>
                </div>
            </div>
        </div>
    );
};
