"use client";

import React, { useState, useEffect, useRef } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { FooterSection } from "@/components/sections/footer/FooterSection";
import { motion } from "framer-motion";
import { UtensilsCrossed, ArrowRight } from "lucide-react";

export default function CafeRestoComingSoon() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim()) {
            setSubmitted(true);
            setEmail("");
        }
    };

    return (
        <PageLayout forceScrolledState={true}>
            <main className="bg-[#fdfbf7] min-h-screen relative selection:bg-[#788069] selection:text-white flex flex-col justify-between pt-24 md:pt-32">
                
                {/* ── Geometric Background Accents ── */}
                <div className="absolute inset-0 pointer-events-none z-0 flex flex-col items-center justify-center overflow-hidden opacity-[0.08]">
                    <div className="relative flex items-center justify-center w-full h-[80vh]">
                        <div className="w-[300px] md:w-[450px] h-[300px] md:h-[450px] border border-[#788069]/40 absolute rounded-full" />
                        <div className="w-[200px] md:w-[300px] h-[200px] md:h-[300px] border border-[#788069]/40 absolute rotate-45" />
                        <div className="w-[100vw] h-[1px] bg-[#788069]/20 absolute" />
                        <div className="h-[100vh] w-[1px] bg-[#788069]/20 absolute" />
                    </div>
                </div>

                {/* ── Main Content Container ── */}
                <div className="container mx-auto px-4 md:px-8 py-12 md:py-20 relative z-10 flex-grow flex flex-col items-center max-w-5xl text-center">
                    
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="inline-flex items-center gap-2 bg-[#788069]/10 text-[#788069] text-[10px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full mb-6"
                    >
                        <UtensilsCrossed size={12} />
                        <span>Bumi Anyom Culinary</span>
                    </motion.div>

                    {/* Main Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="text-5xl md:text-7xl lg:text-8xl text-neutral-800 font-extralight tracking-tighter uppercase leading-[0.95] mb-4 font-serif"
                    >
                        Cafe <span className="font-serif italic text-[#788069]">&</span> Resto
                    </motion.h1>

                    {/* Subheading / Coming Soon */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex items-center gap-4 justify-center text-xs font-bold uppercase tracking-[0.35em] text-neutral-400 mb-6"
                    >
                        <div className="w-6 h-[1px] bg-neutral-200" />
                        <span>A Culinary Sanctuary Awaits</span>
                        <div className="w-6 h-[1px] bg-neutral-200" />
                    </motion.div>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="text-neutral-500 text-xs md:text-sm leading-relaxed max-w-lg mx-auto mb-8 font-light"
                    >
                        We are crafting an exquisite dining experience that fuses local heritage with modern gastronomy. Prepare to embark on a sophisticated culinary journey nestled within nature's tranquility.
                    </motion.p>

                    {/* Email Sign-up (Aesthetic Minimalist) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="w-full max-w-md bg-white border border-neutral-200/50 p-6 rounded-2xl shadow-lg shadow-neutral-100/50 mb-12"
                    >
                        {submitted ? (
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-[#f0ece3] text-[#788069] p-3.5 rounded-xl text-xs font-semibold tracking-wide"
                            >
                                Thank you. You will be notified as soon as table reservations open.
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#788069]/30 focus:border-[#788069] transition-all placeholder:text-neutral-400"
                                />
                                <button
                                    type="submit"
                                    className="relative overflow-hidden inline-flex items-center justify-center bg-[#1a1a1a] text-white px-5 py-2.5 rounded-xl hover:shadow-md active:scale-98 transition-all shrink-0 group border border-[#1a1a1a]"
                                >
                                    <div className="absolute inset-0 bg-[#788069] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                                    <span className="relative z-10 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                        Notify Me
                                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                                    </span>
                                </button>
                            </form>
                        )}
                    </motion.div>

                    {/* ── Direct PDF Embed with Safe Scroll Overlay ── */}
                    <PDFViewerSection />
                </div>

                {/* ── Footer ── */}
                <FooterSection />
            </main>
        </PageLayout>
    );
}

