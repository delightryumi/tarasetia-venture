"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, Banknote, CreditCard, Send, CheckCircle2, Loader2, 
    ArrowLeft, Receipt, User, Utensils, Coins, Sparkles, Printer,
    Calculator, AlertCircle
} from "lucide-react";
import { formatIDR } from "@/lib/pnl-utils";
import { CartItem } from "../types";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    onConfirm: (method: "Cash" | "Card" | "Transfer", customerName: string) => Promise<any>;
    customerName: string;
    setCustomerName?: (name: string) => void;
    tableName?: string;
    setTableName?: (name: string) => void;
    cart?: CartItem[];
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen, onClose, total, onConfirm, customerName,
    tableName, cart = []
}) => {
    const [method, setMethod] = useState<"Cash" | "Card" | "Transfer">("Cash");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [cashReceived, setCashReceived] = useState<string>("");

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setMethod("Cash");
            setCashReceived("");
            setIsSuccess(false);
            setIsProcessing(false);
        }
    }, [isOpen]);

    const numericCashReceived = parseFloat(cashReceived) || 0;
    const changeDue = Math.max(0, numericCashReceived - total);
    const isCashSufficient = method !== "Cash" || numericCashReceived >= total;

    // Calculate Subtotal and Tax based on cart or total
    const calculatedSubtotal = cart.length > 0 
        ? cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        : total / 1.15; // fallback assuming 15% tax & service
    const calculatedTax = calculatedSubtotal * 0.10;
    const calculatedService = calculatedSubtotal * 0.05;

    const handleConfirm = async () => {
        if (method === "Cash" && !isCashSufficient) {
            alert("Jumlah uang tunai yang diterima kurang dari total tagihan.");
            return;
        }

        setIsProcessing(true);
        try {
            await onConfirm(method, customerName);
            setIsSuccess(true);
        } catch (err) {
            console.error(err);
            setIsProcessing(false);
        }
    };

    const handleQuickCash = (amount: number) => {
        setCashReceived(amount.toString());
    };

    const displayCustomerName = customerName && customerName.trim() !== "" ? customerName : "Tamu Umum (Walk-in)";
    const displayTableName = tableName && tableName.trim() !== "" ? ` • Meja ${tableName}` : "";

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[600] bg-[#f4f5f8] flex flex-col overflow-y-auto pos-no-scrollbar selection:bg-[#D4AF37]/30">
                    {/* ── 1. Top Header Bar (md.design / Apple Clean Mode) ── */}
                    <header className="w-full h-20 bg-white border-b border-[#D4AF37]/30 shadow-[0_10px_30px_rgba(15,15,18,0.06)] px-6 sm:px-8 flex items-center justify-between flex-shrink-0 sticky top-0 z-50">
                        <button 
                            onClick={onClose} 
                            disabled={isProcessing}
                            className="apple-button-pearl flex items-center gap-2 hover:border-[#D4AF37] transition-all shadow-sm"
                        >
                            <ArrowLeft size={18} />
                            <span className="font-medium">Kembali ke Kasir</span>
                        </button>

                        <div className="text-center hidden md:block">
                            <h2 className="apple-tagline text-[#0F0F12]">Penyelesaian Pembayaran</h2>
                            <span className="apple-fine-print block mt-0.5">Sistem Kasir Terpadu — Setara Venture</span>
                        </div>

                        {/* Inline Customer & Table Badge */}
                        <div className="bg-[#0F0F12] border border-[#D4AF37]/50 px-5 py-2 rounded-full flex items-center gap-2 shadow-md">
                            <User size={14} className="text-[#D4AF37]" />
                            <span className="apple-caption font-bold tracking-wider text-white uppercase text-xs">
                                {displayCustomerName}{displayTableName}
                            </span>
                        </div>
                    </header>

                    {/* ── 2. Main Layout Split Panel (md.design Island) ── */}
                    <main className="flex-1 p-4 sm:p-8 md:p-12 flex items-center justify-center min-h-[calc(100vh-80px)]">
                        {isSuccess ? (
                            /* ── Fullscreen Success State (md.design) ── */
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full max-w-2xl bg-white rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-[#D4AF37]/30 p-12 text-center space-y-8 my-auto"
                            >
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                    className="w-24 h-24 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-inner"
                                >
                                    <CheckCircle2 size={56} strokeWidth={2} />
                                </motion.div>

                                <div className="space-y-2">
                                    <h3 className="apple-display-md text-[#0F0F12]">Pembayaran Berhasil!</h3>
                                    <p className="apple-body text-[#7a7a7a]">Transaksi atas nama <span className="apple-body-strong text-[#0F0F12]">{displayCustomerName}</span> telah berhasil dicatat ke dalam sistem.</p>
                                </div>

                                <div className="bg-[#f6f6f8] rounded-[18px] p-6 max-w-md mx-auto border border-[#e0e0e0] space-y-3 text-left shadow-sm">
                                    <div className="flex justify-between apple-caption text-[#7a7a7a]">
                                        <span>Metode Pembayaran</span>
                                        <span className="apple-body-strong text-[#0F0F12] uppercase">{method}</span>
                                    </div>
                                    <div className="flex justify-between apple-caption text-[#7a7a7a]">
                                        <span>Total Tagihan</span>
                                        <span className="apple-body-strong text-[#0F0F12]">{formatIDR(total)}</span>
                                    </div>
                                    {method === "Cash" && (
                                        <>
                                            <div className="flex justify-between apple-caption text-[#7a7a7a]">
                                                <span>Tunai Diterima</span>
                                                <span className="apple-body-strong text-emerald-600">{formatIDR(numericCashReceived)}</span>
                                            </div>
                                            <div className="pt-3 border-t border-[#e0e0e0] flex justify-between items-baseline">
                                                <span className="apple-body-strong text-[#0F0F12]">Uang Kembalian</span>
                                                <span className="apple-tagline font-bold text-[#D4AF37]">{formatIDR(changeDue)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                    <button 
                                        onClick={() => alert("Mencetak nota kasir fisik...")}
                                        className="apple-button-secondary-pill flex items-center justify-center gap-2 font-medium shadow-sm"
                                    >
                                        <Printer size={20} />
                                        <span>Cetak Nota Kasir</span>
                                    </button>
                                    <button 
                                        onClick={onClose}
                                        className="apple-button-primary flex items-center justify-center gap-2 font-medium shadow-md"
                                    >
                                        <Sparkles size={20} />
                                        <span>Selesai & Transaksi Baru</span>
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            /* ── Standalone md.design Split-Panel Workspace (md:grid-cols-2) ── */
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="w-full max-w-6xl bg-white rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-[#D4AF37]/30 grid grid-cols-1 md:grid-cols-2 overflow-hidden my-auto min-h-[600px]"
                            >
                                {/* ── Left Panel: Rincian Pesanan & Akuntansi (md:col-span-1) ── */}
                                <div className="bg-[#f8f9fa] p-8 md:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#e0e0e0]">
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex items-center gap-2 text-[#7a7a7a] mb-1">
                                                <Receipt size={18} className="text-[#D4AF37]" />
                                                <span className="apple-fine-print uppercase tracking-wider font-bold">Rincian Tiket Kasir</span>
                                            </div>
                                            <h3 className="apple-lead font-bold text-[#0F0F12]">Daftar Pesanan</h3>
                                        </div>

                                        {/* Daftar Item Pesanan (Clean & Elegant Table) */}
                                        <div className="bg-white rounded-[20px] p-6 border border-[#e0e0e0] shadow-sm flex flex-col overflow-hidden space-y-4">
                                            <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-3 apple-fine-print uppercase tracking-wider font-bold text-[#7a7a7a]">
                                                <span>Item Menu ({cart.length})</span>
                                                <span>Subtotal</span>
                                            </div>

                                            <div className="max-h-[260px] overflow-y-auto pos-scrollbar pr-2 space-y-3">
                                                {cart.length === 0 ? (
                                                    <p className="apple-caption text-[#7a7a7a] italic py-6 text-center">Belum ada item pesanan di dalam tiket.</p>
                                                ) : (
                                                    cart.map((item) => (
                                                        <div key={item.cartItemId} className="flex items-center justify-between py-2 border-b border-[#e0e0e0]/60 last:border-0">
                                                            <div className="flex-1 pr-4">
                                                                <span className="apple-body-strong block truncate text-[15px]">{item.name}</span>
                                                                <span className="apple-fine-print text-[#7a7a7a]">{item.quantity}x @ {formatIDR(item.price)}</span>
                                                            </div>
                                                            <span className="apple-body-strong text-[#0F0F12]">{formatIDR(item.price * item.quantity)}</span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* md.design Order Summary Footer & Grand Total Banner */}
                                    <div className="pt-6 border-t border-[#e0e0e0] space-y-4 mt-6">
                                        <div className="space-y-2 apple-caption text-[#7a7a7a]">
                                            <div className="flex justify-between">
                                                <span>Subtotal</span>
                                                <span className="apple-body-strong text-[#0F0F12]">{formatIDR(calculatedSubtotal)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Pajak PB1 (10%)</span>
                                                <span className="apple-body-strong text-[#0F0F12]">{formatIDR(calculatedTax)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Layanan / Service (5%)</span>
                                                <span className="apple-body-strong text-[#0F0F12]">{formatIDR(calculatedService)}</span>
                                            </div>
                                        </div>

                                        {/* Grand Total Banner */}
                                        <div className="bg-white rounded-[16px] p-5 border border-[#D4AF37]/40 shadow-[0_4px_20px_rgba(212,175,55,0.08)] flex items-center justify-between">
                                            <span className="apple-caption text-[#7a7a7a] uppercase tracking-wider font-bold">Total Pembayaran</span>
                                            <span className="apple-display-md text-[#0066cc] tracking-tight">{formatIDR(total)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Right Panel: Pilihan Metode Bayar & Tender (md:col-span-1) ── */}
                                <div className="p-8 md:p-12 flex flex-col justify-between bg-white space-y-8">
                                    <div className="space-y-8">
                                        <div>
                                            <span className="apple-fine-print text-[#D4AF37] uppercase tracking-wider block mb-1 font-bold">Langkah Pembayaran</span>
                                            <h3 className="apple-lead font-bold text-[#0F0F12]">Metode & Kalkulasi</h3>
                                        </div>

                                        {/* 1. Payment Method Selector Tabs (md.design Style) */}
                                        <div className="space-y-4">
                                            <span className="apple-caption text-[#7a7a7a] uppercase tracking-wider font-bold block">1. Pilih Metode Pembayaran</span>
                                            <div className="grid grid-cols-3 gap-4">
                                                {[
                                                    { id: 'Cash', icon: <Banknote size={26} />, label: 'Tunai (Cash)', desc: 'Bayar di kasir' },
                                                    { id: 'Card', icon: <CreditCard size={26} />, label: 'Kartu (Card)', desc: 'Debit / Kredit' },
                                                    { id: 'Transfer', icon: <Send size={26} />, label: 'QRIS / Transfer', desc: 'E-Wallet / Bank' }
                                                ].map((m) => (
                                                    <button 
                                                        key={m.id}
                                                        onClick={() => setMethod(m.id as any)}
                                                        className={`flex flex-col items-center justify-center gap-2 p-5 rounded-[18px] border transition-all text-center ${
                                                            method === m.id 
                                                                ? "bg-[#1d1d1f] text-white border-[#D4AF37] shadow-[0_8px_25px_rgba(212,175,55,0.25)] scale-[1.03]" 
                                                                : "bg-white border-[#e0e0e0] text-[#7a7a7a] hover:border-[#cccccc] hover:text-[#1d1d1f] shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
                                                        }`}
                                                    >
                                                        <div className={method === m.id ? "text-[#D4AF37]" : "text-[#7a7a7a]"}>
                                                            {m.icon}
                                                        </div>
                                                        <span className="apple-caption font-bold uppercase tracking-wider block">{m.label}</span>
                                                        <span className={`apple-fine-print ${method === m.id ? 'text-stone-300' : 'text-[#7a7a7a]'}`}>{m.desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 2. Tender Input / Cash Calculator (md.design Style) */}
                                        {method === "Cash" && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="bg-[#f6f6f8] rounded-[20px] p-6 sm:p-8 border border-[#e0e0e0] space-y-6 overflow-hidden shadow-inner"
                                            >
                                                <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-4">
                                                    <div className="flex items-center gap-2 text-[#0F0F12]">
                                                        <Calculator size={20} className="text-[#D4AF37]" />
                                                        <span className="apple-caption uppercase tracking-wider font-bold">2. Kalkulasi Uang Tunai (Tender)</span>
                                                    </div>
                                                    <span className="apple-fine-print bg-white px-3 py-1 rounded-full border border-[#e0e0e0] font-bold text-[#737380] shadow-sm">IDR Currency</span>
                                                </div>

                                                {/* Tendered Amount Input Box */}
                                                <div className="space-y-2">
                                                    <label className="apple-fine-print text-[#7a7a7a] uppercase tracking-wider font-bold block">Jumlah Uang Diterima (Rp)</label>
                                                    <div className="relative w-full group bg-white border border-[#D4AF37]/40 shadow-[0_4px_12px_rgba(15,15,18,0.04),_inset_0_2px_4px_rgba(255,255,255,0.9)] flex items-center h-14 rounded-[14px] focus-within:border-[#D4AF37] focus-within:shadow-[0_0_20px_rgba(212,175,55,0.25)] transition-all">
                                                        <input 
                                                            type="number"
                                                            value={cashReceived}
                                                            onChange={(e) => setCashReceived(e.target.value)}
                                                            placeholder="Masukkan uang tunai yang dibayarkan tamu..."
                                                            className="w-full h-full bg-transparent px-4 apple-body font-bold text-[#0F0F12] focus:outline-none rounded-[14px]"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Quick Cash Denomination Grid (md.design Style) */}
                                                <div className="space-y-3">
                                                    <span className="apple-fine-print text-[#7a7a7a] uppercase tracking-wider font-bold block">Pecahan Uang Cepat (Quick Cash):</span>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                                        {[
                                                            { label: "Uang Pas", val: total },
                                                            { label: "Rp 50.000", val: 50000 },
                                                            { label: "Rp 100.000", val: 100000 },
                                                            { label: "Rp 150.000", val: 150000 },
                                                            { label: "Rp 200.000", val: 200000 },
                                                            { label: "Rp 500.000", val: 500000 },
                                                            { label: "Rp 1.000k", val: 1000000 }
                                                        ].map((btn, idx) => (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() => handleQuickCash(btn.val)}
                                                                className="apple-button-pearl flex items-center justify-center font-medium text-[#121214] hover:bg-[#1d1d1f] hover:text-[#D4AF37] hover:border-[#1d1d1f] transition-all shadow-sm truncate"
                                                            >
                                                                {btn.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Real-time Change Due Display */}
                                                <div className="pt-4 border-t border-[#e0e0e0] flex items-center justify-between bg-white p-5 rounded-[16px] border border-[#e0e0e0] shadow-sm">
                                                    <span className="apple-body-strong text-[#737380]">Uang Kembalian (Change Due):</span>
                                                    <span className={`apple-tagline font-bold ${changeDue > 0 ? 'text-[#D4AF37]' : 'text-[#0F0F12]'}`}>
                                                        {formatIDR(changeDue)}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* ── 3. Action Button at the Bottom (md.design Style) ── */}
                                    <div className="pt-6 border-t border-[#e0e0e0]">
                                        <button 
                                            onClick={handleConfirm}
                                            disabled={isProcessing || (method === "Cash" && !isCashSufficient)}
                                            className="apple-button-primary w-full py-4 text-base font-medium justify-center shadow-[0_8px_25px_rgba(0,102,204,0.3)] transition-all"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <Loader2 size={20} className="animate-spin text-white" />
                                                    <span>Memproses Pembayaran...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 size={20} className="text-white" />
                                                    <span>Konfirmasi Pembayaran ({formatIDR(total)})</span>
                                                </>
                                            )}
                                        </button>
                                        {method === "Cash" && !isCashSufficient && numericCashReceived > 0 && (
                                            <p className="text-center text-rose-500 apple-caption font-bold mt-3 flex items-center justify-center gap-1">
                                                <AlertCircle size={14} />
                                                <span>Pembayaran tunai belum mencukupi total tagihan pesanan.</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </main>
                </div>
            )}
        </AnimatePresence>
    );
};
