'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative min-h-screen w-screen bg-[#f2b724] dark:bg-[#f2b724] flex flex-col items-center justify-center overflow-hidden font-sans select-none px-4 py-12 text-[#171717] dark:text-[#171717]">
      {/* Import Lilita One Google Font dynamically */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&display=swap');
        .font-lilita {
          font-family: 'Lilita One', cursive, sans-serif !important;
        }
      `}</style>

      {/* Background OOPS! Text - Using negative margins to overlap nicely */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 0.15, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-[18vw] md:text-[14vw] font-black tracking-tighter uppercase text-[#171717] dark:text-[#171717] leading-none mb-[-3vw] pointer-events-none select-none z-0"
        style={{ fontFamily: 'sans-serif' }}
      >
        OOPS!
      </motion.h1>

      {/* Tilted Card Container - Force light colors even in dark mode */}
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.95, rotate: 0 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotate: -3 }}
        transition={{ type: 'spring', stiffness: 90, damping: 14, delay: 0.1 }}
        className="relative z-10 w-full max-w-[580px] bg-[#FCF8F2] dark:bg-[#FCF8F2] rounded-[3rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] flex flex-col items-center p-10 md:p-14 gap-8"
      >
        {/* Playful Text Block */}
        <div className="font-lilita flex flex-row items-center justify-center gap-8 select-none pt-4">
          {/* Left Side: PAGE */}
          <div className="relative flex flex-col items-center">
            <motion.span
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5, type: 'spring', stiffness: 100 }}
              className="text-7xl md:text-8xl text-[#171717] dark:text-[#171717] tracking-tight rotate-[-4deg] leading-none"
            >
              PAGE
            </motion.span>
            
            {/* Squiggle loop underneath PAGE */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.8, type: 'spring', stiffness: 120 }}
              className="absolute -bottom-6 text-[#f2b724] dark:text-[#f2b724]"
            >
              <svg className="w-24 h-10 animate-pulse" viewBox="0 0 100 50" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round">
                <path d="M10,25 C25,25 35,5 45,25 C55,45 65,25 90,25" />
              </svg>
            </motion.div>

            {/* Starburst on bottom-left */}
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.9, type: 'spring', stiffness: 150 }}
              className="absolute -bottom-12 -left-10 text-[#f2b724] dark:text-[#f2b724]"
            >
              <svg className="w-12 h-12" viewBox="0 0 100 100" fill="currentColor">
                <path d="M50 0 L58 35 L90 20 L68 45 L100 50 L68 55 L90 80 L58 65 L50 100 L42 65 L10 80 L32 55 L0 50 L32 45 L10 20 L42 35 Z" />
              </svg>
            </motion.div>
          </div>

          {/* Right Side: NOT FOUND */}
          <div className="relative flex flex-col items-start leading-[0.85] pl-2 rotate-[4deg]">
            {/* Triangles on top-right */}
            <motion.div
              initial={{ scale: 0, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 1.0, type: 'spring', stiffness: 140 }}
              className="absolute -top-12 -right-8 text-[#f2b724] dark:text-[#f2b724]"
            >
              <svg className="w-16 h-16" viewBox="0 0 100 100" fill="currentColor">
                <polygon points="10,80 30,30 50,70" />
                <polygon points="40,65 65,15 75,55" />
                <polygon points="70,55 90,5 98,40" />
              </svg>
            </motion.div>

            <motion.span
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5, type: 'spring', stiffness: 100 }}
              className="text-6xl md:text-7xl text-[#171717] dark:text-[#171717] tracking-tight"
            >
              NOT
            </motion.span>
            <motion.span
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5, type: 'spring', stiffness: 100 }}
              className="text-6xl md:text-7xl text-[#171717] dark:text-[#171717] tracking-tight"
            >
              FOUND
            </motion.span>
          </div>
        </div>

        {/* Back to Home Button - Fully inline-styled to prevent any global css color inheritance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="w-full flex justify-center pt-4"
        >
          <Link
            href="/select-module"
            className="hover:scale-105 active:scale-95 transition-all duration-200 shadow-md font-sans text-center"
            style={{
              backgroundColor: '#171717',
              color: '#FCF8F2',
              padding: '14px 44px',
              borderRadius: '9999px',
              fontWeight: 'bold',
              fontSize: '14px',
              display: 'inline-block',
              textDecoration: 'none'
            }}
          >
            Back to Home
          </Link>
        </motion.div>
      </motion.div>

      {/* Left Corner Error Info */}
      <div className="absolute bottom-6 left-8 text-[#171717]/80 dark:text-[#171717]/80 font-black text-xs tracking-[0.2em] uppercase">
        Error
      </div>

      {/* Right Corner Code Info */}
      <div className="absolute bottom-6 right-8 text-[#171717]/80 dark:text-[#171717]/80 font-black text-xs tracking-[0.2em] uppercase">
        404
      </div>
    </div>
  );
}
