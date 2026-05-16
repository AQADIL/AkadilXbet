"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";
import type { BlackJackOutcome, BlackJackDecision } from "@/data/blackjackClips";

interface BlackJackResultOverlayProps {
  outcome: BlackJackOutcome | null;
  decision: BlackJackDecision | null;
  onNext: () => void;
}

const HEADLINE: Record<BlackJackOutcome, string> = {
  WIN: "YOU WIN",
  LOSE: "YOU LOSE",
  PUSH: "PUSH",
};

const HEADLINE_COLOR: Record<BlackJackOutcome, string> = {
  WIN: "text-green-400",
  LOSE: "text-red-400",
  PUSH: "text-white/70",
};

const HEADLINE_SHADOW: Record<BlackJackOutcome, string> = {
  WIN: "0 0 60px rgba(74,222,128,0.55), 0 0 120px rgba(74,222,128,0.25)",
  LOSE: "0 0 60px rgba(239,68,68,0.55), 0 0 120px rgba(239,68,68,0.2)",
  PUSH: "none",
};

export default function BlackJackResultOverlay({
  outcome,
  decision,
  onNext,
}: BlackJackResultOverlayProps) {
  if (!outcome) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="bj-result"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 z-30 flex flex-col items-center justify-between overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 w-full" />

        <div className="relative z-10 flex flex-col items-center gap-4 px-4 text-center select-none">
          <motion.p
            initial={{ scale: 0.82, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`font-black uppercase leading-none tracking-tight text-[clamp(3.5rem,18vw,6.5rem)] ${HEADLINE_COLOR[outcome]}`}
            style={{ textShadow: HEADLINE_SHADOW[outcome] }}
          >
            {HEADLINE[outcome]}
          </motion.p>

          {decision && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/8 border border-white/15 backdrop-blur-sm"
            >
              <span className="text-white/50 text-xs uppercase tracking-widest">
                You chose
              </span>
              <span className="text-white font-bold text-sm uppercase tracking-wide">
                {decision === "HIT" ? "Hit" : "Stand"}
              </span>
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full px-4 pb-28"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            onClick={onNext}
            className="flex items-center justify-center gap-2 w-full h-16 rounded-2xl font-black tracking-widest uppercase text-base
              bg-white/10 border border-white/20 text-white
              hover:bg-white/15 hover:border-white/30
              backdrop-blur-md transition-all duration-150 shadow-xl"
          >
            <RotateCcw size={16} strokeWidth={2.5} />
            Next Hand
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
