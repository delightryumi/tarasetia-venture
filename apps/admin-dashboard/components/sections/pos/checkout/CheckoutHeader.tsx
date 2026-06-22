"use client";

import React from "react";
import { ArrowLeft, User } from "lucide-react";

interface CheckoutHeaderProps {
    onBack: () => void;
    customerName: string;
    tableName?: string;
    isProcessing?: boolean;
}

export const CheckoutHeader: React.FC<CheckoutHeaderProps> = ({
    onBack,
    customerName,
    tableName,
    isProcessing = false
}) => {
    const displayCustomerName = customerName && customerName.trim() !== "" ? customerName : "Tamu Umum (Walk-in)";
    const displayTableName = tableName && tableName.trim() !== "" ? ` • Meja ${tableName}` : "";

    return (
        <header className="w-full h-20 bg-white border-b border-[#D4AF37]/30 shadow-[0_10px_30px_rgba(15,15,18,0.06)] px-6 sm:px-8 flex items-center justify-between flex-shrink-0 sticky top-0 z-50">
            <button 
                onClick={onBack} 
                disabled={isProcessing}
                className="apple-button-pearl flex items-center gap-2 hover:border-[#D4AF37] transition-all shadow-sm disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
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
                <span className="apple-caption font-bold tracking-wider text-white uppercase text-xs truncate max-w-[200px] sm:max-w-xs">
                    {displayCustomerName}{displayTableName}
                </span>
            </div>
        </header>
    );
};
