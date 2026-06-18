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
            await loginWithFirestore(email, password, hotelCode);
        } catch (err: any) {
            console.error(err);
            setError(
                err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.message === "Invalid Hotel Code"
                    ? "Email, Password, atau Partner Code salah."
                    : "Gagal login. Silakan coba lagi."
            );
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
