"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";

export interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    rate: number;
}

export interface BrandingData {
    lightLogo: string;
    darkLogo: string;
    address: string;
    phones: string[];
    email: string;
}

export const useInvoice = () => {
    const [branding, setBranding] = useState<BrandingData>({
        lightLogo: "",
        darkLogo: "",
        address: "",
        phones: [],
        email: ""
    });
    const [transactions, setTransactions] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State
    const [invoiceNumber, setInvoiceNumber] = useState(`INV-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`);
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState("");
    const [checkInDate, setCheckInDate] = useState("");
    const [checkOutDate, setCheckOutDate] = useState("");
    const [clientName, setClientName] = useState("");
    const [clientDetails, setClientDetails] = useState("");
    const [items, setItems] = useState<InvoiceItem[]>([
        { id: '1', description: 'Room Stay', quantity: 1, rate: 0 }
    ]);
    const [notes, setNotes] = useState("Terima kasih atas kunjungan Anda di Bumi Anyom Resort.");

    const searchTransactions = async (queryStr: string) => {
        if (!queryStr || queryStr.length < 2) {
            setTransactions([]);
            return;
        }
        setSearching(true);
        try {
            const { getDocs, query, limit } = await import("firebase/firestore");
            const snap = await getDocs(query(getHotelCollection(db, "daily_revenue"), limit(30))); 
            let results: any[] = [];
            snap.forEach(doc => {
                const entries = doc.data().entries || [];
                const matched = entries.filter((e: any) => 
                     (e.guestName?.toLowerCase().includes(queryStr.toLowerCase())) ||
                     (e.incomeCategory?.toLowerCase().includes(queryStr.toLowerCase()))
                );
                results = [...results, ...matched];
            });
            setTransactions(results);
        } catch (err) {
            console.error(err);
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Branding
                const logoDoc = await getDoc(doc(getHotelCollection(db, "settings"), "landingPage"));
                const footerDoc = await getDoc(doc(getHotelCollection(db, "settings"), "footer"));
                const logoData = logoDoc.exists() ? logoDoc.data() : {};
                const footerData = footerDoc.exists() ? footerDoc.data() : {};

                const darkLogoUrl = logoData.darkLogo ? `${logoData.darkLogo}${logoData.darkLogo.includes('?') ? '&' : '?'}t=${Date.now()}` : "";

                // Function to convert image to Base64 to bypass CORS in html2canvas
                const getBase64Image = async (url: string): Promise<string> => {
                    if (!url) return "";
                    try {
                        const response = await fetch(url, { mode: 'cors' });
                        const blob = await response.blob();
                        return new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.readAsDataURL(blob);
                        });
                    } catch (e) {
                        console.warn("CORS/Fetch failed for logo, using direct URL:", e);
                        return url;
                    }
                };

                const darkLogoBase64 = darkLogoUrl ? await getBase64Image(darkLogoUrl) : "";

                setBranding({
                    lightLogo: logoData.lightLogo || "",
                    darkLogo: darkLogoBase64 || darkLogoUrl,
                    address: footerData.address || "",
                    phones: footerData.phones || [],
                    email: footerData.email || ""
                });
            } catch (err) {
                console.error("Error fetching data for invoice:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const selectTransaction = (entry: any) => {
        // Clear previous items
        setItems([]);

        const isRoom = entry.type === 'accommodation' || entry.guestName;
        
        setClientName(entry.guestName || entry.incomeCategory || "");
        setCheckInDate(entry.checkInDate || "");
        setCheckOutDate(entry.checkOutDate || "");
        
        if (isRoom) {
            setItems([{
                id: '1',
                description: `Stay at ${entry.roomType || 'Room'} (No. ${entry.roomNumber || '-'})`,
                quantity: 1,
                rate: Number(entry.amount) || 0
            }]);
            setNotes(`Terima kasih telah menginap di Bumi Anyom Resort. Kamar: ${entry.roomNumber || '-'}`);
        } else {
            setItems([{
                id: '1',
                description: entry.incomeCategory || "Layanan Tambahan",
                quantity: 1,
                rate: Number(entry.amount) || 0
            }]);
            setNotes(`Terima kasih atas kunjungan Anda. Transaksi: ${entry.incomeCategory}`);
        }

        if (entry.channel) setClientDetails(`Booking ID: ${entry.bookingId || '-'} | Source: ${entry.channel}`);
    };

    const addItem = () => {
        setItems([...items, { id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, rate: 0 }]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    const tax = subtotal * 0; 
    const total = subtotal + tax;

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = async () => {
        const element = document.getElementById('invoice-to-print');
        if (!element) return;

        try {
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Invoice_${invoiceNumber}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
        }
    };

    return {
        branding,
        loading,
        invoiceNumber, setInvoiceNumber,
        invoiceDate, setInvoiceDate,
        dueDate, setDueDate,
        checkInDate, setCheckInDate,
        checkOutDate, setCheckOutDate,
        clientName, setClientName,
        clientDetails, setClientDetails,
        items, addItem, removeItem, updateItem,
        notes, setNotes,
        subtotal, total, tax,
        handlePrint,
        handleDownload,
        transactions,
        selectTransaction,
        searchTransactions,
        searching
    };
};
