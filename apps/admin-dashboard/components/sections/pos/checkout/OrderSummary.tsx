"use client";

import React from "react";
import { Receipt } from "lucide-react";
import { formatIDR } from "@/lib/pnl-utils";
import { CartItem } from "../types";


interface OrderSummaryProps {
    cart: CartItem[];
    subtotal: number;
    tax: number;
    service: number;
    total: number;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
    cart,
    subtotal,
    tax,
    service,
    total
}) => {
    return (
        <div className="bg-[#f8f9fa] p-8 md:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#e0e0e0] h-full">
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

                    <div className="max-h-[280px] overflow-y-auto pos-scrollbar pr-2 space-y-3">
                        {cart.length === 0 ? (
                            <p className="apple-caption text-[#7a7a7a] italic py-6 text-center">Belum ada item pesanan di dalam tiket.</p>
                        ) : (
                            cart.map((item) => (
                                <div key={item.cartItemId} className="flex items-center justify-between py-2.5 border-b border-[#e0e0e0]/60 last:border-0 gap-4">
                                    <div className="flex-1 pr-2 min-w-0">
                                        <span className="apple-body-strong block truncate text-[15px]">{item.name}</span>
                                        <span className="apple-fine-print text-[#7a7a7a]">{item.quantity}x @ {formatIDR(item.price)}</span>
                                    </div>
                                    <span className="apple-body-strong text-[#0F0F12] flex-shrink-0">{formatIDR(item.price * item.quantity)}</span>
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
                        <span className="apple-body-strong text-[#0F0F12]">{formatIDR(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Pajak PB1 (10%)</span>
                        <span className="apple-body-strong text-[#0F0F12]">{formatIDR(tax)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Layanan / Service (5%)</span>
                        <span className="apple-body-strong text-[#0F0F12]">{formatIDR(service)}</span>
                    </div>
                </div>

                {/* Grand Total Banner */}
                <div className="bg-white rounded-[16px] p-5 border border-[#D4AF37]/40 shadow-[0_4px_20px_rgba(212,175,55,0.08)] flex items-center justify-between">
                    <span className="apple-caption text-[#7a7a7a] uppercase tracking-wider font-bold">Total Pembayaran</span>
                    <span className="apple-display-md text-[#0066cc] tracking-tight">{formatIDR(total)}</span>
                </div>
            </div>
        </div>
    );
};
