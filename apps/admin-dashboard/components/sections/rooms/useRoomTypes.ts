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
import { getHotelCollection } from "@/lib/firestoreHelper";

export interface RoomImage {
    url: string;
    isProfile: boolean;
}

export interface BedConfig {
    type: string;
    quantity: number;
    size: string;
}

export interface PhysicalRoom {
    id: string;
    number: string;
    name?: string;
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
    physicalRooms?: Array<PhysicalRoom | string>;
    createdAt?: string;
    updatedAt?: string;
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
    const [newPhysicalRooms, setNewPhysicalRooms] = useState<PhysicalRoom[]>([]);

    const [saving, setSaving] = useState(false);
    const [editingRoom, setEditingRoom] = useState<RoomType | null>(null);
    const [view, setView] = useState<'list' | 'stepper'>('list');
    const [currentStep, setCurrentStep] = useState(1);

    useEffect(() => {
        const q = query(getHotelCollection(db, "roomTypes"), orderBy("name"));
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
            // Keep roomCount consistent with physicalRooms if set
            const finalRoomCount = newPhysicalRooms.length > 0 ? Math.max(newRoomCount, newPhysicalRooms.length) : newRoomCount;

            await addDoc(getHotelCollection(db, "roomTypes"), {
                name: newName,
                description: newDesc,
                images: newImages,
                amenities: newAmenities,
                bookingUrl: newBookingUrl,
                beds: newBeds,
                capacity: newCapacity,
                roomSizeValue: newRoomSizeValue,
                roomSizeUnit: newRoomSizeUnit,
                roomCount: finalRoomCount,
                physicalRooms: newPhysicalRooms,
                createdAt: new Date().toISOString()
            });
            resetForm();
            setView('list');
            setCurrentStep(1);
            toast.success("Room category created successfully");
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
            const finalRoomCount = newPhysicalRooms.length > 0 ? Math.max(newRoomCount, newPhysicalRooms.length) : newRoomCount;

            const roomRef = doc(getHotelCollection(db, "roomTypes"), editingRoom.id);
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
                roomCount: finalRoomCount,
                physicalRooms: newPhysicalRooms,
                updatedAt: new Date().toISOString()
            });
            resetForm();
            setEditingRoom(null);
            setView('list');
            setCurrentStep(1);
            toast.success("Room category updated successfully");
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
        setNewPhysicalRooms([]);
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

        // Normalize physicalRooms
        const loadedRooms: PhysicalRoom[] = (room.physicalRooms || []).map((r, idx) => {
            if (typeof r === "string") {
                return { id: `pr-${idx}-${Date.now()}`, number: r.trim(), name: `Room ${r.trim()}` };
            }
            return {
                id: r.id || `pr-${idx}-${Date.now()}`,
                number: r.number || "",
                name: r.name || `Room ${r.number || ""}`
            };
        }).filter(r => r.number.trim() !== "");

        setNewPhysicalRooms(loadedRooms);

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

    const addPhysicalRoom = (rawNumber: string) => {
        const trimmed = rawNumber.trim();
        if (!trimmed) return;

        // Check if user entered range e.g. "101-105" or "101 - 105"
        const rangeMatch = trimmed.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
        if (rangeMatch) {
            const start = parseInt(rangeMatch[1]);
            const end = parseInt(rangeMatch[2]);
            if (start <= end && end - start <= 100) {
                const newAdditions: PhysicalRoom[] = [];
                const existingNumbers = new Set(newPhysicalRooms.map(r => r.number.toUpperCase()));
                
                for (let n = start; n <= end; n++) {
                    const numStr = n.toString();
                    if (!existingNumbers.has(numStr.toUpperCase())) {
                        existingNumbers.add(numStr.toUpperCase());
                        newAdditions.push({
                            id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                            number: numStr,
                            name: `Room ${numStr}`
                        });
                    }
                }
                
                if (newAdditions.length > 0) {
                    const combined = [...newPhysicalRooms, ...newAdditions];
                    setNewPhysicalRooms(combined);
                    setNewRoomCount(Math.max(newRoomCount, combined.length));
                    toast.success(`Added ${newAdditions.length} rooms (${start} - ${end})`);
                }
                return;
            }
        }

        // Check if comma or space separated list e.g. "101, 102, 103"
        if (trimmed.includes(",") || trimmed.includes(" ")) {
            const tokens = trimmed.split(/[\s,]+/).map(t => t.trim()).filter(Boolean);
            const newAdditions: PhysicalRoom[] = [];
            const existingNumbers = new Set(newPhysicalRooms.map(r => r.number.toUpperCase()));

            tokens.forEach(tok => {
                if (!existingNumbers.has(tok.toUpperCase())) {
                    existingNumbers.add(tok.toUpperCase());
                    newAdditions.push({
                        id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                        number: tok,
                        name: `Room ${tok}`
                    });
                }
            });

            if (newAdditions.length > 0) {
                const combined = [...newPhysicalRooms, ...newAdditions];
                setNewPhysicalRooms(combined);
                setNewRoomCount(Math.max(newRoomCount, combined.length));
                toast.success(`Added ${newAdditions.length} rooms`);
            }
            return;
        }

        // Single room number
        const exists = newPhysicalRooms.some(r => r.number.toUpperCase() === trimmed.toUpperCase());
        if (exists) {
            toast.error(`Room number ${trimmed} already exists in this category`);
            return;
        }

        const newRoomObj: PhysicalRoom = {
            id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            number: trimmed,
            name: `Room ${trimmed}`
        };

        const combined = [...newPhysicalRooms, newRoomObj];
        setNewPhysicalRooms(combined);
        setNewRoomCount(Math.max(newRoomCount, combined.length));
    };

    const removePhysicalRoom = (index: number) => {
        const updated = newPhysicalRooms.filter((_, i) => i !== index);
        setNewPhysicalRooms(updated);
        if (updated.length > 0 && newRoomCount > updated.length) {
            setNewRoomCount(updated.length);
        }
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

                        await deleteDoc(doc(getHotelCollection(db, "roomTypes"), id));
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
        newPhysicalRooms,
        setNewPhysicalRooms,
        addPhysicalRoom,
        removePhysicalRoom,
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