// ── Helper Component: Dynamic PDF Pages Canvas Renderer ──
function PDFViewerSection() {
    const pdfUrl = "/cafe/CK_KONSEPING%20BUMI%20ANYOM%20CAFE.pdf";
    const [pages, setPages] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const renderTasksRef = useRef<any[]>([]);

    useEffect(() => {
        let active = true;

        const loadPdfJs = async () => {
            if ((window as any).pdfjsLib) {
                return (window as any).pdfjsLib;
            }

            return new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
                script.onload = () => {
                    const pdfjsLib = (window as any).pdfjsLib;
                    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
                    resolve(pdfjsLib);
                };
                script.onerror = () => {
                    reject(new Error("Failed to load PDF.js library"));
                };
                document.head.appendChild(script);
            });
        };

        const renderPDF = async () => {
            try {
                const pdfjsLib = await loadPdfJs();
                if (!active) return;

                const loadingTask = pdfjsLib.getDocument(pdfUrl);
                const pdf = await loadingTask.promise;
                if (!active) return;

                const numPages = pdf.numPages;
                const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1);
                setPages(pageNumbers);
                setLoading(false);

                // Wait for the container to mount and render canvases in the DOM
                setTimeout(async () => {
                    if (!active) return;
                    for (const pageNum of pageNumbers) {
                        try {
                            const page = await pdf.getPage(pageNum);
                            if (!active) return;

                            const canvas = document.getElementById(`pdf-page-${pageNum}`) as HTMLCanvasElement;
                            if (!canvas) continue;

                            const context = canvas.getContext("2d");
                            if (!context) continue;

                            const dpr = window.devicePixelRatio || 1;
                            const containerWidth = containerRef.current?.clientWidth || 800;
                            const unscaledViewport = page.getViewport({ scale: 1 });
                            const scale = (containerWidth - 32) / unscaledViewport.width;
                            const viewport = page.getViewport({ scale: Math.min(scale, 1.8) });

                            canvas.width = viewport.width * dpr;
                            canvas.height = viewport.height * dpr;
                            canvas.style.width = `${viewport.width}px`;
                            canvas.style.height = `${viewport.height}px`;

                            context.scale(dpr, dpr);

                            const renderContext = {
                                canvasContext: context,
                                viewport: viewport,
                            };
                            const renderTask = page.render(renderContext);
                            renderTasksRef.current.push(renderTask);
                            await renderTask.promise;
                        } catch (pageErr) {
                            console.error(`Error rendering page ${pageNum}:`, pageErr);
                        }
                    }
                }, 100);
            } catch (err: any) {
                console.error("Error loading PDF:", err);
                if (active) {
                    setError(err.message || "Gagal memuat PDF");
                    setLoading(false);
                }
            }
        };

        renderPDF();

        return () => {
            active = false;
            // Cancel any ongoing render tasks
            renderTasksRef.current.forEach(task => {
                if (task && typeof task.destroy === 'function') {
                    task.destroy();
                }
            });
        };
    }, [pdfUrl]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="w-full bg-white border border-neutral-200/50 rounded-3xl shadow-2xl overflow-hidden mb-12 p-4 md:p-6"
        >
            {/* Header Control Panel */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-neutral-100 pb-4 mb-6">
                <div className="text-left">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#788069] block mb-1">Concept &amp; Menu Book</span>
                    <h3 className="text-base font-serif italic text-neutral-800">Bumi Anyom Cafe &amp; Resto</h3>
                </div>
                
                <div>
                    <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 bg-[#1a1a1a] text-white hover:bg-[#788069] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 shadow-md shadow-neutral-200"
                    >
                        Buka Tab Baru / Download PDF
                    </a>
                </div>
            </div>

            {/* Viewer Container */}
            <div ref={containerRef} className="w-full flex flex-col gap-6 items-center">
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-8 h-8 border-4 border-[#788069] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-neutral-400 font-medium animate-pulse">Memuat konsep menu...</span>
                    </div>
                )}

                {error && (
                    <div className="p-8 text-center text-red-500 bg-red-50 border border-red-200 rounded-2xl w-full">
                        <p className="font-semibold text-sm">Gagal menampilkan menu preview</p>
                        <p className="text-xs text-neutral-500 mt-1">{error}</p>
                    </div>
                )}
                
                {pages.map((pageNum) => (
                    <div key={pageNum} className="w-full bg-white border border-neutral-100 rounded-2xl shadow-sm overflow-hidden p-2 flex justify-center max-w-4xl">
                        <canvas id={`pdf-page-${pageNum}`} className="max-w-full block" />
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

