"use client";


import React from 'react';
import { motion } from 'framer-motion';
import './bento.css';

const rise = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
};

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  colSpan?: number;
  rowSpan?: number;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className,
  onClick,
  colSpan,
  rowSpan,
}) => {
  const styles = {
    ...(colSpan ? { gridColumn: `span ${colSpan}` } : {}),
    ...(rowSpan ? { gridRow: `span ${rowSpan}` } : {}),
  };

  const CardComponent = onClick ? motion.button : motion.div;

  return (
    <CardComponent
      variants={rise}
      onClick={onClick}
      className={`bento-card ${className}`}
      style={styles}
      whileHover={onClick ? { scale: 1.02, transition: { duration: 0.2 } } : {}}
      whileTap={onClick ? { scale: 0.98, transition: { duration: 0.2 } } : {}}
    >
      {children}
    </CardComponent>
  );
};
