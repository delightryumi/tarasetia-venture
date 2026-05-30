import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export const useAboutUs = () => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchAbout = async () => {
            try {
                const docRef = doc(db, "sections", "about");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setTitle(data.title || "");
                    setContent(data.content || "");
                    setImageUrl(data.imageUrl || "");
                }
            } catch (err) {
                console.error("Error fetching about us:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAbout();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage("");
        try {
            await setDoc(doc(db, "sections", "about"), {
                title,
                content,
                imageUrl,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            toast.success("About Us section saved!");
        } catch (err) {
            console.error("Error saving about us:", err);
            toast.error("Failed to save About Us updates.");
        } finally {
            setSaving(false);
        }
    };

    return {
        title,
        setTitle,
        content,
        setContent,
        imageUrl,
        setImageUrl,
        loading,
        saving,
        message,
        handleSave,
    };
};
