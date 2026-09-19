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
                            Cancel Reservation
                        </h3>
                        <div className="delete-modal-desc">
                            <p>
                                Are you sure you want to cancel this reservation? Room inventory for <strong>{itemName}</strong> will be released and revenue will be excluded from the accounting ledger.
                            </p>
                        </div>

                        <div className="delete-modal-footer">
                            <button 
                                onClick={onCancel}
                                className="delete-modal-btn-cancel"
                                style={{ cursor: "pointer" }}
                            >
                                Dismiss
                            </button>
                            <button 
                                onClick={onConfirm}
                                className="delete-modal-btn-delete"
                                style={{ backgroundColor: "#d97706", color: "#ffffff", cursor: "pointer" }}
                            >
                                Cancel Reservation
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
