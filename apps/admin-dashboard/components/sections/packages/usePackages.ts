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

export interface Package {
    id: string;
    name: string;
    description: string;
    price: string;
    features: string[];
    imageUrl?: string;
    packageType?: string; // MICE, Wedding, Trip, etc.
}

export const usePackages = () => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newPrice, setNewPrice] = useState("");
    const [newImage, setNewImage] = useState("");
    const [newFeature, setNewFeature] = useState("");
    const [packageType, setPackageType] = useState("Stay");
    const [customType, setCustomType] = useState("");
    const [features, setFeatures] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [editingPackage, setEditingPackage] = useState<Package | null>(null);
    const [view, setView] = useState<'list' | 'stepper'>('list');
    const [currentStep, setCurrentStep] = useState(1);

    useEffect(() => {
        const q = query(collection(db, "packages"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Package[];
            setPackages(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const resetForm = () => {
        setNewName("");
        setNewDesc("");
        setNewPrice("");
        setNewImage("");
        setNewFeature("");
        setFeatures([]);
        setPackageType("Stay");
        setCustomType("");
    };

    const addFeature = () => {
        if (!newFeature) return;
        setFeatures([...features, newFeature]);
        setNewFeature("");
    };

    const removeFeature = (index: number) => {
        setFeatures(features.filter((_, i) => i !== index));
    };

    const handleAdd = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newName) return;

        setSaving(true);
        try {
            const finalType = packageType === "Custom" ? customType : packageType;
            await addDoc(collection(db, "packages"), {
                name: newName,
                description: newDesc,
                price: newPrice,
                features: features,
                imageUrl: newImage,
                packageType: finalType,
                createdAt: new Date().toISOString()
            });
            resetForm();
            setView('list');
            setCurrentStep(1);
            toast.success(`${newName} package added.`);
        } catch (err) {
            console.error("Error adding package:", err);
            toast.error("Failed to add package.");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!editingPackage || !newName) return;

        setSaving(true);
        try {
            const finalType = packageType === "Custom" ? customType : packageType;
            const pkgRef = doc(db, "packages", editingPackage.id);
            await updateDoc(pkgRef, {
                name: newName,
                description: newDesc,
                price: newPrice,
                features: features,
                imageUrl: newImage,
                packageType: finalType,
                updatedAt: new Date().toISOString()
            });
            resetForm();
            setEditingPackage(null);
            setView('list');
            setCurrentStep(1);
            toast.success(`${newName} package refined.`);
        } catch (err) {
            console.error("Error updating package:", err);
            toast.error("Failed to refine package.");
        } finally {
            setSaving(false);
        }
    };

    const startEditing = (pkg: Package) => {
        setEditingPackage(pkg);
        setNewName(pkg.name);
        setNewDesc(pkg.description || "");
        setNewPrice(pkg.price || "");
        setNewImage(pkg.imageUrl || "");
        setFeatures(pkg.features || []);

        const presets = ["Stay", "Wedding", "MICE", "Trip"];
        if (presets.includes(pkg.packageType || "")) {
            setPackageType(pkg.packageType || "Stay");
            setCustomType("");
        } else {
            setPackageType("Custom");
            setCustomType(pkg.packageType || "");
        }

        setView('stepper');
        setCurrentStep(1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const cancelEditing = () => {
        setEditingPackage(null);
        resetForm();
        setView('list');
        setCurrentStep(1);
    };

    const handleDelete = async (id: string) => {
        const pkg = packages.find(p => p.id === id);
        if (!pkg) return;

        toast(`Delete ${pkg.name}?`, {
            description: "This will permanently remove the package.",
            action: {
                label: "Delete",
                onClick: async () => {
                    try {
                        await deleteDoc(doc(db, "packages", id));
                        toast.success(`${pkg.name} has been removed.`);
                    } catch (err) {
                        console.error("Error deleting package:", err);
                        toast.error("Failed to delete package.");
                    }
                }
            },
            cancel: { label: "Keep", onClick: () => {} }
        });
    };

    return {
        packages,
        loading,
        newName,
        setNewName,
        newDesc,
        setNewDesc,
        newPrice,
        setNewPrice,
        newImage,
        setNewImage,
        newFeature,
        setNewFeature,
        packageType,
        setPackageType,
        customType,
        setCustomType,
        features,
        addFeature,
        removeFeature,
        saving,
        editingPackage,
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
