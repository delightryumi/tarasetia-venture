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

interface RoomCardProps {
    room: RoomType;
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

export const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
    return (
        <div className="room-card bg-white border border-neutral-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-neutral-200/50 transition-all duration-300 flex flex-col h-full group">
            {/* Image Slider Wrapper */}
            <div className="p-3">
                <RoomImageSlider images={room.images} name={room.name} heightClass="h-[220px] md:h-[240px]" />
            </div>

            {/* Card Details */}
            <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                    {/* Title */}
                    <h3 className="text-xl font-semibold text-neutral-800 mb-2 font-serif group-hover:text-[#788069] transition-colors duration-300 line-clamp-1">
                        {room.name}
                    </h3>

                    {/* Short Description */}
                    <p className="text-neutral-500 text-xs md:text-sm leading-relaxed mb-4 line-clamp-3 font-light">
                        {room.description}
                    </p>

                    {/* Specifications List */}
                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-neutral-100 mb-4 bg-neutral-50/50 px-3 rounded-xl">
                        {room.capacity && (
                            <div className="flex items-center gap-2 text-[11px] font-medium text-neutral-600">
                                <Users size={12} className="text-[#788069] shrink-0" />
                                <span>{room.capacity} Guests</span>
                            </div>
                        )}
                        {!!room.roomSizeValue && (
                            <div className="flex items-center gap-2 text-[11px] font-medium text-neutral-600">
                                <Maximize size={12} className="text-[#788069] shrink-0" />
                                <span>{room.roomSizeValue} {room.roomSizeUnit === 'm2' ? 'm²' : room.roomSizeUnit}</span>
                            </div>
                        )}
                        {room.beds && room.beds.length > 0 && (
                            <div className="flex items-center gap-2 text-[11px] font-medium text-neutral-600 col-span-2">
                                <Bed size={12} className="text-[#788069] shrink-0" />
                                <span>{room.beds.map(b => `${b.quantity}x ${b.type}`).join(', ')}</span>
                            </div>
                        )}
                    </div>

                    {/* Dynamic Amenities Icons (Compact) */}
                    {room.amenities && room.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-6">
                            {room.amenities.slice(0, 4).map((amenity, i) => {
                                const IconComp = getAmenityIcon(amenity);
                                return (
                                    <div 
                                        key={i} 
                                        className="flex items-center gap-1 bg-neutral-100 hover:bg-[#f0ece3] text-neutral-600 text-[10px] px-2 py-1 rounded-md transition-colors duration-200"
                                        title={amenity}
                                    >
                                        <IconComp size={10} className="text-[#788069] shrink-0" />
                                        <span className="truncate max-w-[80px]">{amenity}</span>
                                    </div>
                                );
                            })}
                            {room.amenities.length > 4 && (
                                <div className="text-[9px] text-neutral-400 font-medium px-1.5 py-1">
                                    +{room.amenities.length - 4}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* More Info Button */}
                <Link
                    href={`/rooms/${room.id}`}
                    className="relative w-full inline-flex items-center justify-center py-3 bg-[#1a1a1a] text-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ease-out border border-[#1a1a1a]"
                >
                    <div className="absolute inset-0 bg-[#788069] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                    <span className="relative z-10 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]">
                        More Details
                        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                </Link>
            </div>
        </div>
    );
};
