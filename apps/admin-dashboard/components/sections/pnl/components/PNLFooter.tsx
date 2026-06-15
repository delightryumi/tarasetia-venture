import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface PNLFooterProps {
    rise: any;
}

export const PNLFooter: React.FC<PNLFooterProps> = ({ rise }) => {
    return (
        <motion.footer variants={rise} className="mt-12 pt-8 border-t border-stone-100 flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em]">PnL Core • Real-time Audit</span>
            <div className="flex items-center gap-4">
                <Sparkles size={14} className="text-stone-300" />
                <div className="h-px w-20 bg-stone-100"></div>
            </div>
        </motion.footer>
    );
};
