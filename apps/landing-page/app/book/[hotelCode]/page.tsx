"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import styles from "../BookingEngine.module.css";
import {
    FaBellConcierge,
    FaBed,
    FaUtensils,
    FaWifi,
    FaShower,
    FaTv,
    FaShieldHalved,
    FaCircleCheck,
    FaCalendarDays,
    FaUsers,
    FaPhone,
    FaEnvelope,
    FaClock,
    FaCreditCard,
    FaBuildingColumns,
    FaArrowLeft,
    FaChevronRight,
    FaChevronLeft,
    FaChevronDown,
    FaPlus,
    FaMinus,
    FaCheck,
    FaMagnifyingGlass,
    FaTag,
    FaCircleInfo,
    FaExpand,
    FaCopy,
    FaStar,
    FaLock,
    FaXmark,
    FaLocationDot,
    FaDoorOpen,
    FaCircleExclamation,
    FaTriangleExclamation,
    FaSnowflake,
    FaBottleWater,
    FaMugHot,
    FaSquareParking,
    FaPersonSwimming,
    FaDumbbell,
    FaSpa,
    FaElevator,
    FaVault,
    FaBanSmoking,
    FaSmoking,
    FaCouch,
    FaLaptop,
    FaDoorClosed,
    FaWind,
    FaShoePrints,
    FaShirt,
    FaRug,
    FaCar,
    FaWineGlass,
    FaWhatsapp,
    FaPrint,
} from "react-icons/fa6";
import {
    getBookingEngineData,
    createDirectBookingReservation,
    BookingEnginePublicData,
    BookingSelection,
    BookingGuestDetails,
    PublicRoomType,
    PublicAddOnItem,
    RatePlanCancellationPolicy,
} from "@/services/bookingEngineService";
import {
    ALL_LANGUAGES,
    ALL_CURRENCIES,
    RECOMMENDED_LANG_CODES,
    translate,
    formatPriceWithCurrency,
    TranslationKey,
    LanguageItem,
    CurrencyItem,
} from "@/lib/bookingEngineI18n";

// Helper for Smart Semantic Facility & Amenity Icons
const getFacilityIcon = (name: string, size = 12, className?: string) => {
    const n = (name || "").toLowerCase();

    // WiFi / Internet
    if (n.includes("wifi") || n.includes("wi-fi") || n.includes("internet")) {
        return <FaWifi size={size} className={className} />;
    }
    // TV / Televisi / Cable TV / Streaming
    if (n.includes("tv") || n.includes("televisi") || n.includes("netflix") || n.includes("cable")) {
        return <FaTv size={size} className={className} />;
    }
    // AC / Air Conditioning / Pendingin
    if (n.includes("ac") || n.includes("air cond") || n.includes("pendingin") || n.includes("cooling")) {
        return <FaSnowflake size={size} className={className} />;
    }
    // Bathroom / Kamar Mandi / Shower / Toilet / Bathtub / Water Heater
    if (n.includes("bath") || n.includes("shower") || n.includes("kamar mandi") || n.includes("toilet") || n.includes("air panas") || n.includes("heater")) {
        return <FaShower size={size} className={className} />;
    }
    // Towel / Handuk / Linen / Perlengkapan Mandi / Amenities / Sabun / Shampoo
    if (n.includes("towel") || n.includes("handuk") || n.includes("linen") || n.includes("toiletries") || n.includes("sabun")) {
        return <FaRug size={size} className={className} />;
    }
    // Air Mineral / Water / Minum / Mineral
    if (n.includes("mineral") || n.includes("air") || n.includes("water") || n.includes("minum") || n.includes("bottled")) {
        return <FaBottleWater size={size} className={className} />;
    }
    // Coffee / Tea / Kopi / Teh / Kettle / Ketel
    if (n.includes("kopi") || n.includes("coffee") || n.includes("teh") || n.includes("tea") || n.includes("kettle") || n.includes("ketel")) {
        return <FaMugHot size={size} className={className} />;
    }
    // Front Desk / Resepsionis / 24 Jam / Concierge / Layanan Kamar / Room Service
    if (n.includes("front desk") || n.includes("resepsionis") || n.includes("concierge") || n.includes("24 jam") || n.includes("24-hour") || n.includes("room service") || n.includes("layanan kamar")) {
        return <FaBellConcierge size={size} className={className} />;
    }
    // Parking / Parkir / Valet / Garasi
    if (n.includes("parkir") || n.includes("parking") || n.includes("valet") || n.includes("garasi") || n.includes("car")) {
        return <FaSquareParking size={size} className={className} />;
    }
    // Restaurant / Restoran / Breakfast / Sarapan / Dining / Cafe / Makan
    if (n.includes("restoran") || n.includes("restaurant") || n.includes("sarapan") || n.includes("breakfast") || n.includes("cafe") || n.includes("dining") || n.includes("makan") || n.includes("kuliner")) {
        return <FaUtensils size={size} className={className} />;
    }
    // Swimming Pool / Kolam Renang / Pool
    if (n.includes("kolam") || n.includes("pool") || n.includes("renang") || n.includes("swim")) {
        return <FaPersonSwimming size={size} className={className} />;
    }
    // Gym / Fitness / Kebugaran / Olahraga
    if (n.includes("gym") || n.includes("fitness") || n.includes("kebugaran") || n.includes("workout")) {
        return <FaDumbbell size={size} className={className} />;
    }
    // Spa / Massage / Pijat / Sauna / Wellness
    if (n.includes("spa") || n.includes("massage") || n.includes("pijat") || n.includes("sauna")) {
        return <FaSpa size={size} className={className} />;
    }
    // Safe / Brankas / Safety Box / Deposit
    if (n.includes("safe") || n.includes("brankas") || n.includes("safety")) {
        return <FaVault size={size} className={className} />;
    }
    // Elevator / Lift
    if (n.includes("lift") || n.includes("elevator")) {
        return <FaElevator size={size} className={className} />;
    }
    // Smoking / Area Merokok
    if (n.includes("smoking") || n.includes("merokok") || n.includes("rokok")) {
        if (n.includes("non") || n.includes("bebas") || n.includes("tidak")) {
            return <FaBanSmoking size={size} className={className} />;
        }
        return <FaSmoking size={size} className={className} />;
    }
    // Security / CCTV / Keamanan
    if (n.includes("security") || n.includes("keamanan") || n.includes("cctv") || n.includes("penjagaan")) {
        return <FaShieldHalved size={size} className={className} />;
    }
    // Sofa / Ruang Duduk / Living Area / Lounge
    if (n.includes("sofa") || n.includes("couch") || n.includes("lounge") || n.includes("duduk")) {
        return <FaCouch size={size} className={className} />;
    }
    // Desk / Meja Kerja / Meja
    if (n.includes("desk") || n.includes("meja") || n.includes("work")) {
        return <FaLaptop size={size} className={className} />;
    }
    // Wardrobe / Lemari / Gantungan
    if (n.includes("lemari") || n.includes("wardrobe") || n.includes("closet") || n.includes("hanger")) {
        return <FaDoorClosed size={size} className={className} />;
    }
    // Hairdryer / Pengering Rambut
    if (n.includes("hair") || n.includes("pengering") || n.includes("dryer")) {
        return <FaWind size={size} className={className} />;
    }
    // Slippers / Sandal
    if (n.includes("sandal") || n.includes("slipper")) {
        return <FaShoePrints size={size} className={className} />;
    }
    // Laundry / Cuci / Setrika / Iron
    if (n.includes("laundry") || n.includes("cuci") || n.includes("setrika") || n.includes("iron")) {
        return <FaShirt size={size} className={className} />;
    }
    // Bed / Kasur / Extra Bed
    if (n.includes("bed") || n.includes("kasur") || n.includes("tidur")) {
        return <FaBed size={size} className={className} />;
    }

    // Default icon
    return <FaCircleCheck size={size} className={className} />;
};

