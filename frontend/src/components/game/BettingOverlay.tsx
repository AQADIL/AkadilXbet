"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, XCircle, Coins } from "lucide-react";
import type { BetChoice, VideoClip } from "@/types/game";

const COUNTDOWN_SECONDS = 15;
const QUICK_AMOUNTS = [50, 100, 250, 500];

interface BettingOverlayProps {
  clip: VideoClip;
  visible: boolean;
  onBetPlaced: (choice: BetChoice, amount: number) => void;
  onTimeout: () => void;
}

export default function BettingOverlay({
  clip,
  visible,
  onBetPlaced,
  onTimeout,
}: BettingOverlayProps) {
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const [amount, setAmount] = useState(100);
  const [inputValue, setInputValue] = useState("100");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) {
      setTimeLeft(COUNTDOWN_SECONDS);
      setAmount(100);
      setInputValue("100");
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

  const progress = timeLeft / COUNTDOWN_SECONDS;
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference * (1 - progress);

  const handleAmountInput = (val: string) => {
    setInputValue(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) setAmount(parsed);
  };

  const handleBet = (choice: BetChoice) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    onBetPlaced(choice, amount);
  };

  const odds = (choice: BetChoice) =>
    choice === "GOAL" ? clip.oddsGoal : clip.oddsNoGoal;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 rounded-xl overflow-hidden"
        >
          <div className="absolute inset-0 backdrop-blur-xl bg-[#08140C]/70 rounded-xl" />

          <div className="relative z-10 w-full max-w-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
                  24/7 Bets
                </span>
                <span className="text-text-secondary text-sm font-semibold">
                  {clip.label}
                </span>
              </div>

              <div className="relative flex items-center justify-center w-16 h-16">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="rgba(74,222,128,0.15)"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke={timeLeft <= 5 ? "#ef4444" : "#4ade80"}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transition={{ duration: 0.9, ease: "linear" }}
                  />
                </svg>
                <span
                  className={`text-xl font-black tabular-nums ${
                    timeLeft <= 5 ? "text-red-400" : "text-brand-glow"
                  }`}
                >
                  {timeLeft}
                </span>
              </div>
            </div>

            <div className="glass rounded-xl p-4 text-center border border-white/10 shadow-2xl">
              <p className="text-text-muted text-xs uppercase tracking-widest mb-1">
                Will it be a
              </p>
              <p className="text-brutalist-xl text-[clamp(2rem,8vw,2.5rem)] text-text-primary leading-none">
                GOAL?
              </p>
            </div>

            <div className="glass rounded-xl p-3 flex flex-col gap-2 border border-white/10">
              <div className="flex items-center gap-2">
                <Coins size={14} className="text-text-gold shrink-0" />
                <span className="text-xs text-text-muted uppercase tracking-widest">
                  Bet Amount
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={10}
                  value={inputValue}
                  onChange={(e) => handleAmountInput(e.target.value)}
                  className="flex-1 bg-surface-raised border border-border-subtle rounded-lg px-3 h-10 text-text-primary text-sm font-bold focus:outline-none focus:border-brand-primary"
                />
                <div className="flex gap-1">
                  {QUICK_AMOUNTS.map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setAmount(q);
                        setInputValue(String(q));
                      }}
                      className={`h-10 px-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                        amount === q
                          ? "bg-brand-primary text-surface-base"
                          : "bg-surface-raised text-text-muted hover:text-text-secondary"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleBet("GOAL")}
                className="flex flex-col items-center justify-center gap-1 h-16 rounded-xl bg-brand-primary text-surface-base font-black text-brutalist text-sm tracking-widest uppercase shadow-lg shadow-brand-primary/30 active:bg-brand-glow transition-colors duration-150"
              >
                <Target size={18} strokeWidth={2.5} />
                <span>Goal</span>
                <span className="text-[10px] font-semibold opacity-75">
                  x{odds("GOAL").toFixed(2)}
                </span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleBet("NO_GOAL")}
                className="flex flex-col items-center justify-center gap-1 h-16 rounded-xl glass border border-white/10 text-text-primary font-black text-brutalist text-sm tracking-widest uppercase transition-colors duration-150 hover:border-red-500/40 active:bg-red-950/30"
              >
                <XCircle size={18} strokeWidth={2.5} />
                <span>No Goal</span>
                <span className="text-[10px] font-semibold opacity-75">
                  x{odds("NO_GOAL").toFixed(2)}
                </span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
