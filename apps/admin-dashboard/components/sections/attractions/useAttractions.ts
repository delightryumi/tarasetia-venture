import { useState, useEffect } from "react";
import {
    collection,
    onSnapshot,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
    query,
    orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export interface Attraction {
    id: string;
    name: string;
    description: string;
    distance: string;
    imageUrl?: string;
    images?: { url: string; isProfile?: boolean }[];
}

export const useAttractions = () => {
    const [attractions, setAttractions] = useState<Attraction[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newDistance, setNewDistance] = useState("");
    const [newImages, setNewImages] = useState<{ url: string, isProfile?: boolean }[]>([]);
    const [saving, setSaving] = useState(false);
    const [editingAttraction, setEditingAttraction] = useState<Attraction | null>(null);
    const [view, setView] = useState<'list' | 'stepper'>('list');
    const [currentStep, setCurrentStep] = useState(1);

    useEffect(() => {
        const q = query(collection(db, "attractions"), orderBy("distance"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Attraction[];
            setAttractions(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const resetForm = () => {
        setNewName("");
        setNewDesc("");
        setNewDistance("");
        setNewImages([]);
    };

    const handleAdd = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newName) return;

        setSaving(true);
        try {
            await addDoc(collection(db, "attractions"), {
                name: newName,
                description: newDesc,
                distance: newDistance,
                images: newImages,
                createdAt: new Date().toISOString()
            });
            resetForm();
            setView('list');
            setCurrentStep(1);
            toast.success(`${newName} added to local attractions.`);
        } catch (err) {
            console.error("Error adding attraction:", err);
            toast.error("Failed to add attraction.");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!editingAttraction || !newName) return;

        setSaving(true);
        try {
            const attrRef = doc(db, "attractions", editingAttraction.id);
            await updateDoc(attrRef, {
                name: newName,
                description: newDesc,
                distance: newDistance,
                images: newImages,
                updatedAt: new Date().toISOString()
            });
            resetForm();
            setEditingAttraction(null);
            setView('list');
            setCurrentStep(1);
            toast.success(`Atmosphere for ${newName} has been refined.`);
        } catch (err) {
            console.error("Error updating attraction:", err);
            toast.error("Failed to update attraction settings.");
        } finally {
            setSaving(false);
        }
    };

    const startEditing = (attr: Attraction) => {
        setEditingAttraction(attr);
        setNewName(attr.name);
        setNewDesc(attr.description || "");
        setNewDistance(attr.distance || "");
        setNewImages(attr.images || (attr.imageUrl ? [{ url: attr.imageUrl, isProfile: true }] : []));
        setView('stepper');
        setCurrentStep(1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const cancelEditing = () => {
        setEditingAttraction(null);
        resetForm();
        setView('list');
        setCurrentStep(1);
    };

    const handleDelete = async (id: string) => {
        const attraction = attractions.find(a => a.id === id);
        if (!attraction) return;

        toast(`Remove ${attraction.name}?`, {
            description: "This will permanently remove the destination from your local reach.",
            action: {
                label: "Remove",
                onClick: async () => {
                    try {
                        await deleteDoc(doc(db, "attractions", id));
                        toast.success(`${attraction.name} removed from attractions.`);
                    } catch (err) {
                        console.error("Error deleting attraction:", err);
                        toast.error("Failed to remove attraction.");
                    }
                }
            },
            cancel: { label: "Keep" }
        });
    };

    return {
        attractions,
        loading,
        newName,
        setNewName,
        newDesc,
        setNewDesc,
        newDistance,
        setNewDistance,
        newImages,
        setNewImages,
        saving,
        editingAttraction,
        handleAdd,
        handleUpdate,
        handleDelete,
        startEditing,
        cancelEditing,
        view,
        setView,
        currentStep,
        setCurrentStep,
    };
};
