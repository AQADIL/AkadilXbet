"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  formatCredits,
  getBalloonBalance,
  getBalloonSession,
  placeBalloonBet,
  pumpBalloon,
  releaseBalloon,
  type BalloonSession,
} from "@/lib/gameApi";

const BET_AMOUNT = 500;

export default function BalloonGame() {
  const [session, setSession] = useState<BalloonSession | null>(null);
  const [balance, setBalance] = useState(100_000);
  const [holding, setHolding] = useState(false);
  const [message, setMessage] = useState("");
  const pumpRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([getBalloonSession(), getBalloonBalance()]);
      setSession(s);
      setBalance(b.balance_cents);
    } catch {
      /* offline */
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const startPump = useCallback(async () => {
    if (session?.status !== "active") {
      setMessage("");
      try {
        const res = await placeBalloonBet(BET_AMOUNT);
        setSession(res.session);
        setBalance(res.balance_cents);
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Start failed");
        return;
      }
    }
    setHolding(true);
    pumpRef.current = setInterval(async () => {
      try {
        const res = await pumpBalloon();
        setSession(res.session);
        if (res.popped) {
          setHolding(false);
          if (pumpRef.current) clearInterval(pumpRef.current);
          setMessage("Popped! You held too long.");
        }
      } catch {
        /* ignore tick errors */
      }
    }, 150);
  }, [session?.status]);

  const stopPump = useCallback(async () => {
    setHolding(false);
    if (pumpRef.current) {
      clearInterval(pumpRef.current);
      pumpRef.current = null;
    }
    if (session?.status !== "active") return;
    try {
      const res = await releaseBalloon();
      setSession(res.session);
      setBalance(res.balance_cents);
      setMessage(`Released ${res.multiplier.toFixed(2)}x — +${formatCredits(res.payout_cents)}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Release failed");
    }
  }, [session?.status]);

  useEffect(() => () => {
    if (pumpRef.current) clearInterval(pumpRef.current);
  }, []);

  const mult = session?.current_multiplier ?? 1;
  const scale = 0.6 + Math.min(mult, 10) * 0.08;
  const popped = session?.status === "popped";

  return (
    <div className="relative w-full h-[calc(100svh-4rem)] overflow-hidden bg-surface-base flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 z-10">
        <span className="text-[10px] uppercase tracking-[0.35em] text-text-muted font-semibold">
          Balloon
        </span>
        <span className="glass px-3 py-1 rounded-full text-xs text-text-gold font-bold tabular-nums">
          {formatCredits(balance)}
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
          {holding ? "Pumping…" : "Hold to inflate · Release to cash out"}
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

        <motion.button
          onPointerDown={startPump}
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