// Helper to safely calculate +1 day without timezone issues
const getPlusOneDayStr = (dateStr: string): string => {
    if (!dateStr) return "";
    const parts = dateStr.split("-").map(Number);
    if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split("T")[0];
    }
    const [year, month, day] = parts;
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dt = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dt}`;
};

export default function DirectBookingPage() {
    const params = useParams();
    const searchParams = useSearchParams();

    const hotelCodeParam = (params?.hotelCode as string) || "";

    // Deep Link Query Parameters
    const initialCheckin = searchParams.get("checkin") || new Date().toISOString().split("T")[0];
    const rawCheckout = searchParams.get("checkout");
    const initialCheckout =
        rawCheckout && rawCheckout > initialCheckin
            ? rawCheckout
            : getPlusOneDayStr(initialCheckin);
    const initialAdults = parseInt(searchParams.get("adults") || "2", 10);
    const initialChildren = parseInt(searchParams.get("children") || "0", 10);
    const initialPromoCode = searchParams.get("promoCode") || searchParams.get("code") || "";
    const requestedRoomTypeId = searchParams.get("roomType") || "";

    // State
    const [engineData, setEngineData] = useState<BookingEnginePublicData | null>(null);
    const [loading, setLoading] = useState(true);

    // Filter bar state
    const [checkIn, setCheckIn] = useState(initialCheckin);
    const [checkOut, setCheckOut] = useState(initialCheckout);
    const [adults, setAdults] = useState(initialAdults);
    const [children, setChildren] = useState(initialChildren);

    // Multilingual & Multi-currency state (Default: Indonesia / IDR)
    const [selectedLang, setSelectedLang] = useState<string>("id");
    const [selectedCurrency, setSelectedCurrency] = useState<string>("IDR");
    const [isLangModalOpen, setIsLangModalOpen] = useState(false);
    const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
    const [langSearch, setLangSearch] = useState("");
    const [currencySearch, setCurrencySearch] = useState("");

    // Policy Agreement Modals
    const [hasAgreedTerms, setHasAgreedTerms] = useState(true);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    // ── Custom Clay DatePicker & Guest Popover States ──
    const [activeDatePopover, setActiveDatePopover] = useState<"checkIn" | "checkOut" | null>(null);
    const [isGuestPopoverOpen, setIsGuestPopoverOpen] = useState(false);

    const initialDateParts = useMemo(() => {
        const parts = checkIn.split("-").map(Number);
        return {
            year: parts[0] || new Date().getFullYear(),
            month: parts.length > 1 ? parts[1] - 1 : new Date().getMonth(),
        };
    }, []);

    const [calYear, setCalYear] = useState<number>(initialDateParts.year);
    const [calMonth, setCalMonth] = useState<number>(initialDateParts.month);

    const datePopoverRef = useRef<HTMLDivElement>(null);
    const guestPopoverRef = useRef<HTMLDivElement>(null);

    // Sync calendar view month when popover opens
    useEffect(() => {
        if (activeDatePopover === "checkIn" && checkIn) {
            const parts = checkIn.split("-").map(Number);
            if (parts.length >= 2) {
                setCalYear(parts[0]);
                setCalMonth(parts[1] - 1);
            }
        } else if (activeDatePopover === "checkOut" && checkOut) {
            const parts = checkOut.split("-").map(Number);
            if (parts.length >= 2) {
                setCalYear(parts[0]);
                setCalMonth(parts[1] - 1);
            }
        }
    }, [activeDatePopover, checkIn, checkOut]);

    // Handle outside clicks to close popovers
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (datePopoverRef.current && !datePopoverRef.current.contains(target)) {
                setActiveDatePopover(null);
            }
            if (guestPopoverRef.current && !guestPopoverRef.current.contains(target)) {
                setIsGuestPopoverOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const handlePrevMonth = () => {
        const today = new Date();
        if (calYear === today.getFullYear() && calMonth <= today.getMonth()) return;
        if (calMonth === 0) {
            setCalMonth(11);
            setCalYear((prev) => prev - 1);
        } else {
            setCalMonth((prev) => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (calMonth === 11) {
            setCalMonth(0);
            setCalYear((prev) => prev + 1);
        } else {
            setCalMonth((prev) => prev + 1);
        }
    };

    const handleSelectDate = (dateStr: string) => {
        if (activeDatePopover === "checkIn") {
            setCheckIn(dateStr);
            if (dateStr >= checkOut) {
                setCheckOut(getPlusOneDayStr(dateStr));
            }
            setActiveDatePopover("checkOut");
        } else if (activeDatePopover === "checkOut") {
            if (dateStr <= checkIn) {
                setCheckIn(dateStr);
                setCheckOut(getPlusOneDayStr(dateStr));
            } else {
                setCheckOut(dateStr);
                setActiveDatePopover(null);
            }
        }
    };

    const MONTH_NAMES_ID = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const MONTH_NAMES_EN = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const WEEKDAY_NAMES_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const WEEKDAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const currentMonthName = useMemo(() => {
        const arr = selectedLang === "en" ? MONTH_NAMES_EN : MONTH_NAMES_ID;
        return arr[calMonth] || "";
    }, [calMonth, selectedLang]);

    const weekdayNames = useMemo(() => {
        return selectedLang === "en" ? WEEKDAY_NAMES_EN : WEEKDAY_NAMES_ID;
    }, [selectedLang]);

    const calendarDays = useMemo(() => {
        const firstDayIdx = new Date(calYear, calMonth, 1).getDay();
        const daysInCurrent = new Date(calYear, calMonth + 1, 0).getDate();
        const daysInPrev = new Date(calYear, calMonth, 0).getDate();

        const todayObj = new Date();
        const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;

        const cells = [];

        // Leading days from previous month
        for (let i = firstDayIdx - 1; i >= 0; i--) {
            const dayNum = daysInPrev - i;
            const prevM = calMonth === 0 ? 11 : calMonth - 1;
            const prevY = calMonth === 0 ? calYear - 1 : calYear;
            const dateStr = `${prevY}-${String(prevM + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            cells.push({
                dayNum,
                dateStr,
                isCurrentMonth: false,
                isDisabled: true,
                isToday: dateStr === todayStr,
                isCheckIn: dateStr === checkIn,
                isCheckOut: dateStr === checkOut,
                isInRange: dateStr > checkIn && dateStr < checkOut,
            });
        }

        // Days in current month
        for (let d = 1; d <= daysInCurrent; d++) {
            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const isDisabled = dateStr < todayStr;
            cells.push({
                dayNum: d,
                dateStr,
                isCurrentMonth: true,
                isDisabled,
                isToday: dateStr === todayStr,
                isCheckIn: dateStr === checkIn,
                isCheckOut: dateStr === checkOut,
                isInRange: dateStr > checkIn && dateStr < checkOut,
            });
        }

        // Trailing days
        const totalCells = cells.length > 35 ? 42 : 35;
        const remaining = totalCells - cells.length;
        for (let n = 1; n <= remaining; n++) {
            const nextM = calMonth === 11 ? 0 : calMonth + 1;
            const nextY = calMonth === 11 ? calYear + 1 : calYear;
            const dateStr = `${nextY}-${String(nextM + 1).padStart(2, "0")}-${String(n).padStart(2, "0")}`;
            cells.push({
                dayNum: n,
                dateStr,
                isCurrentMonth: false,
                isDisabled: true,
                isToday: dateStr === todayStr,
                isCheckIn: dateStr === checkIn,
                isCheckOut: dateStr === checkOut,
                isInRange: dateStr > checkIn && dateStr < checkOut,
            });
        }

        return cells;
    }, [calYear, calMonth, checkIn, checkOut]);

    // Force browser favicon and document title to always match hotel logo & name
    useEffect(() => {
        if (engineData?.hotelName && typeof document !== "undefined") {
            document.title = `${engineData.hotelName} | Official Direct Booking`;
        }
        if (engineData?.logoUrl && typeof document !== "undefined") {
            const logoUrl = engineData.logoUrl;
            const relList = ["icon", "shortcut icon", "apple-touch-icon"];
            relList.forEach((rel) => {
                let link = document.querySelector(`link[rel='${rel}']`) as HTMLLinkElement | null;
                if (!link) {
                    link = document.createElement("link");
                    link.rel = rel;
                    document.head.appendChild(link);
                }
                link.href = logoUrl;
            });
        }
    }, [engineData?.logoUrl, engineData?.hotelName]);

    // Translation helper
    const t = (key: TranslationKey, params?: Record<string, string | number>) => {
        return translate(selectedLang, key, params);
    };

    // Format currency helper
    const formatMoney = (val: number) => {
        return formatPriceWithCurrency(val, selectedCurrency);
    };

    // Active Language Object
    const activeLangObj = useMemo(() => {
        return ALL_LANGUAGES.find((l) => l.code === selectedLang) || ALL_LANGUAGES[0];
    }, [selectedLang]);

    // Filtered languages for modal
    const filteredLanguages = useMemo(() => {
        const query = langSearch.trim().toLowerCase();
        if (!query) return ALL_LANGUAGES;
        return ALL_LANGUAGES.filter(
            (l) =>
                l.name.toLowerCase().includes(query) ||
                l.englishName.toLowerCase().includes(query) ||
                l.code.toLowerCase().includes(query)
        );
    }, [langSearch]);

    // Recommended languages for modal
    const recommendedLanguages = useMemo(() => {
        return ALL_LANGUAGES.filter((l) => RECOMMENDED_LANG_CODES.includes(l.code));
    }, []);

    // Filtered currencies for modal
    const filteredCurrencies = useMemo(() => {
        const query = currencySearch.trim().toLowerCase();
        if (!query) return ALL_CURRENCIES;
        return ALL_CURRENCIES.filter(
            (c) =>
                c.code.toLowerCase().includes(query) ||
                c.name.toLowerCase().includes(query) ||
                c.symbol.toLowerCase().includes(query)
        );
    }, [currencySearch]);

    // Promo code state
    const [promoInput, setPromoInput] = useState(initialPromoCode);
    const [appliedPromo, setAppliedPromo] = useState<string | null>(initialPromoCode || null);
    const [promoDiscountPercent, setPromoDiscountPercent] = useState<number>(0);

    // Custom Alert Notification Modal State
    const [alertData, setAlertData] = useState<{
        isOpen: boolean;
        type: "error" | "success" | "warning" | "info";
        title?: string;
        message: string;
    }>({
        isOpen: false,
        type: "info",
        message: "",
    });

    const showAlert = (message: string, type: "error" | "success" | "warning" | "info" = "info", title?: string) => {
        setAlertData({ isOpen: true, type, message, title });
    };

    const closeAlert = () => {
        setAlertData((prev) => ({ ...prev, isOpen: false }));
    };

    // Multi-Room Cart State
    interface CartItem {
        roomTypeId: string;
        roomTypeName: string;
        ratePlanId: string;
        ratePlanName: string;
        mealsIncluded: boolean;
        pricePerNight: number;
        quantity: number;
        availableRooms: number;
    }

    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [roomsFilterCount, setRoomsFilterCount] = useState<number>(1);

    // Add-Ons & Extra Services State
    interface SelectedAddOnItemState {
        id: string;
        name: string;
        price: number;
        priceType: "per_night" | "per_stay" | "per_person";
        quantity: number;
        subtotal: number;
    }
    const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOnItemState[]>([]);

    // Cancellation Policy Modal State
    const [activePolicyModal, setActivePolicyModal] = useState<RatePlanCancellationPolicy | null>(null);

    // Photo Gallery & Detail Modal
    const [previewRoom, setPreviewRoom] = useState<PublicRoomType | null>(null);
    const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

    // Selected Room & Rate Plan (for detail/photo previews)
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [selectedRatePlanId, setSelectedRatePlanId] = useState<string | null>(null);

    // Step state: 1 = room selection, 2 = guest form & payment, 3 = confirmation
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Guest Info Form
    const [guestDetails, setGuestDetails] = useState<BookingGuestDetails>({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        country: "Indonesia",
        specialRequests: "",
        estimatedArrivalTime: "14:00",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmedBookingCode, setConfirmedBookingCode] = useState<string>("");

    // Accessibility (R-32): Close any open modal on Escape key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setActiveDatePopover(null);
                setIsGuestPopoverOpen(false);
                setPreviewRoom(null);
                setActivePolicyModal(null);
                setIsLangModalOpen(false);
                setIsCurrencyModalOpen(false);
                setShowPrivacyModal(false);
                setShowTermsModal(false);
                setAlertData((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Fetch booking data
    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getBookingEngineData(hotelCodeParam, checkIn, checkOut);
            setEngineData(data);
            if (data?.rooms && data.rooms.length > 0) {
                const targetRoom = requestedRoomTypeId
                    ? data.rooms.find((r) => r.id === requestedRoomTypeId)
                    : data.rooms.find((r) => !r.isSoldOut) || data.rooms[0];
                const activeRoom = targetRoom || data.rooms[0];
                setSelectedRoomId(activeRoom.id);
                if (activeRoom.ratePlans.length > 0) {
                    setSelectedRatePlanId(activeRoom.ratePlans[0].id);
                    // Pre-select 1 unit of the primary room & rate plan into cart
                    setCartItems([
                        {
                            roomTypeId: activeRoom.id,
                            roomTypeName: activeRoom.name,
                            ratePlanId: activeRoom.ratePlans[0].id,
                            ratePlanName: activeRoom.ratePlans[0].name,
                            mealsIncluded: !!activeRoom.ratePlans[0].mealsIncluded,
                            pricePerNight: activeRoom.ratePlans[0].price,
                            quantity: 1,
                            availableRooms: activeRoom.availableRooms,
                        }
                    ]);
                }
            }

            // Auto-apply initial promo if valid
            if (initialPromoCode && data?.promotions) {
                const found = data.promotions.find(
                    (p) => p.code.toUpperCase() === initialPromoCode.toUpperCase()
                );
                if (found) {
                    setAppliedPromo(found.code);
                    setPromoDiscountPercent(found.discountPercent);
                }
            }

            setLoading(false);
        }
        load();
    }, [hotelCodeParam, checkIn, checkOut, requestedRoomTypeId, initialPromoCode]);

    // Dynamically load Midtrans Snap script if activeProvider is midtrans with clientKey
    useEffect(() => {
        if (engineData?.activeProvider === "midtrans" && engineData.midtrans?.clientKey) {
            const scriptId = "midtrans-snap-script";
            if (!document.getElementById(scriptId)) {
                const script = document.createElement("script");
                script.id = scriptId;
                script.src = engineData.midtrans.isProduction
                    ? "https://app.midtrans.com/snap/snap.js"
                    : "https://app.sandbox.midtrans.com/snap/snap.js";
                script.setAttribute("data-client-key", engineData.midtrans.clientKey);
                script.async = true;
                document.body.appendChild(script);
            }
        }
    }, [engineData?.activeProvider, engineData?.midtrans]);

    // Calculate nights
    const nights = useMemo(() => {
        const start = new Date(checkIn).getTime();
        const end = new Date(checkOut).getTime();
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 1;
    }, [checkIn, checkOut]);

    // Apply Promo Voucher Code
    const handleApplyPromo = (e: React.FormEvent) => {
        e.preventDefault();
        const clean = promoInput.trim().toUpperCase();
        if (!clean) {
            setAppliedPromo(null);
            setPromoDiscountPercent(0);
            return;
        }

        const validPromos = engineData?.promotions || [];
        const match = validPromos.find((p) => p.code.toUpperCase() === clean);

        if (match) {
            setAppliedPromo(match.code);
            setPromoDiscountPercent(match.discountPercent);
            showAlert(`Kode Voucher "${match.code}" berhasil diterapkan! Anda mendapatkan diskon sebesar ${match.discountPercent}%.`, "success", "Voucher Berhasil");
        } else {
            showAlert(`Kode Voucher "${clean}" tidak ditemukan atau sudah tidak berlaku.`, "error", "Voucher Tidak Ditemukan");
        }
    };

    // Cart Handlers
    const handleAddOrIncrementCart = (room: PublicRoomType, ratePlan: any) => {
        const rpId = ratePlan.id || ratePlan.ratePlanId || "standard-rate";
        const rpName = ratePlan.name || ratePlan.ratePlanName || "Tarif Resmi";
        const rpPrice = Number(ratePlan.pricePerNight ?? ratePlan.price ?? room.basePrice) || 0;
        const rpMeals = !!(ratePlan.mealsIncluded);

        setCartItems((prev) => {
            const existingIndex = prev.findIndex(
                (item) => item.roomTypeId === room.id && item.ratePlanId === rpId
            );
            const maxAvailable = Math.max(1, room.availableRooms || 1);

            if (existingIndex > -1) {
                const currentQty = prev[existingIndex].quantity;
                if (currentQty >= maxAvailable) {
                    showAlert(`Maksimal ${maxAvailable} unit kamar untuk tipe ${room.name}.`, "warning", "Batas Ketersediaan");
                    return prev;
                }
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: currentQty + 1,
                };
                return updated;
            } else {
                return [
                    ...prev,
                    {
                        roomTypeId: room.id,
                        roomTypeName: room.name,
                        ratePlanId: rpId,
                        ratePlanName: rpName,
                        mealsIncluded: rpMeals,
                        pricePerNight: rpPrice,
                        quantity: 1,
                        availableRooms: maxAvailable,
                    }
                ];
            }
        });
        setSelectedRoomId(room.id);
        setSelectedRatePlanId(rpId);
    };

    const handleDecrementCart = (roomTypeId: string, ratePlanId: string) => {
        setCartItems((prev) => {
            const existingIndex = prev.findIndex(
                (item) => item.roomTypeId === roomTypeId && item.ratePlanId === ratePlanId
            );
            if (existingIndex === -1) return prev;

            const currentQty = prev[existingIndex].quantity;
            if (currentQty <= 1) {
                return prev.filter((_, idx) => idx !== existingIndex);
            } else {
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: currentQty - 1,
                };
                return updated;
            }
        });
    };

    // Add-On Handlers
    const handleToggleAddOn = (addon: PublicAddOnItem) => {
        setSelectedAddOns((prev) => {
            const exists = prev.find((a) => a.id === addon.id);
            if (exists) {
                return prev.filter((a) => a.id !== addon.id);
            } else {
                return [
                    ...prev,
                    {
                        id: addon.id,
                        name: addon.name,
                        price: addon.price,
                        priceType: addon.priceType,
                        quantity: 1,
                        subtotal: addon.priceType === "per_night" ? addon.price * nights : addon.price,
                    },
                ];
            }
        });
    };

    const handleUpdateAddOnQty = (addonId: string, delta: number) => {
        setSelectedAddOns((prev) => {
            return prev
                .map((a) => {
                    if (a.id === addonId) {
                        const newQty = Math.max(0, Math.min(10, a.quantity + delta));
                        return {
                            ...a,
                            quantity: newQty,
                            subtotal: a.priceType === "per_night" ? a.price * newQty * nights : a.price * newQty,
                        };
                    }
                    return a;
                })
                .filter((a) => a.quantity > 0);
        });
    };

    // Active Room & Rate Object (for preview/fallback)
    const selectedRoom = useMemo(() => {
        if (!engineData?.rooms) return null;
        return engineData.rooms.find((r) => r.id === selectedRoomId) || engineData.rooms[0] || null;
    }, [engineData, selectedRoomId]);

    const selectedRatePlan = useMemo(() => {
        if (!selectedRoom) return null;
        return (
            selectedRoom.ratePlans.find((rp) => rp.id === selectedRatePlanId) ||
            selectedRoom.ratePlans[0] ||
            null
        );
    }, [selectedRoom, selectedRatePlanId]);

    // Ledger Calculation (100% Dynamic based on Firestore settings, Multi-Room & Add-Ons Itemized Breakdown)
    const pricing = useMemo(() => {
        const activeItems = cartItems.length > 0
            ? cartItems
            : selectedRoom && selectedRatePlan
            ? [{
                roomTypeId: selectedRoom.id,
                roomTypeName: selectedRoom.name,
                ratePlanId: selectedRatePlan.id,
                ratePlanName: selectedRatePlan.name,
                mealsIncluded: selectedRatePlan.mealsIncluded,
                pricePerNight: selectedRatePlan.price,
                quantity: 1,
                availableRooms: selectedRoom.availableRooms,
            }]
            : [];

        const totalRooms = activeItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
        const rawSubtotal = activeItems.reduce((acc, it) => acc + ((Number(it.pricePerNight) || 0) * (Number(it.quantity) || 0) * (Number(nights) || 1)), 0);

        // Discount calculation
        const discountAmount = appliedPromo ? Math.round((rawSubtotal * (Number(promoDiscountPercent) || 0)) / 100) : 0;
        const discountedRoomTotal = Math.max(0, rawSubtotal - discountAmount);

        // Add-Ons calculation
        const addOnsList = selectedAddOns.map((a) => {
            const itemPrice = Number(a.price) || 0;
            const itemQty = Number(a.quantity) || 0;
            const itemSubtotal = a.priceType === "per_night"
                ? itemPrice * itemQty * (Number(nights) || 1)
                : itemPrice * itemQty;
            return {
                ...a,
                subtotal: itemSubtotal,
            };
        });
        const addOnsSubtotal = addOnsList.reduce((acc, a) => acc + (Number(a.subtotal) || 0), 0);

        // PB1 & Service Charge (matching Rate Inventory PB1 / VAT standard)
        const taxRate = engineData?.pricing?.taxRate !== undefined ? Number(engineData.pricing.taxRate) || 0 : 11;
        const serviceRate = engineData?.pricing?.serviceRate !== undefined ? Number(engineData.pricing.serviceRate) || 0 : 0;
        const isTaxIncluded = engineData?.pricing?.isTaxIncludedInRate ?? false;

        // Net Base Subtotal from Room + Add-Ons
        const netRoomSubtotal = discountedRoomTotal;
        const netTotalBeforeTax = discountedRoomTotal + addOnsSubtotal;
        const taxAmount = Math.round((netTotalBeforeTax * taxRate) / 100);
        const serviceAmount = Math.round((netTotalBeforeTax * serviceRate) / 100);
        const grandTotal = Math.max(0, netTotalBeforeTax + taxAmount + serviceAmount);

        return {
            items: activeItems,
            totalRooms,
            rawSubtotal,
            netRoomSubtotal,
            addOnsList,
            addOnsSubtotal,
            netTotalBeforeTax,
            discountAmount,
            discountedRoomTotal,
            taxAmount,
            serviceAmount,
            taxRate,
            serviceRate,
            isTaxIncluded,
            grandTotal,
        };
    }, [cartItems, selectedRoom, selectedRatePlan, selectedAddOns, nights, appliedPromo, promoDiscountPercent, engineData]);

    // Format readable date localized
    const formatDateWithLocale = (dateStr: string) => {
        if (!dateStr) return "";
        try {
            const parts = dateStr.split("-").map(Number);
            const d = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(dateStr);
            return d.toLocaleDateString(activeLangObj.locale || "id-ID", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
            });
        } catch {
            return dateStr;
        }
    };

    // Submit Reservation
    const handleConfirmBooking = async () => {
        if (pricing.items.length === 0) {
            showAlert("Silakan pilih minimal 1 kamar terlebih dahulu sebelum melanjutkan.", "warning", "Kamar Belum Dipilih");
            return;
        }
        if (!guestDetails.fullName || !guestDetails.email || !guestDetails.phone) {
            showAlert("Mohon lengkapi nama lengkap, email, dan nomor telepon kontak Anda sebelum melanjutkan.", "warning", "Data Belum Lengkap");
            return;
        }
        if (!hasAgreedTerms) {
            showAlert("Silakan centang persetujuan Kebijakan Privasi dan Syarat & Ketentuan sebelum melanjutkan reservasi.", "warning", "Persetujuan Diperlukan");
            return;
        }

        setIsSubmitting(true);

        const primaryItem = pricing.items[0];
        const selection: BookingSelection = {
            roomTypeId: primaryItem.roomTypeId,
            roomTypeName: primaryItem.roomTypeName,
            ratePlanId: primaryItem.ratePlanId,
            ratePlanName: primaryItem.ratePlanName,
            nights,
            roomsCount: pricing.totalRooms,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            adults,
            children,
            pricePerNight: Math.round(pricing.netRoomSubtotal / (pricing.totalRooms * nights || 1)),
            baseTotal: pricing.discountedRoomTotal,
            promoCode: appliedPromo || undefined,
            discountAmount: pricing.discountAmount,
            taxAmount: pricing.taxAmount,
            serviceAmount: pricing.serviceAmount,
            grandTotal: pricing.grandTotal,
            items: pricing.items.map((it) => ({
                roomTypeId: it.roomTypeId,
                roomTypeName: it.roomTypeName,
                ratePlanId: it.ratePlanId,
                ratePlanName: it.ratePlanName,
                mealsIncluded: it.mealsIncluded,
                pricePerNight: it.pricePerNight,
                quantity: it.quantity,
                subtotal: it.pricePerNight * it.quantity * nights,
            })),
            addOns: pricing.addOnsList.map((a) => ({
                id: a.id,
                name: a.name,
                price: a.price,
                priceType: a.priceType,
                quantity: a.quantity,
                subtotal: a.subtotal,
            })),
        };

        const result = await createDirectBookingReservation(hotelCodeParam, {
            guest: guestDetails,
            selection,
            paymentMethod: engineData?.activeProvider || "manual",
            paymentStatus: "pending",
        });

        setIsSubmitting(false);

        if (result.success) {
            setConfirmedBookingCode(result.bookingCode || "RES-" + Date.now().toString().slice(-6));
            setStep(3);
        } else {
            showAlert(result.error || "Gagal memproses reservasi. Silakan coba kembali beberapa saat lagi.", "error", "Gagal Memproses");
        }
    };

    const returnWebsiteUrl = engineData?.hotelWebsiteUrl || "/";

    // Dynamic Hotel Brand Theme Color Palette
    const themeStyle = useMemo(() => {
        const primary = engineData?.themeColor || "#6D2B35";
        let clean = primary.replace("#", "").trim();
        if (clean.length === 3) {
            clean = clean.split("").map((c) => c + c).join("");
        }
        let r = 109, g = 43, b = 53;
        const num = parseInt(clean, 16);
        if (!isNaN(num) && clean.length === 6) {
            r = (num >> 16) & 255;
            g = (num >> 8) & 255;
            b = num & 255;
        }

        const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
        const darken = (factor: number) => {
            const nr = clamp(r * factor);
            const ng = clamp(g * factor);
            const nb = clamp(b * factor);
            return `#${((1 << 24) + (nr << 16) + (ng << 8) + nb).toString(16).slice(1)}`;
        };

        const primaryHover = darken(0.85);
        const primaryDark = darken(0.42);
        const primaryDeep = darken(0.25);

        return {
            "--theme-primary": primary,
            "--theme-primary-hover": primaryHover,
            "--theme-dark": primaryDark,
            "--theme-deep": primaryDeep,
            "--theme-light": `rgba(${r}, ${g}, ${b}, 0.08)`,
            "--theme-border": `rgba(${r}, ${g}, ${b}, 0.25)`,
            "--theme-shadow": `rgba(${r}, ${g}, ${b}, 0.25)`,
            "--theme-rgb": `${r}, ${g}, ${b}`,
        } as React.CSSProperties;
    }, [engineData?.themeColor]);

    if (loading) {
        return (
            <div className={styles.pageWrapper} style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
                <div style={{ textAlign: "center", padding: "36px 48px", background: "#ffffff", borderRadius: "24px", boxShadow: "10px 14px 32px rgba(155, 172, 195, 0.4), -8px -8px 24px rgba(255, 255, 255, 0.95)", border: "1.5px solid rgba(255, 255, 255, 0.9)" }}>
                    <FaBellConcierge size={38} color="#6D2B35" style={{ margin: "0 auto 16px auto", display: "block" }} />
                    <h3 style={{ fontSize: "17px", fontWeight: 900, margin: "0 0 6px 0", color: "#0f172a" }}>
                        {t("loadingBookingEngine")}
                    </h3>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#64748b", margin: 0 }}>
                        {t("connectingHotelInventory")}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper} style={themeStyle}>
            {/* ── Unified Sticky Master Header ── */}
            <div className={styles.stickyHeaderArea}>
                {/* 1. Top Utility Strip (Official Guarantee, Full Address, Lang/Curr/Hotline) */}
                <div className={styles.topUtilityBar}>
                    <div className={styles.topUtilityInner}>
                        <div className={styles.topUtilityLeft}>
                            <span className={styles.badgeOfficialText}>
                                <span className={styles.badgeOfficialDot} />
                                <span>{t("officialSite")}</span>
                            </span>
                            <span className={styles.badgeGuaranteeText}>
                                <FaCircleCheck size={10} color="#059669" />
                                <span>{t("bestRateGuarantee")}</span>
                            </span>
                            {(engineData?.hotelAddress || engineData?.city) && (
                                <>
                                    <span className={styles.topUtilityDivider} />
                                    <div className={styles.topAddressItem}>
                                        <FaLocationDot className={styles.topAddressPin} />
                                        <span className={styles.topAddressText}>
                                            {engineData.hotelAddress || engineData.city}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className={styles.topUtilityRight}>
                            {/* Language Selector Pill */}
                            <button
                                type="button"
                                onClick={() => {
                                    setLangSearch("");
                                    setIsLangModalOpen(true);
                                }}
                                className={styles.topLangBtn}
                                title={t("selectLanguage")}
                                aria-label="Pilih Bahasa"
                            >
                                <span className={styles.langFlagIcon}>{activeLangObj.flag}</span>
                                <span className={styles.topUtilityBtnText}>{activeLangObj.code.toUpperCase()}</span>
                                <FaChevronDown size={7} className={styles.topUtilityChevron} />
                            </button>

                            {/* Currency Selector Pill */}
                            <button
                                type="button"
                                onClick={() => {
                                    setCurrencySearch("");
                                    setIsCurrencyModalOpen(true);
                                }}
                                className={styles.topCurrencyBtn}
                                title={t("selectCurrency")}
                                aria-label="Pilih Mata Uang"
                            >
                                <span className={styles.topUtilityBtnText}>{selectedCurrency}</span>
                                <FaChevronDown size={7} className={styles.topUtilityChevron} />
                            </button>

                            {engineData?.hotelPhone ? (
                                <a
                                    href={`tel:${engineData.hotelPhone}`}
                                    className={styles.topHotlineLink}
                                    title="Hubungi Front Desk Hotel"
                                >
                                    <FaPhone size={9} />
                                    <span>{engineData.hotelPhone}</span>
                                </a>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* 2. Main Brand & Stepper Navigation Bar */}
                <header className={styles.header}>
                    <div className={styles.headerInner}>
                        {/* 1. Left: Brand Logo & Star Rating */}
                        <div className={styles.brandGroup}>
                            <div className={styles.brandLogoWrap}>
                                {engineData?.logoUrl ? (
                                    <img
                                        src={engineData.logoUrl}
                                        alt={engineData.hotelName}
                                        className={styles.brandLogoImg}
                                    />
                                ) : (
                                    <h1 className={styles.hotelName}>
                                        {engineData?.hotelName || "Hotel Mitra"}
                                    </h1>
                                )}
                            </div>
                            {engineData?.starRating && engineData.starRating > 0 ? (
                                <span className={styles.hotelStars} title={`${engineData.starRating} Bintang`}>
                                    {Array.from({ length: engineData.starRating }).map((_, i) => (
                                        <FaStar key={i} size={11} />
                                    ))}
                                </span>
                            ) : null}
                        </div>

                        {/* 2. Center: Sleek Step Capsule */}
                        <nav className={styles.stepperCapsule} aria-label="Tahap Pemesanan">
                            <div className={`${styles.stepPill} ${step === 1 ? styles.stepPillActive : styles.stepPillDone}`}>
                                <span className={styles.stepPillNum}>{step > 1 ? <FaCircleCheck size={10} /> : "1"}</span>
                                <span className={styles.stepPillText}>{t("stepSelectRoom")}</span>
                            </div>
                            <div className={styles.stepPillArrow}><FaChevronRight size={8} /></div>
                            <div className={`${styles.stepPill} ${step === 2 ? styles.stepPillActive : step > 2 ? styles.stepPillDone : styles.stepPillInactive}`}>
                                <span className={styles.stepPillNum}>{step > 2 ? <FaCircleCheck size={10} /> : "2"}</span>
                                <span className={styles.stepPillText}>{t("stepGuestData")}</span>
                            </div>
                            <div className={styles.stepPillArrow}><FaChevronRight size={8} /></div>
                            <div className={`${styles.stepPill} ${step === 3 ? styles.stepPillActive : styles.stepPillInactive}`}>
                                <span className={styles.stepPillNum}>3</span>
                                <span className={styles.stepPillText}>{t("stepConfirmation")}</span>
                            </div>
                        </nav>

                        {/* 3. Right: Balanced spacer to keep stepper centered */}
                        <div className={styles.headerRightSpacer} />
                    </div>
                </header>

                {/* ── Horizontal Search & Filter Bar (Only in Step 1) ── */}
                {step === 1 && (
                    <div className={styles.searchBarSection}>
                        <div className={styles.searchBarInner}>
                            {/* 1. Check-In Custom Clay Trigger */}
                            <div className={styles.searchColRelative} ref={activeDatePopover === "checkIn" ? datePopoverRef : undefined}>
                                <label className={styles.searchFieldLabel}>
                                    <FaCalendarDays size={11} />
                                    <span>{t("checkIn")}</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveDatePopover(activeDatePopover === "checkIn" ? null : "checkIn");
                                        setIsGuestPopoverOpen(false);
                                    }}
                                    className={`${styles.customSearchBtn} ${activeDatePopover === "checkIn" ? styles.customSearchBtnActive : ""}`}
                                    aria-label="Pilih Tanggal Check-In"
                                    aria-haspopup="dialog"
                                    aria-expanded={activeDatePopover === "checkIn"}
                                >
                                    <span className={styles.customSearchBtnVal}>{formatDateWithLocale(checkIn)}</span>
                                    <FaChevronDown size={8} className={styles.customSearchBtnChevron} />
                                </button>

                                {/* Check-In Calendar Popover */}
                                {activeDatePopover === "checkIn" && (
                                    <div
                                        className={styles.clayDatePickerPopover}
                                        role="dialog"
                                        aria-modal="true"
                                        aria-label="Kalender Check-In"
                                    >
                                        <div className={styles.clayCalHeader}>
                                            <button
                                                type="button"
                                                onClick={handlePrevMonth}
                                                className={styles.clayCalNavBtn}
                                                title="Bulan Sebelumnya"
                                                aria-label="Bulan Sebelumnya"
                                            >
                                                <FaChevronLeft size={9} />
                                            </button>
                                            <div className={styles.clayCalTitle}>
                                                {currentMonthName} {calYear}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleNextMonth}
                                                className={styles.clayCalNavBtn}
                                                title="Bulan Berikutnya"
                                                aria-label="Bulan Berikutnya"
                                            >
                                                <FaChevronRight size={9} />
                                            </button>
                                        </div>

                                        <div className={styles.clayCalSubNotice}>
                                            Pilih tanggal mulai menginap (Check-In)
                                        </div>

                                        <div className={styles.clayCalWeekdays}>
                                            {weekdayNames.map((w, idx) => (
                                                <div key={idx} className={styles.clayCalWeekdayCell}>
                                                    {w}
                                                </div>
                                            ))}
                                        </div>

                                        <div className={styles.clayCalGrid}>
                                            {calendarDays.map((cell, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    disabled={cell.isDisabled || !cell.isCurrentMonth}
                                                    onClick={() => handleSelectDate(cell.dateStr)}
                                                    className={`
                                                        ${styles.clayDayCell}
                                                        ${!cell.isCurrentMonth ? styles.clayDayCellOutside : ""}
                                                        ${cell.isDisabled ? styles.clayDayCellDisabled : ""}
                                                        ${cell.isToday ? styles.clayDayCellToday : ""}
                                                        ${cell.isInRange ? styles.clayDayCellInRange : ""}
                                                        ${cell.isCheckIn ? styles.clayDayCellCheckIn : ""}
                                                        ${cell.isCheckOut ? styles.clayDayCellCheckOut : ""}
                                                    `}
                                                    title={cell.dateStr}
                                                >
                                                    <span>{cell.dayNum}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className={styles.clayCalFooter}>
                                            <div className={styles.clayCalDateSummary}>
                                                <span className={styles.clayCalDateVal}>{formatDateWithLocale(checkIn)}</span>
                                                <span className={styles.clayCalNightsTag}>({nights} {nights > 1 ? t("nights") : t("night")})</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setActiveDatePopover(null)}
                                                className={styles.clayCalDoneBtn}
                                            >
                                                <FaCheck size={9} />
                                                <span>Tutup</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Night Counter Capsule */}
                            <div className={styles.searchColNight}>
                                <div className={styles.nightBadge}>
                                    <FaClock size={11} />
                                    <span>{nights} {nights > 1 ? t("nights") : t("night")}</span>
                                </div>
                            </div>

                            {/* 2. Check-Out Custom Clay Trigger */}
                            <div className={styles.searchColRelative} ref={activeDatePopover === "checkOut" ? datePopoverRef : undefined}>
                                <label className={styles.searchFieldLabel}>
                                    <FaCalendarDays size={11} />
                                    <span>{t("checkOut")}</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveDatePopover(activeDatePopover === "checkOut" ? null : "checkOut");
                                        setIsGuestPopoverOpen(false);
                                    }}
                                    className={`${styles.customSearchBtn} ${activeDatePopover === "checkOut" ? styles.customSearchBtnActive : ""}`}
                                    aria-label="Pilih Tanggal Check-Out"
                                    aria-haspopup="dialog"
                                    aria-expanded={activeDatePopover === "checkOut"}
                                >
                                    <span className={styles.customSearchBtnVal}>{formatDateWithLocale(checkOut)}</span>
                                    <FaChevronDown size={8} className={styles.customSearchBtnChevron} />
                                </button>

                                {/* Check-Out Calendar Popover */}
                                {activeDatePopover === "checkOut" && (
                                    <div
                                        className={`${styles.clayDatePickerPopover} ${styles.clayDatePickerPopoverRight}`}
                                        role="dialog"
                                        aria-modal="true"
                                        aria-label="Kalender Check-Out"
                                    >
                                        <div className={styles.clayCalHeader}>
                                            <button
                                                type="button"
                                                onClick={handlePrevMonth}
                                                className={styles.clayCalNavBtn}
                                                title="Bulan Sebelumnya"
                                                aria-label="Bulan Sebelumnya"
                                            >
                                                <FaChevronLeft size={9} />
                                            </button>
                                            <div className={styles.clayCalTitle}>
                                                {currentMonthName} {calYear}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleNextMonth}
                                                className={styles.clayCalNavBtn}
                                                title="Bulan Berikutnya"
                                                aria-label="Bulan Berikutnya"
                                            >
                                                <FaChevronRight size={9} />
                                            </button>
                                        </div>

                                        <div className={styles.clayCalSubNotice}>
                                            Pilih tanggal selesai menginap (Check-Out)
                                        </div>

                                        <div className={styles.clayCalWeekdays}>
                                            {weekdayNames.map((w, idx) => (
                                                <div key={idx} className={styles.clayCalWeekdayCell}>
                                                    {w}
                                                </div>
                                            ))}
                                        </div>

                                        <div className={styles.clayCalGrid}>
                                            {calendarDays.map((cell, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    disabled={cell.isDisabled || !cell.isCurrentMonth}
                                                    onClick={() => handleSelectDate(cell.dateStr)}
                                                    className={`
                                                        ${styles.clayDayCell}
                                                        ${!cell.isCurrentMonth ? styles.clayDayCellOutside : ""}
                                                        ${cell.isDisabled ? styles.clayDayCellDisabled : ""}
                                                        ${cell.isToday ? styles.clayDayCellToday : ""}
                                                        ${cell.isInRange ? styles.clayDayCellInRange : ""}
                                                        ${cell.isCheckIn ? styles.clayDayCellCheckIn : ""}
                                                        ${cell.isCheckOut ? styles.clayDayCellCheckOut : ""}
                                                    `}
                                                    title={cell.dateStr}
                                                >
                                                    <span>{cell.dayNum}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className={styles.clayCalFooter}>
                                            <div className={styles.clayCalDateSummary}>
                                                <span className={styles.clayCalDateVal}>{formatDateWithLocale(checkOut)}</span>
                                                <span className={styles.clayCalNightsTag}>({nights} {nights > 1 ? t("nights") : t("night")})</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setActiveDatePopover(null)}
                                                className={styles.clayCalDoneBtn}
                                            >
                                                <FaCheck size={9} />
                                                <span>Selesai</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 3. Guests Custom Clay Trigger */}
                            <div className={`${styles.searchColRelative} ${styles.searchColGuest}`} ref={guestPopoverRef}>
                                <label className={styles.searchFieldLabel}>
                                    <FaUsers size={11} />
                                    <span>{t("guests")}</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsGuestPopoverOpen(!isGuestPopoverOpen);
                                        setActiveDatePopover(null);
                                    }}
                                    className={`${styles.customSearchBtn} ${isGuestPopoverOpen ? styles.customSearchBtnActive : ""}`}
                                    aria-label="Pilih Jumlah Tamu"
                                    aria-haspopup="dialog"
                                    aria-expanded={isGuestPopoverOpen}
                                >
                                    <span className={styles.customSearchBtnVal}>
                                        {pricing.totalRooms || roomsFilterCount} {t("rooms")}, {adults} {t("adults")}{children > 0 ? `, ${children} ${t("children")}` : ""}
                                    </span>
                                    <FaChevronDown size={8} className={styles.customSearchBtnChevron} />
                                </button>

                                {/* Guest & Room Selector Popover */}
                                {isGuestPopoverOpen && (
                                    <div
                                        className={styles.clayGuestPopover}
                                        role="dialog"
                                        aria-modal="true"
                                        aria-label="Pilih Jumlah Kamar & Tamu"
                                    >
                                        <div className={styles.guestPopoverHeader}>
                                            <h4 className={styles.guestPopoverTitle}>{t("rooms")} & {t("guests")}</h4>
                                            <p className={styles.guestPopoverSub}>Tentukan jumlah kamar dan tamu menginap</p>
                                        </div>

                                        {/* Rooms Stepper */}
                                        <div className={styles.guestStepperRow}>
                                            <div className={styles.guestStepperInfo}>
                                                <span className={styles.guestStepperLabel}>{t("rooms")}</span>
                                                <span className={styles.guestStepperDesc}>Kamar yang dibutuhkan</span>
                                            </div>
                                            <div className={styles.stepperControls}>
                                                <button
                                                    type="button"
                                                    onClick={() => setRoomsFilterCount((prev) => Math.max(1, prev - 1))}
                                                    disabled={roomsFilterCount <= 1}
                                                    className={styles.stepperBtn}
                                                    aria-label="Kurangi Kamar"
                                                >
                                                    <FaMinus size={9} />
                                                </button>
                                                <span className={styles.stepperValue}>{roomsFilterCount}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setRoomsFilterCount((prev) => Math.min(8, prev + 1))}
                                                    disabled={roomsFilterCount >= 8}
                                                    className={styles.stepperBtn}
                                                    aria-label="Tambah Kamar"
                                                >
                                                    <FaPlus size={9} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Adults Stepper */}
                                        <div className={styles.guestStepperRow}>
                                            <div className={styles.guestStepperInfo}>
                                                <span className={styles.guestStepperLabel}>{t("adults")}</span>
                                                <span className={styles.guestStepperDesc}>Usia 13 tahun ke atas</span>
                                            </div>
                                            <div className={styles.stepperControls}>
                                                <button
                                                    type="button"
                                                    onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                                                    disabled={adults <= 1}
                                                    className={styles.stepperBtn}
                                                    aria-label="Kurangi Dewasa"
                                                >
                                                    <FaMinus size={9} />
                                                </button>
                                                <span className={styles.stepperValue}>{adults}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setAdults((prev) => Math.min(16, prev + 1))}
                                                    disabled={adults >= 16}
                                                    className={styles.stepperBtn}
                                                    aria-label="Tambah Dewasa"
                                                >
                                                    <FaPlus size={9} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Children Stepper */}
                                        <div className={styles.guestStepperRow}>
                                            <div className={styles.guestStepperInfo}>
                                                <span className={styles.guestStepperLabel}>{t("children")}</span>
                                                <span className={styles.guestStepperDesc}>Usia 0 - 12 tahun</span>
                                            </div>
                                            <div className={styles.stepperControls}>
                                                <button
                                                    type="button"
                                                    onClick={() => setChildren((prev) => Math.max(0, prev - 1))}
                                                    disabled={children <= 0}
                                                    className={styles.stepperBtn}
                                                    aria-label="Kurangi Anak"
                                                >
                                                    <FaMinus size={9} />
                                                </button>
                                                <span className={styles.stepperValue}>{children}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setChildren((prev) => Math.min(8, prev + 1))}
                                                    disabled={children >= 8}
                                                    className={styles.stepperBtn}
                                                    aria-label="Tambah Anak"
                                                >
                                                    <FaPlus size={9} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Apply Button */}
                                        <div className={styles.guestPopoverFooter}>
                                            <button
                                                type="button"
                                                onClick={() => setIsGuestPopoverOpen(false)}
                                                className={styles.guestApplyBtn}
                                            >
                                                <FaCheck size={10} />
                                                <span>Terapkan ({roomsFilterCount} Kamar, {adults + children} Tamu)</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Promo Code */}
                            <div className={styles.searchColPromo}>
                                <label className={styles.searchFieldLabel}>
                                    <FaTag size={11} />
                                    <span>{t("promoVoucher")}</span>
                                </label>
                                {appliedPromo ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAppliedPromo(null);
                                            setPromoDiscountPercent(0);
                                            setPromoInput("");
                                        }}
                                        className={styles.appliedPromoBtn}
                                        title="Klik untuk menghapus promo"
                                    >
                                        <span>{appliedPromo} (-{promoDiscountPercent}%)</span>
                                        <FaXmark size={12} />
                                    </button>
                                ) : (
                                    <form onSubmit={handleApplyPromo} className={styles.promoForm}>
                                        <input
                                            type="text"
                                            placeholder={t("voucherCode")}
                                            value={promoInput}
                                            onChange={(e) => setPromoInput(e.target.value)}
                                            className={styles.promoInput}
                                        />
                                        <button type="submit" className={styles.btnApplyPromo}>
                                            {t("applyPromo")}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Subtle Guarantee Ribbon */}
                        <div className={styles.trustRibbon}>
                            <div className={styles.trustItem}>
                                <FaCircleCheck size={11} color="#16a34a" />
                                <span>{t("noBookingFeeDirect")}</span>
                            </div>
                            <div className={styles.trustDivider} />
                            <div className={styles.trustItem}>
                                <FaShieldHalved size={11} color="#d97706" />
                                <span>{t("instantPmsConfirm")}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── 5. Main Content 2-Column Grid ── */}
            <div className={styles.mainContainer}>
                {/* ══ STEP 1: ROOM SELECTION ══ */}
                {step === 1 && (
                    <div className={styles.roomList}>
                        {engineData?.rooms && engineData.rooms.length > 0 ? (
                            engineData.rooms.map((room) => {
                                const isSelected = selectedRoomId === room.id;
                                const isScarcity = room.availableRooms > 0 && room.availableRooms <= 3;
                                const hasImages = room.images && room.images.length > 0;
                                const primaryImgUrl = hasImages ? room.images[0].url : "";

                                return (
                                    <div
                                        key={room.id}
                                        className={styles.roomCard}
                                        style={{
                                            opacity: room.isSoldOut ? 0.65 : 1,
                                            pointerEvents: room.isSoldOut ? "none" : "auto",
                                        }}
                                    >
                                        {/* Left Column: Room Title + Photo + Capacity + Detail Link */}
                                        <div className={styles.roomLeftCol}>
                                            <h3 className={styles.roomTitle}>{room.name}</h3>

                                            <div className={styles.roomMediaContainer}>
                                                {primaryImgUrl ? (
                                                    <Image
                                                        src={primaryImgUrl}
                                                        alt={room.name}
                                                        fill
                                                        className={styles.roomImage}
                                                        priority
                                                    />
                                                ) : (
                                                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #292524 0%, #1c1917 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <FaDoorOpen size={40} color="#57534e" />
                                                    </div>
                                                )}
                                                <div className={styles.roomMediaOverlay}>
                                                    <div className={styles.roomMediaTop}>
                                                        {room.isSoldOut ? (
                                                            <span className={styles.scarcityBadge} style={{ background: "#78716c" }}>
                                                                {t("soldOut")}
                                                            </span>
                                                        ) : isScarcity ? (
                                                            <span className={styles.scarcityBadge}>
                                                                {t("roomsLeft", { count: room.availableRooms })}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Occupancy Info */}
                                            <div className={styles.roomOccupancyRow}>
                                                <span className={styles.occupancyText}>
                                                    <FaUsers size={12} />
                                                    <span>{t("maxAdults")} {room.capacity || 2}</span>
                                                </span>
                                                <span className={styles.occupancyDivider}>|</span>
                                                <span className={styles.occupancyText}>
                                                    <FaUsers size={12} />
                                                    <span>{t("maxChildren")} {room.maxChildren ?? 1}</span>
                                                </span>
                                            </div>

                                            {/* Lihat detail kamar link */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPreviewRoom(room);
                                                    setActivePhotoIndex(0);
                                                }}
                                                className={styles.btnRoomDetailLink}
                                            >
                                                <span>{t("viewRoomDetails")}</span>
                                                <FaChevronRight size={10} />
                                            </button>
                                        </div>

                                        {/* Room Body & Rate Plans */}
                                        <div className={styles.roomBody}>

                                            {/* Key Specs Row */}
                                            <div className={styles.specsRow}>
                                                {room.roomSizeValue ? (
                                                    <span className={styles.specPill}>
                                                        <FaExpand size={12} />
                                                        <span>{room.roomSizeValue} {room.roomSizeUnit || "m²"}</span>
                                                    </span>
                                                ) : null}
                                                {room.bedType ? (
                                                    <span className={styles.specPill}>
                                                        <FaBed size={12} />
                                                        <span>{room.bedType}</span>
                                                    </span>
                                                ) : null}
                                                {room.capacity ? (
                                                    <span className={styles.specPill}>
                                                        <FaUsers size={12} />
                                                        <span>{room.capacity} {t("guests")}</span>
                                                    </span>
                                                ) : null}
                                            </div>

                                            {/* Real Amenities Chips from Firestore */}
                                            {room.amenities && room.amenities.length > 0 && (
                                                <div className={styles.amenitiesList}>
                                                    {room.amenities.map((amenity, idx) => (
                                                        <span key={idx} className={styles.amenityTag}>
                                                            {getFacilityIcon(amenity, 11)}
                                                            <span>{amenity}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Rate Plans List */}
                                            <div className={styles.ratePlansContainer}>
                                                {room.ratePlans.map((ratePlan) => {
                                                    const cartItemForThisPlan = pricing.items.find(
                                                        (it) => it.roomTypeId === room.id && it.ratePlanId === ratePlan.id
                                                    );
                                                    const planQuantity = cartItemForThisPlan?.quantity || 0;
                                                    const isPlanSelected = planQuantity > 0;
                                                    const discountedPrice = appliedPromo
                                                        ? Math.round(ratePlan.price * (1 - promoDiscountPercent / 100))
                                                        : ratePlan.price;

                                                    return (
                                                        <div
                                                            key={ratePlan.id}
                                                            className={`${styles.ratePlanCard} ${isPlanSelected ? styles.ratePlanCardSelected : ""}`}
                                                        >
                                                            <div className={styles.ratePlanInfo}>
                                                                <h4 className={styles.ratePlanName}>
                                                                    <span>{ratePlan.name}</span>
                                                                    {ratePlan.mealsIncluded && (
                                                                        <span className={styles.breakfastBadge}>
                                                                            <FaUtensils size={11} />
                                                                            <span>Termasuk Sarapan</span>
                                                                        </span>
                                                                    )}
                                                                </h4>
                                                                {ratePlan.description ? (
                                                                    <p className={styles.ratePlanDesc}>
                                                                        {ratePlan.description}
                                                                    </p>
                                                                ) : null}
                                                                <div className={styles.ratePlanPerks}>
                                                                    <span className={styles.ratePerkItem}>
                                                                        <FaCircleCheck size={12} />
                                                                        <span>{t("instantPmsConfirm")}</span>
                                                                    </span>
                                                                    {ratePlan.cancellationPolicy && (
                                                                        <div className={styles.cancellationBadgeRow}>
                                                                            {ratePlan.cancellationPolicy.type === "free_cancellation" ? (
                                                                                <span className={styles.cancellationBadgeFree}>
                                                                                    <FaCircleCheck size={10} />
                                                                                    <span>{t("freeCancellation")} (H-1)</span>
                                                                                </span>
                                                                            ) : (
                                                                                <span className={styles.cancellationBadgeNonRef}>
                                                                                    <FaCircleExclamation size={10} />
                                                                                    <span>{t("nonRefundable")}</span>
                                                                                </span>
                                                                            )}
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setActivePolicyModal(ratePlan.cancellationPolicy || null);
                                                                                }}
                                                                                className={styles.policyBadgeBtn}
                                                                            >
                                                                                {t("cancellationPolicy")}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className={styles.ratePlanPricing}>
                                                                {appliedPromo && pricing.discountAmount > 0 && (
                                                                    <span className={styles.strikePrice}>
                                                                        {formatMoney(ratePlan.price)}
                                                                    </span>
                                                                )}
                                                                <span className={styles.actualPrice}>
                                                                    {formatMoney(discountedPrice)}
                                                                </span>
                                                                <span className={styles.pricePerNight}>{t("perNight")}</span>

                                                                {isPlanSelected ? (
                                                                    <div className={styles.cartStepperRow} onClick={(e) => e.stopPropagation()}>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDecrementCart(room.id, ratePlan.id);
                                                                            }}
                                                                            className={styles.cartStepperBtn}
                                                                            aria-label="Kurangi Kamar"
                                                                        >
                                                                            <FaMinus size={9} />
                                                                        </button>
                                                                        <span className={styles.cartStepperVal}>{planQuantity} {t("rooms")}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleAddOrIncrementCart(room, ratePlan);
                                                                            }}
                                                                            disabled={planQuantity >= room.availableRooms}
                                                                            className={styles.cartStepperBtn}
                                                                            aria-label="Tambah Kamar"
                                                                        >
                                                                            <FaPlus size={9} />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleAddOrIncrementCart(room, ratePlan);
                                                                        }}
                                                                        disabled={room.isSoldOut}
                                                                        className={styles.btnSelectRate}
                                                                    >
                                                                        + {t("selectRoom")}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ textAlign: "center", padding: "60px 24px", background: "#ffffff", borderRadius: "24px", border: "1.5px solid rgba(255, 255, 255, 0.9)", boxShadow: "var(--clay-shadow-out-md)" }}>
                                <FaCircleInfo size={32} color="#78716c" style={{ margin: "0 auto 12px auto", display: "block" }} />
                                <h3 style={{ fontSize: "16.5px", fontWeight: 800, margin: "0 0 6px 0", color: "#0f172a" }}>
                                    Kamar Tidak Tersedia untuk Periode Tanggal Terpilih
                                </h3>
                                <p style={{ fontSize: "13px", color: "#64748b", margin: 0, fontWeight: 600 }}>
                                    Silakan sesuaikan tanggal check-in dan check-out untuk memeriksa ketersediaan tipe kamar lainnya.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ══ STEP 2: GUEST DETAILS & PAYMENT CHECKOUT ══ */}
                {step === 2 && (
                    <div className={styles.checkoutContainer}>
                        {/* Summary of Selected Rooms Banner */}
                        <div style={{
                            background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)",
                            border: "1.5px solid rgba(226, 232, 240, 0.9)",
                            borderRadius: "16px",
                            padding: "16px 20px",
                            marginBottom: "24px",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <FaBed size={15} color="var(--theme-primary, #6D2B35)" />
                                    <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                                        {t("selectedRoomsList")} ({pricing.totalRooms} Kamar)
                                    </strong>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "var(--theme-primary, #6D2B35)",
                                        fontSize: "12.5px",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        padding: "4px 8px",
                                        borderRadius: "6px",
                                    }}
                                >
                                    Ubah Pilihan Kamar
                                </button>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {pricing.items.map((it, idx) => (
                                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span style={{
                                                background: "var(--theme-primary, #6D2B35)",
                                                color: "#ffffff",
                                                fontWeight: 800,
                                                fontSize: "11px",
                                                padding: "2px 7px",
                                                borderRadius: "6px"
                                            }}>
                                                {it.quantity}x
                                            </span>
                                            <span style={{ fontWeight: 700, color: "#1e293b" }}>{it.roomTypeName}</span>
                                            <span style={{ color: "#64748b", fontSize: "12px" }}>({it.ratePlanName})</span>
                                        </div>
                                        <span style={{ fontWeight: 700, color: "#0f172a" }}>
                                            {formatMoney(it.pricePerNight * it.quantity * nights)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.checkoutSectionHeader}>
                            <div className={styles.sectionHeaderIcon}>
                                <FaUsers size={18} />
                            </div>
                            <div>
                                <h3 className={styles.checkoutTitle}>{t("guestContactInfo")}</h3>
                                <p style={{ fontSize: "12.5px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 600 }}>
                                    Lengkapi data pemesan resmi. Bukti reservasi dan e-voucher akan dikirimkan langsung ke email Anda.
                                </p>
                            </div>
                        </div>

                        <div className={styles.formGrid}>
                            <div>
                                <label className={styles.formLabel}>{t("fullName")} *</label>
                                <input
                                    type="text"
                                    required
                                    value={guestDetails.fullName}
                                    onChange={(e) => setGuestDetails({ ...guestDetails, fullName: e.target.value })}
                                    placeholder="Nama Lengkap"
                                    className={styles.formInput}
                                />
                            </div>

                            <div>
                                <label className={styles.formLabel}>{t("email")} *</label>
                                <input
                                    type="email"
                                    required
                                    value={guestDetails.email}
                                    onChange={(e) => setGuestDetails({ ...guestDetails, email: e.target.value })}
                                    placeholder="nama@email.com"
                                    className={styles.formInput}
                                />
                            </div>

                            <div>
                                <label className={styles.formLabel}>{t("phone")} *</label>
                                <input
                                    type="tel"
                                    required
                                    value={guestDetails.phone}
                                    onChange={(e) => setGuestDetails({ ...guestDetails, phone: e.target.value })}
                                    placeholder="+62 8..."
                                    className={styles.formInput}
                                />
                            </div>

                            <div>
                                <label className={styles.formLabel}>{t("arrivalTime")}</label>
                                <select
                                    value={guestDetails.estimatedArrivalTime}
                                    onChange={(e) => setGuestDetails({ ...guestDetails, estimatedArrivalTime: e.target.value })}
                                    className={styles.formInput}
                                >
                                    <option value="14:00">14:00 - 16:00 (Standard Check-In)</option>
                                    <option value="16:00">16:00 - 18:00</option>
                                    <option value="18:00">18:00 - 20:00 (Malam)</option>
                                    <option value="20:00">Di atas 20:00 (Late Arrival)</option>
                                </select>
                            </div>

                            <div className={styles.formGroupFull}>
                                <label className={styles.formLabel}>{t("specialRequests")}</label>
                                <textarea
                                    value={guestDetails.specialRequests}
                                    onChange={(e) => setGuestDetails({ ...guestDetails, specialRequests: e.target.value })}
                                    placeholder={t("specialRequestsPlaceholder")}
                                    className={styles.formTextarea}
                                />
                            </div>
                        </div>

                        {/* ✦ Step 2 Add-Ons & Extra Services (Upselling) */}
                        {engineData?.addOns && engineData.addOns.length > 0 && (
                            <div className={styles.addOnsSection}>
                                <div className={styles.addOnsHeader}>
                                    <div className={styles.sectionHeaderIcon}>
                                        <FaBellConcierge size={18} />
                                    </div>
                                    <div>
                                        <h3 className={styles.checkoutTitle}>{t("addOnsTitle")}</h3>
                                        <p style={{ fontSize: "12.5px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 600 }}>
                                            {t("addOnsSubtitle")}
                                        </p>
                                    </div>
                                </div>

                                <div className={styles.addOnsGrid}>
                                    {engineData.addOns.map((addon) => {
                                        const selected = selectedAddOns.find((a) => a.id === addon.id);
                                        const isSelected = !!selected;
                                        const qty = selected?.quantity || 1;

                                        return (
                                            <div
                                                key={addon.id}
                                                className={`${styles.addOnCard} ${isSelected ? styles.addOnCardSelected : ""}`}
                                            >
                                                <div className={styles.addOnLeft}>
                                                    <div className={styles.addOnIconWrap}>
                                                        {addon.icon === "bed" ? (
                                                            <FaBed size={16} />
                                                        ) : addon.icon === "car" ? (
                                                            <FaCar size={16} />
                                                        ) : addon.icon === "clock" ? (
                                                            <FaClock size={16} />
                                                        ) : addon.icon === "utensils" ? (
                                                            <FaUtensils size={16} />
                                                        ) : (
                                                            <FaWineGlass size={16} />
                                                        )}
                                                    </div>
                                                    <div className={styles.addOnInfo}>
                                                        <h4 className={styles.addOnTitle}>{addon.name}</h4>
                                                        <p className={styles.addOnDesc}>{addon.description}</p>
                                                    </div>
                                                </div>

                                                <div className={styles.addOnRight}>
                                                    <div className={styles.addOnPriceWrap}>
                                                        <span className={styles.addOnPrice}>
                                                            {formatMoney(addon.price)}
                                                        </span>
                                                        <span className={styles.addOnPriceUnit}>
                                                            {addon.priceType === "per_night" ? t("perNightUnit") : t("perStayUnit")}
                                                        </span>
                                                    </div>

                                                    {isSelected ? (
                                                        <div className={styles.cartStepperRow} onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdateAddOnQty(addon.id, -1)}
                                                                className={styles.cartStepperBtn}
                                                                aria-label="Kurangi Add-On"
                                                            >
                                                                <FaMinus size={8} />
                                                            </button>
                                                            <span className={styles.cartStepperVal}>{qty}x</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdateAddOnQty(addon.id, 1)}
                                                                className={styles.cartStepperBtn}
                                                                aria-label="Tambah Add-On"
                                                            >
                                                                <FaPlus size={8} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleAddOn(addon)}
                                                            className={styles.addOnToggleBtn}
                                                        >
                                                            <FaPlus size={9} />
                                                            <span>{t("add")}</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Payment Method Details */}
                        <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid #f5f5f4" }}>
                            <div className={styles.checkoutSectionHeader}>
                                <div className={styles.sectionHeaderIcon}>
                                    <FaCreditCard size={18} />
                                </div>
                                <div>
                                    <h3 className={styles.checkoutTitle}>{t("paymentMethod")}</h3>
                                    <p style={{ fontSize: "12.5px", color: "#78716c", margin: "2px 0 0 0" }}>
                                        {t("securePayment")}
                                    </p>
                                </div>
                            </div>

                            {engineData?.activeProvider === "manual" && (
                                <div>
                                    {engineData?.manualTransfer?.banks && engineData.manualTransfer.banks.length > 0 ? (
                                        <>
                                            <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#44403c" }}>
                                                Rekening Pembayaran Hotel:
                                            </span>
                                            <div className={styles.bankList}>
                                                {engineData.manualTransfer.banks.map((b) => (
                                                    <div key={b.id} className={styles.bankCard}>
                                                        <div className={styles.bankInfo}>
                                                            <span className={styles.bankName}>{b.bankName}</span>
                                                            <span className={styles.bankAccount}>{b.accountNumber}</span>
                                                            <span className={styles.bankHolder}>a/n {b.accountHolder} {b.branch ? `(${b.branch})` : ""}</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(b.accountNumber);
                                                                showAlert(`Nomor rekening ${b.accountNumber} (${b.bankName}) berhasil disalin!`, "success", "Berhasil Disalin");
                                                            }}
                                                            className={styles.btnCopy}
                                                        >
                                                            <FaCopy size={12} />
                                                            <span>Salin Rekening</span>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ background: "#fafaf9", padding: "14px", borderRadius: "10px", border: "1px solid #e7e5e4", fontSize: "13px", color: "#57534e" }}>
                                            Metode pembayaran transfer bank langsung di tempat / verifikasi Front Desk.
                                        </div>
                                    )}
                                </div>
                            )}

                            {engineData?.activeProvider === "midtrans" && (
                                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <FaCreditCard size={20} color="#0284c7" />
                                        <div>
                                            <strong style={{ fontSize: "14px", display: "block" }}>Midtrans Payment Gateway</strong>
                                            <span style={{ fontSize: "12px", color: "#64748b" }}>
                                                Mendukung QRIS, GoPay, Virtual Account Multi-Bank, dan Kartu Kredit secara otomatis.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {engineData?.activeProvider === "xendit" && (
                                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <FaCreditCard size={20} color="#0284c7" />
                                        <div>
                                            <strong style={{ fontSize: "14px", display: "block" }}>Xendit Checkout</strong>
                                            <span style={{ fontSize: "12px", color: "#64748b" }}>
                                                Pelunasan otomatis melalui QRIS, Virtual Account, dan E-Wallet resmi.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {engineData?.activeProvider === "doku" && (
                                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <FaCreditCard size={20} color="#e11d48" />
                                        <div>
                                            <strong style={{ fontSize: "14px", display: "block" }}>DOKU Payment Gateway (Jokul Checkout)</strong>
                                            <span style={{ fontSize: "12px", color: "#64748b" }}>
                                                Mendukung QRIS, Multi-Bank Virtual Account, Kartu Kredit/Debit, OVO & DOKU Wallet secara instan.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Stylized Active Payment Option Card */}
                            <div className={styles.paymentOptionBox}>
                                <div className={styles.paymentRadioActive}>
                                    <div className={styles.paymentRadioDot} />
                                </div>
                                <div className={styles.paymentOptionInfo}>
                                    <h4 className={styles.paymentOptionTitle}>Metode Pembayaran Resmi</h4>
                                    <p className={styles.paymentOptionDesc}>
                                        {engineData?.activeProvider === "manual"
                                            ? "Transfer ke rekening perbankan resmi hotel terverifikasi."
                                            : "Pembayaran online aman dan terverifikasi secara instan."}
                                    </p>
                                </div>
                            </div>

                            {/* Green Urgency & Price Guarantee Reassurance */}
                            <div className={styles.securePriceAlert}>
                                <span>Tarif Resmi & Ketersediaan Kamar Terkunci</span>
                            </div>

                            {/* Terms & Privacy Agreement Checkbox */}
                            <label className={styles.termsAgreementWrap}>
                                <input
                                    type="checkbox"
                                    checked={hasAgreedTerms}
                                    onChange={(e) => setHasAgreedTerms(e.target.checked)}
                                    className={styles.termsCheckbox}
                                />
                                <span>
                                    Saya telah membaca dan menyetujui{" "}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setShowPrivacyModal(true);
                                        }}
                                        className={styles.linkPolicy}
                                    >
                                        Kebijakan Privasi
                                    </button>{" "}
                                    dan{" "}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setShowTermsModal(true);
                                        }}
                                        className={styles.linkPolicy}
                                    >
                                        Syarat & Ketentuan
                                    </button>
                                </span>
                            </label>

                            {/* Big Confirmation Button inside Step 2 card matching UI */}
                            <button
                                type="button"
                                onClick={handleConfirmBooking}
                                disabled={isSubmitting}
                                className={styles.btnConfirmFull}
                            >
                                <FaLock size={14} />
                                <span>{isSubmitting ? t("processing") : "Konfirmasi Pesanan"}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ══ STEP 3: CONFIRMATION VOUCHER & DIRECT ACTIONS ══ */}
                {step === 3 && (() => {
                    const hotelWaPhone = (engineData?.hotelPhone || "").replace(/[^0-9]/g, "").replace(/^0/, "62");
                    const waMessageText = encodeURIComponent(
                        `Halo ${engineData?.hotelName || "Hotel"}, saya ingin konfirmasi reservasi langsung resmi:\n\n` +
                        `📋 *Kode Booking:* ${confirmedBookingCode}\n` +
                        `👤 *Nama Tamu:* ${guestDetails.fullName}\n` +
                        `📅 *Periode Inap:* ${formatDateWithLocale(checkIn)} - ${formatDateWithLocale(checkOut)} (${nights} Malam)\n` +
                        `🛏️ *Kamar:* ${pricing.items.map((it) => `${it.quantity}x ${it.roomTypeName} (${it.ratePlanName})`).join(", ")}\n` +
                        (pricing.addOnsList.length > 0 ? `✨ *Layanan Ekstra:* ${pricing.addOnsList.map((ad) => `${ad.quantity}x ${ad.name}`).join(", ")}\n` : "") +
                        `💰 *Total Tagihan:* ${formatMoney(pricing.grandTotal)}\n\n` +
                        `Mohon dibantu verifikasi ketersediaan dan status reservasi ini. Terima kasih!`
                    );
                    const waConfirmationUrl = hotelWaPhone
                        ? `https://wa.me/${hotelWaPhone}?text=${waMessageText}`
                        : `https://wa.me/?text=${waMessageText}`;

                    return (
                        <div className={styles.checkoutContainer} style={{ textAlign: "center", padding: "40px 20px" }}>
                            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px auto", boxShadow: "0 4px 14px rgba(16, 185, 129, 0.2)" }}>
                                <FaCircleCheck size={36} />
                            </div>
                            <h2 style={{ fontFamily: '\'Plus Jakarta Sans\', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontSize: "24px", fontWeight: 900, margin: "0 0 8px 0", letterSpacing: "-0.02em", color: "#0f172a" }}>
                                {t("bookingSuccessTitle")}
                            </h2>
                            <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "500px", margin: "0 auto 24px auto", lineHeight: 1.5 }}>
                                Terima kasih, <strong>{guestDetails.fullName}</strong>. Pemesanan langsung Anda berhasil terkonfirmasi ke sistem hotel.
                            </p>

                            {/* Official Printable Voucher Card */}
                            <div className={styles.voucherCard}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1.5px solid #e2e8f0", paddingBottom: "16px", marginBottom: "16px" }}>
                                    <div>
                                        <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                                            {engineData?.hotelName || "Hotel Mitra"}
                                        </h3>
                                        <p style={{ fontSize: "12px", color: "#64748b", margin: "3px 0 0 0" }}>
                                            {engineData?.hotelAddress || engineData?.city || "Official Direct Booking"}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <span style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
                                            {t("bookingCode")}
                                        </span>
                                        <strong style={{ fontSize: "16px", fontWeight: 900, color: "#6D2B35", letterSpacing: "0.05em" }}>
                                            {confirmedBookingCode}
                                        </strong>
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px", background: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Nama Tamu Utama:</span>
                                        <strong style={{ fontSize: "13px", color: "#1e293b" }}>{guestDetails.fullName}</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Kontak:</span>
                                        <strong style={{ fontSize: "13px", color: "#1e293b" }}>{guestDetails.phone}</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Tanggal Check-In:</span>
                                        <strong style={{ fontSize: "13px", color: "#1e293b" }}>{formatDateWithLocale(checkIn)} (14:00)</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Tanggal Check-Out:</span>
                                        <strong style={{ fontSize: "13px", color: "#1e293b" }}>{formatDateWithLocale(checkOut)} (12:00)</strong>
                                    </div>
                                </div>

                                <div style={{ marginBottom: "16px" }}>
                                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#334155", display: "block", marginBottom: "6px" }}>
                                        {t("selectedRoomsList")}:
                                    </span>
                                    {pricing.items.map((it, idx) => (
                                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "4px 0" }}>
                                            <span><strong>{it.quantity}x</strong> {it.roomTypeName} <span style={{ color: "#64748b", fontSize: "12px" }}>({it.ratePlanName})</span></span>
                                            <span style={{ fontWeight: 700, color: "#0f172a" }}>{formatMoney(it.pricePerNight * it.quantity * nights)}</span>
                                        </div>
                                    ))}
                                </div>

                                {pricing.addOnsList.length > 0 && (
                                    <div style={{ marginBottom: "16px", borderTop: "1px dashed #e2e8f0", paddingTop: "10px" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 800, color: "#334155", display: "block", marginBottom: "6px" }}>
                                            Layanan Ekstra (Add-Ons):
                                        </span>
                                        {pricing.addOnsList.map((ad, idx) => (
                                            <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "3px 0" }}>
                                                <span><strong>{ad.quantity}x</strong> {ad.name}</span>
                                                <span style={{ fontWeight: 700, color: "#0f172a" }}>{formatMoney(ad.subtotal)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "2px solid #0f172a", paddingTop: "14px", marginTop: "14px" }}>
                                    <div>
                                        <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", display: "block" }}>{t("grandTotal")}</span>
                                        <span style={{ fontSize: "11px", color: "#64748b" }}>Termasuk Pajak & Biaya Layanan</span>
                                    </div>
                                    <strong style={{ fontSize: "18px", fontWeight: 900, color: "#6D2B35" }}>
                                        {formatMoney(pricing.grandTotal)}
                                    </strong>
                                </div>
                            </div>

                            {/* Direct WhatsApp & PDF Actions */}
                            <div className={styles.voucherActionRow}>
                                <a
                                    href={waConfirmationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.btnWhatsAppConfirm}
                                    title="Kirim bukti transfer atau konfirmasi pemesanan langsung ke WhatsApp Front Desk Hotel"
                                >
                                    <FaWhatsapp size={18} />
                                    <span>Kirim Bukti via WhatsApp</span>
                                </a>

                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className={styles.btnPrintVoucher}
                                    title="Cetak atau simpan E-Voucher resmi dalam format PDF"
                                >
                                    <FaPrint size={15} />
                                    <span>Cetak E-Voucher PDF</span>
                                </button>

                                <Link
                                    href={returnWebsiteUrl}
                                    className={styles.btnProceed}
                                    style={{ display: "inline-flex", width: "auto", padding: "13px 24px", textDecoration: "none" }}
                                >
                                    <FaArrowLeft size={14} />
                                    <span>{t("backToWebsite")}</span>
                                </Link>
                            </div>
                        </div>
                    );
                })()}

                {/* ══ RIGHT COLUMN: STICKY RESERVATION LEDGER ══ */}
                {step < 3 && (
                    <aside className={styles.summaryLedger}>

                        <div className={styles.summaryHeader}>
                            <h3 className={styles.summaryHotelName}>
                                {engineData?.hotelName || "Hotel Mitra"}
                            </h3>
                            <div className={styles.stayDateRange}>
                                <FaCalendarDays size={13} color="#78716c" />
                                <span>{formatDateWithLocale(checkIn)} - {formatDateWithLocale(checkOut)}</span>
                            </div>
                        </div>

                        {/* Multi-Room Cart Items in Sidebar */}
                        {pricing.items.length > 0 ? (
                            <div className={styles.cartItemsList}>
                                {pricing.items.map((it) => (
                                    <div key={`${it.roomTypeId}_${it.ratePlanId}`} className={styles.cartItemRow}>
                                        <div className={styles.cartItemLeft}>
                                            <div className={styles.cartItemNameRow}>
                                                <span className={styles.cartItemQtyBadge}>{it.quantity}x</span>
                                                <strong className={styles.cartItemRoomName}>{it.roomTypeName}</strong>
                                            </div>
                                            <span className={styles.cartItemRateName}>{it.ratePlanName}</span>
                                        </div>
                                        <div className={styles.cartItemRight}>
                                            <span className={styles.cartItemPrice}>
                                                {formatMoney(it.pricePerNight * it.quantity * nights)}
                                            </span>
                                            <div className={styles.cartItemMiniControls}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDecrementCart(it.roomTypeId, it.ratePlanId)}
                                                    className={styles.miniCartBtn}
                                                    title="Kurangi 1 Kamar"
                                                    aria-label="Kurangi 1 Kamar"
                                                >
                                                    <FaMinus size={8} />
                                                </button>
                                                <span className={styles.miniCartQty}>{it.quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const foundRoom = engineData?.rooms.find((r) => r.id === it.roomTypeId);
                                                        if (foundRoom) handleAddOrIncrementCart(foundRoom, it);
                                                    }}
                                                    disabled={it.quantity >= it.availableRooms}
                                                    className={styles.miniCartBtn}
                                                    title="Tambah 1 Kamar"
                                                    aria-label="Tambah 1 Kamar"
                                                >
                                                    <FaPlus size={8} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyCartNotice}>
                                <span>{t("emptyCart")}</span>
                            </div>
                        )}

                        {/* Pricing Ledger */}
                        <div className={styles.priceBreakdown}>
                            <div className={styles.breakdownRow}>
                                <span>{t("roomRate")} ({pricing.totalRooms} {pricing.totalRooms > 1 ? t("rooms") : t("roomType")}, {nights} {nights > 1 ? t("nights") : t("night")})</span>
                                <span>{formatMoney(pricing.netRoomSubtotal)}</span>
                            </div>

                            {pricing.addOnsList.length > 0 && (
                                <div className={styles.breakdownRow}>
                                    <span>Layanan Tambahan ({pricing.addOnsList.length} Item)</span>
                                    <span>{formatMoney(pricing.addOnsSubtotal)}</span>
                                </div>
                            )}

                            {appliedPromo && pricing.discountAmount > 0 && (
                                <div className={`${styles.breakdownRow} ${styles.breakdownRowDiscount}`}>
                                    <span>{t("promoDiscount")} ({appliedPromo} -{promoDiscountPercent}%)</span>
                                    <span>-{formatMoney(pricing.discountAmount)}</span>
                                </div>
                            )}

                            {pricing.taxRate > 0 && (
                                <div className={styles.breakdownRow}>
                                    <span>Pajak Pemerintah (PB1 {pricing.taxRate}%)</span>
                                    <span>{formatMoney(pricing.taxAmount)}</span>
                                </div>
                            )}

                            {pricing.serviceRate > 0 && (
                                <div className={styles.breakdownRow}>
                                    <span>Biaya Layanan ({pricing.serviceRate}%)</span>
                                    <span>{formatMoney(pricing.serviceAmount)}</span>
                                </div>
                            )}

                            <div className={styles.totalRow}>
                                <div className={styles.totalLabel}>
                                    <span>{t("grandTotal")}</span>
                                    <span className={styles.totalSubtext}>
                                        {t("inclTaxes")}
                                    </span>
                                </div>
                                <span className={styles.totalValue}>{formatMoney(pricing.grandTotal)}</span>
                            </div>
                        </div>

                        {/* Step Navigation Action */}
                        {step === 1 ? (
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                disabled={pricing.items.length === 0}
                                className={styles.btnProceed}
                            >
                                <span>{t("continueToGuestInfo")}</span>
                                <FaChevronRight size={14} />
                            </button>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "18px" }}>
                                <button
                                    type="button"
                                    onClick={handleConfirmBooking}
                                    disabled={isSubmitting}
                                    className={styles.btnProceed}
                                >
                                    <FaLock size={14} />
                                    <span>{isSubmitting ? t("processing") : t("confirmBooking")}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "#78716c",
                                        fontSize: "12.5px",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        padding: "6px",
                                    }}
                                >
                                    ← {t("backToRooms")}
                                </button>
                            </div>
                        )}

                        <div className={styles.guaranteeBadge}>
                            <FaShieldHalved size={14} color="#6D2B35" />
                            <span>{t("noBookingFeeDirect")}</span>
                        </div>
                    </aside>
                )}
            </div>

            {/* ── 6. iOS Smooth Room Detail Modal ── */}
            {previewRoom && (
                <div className={styles.modalBackdrop} onClick={() => setPreviewRoom(null)}>
                    <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className={styles.modalHeader}>
                            <div className={styles.modalHeaderLeft}>
                                <h3 className={styles.modalTitle}>{previewRoom.name}</h3>
                                <p className={styles.modalSubtitle}>
                                    Kapasitas Maks: {previewRoom.capacity || 2} Dewasa dan {previewRoom.maxChildren ?? 1} Anak • Harga mulai dari <strong>{formatMoney(previewRoom.basePrice)}</strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPreviewRoom(null)}
                                className={styles.modalCloseBtn}
                                aria-label="Tutup Detail Kamar"
                            >
                                <FaXmark size={15} />
                            </button>
                        </div>

                        {/* Modal Body: 2 Columns */}
                        <div className={styles.modalBodyGrid}>
                            {/* Left Column: Big Image & Thumbnails */}
                            <div className={styles.modalGalleryCol}>
                                <div className={styles.modalBigPhotoWrap}>
                                    {previewRoom.images && previewRoom.images.length > 0 ? (
                                        <Image
                                            src={previewRoom.images[activePhotoIndex]?.url || previewRoom.images[0].url}
                                            alt={`${previewRoom.name} foto`}
                                            fill
                                            className={styles.modalBigPhotoImg}
                                            priority
                                        />
                                    ) : (
                                        <div className={styles.modalNoPhoto}>
                                            <FaDoorOpen size={48} color="#94a3b8" />
                                            <span>Tidak ada foto kamar</span>
                                        </div>
                                    )}
                                </div>

                                {previewRoom.images && previewRoom.images.length > 1 && (
                                    <div className={styles.modalThumbRow}>
                                        {previewRoom.images.map((img, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setActivePhotoIndex(idx)}
                                                className={`${styles.modalThumbBtn} ${activePhotoIndex === idx ? styles.modalThumbBtnActive : ""}`}
                                            >
                                                <Image
                                                    src={img.url}
                                                    alt={`Thumbnail ${idx + 1}`}
                                                    fill
                                                    className={styles.modalThumbImg}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Room & Hotel Facilities */}
                            <div className={styles.modalInfoCol}>
                                {/* Fasilitas Kamar */}
                                <div className={styles.modalSection}>
                                    <h4 className={styles.modalSectionTitle}>{t("roomAmenities")}</h4>
                                    <div className={styles.modalFacilityGrid}>
                                        {(previewRoom.amenities && previewRoom.amenities.length > 0
                                            ? previewRoom.amenities
                                            : ["Bathroom", "TV", "Towel", "AC", "WiFi Gratis", "Air Mineral"]
                                        ).map((amenity, idx) => (
                                            <div key={idx} className={styles.facilityPill}>
                                                {getFacilityIcon(amenity, 13, styles.facilityIcon)}
                                                <span>{amenity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Fasilitas Hotel */}
                                <div className={styles.modalSection}>
                                    <h4 className={styles.modalSectionTitle}>{t("hotelFacilities")}</h4>
                                    <div className={styles.modalFacilityGrid}>
                                        {(engineData?.hotelFacilities && engineData.hotelFacilities.length > 0
                                            ? engineData.hotelFacilities
                                            : ["WiFi Gratis", "Front Desk 24 Jam", "Parkir Area", "AC", "Restoran"]
                                        ).map((facility, idx) => (
                                            <div key={idx} className={styles.facilityPill}>
                                                {getFacilityIcon(facility, 13, styles.facilityIcon)}
                                                <span>{facility}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Spesifikasi Ruangan */}
                                <div className={styles.modalSection}>
                                    <h4 className={styles.modalSectionTitle}>Spesifikasi</h4>
                                    <div className={styles.modalSpecsList}>
                                        {previewRoom.roomSizeValue ? (
                                            <div className={styles.modalSpecItem}>
                                                <FaExpand size={12} />
                                                <span>{t("roomSize")}: <strong>{previewRoom.roomSizeValue} {previewRoom.roomSizeUnit || "m²"}</strong></span>
                                            </div>
                                        ) : null}
                                        {previewRoom.bedType ? (
                                            <div className={styles.modalSpecItem}>
                                                <FaBed size={12} />
                                                <span>{t("bedType")}: <strong>{previewRoom.bedType}</strong></span>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 8. iOS Smooth Language Selector Modal ── */}
            {isLangModalOpen && (
                <div className={styles.modalBackdrop} onClick={() => setIsLangModalOpen(false)}>
                    <div className={styles.selectorModalCard} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.selectorModalHeader}>
                            <h3 className={styles.selectorModalTitle}>{t("selectLanguage")}</h3>
                            <button
                                type="button"
                                onClick={() => setIsLangModalOpen(false)}
                                className={styles.modalCloseBtn}
                                aria-label="Tutup Pilihan Bahasa"
                            >
                                <FaXmark size={15} />
                            </button>
                        </div>

                        <div className={styles.selectorModalBody}>
                            <div className={styles.selectorSearchWrap}>
                                <FaMagnifyingGlass size={13} className={styles.selectorSearchIcon} />
                                <input
                                    type="text"
                                    placeholder={t("searchLanguage")}
                                    value={langSearch}
                                    onChange={(e) => setLangSearch(e.target.value)}
                                    className={styles.selectorSearchInput}
                                    autoFocus
                                />
                            </div>

                            {!langSearch && (
                                <div className={styles.selectorSectionGroup}>
                                    <h4 className={styles.selectorGroupTitle}>{t("recommended")}</h4>
                                    <div className={styles.selectorGrid4}>
                                        {recommendedLanguages.map((lang) => {
                                            const isCur = lang.code === selectedLang;
                                            return (
                                                <button
                                                    key={`rec-${lang.code}`}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedLang(lang.code);
                                                        setIsLangModalOpen(false);
                                                    }}
                                                    className={`${styles.langCardItem} ${isCur ? styles.langCardActive : ""}`}
                                                >
                                                    <span className={styles.langCardFlag}>{lang.flag}</span>
                                                    <div className={styles.langCardTextCol}>
                                                        <span className={styles.langCardName}>{lang.name}</span>
                                                        <span className={styles.langCardSub}>{lang.code}</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className={styles.selectorSectionGroup}>
                                <h4 className={styles.selectorGroupTitle}>{langSearch ? "Hasil Pencarian" : t("allLanguages")}</h4>
                                <div className={styles.selectorGrid4}>
                                    {filteredLanguages.map((lang) => {
                                        const isCur = lang.code === selectedLang;
                                        return (
                                            <button
                                                key={lang.code}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedLang(lang.code);
                                                    setIsLangModalOpen(false);
                                                }}
                                                className={`${styles.langCardItem} ${isCur ? styles.langCardActive : ""}`}
                                            >
                                                <span className={styles.langCardFlag}>{lang.flag}</span>
                                                <div className={styles.langCardTextCol}>
                                                    <span className={styles.langCardName}>{lang.name}</span>
                                                    <span className={styles.langCardSub}>{lang.englishName} ({lang.code})</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 9. iOS Smooth Currency Selector Modal ── */}
            {isCurrencyModalOpen && (
                <div className={styles.modalBackdrop} onClick={() => setIsCurrencyModalOpen(false)}>
                    <div className={styles.selectorModalCard} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.selectorModalHeader}>
                            <h3 className={styles.selectorModalTitle}>{t("selectCurrency")}</h3>
                            <button
                                type="button"
                                onClick={() => setIsCurrencyModalOpen(false)}
                                className={styles.modalCloseBtn}
                                aria-label="Tutup Pilihan Mata Uang"
                            >
                                <FaXmark size={15} />
                            </button>
                        </div>

                        <div className={styles.selectorModalBody}>
                            <div className={styles.selectorSearchWrap}>
                                <FaMagnifyingGlass size={13} className={styles.selectorSearchIcon} />
                                <input
                                    type="text"
                                    placeholder={t("searchCurrency")}
                                    value={currencySearch}
                                    onChange={(e) => setCurrencySearch(e.target.value)}
                                    className={styles.selectorSearchInput}
                                    autoFocus
                                />
                            </div>

                            <div className={styles.selectorSectionGroup}>
                                <div className={styles.selectorGrid4}>
                                    {filteredCurrencies.map((cur) => {
                                        const isCur = cur.code === selectedCurrency;
                                        return (
                                            <button
                                                key={cur.code}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedCurrency(cur.code);
                                                    setIsCurrencyModalOpen(false);
                                                }}
                                                className={`${styles.currencyCardItem} ${isCur ? styles.currencyCardActive : ""}`}
                                            >
                                                <span className={styles.currencyCardTop}>{cur.code}</span>
                                                <span className={styles.currencyCardSub}>
                                                    {cur.symbol} • {cur.name}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 7. Mobile Floating Bottom Bar ── */}
            {step < 3 && (
                <div className={styles.mobileStickyBar}>
                    <div className={styles.mobileStickyInner}>
                        <div className={styles.mobilePriceWrap}>
                            <span className={styles.mobilePriceLabel}>Total ({nights} {nights > 1 ? t("nights") : t("night")})</span>
                            <span className={styles.mobilePriceValue}>{formatMoney(pricing.grandTotal)}</span>
                        </div>

                        {step === 1 ? (
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                disabled={pricing.items.length === 0}
                                className={styles.btnProceed}
                                style={{ width: "auto", padding: "10px 20px", marginTop: 0 }}
                            >
                                <span>{t("continueToGuestInfo")} ({pricing.totalRooms} Kamar)</span>
                                <FaChevronRight size={13} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleConfirmBooking}
                                disabled={isSubmitting}
                                className={styles.btnProceed}
                                style={{ width: "auto", padding: "10px 20px", marginTop: 0 }}
                            >
                                <FaLock size={13} />
                                <span>{isSubmitting ? t("processing") : t("confirmBooking")}</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ── 10. iOS Smooth Custom Alert Modal ── */}
            {alertData.isOpen && (
                <div className={styles.modalBackdrop} onClick={closeAlert}>
                    <div className={styles.alertModalCard} onClick={(e) => e.stopPropagation()}>
                        <div className={`${styles.alertIconWrap} ${
                            alertData.type === "error"
                                ? styles.alertIconError
                                : alertData.type === "success"
                                ? styles.alertIconSuccess
                                : alertData.type === "warning"
                                ? styles.alertIconWarning
                                : styles.alertIconInfo
                        }`}>
                            {alertData.type === "error" && <FaCircleExclamation size={24} />}
                            {alertData.type === "success" && <FaCircleCheck size={24} />}
                            {alertData.type === "warning" && <FaTriangleExclamation size={24} />}
                            {alertData.type === "info" && <FaCircleInfo size={24} />}
                        </div>

                        <h3 className={styles.alertTitle}>
                            {alertData.title || (alertData.type === "error" ? "Pemberitahuan" : alertData.type === "success" ? "Berhasil" : "Informasi")}
                        </h3>

                        <p className={styles.alertMessage}>
                            {alertData.message}
                        </p>

                        <button
                            type="button"
                            onClick={closeAlert}
                            className={styles.alertBtnOk}
                            autoFocus
                        >
                            Mengerti
                        </button>
                    </div>
                </div>
            )}

            {/* ── 11. iOS Smooth Kebijakan Privasi Modal ── */}
            {showPrivacyModal && (
                <div className={styles.modalBackdrop} onClick={() => setShowPrivacyModal(false)}>
                    <div className={styles.policyModalCard} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.policyModalHeader}>
                            <h3 className={styles.policyModalHeaderTitle}>
                                <FaShieldHalved size={16} color="var(--theme-primary, #6D2B35)" />
                                <span>Kebijakan Privasi Tamu</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowPrivacyModal(false)}
                                className={styles.modalCloseBtn}
                                aria-label="Tutup Kebijakan Privasi"
                            >
                                <FaXmark size={14} />
                            </button>
                        </div>
                        <div className={styles.policyModalBody}>
                            <div className={styles.policySection}>
                                <h4 className={styles.policySectionTitle}>1. Pengumpulan Informasi Pribadi</h4>
                                <p>
                                    Kami mengumpulkan data yang Anda berikan saat reservasi kamar, mencakup nama lengkap, alamat email, nomor telepon/WhatsApp, alamat tempat tinggal, serta detail permintaan khusus masa menginap Anda.
                                </p>
                            </div>
                            <div className={styles.policySection}>
                                <h4 className={styles.policySectionTitle}>2. Tujuan Penggunaan Data</h4>
                                <p>
                                    Data tamu digunakan secara eksklusif untuk administrasi pemesanan kamar resmi, konfirmasi reservasi langsung, integrasi sistem Front Desk (PMS) hotel, serta pengiriman e-voucher dan bukti reservasi.
                                </p>
                            </div>
                            <div className={styles.policySection}>
                                <h4 className={styles.policySectionTitle}>3. Keamanan & Kerahasiaan Data</h4>
                                <p>
                                    Informasi pribadi Anda dilindungi dengan enkripsi berstandar industri. Kami tidak pernah menjual, menyewakan, atau memberikan data pribadi Anda kepada pihak ketiga manapun untuk kepentingan pemasaran tidak resmi.
                                </p>
                            </div>
                            <div className={styles.policySection}>
                                <h4 className={styles.policySectionTitle}>4. Pembayaran Online Terenkripsi</h4>
                                <p>
                                    Seluruh transaksi pembayaran diproses langsung melalui gerbang pembayaran Payment Gateway resmi (Midtrans / Xendit) yang berlisensi Bank Indonesia dan bersertifikasi PCI-DSS Level 1 demi keamanan finansial maksimal.
                                </p>
                            </div>
                        </div>
                        <div className={styles.policyModalFooter}>
                            <button
                                type="button"
                                onClick={() => setShowPrivacyModal(false)}
                                className={styles.alertBtnOk}
                                style={{ width: "auto", padding: "10px 24px" }}
                            >
                                Saya Mengerti & Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 12. iOS Smooth Syarat & Ketentuan Modal ── */}
            {showTermsModal && (
                <div className={styles.modalBackdrop} onClick={() => setShowTermsModal(false)}>
                    <div className={styles.policyModalCard} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.policyModalHeader}>
                            <h3 className={styles.policyModalHeaderTitle}>
                                <FaCircleCheck size={16} color="var(--theme-primary, #6D2B35)" />
                                <span>Syarat & Ketentuan Pemesanan</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowTermsModal(false)}
                                className={styles.modalCloseBtn}
                                aria-label="Tutup Syarat & Ketentuan"
                            >
                                <FaXmark size={14} />
                            </button>
                        </div>
                        <div className={styles.policyModalBody}>
                            <div className={styles.policySection}>
                                <h4 className={styles.policySectionTitle}>1. Waktu Check-In & Check-Out</h4>
                                <p>
                                    • Waktu <strong>Check-In</strong> standar dimulai pukul <strong>14:00 WIB</strong>.<br />
                                    • Waktu <strong>Check-Out</strong> maksimal pukul <strong>12:00 WIB</strong>.<br />
                                    • Permintaan <em>early check-in</em> atau <em>late check-out</em> bergantung pada ketersediaan kamar dan dapat dikenakan biaya tambahan sesuai kebijakan hotel.
                                </p>
                            </div>
                            <div className={styles.policySection}>
                                <h4 className={styles.policySectionTitle}>2. Identitas Tamu & Usia Minimum</h4>
                                <p>
                                    Tamu wajib menunjukkan kartu identitas resmi berfoto yang masih berlaku (KTP / Paspor / SIM) saat proses registrasi check-in di Front Desk. Tamu utama pemegang reservasi wajib berusia minimal 18 tahun.
                                </p>
                            </div>
                            <div className={styles.policySection}>
                                <h4 className={styles.policySectionTitle}>3. Kebijakan Pembatalan & Perubahan</h4>
                                <p>
                                    Ketentuan pembatalan, modifikasi tanggal, atau refund mengikuti aturan Rate Plan kamar yang Anda pilih saat pemesanan. Untuk paket promosi atau tarif <em>Non-Refundable</em>, biaya tidak dapat dikembalikan jika terjadi pembatalan atau no-show.
                                </p>
                            </div>
                            <div className={styles.policySection}>
                                <h4 className={styles.policySectionTitle}>4. Aturan Properti & Kenyamanan</h4>
                                <p>
                                    • Dilarang merokok di dalam kamar bertipe Bebas Asap Rokok (<em>Non-Smoking Room</em>). Denda pembersihan akan dikenakan jika melanggar.<br />
                                    • Tidak diperkenankan membawa hewan peliharaan, senjata tajam, atau barang terlarang.<br />
                                    • Segala bentuk kerusakan pada properti atau fasilitas hotel selama masa menginap menjadi tanggung jawab tamu.
                                </p>
                            </div>
                        </div>
                        <div className={styles.policyModalFooter}>
                            <button
                                type="button"
                                onClick={() => {
                                    setHasAgreedTerms(true);
                                    setShowTermsModal(false);
                                }}
                                className={styles.alertBtnOk}
                                style={{ width: "auto", padding: "10px 24px" }}
                            >
                                Saya Mengerti & Setuju
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 13. Cancellation Policy Detail Modal ── */}
            {activePolicyModal && (
                <div className={styles.modalBackdrop} onClick={() => setActivePolicyModal(null)}>
                    <div className={styles.policyModalCard} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.policyModalHeader}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {activePolicyModal.type === "free_cancellation" ? (
                                    <FaCircleCheck size={18} color="#10b981" />
                                ) : (
                                    <FaCircleExclamation size={18} color="#ef4444" />
                                )}
                                <h3 className={styles.policyModalHeaderTitle}>
                                    {activePolicyModal.title}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActivePolicyModal(null)}
                                className={styles.modalCloseBtn}
                                aria-label="Tutup Kebijakan Pembatalan"
                            >
                                <FaXmark size={14} />
                            </button>
                        </div>
                        <div className={styles.policyModalBody}>
                            <div className={styles.policySection}>
                                <h4 className={styles.policySectionTitle}>Ketentuan & Batas Waktu</h4>
                                <p>{activePolicyModal.description}</p>
                            </div>
                            <div className={styles.policySection}>
                                <h4 className={styles.policySectionTitle}>Prosedur Pembatalan</h4>
                                <p>
                                    {activePolicyModal.type === "free_cancellation"
                                        ? "Untuk mengajukan pembatalan atau perubahan tanggal, silakan hubungi layanan pelanggan hotel resmi kami melalui nomor telepon/WhatsApp yang tertera pada e-voucher sebelum batas waktu berlaku."
                                        : "Tarif ini dirancang khusus dengan harga terbaik resmi hotel sehingga pembayaran bersifat final dan tidak dapat di-refund atau dialihkan ke tanggal lain."}
                                </p>
                            </div>
                        </div>
                        <div className={styles.policyModalFooter}>
                            <button
                                type="button"
                                onClick={() => setActivePolicyModal(null)}
                                className={styles.alertBtnOk}
                                style={{ width: "auto", padding: "10px 24px" }}
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

