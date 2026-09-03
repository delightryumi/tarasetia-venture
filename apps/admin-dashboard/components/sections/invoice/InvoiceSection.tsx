"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, Printer, FileText, User, Mail, CreditCard, Calendar, Percent } from "lucide-react";
import { useInvoice } from "./useInvoice";
import { InvoicePreview } from "./InvoicePreview";
import { motion, AnimatePresence } from "framer-motion";
import overviewStyles from "../overview/OverviewStyles.module.css";
import styles from "./InvoiceSection.module.css";

export const InvoiceSection = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const {
        branding, loading,
        invoiceNumber, setInvoiceNumber,
        invoiceDate, setInvoiceDate,
        dueDate, setDueDate,
        checkInDate, setCheckInDate,
        checkOutDate, setCheckOutDate,
        clientName, setClientName,
        clientDetails, setClientDetails,
        items, addItem, removeItem, updateItem,
        taxRate, setTaxRate,
        serviceRate, setServiceRate,
        taxAmount, serviceAmount,
        notes, setNotes,
        subtotal, total, handlePrint,
        transactions, selectTransaction, searchTransactions, searching
    } = useInvoice();

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-transparent">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-[var(--sidebar-link-active-bg)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[var(--sidebar-text)] font-semibold uppercase text-xs tracking-wider animate-pulse">Loading Invoice System...</p>
            </div>
        </div>
    );

    const previewProps = {
        branding,
        invoiceNumber,
        invoiceDate,
        dueDate,
        checkInDate,
        checkOutDate,
        clientName,
        clientDetails,
        items,
        taxRate,
        serviceRate,
        taxAmount,
        serviceAmount,
        notes,
        subtotal,
        total
    };

    return (
        <section className="min-h-screen bg-transparent">
            <header className={`${overviewStyles.header} no-print`}>
                <div className={overviewStyles.headerInner}>
                    <div className={overviewStyles.headerLeft}>
                        <div className={overviewStyles.headerBadge} style={{ backgroundColor: 'var(--sidebar-link-active-bg)', color: 'var(--sidebar-link-active-text)' }}>
                            <FileText size={15} />
                        </div>
                        <div className={overviewStyles.headerMeta}>
                            <span className={overviewStyles.headerSubtitle}>Document Generator</span>
                            <h1 className={overviewStyles.headerTitle}>
                                Invoice <span style={{ color: 'var(--sidebar-link-active-bg)' }}>Creator</span>
                            </h1>
                        </div>
                    </div>

                    <div className={overviewStyles.headerRight}>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handlePrint}
                            className={`${styles.btnInvoiceAction} ${styles.primaryPeach}`}
                            style={{ height: '36px', padding: '0 16px', borderRadius: '8px', fontSize: '12px' }}
                        >
                            <Printer size={16} />
                            Print Receipt
                        </motion.button>
                    </div>
                </div>
            </header>

            <div className={`${styles.invoiceContainer} !pt-4`}>
                {/* 
                  =======================================================
                  FORM SIDE (left)
                  =======================================================
                */}
                <div className={`${styles.invoiceFormCard} ${styles.customScrollbar}`}>
                    <div>
                        <section className={`${styles.formSection} ${styles.verifyGuestSection}`}>
                            <h3 className={styles.sectionHeader}>
                                Verify & Link Guest
                            </h3>
                            <div className={styles.verifyGuestContainer}>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Cari nama tamu (min. 2 huruf)..."
                                        className="w-full h-11 px-4 bg-[#fbf9f4] dark:bg-[#1a1a1a] border border-[rgba(141,122,82,0.12)] dark:border-[#333333] rounded-xl text-sm outline-none focus:border-[var(--sidebar-link-active-bg)] focus:ring-1 focus:ring-[var(--sidebar-link-active-bg)] transition-all shadow-sm dark:text-white"
                                        onChange={(e) => searchTransactions(e.target.value)}
                                    />
                                    {searching && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <div className="w-4 h-4 border-2 border-[var(--sidebar-link-active-bg)] border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>

                                <div className={`${styles.verifyResultsList} ${styles.customScrollbar}`}>
                                    {transactions.length === 0 && !searching && (
                                        <p className={styles.verifyHelperText}>Ketik nama tamu untuk mencari data asli dari sistem...</p>
                                    )}
                                    {transactions.map((tr, i) => (
                                        <button
                                            key={i}
                                            onClick={() => selectTransaction(tr)}
                                            className={styles.verifyResultBtn}
                                        >
                                            <div className={styles.verifyResultInfo}>
                                                <div className={styles.verifyResultName}>{tr.guestName || tr.incomeCategory}</div>
                                                <div className={styles.verifyResultMeta}>{tr.checkInDate || new Date(tr.timestamp).toLocaleDateString()} — {tr.channel || 'Internal'}</div>
                                            </div>
                                            <div className={styles.verifyResultValue}>
                                                <div className={styles.verifyResultAmount}>Rp {Number(tr.amount).toLocaleString('id-ID')}</div>
                                                <div className={styles.verifyResultBadge}>{tr.type === 'accommodation' ? 'Stay' : 'Other'}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>
                        
                        {/* 1. DOCUMENT BASIS */}
                        <section className={styles.formSection}>
                            <h3 className={styles.sectionHeader}>
                                <FileText size={18} />
                                Document Basis
                            </h3>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroupCustom}>
                                    <label>Invoice Number</label>
                                    <input 
                                        type="text" 
                                        value={invoiceNumber} 
                                        onChange={(e) => setInvoiceNumber(e.target.value)}
                                        placeholder="INV-202X-001"
                                    />
                                </div>
                                <div className={styles.formGroupCustom}>
                                    <label>Issued Date</label>
                                    <input 
                                        type="date" 
                                        value={invoiceDate} 
                                        onChange={(e) => setInvoiceDate(e.target.value)}
                                    />
                                </div>
                                <div className={styles.formGroupCustom}>
                                    <label>Service Due Date</label>
                                    <input 
                                        type="date" 
                                        value={dueDate} 
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            <div className={`${styles.formGrid} mt-6`}>
                                <div className={styles.formGroupCustom}>
                                    <label>Check-In</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <input 
                                            className="!pl-10"
                                            type="date" 
                                            value={checkInDate} 
                                            onChange={(e) => setCheckInDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className={styles.formGroupCustom}>
                                    <label>Check-Out</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <input 
                                            className="!pl-10"
                                            type="date" 
                                            value={checkOutDate} 
                                            onChange={(e) => setCheckOutDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 2. RECIPIENT INFO */}
                        <section className={styles.formSection}>
                            <h3 className={styles.sectionHeader}>
                                <User size={18} />
                                Guest Details
                            </h3>
                            <div className="space-y-6">
                                <div className={styles.formGroupCustom}>
                                    <label>Guest Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter full name..."
                                        value={clientName} 
                                        onChange={(e) => setClientName(e.target.value)}
                                    />
                                </div>
                                <div className={styles.formGroupCustom}>
                                    <label>Address / Contact Details</label>
                                    <textarea 
                                        rows={3}
                                        placeholder="Guest address, email, or telephone..."
                                        value={clientDetails} 
                                        onChange={(e) => setClientDetails(e.target.value)}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* 3. LINE ITEMS */}
                        <section className={styles.formSection}>
                            <div className={`flex justify-between items-center ${styles.sectionHeader} !border-none !mb-4`}>
                                <div className="flex items-center gap-3">
                                    <CreditCard size={18} />
                                    <span>Services & Items</span>
                                </div>
                                <button 
                                    onClick={addItem}
                                    className="p-1.5 bg-[var(--sidebar-link-active-bg)] text-[var(--sidebar-link-active-text)] rounded-lg hover:opacity-90 transition-all shadow-sm"
                                    title="Add Item"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <AnimatePresence initial={false}>
                                    {items.map((item) => (
                                        <motion.div 
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className={styles.itemRow}
                                        >
                                            <div className="grid grid-cols-12 gap-3 items-end">
                                                <div className="col-span-12 lg:col-span-6">
                                                    <label className={styles.itemInputLabel}>Description</label>
                                                    <input 
                                                        type="text" 
                                                        value={item.description} 
                                                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                        className={styles.itemInput}
                                                        placeholder="e.g. Deluxe Room Stay"
                                                    />
                                                </div>
                                                <div className="col-span-6 lg:col-span-2">
                                                    <label className={`${styles.itemInputLabel} text-center`}>Qty</label>
                                                    <input 
                                                        type="number" 
                                                        value={item.quantity} 
                                                        onWheel={(e) => e.currentTarget.blur()}
                                                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                                                        className={`${styles.itemInput} text-center`}
                                                    />
                                                </div>
                                                <div className="col-span-6 lg:col-span-3">
                                                    <label className={`${styles.itemInputLabel} text-right`}>Rate</label>
                                                    <input 
                                                        type="number" 
                                                        value={item.rate} 
                                                        onWheel={(e) => e.currentTarget.blur()}
                                                        onChange={(e) => updateItem(item.id, 'rate', Number(e.target.value))}
                                                        className={`${styles.itemInput} text-right`}
                                                    />
                                                </div>
                                                <div className="col-span-12 lg:col-span-1 flex justify-end lg:pb-2 mt-2 lg:mt-0">
                                                    <button 
                                                        onClick={() => removeItem(item.id)}
                                                        className="flex items-center gap-2 text-neutral-400 hover:text-red-500 transition-colors text-[10px] font-semibold uppercase lg:justify-center"
                                                    >
                                                        <Trash2 size={16} />
                                                        <span className="lg:hidden">Remove Item</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                
                                {items.length === 0 && (
                                    <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
                                        <p className="text-gray-400 text-sm italic">No items added. Click + to add services.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 4. DYNAMIC TAX & SERVICE CHARGE */}
                        <section className={styles.formSection}>
                            <h3 className={styles.sectionHeader}>
                                <Percent size={18} />
                                Tax & Service Charge
                            </h3>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroupCustom}>
                                    <label>Service Charge (%)</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        max="100"
                                        step="0.5"
                                        value={serviceRate} 
                                        onWheel={(e) => e.currentTarget.blur()}
                                        onChange={(e) => setServiceRate(e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                                <div className={styles.formGroupCustom}>
                                    <label>Pajak PB1 / Tax (%)</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        max="100"
                                        step="0.5"
                                        value={taxRate} 
                                        onWheel={(e) => e.currentTarget.blur()}
                                        onChange={(e) => setTaxRate(e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* 5. FOOTER NOTES */}
                        <section className={styles.formSection}>
                            <h3 className={styles.sectionHeader}>
                                <Mail size={18} />
                                Additional Notes
                            </h3>

                            <div className={styles.formGroupCustom}>
                                <label>Footer Message</label>
                                <textarea 
                                    rows={2}
                                    placeholder="Thank you for your visit..."
                                    value={notes} 
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </section>
                    </div>
                </div>

                {/* 
                  =======================================================
                  PREVIEW SIDE (right)
                  =======================================================
                */}
                <div className={`${styles.invoicePreviewCard} ${styles.customScrollbar}`}>
                    <div className={styles.previewScaleWrapper}>
                        <InvoicePreview {...previewProps} />
                    </div>
                </div>
            </div>

            {/* Dedicated Native Print Portal attached to document.body (GRC Architecture) */}
            {mounted && createPortal(
                <div id="invoice-native-print-sheet">
                    <InvoicePreview {...previewProps} isPrintPortal={true} />
                </div>,
                document.body
            )}
        </section>
    );
};
