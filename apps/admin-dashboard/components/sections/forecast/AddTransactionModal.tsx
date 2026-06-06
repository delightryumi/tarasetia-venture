"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, 
    Home, 
    MoreHorizontal, 
    Calendar, 
    User, 
    CreditCard, 
    Plus,
    ArrowRight,
    Globe,
    Sparkles,
    ShieldCheck,
    Receipt,
    Wallet,
    ChevronRight,
    PlusCircle,
    AlertCircle,
    CheckCircle2
} from "lucide-react";
import { collection, getDocs, doc, updateDoc, getDoc, arrayUnion, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

/* ── Brand Colors ── */
const PEACH = "#8d7a52";
const SAGE = "#788069";
const RICH_BLACK = "#1A1C14";

interface RoomType {
    id: string;
    name: string;
}

const CHANNELS = [
    { name: "Traveloka", color: "#00aaf2" },
    { name: "Booking.com", color: "#003580" },
    { name: "Tiket.com", color: "#ff5e1a" },
    { name: "Agoda", color: "#e8173e" },
    { name: "Airbnb", color: "#ff5a5f" },
    { name: "Trip.com", color: "#1890ff" },
    { name: "Expedia", color: "#fbc02d" },
    { name: "MG Bedbank", color: "#6c3483" },
    { name: "Nexura Sales", color: SAGE },
    { name: "Walk-in", color: "#2e7d32" },
    { name: "Booking Engine", color: SAGE },
];

export const AddTransactionModal = ({ 
    isOpen, 
    onClose,
    selectedDate 
}: { 
    isOpen: boolean; 
    onClose: () => void;
    selectedDate: string;
}) => {
    const [step, setStep] = useState<"type" | "form">("type");
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [saving, setSaving] = useState(false);
    
    // Form States
    const [form, setForm] = useState({
        guestName: "",
        checkIn: selectedDate,
        checkOut: "",
        roomTypeId: "",
        roomNumber: "",
        channel: "Walk-in",
        voucherCode: "",
        totalAmount: "",
        paidAmount1: "",
        paidAmount2: "",
        paymentMethod: "Pay at Hotel" as "Pay at Hotel" | "Pay at Nexura",
        isSplitBill: false,
    });

    useEffect(() => {
        if (!(form.channel === "Walk-in" || form.channel === "Nexura Sales")) {
            setForm(prev => ({ ...prev, paymentMethod: "Pay at Nexura" }));
        }
    }, [form.channel]);

    useEffect(() => {
        const fetchRoomTypes = async () => {
            try {
                const snap = await getDocs(collection(db, "roomTypes"));
                setRoomTypes(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
            } catch (err) {
                console.error("Error fetching room types:", err);
            }
        };
        if (isOpen) {
            fetchRoomTypes();
            setStep("type");
            setForm(prev => ({ ...prev, checkIn: selectedDate }));
        }
    }, [isOpen, selectedDate]);

    const balance = (Number(form.totalAmount) || 0) - (Number(form.paidAmount1) || 0) - (form.isSplitBill ? (Number(form.paidAmount2) || 0) : 0);

    const handleSubmit = async () => {
        if (!form.guestName || !form.roomTypeId || !form.totalAmount) {
            toast.error("Please fill in required fields");
            return;
        }

        if (!form.checkOut) {
            toast.error("Check-out Date is required");
            return;
        }

        if (form.checkOut <= form.checkIn) {
            toast.error("Check-out Date must be after Check-in Date");
            return;
        }

        if (form.isSplitBill && balance !== 0) {
            toast.error("Split bill balance must be zero before publishing");
            return;
        }

        setSaving(true);
        try {
            const hotelId = "bumi-anyom-resort";
            const dateStr = form.checkIn; 
            const docId = `${hotelId}_${dateStr}`;
            
            const selectedRoomType = roomTypes.find(r => r.id === form.roomTypeId)?.name || "";

            const transactionData = {
                guestName: form.guestName,
                checkInDate: form.checkIn,
                checkOutDate: form.checkOut,
                roomType: selectedRoomType,
                roomNumber: form.roomNumber,
                channel: form.channel,
                voucherCode: form.voucherCode,
                amount: Number(form.totalAmount),
                paidAmount1: Number(form.paidAmount1),
                paidAmount2: form.isSplitBill ? Number(form.paidAmount2) : 0,
                paymentStatus: form.paymentMethod,
                isSplitBill: form.isSplitBill,
                source: (form.channel === "Walk-in" || form.channel === "Nexura Sales" || form.channel === "Booking Engine") ? "Walk-in" : "OTA",
                status: "CONFIRMED",
                timestamp: new Date().toISOString()
            };

            const docRef = doc(db, "daily_revenue", docId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                await updateDoc(docRef, {
                    entries: arrayUnion(transactionData),
                    date: dateStr
                });
            } else {
                await setDoc(docRef, {
                    entries: [transactionData],
                    date: dateStr
                });
            }

            toast.success("Transaction recorded");
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Process failed.");
        } finally {
            setSaving(false);
        }
    };

    const updateForm = (field: string, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const formatCurrency = (val: string | number) => {
        const num = Number(val) || 0;
        return new Intl.NumberFormat('id-ID').format(Math.floor(num));
    };

    const preventScroll = (e: React.WheelEvent<HTMLInputElement>) => {
        e.currentTarget.blur();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <style>{`
                        input::-webkit-outer-spin-button,
                        input::-webkit-inner-spin-button {
                            -webkit-appearance: none;
                            margin: 0;
                        }
                        input[type=number] {
                            -moz-appearance: textfield;
                        }
                    `}</style>
                    
                    {/* Dark Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[250] bg-stone-950/20 backdrop-blur-[1px]"
                    />

                    {/* Wide Sidebar (Right) */}
                    <motion.div 
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "tween", duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed top-0 right-0 bottom-0 z-[300] w-full max-w-[640px] bg-white shadow-2xl flex flex-col border-l border-stone-100 rounded-none overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-20 h-20 border-b border-stone-100 bg-white">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles size={10} style={{ color: SAGE }} />
                                    <span className="text-[9px] font-medium uppercase tracking-[0.4em]" style={{ color: SAGE }}>Nexura Hub</span>
                                </div>
                                <h2 className="text-xl font-light text-stone-900 tracking-tight uppercase">
                                    {step === "type" ? "Category" : "Details"}
                                </h2>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="w-8 h-8 flex items-center justify-center hover:bg-stone-50 transition-all border border-stone-100 text-stone-300 hover:text-stone-900 rounded-md"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Scrollable Form Body */}
                        <div className="flex-1 overflow-y-auto px-20 py-16 space-y-20 custom-scrollbar">
                            {step === "type" ? (
                                <div className="grid grid-cols-1 gap-6">
                                    <TypeCard 
                                        label="Room Revenue" 
                                        desc="Daily residency and room bookings"
                                        icon={<Home size={20} />}
                                        accent={PEACH}
                                        onClick={() => setStep("form")}
                                    />
                                    <TypeCard 
                                        label="Other Income" 
                                        desc="Secondary sales and outlet revenue"
                                        icon={<Wallet size={20} />}
                                        accent={SAGE}
                                        comingSoon
                                    />
                                    
                                    <div className="mt-8 p-10 border border-stone-50 bg-stone-50/30 flex items-start gap-8 rounded-xl">
                                        <div className="w-10 h-10 flex items-center justify-center bg-white border border-stone-100 rounded-lg shadow-sm" style={{ color: SAGE }}>
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-[9px] font-medium uppercase tracking-widest text-stone-900 block mb-1.5">Synchronized Entry</span>
                                            <p className="text-[10px] text-stone-400 leading-relaxed font-normal uppercase tracking-wider">
                                                Records are audited and synced across Nexura Global clusters.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-20 pb-20">
                                    <div className="space-y-16">
                                        
                                        {/* Identity Section */}
                                        <div className="space-y-10">
                                            <SectionHeader label="Profile & Period" />
                                            <div className="space-y-10 pl-2">
                                                <NexuraInput 
                                                    label="Full Guest Name" 
                                                    placeholder="NAME OF RESIDENT" 
                                                    value={form.guestName}
                                                    onChange={v => updateForm("guestName", v)}
                                                />
                                                <div className="grid grid-cols-2 gap-10">
                                                    <NexuraInput 
                                                        label="Check-in" 
                                                        type="date"
                                                        value={form.checkIn}
                                                        onChange={v => updateForm("checkIn", v)}
                                                    />
                                                    <NexuraInput 
                                                        label="Check-out" 
                                                        type="date"
                                                        value={form.checkOut}
                                                        onChange={v => updateForm("checkOut", v)}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Inventory Allocation */}
                                        <div className="space-y-10">
                                            <SectionHeader label="Inventory Allocation" />
                                            <div className="grid grid-cols-2 gap-10 pl-2">
                                                <div className="space-y-3">
                                                    <span className="text-[9px] font-medium uppercase tracking-[0.2em] ml-0.5" style={{ color: SAGE }}>Room Type</span>
                                                    <select 
                                                        value={form.roomTypeId}
                                                        onChange={e => updateForm("roomTypeId", e.target.value)}
                                                        className="w-full h-11 px-4 rounded-lg bg-stone-50 border border-stone-100 outline-none text-[11px] font-normal uppercase tracking-widest appearance-none cursor-pointer hover:bg-white transition-all"
                                                    >
                                                        <option value="">CHOOSE TYPE</option>
                                                        {roomTypes.map(r => <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>)}
                                                    </select>
                                                </div>
                                                <NexuraInput 
                                                    label="Room ID" 
                                                    placeholder="101"
                                                    value={form.roomNumber}
                                                    onChange={v => updateForm("roomNumber", v)}
                                                />
                                            </div>
                                        </div>

                                        {/* Financial Settlement */}
                                        <div className="space-y-16">
                                            <SectionHeader label="Financial Settlement" />
                                            <div className="flex flex-col gap-14 pl-2">
                                                <div className="grid grid-cols-2 gap-10">
                                                    <div className="space-y-3">
                                                        <span className="text-[9px] font-medium uppercase tracking-[0.2em] ml-0.5" style={{ color: SAGE }}>Market Channel</span>
                                                        <select 
                                                            value={form.channel}
                                                            onChange={e => updateForm("channel", e.target.value)}
                                                            className="w-full h-11 px-4 rounded-lg bg-stone-50 border border-stone-100 outline-none text-[11px] font-normal uppercase tracking-widest appearance-none cursor-pointer hover:bg-white transition-all"
                                                        >
                                                            {CHANNELS.map(c => <option key={c.name} value={c.name}>{c.name.toUpperCase()}</option>)}
                                                        </select>
                                                    </div>
                                                    <NexuraInput 
                                                        label="Promotion" 
                                                        placeholder="VOUCHER CODE"
                                                        value={form.voucherCode}
                                                        onChange={v => updateForm("voucherCode", v)}
                                                    />
                                                </div>
                                                
                                                {/* Total Amount */}
                                                <div className="space-y-4 pt-2">
                                                    <span className="text-[9px] font-medium uppercase tracking-[0.2em] ml-0.5" style={{ color: SAGE }}>Settlement Amount</span>
                                                    <div className="relative group">
                                                        <input 
                                                            type="number"
                                                            value={form.totalAmount}
                                                            onWheel={preventScroll}
                                                            onChange={e => updateForm("totalAmount", e.target.value)}
                                                            placeholder="INPUT AMOUNT"
                                                            className="w-full h-[85px] px-8 rounded-xl bg-stone-50 border border-stone-100 outline-none text-4xl font-light tracking-tighter transition-all hover:bg-white text-stone-900 placeholder:text-stone-200"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Split Bill Card */}
                                                <div className="py-4">
                                                    <div className="flex items-center justify-between p-8 bg-stone-50 rounded-xl border border-stone-100">
                                                        <div className="flex items-center gap-6">
                                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-stone-300 border border-stone-100 shadow-sm">
                                                                <Receipt size={14} />
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] font-medium uppercase text-stone-900 block tracking-widest mb-1">Split Mode</span>
                                                                <span className="text-[9px] text-stone-400 font-normal uppercase tracking-wider">Multiple methods</span>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => updateForm("isSplitBill", !form.isSplitBill)}
                                                            className={`w-10 h-5 rounded-full relative transition-all duration-300 ${form.isSplitBill ? 'bg-stone-900' : 'bg-stone-200'}`}
                                                        >
                                                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${form.isSplitBill ? 'left-5.5' : 'left-0.5'}`} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Amount Inputs */}
                                                <div className="grid grid-cols-2 gap-10">
                                                    <NexuraInput 
                                                        label={form.isSplitBill ? "Amount 1" : "Paid Amount"}
                                                        type="number"
                                                        onWheel={preventScroll}
                                                        value={form.paidAmount1}
                                                        onChange={(v: any) => updateForm("paidAmount1", v)}
                                                    />
                                                    {form.isSplitBill && (
                                                        <NexuraInput 
                                                            label="Amount 2" 
                                                            type="number"
                                                            onWheel={preventScroll}
                                                            value={form.paidAmount2}
                                                            onChange={(v: any) => updateForm("paidAmount2", v)}
                                                        />
                                                    )}
                                                </div>

                                                {/* Settlement Method Selector: Added pb-20 for safe distance */}
                                                <div className="pt-10 pb-20">
                                                    <div className="flex items-center justify-between mb-5">
                                                        <span className="text-[9px] font-medium uppercase tracking-[0.2em] ml-0.5" style={{ color: SAGE }}>Settlement Method Selection</span>
                                                        {!(form.channel === "Walk-in" || form.channel === "Nexura Sales") && (
                                                            <span className="text-[8px] font-bold text-stone-300 uppercase tracking-widest bg-stone-50 px-2 py-0.5 rounded border border-stone-100">Locked for OTA/Engine</span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2 p-2 bg-stone-50 rounded-xl border border-stone-100 shadow-sm">
                                                        <button 
                                                            onClick={() => updateForm("paymentMethod", "Pay at Hotel")}
                                                            disabled={!(form.channel === "Walk-in" || form.channel === "Nexura Sales")}
                                                            className={`flex-1 h-12 text-[10px] font-medium uppercase tracking-widest transition-all rounded-lg flex items-center justify-center gap-2.5 ${
                                                                form.paymentMethod === "Pay at Hotel" 
                                                                ? 'bg-stone-900 text-white shadow-lg' 
                                                                : 'text-stone-400 hover:text-stone-600'
                                                            } ${!(form.channel === "Walk-in" || form.channel === "Nexura Sales") ? 'opacity-20 cursor-not-allowed grayscale' : ''}`}
                                                        >
                                                            <Home size={14} />
                                                            Pay at Hotel
                                                        </button>
                                                        <button 
                                                            onClick={() => updateForm("paymentMethod", "Pay at Nexura")}
                                                            className={`flex-1 h-12 text-[10px] font-medium uppercase tracking-widest transition-all rounded-lg flex items-center justify-center gap-2.5 ${
                                                                form.paymentMethod === "Pay at Nexura" 
                                                                ? 'text-white shadow-lg' 
                                                                : 'text-stone-400 hover:text-stone-600'
                                                            }`}
                                                            style={form.paymentMethod === "Pay at Nexura" ? { backgroundColor: PEACH, borderColor: PEACH } : {}}
                                                        >
                                                            <Sparkles size={14} />
                                                            Pay at Nexura
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Digital Invoice: Using mt-12 instead of mt-24 but added pb-20 to section above */}
                                        <div className="mt-8 bg-white border border-stone-100 rounded-xl overflow-hidden shadow-sm">
                                            <div className="px-10 py-8 border-b border-dashed border-stone-100 flex items-center justify-between bg-stone-50/30">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 bg-white border border-stone-100 rounded-lg flex items-center justify-center text-stone-400 shadow-sm">
                                                        <Receipt size={20} />
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-medium uppercase tracking-[0.4em] text-stone-400 block mb-0.5">Nexura Digital</span>
                                                        <h4 className="text-base font-light text-stone-900 uppercase tracking-widest">Digital Invoice</h4>
                                                    </div>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-[8px] font-medium uppercase tracking-widest border ${balance === 0 && form.guestName ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                                                    {balance === 0 && form.guestName ? 'Validated' : 'Drafting'}
                                                </div>
                                            </div>

                                            <div className="px-10 py-10 space-y-8">
                                                <div className="grid grid-cols-2 gap-10">
                                                    <InvoiceItem label="Guest" value={form.guestName || "0"} />
                                                    <InvoiceItem label="Allocation" value={roomTypes.find(r=>r.id===form.roomTypeId)?.name || "0"} />
                                                    <InvoiceItem label="Entry Date" value={form.checkIn || "0"} />
                                                    <InvoiceItem label="Settlement" value={form.paymentMethod} />
                                                </div>

                                                <div className="pt-8 border-t border-stone-50 flex flex-col gap-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] font-medium uppercase tracking-[0.3em] text-stone-300">Expected Total</span>
                                                        <span className="text-xs font-medium text-stone-400">{formatCurrency(form.totalAmount)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] font-medium uppercase tracking-[0.3em] text-stone-300">Balance</span>
                                                        <span className={`text-xs font-medium ${balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                            {balance > 0 ? `- ${formatCurrency(balance)}` : balance < 0 ? `+ ${formatCurrency(Math.abs(balance))}` : '0.00'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="px-10 py-8 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                                                <span className="text-[10px] font-medium uppercase tracking-[0.4em] text-stone-400">Total Settlement</span>
                                                <span className="text-3xl font-light tracking-tighter text-stone-900">{formatCurrency(form.totalAmount)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sticky Footer */}
                        <div className="px-20 h-24 border-t border-stone-100 flex items-center justify-between bg-white">
                            {step === "form" && (
                                <button 
                                    onClick={() => setStep("type")}
                                    className="text-[10px] font-medium text-stone-300 hover:text-stone-900 uppercase tracking-[0.4em] transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                            <div className="flex-1" />
                            <button 
                                disabled={step === "type" || saving || (form.isSplitBill && balance > 0)}
                                onClick={handleSubmit}
                                className={`flex items-center justify-center gap-2 h-10 min-w-[160px] px-8 text-[11px] font-medium uppercase tracking-[0.1em] transition-all text-white hover:brightness-110 active:scale-95 disabled:bg-stone-50 disabled:text-stone-300 disabled:cursor-not-allowed rounded-lg`}
                                style={{ backgroundColor: SAGE }}
                            >
                                {saving ? "SYNCING..." : (
                                    <>
                                        <PlusCircle size={14} />
                                        Publish Entry
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

/* ── UI Components ── */

function NexuraInput({ label, type = "text", placeholder, value, onChange, onWheel }: any) {
    return (
        <div className="space-y-3">
            <span className="text-[9px] font-medium uppercase tracking-[0.2em] ml-0.5" style={{ color: SAGE }}>{label}</span>
            <input 
                type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                onWheel={onWheel}
                className="w-full h-11 px-4 rounded-lg bg-stone-50 border border-stone-100 outline-none text-[11px] font-normal tracking-widest placeholder:text-stone-200 hover:bg-white transition-all"
            />
        </div>
    );
}

function SectionHeader({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-6">
            <div className="h-px bg-stone-900 w-10" />
            <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-stone-900">{label}</span>
            <div className="h-px bg-stone-100 flex-1" />
        </div>
    );
}

function InvoiceItem({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-[8px] font-medium uppercase tracking-[0.3em] text-stone-300">{label}</span>
            <span className="text-[12px] font-normal text-stone-900 uppercase tracking-widest truncate">{value}</span>
        </div>
    );
}

function TypeCard({ label, desc, icon, onClick, accent, comingSoon = false }: any) {
    return (
        <motion.button 
            whileHover={!comingSoon ? { x: 8, scale: 1.01 } : {}}
            onClick={onClick}
            disabled={comingSoon}
            className={`group relative flex items-center justify-between p-8 border transition-all duration-500 text-left rounded-xl overflow-hidden ${
                comingSoon ? 'bg-stone-50 border-stone-100 opacity-50 cursor-not-allowed' : 'bg-white border-stone-100 shadow-sm hover:shadow-md'
            }`}
        >
            <div className="flex items-center gap-8 relative z-10">
                <div className="w-12 h-12 flex items-center justify-center border transition-all rounded-lg shadow-sm"
                    style={comingSoon ? { backgroundColor: '#f5f5f4', color: '#d4d4d8' } : { backgroundColor: `${accent}10`, color: RICH_BLACK, borderColor: `${accent}30` }}>
                    {icon}
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <span className={`text-[11px] font-medium uppercase tracking-[0.3em] leading-tight block ${comingSoon ? 'text-stone-300' : 'text-stone-400'}`}>{label}</span>
                        {comingSoon && <span className="px-2 py-0.5 bg-stone-100 text-[8px] font-normal uppercase text-stone-400 tracking-widest border border-stone-200 rounded-md">Locked</span>}
                    </div>
                    <p className={`text-[9px] font-normal uppercase tracking-widest ${comingSoon ? 'text-stone-200' : 'text-stone-400'}`}>{desc}</p>
                </div>
            </div>
            {!comingSoon && <ChevronRight size={18} className="text-stone-200 group-hover:text-stone-900 transition-colors" />}
        </motion.button>
    );
}
