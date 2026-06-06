"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, User, CreditCard, Home, MessageSquare, Globe, Info } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, setDoc, arrayUnion, collection, getDocs } from "firebase/firestore";
import { toast } from "sonner";

interface AddGuestModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: string;
}

export const AddGuestModal: React.FC<AddGuestModalProps> = ({ isOpen, onClose, selectedDate }) => {
    const [loading, setLoading] = useState(false);
    const [roomTypes, setRoomTypes] = useState<string[]>([]);
    
    const [formData, setFormData] = useState({
        guestName: "",
        channel: "Walk-in",
        roomType: "",
        notes: "",
        amount: "",
        status: "Lunas",
        source: "Direct",
        paidCash: "0",
        paidTransfer: "0",
        feePercentage: "0"
    });

    useEffect(() => {
        const fetchRoomTypes = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "roomTypes"));
                const types = querySnapshot.docs.map(doc => doc.data().name || doc.id);
                setRoomTypes(types);
                if (types.length > 0 && !formData.roomType) {
                    setFormData(prev => ({ ...prev, roomType: types[0] }));
                }
            } catch (err) {
                console.error("Error fetching room types:", err);
            }
        };
        if (isOpen) fetchRoomTypes();
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const hotelId = "bumi-anyom-resort";
            const docId = `${hotelId}_${selectedDate}`;
            
            const checkInD = new Date(selectedDate);
            const checkOutD = new Date(checkInD);
            checkOutD.setDate(checkOutD.getDate() + 1);
            
            const yyyy = checkOutD.getFullYear();
            const mm = String(checkOutD.getMonth() + 1).padStart(2, '0');
            const dd = String(checkOutD.getDate()).padStart(2, '0');
            const checkOutDateStr = `${yyyy}-${mm}-${dd}`;

            const now = new Date();
            const todayY = now.getFullYear();
            const todayM = String(now.getMonth() + 1).padStart(2, '0');
            const todayD = String(now.getDate()).padStart(2, '0');
            const todayStr = `${todayY}-${todayM}-${todayD}`;

            const isCancelled = formData.status === "CANCELLED";

            const newEntry = {
                ...formData,
                amount: Number(formData.amount),
                paidCash: Number(formData.paidCash),
                paidTransfer: Number(formData.paidTransfer),
                feePercentage: Number(formData.feePercentage),
                timestamp: new Date().toISOString(),
                bookingId: `TRX-${Date.now().toString().slice(-6)}`,
                checkInDate: selectedDate,
                checkOutDate: checkOutDateStr,
                type: "accommodation",
                cancelledAt: isCancelled ? todayStr : null
            };

            const docRef = doc(db, "daily_revenue", docId);
            await setDoc(docRef, {
                entries: arrayUnion(newEntry),
                lastUpdated: new Date().toISOString(),
                date: selectedDate
            }, { merge: true });

            toast.success("Tamu berhasil ditambahkan!");
            onClose();
            setFormData({
                guestName: "",
                channel: "Walk-in",
                roomType: roomTypes[0] || "",
                notes: "",
                amount: "",
                status: "Lunas",
                source: "Direct",
                paidCash: "0",
                paidTransfer: "0",
                feePercentage: "0"
            });
        } catch (err) {
            console.error("Error adding guest:", err);
            toast.error("Gagal menambahkan tamu.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-stone-900 tracking-tight">Add New Guest</h2>
                            <p className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mt-1">Input transaction for {selectedDate}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-stone-200/50 rounded-xl transition-colors text-stone-400">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Guest Name */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                    <User size={12} /> Detail Tamu
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Nama Lengkap Tamu"
                                    value={formData.guestName}
                                    onChange={e => setFormData({ ...formData, guestName: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl border border-stone-200 bg-stone-50/30 focus:bg-white focus:border-stone-900 focus:ring-0 transition-all outline-none text-sm font-medium"
                                />
                            </div>

                            {/* Channel */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                    <Globe size={12} /> Channel
                                </label>
                                <select
                                    value={formData.channel}
                                    onChange={e => setFormData({ ...formData, channel: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl border border-stone-200 bg-stone-50/30 focus:bg-white focus:border-stone-900 focus:ring-0 transition-all outline-none text-sm font-medium appearance-none"
                                >
                                    <option>Walk-in</option>
                                    <option>Website</option>
                                    <option>Traveloka</option>
                                    <option>Tiket.com</option>
                                    <option>Booking.com</option>
                                    <option>Agoda</option>
                                    <option>Airbnb</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            {/* Room Type */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                    <Home size={12} /> Room Category
                                </label>
                                <select
                                    value={formData.roomType}
                                    onChange={e => setFormData({ ...formData, roomType: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl border border-stone-200 bg-stone-50/30 focus:bg-white focus:border-stone-900 focus:ring-0 transition-all outline-none text-sm font-medium appearance-none"
                                >
                                    {roomTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Amount */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                    <CreditCard size={12} /> Total Amount (Gross)
                                </label>
                                <input
                                    required
                                    type="number"
                                    placeholder="Contoh: 500000"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl border border-stone-200 bg-stone-50/30 focus:bg-white focus:border-stone-900 focus:ring-0 transition-all outline-none text-sm font-medium"
                                />
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                    <Info size={12} /> Status Pembayaran
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl border border-stone-200 bg-stone-50/30 focus:bg-white focus:border-stone-900 focus:ring-0 transition-all outline-none text-sm font-medium appearance-none"
                                >
                                    <option>Lunas</option>
                                    <option>Belum Bayar</option>
                                    <option>DP / Partial</option>
                                    <option>CANCELLED</option>
                                </select>
                            </div>

                            {/* Source */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                    <Globe size={12} /> Sumber
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Direct, Sales Team, dll"
                                    value={formData.source}
                                    onChange={e => setFormData({ ...formData, source: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl border border-stone-200 bg-stone-50/30 focus:bg-white focus:border-stone-900 focus:ring-0 transition-all outline-none text-sm font-medium"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                <MessageSquare size={12} /> Notes & Special Requests
                            </label>
                            <textarea
                                placeholder="Tambahkan catatan khusus jika ada..."
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full min-h-[100px] p-4 rounded-xl border border-stone-200 bg-stone-50/30 focus:bg-white focus:border-stone-900 focus:ring-0 transition-all outline-none text-sm font-medium resize-none"
                            />
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="px-8 py-6 border-t border-stone-100 bg-stone-50/50 flex items-center justify-end gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 h-12 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-200/50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={loading}
                            onClick={handleSubmit}
                            className={`flex items-center gap-2 px-8 h-12 rounded-xl text-sm font-black transition-all shadow-lg shadow-stone-200/50 hover:scale-105 active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            style={{ backgroundColor: "#1A1C14", color: "#c5a880" }}
                        >
                            <Save size={18} />
                            {loading ? "Saving..." : "Save Transaction"}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
