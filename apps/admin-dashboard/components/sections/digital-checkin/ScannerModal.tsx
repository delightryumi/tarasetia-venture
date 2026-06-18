"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Scan, PenTool, Check, RefreshCw, RotateCcw } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import Tesseract from "tesseract.js";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { addDoc, Timestamp } from "firebase/firestore";

interface ScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ScannerModal({ isOpen, onClose }: ScannerModalProps) {
    const { activeHotelCode, user } = useAuth();
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Video / Camera state
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isOcrProcessing, setIsOcrProcessing] = useState(false);

    // Form State
    const [nik, setNik] = useState("");
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [roomNumber, setRoomNumber] = useState("");

    // Signature State
    const sigCanvasRef = useRef<any>(null);

    // Camera Lifecycle
    useEffect(() => {
        let stream: MediaStream | null = null;
        if (isOpen && step === 1 && !capturedImage) {
            navigator.mediaDevices
                .getUserMedia({ video: { facingMode: "environment" } })
                .then((s) => {
                    stream = s;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play();
                        setIsCameraReady(true);
                    }
                })
                .catch((err) => {
                    console.error("Camera error:", err);
                    alert("Akses kamera ditolak atau tidak tersedia.");
                });
        }
        return () => {
            if (stream) stream.getTracks().forEach((t) => t.stop());
        };
    }, [isOpen, step, capturedImage]);

    // Cleanup on close
    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setCapturedImage(null);
            setNik("");
            setName("");
            setAddress("");
            setRoomNumber("");
            setIsOcrProcessing(false);
            setIsCameraReady(false);
            if (sigCanvasRef.current) sigCanvasRef.current.clear();
        }
    }, [isOpen]);

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL("image/jpeg", 0.8);
                setCapturedImage(imageData);
                processOCR(imageData);
            }
        }
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        setIsCameraReady(false);
    };

    const processOCR = async (imageSrc: string) => {
        setIsOcrProcessing(true);
        setStep(2);
        try {
            const result = await Tesseract.recognize(imageSrc, "ind+eng", {
                logger: (m) => { if (m.status === 'recognizing text') console.log(`OCR: ${Math.round(m.progress * 100)}%`); },
            });
            const rawText = result.data.text;
            console.log("[KTP OCR Raw]:\n", rawText);

            // ── Normalize: clean up lines ──────────────────────────────────────
            const lines = rawText
                .split("\n")
                .map((l) => l.trim())
                .filter((l) => l.length > 1);

            // ── Helper: extract value from a line that matches a keyword ──────
            // Supports: "NAMA : Budi" or "NAMA\nBudi" (next line)
            const KTP_FIELD_KEYWORDS = /^(nik|nama|tempat|tgl|jenis|alamat|rt|kel|desa|keca|agama|status|peker|kewarga|berlaku|provinsi|kota|kabupaten|gol|darah)/i;

            const extractValue = (keyword: RegExp, extraLines = 0): string => {
                for (let i = 0; i < lines.length; i++) {
                    if (!keyword.test(lines[i].toLowerCase())) continue;

                    // Strategy 1: value after ":" on the same line
                    const colonIdx = lines[i].indexOf(":");
                    if (colonIdx !== -1) {
                        const afterColon = lines[i].slice(colonIdx + 1).trim();
                        if (afterColon.length > 1) {
                            // Collect extra lines if needed (e.g. multi-line address)
                            let combined = afterColon;
                            for (let k = 1; k <= extraLines; k++) {
                                const nextLine = lines[i + k] || "";
                                if (KTP_FIELD_KEYWORDS.test(nextLine)) break;
                                if (nextLine.length > 1) combined += " " + nextLine;
                            }
                            return combined.replace(/\s+/g, " ").trim();
                        }
                    }

                    // Strategy 2: value on the NEXT line (when no colon)
                    if (i + 1 < lines.length) {
                        const nextLine = lines[i + 1];
                        if (!KTP_FIELD_KEYWORDS.test(nextLine)) {
                            let combined = nextLine;
                            for (let k = 2; k <= extraLines + 1; k++) {
                                const nextK = lines[i + k] || "";
                                if (KTP_FIELD_KEYWORDS.test(nextK)) break;
                                if (nextK.length > 1) combined += " " + nextK;
                            }
                            return combined.replace(/\s+/g, " ").trim();
                        }
                    }
                }
                return "";
            };

            // ── 1. NIK — 16-digit number anywhere in text ────────────────────
            const nikMatch = rawText.replace(/\s/g, "").match(/\d{16}/);
            if (nikMatch) {
                setNik(nikMatch[0]);
                console.log("[KTP] NIK:", nikMatch[0]);
            }

            // ── 2. Nama ───────────────────────────────────────────────────────
            const rawName = extractValue(/\bnama\b/i);
            if (rawName) {
                // Keep letters, spaces, apostrophes, hyphens (valid in Indonesian names)
                const cleanName = rawName.replace(/[^a-zA-Z\s'\-.,]/g, "").replace(/\s+/g, " ").trim();
                if (cleanName.length > 1) {
                    setName(cleanName);
                    console.log("[KTP] Nama:", cleanName);
                }
            }

            // ── 3. Alamat (multi-line: street + RT/RW sometimes on next line) ─
            const rawAlamat = extractValue(/\balamat\b/i, 2);
            if (rawAlamat) {
                // Remove RT/RW prefix if it leaked in
                const cleanAlamat = rawAlamat
                    .replace(/\bRT\b.*?\bRW\b.*/i, "")
                    .replace(/[|\\[\]{}]/g, "")
                    .replace(/\s+/g, " ")
                    .trim();
                if (cleanAlamat.length > 2) {
                    setAddress(cleanAlamat);
                    console.log("[KTP] Alamat:", cleanAlamat);
                }
            }

        } catch (err) {
            console.error("OCR Error:", err);
        } finally {
            setIsOcrProcessing(false);
        }

    };

    const handleSave = async () => {
        if (!activeHotelCode) return;
        if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
            alert("Mohon isi tanda tangan terlebih dahulu.");
            return;
        }

        // Gunakan getCanvas() native — paling kompatibel lintas versi react-signature-canvas
        let signatureDataUrl: string;
        try {
            const nativeCanvas: HTMLCanvasElement = sigCanvasRef.current.getCanvas();
            signatureDataUrl = nativeCanvas.toDataURL("image/png");
        } catch {
            signatureDataUrl = sigCanvasRef.current.toDataURL("image/png");
        }

        try {
            await addDoc(getHotelCollection(db, "digital_checkins"), {
                nik,
                name,
                address,
                roomNumber,
                signatureUrl: signatureDataUrl,
                timestamp: Timestamp.now(),
                staffName: user?.displayName || user?.email || "Staff",
            });
            onClose();
        } catch (err) {
            console.error("Save Error:", err);
            alert("Gagal menyimpan data.");
        }
    };

    if (!isOpen) return null;

    const stepLabels = ["Pindai KTP", "Konfirmasi Data Tamu", "Tanda Tangan Tamu"];
    const StepIcon = step === 1 ? Camera : step === 2 ? Scan : PenTool;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 16 }}
                    className="bg-white w-full max-w-md rounded-[12px] shadow-xl flex flex-col overflow-hidden"
                    style={{ maxHeight: 'min(92dvh, 700px)', transition: 'none' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-4 border-b border-[#dddddd]">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <StepIcon size={16} />
                            </div>
                            <div>
                                <h2 className="text-[14px] font-medium text-[#181d26] leading-none">
                                    {stepLabels[step - 1]}
                                </h2>
                                <p className="text-[12px] text-gray-500 mt-1">Langkah {step} dari 3</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Progress */}
                    <div className="flex gap-1 px-4 py-3">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="h-1 flex-1 rounded-full" style={{ backgroundColor: s <= step ? '#181d26' : '#dddddd' }} />
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-4 py-2">
                        {step === 1 && (
                            <div className="flex flex-col gap-3">
                                {/* Camera/preview */}
                                <div className="relative w-full bg-black rounded-[10px] overflow-hidden border border-[#dddddd]" style={{ aspectRatio: '16/9', maxHeight: '190px' }}>
                                    {!capturedImage ? (
                                        <>
                                            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
                                            {/* KTP corner guide */}
                                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                                <div className="w-[84%] h-[80%] relative">
                                                    <div className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-white" />
                                                    <div className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-white" />
                                                    <div className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-white" />
                                                    <div className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-white" />
                                                </div>
                                            </div>
                                            {!isCameraReady && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Menginisialisasi kamera...</p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={capturedImage} alt="KTP" className="absolute inset-0 w-full h-full object-cover" />
                                    )}
                                </div>
                                <canvas ref={canvasRef} className="hidden" />

                                {/* Hint */}
                                <p style={{ fontSize: '13px', fontWeight: 400, color: '#9297a0', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
                                    {!capturedImage
                                        ? 'Posisikan KTP dalam bingkai. Pastikan teks terbaca jelas.'
                                        : 'Foto berhasil diambil. Lanjut ke form atau ambil ulang.'}
                                </p>

                                {!capturedImage ? (
                                    <button
                                        onClick={capturePhoto}
                                        disabled={!isCameraReady}
                                        className="w-full h-[44px] rounded-[12px] bg-[#181d26] text-white flex items-center justify-center gap-2"
                                        style={{ fontSize: '14px', fontWeight: 500, opacity: !isCameraReady ? 0.45 : 1, border: 'none', cursor: 'pointer' }}
                                    >
                                        <Camera size={15} /> Ambil Foto KTP
                                    </button>
                                ) : (
                                    <button
                                        onClick={retakePhoto}
                                        className="w-full h-[44px] rounded-[6px] border border-[#dddddd] text-[#333840]"
                                        style={{ fontSize: '14px', fontWeight: 500, backgroundColor: '#fff', cursor: 'pointer' }}
                                    >
                                        Ambil Ulang
                                    </button>
                                )}
                            </div>
                        )}

                        {step === 2 && (
                            <div className="flex flex-col gap-3">
                                {/* OCR banner */}
                                {isOcrProcessing && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        fontSize: '13px', color: '#254fad',
                                        backgroundColor: '#eff4ff',
                                        padding: '10px 12px', borderRadius: '6px',
                                        border: '1px solid rgba(69,143,255,0.2)',
                                    }}>
                                        <RefreshCw size={13} className="animate-spin flex-shrink-0" />
                                        <span>Memindai teks KTP...</span>
                                    </div>
                                )}

                                {/* NIK */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.16px', color: '#9297a0', textTransform: 'uppercase' }}>NIK KTP</label>
                                    <input type="text" value={nik} onChange={(e) => setNik(e.target.value)} placeholder="Contoh: 317XXXXXXXXXXXXX"
                                        style={{ height: '44px', width: '100%', boxSizing: 'border-box', padding: '0 16px', borderRadius: '6px', border: '1px solid #dddddd', fontSize: '14px', color: '#181d26', outline: 'none', backgroundColor: '#f8fafc' }} />
                                </div>

                                {/* Nama */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.16px', color: '#9297a0', textTransform: 'uppercase' }}>Nama Lengkap</label>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama sesuai KTP"
                                        style={{ height: '44px', width: '100%', boxSizing: 'border-box', padding: '0 16px', borderRadius: '6px', border: '1px solid #dddddd', fontSize: '14px', color: '#181d26', outline: 'none', backgroundColor: '#f8fafc' }} />
                                </div>

                                {/* Nomor Kamar */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.16px', color: '#9297a0', textTransform: 'uppercase' }}>Nomor Kamar</label>
                                    <input type="text" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="Contoh: 101"
                                        style={{ height: '44px', width: '100%', boxSizing: 'border-box', padding: '0 16px', borderRadius: '6px', border: '1px solid #dddddd', fontSize: '14px', color: '#181d26', outline: 'none', backgroundColor: '#f8fafc' }} />
                                </div>

                                {/* Alamat */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.16px', color: '#9297a0', textTransform: 'uppercase' }}>Alamat <span style={{ fontWeight: 400, textTransform: 'none' }}>(opsional)</span></label>
                                    <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="Alamat domisili tamu"
                                        style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: '6px', border: '1px solid #dddddd', fontSize: '14px', color: '#181d26', outline: 'none', backgroundColor: '#f8fafc', resize: 'none' }} />
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <p style={{ fontSize: '13px', color: '#41454d', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
                                    Minta tamu menandatangani sebagai persetujuan{' '}
                                    <span style={{ fontWeight: 500, color: '#181d26' }}>Privacy Policy</span> hotel.
                                </p>
                                <div style={{ width: '100%', borderRadius: '10px', overflow: 'hidden', border: '1.5px dashed #dddddd', backgroundColor: '#fff', cursor: 'crosshair' }}>
                                    <SignatureCanvas
                                        ref={sigCanvasRef}
                                        penColor="#181d26"
                                        canvasProps={{ className: 'w-full h-40' }}
                                    />
                                </div>
                                <button
                                    onClick={() => sigCanvasRef.current?.clear()}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', margin: '0 auto', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: '#9297a0' }}
                                >
                                    <RotateCcw size={12} /> Hapus &amp; Ulangi
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-4 border-t border-[#dddddd] flex justify-between gap-3">
                        {step > 1 ? (
                            <button onClick={() => setStep(step - 1 as any)} className="h-[40px] px-5 rounded-[6px] border border-[#dddddd] text-[14px] font-medium">Kembali</button>
                        ) : <div />}
                        
                        {step === 1 && capturedImage && (
                            <button onClick={() => setStep(2)} className="h-[40px] px-5 rounded-[12px] bg-[#181d26] text-white text-[14px] font-medium">Lanjut</button>
                        )}
                        {step === 2 && (
                            <button onClick={() => setStep(3)} className="h-[40px] px-5 rounded-[12px] bg-[#181d26] text-white text-[14px] font-medium">Lanjut ke TTD</button>
                        )}
                        {step === 3 && (
                            <button onClick={handleSave} className="h-[40px] px-5 rounded-[12px] bg-[#181d26] text-white text-[14px] font-medium flex items-center gap-2">
                                <Check size={16} /> Simpan Check-in
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
