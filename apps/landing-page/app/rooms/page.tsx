"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PageLayout } from "@/components/layout/PageLayout";
import { FooterSection } from "@/components/sections/footer/FooterSection";
import {
    Users, Maximize, Bed, ArrowRight,
    Wifi, AirVent, Tv, Coffee, Refrigerator, Waves,
    Wind, Utensils, ShieldCheck, Bath, Smartphone, Zap, Smile, Check
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";

interface RoomType {
    id: string;
    name: string;
    description: string;
    images: { url: string; isProfile: boolean }[];
    amenities?: string[];
    capacity?: number;
    roomSizeValue?: number;
    roomSizeUnit?: string;
    beds?: { type: string; quantity: number; size: string }[];
}

function getAmenityIcon(amenity: string) {
    const a = amenity.toLowerCase();
    if (a.includes("wifi") || a.includes("internet")) return Wifi;
    if (a.includes("ac") || a.includes("air")) return AirVent;
    if (a.includes("tv") || a.includes("television")) return Tv;
    if (a.includes("coffee") || a.includes("tea")) return Coffee;
    if (a.includes("fridge") || a.includes("refrigerator")) return Refrigerator;
    if (a.includes("pool")) return Waves;
    if (a.includes("hair") || a.includes("dryer")) return Wind;
    if (a.includes("breakfast") || a.includes("food")) return Utensils;
    if (a.includes("safe") || a.includes("security")) return ShieldCheck;
    if (a.includes("bath") || a.includes("tube")) return Bath;
    if (a.includes("usb") || a.includes("charger")) return Smartphone;
    if (a.includes("power") || a.includes("backup")) return Zap;
    if (a.includes("dental") || a.includes("toothpaste")) return Smile;
    return Check;
}

export default function RoomsPage() {
    const [rooms, setRooms] = useState<RoomType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const q = query(collection(db, "roomTypes"), orderBy("name"));
                const snap = await getDocs(q);
                setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })) as RoomType[]);
            } catch (err) {
                console.error("Error fetching rooms:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRooms();
    }, []);

    useEffect(() => {
        if (!loading && rooms.length > 0) {
            const ctx = gsap.context(() => {
                gsap.fromTo(".reveal-card", 
                    { y: 40, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: "power3.out" }
                );
            });
            return () => ctx.revert();
        }
    }, [loading, rooms]);

    if (loading) return (
        <div className="h-screen w-full bg-[#fdfbf7] flex items-center justify-center">
            <span className="text-[#788069] tracking-[0.4em] uppercase animate-pulse text-[10px] font-bold">
                Discovering Sanctuary...
            </span>
        </div>
    );

    return (
        <PageLayout forceScrolledState={true}>
            <main className="bg-[#fdfbf7] min-h-screen">

                {/* ── Hero ── */}
                <section className="pt-32 pb-10 text-center px-6">
                    <span className="text-[#788069] text-[9px] font-black tracking-[0.65em] uppercase block mb-4">
                        Private Sanctuaries
                    </span>
                    <h1 className="text-5xl md:text-7xl font-serif italic text-[#1a1a1a] leading-none">
                        Accommodations
                    </h1>
                    <div className="mt-6 flex items-center justify-center gap-4">
                        <div className="h-px w-12 bg-[#c5a880]" />
                        <span className="text-[9px] font-bold tracking-[0.35em] uppercase text-[#c5a880]">
                            {rooms.length} Room{rooms.length !== 1 ? "s" : ""}
                        </span>
                        <div className="h-px w-12 bg-[#c5a880]" />
                    </div>
                    <p className="mt-5 text-sm text-[#1a1a1a]/45 font-light max-w-md mx-auto leading-relaxed">
                        Each space is a private world — designed to restore, to breathe, and to stay.
                    </p>
                </section>

                {/* ── Room Grid ── */}
                <section className="max-w-6xl mx-auto px-5 pb-28">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {rooms.map((room, idx) => {
                            const profileImg = room.images?.find(i => i.isProfile)?.url || room.images?.[0]?.url;
                            const topAmenities = room.amenities?.slice(0, 3) ?? [];
                            const extraCount = (room.amenities?.length ?? 0) - 3;

                            return (
                                <Link
                                    key={room.id}
                                    href={`/rooms/${room.id}`}
                                    className="reveal-card group flex flex-col bg-white rounded-[1.5rem] overflow-hidden border border-black/[0.05] hover:border-[#c5a880]/40 transition-all duration-500 hover:shadow-xl hover:shadow-black/5"
                                >
                                    {/* ── Image ── */}
                                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#ede8df]">
                                        {profileImg ? (
                                            <Image
                                                src={profileImg}
                                                alt={room.name}
                                                fill
                                                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[#788069]/25 text-[10px] tracking-widest uppercase">
                                                No Image
                                            </div>
                                        )}

                                        {/* Index badge */}
                                        <div className="absolute top-3.5 left-3.5 h-6 px-2 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center">
                                            <span className="text-[9px] font-black text-[#1a1a1a] tracking-widest">
                                                {String(idx + 1).padStart(2, "0")}
                                            </span>
                                        </div>

                                        {/* Hover gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    </div>

                                    {/* ── Card Body ── */}
                                    <div className="flex flex-col flex-1 p-5 gap-3">

                                        {/* Title + Arrow */}
                                        <div className="flex items-start justify-between gap-3">
                                            <h3 className="text-[17px] font-serif italic text-[#1a1a1a] group-hover:text-[#788069] transition-colors duration-300 leading-snug">
                                                {room.name}
                                            </h3>
                                            <div className="shrink-0 mt-0.5 w-7 h-7 rounded-full border border-[#1a1a1a]/10 flex items-center justify-center group-hover:bg-[#1a1a1a] group-hover:border-[#1a1a1a] group-hover:text-white transition-all duration-400">
                                                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                                            </div>
                                        </div>

                                        {/* Description */}
                                        {room.description && (
                                            <p className="text-[11.5px] text-[#1a1a1a]/50 font-light line-clamp-2 leading-relaxed italic">
                                                {room.description}
                                            </p>
                                        )}

                                        {/* ── Specs row ── */}
                                        {(room.capacity || room.roomSizeValue || (room.beds && room.beds.length > 0)) && (
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 border-t border-[#1a1a1a]/[0.05]">
                                                {room.capacity && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#788069]">
                                                        <Users size={11} strokeWidth={2.5} />
                                                        <span>{room.capacity} Orang</span>
                                                    </div>
                                                )}
                                                {!!room.roomSizeValue && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#788069]">
                                                        <Maximize size={11} strokeWidth={2.5} />
                                                        <span>{room.roomSizeValue}{room.roomSizeUnit === "m2" ? " m²" : ` ${room.roomSizeUnit}`}</span>
                                                    </div>
                                                )}
                                                {room.beds && room.beds.length > 0 && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#788069]">
                                                        <Bed size={11} strokeWidth={2.5} />
                                                        <span>{room.beds.map(b => `${b.quantity}× ${b.type}`).join(", ")}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* ── Amenity Pills ── */}
                                        {topAmenities.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {topAmenities.map((amenity, i) => {
                                                    const Icon = getAmenityIcon(amenity);
                                                    return (
                                                        <span
                                                            key={i}
                                                            className="flex items-center gap-1 bg-[#fdfbf7] border border-[#1a1a1a]/[0.07] rounded-full px-2.5 py-1 text-[9.5px] font-semibold text-[#1a1a1a]/60 tracking-wide"
                                                        >
                                                            <Icon size={9} strokeWidth={2.5} className="text-[#788069]" />
                                                            {amenity}
                                                        </span>
                                                    );
                                                })}
                                                {extraCount > 0 && (
                                                    <span className="flex items-center bg-[#788069]/8 border border-[#788069]/20 rounded-full px-2.5 py-1 text-[9.5px] font-bold text-[#788069] tracking-wide">
                                                        +{extraCount} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                <FooterSection />
            </main>
        </PageLayout>
    );
}
