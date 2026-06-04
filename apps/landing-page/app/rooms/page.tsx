"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PageLayout } from "@/components/layout/PageLayout";
import { FooterSection } from "@/components/sections/footer/FooterSection";
import { Users, Maximize, Bed, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";

interface RoomType {
    id: string;
    name: string;
    description: string;
    images: { url: string; isProfile: boolean }[];
    capacity?: number;
    roomSizeValue?: number;
    roomSizeUnit?: string;
    beds?: { type: string; quantity: number; size: string }[];
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
        if (!loading) {
            gsap.from(".reveal-card", {
                y: 50,
                opacity: 0,
                duration: 1,
                stagger: 0.15,
                ease: "power3.out"
            });
        }
    }, [loading]);

    if (loading) return (
        <div className="h-screen w-full bg-[#fdfbf7] flex items-center justify-center">
            <span className="text-[#788069] tracking-widest uppercase animate-pulse font-body">Discovering Sanctuary...</span>
        </div>
    );

    return (
        <PageLayout>
            <main className="bg-[#fdfbf7] min-h-screen">
                {/* Hero */}
                <section className="relative h-[50vh] flex items-center justify-center pt-24">
                    <div className="text-center space-y-4">
                        <span className="text-[#788069] text-[10px] font-black tracking-[0.5em] uppercase">Private Sanctuaries</span>
                        <h1 className="text-6xl md:text-8xl font-serif italic text-[#1a1a1a]">Accommodations</h1>
                    </div>
                </section>

                {/* Grid */}
                <section className="max-w-7xl mx-auto px-6 pb-32">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
                        {rooms.map((room) => {
                            const profileImg = room.images?.find(i => i.isProfile)?.url || room.images?.[0]?.url;
                            return (
                                <Link 
                                    key={room.id} 
                                    href={`/rooms/${room.id}`}
                                    className="reveal-card group flex flex-col space-y-6"
                                >
                                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-gray-100 shadow-lg">
                                        {profileImg ? (
                                            <Image 
                                                src={profileImg} 
                                                alt={room.name} 
                                                fill 
                                                className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-sage/10 flex items-center justify-center text-sage/40">No Image</div>
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-700" />
                                    </div>

                                    <div className="space-y-4 px-2">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-3xl font-serif italic group-hover:text-[#788069] transition-colors">{room.name}</h3>
                                            <div className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center group-hover:bg-[#1a1a1a] group-hover:text-white transition-all duration-500">
                                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>

                                        <p className="text-[#1a1a1a]/60 font-light line-clamp-2 leading-relaxed italic">
                                            {room.description}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-[#788069]/60">
                                            {room.capacity && (
                                                <div className="flex items-center gap-2">
                                                    <Users size={14} strokeWidth={2.5} />
                                                    <span>{room.capacity} Orang</span>
                                                </div>
                                            )}
                                            {!!room.roomSizeValue && (
                                                <div className="flex items-center gap-2">
                                                    <Maximize size={14} strokeWidth={2.5} />
                                                    <span>{room.roomSizeValue} {room.roomSizeUnit === 'm2' ? 'm²' : room.roomSizeUnit}</span>
                                                </div>
                                            )}
                                            {room.beds && room.beds.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <Bed size={14} strokeWidth={2.5} />
                                                    <span>
                                                        {room.beds.map((b, i) => `${b.quantity}x ${b.type}`).join(', ')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
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
