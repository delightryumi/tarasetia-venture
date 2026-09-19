"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface VoidConfirmModalProps {
    isOpen: boolean;
    itemName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function VoidConfirmModal({ isOpen, itemName, onConfirm, onCancel }: VoidConfirmModalProps) {
    const [passwordInput, setPasswordInput] = useState("");

    const handleConfirm = () => {
        if (passwordInput !== 'admin123' && passwordInput !== 'owner123') {
            toast.error("Password Admin salah! Proses void dibatalkan.");
            return;
        }
        onConfirm();
        setPasswordInput("");
    };

    const handleCancel = () => {
        setPasswordInput("");
        onCancel();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="delete-modal-overlay"
                    onClick={handleCancel}
                >
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="delete-modal-card"
                    >
                        <h3 className="delete-modal-title">
                            Confirm Transaction Void
                        </h3>
                        <div className="delete-modal-desc">
                            <p>
                                Are you sure you want to void this transaction? All charges for <strong>{itemName}</strong> will be voided from the audit ledger and room inventory will be released.
                            </p>
                            
                            <div className="delete-modal-separator">
                                <label htmlFor="adminPassword" className="delete-modal-label">
                                    Supervisor / Manager Authorization Password
                                </label>
                                <input
                                    id="adminPassword"
                                    type="password"
                                    placeholder="Enter authorization password..."
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    className="delete-modal-input"
                                    autoFocus
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleConfirm();
                                    }}
                                />
                            </div>
                        </div>

                        <div className="delete-modal-footer">
                            <button 
                                onClick={handleCancel}
                                className="delete-modal-btn-cancel"
                                style={{ cursor: "pointer" }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirm}
                                className="delete-modal-btn-delete"
                                style={{ cursor: "pointer" }}
                            >
                                Void Transaction
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
