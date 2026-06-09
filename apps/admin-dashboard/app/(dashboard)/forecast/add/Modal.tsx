import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './TransactionFormStyles.module.css';

interface ModalProps {
  isOpen?: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ isOpen = true, onClose, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.modalOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ zIndex: 200 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.modal}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            onClick={e => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
