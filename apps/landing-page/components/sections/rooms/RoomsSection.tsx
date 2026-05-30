import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
    ArrowRight, ChevronLeft, ChevronRight, Check, Users, Maximize, Bed,
    Wifi, AirVent, Tv, Coffee, Refrigerator, Waves, Wind, Utensils, CigaretteOff, ShieldCheck, Key, Bath, Smartphone, Zap, Smile 
} from "lucide-react";

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

// ── INNER SLIDER COMPONENT ──
const RoomImageSlider = ({ images, name }: { images: RoomImage[]; name: string }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden group rounded-xl">
            {images.map((img, idx) => (
                <div
                    key={idx}
                    className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                    style={{
                        opacity: idx === currentIndex ? 1 : 0,
                        zIndex: idx === currentIndex ? 10 : 0
                    }}
                >
                    <img
                        src={img.url}
                        alt={`${name} view ${idx + 1}`}
                        className="w-full h-full object-cover"
                    />
                </div>
            ))}

            {/* Overlay Gradient for contrast */}
            <div className="absolute inset-0 bg-black/10 z-10 pointer-events-none" />

            {/* Slider Controls */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-4 group-hover:translate-x-0"
                        aria-label="Previous image"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0"
                        aria-label="Next image"
                    >
                        <ChevronRight size={24} />
                    </button>

                    {/* Dots Indicator */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'}`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export const RoomsSection = () => {
    const [rooms, setRooms] = useState<RoomType[]>([]);
    const [loading, setLoading] = useState(true);
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
                { y: 50, opacity: 0 },
                {
                    y: 0, opacity: 1, duration: 1.5, ease: "power2.out", stagger: 0.15,
                    scrollTrigger: {
                        trigger: ".rooms-header-trigger",
                        start: "top 80%", 
                        toggleActions: "play reverse play reverse"
                    }
                }
            );

            // Individual Room Rows Animation
            const roomRows = gsap.utils.toArray('.room-row') as HTMLElement[];
            roomRows.forEach((row, index) => {
                const isEven = index % 2 === 0;
                const textBlock = row.querySelector('.room-text');
                const imageBlock = row.querySelector('.room-image');

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: row,
                        start: "top 75%",
                        toggleActions: "play reverse play reverse",
                    }
                });

                // Slide text in based on direction
                if (textBlock) {
                    tl.fromTo(textBlock,
                        { x: isEven ? -50 : 50, opacity: 0 },
                        { x: 0, opacity: 1, duration: 1.5, ease: "power2.out" }
                    );
                }

                // Slide & fade image in slightly after text
                if (imageBlock) {
                    tl.fromTo(imageBlock,
                        { scale: 0.95, opacity: 0 },
                        { scale: 1, opacity: 1, duration: 1.8, ease: "power2.out" },
                        "-=1.0" // overlap with text animation
                    );
                }
            });

        }, sectionRef);

        return () => ctx.revert();
    }, [loading, rooms]);

    if (loading || rooms.length === 0) return null;

    return (
        <section
            ref={sectionRef}
            // Use a light luxury background with a subtle architectural pattern
            className="w-full relative bg-[#fdfbf7] py-24 md:py-32 overflow-hidden flex flex-col items-center"
            id="accommodations"
        >
            {/* BOLD GEOMETRIC CENTERPIECE BACKGROUND */}
            <div className="absolute inset-0 pointer-events-none z-0 flex flex-col items-center justify-center overflow-hidden opacity-[0.2]">
                <div className="relative flex items-center justify-center w-full h-[100vh]">
                    {/* Sharp Intersecting Rectangles */}
                    <div className="w-[250px] md:w-[400px] h-[400px] md:h-[600px] border-[3px] border-[#788069] absolute" />
                    <div className="w-[400px] md:w-[600px] h-[250px] md:h-[400px] border-[3px] border-[#788069] absolute translate-x-8 translate-y-8 md:translate-x-16 md:translate-y-16" />
                    
                    {/* Inner Accent Box */}
                    <div className="w-[150px] md:w-[250px] h-[150px] md:h-[250px] bg-[#788069]/10 absolute -translate-x-8 -translate-y-8 md:-translate-x-16 md:-translate-y-16" />
                    
                    {/* Crossing Lines */}
                    <div className="w-[100vw] h-[1px] bg-[#788069]/50 absolute" />
                    <div className="h-[200vh] w-[1px] bg-[#788069]/50 absolute" />
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-8 w-full relative z-10">

                {/* SECTION HEADER */}
                <div className="rooms-header-trigger flex flex-col items-center text-center mb-20 md:mb-32 max-w-4xl mx-auto">
                    <span className="rooms-header-block inline-block text-[#788069] font-black text-[10px] md:text-xs tracking-[0.4em] uppercase mb-6 border-b border-[#788069]/30 pb-3">
                        Sanctuary
                    </span>
                    <h2
                        className="rooms-header-block text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-[#1a1a1a] font-light leading-[0.9] uppercase drop-shadow-sm mb-8"
                        style={{ fontFamily: "var(--font-display), serif" }}
                    >
                        Accommodations
                    </h2>
                    <p className="rooms-header-block text-[#1a1a1a]/60 max-w-xl mx-auto text-sm md:text-base font-light tracking-wide leading-relaxed">
                        Retreat into meticulously designed spaces where nature's tranquility meets unparalleled five-star luxury.
                    </p>
                </div>

                {/* ROOM ROWS */}
                <div className="flex flex-col gap-24 md:gap-32 lg:gap-40">
                    {rooms.map((room, index) => {
                        // Alternating layout: even rows text on left, odd rows text on right (on desktop)
                        const isEven = index % 2 === 0;

                        return (
                            <div
                                key={room.id}
                                className={`room-row flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12 lg:gap-20`}
                            >
                                {/* TEXT BLOCK */}
                                <div className="room-text w-full lg:w-5/12 flex flex-col justify-center">
                                    <h3
                                        className="text-4xl md:text-5xl lg:text-6xl text-[#1a1a1a] leading-tight mb-6 relative inline-block"
                                        style={{ fontFamily: "var(--font-display), serif" }}
                                    >
                                        {room.name}
                                        {/* Subtle architectural accent line behind title */}
                                        <div className="absolute -bottom-2 -left-4 w-12 h-0.5 bg-[#788069]/40" />
                                    </h3>

                                    <p className="text-[#1a1a1a]/70 text-sm md:text-base leading-relaxed mb-8">
                                        {room.description}
                                    </p>

                                    {/* Room Specs */}
                                    <div className="flex flex-wrap gap-6 mb-10 pb-10 border-b border-black/5">
                                        {room.capacity && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] font-bold text-[#788069] uppercase tracking-widest opacity-60">Kapasitas</span>
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <Users size={14} className="text-[#788069]" />
                                                    <span>{room.capacity} Orang</span>
                                                </div>
                                            </div>
                                        )}
                                        {room.roomSizeValue ? (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] font-bold text-[#788069] uppercase tracking-widest opacity-60">Luas Kamar</span>
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <Maximize size={14} className="text-[#788069]" />
                                                    <span>{room.roomSizeValue} {room.roomSizeUnit === 'm2' ? 'm²' : room.roomSizeUnit}</span>
                                                </div>
                                            </div>
                                        ) : null}
                                        {room.beds && room.beds.length > 0 && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] font-bold text-[#788069] uppercase tracking-widest opacity-60">Konfigurasi Bed</span>
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <Bed size={14} className="text-[#788069]" />
                                                    <div className="flex flex-col">
                                                        {room.beds.map((bed, i) => (
                                                            <span key={i} className="leading-tight">{bed.quantity}x {bed.type}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Amenities List */}
                                    {room.amenities && room.amenities.length > 0 && (
                                        <div className="mb-10">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#788069] mb-4">
                                                Fasilitas
                                            </p>
                                            <ul className="grid grid-cols-2 gap-3">
                                                {room.amenities.slice(0, 6).map((amenity, i) => {
                                                    // Map amenity string to Lucide icon based on backend data
                                                    const iconProps = { size: 16, className: "text-[#788069] mt-0.5 shrink-0" };
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
                                                        <li key={i} className="flex items-start gap-2 text-[#1a1a1a]/70 text-sm">
                                                            <IconComponent {...iconProps} />
                                                            <span className="line-clamp-1">{amenity}</span>
                                                        </li>
                                                    );
                                                })}
                                                {room.amenities.length > 6 && (
                                                    <li className="flex items-center gap-2 text-[#1a1a1a]/40 text-sm italic">
                                                        + {room.amenities.length - 6} more
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                    <Link
                                        href={`/rooms/${room.id}`}
                                        className="group relative inline-flex items-center justify-center px-8 py-4 hover:px-14 bg-[#1a1a1a] text-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 ease-out self-start border border-[#1a1a1a]"
                                    >
                                        <div className="absolute inset-0 bg-[#788069] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]" />
                                        <span className="relative z-10 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] transition-colors duration-300">
                                            More Info
                                            <ArrowRight
                                                className="group-hover:translate-x-2 transition-transform duration-300"
                                                size={14}
                                            />
                                        </span>
                                    </Link>
                                </div>

                                {/* IMAGE BLOCK SLIDER */}
                                <div className="room-image w-full lg:w-7/12">
                                    {room.images && room.images.length > 0 ? (
                                        <RoomImageSlider images={room.images} name={room.name} />
                                    ) : (
                                        <div className="w-full h-[400px] md:h-[500px] rounded-xl bg-white/5 flex items-center justify-center">
                                            <span className="text-white/20 tracking-widest uppercase text-sm">No Images Available</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
