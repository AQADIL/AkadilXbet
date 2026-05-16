"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Minus, Plus } from "lucide-react";

interface BettingOverlayProps {
  onPlay: (amount: number) => void;
  level: number;
}

const AMOUNTS = [10, 50, 100, 500];

export default function BettingOverlay({ onPlay, level }: BettingOverlayProps) {
  const [bet, setBet] = useState(50);

  return (
    <motion.div
      key="betting"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center overflow-hidden bg-black/60 backdrop-blur-md px-6 pb-24"
    >
      <div className="flex-1 w-full flex flex-col items-center justify-center mt-12 gap-8">
        <div className="flex flex-col items-center gap-2">
          <span className="text-emerald-400 font-semibold uppercase tracking-[0.35em] text-xs">
            Level {level}
          </span>
          <h2 className="text-white font-black uppercase text-4xl tracking-tight text-center leading-none">
            Place Your Bet
          </h2>
        </div>

        <div className="flex items-center justify-center gap-6 w-full">
          <button
            type="button"
            onClick={() => setBet((p) => Math.max(10, p - 10))}
            className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/50 active:scale-95 transition-all"
          >
            <Minus size={24} />
          </button>

          <div className="flex flex-col items-center justify-center min-w-[140px]">
            <div className="flex items-center gap-2 text-emerald-400">
              <Coins size={28} />
              <span className="text-5xl font-black tabular-nums tracking-tighter">
                {bet}
              </span>
            </div>
            <span className="text-white/30 text-xs font-semibold uppercase tracking-widest mt-1">
              Chips
            </span>
          </div>

          <button
            type="button"
            onClick={() => setBet((p) => Math.min(5000, p + 10))}
            className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/50 active:scale-95 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setBet(amt)}
              className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${
                bet === amt
                  ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  : "bg-white/10 text-white/70 border border-white/5"
              }`}
            >
              +{amt}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full">
        <button
          type="button"
          onClick={() => onPlay(bet)}
          className="w-full h-16 rounded-2xl bg-gradient-to-b from-emerald-400 to-emerald-600 text-emerald-950 font-black uppercase tracking-widest text-lg shadow-[0_0_40px_rgba(16,185,129,0.4)] active:scale-[0.98] transition-all"
        >
          Deal Cards
        </button>
      </div>
    </motion.div>
  );
}
