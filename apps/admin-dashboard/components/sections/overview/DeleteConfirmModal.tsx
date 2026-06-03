"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface DeleteConfirmModalProps {
    isOpen: boolean;
    itemName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function DeleteConfirmModal({ isOpen, itemName, onConfirm, onCancel }: DeleteConfirmModalProps) {
    const [passwordInput, setPasswordInput] = useState("");

    const handleConfirm = () => {
        if (passwordInput !== 'admin123' && passwordInput !== 'owner123') {
            toast.error("Password Admin salah! Penghapusan dibatalkan.");
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
                            Are you absolutely sure want to delete ?
                        </h3>
                        <div className="delete-modal-desc">
                            <p>
                                This action cannot be undone. This will permanently delete the transaction for{" "}
                                <strong>
                                    {itemName}
                                </strong>.
                            </p>
                            
                            <div className="delete-modal-separator">
                                <label htmlFor="adminPassword" className="delete-modal-label">
                                    Konfirmasi Password Admin
                                </label>
                                <input
                                    id="adminPassword"
                                    type="password"
                                    placeholder="Masukkan password admin..."
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
                                Delete
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
