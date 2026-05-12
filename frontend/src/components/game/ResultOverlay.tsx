"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";
import type { RoundResult } from "@/types/game";

interface ResultOverlayProps {
  result: RoundResult | null;
  timedOut: boolean;
  onNext: () => void;
}

export default function ResultOverlay({ result, timedOut, onNext }: ResultOverlayProps) {
  const won = result?.won ?? false;
  const choice = result?.bet.choice;
  const outcome = result?.outcome;

  const headline = timedOut ? "TIME'S UP" : won ? "YOU WON" : "YOU LOST";

  const headlineColor = timedOut
    ? "text-white/70"
    : won
    ? "text-green-400"
    : "text-red-400";

  const headlineShadow = timedOut
    ? "none"
    : won
    ? "0 0 60px rgba(74,222,128,0.55), 0 0 120px rgba(74,222,128,0.25)"
    : "0 0 60px rgba(239,68,68,0.55), 0 0 120px rgba(239,68,68,0.2)";

  return (
    <AnimatePresence>
      <motion.div
        key="result-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 z-30 flex flex-col items-center justify-between overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[4px]" />

        <div className="relative z-10 w-full" />

        <div className="relative z-10 flex flex-col items-center gap-4 px-4 text-center select-none">
          <motion.p
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`font-black uppercase leading-none tracking-tight text-[clamp(3.5rem,18vw,6.5rem)] ${headlineColor}`}
            style={{ textShadow: headlineShadow }}
          >
            {headline}
          </motion.p>

          {!timedOut && choice && outcome && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/8 border border-white/15 backdrop-blur-sm"
            >
              <span className="text-white/50 text-xs uppercase tracking-widest">
                Your pick:
              </span>
              <span className="text-white font-bold text-sm uppercase tracking-wide">
                {choice === "GOAL" ? "Goal" : "No Goal"}
              </span>
              <span className="text-white/30 text-xs">·</span>
              <span className="text-white/50 text-xs uppercase tracking-widest">
                Result:
              </span>
              <span className={`font-bold text-sm uppercase tracking-wide ${
                outcome === "GOAL" ? "text-green-400" : "text-red-400"
              }`}>
                {outcome === "GOAL" ? "Goal" : "No Goal"}
              </span>
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full px-4 pb-6 md:pb-10 md:max-w-sm md:mx-auto"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            onClick={onNext}
            className="flex items-center justify-center gap-2 w-full h-16 md:h-18 rounded-2xl font-black text-brutalist tracking-widest uppercase text-base
              bg-white/10 border border-white/20 text-white
              hover:bg-white/15 hover:border-white/30
              backdrop-blur-md transition-all duration-150 shadow-xl"
          >
            <RotateCcw size={16} strokeWidth={2.5} />
            Next Game
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
