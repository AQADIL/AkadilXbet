"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";
import { useBalance } from "@/hooks/useBalance";
import { authFetch, getUser, WalletDTO } from "@/lib/auth";
import { getRouletteBulletChamber } from "@/lib/rtp";

const BET_PRESETS = [25, 50, 100, 200, 500];

// Multipliers for each safe pull (1st, 2nd, 3rd, 4th, 5th)
const PULL_MULTIPLIERS = [1.2, 1.5, 2.0, 3.0, 5.0];

// Chamber positions in SVG (center x,y for 6 chambers around a circle)
const CHAMBER_ANGLE = (i: number) => ((i * 60 - 90) * Math.PI) / 180;
const CYLINDER_R = 40;
const CYLINDER_CX = 60;
const CYLINDER_CY = 60;

function ChamberDot({ idx, bullet, current, pulled }: {
  idx: number; bullet: number; current: number; pulled: number[];
}) {
  const angle = CHAMBER_ANGLE(idx);
  const x = CYLINDER_CX + CYLINDER_R * Math.cos(angle);
  const y = CYLINDER_CY + CYLINDER_R * Math.sin(angle);
  const isEmpty = pulled.includes(idx);
  const isBullet = idx === bullet;
  const isCurrent = idx === current;

  return (
    <circle
      cx={x}
      cy={y}
      r={isCurrent ? 9 : 7}
      fill={
        isEmpty
          ? "#1a1a1a"
          : isBullet && isEmpty
          ? "#1a1a1a"
          : "#374151"
      }
      stroke={
        isCurrent
          ? "#fbbf24"
          : isEmpty
          ? "#374151"
          : "#6b7280"
      }
      strokeWidth={isCurrent ? 2 : 1}
      opacity={isEmpty ? 0.3 : 1}
    >
      {isBullet && !isEmpty && (
        <title>Bullet</title>
      )}
    </circle>
  );
}

type Phase = "BETTING" | "PLAYING" | "SHOT" | "SURVIVED" | "COLLECTED";

