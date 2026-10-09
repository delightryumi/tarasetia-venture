import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { setDeviceTrusted } from "@/lib/trustedDevice";
import { auth } from "@/lib/firebase";
import { signOut as fbSignOut } from "firebase/auth";

export const useLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [hotelCode, setHotelCode] = useState("");
    const [twoFactorCode, setTwoFactorCode] = useState("");
    const [requires2Fa, setRequires2Fa] = useState(false);
    const [requires2FaSetup, setRequires2FaSetup] = useState(false);
    const [trustDevice, setTrustDevice] = useState(true);
    const [setupSecret, setSetupSecret] = useState("");
    const [setupQrUrl, setSetupQrUrl] = useState("");
    const [setupRecoveryCodes, setSetupRecoveryCodes] = useState<string[]>([]);
    const [setupStep, setSetupStep] = useState<"qr" | "codes">("qr");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { loginWithFirestore } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            let resolvedEmail = email.trim().toLowerCase();
            if (resolvedEmail === "superadmin" || resolvedEmail === "admin") {
                resolvedEmail = `${resolvedEmail}@setara.co.id`;
            }

            const result = await loginWithFirestore(
                resolvedEmail, 
                password, 
                hotelCode.trim(), 
                requires2Fa ? twoFactorCode.trim() : undefined
            );

            if (result.requires2FaSetup) {
                setError("");
                await startMandatorySetup();
                return;
            }

            if (result.requires2Fa) {
                setRequires2Fa(true);
                setError("");
                return;
            }

            if (!result.success) {
                setError(result.error || "Email, Password, atau Partner Code salah.");
                return;
            }

            // If 2FA was verified and user checked 'Ingat perangkat ini', trust device for 30 days
            if (requires2Fa && trustDevice) {
                setDeviceTrusted(resolvedEmail, 30);
            }
        } catch (err: any) {
            setError(err.message || "Gagal login. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    // Starts mandatory 2FA enrollment
    const startMandatorySetup = async () => {
        setLoading(true);
        setError("");
        try {
            let resolvedEmail = email.trim().toLowerCase();
            if (resolvedEmail === "superadmin" || resolvedEmail === "admin") {
                resolvedEmail = `${resolvedEmail}@setara.co.id`;
            }
            const res = await fetch("/api/auth/2fa/setup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: resolvedEmail,
                    hotelCode: hotelCode.trim() || "0",
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Gagal menyiapkan 2FA.");
            }
            setSetupSecret(data.secret);
            setSetupQrUrl(data.qrCodeDataUrl);
            setRequires2Fa(false);
            setRequires2FaSetup(true);
            setSetupStep("qr");
        } catch (setupErr: any) {
            setError(setupErr.message || "Gagal memulai registrasi 2FA.");
        } finally {
            setLoading(false);
        }
    };

    // Completes mandatory 2FA verification
    const handleConfirmSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!twoFactorCode.trim()) return;
        setLoading(true);
        setError("");
        try {
            let resolvedEmail = email.trim().toLowerCase();
            if (resolvedEmail === "superadmin" || resolvedEmail === "admin") {
                resolvedEmail = `${resolvedEmail}@setara.co.id`;
            }
            const res = await fetch("/api/auth/2fa/enable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: resolvedEmail,
                    hotelCode: hotelCode.trim() || "0",
                    code: twoFactorCode.trim(),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Kode verifikasi 6 digit tidak cocok.");
            }
            setSetupRecoveryCodes(data.recoveryCodes || []);
            setSetupStep("codes");

            if (trustDevice) {
                setDeviceTrusted(resolvedEmail, 30);
            }
        } catch (err: any) {
            setError(err.message || "Gagal memverifikasi kode 2FA.");
        } finally {
            setLoading(false);
        }
    };

    // Completes login after user acknowledges backup codes
    const handleFinishSetupAndLogin = async () => {
        setLoading(true);
        try {
            let resolvedEmail = email.trim().toLowerCase();
            if (resolvedEmail === "superadmin" || resolvedEmail === "admin") {
                resolvedEmail = `${resolvedEmail}@setara.co.id`;
            }
            const res = await loginWithFirestore(
                resolvedEmail, 
                password, 
                hotelCode.trim(), 
                twoFactorCode.trim()
            );
            if (!res.success) {
                setError(res.error || "Gagal masuk setelah setup.");
            }
        } catch (err: any) {
            setError(err.message || "Gagal masuk setelah setup.");
        } finally {
            setLoading(false);
        }
    };

    const cancel2Fa = async () => {
        if (typeof window !== "undefined") {
            sessionStorage.removeItem("tara_2fa_pending");
        }
        try {
            await fbSignOut(auth);
        } catch {}
        setRequires2Fa(false);
        setRequires2FaSetup(false);
        setTwoFactorCode("");
        setError("");
    };

    return {
        email,
        setEmail,
        password,
        setPassword,
        hotelCode,
        setHotelCode,
        twoFactorCode,
        setTwoFactorCode,
        requires2Fa,
        requires2FaSetup,
        setupStep,
        setupSecret,
        setupQrUrl,
        setupRecoveryCodes,
        trustDevice,
        setTrustDevice,
        startMandatorySetup,
        handleConfirmSetup,
        handleFinishSetupAndLogin,
        cancel2Fa,
        error,
        loading,
        handleLogin,
    };
};
