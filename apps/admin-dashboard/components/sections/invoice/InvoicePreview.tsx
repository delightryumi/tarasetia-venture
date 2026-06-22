"use client";

import React from "react";
import { type BrandingData, type InvoiceItem } from "./useInvoice";

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
    notes: string;
    subtotal: number;
    total: number;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
    branding, invoiceNumber, invoiceDate, dueDate, checkInDate, checkOutDate, clientName,
    clientDetails, items, notes, subtotal, total
}) => {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="invoice-scroll-wrapper">
            <div className="invoice-paper" id="invoice-to-print">
                {/* Accent Bar */}
                <div className="invoice-accent-bar" />

                {/* Header */}
                <div className="invoice-header">
                    <div className="logo-section">
                        {branding.darkLogo ? (
                            <img src={branding.darkLogo} alt="Partner Logo" className="invoice-logo" />
                        ) : (
                            <h2 className="brand-title">{branding.companyName || 'PARTNER'}</h2>
                        )}
                    </div>
                    <div className="title-section" style={{ textAlign: 'right' }}>
                        <h1 className="brand-title" style={{ fontSize: '24pt', fontWeight: 200, margin: 0 }}>
                            INVOICE
                        </h1>
                        <p className="invoice-subtitle">OFFICIAL RECEIPT</p>

                        {/* Ultra-Wide Horizontal Detail Bar */}
                        <div className="detail-box" style={{
                            marginTop: '10mm',
                            display: 'flex',
                            width: '100%',
                            borderTop: '1px solid var(--invoice-sage)',
                            borderBottom: '1px solid var(--invoice-sage)',
                            padding: '4mm 0',
                            justifyContent: 'space-between'
                        }}>
                            <div className="detail-item" style={{ flex: 1, borderRight: '1px solid var(--invoice-border)', paddingRight: '4mm' }}>
                                <span className="detail-label" style={{ marginBottom: '2px' }}>Reference No.</span>
                                <span className="detail-value" style={{ fontSize: '10pt', fontWeight: 600 }}>#{invoiceNumber}</span>
                            </div>
                            <div className="detail-item" style={{ flex: 1, borderRight: '1px solid var(--invoice-border)', paddingLeft: '4mm', paddingRight: '4mm' }}>
                                <span className="detail-label" style={{ marginBottom: '2px' }}>Date Issued</span>
                                <span className="detail-value" style={{ fontSize: '10pt', fontWeight: 600 }}>{invoiceDate}</span>
                            </div>
                            {checkInDate && (
                                <div className="detail-item" style={{ flex: 1, borderRight: '1px solid var(--invoice-border)', paddingLeft: '4mm', paddingRight: '4mm' }}>
                                    <span className="detail-label" style={{ marginBottom: '2px' }}>Check‑In</span>
                                    <span className="detail-value" style={{ fontSize: '10pt', fontWeight: 600 }}>{checkInDate}</span>
                                </div>
                            )}
                            {checkOutDate && (
                                <div className="detail-item" style={{ flex: 1, paddingLeft: '4mm' }}>
                                    <span className="detail-label" style={{ marginBottom: '2px' }}>Check‑Out</span>
                                    <span className="detail-value" style={{ fontSize: '10pt', fontWeight: 600 }}>{checkOutDate}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Guest & Resort Info */}
                <div className="info-grid">
                    <div className="info-card">
                        <h4>Bill To</h4>
                        <p style={{ fontSize: '22pt', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--rich-black)' }}>
                            {clientName || 'Valued Guest'}
                        </p>
                        <pre style={{
                            font: 'inherit',
                            whiteSpace: 'pre-wrap',
                            margin: 0,
                            color: '#5c5850',
                            fontSize: '11pt',
                            lineHeight: '1.7',
                            maxWidth: '120mm'
                        }}>
                            {clientDetails || 'No address provided'}
                        </pre>
                    </div>
                    <div className="info-card" style={{ textAlign: 'right' }}>
                        <h4>From</h4>
                        <p style={{ fontSize: '12pt', fontWeight: 600, color: 'var(--rich-black)', margin: '0 0 8px 0' }}>
                            {branding.companyName || 'Partner Property'}
                        </p>
                        <p style={{ fontSize: '10pt', color: '#706c64', lineHeight: '1.6', maxWidth: '120mm' }}>
                            {branding.address || 'Alamat properti belum diisi'}<br />
                            Central Java, Indonesia
                        </p>
                        <div style={{ marginTop: '12px', fontSize: '9pt', color: '#9fa392' }}>
                            {branding.phones.join(' • ')}<br />
                            {branding.email}
                        </div>
                    </div>
                </div>

                {/* Service Table */}
                <table className="invoice-table-modern">
                    <thead>
                        <tr>
                            <th className="invoice-col-desc">Service Description</th>
                            <th className="invoice-col-qty">Qty</th>
                            <th className="invoice-col-unit">Unit Rate</th>
                            <th className="invoice-col-total">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id}>
                                <td className="invoice-col-desc">
                                    <p style={{ fontWeight: 600, marginBottom: '4px' }}>{item.description || 'General Service'}</p>
                                </td>
                                <td className="invoice-col-qty">{item.quantity}</td>
                                <td className="invoice-col-unit">{formatCurrency(item.rate)}</td>
                                <td className="invoice-col-total" style={{ fontWeight: 700 }}>{formatCurrency(item.quantity * item.rate)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Summary Block */}
                <div className="summary-block">
                    <div className="summary-row">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="summary-row">
                        <span>Tax & Fees (0%)</span>
                        <span>{formatCurrency(0)}</span>
                    </div>
                    <div className="summary-total">
                        <span>Total Payable</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="footer-section">
                    <div className="thank-you">
                        {notes || 'Terima kasih atas kepercayaan Anda. Kami berharap dapat melayani Anda kembali.'}
                    </div>
                    <div className="signatory">
                        <p>Authorized Signatory</p>
                        <div className="sig-line" />
                        <p style={{ marginTop: '4px', fontWeight: 600 }}>{branding.companyName || 'Management'}</p>
                    </div>
                    <div className="branding-footer">
                        <p>{branding.website || ''}</p>
                        <p>{branding.address ? branding.address.split(',').slice(-1)[0]?.trim() : 'Indonesia'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
