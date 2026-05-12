"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trophy, CircleX, RotateCcw } from "lucide-react";
import type { RoundResult } from "@/types/game";

interface ResultOverlayProps {
  result: RoundResult | null;
  onNext: () => void;
}

export default function ResultOverlay({ result, onNext }: ResultOverlayProps) {
  if (!result) return null;

  const { won, payout, bet } = result;

  return (
    <AnimatePresence>
      <motion.div
        key="result"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6"
      >
        <div className="absolute inset-0 backdrop-blur-md bg-[#08140C]/75" />

        <div className="relative z-10 flex flex-col items-center gap-5 w-full max-w-xs">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 18 }}
            className={`flex items-center justify-center w-20 h-20 rounded-full ${
              won
                ? "bg-brand-primary/20 border-2 border-brand-primary"
                : "bg-red-500/20 border-2 border-red-500"
            }`}
          >
            {won ? (
              <Trophy size={36} className="text-brand-glow" />
            ) : (
              <CircleX size={36} className="text-red-400" />
            )}
          </motion.div>

          <div className="flex flex-col items-center gap-1 text-center">
            <p
              className={`text-brutalist-xl text-[clamp(3rem,14vw,5rem)] leading-none ${
                won ? "text-brand-glow glow-green" : "text-red-400"
              }`}
            >
              {won ? "YOU WON" : "NO LUCK"}
            </p>
            <p className="text-text-muted text-sm mt-1">
              You chose{" "}
              <span className="text-text-secondary font-bold">
                {bet.choice === "GOAL" ? "GOAL" : "NO GOAL"}
              </span>
              {" — "}
              Result:{" "}
              <span className="text-text-secondary font-bold">
                {result.outcome === "GOAL" ? "GOAL" : "NO GOAL"}
              </span>
            </p>
          </div>

          <div className="glass rounded-xl px-6 py-4 text-center w-full border border-white/10">
            {won ? (
              <div className="flex flex-col gap-0.5">
                <span className="text-text-muted text-xs uppercase tracking-widest">
                  Payout
                </span>
                <span className="text-brand-glow text-3xl font-black tabular-nums">
                  +{payout.toFixed(0)}
                </span>
                <span className="text-text-muted text-xs">credits</span>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                <span className="text-text-muted text-xs uppercase tracking-widest">
                  Lost
                </span>
                <span className="text-red-400 text-3xl font-black tabular-nums">
                  -{bet.amount}
                </span>
                <span className="text-text-muted text-xs">credits</span>
              </div>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onNext}
            className="flex items-center justify-center gap-2 w-full h-14 rounded-xl bg-brand-primary text-surface-base font-black text-brutalist text-sm tracking-widest uppercase shadow-lg shadow-brand-primary/25 active:bg-brand-glow transition-colors duration-150"
          >
            <RotateCcw size={16} strokeWidth={2.5} />
            Next Game
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
