"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    Calendar,
    Users,
    Bed,
    Check,
    ShieldCheck,
    CreditCard,
    ArrowLeft,
    Clock,
    Landmark,
    Lock,
    Sparkles,
    CheckCircle,
    Info,
    Phone,
    Mail,
    Share2,
} from "lucide-react";
import {
    getBookingEngineData,
    createDirectBookingReservation,
    BookingEnginePublicData,
    BookingSelection,
    BookingGuestDetails,
} from "@/services/bookingEngineService";

export default function DirectBookingPage() {
    const params = useParams();
    const searchParams = useSearchParams();

    const hotelCodeParam = (params?.hotelCode as string) || "1";

    // Google Hotel Deep Link Query Parameters
    const initialCheckin = searchParams.get("checkin") || new Date().toISOString().split("T")[0];
    const initialCheckout =
        searchParams.get("checkout") ||
        new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const initialAdults = parseInt(searchParams.get("adults") || "2", 10);
    const initialChildren = parseInt(searchParams.get("children") || "0", 10);
    const requestedRoomTypeId = searchParams.get("roomType") || "";

    // State
    const [engineData, setEngineData] = useState<BookingEnginePublicData | null>(null);
    const [loading, setLoading] = useState(true);

    // Filter bar state
    const [checkIn, setCheckIn] = useState(initialCheckin);
    const [checkOut, setCheckOut] = useState(initialCheckout);
    const [adults, setAdults] = useState(initialAdults);
    const [children, setChildren] = useState(initialChildren);

    // Selected Room & Rate Plan
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [selectedRatePlanId, setSelectedRatePlanId] = useState<string | null>(null);

    // Step state: 1 = room selection, 2 = guest form & payment, 3 = confirmation
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Guest Info Form
    const [guestDetails, setGuestDetails] = useState<BookingGuestDetails>({
        fullName: "",
        email: "",
        phone: "",
        specialRequests: "",
        estimatedArrivalTime: "14:00",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmedBookingCode, setConfirmedBookingCode] = useState<string>("");

    // Fetch booking data
    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getBookingEngineData(hotelCodeParam);
            setEngineData(data);
            if (data?.rooms && data.rooms.length > 0) {
                const targetRoom = requestedRoomTypeId
                    ? data.rooms.find((r) => r.id === requestedRoomTypeId)
                    : data.rooms[0];
                const activeRoom = targetRoom || data.rooms[0];
                setSelectedRoomId(activeRoom.id);
                if (activeRoom.ratePlans.length > 0) {
                    setSelectedRatePlanId(activeRoom.ratePlans[0].id);
                }
            }
            setLoading(false);
        }
        load();
    }, [hotelCodeParam, requestedRoomTypeId]);

    // Calculate nights
    const nights = useMemo(() => {
        const start = new Date(checkIn).getTime();
        const end = new Date(checkOut).getTime();
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 1;
    }, [checkIn, checkOut]);

    // Selected room object
    const selectedRoom = useMemo(() => {
        return engineData?.rooms.find((r) => r.id === selectedRoomId) || null;
    }, [engineData, selectedRoomId]);

    // Selected rate plan object
    const selectedRatePlan = useMemo(() => {
        if (!selectedRoom) return null;
        return (
            selectedRoom.ratePlans.find((p) => p.id === selectedRatePlanId) ||
            selectedRoom.ratePlans[0] ||
            null
        );
    }, [selectedRoom, selectedRatePlanId]);

    // Price Breakdown Calculations
    const priceCalculation = useMemo(() => {
        const pricePerNight = selectedRatePlan?.price || selectedRoom?.basePrice || 0;
        const baseTotal = pricePerNight * nights;
        const taxRate = engineData?.paymentSettings.taxRate || 10;
        const serviceRate = engineData?.paymentSettings.serviceRate || 10;

        const taxAmount = Math.round((baseTotal * taxRate) / 100);
        const serviceAmount = Math.round((baseTotal * serviceRate) / 100);
        const grandTotal = baseTotal + taxAmount + serviceAmount;

        return {
            pricePerNight,
            baseTotal,
            taxAmount,
            serviceAmount,
            grandTotal,
            taxRate,
            serviceRate,
        };
    }, [selectedRatePlan, selectedRoom, nights, engineData]);

    // Handle room selection & jump to checkout step
    const handleProceedToGuestForm = (roomId: string, ratePlanId: string) => {
        setSelectedRoomId(roomId);
        setSelectedRatePlanId(ratePlanId);
        setStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Handle final payment checkout
    const handleCheckoutSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestDetails.fullName || !guestDetails.email || !guestDetails.phone) {
            alert("Mohon lengkapi nama, email, dan nomor telepon kontak.");
            return;
        }

        setIsSubmitting(true);

        const selection: BookingSelection = {
            roomTypeId: selectedRoom?.id || "",
            roomTypeName: selectedRoom?.name || "",
            ratePlanId: selectedRatePlan?.id || "",
            ratePlanName: selectedRatePlan?.name || "",
            nights,
            roomsCount: 1,
            pricePerNight: priceCalculation.pricePerNight,
            baseTotal: priceCalculation.baseTotal,
            taxAmount: priceCalculation.taxAmount,
            serviceAmount: priceCalculation.serviceAmount,
            grandTotal: priceCalculation.grandTotal,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            adults,
            children,
        };

        const res = await createDirectBookingReservation(hotelCodeParam, {
            guest: guestDetails,
            selection,
            paymentMethod: engineData?.paymentSettings.activeProvider || "manual",
            paymentStatus: "pending",
        });

        setIsSubmitting(false);

        if (res.success) {
            setConfirmedBookingCode(res.bookingCode);
            setStep(3);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            alert(res.error || "Terjadi kesalahan saat memproses pemesanan.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0d0f12] text-neutral-300 flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs uppercase tracking-[0.3em] text-neutral-400 font-light">
                        Menyiapkan Tarif & Ketersediaan Kamar...
                    </span>
                </div>
            </div>
        );
    }

    // Add-on Inactive Gate
    if (engineData && !engineData.isAddonActive) {
        return (
            <div className="min-h-screen bg-[#0d0f12] text-neutral-300 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-[#151921] border border-neutral-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
                    <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                        <Lock size={24} />
                    </div>
                    <h2 className="text-xl font-medium text-neutral-100">
                        Direct Booking Belum Diaktifkan
                    </h2>
                    <p className="text-xs text-neutral-400 font-light leading-relaxed">
                        Layanan pemesanan kamar langsung melalui website resmi untuk{" "}
                        <strong className="text-neutral-200">{engineData.hotelName}</strong> sedang dalam masa penataan atau belum diaktifkan oleh pengelola hotel.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-all"
                    >
                        <ArrowLeft size={16} />
                        <span>Kembali ke Beranda</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0d0f12] text-neutral-100 font-sans selection:bg-amber-500 selection:text-black">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-[#0d0f12]/90 backdrop-blur-md border-b border-neutral-800/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="w-8 h-8 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 transition-all"
                        >
                            <ArrowLeft size={16} />
                        </Link>
                        <div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block">
                                Situs Resmi Hotel
                            </span>
                            <span className="text-sm font-semibold text-neutral-100 line-clamp-1">
                                {engineData?.hotelName}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
                            <ShieldCheck size={14} />
                            <span>Jaminan Harga Terbaik</span>
                        </span>
                    </div>
                </div>
            </header>

            {/* Step 1: Room Selection */}
            {step === 1 && (
                <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
                    {/* Search & Date Filter Bar (Google Hotel Compatible) */}
                    <div className="bg-[#151921] border border-neutral-800/80 rounded-2xl p-4 md:p-6 shadow-xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mb-1.5 flex items-center gap-1.5">
                                    <Calendar size={14} className="text-amber-400" />
                                    <span>Check-in</span>
                                </label>
                                <input
                                    type="date"
                                    value={checkIn}
                                    onChange={(e) => setCheckIn(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs font-medium text-neutral-100 focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mb-1.5 flex items-center gap-1.5">
                                    <Calendar size={14} className="text-amber-400" />
                                    <span>Check-out</span>
                                </label>
                                <input
                                    type="date"
                                    value={checkOut}
                                    min={checkIn}
                                    onChange={(e) => setCheckOut(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs font-medium text-neutral-100 focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mb-1.5 flex items-center gap-1.5">
                                    <Users size={14} className="text-amber-400" />
                                    <span>Dewasa (Adults)</span>
                                </label>
                                <select
                                    value={adults}
                                    onChange={(e) => setAdults(parseInt(e.target.value, 10))}
                                    className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs font-medium text-neutral-100 focus:outline-none focus:border-amber-500"
                                >
                                    {[1, 2, 3, 4, 5, 6].map((num) => (
                                        <option key={num} value={num}>
                                            {num} Orang Dewasa
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mb-1.5 flex items-center gap-1.5">
                                    <Users size={14} className="text-amber-400" />
                                    <span>Anak-anak (Children)</span>
                                </label>
                                <select
                                    value={children}
                                    onChange={(e) => setChildren(parseInt(e.target.value, 10))}
                                    className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs font-medium text-neutral-100 focus:outline-none focus:border-amber-500"
                                >
                                    {[0, 1, 2, 3].map((num) => (
                                        <option key={num} value={num}>
                                            {num} Anak
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-amber-400" />
                                <span>Durasi: <strong className="text-neutral-200">{nights} Malam</strong></span>
                            </div>
                            <div className="text-[11px] text-neutral-500">
                                Check-in: {engineData?.paymentSettings.checkInTime} | Check-out: {engineData?.paymentSettings.checkOutTime}
                            </div>
                        </div>
                    </div>

                    {/* Room Cards List */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-lg md:text-xl font-semibold text-neutral-100">
                                Pilihan Tipe Kamar & Tarif Eksklusif
                            </h2>
                            <p className="text-xs text-neutral-400 font-light mt-0.5">
                                Pesan langsung di situs resmi hotel tanpa perantara untuk jaminan konfirmasi instan.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {engineData?.rooms.map((room) => (
                                <div
                                    key={room.id}
                                    className="bg-[#151921] border border-neutral-800/80 hover:border-neutral-700/80 rounded-3xl overflow-hidden shadow-lg transition-all"
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                                        {/* Room Image */}
                                        <div className="lg:col-span-5 relative h-64 lg:h-auto min-h-[220px] bg-neutral-900">
                                            {room.images?.[0]?.url ? (
                                                <Image
                                                    src={room.images[0].url}
                                                    alt={room.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-neutral-600">
                                                    <Bed size={40} />
                                                </div>
                                            )}
                                            <div className="absolute top-3 left-3 bg-neutral-950/80 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-medium text-neutral-300 border border-neutral-700/50">
                                                Luas: {room.roomSizeValue} {room.roomSizeUnit}
                                            </div>
                                        </div>

                                        {/* Room Details & Rate Plans */}
                                        <div className="lg:col-span-7 p-5 md:p-7 flex flex-col justify-between space-y-6">
                                            <div>
                                                <h3 className="text-xl font-semibold text-neutral-100">{room.name}</h3>
                                                <p className="text-xs text-neutral-400 font-light mt-1.5 line-clamp-2 leading-relaxed">
                                                    {room.description || "Kamar nyaman dan luas dengan fasilitas lengkap untuk pengalaman istirahat terbaik."}
                                                </p>

                                                {/* Amenities chips */}
                                                <div className="flex flex-wrap gap-1.5 mt-3">
                                                    {room.amenities?.slice(0, 5).map((amenity, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-900/80 border border-neutral-800 text-[11px] text-neutral-300 font-light"
                                                        >
                                                            <Check size={11} className="text-amber-400" />
                                                            <span>{amenity}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Rate Plans Box */}
                                            <div className="space-y-3 pt-4 border-t border-neutral-800/80">
                                                <span className="text-[11px] uppercase font-bold tracking-wider text-neutral-400 block">
                                                    Pilihan Paket Tarif:
                                                </span>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {room.ratePlans.map((plan) => (
                                                        <div
                                                            key={plan.id}
                                                            className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/50 flex flex-col justify-between transition-all"
                                                        >
                                                            <div>
                                                                <span className="text-xs font-semibold text-neutral-200 block">
                                                                    {plan.name}
                                                                </span>
                                                                <span className="text-[11px] text-neutral-400 font-light mt-0.5 block">
                                                                    {plan.description}
                                                                </span>
                                                            </div>

                                                            <div className="mt-4 pt-3 border-t border-neutral-800 flex items-end justify-between">
                                                                <div>
                                                                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                                                                        Mulai dari
                                                                    </span>
                                                                    <span className="text-base font-bold text-amber-400">
                                                                        Rp {plan.price.toLocaleString("id-ID")}
                                                                    </span>
                                                                    <span className="text-[10px] text-neutral-400"> /malam</span>
                                                                </div>

                                                                <button
                                                                    onClick={() => handleProceedToGuestForm(room.id, plan.id)}
                                                                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs transition-all active:scale-95 shadow-md shadow-amber-500/10"
                                                                >
                                                                    Pilih
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            )}

            {/* Step 2: Guest Details & Payment Checkout */}
            {step === 2 && (
                <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                    <button
                        onClick={() => setStep(1)}
                        className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-200 mb-6 transition-all"
                    >
                        <ArrowLeft size={16} />
                        <span>Ganti Pilihan Kamar</span>
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Guest Form */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="bg-[#151921] border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-neutral-100">Informasi Kontak & Tamu</h2>
                                    <p className="text-xs text-neutral-400 font-light mt-1">
                                        Konfirmasi booking resmi akan dikirimkan langsung ke email dan WhatsApp Anda.
                                    </p>
                                </div>

                                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                                            Nama Lengkap Tamu <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={guestDetails.fullName}
                                            onChange={(e) =>
                                                setGuestDetails((p) => ({ ...p, fullName: e.target.value }))
                                            }
                                            placeholder="Sesuai KTP / Paspor"
                                            className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                                                Alamat Email <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={guestDetails.email}
                                                onChange={(e) =>
                                                    setGuestDetails((p) => ({ ...p, email: e.target.value }))
                                                }
                                                placeholder="nama@email.com"
                                                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                                                Nomor WhatsApp / HP <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                required
                                                value={guestDetails.phone}
                                                onChange={(e) =>
                                                    setGuestDetails((p) => ({ ...p, phone: e.target.value }))
                                                }
                                                placeholder="081234567890"
                                                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                                            Permintaan Khusus (Opsional)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={guestDetails.specialRequests || ""}
                                            onChange={(e) =>
                                                setGuestDetails((p) => ({ ...p, specialRequests: e.target.value }))
                                            }
                                            placeholder="Contoh: Bebas asap rokok, lantai atas, check-in terlambat"
                                            className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500 resize-none"
                                        />
                                    </div>

                                    {/* Payment Method Notice */}
                                    <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-2">
                                        <span className="text-xs font-semibold text-neutral-200 flex items-center gap-2">
                                            <CreditCard size={16} className="text-amber-400" />
                                            <span>Metode Pembayaran Resmi Hotel:</span>
                                        </span>
                                        <p className="text-xs text-neutral-400 font-light leading-relaxed">
                                            {engineData?.paymentSettings.activeProvider === "midtrans" &&
                                                "Pembayaran instan online didukung oleh Midtrans (QRIS, BCA VA, Mandiri, Kartu Kredit)."}
                                            {engineData?.paymentSettings.activeProvider === "xendit" &&
                                                "Pembayaran invoice instan didukung oleh Xendit (QRIS, Virtual Account, E-Wallet)."}
                                            {engineData?.paymentSettings.activeProvider === "manual" &&
                                                "Transfer langsung ke rekening resmi hotel. Instruksi dan nomor rekening akan diberikan setelah konfirmasi."}
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/10 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Lock size={16} />
                                                <span>Lanjutkan Pembayaran Aman</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Price Summary Sidebar */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="bg-[#151921] border border-neutral-800 rounded-3xl p-6 md:p-7 shadow-xl space-y-5 sticky top-24">
                                <h3 className="text-base font-semibold text-neutral-100 border-b border-neutral-800 pb-3">
                                    Ringkasan Reservasi
                                </h3>

                                <div className="space-y-3 text-xs">
                                    <div className="flex justify-between text-neutral-300">
                                        <span className="text-neutral-400">Tipe Kamar:</span>
                                        <strong className="font-semibold text-neutral-100 text-right">{selectedRoom?.name}</strong>
                                    </div>

                                    <div className="flex justify-between text-neutral-300">
                                        <span className="text-neutral-400">Paket Tarif:</span>
                                        <span className="text-amber-400 font-medium text-right">{selectedRatePlan?.name}</span>
                                    </div>

                                    <div className="flex justify-between text-neutral-300">
                                        <span className="text-neutral-400">Jadwal Menginap:</span>
                                        <span className="text-right">{checkIn} s/d {checkOut} ({nights} Malam)</span>
                                    </div>

                                    <div className="flex justify-between text-neutral-300">
                                        <span className="text-neutral-400">Jumlah Tamu:</span>
                                        <span className="text-right">{adults} Dewasa{children > 0 ? `, ${children} Anak` : ""}</span>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4 border-t border-neutral-800 text-xs">
                                    <div className="flex justify-between text-neutral-400">
                                        <span>Tarif Kamar ({nights} malam):</span>
                                        <span className="text-neutral-200">Rp {priceCalculation.baseTotal.toLocaleString("id-ID")}</span>
                                    </div>

                                    <div className="flex justify-between text-neutral-400">
                                        <span>Pajak Daerah PB1 ({priceCalculation.taxRate}%):</span>
                                        <span className="text-neutral-200">Rp {priceCalculation.taxAmount.toLocaleString("id-ID")}</span>
                                    </div>

                                    <div className="flex justify-between text-neutral-400">
                                        <span>Service Charge ({priceCalculation.serviceRate}%):</span>
                                        <span className="text-neutral-200">Rp {priceCalculation.serviceAmount.toLocaleString("id-ID")}</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-neutral-800 flex justify-between items-baseline">
                                    <div>
                                        <span className="text-xs text-neutral-400 block font-light">Total Pembayaran:</span>
                                        <span className="text-2xl font-bold text-amber-400 font-mono">
                                            Rp {priceCalculation.grandTotal.toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            )}

            {/* Step 3: Confirmation & Payment Instructions */}
            {step === 3 && (
                <main className="max-w-2xl mx-auto px-4 py-12 text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                        <CheckCircle size={32} />
                    </div>

                    <div>
                        <span className="text-xs uppercase font-bold tracking-widest text-emerald-400 block mb-1">
                            Reservasi Berhasil Dibuat
                        </span>
                        <h1 className="text-2xl md:text-3xl font-bold text-neutral-100">
                            Terima Kasih, {guestDetails.fullName}!
                        </h1>
                        <p className="text-xs text-neutral-400 font-light mt-2 leading-relaxed">
                            Kode pemesanan Anda telah diterbitkan. Silakan selesaikan pembayaran sesuai instruksi di bawah ini.
                        </p>
                    </div>

                    {/* Booking Reference Card */}
                    <div className="bg-[#151921] border border-neutral-800 rounded-3xl p-6 text-left space-y-4 shadow-xl">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                            <span className="text-xs text-neutral-400 font-light">Nomor Kode Booking:</span>
                            <strong className="text-base font-mono font-bold text-amber-400 select-all tracking-wider">
                                {confirmedBookingCode}
                            </strong>
                        </div>

                        {/* Bank Transfer Instructions */}
                        {engineData?.paymentSettings.activeProvider === "manual" && (
                            <div className="space-y-4 pt-2">
                                <span className="text-xs font-semibold text-neutral-200 block">
                                    Transfer ke Rekening Resmi Hotel:
                                </span>
                                {engineData.paymentSettings.manualBanks.map((b) => (
                                    <div
                                        key={b.id}
                                        className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1.5"
                                    >
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-amber-300">{b.bankName}</span>
                                            <span className="font-mono text-neutral-200 font-bold text-sm select-all">
                                                {b.accountNumber}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-neutral-400">
                                            Atas Nama: <strong className="text-neutral-300">{b.accountHolder}</strong>
                                        </div>
                                    </div>
                                ))}

                                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
                                    Total yang harus ditransfer: <strong className="text-white font-mono text-sm">Rp {priceCalculation.grandTotal.toLocaleString("id-ID")}</strong>. Cantumkan kode booking pada berita transfer.
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                        <Link
                            href="/"
                            className="px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-all"
                        >
                            Kembali ke Beranda
                        </Link>
                    </div>
                </main>
            )}
        </div>
    );
}
