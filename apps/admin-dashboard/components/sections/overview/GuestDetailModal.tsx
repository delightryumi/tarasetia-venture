"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { 
    Trash2,
    Save,
    User,
    ArrowUpRight
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc, collection, getDocs, setDoc } from "firebase/firestore";
import { getChannelLogo } from "./StatCard";
import "./FolioAesthetic.css";

interface GuestDetailModalProps {
    guest: any;
    isEditing: boolean;
    onClose: () => void;
    onSave?: () => void;
}

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

export function GuestDetailModal({ guest, isEditing: initialEditing, onClose, onSave }: GuestDetailModalProps) {
    const [isEditMode, setIsEditMode] = React.useState(initialEditing);
    const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);
    const [formData, setFormData] = React.useState({
        ...guest,
        totalAmount: guest.totalAmount || guest.amount || 0,
        paidAmount1: guest.paidAmount1 || guest.amount || 0,
        paidAmount2: guest.paidAmount2 || 0,
        isSplitBill: guest.isSplitBill || false,
        checkIn: guest.checkInDate || guest.checkIn || '',
        checkOut: guest.checkOutDate || guest.checkOut || '',
        roomTypeId: guest.roomTypeId || '',
    });

    const [roomTypes, setRoomTypes] = React.useState<any[]>([]);

    React.useEffect(() => {
        const fetchRoomTypes = async () => {
            const querySnapshot = await getDocs(collection(db, "roomTypes"));
            setRoomTypes(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchRoomTypes();
    }, []);

    const handleSave = async () => {
        try {
            const hotelId = "bumi-anyom-resort";
            const oldDate = guest.checkInDate || guest.checkIn || new Date(guest.timestamp).toISOString().split('T')[0];
            const newDate = formData.checkIn;
            const oldDocId = guest._docId || `${hotelId}_${oldDate}`;
            const newDocId = `${hotelId}_${newDate}`;
            const newSource = (formData.channel === "Walk-in" || formData.channel === "Nexura Sales" || formData.channel === "Booking Engine") ? "Walk-in" : "OTA";

            const updatedEntry = {
                ...guest,
                ...formData,
                source: newSource,
                checkInDate: newDate,
                checkOutDate: formData.checkOut,
                amount: formData.isSplitBill ? (Number(formData.paidAmount1) + Number(formData.paidAmount2)) : Number(formData.paidAmount1),
            };

            if (oldDocId !== newDocId) {
                const oldRef = doc(db, "daily_revenue", oldDocId);
                const oldSnap = await getDoc(oldRef);
                if (oldSnap.exists()) {
                    const oldEntries = oldSnap.data().entries || [];
                    const filtered = oldEntries.filter((e: any) => e.timestamp !== guest.timestamp);
                    await updateDoc(oldRef, { entries: filtered });
                }
                const newRef = doc(db, "daily_revenue", newDocId);
                const newSnap = await getDoc(newRef);
                if (newSnap.exists()) {
                    const newEntries = newSnap.data().entries || [];
                    await updateDoc(newRef, { entries: [...newEntries, updatedEntry], date: newDate });
                } else {
                    await setDoc(newRef, { entries: [updatedEntry], date: newDate });
                }
            } else {
                const docRef = doc(db, "daily_revenue", oldDocId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const entries = docSnap.data().entries || [];
                    const updatedEntries = entries.map((e: any) => e.timestamp === guest.timestamp ? updatedEntry : e);
                    await updateDoc(docRef, { entries: updatedEntries, date: oldDate });
                }
            }
            toast.success("Transaction updated successfully");
            if (onSave) onSave();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update transaction");
        }
    };

    const executeDelete = async () => {
        try {
            const docRef = doc(db, "daily_revenue", guest._docId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const entries = docSnap.data().entries || [];
                const filtered = entries.filter((e: any) => e.timestamp !== guest.timestamp);
                await updateDoc(docRef, { entries: filtered });
                toast.success("Transaction archived successfully");
                if (onSave) onSave();
                onClose();
            }
        } catch (error) {
            console.error("Action Failed", error);
            toast.error("Failed to archive transaction");
        } finally {
            setShowConfirmDelete(false);
        }
    };

    const getChannelIcon = (name: string) => {
        const ch = CHANNELS.find(c => c.name === name);
        return ch ? ch.logo : "/channels/walk_in.png";
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-md flex justify-end"
            onClick={onClose}
        >
            <motion.div 
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="bg-white w-full max-w-[580px] h-full shadow-2xl rounded-none overflow-hidden flex flex-col border-l border-stone-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-20 py-10 border-b border-stone-100 flex items-center justify-between bg-stone-50/30">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-6 h-[1px] bg-[#788069]/30" />
                            <span className="text-[9px] font-bold text-[#788069] uppercase tracking-[0.4em]">{isEditMode ? "Adjustment Mode" : "Digital Folio"}</span>
                        </div>
                        <h2 className="text-2xl font-light text-stone-900 uppercase font-outfit tracking-tight">
                            {isEditMode ? "Modify" : "Review"} <span className="font-semibold text-[#788069]">{guest.type === 'accommodation' ? 'Entry' : 'Income'}</span>
                        </h2>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-stone-300 hover:text-stone-900 hover:bg-stone-100 transition-all">
                        <ArrowUpRight size={20} className="rotate-45" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-20 py-16 custom-scrollbar bg-stone-50/10">
                    {isEditMode ? (
                        <div className="space-y-16 py-6">
                            {/* Section 01: Identity */}
                            <section>
                                <div className="flex items-center gap-4 mb-8">
                                    <span className="text-[9px] font-bold text-[#788069] bg-[#788069]/5 px-2 py-0.5">01</span>
                                    <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-stone-900 font-outfit">Identity & Stay</h3>
                                    <div className="h-[1px] bg-stone-100 flex-1" />
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="col-span-2">
                                        <NexuraInputLabel label="Guest Name" value={formData.guestName} onChange={(v: string) => setFormData({...formData, guestName: v})} />
                                    </div>
                                    <NexuraInputLabel label="Check-in" type="date" value={formData.checkIn} onChange={(v: string) => setFormData({...formData, checkIn: v})} />
                                    <NexuraInputLabel label="Check-out" type="date" value={formData.checkOut} onChange={(v: string) => setFormData({...formData, checkOut: v})} />
                                </div>
                            </section>

                            {/* Section 02: Assignment */}
                            <section>
                                <div className="flex items-center gap-4 mb-8">
                                    <span className="text-[9px] font-bold text-[#788069] bg-[#788069]/5 px-2 py-0.5">02</span>
                                    <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-stone-900 font-outfit">Stay Details</h3>
                                    <div className="h-[1px] bg-stone-100 flex-1" />
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 ml-1">Room Category</label>
                                        <div className="relative group luxury-input bg-white transition-all rounded-lg shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-stone-100/50 focus-within:border-[#788069] focus-within:shadow-md">
                                            <select
                                                value={formData.roomTypeId}
                                                onChange={e => setFormData({...formData, roomTypeId: e.target.value})}
                                                className="w-full h-11 px-4 bg-transparent outline-none text-[11px] font-bold uppercase tracking-widest custom-select cursor-pointer text-stone-800"
                                            >
                                                <option value=""></option>
                                                {roomTypes.map(r => <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <NexuraInputLabel label="Room Number" value={formData.roomNumber} onChange={(v: string) => setFormData({...formData, roomNumber: v})} />
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 ml-1">Channel Source</label>
                                        <select
                                            value={formData.channel}
                                            onChange={e => setFormData({...formData, channel: e.target.value})}
                                            className="w-full h-11 px-4 bg-white rounded-lg border border-stone-100 outline-none text-[11px] font-bold uppercase tracking-widest custom-select"
                                        >
                                            {CHANNELS.map(c => <option key={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <NexuraInputLabel label="Staff In-Charge" value={formData.staffName} onChange={(v: string) => setFormData({...formData, staffName: v})} />
                                </div>
                            </section>

                            {/* Section 03: Financials */}
                            <section>
                                <div className="flex items-center gap-4 mb-8">
                                    <span className="text-[9px] font-bold text-[#788069] bg-[#788069]/5 px-2 py-0.5">03</span>
                                    <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-stone-900 font-outfit">Financials</h3>
                                    <div className="h-[1px] bg-stone-100 flex-1" />
                                </div>
                                <div className="space-y-10">
                                    <NexuraInputLabel label="Total Gross Amount" type="number" value={formData.totalAmount} onChange={(v: string) => setFormData({...formData, totalAmount: v})} />
                                    <div className="flex items-center justify-between p-5 bg-stone-50/50 rounded-lg border border-stone-100">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase text-stone-900 tracking-wider">Split Settlement</p>
                                            <p className="text-[9px] text-stone-400 uppercase tracking-widest">Enable dual payment methods</p>
                                        </div>
                                        <button onClick={() => setFormData({...formData, isSplitBill: !formData.isSplitBill})} className={`w-10 h-5 relative rounded-full transition-all ${formData.isSplitBill ? 'bg-[#788069]' : 'bg-stone-200'}`}>
                                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${formData.isSplitBill ? 'left-5.5' : 'left-0.5'}`} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <NexuraInputLabel label={formData.isSplitBill ? "Payment A" : "Amount Paid"} type="number" value={formData.paidAmount1} onChange={(v: string) => setFormData({...formData, paidAmount1: v})} />
                                        {formData.isSplitBill && (
                                            <NexuraInputLabel label="Payment B" type="number" value={formData.paidAmount2} onChange={(v: string) => setFormData({...formData, paidAmount2: v})} />
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 ml-1">Payment Status</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {["Lunas", "Belum Bayar", "DP / Partial", "CANCELLED"].map(s => (
                                                <button 
                                                    key={s}
                                                    onClick={() => setFormData({...formData, paymentStatus: s, status: s})}
                                                    className={`h-9 text-[8px] font-bold uppercase tracking-widest rounded-lg border transition-all ${formData.paymentStatus === s ? 'bg-[#788069] text-white border-[#788069]' : 'bg-white text-stone-400 border-stone-100'}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section 04: Remarks */}
                            <section>
                                <div className="flex items-center gap-4 mb-8">
                                    <span className="text-[9px] font-bold text-[#788069] bg-[#788069]/5 px-2 py-0.5">04</span>
                                    <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-stone-900 font-outfit">Remarks</h3>
                                    <div className="h-[1px] bg-stone-100 flex-1" />
                                </div>
                                <textarea
                                    value={formData.note}
                                    onChange={e => setFormData({...formData, note: e.target.value})}
                                    rows={3}
                                    className="w-full bg-stone-50/50 rounded-lg p-4 text-[11px] font-medium text-stone-700 outline-none border border-stone-100 focus:border-[#788069] transition-all resize-none"
                                    placeholder="Enter internal audit notes..."
                                />
                            </section>
                        </div>
                    ) : (
                        <div className="w-full mx-auto folio-container p-10 space-y-10 my-4">
                            <div className="folio-stamp" />
                            <div className="flex justify-between items-start border-b border-stone-100 pb-8">
                                <div className="space-y-2">
                                    <div className="folio-header-badge">Ledger Entry</div>
                                    <h3 className="text-xl font-bold text-stone-900 font-outfit uppercase tracking-tight">Bumi Anyom Resort</h3>
                                    <p className="text-[8px] font-bold text-stone-400 uppercase tracking-[0.4em]">Integrated PMS Folio v3.0</p>
                                </div>
                                <div className="text-right">
                                    <p className="folio-label mb-1 justify-end">Ref</p>
                                    <p className="text-[12px] font-bold text-stone-900 uppercase folio-mono">{guest.bookingId || `TRX-${guest.timestamp?.toString().slice(-6)}`}</p>
                                    <p className="text-[7px] text-stone-300 mt-1">{new Date(guest.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                                <div className="space-y-1.5">
                                    <p className="folio-label"><User size={9} /> Guest</p>
                                    <p className="folio-value !text-[12px]">{guest.guestName || "Unspecified"}</p>
                                </div>
                                <div className="space-y-1.5 text-right flex flex-col items-end">
                                    <p className="folio-label">Channel</p>
                                    <div className="mt-1 p-1.5 bg-stone-50 rounded-lg border border-stone-100 w-14 h-10 flex items-center justify-center shadow-sm">
                                        <img src={getChannelIcon(guest.channel)} alt={guest.channel} className="max-w-full max-h-full object-contain grayscale" onError={(e) => { e.currentTarget.style.display = 'none'; e.stopPropagation(); }} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="folio-label">Stay Period</p>
                                    <p className="folio-value folio-mono !text-[11px]">
                                        {guest.checkInDate || "---"} <span className="text-stone-300 mx-1">→</span> {guest.checkOutDate || "---"}
                                    </p>
                                </div>
                                <div className="space-y-1.5 text-right">
                                    <p className="folio-label">Inventory</p>
                                    <p className="folio-value !text-[11px]">
                                        {guest.roomType || "Service"} <span className="text-[#788069] mx-1">|</span> {guest.roomNumber ? `RM ${guest.roomNumber}` : "NA"}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-6 pt-2">
                                <div className="folio-divider-dashed" />
                                <div className="flex justify-between items-center text-[8px] font-bold text-stone-300 uppercase tracking-[0.4em]">
                                    <span>Classification</span>
                                    <span>Audit Total</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="folio-item-row py-2">
                                        <p className="text-[12px] font-bold text-stone-700 uppercase font-outfit">Revenue Item</p>
                                        <p className="text-[13px] font-bold text-stone-900 folio-mono">Rp {Number(guest.amount).toLocaleString('id-ID')}</p>
                                    </div>
                                    <div className="folio-item-row border-none py-1">
                                        <p className="folio-label">Staff Entry</p>
                                        <p className="text-[10px] font-bold text-stone-500 uppercase">{guest.staffName || "System"}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="folio-total-box p-5">
                                <div className="space-y-0.5">
                                    <p className="folio-label">Status</p>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${guest.paymentStatus?.includes('Lunas') ? 'text-[#788069]' : 'text-amber-500'}`}>
                                        {guest.paymentStatus || 'Pending'}
                                    </p>
                                </div>
                                <div className="text-right space-y-0.5">
                                    <p className="folio-label">Final Value</p>
                                    <p className="text-2xl font-black text-stone-900 folio-mono">Rp {Number(guest.amount).toLocaleString('id-ID')}</p>
                                </div>
                            </div>
                            <div className="pt-4 space-y-3">
                                <p className="folio-label italic border-l-2 border-[#788069] pl-2">Audit Note</p>
                                <p className="text-[10px] text-stone-500 leading-relaxed italic font-outfit bg-stone-50/30 p-4 rounded-lg">
                                    {guest.note || "System Log: No operational remarks recorded."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-20 h-24 border-t border-stone-100 flex items-center justify-end gap-4 bg-white">
                    {isEditMode ? (
                        <>
                            <button onClick={() => setIsEditMode(false)} className="text-[9px] font-medium text-stone-300 hover:text-stone-900 uppercase tracking-[0.4em] transition-colors">Abort</button>
                            <button onClick={handleSave} className="flex items-center justify-center gap-2 h-10 min-w-[140px] px-6 text-[10px] font-medium uppercase tracking-[0.1em] transition-all text-white bg-[#788069] hover:brightness-110 active:scale-95 rounded-lg">
                                <Save size={14} /> Commit Changes
                            </button>
                        </>
                    ) : (
                        <div className="flex w-full items-center justify-between">
                            <button onClick={onClose} className="text-[9px] font-medium text-stone-300 hover:text-stone-900 uppercase tracking-[0.4em] transition-colors">Close</button>
                            <div className="flex gap-3">
                                <button onClick={() => setIsEditMode(true)} className="h-10 px-6 text-[10px] font-medium uppercase tracking-[0.1em] border border-stone-100 text-stone-400 hover:text-stone-900 hover:bg-stone-50 transition-all rounded-lg">Modify</button>
                                <button onClick={() => setShowConfirmDelete(true)} className="flex items-center justify-center gap-2 h-10 min-w-[140px] px-6 text-[10px] font-medium uppercase tracking-[0.1em] transition-all text-white bg-red-500 hover:bg-red-600 active:scale-95 rounded-lg">
                                    <Trash2 size={14} /> Archive Entry
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            <AnimatePresence>
                {showConfirmDelete && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[400] bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={(e) => { e.stopPropagation(); setShowConfirmDelete(false); }}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[24px] p-8 max-w-md w-full shadow-2xl border border-stone-100"
                        >
                            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6">
                                <Trash2 size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-stone-900 font-outfit uppercase tracking-tight mb-2">Confirm Archival</h3>
                            <p className="text-[11px] text-stone-500 uppercase tracking-widest leading-relaxed mb-8">
                                Are you sure you want to permanently delete the transaction for <span className="font-bold text-stone-900">{guest.guestName || guest.incomeCategory}</span>?
                            </p>
                            <div className="flex gap-4">
                                <button onClick={() => setShowConfirmDelete(false)} className="flex-1 h-12 rounded-xl border border-stone-200 text-[11px] font-bold text-stone-600 uppercase tracking-widest hover:bg-stone-50 transition-colors">Cancel</button>
                                <button onClick={executeDelete} className="flex-1 h-12 rounded-xl bg-red-500 text-[11px] font-bold text-white uppercase tracking-widest hover:bg-red-600 transition-colors">Delete</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function NexuraInputLabel({ label, value, onChange, type = "text" }: { label: string, value: any, onChange: any, type?: string }) {
    return (
        <div className="space-y-3">
            <span className="text-[9px] font-medium uppercase tracking-[0.2em] ml-0.5" style={{ color: "#788069" }}>{label}</span>
            <input
                type={type} value={value} onChange={e => onChange(e.target.value)}
                onWheel={(e) => e.currentTarget.type === "number" && e.currentTarget.blur()}
                className="w-full h-11 px-4 rounded-lg bg-stone-50 border border-stone-100 outline-none text-[11px] font-normal tracking-widest placeholder:text-stone-200 hover:bg-white transition-all"
            />
        </div>
    );
}
