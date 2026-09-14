"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ShoppingCart, Trash2, Clock, User, Hash,
    Minus, Plus, ArrowRight, FileText
} from "lucide-react";
import { formatIDR } from "@/lib/pnl-utils";
import { CartItem } from "../types";

interface CartSidebarProps {
    cart: CartItem[];
    customerName: string;
    setCustomerName: (name: string) => void;
    tableName?: string;
    setTableName?: (name: string) => void;
    notes?: string;
    setNotes?: (notes: string) => void;
    ticketNumber?: string;
    clearCart: () => void;
    updateQuantity: (id: string, delta: number) => void;
    subtotal: number;
    tax: number;
    total: number;
    onCheckout: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
    cart, customerName, setCustomerName,
    tableName, setTableName, notes, setNotes,
    ticketNumber = "TRX-001", clearCart, updateQuantity,
    subtotal, tax, total, onCheckout
}) => (

    <aside className="w-full bg-transparent flex flex-col flex-1 overflow-hidden min-h-0">
        {/* Apple Parchment Ticket Header */}
        <div className="flex-shrink-0" style={{ padding: '2rem 2rem 1rem 2rem' }}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Clock size={14} className="text-[#7a7a7a]" />
                        <span className="apple-fine-print uppercase tracking-wider">Ticket #{ticketNumber}</span>
                    </div>
                    <h3 className="apple-display-md text-2xl font-bold tracking-tight">Active Ticket</h3>
                </div>
                <button 
                    onClick={clearCart}
                    className="pos-3d-button w-11 h-11 p-0 flex items-center justify-center text-[#737380] hover:text-[#ff3b30]"
                    title="Clear Ticket"
                >
                    <Trash2 size={18} strokeWidth={2} />
                </button>
            </div>

            {/* Floating Island Card untuk Tamu, Meja & Catatan (Spacious & Mengambang) */}
            <div className="bg-[#f0f0f4]/80 backdrop-blur-md border border-[#d1d1d6] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] mt-4 mb-2" style={{ padding: '1.25rem' }}>
                <div className="grid grid-cols-2 gap-4">
                    <div className="relative w-full group bg-white border border-[#e0e0e0] shadow-sm flex items-center h-12 rounded-xl transition-all hover:border-[#D4AF37]/60 focus-within:border-[#D4AF37] focus-within:shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#737380] group-focus-within:text-[#0F0F12] transition-colors z-10">
                            <User size={18} strokeWidth={2.5} />
                        </div>
                        <input 
                            type="text"
                            placeholder="Nama Tamu..."
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full h-full bg-transparent pr-4 text-[#121214] focus:outline-none transition-all placeholder:text-[#a0a0b0] rounded-xl text-sm font-medium"
                            style={{ paddingLeft: '2.8rem' }}
                        />
                    </div>
                    <div className="relative w-full group bg-white border border-[#e0e0e0] shadow-sm flex items-center h-12 rounded-xl transition-all hover:border-[#D4AF37]/60 focus-within:border-[#D4AF37] focus-within:shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#737380] group-focus-within:text-[#0F0F12] transition-colors z-10">
                            <Hash size={18} strokeWidth={2.5} />
                        </div>
                        <input 
                            type="text"
                            placeholder="Meja / Kamar..."
                            value={tableName || ""}
                            onChange={(e) => setTableName?.(e.target.value)}
                            className="w-full h-full bg-transparent pr-4 text-[#121214] focus:outline-none transition-all placeholder:text-[#a0a0b0] rounded-xl text-sm font-medium"
                            style={{ paddingLeft: '2.8rem' }}
                        />
                    </div>
                </div>

                {/* Notes Input (Dengan jarak pemisah inline yang pasti dan presisi) */}
                <div style={{ marginTop: '1.25rem' }}>
                    <div className="relative w-full group bg-white border border-[#e0e0e0] shadow-sm flex items-center h-12 rounded-xl transition-all hover:border-[#D4AF37]/60 focus-within:border-[#D4AF37] focus-within:shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#737380] group-focus-within:text-[#0F0F12] transition-colors z-10">
                            <FileText size={18} strokeWidth={2.5} />
                        </div>
                        <input 
                            type="text"
                            placeholder="Catatan pesanan (opsional)..."
                            value={notes || ""}
                            onChange={(e) => setNotes?.(e.target.value)}
                            className="w-full h-full bg-transparent pr-4 text-[#121214] focus:outline-none transition-all placeholder:text-[#a0a0b0] rounded-xl text-sm font-medium"
                            style={{ paddingLeft: '2.8rem' }}
                        />
                    </div>
                </div>
            </div>

            {/* Garis Pemisah Tegas antara Form Input dan Daftar Menu */}
            <div className="w-full flex items-center gap-4 my-6">
                <div className="h-px bg-[#e0e0e0] flex-1" />
                <span className="apple-fine-print uppercase tracking-widest text-[#a0a0b0] font-semibold">Order Items</span>
                <div className="h-px bg-[#e0e0e0] flex-1" />
            </div>
        </div>

        {/* Ticket Items List */}
        <div className="flex-1 overflow-y-auto space-y-4 pos-scrollbar min-h-0" style={{ padding: '0 2rem 1rem 2rem' }}>
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16">
                    <div className="w-16 h-16 rounded-full bg-white border border-[#e0e0e0] flex items-center justify-center text-[#cccccc]">
                        <ShoppingCart size={28} strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1">
                        <p className="apple-body-strong text-lg font-semibold">Your ticket is empty.</p>
                        <p className="apple-caption text-[#7a7a7a] max-w-[240px] mx-auto">Select products from the catalog to build your custom reservation.</p>
                    </div>
                </div>
            ) : (
                <AnimatePresence initial={false}>
                    {cart.map((item) => (
                        <motion.div 
                            key={item.cartItemId}
                            initial={{ opacity: 0, y: 15, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 50, scale: 0.95 }}
                            className="bg-white border border-[#e0e0e0] rounded-[18px] p-4.5 flex items-center justify-between gap-4 transition-all hover:border-[#cccccc] shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                        >
                            {/* Item Thumbnail */}
                            <div className="w-14 h-14 rounded-[10px] bg-[#fafafc] overflow-hidden flex-shrink-0 border border-[#e0e0e0]">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>

                            {/* Item Details */}
                            <div className="flex-1 min-w-0">
                                <span className="apple-fine-print uppercase tracking-wider block mb-0.5 text-[#7a7a7a]">
                                    {item.category}
                                </span>
                                <h5 className="apple-body-strong truncate text-[16px] leading-snug font-semibold">
                                    {item.name}
                                </h5>
                                <p className="apple-body text-sm text-[#7a7a7a] mt-0.5 font-medium">
                                    {formatIDR(item.price)}
                                </p>
                            </div>

                            {/* Quantity Controllers */}
                            <div className="flex items-center gap-2 bg-[#fafafc] border border-[#e0e0e0] rounded-full p-1 shadow-sm">
                                <button 
                                    onClick={() => updateQuantity(item.cartItemId, -1)}
                                    className="w-8 h-8 rounded-full bg-white hover:bg-[#f0f0f0] text-[#1d1d1f] flex items-center justify-center font-bold transition-colors border border-[#e0e0e0] shadow-sm"
                                    title="Decrease Quantity"
                                >
                                    <Minus size={14} strokeWidth={2} />
                                </button>
                                <span className="w-6 text-center apple-caption font-bold text-[#1d1d1f] text-sm">
                                    {item.quantity}
                                </span>
                                <button 
                                    onClick={() => updateQuantity(item.cartItemId, 1)}
                                    className="w-8 h-8 rounded-full bg-white hover:bg-[#f0f0f0] text-[#1d1d1f] flex items-center justify-center font-bold transition-colors border border-[#e0e0e0] shadow-sm"
                                    title="Increase Quantity"
                                >
                                    <Plus size={14} strokeWidth={2} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            )}
        </div>

        {/* Apple Clean Mode Ticket Footer */}
        <div className="p-6 md:p-8 bg-transparent border-t border-[#e0e0e0]/40 space-y-6 flex-shrink-0 mt-auto">
            <div className="space-y-3.5">
                <div className="flex justify-between items-center apple-caption text-[#7a7a7a] text-sm">
                    <span>Gross Amount</span>
                    <span className="text-[#1d1d1f] font-semibold">{formatIDR(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center apple-caption text-[#7a7a7a] text-sm">
                    <span>Service Tax (10%)</span>
                    <span className="text-[#1d1d1f] font-semibold">{formatIDR(tax)}</span>
                </div>
                <div className="h-px bg-[#e0e0e0] w-full my-4" />
                <div className="flex justify-between items-baseline pt-1">
                    <span className="apple-body-strong text-lg font-bold">Total Due</span>
                    <span className="apple-display-md text-2xl font-bold text-[#0066cc]">{formatIDR(total)}</span>
                </div>
            </div>

            <button 
                disabled={cart.length === 0}
                onClick={onCheckout}
                className="apple-button-primary w-full py-4.5 text-base font-semibold justify-center shadow-[0_8px_25px_rgba(0,102,204,0.25)] hover:shadow-[0_12px_30px_rgba(0,102,204,0.35)] transition-all rounded-[16px]"
            >
                <span>Reserve Ticket</span>
                <ArrowRight size={18} />
            </button>
        </div>
    </aside>
);
