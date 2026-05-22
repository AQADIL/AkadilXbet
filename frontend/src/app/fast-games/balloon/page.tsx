"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";
import { useBalance } from "@/hooks/useBalance";
import { getBalloonPopPoint } from "@/lib/rtp";

type Phase = "BETTING" | "PUMPING" | "POPPED" | "CASHED_OUT";

const BET_PRESETS = [10, 25, 50, 100, 200];
const PUMP_RATE = 0.006;
const PUMP_ACCEL = 0.000003;

export default function BalloonPage() {
  const { balance, placeBet, addWinnings } = useBalance();
  const [phase, setPhase] = useState<Phase>("BETTING");
  const [betAmount, setBetAmount] = useState(50);
  const [mult, setMult] = useState(1.0);
  const [cashedAt, setCashedAt] = useState<number | null>(null);
  const [balloonScale, setBalloonScale] = useState(0.6);
  const [wobble, setWobble] = useState(0);

  const rafRef = useRef<number>(0);
  const holdStartRef = useRef<number>(0);
  const lastMultRef = useRef<number>(1.0);
  const popPointRef = useRef<number>(3.0);
  const betRef = useRef<number>(50);
  const holdingRef = useRef<boolean>(false);
  const phaseRef = useRef<Phase>("BETTING");
  const addWinningsRef = useRef(addWinnings);
  useEffect(() => { addWinningsRef.current = addWinnings; }, [addWinnings]);

  const runTick = () => {
    const tick = (now: number) => {
      if (!holdingRef.current) return;
      const elapsed = now - holdStartRef.current;
      const increase = PUMP_RATE * elapsed + 0.5 * PUMP_ACCEL * elapsed * elapsed;
      const newMult = 1.0 + increase / 1000;
      lastMultRef.current = newMult;
      setMult(newMult);
      setBalloonScale(0.6 + Math.min(newMult - 1, 2.5) * 0.2);
      setWobble(Math.sin(elapsed / 160) * 2.5);

      if (newMult >= popPointRef.current) {
        holdingRef.current = false;
        cancelAnimationFrame(rafRef.current);
        setPhase("POPPED");
        phaseRef.current = "POPPED";
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const startPress = () => {
    if (phaseRef.current !== "PUMPING") return;
    holdingRef.current = true;
    // Resume from current mult by offsetting start time
    const offsetMs = ((lastMultRef.current - 1) * 1000) / PUMP_RATE;
    holdStartRef.current = performance.now() - offsetMs;
    runTick();
  };

  const endPress = () => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    cancelAnimationFrame(rafRef.current);
    if (phaseRef.current === "PUMPING") {
      const m = lastMultRef.current;
      addWinningsRef.current(Math.floor(betRef.current * m));
      setCashedAt(m);
      setPhase("CASHED_OUT");
      phaseRef.current = "CASHED_OUT";
    }
  };

  const startGame = () => {
    const bet = Math.min(betAmount, balance);
    if (!placeBet(bet)) return;
    betRef.current = bet;
    popPointRef.current = getBalloonPopPoint(balance - bet);
    lastMultRef.current = 1.0;
    setMult(1.0);
    setBalloonScale(0.6);
    setWobble(0);
    setCashedAt(null);
    setPhase("PUMPING");
    phaseRef.current = "PUMPING";
  };

  const reset = () => {
    cancelAnimationFrame(rafRef.current);
    holdingRef.current = false;
    lastMultRef.current = 1.0;
    setMult(1.0);
    setBalloonScale(0.6);
    setWobble(0);
    setCashedAt(null);
    setPhase("BETTING");
    phaseRef.current = "BETTING";
  };

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const isPopped = phase === "POPPED";
  const isCashedOut = phase === "CASHED_OUT";
  const isPumping = phase === "PUMPING";

  const multRatio = Math.min((mult - 1) / 5, 1);
  const balloonHue = Math.round(140 - multRatio * 140);
  const balloonFill = `hsl(${balloonHue}, 68%, 52%)`;
  const balloonGlow = `hsl(${balloonHue}, 78%, 62%)`;

  return (
    <MobileShell flush>
      <div className="flex flex-col min-h-svh bg-[#05100A]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-2 shrink-0">
          <Link href="/fast-games" className="p-1 text-text-muted hover:text-text-secondary transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 16L7 10L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <span className="text-text-muted text-[11px] uppercase tracking-[0.3em] font-bold">Balloon</span>
          <div className="ml-auto text-text-gold text-xs font-bold">{balance} cr</div>
        </div>

        {/* Scene */}
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden min-h-[280px]">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 25%, #0a2010 0%, #05100A 70%)" }} />

          {/* String */}
          <div
            className="absolute z-10"
            style={{
              width: "2px",
              height: `${balloonScale * 70 + 24}px`,
              bottom: "24%",
              left: "calc(50% - 1px)",
              background: "linear-gradient(to top, #4d7c5f80, transparent)",
              transformOrigin: "bottom center",
              transform: `rotate(${wobble * 0.35}deg)`,
            }}
          />

          {/* Balloon */}
          <motion.div
            className="relative z-10"
            style={{ marginBottom: "14%" }}
            animate={{
              scale: isPopped ? [1.5, 0] : balloonScale,
              rotate: isPopped ? 25 : wobble * 0.35,
            }}
            transition={{
              scale: isPopped ? { duration: 0.22 } : { type: "spring", stiffness: 140, damping: 16 },
              rotate: { duration: 0.08 },
            }}
          >
            <svg viewBox="0 0 120 150" className="w-44 h-44"
              style={{ filter: `drop-shadow(0 0 28px ${balloonGlow}55)` }}>
              <ellipse cx="60" cy="62" rx="50" ry="56" fill={balloonFill} opacity="0.9" />
              <ellipse cx="43" cy="40" rx="13" ry="15" fill="white" opacity="0.18" />
              <ellipse cx="60" cy="119" rx="5" ry="3" fill={balloonFill} opacity="0.8" />
              <line x1="57" y1="119" x2="63" y2="119" stroke={balloonFill} strokeWidth="2" />
              <line x1="60" y1="119" x2="60" y2="136" stroke={balloonFill} strokeWidth="1.5" opacity="0.5" />
            </svg>
            {isPopped && (
              <div className="absolute inset-0 flex items-center justify-center text-5xl">💥</div>
            )}
          </motion.div>

          {/* Multiplier */}
          <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center">
            <div
              className="font-black tabular-nums leading-none"
              style={{
                fontSize: "clamp(2.8rem, 14vw, 4.5rem)",
                color: isPopped ? "#f87171" : isCashedOut ? "#fbbf24" : balloonGlow,
                textShadow: `0 0 30px ${isPopped ? "#f87171" : balloonGlow}55`,
              }}
            >
              {mult.toFixed(2)}×
            </div>
            {isCashedOut && (
              <div className="text-text-gold text-sm font-bold mt-1">
                +{Math.floor(betRef.current * (cashedAt ?? 1))} credits
              </div>
            )}
            {isPopped && (
              <div className="text-red-400 text-sm font-bold mt-1 uppercase tracking-widest">Popped!</div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="shrink-0 px-4 pb-8 pt-3 space-y-3">
          <AnimatePresence mode="wait">
            {phase === "BETTING" && (
              <motion.div key="betting" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="space-y-3">
                <div className="glass rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-text-muted text-[10px] uppercase tracking-widest font-bold">Bet</span>
                    <span className="text-text-gold text-xs font-bold">{betAmount} cr</span>
                  </div>
                  <div className="flex gap-2">
                    {BET_PRESETS.map((amt) => (
                      <button key={amt} onClick={() => setBetAmount(amt)}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                          betAmount === amt
                            ? "bg-brand-primary/20 border border-brand-primary/50 text-brand-glow"
                            : "bg-white/5 text-text-muted border border-transparent"
                        }`}>
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={startGame} disabled={balance < betAmount}
                  className="h-14 w-full rounded-xl bg-brand-primary text-surface-base font-black uppercase tracking-widest text-sm shadow-lg shadow-brand-primary/25 disabled:opacity-40 active:scale-[0.97] transition-transform">
                  Start — {betAmount} credits
                </button>
                <p className="text-center text-text-muted text-xs">Hold the button to inflate · Release to cash out</p>
              </motion.div>
            )}

            {isPumping && (
              <motion.div key="pumping" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <motion.button
                  onPointerDown={startPress}
                  onPointerUp={endPress}
                  onPointerLeave={endPress}
                  whileTap={{ scale: 0.94 }}
                  className="h-20 w-full rounded-2xl font-black uppercase tracking-widest text-xl select-none touch-none"
                  style={{
                    background: `linear-gradient(135deg, ${balloonFill}18, ${balloonFill}38)`,
                    border: `2px solid ${balloonFill}55`,
                    color: balloonGlow,
                    boxShadow: `0 0 24px ${balloonFill}25`,
                  }}
                >
                  Hold to Pump
                </motion.button>
                <p className="text-center text-text-muted text-xs">Release anytime to cash out</p>
              </motion.div>
            )}

            {(isPopped || isCashedOut) && (
              <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <button onClick={reset}
                  className="h-14 w-full rounded-xl glass border border-glass text-text-secondary font-black uppercase tracking-widest text-sm active:scale-[0.97] transition-transform">
                  Play Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MobileShell>
  );
}
