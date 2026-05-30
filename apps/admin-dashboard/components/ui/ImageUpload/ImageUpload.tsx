"use client";

"use client";

import React, { useCallback, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { toast } from "sonner";
import "./upload.css";

interface ImageUploadProps {
    onUploadComplete: (url: string, path: string) => void;
    currentUrl?: string;
    path: string; // e.g., "hero/background.jpg"
    label?: string; // e.g., "this image"
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    onUploadComplete,
    currentUrl,
    path,
    label = "this image"
}) => {
    const [dragActive, setDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewUrl, setPreviewUrl] = useState(currentUrl || "");
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleFile = useCallback(async (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Invalid file type. Please upload an image.");
            return;
        }

        setIsUploading(true);
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (error) => {
                console.error("Upload error:", error);
                setIsUploading(false);
                toast.error("Upload failed. Please try again.");
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                setPreviewUrl(downloadURL);
                onUploadComplete(downloadURL, path);
                setIsUploading(false);
                setUploadProgress(0);
            }
        );
    }, [path, onUploadComplete]);

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
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const removeImage = async (e: React.MouseEvent) => {
        e.stopPropagation();

        toast(`Delete ${label}?`, {
            description: "This will remove the file from storage.",
            action: {
                label: "Delete",
                onClick: async () => {
                    setIsDeleting(true);
                    try {
                        const storageRef = ref(storage, path);
                        await deleteObject(storageRef);
                        setPreviewUrl("");
                        onUploadComplete("", path);
                        toast.success("Image removed.");
                    } catch (error: any) {
                        console.error("Deletion error:", error);
                        if (error.code === 'storage/object-not-found') {
                            setPreviewUrl("");
                            onUploadComplete("", path);
                        } else {
                            toast.error("Failed to delete the file.");
                        }
                    } finally {
                        setIsDeleting(false);
                    }
                }
            },
            cancel: { label: "Keep" }
        });
    };

    return (
        <div className="image-upload-container">
            {!previewUrl && !isUploading ? (
                <label
                    className={`upload-dropzone ${dragActive ? "dragging" : ""}`}
                    onDragEnter={onDrag}
                    onDragLeave={onDrag}
                    onDragOver={onDrag}
                    onDrop={onDrop}
                >
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={onFileChange}
                    />
                    <div className="upload-icon">
                        <Upload size={32} />
                    </div>
                    <span className="upload-text">Drag & drop or click to upload</span>
                    <span className="upload-subtext">PNG, JPG, WEBP (Max 5MB)</span>
                </label>
            ) : (
                <div className="preview-container">
                    {(isUploading || isDeleting) ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
                            <div className="text-sage font-bold mb-2">
                                {isUploading ? `${Math.round(uploadProgress)}%` : "Deleting..."}
                            </div>
                            <div className="w-1/2 h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${isUploading ? 'bg-peach' : 'bg-red-400'} transition-all duration-300`}
                                    style={{ width: isUploading ? `${uploadProgress}%` : "100%" }}
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <img src={previewUrl} alt="Preview" className="preview-image" />
                            <button className="remove-btn" onClick={removeImage}>
                                <X size={18} />
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
