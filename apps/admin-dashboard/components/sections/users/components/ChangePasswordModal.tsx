"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, RefreshCw, ShieldCheck, X } from "lucide-react";
import styles from "../UsersStyles.module.css";

interface ChangePasswordModalProps {
    isOpen: boolean;
    userName?: string;
    isLoading?: boolean;
    onConfirm: (password: string) => void;
    onCancel: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
    isOpen,
    userName,
    isLoading = false,
    onConfirm,
    onCancel,
}) => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [touched, setTouched] = useState(false);

    const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\[\]{};':"\\|,.<>\/\?]).{6,}$/;
    const mismatch = touched && confirmPassword.length > 0 && password !== confirmPassword;
    const match = touched && confirmPassword.length > 0 && password === confirmPassword;
    const meetsPattern = passwordPattern.test(password);
    const isValid = password.length >= 6 && meetsPattern && password === confirmPassword;

    // Reset on open/close
    useEffect(() => {
        if (!isOpen) {
            setPassword("");
            setConfirmPassword("");
            setShowPassword(false);
            setShowConfirm(false);
            setTouched(false);
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (!isValid) return;
        onConfirm(password);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={styles.confirmOverlay}
                    onClick={onCancel}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={styles.changePwdModalPanel}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* ── Header ── */}
                        <div className={styles.changePwdModalHeader}>
                            <div className={styles.changePwdModalIconBox}>
                                <Lock size={18} />
                            </div>
                            <div className={styles.changePwdModalTitleGroup}>
                                <h3 className={styles.changePwdModalTitle}>Change Password</h3>
                                {userName && (
                                    <span className={styles.changePwdModalSub}>
                                        <ShieldCheck size={10} />
                                        {userName}
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={onCancel}
                                className={styles.changePwdModalClose}
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* ── Body ── */}
                        <div className={styles.changePwdModalBody}>
                            {/* New Password */}
                            <div className={styles.changePwdField}>
                                <label className={styles.changePwdLabel}>New Password</label>
                                <div className={styles.changePwdInputRow}>
                                    <div className={styles.changePwdInputIcon}>
                                        <Lock size={14} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min. 6 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={styles.changePwdInput2}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        className={styles.changePwdEyeBtn}
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                                {password.length > 0 && password.length < 6 && (
                                    <span className={styles.changePwdHint}>Minimal 6 karakter</span>
                                )}
                                {password.length > 0 && !meetsPattern && (
                                    <span className={styles.changePwdHint}>Harus ada huruf besar, angka, dan karakter khusus</span>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className={styles.changePwdField}>
                                <label className={styles.changePwdLabel}>Confirm Password</label>
                                <div className={`${styles.changePwdInputRow} ${mismatch ? styles.changePwdInputRowError : match ? styles.changePwdInputRowSuccess : ""}`}>
                                    <div className={styles.changePwdInputIcon}>
                                        <Lock size={14} />
                                    </div>
                                    <input
                                        type={showConfirm ? "text" : "password"}
                                        placeholder="Ulangi password baru"
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            setTouched(true);
                                        }}
                                        className={styles.changePwdInput2}
                                    />
                                    <button
                                        type="button"
                                        className={styles.changePwdEyeBtn}
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        tabIndex={-1}
                                    >
                                        {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                                <AnimatePresence>
                                    {mismatch && (
                                        <motion.span
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            className={styles.changePwdError}
                                        >
                                            ✕ Password tidak cocok
                                        </motion.span>
                                    )}
                                    {match && (
                                        <motion.span
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            className={styles.changePwdSuccess}
                                        >
                                            ✓ Password cocok
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* ── Footer ── */}
                        <div className={styles.changePwdModalFooter}>
                            <button
                                type="button"
                                onClick={onCancel}
                                className={styles.confirmBtnCancel}
                                disabled={isLoading}
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={!isValid || isLoading}
                                className={`${styles.confirmBtnConfirm} ${!isValid ? styles.confirmBtnDisabled : ""}`}
                            >
                                {isLoading && <RefreshCw size={12} className={styles.animateSpin} />}
                                Simpan Password
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
