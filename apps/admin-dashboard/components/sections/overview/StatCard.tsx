"use client";

import React from "react";
import { motion } from "framer-motion";
import { BedDouble } from "lucide-react";
import { RoomStatusBadge, GuestStatusBadge } from "./StatusPickers";

const CHANNELS = [
    { name: "Traveloka", logo: "/channels/traveloka.png" },
    { name: "Booking.com", logo: "/channels/booking_com.png" },
    { name: "Tiket.com", logo: "/channels/tiket_com.png" },
    { name: "Agoda", logo: "/channels/agoda.png" },
    { name: "Airbnb", logo: "/channels/airbnb.png" },
    { name: "Trip.com", logo: "/channels/trip.png" },
    { name: "Expedia", logo: "/channels/expedia.png" },
    { name: "MG Bedbank", logo: "/channels/mg.png" },
    { name: "Nexura Sales", logo: "/channels/nexura.png" },
    { name: "Walk-in", logo: "/channels/walk_in.png" },
    { name: "Booking Engine", logo: "/channels/nexura.png" },
];

export const getChannelLogo = (name: string) => {
    return CHANNELS.find(c => c.name === name)?.logo || "/channels/walk_in.png";
};

export function StatCard({ icon, label, count, accent, items = [], onItemClick, onStatusUpdate }: any) {
    return (
        <motion.div 
            whileHover={{ y: -8, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{ }}
            className="bg-white p-6 md:p-8 lg:p-12 rounded-xl border border-stone-100 shadow-xl hover:shadow-2xl hover:shadow-stone-200/50 flex flex-col gap-6 cursor-default transition-all duration-300"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-stone-50" style={{ color: accent }}>
                        {icon}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{label}</p>
                </div>
            </div>

            <div>
                <p className="text-4xl font-semibold text-stone-900 font-outfit tracking-tight">{count}</p>
            </div>

            <div className="space-y-4">
                {items.length === 0 ? (
                    <div className="py-4 flex items-center justify-center bg-stone-50/50 rounded-2xl border border-stone-50">
                        <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">No activity</p>
                    </div>
                ) : (
                    items.slice(0, 5).map((item: any, idx: number) => (
                        <button 
                            key={idx}
                            onClick={() => onItemClick?.(item)}
                            className="w-full text-left p-4 hover:bg-stone-50 rounded-2xl transition-all group/item border border-transparent hover:border-stone-100"
                        >
                            <div className="flex justify-between items-center mb-0">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-10 h-10 flex items-center justify-center bg-stone-50 rounded-xl overflow-hidden flex-shrink-0">
                                        <img src={getChannelLogo(item.channel)} alt="" className="w-6 h-6 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.stopPropagation(); }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-[13px] font-bold text-stone-900 uppercase font-outfit truncate">{item.guestName || "General Sale"}</p>
                                            {item.isExtend && (
                                                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[7px] font-black rounded border border-amber-100 uppercase tracking-tighter">Extend</span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                            <div className="flex items-start gap-1.5">
                                                <BedDouble size={10} className="text-stone-300 mt-0.5" />
                                                <div className="flex flex-col">
                                                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest truncate">
                                                        {item.roomType || (item.incomeCategory || '---')}
                                                    </p>
                                                    {item.roomNumber && (
                                                        <p className="text-[8px] font-medium text-stone-300 uppercase tracking-widest">
                                                            Room {item.roomNumber}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {item.type === 'accommodation' && (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1 h-1 rounded-full bg-stone-200" />
                                                    <RoomStatusBadge current={item.roomStatus || 'dirty'} />
                                                    <GuestStatusBadge current={item.guestStatus || 'arriving'} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-4 flex flex-col items-end gap-1">
                                    <p className="text-[12px] font-bold text-stone-900 font-mono-jb leading-none">Rp {Number(item.amount).toLocaleString('id-ID')}</p>
                                    <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${item.paymentStatus?.includes('Lunas') || !item.paymentStatus ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {item.paymentStatus || 'Settled'}
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </motion.div>
    );
}