export default function RoulettePage() {
  const localBalance = useBalance();
  const [backendBalance, setBackendBalance] = useState<number | null>(null);
  const isLoggedIn = !!getUser();
  const balance = isLoggedIn ? (backendBalance ?? 0) : localBalance.balance;

  const fetchWallet = useCallback(() => {
    if (!isLoggedIn) return;
    authFetch("/api/auth/wallet")
      .then((r) => r.json())
      .then((d: WalletDTO) => setBackendBalance(Math.floor(d.balance_cents / 100)))
      .catch(() => {});
  }, [isLoggedIn]);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  const placeBet = useCallback((amount: number): boolean => {
    if (isLoggedIn) {
      if ((backendBalance ?? 0) < amount) return false;
      setBackendBalance((prev) => (prev ?? 0) - amount);
      return true;
    }
    return localBalance.placeBet(amount);
  }, [isLoggedIn, backendBalance, localBalance]);

  const addWinnings = useCallback((amount: number) => {
    if (isLoggedIn) {
      setBackendBalance((prev) => (prev ?? 0) + amount);
      fetchWallet();
    } else {
      localBalance.addWinnings(amount);
    }
  }, [isLoggedIn, fetchWallet, localBalance]);

  const [phase, setPhase] = useState<Phase>("BETTING");
  const [betAmount, setBetAmount] = useState(50);
  const [bulletChamber, setBulletChamber] = useState(0);
  const [currentChamber, setCurrentChamber] = useState(0);
  const [pulledChambers, setPulledChambers] = useState<number[]>([]);
  const [pullCount, setPullCount] = useState(0); // 0-based: 0 = first pull
  const [spinning, setSpinning] = useState(false);
  const [showBullet, setShowBullet] = useState(false);
  const [cylinderRotation, setCylinderRotation] = useState(0);
  const betRef = useRef(50);
  const bulletRef = useRef(0);
  const currentChamberRef = useRef(0);
  const pullCountRef = useRef(0);

  const startGame = () => {
    const bet = Math.min(betAmount, balance);
    if (!placeBet(bet)) return;
    betRef.current = bet;
    const bullet = getRouletteBulletChamber(balance - bet);
    bulletRef.current = bullet;
    setBulletChamber(bullet);
    setCurrentChamber(0);
    currentChamberRef.current = 0;
    setPulledChambers([]);
    setPullCount(0);
    pullCountRef.current = 0;
    setShowBullet(false);
    setPhase("PLAYING");
  };

  const pullTrigger = () => {
    if (phase !== "PLAYING" || spinning) return;
    setSpinning(true);

    // Animate cylinder spin
    setCylinderRotation((prev) => prev + 60 + Math.floor(Math.random() * 360));

    setTimeout(() => {
      setSpinning(false);
      const chamber = currentChamberRef.current;
      const bullet = bulletRef.current;

      if (chamber === bullet) {
        // BANG
        setShowBullet(true);
        setPulledChambers((prev) => [...prev, chamber]);
        setPhase("SHOT");
      } else {
        // Safe
        const nextPull = pullCountRef.current + 1;
        pullCountRef.current = nextPull;
        setPullCount(nextPull);
        setPulledChambers((prev) => [...prev, chamber]);

        const nextChamber = (chamber + 1) % 6;
        currentChamberRef.current = nextChamber;
        setCurrentChamber(nextChamber);

        if (nextPull >= 5) {
          // Survived all 5 — auto-collect with 5x
          const mult = PULL_MULTIPLIERS[4];
          const win = Math.floor(betRef.current * mult);
          addWinnings(win);
          setPhase("COLLECTED");
        } else {
          setPhase("SURVIVED");
          setTimeout(() => {
            if (pullCountRef.current < 5) setPhase("PLAYING");
          }, 400);
        }
      }
    }, 800);
  };

  const collect = () => {
    if (phase !== "PLAYING" && phase !== "SURVIVED") return;
    const pull = pullCountRef.current;
    if (pull === 0) {
      // Pulled zero times, refund bet
      addWinnings(betRef.current);
      setPhase("COLLECTED");
      return;
    }
    const mult = PULL_MULTIPLIERS[Math.min(pull - 1, 4)];
    const win = Math.floor(betRef.current * mult);
    addWinnings(win);
    setPhase("COLLECTED");
  };

  const reset = () => {
    setPhase("BETTING");
    setBulletChamber(0);
    setCurrentChamber(0);
    setPulledChambers([]);
    setPullCount(0);
    setShowBullet(false);
    setCylinderRotation(0);
  };

  const currentMult = pullCount > 0 ? PULL_MULTIPLIERS[Math.min(pullCount - 1, 4)] : 1;
  const nextMult = PULL_MULTIPLIERS[Math.min(pullCount, 4)];
  const isShot = phase === "SHOT";
  const isCollected = phase === "COLLECTED";
  const isPlaying = phase === "PLAYING" || phase === "SURVIVED";

  return (
    <MobileShell flush>
      <div className="flex flex-col min-h-svh" style={{ background: "#0A0505" }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-2 shrink-0">
          <Link href="/casino" className="p-1 text-text-muted hover:text-text-secondary transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 16L7 10L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <span className="text-text-muted text-[11px] uppercase tracking-[0.3em] font-bold">Russian Roulette</span>
          <div className="ml-auto flex items-center gap-2">
            {isLoggedIn && (
              <span className="text-green-400 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-green-400/30 bg-green-400/10">
                live
              </span>
            )}
            <span className="text-text-gold text-xs font-bold">{balance} cr</span>
          </div>
        </div>

        {/* Revolver scene */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          {/* Cylinder */}
          <div className="flex flex-col items-center gap-2">
            <motion.svg
              viewBox="0 0 120 120"
              className="w-52 h-52"
              animate={{ rotate: cylinderRotation }}
              transition={{ duration: 0.7, ease: [0.25, 0, 0.3, 1] }}
              style={{ filter: "drop-shadow(0 0 20px rgba(239,68,68,0.2))" }}
            >
              {/* Cylinder body */}
              <circle cx="60" cy="60" r="52" fill="#111" stroke="#374151" strokeWidth="2" />
              <circle cx="60" cy="60" r="48" fill="#0d0d0d" stroke="#1f2937" strokeWidth="1" />

              {/* Chambers */}
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const angle = CHAMBER_ANGLE(i);
                const x = CYLINDER_CX + CYLINDER_R * Math.cos(angle);
                const y = CYLINDER_CY + CYLINDER_R * Math.sin(angle);
                const isEmpty = pulledChambers.includes(i);
                const isCurrent = i === currentChamber && (phase === "PLAYING" || phase === "SURVIVED");
                const isBulletRevealed = showBullet && i === bulletChamber;

                return (
                  <g key={i}>
                    <circle
                      cx={x} cy={y} r={8}
                      fill={isEmpty ? "#1a1a1a" : "#252525"}
                      stroke={isCurrent ? "#fbbf24" : isBulletRevealed ? "#ef4444" : "#4b5563"}
                      strokeWidth={isCurrent ? 2.5 : 1.5}
                    />
                    {isBulletRevealed && (
                      <circle cx={x} cy={y} r={4} fill="#ef4444" opacity="0.9" />
                    )}
                    {isEmpty && !isBulletRevealed && (
                      <circle cx={x} cy={y} r={3} fill="#111" />
                    )}
                  </g>
                );
              })}

              {/* Center pin */}
              <circle cx="60" cy="60" r="8" fill="#1a1a1a" stroke="#374151" strokeWidth="1.5" />
              <circle cx="60" cy="60" r="3" fill="#374151" />
            </motion.svg>

            {/* Pull indicator */}
            {(phase === "PLAYING" || phase === "SURVIVED") && (
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black transition-all duration-300"
                    style={{
                      background: i < pullCount ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.05)",
                      border: i < pullCount ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(255,255,255,0.1)",
                      color: i < pullCount ? "#4ade80" : "#4d7c5f",
                    }}
                  >
                    {PULL_MULTIPLIERS[i]}×
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <AnimatePresence mode="wait">
            {phase === "BETTING" && (
              <motion.div
                key="start-info"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-1"
              >
                <p className="text-text-secondary text-sm font-bold">1 bullet · 6 chambers</p>
                <p className="text-text-muted text-xs">Survive 5 pulls for 5× your bet</p>
              </motion.div>
            )}

            {isShot && (
              <motion.div
                key="shot"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-2"
              >
                <div className="text-6xl">💀</div>
                <div className="text-red-400 font-black text-2xl uppercase tracking-widest">Bang!</div>
                <div className="text-text-muted text-sm">
                  Lost {betRef.current} credits
                </div>
              </motion.div>
            )}

            {isCollected && (
              <motion.div
                key="collected"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-2"
              >
                <div className="text-text-gold font-black text-3xl">
                  +{Math.floor(betRef.current * (pullCount > 0 ? PULL_MULTIPLIERS[Math.min(pullCount - 1, 4)] : 1))} cr
                </div>
                <div className="text-text-gold/70 text-sm uppercase tracking-wider">
                  {pullCount} safe pull{pullCount !== 1 ? "s" : ""}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="shrink-0 px-4 pb-8 pt-3 space-y-3">
          <AnimatePresence mode="wait">
            {phase === "BETTING" && (
              <motion.div key="betting" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                <div className="glass rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-text-muted text-[10px] uppercase tracking-widest font-bold">Bet</span>
                    <span className="text-text-gold text-xs font-bold">{betAmount} cr</span>
                  </div>
                  <div className="flex gap-2">
                    {BET_PRESETS.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setBetAmount(amt)}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                          betAmount === amt
                            ? "bg-red-500/20 border border-red-400/50 text-red-300"
                            : "bg-white/5 text-text-muted border border-transparent"
                        }`}
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={startGame}
                  disabled={balance < betAmount}
                  className="h-14 w-full rounded-xl font-black uppercase tracking-widest text-sm disabled:opacity-40 active:scale-[0.97] transition-transform"
                  style={{
                    background: "linear-gradient(135deg, #7f1d1d, #450a0a)",
                    border: "1px solid rgba(239,68,68,0.4)",
                    color: "#fca5a5",
                    boxShadow: "0 0 24px rgba(239,68,68,0.2)",
                  }}
                >
                  Load & Spin — {betAmount} credits
                </button>
              </motion.div>
            )}

            {(phase === "PLAYING" || phase === "SURVIVED") && (
              <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {/* Current standing */}
                {pullCount > 0 && (
                  <div className="glass rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="text-text-muted text-[10px] uppercase tracking-widest">Current win</div>
                      <div className="text-brand-glow font-black text-lg">
                        {Math.floor(betRef.current * currentMult)} cr
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-text-muted text-[10px] uppercase tracking-widest">Next pull</div>
                      <div className="text-text-secondary font-black text-lg">{nextMult}×</div>
                    </div>
                  </div>
                )}

                <motion.button
                  onClick={pullTrigger}
                  disabled={spinning}
                  whileTap={{ scale: 0.94 }}
                  className="h-16 w-full rounded-xl font-black uppercase tracking-widest text-lg disabled:opacity-50"
                  style={{
                    background: spinning
                      ? "rgba(239,68,68,0.1)"
                      : "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.35))",
                    border: "2px solid rgba(239,68,68,0.5)",
                    color: "#f87171",
                    boxShadow: "0 0 24px rgba(239,68,68,0.2)",
                  }}
                  animate={
                    !spinning
                      ? {
                          boxShadow: [
                            "0 0 16px rgba(239,68,68,0.15)",
                            "0 0 32px rgba(239,68,68,0.35)",
                            "0 0 16px rgba(239,68,68,0.15)",
                          ],
                        }
                      : {}
                  }
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {spinning ? "Spinning..." : "Pull Trigger"}
                </motion.button>

                {pullCount > 0 && (
                  <button
                    onClick={collect}
                    disabled={spinning}
                    className="h-12 w-full rounded-xl glass border border-brand-glow/30 text-brand-glow font-black uppercase tracking-widest text-sm disabled:opacity-40 active:scale-[0.97] transition-transform"
                  >
                    Collect {Math.floor(betRef.current * currentMult)} credits
                  </button>
                )}
              </motion.div>
            )}

            {(isShot || isCollected) && (
              <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <button
                  onClick={reset}
                  className="h-14 w-full rounded-xl glass border border-glass text-text-secondary font-black uppercase tracking-widest text-sm active:scale-[0.97] transition-transform"
                >
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
