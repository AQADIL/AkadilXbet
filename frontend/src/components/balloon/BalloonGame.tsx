"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCredits } from "@/lib/gameApi";

const INITIAL_CENTS = 100_000; // 1000 credits
const PUMP_MS = 150;
const MULT_PER_TICK = 0.06;

function genCrashAt(): number {
  const r = Math.random();
  return 1.1 + r * r * 11; // skewed towards lower values, up to ~12x
}

export default function BalloonGame() {
  const [balanceCents, setBalanceCents] = useState(INITIAL_CENTS);
  const [status, setStatus] = useState<"idle" | "active" | "popped" | "released">("idle");
  const [mult, setMult] = useState(1.0);
  const [holding, setHolding] = useState(false);
  const [message, setMessage] = useState("");
  const [customBet, setCustomBet] = useState("5.00");

  const multRef = useRef(1.0);
  const statusRef = useRef<"idle" | "active" | "popped" | "released">("idle");
  const crashAtRef = useRef(0);
  const betCentsRef = useRef(0);
  const balanceCentsRef = useRef(INITIAL_CENTS);
  const pumpRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { balanceCentsRef.current = balanceCents; }, [balanceCents]);

  const clearPump = useCallback(() => {
    if (pumpRef.current) { clearInterval(pumpRef.current); pumpRef.current = null; }
  }, []);

  useEffect(() => () => clearPump(), [clearPump]);

  const doStartBet = useCallback((cents: number): boolean => {
    if (cents <= 0) { setMessage("Введите корректную сумму"); return false; }
    if (cents > balanceCentsRef.current) { setMessage("Недостаточно средств"); return false; }
    balanceCentsRef.current -= cents;
    setBalanceCents(prev => prev - cents);
    betCentsRef.current = cents;
    multRef.current = 1.0;
    setMult(1.0);
    crashAtRef.current = genCrashAt();
    statusRef.current = "active";
    setStatus("active");
    setMessage("");
    return true;
  }, []);

  const doPump = useCallback(() => {
    const next = parseFloat((multRef.current + MULT_PER_TICK).toFixed(3));
    multRef.current = next;
    setMult(next);
    if (next >= crashAtRef.current) {
      clearPump();
      statusRef.current = "popped";
      setStatus("popped");
      setHolding(false);
      setMessage("Лопнул! Держали слишком долго.");
    }
  }, [clearPump]);

  const startPump = useCallback((cents: number) => {
    setMessage("");
    if (statusRef.current !== "active") {
      const ok = doStartBet(cents);
      if (!ok) return;
    }
    setHolding(true);
    clearPump();
    pumpRef.current = setInterval(doPump, PUMP_MS);
  }, [doStartBet, doPump, clearPump]);

  const stopPump = useCallback(() => {
    clearPump();
    setHolding(false);
    if (statusRef.current !== "active") return;
    const payout = Math.round(betCentsRef.current * multRef.current);
    balanceCentsRef.current += payout;
    setBalanceCents(prev => prev + payout);
    statusRef.current = "released";
    setStatus("released");
    setMessage(`Выведено ${multRef.current.toFixed(2)}x — +${formatCredits(payout)}`);
  }, [clearPump]);

  const popped = status === "popped";
  const scale = 0.6 + Math.min(mult, 10) * 0.08;

  return (
    <div className="relative w-full h-[calc(100svh-4rem)] overflow-hidden bg-surface-base flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 z-10">
        <span className="text-[10px] uppercase tracking-[0.35em] text-text-muted font-semibold">
          Balloon
        </span>
        <span className="glass px-3 py-1 rounded-full text-xs text-text-gold font-bold tabular-nums">
          {formatCredits(balanceCents)}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative">
        <motion.div
          animate={{ scale: holding ? scale * 1.05 : scale }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
          className="relative"
        >
          <div
            className={`w-32 h-40 rounded-full border-2 ${
              popped
                ? "border-red-400/50 bg-red-500/10"
                : "border-brand-glow/40 bg-brand-primary/15"
            }`}
            style={{
              boxShadow: popped
                ? "0 0 40px rgba(248,113,113,0.4)"
                : "0 0 60px rgba(74,222,128,0.35), inset 0 8px 24px rgba(74,222,128,0.15)",
              clipPath: "ellipse(45% 50% at 50% 45%)",
            }}
          />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-16 bg-text-muted/40" />
        </motion.div>

        <p className="mt-8 text-brutalist text-4xl text-brand-glow glow-green tabular-nums">
          {mult.toFixed(2)}x
        </p>
        <p className="text-[10px] uppercase tracking-widest text-text-muted mt-2">
          {holding ? "Накачивается…" : "Удерживайте · Отпустите для вывода"}
        </p>
      </div>

      <div className="px-4 pb-6 z-10 flex flex-col gap-3">
        <AnimatePresence>
          {message && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-xs text-text-secondary glass rounded-lg py-2"
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={customBet}
            onChange={(e) => setCustomBet(e.target.value)}
            className="flex-1 glass px-3 py-2 rounded-lg text-sm text-text-primary"
            placeholder="Amount"
          />
          <button
            onClick={() => {
              const val = Math.max(0.01, parseFloat(customBet || "0")) || 0.01;
              startPump(Math.round(val * 100));
            }}
            className="h-10 px-4 rounded-lg bg-brand-glow text-surface-base font-semibold"
          >
            Bet
          </button>
        </div>

        <motion.button
          onPointerDown={() => {
            const val = Math.max(0.01, parseFloat(customBet || "0")) || 0.01;
            startPump(Math.round(val * 100));
          }}
          onPointerUp={stopPump}
          onPointerLeave={() => holding && stopPump()}
          whileTap={{ scale: 0.96 }}
          className={`h-20 rounded-2xl font-black text-brutalist text-lg tracking-widest uppercase select-none touch-none ${
            holding
              ? "bg-brand-glow text-surface-base shadow-lg shadow-brand-glow/30"
              : "glass text-brand-glow border border-glass"
          }`}
        >
          {holding ? "Release" : "Hold & Pump"}
        </motion.button>
      </div>
    </div>
  );
}
