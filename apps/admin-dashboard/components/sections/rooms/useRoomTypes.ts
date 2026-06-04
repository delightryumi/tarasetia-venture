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
import { db, storage } from "@/lib/firebase";
import { ref, deleteObject } from "firebase/storage";
import { toast } from "sonner";

export interface RoomImage {
    url: string;
    isProfile: boolean;
}

export interface BedConfig {
    type: string;
    quantity: number;
    size: string;
}

export interface RoomType {
    id: string;
    name: string;
    description: string;
    images: RoomImage[];
    amenities: string[];
    bookingUrl: string;
    bedType?: string; // Legacy
    beds?: BedConfig[];
    capacity?: number;
    roomSize?: string; // Legacy
    roomSizeValue?: number;
    roomSizeUnit?: string;
    roomCount?: number;
    createdAt?: string;
}

export const useRoomTypes = () => {
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newImages, setNewImages] = useState<RoomImage[]>([]);
    const [newAmenities, setNewAmenities] = useState<string[]>([]);
    const [newBookingUrl, setNewBookingUrl] = useState("");
    
    // Detailed Room Info
    const [newBeds, setNewBeds] = useState<BedConfig[]>([]);
    const [newCapacity, setNewCapacity] = useState<number>(2);
    const [newRoomSizeValue, setNewRoomSizeValue] = useState<number>(0);
    const [newRoomSizeUnit, setNewRoomSizeUnit] = useState<string>("m2");
    const [newRoomCount, setNewRoomCount] = useState<number>(1);

    const [saving, setSaving] = useState(false);
    const [editingRoom, setEditingRoom] = useState<RoomType | null>(null);
    const [view, setView] = useState<'list' | 'stepper'>('list');
    const [currentStep, setCurrentStep] = useState(1);

    useEffect(() => {
        const q = query(collection(db, "roomTypes"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const types = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as RoomType[];
            setRoomTypes(types);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName) return;

        setSaving(true);
        try {
            await addDoc(collection(db, "roomTypes"), {
                name: newName,
                description: newDesc,
                images: newImages,
                amenities: newAmenities,
                bookingUrl: newBookingUrl,
                beds: newBeds,
                capacity: newCapacity,
                roomSizeValue: newRoomSizeValue,
                roomSizeUnit: newRoomSizeUnit,
                roomCount: newRoomCount,
                createdAt: new Date().toISOString()
            });
            resetForm();
            setView('list');
            setCurrentStep(1);
        } catch (err) {
            console.error("Error adding room type:", err);
            toast.error("Failed to add room type. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRoom || !newName) return;

        setSaving(true);
        try {
            const roomRef = doc(db, "roomTypes", editingRoom.id);
            await updateDoc(roomRef, {
                name: newName,
                description: newDesc,
                images: newImages,
                amenities: newAmenities,
                bookingUrl: newBookingUrl,
                beds: newBeds,
                capacity: newCapacity,
                roomSizeValue: newRoomSizeValue,
                roomSizeUnit: newRoomSizeUnit,
                roomCount: newRoomCount,
                updatedAt: new Date().toISOString()
            });
            resetForm();
            setEditingRoom(null);
            setView('list');
            setCurrentStep(1);
        } catch (err) {
            console.error("Error updating room type:", err);
            toast.error("Failed to update room type settings.");
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setNewName("");
        setNewDesc("");
        setNewImages([]);
        setNewAmenities([]);
        setNewBookingUrl("");
        setNewBeds([]);
        setNewCapacity(2);
        setNewRoomSizeValue(0);
        setNewRoomSizeUnit("m2");
        setNewRoomCount(1);
    };

    const startEditing = (room: RoomType) => {
        setEditingRoom(room);
        setNewName(room.name);
        setNewDesc(room.description);
        setNewImages(room.images || []);
        setNewAmenities(room.amenities || []);
        setNewBookingUrl(room.bookingUrl || "");
        
        // Populate new fields with migration support
        setNewBeds(room.beds || []);
        setNewCapacity(room.capacity || 2);
        setNewRoomSizeValue(room.roomSizeValue || 0);
        setNewRoomSizeUnit(room.roomSizeUnit || "m2");
        setNewRoomCount(room.roomCount || 1);

        setView('stepper');
        setCurrentStep(1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const cancelEditing = () => {
        setEditingRoom(null);
        resetForm();
        setView('list');
        setCurrentStep(1);
    };

    const handleDelete = async (id: string) => {
        const room = roomTypes.find(r => r.id === id);
        if (!room) return;

        toast(`Delete ${room.name}?`, {
            description: "This will permanently remove the room and all its media.",
            action: {
                label: "Delete",
                onClick: async () => {
                    try {
                        // Delete all images from storage first
                        if (room.images && room.images.length > 0) {
                            await Promise.all(room.images.map(async (img) => {
                                try {
                                    const decodedUrl = decodeURIComponent(img.url);
                                    const pathPart = decodedUrl.split('/o/')[1]?.split('?')[0];
                                    if (pathPart) {
                                        const storageRef = ref(storage, pathPart);
                                        await deleteObject(storageRef);
                                    }
                                } catch (e) {
                                    console.warn("Storage deletion error:", e);
                                }
                            }));
                        }

                        await deleteDoc(doc(db, "roomTypes", id));
                        toast.success(`${room.name} has been decommissioned.`);
                    } catch (err) {
                        console.error("Error deleting room type:", err);
                        toast.error("Failed to remove room item.");
                    }
                }
            },
            cancel: { label: "Keep", onClick: () => {} }
        });
    };

    return {
        roomTypes,
        loading,
        newName,
        setNewName,
        newDesc,
        setNewDesc,
        newImages,
        setNewImages,
        newAmenities,
        setNewAmenities,
        newBookingUrl,
        setNewBookingUrl,
        newBeds,
        setNewBeds,
        newCapacity,
        setNewCapacity,
        newRoomSizeValue,
        setNewRoomSizeValue,
        newRoomSizeUnit,
        setNewRoomSizeUnit,
        newRoomCount,
        setNewRoomCount,
        saving,
        editingRoom,
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
