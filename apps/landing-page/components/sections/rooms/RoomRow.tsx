"use client";

import React from "react";
import Link from "next/link";
import { Users, Maximize, Bed, ArrowRight, Check, Wifi, AirVent, Tv, Coffee, Refrigerator, Waves, Wind, Utensils, CigaretteOff, ShieldCheck, Key, Bath, Smartphone, Zap, Smile } from "lucide-react";
import { RoomImageSlider } from "./RoomImageSlider";

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

interface RoomRowProps {
    room: RoomType;
    index: number;
}

const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes('wifi') || lower.includes('internet')) return Wifi;
    if (lower.includes('ac') || lower.includes('air')) return AirVent;
    if (lower.includes('tv') || lower.includes('television')) return Tv;
    if (lower.includes('coffee') || lower.includes('tea')) return Coffee;
    if (lower.includes('fridge') || lower.includes('refrigerator')) return Refrigerator;
    if (lower.includes('pool')) return Waves;
    if (lower.includes('hair') || lower.includes('dryer')) return Wind;
    if (lower.includes('breakfast') || lower.includes('food')) return Utensils;
    if (lower.includes('smoke') || lower.includes('smoking') || lower.includes('no smoking')) return CigaretteOff;
    if (lower.includes('safe') || lower.includes('security')) return ShieldCheck;
    if (lower.includes('key')) return Key;
    if (lower.includes('bath') || lower.includes('tube')) return Bath;
    if (lower.includes('usb') || lower.includes('charger') || lower.includes('charging')) return Smartphone;
    if (lower.includes('power') || lower.includes('backup') || lower.includes('electricity')) return Zap;
    if (lower.includes('dental') || lower.includes('toothpaste') || lower.includes('brush')) return Smile;
    return Check;
};

export const RoomRow: React.FC<RoomRowProps> = ({ room, index }) => {
    const isEven = index % 2 === 0;

    return (
        <div className="room-row bg-white border border-neutral-100 rounded-3xl overflow-hidden hover:shadow-xl hover:border-neutral-200/50 transition-all duration-300 p-4 group">
            <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-12`}>
                
                {/* Image Slider Wrapper */}
                <div className="w-full lg:w-[48%] shrink-0">
                    <RoomImageSlider images={room.images} name={room.name} heightClass="h-[280px] md:h-[320px] lg:h-[360px]" />
                </div>

                {/* Content Wrapper */}
                <div className="w-full lg:w-[48%] flex flex-col justify-center">
                    
                    {/* Header */}
                    <div className="mb-4">
                        <h3 className="text-2xl md:text-3xl font-semibold text-neutral-800 font-serif mb-2 group-hover:text-[#788069] transition-colors duration-300 relative inline-block">
                            {room.name}
                            <div className="absolute -bottom-1 -left-2 w-8 h-0.5 bg-[#788069]/30" />
                        </h3>
                    </div>

                    {/* Description */}
                    <p className="text-neutral-500 text-xs md:text-sm leading-relaxed mb-6 font-light">
                        {room.description}
                    </p>

                    {/* Specifications Grid */}
                    <div className="flex flex-wrap gap-x-6 gap-y-3 py-4 border-y border-neutral-100 mb-6">
                        {room.capacity && (
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Guests</span>
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
                                    <Users size={12} className="text-[#788069]" />
                                    <span>{room.capacity} Persons</span>
                                </div>
                            </div>
                        )}
                        {room.roomSizeValue && (
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Kamar Size</span>
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
                                    <Maximize size={12} className="text-[#788069]" />
                                    <span>{room.roomSizeValue} {room.roomSizeUnit === 'm2' ? 'm²' : room.roomSizeUnit}</span>
                                </div>
                            </div>
                        )}
                        {room.beds && room.beds.length > 0 && (
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Beds Setup</span>
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
                                    <Bed size={12} className="text-[#788069]" />
                                    <span>{room.beds.map(b => `${b.quantity}x ${b.type}`).join(', ')}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Amenities List */}
                    {room.amenities && room.amenities.length > 0 && (
                        <div className="mb-8">
                            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                                {room.amenities.slice(0, 4).map((amenity, i) => {
                                    const IconComp = getAmenityIcon(amenity);
                                    return (
                                        <li key={i} className="flex items-center gap-2 text-neutral-600 text-xs font-light">
                                            <IconComp size={12} className="text-[#788069] shrink-0" />
                                            <span className="truncate">{amenity}</span>
                                        </li>
                                    );
                                })}
                                {room.amenities.length > 4 && (
                                    <li className="text-[11px] text-neutral-400 italic">
                                        + {room.amenities.length - 4} more amenities
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}

                    {/* Action Button */}
                    <Link
                        href={`/rooms/${room.id}`}
                        className="group relative inline-flex items-center justify-center px-6 py-3.5 bg-[#1a1a1a] text-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ease-out self-start border border-[#1a1a1a]"
                    >
                        <div className="absolute inset-0 bg-[#788069] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                        <span className="relative z-10 flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.2em]">
                            More Info
                            <ArrowRight size={12} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                        </span>
                    </Link>
                </div>
            </div>
        </div>
    );
};
