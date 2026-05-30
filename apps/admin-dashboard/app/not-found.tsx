'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative min-h-screen w-screen bg-zinc-950 flex flex-col items-center justify-center overflow-hidden font-sans select-none px-4 text-white">
      {/* Dynamic Background Glows */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 40, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none z-0"
      />
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          x: [0, -40, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none z-0"
      />

      {/* Cyber/Apple Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none z-0"></div>

      {/* Content Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-lg w-full text-center flex flex-col items-center gap-8 bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl"
      >
        {/* Animated Icon Indicator */}
        <motion.div
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-white/10"
        >
          <ShieldAlert size={28} className="text-white" />
        </motion.div>

        {/* Huge 404 Text with Gradient and Drop Shadow */}
        <div className="relative">
          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-8xl md:text-9xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-zinc-300 to-zinc-600 drop-shadow-sm font-sans"
          >
            404
          </motion.h1>
          <div className="absolute -inset-1 rounded-3xl bg-blue-500/10 blur-xl pointer-events-none -z-10"></div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-100">
            Halaman Tidak Ditemukan
          </h2>
          <p className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Oops! Jalur yang Anda tuju sepertinya tidak ada di dalam radar kami atau telah dipindahkan.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full pt-4">
          <Link
            href="/select-module"
            className="flex items-center justify-center gap-2 h-12 w-full sm:w-auto px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-98 shadow-lg shadow-blue-500/15 border border-white/10"
          >
            <Home size={16} />
            <span>Dashboard Utama</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 h-12 w-full sm:w-auto px-6 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-sm font-semibold text-zinc-200 transition-all active:scale-98 border border-white/5"
          >
            <ArrowLeft size={16} />
            <span>Kembali</span>
          </button>
        </div>
      </motion.div>

      {/* Brand footer */}
      <div className="absolute bottom-8 z-10 text-[11px] font-medium text-zinc-500 tracking-wider uppercase flex items-center gap-1.5 opacity-60">
        <span>Powered by</span>
        <span className="text-blue-500 font-bold">Nexura Group</span>
      </div>
    </div>
  );
}
