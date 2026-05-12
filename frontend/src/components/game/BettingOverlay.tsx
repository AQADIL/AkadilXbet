"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { BetChoice } from "@/types/game";

const COUNTDOWN_SECONDS = 15;

interface BettingOverlayProps {
  visible: boolean;
  onBetPlaced: (choice: BetChoice) => void;
  onTimeout: () => void;
}

export default function BettingOverlay({
  visible,
  onBetPlaced,
  onTimeout,
}: BettingOverlayProps) {
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) {
      setTimeLeft(COUNTDOWN_SECONDS);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    setTimeLeft(COUNTDOWN_SECONDS);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible, onTimeout]);

  const circumference = 2 * Math.PI * 26;
  const strokeDashoffset = circumference * (1 - timeLeft / COUNTDOWN_SECONDS);
  const isUrgent = timeLeft <= 5;

  const handleBet = (choice: BetChoice) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    onBetPlaced(choice);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-between overflow-hidden"
        >
          <div className="absolute inset-0 bg-black/20" />

          <div className="relative z-10 flex justify-end w-full px-4 pt-5">
            <div className="relative flex items-center justify-center w-14 h-14">
              <svg
                className="absolute inset-0 w-full h-full -rotate-90"
                viewBox="0 0 60 60"
              >
                <circle
                  cx="30" cy="30" r="26"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="3"
                />
                <motion.circle
                  cx="30" cy="30" r="26"
                  fill="none"
                  stroke={isUrgent ? "#f87171" : "#4ade80"}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transition={{ duration: 0.85, ease: "linear" }}
                />
              </svg>
              <span
                className={`text-lg font-black tabular-nums leading-none ${
                  isUrgent ? "text-red-400" : "text-white"
                }`}
              >
                {timeLeft}
              </span>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-3 px-4 select-none pointer-events-none">
            <p className="text-white/50 text-[11px] md:text-xs uppercase tracking-[0.35em] font-semibold">
              Will it be a
            </p>
            <motion.p
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="text-white font-black uppercase leading-none text-[clamp(4rem,20vw,7rem)] tracking-tight drop-shadow-2xl"
              style={{ textShadow: "0 0 60px rgba(74,222,128,0.5), 0 0 120px rgba(74,222,128,0.2)" }}
            >
              GOAL?
            </motion.p>
          </div>

          <div className="relative z-10 w-full px-4 pb-6 flex flex-col gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => handleBet("GOAL")}
              className="h-16 w-full rounded-2xl font-black tracking-widest uppercase text-base transition-all duration-150
                bg-green-500/20 border border-green-400/40 text-green-300
                hover:bg-green-500/30 hover:border-green-400/60
                active:bg-green-500/40
                backdrop-blur-md shadow-lg shadow-green-900/30"
            >
              GOAL
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => handleBet("NO_GOAL")}
              className="h-16 w-full rounded-2xl font-black tracking-widest uppercase text-base transition-all duration-150
                bg-red-500/20 border border-red-400/40 text-red-300
                hover:bg-red-500/30 hover:border-red-400/60
                active:bg-red-500/40
                backdrop-blur-md shadow-lg shadow-red-900/30"
            >
              NO GOAL
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
