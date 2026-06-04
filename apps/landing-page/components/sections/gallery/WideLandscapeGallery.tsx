"use client";

import React, { useMemo, useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ArrowUpRight, Maximize } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGallery, GalleryItem } from "@/services/useGallery";
import { gsap } from "gsap";
import "./Masonry.css";

// High-end curated fallback images (landscape focus)
const FALLBACK_GALLERY: GalleryItem[] = [
    { id: "f1", url: "https://images.unsplash.com/photo-1542314831-c53cd4b85ca4?auto=format&fit=crop&w=1200", order: 0, storagePath: "" },
    { id: "f2", url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200", order: 1, storagePath: "" },
    { id: "f3", url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200", order: 2, storagePath: "" },
    { id: "f4", url: "https://images.unsplash.com/photo-1533646549887-17559ebc3411?auto=format&fit=crop&w=1200", order: 3, storagePath: "" },
    { id: "f5", url: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1200", order: 4, storagePath: "" },
    { id: "f6", url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200", order: 5, storagePath: "" },
    { id: "f7", url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200", order: 6, storagePath: "" },
    { id: "f8", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200", order: 7, storagePath: "" },
    { id: "f9", url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200", order: 8, storagePath: "" },
    { id: "f10", url: "https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?auto=format&fit=crop&w=1200", order: 9, storagePath: "" },
];

const useMedia = (queries: string[], values: number[], defaultValue: number) => {
  const get = () => {
    if (typeof window === "undefined") return defaultValue;
    const index = queries.findIndex(q => window.matchMedia(q).matches);
    return values[index] ?? defaultValue;
  };

  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(get());
    const handler = () => setValue(get());
    
    queries.forEach(q => {
      window.matchMedia(q).addEventListener('change', handler);
    });
    
    return () => {
      queries.forEach(q => {
        window.matchMedia(q).removeEventListener('change', handler);
      });
    };
  }, [queries]);

  return value;
};

const useMeasure = (): [(node: HTMLDivElement | null) => void, { width: number; height: number }] => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const observerRef = useRef<ResizeObserver | null>(null);

  const refCallback = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (node) {
      const ro = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      });
      ro.observe(node);
      observerRef.current = ro;
    }
  }, []);

  return [refCallback, size];
};

const preloadImages = async (urls: string[]) => {
  if (typeof window === "undefined") return;
  await Promise.all(
    urls.map(
      src =>
        new Promise<void>(resolve => {
          const img = new window.Image();
          img.src = src;
          img.onload = img.onerror = () => resolve();
        })
    )
  );
};

