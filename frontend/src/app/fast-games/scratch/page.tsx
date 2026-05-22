"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";
import { authFetch, getUser } from "@/lib/auth";
import { useBalance } from "@/hooks/useBalance";
import { WalletDTO } from "@/lib/auth";

const BET_PRESETS = [10, 25, 50, 100];

const SYMBOLS = [
  { label: "◆", color: "#67e8f9", glow: "#67e8f940", mult: "10×" },
  { label: "7",  color: "#fbbf24", glow: "#fbbf2440", mult: "8×"  },
  { label: "★", color: "#a78bfa", glow: "#a78bfa40", mult: "5×"  },
  { label: "$",  color: "#4ade80", glow: "#4ade8040", mult: "3×"  },
  { label: "♣", color: "#86efac", glow: "#86efac40", mult: "2×"  },
  { label: "♥", color: "#f87171", glow: "#f8717140", mult: "1.5×"},
];
const MULTIPLIERS = [10, 8, 5, 3, 2, 1.5];

type Phase = "BETTING" | "SCRATCHING" | "REVEALED";

function ScratchTile({
  symbol,
  winLine,
  onReveal,
  allRevealed,
}: {
  symbol: number;
  winLine: boolean;
  onReveal: () => void;
  allRevealed: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const revealedRef = useRef(false);
  const isDrawingRef = useRef(false);
  const sym = SYMBOLS[symbol];

  useEffect(() => {
    revealedRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.globalCompositeOperation = "source-over";

    // Silver scratch layer
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#3d3d3d");
    grad.addColorStop(0.4, "#5a5a5a");
    grad.addColorStop(0.6, "#484848");
    grad.addColorStop(1, "#333333");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid texture
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 8) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 8) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // "SCRATCH" label
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SCRATCH", canvas.width / 2, canvas.height / 2);
  }, [symbol]);

  useEffect(() => {
    if (!allRevealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
  }, [allRevealed]);

  const scratch = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) * canvas.width) / rect.width;
      const y = ((e.clientY - rect.top) * canvas.height) / rect.height;

      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();

      if (!revealedRef.current) {
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let transparent = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] < 64) transparent++;
        if (transparent / (canvas.width * canvas.height) > 0.5) {
          revealedRef.current = true;
          onReveal();
        }
      }
    },
    [onReveal]
  );

  return (
    <motion.div
      animate={winLine ? { scale: [1, 1.04, 1] } : {}}
      transition={{ duration: 0.5, repeat: winLine ? Infinity : 0, repeatDelay: 0.8 }}
      className="relative rounded-2xl overflow-hidden aspect-square"
      style={{
        background: `radial-gradient(circle at 40% 35%, ${sym.glow}, #0a0a0a 70%)`,
        border: winLine ? `1.5px solid ${sym.color}80` : "1.5px solid rgba(255,255,255,0.06)",
        boxShadow: winLine ? `0 0 18px ${sym.glow}` : "none",
      }}
    >
      {/* Symbol */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black leading-none select-none" style={{ fontSize: "clamp(1.6rem, 8vw, 2.2rem)", color: sym.color }}>
          {sym.label}
        </span>
        <span className="text-[8px] font-bold tracking-wider mt-0.5 select-none" style={{ color: sym.color, opacity: 0.6 }}>
          {sym.mult}
        </span>
      </div>

      {/* Scratch canvas */}
      <canvas
        ref={canvasRef}
        width={80}
        height={80}
        className="absolute inset-0 w-full h-full touch-none"
        onPointerDown={(e) => { isDrawingRef.current = true; e.currentTarget.setPointerCapture(e.pointerId); scratch(e); }}
        onPointerMove={scratch}
        onPointerUp={() => { isDrawingRef.current = false; }}
        onPointerLeave={() => { isDrawingRef.current = false; }}
        style={{
          cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Ccircle cx='14' cy='14' r='12' fill='%23fbbf24' opacity='0.85'/%3E%3Ccircle cx='14' cy='14' r='5' fill='%23f59e0b'/%3E%3C/svg%3E") 14 14, crosshair`,
        }}
      />
    </motion.div>
  );
}

