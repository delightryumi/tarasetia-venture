import React from "react";
import { Plus, Trash2, Printer, Calculator, FileText, User, Mail, CreditCard, Calendar, Search } from "lucide-react";
import { useInvoice } from "./useInvoice";
import { InvoicePreview } from "./InvoicePreview";
import { motion, AnimatePresence } from "framer-motion";
import overviewStyles from "../overview/OverviewStyles.module.css";
import "./invoice.css";

export const InvoiceSection = () => {
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
        notes, setNotes,
        subtotal, total, handlePrint, handleDownload,
        transactions, selectTransaction, searchTransactions, searching
    } = useInvoice();

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-off-white">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-[var(--sidebar-link-active-bg)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[var(--sidebar-text)] font-semibold uppercase text-xs tracking-wider animate-pulse">Loading Invoice System...</p>
            </div>
        </div>
    );

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
                            className="btn-invoice-action primary-peach"
                            style={{ height: '36px', padding: '0 16px', borderRadius: '8px', fontSize: '12px' }}
                        >
                            <Printer size={16} />
                            Print Receipt
                        </motion.button>
                    </div>
                </div>
            </header>

            <div className="invoice-container !pt-4">
                {/* 
                  =======================================================
                  FORM SIDE (left)
                  =======================================================
                */}
                <div className="invoice-form-card custom-scrollbar">
                    <div className="space-y-12">
                        
                        <section className="form-section verify-guest-section">
                            <h3 className="section-header">
                                Verify & Link Guest
                            </h3>
                            <div className="verify-guest-container">
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

                                <div className="verify-results-list custom-scrollbar">
                                    {transactions.length === 0 && !searching && <p className="verify-helper-text">Ketik nama tamu untuk mencari data asli dari sistem...</p>}
                                    {transactions.map((tr, i) => (
                                        <button
                                            key={i}
                                            onClick={() => selectTransaction(tr)}
                                            className="verify-result-btn"
                                        >
                                            <div className="verify-result-info">
                                                <div className="verify-result-name">{tr.guestName || tr.incomeCategory}</div>
                                                <div className="verify-result-meta">{tr.checkInDate || new Date(tr.timestamp).toLocaleDateString()} — {tr.channel || 'Internal'}</div>
                                            </div>
                                            <div className="verify-result-value">
                                                <div className="verify-result-amount">Rp {Number(tr.amount).toLocaleString('id-ID')}</div>
                                                <div className="verify-result-badge">{tr.type === 'accommodation' ? 'Stay' : 'Other'}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>
                        
                        {/* 1. DOCUMENT BASIS */}
                        <section className="form-section">
                            <h3 className="section-header">
                                <FileText size={18} />
                                Document Basis
                            </h3>
                            <div className="form-grid">
                                <div className="form-group-custom">
                                    <label>Invoice Number</label>
                                    <input 
                                        type="text" 
                                        value={invoiceNumber} 
                                        onChange={(e) => setInvoiceNumber(e.target.value)}
                                        placeholder="INV-202X-001"
                                    />
                                </div>
                                <div className="form-group-custom">
                                    <label>Issued Date</label>
                                    <input 
                                        type="date" 
                                        value={invoiceDate} 
                                        onChange={(e) => setInvoiceDate(e.target.value)}
                                    />
                                </div>
                                <div className="form-group-custom">
                                    <label>Service Due Date</label>
                                    <input 
                                        type="date" 
                                        value={dueDate} 
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-grid mt-6">
                                <div className="form-group-custom">
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
                                <div className="form-group-custom">
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
                        <section className="form-section">
                            <h3 className="section-header">
                                <User size={18} />
                                Guest Details
                            </h3>
                            <div className="space-y-6">
                                <div className="form-group-custom">
                                    <label>Guest Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter full name..."
                                        value={clientName} 
                                        onChange={(e) => setClientName(e.target.value)}
                                    />
                                </div>
                                <div className="form-group-custom">
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
                        <section className="form-section">
                            <div className="flex justify-between items-center section-header !border-none !mb-4">
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
                                            className="item-row"
                                        >
                                            <div className="grid grid-cols-12 gap-3 items-end">
                                                <div className="col-span-12 lg:col-span-6">
                                                    <label className="item-input-label">Description</label>
                                                    <input 
                                                        type="text" 
                                                        value={item.description} 
                                                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                        className="item-input"
                                                        placeholder="e.g. Deluxe Room Stay"
                                                    />
                                                </div>
                                                <div className="col-span-6 lg:col-span-2">
                                                    <label className="item-input-label text-center">Qty</label>
                                                    <input 
                                                        type="number" 
                                                        value={item.quantity} 
                                                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                                                        className="item-input text-center"
                                                    />
                                                </div>
                                                <div className="col-span-6 lg:col-span-3">
                                                    <label className="item-input-label text-right">Rate</label>
                                                    <input 
                                                        type="number" 
                                                        value={item.rate} 
                                                        onChange={(e) => updateItem(item.id, 'rate', Number(e.target.value))}
                                                        className="item-input text-right"
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

                        {/* 4. FOOTER NOTES */}
                        <section className="form-section">
                            <h3 className="section-header">
                                <Mail size={18} />
                                Additional Notes
                            </h3>

                            <div className="form-group-custom">
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
                <div className="invoice-preview-card custom-scrollbar">
                    <InvoicePreview 
                        branding={branding}
                        invoiceNumber={invoiceNumber}
                        invoiceDate={invoiceDate}
                        dueDate={dueDate}
                        checkInDate={checkInDate}
                        checkOutDate={checkOutDate}
                        clientName={clientName}
                        clientDetails={clientDetails}
                        items={items}
                        notes={notes}
                        subtotal={subtotal}
                        total={total}
                    />
                </div>
            </div>
        </section>
    );
};
