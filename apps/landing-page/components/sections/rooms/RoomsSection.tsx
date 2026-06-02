"use client";

import React, { useEffect, useRef, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LayoutGrid, List } from "lucide-react";
import { RoomCard } from "./RoomCard";
import { RoomRow } from "./RoomRow";

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
    beds?: { type: string; quantity: number; size: string }[];
    capacity?: number;
    roomSizeValue?: number;
    roomSizeUnit?: string;
}

export const RoomsSection = () => {
    const [rooms, setRooms] = useState<RoomType[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewType, setViewType] = useState<"grid" | "list">("grid");
    const sectionRef = useRef<HTMLElement>(null);

    // Fetch data
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const q = query(collection(db, "roomTypes"), orderBy("name"));
                const querySnapshot = await getDocs(q);
                const roomsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as RoomType[];
                setRooms(roomsData);
            } catch (err) {
                console.error("Error fetching rooms:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRooms();
    }, []);

    // Scroll Animations
    useEffect(() => {
        if (loading || rooms.length === 0 || !sectionRef.current) return;

        const ctx = gsap.context(() => {
            // Header Animation
            gsap.fromTo(
                ".rooms-header-block",
                { y: 30, opacity: 0 },
                {
                    y: 0, opacity: 1, duration: 1.2, ease: "power2.out", stagger: 0.15,
                    scrollTrigger: {
                        trigger: ".rooms-header-trigger",
                        start: "top 85%", 
                        toggleActions: "play reverse play reverse"
                    }
                }
            );

            // Staggered Entrance Animation for accommodation items
            const items = gsap.utils.toArray('.room-animate-item') as HTMLElement[];
            items.forEach((item) => {
                gsap.fromTo(item,
                    { y: 40, opacity: 0 },
                    {
                        y: 0, opacity: 1, duration: 1.2, ease: "power2.out",
                        scrollTrigger: {
                            trigger: item,
                            start: "top 88%",
                            toggleActions: "play reverse play reverse"
                        }
                    }
                );
            });

        }, sectionRef);

        return () => ctx.revert();
    }, [loading, rooms, viewType]); // Re-run when layout switches to bind animations to new DOM nodes

    // Force GSAP ScrollTrigger to refresh positions when changing layout
    useEffect(() => {
        ScrollTrigger.refresh();
    }, [viewType]);

    if (loading || rooms.length === 0) return null;

    return (
        <section
            ref={sectionRef}
            className="w-full relative bg-[#fdfbf7] py-20 md:py-28 overflow-hidden flex flex-col items-center border-t border-neutral-100"
            id="accommodations"
        >
            {/* Bold Geometric background decoration */}
            <div className="absolute inset-0 pointer-events-none z-0 flex flex-col items-center justify-center overflow-hidden opacity-[0.15]">
                <div className="relative flex items-center justify-center w-full h-[100vh]">
                    <div className="w-[200px] md:w-[350px] h-[350px] md:h-[500px] border-[2px] border-[#788069] absolute" />
                    <div className="w-[350px] md:w-[500px] h-[200px] md:h-[350px] border-[2px] border-[#788069] absolute translate-x-6 translate-y-6 md:translate-x-12 md:translate-y-12" />
                    <div className="w-[100vw] h-[1px] bg-[#788069]/30 absolute" />
                    <div className="h-[200vh] w-[1px] bg-[#788069]/30 absolute" />
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-6 lg:px-8 w-full relative z-10">

                {/* Section Header */}
                <div className="rooms-header-trigger flex flex-col items-center text-center mb-12 md:mb-16 max-w-4xl mx-auto">
                    <span className="rooms-header-block inline-block text-[#788069] font-semibold text-[10px] md:text-xs tracking-[0.3em] uppercase mb-4 border-b border-[#788069]/20 pb-2">
                        Sanctuary
                    </span>
                    <h2
                        className="rooms-header-block text-4xl md:text-5xl lg:text-6xl text-[#1a1a1a] font-light leading-[1.1] uppercase mb-6"
                        style={{ fontFamily: "var(--font-display), serif" }}
                    >
                        Accommodations
                    </h2>
                    <p className="rooms-header-block text-[#1a1a1a]/60 max-w-lg mx-auto text-xs md:text-sm font-light tracking-wide leading-relaxed">
                        Retreat into meticulously designed spaces where nature's tranquility meets unparalleled luxury.
                    </p>
                </div>

                {/* View Mode Toggle Controls */}
                <div className="rooms-header-block flex justify-center md:justify-end mb-10">
                    <div className="bg-[#f0ece3] p-1 rounded-xl border border-neutral-200/40 flex items-center gap-1 shadow-sm">
                        <button
                            onClick={() => setViewType("grid")}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                                viewType === "grid" 
                                ? "bg-[#788069] text-white shadow-sm" 
                                : "text-neutral-500 hover:text-neutral-800"
                            }`}
                            aria-label="Switch to grid view"
                        >
                            <LayoutGrid size={12} />
                            <span>Grid</span>
                        </button>
                        <button
                            onClick={() => setViewType("list")}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                                viewType === "list" 
                                ? "bg-[#788069] text-white shadow-sm" 
                                : "text-neutral-500 hover:text-neutral-800"
                            }`}
                            aria-label="Switch to list view"
                        >
                            <List size={12} />
                            <span>List</span>
                        </button>
                    </div>
                </div>

                {/* Dynamic Accommodations Container */}
                {viewType === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
                        {rooms.map((room) => (
                            <div key={room.id} className="room-animate-item">
                                <RoomCard room={room} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-8 md:gap-12 max-w-6xl mx-auto">
                        {rooms.map((room, index) => (
                            <div key={room.id} className="room-animate-item">
                                <RoomRow room={room} index={index} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};
export default RoomsSection;
