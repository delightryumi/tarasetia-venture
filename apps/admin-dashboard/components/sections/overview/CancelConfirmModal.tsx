"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CancelConfirmModalProps {
    isOpen: boolean;
    itemName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function CancelConfirmModal({ isOpen, itemName, onConfirm, onCancel }: CancelConfirmModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="delete-modal-overlay"
                    onClick={onCancel}
                >
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="delete-modal-card"
                    >
                        <h3 className="delete-modal-title">
                            Cancel Booking
                        </h3>
                        <div className="delete-modal-desc">
                            <p>
                                Apakah Anda yakin ingin membatalkan pemesanan ini? Tindakan ini akan melepaskan inventory kamar untuk <strong>{itemName}</strong>.
                            </p>
                        </div>

                        <div className="delete-modal-footer">
                            <button 
                                onClick={onCancel}
                                className="delete-modal-btn-cancel"
                                style={{ cursor: "pointer" }}
                            >
                                Abort
                            </button>
                            <button 
                                onClick={onConfirm}
                                className="delete-modal-btn-delete"
                                style={{ backgroundColor: "#f59e0b", color: "#ffffff", cursor: "pointer" }}
                            >
                                Cancel Booking
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