export default function ScratchPage() {
  const localBalance = useBalance();
  const [backendBalance, setBackendBalance] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("BETTING");
  const [betAmount, setBetAmount] = useState(25);
  const [symbols, setSymbols] = useState<number[]>([]);
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const [winMult, setWinMult] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [allRevealed, setAllRevealed] = useState(false);
  const [payout, setPayout] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const startScratch = async () => {
    const bet = Math.min(betAmount, balance);
    if (bet <= 0) return;
    betRef.current = bet;
    setError(null);

    if (!isLoggedIn) {
      if (!localBalance.placeBet(bet)) return;
      setSymbols(Array.from({ length: 9 }, () => Math.floor(Math.random() * 6)));
      setWinLine(null); setWinMult(0); setRevealedCount(0); setAllRevealed(false); setPayout(0);
      setPhase("SCRATCHING");
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch("/api/scratch/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet_credits: bet }),
      });
      if (!res.ok) {
        setError(((await res.json().catch(() => ({}))) as { message?: string }).message ?? "Error");
        return;
      }
      const d = await res.json();
      setSymbols(d.symbols);
      setWinLine(d.win_line?.length ? d.win_line : null);
      setWinMult(d.win_multiplier ?? 0);
      setPayout(d.payout_credits ?? 0);
      if (d.new_balance_credits != null) setBackendBalance(d.new_balance_credits);
      else fetchWallet();
      setRevealedCount(0); setAllRevealed(false);
      setPhase("SCRATCHING");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  const onTileRevealed = useCallback(() => {
    setRevealedCount((prev) => {
      const next = prev + 1;
      if (next >= 9) setAllRevealed(true);
      return next;
    });
  }, []);

  useEffect(() => {
    if (allRevealed && phase === "SCRATCHING") {
      setPhase("REVEALED");
      if (!isLoggedIn && winMult > 0) {
        const win = Math.floor(betRef.current * winMult);
        setPayout(win);
        localBalance.addWinnings(win);
      }
    }
  }, [allRevealed, phase, winMult, isLoggedIn, localBalance]);

  const reset = () => {
    setPhase("BETTING"); setSymbols([]); setWinLine(null); setWinMult(0);
    setRevealedCount(0); setAllRevealed(false); setPayout(0); setError(null);
  };

  const isWin = winMult > 0;

  return (
    <MobileShell flush>
      <div className="flex flex-col min-h-svh" style={{ background: "#050D07" }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-3 shrink-0">
          <Link href="/fast-games" className="p-1 text-text-muted hover:text-text-secondary transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 16L7 10L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <span className="text-text-muted text-[11px] uppercase tracking-[0.3em] font-bold">Scratch Loto</span>
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
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mx-4 mb-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-bold">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col px-4 pb-2 gap-4">

          {/* Betting phase: prize legend */}
          <AnimatePresence>
            {phase === "BETTING" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-center text-text-muted text-[10px] uppercase tracking-[0.25em] font-bold mb-3">
                    Match 3 → win
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {SYMBOLS.map((sym, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl"
                        style={{ background: `${sym.glow}`, border: `1px solid ${sym.color}20` }}>
                        <span className="font-black text-base leading-none" style={{ color: sym.color }}>{sym.label}</span>
                        <span className="text-[11px] font-black" style={{ color: sym.color }}>{sym.mult}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scratch grid */}
          <AnimatePresence>
            {(phase === "SCRATCHING" || phase === "REVEALED") && symbols.length === 9 && (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl p-3"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="grid grid-cols-3 gap-2.5">
                  {symbols.map((sym, i) => (
                    <ScratchTile
                      key={`${sym}-${i}-${phase}`}
                      symbol={sym}
                      winLine={winLine?.includes(i) ?? false}
                      onReveal={onTileRevealed}
                      allRevealed={allRevealed}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence>
            {phase === "REVEALED" && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="rounded-2xl p-5 text-center"
                style={
                  isWin
                    ? { background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.25)" }
                    : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }
                }
              >
                {isWin ? (
                  <>
                    <motion.div
                      initial={{ scale: 0.5 }} animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 16 }}
                      className="font-black text-3xl text-text-gold"
                    >
                      +{payout} credits
                    </motion.div>
                    <div className="text-text-gold/60 text-xs mt-1 uppercase tracking-[0.2em] font-bold">
                      {winMult}× win!
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-text-muted font-black text-xl">No match</div>
                    <div className="text-text-muted/50 text-xs mt-1">Better luck next time</div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="shrink-0 px-4 pb-8 pt-2 space-y-3">
          <AnimatePresence mode="wait">

            {phase === "BETTING" && (
              <motion.div key="betting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                {/* Bet picker */}
                <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-text-muted text-[10px] uppercase tracking-widest font-bold">Bet amount</span>
                    <span className="text-text-gold text-xs font-black">{betAmount} cr</span>
                  </div>
                  <div className="flex gap-2">
                    {BET_PRESETS.map((amt) => (
                      <button key={amt} onClick={() => setBetAmount(amt)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                          betAmount === amt
                            ? "text-brand-glow"
                            : "text-text-muted"
                        }`}
                        style={betAmount === amt
                          ? { background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.35)" }
                          : { background: "rgba(255,255,255,0.04)", border: "1px solid transparent" }
                        }
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>

                <motion.button
                  onClick={startScratch}
                  disabled={balance < betAmount || loading}
                  whileTap={{ scale: 0.97 }}
                  className="h-14 w-full rounded-xl font-black uppercase tracking-widest text-sm disabled:opacity-40 transition-all"
                  style={{
                    background: "linear-gradient(135deg, #16a34a, #15803d)",
                    boxShadow: "0 0 24px rgba(74,222,128,0.2)",
                    color: "#f0fdf4",
                  }}
                >
                  {loading ? "Loading…" : `Buy Card — ${betAmount} credits`}
                </motion.button>
              </motion.div>
            )}

            {phase === "SCRATCHING" && (
              <motion.div key="scratching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {/* Progress */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-text-muted text-xs font-bold">{revealedCount} / 9 tiles</span>
                  <button
                    onClick={() => { setAllRevealed(true); setRevealedCount(9); }}
                    className="text-text-secondary text-xs font-black uppercase tracking-wider underline underline-offset-2"
                  >
                    Reveal All
                  </button>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #16a34a, #4ade80)" }}
                    animate={{ width: `${(revealedCount / 9) * 100}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  />
                </div>
              </motion.div>
            )}

            {phase === "REVEALED" && (
              <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <button onClick={reset}
                  className="h-14 w-full rounded-xl font-black uppercase tracking-widest text-sm text-text-secondary active:scale-[0.97] transition-transform"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  New Card
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </MobileShell>
  );
}