export const WideLandscapeGallery = () => {
    const { items: dbItems, loading } = useGallery();
    const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);

    const items = useMemo(() => {
        if (loading) return [];
        return dbItems && dbItems.length > 0 ? dbItems : FALLBACK_GALLERY;
    }, [dbItems, loading]);

    // Use a flat map, limiting to 10 images for the layout
    const galleryItems = useMemo(() => items.slice(0, 10), [items]);

    const heights = [600, 400, 500, 450, 550, 420, 580, 480, 520, 460];
    const masonryItems = useMemo(() => {
        return galleryItems.map((item, index) => ({
            id: item.id || String(index),
            img: item.url,
            height: heights[index % heights.length],
            originalIndex: index,
            item: item
        }));
    }, [galleryItems]);

    const columns = useMedia(
        ['(min-width:1500px)', '(min-width:1000px)', '(min-width:600px)', '(min-width:400px)'],
        [5, 4, 3, 2],
        1
    );

    const [containerRef, { width }] = useMeasure();
    const [imagesReady, setImagesReady] = useState(false);

    useEffect(() => {
        preloadImages(masonryItems.map(i => i.img)).then(() => setImagesReady(true));
    }, [masonryItems]);

    const { grid, maxHeight } = useMemo(() => {
        if (!width) return { grid: [], maxHeight: 600 };

        const colHeights = new Array(columns).fill(0);
        const columnWidth = width / columns;

        const mapped = masonryItems.map(child => {
            const col = colHeights.indexOf(Math.min(...colHeights));
            const x = columnWidth * col;
            const height = (child.height / 600) * (columnWidth * 0.65);
            const y = colHeights[col];

            colHeights[col] += height;

            return { ...child, x, y, w: columnWidth, h: height };
        });

        const maxHeight = Math.max(...colHeights);
        return { grid: mapped, maxHeight };
    }, [columns, masonryItems, width]);

    const hasMounted = useRef(false);

    useLayoutEffect(() => {
        if (!imagesReady || grid.length === 0) return;

        grid.forEach((item, index) => {
            const selector = `[data-key="${item.id}"]`;
            const animationProps = {
                x: item.x,
                y: item.y,
                width: item.w,
                height: item.h
            };

            if (!hasMounted.current) {
                const initialPos = { x: item.x, y: window.innerHeight + 200 };
                const initialState = {
                    opacity: 0,
                    x: initialPos.x,
                    y: initialPos.y,
                    width: item.w,
                    height: item.h,
                    filter: 'blur(10px)'
                };

                gsap.fromTo(selector, initialState, {
                    opacity: 1,
                    ...animationProps,
                    filter: 'blur(0px)',
                    duration: 0.8,
                    ease: 'power3.out',
                    delay: index * 0.05
                });
            } else {
                gsap.to(selector, {
                    ...animationProps,
                    duration: 0.6,
                    ease: 'power3.out',
                    overwrite: 'auto'
                });
            }
        });

        hasMounted.current = true;
    }, [grid, imagesReady]);

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, item: any) => {
        const element = e.currentTarget;
        const selector = `[data-key="${item.id}"]`;

        gsap.to(selector, {
            scale: 0.96,
            duration: 0.3,
            ease: 'power2.out'
        });

        const overlay = element.querySelector('.hover-overlay-ui');
        const image = element.querySelector('.item-img-inner');
        if (overlay) {
            gsap.to(overlay, {
                opacity: 1,
                y: 0,
                duration: 0.3,
                ease: 'power2.out'
            });
        }
        if (image) {
            gsap.to(image, {
                scale: 1.05,
                duration: 0.5,
                ease: 'power2.out'
            });
        }
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>, item: any) => {
        const element = e.currentTarget;
        const selector = `[data-key="${item.id}"]`;

        gsap.to(selector, {
            scale: 1,
            duration: 0.3,
            ease: 'power2.out'
        });

        const overlay = element.querySelector('.hover-overlay-ui');
        const image = element.querySelector('.item-img-inner');
        if (overlay) {
            gsap.to(overlay, {
                opacity: 0,
                y: 10,
                duration: 0.3,
                ease: 'power2.out'
            });
        }
        if (image) {
            gsap.to(image, {
                scale: 1,
                duration: 0.5,
                ease: 'power2.out'
            });
        }
    };

    const handleOpen = (item: GalleryItem, index: number) => {
        setSelectedImage(item);
        setSelectedIndex(index);
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        const prev = (selectedIndex - 1 + galleryItems.length) % galleryItems.length;
        setSelectedImage(galleryItems[prev]);
        setSelectedIndex(prev);
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        const next = (selectedIndex + 1) % galleryItems.length;
        setSelectedImage(galleryItems[next]);
        setSelectedIndex(next);
    };

    if (loading) return null;

    return (
        <section className="relative w-full bg-[#111310] pt-20 pb-32 overflow-hidden border-t border-white/5">
            {/* Background Texture & Glow */}
            <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-black/80 to-transparent z-0 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-[#a8b09a]/5 blur-[150px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-[1920px] mx-auto px-4 md:px-8 xl:px-12">
                
                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16 max-w-7xl mx-auto px-4">
                    <div>
                        <span className="block text-[9px] md:text-[10px] font-black tracking-[0.5em] text-[#a8b09a] uppercase mb-4">
                            Visual Legacy
                        </span>
                        <h2 className="text-3xl md:text-5xl lg:text-6xl text-white font-serif italic font-light tracking-tight">
                            The Cinematic <span className="not-italic font-normal text-white/50">Frames</span>
                        </h2>
                    </div>
                    <Link
                        href="/gallery"
                        className="group flex items-center gap-4 text-white/50 hover:text-white transition-colors duration-300 pb-2"
                    >
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Explore Full Gallery</span>
                        <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:bg-[#a8b09a] group-hover:border-[#a8b09a] group-hover:text-[#111310]">
                            <ArrowUpRight size={14} />
                        </div>
                    </Link>
                </div>

                {/* ── Dynamic Masonry Loader ── */}
                {!imagesReady && (
                    <div className="w-full flex flex-col items-center justify-center py-24 gap-3">
                        <div className="w-8 h-8 border-4 border-[#a8b09a] border-t-transparent rounded-full animate-spin" />
                        <span className="text-[9px] text-[#a8b09a] font-bold tracking-[0.3em] uppercase animate-pulse">Loading Frames...</span>
                    </div>
                )}

                {/* ── Ultra-wide Masonry Grid ── */}
                <div 
                    ref={containerRef} 
                    className="list transition-opacity duration-500" 
                    style={{ 
                        opacity: imagesReady ? 1 : 0,
                        height: `${maxHeight}px`
                    }}
                >
                    {imagesReady && grid.map((item) => {
                        return (
                            <div
                                key={item.id}
                                data-key={item.id}
                                className="item-wrapper"
                                onClick={() => handleOpen(item.item, item.originalIndex)}
                                onMouseEnter={e => handleMouseEnter(e, item)}
                                onMouseLeave={e => handleMouseLeave(e, item)}
                            >
                                <div className="item-img">
                                    <div 
                                        className="item-img-inner absolute inset-0 bg-cover bg-center"
                                        style={{ backgroundImage: `url(${item.img})` }}
                                    />
                                    
                                    {/* Cinematic Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/10 pointer-events-none" />
                                    
                                    {/* Hover UI */}
                                    <div className="hover-overlay-ui absolute inset-0 flex flex-col justify-between p-5 opacity-0 translate-y-2 pointer-events-none z-10">
                                        <div className="flex justify-end">
                                            <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                                                <Maximize size={12} />
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[9px] text-[#a8b09a] font-black tracking-[0.3em] uppercase">Bumi Anyom</p>
                                            <p className="text-white text-xs font-serif italic mt-1 font-light">Captured Moment</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Lightbox ── */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/98 backdrop-blur-2xl p-4 md:p-8"
                        onClick={() => setSelectedImage(null)}
                    >
                        {/* Nav Top */}
                        <div className="absolute top-6 right-6 md:top-8 md:right-10 flex items-center gap-6 z-50">
                            <span className="text-white/40 text-[10px] tracking-[0.4em] uppercase">
                                {String(selectedIndex + 1).padStart(2, '0')} / {String(galleryItems.length).padStart(2, '0')}
                            </span>
                            <button
                                type="button"
                                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all duration-300"
                                onClick={() => setSelectedImage(null)}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Mid Controls */}
                        <button
                            type="button"
                            className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all duration-300 text-2xl font-light pl-1"
                            onClick={handlePrev}
                        >
                            ‹
                        </button>

                        <button
                            type="button"
                            className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all duration-300 text-2xl font-light pr-1"
                            onClick={handleNext}
                        >
                            ›
                        </button>

                        {/* Current Image */}
                        <motion.div
                            key={selectedImage.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                            className="relative w-full h-full max-w-[90vw] max-h-[85vh] md:max-h-[90vh] rounded-xl overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={selectedImage.url}
                                alt="Gallery Lightbox"
                                fill
                                unoptimized
                                className="object-contain"
                                sizes="100vw"
                                priority
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};
