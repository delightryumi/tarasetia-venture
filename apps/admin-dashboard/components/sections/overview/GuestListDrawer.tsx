"use client";

import React from "react";
import { X, User, Calendar, Home, CreditCard, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getChannelLogo } from "./StatCard";

interface GuestListDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    date: string;
    roomType: string;
    bookings: any[];
    onAdd?: (date: string) => void;
}

export function GuestListDrawer({ isOpen, onClose, date, roomType, bookings }: GuestListDrawerProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-[100]"
                    />
                    
                    {/* Drawer */}
                    <motion.div 
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[101] overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-8 bg-stone-50 border-b border-stone-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-[14px] font-black text-stone-900 uppercase tracking-[0.2em]">{roomType}</h2>
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">{date}</p>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-200/50 text-stone-400 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Guest List */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                            <p className="text-[10px] font-bold text-stone-300 uppercase tracking-[0.3em] mb-4">Occupancy Details ({bookings.length})</p>
                            
                            {bookings.map((booking, idx) => (
                                <div key={idx} className="p-6 rounded-2xl border border-stone-100 bg-white shadow-sm space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-sage/10 flex items-center justify-center text-sage relative overflow-hidden">
                                            <User size={20} />
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-lg border border-stone-100 p-1 flex items-center justify-center shadow-sm">
                                                <img src={getChannelLogo(booking.channel)} alt="" className="w-4 h-4 object-contain grayscale opacity-60" onError={(e) => { e.currentTarget.style.display = 'none'; e.stopPropagation(); }} />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-black text-stone-900 uppercase tracking-tight">{booking.guestName || "General Sale"}</p>
                                            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{booking.channel}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-50">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest flex items-center gap-1.5">
                                                <Home size={8} /> Room No
                                            </p>
                                            <p className="text-[11px] font-bold text-stone-800">{booking.roomNumber || "---"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest flex items-center gap-1.5">
                                                <Calendar size={8} /> Duration
                                            </p>
                                            <p className="text-[11px] font-bold text-stone-800">{booking.nights} Nights</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest flex items-center gap-1.5">
                                                <CreditCard size={8} /> Payment
                                            </p>
                                            <p className="text-[11px] font-bold text-stone-800">Rp {Number(booking.amount).toLocaleString('id-ID')}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest">Status</p>
                                            <p className="text-[10px] font-black text-sage uppercase tracking-tighter">{booking.paymentStatus || "Pending"}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {bookings.length === 0 && (
                                <div className="py-20 flex flex-col items-center text-center gap-6">
                                    <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-200">
                                        <PlusCircle size={32} strokeWidth={1} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-stone-300 uppercase tracking-[0.3em]">No active bookings for this slot</p>
                                        <p className="text-[9px] text-stone-400 uppercase tracking-widest mt-1">Ready for a new reservation?</p>
                                    </div>
                                    <button 
                                        onClick={() => { onClose(); onAdd?.(date); }}
                                        className="mt-4 px-10 py-5 bg-[#788069] text-white text-[12px] font-black uppercase tracking-[0.4em] rounded-none shadow-xl shadow-[#788069]/10 hover:brightness-110 transition-all active:scale-95"
                                    >
                                        + Add New Reservation
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-stone-100 bg-stone-50/50">
                            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.2em] text-center">Nexura Operational Ledger View</p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
