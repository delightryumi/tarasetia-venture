'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PButton } from './PButton';
import s from '../../../app/(dashboard)/purchasing/shared-page.module.css';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm
}: DeleteConfirmModalProps) {
  const [password, setPassword] = useState('');

  const handleConfirm = () => {
    onConfirm(password);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={s.modalOverlay} 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          style={{ zIndex: 300 }}
        >
          <motion.div 
            className={s.modal} 
            style={{ maxWidth: 400 }} 
            initial={{ scale: 0.95 }} 
            animate={{ scale: 1 }} 
            exit={{ scale: 0.95 }}
          >
            <h3 className={s.modalTitle}>Confirm Delete</h3>
            <p className={s.modalSubtitle} style={{ marginBottom: 16 }}>
              This action requires administrator authorization.
            </p>
            
            <div className={s.formField} style={{ marginBottom: 20 }}>
              <label className={s.formLabel}>Admin Password</label>
              <input
                type="password"
                className={s.formInput}
                placeholder="Enter admin password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') handleConfirm();
                }}
              />
            </div>

            <div className={s.modalActions} style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <PButton variant="danger" onClick={handleConfirm}>Delete Requisition</PButton>
              <PButton variant="secondary" onClick={() => { setPassword(''); onClose(); }}>Cancel</PButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
