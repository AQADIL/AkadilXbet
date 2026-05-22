"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";
import { authFetch, getUser, WalletDTO } from "@/lib/auth";
import { useBalance } from "@/hooks/useBalance";

const BET_PRESETS = [10, 25, 50, 100, 200];

const SYMBOLS = [
  { label: "7",  color: "#fbbf24", glow: "#fbbf2460", mult: "50×" },
  { label: "◆", color: "#67e8f9", glow: "#67e8f960", mult: "20×" },
  { label: "★", color: "#a78bfa", glow: "#a78bfa60", mult: "10×" },
  { label: "$",  color: "#4ade80", glow: "#4ade8060", mult: "5×"  },
  { label: "♣", color: "#86efac", glow: "#86efac60", mult: "3×"  },
  { label: "♥", color: "#f87171", glow: "#f8717160", mult: "2×"  },
];

// Reel strip — diverse sequence for smooth animation
const STRIP = [0, 3, 5, 1, 4, 2, 5, 3, 0, 4, 1, 2, 5, 0, 3];

type Phase = "IDLE" | "SPINNING" | "RESULT";

function Reel({ index, finalSymbol, spinning, onStop }: {
  index: number; finalSymbol: number; spinning: boolean; onStop: () => void;
}) {
  const [display, setDisplay] = useState(finalSymbol);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onStopRef = useRef(onStop);
  onStopRef.current = onStop;

  useEffect(() => {
    if (!spinning) {
      intervalRef.current && clearInterval(intervalRef.current);
      timeoutRef.current && clearTimeout(timeoutRef.current);
      return;
    }
    let i = 0;
    intervalRef.current = setInterval(() => { i++; setDisplay(STRIP[i % STRIP.length]); }, 70);
    timeoutRef.current = setTimeout(() => {
      intervalRef.current && clearInterval(intervalRef.current);
      setDisplay(finalSymbol);
      onStopRef.current();
    }, 900 + index * 380);

    return () => {
      intervalRef.current && clearInterval(intervalRef.current);
      timeoutRef.current && clearTimeout(timeoutRef.current);
    };
  }, [spinning, finalSymbol, index]);

  const sym = SYMBOLS[display];

  return (
    <div className="relative flex-1 h-24 rounded-2xl flex items-center justify-center overflow-hidden"
      style={{
        background: spinning
          ? `radial-gradient(circle, ${sym.glow}, #0c0c14 60%)`
          : "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        transition: "background 0.15s",
      }}
    >
      {/* Blur overlay while spinning */}
      {spinning && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ backdropFilter: "blur(1px)", background: "rgba(0,0,0,0.15)" }} />
      )}
      <motion.span
        key={`${display}-${spinning}`}
        initial={spinning ? {} : { scale: 0.7, opacity: 0.3 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="font-black select-none leading-none relative z-10"
        style={{
          fontSize: "clamp(2rem, 10vw, 2.8rem)",
          color: sym.color,
          filter: spinning ? "blur(1.5px)" : "none",
          textShadow: !spinning ? `0 0 20px ${sym.glow}` : "none",
          transition: "filter 0.2s, text-shadow 0.2s",
        }}
      >
        {sym.label}
      </motion.span>
    </div>
  );
}

