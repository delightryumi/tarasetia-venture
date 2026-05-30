"use client";

import React, { useCallback, useState } from "react";
import { Upload, X, Loader2, CheckCircle2 } from "lucide-react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import "./upload.css";

const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1920;
                const MAX_HEIGHT = 1080;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file);
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFile = new File([blob], file.name, {
                            type: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(newFile);
                    } else {
                        resolve(file);
                    }
                }, file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.82);
            };
            img.onerror = () => resolve(file); // fallback to original on error
        };
        reader.onerror = () => resolve(file); // fallback to original on error
    });
};

interface MultiImageUploadProps {
    onUploadsComplete: (results: { url: string; storagePath: string }[]) => void;
    basePath: string; // e.g., "gallery"
}

interface UploadQueueItem {
    id: string;
    file: File;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    url?: string;
    path?: string;
}

export const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
    onUploadsComplete,
    basePath
}) => {
    const [dragActive, setDragActive] = useState(false);
    const [queue, setQueue] = useState<UploadQueueItem[]>([]);

    const startUpload = useCallback(async (item: UploadQueueItem) => {
        try {
            // Compress the image before uploading
            const compressedFile = await compressImage(item.file);

            const filePath = `${basePath}/${Date.now()}-${item.id}.jpg`;
            const storageRef = ref(storage, filePath);
            const uploadTask = uploadBytesResumable(storageRef, compressedFile);

            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress } : q));
                },
                (error) => {
                    console.error("Upload error:", error);
                    setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error' } : q));
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                    setQueue(prev => prev.map(q => q.id === item.id ? {
                        ...q,
                        status: 'completed' as const,
                        url: downloadURL,
                        path: filePath
                    } : q));
                }
            );
        } catch (error) {
            console.error("Compression/Upload setup error:", error);
            setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error' } : q));
        }
    }, [basePath]);

    // Notify parent when ALL uploads in the current queue are finished
    const notifiedRef = React.useRef(false);

    React.useEffect(() => {
        const uploadingItems = queue.filter(q => q.status === 'uploading');
        const completedItems = queue.filter(q => q.status === 'completed');

        // If we have items, none are still uploading, and we haven't notified for this specific queue state
        if (queue.length > 0 && uploadingItems.length === 0 && !notifiedRef.current) {
            if (completedItems.length > 0) {
                onUploadsComplete(completedItems.map(i => ({ url: i.url!, storagePath: i.path! })));
                notifiedRef.current = true;
            }
        } else if (uploadingItems.length > 0) {
            // Reset notification flag if new items start uploading
            notifiedRef.current = false;
        }
    }, [queue, onUploadsComplete]);

    const handleFiles = (files: FileList) => {
        const newItems: UploadQueueItem[] = Array.from(files)
            .filter(file => file.type.startsWith("image/"))
            .map(file => ({
                id: Math.random().toString(36).substring(7),
                file,
                progress: 0,
                status: 'uploading'
            }));

        setQueue(prev => [...prev, ...newItems]);
        newItems.forEach(startUpload);
    };

    const onDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const removeItem = (id: string) => {
        setQueue(prev => prev.filter(q => q.id !== id));
    };

    return (
        <div className="space-y-4">
            <label
                className={`upload-dropzone ${dragActive ? "dragging" : ""} min-h-[140px]`}
                onDragEnter={onDrag}
                onDragLeave={onDrag}
                onDragOver={onDrag}
                onDrop={onDrop}
            >
                <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={onFileChange}
                />
                <div className="upload-icon">
                    <Upload size={32} />
                </div>
                <span className="upload-text">Upload Multiple Photos</span>
                <span className="upload-subtext text-[10px] opacity-60">Selection will upload automatically</span>
            </label>

            {queue.length > 0 && (
                <div className="space-y-2 mt-4">
                    {queue.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-white/50 border border-gray-100 rounded-xl">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                <img
                                    src={URL.createObjectURL(item.file)}
                                    className="w-full h-full object-cover"
                                    onLoad={(e) => URL.revokeObjectURL((e.target as any).src)}
                                    alt="Preview"
                                />
                            </div>
                            <div className="flex-grow min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold text-gray-700 truncate">{item.file.name}</span>
                                    {item.status === 'completed' && <CheckCircle2 size={14} className="text-sage" />}
                                    {item.status === 'error' && <X size={14} className="text-peach-dark" />}
                                </div>
                                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-300 ${item.status === 'error' ? 'bg-peach-dark' : 'bg-sage'}`}
                                        style={{ width: `${item.progress}%` }}
                                    />
                                </div>
                            </div>
                            {item.status === 'error' && (
                                <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-peach-dark">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
