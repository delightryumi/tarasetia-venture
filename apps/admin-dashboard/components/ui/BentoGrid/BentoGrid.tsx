"use client";


import React from 'react';
import { motion } from 'framer-motion';
import './bento.css';

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ children, className }) => {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className={`bento-grid ${className}`}
    >
      {children}
    </motion.div>
  );
};