export default function SlotsPage() {
  const localBalance = useBalance();
  const [backendBalance, setBackendBalance] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("IDLE");
  const [betAmount, setBetAmount] = useState(25);
  const [finalSymbols, setFinalSymbols] = useState<[number, number, number]>([3, 4, 5]);
  const [winMult, setWinMult] = useState(0);
  const [payout, setPayout] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stoppedRef = useRef(0);
  const betRef = useRef(25);
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

  const onReelStop = useCallback(() => {
    stoppedRef.current += 1;
    if (stoppedRef.current >= 3) setTimeout(() => setPhase("RESULT"), 250);
  }, []);

  const spin = async () => {
    const bet = Math.min(betAmount, balance);
    if (bet <= 0) return;
    betRef.current = bet;
    stoppedRef.current = 0;
    setError(null);
    setWinMult(0);
    setPayout(0);

    if (!isLoggedIn) {
      if (!localBalance.placeBet(bet)) return;
      const r: [number, number, number] = [Math.floor(Math.random() * 6), Math.floor(Math.random() * 6), Math.floor(Math.random() * 6)];
      if (r[0] === r[1] && r[1] === r[2]) r[2] = (r[2] + 1) % 6;
      setFinalSymbols(r);
      setPhase("SPINNING");
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch("/api/slots/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet_credits: bet }),
      });
      if (!res.ok) {
        setError(((await res.json().catch(() => ({}))) as { message?: string }).message ?? "Error");
        return;
      }
      const d = await res.json();
      setFinalSymbols(d.reels as [number, number, number]);
      setWinMult(d.multiplier ?? 0);
      setPayout(d.payout_credits ?? 0);
      if (d.new_balance_credits != null) setBackendBalance(d.new_balance_credits);
      else fetchWallet();
      setPhase("SPINNING");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  const reset = () => { stoppedRef.current = 0; setPhase("IDLE"); setWinMult(0); setPayout(0); setError(null); };

  const isWin = winMult > 0 && phase === "RESULT";
  const isJackpot = isWin && finalSymbols.every((s) => s === 0);
  const winSym = isWin ? SYMBOLS[finalSymbols[0]] : null;

  return (
    <MobileShell flush>
      <div className="flex flex-col min-h-svh" style={{ background: "#07040F" }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-3 shrink-0">
          <Link href="/casino" className="p-1 text-text-muted hover:text-text-secondary transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 16L7 10L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <span className="text-text-muted text-[11px] uppercase tracking-[0.3em] font-bold">Slots</span>
          <div className="ml-auto flex items-center gap-2">
            {isLoggedIn && (
              <span className="text-green-400 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-green-400/30 bg-green-400/10">
                live
              </span>
            )}
            <span className="text-text-gold text-xs font-bold">{balance} cr</span>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mx-4 mb-2 px-3 py-2 rounded-xl text-red-400 text-xs font-bold"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4">

          {/* Slot Machine */}
          <div className="w-full max-w-sm">
            {/* Jackpot banner */}
            <motion.div
              className="text-center mb-4"
              animate={isJackpot ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.4, repeat: isJackpot ? Infinity : 0 }}
            >
              <div className="text-[9px] uppercase tracking-[0.3em] font-bold text-purple-300/40 mb-0.5">Jackpot</div>
              <div className="font-black text-2xl tabular-nums"
                style={{ color: isJackpot ? "#fbbf24" : "#a78bfa", textShadow: isJackpot ? "0 0 30px #fbbf2460" : "none" }}>
                {(betAmount * 50).toLocaleString()} cr
              </div>
            </motion.div>

            {/* Machine frame */}
            <div className="rounded-3xl p-1"
              style={{
                background: isWin
                  ? `linear-gradient(135deg, ${winSym?.color}30, transparent 60%)`
                  : "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(167,139,250,0.05))",
                boxShadow: isWin
                  ? `0 0 40px ${winSym?.glow}, 0 8px 32px rgba(0,0,0,0.6)`
                  : "0 0 40px rgba(167,139,250,0.06), 0 8px 32px rgba(0,0,0,0.6)",
                transition: "all 0.5s",
              }}
            >
              <div className="rounded-[20px] p-4"
                style={{ background: "linear-gradient(160deg, #14082a 0%, #0a0517 100%)", border: "1px solid rgba(167,139,250,0.15)" }}>

                {/* Reels */}
                <div className="flex gap-2 mb-4">
                  {([0, 1, 2] as const).map((i) => (
                    <Reel
                      key={i}
                      index={i}
                      finalSymbol={finalSymbols[i]}
                      spinning={phase === "SPINNING"}
                      onStop={onReelStop}
                    />
                  ))}
                </div>

                {/* Win line dots */}
                <div className="flex justify-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      animate={isWin ? {
                        backgroundColor: ["#fbbf24", "#ffffff", "#fbbf24"],
                        boxShadow: ["0 0 6px #fbbf2480", "0 0 12px #ffffff80", "0 0 6px #fbbf2480"],
                      } : { backgroundColor: "#1a1433", boxShadow: "none" }}
                      transition={{ duration: 0.8, delay: i * 0.12, repeat: isWin ? Infinity : 0 }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Paytable */}
            <div className="mt-4 grid grid-cols-3 gap-1.5">
              {SYMBOLS.map((sym, i) => (
                <div key={i} className="flex items-center justify-between px-2.5 py-1.5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="font-black text-sm" style={{ color: sym.color }}>{sym.label}</span>
                  <span className="text-[10px] font-black" style={{ color: sym.color }}>{sym.mult}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Result card */}
          <AnimatePresence>
            {phase === "RESULT" && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="w-full max-w-sm rounded-2xl p-5 text-center"
                style={
                  isWin
                    ? { background: `${winSym?.glow}20`, border: `1px solid ${winSym?.color}40` }
                    : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }
                }
              >
                {isJackpot && (
                  <div className="text-text-gold text-xs font-black uppercase tracking-[0.3em] mb-2">🎰 Jackpot!</div>
                )}
                {isWin ? (
                  <>
                    <div className="font-black text-4xl" style={{ color: winSym?.color, textShadow: `0 0 20px ${winSym?.glow}` }}>
                      +{payout} cr
                    </div>
                    <div className="text-xs mt-1.5 font-bold opacity-60" style={{ color: winSym?.color }}>
                      {winMult}× multiplier
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-text-muted font-black text-2xl">No win</div>
                    <div className="text-text-muted/50 text-xs mt-1">Try again</div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="shrink-0 px-4 pb-8 pt-3 space-y-3">
          {/* Bet picker */}
          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-text-muted text-[10px] uppercase tracking-widest font-bold">Bet per spin</span>
              <span className="text-text-gold text-xs font-black">{betAmount} cr</span>
            </div>
            <div className="flex gap-1.5">
              {BET_PRESETS.map((amt) => (
                <button key={amt} onClick={() => setBetAmount(amt)} disabled={phase === "SPINNING"}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all disabled:opacity-40"
                  style={betAmount === amt
                    ? { background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.4)", color: "#a78bfa" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid transparent", color: "#6b7280" }
                  }
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Spin button */}
          <AnimatePresence mode="wait">
            {phase !== "SPINNING" ? (
              <motion.button
                key="spin"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                onClick={phase === "RESULT" ? () => { reset(); setTimeout(spin, 60); } : spin}
                disabled={balance < betAmount || loading}
                whileTap={{ scale: 0.97 }}
                className="h-14 w-full rounded-xl font-black uppercase tracking-widest text-sm text-white disabled:opacity-40 transition-all"
                style={{
                  background: "linear-gradient(135deg, #6d28d9, #4c1d95)",
                  boxShadow: "0 0 28px rgba(109,40,217,0.4)",
                }}
              >
                {loading ? "Loading…" : phase === "RESULT" ? "Spin Again" : `Spin — ${betAmount} credits`}
              </motion.button>
            ) : (
              <motion.div
                key="spinning"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-14 w-full rounded-xl flex items-center justify-center font-bold uppercase tracking-widest text-sm"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#6b7280" }}
              >
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                >
                  Spinning…
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MobileShell>
  );
}
