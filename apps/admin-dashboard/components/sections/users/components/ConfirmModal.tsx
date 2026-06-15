import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import styles from "../UsersStyles.module.css";

export type ConfirmVariant = "reset" | "delete" | "warning";

interface ConfirmModalProps {
    isOpen: boolean;
    variant?: ConfirmVariant;
    title: string;
    message: string;
    /** Optional extra content like showing new password */
    extraContent?: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const VARIANT_CONFIG: Record<ConfirmVariant, { icon: React.ReactNode; isDanger: boolean }> = {
    reset: {
        icon: <Key size={18} />,
        isDanger: false,
    },
    delete: {
        icon: <Trash2 size={18} />,
        isDanger: true,
    },
    warning: {
        icon: <AlertTriangle size={18} />,
        isDanger: true,
    },
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    variant = "reset",
    title,
    message,
    extraContent,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    isLoading = false,
    onConfirm,
    onCancel,
}) => {
    const config = VARIANT_CONFIG[variant];

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
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={styles.confirmPanel}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.confirmHeader}>
                            <div className={`${styles.confirmIconBox} ${config.isDanger ? styles.confirmIconBoxDanger : ""}`}>
                                {config.icon}
                            </div>
                            <h3 className={styles.confirmTitle}>{title}</h3>
                        </div>

                        <div className={styles.confirmBody}>
                            <p className={styles.confirmMessage}>{message}</p>
                            {extraContent}
                        </div>

                        <div className={styles.confirmFooter}>
                            <button
                                type="button"
                                onClick={onCancel}
                                className={styles.confirmBtnCancel}
                                disabled={isLoading}
                            >
                                {cancelLabel}
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={`${styles.confirmBtnConfirm} ${config.isDanger ? styles.confirmBtnDanger : ""}`}
                            >
                                {isLoading && <RefreshCw size={12} className={styles.animateSpin} />}
                                {confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
