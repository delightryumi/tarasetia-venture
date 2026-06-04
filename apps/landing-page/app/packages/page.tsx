"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PageLayout } from "@/components/layout/PageLayout";
import { FooterSection } from "@/components/sections/footer/FooterSection";
import { Users, Clock, Star, ArrowRight, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";

interface PackageItem {
    id: string;
    name: string;
    category: string;
    description: string;
    price: number;
    imageUrl: string;
}

export default function PackagesPage() {
    const [packages, setPackages] = useState<PackageItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const q = query(collection(db, "packages"), orderBy("createdAt", "desc"));
                const snap = await getDocs(q);
                setPackages(snap.docs.map(d => ({ 
                    id: d.id, 
                    name: d.data().name,
                    category: d.data().packageType || "Package",
                    description: d.data().description,
                    price: d.data().price,
                    imageUrl: d.data().imageUrl
                })) as PackageItem[]);
            } catch (err) {
                console.error("Error fetching packages:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPackages();
    }, []);

    useEffect(() => {
        if (!loading) {
            gsap.from(".reveal-pkg", {
                y: 50,
                opacity: 0,
                duration: 1,
                stagger: 0.1,
                ease: "power3.out"
            });
        }
    }, [loading]);

    const formatIDR = (p: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(p);

    if (loading) return (
        <div className="h-screen w-full bg-[#fdfbf7] flex items-center justify-center">
            <span className="text-[#788069] tracking-widest uppercase animate-pulse font-body">Curating Experiences...</span>
        </div>
    );

    return (
        <PageLayout>
            <main className="bg-[#fdfbf7] min-h-screen">
                {/* Hero */}
                <section className="relative h-[50vh] flex items-center justify-center pt-24 overflow-hidden">
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                         <div className="grid grid-cols-4 h-full">
                            {[...Array(4)].map((_, i) => <div key={i} className="border-r border-black/5" />)}
                         </div>
                    </div>
                    <div className="text-center space-y-4 relative z-10">
                        <span className="text-[#788069] text-[10px] font-black tracking-[0.5em] uppercase">Exclusive Offers</span>
                        <h1 className="text-6xl md:text-8xl font-serif italic text-[#1a1a1a]">Packages & Experiences</h1>
                    </div>
                </section>

                {/* Grid */}
                <section className="max-w-[1600px] mx-auto px-6 pb-32">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {packages.map((pkg) => (
                            <Link 
                                key={pkg.id} 
                                href={`/packages/${pkg.id}`}
                                className="reveal-pkg group relative h-[500px] rounded-[2rem] overflow-hidden flex flex-col justify-end"
                            >
                                <Image 
                                    src={pkg.imageUrl} 
                                    alt={pkg.name} 
                                    fill 
                                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                
                                <div className="relative p-10 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2">
                                            <span className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em]">{pkg.category}</span>
                                            <h3 className="text-3xl text-white font-serif italic leading-tight">{pkg.name}</h3>
                                        </div>
                                    </div>

                                    <p className="text-white/60 text-sm font-light line-clamp-2 leading-relaxed italic pr-12">
                                        {pkg.description}
                                    </p>

                                    <div className="flex items-center justify-between border-t border-white/20 pt-6">
                                        <div className="flex flex-col">
                                            {pkg.price && Number(pkg.price) > 0 ? (
                                                <>
                                                    <span className="text-white/40 text-[8px] font-bold uppercase tracking-widest mb-1">Price starting from</span>
                                                    <span className="text-xl text-[#788069] font-medium">{formatIDR(pkg.price)}</span>
                                                </>
                                            ) : null}
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-[#788069] transition-all duration-500">
                                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                <FooterSection />
            </main>
        </PageLayout>
    );
}
