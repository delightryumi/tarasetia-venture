"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Printer, Trash2, Search, FileText } from "lucide-react";
import { ScannerModal } from "./ScannerModal";
import { PrivacyPolicyPrint } from "./PrivacyPolicyPrint";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, Timestamp } from "firebase/firestore";

export interface DigitalCheckinData {
    id: string;
    nik: string;
    name: string;
    address: string;
    signatureUrl: string; // Base64 data URL
    roomNumber: string;
    timestamp: any;
    staffName: string;
}

export function DigitalCheckinSection() {
    const { activeHotelCode, user } = useAuth();
    const [checkins, setCheckins] = useState<DigitalCheckinData[]>([]);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeHotelCode) {
            setLoading(false);
            return;
        }

        const q = query(
            getHotelCollection(db, "digital_checkins"),
            orderBy("timestamp", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as DigitalCheckinData[];
            setCheckins(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [activeHotelCode]);

    const handleDelete = async (id: string) => {
        if (!activeHotelCode) return;
        if (window.confirm("Apakah Anda yakin ingin menghapus data check-in ini?")) {
            try {
                await deleteDoc(doc(getHotelCollection(db, "digital_checkins"), id));
            } catch (err) {
                console.error("Error deleting checkin:", err);
                alert("Gagal menghapus data.");
            }
        }
    };

    const handlePrint = (checkin: DigitalCheckinData) => {
        // We will store the selected checkin in a global or local state and then trigger print
        // But since window.print() prints the whole page, we can set the selected item and then call print
        setCheckinToPrint(checkin);
        setTimeout(() => {
            window.print();
        }, 500);
    };

    const [checkinToPrint, setCheckinToPrint] = useState<DigitalCheckinData | null>(null);

    const filteredCheckins = checkins.filter(c => 
        (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.roomNumber || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (ts: any) => {
        if (!ts) return "-";
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        return date.toLocaleDateString("id-ID", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    };

    return (
        <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-10 py-6 md:py-8 flex flex-col gap-8 md:gap-12 font-sans text-[var(--rich-black)] dark:text-white print:p-0">
            {/* Header (Hidden on Print) */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 lg:gap-6 pb-6 lg:pb-8 border-b border-[var(--f-hairline)] print:hidden">
                <div className="flex flex-col gap-2 lg:gap-3">
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9297a0]">
                        <Camera size={12} />
                        <span>Front Office Operations</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-[450] tracking-[-0.02em] leading-[1.1]">
                        Digital <span className="font-medium text-[var(--sidebar-link-active-bg)]">Check-in</span>
                    </h1>
                    <p className="text-sm text-gray-500 max-w-lg mt-1">
                        Pindai KTP tamu untuk mengisi data secara otomatis dan dapatkan persetujuan Privacy Policy via tanda tangan digital.
                    </p>
                </div>
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mt-4 lg:mt-0">
                    <button
                        onClick={() => setIsScannerOpen(true)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '38px', padding: '0 20px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer', backgroundColor: 'var(--sidebar-link-active-bg)', color: 'var(--sidebar-link-active-text)' }}
                        className="w-full lg:w-auto hover:opacity-90 transition-all"
                    >
                        <Camera size={14} />
                        <span>Rekam Tamu Baru</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-6 md:gap-8 print:hidden">
                {/* Search Bar matching other pages */}
                <div className="relative w-full md:max-w-[400px]">
                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} className="text-[#9297a0] pointer-events-none flex items-center justify-center z-10">
                        <Search size={16} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search by name or room..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '42px', paddingRight: '16px' }}
                        className="w-full h-10 bg-white dark:bg-[#1A1A1A] border border-[var(--f-hairline)] rounded-md text-[13px] text-[var(--f-foreground)] outline-none focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(24,29,38,0.05)] transition-all"
                    />
                </div>

                <div className="bg-white dark:bg-[#1A1A1A] border border-[var(--f-hairline)] rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] overflow-hidden">
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-[var(--f-foreground)]">
                            <thead className="bg-[var(--f-surface)] text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-[var(--f-hairline)]">
                                <tr>
                                    <th style={{ padding: '16px 24px' }} className="font-medium">Tanggal</th>
                                    <th style={{ padding: '16px 24px' }} className="font-medium">Kamar</th>
                                    <th style={{ padding: '16px 24px' }} className="font-medium">Nama Tamu</th>
                                    <th style={{ padding: '16px 24px' }} className="font-medium hidden sm:table-cell">Staf</th>
                                    <th style={{ padding: '16px 24px' }} className="font-medium text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '32px 24px' }} className="text-center text-gray-500">Memuat data...</td>
                                    </tr>
                                ) : filteredCheckins.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '32px 24px' }} className="text-center text-gray-500">
                                            <FileText size={32} className="mx-auto mb-3 opacity-20" />
                                            Belum ada data check-in.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCheckins.map((item) => (
                                        <tr key={item.id} className="border-b border-[var(--f-hairline)] hover:bg-[var(--f-surface)] transition-colors">
                                            <td style={{ padding: '16px 24px' }} className="whitespace-nowrap">{formatDate(item.timestamp)}</td>
                                            <td style={{ padding: '16px 24px' }} className="whitespace-nowrap font-medium">{item.roomNumber || "-"}</td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div className="font-medium text-[var(--rich-black)] dark:text-white line-clamp-1">{item.name || "Tanpa Nama"}</div>
                                                <div className="text-xs text-gray-500 mt-0.5 break-all">NIK: {item.nik || "-"}</div>
                                            </td>
                                            <td style={{ padding: '16px 24px' }} className="whitespace-nowrap hidden sm:table-cell">{item.staffName || "-"}</td>
                                            <td style={{ padding: '16px 24px' }} className="whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handlePrint(item)}
                                                        className="w-8 h-8 rounded-md border border-[var(--f-hairline)] bg-white dark:bg-[#1A1A1A] text-[#9297a0] flex items-center justify-center cursor-pointer hover:text-[var(--rich-black)] dark:hover:text-white hover:border-[#9297a0] hover:bg-[#f8fafc] dark:hover:bg-[#262626] transition-all"
                                                        title="Print Registration Form"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(item.id)}
                                                        className="w-8 h-8 rounded-md border border-[var(--f-hairline)] bg-white dark:bg-[#1A1A1A] text-[#9297a0] flex items-center justify-center cursor-pointer hover:text-[#aa2d00] hover:border-[#fcab79] hover:bg-[rgba(252,171,121,0.1)] transition-all"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Print View Component (Only visible when printing) */}
            {checkinToPrint && (
                <PrivacyPolicyPrint checkin={checkinToPrint} />
            )}

            {/* Scanner Modal */}
            <ScannerModal 
                isOpen={isScannerOpen} 
                onClose={() => setIsScannerOpen(false)} 
            />
        </div>
    );
}
