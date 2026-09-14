'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './PosSplashLoader.module.css';

export const PosSplashLoader: React.FC = () => {
  return (
    <div className={styles.splashContainer}>
      {/* Ambient Diffused Light Halo */}
      <div className={styles.ambientHalo} />

      {/* Center Cinematic Stage Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 14, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        transition={{
          duration: 0.75,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={styles.stageCard}
      >
        {/* Apple Style Logo with Breathing Micro-animation */}
        <motion.div
          animate={{
            scale: [1, 1.04, 1],
            opacity: [0.9, 1, 0.9],
          }}
          transition={{
            duration: 2.6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={styles.logoFrame}
        >
          <div className={styles.logoAura} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/channels/6.png"
            alt="MyTara POS"
            className={styles.logoImage}
          />
        </motion.div>

        {/* Minimalist Apple Pill Badge */}
        <div className={styles.metaPill}>
          <span className={styles.pulsingDot} />
          <span className={styles.metaText}>POS System</span>
        </div>

        {/* Brand Title */}
        <h2 className={styles.brandLabel}>
          Point of Sales Terminal
        </h2>

        {/* Apple 3px Progress Capsule */}
        <div className={styles.progressContainer}>
          <div className={styles.progressFill} />
        </div>

        {/* Monospaced System Hint */}
        <span className={styles.systemHint}>
          loading system...
        </span>
      </motion.div>

      {/* Cupertino Minimalist Footer */}
      <div className={styles.footerBranding}>
        <a href="https://mytara.id" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
          powered by Tara
        </a>
      </div>
    </div>
  );
};

export default PosSplashLoader;
