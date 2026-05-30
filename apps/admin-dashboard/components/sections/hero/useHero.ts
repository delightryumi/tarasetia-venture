import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { HeroSlide } from "../../../../../types/hero"; // using relative path from apps/admin-dashboard/components/sections/hero

export const useHero = () => {
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchHero = async () => {
            try {
                const docRef = doc(db, "sections", "hero");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.slides && Array.isArray(data.slides) && data.slides.length > 0) {
                        setSlides(data.slides);
                        setActiveSlideId(data.slides[0].id);
                    } else {
                        // Migration from old single-slide format or empty state
                        const initialSlide: HeroSlide = {
                            id: "slide-" + Date.now(),
                            title: data.title || "",
                            subtitle: data.subtitle || "",
                            backgroundImage: data.backgroundImage || "",
                            midgroundImage: data.midgroundImage || null,
                            foregroundImage: data.foregroundImage || null,
                            textAnimation: 'fade-up'
                        };
                        setSlides([initialSlide]);
                        setActiveSlideId(initialSlide.id);
                    }
                } else {
                    // Completely brand new setup
                    const newSlide: HeroSlide = {
                        id: "slide-" + Date.now(),
                        title: "", subtitle: "", backgroundImage: "", midgroundImage: null, foregroundImage: null, textAnimation: 'fade-up'
                    };
                    setSlides([newSlide]);
                    setActiveSlideId(newSlide.id);
                }
            } catch (err) {
                console.error("Error fetching hero:", err);
                toast.error("Failed to load slides.");
            } finally {
                setLoading(false);
            }
        };

        fetchHero();
    }, []);

    const updateActiveSlide = (updates: Partial<HeroSlide>) => {
        if (!activeSlideId) return;
        setSlides(currentSlides =>
            currentSlides.map(slide =>
                slide.id === activeSlideId ? { ...slide, ...updates } : slide
            )
        );
    };

    const addNewSlide = () => {
        const newSlide: HeroSlide = {
            id: "slide-" + Date.now(),
            title: "New Slide",
            subtitle: "Subtitle for the new slide",
            backgroundImage: "",
            midgroundImage: null,
            foregroundImage: null,
            textAnimation: 'fade-up'
        };
        setSlides([...slides, newSlide]);
        setActiveSlideId(newSlide.id); // auto select new slide
    };

    const deleteSlide = (id: string) => {
        if (slides.length <= 1) {
            toast.error("You must have at least one slide.");
            return;
        }
        const filtered = slides.filter(s => s.id !== id);
        setSlides(filtered);
        if (activeSlideId === id) {
            setActiveSlideId(filtered[0].id);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "sections", "hero"), {
                slides,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            toast.success("Hero slider updated successfully!");
        } catch (err) {
            console.error("Error saving hero:", err);
            toast.error("Failed to sync hero settings.");
        } finally {
            setSaving(false);
        }
    };

    return {
        slides,
        activeSlideId,
        setActiveSlideId,
        updateActiveSlide,
        addNewSlide,
        deleteSlide,
        loading,
        saving,
        handleSave,
    };
};
