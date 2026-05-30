import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export const useLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { loginWithFirestore } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // 1. Try custom Firestore users_master login first
            const success = await loginWithFirestore(email, password);
            if (success) {
                setLoading(false);
                return;
            }

            // 2. Fallback to Firebase Auth
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            console.error(err);
            setError(
                err.code === "auth/invalid-credential"
                    ? "Invalid email or password."
                    : "Failed to login. Please try again."
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
        error,
        loading,
        handleLogin,
    };
};
