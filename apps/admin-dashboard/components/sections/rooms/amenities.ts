import {
    Wifi,
    AirVent,
    Tv,
    Coffee,
    Refrigerator,
    Waves,
    Wind,
    Utensils,
    CigaretteOff,
    Key,
    Bath,
    ShieldCheck,
    Smartphone,
    Zap,
    Smile
} from "lucide-react";

export interface Amenity {
    id: string;
    label: string;
    icon: any;
}

export const AMENITIES: Amenity[] = [
    { id: "wifi", label: "High-Speed Wi-Fi", icon: Wifi },
    { id: "ac", label: "Air Conditioning", icon: AirVent },
    { id: "tv", label: "Smart TV", icon: Tv },
    { id: "coffee", label: "Coffee Maker", icon: Coffee },
    { id: "fridge", label: "Mini Fridge", icon: Refrigerator },
    { id: "pool", label: "Pool Access", icon: Waves },
    { id: "hairdryer", label: "Hair Dryer", icon: Wind },
    { id: "breakfast", label: "Breakfast Included", icon: Utensils },
    { id: "nosmoking", label: "Non-Smoking", icon: CigaretteOff },
    { id: "safe", label: "In-Room Safe", icon: ShieldCheck },
    { id: "keyless", label: "Keyless Entry", icon: Key },
    { id: "bathtub", label: "Luxury Bathtub", icon: Bath },
    { id: "charger", label: "USB Charging Ports", icon: Smartphone },
    { id: "power", label: "24/7 Power Backup", icon: Zap },
    { id: "refrigerator", label: "Refrigerator", icon: Refrigerator },
    { id: "dentalkit", label: "Dental Kit", icon: Smile },
];
