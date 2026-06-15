"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { PageLayout } from "@/components/layout/PageLayout";
import { FooterSection } from "@/components/sections/footer/FooterSection";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Filter, Maximize2, Camera } from "lucide-react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

interface GalleryImage {
    id: string;
    url: string;
    category: string;
    title: string;
}

const CATEGORIES = ["All", "Sanctuary", "Culinary", "Lifestyle", "Adventure"];

export default function GalleryPage() {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("All");
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [isHoveringImg, setIsHoveringImg] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const cursorRef = useRef<HTMLDivElement>(null);
    const heroRef = useRef<HTMLDivElement>(null);

    // Fetch Images
    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const q = query(getHotelCollection(db, "gallery"), orderBy("createdAt", "desc"));
                const snap = await getDocs(q);
                // In case some images don't have categories in DB, we'll assign them random ones from our list for visual variety
                const data = snap.docs.map(d => ({ 
                    id: d.id, 
                    ...d.data(),
                    category: d.data().category || CATEGORIES[Math.floor(Math.random() * (CATEGORIES.length - 1)) + 1],
                    title: d.data().title || "Untitled"
                })) as GalleryImage[];
                setImages(data);
            } catch (err) {
                console.error("Error fetching gallery:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchGallery();
    }, []);

    // Filter Logic
    const filteredImages = useMemo(() => {
        if (activeCategory === "All") return images;
        return images.filter(img => img.category.toLowerCase() === activeCategory.toLowerCase());
    }, [images, activeCategory]);

    // Animations: Hero & Grid
    useEffect(() => {
        if (!loading) {
            const ctx = gsap.context(() => {
                // Hero Reveal
                gsap.from(".hero-text", {
                    y: 100,
                    opacity: 0,
                    duration: 1.5,
                    stagger: 0.2,
                    ease: "power4.out"
                });

                gsap.from(".hero-bg", {
                    scale: 1.2,
                    opacity: 0,
                    duration: 2,
                    ease: "power2.out"
                });

                // Grid Stagger (only on first load)
                gsap.from(".gallery-item", {
                    y: 60,
                    opacity: 0,
                    duration: 1.2,
                    stagger: {
                        amount: 0.8,
                        grid: "auto",
                        from: "start"
                    },
                    ease: "expo.out"
                });
            }, containerRef);

            return () => ctx.revert();
        }
    }, [loading]);

    // Body Scroll Lock & Escape Key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSelectedImage(null);
        };

        if (selectedImage) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleEsc);
        } else {
            document.body.style.overflow = "unset";
        }
        
        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleEsc);
        };
    }, [selectedImage]);

    // Cursor Follow Logic


    if (loading) return (
        <div className="h-screen w-full bg-[#111310] flex items-center justify-center overflow-hidden">
            <div className="relative">
                <div className="w-24 h-24 border-t border-[#788069] rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] text-[#788069] tracking-[0.5em] uppercase font-body animate-pulse">Bumi</span>
                </div>
            </div>
        </div>
    );

    return (
        <PageLayout forceScrolledState={true}>
            <main ref={containerRef} className="bg-[#fdfbf7] min-h-screen relative selection:bg-[#788069] selection:text-white">
                
                {/* ── Custom Cursor ── */}
                <div 
                    ref={cursorRef}
                    className="fixed top-0 left-0 w-24 h-24 rounded-full pointer-events-none z-[9999] mix-blend-difference hidden lg:flex items-center justify-center transition-transform duration-300 ease-out"
                    style={{ 
                        transform: `translate(${cursorPos.x - 48}px, ${cursorPos.y - 48}px) scale(${isHoveringImg ? 1 : 0})`,
                        background: 'white'
                    }}
                >
                    <span className="text-[10px] font-black uppercase tracking-widest text-black">View</span>
                </div>

                {/* ── Cinematic Hero ── */}
                <section ref={heroRef} className="relative h-screen w-full flex items-center justify-center overflow-hidden">
                    <div className="hero-bg absolute inset-0">
                        <Image 
                            src={images[0]?.url || "https://images.unsplash.com/photo-1542314831-c53cd4b85ca4?auto=format&fit=crop&q=80"}
                            alt="Bumi Anyom"
                            fill
                            priority
                            className="object-cover brightness-50"
                        />
                    </div>
                    
                    <div className="relative z-10 text-center px-6">
                        <span className="hero-text text-white/60 text-[10px] font-black tracking-[0.6em] uppercase mb-8 block">Exquisite Perspectives</span>
                        <h1 className="hero-text text-6xl md:text-9xl text-white font-serif italic leading-[0.8] tracking-tighter uppercase">
                            The <br /> <span className="text-[#a8b09a]">Aura</span> Gallery
                        </h1>
                        <div className="hero-text mt-12 overflow-hidden h-6 flex justify-center">
                            <motion.div 
                                animate={{ y: [0, -20, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="flex flex-col items-center gap-4"
                            >
                                <span className="text-white/40 text-[9px] font-bold uppercase tracking-[0.4em]">Scroll to Explore</span>
                                <div className="w-[1px] h-12 bg-white/20" />
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ── Controls & Filter ── */}
                <section className="sticky top-0 z-40 bg-[#fdfbf7]/80 backdrop-blur-xl border-b border-black/5 py-8 md:py-12 px-6">
                    <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-10 h-10 rounded-full bg-[#111310] flex items-center justify-center text-white">
                                <Filter size={14} />
                            </div>
                            <div className="flex flex-wrap gap-2 md:gap-4">
                                {CATEGORIES.map((cat) => (
                                    <button 
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 border
                                            ${activeCategory === cat 
                                                ? 'bg-[#111310] text-white border-transparent' 
                                                : 'bg-transparent text-[#111310]/40 border-black/5 hover:border-[#111310] hover:text-[#111310]'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-[#111310]/30">
                            <Camera size={18} />
                            <span className="text-[10px] font-black uppercase tracking-[0.5em]">{filteredImages.length} Captures</span>
                        </div>
                    </div>
                </section>

                {/* ── Dynamic Grid ── */}
                <section className="max-w-[1920px] mx-auto px-6 md:px-12 py-24 md:py-32">
                    <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8">
                        <AnimatePresence mode="popLayout">
                            {filteredImages.map((img, idx) => (
                                <motion.div 
                                    key={img.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.5, ease: "circOut" }}
                                    className="gallery-item group relative overflow-hidden rounded-[2rem] break-inside-avoid cursor-none"
                                    onMouseEnter={() => setIsHoveringImg(true)}
                                    onMouseLeave={() => setIsHoveringImg(false)}
                                    onClick={() => setSelectedImage(img)}
                                >
                                    <img 
                                        src={img.url} 
                                        alt={img.title} 
                                        className="w-full h-auto object-cover transition-all duration-1000 group-hover:scale-105"
                                    />
                                    
                                    {/* Overlay Info */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col justify-end p-10">
                                        <div className="translate-y-8 group-hover:translate-y-0 transition-transform duration-700 space-y-2">
                                            <span className="text-white/60 text-[9px] font-bold uppercase tracking-[0.4em]">{img.category}</span>
                                            <h3 className="text-2xl text-white font-serif italic">{img.title}</h3>
                                            <div className="h-[1px] w-0 group-hover:w-full bg-[#788069] transition-all duration-1000 delay-300" />
                                        </div>
                                    </div>

                                    {/* Reveal Corner Frame */}
                                    <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-[#788069] opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-700 delay-100" />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </section>

                {/* ── Advanced Lightbox ── */}
                <AnimatePresence>
                    {selectedImage && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#111310]/98 backdrop-blur-3xl p-4 md:p-20 overflow-hidden cursor-zoom-out"
                            onClick={() => setSelectedImage(null)}
                        >
                            {/* Backdrop Close Progress Indicator (Subtle) */}
                            <div className="absolute top-10 left-10 text-white/20 text-[8px] font-black uppercase tracking-[0.5em] pointer-events-none">
                                ESC or Click anywhere to Close
                            </div>
                            <button 
                                onClick={() => setSelectedImage(null)}
                                className="absolute top-10 right-10 text-white/50 hover:text-white transition-all z-50 cursor-pointer p-4"
                            >
                                <X size={40} strokeWidth={1} />
                            </button>

                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                transition={{ type: "spring", damping: 30, stiffness: 200 }}
                                className="relative w-full h-full max-w-[90vw] max-h-[80vh] flex flex-col items-center justify-center gap-12"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="relative w-full h-full">
                                    <Image 
                                        src={selectedImage.url} 
                                        alt={selectedImage.title}
                                        fill
                                        className="object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
                                        priority
                                    />
                                </div>
                                
                                <div className="text-center space-y-3 pb-4">
                                    <div className="flex items-center justify-center gap-4 mb-2">
                                        <div className="w-8 h-[1px] bg-[#788069]/40" />
                                        <span className="text-[#a8b09a] text-[10px] font-black tracking-[0.6em] uppercase">{selectedImage.category}</span>
                                        <div className="w-8 h-[1px] bg-[#788069]/40" />
                                    </div>
                                    <h2 className="text-3xl md:text-5xl text-white font-serif italic tracking-tight">{selectedImage.title}</h2>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <FooterSection />
            </main>
        </PageLayout>
    );
}
