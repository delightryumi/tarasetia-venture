"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface RoomImage {
    url: string;
    isProfile: boolean;
}

interface RoomImageSliderProps {
    images: RoomImage[];
    name: string;
    heightClass?: string;
}

export const RoomImageSlider: React.FC<RoomImageSliderProps> = ({ 
    images, 
    name, 
    heightClass = "h-[250px] md:h-[300px]" 
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) {
        return (
            <div className={`w-full ${heightClass} bg-neutral-100 flex items-center justify-center rounded-xl border border-neutral-200/50`}>
                <span className="text-neutral-400 text-xs tracking-wider uppercase">No images available</span>
            </div>
        );
    }

    const nextSlide = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevSlide = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className={`relative w-full overflow-hidden group rounded-xl ${heightClass} bg-neutral-900 shadow-sm border border-neutral-200/20`}>
            {images.map((img, idx) => (
                <div
                    key={idx}
                    className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                    style={{
                        opacity: idx === currentIndex ? 1 : 0,
                        zIndex: idx === currentIndex ? 10 : 0
                    }}
                >
                    <img
                        src={img.url}
                        alt={`${name} view ${idx + 1}`}
                        className="w-full h-full object-cover select-none"
                        loading="lazy"
                    />
                </div>
            ))}

            {/* Overlay Gradient for contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent z-10 pointer-events-none" />

            {/* Slider Controls */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-black/25 hover:bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0"
                        aria-label="Previous image"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-black/25 hover:bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0"
                        aria-label="Next image"
                    >
                        <ChevronRight size={18} />
                    </button>

                    {/* Dots Indicator */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setCurrentIndex(idx);
                                }}
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/70'}`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
