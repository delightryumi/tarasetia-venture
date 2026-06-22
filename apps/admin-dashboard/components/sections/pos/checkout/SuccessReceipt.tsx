"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Printer, Sparkles } from "lucide-react";
import { formatIDR } from "@/lib/pnl-utils";

interface SuccessReceiptProps {
    customerName: string;
    method: string;
    total: number;
    cashReceived: number;
    changeDue: number;
    onNewTransaction: () => void;
}

export const SuccessReceipt: React.FC<SuccessReceiptProps> = ({
    customerName,
    method,
    total,
    cashReceived,
    changeDue,
    onNewTransaction
}) => {
    const displayCustomerName = customerName && customerName.trim() !== "" ? customerName : "Tamu Umum (Walk-in)";

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-white rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-[#D4AF37]/30 p-8 sm:p-12 text-center space-y-8 my-auto mx-auto"
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
                <p className="apple-body text-[#7a7a7a]">
                    Transaksi atas nama <span className="apple-body-strong text-[#0F0F12]">{displayCustomerName}</span> telah berhasil dicatat ke dalam sistem.
                </p>
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
                            <span className="apple-body-strong text-emerald-600">{formatIDR(cashReceived)}</span>
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
                    className="apple-button-secondary-pill flex items-center justify-center gap-2 font-medium shadow-sm cursor-pointer"
                >
                    <Printer size={20} />
                    <span>Cetak Nota Kasir</span>
                </button>
                <button 
                    onClick={onNewTransaction}
                    className="apple-button-primary flex items-center justify-center gap-2 font-medium shadow-md cursor-pointer"
                >
                    <Sparkles size={20} />
                    <span>Selesai & Transaksi Baru</span>
                </button>
            </div>
        </motion.div>
    );
};
