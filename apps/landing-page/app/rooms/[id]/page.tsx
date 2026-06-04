"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PageLayout } from "@/components/layout/PageLayout";
import { RoomDetailsHero } from "@/components/sections/rooms/RoomDetailsHero";
import { FooterSection } from "@/components/sections/footer/FooterSection";
import { 
    Wifi, AirVent, Tv, Coffee, Refrigerator, Waves, 
    Wind, Utensils, CigaretteOff, ShieldCheck, Key, 
    Bath, Smartphone, Zap, Smile, Check, ArrowRight,
    MapPin, Users, Maximize, Bed
} from "lucide-react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLandingSettings } from "@/services/useLandingSettings";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

interface RoomImage {
    url: string;
    isProfile: boolean;
}

interface RoomType {
    id: string;
    name: string;
    description: string;
    images: RoomImage[];
    amenities: string[];
    bookingUrl: string;
    capacity?: number;
    roomSizeValue?: number;
    roomSizeUnit?: string;
    beds?: { type: string; quantity: number; size: string }[];
}

export default function RoomDetailsPage() {
    const { id } = useParams();
    const { bookingEngineUrl } = useLandingSettings();
    const [room, setRoom] = useState<RoomType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoom = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, "roomTypes", id as string);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setRoom({ id: docSnap.id, ...docSnap.data() } as RoomType);
                }
            } catch (err) {
                console.error("Error fetching room details:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRoom();
    }, [id]);

    useEffect(() => {
        if (!loading && room) {
            gsap.from(".reveal-item", {
                y: 30,
                opacity: 0,
                duration: 1,
                stagger: 0.1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: ".details-container",
                    start: "top 80%",
                }
            });
        }
    }, [loading, room]);

    if (loading) return <div className="h-screen w-full bg-[#fdfbf7] flex items-center justify-center">
        <span className="text-[#788069] tracking-widest uppercase animate-pulse">Loading Sanctuary...</span>
    </div>;

    if (!room) return <div className="h-screen w-full bg-[#fdfbf7] flex items-center justify-center">
        <div className="text-center space-y-4">
            <h1 className="text-4xl font-serif">Room Not Found</h1>
            <Link href="/" className="text-[#788069] underline">Return Home</Link>
        </div>
    </div>;

    return (
        <PageLayout forceScrolledState={true}>
            <main className="bg-[#fdfbf7]">
                <RoomDetailsHero images={room.images} name={room.name} />

                <div className="details-container max-w-7xl mx-auto px-6 py-24 md:py-32">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
                        
                        {/* Main Description */}
                        <div className="lg:col-span-7 space-y-12">
                            <div className="space-y-6 reveal-item">
                                <h2 className="text-xs font-black tracking-[0.5em] uppercase text-[#788069]">Description</h2>
                                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1a1a]/80 italic">
                                    {room.description}
                                </p>
                            </div>

                            {(room.capacity || room.roomSizeValue || (room.beds && room.beds.length > 0)) && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 reveal-item">
                                    {room.capacity && (
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#788069]/60">Capacity</span>
                                            <div className="flex items-center gap-3 text-lg font-light">
                                                <Users size={18} />
                                                <span>{room.capacity} People</span>
                                            </div>
                                        </div>
                                    )}
                                    {!!room.roomSizeValue && (
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#788069]/60">Size</span>
                                            <div className="flex items-center gap-3 text-lg font-light">
                                                <Maximize size={18} />
                                                <span>{room.roomSizeValue} {room.roomSizeUnit === 'm2' ? 'm²' : room.roomSizeUnit}</span>
                                            </div>
                                        </div>
                                    )}
                                    {room.beds && room.beds.length > 0 && (
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#788069]/60">Beds</span>
                                            <div className="flex flex-col gap-1 text-lg font-light">
                                                {room.beds.map((bed, idx) => (
                                                    <div key={idx} className="flex items-center gap-3">
                                                        <Bed size={18} />
                                                        <span>{bed.quantity}x {bed.type}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-8 reveal-item pt-8 border-t border-black/5">
                                <h2 className="text-xs font-black tracking-[0.5em] uppercase text-[#788069]">Facilities & Amenities</h2>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                    {room.amenities.map((amenity, i) => {
                                        const iconProps = { size: 18, className: "text-[#788069] mt-0.5 shrink-0" };
                                        let IconComponent = Check;
                                        
                                        const lowerAmenity = amenity.toLowerCase();
                                        if (lowerAmenity.includes('wifi') || lowerAmenity.includes('internet')) IconComponent = Wifi;
                                        else if (lowerAmenity.includes('ac') || lowerAmenity.includes('air')) IconComponent = AirVent;
                                        else if (lowerAmenity.includes('tv') || lowerAmenity.includes('television')) IconComponent = Tv;
                                        else if (lowerAmenity.includes('coffee') || lowerAmenity.includes('tea')) IconComponent = Coffee;
                                        else if (lowerAmenity.includes('fridge') || lowerAmenity.includes('refrigerator')) IconComponent = Refrigerator;
                                        else if (lowerAmenity.includes('pool')) IconComponent = Waves;
                                        else if (lowerAmenity.includes('hair') || lowerAmenity.includes('dryer')) IconComponent = Wind;
                                        else if (lowerAmenity.includes('breakfast') || lowerAmenity.includes('food')) IconComponent = Utensils;
                                        else if (lowerAmenity.includes('smoke') || lowerAmenity.includes('smoking') || lowerAmenity.includes('no smoking')) IconComponent = CigaretteOff;
                                        else if (lowerAmenity.includes('safe') || lowerAmenity.includes('security')) IconComponent = ShieldCheck;
                                        else if (lowerAmenity.includes('key')) IconComponent = Key;
                                        else if (lowerAmenity.includes('bath') || lowerAmenity.includes('tube')) IconComponent = Bath;
                                        else if (lowerAmenity.includes('usb') || lowerAmenity.includes('charger') || lowerAmenity.includes('charging')) IconComponent = Smartphone;
                                        else if (lowerAmenity.includes('power') || lowerAmenity.includes('backup') || lowerAmenity.includes('electricity')) IconComponent = Zap;
                                        else if (lowerAmenity.includes('dental') || lowerAmenity.includes('toothpaste') || lowerAmenity.includes('brush')) IconComponent = Smile;

                                        return (
                                            <li key={i} className="flex items-center gap-4 text-lg font-light text-[#1a1a1a]/70">
                                                <IconComponent {...iconProps} />
                                                <span>{amenity}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>

                        {/* Sidebar / CTA */}
                        <div className="lg:col-span-5">
                            <div className="sticky top-32 p-12 bg-white rounded-[3rem] border border-black/5 shadow-2xl space-y-10 reveal-item">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#788069]">Your Stay at</span>
                                    <h3 className="text-4xl font-serif italic">{room.name}</h3>
                                </div>

                                <div className="flex flex-col gap-4 text-sm font-light text-[#1a1a1a]/60 leading-relaxed">
                                    <p>Sempurnakan perjalanan batin Anda dan temukan kedamaian sejati hanya di Bumi Anyom. Setiap jengkal ruang kami rancang khusus untuk menyatukan Anda dengan kemurnian alam.</p>
                                </div>

                                <a 
                                    href={bookingEngineUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-full py-6 bg-[#1a1a1a] text-white rounded-2xl flex items-center justify-center gap-4 group hover:bg-[#788069] transition-all duration-500"
                                >
                                    <span className="text-[11px] font-black uppercase tracking-[0.4em]">Book This Room</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-500" />
                                </a>

                                <div className="pt-6 border-t border-black/5 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-black/30">
                                    <span>Bumi Anyom</span>
                                    <span>#KembaliMembumi</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <FooterSection />
            </main>
        </PageLayout>
    );
}
