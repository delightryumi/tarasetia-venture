"use client";

import React from "react";
import { motion } from "framer-motion";
import { POSCategory } from "../types";

interface CategoryTabProps {
    category: POSCategory;
    active: boolean;
    onClick: () => void;
}

export const CategoryTab: React.FC<CategoryTabProps> = ({ 
    category, active, onClick 
}) => (
    <button 
        onClick={onClick}
        className={`relative flex items-center justify-center h-10 px-6 transition-all min-w-[100px] group z-10`}
    >
        <span className={`text-[13px] font-medium transition-all duration-400 ${
            active ? 'text-[var(--abnb-ink)] font-semibold' : 'text-[var(--abnb-muted)] group-hover:text-[var(--abnb-ink)]'
        }`}>
            {category}
        </span>
        
        {active && (
            <motion.div 
                layoutId="active-pill"
                className="absolute inset-0 bg-[var(--abnb-surface-soft)] rounded-full -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
        )}
    </button>
);
