import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export const useLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [hotelCode, setHotelCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { loginWithFirestore } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await loginWithFirestore(email.trim().toLowerCase(), password, hotelCode.trim());
        } catch (err: any) {
            console.error(err);
            if (err.code === "auth/too-many-requests") {
                setError("Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat atau hubungi Admin.");
            } else if (
                err.code === "auth/invalid-credential" || 
                err.code === "auth/user-not-found" || 
                err.code === "auth/wrong-password" ||
                err.message === "Invalid Hotel Code"
            ) {
                setError("Email, Password, atau Partner Code salah.");
            } else {
                setError(err.message || "Gagal login. Silakan coba lagi.");
            }
        } finally {
            setLoading(false);
        }
    };

    return {
        email,
        setEmail,
        password,
        setPassword,
        hotelCode,
        setHotelCode,
        error,
        loading,
        handleLogin,
    };
};
