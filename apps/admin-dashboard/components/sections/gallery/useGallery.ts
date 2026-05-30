import { useState, useEffect } from "react";
import {
    collection,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    updateDoc,
    writeBatch
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { toast } from "sonner";

export interface GalleryItem {
    id: string;
    url: string;
    order: number;
    storagePath: string;
    category?: string;
}

export const useGallery = () => {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newUrl, setNewUrl] = useState("");
    const [lastPath, setLastPath] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "gallery"), orderBy("order", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as GalleryItem[];
            setItems(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUrl || !lastPath) return;

        setSaving(true);
        try {
            // Find highest order to add at the end
            const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order)) : -1;

            await addDoc(collection(db, "gallery"), {
                url: newUrl,
                storagePath: lastPath,
                order: maxOrder + 1,
                category: "Sanctuary", // Default
                createdAt: new Date().toISOString()
            });
            setNewUrl("");
            setLastPath("");
        } catch (err) {
            console.error("Error adding to gallery:", err);
            toast.error("Failed to add image to the collection.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (item: GalleryItem) => {
        toast("Permanently remove this masterpiece?", {
            action: {
                label: "Delete",
                onClick: async () => {
                    try {
                        // Delete from Storage first
                        if (item.storagePath) {
                            const storageRef = ref(storage, item.storagePath);
                            await deleteObject(storageRef).catch(err => {
                                console.warn("Storage deletion failed or file already gone:", err);
                            });
                        }

                        // Delete from Firestore
                        await deleteDoc(doc(db, "gallery", item.id));
                        toast.success("Masterpiece removed successfully.");
                    } catch (err) {
                        console.error("Error deleting gallery image:", err);
                        toast.error("Failed to delete image.");
                    }
                },
            },
            cancel: {
                label: "Keep It",
                onClick: () => { },
            }
        });
    };

    const updateItemsOrder = async (newItems: GalleryItem[]) => {
        setItems(newItems); // Optimistic update

        try {
            const batch = writeBatch(db);
            newItems.forEach((item, index) => {
                const docRef = doc(db, "gallery", item.id);
                batch.update(docRef, { order: index });
            });
            await batch.commit();
        } catch (err) {
            console.error("Error updating gallery order:", err);
            toast.error("Failed to save new order.");
        }
    };

    const updateItemCategory = async (id: string, category: string) => {
        try {
            const docRef = doc(db, "gallery", id);
            await updateDoc(docRef, { category });
            toast.success("Category updated.");
        } catch (err) {
            console.error("Error updating category:", err);
            toast.error("Failed to update category.");
        }
    };

    const handleBatchAdd = async (uploads: { url: string; storagePath: string }[], category: string = "Sanctuary") => {
        if (uploads.length === 0) return;

        setSaving(true);
        try {
            const batch = writeBatch(db);
            const currentMaxOrder = items.length > 0 ? Math.max(...items.map(i => i.order)) : -1;

            uploads.forEach((upload, index) => {
                const newDocRef = doc(collection(db, "gallery"));
                batch.set(newDocRef, {
                    url: upload.url,
                    storagePath: upload.storagePath,
                    order: currentMaxOrder + 1 + index,
                    category: category,
                    createdAt: new Date().toISOString()
                });
            });

            await batch.commit();
        } catch (err) {
            console.error("Error batch adding to gallery:", err);
            toast.error("Failed to add some images to the gallery.");
        } finally {
            setSaving(false);
        }
    };

    return {
        items,
        loading,
        newUrl,
        setNewUrl,
        setLastPath,
        saving,
        handleAdd,
        handleBatchAdd,
        handleDelete,
        updateItemsOrder,
        updateItemCategory
    };
};
